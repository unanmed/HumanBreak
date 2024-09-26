import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { Container } from '../container';
import { Sprite } from '../sprite';
import { TimingFn } from 'mutate-animate';
import { IAnimateFrame, renderEmits, RenderItem } from '../item';
import { logger } from '@/core/common/logger';
import { RenderableData, texture } from '../cache';
import { glMatrix } from 'gl-matrix';
import { BlockCacher } from './block';
import { Transform } from '../transform';
import { LayerFloorBinder, LayerGroupFloorBinder } from './floor';
import { RenderAdapter } from '../adapter';

export interface ILayerGroupRenderExtends {
    /** 拓展的唯一标识符 */
    readonly id: string;

    /**
     * 当拓展被激活时执行的函数（一般就是拓展加载至目标LayerGroup实例时立刻执行）
     * @param group 目标LayerGroup实例
     */
    awake?(group: LayerGroup): void;

    /**
     * 当一个Layer层级被添加时执行的函数
     * @param group 目标LayerGroup实例
     * @param layer 添加的Layer层实例
     */
    onLayerAdd?(group: LayerGroup, layer: Layer): void;

    /**
     * 当一个Layer层级被移除时执行的函数
     * @param group 目标LayerGroup实例
     * @param layer 移除的Layer层实例
     */
    onLayerRemove?(group: LayerGroup, layer: Layer): void;

    /**
     * 当一个Layer层级从显示到隐藏的状态切换时执行的函数
     * @param group 目标LayerGroup实例
     * @param layer 隐藏的Layer层实例
     */
    onLayerHide?(group: LayerGroup, layer: Layer): void;

    /**
     * 当一个Layer层级从隐藏到显示状态切换时执行的函数
     * @param group 目标LayerGroup实例
     * @param layer 显示的Layer层实例
     */
    onLayerShow?(group: LayerGroup, layer: Layer): void;

    /**
     * 当执行 {@link LayerGroup.emptyLayer} 时执行的函数，即清空所有挂载的Layer时执行的函数
     * @param group 目标LayerGroup实例
     */
    onEmptyLayer?(group: LayerGroup): void;

    /**
     * 当帧动画更新时执行的函数，例如从第一帧变成第二帧时
     * @param group 目标LayerGroup实例
     * @param frame 当前帧数
     */
    onFrameUpdate?(group: LayerGroup, frame: number): void;

    /**
     * 在渲染之前执行的函数
     * @param group 目标LayerGroup实例
     */
    onBeforeRender?(group: LayerGroup): void;

    /**
     * 在渲染之后执行的函数
     * @param group 目标LayerGroup实例
     */
    onAfterRender?(group: LayerGroup): void;

    /**
     * 当拓展被取消挂载时执行的函数（LayerGroup被销毁，拓展被移除等）
     * @param group 目标LayerGroup实例
     */
    onDestroy?(group: LayerGroup): void;
}

export type FloorLayer = 'bg' | 'bg2' | 'event' | 'fg' | 'fg2';

const layerZIndex: Record<FloorLayer, number> = {
    bg: 10,
    bg2: 20,
    event: 30,
    fg: 40,
    fg2: 50
};

export class LayerGroup extends Container implements IAnimateFrame {
    /** 地图组列表 */
    // static list: Set<LayerGroup> = new Set();

    cellSize: number = 32;
    blockSize: number = core._WIDTH_;

    /** 当前楼层 */
    floorId?: FloorIds;
    /** 是否绑定了当前层 */
    bindThisFloor: boolean = false;
    /** 伤害显示层 */
    // damage?: Damage;
    /** 地图显示层 */
    layers: Map<FloorLayer, Layer> = new Map();

    /** 这个地图组的摄像机 */
    camera: Transform = new Transform();

    private needRender?: NeedRenderData;
    private extend: Map<string, ILayerGroupRenderExtends> = new Map();

