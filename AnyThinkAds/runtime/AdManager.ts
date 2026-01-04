import { _decorator, Component, Node } from 'cc';
import { ATRewardedVideoSDK } from '../sdk/ATRewardedVideoTSSDK';
const { ccclass, property } = _decorator;
import * as cc from 'cc';
import { ATJSSDK } from '../sdk/ATJSSDK';
import { oops } from 'db://oops-framework/core/Oops';

/** 广告事件 */
export enum AdEvent {
    /** 请求播放广告 */
    PlayAd = 'PlayAd_AdEvent',
    /** 广告加载失败 */
    AdLoadFail = 'AdLoadFail_AdEvent',
    /** 广告开始播放 */
    AdBeginPlay = 'AdBeginPlay_AdEvent',
    /** 广告播放结束，播放到最后一秒了 */
    AdPlayEnd = 'AdPlayEnd_AdEvent',
    /** 广告请求播放，没有成功 */
    AdRequestPlayFail = 'AdRequestPlayFail_AdEvent',
    /** 广告关闭，退出观看广告 */
    AdClosed = 'AdClosed_AdEvent',
    /** 广告满足领奖条件了 */
    AdOnReward = 'AdOnReward_AdEvent',
}

/**
 * 广告相关管理器
 */
@ccclass('AdManager')
export class AdManager {
    private static instance: AdManager;
    public static get Inst(): AdManager {
        if (this.instance == null) {
            this.instance = new AdManager();
        }
        return this.instance;
    }

    private _canGetReward: boolean = false;

    private _SuccessGetReward: () => void = () => {};
    private _FailGetReward: () => void = () => {};
    private placementID() {
        if (cc.sys.os === cc.sys.OS.IOS) {
            return 'b5b44a0f115321';
        } else if (cc.sys.os === cc.sys.OS.ANDROID) {
            return 'b5b449fb3d89d7';
        }
    }

    //Callbacks
    private onRewardedVideoAdLoaded(placementId: any) {
        console.error('广告进行预加载，多准备几个视频，等用户需要看视频的时候，直接播放');
        oops.message.dispatchEvent(AdEvent.AdBeginPlay);
    }

    private onRewardedVideoAdFailed(placementId: any, errorInfo: any) {
        console.error('广告进行预加载，失败了，准备失败');
        oops.message.dispatchEvent(AdEvent.AdLoadFail);
    }

    private onRewardedVideoAdPlayStart(placementId: any, callbackInfo: any) {
        console.error('广告开始播放');
        this._canGetReward = false;
        oops.message.dispatchEvent(AdEvent.AdBeginPlay);
    }

    private onRewardedVideoAdPlayEnd(placementId: any, callbackInfo: any) {
        console.error('广告全都的看完了,能领奖励：' + this._canGetReward);
        oops.message.dispatchEvent(AdEvent.AdPlayEnd);
        if (this._canGetReward) {
            if (this._SuccessGetReward) {
                this._SuccessGetReward();
            }
        } else {
            if (this._FailGetReward) this._FailGetReward();
        }
        this._canGetReward = false;
    }

    private onRewardedVideoAdPlayFailed(placementId: any, errorInfo: any, callbackInfo: any) {
        console.error('广告请求播放，播放失败');
        oops.message.dispatchEvent(AdEvent.AdRequestPlayFail);
    }

    private onRewardedVideoAdClosed(placementId: any, callbackInfo: any) {
        console.error('广告被关闭');
        oops.message.dispatchEvent(AdEvent.AdClosed);
    }

    private onRewardedVideoAdPlayClicked(placementId: any, callbackInfo: any) {
        // console.error('广告 中再次点击广告');
    }

    private onReward(placementId: any, callbackInfo: any) {
        console.error('广告 已经满足领奖条件了');
        this._canGetReward = true;
    }
    //Callbacks added v5.8.10
    private onAdSourceBiddingAttempt(placementId: any, callbackInfo: any) {
        console.error('onAdSourceBiddingAttempt', placementId, callbackInfo, '');
    }

    private onAdSourceBiddingFilled(placementId: any, callbackInfo: any) {
        console.error('onAdSourceBiddingFilled', placementId, '', '');
    }

    private onAdSourceBiddingFail(placementId: any, errorInfo: any, callbackInfo: any) {
        console.error('onAdSourceBiddingFail', placementId, callbackInfo, errorInfo);
    }

    private onAdSourceAttempt(placementId: any, callbackInfo: any) {
        console.error('onAdSourceAttempt', placementId, callbackInfo, '');
    }

