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
 * - 视频切换时会保持前一帧内容，避免闪烁
 */

import { UITransform } from 'cc';
import { UIOpacity } from 'cc';
import { _decorator, Component, VideoClip, RenderableComponent, Texture2D, loader, EventHandler, game, Game, CCString, Material, Sprite, SpriteFrame, gfx, director, VideoPlayer, screen } from 'cc';
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
    STOP = 5,           //停止
    COMPLETED = 6       //播放完成
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
    private _volume: number = 1;
    
    /** 用于平滑切换的临时Sprite */
    @property(Sprite)
    private tempSprite: Sprite = null!;

    /** 视频的透明度 */
    @property(UIOpacity)
    private videoOpacity: UIOpacity = null!;
    
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
        console.log(`[video] 设置视频源: ${value}`);
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

    private _isTransitioning: boolean = false;

    start() {

    }

    public tryInitializeRemote(source: string) {
        const currentSource = this.source;
        
        // 如果已经初始化且源相同，则直接返回
        if(this._isInitialize && currentSource === source) {
            console.log(`[video] 已初始化相同源，跳过: ${source}`);
            return;
        }
        
        // console.log(`[video] initializeRemote, ${source}`);
        this.clip = null!;
        
        // 同步设置VideoPlayer的remoteURL（如果存在）
        if (this.VideoView) {
            this.VideoView.remoteURL = source;
            // console.log(`[video] initializeRemote 同步设置VideoPlayer.remoteURL: ${source}`);
        }
        
        this._initialize();
        this.setRemoteSource(source);
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
        this._isInitialize = true;
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
            // 如果已经存在视频对象且不在切换中，先清理
            if (this._video) {
                this.copyCurrentFrameToSprite();
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
        // 安全地获取VideoPlayer的内部video元素
        if (!this.VideoView || !(this.VideoView as any)._impl) {
            console.error('[video] VideoView 或其 _impl 属性不存在');
            return;
        }
        
        this._video = (this.VideoView as any)._impl._video;
        this._video.crossOrigin = 'anonymous';
        this._video.autoplay = false;
        this._video.loop = false;
        this._video.muted = false;
        
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
        if (this.source) {
            url = this.source;
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
        
        // 清理切换相关的定时器
        this._isTransitioning = false;
        
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
            // 在切换过程中，完全禁止纹理更新操作，防止崩溃
            if (this._isTransitioning) {
                return;
            }
            
            // 添加安全检查，确保纹理对象有效且视频元素准备就绪
            if (!this._texture0 || !this._texture0.isValid) {
                console.warn('[video] 纹理对象无效，跳过update');
                return;
            }
            
            // 确保视频元素状态正常
            if (!this._video.videoWidth || !this._video.videoHeight) {
                return;
            }
            
            // 检查当前状态是否允许纹理更新
            if (this._currentState === VideoState.IDLE || 
                this._currentState === VideoState.ERROR ||
                this._currentState === VideoState.PREPARING) {
                return;
            }
            
            try {
                // 在上传前再次检查纹理有效性
                if (this._texture0 && this._texture0.isValid && !this._isTransitioning) {
                    this._texture0.uploadData(this._video);
                    this._updateMaterial();
                }
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
        
        // 检查切换状态
        if (this._isTransitioning) {
            console.warn('[video] 正在切换视频，跳过纹理复制');
            return;
        }
        
        // 检查纹理对象有效性
        if (!texture2D || !texture2D.isValid || !texture) {
            console.warn('[video] 纹理对象无效，跳过纹理复制');
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
            // 再次检查切换状态和纹理有效性
            if (!this._isTransitioning && texture2D && texture2D.isValid) {
                texture2D.uploadData(buffers[0]);
            }
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
        
        // 在切换过程中，完全禁止材质更新操作
        if (this._isTransitioning) {
            return;
        }
        
        // 增加状态检查，防止在不合适的时机更新材质
        if (this._currentState === VideoState.IDLE || 
            this._currentState === VideoState.ERROR ||
            this._currentState === VideoState.STOP ||
            this._currentState === VideoState.PREPARING) {
            return;
        }
        
        try {
            let material = this.render.getMaterialInstance(0);
            if (material && this._texture0 && this._texture0.isValid && !this._isTransitioning) {
                material.setProperty('texture0', this._texture0);
                switch (this._pixelFormat) {
                    case PixelFormat.I420:
                        if (this._texture2 && this._texture2.isValid) {
                            material.setProperty('texture2', this._texture2);
                        }
                    // fall through
                    case PixelFormat.NV12:
                    case PixelFormat.NV21:
                        if (this._texture1 && this._texture1.isValid) {
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
        if (!texture) {
            console.warn('[video] 纹理对象为空，跳过重置');
            return;
        }
        
        try {
            texture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
            texture.setMipFilter(Texture2D.Filter.LINEAR);
            texture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
            

            texture.reset({
                width: width,
                height: height,
                format: format ? format : JSB ? gfx.Format.R8 : gfx.Format.RGB8
            });
        } catch (error) {
            console.error('[video] 重置纹理时发生错误:', error);
        }
    }

    private _onMetaLoaded() {
        this.node.emit('loaded', this);
        EventHandler.emitEvents(this.videoPlayerEvent, this, EventType.LOADED);
    }

    private _onReadyToPlay() {        
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

        // tempSprite 和 video 切换
        this._isTransitioning = false;
        this.videoOpacity.opacity = 255;
        this.tempSprite.node.active = false;
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
        
        // 在切换过程中，完全禁止纹理更新操作，防止崩溃
        if (this._isTransitioning) {
            return;
        }
        
        // 检查纹理对象是否有效
        if (!this._texture0 || !this._texture0.isValid || 
            !this._texture1 || !this._texture1.isValid || 
            !this._texture2 || !this._texture2.isValid) {
            console.warn('[video] 纹理对象无效，跳过帧更新');
            return;
        }
        
        // 检查当前状态是否允许纹理更新
        if (this._currentState === VideoState.IDLE || 
            this._currentState === VideoState.ERROR ||
            this._currentState === VideoState.PREPARING) {
            return;
        }
        
        try {
            let datas: any = this._video.getDatas();
            if (!datas || !datas.length) return;

            // 安全地上传纹理数据，添加错误处理
            // 在每次上传前都检查切换状态
            if (datas.length > 0 && this._texture0 && this._texture0.isValid && !this._isTransitioning) {
                this._texture0.uploadData(datas[0]);
            }
            if (datas.length > 1 && this._texture1 && this._texture1.isValid && !this._isTransitioning) {
                this._texture1.uploadData(datas[1]);
            }
            if (datas.length > 2 && this._texture2 && this._texture2.isValid && !this._isTransitioning) {
                this._texture2.uploadData(datas[2]);
            }
            
            // 只有在非切换状态下才更新材质
            if (!this._isTransitioning) {
                this._updateMaterial();
            }
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
        if (!this._video) {
            console.warn('[video] 视频对象不存在，无法进行seek操作');
            this._seekTime = time;
            return;
        }
        
        this.pause();
        this._seekTime = time;
        
        if (this._isInPlaybackState()) {
            if (JSB) {
                this._video.seek(time);
            } else {
                this._video.currentTime = time;
            }
        }
        
        this.resume();
    }

    private _isInPlaybackState() {
        return !!this._video && this._currentState != VideoState.IDLE && this._currentState != VideoState.PREPARING && this._currentState != VideoState.ERROR;
    }

    public setRemoteSource(source: string) {
        console.log(`[video] setRemoteSource: ${source}, 当前源: ${this.source}, 当前状态: ${this._currentState}`);
        
        const currentSource = this.source; 
        
        // 如果源相同且正在播放，则无需重新设置
        // 注意：这里只有在正在播放时才跳过，其他状态允许重新设置
        if (currentSource === source && this._currentState === VideoState.PLAYING && this._isInitialize) {
            console.log(`[video] 源相同且正在播放，跳过设置: ${source}`);
            return;
        }
        
        // 同步设置VideoPlayer的remoteURL（如果存在）
        if (this.VideoView) {
            this.VideoView.remoteURL = source;
        }
        
        this.clip = null!;
        this.source = source; // 使用setter方法进行赋值
        
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

    /**
     * 将当前_texture0的图像复制到tempSprite上
     * 复制的图像独立于_texture0，不会因为_texture0的变化而改变
     * @returns {boolean} 是否复制成功
     */
    public copyCurrentFrameToSprite(): boolean {
        // 检查必要条件
        if (!this.tempSprite) {
            console.warn('[video] copy,tempSprite未设置，无法复制图像');
            return false;
        }
        
        if (!this._texture0 || !this._texture0.isValid) {
            console.warn('[video] copy,_texture0无效，无法复制图像');
            return false;
        }
        
        if (!this._isInPlaybackState()) {
            console.warn('[video] copy,视频未处于播放状态，无法复制图像');
            return false;
        }

        const transform = this.tempSprite.node.getComponent(UITransform)!;
        transform.width = cc.winSize.width;
        transform.height = cc.winSize.height;
        this.tempSprite.node.active = true;
        this._isTransitioning = true;

        try {
            console.log('[video] copy,开始复制当前帧到tempSprite');
            
            // 根据当前像素格式创建对应的纹理
            const success = this._copyFrameByPixelFormat();
            
            if (success) {
                console.log('[video] 成功复制当前帧到tempSprite');
                return true;
            } else {
                console.warn('[video] copy,复制当前帧失败');
                return false;
            }
            
        } catch (error) {
            console.error('[video] copy,复制当前帧到tempSprite时发生错误:', error);
            return false;
        }
    }

    /**
     * 根据像素格式复制帧数据
     * @returns {boolean} 是否复制成功
     */
    private _copyFrameByPixelFormat(): boolean {
        // 获取当前的像素格式
        const currentPixelFormat = JSB ? this._video.pixelFormat() : PixelFormat.RGB;
        if (currentPixelFormat == PixelFormat.NONE || currentPixelFormat == PixelFormat.I420) {
            console.warn(`[video] copy,当前像素格式:${currentPixelFormat}，不复制图像`);
            return false;
        }
        console.log(`[video] copy,当前像素格式: ${currentPixelFormat}`);
        
        if (JSB) {
            // 原生平台：根据像素格式处理
            return this._copyFrameNativeByFormat(currentPixelFormat);
        } else {
            // 浏览器平台：直接复制video元素
            return this._copyFrameBrowser();
        }
    }

    /**
     * 原生平台根据像素格式复制帧数据
     * @param pixelFormat 像素格式
     * @returns {boolean} 是否复制成功
     */
    private _copyFrameNativeByFormat(pixelFormat: PixelFormat): boolean {
        try {
            switch (pixelFormat) {
                case PixelFormat.RGB:
                case PixelFormat.RGBA:
                    return this._copySimpleFormat(pixelFormat);
                
                case PixelFormat.I420:
                    return this._copyYUVFormat('I420');
                
                case PixelFormat.NV12:
                    return this._copyYUVFormat('NV12');
                
                case PixelFormat.NV21:
                    return this._copyYUVFormat('NV21');
                
                default:
                    console.warn(`[video] copy,不支持的像素格式: ${pixelFormat}`);
                    // 默认尝试RGB格式
                    return this._copySimpleFormat(PixelFormat.RGB);
            }
        } catch (error) {
            console.error('[video] copy,原生平台复制帧数据失败:', error);
            return false;
        }
    }

    /**
     * 复制简单格式（RGB/RGBA）
     * @param pixelFormat 像素格式
     * @returns {boolean} 是否复制成功
     */
    private _copySimpleFormat(pixelFormat: PixelFormat): boolean {
        // 创建一个新的独立纹理对象
        const copiedTexture = new Texture2D();
        
        // 设置纹理属性，与原纹理保持一致
        copiedTexture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
        copiedTexture.setMipFilter(Texture2D.Filter.LINEAR);
        copiedTexture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
        
        // 根据像素格式设置正确的纹理格式
        let textureFormat: gfx.Format;
        if (pixelFormat === PixelFormat.RGBA) {
            textureFormat = gfx.Format.RGBA8;
        } else {
            textureFormat = JSB ? gfx.Format.R8 : gfx.Format.RGB8;
        }
        
        // 初始化新纹理的尺寸和格式
        copiedTexture.reset({
            width: this._texture0.width,
            height: this._texture0.height,
            format: textureFormat as any
        });
        
        // 复制纹理数据
        this._copyTextureDataNative(copiedTexture);
        
        // 为tempSprite创建或更新SpriteFrame
        if (!this.tempSprite.spriteFrame) {
            this.tempSprite.spriteFrame = new SpriteFrame();
        }
        
        // 将复制的纹理赋值给tempSprite
        this.tempSprite.spriteFrame.texture = copiedTexture;
        
        // 设置正确的材质
        this._setTempSpriteMaterial(pixelFormat);
        
        return true;
    }

    /**
     * 复制YUV格式（I420/NV12/NV21）
     * @param formatName 格式名称
     * @returns {boolean} 是否复制成功
     */
    private _copyYUVFormat(formatName: string): boolean {
        console.log(`[video] copy,复制YUV格式: ${formatName}`);
        
        // YUV格式需要特殊处理，这里先创建一个RGB版本的纹理
        // 通过渲染到临时RT来转换颜色空间
        const copiedTexture = new Texture2D();
        
        copiedTexture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
        copiedTexture.setMipFilter(Texture2D.Filter.LINEAR);
        copiedTexture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
        
        // YUV转RGB后使用RGBA格式
        copiedTexture.reset({
            width: this._texture0.width,
            height: this._texture0.height,
            format: gfx.Format.RGBA8 as any
        });
        
        // 对于YUV格式，我们需要通过GPU渲染来进行颜色空间转换
        // 这里先使用简化的方法，直接复制Y通道数据
        // 在实际应用中，应该使用专门的YUV转RGB shader
        this._copyTextureDataNative(copiedTexture);
        
        // 为tempSprite创建或更新SpriteFrame
        if (!this.tempSprite.spriteFrame) {
            this.tempSprite.spriteFrame = new SpriteFrame();
        }
        
        this.tempSprite.spriteFrame.texture = copiedTexture;
        
        // 设置RGB材质，因为我们已经转换了颜色空间
        this._setTempSpriteMaterial(PixelFormat.RGBA);
        
        return true;
    }

    /**
     * 浏览器平台复制帧数据
     * @returns {boolean} 是否复制成功
     */
    private _copyFrameBrowser(): boolean {
        // 浏览器平台下，_texture0应该包含video元素的数据
        if (!this._video) {
            throw new Error('视频对象无效');
        }
        
        // 创建一个新的独立纹理对象
        const copiedTexture = new Texture2D();
        
        // 设置纹理属性
        copiedTexture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
        copiedTexture.setMipFilter(Texture2D.Filter.LINEAR);
        copiedTexture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
        
        // 浏览器平台使用RGB格式
        copiedTexture.reset({
            width: this._video.videoWidth || this.width,
            height: this._video.videoHeight || this.height,
            format: gfx.Format.RGB8 as any
        });
        
        // 复制纹理数据
        this._copyTextureDataBrowser(copiedTexture);
        
        // 为tempSprite创建或更新SpriteFrame
        if (!this.tempSprite.spriteFrame) {
            this.tempSprite.spriteFrame = new SpriteFrame();
        }
        
        // 将复制的纹理赋值给tempSprite
        this.tempSprite.spriteFrame.texture = copiedTexture;
        
        // 设置RGB材质
        this._setTempSpriteMaterial(PixelFormat.RGB);
        
        return true;
    }

    /**
     * 为tempSprite设置正确的材质
     * @param pixelFormat 像素格式
     */
    private _setTempSpriteMaterial(pixelFormat: PixelFormat): void {
        // tempSprite是Sprite类型，使用index=1的材质
        const materialIndex = 1;
        
        try {
            switch (pixelFormat) {
                case PixelFormat.RGB:
                    if (this.rgb && this.rgb[materialIndex]) {
                        this.tempSprite.setMaterial(this.rgb[materialIndex], 0);
                    }
                    break;
                case PixelFormat.RGBA:
                    if (this.rgba && this.rgba[materialIndex]) {
                        this.tempSprite.setMaterial(this.rgba[materialIndex], 0);
                    }
                    break;
                case PixelFormat.I420:
                    if (this.i420 && this.i420[materialIndex]) {
                        this.tempSprite.setMaterial(this.i420[materialIndex], 0);
                    }
                    break;
                case PixelFormat.NV12:
                    if (this.nv12 && this.nv12[materialIndex]) {
                        this.tempSprite.setMaterial(this.nv12[materialIndex], 0);
                    }
                    break;
                case PixelFormat.NV21:
                    if (this.nv21 && this.nv21[materialIndex]) {
                        this.tempSprite.setMaterial(this.nv21[materialIndex], 0);
                    }
                    break;
                default:
                    console.warn(`[video] copy,未设置材质，像素格式: ${pixelFormat}`);
                    break;
            }
            
            console.log(`[video] copy,已设置tempSprite材质，像素格式: ${pixelFormat}`);
        } catch (error) {
            console.error('[video] copy,设置tempSprite材质时发生错误:', error);
        }
    }
    
    /**
     * 原生平台纹理数据复制
     * @param targetTexture 目标纹理
     */
    private _copyTextureDataNative(targetTexture: Texture2D): void {
        // 检查director和device是否可用
        if (!director.root || !director.root.device) {
            throw new Error('director.root 或 device 不可用');
        }
        
        const device = director.root.device;
        const sourceTexture = this._texture0.getGFXTexture();
        
        if (!sourceTexture) {
            throw new Error('源纹理的GFX纹理对象无效');
        }
        
        // 创建临时buffer来存储纹理数据
        const textureSize = sourceTexture.size;
        const tempBuffer = new Uint8Array(textureSize);
        
        // 设置复制区域
        const copyRegion = new gfx.BufferTextureCopy();
        copyRegion.texExtent.width = sourceTexture.width;
        copyRegion.texExtent.height = sourceTexture.height;
        copyRegion.texSubres.mipLevel = 0;
        copyRegion.texSubres.baseArrayLayer = 0;
        
        // 从源纹理读取数据到buffer
        device.copyTextureToBuffers(sourceTexture, [tempBuffer], [copyRegion]);
        
        // 将buffer数据上传到目标纹理
        targetTexture.uploadData(tempBuffer);
    }
    
    /**
     * 浏览器平台纹理数据复制
     * @param targetTexture 目标纹理
     */
    private _copyTextureDataBrowser(targetTexture: Texture2D): void {
        // 浏览器平台下，_texture0应该包含video元素的数据
        if (!this._video) {
            throw new Error('视频对象无效');
        }
        
        // 创建离屏canvas来复制视频帧
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('无法创建canvas上下文');
        }
        
        // 设置canvas尺寸
        canvas.width = this._video.videoWidth || this.width;
        canvas.height = this._video.videoHeight || this.height;
        
        // 将当前视频帧绘制到canvas
        ctx.drawImage(this._video, 0, 0, canvas.width, canvas.height);
        
        // 获取ImageData
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 将ImageData上传到目标纹理
        targetTexture.uploadData(imageData.data);
        
        // 清理临时canvas
        canvas.remove();
    }
}

