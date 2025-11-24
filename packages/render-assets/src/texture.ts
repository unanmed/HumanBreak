import { logger } from '@motajs/common';
import {
    IRect,
    ITexture,
    ITextureComposedData,
    ITextureRenderable,
    ITextureSplitter,
    SizedCanvasImageSource
} from './types';
import { clamp } from 'lodash-es';

export class Texture implements ITexture {
    source: SizedCanvasImageSource;
    width: number;
    height: number;
    isBitmap: boolean = false;

    /** 裁剪矩形的左边框位置 */
    private cl: number;
    /** 裁剪矩形的上边框位置 */
    private ct: number;
    /** 裁剪矩形的右边框位置 */
    private cr: number;
    /** 裁剪矩形的下边框位置 */
    private cb: number;

    constructor(source: SizedCanvasImageSource) {
        this.source = source;
        this.width = source.width;
        this.height = source.height;
        this.cl = 0;
        this.ct = 0;
        this.cr = source.width;
        this.cb = source.height;
    }

    /**
     * 对纹理进行裁剪操作，不会改变图像源
     * @param x 裁剪左上角横坐标
     * @param y 裁剪左上角纵坐标
     * @param w 裁剪宽度
     * @param h 裁剪高度
     */
    clip(x: number, y: number, w: number, h: number) {
        const left = clamp(this.cl + x, this.cl, this.cr);
        const top = clamp(this.ct + y, this.ct, this.cb);
        const right = clamp(this.cl + x + w, this.cl, this.cr);
        const bottom = clamp(this.ct + y + h, this.ct, this.cb);
        if (left === right || top === bottom) {
            logger.warn(69);
            return;
        }
        const width = right - left;
        const height = bottom - top;
        if (width <= 0 || height <= 0) {
            logger.warn(77);
            return;
        }
        this.cl = left;
        this.ct = top;
        this.cr = right;
        this.cb = bottom;
        this.width = right - left;
        this.height = bottom - top;
    }

    async toBitmap(): Promise<void> {
        if (this.source instanceof ImageBitmap) return;
        this.source = await createImageBitmap(
            this.source,
            this.cl,
            this.ct,
            this.width,
            this.height
        );
        this.cl = 0;
        this.ct = 0;
        this.cr = this.width;
        this.cb = this.height;
        this.isBitmap = true;
    }

    split<U>(splitter: ITextureSplitter<U>, data: U): Generator<ITexture> {
        return splitter.split(this, data);
    }

    render(): ITextureRenderable {
        return {
            source: this.source,
            rect: { x: this.cl, y: this.ct, w: this.width, h: this.height }
        };
    }

    clampRect(rect: Readonly<IRect>): Readonly<IRect> {
        const l = clamp(rect.x, this.cl, this.cr);
        const t = clamp(rect.y, this.ct, this.cb);
        const r = clamp(rect.x + rect.w, this.cl, this.cr);
        const b = clamp(rect.y + rect.h, this.ct, this.cb);
        return { x: l, y: t, w: r - l, h: b - t };
    }

    clipped(rect: Readonly<IRect>): ITextureRenderable {
        return {
            source: this.source,
            rect: this.clampRect(rect)
        };
    }

    dispose(): void {
        if (this.source instanceof ImageBitmap) {
            this.source.close();
        }
    }

    toAsset(asset: ITextureComposedData): boolean {
        const rect = asset.assetMap.get(this);
        if (!rect) return false;
        if (this.isBitmap && this.source instanceof ImageBitmap) {
            this.source.close();
        }
        this.isBitmap = false;
        this.source = asset.texture.source;
        this.cl = rect.x;
        this.ct = rect.y;
        this.width = rect.w;
        this.height = rect.h;
        this.cr = rect.x + rect.w;
        this.cb = rect.y + rect.h;
        return true;
    }

    /**
     * 对贴图的动画执行偏移效果。动画效果可以不来自传入的贴图对象，
     * 输出结果的图像源会是传入的贴图对象的图像源而非动画效果对应的图像源
     * @param texture 贴图对象
     * @param animate 动画效果
     * @param ox 偏移横坐标
     * @param oy 偏移纵坐标
     */
    static *translated(
        texture: ITexture,
        animate: Generator<ITextureRenderable, void> | null,
        ox: number,
        oy: number
    ): Generator<ITextureRenderable, void> | null {
        if (!animate) return null;

        while (true) {
            const next = animate.next();
            if (next.done) break;
            const renderable = next.value;
            const { x, y, w, h } = renderable.rect;
            const translated: IRect = { x: x + ox, y: y + oy, w, h };
            const res: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect(translated)
            };
            yield res;
        }
    }

    /**
     * 对贴图的动画重定位。最终输出的动画会以传入的 `fx` `fy` 为左上角坐标计算
     * @param texture 贴图对象
     * @param origin 动画效果来自的贴图对象
     * @param animate 动画效果
     * @param fx 左上角横坐标
     * @param fy 左上角纵坐标
     */
    static *fixed(
        texture: ITexture,
        origin: ITexture,
        animate: Generator<ITextureRenderable, void> | null,
        fx: number,
        fy: number
    ): Generator<ITextureRenderable, void> | null {
        if (!animate) return null;
        const { x: ox, y: oy } = origin.render().rect;

        while (true) {
            const next = animate.next();
            if (next.done) break;
            const renderable = next.value;
            const { x, y, w, h } = renderable.rect;
            const translated: IRect = { x: x - ox + fx, y: y - oy + fy, w, h };
            const res: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect(translated)
            };
            yield res;
        }
    }
}