    constructor() {
        super('static', true);

        this.setHD(true);
        this.setAntiAliasing(false);
        this.size(core._PX_, core._PY_);

        this.on('afterRender', () => {
            this.releaseNeedRender();
        });

        renderEmits.addFramer(this);

        const binder = new LayerGroupFloorBinder();
        this.extends(binder);
        binder.bindThis();
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        const { ctx } = canvas;

        this.sortedChildren.forEach(v => {
            if (v.hidden) return;
            ctx.save();
            v.renderContent(canvas, this.camera);
            ctx.restore();
        });
    }

    /**
     * 添加渲染拓展，可以将渲染拓展理解为一类插件，通过指定的函数在对应时刻执行一些函数，
     * 来达到执行自己想要的功能的效果。例如样板自带的勇士渲染、伤害渲染等都由此实现。
     * 具体能干什么参考 {@link ILayerGroupRenderExtends}
     * @param ex 渲染拓展对象
     */
    extends(ex: ILayerGroupRenderExtends) {
        this.extend.set(ex.id, ex);
        ex.awake?.(this);
    }

    /**
     * 移除一个渲染拓展
     * @param id 要移除的拓展
     */
    removeExtends(id: string) {
        const ex = this.extend.get(id);
        if (!ex) return;
        this.extend.delete(id);
        ex.onDestroy?.(this);
    }

    /**
     * 获取一个已装载的拓展
     * @param id 拓展id
     */
    getExtends(id: string) {
        return this.extend.get(id);
    }

    /**
     * 设置渲染分块大小
     * @param size 分块大小
     */
    setBlockSize(size: number) {
        this.blockSize = size;
        this.layers.forEach(v => {
            v.block.setBlockSize(size);
        });
    }

    /**
     * 设置每个图块的大小
     * @param size 每个图块的大小
     */
    setCellSize(size: number) {
        this.cellSize = size;
    }

    /**
     * 清空所有层
     */
    emptyLayer() {
        this.removeChild(...this.layers.values());
        this.layers.forEach(v => v.destroy());
        this.layers.clear();

        for (const ex of this.extend.values()) {
            ex.onEmptyLayer?.(this);
        }
    }

    /**
     * 添加显示层
     * @param layer 显示层
     */
    addLayer(layer: FloorLayer) {
        const l = new Layer();
        l.layer = layer;
        this.layers.set(layer, l);
        l.setZIndex(layerZIndex[layer]);
        this.appendChild(l);

        for (const ex of this.extend.values()) {
            ex.onLayerAdd?.(this, l);
        }

        return l;
    }

    /**
     * 移除指定层
     * @param layer 要移除的层，可以是Layer实例，也可以是字符串
     */
    removeLayer(layer: FloorLayer | Layer) {
        let ins: Layer | undefined;
        if (typeof layer === 'string') {
            const la = this.layers.get(layer);
            if (!la) return;
            this.removeChild(la);
            this.layers.delete(layer);
            la.destroy();
            ins = la;
        } else {
            const arr = [...this.layers];
            const la = arr.find(v => v[1] === layer)?.[0];
            if (la && this.layers.delete(la)) {
                this.removeChild(layer);
                layer.destroy();
                ins = layer;
            }
        }
        if (ins) {
            for (const ex of this.extend.values()) {
                ex.onLayerRemove?.(this, ins);
            }
        }
    }

    /**
     * 获取一个地图层实例，例如获取背景层等
     * @param layer 地图层
     */
    getLayer(layer: FloorLayer) {
        return this.layers.get(layer);
    }

    /**
     * 隐藏某个层
     * @param layer 要隐藏的层
     */
    hideLayer(layer: FloorLayer) {
        const la = this.getLayer(layer);
        if (!la) return;
        la.hide();

        for (const ex of this.extend.values()) {
            ex.onLayerHide?.(this, la);
        }
    }

    /**
     * 显示某个层
     * @param layer 要显示的层
     */
    showLayer(layer: FloorLayer) {
        const la = this.getLayer(layer);
        if (!la) return;
        la.show();

        for (const ex of this.extend.values()) {
            ex.onLayerShow?.(this, la);
        }
    }

