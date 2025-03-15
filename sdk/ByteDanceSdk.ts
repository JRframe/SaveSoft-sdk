import { oops } from "db://oops-framework/core/Oops";
import { ESdkCode, ESdkType, IAdResult, IAuthResult, IInitParam, ILaunchParam, ILoginResult, ISdk, ISessionAck, IShareResult } from "./ISdk";
import { SimpleHttp } from "../base/SimpleHttp";

export interface IByteDanceInitParam extends IInitParam{
    shareTitle:string;
    shareContent:string;
    shareUrl:string;
    shareQuery:string;
    adUnitId:string;
}

export class ByteDanceSdk implements ISdk{
    getPlatform(): string {
        return "android";
    }
    private mCode:string = "";
    private mAnonymousCode:string = "";
    private mOpenId:string = "";

    mShareResult:IShareResult = null!;
    mLoginResult:ILoginResult = null!;
    mAdResult:IAdResult = null!;
    mAuthResult:IAuthResult = null!;
    mInitParam:IByteDanceInitParam = null!;
    mLaunchParam:ILaunchParam = null!;

    private mLoginCB?:(loginResult: ILoginResult) => void | null;
    private mAdCB?:(adResult:IAdResult) => void | null;

    private mRewardVideo: any;

    private onAdCloselistener: Function | null = null;

    init(initParam: IInitParam): void {
        this.onAdCloselistener = this.onAdClose.bind(this);
        this.resetData();

        this.mInitParam = initParam as IByteDanceInitParam;
        this.mOpenId = oops.storage.get("login_token");

        globalThis.tt.onShow((res:any) => {
            let startScene = "";
            if(res.launch_from == 'homepage' && res.location == 'sidebar_card'){
                startScene = "sidebar";
            }
            console.log("启动参数launch_from: ", res.launch_from, " location: ", res.location, " scene: ", startScene);
            this.mLaunchParam = {
                scene: startScene,
                query: res.query
            }
        });
    }
    login(cb: (loginresult: ILoginResult) => void): void {
        this.mLoginCB = cb;
        if(true){
            this.onLoginSuccess();
            return;
        }
        globalThis.tt.checkSession({
          success:()=> {
            console.log(`session 未过期`);
            if(this.mOpenId == null || this.mOpenId == ""){
                //请求登录
                this.innerLogin();
            }
            else{
                this.onLoginSuccess();
            }
          },

          fail:()=> {
            console.log(`session 已过期，需要重新登录`);
            this.innerLogin();
          },
        });
    }
    logout(): void {
        this.resetData();
    }
    reqAuthInfo(cb?: (authResult: IAuthResult) => void): void {
        globalThis.tt.getUserInfo({
            success:(res:any)=> {
                console.log("getUserProfile 调用成功：", res.userInfo);
                this.mAuthResult.code = ESdkCode.Sdk_AuthSucess;
                this.mAuthResult.err = "";
                this.mAuthResult.nickName = res.userInfo.nickName;
                this.mAuthResult.avatarUrl = res.userInfo.avatarUrl;
                cb?.(this.mAuthResult);
            },
            fail:(res:any)=> {
                console.log("getUserProfile 调用失败", res);
                this.mAuthResult.code = ESdkCode.Sdk_AuthFail;
                this.mAuthResult.err = res.errMsg;
                cb?.(this.mAuthResult);
            },
        });
    }
    share(cb?: (shareResult: IShareResult) => void): void {
        globalThis.tt.shareAppMessage({
            title: this.mInitParam.shareTitle,
            desc: this.mInitParam.shareContent,
            imageUrl: this.mInitParam.shareUrl,
            query: this.mInitParam.shareQuery,
            success:()=> {
              console.log("分享成功");
              this.mShareResult.code = ESdkCode.Sdk_ShareSucess;
              this.mShareResult.err = "";
              cb?.(this.mShareResult);
            },
            fail:(e) =>{
              console.log("分享失败");
              this.mShareResult.code = ESdkCode.Sdk_ShareFail;
              this.mShareResult.err = e.errMsg;
              cb?.(this.mShareResult);
            },
          });
    }

    event(eventKey: string, eventParam: object | string): void {
        if (typeof eventParam === 'object') {
            // function body for object
        } else {
            // function body for string
        }
    }

