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

export interface ITextureRenderable {
    /** 可渲染贴图对象的图像源 */
    readonly source: SizedCanvasImageSource;
    /** 贴图裁剪区域 */
    readonly rect: Readonly<IRect>;
}

export interface ITextureComposedData {
    /** 这个纹理图集的贴图对象 */
    readonly texture: ITexture;
    /** 这个纹理图集的索引 */
    readonly index: number;
    /** 每个参与组合的贴图对应到图集对象的矩形范围 */
    readonly assetMap: Map<ITexture, Readonly<IRect>>;
}

export interface ITextureComposer<T> {
    /**
     * 将一系列纹理组合成为一系列纹理图集
     * @param input 输入纹理
     * @param data 输入给组合器的参数
     */
    compose(
        input: Iterable<ITexture>,
        data: T
    ): Generator<ITextureComposedData, void>;
}

export interface ITextureStreamComposer<T> {
    /**
     * 将一系列纹理添加到当前流式组合器中，并将这部分纹理的组合结果输出
     * @param textures 输入纹理
     * @param data 输入给组合器的参数
     */
    add(
        textures: Iterable<ITexture>,
        data: T
    ): Generator<ITextureComposedData, void>;

    /**
     * 结束此组合器的使用，释放相关资源
     */
    close(): void;
}

export interface ITextureSplitter<T> {
    /**
     * 对一个贴图对象执行拆分操作
     * @param texture 要拆分的贴图
     * @param data 传给拆分器的参数
     */
    split(texture: ITexture, data: T): Generator<ITexture, void>;
}

export interface ITextureAnimater<T> {
    /**
     * 开始动画序列
     * @param texture 贴图对象
     * @param data 动画初始化参数
     */
    once(texture: ITexture, data: T): Generator<ITextureRenderable, void>;

    /**
     * 开始循环动画序列
     * @param texture 贴图对象
     * @param data 动画初始化参数
     */
    cycled(texture: ITexture, data: T): Generator<ITextureRenderable, void>;
}

export interface ITexture {
    /** 贴图的图像源 */
    readonly source: SizedCanvasImageSource;
    /** 贴图宽度 */
    readonly width: number;
    /** 贴图高度 */
    readonly height: number;
    /** 当前贴图是否是完整 bitmap 图像 */
    readonly isBitmap: boolean;

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
     * 获取整张图的可渲染对象
     */
    render(): ITextureRenderable;

    /**
     * 限制矩形范围至当前贴图对象范围
     * @param rect 矩形范围
     */
    clampRect(rect: Readonly<IRect>): Readonly<IRect>;

    /**
     * 获取贴图经过指定矩形裁剪后的可渲染对象，并不是简单地对图像源裁剪，还会处理其他情况
     * @param rect 裁剪矩形
     */
    clipped(rect: Readonly<IRect>): ITextureRenderable;

    /**
     * 释放此贴图的资源，将不能再被使用
     */
    dispose(): void;

    /**
     * 将贴图的图像源转换为指定图集的图像源，并将范围限定至图集中对应到此贴图的矩形范围。
     * @param asset 图集信息
     * @returns 是否转换成功，如果图集信息中不包含当前贴图，那么返回 `false`
     */
    toAsset(asset: ITextureComposedData): boolean;
}

export const enum TextureOffsetDirection {
    LeftToRight,
    RightToLeft,
    TopToBottom,
    BottomToTop
}

export interface ITextureStore<T extends ITexture = ITexture> {
    [Symbol.iterator](): Iterator<[key: number, tex: T]>;

    /**
     * 获取纹理对象键值对的可迭代对象
     */
    entries(): Iterable<[key: number, tex: T]>;

    /**
     * 获取纹理对象的键的可迭代对象
     */
    keys(): Iterable<number>;

    /**
     * 获取纹理对象的值的可迭代对象
     */
    values(): Iterable<T>;

    /**
     * 添加一个贴图
     * @param identifier 贴图 id
     * @param texture 贴图对象
     */
    addTexture(identifier: number, texture: T): void;

    /**
     * 移除一个贴图
     * @param identifier 要移除的贴图对象 id 或 别名 或 贴图对象
     */
    removeTexture(identifier: number | string | T): void;

    /**
     * 判断当前贴图存储对象是否包含指定贴图 id
     * @param identifier 贴图对象 id
     */
    hasTexture(identifier: number): boolean;

    /**
     * 根据贴图对象 id 获取贴图
     * @param identifier 贴图对象 id
     */
    getTexture(identifier: number): T | null;

    /**
     * 给贴图对象命名一个别名，如果贴图对象不存在也可以设置
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
     * 根据贴图对象别名获取贴图对象 id
     * @param alias 贴图对象别名
     */
    identifierOf(alias: string): number | undefined;

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
