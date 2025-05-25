import {
    ERenderItemEvent,
    RenderItem,
    RenderItemPosition,
    Transform,
    MotaOffscreenCanvas2D
} from '@motajs/render-core';
import { Font } from '@motajs/render-style';

/** 文字的安全填充，会填充在文字的上侧和下侧，防止削顶和削底 */
const SAFE_PAD = 1;

type CanvasStyle = string | CanvasGradient | CanvasPattern;

export interface ETextEvent extends ERenderItemEvent {
    setText: [text: string, width: number, height: number];
}

export class Text extends RenderItem<ETextEvent> {
    text: string;

    fillStyle?: CanvasStyle = '#fff';
    strokeStyle?: CanvasStyle;
    font: Font = new Font();
    strokeWidth: number = 1;

    private length: number = 0;
    private descent: number = 0;

    private static measureCanvas = new MotaOffscreenCanvas2D();

    constructor(text: string = '', type: RenderItemPosition = 'static') {
        super(type, false);

        this.text = text;
        if (text.length > 0) {
            this.requestBeforeFrame(() => {
                this.calBox();
                this.emit('setText', text, this.width, this.height);
            });
        }
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        const stroke = this.strokeWidth;
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = this.fillStyle ?? 'transparent';
        ctx.strokeStyle = this.strokeStyle ?? 'transparent';
        ctx.font = this.font.string();
        ctx.lineWidth = this.strokeWidth;

        if (this.strokeStyle) {
            ctx.strokeText(this.text, stroke, this.descent + stroke + SAFE_PAD);
        }
        if (this.fillStyle) {
            ctx.fillText(this.text, stroke, this.descent + stroke + SAFE_PAD);
        }
    }

    /**
     * 获取文字的长度
     */
    measure() {
        const ctx = Text.measureCanvas.ctx;
        ctx.textBaseline = 'bottom';
        ctx.font = this.font.string();
        const res = ctx.measureText(this.text);
        return res;
    }

    /**
     * 设置显示文字
     * @param text 显示的文字
     */
    setText(text: string) {
        this.text = text;
        this.calBox();
        this.update(this);
        this.emit('setText', text, this.width, this.height);
    }

    /**
     * 设置使用的字体
     * @param font 字体
     */
    setFont(font: Font) {
        this.font = font;
        this.calBox();
        this.update(this);
    }

    /**
     * 设置字体样式
     * @param fill 填充样式
     * @param stroke 描边样式
     */
    setStyle(fill?: CanvasStyle, stroke?: CanvasStyle) {
        this.fillStyle = fill;
        this.strokeStyle = stroke;
        this.update();
    }

    /**
     * 设置描边宽度
     * @param width 宽度
     */
    setStrokeWidth(width: number) {
        const before = this.strokeWidth;
        this.strokeWidth = width;
        const dw = width - before;
        this.size(this.width + dw * 2, this.height + dw * 2);
        this.update();
    }

    /**
     * 计算字体所占空间，从而确定这个元素的大小
     */
    calBox() {
        const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
            this.measure();
        this.length = width;
        this.descent = actualBoundingBoxAscent;
        const height = actualBoundingBoxAscent + actualBoundingBoxDescent;
        const stroke = this.strokeWidth * 2;
        this.size(width + stroke, height + stroke + SAFE_PAD * 2);
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'text':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.setText(nextValue);
                return true;
            case 'fillStyle':
                this.setStyle(nextValue, this.strokeStyle);
                return true;
            case 'strokeStyle':
                this.setStyle(this.fillStyle, nextValue);
                return true;
            case 'font':
                if (!this.assertType(nextValue, Font, key)) return false;
                this.setFont(nextValue);
                return true;
            case 'strokeWidth':
                this.setStrokeWidth(nextValue);
                return true;
        }
        return false;
    }
}

export interface EImageEvent extends ERenderItemEvent {}

export class Image extends RenderItem<EImageEvent> {
    image: CanvasImageSource;

    constructor(image: CanvasImageSource, type: RenderItemPosition = 'static') {
        super(type);
        this.image = image;
        if (image instanceof VideoFrame || image instanceof SVGElement) {
            this.size(200, 200);
        } else {
            this.size(image.width, image.height);
        }
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    }

    /**
     * 设置图片资源
     * @param image 图片资源
     */
    setImage(image: CanvasImageSource) {
        this.image = image;
        this.update();
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'image':
                this.setImage(nextValue);
                return true;
        }
        return false;
    }
}

export class Comment extends RenderItem {
    readonly isComment: boolean = true;

    constructor(public text: string = '') {
        super('static', false, false);
        this.hide();
    }

    getBoundingRect(): DOMRectReadOnly {
        return new DOMRectReadOnly(0, 0, 0, 0);
    }

    protected render(
        _canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {}

    protected handleProps(): boolean {
        return false;
    }
}
