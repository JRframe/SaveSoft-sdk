
export enum ESdkCode{
    None = 0,
    Sdk_InitSuccess = 1001,
    Sdk_InitFail = 1002,
    Sdk_LoginSucess = 1003,
    Sdk_LoginFail = 1004,
    Sdk_ShareSucess = 1005,
    Sdk_ShareFail = 1006,
    Sdk_AuthSucess = 1007,
    Sdk_AuthFail = 1008,

    Sdk_AdInitSuccess = 2001,
    Sdk_AdInitFail = 2002,
    Sdk_AdShowSuccess = 2003,
    Sdk_AdShowFail = 2004,
}

export enum EAdType{
    None = 0,
    Reward = 1,
    Pop = 2,
    Banner = 3,
    Start = 4,
}

export enum ESdkType{
    None = 0,
    WeChat = 1,
    ByteDance = 2,
    LingGe = 3,
    FeiZhu = 4,
    Default = 1001  //非打包模式web测试
}

export interface ILoginResult {
    code: ESdkCode;
    err: string;
    token: string;
    sdkType: ESdkType;
}

export interface IShareResult{
    code: ESdkCode;
    err: string;
    sdkType: ESdkType;
}

export interface IAuthResult{
    code: ESdkCode;
    err: string;
    sdkType: ESdkType;
    nickName: string;
    avatarUrl: string;
}

export interface IAdResult{
    code:ESdkCode;
    err:string;
    sdkType: ESdkType;
    placeId:string;
}

export interface ISessionAck{
    data: ISessionInfo;
    result:string;
    state: string;
    trace_id: string;
}

export interface ISessionInfo{
    openid: string;
    token: string;
    ts: number;
}

export interface ISessionReq{
    game_id:string;
    code:string;
}

/**
 * 启动参数
 */
export interface ILaunchParam{
    query: object;
    scene:string;

}

export enum SdkEventDefine{
    activate = "activate",      //用户激活     
    register = "register",      //用户注册
    login = "login",            //用户登录
    logout = "logout",          //用户退出
    role = "role",              //用户创建角色
    pay = "pay",                //用户充值
    ad = "ad",                  //广告
    grade = "grade",            //等级接口
    task = "task",              //任务接口
    checkpoint = "checkpoint"   //关卡接口
}

/**
 * 初始化sdk时需要的参数
 */
export interface IInitParam{
    exchangeCode:string,
    exchangeUrl:string
}

export interface ISdk{
    init(initParam:IInitParam):void;
    login(cb:(loginresult : ILoginResult) => void):void;
    logout():void;
    reqAuthInfo(cb:(authResult: IAuthResult)=>void):void;
    share(cb:(shareResult:IShareResult)=>void):void;
    event(eventKey:string, eventParam:object|string):void;
    showAd(adPlace:string, cb:(adResult:IAdResult) => void):void;
    onLoginEvent(loginResult:ILoginResult):void;
    canShowSideBar(): Promise<boolean>;
    showSideBar():void;
    getLaunchInfo():ILaunchParam;
    getPlatform(): string;
}