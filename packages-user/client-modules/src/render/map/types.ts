import {
    IDirtyMark,
    IDirtyTracker,
    IHookable,
    IHookBase,
    IHookController
} from '@motajs/common';
import { ITextureRenderable } from '@motajs/render-assets';
import { Transform } from '@motajs/render-core';
import {
    IAutotileProcessor,
    IMaterialFramedData,
    IMaterialManager,
    ITrackedAssetData
} from '@user/client-base';
import { ILayerState, IMapLayer } from '@user/data-state';
import { TimingFn } from 'mutate-animate';

export const enum MapBackgroundRepeat {
    /** 直接重复 */
    Repeat,
    /** 重复，但镜像 */
    RepeatMirror,
    /** 超出范围的使用边缘像素 */
    ClampToEdge
}

export const enum MapTileBehavior {
    /** 适应到格子尺寸，宽高会被设置为格子尺寸，如果比例不对会被拉伸 */
    FitToSize,
    /** 保持图块尺寸，具体渲染位置会受到对齐属性的影响 */
    KeepSize
}

export const enum MapTileSizeTestMode {
    /** 只要宽度或高度有一个大于格子，那么就视为超出格子大小，会执行图块缩小行为 */
    WidthOrHeight,
    /** 当宽度和高度都大于格子宽度和高度时，才视为超出格子大小，执行图块缩小行为 */
    WidthAndHeight
}

export const enum MapTileAlign {
    /** 对于水平对齐，表示与格子左侧对齐；对于竖直对齐，表示与格子上侧对齐 */
    Start,
    /** 对于水平对齐，表示与格子左右居中对齐；对于竖直对齐，表示与格子上下居中对齐 */
    Center,
    /** 对于水平对齐，表示与格子右侧对齐；对于竖直对齐，表示与格子下侧对齐 */
    End
}

export interface IMapBackgroundConfig {
    /** 是否使用图片大小作为背景图渲染大小，如果是 `false`，则使用 `renderWidth` `renderHeight` 作为渲染大小 */
    readonly useImageSize: boolean;
    /** 背景图渲染宽度，即要画多宽，单位像素 */
    readonly renderWidth: number;
    /** 背景图渲染高度，即要画多高，单位像素 */
    readonly renderHeight: number;
    /** 背景图在水平方向上的重复方式 */
    readonly repeatX: MapBackgroundRepeat;
    /** 背景图在竖直方向上的重复方式 */
    readonly repeatY: MapBackgroundRepeat;
    /** 动态背景图每帧的时长 */
    readonly frameSpeed: number;
}

export interface IMapRenderConfig {
    /** 当图块比格子大时，图块应该如何渲染 */
    readonly minBehavior: MapTileBehavior;
    /** 当图块比格子小时，图块应该如何渲染 */
    readonly magBehavior: MapTileBehavior;
    /** 当图块与格子大小不匹配时，图块水平对齐方式 */
    readonly tileAlignX: MapTileAlign;
    /** 当图块与格子大小不匹配时，图块竖直对齐方式 */
    readonly tileAlignY: MapTileAlign;
    /** 图块与网格判断大小的方式 */
    readonly tileTestMode: MapTileSizeTestMode;
    /** 帧动画时长 */
    readonly frameSpeed: number;
}

