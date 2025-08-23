/*
 * @Author: LiuGuoBing
 * @Description: 媒体视频播放组件
 * 
 * 使用说明：
 * 1. 播放本地视频：设置 clip 属性
 * 2. 播放远程视频：调用 tryInitializeRemote() 然后 setRemoteSource()
 * 3. 切换视频源：直接调用 setRemoteSource()，会自动清理之前的资源
 * 4. 完全清理：在组件销毁前调用 dispose() 方法
 * 
 * 注意事项：
 * - 多次调用 setRemoteSource 现在是安全的，会自动清理之前的视频流
 * - 在 onDisable 时会自动清理资源
 * - 如果需要手动清理，可以调用 dispose() 方法
 */

import { _decorator, Component, VideoClip, RenderableComponent, Texture2D, loader, EventHandler, game, Game, CCString, Material, Sprite, SpriteFrame, gfx, director, VideoPlayer } from 'cc';
import { JSB } from 'cc/env';
const { ccclass, property} = _decorator;
export enum EventType {     //事件类型
    PREPARING = 1,      //准备中
    LOADED = 2,         //已加载
    READY = 3,          //准备完毕
    COMPLETED = 4,      //播放完成
    ERROR = 5,          //播放错误
    PLAYING = 6,        //播放中
    PAUSED = 7,         //暂停
    STOPPED = 8,        //停止
    BUFFER_START = 9,       //
    BUFFER_UPDATE = 10,
    BUFFER_END = 11,
    INIT = 12
};

enum VideoState {       //视频状态
    ERROR = -1,         // 出错状态   
    IDLE = 0,           // 置空状态
    PREPARING = 1,      //准备中
    PREPARED = 2,       //准备完成
    PLAYING = 3,        //播放中
    PAUSED = 4,         //暂停
    STOP = 5,
    COMPLETED = 5       //播放完成
};

enum ReadyState {       //准备状态
    HAVE_NOTHING = 0,       
    HAVE_METADATA = 1,
    HAVE_CURRENT_DATA = 2,
    HAVE_FUTURE_DATA = 3,
    HAVE_ENOUGH_DATA = 4    
};

enum PixelFormat {  //像素格式
    NONE = -1,      
    I420 = 0,        //yuv
    RGB = 2,        //rgb
    NV12 = 23,      //nv12
    NV21 = 24,      //nv21
    RGBA = 26       //rgba
};

const regions: gfx.BufferTextureCopy[] = [new gfx.BufferTextureCopy()];
const buffers: ArrayBufferView[] = [];


/**
 * 根据事件类型获取事件名称字符串
 * @param eventType 事件类型
 * @returns 事件名称字符串
 */
export function getEventName(eventType: EventType): string {
    switch (eventType) {
        case EventType.PREPARING:
            return 'preparing';
        case EventType.LOADED:
            return 'loaded';
        case EventType.READY:
            return 'ready';
        case EventType.COMPLETED:
            return 'completed';
        case EventType.ERROR:
            return 'error';
        case EventType.PLAYING:
            return 'playing';
        case EventType.PAUSED:
            return 'paused';
        case EventType.STOPPED:
            return 'stopped';
        case EventType.BUFFER_START:
            return 'buffer_start';
        case EventType.BUFFER_UPDATE:
            return 'buffer_update';
        case EventType.BUFFER_END:
            return 'buffer_end';
        case EventType.INIT: // EventType没有INIT，去除此项以避免报错
            return 'init';
        default:
            return 'unknown';
    }
}
   

@ccclass('MediaVideo')
export class MediaVideo extends Component {

    @property
    private _source: string = '';             //视频链接
    @property
    private _clip: VideoClip = null!;            //视频资源

