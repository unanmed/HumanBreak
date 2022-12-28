// 这里包含所有插件导出的函数及变量声明，声明的函数会在类型标注中标注到core上

type Ref<T> = {
    value: T;
};

type DragFn = (x: number, y: number, e: MouseEvent | TouchEvent) => void;

type CanParseCss = keyof {
    [P in keyof CSSStyleDeclaration as CSSStyleDeclaration[P] extends string
        ? P extends string
            ? P
            : never
        : never]: CSSStyleDeclaration[P];
};

interface PluginDeclaration extends PluginUtils {
    /**
     * 添加函数  例：添加弹出文字，像这个就可以使用core.addPop或core.plugin.addPop调用
     * @param px 弹出的横坐标
     * @param py 弹出的纵坐标
     * @param value 弹出的文字
     */
    addPop(px: number, py: number, value: string): void;

    /** 添加变量  例：所有的正在弹出的文字，像这个就可以使用core.plugin.pop获取 */
    pop: any[];

    /** 怪物手册的怪物详细信息的初始位置 */
    bookDetailPos: number;

    /** 怪物手册详细信息展示的怪物 */
    bookDetailEnemy: DetailedEnemy;

    /** ui是否使用渐变 */
    readonly transition: Ref<boolean>;

    /** 手册是否打开 */
    readonly bookOpened: Ref<boolean>;

    /** 道具栏是否打开 */
    readonly toolOpened: Ref<boolean>;

    /** 装备栏是否打开 */
    readonly equipOpened: Ref<boolean>;

    /** 是否显示状态栏 */
    readonly showStatusBar: Ref<boolean>;

    /** 设置界面是否打开 */
    readonly settingsOpened: Ref<boolean>;

    /** ui栈 */
    readonly uiStack: Ref<Component[]>;

    /** 是否是移动设备 */
    readonly isMobile: boolean;

    /** 状态栏信息，取反后刷新状态栏 */
    readonly statusBarStatus: Ref<boolean>;

    /** 检查标记的怪物，取反后更新显示信息 */
    readonly checkMarkedStatus: Ref<boolean>;

    /**
     * 向一个元素添加拖拽事件
     * @param ele 目标元素
     * @param fn 推拽时触发的函数，传入x y和鼠标事件或点击事件
     * @param ondown 鼠标按下时执行的函数
     * @param global 是否全局拖拽，即拖拽后鼠标或手指离开元素后是否依然视为正在拖拽
     */
    useDrag(
        ele: HTMLElement,
        fn: DragFn,
        ondown?: DragFn,
        onUp?: (e: MouseEvent | TouchEvent) => void,
        global: boolean = false
    ): void;

    /**
     * 去除一个全局拖拽函数
     * @param fn 要去除的函数
     */
    cancelGlobalDrag(fn: DragFn): void;

    /**
     * 当触发滚轮时执行函数
     * @param ele 目标元素
     * @param fn 当滚轮触发时执行的函数
     */
    useWheel(
        ele: HTMLElement,
        fn: (x: number, y: number, z: number, e: WheelEvent) => void
    ): void;

    /**
     * 当鼠标或手指松开时执行函数
     * @param ele 目标元素
     * @param fn 当鼠标或手指松开时执行的函数
     */
    useUp(ele: HTMLElement, fn: DragFn): void;

    /**
     * 添加一个动画
     * @param fn 要添加的函数
     */
    addAnimate(fn: (time: number) => void);

    /**
     * 移除一个动画
     * @param fn 要移除的函数
     */
    removeAnimate(fn: (time: number) => void);

    /**
     * 检查被标记怪物的状态，是否需要更新
     */
    checkMarkedEnemy();
}

interface PluginUtils {
    /**
     * 判定一个值是否不是undefined或null
     * @param value 要判断的值
     */
    has<T>(value: T): value is NonNullable<T>;

    /**
     * 根据伤害大小获取颜色
     * @param damage 伤害大小
     */
    getDamageColor(damage: number): string;

    /**
     * 解析css字符串为CSSStyleDeclaration对象
     * @param css 要解析的css字符串
     */
    parseCss(css: string): Partial<Record<CanParseCss, string>>;
}

type Forward<T> = {
    [K in keyof T as T[K] extends Function
        ? K extends `_${string}`
            ? never
            : K
        : never]: T[K];
};

type ForwardKeys<T> = keyof Forward<T>;
