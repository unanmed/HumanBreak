import {
    ITexture,
    ITextureComposedData,
    ITextureRenderable,
    ITextureSplitter,
    ITextureStore,
    SizedCanvasImageSource,
    Texture,
    TextureGridSplitter,
    TextureRowSplitter,
    TextureStore
} from '@motajs/render-assets';
import {
    IBlockIdentifier,
    IMaterialData,
    IMaterialManager,
    IIndexedIdentifier,
    IMaterialAssetData,
    BlockCls,
    IBigImageReturn,
    IAssetBuilder,
    IMaterialFramedData,
    ITrackedAssetData
} from './types';
import { logger } from '@motajs/common';
import { getClsByString, getTextureFrame } from './utils';
import { isNil } from 'lodash-es';
import { AssetBuilder } from './builder';
import { AutotileProcessor } from './autotile';

interface TilesetCache {
    /** 是否已经在贴图库中存在 */
    readonly existed: boolean;
    /** 贴图对象 */
    readonly texture: ITexture;
}

export class MaterialManager implements IMaterialManager {
    readonly tileStore: ITextureStore = new TextureStore();
    readonly tilesetStore: ITextureStore = new TextureStore();
    readonly imageStore: ITextureStore = new TextureStore();
    readonly assetStore: ITextureStore = new TextureStore();
    readonly bigImageStore: ITextureStore = new TextureStore();

    /** 自动元件图像源映射 */
    readonly autotileSource: Map<number, SizedCanvasImageSource> = new Map();

    /** 图集信息存储 */
    readonly assetDataStore: Map<number, ITextureComposedData> = new Map();
    /** 贴图到图集索引的映射 */
    readonly assetMap: Map<ITexture, number> = new Map();
    /** 带有脏标记追踪的图集对象 */
    readonly trackedAsset: ITrackedAssetData;

    /** 大怪物数据 */
    readonly bigImageData: Map<number, IMaterialFramedData> = new Map();
    /** tileset 中 `Math.floor(id / 10000) + 1` 映射到 tileset 对应索引的映射，用于处理图块超出 10000 的 tileset */
    readonly tilesetOffsetMap: Map<number, number> = new Map();
    /** 图集打包器 */
    readonly assetBuilder: IAssetBuilder;

    /** 图块 id 到图块数字的映射 */
    readonly idNumMap: Map<string, number> = new Map();
    /** 图块数字到图块 id 的映射 */
    readonly numIdMap: Map<number, string> = new Map();
    /** 图块数字到图块类型的映射 */
    readonly clsMap: Map<number, BlockCls> = new Map();

    /** 网格切分器 */
    readonly gridSplitter: TextureGridSplitter = new TextureGridSplitter();
    /** 行切分器 */
    readonly rowSplitter: TextureRowSplitter = new TextureRowSplitter();

    /** 大怪物贴图的标识符 */
    private bigImageId: number = 0;
    /** 当前 tileset 索引 */
    private nowTilesetIndex: number = -1;
    /** 当前 tileset 偏移 */
    private nowTilesetOffset: number = 0;
    /** 是否已经构建过素材 */
    private built: boolean = false;

    constructor() {
        this.assetBuilder = new AssetBuilder(this);
        this.assetBuilder.pipe(this.assetStore);
        this.trackedAsset = this.assetBuilder.tracked();
    }

    /**
     * 添加由分割器和图块映射组成的图像源贴图
     * @param source 图像源
     * @param map 图块 id 与图块数字映射
     * @param store 要添加至的贴图存储对象
     * @param splitter 使用的分割器
     * @param splitterData 传递给分割器的数据
     * @param processTexture 对每个纹理进行处理
     */
    private addMappedSource<T>(
        source: SizedCanvasImageSource,
        map: ArrayLike<IBlockIdentifier>,
        store: ITextureStore,
        splitter: ITextureSplitter<T>,
        splitterData: T,
        processTexture?: (tex: ITexture) => void
    ): Iterable<IMaterialData> {
        const tex = new Texture(source);
        const textures = [...splitter.split(tex, splitterData)];
        if (textures.length !== map.length) {
            logger.warn(75, textures.length.toString(), map.length.toString());
        }
        const res: IMaterialData[] = textures.map((v, i) => {
            const { id, num, cls } = map[i];
            store.addTexture(num, v);
            store.alias(num, id);
            this.clsMap.set(num, getClsByString(cls));
            processTexture?.(v);
            const data: IMaterialData = {
                store,
                texture: v,
                identifier: num,
                alias: id
            };
            return data;
        });
        return res;
    }

