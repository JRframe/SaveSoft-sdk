import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimationUtil')
export class AnimationUtil extends Component {

    onTriggerEvent: Function = null!;

    protected onDestroy(): void {
        this.onTriggerEvent = null!;
    }

    triggerEvent(event: string) {
        console.log(`triggerEvent: node: ${this.node.name}, event: ${event}`);
        if (this.onTriggerEvent) {
            this.onTriggerEvent(this.node, event);
        }
    }
}