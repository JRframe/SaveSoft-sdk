import { TipsNoticeUtil } from "../../../game/gameplay/Utility/TipsNoticeUtil";

export default class TipHelper {
    /** 显示开发中提示 */
    static showDevTip() {
        // tips.confirm("魔盒升级中，尽请期待", () => {
        // }, "确定", () => {
        // }, "取消", false);
        // oops.gui.waitClose();
        TipsNoticeUtil.PlayNotice("魔盒升级中，敬请期待！");
    }
}
