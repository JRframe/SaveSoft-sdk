import { ImageAsset } from 'cc';
import { Texture2D } from 'cc';
import { SpriteFrame } from 'cc';
import { Sprite } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { IVideo } from './IVideo';
import { VideoCom } from '../VideoCom';
import { IVideoParam } from '../VideoEnum';
import { UITransform } from 'cc';
import { screen } from 'cc';
import { Vec3 } from 'cc';
import { view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TTVideoCom')
export class TTVideoCom extends VideoCom {

    @property(Sprite)
    videoSprite: Sprite = null!;

    poster: string = null!;

    mVideoPlayer:any = null;
    mVideoTexture: Texture2D = null!;

    mImageAsset: ImageAsset = null!;
    mVideoSpriteFrame: SpriteFrame = null!;

    private onReadyToPlayFunc: Function = null!;
    private onStoppedFunc: Function = null!;
    private onCompletedFunc: Function = null!;

    protected onLoad(): void {
        this.mImageAsset = new ImageAsset();
        this.mVideoPlayer = globalThis.tt.createOffscreenVideo();

        this.onReadyToPlayFunc = this.onReadyToPlay.bind(this);
        this.onStoppedFunc = this.onStopped.bind(this);
        this.onCompletedFunc = this.onCompleted.bind(this);
    }

    play(param: IVideoParam): void {
        this.removeListener();
        super.play(param);
        this.videoSprite.node.active = true;
        let poster = param.poster ? param.poster : null;
        if(param.poster === ""){
            this.videoSprite.node.active = true;
        }
        else{
            this.loadAsync(param.posterBundle, param.poster, SpriteFrame).then((spriteFrame)=>{
                if(this.isValid && !this.mIsPlaying){
                    this.videoSprite.node.active = true;
                    this.videoSprite.spriteFrame = spriteFrame;
                }
            });
        }
        this.mPosterWidgetHigh = true;
        this.fixPosterSprite();
        
        this.mVideoPlayer.loop = param.loop;
        this.mVideoPlayer.src = "";
        this.mVideoPlayer.src = param.src;
        this.addListener();
    }
    

    stop(): void {
        super.stop();
        this.mVideoPlayer.stop();
    }

    pause(): void {
        super.pause();
        this.mVideoPlayer.pause();
    }

    addListener() {
        this.removeListener();
        this.mVideoPlayer.onCanplay(this.onReadyToPlayFunc);
        this.mVideoPlayer.onStop(this.onStoppedFunc);
        this.mVideoPlayer.onEnded(this.onCompletedFunc);
    }

    removeListener() {
        this.mVideoPlayer.offCanplay(this.onReadyToPlayFunc);
        this.mVideoPlayer.offStop(this.onStoppedFunc);
        this.mVideoPlayer.offEnded(this.onCompletedFunc);
    }

    update(deltaTime: number) {
        if(this.mIsPlaying){
            this.refreshVideoImage();
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
    //刷新视频的画面
    refreshVideoImage(){
        if(this.mVideoPlayer && this.mVideoTexture){
            this.mImageAsset.reset(this.mVideoPlayer as HTMLImageElement);
            this.mVideoTexture.updateImage();
        }
    }
    
    onReadyToPlay(){
        super.onReadyToPlay();
        this.mImageAsset = new ImageAsset();
        this.mImageAsset.reset(this.mVideoPlayer);
        this.mVideoTexture = new Texture2D();
        this.mVideoTexture.image = this.mImageAsset;
        this.scheduleOnce(()=>{
            if((!this.isValid) || (!this.mVideoTexture)) return;
            const spFrame = new SpriteFrame();
            spFrame.texture = this.mVideoTexture;
            this.videoSprite.spriteFrame = spFrame;
        }, 0.01);
        const width = screen.windowSize.width;
        const height = screen.windowSize.height;
        const uiTransform = this.videoSprite.getComponent(UITransform)!;
        uiTransform.width = this.mVideoPlayer.width;
        uiTransform.height = this.mVideoPlayer.height;
        this.videoSprite.node.position = Vec3.ZERO;
        this.mVideoPlayer.play();
        let scaleRate = height / this.mVideoPlayer.height;
        this.videoSprite.node.scale = new Vec3(scaleRate,scaleRate,scaleRate);
    }

    onStopped(): void {
        console.log("TT onStopped");
        super.onStopped();
    }

    onCompleted(): void {
        console.log("TT onCompleted");
        super.onCompleted();
    }

    protected onDestroy(): void {
        this.removeListener();
        this.mVideoPlayer = null;
        super.onDestroy();

    }

}