    private _seekTime: number = 0;               //搜寻时间 
    private _nativeDuration: number = 0;         //原生的持续时间
    private _nativeWidth: number = 0;           //原生的视频宽          
    private _nativeHeight: number = 0;          //原生的视频高
    private _currentState = VideoState.IDLE;    //当前状态
    private _targetState = VideoState.IDLE;       //目标状态       
    private _pixelFormat = PixelFormat.RGBA;             //像素格式
    private _video: any = null;
    private _texture0: Texture2D = new Texture2D();     //通道0
    private _texture1: Texture2D = new Texture2D();     //通道1
    private _texture2: Texture2D = new Texture2D();     //通道2
    private _loaded: boolean = false;                   //是否加载
    private _isBuffering: boolean = false;              
    private _inBackground: boolean = false;             //是否在后台
    private _lastPlayState: boolean = false;            //上一次播放状态
    private _volume: number = -1;
    
    @property(VideoClip)
    get clip() {
        return this._clip;
    }

    set clip(value: VideoClip) {
        this._clip = value;
    }

    @property(VideoPlayer)
    VideoView: VideoPlayer = null!;

    @property
    get source() {
        return this._source;
    }

    set source(value: string) {
        this._source = value;
    }

    // loop property
    @property
    cache: boolean = false;

    // loop property
    @property
    loop: boolean = false;
    
    @property(RenderableComponent)
    public render: RenderableComponent = null!;

    // rgb material
    @property([Material])
    protected rgb: Material[] = [];

    // rgb material
    @property([Material])
    protected rgba: Material[] = [];

    // i420 material
    @property([Material])
    protected i420: Material[] = [];

    // nv12 material
    @property([Material])
    protected nv12: Material[] = [];

    // nv21 material
    @property([Material])
    protected nv21: Material[] = [];

    // video event handler for editor
    @property([EventHandler])
    public videoPlayerEvent: EventHandler[] = [];

    @property(Number)
    width: number = 1080;

    @property(Number)
    height: number = 1920;

    // current position of the video which is playing
    get currentTime() {
        if (!this._video) return 0;
        if (this._isInPlaybackState()) {
            if (JSB) {
                return this._video.currentTime();
            } else {
                return this._video.currentTime;
            }
        } else {
                return this._seekTime;
        }
    }
    
    // seek to position
    set currentTime(value: number) {
        if (!this._video) return;
        if (this._isInPlaybackState()) {
            if (JSB) {
                this._video.seek(value);
            } else {
                this._video.currentTime = value;
            }
        } else {
            this._seekTime = value;
        }
    }
    
        // duration of the video
    get duration(): number {
        if (!this._video) return 0;
        if (this._nativeDuration > 0) return this._nativeDuration;
        if (JSB) {
                this._nativeDuration = this._video.duration();
        } else {
            let duration = this._video.duration;
            this._nativeDuration = isNaN(duration) ? 0 : duration;
        }
        return this._nativeDuration;
    }
    
    // get width(): number {
    //     if (!this._isInPlaybackState()) return 0;
    //     if (this._nativeWidth > 0) return this._nativeWidth;
    //     if (JSB) {
    //         this._nativeWidth = this._video.width();
    //     } else {
    //         let width = this._video.videoWidth;
    //         this._nativeWidth = isNaN(width) ? 0 : width;
    //     }
    //     return this._nativeWidth;
    // }
    
    // get height(): number {
    //     if (!this._isInPlaybackState()) return 0;
    //     if (this._nativeHeight > 0) return this._nativeHeight;
    //     if (JSB) {
    //         this._nativeHeight = this._video.height();
    //     } else {
    //         let height = this._video.videoHeight;
    //         this._nativeHeight = isNaN(height) ? 0 : height;
    //     }
    //     return this._nativeHeight;
    // }
    
    // not accurate because native event is async, larger than actual percentage.
    get bufferPercentage(): number {
        if (!this._video) return 0;
        if (JSB) {
            return this._video.bufferPercentage();
        } else {
            return 0;
        }
    }

    private _isInitialize: boolean = false;

    start() {

    }

