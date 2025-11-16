export interface IMapLayerData {
    /** 当前引用是否过期，当地图图层内部的地图数组引用更新时，此项会变为 `true` */
    expired: boolean;
    /** 地图图块数组，是对内部存储的直接引用 */
    array: Uint32Array;
}

export interface IMapLayerHooks {
    /**
     * 当钩子准备完毕时执行，会自动分析依赖，并把依赖实例作为参数传入，遵循依赖列表的顺序
     * @param dependencies 依赖列表
     */
    awake(): void;

    /**
     * 当拓展被移除之前执行，可以用来清理相关内容
     */
    destroy(): void;

    /**
     * 当地图大小发生变化时执行
     * @param controller 拓展控制器
     * @param width 地图宽度
     * @param height 地图高度
     */
    onResize(
        controller: IMapLayerExtendsController,
        width: number,
        height: number
    ): void;

    /**
     * 当更新某个区域的图块时执行
     * @param controller 拓展控制器
     * @param x 更新区域左上角横坐标
     * @param y 更新区域左上角纵坐标
     * @param width 更新区域宽度
     * @param height 更新区域高度
     */
    onUpdateArea(
        controller: IMapLayerExtendsController,
        x: number,
        y: number,
        width: number,
        height: number
    ): void;

    /**
     * 当更新某个点的图块时执行，如果设置的图块与原先一样，则不会触发此方法
     * @param controller 拓展控制器
     * @param block 更新为的图块数字
     * @param x 更新点横坐标
     * @param y 更新点纵坐标
     */
    onUpdateBlock(
        controller: IMapLayerExtendsController,
        block: number,
        x: number,
        y: number
    ): void;
}

export interface IMapLayerExtends extends Partial<IMapLayerHooks> {
    /** 这个拓展对象的标识符 */
    readonly id: string;
}

export interface IMapLayerExtendsController {
    /** 当前图层拓展是否已经被加载 */
    readonly loaded: boolean;
    /** 拓展所属的图层对象 */
    readonly layer: IMapLayer;

    /**
     * 加载此图层拓展，如果拓展依赖了其他拓展并且已经添加，将会自动加载其他拓展
     */
    load(): void;

    /**
     * 获取地图数据，是对内部存储的直接引用
     */
    getMapData(): Readonly<IMapLayerData>;

    /**
     * 结束此拓展的生命周期，释放相关资源
     */
    unload(): void;
}

export interface IMapLayer {
    /** 地图宽度 */
    readonly width: number;
    /** 地图高度 */
    readonly height: number;
    /** 地图是否全部空白，此值具有保守性，即如果其为 `true`，则地图一定空白，但是如果其为 `false`，那么地图也有可能空白 */
    readonly empty: boolean;

    /**
     * 调整地图尺寸，如果尺寸变大，那么会补零，如果尺寸变小，那么会将当前数组裁剪
     * @param width 地图宽度
     * @param height 地图高度
     */
    resize(width: number, height: number): void;

    /**
     * 调整地图尺寸，但是将地图全部重置为零，不保留原地图数据
     * @param width 地图宽度
     * @param height 地图高度
     */
    resize2(width: number, height: number): void;

    /**
     * 设置某一点的图块
     * @param block 图块数字
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    setBlock(block: number, x: number, y: number): void;

    /**
     * 获取指定点的图块
     * @param x 图块横坐标
     * @param y 图块纵坐标
     * @returns 指定点的图块，如果没有图块，返回 0，如果不在地图上，返回 -1
     */
    getBlock(x: number, y: number): number;

    /**
     * 设置地图图块
     * @param array 地图图块数组
     * @param x 数组第一项代表的横坐标
     * @param y 数组第一项代表的纵坐标
     * @param width 传入数组所表示的矩形范围的宽度
     */
    putMapData(array: Uint32Array, x: number, y: number, width: number): void;

    /**
     * 获取整个地图的地图数组，是对内部地图数组的拷贝，并不能通过修改它来直接修改地图内容
     */
    getMapData(): Uint32Array;
    /**
     * 获取地图指定区域的地图数组，是对内部地图数组的拷贝，并不能通过修改它来直接修改地图内容
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param width 获取区域的宽度
     * @param height 获取区域的高度
     */
    getMapData(
        x: number,
        y: number,
        width: number,
        height: number
    ): Uint32Array;

    /**
     * 添加图层拓展，使用一系列钩子与图层本身通讯。不同图层拓展没有顺序关系。
     * @param ex 图层拓展对象
     * @returns 图层拓展控制对象，可以通过它来控制拓展的生命周期，也可以用于获取图层内的一些数据
     */
    addExtends(ex: IMapLayerExtends): IMapLayerExtendsController;

    /**
     * 移除指定的图层拓展对象
     * @param ex 要移除的图层拓展对象，也可以填拓展对象的标识符
     */
    removeExtends(ex: IMapLayerExtends | string): void;
}
