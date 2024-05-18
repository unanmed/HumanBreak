import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { Container } from '../container';
import { Sprite } from '../sprite';
import { Camera } from '../camera';
import { TimingFn } from 'mutate-animate';
import { IRenderDestroyable, RenderItem } from '../item';
import { logger } from '@/core/common/logger';
import { AutotileRenderable, RenderableData, texture } from '../cache';
import { glMatrix } from 'gl-matrix';

interface LayerCacheItem {
    floorId?: FloorIds;
    canvas: HTMLCanvasElement;
}

interface LayerMovingRenderable extends RenderableData {
    zIndex: number;
    x: number;
    y: number;
}

interface NeedRenderData {
    /** 需要渲染的地图内容 */
    res: Set<number>;
    /** 需要渲染的背景内容 */
    back: [x: number, y: number][];
}

interface LayerBlockData {
    /** 横向宽度，包括rest的那一个块 */
    width: number;
    /** 纵向宽度，包括rest的那一个块 */
    height: number;
    /** 横向最后一个块的宽度 */
    restWidth: number;
    /** 纵向最后一个块的高度 */
    restHeight: number;
}

interface MovingStepLinearSwap {
    /** 线性差值移动（也就是平移）或者是瞬移 */
    type: 'linear' | 'swap';
    x: number;
    y: number;
    /** 这次移动的总时长，不是每格时长 */
    time?: number;
}

interface MovingStepFunction {
    /** 自定义移动方式 */
    type: 'fn';
    /**
     * 移动函数，返回一个三元素数组，表示当前所在格子数，以及在纵向上的深度（一般图块的深度就是它的纵坐标），
     * 注意不是像素数，可以是小数
     */
    fn: TimingFn<3>;
    time?: number;
    relative?: boolean;
}

type MovingStep = MovingStepFunction | MovingStepLinearSwap;

interface MovingBlock {
    steps: MovingStep[];
    /** 当前正在执行哪一步 */
    index: number;
    /** 目标横坐标 */
    x: number;
    /** 目标纵坐标 */
    y: number;
    /** 渲染信息 */
    render: RenderableData | AutotileRenderable;
    /** 当前的纵深 */
    nowZ: number;
}

type FloorLayer = 'bg' | 'bg2' | 'event' | 'fg' | 'fg2';

export class Layer extends Container implements IRenderDestroyable {
    /** 地图渲染对象映射，用于当地图更新时定向更新渲染信息 */
    static LayerMap: Map<FloorIds, Set<Layer>> = new Map();

    // 一些会用到的常量
    static readonly FRAME_0 = 1;
    static readonly FRAME_1 = 2;
    static readonly FRAME_2 = 4;
    static readonly FRAME_3 = 8;
    static readonly FRAME_ALL = 15;

    /**
     * 每个渲染块的缓存，索引的理应计算公式为 (x + y * width) * 4 + frame\
     * 其中x和y表示块的位置，width表示横向有多少个块，frame表示第几帧，移动层没办法缓存，所以没有缓存
     */
    blockCache: Map<number, LayerCacheItem> = new Map();

    /** 静态层，包含除大怪物及正在移动的内容外的内容 */
    protected staticMap: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();
    /** 移动层，包含大怪物及正在移动的内容 */
    protected movingMap: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();
    /** 背景图层 */
    protected backMap: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();

    /** 最终渲染至的Sprite */
    main: Sprite = new Sprite();

    /** 与当前层绑定，当前层改变时渲染的楼层会一同改变 */
    bindThisFloor: boolean = false;
    /** 渲染的楼层 */
    floorId?: FloorIds;
    /** 渲染的层 */
    layer?: FloorLayer;
    /** 渲染数据 */
    renderData: number[] = [];
    /** 自动元件的连接信息，键表示图块在渲染数据中的索引，值表示连接信息，是个8位二进制 */
    autotiles: Record<number, number> = {};
    /** 楼层宽度 */
    mapWidth: number = 0;
    /** 楼层高度 */
    mapHeight: number = 0;
    /** 每个图块的大小 */
    cellSize: number = 32;

