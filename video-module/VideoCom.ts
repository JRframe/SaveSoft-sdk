import { Component } from "cc";
import { IVideoParam } from "./VideoEnum";
import { CCComp } from "db://oops-framework/module/common/CCComp";
import { GameEvent } from "../../game/common/config/GameEvent";

export class VideoCom extends CCComp {

    protected readyToPlayCallback: () => void = null!;
    protected stopedCallback: () => void = null!;
    protected completeCallback: () => void = null!;

    mParam:IVideoParam = null!;
    mIsPlaying:boolean = false;

    mPosterWidgetHigh : boolean = false;

    reset(): void {
        
    }
    init():void{

    }

    play(param:IVideoParam){
        console.log("播放视频" + param.src);
        this.mIsPlaying = false;
        this.mParam = param;
    };

    //可以播放的时候调用
    protected onReadyToPlay(){
        this.mIsPlaying = true;
        if(this.mParam.readyToPlayCallback != null){
            this.mParam.readyToPlayCallback();
        }
    }

    protected onStopped(){
        this.mIsPlaying = false;
        if(this.mParam && this.mParam.stopedCallback){
            this.mParam.stopedCallback();
        }
    }

    protected onCompleted(){
        this.mIsPlaying = false;
        if(this.mParam.completeCallback != null){
            this.mParam.completeCallback();
        }
    }

    stop(): void{

    };
    pause(): void{

    };
    resume(): void{

    };
    seek(time: number): void{

    };
    setPoster(url: string): void{
        
    }
    setVolume(volume: number): void{

    };
    setMuted(muted: boolean): void{

    };
    setLoop(loop: boolean): void{

    };
    setUrl(url: string): void{

    };
    setAutoPlay(autoPlay: boolean): void{

    };
    destroyVideo(): void{

    };
    getDuration(): number{
        return 0;
    };
    getCurrentTime(): number{
        return 0;
    };
    getVideoWidth(): number{
        return 0;
    };
    getVideoHeight(): number{
        return 0;
    };

    onVideoReadyToPlay(): void {
        
    };

    onVideoStoped(): void {
    };

    onVideoComplete():void{

    }
}