    public tryInitializeRemote(source: string) {
        // 如果已经初始化且源相同，则直接返回
        if(this._isInitialize && this._source === source) {
            console.log(`[video] 已初始化相同源，跳过: ${source}`);
            return;
        }
        
        // 如果已经初始化但源不同，需要先清理
        if(this._isInitialize && this._source !== source) {
            console.log(`[video] 源已改变，重新初始化: ${this._source} -> ${source}`);
            // 清理前先停止播放，避免正在播放时清理资源
            if (this._currentState === VideoState.PLAYING) {
                this.stop();
            }
            this._cleanupVideoResources();
            this._isInitialize = false;
        }
        
        console.log(`[video] initializeRemote, ${source}`);
        this.clip = null!;
        this._source = source;
        
        // 同步设置VideoPlayer的remoteURL（如果存在）
        if (this.VideoView) {
            this.VideoView.remoteURL = source;
            console.log(`[video] initializeRemote 同步设置VideoPlayer.remoteURL: ${source}`);
        }
        
        this._initialize();
        this._isInitialize = true;
    }

    /**
     * 初始化
     */
    private _initialize() {
        if (JSB) {
            this._initializeNative();
        } else {
            this._initializeBrowser();
        }
    }

    /**
     * 初始化原生
     */
    private _initializeNative() {
        //原生平台使用 FFmpeg 解析视频，不需要从 VideoPlayer 组件中获取数据源
        if(this.VideoView && this.VideoView.node && this.VideoView.node.isValid) {
            this.VideoView.node.destroy();
        }

        try {
            // 如果已经存在视频对象，先清理
            if (this._video) {
                console.log('[video] 清理现有的原生视频对象');
                this._cleanupVideoResources();
            }
            
            this._video = new window.gfx.Video();
            this._video.addEventListener('loaded', () => this._onMetaLoaded());
            this._video.addEventListener('ready', () => this._onReadyToPlay());
            this._video.addEventListener('completed', () => this._onCompleted());
            this._video.addEventListener('error', () => this._onError());
            this._video.addEventListener('buffer_start', () => this._onBufferStart());
            this._video.addEventListener('buffer_update', () => this._onBufferUpdate());
            this._video.addEventListener('buffer_end', () => this._onBufferEnd());
            this._video.addEventListener('frame_update', () => this._onFrameUpdate());
            
            console.log('[video] 原生视频播放器初始化成功');
        } catch (error) {
            console.error('[video] 初始化原生视频播放器失败:', error);
            this._video = null;
            this._currentState = VideoState.ERROR;
        }
    }

    /**
     * initialize browser player, register video event handler
     */
     private _initializeBrowser(): void {
        // @ts-ignore
        this._video = this.VideoView._impl._video;
        this._video.crossOrigin = 'anonymous';
        this._video.autoplay = false;
        this._video.loop = false;
        this._video.muted = false;
        // this.textures = [
        //     // @ts-ignore
        //     new cc.renderer.Texture2D(cc.renderer.device, {
        //         wrapS: gfx.WRAP_CLAMP,
        //         wrapT: gfx.WRAP_CLAMP,
        //         genMipmaps: false,
        //         premultiplyAlpha: false,
        //         flipY: false,
        //         format: gfx.TEXTURE_FMT_RGBA8
        //     })
        // ];
        this._video.addEventListener('loadedmetadata', () => this._onMetaLoaded());
        this._video.addEventListener('ended', () => this._onCompleted());
        this._loaded = false;
        let onCanPlay = () => {
            if (this._loaded || this._currentState == VideoState.PLAYING)
                return;
            if (this._video.readyState === ReadyState.HAVE_ENOUGH_DATA ||
                this._video.readyState === ReadyState.HAVE_METADATA) {
                this._video.currentTime = 0;
                this._loaded = true;
                this._onReadyToPlay();
            }
        };
        this._video.addEventListener('canplay', onCanPlay);
        this._video.addEventListener('canplaythrough', onCanPlay);
        this._video.addEventListener('suspend', onCanPlay);

        // @ts-ignore
        // let gl = cc.renderer.device._gl;
        // this.update = dt => {
        //     if (this._isInPlaybackState()) {
        //         gl.bindTexture(gl.TEXTURE_2D, this.textures[0]._glID);
        //         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.impl);
        //         // @ts-ignore
        //         cc.renderer.device._restoreTexture(0);
        //     }
        // };
    }

