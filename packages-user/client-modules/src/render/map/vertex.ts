import { IMapLayer } from '@user/data-state';
import {
    IBlockData,
    IBlockSplitter,
    IContextData,
    IIndexedMapVertexData,
    ILayerDirtyData,
    IMapBlockUpdateObject,
    IMapRenderer,
    IMapVertexArray,
    IMapVertexBlock,
    IMapVertexData,
    IMapVertexGenerator,
    IMovingBlock,
    MapTileAlign,
    MapTileBehavior,
    MapTileSizeTestMode
} from './types';
import { logger, PrivateBooleanDirtyTracker } from '@motajs/common';
import { DYNAMIC_RESERVE, MAP_BLOCK_HEIGHT, MAP_BLOCK_WIDTH } from '../shared';
import { BlockSplitter } from './block';
import { clamp, isNil } from 'lodash-es';
import { BlockCls, IMaterialFramedData } from '@user/client-base';
import { IRect } from '@motajs/render-assets';
import { INSTANCED_COUNT } from './constant';

export interface IMapDataGetter {
    /** 图块缩小行为，即图块比格子大时应该如何处理 */
    readonly tileMinifyBehavior: MapTileBehavior;
    /** 图块放大行为，即图块比格子小时应该如何处理 */
    readonly tileMagnifyBehavior: MapTileBehavior;
    /** 图块水平对齐，仅当图块行为为 `KeepSize` 时有效 */
    readonly tileAlignX: MapTileAlign;
    /** 图块竖直对齐，仅当图块行为为 `KeepSize` 时有效 */
    readonly tileAlignY: MapTileAlign;
    /** 图块大小与格子大小判断方式 */
    readonly tileTestMode: MapTileSizeTestMode;

    /**
     * 渲染器是否包含指定的移动图块对象
     * @param moving 移动图块对象
     */
    hasMoving(moving: IMovingBlock): boolean;

    /**
     * 申请更新渲染
     */
    requestUpdate(): void;
}

interface BlockMapPos {
    /** 图块的图块数字 */
    readonly num: number;
    /** 地图中的横坐标 */
    readonly mapX: number;
    /** 地图中的纵坐标 */
    readonly mapY: number;
}

interface IndexedBlockMapPos extends BlockMapPos {
    /** 图块所在的图层 */
    readonly layer: IMapLayer;
    /** 图块在分块中的索引 */
    readonly blockIndex: number;
}

interface BlockIndex extends IndexedBlockMapPos {
    /** 图块在分块中的横坐标 */
    readonly blockX: number;
    /** 图块在分块中的纵坐标 */
    readonly blockY: number;
    /** 地图中的索引 */
    readonly mapIndex: number;
}

interface VertexArrayOfBlock {
    /** 图块在数组中的起始索引 */
    readonly index: number;
    /** 分块顶点数组 */
    readonly array: Float32Array;
    /** 分块数据 */
    readonly block: IBlockData<MapVertexBlock>;
}

const enum VertexUpdate {
    /** 更新顶点位置信息 */
    Position = 0b001,
    /** 更新贴图信息 */
    Texture = 0b010,
    /** 是否更新默认帧数 */
    Frame = 0b100,
    /** 除帧数外全部更新 */
    NoFrame = 0b011,
    /** 全部更新 */
    All = 0b111
}

/**
 * 构建地图顶点数组，当且仅当数组长度发生变化时才会标记为脏，需要完全重新分配内存。
 */
