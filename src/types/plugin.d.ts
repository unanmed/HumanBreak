// 这里包含所有插件导出的函数及变量声明，声明的函数会在类型标注中标注到core上

type Ref<T> = {
    value: T;
};

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

    /** 手册是否打开 */
    readonly bookOpened: Ref<boolean>;

    /** 手册详细信息 */
    readonly bookDetail: Ref<boolean>;

    /** ui栈 */
    readonly uiStack: Ref<Component[]>;

    /**
     * 向一个元素添加拖拽事件
     * @param ele 目标元素
     * @param fn 推拽时触发的函数，传入x y和鼠标事件或点击事件
     * @param ondown 鼠标按下时执行的函数
     * @param global 是否全局拖拽，即拖拽后鼠标或手指离开元素后是否依然视为正在拖拽
     */
    useDrag(
        ele: HTMLElement,
        fn: (x: number, y: number, e: MouseEvent | TouchEvent) => void,
        ondown?: (x: number, y: number, e: MouseEvent | TouchEvent) => void,
        global: boolean = false
    ): void;

    /**
     * 当触发滚轮时执行函数
     * @param ele 目标元素
     * @param fn 当滚轮触发时执行的函数
     */
    useWheel(
        ele: HTMLElement,
        fn: (x: number, y: number, z: number, e: WheelEvent) => void
    ): void;
}

type Forward<T> = {
    [K in keyof T as T[K] extends Function
        ? K extends `_${string}`
            ? never
            : K
        : never]: T[K];
};

type ForwardKeys<T> = keyof Forward<T>;
