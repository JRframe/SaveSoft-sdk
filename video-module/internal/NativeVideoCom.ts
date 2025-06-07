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
const { ccclass, property } = _decorator;

@ccclass('NativeVideoCom')
export class NativeVideoCom extends VideoCom {
    @property(Sprite)
    videoSprite: Sprite = null!;

    mVideoPlayer:VideoPlayer = null!
    protected onLoad(): void {
        this.mVideoPlayer = this.getComponent(VideoPlayer)!;
        this.videoSprite.node.active = false;

        this.mVideoPlayer.node.on(VideoPlayer.EventType.READY_TO_PLAY, this.onReadyToPlay, this);
        this.mVideoPlayer.node.on(VideoPlayer.EventType.STOPPED, this.onStopped, this);
        this.mVideoPlayer.node.on(VideoPlayer.EventType.COMPLETED, this.onCompleted, this);

        this.mPosterWidgetHigh = true;
        this.fixPosterSprite();
    }

    play(param: IVideoParam): void {
        super.play(param);

        this.videoSprite.node.active = false;
        let poster = param.poster ? param.poster : null;
        if(param.poster === "" || param.poster === null || param.poster === undefined){
            console.log(`[video] 播放视频, 没有海报, poster: ${param.poster}`);
            this.videoSprite.node.active = false;
        }
        else{
            this.videoSprite.node.active = false;
            this.loadAsync(param.posterBundle, param.poster + "/spriteFrame", SpriteFrame).then((spriteFrame)=>{
                if(this.isValid && !this.mIsPlaying){
                    this.videoSprite.node.active = true;
                    this.videoSprite.spriteFrame = spriteFrame;
                }
            });
        }


        this.mVideoPlayer.fullScreenOnAwake = true;
        this.mVideoPlayer.resourceType = param.resourceType == EVideoType.Remote ? VideoPlayer.ResourceType.REMOTE : VideoPlayer.ResourceType.LOCAL;
        // this.mVideoPlayer.resourceType = VideoPlayer.ResourceType.REMOTE;
        if(param.resourceType == EVideoType.Local){

            console.log(`[video] 播放本地视频, src: ${param.src}`);
            this.loadAsync("InnerVideo", param.src, VideoClip).then((clip)=>{
                this.mVideoPlayer.clip = clip;
            })
        }
        else{
            console.log(`[video] 播放远程视频, src: ${param.src}`);
            this.mVideoPlayer.remoteURL = param.src;
        }
        this.mVideoPlayer.loop = param.loop;
        this.mVideoPlayer

        
    }

    onReadyToPlay(){

        console.log("[video] NativeVideoCom 准备好播放了");
        const VideoWidth = 1080;
        const VideoHeight = 1920;
        super.onReadyToPlay();

        this.videoSprite.node.active = false;

        const width = screen.windowSize.width;
        const height = screen.windowSize.height;
        const uiTransform = this.videoSprite.getComponent(UITransform)!;
        uiTransform.width = VideoWidth;
        uiTransform.height = VideoHeight;
        this.videoSprite.node.position = Vec3.ZERO;
        this.mVideoPlayer.play();
        let scaleRate = height / VideoHeight;
        //this.videoSprite.node.scale = new Vec3(scaleRate,scaleRate,scaleRate);
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
        if(this.mPosterWidgetHigh){
            const screenW = oops.gui.root.w;
            const screenH = oops.gui.root.h;

            console.log("windowSize ==== " + screenW + " " + screenH);
            let atio = screenH / screenW;
            let scale = Math.abs(atio - 16/9) + 1;
            console.log("scale ==== " + scale);
            this.videoSprite.node.scale = new Vec3(scale, scale, scale);
        }
        else{
            this.videoSprite.node.scale = Vec3.ONE;
        }
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


