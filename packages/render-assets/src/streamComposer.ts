import {
    Bin,
    IOption,
    IRectangle,
    MaxRectsPacker,
    Rectangle
} from 'maxrects-packer';
import { Texture } from './texture';
import {
    IRect,
    ITexture,
    ITextureComposedData,
    ITextureStreamComposer
} from './types';

export class TextureGridStreamComposer implements ITextureStreamComposer<void> {
    readonly rows: number;
    readonly cols: number;

    private nowIndex: number = 0;
    private outputIndex: number = -1;

    private nowTexture: ITexture;
    private nowCanvas: HTMLCanvasElement;
    private nowCtx: CanvasRenderingContext2D;
    private nowMap: Map<ITexture, Readonly<IRect>>;

    /**
     * 网格流式贴图组合器，将等大小的贴图组合成图集，要求每个贴图的尺寸一致。
     * 组合时按照先从左到右，再从上到下的顺序组合。
     * @param width 单个贴图的宽度
     * @param height 单个贴图的高度
     * @param maxWidth 图集的最大宽度，也是输出贴图对象的宽度
     * @param maxHeight 图集的最大高度，也是输出贴图对象的高度
     */
    constructor(
        readonly width: number,
        readonly height: number,
        readonly maxWidth: number,
        readonly maxHeight: number
    ) {
        this.rows = Math.floor(maxHeight / height);
        this.cols = Math.floor(maxWidth / width);

        this.nowCanvas = document.createElement('canvas');
        this.nowCtx = this.nowCanvas.getContext('2d')!;
        this.nowMap = new Map();
        this.nowTexture = new Texture(this.nowCanvas);
    }

    private nextCanvas() {
        this.nowCanvas = document.createElement('canvas');
        this.nowCtx = this.nowCanvas.getContext('2d')!;
        this.nowMap = new Map();
        this.nowIndex = 0;
        this.nowTexture = new Texture(this.nowCanvas);
        this.outputIndex++;
    }

    *add(textures: Iterable<ITexture>): Generator<ITextureComposedData, void> {
        let index = this.nowIndex;
        const max = this.cols * this.rows;

        for (const tex of textures) {
            const nowRow = Math.floor(index / this.cols);
            const nowCol = index % this.cols;

            const { source, rect } = tex.render();
            const { x: cx, y: cy, w: cw, h: ch } = rect;
            const x = nowRow * this.width;
            const y = nowCol * this.height;
            this.nowCtx.drawImage(source, cx, cy, cw, ch, x, y, cw, ch);
            this.nowMap.set(tex, { x, y, w: cw, h: ch });

            if (++index === max) {
                const data: ITextureComposedData = {
                    index: this.outputIndex,
                    texture: this.nowTexture,
                    assetMap: this.nowMap
                };
                yield data;
                this.nextCanvas();
            }
        }

        const data: ITextureComposedData = {
            index: this.outputIndex,
            texture: this.nowTexture,
            assetMap: this.nowMap
        };
        yield data;
    }

    close(): void {
        // We need to do nothing.
    }
}

interface MaxRectsRectangle extends IRectangle {
    /** 这个矩形对应的贴图对象 */
    readonly data: ITexture;
}

export class TextureMaxRectsStreamComposer
    implements ITextureStreamComposer<void>
{
    /** Max Rects 打包器 */
    readonly packer: MaxRectsPacker<MaxRectsRectangle>;

    private outputIndex: number = -1;
    private nowTexture!: ITexture;

    private nowCanvas!: HTMLCanvasElement;
    private nowCtx!: CanvasRenderingContext2D;
    private nowMap!: Map<ITexture, Readonly<IRect>>;
    private nowBin: number = 0;

    /**
     * 使用 Max Rects 算法执行贴图整合。输出的纹理的图像源将会是不同的画布。
     * @param maxWidth 图集最大宽度，也是输出贴图对象的宽度
     * @param maxHeight 图集最大高度，也是输出贴图对象的高度
     * @param padding 每个贴图之间的间距
     * @param options 传递给打包器对象的参数
     */
    constructor(
        readonly maxWidth: number,
        readonly maxHeight: number,
        readonly padding: number,
        options?: IOption
    ) {
        this.packer = new MaxRectsPacker<MaxRectsRectangle>(
            this.maxWidth,
            this.maxHeight,
            padding,
            options
        );

        this.nextCanvas();
    }

    private nextCanvas() {
        this.nowCanvas = document.createElement('canvas');
        this.nowCtx = this.nowCanvas.getContext('2d')!;
        this.nowCanvas.width = this.maxWidth;
        this.nowCanvas.height = this.maxHeight;
        this.nowMap = new Map();
        this.outputIndex++;
        this.nowTexture = new Texture(this.nowCanvas);
    }

    *add(textures: Iterable<ITexture>): Generator<ITextureComposedData, void> {
        const arr = [...textures];
        const rects = arr.map<MaxRectsRectangle>(v => {
            const rect = v.render().rect;
            const toPack = new Rectangle(rect.w, rect.h);
            toPack.data = v;
            return toPack;
        });
        this.packer.addArray(rects);

        const bins = this.packer.bins;
        if (bins.length === 0) return;
        const toYield: Bin<MaxRectsRectangle>[] = [bins[bins.length - 1]];
        if (bins.length > this.nowBin) {
            toYield.push(...bins.slice(this.nowBin));
        }

        for (let i = this.nowBin; i < bins.length; i++) {
            const rects = bins[i].rects;
            rects.forEach(v => {
                if (this.nowMap.has(v.data)) return;
                const target: IRect = {
                    x: v.x,
                    y: v.y,
                    w: v.width,
                    h: v.height
                };
                this.nowMap.set(v.data, target);
                const { source, rect } = v.data.render();
                const { x: cx, y: cy, w: cw, h: ch } = rect;
                this.nowCtx.drawImage(source, cx, cy, cw, ch, v.x, v.y, cw, ch);
            });

            const data: ITextureComposedData = {
                index: this.outputIndex,
                texture: this.nowTexture,
                assetMap: this.nowMap
            };
            yield data;
            if (i < bins.length - 1) {
                this.nextCanvas();
            }
        }

        this.nowBin = bins.length - 1;
    }

    close(): void {
        // We need to do nothing.
    }
}
