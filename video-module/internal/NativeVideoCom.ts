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
import { MediaVideo } from '../../mediaVideo/mediaVideo';
import { UIMainVideoComp } from '../../../game/UIMainVideo/UIMainVideoComp';
import { EventHandler } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NativeVideoCom')
export class NativeVideoCom extends VideoCom {


    @property(VideoPlayer)
    mVideoPlayer:VideoPlayer = null!

    @property(MediaVideo)
    mediaVideo: MediaVideo = null!;

    protected onLoad(): void {


        // this.mVideoPlayer.node.on(VideoPlayer.EventType.READY_TO_PLAY, this.onReadyToPlay, this);
        // this.mVideoPlayer.node.on(VideoPlayer.EventType.STOPPED, this.onStopped, this);
        // this.mVideoPlayer.node.on(VideoPlayer.EventType.COMPLETED, this.onCompleted, this);

        this.mPosterWidgetHigh = true;
        this.fixPosterSprite();
    }

    play(param: IVideoParam): void {
        super.play(param);

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
        UIMainVideoComp.getInstance().fadeinVideo();
    }

    onReady(event: EventHandler){

        console.log("[video] NativeVideoCom 准备好播放了");
        this.mediaVideo.play();

        // const VideoWidth = 1080;
        // const VideoHeight = 1920;
        // super.onReadyToPlay();
        // const width = screen.windowSize.width;
        // const height = screen.windowSize.height;
        // // this.mediaVideo.play();
        // this.mVideoPlayer.play();
        // let scaleRate = height / VideoHeight;
        // //this.videoSprite.node.scale = new Vec3(scaleRate,scaleRate,scaleRate);
    }

    stop(){
        super.stop();
        this.mVideoPlayer.stop();
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
        this.mVideoPlayer.node.off(VideoPlayer.EventType.READY_TO_PLAY, this.onReadyToPlay, this);
        this.mVideoPlayer.node.off(VideoPlayer.EventType.STOPPED, this.onStopped, this);
        this.mVideoPlayer.node.off(VideoPlayer.EventType.COMPLETED, this.onCompleted, this);
        super.onDestroy();
    }

    seek(time: number): void {
        this.mVideoPlayer.currentTime = time;
    }
    
    getDuration(): number{
        return this.mVideoPlayer.duration;
    }

    getCurrentTime(): number{
        return this.mVideoPlayer.currentTime;
    }

}


