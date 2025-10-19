import { logger } from '@motajs/common';
import {
    ERenderItemEvent,
    RenderItem,
    RenderItemPosition,
    MotaOffscreenCanvas2D,
    Transform
} from '@motajs/render-core';
import { SizedCanvasImageSource } from '@motajs/render-assets';
import { isNil } from 'lodash-es';
import { RenderableData, AutotileRenderable, texture } from './cache';
import { IAnimateFrame, renderEmits } from './frame';

export interface EIconEvent extends ERenderItemEvent {}

export class Icon extends RenderItem<EIconEvent> implements IAnimateFrame {
    /** 图标id */
    icon: AllNumbers = 0;
    /** 帧数 */
    frame: number = 0;
    /** 是否启用动画 */
    animate: boolean = false;
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
            : this.frame;

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
    setIcon(id: AllIdsWithNone | AllNumbers) {
        if (id === 0 || id === 'none') {
            this.renderable = void 0;
            return;
        }
        const num = typeof id === 'number' ? id : texture.idNumberMap[id];

        const { loading } = Mota.require('@user/data-base');
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
        if (this.animate) this.update(this);
    }

    destroy(): void {
        renderEmits.removeFramer(this);
        super.destroy();
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'icon':
                this.setIcon(nextValue);
                return true;
            case 'animate':
                if (!this.assertType(nextValue, 'boolean', key)) return false;
                this.animate = nextValue;
                if (nextValue) renderEmits.addFramer(this);
                else renderEmits.removeFramer(this);
                this.update();
                return true;
            case 'frame':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.frame = nextValue;
                this.update();
                return true;
        }
        return false;
    }
}

interface WinskinPatterns {
    top: CanvasPattern;
    left: CanvasPattern;
    bottom: CanvasPattern;
    right: CanvasPattern;
}

export interface EWinskinEvent extends ERenderItemEvent {}

export class Winskin extends RenderItem<EWinskinEvent> {
    image: SizedCanvasImageSource;
    /** 边框宽度，32表示原始宽度 */
    borderSize: number = 32;
    /** 图片名称 */
    imageName?: string;

    private pendingImage?: ImageIds;
    private patternCache?: WinskinPatterns;
    private patternTransform: DOMMatrix;

    // todo: 跨上下文可能是未定义行为，需要上下文无关化
    private static patternMap: Map<string, WinskinPatterns> = new Map();

    constructor(
        image: SizedCanvasImageSource,
        type: RenderItemPosition = 'static'
    ) {
        super(type, false, false);
        this.image = image;
        this.setAntiAliasing(false);

        if (window.DOMMatrix) {
            this.patternTransform = new DOMMatrix();
        } else if (window.WebKitCSSMatrix) {
            this.patternTransform = new WebKitCSSMatrix();
        } else {
            this.patternTransform = new SVGMatrix();
        }
    }

    private generatePattern() {
        const pattern = this.requireCanvas(true, false);
        pattern.setScale(1);
        const img = this.image;
        pattern.size(32, 16);
        pattern.setHD(false);
        pattern.setAntiAliasing(false);
        const ctx = pattern.ctx;
        ctx.drawImage(img, 144, 0, 32, 16, 0, 0, 32, 16);
        const topPattern = ctx.createPattern(pattern.canvas, 'repeat');
        ctx.clearRect(0, 0, 32, 16);
        ctx.drawImage(img, 144, 48, 32, 16, 0, 0, 32, 16);
        const bottomPattern = ctx.createPattern(pattern.canvas, 'repeat');
        ctx.clearRect(0, 0, 32, 16);
        pattern.size(16, 32);
        ctx.drawImage(img, 128, 16, 16, 32, 0, 0, 16, 32);
        const leftPattern = ctx.createPattern(pattern.canvas, 'repeat');
        ctx.clearRect(0, 0, 16, 32);
        ctx.drawImage(img, 176, 16, 16, 32, 0, 0, 16, 32);
        const rightPattern = ctx.createPattern(pattern.canvas, 'repeat');
        if (!topPattern || !bottomPattern || !leftPattern || !rightPattern) {
            return null;
        }
        const winskinPattern: WinskinPatterns = {
            top: topPattern,
            bottom: bottomPattern,
            left: leftPattern,
            right: rightPattern
        };
        if (this.imageName) {
            Winskin.patternMap.set(this.imageName, winskinPattern);
        }
        this.patternCache = winskinPattern;
        this.deleteCanvas(pattern);
        return winskinPattern;
    }

    private getPattern() {
        if (!this.imageName) {
            if (this.patternCache) return this.patternCache;
            return this.generatePattern();
        } else {
            const pattern = Winskin.patternMap.get(this.imageName);
            if (pattern) return pattern;
            return this.generatePattern();
        }
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        const img = this.image;
        const w = this.width;
        const h = this.height;
        const pad = this.borderSize / 2;
        // 背景
        ctx.drawImage(img, 0, 0, 128, 128, 2, 2, w - 4, h - 4);
        const pattern = this.getPattern();
        if (!pattern) return;
        const { top, left, right, bottom } = pattern;
        top.setTransform(this.patternTransform);
        left.setTransform(this.patternTransform);
        right.setTransform(this.patternTransform);
        bottom.setTransform(this.patternTransform);
        // 上下左右边框
        ctx.save();
        ctx.fillStyle = top;
        ctx.translate(pad, 0);
        ctx.fillRect(0, 0, w - pad * 2, pad);
        ctx.fillStyle = bottom;
        ctx.translate(0, h - pad);
        ctx.fillRect(0, 0, w - pad * 2, pad);
        ctx.fillStyle = left;
        ctx.translate(-pad, pad * 2 - h);
        ctx.fillRect(0, 0, pad, h - pad * 2);
        ctx.fillStyle = right;
        ctx.translate(w - pad, 0);
        ctx.fillRect(0, 0, pad, h - pad * 2);
        ctx.restore();
        // 四个角的边框
        ctx.drawImage(img, 128, 0, 16, 16, 0, 0, pad, pad);
        ctx.drawImage(img, 176, 0, 16, 16, w - pad, 0, pad, pad);
        ctx.drawImage(img, 128, 48, 16, 16, 0, h - pad, pad, pad);
        ctx.drawImage(img, 176, 48, 16, 16, w - pad, h - pad, pad, pad);
    }

    /**
     * 设置winskin图片
     * @param image winskin图片
     */
    setImage(image: SizedCanvasImageSource) {
        this.image = image;
        this.patternCache = void 0;
        this.update();
    }

    /**
     * 通过图片名称设置winskin
     * @param name 图片名称
     */
    setImageByName(name: ImageIds) {
        const { loading } = Mota.require('@user/data-base');
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
        this.imageName = name;
    }

    /**
     * 设置边框大小
     * @param size 边框大小
     */
    setBorderSize(size: number) {
        this.borderSize = size;
        this.patternTransform.a = size / 32;
        this.patternTransform.d = size / 32;
        this.update();
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'image':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.setImageByName(nextValue);
                return true;
            case 'borderSize':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setBorderSize(nextValue);
                return true;
        }
        return false;
    }
}