export interface IContextData {
    /** 图块程序 */
    readonly tileProgram: WebGLProgram;
    /** 背景程序 */
    readonly backProgram: WebGLProgram;
    /** 图块顶点着色器 */
    readonly tileVertShader: WebGLShader;
    /** 图块片段着色器 */
    readonly tileFragShader: WebGLShader;
    /** 背景顶点着色器 */
    readonly backVertShader: WebGLShader;
    /** 背景片段着色器 */
    readonly backFragShader: WebGLShader;
    /** 偏移池 uniform 地址 */
    readonly offsetPoolLocation: WebGLUniformLocation;
    /** 当前帧 uniform 地址 */
    readonly nowFrameLocation: WebGLUniformLocation;
    /** 图块采样器 uniform 地址 */
    readonly tileSamplerLocation: WebGLUniformLocation;
    /** 图块变换矩阵 uniform 地址 */
    readonly tileTransformLocation: WebGLUniformLocation;
    /** 背景采样器 uniform 地址 */
    readonly backSamplerLocation: WebGLUniformLocation;
    /** 背景变换矩阵 uniform 地址 */
    readonly backTransformLocation: WebGLUniformLocation;
    /** 背景图当前帧数 uniform 地址 */
    readonly backNowFrameLocation: WebGLUniformLocation;
    /** 顶点数组输入 */
    readonly vertexAttribLocation: number;
    /** 图块坐标输入 */
    readonly insTilePosAttribLocation: number;
    /** 图块纹理坐标输入 */
    readonly insTexCoordAttribLocation: number;
    /** 图块数据输入 */
    readonly insTileDataAttribLocation: number;
    /** 图块当前帧数输入 */
    readonly insTexDataAttribLocation: number;
    /** 背景顶点数组输入 */
    readonly backVertexAttribLocation: number;
    /** 背景纹理数组输入 */
    readonly backTexCoordAttribLocation: number;
    /** 顶点数组 */
    readonly vertexBuffer: WebGLBuffer;
    /** 实例化数据数组 */
    readonly instancedBuffer: WebGLBuffer;
    /** 背景顶点数组 */
    readonly backgroundVertexBuffer: WebGLBuffer;
    /** 图块纹理对象 */
    readonly tileTexture: WebGLTexture;
    /** 背景纹理对象 */
    readonly backgroundTexture: WebGLTexture;
    /** 图块程序的 VAO */
    readonly tileVAO: WebGLVertexArrayObject;
    /** 背景程序的 VAO */
    readonly backVAO: WebGLVertexArrayObject;

    /** 当前画布的图块纹理宽度 */
    tileTextureWidth: number;
    /** 当前画布的图块纹理高度 */
    tileTextureHeight: number;
    /** 当前画布的图块纹理深度 */
    tileTextureDepth: number;
    /** 当前画布的背景纹理宽度 */
    backgroundWidth: number;
    /** 当前画布的背景纹理高度 */
    backgroundHeight: number;
    /** 当前画布的背景纹理深度 */
    backgroundDepth: number;

    /** 图块纹理的脏标记 */
    tileTextureMark: IDirtyMark;
    /** 顶点数组的脏标记 */
    vertexMark: IDirtyMark;
}

export interface IMovingBlock {
    /** 移动图块的索引 */
    readonly index: number;
    /** 图块数字 */
    readonly tile: number;
    /** 图块横坐标 */
    readonly x: number;
    /** 图块纵坐标 */
    readonly y: number;
    /** 图块使用的纹理 */
    readonly texture: IMaterialFramedData;
    /** 该图块所属的图层 */
    readonly layer: IMapLayer;

    /**
     * 沿直线移动到目标点
     * @param x 目标横坐标，可以填小数
     * @param y 目标纵坐标，可以填小数
     * @param timing 移动的速率曲线，默认为匀速移动
     */
    lineTo(
        x: number,
        y: number,
        time: number,
        timing?: TimingFn
    ): Promise<this>;

    /**
     * 按照指定曲线移动，使用绝对模式，即 `curve` 输出值就是图块当前位置
     * @param curve 移动曲线，接收完成度作为参数，输出图块应该在的位置
     * @param timing 移动的速率曲线，默认为匀速移动
     */
    moveAs(curve: TimingFn<2>, time: number, timing?: TimingFn): Promise<this>;

    /**
     * 按照指定曲线移动，使用相对模式，即 `curve` 输出值与原始坐标相加得到当前位置
     * @param curve 移动曲线，接收完成度作为参数，输出图块应该在的位置
     * @param timing 移动的速率曲线，默认为匀速移动
     */
    moveRelative(
        curve: TimingFn<2>,
        time: number,
        timing?: TimingFn
    ): Promise<this>;

    /**
     * 启用此图块的帧动画
     */
    enableFrameAnimate(): void;

    /**
     * 禁用此图块的帧动画
     */
    disableFrameAnimate(): void;

    /**
     * 设置此图块的不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number): void;

    /**
     * 进行一步动画移动效果
     * @param timestamp 当前时间戳
     * @returns 图块是否发生了移动
     */
    stepMoving(timestamp: number): boolean;

    /**
     * 摧毁这个移动图块对象，之后不会再显示到画面上
     */
    destroy(): void;
}

export interface IMapRendererHooks extends IHookBase {
    /**
     * 当需要更新画面时执行
     */
    onUpdate(controller: IHookController<this>): void;
}