    private onAdSourceLoadFilled(placementId: any, callbackInfo: any) {
        console.error('onAdSourceLoadFilled', placementId, callbackInfo, '');
    }

    private onAdSourceLoadFail(placementId: any, errorInfo: any, callbackInfo: any) {
        console.error('onAdSourceLoadFail', placementId, callbackInfo, errorInfo);
    }

    private onRewardedVideoAdAgainPlayStart(placementId: any, callbackInfo: any) {
        console.error('onRewardedVideoAdAgainPlayStart', placementId, callbackInfo, '');
    }

    private onRewardedVideoAdAgainPlayEnd(placementId: any, callbackInfo: any) {
        console.error('onRewardedVideoAdAgainPlayEnd', placementId, callbackInfo, '');
    }

    private onRewardedVideoAdAgainPlayFailed(placementId: any, errorInfo: any, callbackInfo: any) {
        console.error('onRewardedVideoAdAgainPlayFailed', placementId, callbackInfo, errorInfo);
    }

    private onRewardedVideoAdAgainPlayClicked(placementId: any, callbackInfo: any) {
        console.error('onRewardedVideoAdAgainPlayClicked', placementId, callbackInfo, '');
    }

    private onAgainReward(placementId: any, callbackInfo: any) {
        console.error('onAgainReward', placementId, callbackInfo, '');
    }

    public initAD() {
        ATRewardedVideoSDK.setAdListener(this);
        ATJSSDK.setLogDebug(true);

        var customMap = {
            appCustomKey1: 'appCustomValue1',
            appCustomKey2: 'appCustomValue2',
        };
        ATJSSDK.initCustomMap(customMap);

        //RewardedVideo PlacementID
        var customPlacementId = '';
        if (cc.sys.os === cc.sys.OS.IOS) {
            customPlacementId = 'b5b44a0f115321';
        } else if (cc.sys.os === cc.sys.OS.ANDROID) {
            customPlacementId = 'b5b449fb3d89d7';
        }
        var placementCustomMap = {
            placementCustomKey1: 'placementCustomValue1',
            placementCustomKey2: 'placementCustomValue2',
        };

        ATJSSDK.setPlacementCustomMap(customPlacementId, placementCustomMap);

        var GDPRLevel = ATJSSDK.getGDPRLevel();
        console.error('Current GDPR Level :' + GDPRLevel);

        if (cc.sys.os === cc.sys.OS.IOS) {
            ATJSSDK.initSDK('a5b0e8491845b3', '7eae0567827cfe2b22874061763f30c9');
        } else if (cc.sys.os === cc.sys.OS.ANDROID) {
            ATJSSDK.initSDK('a5aa1f9deda26d', '4f7b9ac17decb9babec83aac078742c7');
        }

        ATJSSDK.getUserLocation(function (userLocation: any) {
            console.error('getUserLocation callback userLocation :' + userLocation);

            if (userLocation === ATJSSDK.kATUserLocationInEU) {
                if (ATJSSDK.getGDPRLevel() === ATJSSDK.UNKNOWN) {
                    ATJSSDK.showGDPRAuth();
                }
            }
        });
    }

    public loadAD() {
        var setting: any = {};
        setting[ATRewardedVideoSDK.userIdKey] = 'test_user_id';
        setting[ATRewardedVideoSDK.userDataKey] = 'test_user_data';
        ATRewardedVideoSDK.loadRewardedVideo(this.placementID(), setting);

        console.error('loadAD', this.placementID(), '', '');
    }

    public showAd(successGetRewardCb: () => void, failGetRewardCb: () => void = null!) {
        this._SuccessGetReward = successGetRewardCb;
        this._FailGetReward = failGetRewardCb;
        oops.message.dispatchEvent(AdEvent.PlayAd);
        ATRewardedVideoSDK.showAdInScenario(this.placementID(), 'f5e54970dc84e6');
        console.error('广告 请求播放一个广告，先有个全屏遮罩，2秒后自动关闭或者监听 广告开始播放事件也可以关闭 showAd');
    }

    public isReady() {
        console.error('AnyThinkRewardedVideoDemo::checkReady() ' + (ATRewardedVideoSDK.hasAdReady(this.placementID()) ? 'Ready' : 'No'));

        var adStatusInfo = ATRewardedVideoSDK.checkAdStatus(this.placementID());
        console.error('AnyThinkRewardedVideoDemo::checkAdStatus()   ' + adStatusInfo);
    }
}
