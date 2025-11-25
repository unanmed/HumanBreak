import { IDirtyTracker, IDirtyMarker } from '@motajs/common';
import {
    ITexture,
    ITextureComposedData,
    ITextureRenderable,
    ITextureStore,
    SizedCanvasImageSource
} from '@motajs/render-assets';

export const enum BlockCls {
    Unknown,
    Terrains,
    Animates,
    Enemys,
    Npcs,
    Items,
    Enemy48,
    Npc48,
    Tileset,
    Autotile
}

export const enum AutotileType {
    Small2x3,
    Big3x4
}

export const enum AutotileConnection {
    LeftUp = 0b1000_0000,
    Up = 0b0100_0000,
    RightUp = 0b0010_0000,
    Right = 0b0001_0000,
    RightDown = 0b0000_1000,
    Down = 0b0000_0100,
    LeftDown = 0b0000_0010,
    Left = 0b0000_0001
}

export interface IMaterialData {
    /** 此素材的贴图对象存入了哪个贴图存储对象 */
    readonly store: ITextureStore;
    /** 贴图对象 */
    readonly texture: ITexture;
    /** 此素材的贴图对象的数字 id，一般对应到图块数字 */
    readonly identifier: number;
    /** 此素材的贴图对象的字符串别名，一般对应到图块 id */
    readonly alias?: string;
}

export interface IBlockIdentifier {
    /** 图块 id */
    readonly id: string;
    /** 图块数字 */
    readonly num: number;
    /** 图块类型 */
    readonly cls: Cls;
}

export interface IIndexedIdentifier {
    /** 标识符索引 */
    readonly index: number;
    /** 标识符别名 */
    readonly alias: string;
}

export interface IMaterialAssetData {
    /** 图集数据 */
    readonly data: ITextureComposedData;
    /** 贴图的标识符 */
    readonly identifier: number;
    /** 贴图的别名 */
    readonly alias: string;
    /** 贴图所属的存储对象 */
    readonly store: ITextureStore;
}

export interface IAutotileConnection {
    /** 连接方式，最高位表示左上，低位依次顺时针旋转 */
    readonly connection: number;
    /** 中心自动元件对应的图块数字 */
    readonly center: number;
}

export interface IBigImageReturn {
    /** 大怪物贴图在 store 中的标识符 */
    readonly identifier: number;
    /** 存储大怪物贴图的存储对象 */
    readonly store: ITextureStore;
}

export interface IMaterialFramedData {
    /** 贴图对象 */
    texture: ITexture;
    /** 图块类型 */
    cls: BlockCls;
    /** 贴图总帧数 */
    frames: number;
    /** 每帧的横向偏移量 */
    offset: number;
    /** 默认帧数 */
    defaultFrame: number;
}

export interface IMaterialAsset
    extends IDirtyTracker<boolean>,
        IDirtyMarker<void> {
    /** 图集的贴图数据 */
    readonly data: ITextureComposedData;
}

export interface IAutotileProcessor {
    /** 该自动元件处理器使用的素材管理器 */
    readonly manager: IMaterialManager;

    /**
     * 设置一个自动元件的特殊连接方式，设置后当前自动元件将会单方面与目标元件连接，
     * 一个自动元件可以与多个自动元件有特殊连接
     * @param autotile 自动元件
     * @param target 当前自动元件将会连接至的自动元件
     */
    setConnection(autotile: number, target: number): void;

    /**
     * 获取自动元件的连接情况
     * @param array 地图图块数组
     * @param index 自动元件图块所在的索引
     * @param width 地图每一行的宽度
     */
    connect(
        array: Uint32Array,
        index: number,
        width: number
    ): IAutotileConnection;

    /**
     * 检查一个图块与指定方向的连接方式
     * @param connection 当前的连接
     * @param center 中心点的图块数字
     * @param target 连接点的图块数字
     * @param direction 连接点的方向
     * @returns 经过连接后的连接数字
     */
    updateConnectionFor(
        connection: number,
        center: number,
        target: number,
        direction: AutotileConnection
    ): number;