    /** 背景图块 */
    background: AllNumbers = 0;
    /** 背景图块画布 */
    backImage: HTMLCanvasElement[] = [];

    /** 分块信息。每个块的默认大小为画面宽度，这样的话有可能会包含三个大小不足的剩余块，这三个块单独处理即可 */
    blockData: LayerBlockData = {
        width: 0,
        height: 0,
        restHeight: 0,
        restWidth: 0
    };
    blockSize: number = core._WIDTH_;

    /** 正在移动的图块 */
    moving: MovingBlock[] = [];
    /** 大怪物渲染信息 */
    bigImages: Map<number, LayerMovingRenderable> = new Map();
    /** 移动层的渲染信息 */
    movingRenderable: LayerMovingRenderable[] = [];
    /** 下一此渲染时是否需要更新移动层的渲染信息 */
    needUpdateMoving: boolean = false;

    constructor() {
        super('absolute');

        // this.setHD(false);
        this.setAntiAliasing(false);
        this.size(core._PX_, core._PY_);

        this.staticMap.setHD(false);
        // this.staticMap.setAntiAliasing(false);
        this.staticMap.withGameScale(false);
        this.staticMap.size(core._PX_, core._PY_);
        this.movingMap.setHD(false);
        // this.movingMap.setAntiAliasing(false);
        this.movingMap.withGameScale(false);
        this.movingMap.size(core._PX_, core._PY_);
        this.backMap.setHD(false);
        // this.backMap.setAntiAliasing(false);
        this.backMap.withGameScale(false);
        this.backMap.size(core._PX_, core._PY_);
        this.main.setAntiAliasing(false);
        this.main.setHD(false);
        this.main.size(core._PX_, core._PY_);

        this.appendChild([this.main]);
        this.main.setRenderFn((canvas, camera) => {
            const { ctx } = canvas;
            const { width, height } = canvas.canvas;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            const need = this.calNeedRender(camera);
            this.renderMap(camera, need);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(this.backMap.canvas, 0, 0, width, height);
            ctx.drawImage(this.staticMap.canvas, 0, 0, width, height);
            ctx.drawImage(this.movingMap.canvas, 0, 0, width, height);
            ctx.restore();
        });
    }

    /**
     * 设置背景图块
     * @param background 背景图块
     */
    setBackground(background: AllNumbers) {
        this.background = background;
        this.generateBackground();
    }

    /**
     * 生成背景图块
     */
    generateBackground() {
        const num = this.background;

        const data = texture.getRenderable(num);
        this.backImage = [];
        if (!data) return;

        const frame = data.frame;
        for (let i = 0; i < frame; i++) {
            const canvas = new MotaOffscreenCanvas2D();
            const temp = new MotaOffscreenCanvas2D();
            const ctx = canvas.ctx;
            const tempCtx = temp.ctx;
            const [sx, sy, w, h] = data.render[i];
            canvas.setHD(false);
            canvas.setAntiAliasing(false);
            canvas.withGameScale(false);
            canvas.size(core._PX_, core._PY_);
            temp.setHD(false);
            temp.setAntiAliasing(false);
            temp.withGameScale(false);
            temp.size(w, h);

            const img = data.autotile ? data.image[0b11111111] : data.image;
            tempCtx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
            const pattern = ctx.createPattern(temp.canvas, 'repeat');
            if (!pattern) continue;
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            this.backImage.push(canvas.canvas);
        }
    }

