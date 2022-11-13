// 这里包含所有插件导出的函数及变量声明，声明的函数会在类型标注中标注到core上

interface PluginDeclaration {
    /**
     * 添加函数  例：添加弹出文字，像这个就可以使用core.addPop或core.plugin.addPop调用
     * @param px 弹出的横坐标
     * @param py 弹出的纵坐标
     * @param value 弹出的文字
     */
    addPop(px: number, py: number, value: string): void;

    /** 添加变量  例：所有的正在弹出的文字，像这个就可以使用core.plugin.pop获取 */
    pop: any[];
}

type Forward<T> = {
    [K in keyof T as T[K] extends Function
        ? K extends `_${string}`
            ? never
            : K
        : never]: T[K];
};

type ForwardKeys<T> = keyof Forward<T>;
