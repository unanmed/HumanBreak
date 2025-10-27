import {
    ITexture,
    ITextureComposedData,
    ITextureRenderable,
    ITextureSplitter,
    ITextureStore,
    SizedCanvasImageSource,
    Texture,
    TextureColumnAnimater,
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
    IBigImageData,
    IAssetBuilder
} from './types';
import { logger } from '@motajs/common';
import { getClsByString } from './utils';
import { isNil } from 'lodash-es';
import { AssetBuilder } from './builder';

export class MaterialManager implements IMaterialManager {
    readonly tileStore: ITextureStore = new TextureStore();
    readonly tilesetStore: ITextureStore = new TextureStore();
    readonly imageStore: ITextureStore = new TextureStore();
    readonly assetStore: ITextureStore = new TextureStore();
    readonly bigImageStore: ITextureStore = new TextureStore();

    /** 图集信息存储 */
    readonly assetDataStore: Map<number, ITextureComposedData> = new Map();
    /** 大怪物数据 */
    readonly bigImageData: Map<number, ITexture> = new Map();
    /** tileset 中 `Math.floor(id / 10000) + 1` 映射到 tileset 对应索引的映射，用于处理图块超出 10000 的 tileset */
    readonly tilesetOffsetMap: Map<number, number> = new Map();
    /** 图集打包器 */
    readonly assetBuilder: IAssetBuilder = new AssetBuilder();

    readonly idNumMap: Map<string, number> = new Map();
    readonly numIdMap: Map<number, string> = new Map();
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
        this.assetBuilder.pipe(this.assetStore);
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
        frames: number,
        height: number
    ): Iterable<IMaterialData> {
        return this.addMappedSource(
            source,
            map,
            this.tileStore,
            this.rowSplitter,
            height,
            (tex: ITexture<number>) => {
                tex.animated(new TextureColumnAnimater(), frames);
            }
        );
    }

    addAutotile(
        source: SizedCanvasImageSource,
        identifier: IBlockIdentifier
    ): IMaterialData {
        const texture = new Texture(source);
        this.tileStore.addTexture(identifier.num, texture);
        this.tileStore.alias(identifier.num, identifier.id);
        this.clsMap.set(identifier.num, BlockCls.Autotile);
        const data: IMaterialData = {
            store: this.tileStore,
            texture,
            identifier: identifier.num,
            alias: identifier.id
        };
        return data;
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

    getTile(identifier: number): ITexture | null {
        if (identifier < 10000) {
            return this.tileStore.getTexture(identifier);
        } else {
            return this.cacheTileset(identifier);
        }
    }

    getTileset(identifier: number): ITexture | null {
        return this.tilesetStore.getTexture(identifier);
    }

    getImage(identifier: number): ITexture | null {
        return this.imageStore.getTexture(identifier);
    }

    getTileByAlias(alias: string): ITexture | null {
        if (/X\d{5,}/.test(alias)) {
            return this.cacheTileset(parseInt(alias.slice(1)));
        } else {
            return this.tileStore.fromAlias(alias);
        }
    }

    getTilesetByAlias(alias: string): ITexture | null {
        return this.tilesetStore.fromAlias(alias);
    }

    getImageByAlias(alias: string): ITexture | null {
        return this.imageStore.fromAlias(alias);
    }

    private getTilesetOwnTexture(identifier: number) {
        const texture = this.tileStore.getTexture(identifier);
        if (texture) return texture;
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
        return newTexture;
    }

    cacheTileset(identifier: number): ITexture | null {
        const newTexture = this.getTilesetOwnTexture(identifier);
        if (!newTexture) return null;
        // 缓存贴图
        this.tileStore.addTexture(identifier, newTexture);
        this.idNumMap.set(`X${identifier}`, identifier);
        this.numIdMap.set(identifier, `X${identifier}`);
        const data = this.assetBuilder.addTexture(newTexture);
        newTexture.toAsset(data);
        return newTexture;
    }

    cacheTilesetList(
        identifierList: Iterable<number>
    ): Iterable<ITexture | null> {
        const arr = [...identifierList];
        const toAdd: ITexture[] = [];

        arr.forEach(v => {
            const newTexture = this.getTilesetOwnTexture(v);
            if (!newTexture) return;
            toAdd.push(newTexture);
            this.tileStore.addTexture(v, newTexture);
            this.idNumMap.set(`X${v}`, v);
            this.numIdMap.set(v, `X${v}`);
        });

        const set = new Set(toAdd);

        const data = this.assetBuilder.addTextureList(toAdd);
        const res = [...data];
        res.forEach(v => {
            v.assetMap.keys().forEach(tex => {
                if (set.has(tex)) tex.toAsset(v);
            });
        });

        return toAdd;
    }

    buildAssets(): Iterable<IMaterialAssetData> {
        if (this.built) {
            logger.warn(79);
            return [];
        }
        this.built = true;
        const data = this.assetBuilder.addTextureList(this.tileStore.values());
        const arr = [...data];
        const res: IMaterialAssetData[] = [];
        arr.forEach((v, i) => {
            const alias = `asset-${i}`;
            this.assetStore.alias(i, alias);
            this.assetDataStore.set(i, v);
            const data: IMaterialAssetData = {
                data: v,
                identifier: i,
                alias,
                store: this.assetStore
            };
            for (const tex of v.assetMap.keys()) {
                tex.toAsset(v);
            }
            res.push(data);
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
        return texture.static();
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

    setBigImage(identifier: number, image: ITexture): IBigImageData {
        const bigImageId = this.bigImageId++;
        this.bigImageStore.addTexture(bigImageId, image);
        this.bigImageData.set(identifier, image);
        const data: IBigImageData = {
            identifier: bigImageId,
            store: this.bigImageStore
        };
        return data;
    }

    isBigImage(identifier: number): boolean {
        return this.bigImageData.has(identifier);
    }

    getBigImage(identifier: number): ITexture | null {
        return this.bigImageData.get(identifier) ?? null;
    }

    getBigImageByAlias(alias: string): ITexture | null {
        const identifier = this.idNumMap.get(alias);
        if (isNil(identifier)) return null;
        return this.bigImageData.get(identifier) ?? null;
    }
}
