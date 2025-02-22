import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from '../item';
import { Transform } from '../transform';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { AutotileRenderable, RenderableData } from '../cache';
import { texture } from '../cache';
import { isNil } from 'lodash-es';
import { logger } from '@/core/common/logger';
import { IAnimateFrame, renderEmits } from '../frame';

type CanvasStyle = string | CanvasGradient | CanvasPattern;

export interface ETextEvent extends ERenderItemEvent {
    setText: [text: string];
}

export class Text extends RenderItem<ETextEvent> {
    text: string;

    fillStyle?: CanvasStyle = '#fff';
    strokeStyle?: CanvasStyle;
    font: string = '16px Verdana';
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
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = this.fillStyle ?? 'transparent';
        ctx.strokeStyle = this.strokeStyle ?? 'transparent';
        ctx.font = this.font;
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
        ctx.font = this.font;
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
        this.emit('setText', text);
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
            case 'text':
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setText(nextValue);
                return;
            case 'fillStyle':
                this.setStyle(nextValue, this.strokeStyle);
                return;
            case 'strokeStyle':
                this.setStyle(this.fillStyle, nextValue);
                return;
            case 'font':
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setFont(nextValue);
                break;
            case 'strokeWidth':
                this.setStrokeWidth(nextValue);
                return;
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
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
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
}

export interface EIconEvent extends ERenderItemEvent {}

export class Icon extends RenderItem<EIconEvent> implements IAnimateFrame {
    /** 图标id */
    icon: AllNumbers = 0;
    /** 帧数 */
    frame?: number = 0;
    /** 是否启用动画 */
    animate?: boolean = false;
    /** 图标的渲染信息 */
    private renderable?: RenderableData | AutotileRenderable;

    private pendingIcon?: AllNumbers;

    constructor(type: RenderItemPosition, cache?: boolean, fall?: boolean) {
        super(type, cache, fall);
        this.setAntiAliasing(false);
        this.setHD(false);
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        const renderable = this.renderable;
        if (!renderable) return;
        const [x, y, w, h] = renderable.render[0];
        const cw = this.width;
        const ch = this.height;
        const frame = this.animate
            ? RenderItem.animatedFrame % renderable.frame
            : 0;

        if (!this.animate) {
            if (renderable.autotile) {
                ctx.drawImage(renderable.image[0], x, y, w, h, 0, 0, cw, ch);
            } else {
                ctx.drawImage(renderable.image, x, y, w, h, 0, 0, cw, ch);
            }
        } else {
            const [x1, y1, w1, h1] = renderable.render[frame];
            if (renderable.autotile) {
                const img = renderable.image[0];
                ctx.drawImage(img, x1, y1, w1, h1, 0, 0, cw, ch);
            } else {
                ctx.drawImage(renderable.image, x1, y1, w1, h1, 0, 0, cw, ch);
            }
        }
    }

    /**
     * 设置图标
     * @param id 图标id
     */
    setIcon(id: AllIds | AllNumbers) {
        const num = typeof id === 'number' ? id : texture.idNumberMap[id];

        const loading = Mota.require('var', 'loading');
        if (loading.loaded) {
            this.setIconRenderable(num);
        } else {
            if (isNil(this.pendingIcon)) {
                loading.once('loaded', () => {
                    this.setIconRenderable(this.pendingIcon ?? 0);
                    delete this.pendingIcon;
                });
            }
            this.pendingIcon = num;
        }
    }

    private setIconRenderable(num: AllNumbers) {
        const renderable = texture.getRenderable(num);

        if (!renderable) {
            logger.warn(43, num.toString());
            return;
        } else {
            this.icon = num;
            this.renderable = renderable;
            this.frame = renderable.frame;
        }
        this.update();
    }

    /**
     * 更新动画帧
     */
    updateFrameAnimate(): void {
        this.update(this);
    }

    destroy(): void {
        renderEmits.removeFramer(this);
        super.destroy();
    }

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
                if (nextValue) renderEmits.addFramer(this);
                else renderEmits.removeFramer(this);
                this.update();
                return;
            case 'frame':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.frame = nextValue;
                this.update();
                return;
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export interface EWinskinEvent extends ERenderItemEvent {}

export class Winskin extends RenderItem<EWinskinEvent> {
    image: SizedCanvasImageSource;
    /** 边框宽度 */
    borderSize: number = 32;

