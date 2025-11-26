import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';
import {
    ILayerState,
    ILayerStateHooks,
    IMapLayer,
    IMapLayerHookController,
    IMapLayerHooks
} from './types';
import { MapLayer } from './mapLayer';

export class LayerState
    extends Hookable<ILayerStateHooks>
    implements ILayerState
{
    readonly layerList: Set<IMapLayer> = new Set();
    /** 图层到图层别名映射 */
    readonly layerAliasMap: WeakMap<IMapLayer, string> = new WeakMap();
    /** 图层别名到图层的映射 */
    readonly aliasLayerMap: Map<symbol, IMapLayer> = new Map();

    /** 背景图块 */
    private backgroundTile: number = 0;

    /** 图层钩子映射 */
    private layerHookMap: Map<IMapLayer, IMapLayerHookController> = new Map();

    addLayer(width: number, height: number): IMapLayer {
        const array = new Uint32Array(width * height);
        const layer = new MapLayer(array, width, height);
        this.layerList.add(layer);
        this.forEachHook(hook => {
            hook.onUpdateLayer?.(this.layerList);
        });
        const controller = layer.addHook(new StateMapLayerHook(this, layer));
        this.layerHookMap.set(layer, controller);
        controller.load();
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
        this.forEachHook(hook => {
            hook.onUpdateLayer?.(this.layerList);
        });
        const controller = this.layerHookMap.get(layer);
        if (!controller) return;
        controller.unload();
        this.layerHookMap.delete(layer);
    }

    hasLayer(layer: IMapLayer): boolean {
        return this.layerList.has(layer);
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
        keepBlock: boolean = false
    ): void {
        if (keepBlock) {
            layer.resize(width, height);
        } else {
            layer.resize2(width, height);
        }
    }

    setBackground(tile: number): void {
        this.backgroundTile = tile;
        this.forEachHook(hook => {
            hook.onChangeBackground?.(tile);
        });
    }

    getBackground(): number {
        return this.backgroundTile;
    }

    protected createController(
        hook: Partial<ILayerStateHooks>
    ): IHookController<ILayerStateHooks> {
        return new HookController(this, hook);
    }
}

class StateMapLayerHook implements Partial<IMapLayerHooks> {
    constructor(
        readonly state: LayerState,
        readonly layer: IMapLayer
    ) {}

    onUpdateArea(x: number, y: number, width: number, height: number): void {
        this.state.forEachHook(hook => {
            hook.onUpdateLayerArea?.(this.layer, x, y, width, height);
        });
    }

    onUpdateBlock(block: number, x: number, y: number): void {
        this.state.forEachHook(hook => {
            hook.onUpdateLayerBlock?.(this.layer, block, x, y);
        });
    }

    onResize(width: number, height: number): void {
        this.state.forEachHook(hook => {
            hook.onResizeLayer?.(this.layer, width, height);
        });
    }
}
