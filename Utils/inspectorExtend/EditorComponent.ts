import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EditorComponent')
export class EditorComponent extends Component {

    @property
    label = '';
}