    addGrid(
        source: SizedCanvasImageSource,
        map: ArrayLike<IBlockIdentifier>
    ): Iterable<IMaterialData> {
        return this.addMappedSource(
            source,
            map,
            this.tileStore,
            this.gridSplitter,
            [32, 32]
        );
    }

    addRowAnimate(
        source: SizedCanvasImageSource,
        map: ArrayLike<IBlockIdentifier>,
        height: number
    ): Iterable<IMaterialData> {
        return this.addMappedSource(
            source,
            map,
            this.tileStore,
            this.rowSplitter,
            height
        );
    }

    addAutotile(
        source: SizedCanvasImageSource,
        identifier: IBlockIdentifier
    ): void {
        this.autotileSource.set(identifier.num, source);
        this.tileStore.alias(identifier.num, identifier.id);
        this.clsMap.set(identifier.num, BlockCls.Autotile);
    }

    addTileset(
        source: SizedCanvasImageSource,
        identifier: IIndexedIdentifier
    ): IMaterialData | null {
        const tex = new Texture(source);
        this.tilesetStore.addTexture(identifier.index, tex);
        this.tilesetStore.alias(identifier.index, identifier.alias);
        const width = Math.floor(source.width / 32);
        const height = Math.floor(source.height / 32);
        const count = width * height;
        const offset = Math.ceil(count / 10000);
        if (identifier.index === 0) {
            this.tilesetOffsetMap.set(0, 0);
            this.nowTilesetIndex = 0;
            this.nowTilesetOffset = offset;
        } else {
            if (identifier.index - 1 !== this.nowTilesetIndex) {
                logger.warn(78);
                return null;
            }
            // 一个 tileset 可能不止 10000 个图块，需要计算偏移
            const width = Math.floor(source.width / 32);
            const height = Math.floor(source.height / 32);
            const count = width * height;
            const offset = Math.ceil(count / 10000);
            const end = this.nowTilesetOffset + offset;
            for (let i = this.nowTilesetOffset; i < end; i++) {
                this.tilesetOffsetMap.set(i, identifier.index);
            }
            this.nowTilesetOffset = end;
            this.nowTilesetIndex = identifier.index;
        }
        const data: IMaterialData = {
            store: this.tilesetStore,
            texture: tex,
            identifier: identifier.index,
            alias: identifier.alias
        };
        return data;
    }

    addImage(
        source: SizedCanvasImageSource,
        identifier: IIndexedIdentifier
    ): IMaterialData {
        const texture = new Texture(source);
        this.imageStore.addTexture(identifier.index, texture);
        this.imageStore.alias(identifier.index, identifier.alias);
        const data: IMaterialData = {
            store: this.imageStore,
            texture,
            identifier: identifier.index,
            alias: identifier.alias
        };
        return data;
    }

    getTile(identifier: number): IMaterialFramedData | null {
        if (identifier < 10000) {
            const cls = this.clsMap.get(identifier) ?? BlockCls.Unknown;
            if (
                cls === BlockCls.Autotile &&
                this.autotileSource.has(identifier)
            ) {
                this.cacheAutotile(identifier);
            }
            const texture = this.tileStore.getTexture(identifier);
            if (!texture) return null;
            return {
                texture,
                cls,
                offset: 32,
                frames: getTextureFrame(cls, texture)
            };
        } else {
            const texture = this.cacheTileset(identifier);
            if (!texture) return null;
            return {
                texture,
                cls: BlockCls.Tileset,
                offset: 32,
                frames: 1
            };
        }
    }

    getTileset(identifier: number): ITexture | null {
        return this.tilesetStore.getTexture(identifier);
    }

    getImage(identifier: number): ITexture | null {
        return this.imageStore.getTexture(identifier);
    }

    getTileByAlias(alias: string): IMaterialFramedData | null {
        if (/X\d{5,}/.test(alias)) {
            return this.getTile(parseInt(alias.slice(1)));
        } else {
            const identifier = this.tileStore.identifierOf(alias);
            if (isNil(identifier)) return null;
            return this.getTile(identifier);
        }
    }

    getTilesetByAlias(alias: string): ITexture | null {
        return this.tilesetStore.fromAlias(alias);
    }

    getImageByAlias(alias: string): ITexture | null {
        return this.imageStore.fromAlias(alias);
    }

