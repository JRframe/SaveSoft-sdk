export interface IVideo{
    init():void;
    play(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    seek(time: number): void;
    setVolume(volume: number): void;
    setMuted(muted: boolean): void;
    setLoop(loop: boolean): void;
    setUrl(url: string): void;
    setAutoPlay(autoPlay: boolean): void;
    destroy(): void;
    getDuration(): number;
    getCurrentTime(): number;
    getVideoWidth(): number;
    getVideoHeight(): number;
}