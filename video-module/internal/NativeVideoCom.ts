import { _decorator, Component, Node } from 'cc';
import { VideoCom } from '../VideoCom';
import { Sprite } from 'cc';
import { VideoPlayer } from 'cc';
import { EVideoType, IVideoParam } from '../VideoEnum';
import { SpriteFrame } from 'cc';
import { screen } from 'cc';
import { UITransform } from 'cc';
import { Vec3 } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { VideoClip } from 'cc';
import { EventType, getEventName, MediaVideo } from '../../mediaVideo/mediaVideo';
import { UIMainVideoComp } from '../../../game/UIMainVideo/UIMainVideoComp';
import { EventHandler } from 'cc';
import { UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NativeVideoCom')
export class NativeVideoCom extends VideoCom {


    @property(VideoPlayer)
    mVideoPlayer:VideoPlayer = null!

    @property(MediaVideo)
    mediaVideo: MediaVideo = null!;

    @property(UIOpacity)
    uiOpacity: UIOpacity = null!;

    @property(UITransform)
    videoTransform: UITransform = null!

    @property(Boolean)
    isInited: boolean = false;

    protected onLoad(): void {
        this.mPosterWidgetHigh = true;
        this.fixPosterSprite();
    }

    play(param: IVideoParam): void {
        super.play(param);
        this.tryInit();

        let poster = param.poster ? param.poster : null;
        this.mVideoPlayer.fullScreenOnAwake = true;
        // this.mVideoPlayer.stayOnBottom = true;
        this.mVideoPlayer.resourceType = param.resourceType == EVideoType.Remote ? VideoPlayer.ResourceType.REMOTE : VideoPlayer.ResourceType.LOCAL;
        if(param.resourceType == EVideoType.Local){

            console.log(`[video] 播放本地视频, src: ${param.src}`);
            this.loadAsync("InnerVideo", param.src, VideoClip).then((clip)=>{
                this.mVideoPlayer.clip = clip;
            })
        }
        else{
            console.log(`[video] 播放远程视频, src: ${param.src}`);
            this.mediaVideo.tryInitializeRemote(param.src);
            this.mediaVideo.setRemoteSource(param.src);
        }
        this.mediaVideo.loop = param.loop;
    }

    onEventHandler(event: EventHandler, eventType: EventType){
        console.log(`[video] NativeVideoCom onEventHandle, eventType:${getEventName(eventType)}. 透明度:${this.uiOpacity.opacity}`);
        switch(eventType){
            case EventType.PREPARING:
                break;
            case EventType.LOADED:
                if (this.uiOpacity.opacity == 0) {
                    this.uiOpacity.opacity = 255;
                    UIMainVideoComp.getInstance().fadeinVideo();
                }
                this.mediaVideo.play();
                break;
            case EventType.STOPPED:
                this.uiOpacity.opacity = 0;
                this.onStopped();
                break;
            case EventType.PLAYING:
                break;
        }
    }

    tryInit(){
        if(this.isInited) return;
        console.log(`[video]画布宽度: ${cc.winSize.width}, 画布高度: ${cc.winSize.height}`);
        this.videoTransform.width = cc.winSize.width;
        this.videoTransform.height = cc.winSize.height;
        this.mediaVideo.node.active = true;
        this.mVideoPlayer.node.active = true;
        this.isInited = true;
    }

    stop(){
        super.stop();
        this.mediaVideo.stop();
        this.onStopped();
    }

    onStopped(): void {
        super.onStopped();
    }

    onCompleted(): void {
        super.onCompleted();
    }


    start() {

    }

    update(deltaTime: number) {
        
    }

    fixPosterSprite(){
        // if(this.mPosterWidgetHigh){
        //     const screenW = oops.gui.root.w;
        //     const screenH = oops.gui.root.h;

        //     console.log("windowSize ==== " + screenW + " " + screenH);
        //     let atio = screenH / screenW;
        //     let scale = Math.abs(atio - 16/9) + 1;
        //     console.log("scale ==== " + scale);
        //     this.videoSprite.node.scale = new Vec3(scale, scale, scale);
        // }
        // else{
        //     this.videoSprite.node.scale = Vec3.ONE;
        // }
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    seek(time: number): void {
        this.mediaVideo.seek(time);
    }
    
    getDuration(): number{
        return this.mediaVideo.duration;
    }

    getCurrentTime(): number{
        return this.mediaVideo.currentTime;
    }
}