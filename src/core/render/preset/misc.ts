import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { Sprite } from '../sprite';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from '../item';
import { Transform } from '../transform';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { AutotileRenderable, RenderableData } from '../cache';

type CanvasStyle = string | CanvasGradient | CanvasPattern;

export interface ETextEvent extends ERenderItemEvent {}

export class Text extends RenderItem<ETextEvent> {
    text: string;

    fillStyle?: CanvasStyle = '#fff';
    strokeStyle?: CanvasStyle;
    font?: string = '';
    strokeWidth: number = 1;

    private length: number = 0;
    private descent: number = 0;

    private static measureCanvas = new MotaOffscreenCanvas2D();

    constructor(text: string = '', type: RenderItemPosition = 'static') {
        super(type, false);

        this.text = text;
        if (text.length > 0) this.calBox();
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = this.fillStyle ?? 'transparent';
        ctx.strokeStyle = this.strokeStyle ?? 'transparent';
        ctx.font = this.font ?? '';
        ctx.lineWidth = this.strokeWidth;

        if (this.strokeStyle) {
            ctx.strokeText(this.text, 0, this.descent);
        }
        if (this.fillStyle) {
            ctx.fillText(this.text, 0, this.descent);
        }
    }

    /**
     * 获取文字的长度
     */
    measure() {
        const ctx = Text.measureCanvas.ctx;
        ctx.textBaseline = 'bottom';
        ctx.font = this.font ?? '';
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
     * 设置描边宽度
     * @param width 宽度
     */
    setStrokeWidth(width: number) {
        this.strokeWidth = width;
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

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
            case 'font':
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setFont(nextValue);
                break;
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export type SizedCanvasImageSource = Exclude<
    CanvasImageSource,
    VideoFrame | SVGElement
>;

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
        transform: Transform
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

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
            case 'image':
                this.setImage(nextValue);
                return;
        }
    }
}

export class Comment extends RenderItem {
    constructor(public text: string = '') {
        super('static');
        this.hide();
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}

export interface EIconEvent extends ERenderItemEvent {}

export class Icon extends RenderItem<EIconEvent> {
    /** 图标id */
    icon: AllNumbers = 0;
    /** 帧数 */
    frame: number = 0;
    /** 是否启用动画 */
    animate: boolean = false;
    /** 图标的渲染信息 */
    private renderable?: RenderableData | AutotileRenderable;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    /**
     * 设置图标
     * @param id 图标id
     */
    setIcon(id: AllIds | AllNumbers) {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
            case 'icon':
                this.setIcon(nextValue);
                return;
            case 'animate':
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.animate = nextValue;
                return;
            case 'frame':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.frame = nextValue;
                return;
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}
