import { tips } from "db://assets/script/game/common/prompt/TipsManager";
import { oops } from "db://oops-framework/core/Oops";

export default class TipHelper {
    /** 显示开发中提示 */
    static showDevTip() {
        tips.confirm("魔盒升级中，尽请期待", () => {
        }, "确定", () => {
        }, "取消", false);
        oops.gui.waitClose();
    }
}
