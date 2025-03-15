import { get } from "http";
import { IAdResult, IAuthResult, IInitParam, ILaunchParam, ILoginResult, ISdk, IShareResult } from "./ISdk";

export class LingGeSdk implements ISdk{
    getPlatform(): string {
        return "android";
    }
    init(initParam: IInitParam): void {

    }
    login(cb: (loginresult: ILoginResult) => void): void {

    }
    logout(): void {

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

}