import { IHeroState, IMapLayer } from '@user/data-state';
import { IMapExtensionManager, IMapHeroRenderer } from './types';
import { IMapRenderer } from '../types';
import { MapHeroRenderer } from './hero';
import { logger } from '@motajs/common';

export class MapExtensionManager implements IMapExtensionManager {
    /** 勇士状态至勇士渲染器的映射 */
    readonly heroMap: WeakMap<IHeroState, IMapHeroRenderer> = new WeakMap();

    constructor(readonly renderer: IMapRenderer) {}

    addHero(state: IHeroState, layer: IMapLayer): void {
        if (this.heroMap.has(state)) {
            logger.error(45);
            return;
        }
        const heroRenderer = new MapHeroRenderer(this.renderer, layer, state);
        this.heroMap.set(state, heroRenderer);
    }

    removeHero(state: IHeroState): void {
        const renderer = this.heroMap.get(state);
        if (!renderer) return;
        renderer.destroy();
        this.heroMap.delete(state);
    }
}
