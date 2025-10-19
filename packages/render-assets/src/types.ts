export type SizedCanvasImageSource = Exclude<
    CanvasImageSource,
    VideoFrame | SVGElement
>;

export type CanvasStyle = string | CanvasGradient | CanvasPattern;

export interface IRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface ITextureSingleRenderable {
    /** 可渲染贴图对象的图像源 */
    readonly source: SizedCanvasImageSource;
    /** 贴图裁剪区域 */
    readonly rect: Readonly<IRect>;
}

export interface ITextureListedRenderable {
    /** 可渲染贴图对象的图像源 */
    readonly source: SizedCanvasImageSource;
    /** 贴图裁剪区域 */
    readonly rect: Readonly<IRect>[];
}

export interface ITextureComposedData<T = unknown, A = unknown> {
    /** 这个纹理图集的贴图对象 */
    readonly texture: ITexture<T, A>;
    /** 每个参与组合的贴图对应到图集对象的矩形范围 */
    readonly assetMap: Map<ITexture, Readonly<IRect>>;
}

export interface ITextureComposer<T, C, I> {
    /**
     * 将一系列纹理组合成为一系列纹理图集
     * @param input 输入纹理
     * @param data 输入给组合器的参数
     */
    compose(
        input: Iterable<ITexture>,
        data: T
    ): Generator<ITextureComposedData<C, I>, void>;
}

export interface ITextureSplitter<T> {
    /**
     * 对一个贴图对象执行拆分操作
     * @param texture 要拆分的贴图
     * @param data 传给拆分器的参数
     */
    split(texture: ITexture, data: T): Generator<ITexture, void>;
}

export interface ITextureAnimater<T, I> {
    /** 此动画控制器所控制的贴图 */
    readonly texture: ITexture<T, I> | null;

    /**
     * 对一个贴图对象创建动画控制器
     * @param texture 要绑定的贴图对象
     * @param data 传递给动画控制器的参数
     */
    create(texture: ITexture, data: T): void;

    /**
     * 开始动画序列
     * @param init 动画初始化参数
     */
    open(init: I): Generator<ITextureListedRenderable, void> | null;

    /**
     * 开始循环动画序列
     * @param init 动画初始化参数
     */
    cycled(init: I): Generator<ITextureListedRenderable, void> | null;
}

export interface ITexture<T = unknown, A = unknown> {
    /** 贴图的图像源 */
    readonly source: SizedCanvasImageSource;
    /** 此贴图使用的动画控制器 */
    readonly animater: ITextureAnimater<T, A> | null;
    /** 贴图宽度 */
    readonly width: number;
    /** 贴图高度 */
    readonly height: number;

    /**
     * 将此贴图转换为 bitmap 图像，图像源也会转变成 ImageBitmap
     */
    toBitmap(): Promise<void>;

    /**
     * 使用指定贴图切分器切分贴图
     * @param splitter 贴图切分器
     * @param data 传递给切分器的参数
     * @returns 切分出的贴图所组成的可迭代对象
     */
    split<T>(splitter: ITextureSplitter<T>, data: T): Generator<ITexture>;

    /**
     * 将此贴图标记为可动画贴图，使用传入的动画控制器描述动画。每个贴图只能绑定一个动画控制器，反之同理
     * @param animater 动画控制器
     * @param data 传递给动画控制器的参数
     */
    animated(animater: ITextureAnimater<T, A>, data: T): void;

    /**
     * 获取整张图的可渲染对象
     */
    static(): ITextureSingleRenderable;

    /**
     * 获取一系列动画可渲染对象，不循环，按帧数依次排列
     * @param data 传递给动画控制器的初始化参数
     */
    dynamic(data: A): Generator<ITextureListedRenderable, void> | null;

    /**
     * 获取无限循环的动画可渲染对象
     * @param data 传递给动画控制器的初始化参数
     */
    cycled(data: A): Generator<ITextureListedRenderable, void> | null;

    /**
     * 释放此贴图的资源，将不能再被使用
     */
    dispose(): void;
}

export interface ITextureStore {
    [Symbol.iterator](): Iterator<[key: number, tex: ITexture]>;

    /**
     * 获取纹理对象键值对的可迭代对象
     */
    entries(): Iterable<[key: number, tex: ITexture]>;

    /**
     * 获取纹理对象的键的可迭代对象
     */
    keys(): Iterable<number>;

    /**
     * 获取纹理对象的值的可迭代对象
     */
    values(): Iterable<ITexture>;

    /**
     * 通过图像源创建贴图对象
     * @param source 贴图使用的图像源
     */
    createTexture(source: SizedCanvasImageSource): ITexture;

    /**
     * 添加一个贴图
     * @param identifier 贴图 id
     * @param texture 贴图对象
     */
    addTexture(identifier: number, texture: ITexture): void;

    /**
     * 移除一个贴图
     * @param identifier 要移除的贴图对象 id 或 别名 或 贴图对象
     */
    removeTexture(identifier: number | string | ITexture): void;

    /**
     * 根据贴图对象 id 获取贴图
     * @param identifier 贴图对象 id
     */
    getTexture(identifier: number): ITexture | null;

    /**
     * 给贴图对象命名一个别名
     * @param identifier 贴图对象 id
     * @param alias 要命名的别名
     */
    alias(identifier: number, alias: string): void;

    /**
     * 根据贴图对象别名获取贴图
     * @param alias 贴图对象别名
     */
    fromAlias(alias: string): ITexture | null;

    /**
     * 根据贴图对象获取此贴图对象在此控制器中的 id，如果贴图不在此控制器，返回 `undefined`
     * @param texture 贴图对象
     */
    idOf(texture: ITexture): number | undefined;

    /**
     * 根据贴图对象获取此贴图对象在此控制器中的别名，如果不存在此 id，返回 `undefined`
     * @param identifier 贴图 id
     */
    aliasOf(identifier: number): string | undefined;
}
