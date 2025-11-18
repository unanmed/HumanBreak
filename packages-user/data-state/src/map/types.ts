import { IHookable, IHookBase, IHookController } from '@motajs/common';

export interface IMapLayerData {
    /** 当前引用是否过期，当地图图层内部的地图数组引用更新时，此项会变为 `true` */
    expired: boolean;
    /** 地图图块数组，是对内部存储的直接引用 */
    array: Uint32Array;
}

export interface IMapLayerHooks extends IHookBase {
    /**
     * 当地图大小发生变化时执行，如果调用了地图的 `resize` 方法，但是地图大小没变，则不会触发
     * @param controller 拓展控制器
     * @param width 地图宽度
     * @param height 地图高度
     */
    onResize(
        controller: IMapLayerHookController,
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
        controller: IMapLayerHookController,
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
        controller: IMapLayerHookController,
        block: number,
        x: number,
        y: number
    ): void;
}

export interface IMapLayerHookController
    extends IHookController<IMapLayerHooks> {
    /** 拓展所属的图层对象 */
    readonly layer: IMapLayer;

    /**
     * 获取地图数据，是对内部存储的直接引用
     */
    getMapData(): Readonly<IMapLayerData>;
}

export interface IMapLayer
    extends IHookable<IMapLayerHooks, IMapLayerHookController> {
    /** 地图宽度 */
    readonly width: number;
    /** 地图高度 */
    readonly height: number;
    /**
     * 地图是否全部空白，此值具有充分性，但不具有必要性，
     * 即如果其为 `true`，则地图一定空白，但是如果其为 `false`，那么地图也有可能空白
     */
    readonly empty: boolean;
    /** 图层纵深 */
    readonly zIndex: number;

    /**
     * 调整地图尺寸，维持原有图块。如果尺寸变大，那么会补零，如果尺寸变小，那么会将当前数组裁剪
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
     * 获取整个地图的地图数组，是对内部数组的直接引用
     */
    getMapRef(): IMapLayerData;

    /**
     * 设置地图纵深，会影响渲染的遮挡顺序
     * @param zIndex 纵深
     */
    setZIndex(zIndex: number): void;
}