    /**
     * 修改地图渲染数据，对于溢出的内容会进行裁剪
     * @param data 要渲染的地图数据
     * @param width 数据的宽度
     * @param x 第一个数据的横坐标，默认是0
     * @param y 第一个数据的纵坐标，默认是0
     */
    putRenderData(
        data: number[],
        width: number,
        x: number = 0,
        y: number = 0,
        calAutotile: boolean = true
    ) {
        if (data.length % width !== 0) {
            logger.warn(
                8,
                `Incomplete render data is put. None will be filled to the lacked data.`
            );
            data.push(...Array(data.length % width).fill(0));
        }
        const height = Math.round(data.length / width);
        if (width + x > this.mapWidth || height + y > this.mapHeight) {
            logger.warn(
                9,
                `Data transfered is partially (or totally) out of range. Overflowed data will be ignored.`
            );
            if (x >= this.mapWidth || y >= this.mapHeight) return;
        }
        for (let nx = 0; nx < width; nx++) {
            for (let ny = 0; ny < height; ny++) {
                const dx = nx + x;
                const dy = ny + y;
                if (dx >= this.mapWidth || dy >= this.mapHeight) {
                    continue;
                }
                const index = nx + ny * width;
                const indexData = dx + dy * this.mapWidth;
                this.renderData[indexData] = data[index];
            }
        }
        if (calAutotile) this.calAutotiles(x, y, width, height);
        // this.updateBigImages(x, y, width, height);
        // this.updateRenderableData(x, y, width, height);
        this.updateBlocks(x, y, width, height);
        this.update(this);
    }

    /**
     * 更新大怪物的渲染信息
     */
    updateBigImages(x: number, y: number, width: number, height: number) {
        const ex = x + width;
        const ey = y + height;
        const w = this.mapWidth;
        const data = this.renderData;

        for (let nx = x; nx < ex; nx++) {
            for (let ny = y; ny < ey; ny++) {
                const index = ny * w + nx;
                this.bigImages.delete(index);
                const num = data[index];
                const renderable = texture.getRenderable(num);
                if (!renderable || !renderable.bigImage) continue;
                this.bigImages.set(index, {
                    ...renderable,
                    x: nx,
                    y: ny,
                    zIndex: ny
                });
            }
        }

        this.needUpdateMoving = true;
    }

    /**
     * 计算自动元件的连接信息
     */
    calAutotiles(x: number, y: number, width: number, height: number) {
        const ex = x + width;
        const ey = y + height;
        const data = this.renderData;
        const tile = texture.autotile;
        const map = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;

        const w = this.mapWidth;
        const h = this.mapHeight;

        this.autotiles = {};

        /**
         * 检查连接信息
         * @param id 比较对象的id（就是正在检查周围的那个自动元件，九宫格中心的）
         * @param index1 比较对象
         * @param index2 被比较对象
         * @param replace1 被比较对象相对比较对象应该处理的位数
         * @param replace2 比较对象相对被比较对象应该处理的位数
         */
        const check = (
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            replace1: number,
            _replace2: number
        ) => {
            const index1 = x1 + y1 * w;
            const index2 = x2 + y2 * w;
            this.autotiles[index1] ??= 0;
            this.autotiles[index2] ??= 0;
            // 与地图边缘，视为连接
            if (x2 < 0 || y2 < 0 || x2 >= w || y2 >= h) {
                this.autotiles[index1] |= replace1;
                return;
            }
            const num1 = data[index1] as AllNumbersOf<'autotile'>; // 这个一定是自动元件
            const num2 = data[index2] as AllNumbersOf<'autotile'>;
            // 对于额外连接的情况
            const autoConn = texture.getAutotileConnections(num1);
            if (autoConn?.has(num2)) {
                this.autotiles[index1] |= replace1;
                return;
            }
            const info = map[num2 as Exclude<AllNumbers, 0>];
            if (!info || info.cls !== 'autotile') {
                // 被比较对象不是自动元件
                this.autotiles[index1] &= ~replace1;
            } else {
                const parent2 = tile[num2].parent;
                if (num2 === num1) {
                    // 二者一样，视为连接
                    this.autotiles[index1] |= replace1;
                } else if (parent2?.has(num1)) {
                    // 被比较对象是比较对象的父元件，那么比较对象视为连接
                    this.autotiles[index1] |= replace1;
                } else {
                    // 上述条件都不满足，那么不连接
                    this.autotiles[index1] &= ~replace1;
                }
            }
        };

        for (let nx = x; nx < ex; nx++) {
            for (let ny = y; ny < ey; ny++) {
                if (nx > w || ny > h) continue;
                const index = nx + ny * w;
                const num = data[index];
                // 特判空气墙与空图块
                if (num === 0 || num === 17 || num >= 10000) continue;

                const info = map[num as Exclude<AllNumbers, 0>];
                const { cls } = info;
                if (cls !== 'autotile') continue;

                // 太地狱了这个，看看就好
                // 左上 左 左下
                check(nx, ny, nx - 1, ny - 1, 0b10000000, 0b00001000);
                check(nx, ny, nx - 1, ny, 0b00000001, 0b00010000);
                check(nx, ny, nx - 1, ny + 1, 0b00000010, 0b00100000);
                // 上 右上
                check(nx, ny, nx, ny - 1, 0b01000000, 0b00000100);
                check(nx, ny, nx + 1, ny - 1, 0b00100000, 0b00000010);
                // 右 右下 下
                check(nx, ny, nx + 1, ny, 0b00010000, 0b00000001);
                check(nx, ny, nx + 1, ny + 1, 0b00001000, 0b10000000);
                check(nx, ny, nx, ny + 1, 0b00000100, 0b01000000);
            }
        }
    }

