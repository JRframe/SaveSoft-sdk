import * as cc from 'cc';
import { _decorator, Component, Node } from 'cc';
import {ATJSSDK} from "../sdk/ATJSSDK";
import {ATRewardedVideoSDK} from "../sdk/ATRewardedVideoTSSDK"

const { ccclass, property } = _decorator;

 
@ccclass('ATRewardRuntime')
export class ATRewardRuntime extends Component {

    static testMethod(){
        console.log("load reward111222");
        cc.log("load reward111222");
    }

    placementID() {
        if (cc.sys.os === cc.sys.OS.IOS) {
            return "b5b44a0f115321";
        } else if (cc.sys.os === cc.sys.OS.ANDROID) {
            return "b5b449fb3d89d7";
        }
    }

    start () {
        ATRewardedVideoSDK.setAdListener(this);
        // [3]
    }

    initAD(){
        console.log("[ad]initAD");

        ATJSSDK.setLogDebug(true);

        var customMap = {
            "appCustomKey1": "appCustomValue1",
            "appCustomKey2" : "appCustomValue2"
        };
        ATJSSDK.initCustomMap(customMap);

        //RewardedVideo PlacementID
        var customPlacementId = "";
        if (cc.sys.os === cc.sys.OS.IOS) {           
            customPlacementId = "b5b44a0f115321";
        } else if (cc.sys.os === cc.sys.OS.ANDROID) {
            customPlacementId = "b5b449fb3d89d7";
        }
        var placementCustomMap = {
            "placementCustomKey1": "placementCustomValue1",
            "placementCustomKey2" : "placementCustomValue2"
        };

        ATJSSDK.setPlacementCustomMap(customPlacementId, placementCustomMap);
        // ATJSSDK.setGDPRLevel(ATJSSDK.PERSONALIZED); 

        var GDPRLevel = ATJSSDK.getGDPRLevel();
        ATJSSDK.printLog("Current GDPR Level :" + GDPRLevel);


        if (cc.sys.os === cc.sys.OS.IOS) {           
            ATJSSDK.initSDK("a5b0e8491845b3", "7eae0567827cfe2b22874061763f30c9");
        } else if (cc.sys.os === cc.sys.OS.ANDROID) {
            ATJSSDK.initSDK("a5aa1f9deda26d", "4f7b9ac17decb9babec83aac078742c7");
        }

        
        ATJSSDK.getUserLocation(function (userLocation:any) {
             ATJSSDK.printLog("getUserLocation callback userLocation :" + userLocation);

            if (userLocation === ATJSSDK.kATUserLocationInEU) {
                if(ATJSSDK.getGDPRLevel() === ATJSSDK.UNKNOWN) {
                    ATJSSDK.showGDPRAuth();
                }
            }
        });
    }

    loadAD(){
        var setting: any = {};
        setting[ATRewardedVideoSDK.userIdKey] = "test_user_id";
        setting[ATRewardedVideoSDK.userDataKey] = "test_user_data";
        ATRewardedVideoSDK.loadRewardedVideo(this.placementID(), setting);
        
        printLog("loadAD", this.placementID(), "", "")
    }

    showAd(){
        ATRewardedVideoSDK.showAdInScenario(this.placementID(), "f5e54970dc84e6");

        printLog("showAd", this.placementID(), "", "")
    }

    //Callbacks
    

    isReady(){
        ATJSSDK.printLog("AnyThinkRewardedVideoDemo::checkReady()   " + (ATRewardedVideoSDK.hasAdReady(this.placementID()) ? "Ready" : "No"));

        var adStatusInfo = ATRewardedVideoSDK.checkAdStatus(this.placementID());
        ATJSSDK.printLog("AnyThinkRewardedVideoDemo::checkAdStatus()   " + adStatusInfo);
    }

    back(){
        cc.director.loadScene("MainScene");
    }

    //Callbacks
    onRewardedVideoAdLoaded (placementId:any) {
        printLog("onRewardedVideoAdLoaded", placementId, "", "")
    }

    onRewardedVideoAdFailed (placementId:any, errorInfo:any) {
        printLog("onRewardedVideoAdFailed", placementId, "", errorInfo)
    }

    onRewardedVideoAdPlayStart  (placementId:any, callbackInfo:any) {
        printLog("onRewardedVideoAdPlayStart", placementId, callbackInfo, "")
    }

    onRewardedVideoAdPlayEnd  (placementId:any, callbackInfo:any) {
        printLog("onRewardedVideoAdPlayEnd", placementId, callbackInfo, "")
    }

    onRewardedVideoAdPlayFailed (placementId:any, errorInfo:any, callbackInfo:any) {
        printLog("onRewardedVideoAdPlayFailed", placementId, callbackInfo, errorInfo)
    }

    onRewardedVideoAdClosed (placementId:any, callbackInfo:any) {
        printLog("onRewardedVideoAdClosed", placementId, callbackInfo, "")
    }

    onRewardedVideoAdPlayClicked  (placementId:any, callbackInfo:any) {
        printLog("onRewardedVideoAdPlayClicked", placementId, callbackInfo, "")
    }

    onReward (placementId:any, callbackInfo:any) {
        printLog("onReward", placementId, callbackInfo, "")
    }
    //Callbacks added v5.8.10
    onAdSourceBiddingAttempt (placementId:any, callbackInfo:any) {
        printLog("onAdSourceBiddingAttempt", placementId, callbackInfo, "")
    }
    
    onAdSourceBiddingFilled (placementId:any, callbackInfo:any) {
        printLog("onAdSourceBiddingFilled", placementId, "", "")
    }
    
    onAdSourceBiddingFail (placementId:any, errorInfo:any, callbackInfo:any) {
        printLog("onAdSourceBiddingFail", placementId, callbackInfo, errorInfo)
    }

    onAdSourceAttempt (placementId:any, callbackInfo:any) {
        printLog("onAdSourceAttempt", placementId, callbackInfo, "")
    }

    onAdSourceLoadFilled (placementId:any, callbackInfo:any) {
        printLog("onAdSourceLoadFilled", placementId, callbackInfo, "")
    }
    
    onAdSourceLoadFail (placementId:any, errorInfo:any, callbackInfo:any) {
        printLog("onAdSourceLoadFail", placementId, callbackInfo, errorInfo)
    }

    onRewardedVideoAdAgainPlayStart (placementId:any, callbackInfo:any) {
        printLog("onRewardedVideoAdAgainPlayStart", placementId, callbackInfo, "")
    }

    onRewardedVideoAdAgainPlayEnd (placementId:any, callbackInfo:any) {
        printLog("onRewardedVideoAdAgainPlayEnd", placementId, callbackInfo, "")
    }

    onRewardedVideoAdAgainPlayFailed (placementId:any, errorInfo:any, callbackInfo:any) {
        printLog("onRewardedVideoAdAgainPlayFailed", placementId, callbackInfo, errorInfo)
    }

    onRewardedVideoAdAgainPlayClicked (placementId:any, callbackInfo:any) {
        printLog("onRewardedVideoAdAgainPlayClicked", placementId, callbackInfo, "")
    }

    onAgainReward(placementId:any, callbackInfo:any) {
        printLog("onAgainReward", placementId, callbackInfo, "")
    }
}


window["ATRewardSceneScript"] = ATRewardedVideoSDK;

let printLog = function(methodName:any, placementId:any, callbackInfo:any, errorInfo:any) {
    ATJSSDK.printLogWithParams("[ad]", methodName, placementId, callbackInfo, errorInfo)
}