    private getTilesetOwnTexture(identifier: number): TilesetCache | null {
        const texture = this.tileStore.getTexture(identifier);
        if (texture) return { existed: true, texture };
        // 如果 tileset 不存在，那么执行缓存操作
        const offset = Math.floor(identifier / 10000);
        const index = this.tilesetOffsetMap.get(offset - 1);
        if (isNil(index)) return null;
        // 获取对应的 tileset 贴图
        const tileset = this.tilesetStore.getTexture(index);
        if (!tileset) return null;
        // 计算图块位置
        const rest = identifier - offset * 10000;
        const { width, height } = tileset;
        const tileWidth = Math.floor(width / 32);
        const tileHeight = Math.floor(height / 32);
        // 如果图块位置超出了贴图范围
        if (rest > tileWidth * tileHeight) return null;
        // 裁剪 tileset，生成贴图
        const x = rest % tileWidth;
        const y = Math.floor(rest / tileWidth);
        const newTexture = new Texture(tileset.source);
        newTexture.clip(x * 32, y * 32, 32, 32);
        return { existed: false, texture: newTexture };
    }

    /**
     * 检查图集状态，如果已存在图集则标记为脏，否则新增图集
     * @param data 图集数据
     */
    private checkAssetDirty(data: ITextureComposedData) {
        if (!this.built) return;
        const asset = this.assetDataStore.get(data.index);
        if (!asset) {
            // 如果有新图集，需要添加
            const alias = `asset-${data.index}`;
            this.assetStore.alias(data.index, alias);
            this.assetDataStore.set(data.index, data);
        }
    }

    /**
     * 将指定的贴图列表转换至指定的图集数据中
     * @param composedData 组合数据
     * @param textures 贴图列表
     */
    private cacheToAsset(
        composedData: ITextureComposedData[],
        textures: ITexture[]
    ) {
        textures.forEach(tex => {
            const assetData = composedData.find(v => v.assetMap.has(tex));
            if (!assetData) {
                logger.error(38);
                return;
            }
            tex.toAsset(assetData);
        });
        composedData.forEach(v => this.checkAssetDirty(v));
    }

    cacheTileset(identifier: number): ITexture | null {
        const newTexture = this.getTilesetOwnTexture(identifier);
        if (!newTexture) return null;
        const { existed, texture } = newTexture;
        if (existed) return texture;
        // 缓存贴图
        this.tileStore.addTexture(identifier, texture);
        this.idNumMap.set(`X${identifier}`, identifier);
        this.numIdMap.set(identifier, `X${identifier}`);
        const data = this.assetBuilder.addTexture(texture);
        texture.toAsset(data);
        this.checkAssetDirty(data);
        return texture;
    }

    cacheTilesetList(
        identifierList: Iterable<number>
    ): Iterable<ITexture | null> {
        const arr = [...identifierList];
        const toAdd: ITexture[] = [];

        arr.forEach(v => {
            const newTexture = this.getTilesetOwnTexture(v);
            if (!newTexture) return;
            const { existed, texture } = newTexture;
            if (existed) return;
            toAdd.push(texture);
            this.tileStore.addTexture(v, texture);
            this.idNumMap.set(`X${v}`, v);
            this.numIdMap.set(v, `X${v}`);
        });

        const data = this.assetBuilder.addTextureList(toAdd);
        const res = [...data];
        this.cacheToAsset(res, toAdd);

        return toAdd;
    }

    /**
     * 获取自动元件展开后的图片，如果图片不存在，或是已经展开并存储至了 `tileStore`，那么返回 `null`
     * @param identifier 自动元件标识符
     */
    private getFlattenedAutotile(
        identifier: number
    ): SizedCanvasImageSource | null {
        const cls = this.clsMap.get(identifier);
        if (cls !== BlockCls.Autotile) return null;
        if (this.tileStore.getTexture(identifier)) return null;
        const source = this.autotileSource.get(identifier);
        if (!source) return null;
        const frames = source.width === 96 ? 1 : 4;
        const flattened = AutotileProcessor.flatten({ source, frames });
        if (!flattened) return null;
        return flattened;
    }

    cacheAutotile(identifier: number): ITexture | null {
        const flattened = this.getFlattenedAutotile(identifier);
        if (!flattened) return null;
        const tex = new Texture(flattened);
        this.tileStore.addTexture(identifier, tex);
        const data = this.assetBuilder.addTexture(tex);
        tex.toAsset(data);
        this.autotileSource.delete(identifier);
        this.checkAssetDirty(data);
        return tex;
    }

    cacheAutotileList(
        identifierList: Iterable<number>
    ): Iterable<ITexture | null> {
        const arr = [...identifierList];
        const toAdd: ITexture[] = [];

        arr.forEach(v => {
            const flattened = this.getFlattenedAutotile(v);
            if (!flattened) return;
            const tex = new Texture(flattened);
            this.tileStore.addTexture(v, tex);
            toAdd.push(tex);
            this.autotileSource.delete(v);
        });

        const data = this.assetBuilder.addTextureList(toAdd);
        const res = [...data];
        this.cacheToAsset(res, toAdd);

        return toAdd;
    }

