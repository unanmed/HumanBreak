import { state } from '@user/data-state';
import { MapRenderer } from './map/renderer';
import { materials } from '@user/client-base';

/** 主地图渲染器，用于渲染游戏画面 */
export const mainMapRenderer = new MapRenderer(materials, state.layer);
/** 副地图渲染器，用于渲染缩略图、浏览地图等 */
// export const expandMapRenderer = new MapRenderer(materials, state.layer);
