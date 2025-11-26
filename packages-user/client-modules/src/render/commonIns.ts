import { state } from '@user/data-state';
import { materials } from '@user/client-base';
import { MapRenderer, MapExtensionManager } from './map';

/** 主地图渲染器，用于渲染游戏画面 */
export const mainMapRenderer = new MapRenderer(materials, state.layer);
/** 主地图渲染器拓展 */
export const mainMapExtension = new MapExtensionManager(mainMapRenderer);
/** 副地图渲染器，用于渲染缩略图、浏览地图等 */
// export const expandMapRenderer = new MapRenderer(materials, state.layer);

export async function createMainExtension() {
    // 算是一种妥协吧，等之后加载系统重构之后应该会清晰很多
    await materials.trackedAsset.then();

    mainMapRenderer.useAsset(materials.trackedAsset);
    const layer = state.layer.getLayerByAlias('event');
    if (layer) {
        mainMapExtension.addHero(state.hero, layer);
        mainMapExtension.addDoor(layer);
    }
}