    /**
     * 根据图块数字，获取指定自动元件经过连接的可渲染对象
     * @param autotile 自动元件的图块数字
     * @param connection 连接方式，上方连接是第一位，顺时针旋转位次依次升高
     * @returns 连接方式的可渲染对象，可以通过偏移量依次获取其他帧
     */
    render(autotile: number, connection: number): ITextureRenderable | null;

    /**
     * 根据图块贴图对象，获取指定自动元件经过连接的可渲染对象
     * @param tile 自动元件的图块贴图数据
     * @param connection 连接方式，上方连接是第一位，顺时针旋转位次依次升高
     * @returns 连接方式的可渲染对象，可以通过偏移量依次获取其他帧
     */
    renderWith(
        tile: Readonly<IMaterialFramedData>,
        connection: number
    ): ITextureRenderable | null;

    /**
     * 根据图块贴图对象，获取指定自动元件经过连接的可渲染对象，但是会假设传入的图块就是自动元件，不做不必要的判断
     * @param tile 自动元件的图块贴图数据
     * @param connection 连接方式，上方连接是第一位，顺时针旋转位次依次升高
     * @returns 连接方式的可渲染对象，可以通过偏移量依次获取其他帧
     */
    renderWithoutCheck(
        tile: Readonly<IMaterialFramedData>,
        connection: number
    ): ITextureRenderable | null;

    /**
     * 根据图块数字，获取指定自动元件经过链接的动态可渲染对象
     * @param autotile 自动元件的图块数字
     * @param connection 自动元件的连接方式
     * @returns 生成器，每一个输出代表每一帧的渲染对象，不同自动元件的帧数可能不同
     */
    renderAnimated(
        autotile: number,
        connection: number
    ): Generator<ITextureRenderable, void>;

    /**
     * 根据图块贴图对象，获取指定自动元件经过链接的动态可渲染对象
     * @param autotile 自动元件的图块数字
     * @param connection 自动元件的连接方式
     * @returns 生成器，每一个输出代表每一帧的渲染对象，不同自动元件的帧数可能不同
     */
    renderAnimatedWith(
        tile: Readonly<IMaterialFramedData>,
        connection: number
    ): Generator<ITextureRenderable, void>;
}

export interface IMaterialGetter {
    /**
     * 根据图块数字获取图块，可以获取额外素材，会自动将未缓存的额外素材缓存
     * @param identifier 图块的图块数字
     */
    getTile(identifier: number): Readonly<IMaterialFramedData> | null;

    /**
     * 根据图块标识符获取图块类型
     * @param identifier 图块标识符，即图块数字
     */
    getBlockCls(identifier: number): BlockCls;

    /**
     * 判断一个图块是否包含 `bigImage` 贴图，即是否是大怪物
     * @param identifier 图块标识符，即图块数字
     */
    isBigImage(identifier: number): boolean;

    /**
     * 根据图块标识符获取一个图块的 `bigImage` 贴图
     * @param identifier 图块标识符，即图块数字
     */
    getBigImage(identifier: number): Readonly<IMaterialFramedData> | null;

    /**
     * 根据图块标识符，首先判断是否是 `bigImage` 贴图，如果是，则返回 `bigImage` 贴图，
     * 否则返回普通贴图。如果图块不存在，则返回 `null`
     * @param identifier 图块标识符，即图块数字
     */
    getIfBigImage(identifier: number): Readonly<IMaterialFramedData> | null;

    /**
     * 根据标识符获取图集信息
     * @param identifier 图集的标识符
     */
    getAsset(identifier: number): ITextureComposedData | null;

    /**
     * 根据额外素材索引获取额外素材
     * @param identifier 额外素材的索引
     */
    getTileset(identifier: number): ITexture | null;

    /**
     * 根据图片的索引获取图片
     * @param identifier 图片的索引
     */
    getImage(identifier: number): ITexture | null;
}

export interface IMaterialAliasGetter {
    /**
     * 根据图块 id 获取图块，可以获取额外素材，会自动将未缓存的额外素材缓存
     * @param alias 图块 id
     */
    getTileByAlias(alias: string): Readonly<IMaterialFramedData> | null;

    /**
     * 根据额外素材名称获取额外素材
     * @param alias 额外素材名称
     */
    getTilesetByAlias(alias: string): ITexture | null;

    /**
     * 根据图片名称获取图片
     * @param alias 图片名称
     */
    getImageByAlias(alias: string): ITexture | null;