export class MapVertexGenerator
    extends PrivateBooleanDirtyTracker
    implements IMapVertexGenerator
{
    //#region 属性声明

    dynamicRenderDirty: boolean = true;

    dynamicStart: number = 0;
    dynamicCount: number = DYNAMIC_RESERVE;

    /** 空顶点数组，因为空顶点很常用，所以直接定义一个全局常量 */
    private static readonly EMPTY_VETREX: Float32Array = new Float32Array(
        // prettier-ignore
        [
            0, 0, 0, 0, // 顶点坐标
            0, 0, 0, 0, // 纹理坐标
            0, 1, 0, 0, // a_tileData，不透明度需要设为 1
            -1, 0, 0, 0, // a_texData，当前帧数需要设为 -1
        ]
    );

    readonly block: IBlockSplitter<MapVertexBlock>;

    /** 偏移数组 */
    private instancedArray: Float32Array = new Float32Array();
    /** 动态内容偏移数组 */
    private dynamicInstancedArray: Float32Array = new Float32Array();

    /** 分块宽度 */
    private blockWidth: number = MAP_BLOCK_WIDTH;
    /** 分块高度 */
    private blockHeight: number = MAP_BLOCK_HEIGHT;

    /** 地图宽度 */
    private mapWidth: number = 0;
    /** 地图高度 */
    private mapHeight: number = 0;

    /** 是否需要重建数组 */
    private needRebuild: boolean = false;

    /** 更新图块性能检查防抖起始时刻 */
    private updateCallDebounceTime: number = 0;
    /** 更新图块性能检查的调用次数 */
    private updateCallDebounceCount: number = 0;

    constructor(
        readonly renderer: IMapRenderer & IMapDataGetter,
        readonly data: IContextData
    ) {
        super();
        this.resizeMap();
        this.block = new BlockSplitter();
    }

    //#endregion

    //#region 分块操作

    private mallocVertexArray() {
        // 顶点数组尺寸等于 地图大小 * 每个图块的顶点数量 * 每个顶点的数据量
        const area = this.renderer.mapWidth * this.renderer.mapHeight;
        const staticCount = area * this.renderer.layerCount;
        const count = staticCount + this.dynamicCount;
        const offsetSize = count * INSTANCED_COUNT;
        this.instancedArray = new Float32Array(offsetSize);
        this.dynamicStart = staticCount;
        this.dynamicInstancedArray = this.instancedArray.subarray(
            staticCount * INSTANCED_COUNT,
            count * INSTANCED_COUNT
        );
        // 不透明度默认是 1，帧数默认是 -1
        for (let i = 0; i < count; i++) {
            const start = i * INSTANCED_COUNT;
            this.instancedArray[start + 9] = 1;
            this.instancedArray[start + 12] = -1;
        }
    }

    private splitBlock() {
        this.block.configSplitter({
            dataWidth: this.mapWidth,
            dataHeight: this.mapHeight,
            blockWidth: this.blockWidth,
            blockHeight: this.blockHeight
        });
        const blockCount = this.blockWidth * this.blockHeight;
        const lineCount = this.mapWidth * this.blockHeight;
        const lastCount = (this.mapHeight % this.blockHeight) * this.blockWidth;
        const bh = Math.floor(this.mapHeight / this.blockHeight);
        const lastStart = bh * lineCount;
        this.block.splitBlocks(block => {
            // 最后一行的算法与其他行不同
            const startIndex =
                block.height < this.blockHeight
                    ? lastStart + lastCount * block.x
                    : lineCount * block.y + blockCount * block.x;
            const count = block.width * block.height;

            const origin: IMapVertexData = {
                instancedArray: this.instancedArray
            };
            const data = new MapVertexBlock(
                this.renderer,
                origin,
                startIndex,
                count,
                block.width,
                block.height
            );
            return data;
        });
    }

    setBlockSize(width: number, height: number): void {
        this.blockWidth = width;
        this.blockHeight = height;
        this.mallocVertexArray();
        this.splitBlock();
    }

    resizeMap(): void {
        if (
            this.mapWidth !== this.renderer.mapWidth ||
            this.mapHeight !== this.renderer.mapHeight
        ) {
            this.needRebuild = true;
            this.mapWidth = this.renderer.mapWidth;
            this.mapHeight = this.renderer.mapHeight;
        }
    }

    expandMoving(targetSize: number): void {
        const beforeOffset = this.instancedArray;
        this.dynamicCount = targetSize;
        this.mallocVertexArray();
        this.instancedArray.set(beforeOffset);
        const array: IMapVertexData = {
            instancedArray: this.instancedArray
        };
        // 重建一下对应分块就行了，不需要重新分块
        for (const block of this.block.iterateBlocks()) {
            block.data.rebuild(array);
        }
    }

    reduceMoving(targetSize: number): void {
        const beforeOffsetLength = this.instancedArray.length;
        const deltaLength = this.dynamicCount - targetSize;
        this.dynamicCount = targetSize;
        this.instancedArray = this.instancedArray.subarray(
            0,
            beforeOffsetLength - deltaLength * INSTANCED_COUNT
        );
        this.dynamicInstancedArray = this.dynamicInstancedArray.subarray(
            0,
            targetSize * INSTANCED_COUNT
        );
        // 这个不需要重新分配内存，依然共用同一个 ArrayBuffer，因此不需要重新分块
    }

    updateLayerArray(): void {
        this.needRebuild = true;
    }

    checkRebuild() {
        if (!this.needRebuild) return;
        this.needRebuild = false;
        this.mallocVertexArray();
        this.splitBlock();
        this.dirty();
    }

    //#endregion

    //#region 顶点数组更新

    /**
     * 获取图块经过对齐与缩放后的位置
     * @param pos 图块位置信息
     * @param width 图块的贴图宽度
     * @param height 图块的贴图高度
     */
    private getTilePosition(
        pos: BlockMapPos,
        width: number,
        height: number
    ): Readonly<IRect> {
        const {
            renderWidth,
            renderHeight,
            cellWidth,
            cellHeight,
            tileMinifyBehavior,
            tileMagnifyBehavior,
            tileAlignX,
            tileAlignY,
            tileTestMode
        } = this.renderer;
        const larger =
            tileTestMode === MapTileSizeTestMode.WidthOrHeight
                ? width > cellWidth || height > cellHeight
                : width > cellWidth && height > cellHeight;
        // 放大行为多数是适应到格子大小，因此把尺寸相等也归为放大行为，性能表现会更好
        const mode = larger ? tileMinifyBehavior : tileMagnifyBehavior;
        const cwu = cellWidth / renderWidth; // normalized cell width in range [0, 1]
        const chu = cellHeight / renderHeight; // normalized cell width in range [0, 1]
        const cw = cwu * 2; // normalized cell width in range [-1, 1]
        const ch = chu * 2; // normalized cell height in range [-1, 1]
        const cl = pos.mapX * cw - 1; // cell left
        const ct = 1 - pos.mapY * ch; // cell top
        if (mode === MapTileBehavior.FitToSize) {
            // 适应到格子大小
            return {
                x: cl,
                y: ct,
                w: cw,
                h: ch
            };
        } else {
            // 维持大小，需要判断对齐
            // 下面这些计算是经过推导后的最简表达式，因此和语义可能不同
            // twu, thu, cwu, chu 的准确含义应该是“归一化尺寸的一半”，这样就好理解了

            const twu = width / renderWidth; // normalized texture width in range [0, 1]
            const thu = height / renderHeight; // normalized texture width in range [0, 1]
            const tw = twu * 2; // normalized texture width in range [-1, 1]
            const th = thu * 2; // normalized texture height in range [-1, 1]
            let left = 0;
            let top = 0;
            switch (tileAlignX) {
                case MapTileAlign.Start: {
                    // 左对齐
                    left = cl;
                    break;
                }
                case MapTileAlign.Center: {
                    // 左右居中对齐
                    left = cl - cwu + twu;
                    break;
                }
                case MapTileAlign.End: {
                    // 右对齐
                    left = cl - cw + tw;
                    break;
                }
            }
            switch (tileAlignY) {
                case MapTileAlign.Start: {
                    // 上对齐
                    top = ct;
                    break;
                }
                case MapTileAlign.Center: {
                    // 上下居中对齐
                    top = ct - chu + thu;
                    break;
                }
                case MapTileAlign.End: {
                    // 下对齐
                    top = ct - ch + th;
                }
            }
            return { x: left, y: top, w: tw, h: th };
        }
    }

    /**
     * 更新指定图块的顶点数组信息
     * @param vertex 顶点数组对象
     * @param rect 可渲染对象的矩形区域
     * @param index 图块索引对象
     * @param assetIndex 贴图所在的图集索引
     * @param offsetIndex 贴图偏移值所在偏移池的索引
     * @param frames 贴图总帧数
     * @param update 顶点坐标更新方式
     */
    private updateTileVertex(
        vertex: IMapVertexData,
        rect: Readonly<IRect>,
        index: IndexedBlockMapPos,
        assetIndex: number,
        offsetIndex: number,
        frames: number,
        update: VertexUpdate,
        dynamic: boolean
    ) {
        const { instancedArray } = vertex;
        // 顶点数组
        const { layerCount, assetWidth, assetHeight } = this.renderer;
        const { x, y, w: width, h: height } = rect;
        const startIndex = index.blockIndex * INSTANCED_COUNT;
        if (update & VertexUpdate.Position) {
            // 如果需要更新顶点坐标
            const layerIndex = this.renderer.getLayerIndex(index.layer);
            // 避免 z 坐标是 1 的时候被裁剪，因此范围选择 [-0.9, 0.9]
            const layerStart = (layerIndex / layerCount) * 1.8 - 0.9;
            const perBlockZ = 1 / this.mapHeight / layerCount;
            const blockZ = index.mapY * perBlockZ;
            const zIndex = -layerStart - blockZ - (dynamic ? perBlockZ : 0);
            const { x, y, w, h } = this.getTilePosition(index, width, height);
            // 图块位置
            instancedArray[startIndex] = x;
            instancedArray[startIndex + 1] = y;
            instancedArray[startIndex + 2] = w;
            instancedArray[startIndex + 3] = h;
            // 图块纵深
            instancedArray[startIndex + 8] = zIndex;
        }
        if (update & VertexUpdate.Texture) {
            const texX = x / assetWidth;
            const texY = y / assetHeight;
            const texWidth = width / assetWidth;
            const texHeight = height / assetHeight;
            // 纹理坐标
            instancedArray[startIndex + 4] = texX;
            instancedArray[startIndex + 5] = texY;
            instancedArray[startIndex + 6] = texWidth;
            instancedArray[startIndex + 7] = texHeight;
            // 帧数、偏移、纹理索引
            instancedArray[startIndex + 13] = frames;
            instancedArray[startIndex + 14] = offsetIndex;
            instancedArray[startIndex + 15] = assetIndex;
        }
        if (update & VertexUpdate.Frame) {
            const defaultFrame = this.renderer.manager.getDefaultFrame(
                index.num
            );
            instancedArray[startIndex + 12] = defaultFrame;
        }
    }

    /**
     * 更新指定点的自动元件，不会检查中心点是不是自动元件
     * @param mapArray 地图数组
     * @param vertex 顶点数组对象
     * @param index 中心图块索引
     * @param tile 图块的素材对象
     * @param update 顶点数组更新方式
     */
    private updateAutotile(
        mapArray: Uint32Array,
        vertex: IMapVertexData,
        index: BlockIndex,
        tile: IMaterialFramedData,
        update: VertexUpdate,
        dynamic: boolean
    ) {
        const autotile = this.renderer.autotile;
        const { connection, center } = autotile.connect(
            mapArray,
            index.mapIndex,
            this.mapWidth
        );
        // 使用不带检查的版本可以减少分支数量，提升性能
        const renderable = autotile.renderWithoutCheck(tile, connection);
        if (!renderable) return;
        const assetIndex = this.renderer.getAssetSourceIndex(renderable.source);
        const offsetIndex = this.renderer.getOffsetIndex(tile.offset);
        if (assetIndex === -1 || offsetIndex === -1) {
            logger.error(40, center.toString());
            return;
        }
        this.updateTileVertex(
            vertex,
            renderable.rect,
            index,
            assetIndex,
            offsetIndex,
            tile.frames,
            update,
            dynamic
        );
    }

    /**
     * 处理一个自动元件周围一圈的自动元件连接
     * @param mapArray 地图图块数组
     * @param vertex 顶点数组对象
     * @param index 原始索引
     * @param dx 横坐标偏移
     * @param dy 纵坐标偏移
     */
    private checkAutotileConnectionAround(
        layer: IMapLayer,
        mapArray: Uint32Array,
        index: BlockIndex,
        dx: number,
        dy: number
    ) {
        const mx = index.mapX + dx;
        const my = index.mapY + dy;
        const block = this.block.getBlockByDataLoc(mx, my);
        if (!block) return;
        const vertex = block.data.getLayerData(layer);
        if (!vertex) return;
        const bx = mx - block.dataX;
        const by = my - block.dataY;
        const mapIndex = my * this.mapWidth + mx;
        const num = mapArray[mapIndex];
        const newIndex: BlockIndex = {
            layer,
            num,
            mapX: mx,
            mapY: my,
            mapIndex,
            blockX: bx,
            blockY: by,
            blockIndex: by * block.width + bx
        };
        const tile = this.renderer.manager.getTile(mapArray[newIndex.mapIndex]);
        if (!tile || tile.cls !== BlockCls.Autotile) return;
        this.updateAutotile(
            mapArray,
            vertex,
            newIndex,
            tile,
            // 周围一圈的自动元件应该只更新贴图，不需要更新位置和默认帧数
            VertexUpdate.Texture,
            false
        );
        block.data.markRenderDirty();
    }

    /**
     * 更新指定的顶点数组
     * @param mapArray 地图图块数组，用于自动元件判定
     * @param vertex 顶点数组对象
     * @param index 图块索引对象
     * @param num 图块数字
     */
    private updateVertexArray(
        mapArray: Uint32Array,
        vertex: IMapVertexData,
        index: BlockIndex,
        num: number,
        dynamic: boolean
    ) {
        // 此处仅更新当前图块，不更新周围一圈的自动元件
        // 周围一圈的自动元件需要在更新某个图块或者某个区域时处理，不在这里处理
        const tile = this.renderer.manager.getIfBigImage(num);

        if (!tile) {
            // 不存在可渲染对象，认为是空图块
            const { instancedArray } = vertex;
            const instancedStart = index.blockIndex * INSTANCED_COUNT;
            // 只把坐标改成 0 就可以了，其他的保留
            instancedArray[instancedStart] = 0;
            instancedArray[instancedStart + 1] = 0;
            instancedArray[instancedStart + 2] = 0;
            instancedArray[instancedStart + 3] = 0;
            return;
        }

        // todo: 这样的话，如果更新了指定分块，那么本来设置的帧数也会重置为默认帧数，如何修改？
        if (tile.cls === BlockCls.Autotile) {
            // 如果图块是自动元件
            this.updateAutotile(
                mapArray,
                vertex,
                index,
                tile,
                // 图块变了，所以全部要更新
                VertexUpdate.All,
                dynamic
            );
        } else {
            // 正常图块
            const renderable = tile.texture.render();
            // 宽度要除以帧数，因为我们假设所有素材都是横向平铺的
            const rect: IRect = {
                x: renderable.rect.x,
                y: renderable.rect.y,
                w: renderable.rect.w / tile.frames,
                h: renderable.rect.h
            };
            const assetIndex = this.renderer.getAssetSourceIndex(
                renderable.source
            );
            const offsetIndex = this.renderer.getOffsetIndex(tile.offset);
            if (assetIndex === -1 || offsetIndex === -1) {
                logger.error(40, num.toString());
                return;
            }
            this.updateTileVertex(
                vertex,
                rect,
                index,
                assetIndex,
                offsetIndex,
                tile.frames,
                // 图块变了，所以全部要更新
                VertexUpdate.All,
                dynamic
            );
        }
    }

    /**
     * 更新指定图块，但是不包含调用性能检查
     * @param layer 更新的图层
     * @param block 设置为的图块
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    private updateBlockVertex(
        layer: IMapLayer,
        num: number,
        x: number,
        y: number
    ) {
        const block = this.block.getBlockByDataLoc(x, y);
        if (!block) return;
        const vertex = block.data.getLayerData(layer);
        const data = layer.getMapRef();
        if (!vertex) return;
        const { array } = data;
        const dx = x - block.dataX;
        const dy = y - block.dataY;
        const dIndex = dy * block.width + dx;
        const index: BlockIndex = {
            layer,
            num,
            mapX: x,
            mapY: y,
            mapIndex: y * this.mapWidth + x,
            blockX: block.x,
            blockY: block.y,
            blockIndex: dIndex
        };

        // 需要检查周围一圈的自动元件
        this.checkAutotileConnectionAround(layer, array, index, -1, -1);
        this.checkAutotileConnectionAround(layer, array, index, 0, -1);
        this.checkAutotileConnectionAround(layer, array, index, 1, -1);
        this.checkAutotileConnectionAround(layer, array, index, 1, 0);
        this.checkAutotileConnectionAround(layer, array, index, 1, 1);
        this.checkAutotileConnectionAround(layer, array, index, 0, 1);
        this.checkAutotileConnectionAround(layer, array, index, -1, 1);
        this.checkAutotileConnectionAround(layer, array, index, -1, 0);
        // 再更新当前图块
        this.updateVertexArray(array, vertex, index, num, false);
        block.data.markRenderDirty();
    }

    //#endregion

    //#region 更新接口

    /**
     * 性能监测，如果频繁调用 `updateArea` `updateBlock` `updateBlockList` 则抛出警告
     */
    private checkUpdateCallPerformance(method: string) {
        const now = performance.now();
        if (now - this.updateCallDebounceTime <= 10) {
            this.updateCallDebounceCount++;
        } else {
            this.updateCallDebounceCount = 0;
            this.updateCallDebounceTime = now;
        }
        if (this.updateCallDebounceCount >= 50) {
            logger.warn(83, method);
            this.updateCallDebounceCount = 0;
            this.updateCallDebounceTime = now;
        }
    }

    updateArea(
        layer: IMapLayer,
        x: number,
        y: number,
        w: number,
        h: number
    ): void {
        if (!this.renderer.hasLayer(layer)) return;
        this.checkRebuild();
        // 这里多一圈是因为要更新这一圈的自动元件
        const ax = x - 1;
        const ay = y - 1;
        const areaRight = x + w + 1;
        const areaBottom = y + h + 1;
        const blocks = this.block.iterateBlocksOfDataArea(ax, ay, w + 2, h + 2);

        for (const block of blocks) {
            const left = ax - block.dataX;
            const top = ay - block.dataY;
            const right = Math.min(areaRight - block.dataX, left + block.width);
            const bottom = Math.min(
                areaBottom - block.dataY,
                top + block.height
            );
            block.data.markDirty(layer, left, top, right, bottom);
            block.data.markRenderDirty();
        }
    }

    updateBlock(layer: IMapLayer, num: number, x: number, y: number): void {
        if (import.meta.env.DEV) {
            this.checkUpdateCallPerformance('updateBlock');
        }
        this.checkRebuild();
        this.updateBlockVertex(layer, num, x, y);
    }

    updateBlockList(layer: IMapLayer, blocks: IMapBlockUpdateObject[]): void {
        if (!this.renderer.hasLayer(layer)) return;
        if (import.meta.env.DEV) {
            this.checkUpdateCallPerformance('updateBlockList');
        }
        this.checkRebuild();

        if (blocks.length <= 50) {
            blocks.forEach(({ block: num, x, y }) => {
                this.updateBlockVertex(layer, num, x, y);
            });
            return;
        }

        // 对于超出50个的更新操作使用懒更新
        blocks.forEach(v => {
            const block = this.block.getBlockByDataLoc(v.x, v.y);
            if (!block) return;
            const bx = v.x - block.dataX;
            const by = v.y - block.dataY;
            block.data.markDirty(layer, bx - 1, by - 1, bx + 2, by + 2);
            block.data.markRenderDirty();
            const left = bx === 0;
            const top = by === 0;
            const right = bx === block.width - 1;
            const bottom = by === block.height - 1;
            // 需要更一圈的自动元件
            if (left) {
                // 左侧的分块需要更新
                const nextBlock = block.left();
                if (nextBlock) {
                    const { width: w, data } = nextBlock;
                    data.markDirty(layer, w - 1, by - 1, w, by + 1);
                    data.markRenderDirty();
                }
                if (top) {
                    // 左上侧的分块需要更新
                    const nextBlock = block.leftUp();
                    if (nextBlock) {
                        const { width: w, height: h, data } = nextBlock;
                        data.markDirty(layer, w - 1, h - 1, w, h);
                        data.markRenderDirty();
                    }
                }
                if (bottom) {
                    // 左下侧的分块需要更新
                    const nextBlock = block.leftDown();
                    if (nextBlock) {
                        const { width: w, data } = nextBlock;
                        data.markDirty(layer, w - 1, 0, w, 1);
                        data.markRenderDirty();
                    }
                }
            }
            if (top) {
                // 上侧的分块需要更新
                const nextBlock = block.up();
                if (nextBlock) {
                    const { height: h, data } = nextBlock;
                    data.markDirty(layer, bx - 1, h - 1, bx + 1, h);
                    data.markRenderDirty();
                }
            }
            if (right) {
                // 右侧的分块需要更新
                const nextBlock = block.right();
                if (nextBlock) {
                    const { data } = nextBlock;
                    data.markDirty(layer, 0, by - 1, 1, by + 1);
                    data.markRenderDirty();
                }
                if (top) {
                    // 右上侧的分块需要更新
                    const nextBlock = block.rightUp();
                    if (nextBlock) {
                        const { height: h, data } = nextBlock;
                        data.markDirty(layer, 0, h - 1, 1, h);
                        data.markRenderDirty();
                    }
                }
                if (bottom) {
                    // 右下侧的分块需要更新
                    const nextBlock = block.rightDown();
                    if (nextBlock) {
                        const { data } = nextBlock;
                        data.markDirty(layer, 0, 0, 1, 1);
                        data.markRenderDirty();
                    }
                }
            }
            if (bottom) {
                // 下侧的分块需要更新
                const nextBlock = block.down();
                if (nextBlock) {
                    const { data } = nextBlock;
                    data.markDirty(layer, bx - 1, 0, bx + 1, 1);
                    data.markRenderDirty();
                }
            }
        });
    }

    updateBlockCache(block: Readonly<IBlockData<IMapVertexBlock>>): void {
        if (!block.data.dirty) return;
        const layers = this.renderer.getSortedLayer();
        layers.forEach(layer => {
            const dirty = block.data.getDirtyArea(layer);
            if (!dirty || !dirty.dirty) return;
            block.data.updated();
            const vertex = block.data.getLayerData(layer);
            const mapData = layer.getMapRef();
            if (!vertex) return;
            const { array } = mapData;
            const { dirtyLeft, dirtyTop, dirtyRight, dirtyBottom } = dirty;
            for (let nx = dirtyLeft; nx < dirtyRight; nx++) {
                for (let ny = dirtyTop; ny < dirtyBottom; ny++) {
                    const mapX = nx + block.dataX;
                    const mapY = ny + block.dataY;
                    const mapIndex = mapY * this.mapWidth + mapX;
                    const num = array[mapIndex];
                    const index: BlockIndex = {
                        layer,
                        num,
                        blockX: nx,
                        blockY: ny,
                        blockIndex: ny * block.width + nx,
                        mapX,
                        mapY,
                        mapIndex
                    };
                    this.updateVertexArray(array, vertex, index, num, false);
                }
            }
        });
    }

    //#endregion

    //#region 动态图块

    updateMoving(block: IMovingBlock, updateTexture: boolean): void {
        if (!this.renderer.hasMoving(block)) return;
        const { cls, frames, offset, texture } = block.texture;
        const vertex: IMapVertexData = {
            instancedArray: this.dynamicInstancedArray
        };
        const index: IndexedBlockMapPos = {
            layer: block.layer,
            num: block.tile,
            mapX: block.x,
            mapY: block.y,
            blockIndex: block.index
        };
        const assetIndex = this.renderer.getAssetSourceIndex(texture.source);
        const offsetIndex = this.renderer.getOffsetIndex(offset);
        if (assetIndex === -1 || offsetIndex === -1) {
            logger.error(40, block.tile.toString());
            return;
        }
        const update = updateTexture
            ? VertexUpdate.NoFrame
            : VertexUpdate.Position;
        if (cls === BlockCls.Autotile) {
            // 自动元件使用全部不连接
            const renderable = this.renderer.autotile.renderWithoutCheck(
                block.texture,
                0b0000_0000
            );
            if (!renderable) return;

            this.updateTileVertex(
                vertex,
                renderable.rect,
                index,
                assetIndex,
                offset,
                frames,
                update,
                true
            );
        } else {
            // 正常图块
            const renderable = texture.render();
            // 宽度要除以帧数，因为我们假设所有素材都是横向平铺的
            const rect: IRect = {
                x: renderable.rect.x,
                y: renderable.rect.y,
                w: renderable.rect.w / frames,
                h: renderable.rect.h
            };
            this.updateTileVertex(
                vertex,
                rect,
                index,
                assetIndex,
                offset,
                frames,
                update,
                true
            );
        }

        this.dynamicRenderDirty = true;
    }

    updateMovingList(moving: IMovingBlock[], updateTexture: boolean): void {
        moving.forEach(v => {
            this.updateMoving(v, updateTexture);
        });
    }

    deleteMoving(moving: IMovingBlock): void {
        const instancedStart = moving.index * INSTANCED_COUNT;
        // 这个需要全部清空了，因为可能会复用
        this.dynamicInstancedArray.set(
            MapVertexGenerator.EMPTY_VETREX,
            instancedStart
        );
        this.dynamicRenderDirty = true;
    }

    //#endregion

    //#region 图块状态

    /**
     * 获取指定图层指定坐标的图块对应的分块信息
     * @param layer 图层对象
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    private getIndexInBlock(
        layer: IMapLayer,
        x: number,
        y: number
    ): VertexArrayOfBlock | null {
        const block = this.block.getBlockByDataLoc(x, y);
        if (!block) return null;
        const data = block?.data.getLayerInstanced(layer);
        if (!data) return null;
        const dx = x - block.x;
        const dy = y - block.y;
        const dIndex = dy * block.width + dx;
        return { array: data, index: dIndex, block };
    }

    setStaticAlpha(
        layer: IMapLayer,
        x: number,
        y: number,
        alpha: number
    ): void {
        const index = this.getIndexInBlock(layer, x, y);
        if (!index) return;
        index.array[index.index * INSTANCED_COUNT + 9] = alpha;
        index.block.data.markRenderDirty();
    }

    setStaticFrame(
        layer: IMapLayer,
        x: number,
        y: number,
        frame: number
    ): void {
        const index = this.getIndexInBlock(layer, x, y);
        if (!index) return;
        index.array[index.index * INSTANCED_COUNT + 12] = frame;
        index.block.data.markRenderDirty();
    }

    getStaticAlpha(layer: IMapLayer, x: number, y: number): number {
        const index = this.getIndexInBlock(layer, x, y);
        if (!index) return 0;
        return index.array[index.index * INSTANCED_COUNT + 9];
    }

    getStaticFrame(layer: IMapLayer, x: number, y: number): number {
        const index = this.getIndexInBlock(layer, x, y);
        if (!index) return -1;
        return index.array[index.index * INSTANCED_COUNT + 12];
    }

    setDynamicAlpha(index: number, alpha: number): void {
        this.dynamicInstancedArray[index * INSTANCED_COUNT + 9] = alpha;
        this.dynamicRenderDirty = true;
    }

    setDynamicFrame(index: number, frame: number): void {
        this.dynamicInstancedArray[index * INSTANCED_COUNT + 12] = frame;
        this.dynamicRenderDirty = true;
    }

    getDynamicAlpha(index: number): number {
        if (index > this.dynamicCount) return 0;
        return this.dynamicInstancedArray[index * INSTANCED_COUNT + 9];
    }

    getDynamicFrame(index: number): number {
        if (index > this.dynamicCount) return -1;
        return this.dynamicInstancedArray[index * INSTANCED_COUNT + 12];
    }

    //#endregion

    //#region 其他接口

    renderDynamic(): void {
        this.dynamicRenderDirty = false;
    }

    getVertexArray(): IMapVertexArray {
        this.checkRebuild();
        return {
            dynamicStart: this.dynamicStart,
            dynamicCount: this.dynamicCount,
            tileInstanced: this.instancedArray
        };
    }

    //#endregion
}

//#region 分块对象

class MapVertexBlock implements IMapVertexBlock {
    instancedArray!: Float32Array;

    dirty: boolean = true;
    renderDirty: boolean = true;

    private readonly layerDirty: Map<IMapLayer, ILayerDirtyData> = new Map();

    readonly startIndex: number;
    readonly endIndex: number;
    readonly count: number;
    readonly layerCount: number;

    readonly instancedStart: number;

    private readonly indexMap: Map<IMapLayer, number> = new Map();
    private readonly instancedMap: Map<IMapLayer, Float32Array> = new Map();

    /**
     * 创建分块的顶点数组对象，此对象不能动态扩展，如果地图变化，需要全部重建
     * @param renderer 渲染器对象
     * @param originArray 原始顶点数组
     * @param startIndex 起始网格索引
     * @param count 单个图层的图块数量
     * @param blockWidth 分块宽度
     * @param blockHeight 分块高度
     */
    constructor(
        readonly renderer: IMapRenderer & IMapDataGetter,
        originArray: IMapVertexData,
        startIndex: number,
        count: number,
        private readonly blockWidth: number,
        private readonly blockHeight: number
    ) {
        const layerCount = renderer.layerCount;
        this.startIndex = startIndex * layerCount;
        this.endIndex = (startIndex + count) * layerCount;
        this.count = count;
        const offsetStart = startIndex * layerCount * INSTANCED_COUNT;
        this.instancedStart = offsetStart;
        this.layerCount = layerCount;
        this.rebuild(originArray);
    }

    render(): void {
        this.renderDirty = false;
    }

    updated(): void {
        this.dirty = false;
    }

    /**
     * 标记为需要更新渲染缓冲区
     */
    markRenderDirty() {
        this.renderDirty = true;
        this.renderer.requestUpdate();
    }

    markDirty(
        layer: IMapLayer,
        left: number,
        top: number,
        right: number,
        bottom: number
    ): void {
        const data = this.layerDirty.get(layer);
        if (!data) return;
        const dl = clamp(left, 0, this.blockWidth);
        const dt = clamp(top, 0, this.blockHeight);
        const dr = clamp(right, left, this.blockWidth);
        const db = clamp(bottom, top, this.blockHeight);
        if (!data.dirty) {
            data.dirtyLeft = dl;
            data.dirtyTop = dt;
            data.dirtyRight = dr;
            data.dirtyBottom = db;
        } else {
            data.dirtyLeft = Math.min(dl, data.dirtyLeft);
            data.dirtyTop = Math.min(dt, data.dirtyTop);
            data.dirtyRight = Math.max(dr, data.dirtyRight);
            data.dirtyBottom = Math.max(db, data.dirtyBottom);
        }
        this.dirty = true;
        this.renderer.requestUpdate();
    }

    getDirtyArea(layer: IMapLayer): Readonly<ILayerDirtyData> | null {
        return this.layerDirty.get(layer) ?? null;
    }

    rebuild(originArray: IMapVertexData) {
        const offsetStart = this.instancedStart;
        const count = this.count;
        this.instancedArray = originArray.instancedArray.subarray(
            offsetStart,
            offsetStart + count * INSTANCED_COUNT * this.layerCount
        );

        this.renderer.getSortedLayer().forEach((v, i) => {
            const os = i * count * INSTANCED_COUNT;
            const oa = this.instancedArray.subarray(
                os,
                os + count * INSTANCED_COUNT
            );
            this.instancedMap.set(v, oa);
            this.indexMap.set(v, i);
            this.layerDirty.set(v, {
                dirty: true,
                dirtyLeft: 0,
                dirtyTop: 0,
                dirtyRight: this.blockWidth,
                dirtyBottom: this.blockHeight
            });
        });
        this.dirty = true;
    }

    getLayerInstanced(layer: IMapLayer): Float32Array | null {
        return this.instancedMap.get(layer) ?? null;
    }

    getLayerData(layer: IMapLayer): IIndexedMapVertexData | null {
        const offset = this.instancedMap.get(layer);
        const index = this.indexMap.get(layer);
        if (!offset || isNil(index)) return null;
        return {
            instancedArray: offset,
            instancedStart:
                this.instancedStart + index * this.count * INSTANCED_COUNT
        };
    }
}

//#endregion