    /**
     * 绑定渲染楼层
     * @param floor 楼层id
     * @param layer 渲染的层数，例如是背景层还是事件层等
     */
    bindData(floor: FloorIds, layer: FloorLayer) {
        const before = this.floorId;
        this.floorId = floor;
        this.layer = layer;
        if (before) {
            const floor = Layer.LayerMap.get(before);
            floor?.delete(this);
        }
        const now = Layer.LayerMap.get(floor);
        if (!now) {
            Layer.LayerMap.set(floor, new Set([this]));
        } else {
            now.add(this);
        }
        const f = core.status.maps[floor];
        this.mapWidth = f.width;
        this.mapHeight = f.height;
        this.splitBlock();
        this.updateDataFromFloor();
    }

    /**
     * 将这个渲染内容绑定为当前所在楼层，当前楼层改变时，渲染内容会一并改变
     */
    bindThis(layer: FloorLayer, noUpdate: boolean = false) {
        this.bindThisFloor = true;
        this.layer = layer;

        if (!noUpdate) this.bindData(core.status.floorId, layer);
    }

    /**
     * 从地图数据更新渲染数据，要求已经绑定渲染楼层，否则无事发生
     */
    updateDataFromFloor() {
        if (!this.floorId || !this.layer) return;
        const floor = core.status.maps[this.floorId];
        if (this.layer === 'event') {
            const map = floor.map;
            this.putRenderData(map.flat(), floor.width, 0, 0);
        } else {
            const map = core.maps._getBgFgMapArray(this.layer, this.floorId);
            this.putRenderData(map.flat(), floor.width, 0, 0);
        }
    }

    /**
     * 切分当前地图为多个块
     */
    splitBlock() {
        const size = this.blockSize;

        this.blockData = {
            width: Math.ceil(this.mapWidth / size),
            height: Math.ceil(this.mapHeight / size),
            restWidth: this.mapWidth % size,
            restHeight: this.mapHeight % size
        };
    }

    /**
     * 设置地图大小，会清空渲染数据，因此后面应当紧跟 putRenderData，以保证渲染正常进行
     * @param width 地图宽度
     * @param height 地图高度
     */
    setMapSize(width: number, height: number) {
        this.mapWidth = width;
        this.mapHeight = height;
        this.renderData = Array(width * height).fill(0);
        this.autotiles = {};
        this.splitBlock();
    }

    /**
     * 设置渲染块的大小
     */
    setBlockSize(size: number) {
        this.blockSize = size;
        this.splitBlock();
    }

