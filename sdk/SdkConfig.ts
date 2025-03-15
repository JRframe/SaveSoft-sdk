import { BYTEDANCE, WECHAT } from "cc/env";
import { IInitParam } from "./ISdk";
import { sys } from "cc";
const WXSdkConfig = {
    exchangeCode : "123271680",
    exchangeUrl : "https://archive.gyyx.cn/api/login",
    shareTitle:"让我们一起双宿双飞",
    shareContent:"我好寂寞，你能陪我聊聊天吗？",
    shareUrl:"",
    shareQuery:"",
    adUnitId:"",
}

const TTSdkConfig = {
    exchangeCode : "123271680",
    exchangeUrl : "https://archive.gyyx.cn/api/login",
    shareTitle:"让我们一起双宿双飞",
    shareContent:"我好寂寞，你能陪我聊聊天吗？",
    shareUrl:"",
    shareQuery:"",
    adUnitId:"",
}

const FeiZhuConfig = {
    exchangeCode : "123271680",
    exchangeUrl : "https://archive.gyyx.cn/api/login",
    shareTitle:"让我们一起双宿双飞",
    shareContent:"我好寂寞，你能陪我聊聊天吗？",
    shareUrl:"",
    shareQuery:"",
    adUnitId:"",
}
export class SdkConfig{
    public static getConfig():IInitParam | null{
        if(WECHAT){
            return WXSdkConfig;
        }else if(BYTEDANCE){
            return TTSdkConfig;
        }else if(sys.os == sys.OS.ANDROID && sys.isNative){
            //目前原生只有飞猪
            return FeiZhuConfig;
        }

        return null;
    }
}