    /**
     * 清理和释放视频资源
     */
    private _cleanupVideoResources() {
        if (!this._video) return;
        
        console.log(`[video] 开始清理视频资源`);
        
        // 先重置状态，防止在清理过程中有新的回调
        this._currentState = VideoState.IDLE;
        this._targetState = VideoState.IDLE;
        this._loaded = false;
        this._seekTime = 0;
        this._nativeDuration = 0;
        this._nativeWidth = 0;
        this._nativeHeight = 0;
        
        if (JSB) {
            // 原生平台清理
            try {
                // 停止播放
                if (typeof this._video.stop === 'function') {
                    this._video.stop();
                }
                
                // 原生视频对象可能没有removeEventListener方法
                // 直接销毁即可，事件监听器会自动清理
                if (typeof this._video.destroy === 'function') {
                    this._video.destroy();
                }
            } catch (e) {
                console.error(`[video] 清理原生视频资源时出错:`, e);
            }
        } else {
            // 浏览器平台清理
            try {
                this._video.pause();
                this._video.currentTime = 0;
                this._video.src = '';
                this._video.load(); // 重置视频元素
            } catch (e) {
                console.error(`[video] 清理浏览器视频资源时出错:`, e);
            }
        }
        
        console.log(`[video] 视频资源清理完成`);
    }

    /**
     * 处理视频资源
     */
    private _updateVideoSource() {
        let url = '';
        if (this._source) {
            url = this._source;
        }
        if (this._clip) {
            url = this._clip.nativeUrl;
        }
        if (url && loader.md5Pipe) {
            url = loader.md5Pipe.transformURL(url);
        }

        console.log(`[video]_updateVideoSource, ${url}`);
        
        // 只在JSB平台且需要切换源时才清理和重创建
        if (JSB && this._video) {
            // 检查当前状态，如果正在播放则先停止
            if (this._currentState === VideoState.PLAYING) {
                try {
                    this._video.stop();
                } catch (e) {
                    console.warn('[video] 停止播放时出错:', e);
                }
            }
            
            // 不需要完全销毁，只需要重新设置URL
            try {
                this._video.setURL(url, this.cache);
                this._video.prepare();
            } catch (e) {
                console.error('[video] 设置视频URL时出错:', e);
                // 如果设置失败，则重新创建
                this._cleanupVideoResources();
                
                // 重新创建原生视频对象
                try {
                    this._video = new window.gfx.Video();
                    this._video.addEventListener('loaded', () => this._onMetaLoaded());
                    this._video.addEventListener('ready', () => this._onReadyToPlay());
                    this._video.addEventListener('completed', () => this._onCompleted());
                    this._video.addEventListener('error', () => this._onError());
                    this._video.addEventListener('buffer_start', () => this._onBufferStart());
                    this._video.addEventListener('buffer_update', () => this._onBufferUpdate());
                    this._video.addEventListener('buffer_end', () => this._onBufferEnd());
                    this._video.addEventListener('frame_update', () => this._onFrameUpdate());
                    
                    this._video.setURL(url, this.cache);
                    this._video.prepare();
                } catch (createError) {
                    console.error('[video] 重新创建视频对象失败:', createError);
                    this._video = null;
                    return;
                }
            }
        } else if (!JSB && this._video) {
            this._loaded = false;
            this._video.pause();
            this._video.src = url;
        } else if (!this._video) {
            console.error('[video] 视频对象未初始化');
            return;
        }

        this.node.emit('preparing', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PREPARING);
    }