    /**
     * 给定一个矩形，更新其包含的块信息，注意由于自动元件的存在，实际判定范围会大一圈
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param width 宽度
     * @param height 高度
     */
    updateBlocks(x: number, y: number, width: number, height: number) {
        const start = this.getBlockIndex(x - 1, y - 1);
        const end = this.getBlockIndex(x + width + 1, y - 1);
        const blockHeight =
            Math.ceil((y + 1 + height) / this.blockSize) -
            Math.floor((y - 1) / this.blockSize);
        const blockWidth = end - start;
        for (let nx = 0; nx < blockWidth; nx++) {
            for (let ny = 0; ny < blockHeight; ny++) {
                this.clearBlockCache(
                    this.getBlockIndex(nx + start, ny + y),
                    Layer.FRAME_ALL
                );
            }
        }

        this.update(this);
    }

    /**
     * 根据图块位置获取渲染块的索引
     * @param x 图块的横坐标
     * @param y 图块的纵坐标
     */
    getBlockIndex(x: number, y: number) {
        const bx = Math.floor(x / this.blockSize);
        const by = Math.floor(y / this.blockSize);
        return by * this.blockData.width + bx;
    }

    /**
     * 清空某个块的缓存
     * @param index 要清空的块的位置索引
     * @param frame 要清空块的第几帧，可以通过 `Layer.FRAME_0 | Layer.FRAME_1` 的方式一次清空多个帧，
     *              不要填1234，否则结果不一定符合预期
     */
    clearBlockCache(index: number, frame: number) {
        for (let i = 0; i < 4; i++) {
            if (frame & (1 << i)) {
                this.blockCache.delete(index * frame);
            }
        }
    }

    /**
     * 清空指定缓存索引的块缓存。与 {@link clearBlockCache} 不同之处在于这个是精确控制要清空的缓存，
     * 对于需要大量精确清空的场景，此函数效率更高
     * @param index 指定的缓存索引
     */
    clearBlockByPreciseIndex(index: number) {
        this.blockCache.delete(index);
    }

    /**
     * 清空所有块缓存
     */
    clearAllBlockCache() {
        this.blockCache.clear();
    }

    /**
     * 根据像素位置获取其所在的块
     * @param x 像素横坐标
     * @param y 像素纵坐标
     * @returns 像素位置所在块的索引，不在任何块中时会返回-1
     */
    getBlockByLoc(x: number, y: number) {
        const size = this.blockSize;
        const width = this.mapWidth * this.cellSize;
        const height = this.mapHeight * this.cellSize;
        if (x >= width || y >= height) return -1;
        const bx = Math.floor(x / size);
        const by = Math.floor(y / size);
        return by * this.blockData.width + bx;
    }

    /**
     * 根据像素位置获取应当所在的块的横坐标与纵坐标，即使这个块不存在，例如可以返回 [-1, -2]
     * @param x 像素横坐标
     * @param y 像素纵坐标
     */
    getBlockXYByLoc(x: number, y: number): LocArr {
        return [Math.floor(x / this.blockSize), Math.floor(y / this.blockSize)];
    }

