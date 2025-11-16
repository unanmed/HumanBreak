import { IMapLayer, IMapLayerData } from '@user/data-state';
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
import { IRect, SizedCanvasImageSource } from '@motajs/render-assets';

// todo: 潜在优化点：顶点数组的 z 坐标以及纹理的 z 坐标可以换为实例化绘制

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
     * 获取指定图层的图块信息，是对内部存储的直接引用
     * @param layer 地图图层
     */
    getMapLayerData(layer: IMapLayer): Readonly<IMapLayerData> | null;

    /**
     * 根据图集的图像源获取其索引
     * @param source 图像源
     */
    getAssetSourceIndex(source: SizedCanvasImageSource): number;

    /**
     * 渲染器是否包含指定的移动图块对象
     * @param moving 移动图块对象
     */
    hasMoving(moving: IMovingBlock): boolean;
}

interface BlockMapPos {
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

interface TilePosition {
    /** 左边缘位置 */
    readonly left: number;
    /** 上边缘位置 */
    readonly top: number;
    /** 右边缘位置 */
    readonly right: number;
    /** 下边缘位置 */
    readonly bottom: number;
}

const enum VertexUpdate {
    /** 更新顶点信息 */
    Vertex = 0b01,
    /** 更新贴图信息 */
    Texture = 0b10,
    /** 全部更新 */
    All = 0b11
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

    /** 空顶点数组，因为空顶点很常用，所以直接定义一个全局常量 */
    private static readonly EMPTY_VETREX: Float32Array = new Float32Array(
        6 * 6
    );

    readonly block: IBlockSplitter<MapVertexBlock>;

    /** 顶点数组 */
    private vertexArray: Float32Array = new Float32Array();
    /** 偏移数组 */
    private offsetArray: Int16Array = new Int16Array();
    /** 不透明度数组 */
    private alphaArray: Float32Array = new Float32Array();
    /** 动态内容顶点数组 */
    private dynamicVertexArray: Float32Array = new Float32Array();
    /** 动态内容偏移数组 */
    private dynamicOffsetArray: Int16Array = new Int16Array();
    /** 动态内容不透明度数组 */
    private dynamicAlphaArray: Float32Array = new Float32Array();

    /** 图层列表 */
    private layers: IMapLayer[] = [];

    /** 对应分块的顶点数组 */
    private blockList: Map<number, IMapVertexBlock> = new Map();
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

    /** 静态内容数组顶点数量 */
    private staticLength: number = 0;
    /** 动态内容数组顶点数量。动态内容的数量无法预测，因此使用预留数量+动态扩充的方式 */
    private dynamicLength: number = DYNAMIC_RESERVE;

    /** 更新图块性能检查防抖起始时刻 */
    private updateCallDebounceTime: number = 0;
    /** 更新图块性能检查的调用次数 */
    private updateCallDebounceCount: number = 0;

    constructor(
        readonly renderer: IMapRenderer & IMapDataGetter,
        readonly data: IContextData
    ) {
        super();
        this.block = new BlockSplitter();
    }

    //#endregion

    //#region 分块操作

    private mallocVertexArray() {
        // 顶点数组尺寸等于 地图大小 * 每个图块的顶点数量 * 每个顶点的数据量
        const area = this.renderer.mapWidth * this.renderer.mapHeight;
        const staticCount = area * this.renderer.layerCount;
        const count = staticCount + this.dynamicLength;
        const vertexSize = count * 6 * 6;
        const offsetSize = count * 2;
        const alphaSize = count;
        this.vertexArray = new Float32Array(vertexSize);
        this.offsetArray = new Int16Array(offsetSize);
        this.alphaArray = new Float32Array(alphaSize);
        this.alphaArray.fill(1);
        this.staticLength = staticCount;
        this.dynamicVertexArray = this.vertexArray.subarray(
            staticCount * 6 * 6,
            count * 6 * 6
        );
        this.dynamicOffsetArray = this.offsetArray.subarray(
            staticCount * 2,
            count * 2
        );
        this.dynamicAlphaArray = this.alphaArray.subarray(staticCount, count);
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
        const layerCount = this.renderer.layerCount;
        this.block.splitBlocks(block => {
            // 最后一行的算法与其他行不同
            const startIndex =
                block.height < this.blockHeight
                    ? lastStart + lastCount * block.x
                    : lineCount * block.y + blockCount * block.x;
            const count = block.width * block.height * layerCount;

            const origin: IMapVertexData = {
                vertexArray: this.vertexArray,
                offsetArray: this.offsetArray,
                alphaArray: this.alphaArray
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
        }
    }

    expandMoving(targetSize: number): void {
        const beforeVertex = this.vertexArray;
        const beforeOffset = this.offsetArray;
        const beforeAlpha = this.alphaArray;
        this.dynamicLength = targetSize;
        this.mallocVertexArray();
        this.vertexArray.set(beforeVertex);
        this.offsetArray.set(beforeOffset);
        this.alphaArray.set(beforeAlpha);
        const array: IMapVertexData = {
            vertexArray: this.vertexArray,
            offsetArray: this.offsetArray,
            alphaArray: this.alphaArray
        };
        // 重建一下对应分块就行了，不需要重新分块
        for (const block of this.block.iterateBlocks()) {
            block.data.rebuild(array);
        }
    }

    reduceMoving(targetSize: number, indexMap: Map<number, number>): void {
        const beforeVertexLength = this.vertexArray.length;
        const beforeOffsetLength = this.offsetArray.length;
        const beforeAlphaLength = this.alphaArray.length;
        const deltaLength = this.dynamicLength - targetSize;
        this.dynamicLength = targetSize;
        this.vertexArray = this.vertexArray.subarray(
            0,
            beforeVertexLength - deltaLength * 6 * 6
        );
        this.offsetArray = this.offsetArray.subarray(
            0,
            beforeOffsetLength - deltaLength * 2
        );
        this.alphaArray = this.alphaArray.subarray(
            0,
            beforeAlphaLength - deltaLength
        );
        indexMap.forEach((target, from) => {
            const next = from + 1;
            this.dynamicVertexArray.copyWithin(
                target * 6 * 6,
                from * 6 * 6,
                next * 6 * 6
            );
            this.dynamicOffsetArray.copyWithin(target * 2, from * 2, next * 2);
            this.dynamicAlphaArray[target] = this.dynamicAlphaArray[from];
        });
        this.dynamicVertexArray = this.dynamicVertexArray.subarray(
            0,
            targetSize * 6 * 6
        );
        this.dynamicOffsetArray = this.dynamicOffsetArray.subarray(
            0,
            targetSize * 2
        );
        this.dynamicAlphaArray = this.dynamicAlphaArray.subarray(0, targetSize);
        // 这个不需要重新分配内存，依然共用同一个 ArrayBuffer，因此不需要重新分块
    }

    updateLayerArray(): void {
        const layers = this.renderer.getSortedLayer();
        if (
            layers.length !== this.layers.length ||
            this.layers.some((v, i) => layers[i] !== v)
        ) {
            this.needRebuild = true;
        }
    }

    checkRebuild() {
        if (!this.needRebuild) return;
        this.needRebuild = false;
        this.mallocVertexArray();
        this.splitBlock();
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
    ): TilePosition {
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
        const ct = pos.mapY * ch - 1; // cell top
        if (mode === MapTileBehavior.FitToSize) {
            // 适应到格子大小
            return {
                left: cl,
                top: ct,
                right: cl + cw,
                bottom: ct + ch
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
            let right = 0;
            let bottom = 0;
            switch (tileAlignX) {
                case MapTileAlign.Start: {
                    // 左对齐
                    left = cl;
                    right = cl + tw;
                    break;
                }
                case MapTileAlign.Center: {
                    // 左右居中对齐
                    const center = cl + cwu;
                    left = center - twu;
                    right = center + twu;
                    break;
                }
                case MapTileAlign.End: {
                    // 右对齐
                    right = cl + cw;
                    left = right - tw;
                    break;
                }
            }
            switch (tileAlignY) {
                case MapTileAlign.Start: {
                    // 上对齐
                    top = ct;
                    bottom = ct + th;
                    break;
                }
                case MapTileAlign.Center: {
                    // 上下居中对齐
                    const center = ct + chu;
                    top = center - thu;
                    bottom = center + thu;
                    break;
                }
                case MapTileAlign.End: {
                    // 下对齐
                    bottom = ct + ch;
                    top = bottom - th;
                }
            }
            return { left, top, right, bottom };
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
        update: VertexUpdate
    ) {
        const { offsetArray, vertexArray } = vertex;
        // 顶点数组
        const { renderWidth, renderHeight, layerCount } = this.renderer;
        const { x, y, w, h } = rect;
        const vertexStart = index.blockIndex * 6 * 6;
        if (update & VertexUpdate.Texture) {
            const texLeft = (x / renderWidth) * 2 - 1;
            const texTop = (y / renderHeight) * 2 - 1;
            const texRight = ((x + w) / renderWidth) * 2 - 1;
            const texBottom = ((y + h) / renderHeight) * 2 - 1;
            // 六个顶点分别是 左下，右下，左上，左上，右下，右上
            vertexArray[vertexStart + 3] = texLeft;
            vertexArray[vertexStart + 4] = texBottom;
            vertexArray[vertexStart + 5] = assetIndex;
            vertexArray[vertexStart + 9] = texRight;
            vertexArray[vertexStart + 10] = texBottom;
            vertexArray[vertexStart + 11] = assetIndex;
            vertexArray[vertexStart + 15] = texLeft;
            vertexArray[vertexStart + 16] = texTop;
            vertexArray[vertexStart + 17] = assetIndex;
            vertexArray[vertexStart + 21] = texLeft;
            vertexArray[vertexStart + 22] = texTop;
            vertexArray[vertexStart + 23] = assetIndex;
            vertexArray[vertexStart + 27] = texRight;
            vertexArray[vertexStart + 28] = texBottom;
            vertexArray[vertexStart + 29] = assetIndex;
            vertexArray[vertexStart + 33] = texRight;
            vertexArray[vertexStart + 34] = texTop;
            vertexArray[vertexStart + 35] = assetIndex;
        }
        if (update & VertexUpdate.Vertex) {
            // 如果需要更新顶点坐标
            const layerIndex = this.renderer.getLayerIndex(index.layer);
            const layerStart = (layerIndex / layerCount) * 2 - 1;
            const zIndex = layerStart + index.mapY / this.mapHeight;
            const { left, top, right, bottom } = this.getTilePosition(
                index,
                w,
                h
            );
            vertexArray[vertexStart] = left;
            vertexArray[vertexStart + 1] = bottom;
            vertexArray[vertexStart + 2] = zIndex;
            vertexArray[vertexStart + 6] = right;
            vertexArray[vertexStart + 7] = bottom;
            vertexArray[vertexStart + 8] = zIndex;
            vertexArray[vertexStart + 12] = left;
            vertexArray[vertexStart + 13] = top;
            vertexArray[vertexStart + 14] = zIndex;
            vertexArray[vertexStart + 18] = left;
            vertexArray[vertexStart + 19] = top;
            vertexArray[vertexStart + 20] = zIndex;
            vertexArray[vertexStart + 24] = right;
            vertexArray[vertexStart + 25] = bottom;
            vertexArray[vertexStart + 26] = zIndex;
            vertexArray[vertexStart + 30] = right;
            vertexArray[vertexStart + 31] = top;
            vertexArray[vertexStart + 32] = zIndex;
        }
        // 偏移数组
        const offsetStart = index.blockIndex * 2;
        offsetArray[offsetStart] = frames;
        offsetArray[offsetStart + 1] = offsetIndex;
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
        update: VertexUpdate
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
            update
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
        const newIndex: BlockIndex = {
            layer,
            mapX: mx,
            mapY: my,
            mapIndex: my * this.mapWidth + mx,
            blockX: block.x,
            blockY: block.y,
            blockIndex: block.y * block.width + block.x
        };
        const tile = this.renderer.manager.getTile(mapArray[index.mapIndex]);
        if (!tile) return;
        this.updateAutotile(
            mapArray,
            vertex,
            newIndex,
            tile,
            VertexUpdate.Texture
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
        num: number
    ) {
        // 此处仅更新当前图块，不更新周围一圈的自动元件
        // 周围一圈的自动元件需要在更新某个图块或者某个区域时处理，不在这里处理
        const tile = this.renderer.manager.getIfBigImage(num);

        if (!tile) {
            // 不存在可渲染对象，认为是空图块
            vertex.vertexArray.set(
                MapVertexGenerator.EMPTY_VETREX,
                index.blockIndex * 6 * 6
            );
            const offsetStart = index.blockIndex * 2;
            vertex.offsetArray[offsetStart] = 0;
            vertex.offsetArray[offsetStart + 1] = 0;
            return;
        }

        if (tile.cls === BlockCls.Autotile) {
            // 如果图块是自动元件
            this.updateAutotile(
                mapArray,
                vertex,
                index,
                tile,
                VertexUpdate.All
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
                VertexUpdate.All
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
        const data = this.renderer.getMapLayerData(layer);
        if (!vertex || !data) return;
        const { array } = data;
        const dx = x - block.dataX;
        const dy = y - block.dataY;
        const dIndex = dy * block.width + dx;
        const index: BlockIndex = {
            layer,
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
        this.updateVertexArray(array, vertex, index, num);
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
        this.updateBlockVertex(layer, num, x, y);
    }

    updateBlockList(layer: IMapLayer, blocks: IMapBlockUpdateObject[]): void {
        if (!this.renderer.hasLayer(layer)) return;
        if (import.meta.env.DEV) {
            this.checkUpdateCallPerformance('updateBlockList');
        }
        if (blocks.length > 50) {
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
        } else {
            blocks.forEach(({ block: num, x, y }) => {
                this.updateBlockVertex(layer, num, x, y);
            });
        }
    }

    updateBlockCache(block: Readonly<IBlockData<IMapVertexBlock>>): void {
        console.time('update-block-cache');
        const layers = this.renderer.getSortedLayer();
        layers.forEach(layer => {
            const dirty = block.data.getDirtyArea(layer);
            if (!dirty || !dirty.dirty) return;
            const vertex = block.data.getLayerData(layer);
            const mapData = this.renderer.getMapLayerData(layer);
            if (!vertex || !mapData) return;
            const { array } = mapData;
            const { dirtyLeft, dirtyTop, dirtyRight, dirtyBottom } = dirty;
            for (let nx = dirtyLeft; nx < dirtyRight; nx++) {
                for (let ny = dirtyTop; ny < dirtyBottom; ny++) {
                    const mapX = nx + block.dataX;
                    const mapY = ny + block.dataY;
                    const mapIndex = mapY * this.mapWidth + mapX;
                    const index: BlockIndex = {
                        layer,
                        blockX: nx,
                        blockY: ny,
                        blockIndex: ny * block.width + nx,
                        mapX,
                        mapY,
                        mapIndex
                    };
                    this.updateVertexArray(
                        array,
                        vertex,
                        index,
                        array[mapIndex]
                    );
                }
            }
        });
        console.timeEnd('update-block-cache');
    }

    //#endregion

    //#region 图块配置

    enableStaticFrameAnimate(layer: IMapLayer, x: number, y: number): void {
        const data = this.renderer.getMapLayerData(layer);
        const block = this.block.getBlockByDataLoc(x, y);
        if (!data || !block) return;
        const vertexArray = block.data.getLayerOffset(layer);
        if (!vertexArray) return;
        const mapIndex = y * this.mapWidth + x;
        const num = data.array[mapIndex];
        const tile = this.renderer.manager.getIfBigImage(num);
        if (!tile) return;
        const bx = x - block.dataX;
        const by = y - block.dataY;
        const bIndex = by * block.width + bx;
        vertexArray[bIndex * 2] = tile.frames;
        block.data.markRenderDirty();
    }

    disableStaticFrameAnimate(layer: IMapLayer, x: number, y: number): void {
        const block = this.block.getBlockByDataLoc(x, y);
        if (!block) return;
        const vertexArray = block.data.getLayerOffset(layer);
        if (!vertexArray) return;
        const bx = x - block.dataX;
        const by = y - block.dataY;
        const bIndex = by * block.width + bx;
        vertexArray[bIndex * 2] = 1;
        block.data.markRenderDirty();
    }

    setStaticAlpha(
        layer: IMapLayer,
        alpha: number,
        x: number,
        y: number
    ): void {
        const block = this.block.getBlockByDataLoc(x, y);
        if (!block) return;
        const vertexArray = block.data.getLayerAlpha(layer);
        if (!vertexArray) return;
        const bx = x - block.dataX;
        const by = y - block.dataY;
        const bIndex = by * block.width + bx;
        vertexArray[bIndex] = alpha;
        block.data.markRenderDirty();
    }

    //#endregion

    //#region 动态图块

    updateMoving(block: IMovingBlock, updateTexture: boolean): void {
        if (!this.renderer.hasMoving(block)) return;
        const { cls, frames, offset, texture } = block.texture;
        const vertex: IMapVertexData = {
            vertexArray: this.dynamicVertexArray,
            offsetArray: this.dynamicOffsetArray,
            alphaArray: this.dynamicAlphaArray
        };
        const index: IndexedBlockMapPos = {
            layer: block.layer,
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
        const update = updateTexture ? VertexUpdate.All : VertexUpdate.Vertex;
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
                update
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
                update
            );
        }

        this.dynamicRenderDirty = true;
    }

    updateMovingList(moving: IMovingBlock[], updateTexture: boolean): void {
        console.time('update-moving');
        moving.forEach(v => {
            this.updateMoving(v, updateTexture);
        });
        console.timeEnd('update-moving');
    }

    deleteMoving(moving: IMovingBlock): void {
        this.dynamicVertexArray.set(
            MapVertexGenerator.EMPTY_VETREX,
            moving.index * 6 * 6
        );
        const offsetStart = moving.index * 2;
        this.dynamicOffsetArray[offsetStart] = 0;
        this.dynamicOffsetArray[offsetStart + 1] = 0;
        this.dynamicAlphaArray[moving.index] = 0;
        this.dynamicRenderDirty = true;
    }

    enableDynamicFrameAnimate(block: IMovingBlock): void {
        if (!this.renderer.hasMoving(block)) return;
        this.dynamicOffsetArray[block.index * 2] = 1;
        this.dynamicRenderDirty = true;
    }

    disableDynamicFrameAnimate(block: IMovingBlock): void {
        if (!this.renderer.hasMoving(block)) return;
        this.dynamicOffsetArray[block.index * 2] = block.texture.frames;
        this.dynamicRenderDirty = true;
    }

    setDynamicAlpha(block: IMovingBlock, alpha: number): void {
        if (!this.renderer.hasMoving(block)) return;
        this.dynamicAlphaArray[block.index] = alpha;
        this.dynamicRenderDirty = true;
    }

    //#endregion

    //#region 其他接口

    renderDynamic(): void {
        // todo: vertex, offset, alpha 的脏标记分开
        this.dynamicRenderDirty = false;
    }

    getVertexArray(): IMapVertexArray {
        this.checkRebuild();
        return {
            dynamicStart: this.staticLength * 6,
            dynamicCount: this.dynamicLength * 6,
            tileVertex: this.vertexArray,
            tileOffset: this.offsetArray,
            tileAlpha: this.alphaArray
        };
    }

    //#endregion
}

//#region 分块对象

class MapVertexBlock implements IMapVertexBlock {
    vertexArray!: Float32Array;
    offsetArray!: Int16Array;
    alphaArray!: Float32Array;

    dirty: boolean = false;
    renderDirty: boolean = true;

    private readonly layerDirty: Map<IMapLayer, ILayerDirtyData> = new Map();

    readonly startIndex: number;
    readonly endIndex: number;
    readonly count: number;

    readonly vertexStart: number;
    readonly offsetStart: number;
    readonly alphaStart: number;

    private readonly indexMap: Map<IMapLayer, number> = new Map();
    private readonly vertexMap: Map<IMapLayer, Float32Array> = new Map();
    private readonly offsetMap: Map<IMapLayer, Int16Array> = new Map();
    private readonly alphaMap: Map<IMapLayer, Float32Array> = new Map();

    /**
     * 创建分块的顶点数组对象，此对象不能动态扩展，如果地图变化，需要全部重建
     * @param renderer 渲染器对象
     * @param originArray 原始顶点数组
     * @param startIndex 起始网格索引
     * @param count 分块数量
     */
    constructor(
        readonly renderer: IMapRenderer,
        originArray: IMapVertexData,
        startIndex: number,
        count: number,
        private readonly blockWidth: number,
        private readonly blockHeight: number
    ) {
        this.startIndex = startIndex;
        this.endIndex = startIndex + count;
        this.count = count;
        const layerCount = renderer.layerCount;
        const vertexStart = startIndex * layerCount * 6 * 6;
        const offsetStart = startIndex * layerCount * 2;
        const alphaStart = startIndex * layerCount;
        this.vertexStart = vertexStart;
        this.offsetStart = offsetStart;
        this.alphaStart = alphaStart;

        this.rebuild(originArray);
    }

    render(): void {
        this.renderDirty = false;
    }

    markRenderDirty() {
        // todo: 潜在优化点：vertex, offset, alpha 的脏标记分开
        this.renderDirty = true;
    }

    markDirty(
        layer: IMapLayer,
        left: number,
        top: number,
        right: number,
        bottom: number
    ): void {
        // todo: 更细致的脏标记是否会更好？
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
    }

    getDirtyArea(layer: IMapLayer): Readonly<ILayerDirtyData> | null {
        return this.layerDirty.get(layer) ?? null;
    }

    rebuild(originArray: IMapVertexData) {
        const vertexStart = this.vertexStart;
        const offsetStart = this.offsetStart;
        const alphaStart = this.alphaStart;
        const count = this.count;
        this.vertexArray = originArray.vertexArray.subarray(
            vertexStart,
            vertexStart + count * 6 * 6
        );
        this.offsetArray = originArray.offsetArray.subarray(
            offsetStart,
            offsetStart + count * 2
        );
        this.alphaArray = originArray.alphaArray.subarray(
            alphaStart,
            alphaStart + count
        );

        this.renderer.getSortedLayer().forEach((v, i) => {
            const vs = vertexStart + i * count * 6 * 6;
            const os = offsetStart + i * count * 2;
            const as = alphaStart + i * count;
            const va = this.vertexArray.subarray(vs, vs + count * 6 * 6);
            const oa = this.offsetArray.subarray(os, os + count * 2);
            const aa = this.alphaArray.subarray(as, as + count);
            this.vertexMap.set(v, va);
            this.offsetMap.set(v, oa);
            this.alphaMap.set(v, aa);
            this.indexMap.set(v, i);
            this.layerDirty.set(v, {
                dirty: true,
                dirtyLeft: 0,
                dirtyTop: 0,
                dirtyRight: this.blockWidth,
                dirtyBottom: this.blockHeight
            });
        });
    }

    getLayerVertex(layer: IMapLayer): Float32Array | null {
        return this.vertexMap.get(layer) ?? null;
    }

    getLayerOffset(layer: IMapLayer): Int16Array | null {
        return this.offsetMap.get(layer) ?? null;
    }

    getLayerAlpha(layer: IMapLayer): Float32Array | null {
        return this.alphaMap.get(layer) ?? null;
    }

    getLayerData(layer: IMapLayer): IIndexedMapVertexData | null {
        const vertex = this.vertexMap.get(layer);
        const offset = this.offsetMap.get(layer);
        const alpha = this.alphaMap.get(layer);
        const index = this.indexMap.get(layer);
        if (!vertex || !offset || !alpha || isNil(index)) return null;
        return {
            vertexArray: vertex,
            offsetArray: offset,
            alphaArray: alpha,
            vertexStart: this.vertexStart + index * this.count * 6 * 6,
            offsetStart: this.offsetStart + index * this.count * 2,
            alphaStart: this.alphaStart + index * this.count
        };
    }
}

//#endregion
