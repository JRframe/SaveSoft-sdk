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

    @property(Boolean)
    clickSwitch: boolean = false;

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

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
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

    /** 设置下一个动画 */
    public setNextAnim(): void {
        this.index++;
        if (this.index >= this.anims.length) {
            this.index = 0;
        }
        this.setAnim(this.index, true);
    }

    /* 点击事件 */
    private onClick() {
        if (!this.clickSwitch) return;
        this.setNextAnim();
    }

    /* 获取skeleton的动画名称 */
    private get getSkeletonAnimNames(): string[] {
        if (!this.skeleton) return [];
        const animsEnum = this.skeleton.skeletonData?.getAnimsEnum()!;
        if (!animsEnum) return [];
        // 遍历animsEnum，获取动画名称
        const animNames: string[] = [];
        for (const key in animsEnum) {
            if (key == "<None>") continue;
            animNames.push(key);
        }
        return animNames;
    }

    /* 获取动画名称, 如果anims为空，则从skeleton中获取 */
    public get getAnimNames(): string[] {
        if (this.anims.length > 0) return this.anims;
        this.anims = this.getSkeletonAnimNames;
        return this.anims;
    }
}