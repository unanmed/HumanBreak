//#region 脏标记

export interface IDirtyMarker<T> {
    /**
     * 标记为脏，即进行了一次更新
     * @param data 传递给追踪器的数据
     */
    dirty(data: T): void;
}

export interface IDirtyMark {}

export interface IDirtyTracker<T> {
    /**
     * 对状态进行标记
     */
    mark(): IDirtyMark;

    /**
     * 取消指定标记符号
     * @param mark 标记符号
     */
    unmark(mark: IDirtyMark): void;

    /**
     * 从指定标记符号开始，数据是否发生了变动
     * @param mark 标记符号
     */
    dirtySince(mark: IDirtyMark): T;

    /**
     * 当前追踪器是否包含指定标记符号
     * @param symbol 标记符号
     */
    hasMark(symbol: IDirtyMark): boolean;
}

//#endregion

//#region 钩子

export interface IHookObject<
    H extends IHookBase,
    C extends IHookController<H>
> {
    /** 钩子对象 */
    readonly hook: Partial<H>;
    /** 钩子控制器 */
    readonly controller: C;
}

export interface IHookController<H extends IHookBase = IHookBase> {
    /** 控制器的钩子对象 */
    readonly hook: Partial<H>;

    /**
     * 加载此控制器对应的钩子对象
     */
    load(): void;

    /**
     * 卸载此控制器对应的钩子对象，之后此钩子将不会再被触发
     */
    unload(): void;
}

export interface IHookBase {
    /**
     * 加载此钩子对象
     * @param controller 钩子控制器对象
     */
    awake(controller: IHookController<this>): void;

    /**
     * 摧毁此钩子对象
     * @param controller 钩子控制器对象
     */
    destroy(controller: IHookController<this>): void;
}

export interface IHookable<
    H extends IHookBase = IHookBase,
    C extends IHookController<H> = IHookController<H>
> {
    /**
     * 添加钩子对象，返回控制该钩子对象的控制器
     * @param hook 钩子对象
     */
    addHook(hook: Partial<H>): C;

    /**
     * 加载指定的钩子对象
     * @param hook 钩子对象
     */
    loadHook(hook: Partial<H>): void;

    /**
     * 移除钩子对象，会调用钩子对象的 `destroy` 方法
     * @param hook 钩子对象
     */
    removeHook(hook: Partial<H>): void;

    /**
     * 传入钩子控制器，移除对应的钩子对象
     * @param hook 钩子控制器
     */
    removeHookByController(hook: C): void;

    /**
     * 遍历每个钩子，执行顺序不固定
     * @param fn 对每个钩子执行的函数
     * @returns 每个钩子的返回值组成的数组，顺序不固定
     */
    forEachHook<T>(fn: (hook: Partial<H>, controller: C) => T): T[];
}

//#endregion
