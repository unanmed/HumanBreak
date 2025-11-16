import { logger } from '@motajs/common';
import { IMapLayer, MapLayer } from '../map';
import { ILayerState } from './types';

export class LayerState implements ILayerState {
    readonly layerList: WeakSet<IMapLayer> = new WeakSet();
    /** 图层到图层别名映射 */
    readonly layerAliasMap: WeakMap<IMapLayer, string> = new WeakMap();
    /** 图层别名到图层的映射 */
    readonly aliasLayerMap: WeakMap<symbol, IMapLayer> = new WeakMap();

    addLayer(width: number, height: number): IMapLayer {
        const array = new Uint32Array(width * height);
        const layer = new MapLayer(array, width, height);
        this.layerList.add(layer);
        return layer;
    }

    removeLayer(layer: IMapLayer): void {
        this.layerList.delete(layer);
        const alias = this.layerAliasMap.get(layer);
        if (alias) {
            const symbol = Symbol.for(alias);
            this.aliasLayerMap.delete(symbol);
            this.layerAliasMap.delete(layer);
        }
    }

    setLayerAlias(layer: IMapLayer, alias: string): void {
        const symbol = Symbol.for(alias);
        if (this.aliasLayerMap.has(symbol)) {
            logger.warn(84, alias);
            return;
        }
        this.layerAliasMap.set(layer, alias);
        this.aliasLayerMap.set(symbol, layer);
    }

    getLayerByAlias(alias: string): IMapLayer | null {
        const symbol = Symbol.for(alias);
        return this.aliasLayerMap.get(symbol) ?? null;
    }

    getLayerAlias(layer: IMapLayer): string | undefined {
        return this.layerAliasMap.get(layer);
    }

    resizeLayer(
        layer: IMapLayer,
        width: number,
        height: number,
        keepBlock?: boolean
    ): void {
        if (keepBlock) {
            layer.resize(width, height);
        } else {
            layer.resize2(width, height);
        }
    }
}
