import { has } from '../utils';

export default function init() {
    return { splitArea };
}

type BFSFromString = `${FloorIds},${number},${number},${Dir}`;
type BFSToString = `${FloorIds},${number},${number}`;

interface MapBFSResult {
    maps: FloorIds[];
    link: Record<BFSFromString, BFSToString>;
}

const bfsCache: Partial<Record<FloorIds, MapBFSResult>> = {};

const arrow: Partial<Record<AllIds, Dir>> = {
    leftPortal: 'left',
    rightPortal: 'right',
    upPortal: 'up',
    downPortal: 'down'
};

export function splitArea() {}

export function getMapData(floorId: FloorIds) {}

export function getMapDrawData(floorId: FloorIds) {}

/**
 * 广度优先搜索地图信息
 * @param floorId 中心楼层id
 * @param noCache 是否不使用缓存
 */
function bfs(floorId: FloorIds, noCache: boolean = false): MapBFSResult {
    if (has(bfsCache[floorId]) && !noCache) return bfsCache[floorId]!;

    const queue = [floorId];
    const used: Partial<Record<FloorIds, boolean>> = {
        [floorId]: true
    };
    const floors = [floorId];
    const link: Record<BFSFromString, BFSToString> = {};

    while (queue.length > 0) {
        const now = queue.shift()!;
        const change = core.floors[now].changeFloor;
        const blocks = core.getMapBlocksObj(now);
        for (const [loc, ev] of Object.entries(change)) {
            const target = ev.floorId as FloorIds;
            if (target.startsWith(':')) continue;
            const block = blocks[loc as LocString];
            const id = block.event.id;
            if (id in arrow) {
                const from = `${now},${loc},${arrow[id]}` as BFSFromString;
                const to = `${target},${ev.loc![0]},${
                    ev.loc![1]
                }` as BFSToString;
                link[from] = to;
                if (!used[target]) {
                    queue.push(target);
                    floors.push(target);
                }
            }
        }
        used[now] = true;
    }

    return {
        maps: floors,
        link
    };
}