    /**
     * 缓存计算应该渲染的块
     * @param transform 变换矩阵
     * @param blockData 分块信息
     */
    cacheNeedRender(transform: Transform, block: BlockCacher<any>) {
        return (
            this.needRender ??
            (this.needRender = calNeedRenderOf(transform, this.cellSize, block))
        );
    }

    /**
     * 释放应该渲染块缓存
     */
    releaseNeedRender() {
        this.needRender = void 0;
    }

    /**
     * 更新动画帧
     */
    updateFrameAnimate() {
        this.update(this);

        for (const ex of this.extend.values()) {
            ex.onFrameUpdate?.(this, RenderItem.animatedFrame % 4);
        }
    }

    destroy(): void {
        for (const ex of this.extend.values()) {
            ex.onDestroy?.(this);
        }
        super.destroy();
        renderEmits.removeFramer(this);
    }
}

export function calNeedRenderOf(
    transform: Transform,
    cell: number,
    block: BlockCacher<any>
): NeedRenderData {
    const w = (core._WIDTH_ * cell) / 2;
    const h = (core._HEIGHT_ * cell) / 2;
    const size = block.blockSize;

    // -1是因为宽度是core._PX_，从0开始的话，末尾索引就是core._PX_ - 1
    const [x1, y1] = Transform.untransformed(transform, -w, -h);
    const [x2, y2] = Transform.untransformed(transform, w - 1, -h);
    const [x3, y3] = Transform.untransformed(transform, w - 1, h - 1);
    const [x4, y4] = Transform.untransformed(transform, -w, h - 1);

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
            const [x, y] = block.getBlockXY(fx, min);
            const [, ey] = block.getBlockXY(fx, max);
            for (let i = y; i <= ey; i++) {
                pushXY(x, i);
            }

            return;
        }

        const [fbx, fby] = block.getBlockXY(fx, fy);

        // 当斜率为0时
        if (glMatrix.equals(k, 0)) {
            const [ex] = block.getBlockXY(tx, fy);
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
    const { width: bw, height: bh } = block.blockData;
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

            if (!back.some(v => v[0] === i && v[1] === y)) back.push([i, y]);
            if (index < 0 || index >= bw * bh) continue;
            res.add(index);
        }
    });

    return { res, back };
}

export interface ILayerRenderExtends {
    /** 拓展的唯一标识符 */
    readonly id: string;

    /**
     * 当拓展被激活时执行的函数（一般就是拓展加载至目标Layer实例时立刻执行）
     * @param layer 目标Layer实例
     */
    awake?(layer: Layer): void;

    /**
     * 当楼层的背景图块被设置时执行的函数
     * @param layer 目标Layer实例
     * @param background 设置为的背景图块数字
     */
    onBackgroundSet?(layer: Layer, background: AllNumbers): void;

    /**
     * 当背景图块图片被生成时执行的函数
     * @param layer 目标Layer实例
     * @param images 生成出的背景图块的单个分块图像，数组是因为背景图块可能是多帧图块
     */
    onBackgroundGenerated?(layer: Layer, images: HTMLCanvasElement[]): void;

    /**
     * 当修改渲染数据时执行的函数，参见 {@link Layer.putRenderData}
     * @param layer 目标Layer实例
     * @param data 扁平化的数据信息
     * @param width 数据宽度
     * @param x 数据左上角横坐标
     * @param y 数据左上角纵坐标
     * @param calAutotile 是否重新计算自动元件的连接情况
     */
    onDataPut?(
        layer: Layer,
        data: number[],
        width: number,
        x: number,
        y: number,
        calAutotile: boolean
    ): void;

    /**
     * 当更新某个区域内的大怪物renderable信息时执行的函数
     * @param layer 目标Layer实例
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param width 区域宽度
     * @param height 区域高度
     * @param images 最终的大怪物renderable信息，等同于 {@link Layer.bigImages}
     */
    onBigImagesUpdate?(
        layer: Layer,
        x: number,
        y: number,
        width: number,
        height: number,
        images: Map<number, LayerMovingRenderable>
    ): void;

