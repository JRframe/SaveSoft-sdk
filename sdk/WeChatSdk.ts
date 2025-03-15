import { oops } from "db://oops-framework/core/Oops";
import { ESdkCode, ESdkType, IAdResult, IAuthResult, IInitParam, ILaunchParam, ILoginResult, ISdk, ISessionAck, IShareResult } from "./ISdk";
import 'minigame-api-typings';
import { SimpleHttp } from "../base/SimpleHttp";

export interface IWeChatInitParam extends IInitParam {
    shareTitle: string;
    shareContent: string;
    shareUrl: string;
    shareQuery: string;
    adUnitId: string;
}

export class WeChatSdk implements ISdk {
    getPlatform(): string {
        return wx.getDeviceInfo().platform;
    }

    private mCode: string = "";
    private mAnonymousCode: string = "";
    private mOpenId: string = "";

    mShareResult: IShareResult = null!;
    mLoginResult: ILoginResult = null!;
    mAdResult: IAdResult = null!;
    mAuthResult: IAuthResult = null!;
    mInitParam: IWeChatInitParam = null!;
    mLaunchParam: ILaunchParam = null!;

    private mLoginCB?: (loginResult: ILoginResult) => void | null;
    private mAdCB?: (adResult: IAdResult) => void | null;
    private mShareCB?: (shareResult: IShareResult) => void | null;

    private mRewardVideo: any;
    private mRewardVideoUnits: Map<string, any> = new Map<string, any>();

    private onAdCloselistener: Function = null!;
    private onAdErrorlistener: Function = null!;

    private mShareTime: number = 0;
    private mShareing: boolean = false; //

    init(initParam: IInitParam): void {
        this.resetData();

        this.mInitParam = initParam as IWeChatInitParam;

        this.mOpenId = oops.storage.get("login_token");
        this.initWXCallback();
    }
    login(cb: (loginresult: ILoginResult) => void): void {
        this.mLoginCB = cb;
        wx.login({
            success: (res) => {
                this.mCode = res.code;
                this.exchangeSession();
            },
            fail: (res) => {
                this.onLoginFailed();
            }
        })

    }
    logout(): void {
        this.resetData();
    }
    reqAuthInfo(cb: (authResult: IAuthResult) => void): void {
        throw new Error("Method not implemented.");
    }
    share(cb: (shareResult: IShareResult) => void): void {
        this.mShareing = true;
        this.mShareTime = new Date().getTime();
        wx.shareAppMessage({
            title: this.mInitParam.shareTitle,
            imageUrl: this.mInitParam.shareUrl,
            //query: this.mInitParam.shareQuery,
        })
    }

    event(eventKey: string, eventParam: object | string): void {
        //throw new Error("Method not implemented.");
    }
    showAd(adPlace: string, cb: (adResult: IAdResult) => void): void {
        //throw new Error("Method not implemented.");
        this.mAdCB = cb;
        let ad = this.getAdByUnit(adPlace);

        ad?.show().catch(() => {
            ad.load().then(() => {
                ad.show()
            }).catch(() => {
                this.onAdError("show ad failed")
            })
        });
    }
    onLoginEvent(loginResult: ILoginResult): void {
        //throw new Error("Method not implemented.");
    }
    canShowSideBar(): Promise<boolean> {
        return Promise.resolve(false);
    }
    showSideBar(): void {
        return;
    }
    getLaunchInfo(): ILaunchParam {

        if (!this.mLaunchParam) {
            this.refreshLauncherParam();
        }
        return this.mLaunchParam;
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

    private onLoginSuccess() {
        //this.initWXAd();

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

    private initMoreAdByUnit(unitId: string): any {
        let ad = wx.createRewardedVideoAd({
            adUnitId: unitId,
            multiton: true
        })
        ad.onClose(this.onAdClose.bind(this));
        ad.onError(this.onAdError.bind(this));
        ad.load();
        this.mRewardVideoUnits.set(unitId, ad);
        return ad;
    }

    private getAdByUnit(unitId: string) {
        let ad = this.mRewardVideoUnits.get(unitId);
        if (!ad) {
            ad = this.initMoreAdByUnit(unitId);
        }
        return ad;
    }

    private onAdClose(res: any) {

        if (res && res.isEnded || res === undefined) {
            this.mAdResult.code = ESdkCode.Sdk_AdShowSuccess;
            this.mAdResult.err = "";
        }
        else {
            this.mAdResult.code = ESdkCode.Sdk_AdShowFail;
            this.mAdResult.err = "ad not show ended";
        }

        this.mAdCB && this.mAdCB(this.mAdResult);
        this.mAdCB = undefined;
    }

    private onAdError(e: any) {
        this.mAdResult.code = ESdkCode.Sdk_AdShowFail;
        this.mAdResult.err = "ad not show ended";
        this.mAdCB && this.mAdCB(this.mAdResult);
        this.mAdCB = undefined;
    }

    private refreshLauncherParam() {
        let launcherOption = wx.getEnterOptionsSync() || {};

        if (this.mLaunchParam) {
            this.mLaunchParam.query = launcherOption.query || {};
            this.mLaunchParam.scene = "";
        }
    }

    private onShareCallback(bSuccess: boolean) {
        this.mShareResult.code = bSuccess ? ESdkCode.Sdk_ShareSucess : ESdkCode.Sdk_ShareFail;
        this.mShareResult.err = bSuccess ? "" : "分享失败";
        this.mShareResult.sdkType = ESdkType.WeChat;

        this.mShareCB && this.mShareCB(this.mShareResult);
    }

    private initWXCallback(): void {
        console.log("initWXCallback");
        wx.onShow(() => {
            if (this.mShareing) {
                //分享后返回
                let curTime = new Date().getTime();
                if (curTime - this.mShareTime >= 3000) {
                    //分享成功
                    console.log("分享成功");
                    self.mShareing = false;
                    self.mShareTime = curTime;
                    this.onShareCallback(true);

                } else {
                    console.log("分享失败");
                    this.onShareCallback(false);
                }
            }
            this.refreshLauncherParam();
        });

        wx.showShareMenu({
            withShareTicket: false,
            menus: ['shareAppMessage', 'shareTimeline'],
            success: (res) => {
            },
            fail: () => {
            }
        });


        wx.onShareAppMessage(() => {
            return {
                title: this.mInitParam.shareTitle,
                imageUrl: this.mInitParam.shareUrl,
            };
        });

        wx.onShareTimeline(() => {
            return {
                title: this.mInitParam.shareTitle,
                imageUrl: this.mInitParam.shareUrl,
            };
        });
    }

    private resetData() {
        this.mShareResult = {
            code: ESdkCode.Sdk_ShareFail,
            err: "",
            sdkType: ESdkType.WeChat
        };

        this.mLoginResult = {
            code: ESdkCode.Sdk_LoginFail,
            err: "",
            token: "",
            sdkType: ESdkType.WeChat
        };

        this.mAdResult = {
            code: ESdkCode.Sdk_AdShowFail,
            err: "",
            sdkType: ESdkType.WeChat,
            placeId: ""
        };
        this.mAuthResult = {
            code: ESdkCode.None,
            err: "",
            sdkType: ESdkType.WeChat,
            nickName: "",
            avatarUrl: ""
        };
        this.mInitParam = null!;

        this.mOpenId = "";
    }

}
