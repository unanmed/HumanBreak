export default function init() {
    return { splitArea };
}

interface MapBFSResult {
    maps: FloorIds[];
    link: Record<
        `${FloorIds}_${number}_${number}_${Dir}`,
        `${FloorIds}_${number}_${number}`
    >;
}

const bfsCache: Partial<Record<FloorIds, MapBFSResult>> = {};

export function splitArea() {}

export function getMapData(floorId: FloorIds) {}

export function getMapDrawData(floorId: FloorIds) {}

/**
 * 广度优先搜索地图信息
 * @param floorId 中心楼层id
 * @param noCache 是否不使用缓存
 */
function bfs(floorId: FloorIds, noCache: boolean = false) {
    if (bfsCache[floorId] && !noCache) return bfsCache[floorId];

    const queue = [floorId];
    const used: Partial<Record<FloorIds, boolean>> = {};

    while (queue.length > 0) {
        const now = queue.shift()!;
    }
}