export interface IMapRenderer extends IHookable<IMapRendererHooks> {
    /** 地图渲染器使用的资源管理器 */
    readonly manager: IMaterialManager;
    /** 画布渲染上下文 */
    readonly gl: WebGL2RenderingContext;

    /** 自动元件处理对象 */
    readonly autotile: IAutotileProcessor;
    /** 地图变换矩阵 */
    readonly transform: Transform;
    /** 地图渲染的视角控制 */
    readonly viewport: IMapViewportController;
    /** 顶点数组生成器 */
    readonly vertex: IMapVertexGenerator;
    /** 使用的地图状态对象 */
    readonly layerState: ILayerState;

    /** 地图宽度 */
    readonly mapWidth: number;
    /** 地图高度 */
    readonly mapHeight: number;
    /** 图层数量 */
    readonly layerCount: number;
    /** 渲染宽度 */
    readonly renderWidth: number;
    /** 渲染高度 */
    readonly renderHeight: number;
    /** 每个格子的宽度 */
    readonly cellWidth: number;
    /** 每个格子的高度 */
    readonly cellHeight: number;
    /** 图集宽度 */
    readonly assetWidth: number;
    /** 图集高度 */
    readonly assetHeight: number;

    /**
     * 使用指定图集对象
     * @param asset 要使用的缓存对象
     */
    useAsset(asset: ITrackedAssetData): void;

    /**
     * 摧毁此地图渲染器，表示当前渲染器不会再被使用到
     */
    destroy(): void;

    /**
     * 渲染至目标画布
     * @param gl 渲染至的上下文
     */
    render(gl: WebGL2RenderingContext): void;

    /**
     * 设置渲染器使用的地图状态
     * @param layerState 地图状态
     */
    setLayerState(layerState: ILayerState): void;

    /**
     * 根据标识符获取图层
     * @param identifier 图层标识符
     */
    getLayer(identifier: string): IMapLayer | null;

    /**
     * 判断当前渲染器是否包含指定图层对象
     * @param layer 图层对象
     */
    hasLayer(layer: IMapLayer): boolean;

    /**
     * 获取排序后的图层列表，是内部引用的副本，不是对内部的直接引用，不具有实时性
     */
    getSortedLayer(): IMapLayer[];

    /**
     * 获取指定图层排序后的索引位置
     * @param layer 要获取的图层
     */
    getLayerIndex(layer: IMapLayer): number;

    /**
     * 获取指定偏移值在偏移池中的索引
     * @param offset 原始偏移值，非归一化偏移值
     */
    getOffsetIndex(offset: number): number;

    /**
     * 使用静态图片作为地图背景图
     * @param renderable 可渲染对象
     */
    setStaticBackground(renderable: ITextureRenderable): void;

    /**
     * 使用普通动画图片作为地图背景图
     * @param renderable 可渲染对象列表，不能是无限循环动画（`ITexture.cycled`），需要是普通动画（`ITexture.dynamic`）
     */
    setDynamicBackground(renderable: Iterable<ITextureRenderable>): void;

    /**
     * 使用图块作为地图背景图，图块可以包含动画
     * @param tile 图块数字
     */
    setTileBackground(tile: number): void;

    /**
     * 配置背景图片的渲染方式，仅对静态与动态背景图有效，对图块背景图无效
     * @param config 背景图片配置
     */
    configBackground(config: Partial<IMapBackgroundConfig>): void;

    /**
     * 配置渲染器的渲染设置
     * @param config 渲染设置
     */
    configRendering(config: Partial<IMapRenderConfig>): void;

    /**
     * 设置渲染的宽高，单位像素
     * @param width 渲染的像素宽度
     * @param height 渲染的像素高度
     */
    setRenderSize(width: number, height: number): void;

    /**
     * 获取背景渲染设置。并不是内部存储的引用，不会实时更新。
     */
    getBackgroundConfig(): IMapBackgroundConfig;

    /**
     * 获取地图渲染设置。并不是内部存储的引用，不会实时更新。
     */
    getRenderingConfig(): IMapRenderConfig;

    /**
     * 设置每个格子的宽高
     * @param width 每个格子的宽度
     * @param height 每个格子的高度
     */
    setCellSize(width: number, height: number): void;

