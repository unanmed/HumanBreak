import { Sprite } from '../sprite';

type CanvasStyle = string | CanvasGradient | CanvasPattern;

export class Text extends Sprite {
    text: string;

    fillStyle?: CanvasStyle = '#fff';
    strokeStyle?: CanvasStyle;
    font?: string = '';

    private length: number = 0;
    private descent: number = 0;

    constructor(text: string = '') {
        super();

        this.text = text;
        if (text.length > 0) this.calBox();

        this.renderFn = ({ canvas, ctx }) => {
            ctx.save();
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = this.fillStyle ?? 'transparent';
            ctx.strokeStyle = this.strokeStyle ?? 'transparent';
            ctx.font = this.font ?? '';

            if (this.fillStyle) {
                ctx.fillText(this.text, 0, this.descent);
            }
            if (this.strokeStyle) {
                ctx.strokeText(this.text, 0, this.descent);
            }
            ctx.restore();
        };
    }

    /**
     * 获取文字的长度
     */
    measure() {
        this.canvas.ctx.save();
        this.canvas.ctx.textBaseline = 'bottom';
        this.canvas.ctx.font = this.font ?? '';
        const res = this.canvas.ctx.measureText(this.text);
        this.canvas.ctx.restore();
        return res;
    }

    /**
     * 设置显示文字
     * @param text 显示的文字
     */
    setText(text: string) {
        this.text = text;
        this.writing = this.using;
        this.using = void 0;
        this.calBox();
        if (this.parent) this.update(this);
    }

    /**
     * 设置使用的字体
     * @param font 字体
     */
    setFont(font: string) {
        this.font = font;
        this.calBox();
        if (this.parent) this.update(this);
    }

    /**
     * 设置字体样式
     * @param fill 填充样式
     * @param stroke 描边样式
     */
    setStyle(fill?: CanvasStyle, stroke?: CanvasStyle) {
        this.fillStyle = fill;
        this.strokeStyle = stroke;
    }

    /**
     * 计算字体所占空间，从而确定这个元素的大小
     */
    calBox() {
        const { width, fontBoundingBoxAscent } = this.measure();
        this.length = width;
        this.descent = fontBoundingBoxAscent;
        this.size(width, fontBoundingBoxAscent);
    }
}

export type SizedCanvasImageSource = Exclude<
    CanvasImageSource,
    VideoFrame | SVGElement
>;

export class Image extends Sprite {
    image: SizedCanvasImageSource;

    constructor(image: SizedCanvasImageSource) {
        super();
        this.image = image;
        this.canvas.withGameScale(false);
        this.canvas.setHD(false);
        this.size(image.width, image.height);

        this.renderFn = ({ canvas, ctx }) => {
            ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
        };
    }

    /**
     * 设置图片资源
     * @param image 图片资源
     */
    setImage(image: SizedCanvasImageSource) {
        this.image = image;
        this.size(image.width, image.height);
        this.writing = this.using;
        this.using = void 0;
        this.update(this);
    }
}
