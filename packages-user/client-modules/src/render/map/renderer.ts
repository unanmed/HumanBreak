import {
    ITextureAnimater,
    ITextureRenderable,
    SizedCanvasImageSource,
    TextureColumnAnimater
} from '@motajs/render-assets';
import {
    AutotileProcessor,
    BlockCls,
    IAutotileProcessor,
    IMaterialFramedData,
    IMaterialManager,
    ITrackedAssetData
} from '@user/client-base';
import {
    IBlockStatus,
    IContextData,
    IMapBackgroundConfig,
    IMapRenderConfig,
    IMapRenderer,
    IMapRendererPostEffect,
    IMapRendererTicker,
    IMapVertexGenerator,
    IMapViewportController,
    IMovingBlock,
    MapBackgroundRepeat,
    MapTileAlign,
    MapTileBehavior,
    MapTileSizeTestMode
} from './types';
import { ILayerState, ILayerStateHooks, IMapLayer } from '@user/data-state';
import { IHookController, logger } from '@motajs/common';
import { compileProgramWith } from '@motajs/client-base';
import { isNil, maxBy } from 'lodash-es';
import { IMapDataGetter, MapVertexGenerator } from './vertex';
import mapVert from './shader/map.vert?raw';
import mapFrag from './shader/map.frag?raw';
import backVert from './shader/back.vert?raw';
import backFrag from './shader/back.frag?raw';
import { IMovingRenderer, MovingBlock } from './moving';
import {
    CELL_HEIGHT,
    CELL_WIDTH,
    DYNAMIC_RESERVE,
    MOVING_TOLERANCE
} from '../shared';
import { Transform } from '@motajs/render-core';
import { MapViewport } from './viewport';
import { INSTANCED_COUNT } from './constant';
import { StaticBlockStatus } from './status';

const enum BackgroundType {
    Static,
    Dynamic,
    Tile
}