    /**
     * 添加一个移动图块
     * @param layer 图块所属的图层
     * @param block 图块数字或图块的素材对象，要求可渲染对象的图像源必须出现在图集中
     * @param x 图块初始横坐标，可以填小数
     * @param y 图块初始纵坐标，可以填小数
     * @returns 移动图块对象，可以用于控制图块移动
     */
    addMovingBlock(
        layer: IMapLayer,
        block: number | IMaterialFramedData,
        x: number,
        y: number
    ): Readonly<IMovingBlock>;

    /**
     * 获取所有的移动图块
     */
    getMovingBlock(): Set<Readonly<IMovingBlock>>;

    /**
     * 根据索引获取移动图块对象
     * @param index 移动图块索引
     */
    getMovingBlockByIndex(index: number): Readonly<IMovingBlock> | null;

    /**
     * 启用指定图块的帧动画效果
     * @param layer 图层
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    enableTileFrameAnimate(layer: IMapLayer, x: number, y: number): void;

    /**
     * 禁用指定图块的帧动画效果
     * @param layer 图层
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    disableTileFrameAnimate(layer: IMapLayer, x: number, y: number): void;

    /**
     * 设置指定图块的不透明度
     * @param layer 图层
     * @param alpha 图块不透明度
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    setTileAlpha(layer: IMapLayer, alpha: number, x: number, y: number): void;
}

export interface IMapVertexArray {
    /**
     * 地图渲染实例化数组，结构是一个三维张量 `[B, L, T]`，其中 `B` 代表分块，`L` 代表图层，`T` 代表图块，并按照结构顺序平铺存储。
     *
     * 语义解释就是，最内层存储图块，再外面一层存储图层，最外层存储分块。这样的话可以一次性将一个分块的所有图层渲染完毕。
     *
     * 依次存储 a_tilePos, a_texCoord, a_tileData, a_texData
     */
    readonly tileInstanced: Float32Array;

    /** 动态内容的起始索引，以实例为单位 */
    readonly dynamicStart: number;
    /** 动态内容的数量，以实例为单位 */
    readonly dynamicCount: number;
}

export interface IBlockIndex {
    /** 横坐标 */
    readonly x: number;
    /** 纵坐标 */
    readonly y: number;
    /** 分块左上角数据的横坐标 */
    readonly dataX: number;
    /** 分块左上角数据的纵坐标 */
    readonly dataY: number;
    /** 索引，等于 横坐标+纵坐标*宽度 */
    readonly index: number;
}

export interface IBlockInfo extends IBlockIndex {
    /** 分块宽度 */
    readonly width: number;
    /** 分块高度 */
    readonly height: number;
}

export interface IBlockData<T> extends IBlockInfo {
    /** 这个分块的数据 */
    data: T;

    /**
     * 获取这个分块左方的分块
     */
    left(): IBlockData<T> | null;

    /**
     * 获取这个分块右方的分块
     */
    right(): IBlockData<T> | null;

    /**
     * 获取这个分块上方的分块
     */
    up(): IBlockData<T> | null;

    /**
     * 获取这个分块下方的分块
     */
    down(): IBlockData<T> | null;

    /**
     * 获取这个分块左上方的分块
     */
    leftUp(): IBlockData<T> | null;

    /**
     * 获取这个分块左下方的分块
     */
    leftDown(): IBlockData<T> | null;

    /**
     * 获取这个分块右上方的分块
     */
    rightUp(): IBlockData<T> | null;

    /**
     * 获取这个分块右下方的分块
     */
    rightDown(): IBlockData<T> | null;

    /**
     * 获取下一个索引的分块
     */
    next(): IBlockData<T> | null;
}

export interface IBlockSplitterConfig {
    /** 分块宽度 */
    readonly blockWidth: number;
    /** 分块高度 */
    readonly blockHeight: number;
    /** 数据宽度 */
    readonly dataWidth: number;
    /** 数据高度 */
    readonly dataHeight: number;
}

export interface IBlockSplitter<T> extends IBlockSplitterConfig {
    /** 宽度，即横向有多少分块 */
    readonly width: number;
    /** 高度，即纵向有多少分块 */
    readonly height: number;

    /**
     * 根据坐标获取分块内容
     * @param x 横坐标
     * @param y 纵坐标
     */
    getBlockByLoc(x: number, y: number): IBlockData<T> | null;

