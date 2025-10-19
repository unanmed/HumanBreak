import { logger } from '@motajs/common';
import {
    ITexture,
    ITextureAnimater,
    ITextureListedRenderable,
    ITextureSingleRenderable,
    ITextureSplitter,
    SizedCanvasImageSource
} from './types';

export class Texture<T = unknown, A = unknown> implements ITexture<T, A> {
    source: SizedCanvasImageSource;
    animater: ITextureAnimater<T, A> | null = null;
    width: number;
    height: number;

    private cx: number;
    private cy: number;

    constructor(source: SizedCanvasImageSource) {
        this.source = source;
        this.width = source.width;
        this.height = source.height;
        this.cx = 0;
        this.cy = 0;
    }

    /**
     * 对纹理进行裁剪操作，不会改变图像源
     * @param x 裁剪左上角横坐标
     * @param y 裁剪左上角纵坐标
     * @param w 裁剪宽度
     * @param h 裁剪高度
     */
    clip(x: number, y: number, w: number, h: number) {
        const r = x + w;
        const b = y + h;
        if (x > this.width || y > this.height || r < 0 || b < 0) {
            logger.warn(69);
            return;
        }
        const left = Math.max(0, x);
        const top = Math.max(0, y);
        const right = Math.min(this.width, r);
        const bottom = Math.min(this.height, b);
        this.cx = left;
        this.cy = top;
        this.width = right - left;
        this.height = bottom - top;
    }

    async toBitmap(): Promise<void> {
        if (this.source instanceof ImageBitmap) return;
        this.source = await createImageBitmap(this.source as any);
    }

    split<U>(splitter: ITextureSplitter<U>, data: U): Generator<ITexture> {
        return splitter.split(this, data);
    }

    animated(animater: ITextureAnimater<T, A>, data: T): void {
        this.animater = animater;
        animater.create(this, data);
    }

    static(): ITextureSingleRenderable {
        const renderable: ITextureSingleRenderable = {
            source: this.source,
            rect: { x: this.cx, y: this.cy, w: this.width, h: this.height }
        };
        return renderable;
    }

    dynamic(data: A): Generator<ITextureListedRenderable> | null {
        if (!this.animater) return null;
        return this.animater.open(data);
    }

    cycled(data: A): Generator<ITextureListedRenderable> | null {
        if (!this.animater) return null;
        return this.animater.cycled(data);
    }

    dispose(): void {
        if (this.source instanceof ImageBitmap) {
            this.source.close();
        }
        this.animater = null;
    }
}