    /**
     * 当计算完成区域内自动元件连接信息时执行的函数
     * @param layer 目标Layer实例
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param width 区域宽度
     * @param height 区域高度
     * @param autotiles 计算出的自动元件连接信息，等同于 {@link Layer.autotiles}
     */
    onAutotilesCaled?(
        layer: Layer,
        x: number,
        y: number,
        width: number,
        height: number,
        autotiles: Record<number, number>
    ): void;

    /**
     * 当地图大小修改时执行的函数
     * @param layer 目标Layer实例
     * @param width 地图宽度
     * @param height 地图高度
     */
    onMapResize?(layer: Layer, width: number, height: number): void;

    /**
     * 当更新指定区域的分块缓存时执行的函数
     * @param layer 目标Layer实例
     * @param blocks 更新区域内包含的分块索引
     * @param x 区域的图格左上角横坐标
     * @param y 区域的图格右上角横坐标
     * @param width 区域的图格宽度
     * @param height 区域的图格高度
     */
    onBlocksUpdate?(
        layer: Layer,
        blocks: Set<number>,
        x: number,
        y: number,
        width: number,
        height: number
    ): void;

    /**
     * 当更新移动层的渲染信息是执行的函数
     * @param layer 目标Layer实例
     * @param renderable 移动层的渲染信息（包含大怪物），未排序
     */
    onMovingUpdate?(layer: Layer, renderable: LayerMovingRenderable[]): void;

    /**
     * 在地图渲染之前执行的函数
     * @param layer 目标Layer实例
     * @param transform 渲染的变换矩阵
     * @param need 需要渲染的分块信息
     */
    onBeforeRender?(
        layer: Layer,
        transform: Transform,
        need: NeedRenderData
    ): void;

    /**
     * 在地图渲染之后执行的函数
     * @param layer 目标Layer实例
     * @param transform 渲染的变换矩阵
     * @param need 需要渲染的分块信息
     */
    onAfterRender?(
        layer: Layer,
        transform: Transform,
        need: NeedRenderData
    ): void;

    /**
     * 当拓展被取消挂载时执行的函数（Layer被销毁，拓展被移除等）
     * @param layer 目标Layer实例
     */
    onDestroy?(layer: Layer): void;
}

interface LayerCacheItem {
    symbol: number;
    canvas: MotaOffscreenCanvas2D;
}

export interface LayerMovingRenderable extends RenderableData {
    zIndex: number;
    x: number;
    y: number;
}

interface NeedRenderData {
    /** 需要渲染的分块索引 */
    res: Set<number>;
    /** 需要渲染的背景的左上角横纵坐标，因为背景是可能渲染在地图之外的，所以不能使用分块索引的形式存储 */
    back: [x: number, y: number][];
}

export class Layer extends Container {
    // 一些会用到的常量
    static readonly FRAME_0 = 1;
    static readonly FRAME_1 = 2;
    static readonly FRAME_2 = 4;
    static readonly FRAME_3 = 8;
    static readonly FRAME_ALL = 15;

    /** 静态层，包含除大怪物及正在移动的内容外的内容 */
    protected staticMap: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();
    /** 移动层，包含大怪物及正在移动的内容 */
    protected movingMap: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();
    /** 背景图层 */
    protected backMap: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();

    /** 最终渲染至的Sprite */
    main: Sprite = new Sprite('absolute', false, true);

    /** 渲染的层 */
    layer?: FloorLayer;
    // todo: renderable分块存储，优化循环绘制性能
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

    /** 分块信息 */
    block: BlockCacher<LayerCacheItem> = new BlockCacher(0, 0, core._WIDTH_, 4);

    /** 大怪物渲染信息 */
    bigImages: Map<number, LayerMovingRenderable> = new Map();
    // todo: 是否需要桶排？
    /** 移动层的渲染信息 */
    movingRenderable: LayerMovingRenderable[] = [];
    /** 下一次渲染时是否需要更新移动层的渲染信息 */
    needUpdateMoving: boolean = false;

