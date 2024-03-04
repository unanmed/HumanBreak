import { Polygon } from './polygon';
import {
    Light,
    getAllLights,
    initShadowCanvas,
    refreshLight,
    removeAllLights,
    setBackground,
    setBlur,
    setLightList,
    setShadowNodes
} from './shadow';
import { pColor } from '../utils';
import { setCanvasFilterByFloorId } from '../fx/gameCanvas';

export function init() {
    // 勇士身上的光源
    Mota.rewrite(core.control, 'drawHero', 'add', () => {
        if (core.getFlag('__heroOpacity__') !== 0) {
            getAllLights().forEach(v => {
                if (!v.followHero) return;
                v._offset ??= { x: v.x, y: v.y };
                v.x = core.status.heroCenter.px + v._offset.x;
                v.y = core.status.heroCenter.py + v._offset.y;
                refreshLight();
            });
        }
    });
    // 更新地形数据
    Mota.rewrite(core.maps, 'removeBlock', 'add', success => {
        if (success && main.replayChecking) updateShadow(true);
        return success;
    });
    Mota.rewrite(core.maps, 'setBlock', 'add', () => {
        if (main.replayChecking) updateShadow(true);
    });
    Mota.rewrite(core.events, 'changingFloor', 'add', (_, floorId) => {
        if (!main.replayChecking) {
            updateShadow();
            setCanvasFilterByFloorId(floorId);
        }
    });
    // 初始化画布信息
    Mota.rewrite(core.ui, 'deleteAllCanvas', 'add', () => {
        if (main.mode === 'play' && !main.replayChecking) initShadowCanvas();
    });
}

export const shadowInfo: Partial<Record<FloorIds, Light[]>> = {};
export const backgroundInfo: Partial<Record<FloorIds, Color>> = {};
export const blurInfo: Partial<Record<FloorIds, number>> = {};
export const immersionInfo: Partial<Record<FloorIds, number>> = {};
const shadowCache: Partial<Record<FloorIds, Polygon[]>> = {};

let calMapShadow = true;

export function updateShadow(nocache: boolean = false) {
    // todo: 需要优化，优化成bfs
    const floor = core.status.floorId;
    if (!shadowInfo[floor] || !backgroundInfo[floor]) {
        removeAllLights();
        setShadowNodes([]);
        setBackground('transparent');
        return;
    }
    const f = core.status.thisMap;
    const w = f.width;
    const h = f.height;
    const nodes: Polygon[] = [];
    if (calMapShadow) {
        if (shadowCache[floor] && !nocache) {
            setShadowNodes(shadowCache[floor]!);
        } else {
            core.extractBlocks();
            const blocks = core.getMapBlocksObj();
            core.status.maps[floor].blocks.forEach(v => {
                if (
                    !['terrains', 'autotile', 'tileset', 'animates'].includes(
                        v.event.cls
                    )
                ) {
                    return;
                }

                if (v.event.noPass) {
                    const immerse = immersionInfo[floor] ?? 4;
                    const x = v.x;
                    const y = v.y;
                    let left = x * 32 + immerse;
                    let top = y * 32 + immerse;
                    let right = left + 32 - immerse * 2;
                    let bottom = top + 32 - immerse * 2;
                    const l: LocString = `${x - 1},${y}`;
                    const r: LocString = `${x + 1},${y}`;
                    const t: LocString = `${x},${y - 1}`;
                    const b: LocString = `${x},${y + 1}`;

                    if (x === 0) left -= immerse * 2;
                    if (x + 1 === w) right += immerse * 2;
                    if (y === 0) top -= immerse * 2;
                    if (y + 1 === h) bottom += immerse * 2;

                    if (blocks[l] && blocks[l].event.noPass) {
                        left -= immerse;
                    }
                    if (blocks[r] && blocks[r].event.noPass) {
                        right += immerse;
                    }
                    if (blocks[t] && blocks[t].event.noPass) {
                        top -= immerse;
                    }
                    if (blocks[b] && blocks[b].event.noPass) {
                        bottom += immerse;
                    }
                    nodes.push(
                        new Polygon([
                            [left, top],
                            [right, top],
                            [right, bottom],
                            [left, bottom]
                        ])
                    );
                    return;
                }
            });
            shadowCache[floor] = nodes;
            setShadowNodes(nodes);
        }
    } else {
        setShadowNodes([]);
        setBlur(0);
    }
    setLightList(shadowInfo[floor]!);
    setBackground(backgroundInfo[floor]!);
    setBlur(blurInfo[floor] ?? 3);
}

/**
 * 清除某一层的墙壁缓存
 * @param floorId 楼层id
 */
export function clearShadowCache(floorId: FloorIds) {
    delete shadowCache[floorId];
}

/**
 * 设置是否不计算墙壁遮挡，对所有灯光有效
 * @param n 目标值
 */
export function setCalShadow(n: boolean) {
    calMapShadow = n;
    updateShadow();
}
