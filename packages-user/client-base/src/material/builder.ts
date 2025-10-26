import {
    ITextureStore,
    ITexture,
    ITextureComposedData,
    ITextureStreamComposer,
    TextureMaxRectsStreamComposer
} from '@motajs/render-assets';
import { IAssetBuilder } from './types';
import { logger } from '@motajs/common';

export class AssetBuilder implements IAssetBuilder {
    readonly composer: ITextureStreamComposer<void> =
        new TextureMaxRectsStreamComposer(4096, 4096, 0);

    private output: ITextureStore | null = null;
    private started: boolean = false;

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
            if (!this.output.getTexture(data.index)) {
                this.output.addTexture(data.index, data.texture);
            }
        }
        return data;
    }

    addTextureList(
        texture: Iterable<ITexture>
    ): Iterable<ITextureComposedData> {
        this.started = true;
        const res = [...this.composer.add(texture)];
        if (this.output) {
            res.forEach(v => {
                if (!this.output!.getTexture(v.index)) {
                    this.output!.addTexture(v.index, v.texture);
                }
            });
        }
        return res;
    }

    close(): void {
        this.composer.close();
    }
}