    /**
     * 根据分块索引获取分块内容
     * @param index 分块索引
     */
    getBlockByIndex(index: number): IBlockData<T> | null;

    /**
     * 根据分块坐标设置分块内容
     * @param data 分块数据
     * @param x 分块横坐标
     * @param y 分块纵坐标
     * @returns 分块内容
     */
    setBlockByLoc(data: T, x: number, y: number): IBlockData<T> | null;

    /**
     * 根据分块索引设置分块内容
     * @param data 分块数据
     * @param index 分块索引
     * @returns 分块内容
     */
    setBlockByIndex(data: T, index: number): IBlockData<T> | null;

    /**
     * 根据分块坐标，遍历指定分块中的所有坐标（分块 -> 元素）
     * @param x 分块横坐标
     * @param y 分块纵坐标
     */
    iterateBlockByLoc(x: number, y: number): Generator<IBlockIndex, void>;

    /**
     * 根据分块索引，遍历指定分块中的所有坐标（分块 -> 元素）
     * @param index 分块索引
     */
    iterateBlockByIndex(index: number): Generator<IBlockIndex, void>;

    /**
     * 根据分块索引列表，依次遍历每个分块的所有坐标（分块 -> 元素）
     * @param indices 分块索引列表
     */
    iterateBlockByIndices(
        indices: Iterable<number>
    ): Generator<IBlockIndex, void>;

    /**
     * 遍历所有的分块（分块 -> 分块）
     */
    iterateBlocks(): Iterable<IBlockData<T>>;

    /**
     * 传入指定的数据区域，对其所涉及的分块依次遍历（元素 -> 分块）
     * @param x 数据左上角横坐标
     * @param y 数据左上角纵坐标
     * @param width 数据宽度
     * @param height 数据高度
     */
    iterateBlocksOfDataArea(
        x: number,
        y: number,
        width: number,
        height: number
    ): Generator<IBlockData<T>>;

    /**
     * 根据分块坐标获取分块索引，如果坐标超出范围，返回 -1（分块 -> 分块）
     * @param x 分块横坐标
     * @param y 分块纵坐标
     */
    getIndexByLoc(x: number, y: number): number;

    /**
     * 根据分块索引获取分块坐标，如果索引超出范围，返回 `null`（分块 -> 分块）
     * @param index 分块索引
     */
    getLocByIndex(index: number): Loc | null;

    /**
     * 根据坐标列表，获取对应的分块索引，并组成一个列表（分块 -> 分块）
     * @param list 坐标列表
     */
    getIndicesByLocList(list: Iterable<Loc>): Iterable<number>;

    /**
     * 根据索引列表，获取对应的分块坐标，并组成一个列表（分块 -> 分块）
     * @param list 索引列表
     */
    getLocListByIndices(list: Iterable<number>): Iterable<Loc | null>;

    /**
     * 根据数据坐标获取其对应分块的信息（元素 -> 分块）
     * @param x 数据横坐标
     * @param y 数据纵坐标
     */
    getBlockByDataLoc(x: number, y: number): IBlockData<T> | null;

    /**
     * 根据数据索引获取其对应分块的信息（元素 -> 分块）
     * @param index 数据索引
     */
    getBlockByDataIndex(index: number): IBlockData<T> | null;

    /**
     * 根据数据的坐标列表，获取数据所在的分块索引，并组成一个集合（元素 -> 分块）
     * @param list 数据坐标列表
     */
    getIndicesByDataLocList(list: Iterable<Loc>): Set<number>;

    /**
     * 根据数据的索引列表，获取数据所在的分块索引，并组成一个集合（元素 -> 分块）
     * @param list 数据索引列表
     */
    getIndicesByDataIndices(list: Iterable<number>): Set<number>;

    /**
     * 根据数据的坐标列表，获取数据所在的分块内容，并组成一个集合（元素 -> 分块）
     * @param list 数据坐标列表
     */
    getBlocksByDataLocList(list: Iterable<Loc>): Set<IBlockData<T>>;

    /**
     * 根据数据的索引列表，获取数据所在的分块内容，并组成一个集合（元素 -> 分块）
     * @param list 数据索引列表
     */
    getBlocksByDataIndices(list: Iterable<number>): Set<IBlockData<T>>;

