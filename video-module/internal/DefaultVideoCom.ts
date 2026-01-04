import { _decorator, Component, Node } from 'cc';
import { VideoCom } from '../VideoCom';
import { EVideoType, IVideoParam } from '../VideoEnum';
import { Sprite } from 'cc';
import { VideoPlayer } from 'cc';
import { SpriteFrame } from 'cc';
import { screen } from 'cc';
import { UITransform } from 'cc';
import { Vec3 } from 'cc';
import { view } from 'cc';
import { oops } from '../../../../../extensions/oops-plugin-framework/assets/core/Oops';
import { VideoClip } from 'cc';
import { UIMainVideoComp } from '../../../game/UIMainVideo/UIMainVideoComp';
const { ccclass, property } = _decorator;

@ccclass('DefaultVideoCom')
export class DefaultVideoCom extends VideoCom {

    @property(Sprite)
    videoSprite: Sprite = null!;

    mVideoPlayer:VideoPlayer = null!
    protected onLoad(): void {
        this.mVideoPlayer = this.getComponent(VideoPlayer)!;
        this.videoSprite.node.active = false;

        this.mVideoPlayer.node.on(VideoPlayer.EventType.READY_TO_PLAY, this.onReadyToPlay, this);
        this.mVideoPlayer.node.on(VideoPlayer.EventType.STOPPED, this.onStopped, this);
        this.mVideoPlayer.node.on(VideoPlayer.EventType.COMPLETED, this.onCompleted, this);
        this.mVideoPlayer.node.on(VideoPlayer.EventType.PLAYING, this.onPlaying, this);

        const VideoWidth = oops.gui.root.w;
        const VideoHeight = oops.gui.root.h;

        const width = 1080;
        const height = 1920;

        this.videoSprite.node.scale_x = VideoWidth / width;
        this.videoSprite.node.scale_y = VideoHeight / height;
        const uiTransform = this.videoSprite.getComponent(UITransform)!;
        uiTransform.width = width;
        uiTransform.height = height;
    }

    play(param: IVideoParam): void {
        super.play(param);

        this.videoSprite.node.active = false;
        let poster = param.poster ? param.poster : null;
        if(param.poster === "" || param.poster === null || param.poster === undefined){

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
        this.mPosterWidgetHigh = true;
        //this.fixPosterSprite();

        this.mVideoPlayer.fullScreenOnAwake = true;
        this.mVideoPlayer.resourceType = param.resourceType == EVideoType.Remote ? VideoPlayer.ResourceType.REMOTE : VideoPlayer.ResourceType.LOCAL;
        if(param.resourceType == EVideoType.Local){

            this.loadAsync("InnerVideo", param.src, VideoClip).then((clip)=>{
                this.mVideoPlayer.clip = clip;
            })
        }
        else{
            this.mVideoPlayer.remoteURL = param.src;
        }

        this.mVideoPlayer.loop = param.loop;
        
    }

    onReadyToPlay(){

        console.log("[video] DefaultVideoCom 准备好播放了");
        const VideoWidth = oops.gui.root.w;
        const VideoHeight = oops.gui.root.h;
        super.onReadyToPlay();
        this.videoSprite.node.active = false;
        
        this.mVideoPlayer.play();
        //let scaleRate = height / VideoHeight;
        //this.videoSprite.node.scale = new Vec3(scaleRate,scaleRate,scaleRate);
    }

    onPlaying(){
        console.log("[video] DefaultVideoCom 开始播放了");
        UIMainVideoComp.getInstance().onVideoPlayStart(this.mParam);
    }

    onStopped(): void {
        super.onStopped();
    }

    onCompleted(): void {
        super.onCompleted();
        this.mVideoPlayer.stop();
    }

    stop(): void {
        super.stop();
        this.mVideoPlayer.stop();
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


    start() {

    }

    update(deltaTime: number) {
        
    }

    fixPosterSprite(){
        if(this.mPosterWidgetHigh){
            const ws = screen.windowSize;
            console.log("windowSize ==== " + ws.width + " " + ws.height);
            let atio = ws.height / ws.width;
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
}


