import { tips } from "db://assets/script/game/common/prompt/TipsManager";

export default class TipHelper {
    static showTip() {
        tips.confirm("魔盒升级中，尽请期待", () => {
        }, "确定", () => {
        }, "取消", false);
    }
}
