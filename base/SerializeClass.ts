import { parse } from "path";
import "reflect-metadata";
export const SerializeMetaKey = "SerializeData";

//序列化装饰器
export function SerializeData(name?: string) {
    return (target: Object, property: string): void => {
        Reflect.defineMetadata(SerializeMetaKey, name || property, target, property);
    };
}
// 类注册装饰器
const registeredClasses: Record<string, new () => any> = {};

export function RegisterClass(name: string) {
    return function (constructor: new () => any) {
        registeredClasses[name] = constructor;
    };
}
// 创建实例函数
export function createInstance(className: string): any {
    const ClassConstructor = registeredClasses[className];
    if (!ClassConstructor) {
        throw new Error(`Class ${className} not found`);
    }
    return new ClassConstructor();
}

export class SerializeClass{
    [key: string]: any;

    @SerializeData()
    public __className:string = "SerializeClass";
    //序列化
    toJSON(): any {
        let obj: { [key: string]: any } = {};
        let o = Object.keys(this);
        Object.keys(this).forEach( property => {
            const serializeKey = Reflect.getMetadata(SerializeMetaKey, this, property);
            if (serializeKey) {
                const value = this[property];

                if (value instanceof SerializeClass) {
                    obj[serializeKey] = value.toJSON();
                } else {
                    if(value instanceof Map){

                        const serializedMap: { [key: string]: any } = {};

                        value.forEach((mapValue, mapKey) => {
                            /**
                             * 检查一下是否字符串和number 为key 如果不是的话 直接报错 不支持
                             *
                             */
                            if(!this.checkMapSupportKey(mapKey)){
                                throw new Error("Map key must be string or number");
                            }
                            // 如果 Map 的 value 是 SerializeClass 实例，递归序列化
                            if (mapValue instanceof SerializeClass) {
                                serializedMap[mapKey.toString()] = mapValue.toJSON();
                            }
                            // 如果是普通值，直接存储
                            else {
                                serializedMap[mapKey.toString()] = mapValue;
                            }
                        });

                        obj[serializeKey] = serializedMap;
                    }
                    else{
                        obj[serializeKey] = this[property];
                    }

                }
            }
        });
        return obj;
    }
    //反序列化
    fromJSON(obj:any, root:any) {

        obj && Object.keys(this).forEach( property => {
            const serialize = Reflect.getMetadata(SerializeMetaKey, this, property);
            if (serialize) {
                if (this[property] instanceof SerializeClass) {
                    this[property].fromJSON(obj[serialize], root);
                } else {
                    if(this[property] instanceof Map){
                        let v = this[property]
                        type IsKeyNumber = typeof v extends Map<number, any> ? true : false;
                        // 如果是 Map，遍历并检查每个 value 是否需要反序列化
                        const newMap = new Map();
                        const rawMapData = obj[serialize] || {};

                        Object.entries(rawMapData).forEach(([key, value]) => {
                            let keyString = key;
                            let keyNumber = parseInt(key);
                            let transformKey = this.checkIsNumberKey(key) ? keyNumber : keyString;

                            if (value && typeof value === 'object' && "__className" in value) {
                                // 如果是可序列化的类，递归反序列化
                                const nestedInstance = createInstance(value.__className as string);
                                //const nestedInstance = root.productClassByName(value.__className as string);
                                nestedInstance.fromJSON(value);
                                newMap.set(transformKey, nestedInstance);
                            } else {
                                // 否则直接赋值
                                newMap.set(transformKey, value);
                            }
                        });
        
                        this[property] = newMap;
                    }
                    else{
                        this[property] = obj[serialize];
                    }
                }
            }
        });
    }

    private checkIsNumberKey(str:string):boolean{
        const num = parseInt(str, 10);
        return isNaN(num) ? false : true;
    }

    private checkMapSupportKey(key:any):boolean{   
        if(typeof key === 'string' || typeof key === 'number'){
            return true;
        }
        return false;
        
    }
}