    private pendingImage?: ImageIds;

    constructor(
        image: SizedCanvasImageSource,
        type: RenderItemPosition = 'static'
    ) {
        super(type, false, false);
        this.image = image;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        const img = this.image;
        const x = 0;
        const y = 0;
        const w = canvas.width;
        const h = canvas.height;
        const sz = this.borderSize / 32;
        ctx.drawImage(img, 0, 0, 128, 128, x + 2, y + 2, w - 4, h - 4);
        ctx.drawImage(img, 128, 0, 16, 16, x, y, 16 * sz, 16 * sz);
        let dx;
        for (dx = 0; dx < w - 64 * sz; dx += 32 * sz) {
            ctx.drawImage(
                img,
                144,
                0,
                32,
                16,
                x + dx + 16,
                y,
                32 * sz,
                16 * sz
            );
            ctx.drawImage(
                img,
                144,
                48,
                32,
                16,
                x + dx + 16,
                y + h - 16 * sz,
                32 * sz,
                16 * sz
            );
        }
        ctx.drawImage(
            img,
            144,
            0,
            w - dx - 32,
            16,
            x + dx + 16 * sz,
            y,
            w - dx - 32 * sz,
            16 * sz
        );
        ctx.drawImage(
            img,
            144,
            48,
            w - dx - 32,
            16,
            x + dx + 16 * sz,
            y + h - 16 * sz,
            w - dx - 32 * sz,
            16 * sz
        );
        ctx.drawImage(
            img,
            176,
            0,
            16,
            16,
            x + w - 16 * sz,
            y,
            16 * sz,
            16 * sz
        );
        // 左右
        let dy;
        for (dy = 0; dy < h - 64 * sz; dy += 32 * sz) {
            ctx.drawImage(
                img,
                128,
                16,
                16,
                32,
                x,
                y + dy + 16 * sz,
                16 * sz,
                32 * sz
            );
            ctx.drawImage(
                img,
                176,
                16,
                16,
                32,
                x + w - 16 * sz,
                y + dy + 16 * sz,
                16 * sz,
                32 * sz
            );
        }
        ctx.drawImage(
            img,
            128,
            16,
            16,
            h - dy - 32,
            x,
            y + dy + 16 * sz,
            16 * sz,
            h - dy - 32 * sz
        );
        ctx.drawImage(
            img,
            176,
            16,
            16,
            h - dy - 32,
            x + w - 16 * sz,
            y + dy + 16 * sz,
            16 * sz,
            h - dy - 32 * sz
        );
        // 下方
        ctx.drawImage(
            img,
            128,
            48,
            16,
            16,
            x,
            y + h - 16 * sz,
            16 * sz,
            16 * sz
        );
        ctx.drawImage(
            img,
            176,
            48,
            16,
            16,
            x + w - 16 * sz,
            y + h - 16 * sz,
            16 * sz,
            16 * sz
        );
        this.update();
    }

    /**
     * 设置winskin图片
     * @param image winskin图片
     */
    setImage(image: SizedCanvasImageSource) {
        this.image = image;
        this.update();
    }

    /**
     * 通过图片名称设置winskin
     * @param name 图片名称
     */
    setImageByName(name: ImageIds) {
        const loading = Mota.require('var', 'loading');
        if (loading.loaded) {
            const image = core.material.images.images[name];
            this.setImage(image);
        } else {
            if (isNil(this.pendingImage)) {
                loading.once('loaded', () => {
                    const id = this.pendingImage;
                    if (!id) return;
                    const image = core.material.images.images[id];
                    this.setImage(image);
                    delete this.pendingImage;
                });
            }
            this.pendingImage = name;
        }
    }

    /**
     * 设置边框大小
     * @param size 边框大小
     */
    setBorderSize(size: number) {
        this.borderSize = size;
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
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setImageByName(nextValue);
                return;
            case 'borderSize':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setBorderSize(nextValue);
                return;
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}
