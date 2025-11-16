import { IMapLayer } from '../map';

export interface ILayerState {
    /** 地图列表 */
    readonly layerList: WeakSet<IMapLayer>;

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
}

export interface ICoreState {
    /** 地图状态 */
    readonly layer: ILayerState;
}