    /**
     * register game show and hide event handler
     */
     public onEnable(): void {
        game.on(Game.EVENT_SHOW, this._onShow, this);
        game.on(Game.EVENT_HIDE, this._onHide, this);
    }

    // unregister game show and hide event handler
    public onDisable(): void {
        console.log(`[video] onDisable 开始清理`);
        game.off(Game.EVENT_SHOW, this._onShow, this);
        game.off(Game.EVENT_HIDE, this._onHide, this);
        
        // 完整清理视频资源
        this.stop();
        this._cleanupVideoResources();
        
        // 清空视频对象引用
        this._video = null;
        this._isInitialize = false;
        
        console.log(`[video] onDisable 清理完成`);
    }

    private _onShow(): void {
        if (!this._inBackground) return;
        this._inBackground = false;
        if (this._lastPlayState) this.resume();
    }

    private _onHide(): void {
        if (this._inBackground) return;
        this._inBackground = true;
        this._lastPlayState = this.isPlaying();
        if (this._lastPlayState) this.pause();
    }

    update(deltaTime: number) {
        if (this._isInPlaybackState() && !JSB && this._video && this._texture0) {
            // 添加安全检查，确保纹理对象有效且视频元素准备就绪
            if (!this._texture0.isValid) {
                console.warn('[video] 纹理对象无效，跳过update');
                return;
            }
            
            // 确保视频元素状态正常
            if (!this._video.videoWidth || !this._video.videoHeight) {
                return;
            }
            
            // 检查当前状态是否允许纹理更新
            if (this._currentState === VideoState.IDLE || 
                this._currentState === VideoState.ERROR) {
                return;
            }
            
            try {
                this._texture0.uploadData(this._video);
                this._updateMaterial();
            } catch (error) {
                console.error('[video] update时纹理上传发生错误:', error);
                // 标记错误状态，但不立即停止播放，给播放器一次恢复的机会
                this._currentState = VideoState.ERROR;
                // 只有在连续错误时才停止播放
                this.scheduleOnce(() => {
                    if (this._currentState === VideoState.ERROR) {
                        console.log('[video] 持续错误状态，停止播放');
                        this.stop();
                    }
                }, 1.0); // 1秒后检查
            }
        } 
    }

    private _copyTextureToTexture2D(texture2D: Texture2D, texture: gfx.Texture) {
        // 添加安全检查
        if (!director.root || !director.root.device) {
            console.warn('[video] director.root 或 device 不可用，跳过纹理复制');
            return;
        }
        
        if (!buffers.length) {
            buffers[0] = new Uint8Array(texture.size);
        }
        regions[0].texExtent.width = texture.width;
        regions[0].texExtent.height = texture.height;
        regions[0].texSubres.mipLevel = 0;
        regions[0].texSubres.baseArrayLayer = 0;
        
        try {
            director.root.device.copyTextureToBuffers(texture, buffers, regions);
            texture2D.uploadData(buffers[0]);
        } catch (error) {
            console.error('[video] 纹理复制时发生错误:', error);
        }
    }

    /**
     * 更新材质
     */
    protected _updateMaterial(): void {
        if (!this.render) {
            console.warn('[video] render组件为空，跳过材质更新');
            return;
        }
        
        // 增加状态检查，防止在不合适的时机更新材质
        if (this._currentState === VideoState.IDLE || 
            this._currentState === VideoState.ERROR ||
            this._currentState === VideoState.STOP) {
            console.warn('[video] 当前状态不允许材质更新，跳过');
            return;
        }
        
        try {
            let material = this.render.getMaterialInstance(0);
            if (material && this._texture0) {
                material.setProperty('texture0', this._texture0);
                switch (this._pixelFormat) {
                    case PixelFormat.I420:
                        if (this._texture2) {
                            material.setProperty('texture2', this._texture2);
                        }
                    // fall through
                    case PixelFormat.NV12:
                    case PixelFormat.NV21:
                        if (this._texture1) {
                            material.setProperty('texture1', this._texture1);
                        }
                        break;
                }
            }
        } catch (error) {
            console.error('[video] 更新材质时发生错误:', error);
            // 发生错误时不要立即停止播放，而是标记错误状态
            this._currentState = VideoState.ERROR;
        }
    }


