
import { _decorator, Component, Node } from 'cc';
import { EditorComponent } from './EditorComponent';
import { EditorButton } from './EditorButton';
const { ccclass, property } = _decorator;

@ccclass('EditorTest')
export class EditorTest extends EditorComponent {

    @property
    label2 = 'aaabbb000';

    @property(EditorButton)
    button: EditorButton = new EditorButton();

    start () {

    }
}