    /**
     * 配置此分块切分器，此行为不会清空分块数据，只有在执行下一次分块时才会生效
     * @param config 切分器配置
     */
    configSplitter(config: IBlockSplitterConfig): void;

    /**
     * 执行分块操作，对每个分块执行函数，获取分块数据
     * @param mapFn 对每个分块执行的函数
     */
    splitBlocks(mapFn: (block: IBlockInfo) => T): void;
}

export interface IMapVertexData {
    /** 这个分块的实例化数据数组 */
    readonly instancedArray: Float32Array;
}

export interface IIndexedMapVertexData extends IMapVertexData {
    /** 这个分块的实例化数据的起始索引 */
    readonly instancedStart: number;
}

export interface ILayerDirtyData {
    /** 是否需要更新顶点数组 */
    dirty: boolean;
    /** 脏区域左边缘 */
    dirtyLeft: number;
    /** 脏区域上边缘 */
    dirtyTop: number;
    /** 脏区域右边缘 */
    dirtyRight: number;
    /** 脏区域下边缘 */
    dirtyBottom: number;
}

export interface IMapVertexBlock extends IMapVertexData {
    /** 当前区域是否需要更新 */
    readonly dirty: boolean;
    /** 渲染是否需要更新 */
    readonly renderDirty: boolean;
    /** 起始索引，即第一个元素索引 */
    readonly startIndex: number;
    /** 终止索引，即最后一个元素索引+1 */
    readonly endIndex: number;
    /** 元素数量，即终止索引-起始索引 */
    readonly count: number;

    /**
     * 取消渲染的脏标记
     */
    render(): void;

    /**
     * 取消数据脏标记
     */
    updated(): void;

    /**
     * 标记指定区域为脏，需要更新
     * @param layer 图层对象
     * @param left 标记区域左边缘，相对于分块，即分块左上角为 `0,0`，包含
     * @param top 标记区域上边缘，相对于分块，即分块左上角为 `0,0`，包含
     * @param right 标记区域右边缘，相对于分块，即分块左上角为 `0,0`，不包含
     * @param bottom 标记区域下边缘，相对于分块，即分块左上角为 `0,0`，不包含
     */
    markDirty(
        layer: IMapLayer,
        left: number,
        top: number,
        right: number,
        bottom: number
    ): void;

    /**
     * 获取图层需要更新的区域
     * @param layer 图层
     */
    getDirtyArea(layer: IMapLayer): Readonly<ILayerDirtyData> | null;

    /**
     * 获取指定图层的实例化数据数组，是对内部存储的直接引用
     * @param layer 图层对象
     */
    getLayerInstanced(layer: IMapLayer): Float32Array | null;

    /**
     * 获取指定图层的所有顶点数组数据，是对内部存储的直接引用
     * @param layer 图层对象
     */
    getLayerData(layer: IMapLayer): IMapVertexData | null;
}

export interface IMapBlockUpdateObject {
    /** 要更新为的图块数字 */
    readonly block: number;
    /** 图块横坐标 */
    readonly x: number;
    /** 图块纵坐标 */
    readonly y: number;
}

/**
 * 脏标记表示顶点数组的长度是否发生变化
 */
export interface IMapVertexGenerator extends IDirtyTracker<boolean> {
    /** 地图渲染器 */
    readonly renderer: IMapRenderer;
    /** 地图分块 */
    readonly block: IBlockSplitter<IMapVertexBlock>;
    /** 动态部分是否需要更新渲染缓冲区 */
    readonly dynamicRenderDirty: boolean;

    /**
     * 取消渲染的脏标记
     */
    renderDynamic(): void;

    /**
     * 设置分块大小。一般设置为与画面大小一致，这样在多数情况下性能最优。
     * 不建议主动调用此方法，因为此方法会重建顶点数组，对性能影响较大。
     * @param width 分块宽度
     * @param height 分块高度
     */
    setBlockSize(width: number, height: number): void;

    /**
     * 重设地图尺寸
     */
    resizeMap(): void;

    /**
     * 扩大移动图块数组尺寸
     * @param targetSize 目标大小
     */
    expandMoving(targetSize: number): void;