export class MapRenderer
    implements IMapRenderer, IMovingRenderer, IMapDataGetter
{
    //#region 实例属性

    /** 自动元件处理器 */
    readonly autotile: IAutotileProcessor;
    /** 顶点数组生成器 */
    readonly vertex: IMapVertexGenerator;
    /** 地图渲染的视角控制 */
    readonly viewport: IMapViewportController;

    mapWidth: number = 0;
    mapHeight: number = 0;
    layerCount: number = 0;
    renderWidth: number = 0;
    renderHeight: number = 0;
    cellWidth: number = CELL_WIDTH;
    cellHeight: number = CELL_HEIGHT;
    assetWidth: number = 4096;
    assetHeight: number = 4096;

    layerState: ILayerState;
    /** 地图状态钩子控制器 */
    private layerStateHook: IHookController<ILayerStateHooks>;

    /** 排序后的图层 */
    private sortedLayers: IMapLayer[] = [];
    /** 图层到排序索引的映射 */
    private layerIndexMap: Map<IMapLayer, number> = new Map();

    /** 使用的图集数据 */
    private assetData: ITrackedAssetData | null = null;

    /** 背景图类型 */
    private backgroundType: BackgroundType = BackgroundType.Tile;
    /** 静态背景 */
    private staticBack: ITextureRenderable | null = null;
    /** 动态背景 */
    private dynamicBack: ITextureRenderable[] | null = null;
    /** 图块背景 */
    private tileBack: number = 0;
    /** 动态背景每帧持续时长 */
    private backFrameSpeed: number = 300;
    /** 当前背景图帧数 */
    private backgroundFrame: number = 0;
    /** 是否需要更新背景图帧数 */
    private needUpdateBackgroundFrame: boolean = true;
    /** 背景图总帧数 */
    private backgroundFrameCount: number = 1;
    /** 背景图上一帧的时刻 */
    private backLastFrame: number = 0;
    /** 背景图横向平铺方式 */
    private backRepeatModeX: MapBackgroundRepeat = MapBackgroundRepeat.Repeat;
    /** 背景图纵向平铺方式 */
    private backRepeatModeY: MapBackgroundRepeat = MapBackgroundRepeat.Repeat;
    /** 背景图是否使用图片大小作为渲染大小 */
    private backUseImageSize: boolean = true;
    /** 背景图的渲染宽度 */
    private backRenderWidth: number = 0;
    /** 背景图的渲染高度 */
    private backRenderHeight: number = 0;
    /** 背景图是否需要更新 */
    private backgroundDirty: boolean = false;
    /** 背景图是否正在更新 */
    private backgroundPending: boolean = false;
    /** 背景顶点数组 */
    private backgroundVertex: Float32Array = new Float32Array(4 * 4);

    /** 图块缩小行为，即当图块比格子大时，应该如何渲染 */
    tileMinifyBehavior: MapTileBehavior = MapTileBehavior.KeepSize;
    /** 图块放大行为，即当图块比格子小时，应该如何渲染 */
    tileMagnifyBehavior: MapTileBehavior = MapTileBehavior.FitToSize;
    /** 图块水平对齐，仅当图块行为为 `KeepSize` 时有效 */
    tileAlignX: MapTileAlign = MapTileAlign.Center;
    /** 图块竖直对齐，仅当图块行为为 `KeepSize` 时有效 */
    tileAlignY: MapTileAlign = MapTileAlign.End;
    /** 图块大小与网格大小的判断方式，如果图块大于网格，则执行缩小行为，否则执行放大行为 */
    tileTestMode: MapTileSizeTestMode = MapTileSizeTestMode.WidthOrHeight;

    /** 偏移池 */
    private offsetPool: number[];
    /** 归一化过后的偏移池 */
    private normalizedOffsetPool: number[];
    /** 是否应该更新偏移池 uniform */
    private needUpdateOffsetPool: boolean = true;

    /** 所有正在移动的图块 */
    private movingBlock: Set<IMovingBlock> = new Set();
    /** 移动图块对象索引池 */
    private movingIndexPool: number[] = [];
    /** 移动图块对象数量 */
    private movingCount: number = DYNAMIC_RESERVE;
    /** 移动索引映射 */
    private movingIndexMap: Map<number, IMovingBlock> = new Map();
    /** 移动容忍度，如果正在移动的图块数量长期小于预留数量的一半，那么将减少移动数组长度 */
    private lastExpandTime = 0;

    /** 时间戳 */
    private timestamp: number = 0;
    /** 上一帧动画的时刻 */
    private lastFrameTime: number = 0;
    /** 当前帧数 */
    private frameCounter: number = 0;
    /** 是否需要更新当前帧数 */
    private needUpdateFrameCounter: boolean = true;
    /** 帧动画速率 */
    private frameSpeed: number = 300;
    /** 帧动画列表 */
    private tickers: Set<MapRendererTicker> = new Set();

    /** 画布元素 */
    readonly canvas: HTMLCanvasElement;
    /** 画布 WebGL2 上下文 */
    readonly gl: WebGL2RenderingContext;
    /** 画布上下文数据 */
    private contextData: IContextData;

    /** 效果对象优先级映射 */
    private effectPriority: Map<IMapRendererPostEffect, number> = new Map();
    /** 渲染器效果对象列表，使用数组是因为要有顺序 */
    private postEffects: IMapRendererPostEffect[] = [];

    /** 地图变换矩阵 */
    transform: Transform;
    /** 是否需要更新变换矩阵 */
    private needUpdateTransform: boolean = true;
    /** 是否需要重新渲染 */
    private updateRequired: boolean = true;

    /** 图块动画器 */
    private readonly tileAnimater: ITextureAnimater<number>;

    /** `gl.viewport` 横坐标 */
    private viewportX: number = 0;
    /** `gl.viewport` 纵坐标 */
    private viewportY: number = 0;
    /** `gl.viewport` 宽度 */
    private viewportWidth: number = 0;
    /** `gl.viewport` 高度 */
    private viewportHeight: number = 0;

    //#endregion

    //#region 初始化

    /**
     * 创建地图渲染器
     * @param manager 素材管理器
     * @param gl 画布 WebGL2 上下文
     * @param transform 视角变换矩阵
     */
    constructor(
        readonly manager: IMaterialManager,
        layerState: ILayerState
    ) {
        this.movingIndexPool.push(
            ...Array.from({ length: this.movingCount }, (_, i) => i).reverse()
        );
        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl2')!;
        this.transform = new Transform();
        this.layerState = layerState;
        this.layerStateHook = layerState.addHook(
            new RendererLayerStateHook(this)
        );
        this.layerStateHook.load();
        // 上下文初始化要依赖于 offsetPool，因此提前调用
        const offsetPool = this.getOffsetPool();
        this.offsetPool = offsetPool;
        const data = this.initContext()!;
        this.normalizedOffsetPool = offsetPool.map(
            v => v / data.tileTextureWidth
        );
        this.contextData = data;
        this.vertex = new MapVertexGenerator(this, data);
        this.autotile = new AutotileProcessor(manager);
        this.tick = this.tick.bind(this);
        this.viewport = new MapViewport(this);
        this.tileAnimater = new TextureColumnAnimater();
        this.initVertexPointer(this.gl, data);
        this.setViewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 初始化顶点 pointer
     * @param gl 画布 WebGL2 上下文
     * @param data 上下文数据
     */
    private initVertexPointer(gl: WebGL2RenderingContext, data: IContextData) {
        // 顶点数组初始化
        const {
            backVAO,
            tileVAO,
            vertexBuffer,
            instancedBuffer,
            backgroundVertexBuffer,
            vertexAttribLocation: vaLocation,
            insTilePosAttribLocation: tilePos,
            insTexCoordAttribLocation: texCoord,
            insTileDataAttribLocation: tileData,
            insTexDataAttribLocation: texData,
            backVertexAttribLocation: bvaLocation,
            backTexCoordAttribLocation: btcaLocation
        } = data;
        // 背景初始化
        gl.bindVertexArray(backVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, backgroundVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, 16 * 4, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(bvaLocation, 2, gl.FLOAT, false, 4 * 4, 0);
        gl.vertexAttribPointer(btcaLocation, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
        gl.enableVertexAttribArray(bvaLocation);
        gl.enableVertexAttribArray(btcaLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);

        // 顶点数组
        gl.bindVertexArray(tileVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            // prettier-ignore
            new Float32Array([
                // 左下，右下，左上，右上，前两个是顶点坐标，后两个是纹理坐标
                // 因为我们已经在数据处理阶段将数据归一化到了 [-1, 1] 的范围，因此顶点坐标应该是 [0, 1] 的范围
                // 同时又因为我们以左上角为原点，纵坐标与 WebGL2 相反，因此纵坐标需要取反
                0, 0, 0, 0,
                1, 0, 1, 0,
                0, -1, 0, 1, 
                1, -1, 1, 1
            ]),
            gl.STATIC_DRAW
        );
        gl.vertexAttribPointer(vaLocation, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(vaLocation, 0);
        gl.enableVertexAttribArray(vaLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, instancedBuffer);
        const stride = INSTANCED_COUNT * 4;
        gl.vertexAttribPointer(tilePos, 4, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(texCoord, 4, gl.FLOAT, false, stride, 4 * 4);
        gl.vertexAttribPointer(tileData, 4, gl.FLOAT, false, stride, 8 * 4);
        gl.vertexAttribPointer(texData, 4, gl.FLOAT, false, stride, 12 * 4);
        gl.vertexAttribDivisor(tilePos, 1);
        gl.vertexAttribDivisor(texCoord, 1);
        gl.vertexAttribDivisor(tileData, 1);
        gl.vertexAttribDivisor(texData, 1);
        gl.enableVertexAttribArray(tilePos);
        gl.enableVertexAttribArray(texCoord);
        gl.enableVertexAttribArray(tileData);
        gl.enableVertexAttribArray(texData);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    private sortPostEffect() {
        this.postEffects.sort((a, b) => {
            const pa = this.effectPriority.get(a) ?? 0;
            const pb = this.effectPriority.get(b) ?? 0;
            return pb - pa;
        });
    }

    addPostEffect(effect: IMapRendererPostEffect, priority: number): void {
        this.postEffects.push(effect);
        this.effectPriority.set(effect, priority);
        this.sortPostEffect();
        this.updateRequired = true;
    }

    removePostEffect(effect: IMapRendererPostEffect): void {
        const index = this.postEffects.indexOf(effect);
        if (index === -1) return;
        this.postEffects.splice(index);
        this.effectPriority.delete(effect);
        this.sortPostEffect();
        this.updateRequired = true;
    }

    setPostEffectPriority(
        effect: IMapRendererPostEffect,
        priority: number
    ): void {
        if (!this.effectPriority.has(effect)) return;
        this.effectPriority.set(effect, priority);
        this.sortPostEffect();
        this.updateRequired = true;
    }

    //#endregion

    //#region 状态控制

    setTransform(transform: Transform): void {
        this.transform.unbind(this);
        this.transform = transform;
        transform.bind(this);
        this.viewport.bindTransform(transform);
        this.needUpdateTransform = true;
    }

    setCanvasSize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        // 更新 FBO 的纹理尺寸信息
        const gl = this.gl;
        const { pingTexture2D, pongTexture2D } = this.contextData;
        gl.bindTexture(gl.TEXTURE_2D, pingTexture2D);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.bindTexture(gl.TEXTURE_2D, pongTexture2D);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.updateRequired = true;
    }

    setViewport(x: number, y: number, width: number, height: number): void {
        this.viewportX = x;
        this.viewportY = y;
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.updateRequired = true;
    }

    clear(color: boolean, depth: boolean): void {
        let bit = 0;
        if (color) bit |= this.gl.COLOR_BUFFER_BIT;
        if (depth) bit |= this.gl.DEPTH_BUFFER_BIT;
        if (bit > 0) this.gl.clear(bit);
    }

    //#endregion

    //#region 图层处理

    /**
     * 图层排序
     */
    private sortLayer() {
        this.sortedLayers = [...this.layerState.layerList].sort((a, b) => {
            return a.zIndex - b.zIndex;
        });
        this.sortedLayers.forEach((v, i) => this.layerIndexMap.set(v, i));
    }

    updateLayerList() {
        this.sortLayer();
        this.resizeLayer();
        this.layerCount = this.layerState.layerList.size;
        this.vertex.updateLayerArray();
    }

    setLayerState(layerState: ILayerState): void {
        if (layerState === this.layerState) return;
        this.layerStateHook.unload();
        this.layerState = layerState;
        this.layerStateHook = layerState.addHook(
            new RendererLayerStateHook(this)
        );
        this.layerStateHook.load();
        this.sortLayer();
        this.resizeLayer();
        this.layerCount = layerState.layerList.size;
        this.vertex.updateLayerArray();
        this.vertex.resizeMap();
    }

    getLayer(identifier: string): IMapLayer | null {
        return this.layerState.getLayerByAlias(identifier) ?? null;
    }

    hasLayer(layer: IMapLayer): boolean {
        return this.layerState.hasLayer(layer);
    }

    getSortedLayer(): IMapLayer[] {
        return this.sortedLayers.slice();
    }

    getLayerIndex(layer: IMapLayer): number {
        return this.layerIndexMap.get(layer) ?? -1;
    }

    /**
     * 重新适应新的图层大小
     */
    resizeLayer() {
        const maxWidth = maxBy(this.sortedLayers, v => v.width)?.width ?? 0;
        const maxHeight = maxBy(this.sortedLayers, v => v.height)?.height ?? 0;
        if (this.mapWidth === maxWidth && this.mapHeight === maxHeight) {
            return;
        }
        this.mapWidth = maxWidth;
        this.mapHeight = maxHeight;
        this.updateBackgroundVertex(
            this.gl,
            this.contextData,
            this.contextData.backgroundWidth,
            this.contextData.backgroundHeight
        );
        this.vertex.resizeMap();
    }

    //#endregion

    //#region 背景处理

    setStaticBackground(renderable: ITextureRenderable): void {
        this.backgroundType = BackgroundType.Static;
        this.staticBack = renderable;
        this.dynamicBack = null;
        this.tileBack = 0;
        this.backLastFrame = this.timestamp;
        this.backgroundFrameCount = 1;
        this.backgroundDirty = true;
        this.checkBackground(this.gl, this.contextData);
    }

    setDynamicBackground(renderable: Iterable<ITextureRenderable>): void {
        const array = [...renderable];
        this.backgroundType = BackgroundType.Dynamic;
        this.dynamicBack = array;
        this.staticBack = null;
        this.tileBack = 0;
        this.backLastFrame = this.timestamp;
        this.backgroundFrameCount = array.length;
        this.backgroundDirty = true;
        this.checkBackground(this.gl, this.contextData);
    }

    setTileBackground(tile: number): void {
        this.backgroundType = BackgroundType.Tile;
        this.tileBack = tile;
        this.staticBack = null;
        this.dynamicBack = null;
        this.backLastFrame = this.timestamp;
        this.backgroundDirty = true;
        this.checkBackground(this.gl, this.contextData);
    }

    configBackground(config: Partial<IMapBackgroundConfig>): void {
        if (!isNil(config.renderWidth)) {
            this.updateRequired = true;
            this.backRenderWidth = config.renderWidth;
        }
        if (!isNil(config.renderHeight)) {
            this.updateRequired = true;
            this.backRenderHeight = config.renderHeight;
        }
        if (!isNil(config.repeatX)) {
            this.updateRequired = true;
            this.backRepeatModeX = config.repeatX;
        }
        if (!isNil(config.repeatY)) {
            this.updateRequired = true;
            this.backRepeatModeY = config.repeatY;
        }
        if (!isNil(config.useImageSize)) {
            this.updateRequired = true;
            this.backUseImageSize = config.useImageSize;
        }
        if (!isNil(config.frameSpeed)) {
            this.backFrameSpeed = config.frameSpeed;
        }
        this.updateBackgroundVertex(
            this.gl,
            this.contextData,
            this.contextData.backgroundWidth,
            this.contextData.backgroundHeight
        );
    }

    getBackgroundConfig(): Readonly<IMapBackgroundConfig> {
        return {
            renderWidth: this.backRenderWidth,
            renderHeight: this.backRenderHeight,
            repeatX: this.backRepeatModeX,
            repeatY: this.backRepeatModeY,
            useImageSize: this.backUseImageSize,
            frameSpeed: this.backFrameSpeed
        };
    }

    //#endregion

    //#region 渲染设置

    useAsset(asset: ITrackedAssetData): void {
        if (this.assetData === asset) return;
        this.assetData = asset;
        this.sortedLayers.forEach(v => {
            this.updateLayerArea(v, 0, 0, v.width, v.height);
        });
    }

    setRenderSize(width: number, height: number): void {
        if (width === this.renderWidth && height === this.renderHeight) return;
        this.renderWidth = width;
        this.renderHeight = height;
        this.sortedLayers.forEach(v => {
            this.vertex.updateArea(v, 0, 0, this.mapWidth, this.mapHeight);
        });
    }

    setCellSize(width: number, height: number): void {
        if (width === this.cellWidth && height === this.cellHeight) return;
        this.cellWidth = width;
        this.cellHeight = height;
        this.sortedLayers.forEach(v => {
            this.vertex.updateArea(v, 0, 0, this.mapWidth, this.mapHeight);
        });
    }

    configRendering(config: Partial<IMapRenderConfig>): void {
        if (!isNil(config.minBehavior)) {
            this.tileMinifyBehavior = config.minBehavior;
            this.updateRequired = true;
        }
        if (!isNil(config.magBehavior)) {
            this.tileMagnifyBehavior = config.magBehavior;
            this.updateRequired = true;
        }
        if (!isNil(config.tileAlignX)) {
            this.tileAlignX = config.tileAlignX;
            this.updateRequired = true;
        }
        if (!isNil(config.tileAlignY)) {
            this.tileAlignY = config.tileAlignY;
            this.updateRequired = true;
        }
        if (!isNil(config.tileTestMode)) {
            this.tileTestMode = config.tileTestMode;
            this.updateRequired = true;
        }
        if (!isNil(config.frameSpeed)) {
            this.frameSpeed = config.frameSpeed;
        }
    }

    getRenderingConfig(): Readonly<IMapRenderConfig> {
        return {
            minBehavior: this.tileMinifyBehavior,
            magBehavior: this.tileMagnifyBehavior,
            tileAlignX: this.tileAlignX,
            tileAlignY: this.tileAlignY,
            tileTestMode: this.tileTestMode,
            frameSpeed: this.frameSpeed
        };
    }

    private getOffsetPool(): number[] {
        const pool = new Set([32]);
        // 其他的都是 bigImage 了，直接遍历获取
        for (const identifier of this.manager.bigImageStore.keys()) {
            const data = this.manager.getBigImage(identifier);
            if (!data) continue;
            const offset = data.texture.width / data.frames;
            pool.add(offset);
        }
        // 还有勇士图片
        for (const tex of this.manager.imageStore.values()) {
            if (!this.manager.assetContainsTexture(tex)) continue;
            const { w } = tex.render().rect;
            pool.add(w / 4);
        }
        // 其他判断
        if (pool.size > 64 && import.meta.env.DEV) {
            logger.warn(82);
        }
        if (pool.size > this.gl.MAX_VERTEX_UNIFORM_VECTORS) {
            logger.error(39, this.gl.MAX_VERTEX_UNIFORM_VECTORS.toString());
        }
        return [...pool];
    }

    getAssetSourceIndex(source: SizedCanvasImageSource): number {
        if (!this.assetData) return -1;
        return this.assetData.skipRef.get(source) ?? -1;
    }

    getOffsetIndex(offset: number): number {
        return this.offsetPool.indexOf(offset);
    }

    //#endregion

    //#region 画布上下文

    private initContext(): IContextData | null {
        const gl = this.gl;
        const vs = mapVert.replace('$1', this.offsetPool.length.toString());
        const tileProgram = compileProgramWith(gl, vs, mapFrag);
        const backProgram = compileProgramWith(gl, backVert, backFrag);
        if (!tileProgram || !backProgram) {
            logger.error(28);
            return null;
        }

        const { program: tp } = tileProgram;
        const { program: bp } = backProgram;

        const poolLocation = gl.getUniformLocation(
            tp,
            // 数组要写 [0]
            'u_offsetPool[0]'
        );
        const frameLocation = gl.getUniformLocation(tp, 'u_nowFrame');
        const tileSampler = gl.getUniformLocation(tp, 'u_sampler');
        const backSampler = gl.getUniformLocation(bp, 'u_sampler');
        const tileTrans = gl.getUniformLocation(tp, 'u_transform');
        const backTrans = gl.getUniformLocation(bp, 'u_transform');
        const backFrame = gl.getUniformLocation(bp, 'u_nowFrame');
        if (
            !poolLocation ||
            !frameLocation ||
            !tileSampler ||
            !backSampler ||
            !tileTrans ||
            !backTrans ||
            !backFrame
        ) {
            logger.error(29);
            return null;
        }

        const vertexAttrib = gl.getAttribLocation(tp, 'a_position');
        const insTilePosAttrib = gl.getAttribLocation(tp, 'a_tilePos');
        const insTexCoordAttib = gl.getAttribLocation(tp, 'a_texCoord');
        const insTileDataAttrib = gl.getAttribLocation(tp, 'a_tileData');
        const insTexDataAttib = gl.getAttribLocation(tp, 'a_texData');
        const backVertex = gl.getAttribLocation(bp, 'a_position');
        const backTexCoord = gl.getAttribLocation(bp, 'a_texCoord');

        const vertexBuffer = gl.createBuffer();
        const instancedBuffer = gl.createBuffer();
        const backVertexBuffer = gl.createBuffer();

        const tileTexture = gl.createTexture();
        const backgroundTexture = gl.createTexture();

        const tileVAO = gl.createVertexArray();
        const backVAO = gl.createVertexArray();

        // Post effect
        const pingFramebuffer = gl.createFramebuffer();
        const pongFramebuffer = gl.createFramebuffer();
        const pingTexture2D = gl.createTexture();
        const pongTexture2D = gl.createTexture();

        // 初始化 Post effect FBO 和 Texture
        gl.bindTexture(gl.TEXTURE_2D, pongTexture2D);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.canvas.width,
            this.canvas.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            pongTexture2D,
            0
        );
        gl.bindTexture(gl.TEXTURE_2D, pingTexture2D);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.canvas.width,
            this.canvas.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, pongFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            pingTexture2D,
            0
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // 初始化图块纹理
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, tileTexture);
        gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, 4096, 4096, 1);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);

        // 配置清空选项
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);

        // 其他配置
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LESS);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const data: IContextData = {
            tileProgram: tileProgram.program,
            tileVertShader: tileProgram.vertexShader,
            tileFragShader: tileProgram.fragmentShader,
            backProgram: backProgram.program,
            backVertShader: backProgram.vertexShader,
            backFragShader: backProgram.fragmentShader,
            vertexBuffer,
            instancedBuffer,
            backgroundVertexBuffer: backVertexBuffer,
            offsetPoolLocation: poolLocation,
            nowFrameLocation: frameLocation,
            tileSamplerLocation: tileSampler,
            backSamplerLocation: backSampler,
            tileTransformLocation: tileTrans,
            backTransformLocation: backTrans,
            backNowFrameLocation: backFrame,
            vertexAttribLocation: vertexAttrib,
            insTilePosAttribLocation: insTilePosAttrib,
            insTexCoordAttribLocation: insTexCoordAttib,
            insTileDataAttribLocation: insTileDataAttrib,
            insTexDataAttribLocation: insTexDataAttib,
            backVertexAttribLocation: backVertex,
            backTexCoordAttribLocation: backTexCoord,
            tileVAO,
            backVAO,
            tileTexture,
            backgroundTexture,

            pingFramebuffer,
            pongFramebuffer,
            pingTexture2D,
            pongTexture2D,

            tileTextureWidth: 4096,
            tileTextureHeight: 4096,
            tileTextureDepth: 1,
            backgroundWidth: 0,
            backgroundHeight: 0,
            backgroundDepth: 0,
            tileTextureMark: Symbol(),
            vertexMark: Symbol()
        };

        return data;
    }

    destroy(): void {
        const gl = this.gl;
        const data = this.contextData;
        if (!data) return;
        gl.deleteBuffer(data.vertexBuffer);
        gl.deleteBuffer(data.instancedBuffer);
        gl.deleteBuffer(data.backgroundVertexBuffer);
        gl.deleteProgram(data.tileProgram);
        gl.deleteProgram(data.backProgram);
        gl.deleteShader(data.tileVertShader);
        gl.deleteShader(data.tileFragShader);
        gl.deleteShader(data.backVertShader);
        gl.deleteShader(data.backFragShader);
        gl.deleteTexture(data.tileTexture);
        gl.deleteTexture(data.backgroundTexture);
        gl.deleteVertexArray(data.tileVAO);
        gl.deleteVertexArray(data.backVAO);
    }

    //#endregion

    //#region 渲染

    /**
     * 检查指定画布的纹理数组尺寸，需要预先绑定 gl.TEXTURE_2D_ARRAY 纹理
     * @param gl WebGL2 上下文
     * @param data 画布上下文数据
     * @param source 图形源列表
     * @returns 最终贴图尺寸是否改变
     */
    private checkTextureArraySize(
        gl: WebGL2RenderingContext,
        data: IContextData,
        source: ImageBitmap[]
    ): boolean {
        const maxWidth = maxBy(source, v => v.width)?.width ?? 0;
        const maxHeight = maxBy(source, v => v.height)?.height ?? 0;
        const count = source.length;
        if (
            maxWidth !== data.tileTextureWidth ||
            maxHeight !== data.tileTextureHeight ||
            count !== data.tileTextureDepth
        ) {
            gl.texStorage3D(
                gl.TEXTURE_2D_ARRAY,
                1,
                gl.RGBA8,
                maxWidth,
                maxHeight,
                count
            );
            data.tileTextureWidth = maxWidth;
            data.tileTextureHeight = maxHeight;
            data.tileTextureDepth = count;
            this.assetWidth = maxWidth;
            this.assetHeight = maxHeight;
            this.normalizedOffsetPool = this.offsetPool.map(v => v / maxWidth);
            this.needUpdateOffsetPool = true;
            return true;
        } else {
            return false;
        }
    }

    /**
     * 检查指定画布上下文的纹理是否需要更新
     * @param gl WebGL2 上下文
     * @param data 画布上下文数据
     */
    private checkTexture(gl: WebGL2RenderingContext, data: IContextData) {
        if (!this.assetData) return;
        const tile = data.tileTexture;
        const source = this.assetData.sourceList;
        const sourceArray = [...source.values()];
        if (!this.assetData.hasMark(data.tileTextureMark)) {
            // 如果没有标记，那么直接全部重新传递
            this.assetData.unmark(data.tileTextureMark);
            data.tileTextureMark = this.assetData.mark();
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, tile);
            this.checkTextureArraySize(gl, data, sourceArray);
            source.forEach((v, i) => {
                gl.texSubImage3D(
                    gl.TEXTURE_2D_ARRAY,
                    0,
                    0,
                    0,
                    i,
                    v.width,
                    v.height,
                    1,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    v
                );
            });
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(
                gl.TEXTURE_2D_ARRAY,
                gl.TEXTURE_MAG_FILTER,
                gl.NEAREST
            );
            gl.texParameteri(
                gl.TEXTURE_2D_ARRAY,
                gl.TEXTURE_MIN_FILTER,
                gl.NEAREST
            );
        } else {
            const dirty = this.assetData.dirtySince(data.tileTextureMark);
            if (dirty.size === 0) return;
            this.assetData.unmark(data.tileTextureMark);
            data.tileTextureMark = this.assetData.mark();
            logger.warn(87);
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, tile);
            const sizeChanged = this.checkTextureArraySize(
                gl,
                data,
                sourceArray
            );
            if (sizeChanged) {
                // 尺寸变化，需要全部重新传递
                source.forEach((v, i) => {
                    gl.texSubImage3D(
                        gl.TEXTURE_2D_ARRAY,
                        0,
                        0,
                        0,
                        i,
                        v.width,
                        v.height,
                        1,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        v
                    );
                });
            } else {
                // 否则只需要传递标记为脏的图像
                dirty.forEach(v => {
                    const img = source.get(v)!;
                    gl.texSubImage3D(
                        gl.TEXTURE_2D_ARRAY,
                        0,
                        0,
                        0,
                        v,
                        img.width,
                        img.height,
                        1,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        img
                    );
                });
            }
        }
    }

    /**
     * 检查图块顶点数组是否需要更新
     * @param gl WebGL2 上下文
     * @param data 上下文数据
     */
    private checkTileVertexArray(
        gl: WebGL2RenderingContext,
        data: IContextData
    ) {
        if (!this.assetData) return;
        this.vertex.checkRebuild();
        const hasDirty = this.vertex.hasMark(data.vertexMark);
        if (hasDirty) {
            const dirty = this.vertex.dirtySince(data.vertexMark);
            if (!dirty) return;
        }
        this.vertex.unmark(data.vertexMark);
        data.vertexMark = this.vertex.mark();
        const array = this.vertex.getVertexArray();
        const { instancedBuffer } = data;
        // 更新实例化缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, instancedBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, array.tileInstanced, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * 传递静态背景图
     * @param gl 画布上下文
     * @param data 上下文数据
     * @param source 图像源
     */
    private texStaticBackground(
        gl: WebGL2RenderingContext,
        data: IContextData,
        source: ImageBitmap
    ) {
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, data.backgroundTexture);
        const { width: w, height: h } = source;
        if (
            w !== data.backgroundWidth ||
            h !== data.backgroundHeight ||
            data.backgroundDepth !== 1
        ) {
            gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, w, h, 1);
            data.backgroundWidth = w;
            data.backgroundHeight = h;
            data.backgroundDepth = 1;
        }
        gl.texSubImage3D(
            gl.TEXTURE_2D_ARRAY,
            0,
            0,
            0,
            0,
            w,
            h,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source
        );
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    }

    /**
     * 传递动态背景图
     * @param gl 画布上下文
     * @param data 上下文数据
     * @param width 图像源宽度
     * @param height 图像源高度
     * @param source 图像源列表，要求图像源尺寸一致
     */
    private texDynamicBackground(
        gl: WebGL2RenderingContext,
        data: IContextData,
        width: number,
        height: number,
        source: ImageBitmap[]
    ) {
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, data.backgroundTexture);
        const w = width;
        const h = height;
        const depth = source.length;
        if (
            w !== data.backgroundWidth ||
            h !== data.backgroundHeight ||
            data.backgroundDepth !== depth
        ) {
            gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, w, h, depth);
            data.backgroundWidth = w;
            data.backgroundHeight = h;
            data.backgroundDepth = depth;
        }
        source.forEach((v, i) => {
            gl.texSubImage3D(
                gl.TEXTURE_2D_ARRAY,
                0,
                0,
                0,
                i,
                v.width,
                v.height,
                1,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                v
            );
        });
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    }

    /**
     * 更新背景图的顶点数组。如果使用了图片尺寸作为渲染尺寸，则使用 `width` `height` 参数，
     * 否则使用 `this.backRenderWidth` 和 `this.backRenderHeight`
     * @param gl WebGL2 上下文
     * @param data 上下文数据
     * @param width 图片宽度
     * @param height 图片高度
     */
    private updateBackgroundVertex(
        gl: WebGL2RenderingContext,
        data: IContextData,
        width: number,
        height: number
    ) {
        const w = this.backUseImageSize ? width : this.backRenderWidth;
        const h = this.backUseImageSize ? height : this.backRenderHeight;
        if (w === 0 || h === 0) return;
        const mapRenderWidth = this.mapWidth * this.cellWidth;
        const mapRenderHeight = this.mapHeight * this.cellHeight;
        const vx = mapRenderWidth / w;
        const vy = mapRenderHeight / h;
        const arr = this.backgroundVertex;
        const left = -1;
        const right = (mapRenderWidth / this.renderWidth) * 2 - 1;
        const top = -1;
        const bottom = (mapRenderHeight / this.renderHeight) * 2 - 1;
        // 左下角
        arr[0] = left;
        arr[1] = bottom;
        arr[2] = 0;
        arr[3] = vy;
        // 右下角
        arr[4] = right;
        arr[5] = bottom;
        arr[6] = vx;
        arr[7] = vy;
        // 左上角
        arr[8] = left;
        arr[9] = top;
        arr[10] = 0;
        arr[11] = 0;
        // 右上角
        arr[12] = right;
        arr[13] = top;
        arr[14] = vx;
        arr[15] = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, data.backgroundVertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * 使用静态图片作为背景
     * @param gl WebGL2 上下文
     * @param data 上下文数据
     * @param renderable 可渲染对象
     */
    private async useStaticBackground(
        gl: WebGL2RenderingContext,
        data: IContextData,
        renderable: ITextureRenderable
    ) {
        const { rect, source } = renderable;
        const { x, y, w, h } = rect;
        if (
            source.width === w &&
            source.height === h &&
            source instanceof ImageBitmap
        ) {
            // 如果图块的纹理直接就是整个图像源，那么直接传递，就不需要再创建位图了
            this.texStaticBackground(gl, data, source);
        } else {
            // 否则需要单独创建位图
            const image = await createImageBitmap(source, x, y, w, h);
            this.texStaticBackground(gl, data, image);
        }
        // 更新顶点数组
        this.updateBackgroundVertex(gl, data, w, h);
        this.backgroundFrameCount = 1;
    }

    /**
     * 使用动态图片作为背景
     * @param gl WebGL2 上下文
     * @param data 上下文数据
     * @param renderable 可渲染对象列表
     */
    private async useDynamicBackground(
        gl: WebGL2RenderingContext,
        data: IContextData,
        renderable: ITextureRenderable[]
    ) {
        if (renderable.length === 0) {
            // 纹理不包含动画可渲染数据
            logger.error(36);
            return;
        }
        const { w, h } = renderable[0].rect;
        if (renderable.some(v => v.rect.w !== w || v.rect.h !== h)) {
            // 如果纹理每帧尺寸不一致
            logger.error(37);
            return;
        }
        const images = await Promise.all(
            renderable.map(v => {
                const { x, y, w, h } = v.rect;
                return createImageBitmap(v.source, x, y, w, h);
            })
        );
        this.texDynamicBackground(gl, data, w, h, images);
        this.updateBackgroundVertex(gl, data, w, h);
    }

    /**
     * 使用图块作为背景，当绑定过 VAO 与纹理后再调用此方法
     * @param gl 画布上下文
     * @param data 上下文数据
     * @param tile 使用的背景图块
     */
    private useTileBackground(
        gl: WebGL2RenderingContext,
        data: IContextData,
        tile: number
    ): Promise<void> {
        // 图块背景
        const tex = this.manager.getIfBigImage(tile);
        if (!tex) {
            // 图块不存在
            logger.error(35);
            return Promise.resolve();
        }
        this.backgroundFrameCount = tex.frames;
        if (tex.frames === 1) {
            // 对于一帧图块，只需要传递一个纹理
            if (tex.cls === BlockCls.Autotile) {
                const renderable = this.autotile.renderWithoutCheck(
                    tex,
                    0b1111_1111
                )!;
                return this.useStaticBackground(gl, data, renderable);
            } else {
                return this.useStaticBackground(gl, data, tex.texture.render());
            }
        } else {
            // 多帧图块
            if (tex.cls === BlockCls.Autotile) {
                const gen = this.autotile.renderAnimatedWith(tex, 0b1111_1111);
                return this.useDynamicBackground(gl, data, [...gen]);
            } else {
                const gen = this.tileAnimater.once(tex.texture, tex.frames);
                return this.useDynamicBackground(gl, data, [...gen]);
            }
        }
    }

    private async checkBackground(
        gl: WebGL2RenderingContext,
        data: IContextData
    ) {
        if (!this.backgroundDirty || this.backgroundPending) return;
        this.backgroundPending = true;
        const { backgroundTexture } = data;
        // 根据背景类型使用不同贴图
        switch (this.backgroundType) {
            case BackgroundType.Tile: {
                await this.useTileBackground(gl, data, this.tileBack);
                break;
            }
            case BackgroundType.Static: {
                if (!this.staticBack) return;
                await this.useStaticBackground(gl, data, this.staticBack);
                break;
            }
            case BackgroundType.Dynamic: {
                if (!this.dynamicBack) return;
                await this.useDynamicBackground(gl, data, this.dynamicBack);
                break;
            }
        }
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, backgroundTexture);
        // 重复模式
        switch (this.backRepeatModeX) {
            case MapBackgroundRepeat.Repeat: {
                gl.texParameteri(
                    gl.TEXTURE_2D_ARRAY,
                    gl.TEXTURE_WRAP_S,
                    gl.REPEAT
                );
                break;
            }
            case MapBackgroundRepeat.RepeatMirror: {
                gl.texParameteri(
                    gl.TEXTURE_2D_ARRAY,
                    gl.TEXTURE_WRAP_S,
                    gl.MIRRORED_REPEAT
                );
                break;
            }
            case MapBackgroundRepeat.ClampToEdge: {
                gl.texParameteri(
                    gl.TEXTURE_2D_ARRAY,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                );
                break;
            }
        }
        switch (this.backRepeatModeY) {
            case MapBackgroundRepeat.Repeat: {
                gl.texParameteri(
                    gl.TEXTURE_2D_ARRAY,
                    gl.TEXTURE_WRAP_T,
                    gl.REPEAT
                );
                break;
            }
            case MapBackgroundRepeat.RepeatMirror: {
                gl.texParameteri(
                    gl.TEXTURE_2D_ARRAY,
                    gl.TEXTURE_WRAP_T,
                    gl.MIRRORED_REPEAT
                );
                break;
            }
            case MapBackgroundRepeat.ClampToEdge: {
                gl.texParameteri(
                    gl.TEXTURE_2D_ARRAY,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                );
                break;
            }
        }
        gl.texParameteri(
            gl.TEXTURE_2D_ARRAY,
            gl.TEXTURE_MAG_FILTER,
            gl.NEAREST
        );
        gl.texParameteri(
            gl.TEXTURE_2D_ARRAY,
            gl.TEXTURE_MIN_FILTER,
            gl.NEAREST
        );
        this.backgroundPending = false;
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
        this.updateRequired = true;
    }

    render(): HTMLCanvasElement {
        const gl = this.gl;
        const data = this.contextData;
        if (!this.assetData) {
            logger.error(31);
            return this.canvas;
        }

        const {
            backVAO,
            backProgram,
            backNowFrameLocation,
            backTransformLocation,
            backgroundTexture,
            tileVAO,
            tileProgram,
            tileTexture,
            instancedBuffer,
            offsetPoolLocation,
            nowFrameLocation,
            tileTransformLocation,
            insTilePosAttribLocation: tilePos,
            insTexCoordAttribLocation: texCoord,
            insTileDataAttribLocation: tileData,
            insTexDataAttribLocation: texData,
            pingFramebuffer,
            pongFramebuffer,
            pingTexture2D,
            pongTexture2D
        } = data;

        // 图层检查
        this.vertex.checkRebuild();

        // 数据检查
        this.checkTexture(gl, data);
        this.checkTileVertexArray(gl, data);

        const area = this.viewport.getRenderArea();
        area.blockList.forEach(v => {
            if (v.data.dirty) {
                this.vertex.updateBlockCache(v);
            }
            if (v.data.renderDirty) {
                v.data.render();
            }
        });
        this.vertex.renderDynamic();

        if (area.dirty.length > 0) {
            // 如果需要更新顶点数组...
            const array = this.vertex.getVertexArray();
            gl.bindBuffer(gl.ARRAY_BUFFER, instancedBuffer);
            area.dirty.forEach(v => {
                gl.bufferSubData(
                    gl.ARRAY_BUFFER,
                    // float32 需要 * 4
                    v.startIndex * INSTANCED_COUNT * 4,
                    array.tileInstanced,
                    v.startIndex * INSTANCED_COUNT,
                    v.count * INSTANCED_COUNT
                );
            });
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        gl.viewport(
            this.viewportX,
            this.viewportY,
            this.viewportWidth,
            this.viewportHeight
        );

        const postEffects = this.postEffects.filter(v => v.enabled);

        if (postEffects.length > 1) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, pingFramebuffer);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        // 背景
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(backProgram);
        if (this.needUpdateBackgroundFrame) {
            gl.uniform1f(backNowFrameLocation, this.backgroundFrame);
        }
        if (this.needUpdateTransform) {
            gl.uniformMatrix3fv(
                backTransformLocation,
                false,
                this.transform.mat
            );
        }
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, backgroundTexture);
        gl.bindVertexArray(backVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        // 图块
        gl.useProgram(tileProgram);
        if (this.needUpdateOffsetPool) {
            gl.uniform1fv(offsetPoolLocation, this.normalizedOffsetPool);
        }
        if (this.needUpdateFrameCounter) {
            gl.uniform1f(nowFrameLocation, this.frameCounter);
        }
        if (this.needUpdateTransform) {
            gl.uniformMatrix3fv(
                tileTransformLocation,
                false,
                this.transform.mat
            );
        }
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, tileTexture);
        gl.bindVertexArray(tileVAO);

        // 由于 WebGL2 没有 glDrawArraysInstancedBaseInstance，只能每次渲染的时候临时修改 VBO 读取方式
        const stride = INSTANCED_COUNT * 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, instancedBuffer);
        area.render.forEach(v => {
            const s = v.startIndex * INSTANCED_COUNT;
            const o1 = s + 0;
            const o2 = o1 + 4 * 4;
            const o3 = o2 + 4 * 4;
            const o4 = o3 + 4 * 4;
            gl.vertexAttribPointer(tilePos, 4, gl.FLOAT, false, stride, o1);
            gl.vertexAttribPointer(texCoord, 4, gl.FLOAT, false, stride, o2);
            gl.vertexAttribPointer(tileData, 4, gl.FLOAT, false, stride, o3);
            gl.vertexAttribPointer(texData, 4, gl.FLOAT, false, stride, o4);
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, v.count);
        });
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);

        // Post effects
        let inputTextrue = pongTexture2D;
        let outputFBO: WebGLFramebuffer | null = pingFramebuffer;

        postEffects.forEach((v, i, a) => {
            v.render(gl, inputTextrue, outputFBO, data);
            if (inputTextrue === pongTexture2D) {
                inputTextrue = pingTexture2D;
            } else {
                inputTextrue = pongTexture2D;
            }
            if (i === a.length - 2) {
                outputFBO = null;
            } else {
                if (outputFBO === pingFramebuffer) {
                    outputFBO = pongFramebuffer;
                } else {
                    outputFBO = pingFramebuffer;
                }
            }
        });

        // 清空更新状态标识
        this.updateRequired = false;
        this.needUpdateFrameCounter = false;
        this.needUpdateBackgroundFrame = false;
        this.needUpdateTransform = false;
        this.needUpdateOffsetPool = false;
        this.vertex.renderDynamic();

        return this.canvas;
    }

    //#endregion

    //#region 地图处理

    /**
     * 更新指定图层的指定区域
     * @param layer 更新的图层
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param w 区域宽度
     * @param h 区域高度
     */
    updateLayerArea(
        layer: IMapLayer,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        this.vertex.updateArea(layer, x, y, w, h);
        this.updateRequired = true;
    }

    /**
     * 更新指定图层的指定图块
     * @param layer 更新的图层
     * @param block 更新为的图块
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    updateLayerBlock(layer: IMapLayer, block: number, x: number, y: number) {
        this.vertex.updateBlock(layer, block, x, y);
        this.updateRequired = true;
    }

    getBlockStatus(
        layer: IMapLayer,
        x: number,
        y: number
    ): IBlockStatus | null {
        if (x < 0 || y < 0 || x > this.mapWidth || y > this.mapHeight) {
            return null;
        }
        return new StaticBlockStatus(layer, this.vertex, x, y);
    }

    //#endregion

    //#region 移动图块处理

    /**
     * 扩大移动数组
     */
    private expandMoving() {
        const start = this.movingCount;
        this.movingCount *= 2;
        this.vertex.expandMoving(this.movingCount);
        this.movingIndexPool.push(
            // 翻转数组是因为这样的话内容会优先取到低索引的内容，更容易优化
            ...Array.from({ length: start }, (_, i) => i + start).reverse()
        );
    }

    /**
     * 减小移动数组
     */
    private reduceMoving() {
        const half = Math.round(this.movingCount / 2);
        if (half < DYNAMIC_RESERVE) return;
        for (const moving of this.movingBlock) {
            if (moving.index >= half) return;
        }
        this.vertex.reduceMoving(half);
    }

    /**
     * 申请移动索引
     * @returns 移动索引
     */
    private requireMovingIndex(): number {
        if (this.movingIndexPool.length === 0) {
            this.expandMoving();
        }
        const half = Math.max(
            Math.round(this.movingCount / 2),
            DYNAMIC_RESERVE
        );
        if (this.movingIndexPool.length < half) {
            this.lastExpandTime = this.timestamp;
        }
        return this.movingIndexPool.pop()!;
    }

    /**
     * 退回移动索引
     * @param index 退回的索引
     */
    private returnMovingIndex(index: number) {
        this.movingIndexPool.push(index);
    }

    addMovingBlock(
        layer: IMapLayer,
        block: number | IMaterialFramedData,
        x: number,
        y: number
    ): IMovingBlock {
        const index = this.requireMovingIndex();
        const moving = new MovingBlock(this, index, layer, block);
        moving.setPos(x, y);
        this.movingBlock.add(moving);
        this.movingIndexMap.set(index, moving);
        this.vertex.updateMoving(moving, true);
        return moving;
    }

    getMovingBlock(): Set<IMovingBlock> {
        return this.movingBlock;
    }

    getMovingBlockByIndex(index: number): IMovingBlock | null {
        return this.movingIndexMap.get(index) ?? null;
    }

    deleteMoving(block: IMovingBlock): void {
        this.returnMovingIndex(block.index);
        this.movingBlock.delete(block);
        this.movingIndexMap.delete(block.index);
        this.vertex.deleteMoving(block);
    }

    hasMoving(moving: IMovingBlock): boolean {
        return this.movingBlock.has(moving);
    }

    //#endregion

    //#region 其他方法

    getTimestamp(): number {
        return this.timestamp;
    }

    tick(timestamp: number) {
        this.timestamp = timestamp;

        // 移动数组
        const expandDT = timestamp - this.lastExpandTime;
        if (expandDT > MOVING_TOLERANCE * 1000) {
            this.reduceMoving();
            this.lastExpandTime = timestamp;
        }

        // 背景
        const backgroundDT = timestamp - this.backLastFrame;
        if (backgroundDT > this.backFrameSpeed) {
            this.backgroundFrame++;
            this.backgroundFrame %= this.backgroundFrameCount;
            this.backLastFrame = timestamp;
            this.needUpdateBackgroundFrame = true;
        }

        // 地图帧动画
        const frameDT = timestamp - this.lastFrameTime;
        if (frameDT > this.frameSpeed) {
            this.lastFrameTime = timestamp;
            this.frameCounter++;
            this.needUpdateFrameCounter = true;
        }

        this.tickers.forEach(v => void v.fn(timestamp));

        // 图块移动
        if (this.movingBlock.size > 0) {
            const toUpdate: IMovingBlock[] = [];
            this.movingBlock.forEach(v => {
                const move = v.stepMoving(timestamp);
                if (move) toUpdate.push(v);
            });
            this.vertex.updateMovingList(toUpdate, false);
        }
    }

    requestTicker(fn: (timestamp: number) => void): IMapRendererTicker {
        const ticker = new MapRendererTicker(this, fn, this.timestamp);
        this.tickers.add(ticker);
        return ticker;
    }

    removeTicker(ticker: MapRendererTicker): void {
        this.tickers.delete(ticker);
    }

    updateTransform(): void {
        this.needUpdateTransform = true;
    }

    requestUpdate(): void {
        this.updateRequired = true;
    }

    needUpdate(): boolean {
        return (
            this.updateRequired ||
            this.needUpdateFrameCounter ||
            this.needUpdateBackgroundFrame ||
            this.needUpdateTransform ||
            this.vertex.dynamicRenderDirty ||
            this.needUpdateOffsetPool
        );
    }

    //#endregion
}

class RendererLayerStateHook implements Partial<ILayerStateHooks> {
    constructor(readonly renderer: MapRenderer) {}

    onChangeBackground(tile: number): void {
        this.renderer.setTileBackground(tile);
    }

    onResizeLayer(): void {
        this.renderer.resizeLayer();
    }

    onUpdateLayer(): void {
        this.renderer.updateLayerList();
    }

    onUpdateLayerArea(
        layer: IMapLayer,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        this.renderer.updateLayerArea(layer, x, y, width, height);
    }

    onUpdateLayerBlock(
        layer: IMapLayer,
        block: number,
        x: number,
        y: number
    ): void {
        this.renderer.updateLayerBlock(layer, block, x, y);
    }
}

class MapRendererTicker implements IMapRendererTicker {
    constructor(
        readonly renderer: MapRenderer,
        readonly fn: (timestamp: number) => void,
        public timestamp: number
    ) {}

    tick(timestamp: number) {
        this.timestamp = timestamp;
        this.fn(timestamp);
    }

    remove(): void {
        this.renderer.removeTicker(this);
    }
}