    private extend: Map<string, ILayerRenderExtends> = new Map();
    /** 正在移动的图块的渲染信息 */
    moving: Set<LayerMovingRenderable> = new Set();

    constructor() {
        super('absolute', false, true);

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

        this.appendChild(this.main);
        this.main.setRenderFn((canvas, transform) => {
            const { ctx } = canvas;
            const { width, height } = canvas;
            const need = this.calNeedRender(transform);
            this.renderMap(transform, need);
            ctx.drawImage(this.backMap.canvas, 0, 0, width, height);
            ctx.drawImage(this.staticMap.canvas, 0, 0, width, height);
            ctx.drawImage(this.movingMap.canvas, 0, 0, width, height);
        });

        this.extends(new LayerFloorBinder());
        layerAdapter.add(this);
    }

    /**
     * 添加渲染拓展，可以将渲染拓展理解为一类插件，通过指定的函数在对应时刻执行一些函数，
     * 来达到执行自己想要的功能的效果。例如样板自带的勇士渲染、伤害渲染等都由此实现。
     * 具体能干什么参考 {@link ILayerRenderExtends}
     * @param ex 渲染拓展对象
     */
    extends(ex: ILayerRenderExtends) {
        this.extend.set(ex.id, ex);
        ex.awake?.(this);
    }

    /**
     * 移除一个渲染拓展
     * @param id 要移除的拓展
     */
    removeExtends(id: string) {
        const ex = this.extend.get(id);
        if (!ex) return;
        this.extend.delete(id);
        ex.onDestroy?.(this);
    }

    /**
     * 获取一个已装载的拓展
     * @param id 拓展id
     */
    getExtends(id: string) {
        return this.extend.get(id);
    }

    /**
     * 判断一个点是否在地图范围内
     * @param x 横坐标
     * @param y 纵坐标
     */
    isPointOutside(x: number, y: number) {
        return x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight;
    }

    /**
     * 判断一个矩形是否完全在地图之外
     * @param x 矩形左上角横坐标
     * @param y 矩形左上角纵坐标
     * @param width 矩形长度
     * @param height 矩形高度
     */
    isRectOutside(x: number, y: number, width: number, height: number) {
        return (
            x >= this.mapWidth ||
            y >= this.mapHeight ||
            x + width < 0 ||
            y + height < 0
        );
    }

    /**
     * 判断一个矩形是否完全在地图之内
     * @param x 矩形左上角横坐标
     * @param y 矩形左上角纵坐标
     * @param width 矩形长度
     * @param height 矩形高度
     */
    containsRect(x: number, y: number, width: number, height: number) {
        return (
            x + width <= this.mapWidth &&
            y + height <= this.mapHeight &&
            x >= 0 &&
            y >= 0
        );
    }

    /**
     * 设置背景图块
     * @param background 背景图块
     */
    setBackground(background: AllNumbers) {
        this.background = background;
        this.generateBackground();

        for (const ex of this.extend.values()) {
            ex.onBackgroundSet?.(this, background);
        }
    }