    /**
     * 根据别名获取图集信息
     * @param alias 图集的别名
     */
    getAssetByAlias(alias: string): ITextureComposedData | null;

    /**
     * 根据图块别名获取图块类型
     * @param alias 图块别名，即图块的 id
     */
    getBlockClsByAlias(alias: string): BlockCls;

    /**
     * 根据图块别名获取一个图块的 `bigImage` 贴图
     * @param alias 图块别名，即图块的 id
     */
    getBigImageByAlias(alias: string): Readonly<IMaterialFramedData> | null;
}

export interface IMaterialManager
    extends IMaterialGetter,
        IMaterialAliasGetter {
    /** 贴图存储，把 terrains 等内容单独分开存储 */
    readonly tileStore: ITextureStore;
    /** tilesets 贴图存储，每个 tileset 是一个贴图对象 */
    readonly tilesetStore: ITextureStore;
    /** 存储注册的图像的存储对象 */
    readonly imageStore: ITextureStore;
    /** 图集存储，将常用贴图存入其中 */
    readonly assetStore: ITextureStore;
    /** bigImage 存储，存储大怪物数据 */
    readonly bigImageStore: ITextureStore;

    /** 图集信息存储 */
    readonly assetDataStore: Iterable<[number, ITextureComposedData]>;
    /** 带有脏标记追踪的图集信息 */
    readonly trackedAsset: ITrackedAssetData;

    /** 图块类型映射 */
    readonly clsMap: Map<number, BlockCls>;

    /**
     * 添加网格类型的贴图，包括 terrains 和 items 类型
     * @param source 图像源
     * @param map 贴图字符串 id 与图块数字映射，按照先从左到右，再从上到下的顺序映射
     */
    addGrid(
        source: SizedCanvasImageSource,
        map: ArrayLike<IBlockIdentifier>
    ): Iterable<IMaterialData>;

    /**
     * 添加行动画的贴图，包括 animates enemys npcs enemy48 npc48 类型
     * @param source 图像源
     * @param map 贴图字符串 id 与图块数字映射，按从上到下的顺序映射
     * @param frames 每一行的帧数
     * @param height 每一行的高度
     */
    addRowAnimate(
        source: SizedCanvasImageSource,
        map: ArrayLike<IBlockIdentifier>,
        frames: number,
        height: number
    ): Iterable<IMaterialData>;

    /**
     * 添加自动元件
     * @param source 图像源
     * @param identifier 自动元件的字符串 id 及图块数字
     * @returns 由于自动元件是懒加载的，因此不会返回任何东西
     */
    addAutotile(
        source: SizedCanvasImageSource,
        identifier: IBlockIdentifier
    ): void;

    /**
     * 添加一个 tileset 类型的素材
     * @param source 图像源
     * @param alias tileset 的标识符，包含其在 tilesets 列表中的索引和图片名称
     */
    addTileset(
        source: SizedCanvasImageSource,
        identifier: IIndexedIdentifier
    ): IMaterialData | null;

    /**
     * 添加一个图片
     * @param source 图像源
     * @param identifier 图片的标识符，包含其在 images 列表中的索引和图片名称
     */
    addImage(
        source: SizedCanvasImageSource,
        identifier: IIndexedIdentifier
    ): IMaterialData;

    /**
     * 设置指定图块默认显示第几帧
     * @param identifier 图块标识符，即图块数字
     * @param defaultFrame 图块的默认帧数
     */
    setDefaultFrame(identifier: number, defaultFrame: number): void;

    /**
     * 获取图块的默认帧数，-1 表示正常动画，非负整数表示默认使用指定帧数，除非单独指定
     * @param identifier 图块标识符，即图块数字
     */
    getDefaultFrame(identifier: number): number;

    /**
     * 缓存某个 tileset，当需要缓存多个时，请使用 {@link cacheTilesetList} 方法
     * @param identifier tileset 的标识符，即图块数字
     */
    cacheTileset(identifier: number): ITexture | null;

    /**
     * 缓存一系列 tileset
     * @param identifierList 标识符列表，即图块数字列表
     */
    cacheTilesetList(
        identifierList: Iterable<number>
    ): Iterable<ITexture | null>;

    /**
     * 缓存某个自动元件，当需要缓存多个时，请使用 {@link cacheAutotileList} 方法
     * @param identifier 自动元件标识符，即图块数字
     */
    cacheAutotile(identifier: number): ITexture | null;

    /**
     * 缓存一系列自动元件
     * @param identifierList 自动元件标识符列表，即图块数字列表
     */
    cacheAutotileList(
        identifierList: Iterable<number>
    ): Iterable<ITexture | null>;

    /**
     * 把常用素材打包成为图集形式供后续使用
     */
    buildAssets(): Iterable<IMaterialAssetData>;

    /**
     * 将指定贴图打包进图集
     * @param texture 贴图对象
     */
    buildToAsset(texture: ITexture): IMaterialAssetData;

    /**
     * 将一系列贴图打包进贴图对象
     * @param texture 贴图列表
     */
    buildListToAsset(texture: Iterable<ITexture>): Iterable<IMaterialAssetData>;

    /**
     * 根据图块标识符在图集中获取对应的可渲染对象
     * @param identifier 图块标识符，即图块数字
     */
    getRenderable(identifier: number): ITextureRenderable | null;

    /**
     * 根据图块别名在图集中获取对应的可渲染对象
     * @param alias 图块的别名，即图块的 id
     */
    getRenderableByAlias(alias: string): ITextureRenderable | null;

    /**
     * 根据图块别名获取图块标识符，即图块数字
     * @param alias 图块别名，即图块的 id
     */
    getIdentifierByAlias(alias: string): number | undefined;

    /**
     * 根据图块标识符获取图块别名，即图块的 id
     * @param identifier 图块标识符，即图块数字
     */
    getAliasByIdentifier(identifier: number): string | undefined;

    /**
     * 设置一个图块的 `bigImage` 贴图，即大怪物贴图，但不止怪物能用
     * @param identifier 图块标识符，即图块数字
     * @param image `bigImage` 对应的贴图对象
     * @param frames `bigImage` 的帧数，即贴图有多少帧
     */
    setBigImage(
        identifier: number,
        image: ITexture,
        frames: number
    ): IBigImageReturn;

    /**
     * 当前的所有图集中是否包含指定的贴图对象
     * @param texture 贴图对象
     */
    assetContainsTexture(texture: ITexture): boolean;

    /**
     * 获取指定贴图对象所属的图集索引
     * @param texture 贴图对象
     */
    getTextureAsset(texture: ITexture): number | undefined;
}

