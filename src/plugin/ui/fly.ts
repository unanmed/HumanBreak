import { has } from '../utils';

type BFSFromString = `${FloorIds},${number},${number},${Dir}`;
type BFSToString = `${FloorIds},${number},${number}`;

interface MapBFSResult {
    maps: FloorIds[];
    link: Record<BFSFromString, BFSToString>;
}

interface MapDrawData {
    locs: Partial<Record<FloorIds, LocArr>>;
    line: [number, number, number, number][];
    width: number;
    height: number;
}

let area: Record<string, FloorIds[]> = {};

const bfsCache: Partial<Record<FloorIds, MapBFSResult>> = {};
/**
 * 键的格式：FloorIds,interval,border
 */
const drawCache: Record<string, MapDrawData> = {};

const arrow: Partial<Record<AllNumbers, Dir>> = {
    92: 'left',
    94: 'right',
    91: 'up',
    93: 'down'
};

/**
 * 切分地图区域
 */
export function splitArea() {
    area = {};
    const used: FloorIds[] = [];
    for (const id of core.floorIds) {
        if (used.includes(id) || core.status.maps[id].deleted) continue;
        const data = getMapData(id, true);
        used.push(...data.maps);
        if (data.maps.length > 1) {
            const title = core.status.maps[id].title;
            area[title] = data.maps;
        }
    }
}

export function getArea() {
    return area;
}

/**
 * 获取地图绘制信息
 * @param floorId 中心楼层
 * @param interval 地图间距
 * @param border 边框宽度
 * @param noCache 是否不使用缓存
 */
export function getMapDrawData(
    floorId: FloorIds,
    interval: number = 5,
    border: number = 1,
    noCache: boolean = false
): MapDrawData {
    const id = `${floorId},${interval},${border}`;
    if (drawCache[id] && !noCache) return drawCache[id];
    const { link, maps } = getMapData(floorId, noCache);
    const locs: Partial<Record<FloorIds, LocArr>> = {};
    const line: [number, number, number, number][] = [];
    const center = core.status.maps[floorId];
    let left = -center.width / 2,
        right = center.width / 2,
        top = -center.height / 2,
        bottom = center.height / 2;
    for (const [from, to] of Object.entries(link)) {
        const [fromId, fxs, fys, dir] = from.split(',') as [
            FloorIds,
            string,
            string,
            Dir
        ];
        const [toId, txs, tys] = to.split(',') as [FloorIds, string, string];
        const fromMap = core.status.maps[fromId];
        const toMap = core.status.maps[toId];
        const fx = parseInt(fxs),
            fy = parseInt(fys),
            tx = parseInt(txs),
            ty = parseInt(tys);
        const fw = fromMap.width,
            fh = fromMap.height;
        const tw = toMap.width,
            th = toMap.height;
        locs[fromId] ??= [0, 0];
        const [fromX, fromY] = locs[fromId]!;
        if (!locs[toId]) {
            const dx = core.utils.scan[dir].x,
                dy = core.utils.scan[dir].y;
            const toX =
                    fromX +
                    (fx - fw / 2) -
                    (tx - tw / 2) +
                    (border * 2 + interval) * dx,
                toY =
                    fromY +
                    (fy - fh / 2) -
                    (ty - th / 2) +
                    (border * 2 + interval) * dy;
            // 地图位置和连线位置
            locs[toId] = [toX, toY];
        }
        const [toX, toY] = locs[toId]!;
        line.push([
            fromX + (fx - fw / 2 + 0.5),
            fromY + (fy - fh / 2 + 0.5),
            toX + (tx - tw / 2 + 0.5),
            toY + (ty - th / 2 + 0.5)
        ]);

        // 计算地图总长宽
        const l = toX - tw / 2,
            r = toX + tw / 2,
            t = toY - th / 2,
            b = toY + th / 2;
        if (l < left) left = l;
        if (r > right) right = r;
        if (t < top) top = t;
        if (b > bottom) bottom = b;
    }

    // 移动位置，居中
    Object.values(locs).forEach(v => {
        v[0] -= left;
        v[1] -= top;
    });
    line.forEach(v => {
        v[0] -= left;
        v[2] -= left;
        v[1] -= top;
        v[3] -= top;
    });

    left -= 5;
    right += 5;
    top -= 5;
    bottom += 5;

    const res = { locs, line, width: right - left, height: bottom - top };

    return (drawCache[id] = res);
}

/**
 * 广度优先搜索地图信息
 * @param floorId 中心楼层id
 * @param noCache 是否不使用缓存
 */
export function getMapData(
    floorId: FloorIds,
    noCache: boolean = false
): MapBFSResult {
    if (has(bfsCache[floorId]) && !noCache) return bfsCache[floorId]!;

    const queue = [floorId];
    const used: Partial<Record<FloorIds, boolean>> = {
        [floorId]: true
    };
    const floors = [floorId];
    const link: Record<BFSFromString, BFSToString> = {};

    while (queue.length > 0) {
        const now = queue.shift()!;
        const floor = core.floors[now];
        const change = floor.changeFloor;
        for (const [loc, ev] of Object.entries(change)) {
            if (!ev) continue;
            const target = ev.floorId as FloorIds;
            if (target.startsWith(':')) continue;
            const [x, y] = loc.split(',').map(v => parseInt(v));
            const id = floor.map[y][x] as AllNumbers;
            if (id in arrow) {
                if (!used[target]) {
                    const from = `${now},${loc},${arrow[id]}` as BFSFromString;
                    const to = `${target},${ev.loc![0]},${
                        ev.loc![1]
                    }` as BFSToString;
                    link[from] = to;
                    queue.push(target);
                    floors.push(target);
                }
            }
        }
        used[now] = true;
    }

    const res = {
        maps: floors,
        link
    };

    return (bfsCache[floorId] = res);
}
