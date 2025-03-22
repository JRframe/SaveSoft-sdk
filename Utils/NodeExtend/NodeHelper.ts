import { Node, Component } from "cc";

export class NodeHelper {
    /** 获取父节点上的组件 */
    public static getComponentInParent<T extends Component>(node: Node, component: Constructor<T>): T | null {
        while (node) {
            let comp = node.getComponent(component);
            if (comp) return comp;
            node = node.parent!;
        }
        return null;
    }
}
