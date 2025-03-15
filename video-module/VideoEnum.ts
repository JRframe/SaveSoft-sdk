
export interface IVideoParam{
    videoid:number,
    resourceType:EVideoType,    //播放类型 本地还是远程端
    src :string,
    controls :boolean
    progress :boolean
    progressInControlMode :boolean
    autoplay :boolean
    playBtn :boolean
    underGame :boolean //wx专属
    loop :boolean
    width :number
    height :number
    objectFit :string
    poster :string,
    posterBundle:string,
    readyToPlayCallback?: Function
    stopedCallback?: Function
    completeCallback?: Function
    callThisArgs?: any
}

export enum EVideoType{
    Remote = 0,
    Local = 1,
}