    buildAssets(): Iterable<IMaterialAssetData> {
        if (this.built) {
            logger.warn(79);
            return [];
        }
        this.built = true;
        return this.buildListToAsset(this.tileStore.values());
    }

    buildToAsset(texture: ITexture): IMaterialAssetData {
        const data = this.assetBuilder.addTexture(texture);
        const assetData: IMaterialAssetData = {
            data: data,
            identifier: data.index,
            alias: `asset-${data.index}`,
            store: this.assetStore
        };
        this.checkAssetDirty(data);
        return assetData;
    }

    buildListToAsset(
        texture: Iterable<ITexture>
    ): Iterable<IMaterialAssetData> {
        const data = this.assetBuilder.addTextureList(texture);
        const arr = [...data];
        const res: IMaterialAssetData[] = [];
        arr.forEach(v => {
            const alias = `asset-${v.index}`;
            if (!this.assetDataStore.has(v.index)) {
                this.assetDataStore.set(v.index, v);
            }
            const data: IMaterialAssetData = {
                data: v,
                identifier: v.index,
                alias,
                store: this.assetStore
            };
            for (const tex of v.assetMap.keys()) {
                tex.toAsset(v);
            }
            res.push(data);
        });
        arr.forEach(v => {
            this.checkAssetDirty(v);
        });
        return res;
    }

    getAsset(identifier: number): ITextureComposedData | null {
        return this.assetDataStore.get(identifier) ?? null;
    }

    getAssetByAlias(alias: string): ITextureComposedData | null {
        const id = this.assetStore.identifierOf(alias);
        if (isNil(id)) return null;
        return this.assetDataStore.get(id) ?? null;
    }

    private getTextureOf(identifier: number, cls: BlockCls): ITexture | null {
        if (cls === BlockCls.Unknown) return null;
        if (cls !== BlockCls.Tileset) {
            return this.tileStore.getTexture(identifier);
        }
        if (identifier < 10000) return null;
        return this.cacheTileset(identifier);
    }

    getRenderable(identifier: number): ITextureRenderable | null {
        const cls = this.clsMap.get(identifier);
        if (isNil(cls)) return null;
        const texture = this.getTextureOf(identifier, cls);
        if (!texture) return null;
        return texture.render();
    }

    getRenderableByAlias(alias: string): ITextureRenderable | null {
        const identifier = this.idNumMap.get(alias);
        if (isNil(identifier)) return null;
        return this.getRenderable(identifier);
    }

    getBlockCls(identifier: number): BlockCls {
        return this.clsMap.get(identifier) ?? BlockCls.Unknown;
    }

    getBlockClsByAlias(alias: string): BlockCls {
        const id = this.idNumMap.get(alias);
        if (isNil(id)) return BlockCls.Unknown;
        return this.clsMap.get(id) ?? BlockCls.Unknown;
    }

    getIdentifierByAlias(alias: string): number | undefined {
        return this.idNumMap.get(alias);
    }

    getAliasByIdentifier(identifier: number): string | undefined {
        return this.numIdMap.get(identifier);
    }

    setBigImage(
        identifier: number,
        image: ITexture,
        frames: number
    ): IBigImageReturn {
        const bigImageId = this.bigImageId++;
        this.bigImageStore.addTexture(bigImageId, image);
        const cls = this.clsMap.get(identifier) ?? BlockCls.Unknown;
        const store: IMaterialFramedData = {
            texture: image,
            cls,
            offset: image.width / 4,
            frames
        };
        this.bigImageData.set(identifier, store);
        const data: IBigImageReturn = {
            identifier: bigImageId,
            store: this.bigImageStore
        };
        return data;
    }

    isBigImage(identifier: number): boolean {
        return this.bigImageData.has(identifier);
    }

    getBigImage(identifier: number): IMaterialFramedData | null {
        return this.bigImageData.get(identifier) ?? null;
    }

    getBigImageByAlias(alias: string): IMaterialFramedData | null {
        const identifier = this.idNumMap.get(alias);
        if (isNil(identifier)) return null;
        return this.bigImageData.get(identifier) ?? null;
    }

    getIfBigImage(identifier: number): IMaterialFramedData | null {
        const bigImage = this.bigImageData.get(identifier);
        if (bigImage) return bigImage;
        else return this.getTile(identifier);
    }

    assetContainsTexture(texture: ITexture): boolean {
        return this.assetMap.has(texture);
    }

    getTextureAsset(texture: ITexture): number | undefined {
        return this.assetMap.get(texture);
    }
}
