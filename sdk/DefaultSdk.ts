import { ESdkCode, ESdkType, IAdResult, IAuthResult, IInitParam, ILaunchParam, ILoginResult, ISdk, IShareResult } from "./ISdk";

export class DefaultSdk implements ISdk{
    getPlatform(): string {
        return "android";
    }
    init(initParam: IInitParam): void {
        console.log("DefaultSdk init");
    }
    login(cb: (loginresult: ILoginResult) => void): void {
        let loginR = {
            code: ESdkCode.Sdk_LoginSucess,
            err: "",
            token: "",
            sdkType: ESdkType.Default}
        cb(loginR);
    }
    logout(): void {

    }
    reqAuthInfo(cb: (authResult: IAuthResult) => void): void {
        let authR = {
            code: ESdkCode.Sdk_AuthSucess,
            err: "",
            nickName: "",
            avatarUrl: "",
            sdkType: ESdkType.Default
        }
        cb(authR);
    }
    share(cb: (shareResult: IShareResult) => void): void {
        let shareR = {
            code: ESdkCode.Sdk_ShareSucess,
            err: "",
            sdkType: ESdkType.Default
        }
        cb(shareR);
    }
    event(eventKey: string, eventParam: object | string): void {

    }
    showAd(adPlace: string, cb: (adResult: IAdResult) => void): void {
        let adR = {
            code: ESdkCode.Sdk_AdShowSuccess,
            err: "",
            sdkType: ESdkType.Default,
            placeId: adPlace
        }
        cb(adR);
    }
    onLoginEvent(loginResult: ILoginResult): void {

    }
    canShowSideBar(): Promise<boolean> {
        return Promise.resolve(true);;
    }
    showSideBar(): void {

    }
    getLaunchInfo(): ILaunchParam {
        return null!
    }
}