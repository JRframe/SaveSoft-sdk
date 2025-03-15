import { DEBUG } from "cc/env";

export class Global{
    static checkInternal(className:string[]):boolean{
        if(DEBUG){
            // 获取调用栈
            const stack = new Error().stack;
            for(let i=0;i<className.length;i++){
                if(stack?.includes(className[i])){
                    throw new Error('非法构造 InternalService');
                }
            }
        }
        return true;
    }
}


