import { get } from "http";
import { ESdkCode, ESdkType, IAdResult, IAuthResult, IInitParam, ILaunchParam, ILoginResult, ISdk, ISessionAck, IShareResult } from "./ISdk";
import { sys } from "cc";
import { native } from "cc";
import { SimpleHttp } from "../base/SimpleHttp";
import { oops } from "db://oops-framework/core/Oops";

export interface IFeiZhuInitParam extends IInitParam {
    shareTitle: string;
    shareContent: string;
    shareUrl: string;
    shareQuery: string;
    adUnitId: string;
}

export class FeiZhuSdk implements ISdk{
    getPlatform(): string {
        return "android";
    }

    private mCode: string = "";
    private mAnonymousCode: string = "";
    private mOpenId: string = "";

    mShareResult: IShareResult = null!;
    mLoginResult: ILoginResult = null!;
    mAdResult: IAdResult = null!;
    mAuthResult: IAuthResult = null!;
    mLaunchParam: ILaunchParam = null!;
    mInitParam: IFeiZhuInitParam = null!;

    private mLoginCB?: (loginResult: ILoginResult) => void | null;
    private mAdCB?: (adResult: IAdResult) => void | null;
    private mShareCB?: (shareResult: IShareResult) => void | null;

    init(initParam: IInitParam): void {

        this.resetData();
        this.mInitParam = initParam as IFeiZhuInitParam;
        if(sys.os == sys.OS.ANDROID && sys.isNative){
            native.bridge.onNative = (arg0:string, arg1: string | undefined | null):void=>{
                if(arg0 == 'onLoginSuccess'){
                    console.log("飞猪登录成功" + arg1);
                    this.mCode = arg1!;
                    //TODO 
                    this.exchangeSession();
                }
                else if(arg0 == 'onLoginFail'){
                    console.log("飞猪登录失败");
                    this.onLoginFailed();
                }
                else if(arg0 == 'onLoginCanncel'){
                    console.log("飞猪登录取消");
                    this.onLoginFailed();
                }
                else if(arg0 == 'onLogoutCancel'){
                    console.log("飞猪退出取消");
                }else if(arg0 == 'onLogoutSuccess'){
                    console.log("飞猪退出成功");
                }
                else if(arg0 == 'onLogoutFail'){
                    console.log("飞猪退出失败");
                }
                else if(arg0 == 'onDeviceID'){
                    console.log("device_id");
                    oops.storage.set("device_id", arg1);
                }
                return;
            }
        }
    }

    login(cb: (loginresult: ILoginResult) => void): void {
        this.mLoginCB = cb;

        native.bridge.sendToNative('GyLogin');
    }
    logout(): void {
        native.bridge.sendToNative('GyLogout');
    }

    private async exchangeSession() {
        const sessionAck = await SimpleHttp.instance.postDataWithTimeout<ISessionAck>(this.mInitParam.exchangeUrl, {
            game_id: this.mInitParam.exchangeCode,
            code: this.mCode
        })

        if (sessionAck?.result === "success") {
            this.mOpenId = sessionAck.data.openid;
            oops.storage.set("login_token", this.mOpenId);
            oops.storage.set("user_token", sessionAck.data.token);
            this.onLoginSuccess();
        }
        else {
            this.onLoginFailed();
        }
    }

    reqAuthInfo(cb: (authResult: IAuthResult) => void): void {

    }
    share(cb: (shareResult: IShareResult) => void): void {

    }
    event(eventKey: string, eventParam: object | string): void {

    }
    showAd(adPlace: string, cb: (adResult: IAdResult) => void): void {

    }
    onLoginEvent(loginResult: ILoginResult): void {

    }
    canShowSideBar(): Promise<boolean> {
        return Promise.resolve(false);
    }
    showSideBar(): void {

    }
    getLaunchInfo(): ILaunchParam {
        return null!
    }

    
    private onLoginSuccess() {
        this.mLoginResult.code = ESdkCode.Sdk_LoginSucess;
        this.mLoginResult.token = this.mOpenId;
        this.mLoginCB && this.mLoginCB(this.mLoginResult);
        this.mLoginCB = undefined;
    }

    private onLoginFailed() {
        this.mLoginResult.code = ESdkCode.Sdk_LoginFail;
        this.mLoginResult.token = "";
        this.mLoginCB && this.mLoginCB(this.mLoginResult);
        this.mLoginCB = undefined;
    }

    private resetData() {
            this.mShareResult = {
                code: ESdkCode.Sdk_ShareFail,
                err: "",
                sdkType: ESdkType.FeiZhu
            };
    
            this.mLoginResult = {
                code: ESdkCode.Sdk_LoginFail,
                err: "",
                token: "",
                sdkType: ESdkType.FeiZhu
            };
    
            this.mAdResult = {
                code: ESdkCode.Sdk_AdShowFail,
                err: "",
                sdkType: ESdkType.FeiZhu,
                placeId: ""
            };
            this.mAuthResult = {
                code: ESdkCode.None,
                err: "",
                sdkType: ESdkType.FeiZhu,
                nickName: "",
                avatarUrl: ""
            };
    
            this.mOpenId = "";
        }
    

}