export interface IAssetBuilder {
    /**
     * 将图集打包器输出至指定贴图存储对象，只能输出到一个存储对象中，设置多个仅最后一个有效
     * @param store 贴图存储对象
     */
    pipe(store: ITextureStore): void;

    /**
     * 添加贴图对象至打包器
     * @param texture 贴图对象
     * @returns 当前打包的贴图对象对应的组合数据
     */
    addTexture(texture: ITexture): ITextureComposedData;

    /**
     * 添加一个贴图对象列表至打包器
     * @param texture 贴图对象列表
     * @returns 当前打包的贴图列表的组合数据，每一项代表一个图集，只包含使用到的图集，之前已经打包完成的将不会在列表内
     */
    addTextureList(texture: Iterable<ITexture>): Iterable<ITextureComposedData>;

    /**
     * 获取可追踪贴图对象
     */
    tracked(): ITrackedAssetData;

    /**
     * 结束此打包器
     */
    close(): void;
}

export interface ITrackedAssetData extends IDirtyTracker<Set<number>> {
    /** 图像源列表 */
    readonly sourceList: Map<number, ImageBitmap>;
    /**
     * 贴图引用跳接，`ImageBitmap` 的传递性能远好于其他类型，而贴图图集为了能够动态增加内容会使用画布类型，
     * 因此需要把贴图生成为额外的 `ImageBitmap`，并提供引用跳接映射。值代表在 `sourceList` 中的索引。
     */
    readonly skipRef: Map<SizedCanvasImageSource, number>;
    /** 贴图数据 */
    readonly materials: IMaterialGetter;

    /**
     * 取消使用此图集，释放相关资源
     */
    close(): void;

    /**
     * 等待所有打包操作结束
     */
    then(): Promise<void>;
}