    /**
     * 计算在传入的摄像机的视角下，应该渲染哪些内容
     * @param camera 摄像机
     */
    calNeedRender(camera: Camera): NeedRenderData {
        const cell = this.cellSize;
        const w = (core._WIDTH_ * cell) / 2;
        const h = (core._HEIGHT_ * cell) / 2;
        const size = this.blockSize;

        // -1是因为宽度是core._PX_，从0开始的话，末尾索引就是core._PX_ - 1
        const [x1, y1] = Camera.untransformed(camera, -w, -h);
        const [x2, y2] = Camera.untransformed(camera, w - 1, -h);
        const [x3, y3] = Camera.untransformed(camera, w - 1, h - 1);
        const [x4, y4] = Camera.untransformed(camera, -w, h - 1);

        const res: Set<number> = new Set();
        /** 一个纵坐标对应的所有横坐标，用于填充 */
        const xyMap: Map<number, number[]> = new Map();

        const pushXY = (x: number, y: number) => {
            let arr = xyMap.get(y);
            if (!arr) {
                arr = [];
                xyMap.set(y, arr);
            }
            arr.push(x);
            return arr;
        };

        [
            [x1, y1, x2, y2],
            [x2, y2, x3, y3],
            [x3, y3, x4, y4],
            [x4, y4, x1, y1]
        ].forEach(([fx0, fy0, tx0, ty0]) => {
            const fx = Math.floor(fx0 / cell);
            const fy = Math.floor(fy0 / cell);
            const tx = Math.floor(tx0 / cell);
            const ty = Math.floor(ty0 / cell);
            const dx = tx - fx;
            const dy = ty - fy;
            const k = dy / dx;

            // 斜率无限的时候，竖直
            if (!isFinite(k)) {
                const min = k < 0 ? ty : fy;
                const max = k < 0 ? fy : ty;
                const [x, y] = this.getBlockXYByLoc(fx, min);

                const [, ey] = this.getBlockXYByLoc(fx, max);
                for (let i = y; i <= ey; i++) {
                    pushXY(x, i);
                }

                return;
            }

            const [fbx, fby] = this.getBlockXYByLoc(fx, fy);

            // 当斜率为0时
            if (glMatrix.equals(k, 0)) {
                const [ex] = this.getBlockXYByLoc(tx, fy);
                pushXY(fby, fbx).push(ex);
                return;
            }

            // 否则使用 Bresenham 直线算法
            if (Math.abs(k) >= 1) {
                // 斜率大于一，y方向递增
                const d = Math.sign(dy) * size;
                const f = fby * size;
                const dir = dy > 0;

                const ex = Math.floor(tx / size);
                const ey = Math.floor(ty / size);
                pushXY(ex, ey);

                let now = f;
                let last = fbx;
                let ny = fby;
                do {
                    const bx = Math.floor((fx + (now - fy) / k) / size);
                    pushXY(bx, ny);
                    if (bx !== last) {
                        if (dir) pushXY(bx, ny - Math.sign(dy));
                        else pushXY(last, ny);
                    }

                    last = bx;
                    ny += Math.sign(dy);
                    now += d;
                } while (dir ? ny <= ey : ny >= ey);
            } else {
                // 斜率小于一，x方向递增
                const d = Math.sign(dx) * size;
                const f = fbx * size;
                const dir = dx > 0;

                const ex = Math.floor(tx / size);
                const ey = Math.floor(ty / size);
                pushXY(ex, ey);

                let now = f;
                let last = fby;
                let nx = fbx;
                do {
                    const by = Math.floor((fy + k * (now - fx)) / size);
                    if (by !== last) {
                        if (dir) pushXY(nx - Math.sign(dx), by);
                        else pushXY(nx, last);
                    }
                    pushXY(nx, by);
                    last = by;
                    nx += Math.sign(dx);
                    now += d;
                } while (dir ? nx <= ex : nx >= ex);
            }
        });

        // 然后进行填充
        const { width: bw, height: bh } = this.blockData;
        const back: [number, number][] = [];
        xyMap.forEach((x, y) => {
            if (x.length === 1) {
                const index = y * bw + x[0];

                if (!back.some(v => v[0] === x[0] && v[1] === y))
                    back.push([x[0], y]);
                if (index < 0 || index >= bw * bh) return;
                res.add(index);
            }
            const max = Math.max(...x);
            const min = Math.min(...x);

            for (let i = min; i <= max; i++) {
                const index = y * bw + i;

                if (!back.some(v => v[0] === i && v[1] === y))
                    back.push([i, y]);
                if (index < 0 || index >= bw * bh) continue;
                res.add(index);
            }
        });

        return { res, back };
    }

    /**
     * 更新移动层的渲染信息
     */
    updateMovingRenderable() {
        this.movingRenderable = [];
        this.movingRenderable.push(...this.bigImages.values());
        this.moving.forEach(v => {
            if (!v.render.autotile) {
                this.movingRenderable.push({
                    ...v.render,
                    x: v.x,
                    y: v.y,
                    zIndex: v.nowZ
                });
            } else {
                this.movingRenderable.push({
                    ...v.render,
                    x: v.x,
                    y: v.y,
                    zIndex: v.nowZ,
                    image: v.render.image[0b00000000],
                    autotile: false
                });
            }
        });
        this.movingRenderable.sort((a, b) => a.zIndex - b.zIndex);
    }

