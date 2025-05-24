import { EventTouch } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EventUtil')
export class EventUtil extends Component {

    onClick: Function = null!;

    preventSwallow: boolean = true;

    start() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch): void {
        // console.log("[zc] UIZhaoCha, Stage onMouseDown");
        event.preventSwallow = this.preventSwallow; // 阻止事件被吞噬
        this.onClick?.(event);
    }

    onTouchMove(event: EventTouch): void {
        event.preventSwallow = this.preventSwallow; // 阻止事件被吞噬
    }

    onTouchEnd(event: EventTouch): void {
        event.preventSwallow = this.preventSwallow; // 阻止事件被吞噬
    }
}


