import { IHookable, IHookBase, IHookController } from '@motajs/common';
import { IMapLayer } from '../map';

export interface ICoreState {
    /** 地图状态 */
    readonly layer: ILayerState;
}

export interface ILayerStateHooks extends IHookBase {
    /**
     * 当设置背景图块时执行，如果设置的背景图块与原先一样，则不会执行
     * @param controller 钩子控制器
     * @param tile 背景图块
     */
    onChangeBackground(controller: IHookController<this>, tile: number): void;

    /**
     * 当地图列表发生变化时执行
     * @param controller 钩子控制器
     * @param layerList 地图图层列表
     */
    onUpdateLayer(
        controller: IHookController<this>,
        layerList: Set<IMapLayer>
    ): void;

    /**
     * 当地图状态对象的某个图层发生区域更新时执行
     * @param controller 钩子控制器
     * @param layer 触发更新的地图图层对象
     * @param x 更新区域左上角横坐标
     * @param y 更新区域左上角纵坐标
     * @param width 更新区域宽度
     * @param height 更新区域高度
     */
    onUpdateLayerArea(
        controller: IHookController<this>,
        layer: IMapLayer,
        x: number,
        y: number,
        width: number,
        height: number
    ): void;

    /**
     * 当地图状态对象的某个图层设置图块时执行，如果设置的图块与原先一样则不会触发
     * @param controller 钩子控制器
     * @param layer 触发更新的地图图层对象
     * @param block 设置为的图块
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    onUpdateLayerBlock(
        controller: IHookController<this>,
        layer: IMapLayer,
        block: number,
        x: number,
        y: number
    ): void;

    /**
     * 当地图状态对象的某个图层大小发生变化时执行
     * @param controller 钩子控制器
     * @param layer 触发更新的地图图层对象
     * @param width 地图的新宽度
     * @param height 地图的新高度
     */
    onResizeLayer(
        controller: IHookController<this>,
        layer: IMapLayer,
        width: number,
        height: number
    ): void;
}

export interface ILayerState extends IHookable<ILayerStateHooks> {
    /** 地图列表 */
    readonly layerList: Set<IMapLayer>;

    /**
     * 添加图层
     * @param width 地图宽度
     * @param height 地图高度
     */
    addLayer(width: number, height: number): IMapLayer;

    /**
     * 移除指定图层
     * @param layer 图层对象
     */
    removeLayer(layer: IMapLayer): void;

    /**
     * 当前地图状态对象是否包含指定图层对象
     * @param layer 图层对象
     */
    hasLayer(layer: IMapLayer): boolean;

    /**
     * 设置图层别名
     * @param layer 图层对象
     * @param alias 图层别名
     */
    setLayerAlias(layer: IMapLayer, alias: string): void;

    /**
     * 根据图层别名获取图层对象
     * @param alias 图层别名
     */
    getLayerByAlias(alias: string): IMapLayer | null;

    /**
     * 获取图层对象的别名
     * @param layer 图层对象
     */
    getLayerAlias(layer: IMapLayer): string | undefined;

    /**
     * 重新设置图层的大小
     * @param layer 图层对象
     * @param width 新的图层宽度
     * @param height 新的图层高度
     * @param keepBlock 是否保留原有图块，默认不保留
     */
    resizeLayer(
        layer: IMapLayer,
        width: number,
        height: number,
        keepBlock?: boolean
    ): void;

    /**
     * 设置背景图块
     * @param tile 背景图块数字
     */
    setBackground(tile: number): void;

    /**
     * 获取背景图块数字，如果没有设置过，则返回 0
     */
    getBackground(): number;
}

export const enum HeroDirection {
    Left,
    Up,
    Right,
    Down
}

export interface IHeroStateHooks extends IHookBase {
    /**
     * 当设置勇士的坐标时触发
     * @param controller 钩子控制器
     * @param x 勇士横坐标
     * @param y 勇士纵坐标
     */
    onSetPosition(
        controller: IHookController<this>,
        x: number,
        y: number
    ): void;

    /**
     * 当移动勇士时触发
     * @param controller 钩子控制器
     * @param direction 移动方向
     * @param time 移动动画时长
     */
    onMoveHero(
        controller: IHookController<this>,
        direction: HeroDirection,
        time: number
    ): Promise<void>;

    /**
     * 当勇士跳跃时触发
     * @param controller 钩子控制器
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 跳跃动画时长
     */
    onJumpHero(
        controller: IHookController<this>,
        x: number,
        y: number,
        time: number
    ): Promise<void>;
}

export interface IHeroState extends IHookable<IHeroStateHooks> {
    /** 勇士横坐标 */
    readonly x: number;
    /** 勇士纵坐标 */
    readonly y: number;
    /** 勇士朝向 */
    readonly direction: HeroDirection;

    /**
     * 设置勇士位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPosition(x: number, y: number): void;

    /**
     * 移动勇士
     * @param dir 移动方向
     * @param time 移动动画时长，默认 100ms
     * @returns 移动的 `Promise`，当相关的移动动画结束后兑现
     */
    move(dir: HeroDirection, time?: number): Promise<void>;

    /**
     * 跳跃勇士至目标点
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 跳跃动画时长，默认 500ms
     * @returns 跳跃的 `Promise`，当相关的移动动画结束后兑现
     */
    jumpHero(x: number, y: number, time?: number): Promise<void>;
}