    /**
     * 渲染当前地图
     */
    renderMap(camera: Camera, need: NeedRenderData) {
        this.staticMap.clear();
        this.movingMap.clear();
        this.backMap.clear();

        if (this.needUpdateMoving) this.updateMovingRenderable();

        this.renderBack(camera, need);
        this.renderStatic(camera, need);
        this.renderMoving(camera);
    }

    /**
     * 渲染背景图
     * @param camera 摄像机
     * @param need 需要渲染的块
     */
    protected renderBack(camera: Camera, need: NeedRenderData) {
        const cell = this.cellSize;
        const frame = (RenderItem.animatedFrame % 4) + 1;
        const blockSize = this.blockSize;
        const { back } = need;
        const { ctx } = this.backMap;

        const mat = camera.mat;
        const a = mat[0];
        const b = mat[1];
        const c = mat[3];
        const d = mat[4];
        const e = mat[6];
        const f = mat[7];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(core._PX_ / 2, core._PY_ / 2);
        ctx.transform(a, b, c, d, e, f);

        if (this.background !== 0) {
            // 画背景图
            const length = this.backImage.length;
            const img = this.backImage[frame % length];
            back.forEach(([x, y]) => {
                const sx = x * blockSize;
                const sy = y * blockSize;
                ctx.drawImage(
                    img,
                    sx * cell,
                    sy * cell,
                    blockSize * cell,
                    blockSize * cell
                );
            });
        }
    }

    /**
     * 渲染静态层
     */
    protected renderStatic(camera: Camera, need: NeedRenderData) {
        const cell = this.cellSize;
        const frame = (RenderItem.animatedFrame % 4) + 1;
        const { width } = this.blockData;
        const blockSize = this.blockSize;
        const { ctx } = this.staticMap;

        ctx.save();

        const { res: render } = need;
        const mat = camera.mat;
        const a = mat[0];
        const b = mat[1];
        const c = mat[3];
        const d = mat[4];
        const e = mat[6];
        const f = mat[7];

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(core._PX_ / 2, core._PY_ / 2);
        ctx.transform(a, b, c, d, e, f);

        render.forEach(v => {
            const x = v % width;
            const y = Math.floor(v / width);
            const sx = x * blockSize;
            const sy = y * blockSize;
            const index = v * 4 + frame - 1;

            const cache = this.blockCache.get(index);
            if (cache && cache.floorId === this.floorId) {
                ctx.drawImage(
                    cache.canvas,
                    sx * cell,
                    sy * cell,
                    blockSize * cell,
                    blockSize * cell
                );
                return;
            }

            const ex = Math.min(sx + blockSize, this.mapWidth);
            const ey = Math.min(sy + blockSize, this.mapHeight);

            const temp = new MotaOffscreenCanvas2D();
            temp.setAntiAliasing(false);
            temp.setHD(false);
            temp.withGameScale(false);
            temp.size(core._PX_, core._PY_);

            // 先画到临时画布，用于缓存
            for (let nx = sx; nx < ex; nx++) {
                for (let ny = sy; ny < ey; ny++) {
                    const blockIndex = nx + ny * this.mapWidth;
                    const num = this.renderData[blockIndex];
                    if (num === 0 || num === 17) continue;
                    const data = texture.getRenderable(num);
                    if (!data || data.bigImage) continue;
                    const f = frame % data.frame;
                    const i =
                        data.animate === -1
                            ? frame === 4 && data.frame === 3
                                ? 1
                                : f
                            : data.animate;
                    const [isx, isy, w, h] = data.render[i];
                    const px = (nx - sx) * cell;
                    const py = (ny - sy) * cell;
                    const { image, autotile } = data;
                    if (!autotile) {
                        temp.ctx.drawImage(image, isx, isy, w, h, px, py, w, h);
                    } else {
                        const link = this.autotiles[blockIndex];
                        const i = image[link];
                        temp.ctx.drawImage(i, isx, isy, w, h, px, py, w, h);
                    }
                }
            }
            ctx.drawImage(
                temp.canvas,
                sx * cell,
                sy * cell,
                blockSize * cell,
                blockSize * cell
            );
            this.blockCache.set(index, {
                canvas: temp.canvas,
                floorId: this.floorId
            });
        });

        ctx.restore();
    }