    /**
     * 更新贴图
     */
    private _updateTexture() {
        if (this.render instanceof Sprite) {
            let sprite: Sprite = this.render;
            if (sprite.spriteFrame === null) {
                sprite.spriteFrame = new SpriteFrame();
            }
            let texture = new Texture2D(); 
            this._resetTexture(texture, this.width, this.height);   
            sprite.spriteFrame.texture = texture;
        }
        this._resetTexture(this._texture0, this.width, this.height);
        let material = this.render?.material;
        material?.setProperty('texture0', this._texture0);
        switch (this._pixelFormat) {
            case PixelFormat.I420:
                this._resetTexture(this._texture1, this.width >> 1, this.height >> 1);
                material?.setProperty('texture1', this._texture1);
                this._resetTexture(this._texture2, this.width >> 1, this.height >> 1);
                material?.setProperty('texture2', this._texture2);
                break;
                // fall through
            case PixelFormat.NV12:
            case PixelFormat.NV21:
                this._resetTexture(this._texture1, this.width >> 1, this.height >> 1, gfx.Format.RG8);
                material?.setProperty('texture1', this._texture1);
                break;
        }
    }

    /**
     * 重置贴图状态
     * @param texture 贴图
     * @param width 宽
     * @param height 高
     */
    private _resetTexture(texture: Texture2D, width: number, height: number, format?: number) {
        texture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
        texture.setMipFilter(Texture2D.Filter.LINEAR);
        texture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
        

        texture.reset({
            width: width,
            height: height,
            //@ts-ignore
            format:  format ? format : JSB ?gfx.Format.R8: gfx.Format.RGB8
        });
    }

    private _onMetaLoaded() {
        this.node.emit('loaded', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.LOADED);
    }

    private _onReadyToPlay() {        
        console.log('[video] _onReadyToPlay 开始');
        this._updatePixelFormat();
        this._currentState = VideoState.PREPARED;
        if (this._seekTime > 0.1) {
            this.currentTime = this._seekTime;
        }
        this._updateTexture();
        this.node.emit('ready', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.READY);
        
        // 确保在准备就绪后正确开始播放
        if (this._targetState == VideoState.PLAYING) {
            console.log('[video] 目标状态为播放，开始播放视频');
            this.play();
        }
        console.log('[video] _onReadyToPlay 完成');
    }

