import {
    Container,
    EContainerEvent,
    MotaOffscreenCanvas2D,
    Sprite,
    RenderItem,
    Transform,
    RenderAdapter
} from '@motajs/render-core';
import { logger } from '@motajs/common';
import { sleep, TimingFn } from 'mutate-animate';
import { RenderableData, texture } from './cache';
import { BlockCacher, CanvasCacheItem, ICanvasCacheItem } from './block';
import { IAnimateFrame, renderEmits } from './frame';
import { EventEmitter } from 'eventemitter3';
import {
    MAP_BLOCK_HEIGHT,
    MAP_BLOCK_WIDTH,
    MAP_HEIGHT,
    MAP_WIDTH
} from '../shared';

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

export interface ELayerGroupEvent extends EContainerEvent {}

export class LayerGroup
    extends Container<ELayerGroupEvent>
    implements IAnimateFrame
{
    /** 地图组列表 */
    // static list: Set<LayerGroup> = new Set();

    cellSize: number = 32;
    blockSize: number = MAP_BLOCK_WIDTH;

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

    private needRender?: Set<number>;
    readonly extend: Map<string, ILayerGroupRenderExtends> = new Map();

    constructor() {
        super('static', true);

        this.setHD(true);
        this.setAntiAliasing(false);
        this.size(MAP_WIDTH, MAP_HEIGHT);

        this.on('afterRender', () => {
            this.releaseNeedRender();
        });

        renderEmits.addFramer(this);

        const binder = new LayerGroupFloorBinder();
        this.extends(binder);
        binder.bindThis();
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        this.sortedChildren.forEach(v => {
            if (v.hidden) return;
            v.renderContent(canvas, this.camera);
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
        this.layers.forEach(v => {
            v.setCellSize(size);
        });
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
    addLayer(layer: FloorLayer | Layer) {
        if (typeof layer === 'string') {
            const l = new Layer();
            l.layer = layer;
            this.layers.set(layer, l);
            l.setZIndex(layerZIndex[layer]);
            this.appendChild(l);

            for (const ex of this.extend.values()) {
                ex.onLayerAdd?.(this, l);
            }

            return l;
        } else {
            if (layer.layer) {
                this.layers.set(layer.layer, layer);
                for (const ex of this.extend.values()) {
                    ex.onLayerAdd?.(this, layer);
                }
            }
            return layer;
        }
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

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'cellSize':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setCellSize(nextValue);
                return true;
            case 'blockSize':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setBlockSize(nextValue);
                return true;
            case 'floorId': {
                if (!this.assertType(nextValue, 'number', key)) return false;
                const binder = this.getExtends('floor-binder');
                if (binder instanceof LayerGroupFloorBinder) {
                    binder.bindFloor(nextValue);
                }
                return true;
            }
            case 'camera':
                if (!this.assertType(nextValue, Transform, key)) return false;
                this.camera = nextValue;
                return true;
        }
        return false;
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
): Set<number> {
    const w = MAP_BLOCK_WIDTH * cell;
    const h = MAP_BLOCK_HEIGHT * cell;
    const size = block.blockSize;
    const width = block.blockData.width;

    // -1是因为宽度是core._PX_，从0开始的话，末尾索引就是core._PX_ - 1
    const [px1, py1] = Transform.untransformed(transform, 0, 0);
    const [px2, py2] = Transform.untransformed(transform, w - 1, 0);
    const [px3, py3] = Transform.untransformed(transform, w - 1, h - 1);
    const [px4, py4] = Transform.untransformed(transform, 0, h - 1);

    const maxX = block.width * cell - 1;
    const maxY = block.height * cell - 1;

    const res: Set<number> = new Set();
    // 实际上不太可能一次性渲染非常多的图块，因此不需要非常细致地算出所有的格点，整体包含即可
    // 因此直接算其最小外接矩形即可
    const left = Math.max(0, Math.min(px1, px2, px3, px4));
    const right = Math.min(maxX, Math.max(px1, px2, px3, px4));
    const top = Math.max(0, Math.min(py1, py2, py3, py4));
    const bottom = Math.max(maxY, Math.max(py1, py2, py3, py4));

    const blockLeft = Math.floor(left / cell / size);
    const blockRight = Math.floor(right / cell / size);
    const blockTop = Math.floor(top / cell / size);
    const blockBottom = Math.floor(bottom / cell / size);

    for (let y = blockTop; y <= blockBottom; y++) {
        for (let x = blockLeft; x <= blockRight; x++) {
            res.add(x + y * width);
        }
    }

    return res;
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
    onBackgroundGenerated?(layer: Layer, images: MotaOffscreenCanvas2D[]): void;

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
        need: Set<number>
    ): void;

    /**
     * 在地图渲染之后执行的函数
     * @param layer 目标Layer实例
     * @param transform 渲染的变换矩阵
     * @param need 需要渲染的分块信息
     */
    onAfterRender?(layer: Layer, transform: Transform, need: Set<number>): void;

    /**
     * 当拓展被取消挂载时执行的函数（Layer被销毁，拓展被移除等）
     * @param layer 目标Layer实例
     */
    onDestroy?(layer: Layer): void;
}

export interface LayerMovingRenderable extends RenderableData {
    zIndex: number;
    x: number;
    y: number;
    alpha: number;
}

export interface ELayerEvent extends EContainerEvent {}

export class Layer extends Container<ELayerEvent> {
    // 一些会用到的常量
    static readonly FRAME_0 = 1;
    static readonly FRAME_1 = 2;
    static readonly FRAME_2 = 4;
    static readonly FRAME_3 = 8;
    static readonly FRAME_ALL = 15;

    /** 静态层，包含除大怪物及正在移动的内容外的内容 */
    protected staticMap = this.requireCanvas(true, false);
    /** 移动层，包含大怪物及正在移动的内容 */
    protected movingMap = this.requireCanvas(true, false);
    /** 背景图层 */
    protected backMap = this.requireCanvas(true, false);

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
    backImage: MotaOffscreenCanvas2D[] = [];
    /** 背景贴图 */
    floorImage: FloorAnimate[] = [];

    /** 分块信息 */
    block: BlockCacher<ICanvasCacheItem> = new BlockCacher(
        0,
        0,
        MAP_BLOCK_WIDTH,
        4
    );

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
        this.size(MAP_WIDTH, MAP_HEIGHT);

        this.staticMap.setHD(false);
        this.staticMap.setAntiAliasing(false);
        this.staticMap.size(MAP_WIDTH, MAP_HEIGHT);
        this.movingMap.setHD(false);
        this.movingMap.setAntiAliasing(false);
        this.movingMap.size(MAP_WIDTH, MAP_HEIGHT);
        this.backMap.setHD(false);
        this.backMap.setAntiAliasing(false);
        this.backMap.size(MAP_WIDTH, MAP_HEIGHT);
        this.main.setAntiAliasing(false);
        this.main.setHD(false);
        this.main.size(MAP_WIDTH, MAP_HEIGHT);

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
     * 设置每个图块的大小
     * @param size 每个图块的大小
     */
    setCellSize(size: number) {
        this.cellSize = size;
        this.update();
    }

    /**
     * 设置楼层贴图
     */
    setFloorImage(image: FloorAnimate[]) {
        this.floorImage = image;
        this.update();
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
        this.backImage.forEach(v => this.deleteCanvas(v));
        this.backImage = [];
        if (!data) return;

        const frame = data.frame;
        const temp = this.requireCanvas(true, false);
        temp.setHD(false);
        temp.setAntiAliasing(false);
        for (let i = 0; i < frame; i++) {
            const canvas = this.requireCanvas(true, false);
            const ctx = canvas.ctx;
            const tempCtx = temp.ctx;
            const [sx, sy, w, h] = data.render[i];
            canvas.setHD(false);
            canvas.setAntiAliasing(false);
            canvas.size(MAP_WIDTH, MAP_HEIGHT);
            temp.size(w, h);

            const img = data.autotile ? data.image[0b11111111] : data.image;
            tempCtx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
            const pattern = ctx.createPattern(temp.canvas, 'repeat');
            if (!pattern) continue;
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            this.backImage.push(canvas);
        }
        this.deleteCanvas(temp);

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
                    zIndex: ny,
                    alpha: 1
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
        const sx = x - 1;
        const sy = y - 1;
        const ex = x + width + 1;
        const ey = y + height + 1;
        const data = this.renderData;
        const tile = texture.autotile;
        const map = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;

        const w = this.mapWidth;
        const h = this.mapHeight;

        // todo: 如何定向优化？
        // this.autotiles = {};

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

        for (let nx = sx; nx < ex; nx++) {
            if (nx >= w || nx < 0) continue;
            for (let ny = sy; ny < ey; ny++) {
                if (ny >= h || ny < 0) continue;
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
        this.bigImages.clear();
        this.moving.clear();

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
    calNeedRender(transform: Transform): Set<number> {
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
    renderMap(transform: Transform, need: Set<number>) {
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
    protected renderBack(transform: Transform, need: Set<number>) {
        const cell = this.cellSize;
        const frame = (RenderItem.animatedFrame % 4) + 1;
        const blockSize = this.block.blockSize;
        const { ctx } = this.backMap;
        const { width } = this.block.blockData;

        const mat = transform.mat;
        const [a, b, , c, d, , e, f] = mat;
        ctx.setTransform(a, b, c, d, e, f);

        if (this.background !== 0) {
            // 画背景图
            const length = this.backImage.length;
            const img = this.backImage[frame % length];
            need.forEach(index => {
                if (index >= this.block.area || index < 0) return;
                const x = index % width;
                const y = Math.floor(index / width);
                const sx = x * blockSize;
                const sy = y * blockSize;
                ctx.drawImage(
                    img.canvas,
                    sx * cell,
                    sy * cell,
                    blockSize * cell,
                    blockSize * cell
                );
            });
        }

        if (this.floorImage.length > 0) {
            const images = core.material.images.images;
            this.floorImage.forEach(v => {
                if (v.disable) return;
                const { x, y } = v;
                ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
                ctx.drawImage(images[v.name], x, y);
            });
        }
    }

    /**
     * 渲染静态层
     */
    protected renderStatic(transform: Transform, need: Set<number>) {
        const cell = this.cellSize;
        const frame = RenderItem.animatedFrame % 4;
        const { width } = this.block.blockData;
        const blockSize = this.block.blockSize;
        const { ctx } = this.staticMap;

        const [a, b, , c, d, , e, f] = transform.mat;
        ctx.setTransform(a, b, c, d, e, f);

        const extend = this.getExtends('floor-binder') as LayerFloorBinder;
        const floor = extend ? extend.getFloor() : void 0;
        const map =
            this.layer === 'event' && floor
                ? core.status.mapBlockObjs[floor]
                : void 0;
        need.forEach(v => {
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

            const temp = this.requireCanvas(true, false);
            temp.setAntiAliasing(false);
            temp.setHD(false);
            temp.size(MAP_WIDTH, MAP_HEIGHT);

            // 先画到临时画布，用于缓存
            for (let nx = sx; nx < ex; nx++) {
                for (let ny = sy; ny < ey; ny++) {
                    if (map) {
                        const indexLoc = `${nx},${ny}`;
                        const block = map[indexLoc as LocString];
                        if (block?.disable) continue;
                    }
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
            this.block.cache.set(
                index,
                new CanvasCacheItem(temp, temp.symbol, this)
            );
        });
    }

    /**
     * 渲染移动/大怪物层
     */
    protected renderMoving(transform: Transform) {
        const frame = RenderItem.animatedFrame;
        const cell = this.cellSize;
        const halfCell = cell / 2;
        const { ctx } = this.movingMap;

        const mat = transform.mat;
        const [a, b, , c, d, , e, f] = mat;
        ctx.setTransform(a, b, c, d, e, f);
        const max1 = 1 / Math.min(a, b, c, d) ** 2;
        const max2 = Math.max(MAP_WIDTH, MAP_HEIGHT) * 2;
        const r = (max1 * max2) ** 2;

        this.movingRenderable.forEach(v => {
            const { x, y, image, render, animate, alpha } = v;
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

            ctx.globalAlpha = alpha;
            ctx.drawImage(image, sx, sy, w, h, px, py, w, h);
        });
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

        const nowZ = fy;
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
        const nowZ = y;
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

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'layer': {
                if (!this.assertType(nextValue, 'string', key)) return false;
                const parent = this.parent;
                if (parent instanceof LayerGroup) {
                    parent.removeLayer(this);
                    this.layer = nextValue;
                    parent.addLayer(this);
                } else {
                    this.layer = nextValue;
                }
                this.update();
                return true;
            }
            case 'cellSize':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setCellSize(nextValue);
                return true;
            case 'mapWidth':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setMapSize(nextValue, this.mapHeight);
                return true;
            case 'mapHeight':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setMapSize(this.mapWidth, nextValue);
                return true;
            case 'background':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setBackground(nextValue);
                return true;
            case 'floorImage':
                if (!this.assertType(nextValue, Array, key)) return false;
                this.setFloorImage(nextValue as FloorAnimate[]);
                return true;
        }
        return false;
    }

    private addToGroup(group: LayerGroup) {
        if (this.layer) {
            group.addLayer(this);
        }
    }

    private removeFromGroup(group: LayerGroup) {
        if (this.layer) {
            group.removeLayer(this);
        }
    }

    appendTo(parent: RenderItem): void {
        super.appendTo(parent);
        if (parent instanceof LayerGroup) {
            this.addToGroup(parent);
        }
    }

    remove(): boolean {
        if (this.parent instanceof LayerGroup) {
            this.removeFromGroup(this.parent);
        }
        return super.remove();
    }

    destroy(): void {
        for (const ex of this.extend.values()) {
            ex.onDestroy?.(this);
        }
        super.destroy();
        this.block.destroy();
        this.main.destroy();
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
            render: renderable.render,
            alpha: 1
        };
        return moving;
    }
}

const layerAdapter = new RenderAdapter<Layer>('layer');

export function createLayer() {
    const { hook } = Mota.require('@user/data-base');

    hook.on('setBlock', (x, y, floor, block) => {
        const isNow = floor === core.status.floorId;
        LayerGroupFloorBinder.activeBinder.forEach(v => {
            if (floor === v.floor || (isNow && v.bindThisFloor)) {
                v.setBlock('event', block, x, y);
            }
        });
        LayerFloorBinder.listenedBinder.forEach(v => {
            if (v.layer.layer === 'event') {
                if (v.floor === floor || (isNow && v.bindThisFloor)) {
                    v.setBlock(block, x, y);
                }
            }
        });
    });
    hook.on('changingFloor', floor => {
        // 潜在隐患：如果putRenderData改成异步，那么会变成两帧后才能真正刷新并渲染
        // 考虑到楼层转换一般不会同时执行很多次，因此这里改为立刻更新
        LayerGroupFloorBinder.activeBinder.forEach(v => {
            if (v.bindThisFloor) v.updateBindData();
            v.emit('floorChange', floor);
        });
        LayerFloorBinder.listenedBinder.forEach(v => {
            if (v.bindThisFloor) v.updateBindData();
        });
    });
    hook.on('setBgFgBlock', (name, number, x, y, floor) => {
        const isNow = floor === core.status.floorId;
        LayerGroupFloorBinder.activeBinder.forEach(v => {
            if (floor === v.floor || (isNow && v.bindThisFloor)) {
                v.setBlock(name, number, x, y);
            }
        });
        LayerFloorBinder.listenedBinder.forEach(v => {
            if (v.layer.layer === name) {
                if (v.floor === floor || (isNow && v.bindThisFloor)) {
                    v.setBlock(number, x, y);
                }
            }
        });
    });
}

interface LayerGroupBinderEvent {
    update: [floor: FloorIds];
    setBlock: [x: number, y: number, floor: FloorIds, block: AllNumbers];
    floorChange: [floor: FloorIds];
}

/**
 * 楼层绑定拓展，用于LayerGroup，将楼层数据传输到渲染系统。
 * 添加后，会自动在LayerGroup包含的子Layer上添加LayerFloorBinder拓展，用于后续处理。
 * 当移除这个拓展时，其附属的所有子拓展也会一并被移除。
 */
export class LayerGroupFloorBinder
    extends EventEmitter<LayerGroupBinderEvent>
    implements ILayerGroupRenderExtends
{
    id: string = 'floor-binder';

    bindThisFloor: boolean = true;
    floor?: FloorIds;
    group!: LayerGroup;

    /** 附属的子LayerFloorBinder拓展 */
    layerBinders: Set<LayerFloorBinder> = new Set();

    private needUpdate: boolean = false;

    static activeBinder: Set<LayerGroupFloorBinder> = new Set();

    /**
     * 绑定楼层为当前楼层，并跟随变化
     */
    bindThis() {
        this.floor = void 0;
        this.bindThisFloor = true;
        this.layerBinders.forEach(v => v.bindThis());
        this.updateBind();
    }

    /**
     * 绑定楼层为指定楼层
     * @param floorId 楼层id
     */
    bindFloor(floorId: FloorIds) {
        this.bindThisFloor = false;
        this.floor = floorId;
        this.layerBinders.forEach(v => v.bindFloor(floorId));
        this.updateBind();
    }

    /**
     * 在下一帧进行绑定数据更新
     */
    updateBind() {
        if (this.needUpdate || !this.group) return;
        this.needUpdate = true;
        this.group.requestBeforeFrame(() => {
            this.needUpdate = false;
            this.updateBindData();
        });
    }

    /**
     * 立刻进行数据绑定更新
     */
    updateBindData() {
        this.layerBinders.forEach(v => {
            v.updateBindData();
        });

        const floor = this.getFloor();
        this.emit('update', floor);
    }

    getFloor() {
        return this.bindThisFloor ? core.status.floorId : this.floor!;
    }

    /**
     * 设置图块
     */
    setBlock(layer: FloorLayer, block: AllNumbers, x: number, y: number) {
        const ex = this.group
            .getLayer(layer)
            ?.getExtends('floor-binder') as LayerFloorBinder;
        if (!ex) return;
        ex.setBlock(block, x, y);

        const floor = this.bindThisFloor ? core.status.floorId : this.floor!;
        this.emit('setBlock', x, y, floor, block);
    }

    checkLayerExtends(layer: Layer) {
        const ex = layer.getExtends('floor-binder');

        if (!ex) {
            const extend = new LayerFloorBinder(this);
            layer.extends(extend);
            this.layerBinders.add(extend);
        } else {
            if (ex instanceof LayerFloorBinder) {
                ex.setParent(this);
                this.layerBinders.add(ex);
            }
        }
    }

    awake(group: LayerGroup) {
        this.group = group;

        for (const layer of group.layers.values()) {
            this.checkLayerExtends(layer);
        }
        LayerGroupFloorBinder.activeBinder.add(this);
    }

    onLayerAdd(_group: LayerGroup, layer: Layer): void {
        this.checkLayerExtends(layer);
    }

    onDestroy(group: LayerGroup) {
        LayerGroupFloorBinder.activeBinder.delete(this);
        group.layers.forEach(v => {
            v.removeExtends('floor-binder');
        });
        this.removeAllListeners();
    }
}

/**
 * 楼层绑定拓展，用于Layer的楼层渲染。
 * 注意，如果目标Layer是LayerGroup的子元素，那么会自动检测父元素是否包含LayerGroupFloorBinder拓展，
 * 如果包含，那么会自动将此拓展附加至父元素的拓展。当父元素的拓展被移除时，此拓展也会一并被移除。
 */
export class LayerFloorBinder implements ILayerRenderExtends {
    id: string = 'floor-binder';

    parent?: LayerGroupFloorBinder;
    layer!: Layer;
    bindThisFloor: boolean = true;
    floor?: FloorIds;

    static listenedBinder: Set<LayerFloorBinder> = new Set();

    private needUpdate: boolean = false;

    constructor(parent?: LayerGroupFloorBinder) {
        this.parent = parent;
    }

    /**
     * 绑定楼层为当前楼层，并跟随变化
     */
    bindThis() {
        this.floor = void 0;
        this.bindThisFloor = true;
        this.updateBind();
    }

    /**
     * 绑定楼层为指定楼层
     * @param floorId 楼层id
     */
    bindFloor(floorId: FloorIds) {
        this.bindThisFloor = false;
        this.floor = floorId;
        this.updateBind();
    }

    getFloor() {
        return this.bindThisFloor ? core.status.floorId : this.floor!;
    }

    /**
     * 设置这个拓展附属至的父拓展（LayerGroupFloorBinder拓展）
     * @param parent 父拓展
     */
    setParent(parent?: LayerGroupFloorBinder) {
        this.parent = parent;
        this.checkListen();
    }

    private checkListen() {
        if (this.parent) LayerFloorBinder.listenedBinder.delete(this);
        else LayerFloorBinder.listenedBinder.add(this);
    }

    /**
     * 在下一帧进行绑定数据更新
     */
    updateBind() {
        if (this.needUpdate) return;
        this.needUpdate = true;
        this.layer.requestBeforeFrame(() => {
            this.needUpdate = false;
            this.updateBindData();
        });
    }

    /**
     * 设置图块
     */
    setBlock(block: AllNumbers, x: number, y: number) {
        this.layer.putRenderData([block], 1, x, y);
    }

    /**
     * 立刻更新绑定数据，而非下一帧
     */
    updateBindData() {
        const floor = this.getFloor();
        if (!floor) return;
        core.extractBlocks(floor);
        const map = core.status.maps[floor];
        this.layer.setMapSize(map.width, map.height);
        const image = core.status.maps[this.getFloor()].images;
        if (this.layer.layer === 'event') {
            const m = map.map;
            this.layer.putRenderData(m.flat(), map.width, 0, 0);
        } else {
            const m = core.maps._getBgFgMapArray(this.layer.layer!, floor);
            this.layer.putRenderData(m.flat(), map.width, 0, 0);
        }
        if (this.layer.layer === 'bg') {
            // 别忘了背景图块
            this.layer.setBackground(texture.idNumberMap[map.defaultGround]);
        }
        const toDraw = image?.filter(v => v.canvas === this.layer.layer);
        this.layer.setFloorImage(toDraw ?? []);
    }

    awake(layer: Layer) {
        this.layer = layer;
        if (!this.parent) {
            const group = layer.parent;
            if (group instanceof LayerGroup) {
                const ex = group.getExtends('floor-binder');
                if (ex instanceof LayerGroupFloorBinder) {
                    ex.checkLayerExtends(layer);
                    this.parent = ex;
                }
            }
        }
        this.checkListen();
    }

    onDestroy(_layer: Layer) {
        LayerFloorBinder.listenedBinder.delete(this);
        this.parent?.layerBinders.delete(this);
    }
}

interface DoorAnimateRenderable {
    renderable: LayerMovingRenderable;
    count: number;
    perTime: number;
}

export class LayerDoorAnimate implements ILayerRenderExtends {
    id: string = 'door-animate';

    layer!: Layer;

    private moving: Set<LayerMovingRenderable> = new Set();

    private getRenderable(block: Block): DoorAnimateRenderable | null {
        const { x, y, id } = block;
        const renderable = texture.getRenderable(id);
        if (!renderable) return null;
        const image = renderable.autotile
            ? renderable.image[0]
            : renderable.image;
        const time = block.event.doorInfo?.time ?? 160;
        const frame = renderable.render.length;
        const perTime = time / frame;

        const data: LayerMovingRenderable = {
            x,
            y,
            zIndex: y,
            image,
            autotile: false,
            animate: 0,
            frame,
            bigImage: false,
            render: renderable.render,
            alpha: 1
        };
        return { renderable: data, count: frame, perTime };
    }

    /**
     * 开门
     * @param block 图块信息
     */
    async openDoor(block: Block) {
        const renderable = this.getRenderable(block);
        if (!renderable) return Promise.reject();
        const { renderable: data, count: frame, perTime } = renderable;
        data.animate = 0;
        this.moving.add(data);
        this.layer.requestUpdateMoving();

        let now = 0;
        while (now < frame) {
            await sleep(perTime);
            data.animate = ++now;
            this.layer.update(this.layer);
        }

        this.moving.delete(data);
        this.layer.requestUpdateMoving();
        return Promise.resolve();
    }

    /**
     * 关门
     * @param block 图块信息
     */
    async closeDoor(block: Block) {
        const renderable = this.getRenderable(block);
        if (!renderable) return Promise.reject();
        const { renderable: data, count: frame, perTime } = renderable;
        data.animate = frame - 1;
        this.moving.add(data);
        this.layer.requestUpdateMoving();

        let now = 0;
        while (now >= 0) {
            await sleep(perTime);
            data.animate = --now;
            this.layer.update(this.layer);
        }
        this.moving.delete(data);
        this.layer.requestUpdateMoving();
        return Promise.resolve();
    }

    awake(layer: Layer) {
        this.layer = layer;
        doorAdapter.add(this);
    }

    onMovingUpdate(_layer: Layer, renderable: LayerMovingRenderable[]): void {
        renderable.push(...this.moving);
    }

    onDestroy(_layer: Layer): void {
        doorAdapter.remove(this);
    }
}

const doorAdapter = new RenderAdapter<LayerDoorAnimate>('door-animate');
doorAdapter.receive('openDoor', (item, block: Block) => {
    return item.openDoor(block);
});
doorAdapter.receive('closeDoor', (item, block: Block) => {
    return item.closeDoor(block);
});