    /**
     * 渲染移动/大怪物层
     */
    protected renderMoving(camera: Camera) {
        const frame = (RenderItem.animatedFrame % 4) + 1;
        const cell = this.cellSize;
        const halfCell = cell / 2;
        const { ctx } = this.movingMap;

        ctx.save();
        const mat = camera.mat;
        const a = mat[0];
        const b = mat[1];
        const c = mat[3];
        const d = mat[4];
        const e = mat[6];
        const f = mat[7];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(core._PX_ / 2, core._PY_ / 2);
        ctx.transform(a, b, c, d, e, f);
        const r =
            Math.max(a, b, c, d) ** 2 * Math.max(core._PX_, core._PY_) * 2;

        this.movingRenderable.forEach(v => {
            const { x, y, image, frame: blockFrame, render } = v;
            const f = frame % 4;
            const i = frame === 4 && blockFrame === 3 ? 1 : f;
            const [sx, sy, w, h] = render[i];
            const px = x * cell - w / 2 + halfCell;
            const py = y * cell - h + cell;
            const ex = px + w;
            const ey = py + h;
            if (px ** 2 > r || py ** 2 > r || ex ** 2 > r || ey ** 2 > r) {
                return;
            }
            ctx.drawImage(image, sx, sy, w, h, px, py, w, h);
        });

        ctx.restore();
    }

    /**
     * 对图块进行线性插值移动或瞬移\
     * 线性插值移动：就是匀速平移，可以斜向移动\
     * 瞬移：立刻移动到目标点
     * @param index 要移动的图块在渲染数据中的索引位置
     * @param type 线性插值移动或瞬移
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 移动总时长，注意不是每格时长
     */
    move(
        index: number,
        type: 'linear' | 'swap',
        x: number,
        y: number,
        time?: number
    ): Promise<void>;
    /**
     * 让图块按照一个函数进行移动
     * @param index 要移动的图块在渲染数据中的索引位置
     * @param type 函数式移动
     * @param fn 移动函数，传入一个完成度（范围0-1），返回一个三元素数组，表示横纵格子坐标，可以是小数。
     *           第三个元素表示图块纵深，一般图块的纵深就是其纵坐标，当地图上有大怪物时，此举可以辅助渲染，
     *           否则可能会导致移动过程中与大怪物的层级关系不正确，比如全在大怪物身后。注意不建议频繁改动这个值，
     *           因为此举会导致层级的重新排序，降低渲染性能
     * @param time 移动总时长
     * @param relative 是否是相对模式
     */
    move(
        index: number,
        type: 'fn',
        fn: TimingFn<3>,
        time?: number,
        relative?: boolean
    ): Promise<void>;
    move(
        index: number,
        type: 'linear' | 'swap' | 'fn',
        x: number | TimingFn<3>,
        y?: number,
        time?: number | boolean
    ): Promise<void> {
        // todo
        return Promise.resolve();
    }

    destroy(): void {
        if (!this.floorId) return;
        const floor = Layer.LayerMap.get(this.floorId);
        if (!floor) return;
        floor.delete(this);
    }
}

// 当地图发生变化时更新地图
const hook = Mota.require('var', 'hook');
hook.on('changingFloor', floorId => {
    Layer.LayerMap.forEach(v => {
        const needBind: Layer[] = [];
        v.forEach(v => {
            if (v.bindThisFloor) {
                needBind.push(v);
            }
        });
        needBind.forEach(v => {
            v.bindData(floorId, v.layer!);
        });
    });
});
hook.on('setBlock', (x, y, floor, old, n) => {
    const layers = Layer.LayerMap.get(floor);
    if (layers) {
        layers.forEach(v => {
            if (v.layer === 'event') {
                v.putRenderData([n], 1, x, y, true);
            }
        });
    }
});
