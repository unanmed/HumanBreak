import { Polygon } from './polygon';
import {
    Light,
    removeAllLights,
    setBackground,
    setBlur,
    setLightList,
    setShadowNodes
} from './shadow';

export default function init() {
    return { updateShadow, clearShadowCache, setCalShadow };
}

const shadowInfo: Partial<Record<FloorIds, Light[]>> = {
    MT46: [
        {
            id: 'mt42_1',
            x: 85,
            y: 85,
            decay: 100,
            r: 300,
            color: '#0000'
        }
    ]
};
const backgroundInfo: Partial<Record<FloorIds, Color>> = {
    MT46: '#0008'
};
const blurInfo: Partial<Record<FloorIds, number>> = {
    MT46: 4
};
const immersionInfo: Partial<Record<FloorIds, number>> = {
    MT46: 8
};
const shadowCache: Partial<Record<FloorIds, Polygon[]>> = {};

let calMapShadow = true;

export function updateShadow(nocache: boolean = false) {
    // 需要优化，优化成bfs
    const floor = core.status.floorId;
    if (!shadowInfo[floor] || !backgroundInfo[floor]) {
        removeAllLights();
        setShadowNodes([]);
        setBackground('#0000');
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

                    if (x === 0 || (blocks[l] && blocks[l].event.noPass)) {
                        left -= immerse;
                    }
                    if (x + 1 === w || (blocks[r] && blocks[r].event.noPass)) {
                        right += immerse;
                    }
                    if (y === 0 || (blocks[t] && blocks[t].event.noPass)) {
                        top -= immerse;
                    }
                    if (y + 1 === h || (blocks[b] && blocks[b].event.noPass)) {
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