    /**
     * 将当前地图的背景图块绑定为一个地图的背景图块
     * @param floorId 楼层id
     */
    bindBackground(floorId: FloorIds) {
        const { defaultGround } = core.status.maps[floorId];
        if (defaultGround) {
            this.setBackground(texture.idNumberMap[defaultGround]);
        }
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

        for (const ex of this.extend.values()) {
            ex.onBackgroundGenerated?.(this, this.backImage);
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
            logger.warn(8);
            data.push(...Array(width - (data.length % width)).fill(0));
        }
        const height = Math.round(data.length / width);
        if (!this.containsRect(x, y, width, height)) {
            logger.warn(9);
            if (this.isRectOutside(x, y, width, height)) return;
        }
        // 特判特殊情况-全地图更新
        if (
            x === 0 &&
            y === 0 &&
            width === this.mapWidth &&
            height === this.mapHeight
        ) {
            // 为了不丢失引用，需要先清空，然后填充，不能直接赋值
            this.renderData.splice(0);
            this.renderData.push(...data);
        } else if (data.length === 1) {
            // 特判单个图块的情况
            const index = x + y * this.mapWidth;
            this.renderData[index] = data[0];
        } else {
            // 限定更新区域
            const startX = Math.max(0, x);
            const startY = Math.max(0, y);
            const endX = Math.min(this.mapWidth, width);
            const endY = Math.min(this.mapHeight, height);
            for (let nx = startX; nx < endX; nx++) {
                for (let ny = startY; ny < endY; ny++) {
                    // dx和dy表示数据在传入的data中的位置
                    const dx = nx - x;
                    const dy = ny - y;
                    const index = dx + dy * width;
                    const indexData = nx + nx * this.mapWidth;
                    this.renderData[indexData] = data[index];
                }
            }
        }
        // todo: 异步优化，到下一帧再更新
        if (calAutotile) this.calAutotiles(x, y, width, height);
        this.updateBlocks(x, y, width, height);
        this.updateBigImages(x, y, width, height);

        for (const ex of this.extend.values()) {
            ex.onDataPut?.(this, data, width, x, y, calAutotile);
        }
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

        for (const ex of this.extend.values()) {
            ex.onBigImagesUpdate?.(this, x, y, width, height, this.bigImages);
        }
    }

    /**
     * 计算自动元件的连接信息（会丢失autotiles属性的引用）
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

        for (const ex of this.extend.values()) {
            ex.onAutotilesCaled?.(this, x, y, width, height, this.autotiles);
        }
    }

    /**
     * 设置地图大小，会清空渲染数据（且丢失引用），因此后面应当紧跟 putRenderData，以保证渲染正常进行
     * @param width 地图宽度
     * @param height 地图高度
     */
    setMapSize(width: number, height: number) {
        this.mapWidth = width;
        this.mapHeight = height;
        this.renderData = Array(width * height).fill(0);
        this.autotiles = {};
        this.block.size(width, height);
        this.block.clearAllCache();

        for (const ex of this.extend.values()) {
            ex.onMapResize?.(this, width, height);
        }
    }

    /**
     * 给定一个矩形，更新其包含的块信息，注意由于自动元件的存在，实际判定范围会大一圈
     * @param x 图格的左上角横坐标
     * @param y 图格的左上角纵坐标
     * @param width 横向有多少个图格
     * @param height 纵向有多少个图格
     */
    updateBlocks(x: number, y: number, width: number, height: number) {
        const blocks = this.block.updateElementArea(
            x,
            y,
            width,
            height,
            Layer.FRAME_ALL
        );

        this.update(this);

        for (const ex of this.extend.values()) {
            ex.onBlocksUpdate?.(this, blocks, x, y, width, height);
        }
    }

    /**
     * 计算在传入的变换矩阵下，应该渲染哪些内容
     * @param transform 变换矩阵
     */
    calNeedRender(transform: Transform): NeedRenderData {
        if (this.parent instanceof LayerGroup) {
            // 如果处于地图组中，每个地图的渲染区域应该是一样的，因此可以缓存优化
            return this.parent.cacheNeedRender(transform, this.block);
        } else {
            return calNeedRenderOf(transform, this.cellSize, this.block);
        }
    }

    /**
     * 更新移动层的渲染信息
     */
    updateMovingRenderable() {
        this.movingRenderable = [];
        this.movingRenderable.push(...this.bigImages.values());
        this.movingRenderable.push(...this.moving);

        for (const ex of this.extend.values()) {
            ex.onMovingUpdate?.(this, this.movingRenderable);
        }
        this.sortMovingRenderable();
    }

    /**
     * 对移动层按照z坐标排序
     */
    sortMovingRenderable() {
        this.movingRenderable.sort((a, b) => a.zIndex - b.zIndex);
    }

    /**
     * 在下一帧更新moving层
     */
    requestUpdateMoving() {
        this.needUpdateMoving = true;
    }

