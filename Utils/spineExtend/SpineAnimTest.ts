import { Button } from 'cc';
import { sp } from 'cc';
import { EditBox } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { SpineAnimUtil } from './SpineAnimUtil';
const { ccclass, property } = _decorator;

@ccclass('SpineAnimTest')
export class SpineAnimTest extends Component {

    @property(Node)
    spineNode: Node = null!;

    @property(EditBox)
    animName: EditBox = null!;

    @property(Button)
    button: Button = null!;

    animUtil: SpineAnimUtil = null!;

    start() {
        this.button.node.on(Button.EventType.CLICK, this.onClick, this);
        this.animUtil = this.spineNode.getComponent('SpineAnimUtil') as SpineAnimUtil;
        // this.skeleton.on
        // 监听点击事件
        this.spineNode.on(Node.EventType.TOUCH_END, this.onSpineClick, this);
    }

    onClick() {
        console.log(this.animName.string);
        
        
    }

    onSpineClick()
    {
        console.log('onSpineClick');
    }
}


