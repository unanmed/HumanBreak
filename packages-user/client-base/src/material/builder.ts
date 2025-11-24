import {
    ITextureStore,
    ITexture,
    ITextureComposedData,
    ITextureStreamComposer,
    TextureMaxRectsStreamComposer,
    SizedCanvasImageSource
} from '@motajs/render-assets';
import { IAssetBuilder, IMaterialGetter, ITrackedAssetData } from './types';
import { logger, PrivateListDirtyTracker } from '@motajs/common';

export class AssetBuilder implements IAssetBuilder {
    readonly composer: ITextureStreamComposer<void> =
        new TextureMaxRectsStreamComposer(4096, 4096, 0);

    private output: ITextureStore | null = null;
    private started: boolean = false;

    private readonly trackedData: TrackedAssetData;

    /** 当前的索引 */
    private index: number = -1;

    /** 贴图更新的 promise */
    private pending: Promise<void> = Promise.resolve();

    constructor(readonly materials: IMaterialGetter) {
        this.trackedData = new TrackedAssetData(materials, this);
    }

    pipe(store: ITextureStore): void {
        if (this.started) {
            logger.warn(76);
            return;
        }
        this.output = store;
    }

    addTexture(texture: ITexture): ITextureComposedData {
        this.started = true;
        const res = [...this.composer.add([texture])];
        const data = res[0];

        if (this.output) {
            if (data.index > this.index) {
                this.output.addTexture(data.index, data.texture);
                this.index = data.index;
            }
        }

        this.pending = this.pending.then(() =>
            this.trackedData.updateSource(data.index, data.texture.source)
        );

        return data;
    }

    private async updateSourceList(source: Set<ITextureComposedData>) {
        for (const data of source) {
            await this.trackedData.updateSource(
                data.index,
                data.texture.source
            );
        }
    }

    addTextureList(
        texture: Iterable<ITexture>
    ): Iterable<ITextureComposedData> {
        this.started = true;
        const res = [...this.composer.add(texture)];
        const toUpdate = new Set<ITextureComposedData>();
        if (this.output) {
            res.forEach(data => {
                if (data.index > this.index) {
                    this.output!.addTexture(data.index, data.texture);
                    this.index = data.index;
                    toUpdate.add(data);
                } else {
                    toUpdate.add(data);
                }
            });
        }

        this.pending = this.pending.then(() => this.updateSourceList(toUpdate));

        return res;
    }

    tracked(): ITrackedAssetData {
        return this.trackedData;
    }

    close(): void {
        this.composer.close();
    }
}

class TrackedAssetData
    extends PrivateListDirtyTracker<number>
    implements ITrackedAssetData
{
    readonly sourceList: Map<number, ImageBitmap> = new Map();
    readonly skipRef: Map<SizedCanvasImageSource, number> = new Map();

    private originSourceMap: Map<number, SizedCanvasImageSource> = new Map();

    private promises: Set<Promise<ImageBitmap>> = new Set();

    constructor(
        readonly materials: IMaterialGetter,
        readonly builder: AssetBuilder
    ) {
        super(0);
    }

    markDirty(index: number) {
        if (index >= this.length) {
            this.updateLength(index + 1);
        }
        this.dirty(index);
    }

    async updateSource(index: number, source: SizedCanvasImageSource) {
        if (index >= this.length) {
            this.updateLength(this.length + 1);
        }
        const origin = this.originSourceMap.get(index);
        const prev = this.sourceList.get(index);
        if (origin && origin !== source) {
            this.skipRef.delete(origin);
        }
        if (prev) {
            this.skipRef.delete(prev);
        }
        this.originSourceMap.set(index, source);
        if (source instanceof ImageBitmap) {
            if (this.skipRef.has(source)) return;
            this.sourceList.set(index, source);
            this.skipRef.set(source, index);
        } else {
            const promise = createImageBitmap(source);
            this.promises.add(promise);
            const bitmap = await promise;
            this.promises.delete(promise);
            this.sourceList.set(index, bitmap);
            this.skipRef.set(bitmap, index);
            // 要把源也加到映射中，因为这里的 bitmap 与外部源并不同引用
            this.skipRef.set(source, index);
        }
        this.dirty(index);
    }

    async then(): Promise<void> {
        await Promise.all([...this.promises]);
    }

    close(): void {}
}
