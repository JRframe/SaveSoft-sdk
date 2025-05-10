import { EventMouse } from 'cc';
import { EventTouch } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EventUtil')
export class EventUtil extends Component {

    onClick: Function = null!;

    start() {
        this.node.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    onMouseDown(event: EventMouse): void {
        // console.log("[zc] UIZhaoCha, Stage onMouseDown");
        this.onClick?.(event);
    }
}


