import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimationUtil')
export class AnimationUtil extends Component {

    onTriggerEvent: Function = null!;

    triggerEvent(event: string) {
        // console.log(`triggerEvent: ${event}`);
        if (this.onTriggerEvent) {
            this.onTriggerEvent(event);
        }
    }
}