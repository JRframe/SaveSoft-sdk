    import { sp } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SpineAnimUtil')
export class SpineAnimUtil extends Component {

    @property({ type: [String] })
    anims: string[] = [];

    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null!;

    /* 动画索引 */
    @property
    index: number = 0;
    /* 轨道 */
    @property
    track: number = 0;
    /* 打印日志 */
    @property
    printLog: boolean = true;

    start() {
        const skeleton = this.getComponent(sp.Skeleton);
        if (skeleton) {
            this.skeleton = skeleton;
        } else {
            console.warn('SpineAnimTUtil: 未找到 sp.Skeleton 组件');
            return;
        }
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    public setAnimByName(animName: string, loop: boolean = true) {
        if (!this.skeleton) return;
        if (this.printLog) {
            console.log(`SpineAnimUtil, ${this.node.name}, animName:${animName}, index:${this.index}, 循环: ${loop}`);
        }
        this.skeleton.setAnimation(this.track, animName, loop);
    }

    public setAnim(index: number, loop: boolean = true) {
        // 判断index是否超出anims范围
        if (index < 0 || index >= this.anims.length) {
            console.warn('SpineAnimTUtil: 动画索引超出范围');
            return;
        }
        this.setAnimByName(this.anims[index], loop);
    }

    /* 设置下一个动画 */
    private setNextAnim() {
        this.index++;
        if (this.index >= this.anims.length) {
            this.index = 0;
        }
        this.setAnim(this.index, true);
    }

    /* 点击事件 */
    onClick() {
        this.setNextAnim();
    }
}