    private _onCompleted() {
        if (this.loop) {
            if (this._currentState == VideoState.PLAYING) {
                this.currentTime = 0;
                this._video.play();
            }
        } else {
            this._currentState = VideoState.COMPLETED;
            this._targetState = VideoState.COMPLETED;
            this.node.emit('completed', this);
            EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.COMPLETED);
        }
    }

    private _onError() {
        this._currentState = VideoState.ERROR;
        this._targetState = VideoState.ERROR;
        this.node.emit('error', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.ERROR);
    }

    private _onBufferStart() {
        this._isBuffering = true;
        this.node.emit('buffer_start', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.BUFFER_START);
    }

    private _onBufferUpdate() {
        this.node.emit('buffer_update', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.BUFFER_UPDATE);
    }

    private _onBufferEnd() {
        this._isBuffering = false;
        this.node.emit('buffer_end', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.BUFFER_END);
    }

    private _onFrameUpdate() {
        // 添加安全检查，防止在资源清理后仍然执行纹理上传
        if (!this._isInPlaybackState() || !JSB || !this._video) return;
        
        // 检查纹理对象是否有效
        if (!this._texture0 || !this._texture0.isValid || 
            !this._texture1 || !this._texture1.isValid || 
            !this._texture2 || !this._texture2.isValid) {
            console.warn('[video] 纹理对象无效，跳过帧更新');
            return;
        }
        
        // 检查当前状态是否允许纹理更新
        if (this._currentState === VideoState.IDLE || 
            this._currentState === VideoState.ERROR) {
            return;
        }
        
        try {
            let datas: any = this._video.getDatas();
            if (!datas || !datas.length) return;

            // 安全地上传纹理数据，添加错误处理
            if (datas.length > 0 && this._texture0 && this._texture0.isValid) {
                this._texture0.uploadData(datas[0]);
            }
            if (datas.length > 1 && this._texture1 && this._texture1.isValid) {
                this._texture1.uploadData(datas[1]);
            }
            if (datas.length > 2 && this._texture2 && this._texture2.isValid) {
                this._texture2.uploadData(datas[2]);
            }
            
            this._updateMaterial();
        } catch (error) {
            console.error('[video] 帧更新时发生错误:', error);
            // 标记错误状态，但不立即停止播放，给播放器恢复机会
            this._currentState = VideoState.ERROR;
            // 延迟检查是否需要停止播放
            this.scheduleOnce(() => {
                if (this._currentState === VideoState.ERROR) {
                    console.log('[video] 帧更新持续错误，停止播放');
                    this.stop();
                }
            }, 2.0); // 给更长的恢复时间
        }
    }
    

    private _updatePixelFormat(): void {
        let index: number = this.render instanceof Sprite ? 1 : 0; 
        let pixelFormat = JSB ? this._video.pixelFormat() : PixelFormat.RGB;
        if (this._pixelFormat == pixelFormat) return;
        this._pixelFormat = pixelFormat;
        switch (pixelFormat) {
            case PixelFormat.RGB:
                this.render.setMaterial(this.rgb[index], 0);
                break;
            case PixelFormat.RGBA:
                this.render.setMaterial(this.rgba[index], 0);
                break;
            case PixelFormat.I420:
                this.render.setMaterial(this.i420[index], 0);
                break;
            case PixelFormat.NV12:
                this.render.setMaterial(this.nv12[index], 0);
                break;
            case PixelFormat.NV21:
                this.render.setMaterial(this.nv21[index], 0);
                break;
        }
    }

    /**
     * 播放视频
     */
     public play() {
        if (this._isInPlaybackState()) {
            if (this._currentState == VideoState.COMPLETED) {
                this.currentTime = 0;
            }
            if (this._currentState != VideoState.PLAYING) {
                if (this._volume !== -1) {
                    this.setVolume(this._volume);
                    this._volume = -1;
                } 
                this._video.play();
                this.node.emit('playing', this);
                this._currentState = VideoState.PLAYING;
                this._targetState = VideoState.PLAYING;
                EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PLAYING);
            }
        } else {
            this._targetState = VideoState.PLAYING;
        }
    }

    /**
     * 恢复视频
     */
    public resume() {
        if (this._isInPlaybackState() && this._currentState != VideoState.PLAYING) {
            if (JSB) {
                this._video.resume();
            } else {
                this._video.play();
            }
            this.node.emit('playing', this);
            this._currentState = VideoState.PLAYING;
            this._targetState = VideoState.PLAYING;
            EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PLAYING);
        } else {
            this._targetState = VideoState.PLAYING;
        }
    }

    /**
     * 暂停视频
     */
    public pause() {
        if (this._isInPlaybackState() && this._currentState != VideoState.PAUSED) {
            this._video.pause();
            this.node.emit('paused', this);
            this._currentState = VideoState.PAUSED;
            this._targetState = VideoState.PAUSED;
            EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.PAUSED);
        } else {
            this._targetState = VideoState.PAUSED;
        }
    }

    /**
     * 停止视频
     */
    public stop() {
        this._seekTime = 0;
        if (this._isInPlaybackState() && this._currentState != VideoState.STOP) {
            if (JSB) {
                this._video.stop();
            } else {
                this._video.pause();
                this._video.currentTime = 0;
            }

            this.node.emit('stopped', this);
            this._currentState = VideoState.STOP;
            this._targetState = VideoState.STOP;
            EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.STOPPED);
        } else {
            this._targetState = VideoState.STOP;
        }
    }

    /**
     * 设置音量
     * @param volume 音量 0-1
     * @returns 
     */
    public setVolume(volume: number) {
        if (!this._isInPlaybackState()) {
            this._volume = volume;
            return;
        }
        if(JSB) {
            this._video.setVolume(volume);
        } else {
            this._video.volume = volume;
        }
    }

    /**
     * 清理视频资源
     */
    public clear() {
        console.log(`[video] 调用 clear 方法`);
        this._cleanupVideoResources();
        this._video = null;
    }

    /**
     * 播放状态
     * @returns 播放状态
     */
    public isPlaying() {
        return this._currentState == VideoState.PLAYING || this._targetState == VideoState.PLAYING;
    }

    
    public seek(time: number) {
        this.pause();
        this._seekTime = time;
        this._video.currentTime = time;
        this.resume();
    }

    private _isInPlaybackState() {
        return !!this._video && this._currentState != VideoState.IDLE && this._currentState != VideoState.PREPARING && this._currentState != VideoState.ERROR;
    }

    public setRemoteSource(source: string) {
        console.log(`[video] setRemoteSource: ${source}`);
        
        // 如果源相同，则无需重新设置
        if (this._source === source && this._currentState == VideoState.PLAYING) {
            console.log(`[video] 源相同，跳过设置: ${source}, ${this._currentState}`);
            return;
        }
        
        // 如果已经在播放，先停止
        if (this._currentState == VideoState.PLAYING) {
            this.stop();
        }
        
        // 同步设置VideoPlayer的remoteURL（如果存在）
        if (this.VideoView) {
            this.VideoView.remoteURL = source;
            console.log(`[video] 同步设置VideoPlayer.remoteURL: ${source}`);
        }
        
        // 只在必要时清理资源（原生平台且源不同）
        if (JSB && this._video && this._source !== source) {
            // 不完全清理，只重置状态
            this._currentState = VideoState.IDLE;
            this._targetState = VideoState.IDLE;
            this._loaded = false;
            this._seekTime = 0;
        }
        
        this.clip = null!;
        this._source = source;
        
        this._updateVideoSource();
    }

    /**
     * 完全释放视频播放器资源
     * 在不再需要视频播放器时调用此方法
     */
    public dispose() {
        console.log(`[video] 开始完全释放视频播放器资源`);
        
        // 停止播放
        if (this._currentState === VideoState.PLAYING) {
            this.stop();
        }
        
        // 清理视频资源
        this._cleanupVideoResources();
        
        // 清空对象引用
        this._video = null;
        this._isInitialize = false;
        
        // 安全地清理纹理资源
        try {
            if (this._texture0) {
                if (this._texture0.isValid) {
                    this._texture0.destroy();
                }
                this._texture0 = null!;
            }
            if (this._texture1) {
                if (this._texture1.isValid) {
                    this._texture1.destroy();
                }
                this._texture1 = null!;
            }
            if (this._texture2) {
                if (this._texture2.isValid) {
                    this._texture2.destroy();
                }
                this._texture2 = null!;
            }
        } catch (error) {
            console.error('[video] 清理纹理资源时发生错误:', error);
            // 即使销毁失败，也要清空引用
            this._texture0 = null!;
            this._texture1 = null!;
            this._texture2 = null!;
        }
        
        console.log(`[video] 视频播放器资源释放完成`);
    }
}

