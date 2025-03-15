import { Sprite } from "cc";
import { VideoCom } from "../VideoCom"
import { _decorator, Component, Node } from 'cc';
import { IVideoParam } from "../VideoEnum";
import { SpriteFrame } from "cc";
import { view } from "cc";
import { screen } from "cc";
import { Vec3 } from "cc";

const { ccclass, property } = _decorator;
@ccclass('WechatVideoCom')
export class WechatVideoCom extends VideoCom{
    @property(Sprite)
    videoSprite: Sprite = null!;

    mWXVideo: any = null;

    private onReadyToPlayFunc: Function = null!;
    private onStoppedFunc: Function = null!;
    private onCompletedFunc: Function = null!;

    protected onLoad(): void {
        this.onReadyToPlayFunc = this.onReadyToPlay.bind(this);
        this.onStoppedFunc = this.onStopped.bind(this);
        this.onCompletedFunc = this.onCompleted.bind(this);
    }

    play(param: IVideoParam): void {
        super.play(param);
        this.resetVideo();

        const windowInfo = wx.getWindowInfo();
        const { windowWidth, windowHeight } = windowInfo;

        this.mWXVideo = wx.createVideo({
            src: param.src,
            //poster: param.poster,
            loop: param.loop,
            width: windowWidth,
            height: windowHeight,
            controls: false,
            showProgress: false,
            showProgressInControlMode: false,
            autoplay: true,
            showCenterPlayBtn: false,
            underGameView: true,
            enableProgressGesture: false,
            objectFit: "cover"

        });

        this.mPosterWidgetHigh = true;
        this.fixPosterSprite();

        if(!param.loop){
            this.mWXVideo.onEnded(this.onCompletedFunc);
        }
        this.mWXVideo.onPlay(this.onReadyToPlayFunc);

        this.videoSprite.node.active = true;
        let poster = param.poster ? param.poster : null;
        if(param.poster === ""){
            this.videoSprite.node.active = true;
        }
        else{
            this.videoSprite.node.active = true;
            this.loadAsync(param.posterBundle, param.poster + "/spriteFrame", SpriteFrame).then((spriteFrame)=>{
                if(this.isValid && !this.mIsPlaying){
                    this.videoSprite.node.active = true;
                    this.videoSprite.spriteFrame = spriteFrame;
                }
            });
        }
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

    stop(): void{
        if(this.mWXVideo){
            this.mWXVideo.stop();
        }
        super.stop();
        this.onStopped();
    };

    protected resetVideo(){
        if(this.mWXVideo){
            this.mWXVideo.offEnded(this.onCompletedFunc);
            this.mWXVideo.offPlay(this.onReadyToPlayFunc);
            this.mWXVideo.destroy();
            this.mWXVideo = null;
        }
    }

    protected onReadyToPlay(): void {
        super.onReadyToPlay();
        this.videoSprite.node.active = false;
    }

    protected onStopped(): void {
        super.onStopped();
    }

    protected onCompleted(): void {
        console.log("视频播放结束");
        //this.mWXVideo.destroy();
        super.onCompleted();
    }

    protected onDestroy(): void {
        this.resetVideo();
    }

    seek(time: number): void {
        this.mWXVideo.currentTime = time;
    }
    
    getDuration(): number{
        return this.mWXVideo.duration;
    }

    getCurrentTime(): number{
        return this.mWXVideo.currentTime;
    }
}