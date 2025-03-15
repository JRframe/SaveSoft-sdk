import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EditorButton')
export class EditorButton
{
    public labelName: string = "EditorButton";

    onClick():void
    {
        console.log(`[editor]button onClick`);
    }
}