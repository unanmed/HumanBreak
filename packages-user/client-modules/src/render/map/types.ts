import {
    ITextureRenderable,
    SizedCanvasImageSource
} from '@motajs/render-assets';
import {
    IAutotileProcessor,
    IMaterialGetter,
    IMaterialManager
} from '@user/client-base';

export interface IMapAssetData {
    /** 缓存对象的标识符 */
    readonly symbol: unique symbol;
    /** 图像源列表 */
    readonly sourceList: ImageBitmap[];
    /**
     * 贴图引用跳接，`ImageBitmap` 的传递性能远好于其他类型，而贴图图集为了能够动态增加内容会使用画布类型，
     * 因此需要把贴图生成为额外的 `ImageBitmap`，并提供引用跳接映射。值代表在 `sourceList` 中的索引。
     */
    readonly skipRef: Map<SizedCanvasImageSource, number>;
    /** 被标记为脏的图像源，这些图像源经过了更新，需要重新传递给显卡 */
    readonly dirty: Set<number>;
    /** 贴图数据 */
    readonly materials: IMaterialGetter;
}

export interface IMapAssetManager {
    /** 素材管理对象 */
    readonly materials: IMaterialManager;

    /**
     * 生成地图渲染图集数据
     */
    generateAsset(): IMapAssetData;
}

export interface IMapVertexData {
    /** 顶点坐标数组，包含顶点坐标及对应的纹理坐标 */
    readonly position: Float32Array;
    /** 帧偏移池 */
    readonly offsetList: Float32Array;
    /** 偏移索引数组 */
    readonly offsetIndices: Uint8Array;
}

export interface IMapLayerHooks {
    /**
     * 当钩子准备完毕时执行，会自动分析依赖，并把依赖实例作为参数传入，遵循依赖列表的顺序
     * @param dependencies 依赖列表
     */
    awake(...dependencies: IMapLayerHooks[]): void;

    /**
     * 当拓展被移除之前执行，可以用来清理相关内容
     */
    destroy(): void;

    /**
     * 当更新某个区域的图块时执行
     * @param x 更新区域左上角横坐标
     * @param y 更新区域左上角纵坐标
     * @param width 更新区域宽度
     * @param height 更新区域高度
     */
    onUpdateArea(x: number, y: number, width: number, height: number): void;

    /**
     * 当更新某个点的图块时执行
     * @param x 更新点横坐标
     * @param y 更新点纵坐标
     */
    onUpdateBlock(x: number, y: number): void;

    /**
     * 当顶点数据更新时执行
     * @param data 顶点数据
     */
    onUpdateVertexData(data: IMapVertexData): void;
}

export interface IMapLayerExtends extends Partial<IMapLayerHooks> {
    /** 这个拓展对象的标识符 */
    readonly id: string;
    /** 这个拓展对象的依赖列表 */
    readonly dependencies: string[];
}

export interface IMapLayerExtendsController {
    /**
     * 获取地图数据，是对内部存储的直接引用
     */
    getMapData(): Uint32Array;

    /**
     * 获取顶点数据
     */
    getVertexData(): IMapVertexData;

    /**
     * 结束此对象的生命周期，释放相关资源
     */
    close(): void;
}

export interface IMapLayer {
    /** 图层的纵深，纵深高的会遮挡纵深低的 */
    readonly zIndex: number;

    /**
     * 使用指定图集对象
     * @param asset 要使用的缓存对象
     */
    useAsset(asset: IMapAssetData): void;

    /**
     * 设置某一点的图块
     * @param block 图块数字
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    setBlock(block: number, x: number, y: number): void;

    /**
     * 设置地图图块
     * @param array 地图图块数组
     * @param x 数组第一项代表的横坐标
     * @param y 数组第一项代表的纵坐标
     * @param width 传入数组所表示的矩形范围的宽度
     */
    putMapData(array: Uint32Array, x: number, y: number, width: number): void;

    /**
     * 获取整个地图的地图数组，是对内部地图数组的拷贝，并不能通过修改它来直接修改地图内容
     */
    getMapData(): Uint32Array;
    /**
     * 获取地图指定区域的地图数组，是对内部地图数组的拷贝，并不能通过修改它来直接修改地图内容
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param width 获取区域的宽度
     * @param height 获取区域的高度
     */
    getMapData(
        x: number,
        y: number,
        width: number,
        height: number
    ): Uint32Array;

    /**
     * 添加图层拓展，使用一系列钩子与图层本身通讯
     * @param ex 图层拓展对象
     * @returns 图层拓展控制对象，可以通过它来控制拓展的生命周期，也可以用于获取图层内的一些数据
     */
    addExtends(ex: IMapLayerExtends): IMapLayerExtendsController;

    /**
     * 移除指定的图层拓展对象
     * @param ex 要移除的图层拓展对象，也可以填拓展对象的标识符
     */
    removeExtends(ex: IMapLayerExtends | string): void;
}

/**
 * 地图渲染器，本身不包含画布，只能渲染至传入的画布中。可以传入多个 WebGL2 上下文的画布，在不同的画布上渲染。
 * 目前不建议把画布还用于其他渲染，因为状态切换可能会导致地图渲染性能下降。
 */
export interface IMapRenderer {
    /** 地图渲染器使用的资源管理器 */
    readonly manager: IMaterialManager;
    /** 自动元件处理对象 */
    readonly autotile: IAutotileProcessor;

    /**
     * 使用指定图集对象
     * @param asset 要使用的缓存对象
     */
    useAsset(asset: IMapAssetData): void;

    /**
     * 初始化指定的 WebGL2 上下文，可以初始化多个上下文
     * @param gl 需要初始化的上下文
     */
    initContext(gl: WebGL2RenderingContext): void;

    /**
     * 渲染至目标画布
     * @param gl 渲染至的上下文
     */
    render(gl: WebGL2RenderingContext): void;

    /**
     * 添加地图图层
     * @param layer 地图图层
     * @param identifier 图层的标识符，可以用于 {@link getLayer} 获取图层
     */
    addLayer(layer: IMapLayer, identifier?: string): void;

    /**
     * 移除指定图层
     * @param layer 要移除的图层
     */
    removeLayer(layer: IMapLayer): void;

    /**
     * 根据标识符获取图层
     * @param identifier 图层标识符
     */
    getLayer(identifier: string): IMapLayer | null;

    /**
     * 获取排序后的图层列表
     */
    getSortedLayer(): IMapLayer[];

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
     * 结束此渲染器的使用，释放所有相关资源
     */
    close(): void;
}
