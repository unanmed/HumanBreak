import {
    IRect,
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

export interface IAutotileRenderable {
    /** 自动元件的图像源 */
    readonly source: SizedCanvasImageSource;
    /** 左上渲染的矩形范围 */
    readonly lt: Readonly<IRect>;
    /** 右上渲染的矩形范围 */
    readonly rt: Readonly<IRect>;
    /** 右下渲染的矩形范围 */
    readonly rb: Readonly<IRect>;
    /** 左下渲染的矩形范围 */
    readonly lb: Readonly<IRect>;
}

export interface IBigImageData {
    /** 大怪物贴图在 store 中的标识符 */
    readonly identifier: number;
    /** 存储大怪物贴图的存储对象 */
    readonly store: ITextureStore;
}

export interface IAutotileProcessor {
    /** 该自动元件处理器使用的素材管理器 */
    readonly manager: IMaterialManager;

    /**
     * 设置一个自动元件的父元件，一个自动元件可以有多个父元件
     * @param autotile 自动元件
     * @param parent 自动元件的父元件
     */
    setParent(autotile: number, parent: number): void;

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
     * 获取指定自动元件经过连接的可渲染对象
     * @param autotile 自动元件的图块数字
     * @param connection 连接方式，上方连接是第一位，顺时针旋转位次依次升高
     * @returns 生成器，每一个输出代表每一帧的渲染对象，不同自动元件的帧数可能不同
     */
    render(
        autotile: number,
        connection: number
    ): Generator<IAutotileRenderable, void> | null;

    /**
     * 通过静态可渲染对象（由 {@link ITexture.static} 输出的可渲染对象）输出自动元件经过连接的可渲染对象生成器
     * @param renderable 自动元件的原始可渲染对象
     * @param connection 自动元件的连接方式
     * @returns 生成器，每一个输出代表每一帧的渲染对象，不同自动元件的帧数可能不同
     */
    fromStaticRenderable(
        renderable: ITextureRenderable,
        connection: number
    ): Generator<IAutotileRenderable, void> | null;

    /**
     * 通过动画可渲染对象（由 {@link ITexture.dynamic} 或 {@link ITexture.cycled} 输出的单个可渲染对象）
     * 输出自动元件经过连接的可渲染对象
     * @param renderable 自动元件的原始可渲染对象
     * @param connection 自动元件的连接方式
     * @returns 这一帧的可渲染对象
     */
    fromAnimatedRenderable(
        renderable: ITextureRenderable,
        connection: number
    ): IAutotileRenderable | null;

    /**
     * 通过动画生成器（由 {@link ITexture.dynamic} 或 {@link ITexture.cycled} 输出的生成器）
     * 输出自动元件经过连接的可渲染对象生成器
     * @param texture 生成动画的纹理对象
     * @param generator 自动元件的动画生成器
     * @param connection 自动元件的连接方式
     * @returns 生成器，每一个输出代表每一帧的渲染对象
     */
    fromAnimatedGenerator(
        texture: ITexture,
        generator: Generator<ITextureRenderable> | null,
        connection: number
    ): Generator<IAutotileRenderable, void> | null;
}

export interface IMaterialManager {
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
     */
    addAutotile(
        source: SizedCanvasImageSource,
        identifier: IBlockIdentifier
    ): IMaterialData;

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
     * 根据图块数字获取图块，可以获取额外素材，会自动将未缓存的额外素材缓存
     * @param identifier 图块的图块数字
     */
    getTile(identifier: number): ITexture | null;

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

    /**
     * 根据图块 id 获取图块，可以获取额外素材，会自动将未缓存的额外素材缓存
     * @param alias 图块 id
     */
    getTileByAlias(alias: string): ITexture | null;

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
     * 缓存某个 tileset
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
     * 把常用素材打包成为图集形式供后续使用
     */
    buildAssets(): Iterable<IMaterialAssetData>;

    /**
     * 根据标识符获取图集信息
     * @param identifier 图集的标识符
     */
    getAsset(identifier: number): ITextureComposedData | null;

    /**
     * 根据别名获取图集信息
     * @param alias 图集的别名
     */
    getAssetByAlias(alias: string): ITextureComposedData | null;

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
     * 根据图块标识符获取图块类型
     * @param identifier 图块标识符，即图块数字
     */
    getBlockCls(identifier: number): BlockCls;

    /**
     * 根据图块别名获取图块类型
     * @param alias 图块别名，即图块的 id
     */
    getBlockClsByAlias(alias: string): BlockCls;

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
     */
    setBigImage(identifier: number, image: ITexture): IBigImageData;

    /**
     * 判断一个图块是否包含 `bigImage` 贴图，即是否是大怪物
     * @param identifier 图块标识符，即图块数字
     */
    isBigImage(identifier: number): boolean;

    /**
     * 根据图块标识符获取一个图块的 `bigImage` 贴图
     * @param identifier 图块标识符，即图块数字
     */
    getBigImage(identifier: number): ITexture | null;

    /**
     * 根据图块别名获取一个图块的 `bigImage` 贴图
     * @param alias 图块别名，即图块的 id
     */
    getBigImageByAlias(alias: string): ITexture | null;
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
     * 结束此打包器
     */
    close(): void;
}