    showAd(adPlace: string, cb: (adResult: IAdResult) => void): void {
        this.mAdCB = cb;
        this.mRewardVideo?.show();
    }

    getLaunchInfo(): ILaunchParam {
        return this.mLaunchParam;
    }

    onLoginEvent(loginResult: ILoginResult): void {

    }

    async canShowSideBar(): Promise<boolean> {
        try {
            const res:any = await new Promise((resolve, reject) => {
                globalThis.tt.checkScene({
                    scene: "sidebar",
                    success: resolve,
                    fail: reject
                });
            });
            console.log("check scene success: ", res.isExist);
            return res?.isExist === true;
        } catch (res:any) {
            console.log("check scene fail:", res);
            return false;
        }
    }

    showSideBar(): void {
        globalThis.tt.navigateToScene({
            scene: "sidebar",
            success: (res:any) => {
                console.log("navigate to scene success");
                // 跳转成功回调逻辑
            },
            fail: (res:any) => {
                console.log("navigate to scene fail: ", res);
                // 跳转失败回调逻辑
            },
        });
    }

    private innerLogin(){
        globalThis.tt.login({
            force: true,
            success:(res:any)=> {
              console.log(`login 调用成功${res.code} ${res.anonymousCode}`);
              this.mCode = res.code;
              this.mAnonymousCode = res.anonymousCode;
              this.exchangeSession();
            },
            fail:(res:any)=> {
                console.log(`login 调用失败`);
                this.onLoginFailed();
            },
          });
    }

    /**
     *      game_id:string;
            code:string;
     */
    private async exchangeSession(){
        const sessionAck = await SimpleHttp.instance.postDataWithTimeout<ISessionAck>(this.mInitParam.exchangeUrl, {
            game_id: this.mInitParam.exchangeCode,
            code: this.mCode
        })

        if(sessionAck?.result === "success"){
            this.mOpenId = sessionAck.data.openid;
            oops.storage.set("login_token", this.mOpenId);
            this.onLoginSuccess();
        }
        else{
            this.onLoginFailed();
        }
    }

    private onLoginSuccess(){
        /**
         * 登录后初始化广告组件
         */
        if(this.mRewardVideo == null || this.mRewardVideo == undefined){
            this.mRewardVideo = globalThis.tt.createRewardedVideoAd({
                adUnitId: this.mInitParam.adUnitId,
                multiton: false,
                progressTip: false,
            });

            this.mRewardVideo.load();
            this.mRewardVideo.onClose(this.onAdCloselistener);
        }

        this.mLoginResult.code = ESdkCode.Sdk_LoginSucess;
        this.mLoginResult.token = this.mOpenId;
        this.mLoginCB && this.mLoginCB(this.mLoginResult);
        this.mLoginCB = undefined;
    }

    private onLoginFailed(){
        this.mLoginResult.code = ESdkCode.Sdk_LoginFail;
        this.mLoginCB && this.mLoginCB(this.mLoginResult);
        this.mLoginCB = undefined;
    }

    private onAdClose(res:any){
        if(res.isEnded){
            this.mAdResult.code = ESdkCode.Sdk_AdShowSuccess;
            this.mAdResult.err = "";
            this.mAdCB && this.mAdCB(this.mAdResult);
            this.mAdCB = undefined;
        }else{
            this.mAdResult.code = ESdkCode.Sdk_AdShowFail;
            this.mAdResult.err = "ad not show ended";
            this.mAdCB && this.mAdCB(this.mAdResult);
            this.mAdCB = undefined;
        }
    }
    
    private resetData(){
        this.mShareResult = {
            code: ESdkCode.Sdk_ShareFail,
            err: "",
            sdkType: ESdkType.ByteDance
            };

        this.mLoginResult = {
            code: ESdkCode.Sdk_LoginFail,
            err: "",
            token: "",
            sdkType: ESdkType.ByteDance};

        this.mAdResult = {
            code: ESdkCode.Sdk_AdShowFail,
            err: "",
            sdkType: ESdkType.ByteDance,
            placeId: ""
        };
        this.mAuthResult = {
            code: ESdkCode.None,
            err: "",
            sdkType: ESdkType.ByteDance,
            nickName: "",
            avatarUrl: ""
        };
        this.mInitParam = null!;

        this.mOpenId = "";
    }
}