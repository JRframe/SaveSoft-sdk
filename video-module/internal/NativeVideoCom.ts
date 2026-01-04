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
            // 同步设置VideoPlayer的remoteURL，确保视频源一致
            this.mVideoPlayer.remoteURL = param.src;
            this.mediaVideo.tryInitializeRemote(param.src);
        }
        this.mediaVideo.loop = param.loop;
    }

    onEventHandler(event: EventHandler, eventType: EventType){
        console.log(`[video] NativeVideoCom onEventHandle, eventType:${getEventName(eventType)}. 透明度:${this.uiOpacity.opacity}`);
        switch(eventType){
            case EventType.PREPARING:
                console.log('[video] 视频准备中...');
                break;
            case EventType.LOADED:
                console.log('[video] 视频已加载，开始播放');
                if (this.uiOpacity.opacity == 0) {
                    this.uiOpacity.opacity = 255;
                    UIMainVideoComp.getInstance().fadeinVideo();
                }
                this.mediaVideo.play();
                break;
            case EventType.STOPPED:
                console.log('[video] 视频已停止');
                this.uiOpacity.opacity = 0;
                this.onStopped();
                break;
            case EventType.PLAYING:
                console.log('[video] 视频正在播放');
                if (this.uiOpacity.opacity == 0) {
                    this.uiOpacity.opacity = 255;
                    UIMainVideoComp.getInstance().fadeinVideo();
                }
                break;
            case EventType.ERROR:
                console.log('[video] 视频播放出错');
                this.uiOpacity.opacity = 0;
                break;
            case EventType.COMPLETED:
                console.log('[video] 视频播放完成');
                this.uiOpacity.opacity = 0;
                UIMainVideoComp.getInstance().fadeoutVideo();
                UIMainVideoComp.getInstance().Close();
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
        console.log('[video] NativeVideoCom onDestroy 开始清理视频资源');
        
        // 停止视频播放
        if (this.mediaVideo) {
            this.mediaVideo.stop();
            // 完全清理视频资源
            this.mediaVideo.dispose();
        }
        
        console.log('[video] NativeVideoCom onDestroy 完成');
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