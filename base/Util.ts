export class Util{
    static shuffleArray<T>(array: T[]): T[] {
        const newArray = [...array]; // 创建副本以避免修改原数组
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // 交换元素
        }
        return newArray;
    }
}