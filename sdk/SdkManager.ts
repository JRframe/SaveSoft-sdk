import { director } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { IAdResult, IInitParam, ILaunchParam, ILoginResult, ISdk, IShareResult } from './ISdk';
import { BYTEDANCE, DEBUG, WECHAT } from 'cc/env';
import { ByteDanceSdk } from './ByteDanceSdk';
import { LingGeSdk } from './LingeGeSdk';
import { DefaultSdk } from './DefaultSdk';
import { WeChatSdk } from './WeChatSdk';
import { SdkConfig } from './SdkConfig';
import { ADEnum, GameDot } from '../../game/gameplay/Manager/GameDot';
import ConfigManager from '../../game/manager/Config/ConfigManager';
import { FeiZhuSdk } from './FeiZhuSdk';
import { sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SdkManager')
export class SdkManager extends Component {
    private static _inst: SdkManager;
    public static get inst(): SdkManager {


        if (this._inst == null) {
            this._inst = SdkManager.createMgr();
        }
        return this._inst;
    }

    private static createMgr():SdkManager{
        let sdkMgr = new Node();
        sdkMgr.name = '__sdkMgr__';
        director.getScene()?.addChild(sdkMgr);
        director.addPersistRootNode(sdkMgr);
        return sdkMgr.addComponent(SdkManager);
    }

    private mSdk:ISdk = null!;
    private mEventSDK: ISdk = null!;

    protected onLoad(): void {
        //先支持字节，后续再整合到sdk列表
        console.log("初始化sdk");
        if(BYTEDANCE){
            this.createTTSdk();
        }
        else if(WECHAT){
            this.createWeChatSdk();
        }
        else if(sys.os == sys.OS.ANDROID && sys.isNative)
        {
            const forceDefaultSdk = true;
            if (DEBUG && forceDefaultSdk) {
                console.log("ANDROID Native，Debug模式，强制创建默认sdk");
                this.createDefaultSdk();
            } else {
                console.log("ANDROID Native，创建飞猪sdk");
                this.createFeiZhuSdk();
            }
        }
        else
        {
            this.createDefaultSdk()
        }
        
        this.createLingGeSdk();
    }

    public async init(){
        let param = SdkConfig.getConfig();
        await this.mSdk?.init(param as IInitParam);
    }


    public login(cb: (loginresult: ILoginResult) => void): void {
        this.mSdk?.login(cb);
    }

    public logout(): void {
        this.mSdk?.logout();
    }

    public share(cb: (shareResult: IShareResult) => void): void {
        this.mSdk?.share(cb);
    }

    public showAd(adId:string, cb: (adResult: IAdResult) => void): void {
        this.mSdk?.showAd(adId, cb);
    }

    public event(key:string, param: object | string){
        console.log(`[sdk] event, key: ${key}`);
        //this.mEventSDK?.event(key, param);
        GameDot.Instance.Dot(param);
    }

    async canShowSideBar(): Promise<boolean> {
        return await this.mSdk?.canShowSideBar();
    }
    
    async showSideBar(){
        this.mSdk?.showSideBar();
    }

    getLaunchInfo():ILaunchParam{
        return this.mSdk?.getLaunchInfo();
    }

    private createTTSdk(){
        console.log("创建抖音sdk");
        this.mSdk = new ByteDanceSdk() as ISdk;
        //先写在这里 后续有时间进行整理
    }

    private createWeChatSdk(){
        console.log("创建微信sdk");
        this.mSdk = new WeChatSdk() as ISdk;
    }

    private createLingGeSdk(){
        console.log("创建灵歌sdk");
        this.mEventSDK = new LingGeSdk() as ISdk;
    }

    private createDefaultSdk(){
        this.mSdk = new DefaultSdk() as ISdk;
    }

    private createFeiZhuSdk(){
        console.log("创建飞猪sdk");
        this.mSdk = new FeiZhuSdk as ISdk;
    }

    getPlatform(): string {
        return this.mSdk?.getPlatform();
    }
}