    /**
     * 渲染当前地图
     */
    renderMap(transform: Transform, need: NeedRenderData) {
        this.staticMap.clear();
        this.movingMap.clear();
        this.backMap.clear();

        if (this.needUpdateMoving) this.updateMovingRenderable();
        this.needUpdateMoving = false;

        for (const ex of this.extend.values()) {
            ex.onBeforeRender?.(this, transform, need);
        }

        this.renderBack(transform, need);
        this.renderStatic(transform, need);
        this.renderMoving(transform);
        for (const ex of this.extend.values()) {
            ex.onAfterRender?.(this, transform, need);
        }
    }

    /**
     * 渲染背景图
     * @param transform 变换矩阵
     * @param need 需要渲染的块
     */
    protected renderBack(transform: Transform, need: NeedRenderData) {
        const cell = this.cellSize;
        const frame = (RenderItem.animatedFrame % 4) + 1;
        const blockSize = this.block.blockSize;
        const { back } = need;
        const { ctx } = this.backMap;

        const mat = transform.mat;
        const [a, b, , c, d, , e, f] = mat;
        ctx.setTransform(a, b, c, d, e, f);

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
    protected renderStatic(transform: Transform, need: NeedRenderData) {
        const cell = this.cellSize;
        const frame = RenderItem.animatedFrame % 4;
        const { width } = this.block.blockData;
        const blockSize = this.block.blockSize;
        const { ctx } = this.staticMap;

        ctx.save();

        const { res: render } = need;
        const [a, b, , c, d, , e, f] = transform.mat;
        ctx.setTransform(a, b, c, d, e, f);

        render.forEach(v => {
            const x = v % width;
            const y = Math.floor(v / width);
            const sx = x * blockSize;
            const sy = y * blockSize;
            const index = v * 4 + frame;

            const cache = this.block.cache.get(index);
            if (cache) {
                ctx.drawImage(
                    cache.canvas.canvas,
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
                    const i = data.animate === -1 ? f : data.animate;
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
            this.block.cache.set(index, {
                canvas: temp,
                symbol: temp.symbol
            });
        });

        ctx.restore();
    }

    /**
     * 渲染移动/大怪物层
     */
    protected renderMoving(transform: Transform) {
        const frame = RenderItem.animatedFrame;
        const cell = this.cellSize;
        const halfCell = cell / 2;
        const { ctx } = this.movingMap;

        ctx.save();
        const mat = transform.mat;
        const [a, b, , c, d, , e, f] = mat;
        ctx.setTransform(a, b, c, d, e, f);
        const max1 = Math.max(a, b, c, d) ** 2;
        const max2 = Math.max(core._PX_, core._PY_) * 2;
        const r = (max1 * max2) ** 2;

        this.movingRenderable.forEach(v => {
            const { x, y, image, render, animate } = v;
            const ff = frame % v.frame;
            const i = animate === -1 ? ff : animate;
            const [sx, sy, w, h] = render[i];
            const px = x * cell - w / 2 + halfCell;
            const py = y * cell - h + cell;
            const ex = px + w;
            const ey = py + h;

            if (
                (px + e) ** 2 > r ||
                (py + f) ** 2 > r ||
                (ex + e) ** 2 > r ||
                (ey + f) ** 2 > r
            ) {
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
    ): Promise<void> {
        const block = this.renderData[index];
        const fx = index % this.width;
        const fy = Math.floor(index / this.width);

        if (type === 'swap' || time === 0) {
            this.putRenderData([0], 1, fx, fy);
            this.putRenderData([block], 1, x, y);
            return Promise.resolve();
        } else {
            if (!time) return Promise.reject();
            const dx = x - fx;
            const dy = y - fy;
            return this.moveAs(
                index,
                x,
                y,
                progress => {
                    return [dx * progress, dy * progress, Math.floor(dy + fy)];
                },
                time
            );
        }
    }

    /**
     * 让图块按照一个函数进行移动
     * @param index 要移动的图块在渲染数据中的索引位置
     * @param x 目标位置横坐标
     * @param y 目标位置纵坐标
     * @param fn 移动函数，传入一个完成度（范围0-1），返回一个三元素数组，表示横纵格子坐标，可以是小数。
     *           第三个元素表示图块纵深，一般图块的纵深就是其纵坐标，当地图上有大怪物时，此举可以辅助渲染，
     *           否则可能会导致移动过程中与大怪物的层级关系不正确，比如全在大怪物身后。注意不建议频繁改动这个值，
     *           因为此举会导致层级的重新排序，降低渲染性能。
     * @param time 移动总时长
     * @param relative 是否是相对模式
     */
    moveAs(
        index: number,
        x: number,
        y: number,
        fn: TimingFn<3>,
        time: number,
        keep: boolean = false,
        relative: boolean = true
    ): Promise<void> {
        const block = this.renderData[index];
        const fx = index % this.mapWidth;
        const fy = Math.floor(index / this.mapWidth);
        const moving = Layer.getMovingRenderable(block, fx, fy);
        if (!moving) return Promise.reject();

        this.moving.add(moving);

        // 删除原始位置的图块
        this.putRenderData([0], 1, fx, fy);

        let nowZ = fy;
        const startTime = Date.now();
        return new Promise<void>(resolve => {
            this.delegateTicker(
                () => {
                    const now = Date.now();
                    const progress = (now - startTime) / time;
                    const [nx, ny, nz] = fn(progress);
                    const tx = relative ? nx + fx : nx;
                    const ty = relative ? ny + fy : ny;
                    moving.x = tx;
                    moving.y = ty;
                    moving.zIndex = nz;
                    if (nz !== nowZ) {
                        this.movingRenderable.sort(
                            (a, b) => a.zIndex - b.zIndex
                        );
                    }
                    this.update(this);
                },
                time,
                () => {
                    if (keep) this.putRenderData([block], 1, x, y);
                    this.moving.delete(moving);
                    resolve();
                }
            );
        });
    }

    /**
     * 移动一个可移动的renderable
     * @param data 移动renderable
     * @param x 起始横坐标，注意与`moveAs`的`x`区分
     * @param y 起始纵坐标，注意与`moveAs`的`y`区分
     * @param fn 移动函数
     * @param time 移动时间
     * @param relative 是否是相对模式，默认相对模式
     */
    moveRenderable(
        data: LayerMovingRenderable,
        x: number,
        y: number,
        fn: TimingFn<3>,
        time: number,
        relative: boolean = true
    ) {
        let nowZ = y;
        const startTime = Date.now();
        return new Promise<void>(resolve => {
            this.delegateTicker(
                () => {
                    const now = Date.now();
                    const progress = (now - startTime) / time;
                    const [nx, ny, nz] = fn(progress);
                    const tx = relative ? nx + x : nx;
                    const ty = relative ? ny + y : ny;
                    data.x = tx;
                    data.y = ty;
                    data.zIndex = nz;
                    if (nz !== nowZ) {
                        this.movingRenderable.sort(
                            (a, b) => a.zIndex - b.zIndex
                        );
                    }
                    this.update(this);
                },
                time,
                () => {
                    resolve();
                }
            );
        });
    }

    destroy(): void {
        for (const ex of this.extend.values()) {
            ex.onDestroy?.(this);
        }
        super.destroy();
        layerAdapter.remove(this);
    }

    /**
     * 根据图块信息初始化移动信息
     * @param num 图块数字
     * @param x 横坐标
     * @param y 纵坐标
     */
    static getMovingRenderable(num: number, x: number, y: number) {
        const renderable = texture.getRenderable(num);
        if (!renderable) return null;
        const image = renderable.autotile
            ? renderable.image[0]
            : renderable.image;
        const moving: LayerMovingRenderable = {
            x: x,
            y: y,
            zIndex: y,
            image: image,
            autotile: false,
            frame: renderable.frame,
            bigImage: renderable.bigImage,
            animate: -1,
            render: renderable.render
        };
        return moving;
    }
}

const layerAdapter = new RenderAdapter<Layer>('layer');
