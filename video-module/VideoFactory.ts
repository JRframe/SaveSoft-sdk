import { BYTEDANCE, WECHAT } from "cc/env";
import { Global } from "../base/Global";
import { IVideo } from "./internal/IVideo";
import { Node } from "cc";
import { ViewUtil } from "db://oops-framework/core/utils/ViewUtil";
import { sys } from "cc";
export class VideoFactory{
    public static instance: VideoFactory = null!;
    constructor(){
        
    }

    public static getInstance(): VideoFactory {
        if (this.instance == null) {
            this.instance = new VideoFactory();
        }
        return this.instance;
    }

    createVideo(): Node{
        if(BYTEDANCE)
        {
            return ViewUtil.createPrefabNode("common/video/TTVideo", "resources");
        }
        else if(WECHAT)
        {
            return ViewUtil.createPrefabNode("common/video/WeChatVideo", "resources");
        }
        else if(CC_EDITOR || sys.isNative)
        {
            console.log("sys.platform = " + sys.platform);
            return ViewUtil.createPrefabNode("common/video/NativeVideo", "resources");
        }
        else
        {
            console.log("sys.platform = " + sys.platform);
            return ViewUtil.createPrefabNode("common/video/DefaultVideo", "resources");
        }
    }
}