    /**
     * 缩小移动图块数组尺寸
     * @param targetSize 目标大小
     * @param indexMap 索引映射。由于缩小尺寸后，有可能有一些移动的图块位于较高的索引，
     *                 因此需要一个映射来指定之前的那些移动图块现在应该在哪个索引。
     */
    reduceMoving(targetSize: number, indexMap: Map<number, number>): void;

    /**
     * 更新图层数组
     */
    updateLayerArray(): void;

    /**
     * 检查是否需要重建数组
     */
    checkRebuild(): void;

    /**
     * 获取顶点数组，是对内部存储的直接引用，但是内部存储在重新分配内存时引用会丢失
     */
    getVertexArray(): IMapVertexArray;

    /**
     * 更新指定区域内的所有图块
     * @param layer 更新的图层
     * @param x 更新区域左上角横坐标
     * @param y 更新区域左上角纵坐标
     * @param w 更新区域宽度
     * @param h 更新区域高度
     */
    updateArea(
        layer: IMapLayer,
        x: number,
        y: number,
        w: number,
        h: number
    ): void;

    /**
     * 更新指定图块
     * @param layer 更新的图层
     * @param block 设置为的图块
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    updateBlock(layer: IMapLayer, block: number, x: number, y: number): void;

    /**
     * 更新一系列图块，适用于散点图块，如果需要更新某个区域，请换用 {@link updateArea}
     * @param layer 更新的图层
     * @param blocks 要更新的图块列表
     */
    updateBlockList(layer: IMapLayer, blocks: IMapBlockUpdateObject[]): void;

    /**
     * 更新指定分块的数据，专门用于懒更新
     * @param block 要更新的分块
     */
    updateBlockCache(block: Readonly<IBlockData<IMapVertexBlock>>): void;

    /**
     * 更新指定的移动图块对象，可以用于新增移动图块
     * @param moving 要更新的移动图块对象
     * @param updateTexture 是否更新贴图信息
     */
    updateMoving(moving: IMovingBlock, updateTexture: boolean): void;

    /**
     * 更新一系列移动图块，可以用于新增移动图块
     * @param moving 移动图块列表
     * @param updateTexture 是否更新贴图信息
     */
    updateMovingList(moving: IMovingBlock[], updateTexture: boolean): void;

    /**
     * 移除指定的移动图块
     * @param moving 移动图块对象
     */
    deleteMoving(moving: IMovingBlock): void;

    /**
     * 启用静态内容的帧动画
     * @param layer 图层索引
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    enableStaticFrameAnimate(layer: IMapLayer, x: number, y: number): void;

    /**
     * 禁用静态内容的帧动画
     * @param layer 图层索引
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    disableStaticFrameAnimate(layer: IMapLayer, x: number, y: number): void;

    /**
     * 设置静态内容的不透明度
     * @param layer 图层索引
     * @param alpha 图块不透明度
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    setStaticAlpha(layer: IMapLayer, alpha: number, x: number, y: number): void;

    /**
     * 启用动态内容的帧动画
     * @param block 移动图块对象
     */
    enableDynamicFrameAnimate(block: IMovingBlock): void;

    /**
     * 禁用动态内容的帧动画
     * @param block 移动图块对象
     */
    disableDynamicFrameAnimate(block: IMovingBlock): void;

    /**
     * 设置动态内容的不透明度
     * @param block 移动图块对象
     * @param alpha 图块的不透明度
     */
    setDynamicAlpha(block: IMovingBlock, alpha: number): void;
}

export interface IMapRenderArea {
    /** 顶点起始索引，从哪个顶点开始处理 */
    readonly startIndex: number;
    /** 顶点终止索引，处理到哪个顶点 */
    readonly endIndex: number;
    /** 顶点数量，即终止索引减去起始索引 */
    readonly count: number;
}

export interface IMapRenderData {
    /** 需要渲染的区域 */
    readonly render: IMapRenderArea[];
    /** 需要更新顶点数组的区域 */
    readonly dirty: IMapRenderArea[];
    /** 需要更新的分块列表 */
    readonly blockList: IBlockData<IMapVertexBlock>[];
}

export interface IMapViewportController {
    /** 变换矩阵 */
    readonly transform: Transform;

    /**
     * 获取渲染区域，即哪些分块在画面内
     */
    getRenderArea(): IMapRenderData;

    /**
     * 绑定变换矩阵
     * @param transform 变换矩阵
     */
    bindTransform(transform: Transform): void;
}
