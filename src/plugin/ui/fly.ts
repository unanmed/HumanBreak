import { mainSetting } from '@/core/main/setting';
import { downloadCanvasImage, has, tip } from '../utils';

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

type Loc2 = [number, number, number, number];

export class MinimapDrawer {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    scale: number = 1;
    nowFloor: FloorIds = core.status.floorId;
    nowArea: string = '';

    // position & config
    ox: number = 0;
    oy: number = 0;
    noBorder: boolean = false;
    showInfo: boolean = false;

    // cache
    drawedThumbnail: Partial<Record<FloorIds, boolean>> = {};
    thumbnailLoc: Partial<Record<FloorIds, Loc2>> = {};

    // temp
    private tempCanvas: HTMLCanvasElement = document.createElement('canvas');
    private tempCtx: CanvasRenderingContext2D;

    private downloadMode: boolean = false;
    private innerRatio: number = 1;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.tempCtx = this.tempCanvas.getContext('2d')!;
        this.innerRatio = mainSetting.getValue('ui.mapScale', 100) / 100;
        this.scale *= this.innerRatio;
    }

    link(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    clearCache() {
        this.drawedThumbnail = {};
        this.thumbnailLoc = {};
    }

    /**
     * 绘制小地图
     * @param noCache 是否不使用缓存
     */
    drawMap(noCache: boolean = false) {
        const border = this.noBorder ? 0.5 : 1;
        const data = getMapDrawData(
            this.nowFloor,
            this.noBorder ? 0 : 5,
            border,
            noCache
        );
        const temp = this.tempCanvas;
        const ctx = this.tempCtx;
        const s = this.scale * devicePixelRatio;
        temp.width = data.width * s;
        temp.height = data.height * s;
        ctx.lineWidth = (border * devicePixelRatio) / 2;
        ctx.strokeStyle = '#fff';
        ctx.scale(s, s);
        ctx.translate(5, 5);

        if (!this.noBorder) {
            // 绘制连线
            data.line.forEach(([x1, y1, x2, y2]) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            });
        }

        // 绘制地图及缩略图
        for (const [id, [x, y]] of Object.entries(data.locs) as [
            FloorIds,
            LocArr
        ][]) {
            if (!this.noBorder) this.drawBorder(id, x, y);
            this.drawThumbnail(id, x, y);
        }
        this.drawToTarget();
    }

    /**
     * 绘制一个楼层的边框
     */
    drawBorder(id: FloorIds, x: number, y: number) {
        const border = this.noBorder ? 0.5 : 1;
        const ctx = this.tempCtx;
        ctx.lineWidth = border * devicePixelRatio;
        const map = core.status.maps[id];

        if (!core.hasVisitedFloor(id)) {
            ctx.fillStyle = '#d0d';
        } else {
            ctx.fillStyle = '#000';
        }
        if (id === this.nowFloor) {
            ctx.strokeStyle = 'gold';
        } else {
            ctx.strokeStyle = '#fff';
        }

        ctx.strokeRect(
            x - map.width / 2,
            y - map.height / 2,
            map.width,
            map.height
        );

        ctx.fillRect(
            x - map.width / 2,
            y - map.height / 2,
            map.width,
            map.height
        );
        if (id === this.nowFloor) {
            ctx.fillStyle = '#ff04';
            ctx.fillRect(
                x - map.width / 2,
                y - map.height / 2,
                map.width,
                map.height
            );
        }
        if (!this.noBorder && this.scale * this.innerRatio <= 7)
            this.drawEnemy(ctx, id, x, y);
    }

    /**
     * 将临时画布的内容绘制到目标画布上
     */
    drawToTarget() {
        const mapCtx = this.ctx;
        const map = this.canvas;
        const temp = this.tempCanvas;

        mapCtx.clearRect(0, 0, map.width, map.height);
        mapCtx.drawImage(
            temp,
            0,
            0,
            temp.width,
            temp.height,
            this.ox * devicePixelRatio + (map.width - temp.width) / 2,
            this.oy * devicePixelRatio + (map.height - temp.height) / 2,
            temp.width,
            temp.height
        );
    }

    /**
     * 检查是否应该绘制缩略图
     */
    checkThumbnail(floorId: FloorIds, x: number, y: number) {
        const scale = this.scale;
        const ox = this.ox;
        const oy = this.oy;
        const map = this.canvas;
        const temp = this.tempCanvas;

        const floor = core.status.maps[floorId];
        const s = scale * devicePixelRatio;
        const px = ox * devicePixelRatio + (map.width - temp.width) / 2 + 5 * s;
        const py =
            oy * devicePixelRatio + (map.height - temp.height) / 2 + 5 * s;
        const left = px + (x - floor.width / 2) * s;
        const top = py + (y - floor.height / 2) * s;
        const right = left + floor.width * s;
        const bottom = top + floor.height * s;

        this.thumbnailLoc[floorId] = [left, top, right, bottom];

        if (
            this.drawedThumbnail[floorId] ||
            (!this.noBorder && scale * this.innerRatio <= 7) ||
            right < 0 ||
            bottom < 0 ||
            left > map.width ||
            top > map.height
        )
            return false;

        return true;
    }

    /**
     * 绘制缩略图
     */
    drawThumbnail(
        floorId: FloorIds,
        x: number,
        y: number,
        noCheck: boolean = false
    ) {
        if (
            !this.downloadMode &&
            !noCheck &&
            !this.checkThumbnail(floorId, x, y)
        )
            return;
        const floor = core.status.maps[floorId];
        this.drawedThumbnail[floorId] = true;

        // 绘制缩略图
        const ctx = this.tempCtx;
        core.drawThumbnail(floorId, void 0, {
            all: true,
            inFlyMap: true,
            x: x - floor.width / 2,
            y: y - floor.height / 2,
            w: floor.width,
            h: floor.height,
            ctx,
            damage: this.scale * this.innerRatio > 15
        });
        if (!this.downloadMode) {
            if (!core.hasVisitedFloor(floorId)) {
                ctx.fillStyle = '#d0d6';
                ctx.fillRect(
                    x - floor.width / 2,
                    y - floor.height / 2,
                    floor.width,
                    floor.height
                );
                ctx.fillStyle = '#000';
            }
            if (this.nowFloor === floorId) {
                ctx.fillStyle = '#ff04';
                ctx.fillRect(
                    x - floor.width / 2,
                    y - floor.height / 2,
                    floor.width,
                    floor.height
                );
                ctx.fillStyle = '#000';
            }
        }
        this.drawEnemy(ctx, floorId, x, y);
    }

    /**
     * 当移动时检查是否应该绘制缩略图
     */
    checkMoveThumbnail() {
        const border = this.noBorder ? 0.5 : 1;
        const data = getMapDrawData(
            this.nowFloor,
            this.noBorder ? 0 : 5,
            border
        );
        for (const [id, [x, y]] of Object.entries(data.locs) as [
            FloorIds,
            LocArr
        ][]) {
            if (this.checkThumbnail(id, x, y)) {
                this.drawThumbnail(id, x, y, true);
            }
        }
    }

    download() {
        if (this.nowArea === '') {
            tip('error', '当前地图不在任意一个区域内！');
            return;
        }
        this.downloadMode = true;
        const before = this.scale;
        this.scale = 32;
        this.drawMap();
        downloadCanvasImage(this.tempCanvas, this.nowArea);
        this.scale = before;
        this.downloadMode = false;
        tip('success', '图片下载成功！');
    }

    /**
     * 居中地图
     * @param id 楼层id
     */
    locateMap(id: FloorIds) {
        const data = getMapDrawData(
            id,
            this.noBorder ? 0 : 5, // 可恶的0和5，写反了找一个多小时
            this.noBorder ? 0.5 : 1
        );
        if (!data.locs[id]) return;

        const [x, y] = data.locs[id]!;
        this.ox = (-x + data.width / 2 - 5) * this.scale;
        this.oy = (-y + data.height / 2 - 5) * this.scale;
    }

    private drawEnemy(
        ctx: CanvasRenderingContext2D,
        floorId: FloorIds,
        x: number,
        y: number
    ) {
        if (
            this.scale * this.innerRatio > 2 &&
            this.scale * this.innerRatio < 40 &&
            !this.downloadMode &&
            this.showInfo
        ) {
            ctx.save();
            ctx.lineWidth = 0.5;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `3px "normal"`;
            ctx.strokeStyle = 'black';
            Mota.require('fn', 'ensureFloorDamage')(floorId);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(x - 6, y - 2, 12, 4);
            ctx.fillStyle = 'white';
            const enemy = core.status.maps[floorId].enemy.list;
            if (enemy.length === 0) {
                ctx.strokeStyle = 'lightgreen';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(x - 1.5, y);
                ctx.lineTo(x - 0.5, y + 1);
                ctx.lineTo(x + 1.5, y - 1);
                ctx.stroke();
            } else if (enemy.length < 2) {
                const ids = [...new Set(enemy.map(v => v.id))];
                if (ids.length === 1) {
                    core.drawIcon(ctx, ids[0], x - 2, y - 2, 4, 4);
                } else if (ids.length === 2) {
                    core.drawIcon(ctx, ids[0], x - 4, y - 2, 4, 4);
                    core.drawIcon(ctx, ids[1], x, y - 2, 4, 4);
                } else {
                    core.drawIcon(ctx, ids[0], x - 5, y - 2, 4, 4);
                    core.drawIcon(ctx, ids[1], x - 1, y - 2, 4, 4);
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.strokeText('…', x + 4, y);
                    ctx.fillText('…', x + 4, y);
                }
            } else {
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`+${enemy.length}`, x, y);
            }

            ctx.restore();
        }
    }
}
