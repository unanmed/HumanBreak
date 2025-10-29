import { logger } from '@motajs/common';
import { ITexture, ITextureAnimater, ITextureRenderable } from './types';

/**
 * 基于帧的动画控制器，创建时传入的参数代表帧数，生成动画时传入的参数自定义
 */
export abstract class FrameBasedAnimater<T>
    implements ITextureAnimater<number, T>
{
    texture: ITexture<number, T> | null = null;

    /** 动画的总帧数 */
    protected frames: number = 0;

    create(texture: ITexture, data: number): void {
        if (this.texture) {
            logger.warn(70);
            return;
        }
        this.texture = texture;
        this.frames = data;
    }

    /**
     * 判断当前动画控制器是否已经初始化完毕并开始生成动画
     */
    protected check(): boolean {
        if (!this.texture || this.frames === 0) {
            logger.warn(71);
            return false;
        }
        if (this.texture.height % this.frames !== 0) {
            logger.warn(72);
            return false;
        }
        return true;
    }

    abstract open(init: T): Generator<ITextureRenderable> | null;

    abstract cycled(init: T): Generator<ITextureRenderable> | null;
}

/**
 * 行动画控制器，将贴图按照从上到下的顺序依次组成帧动画，创建时传入的参数代表帧数
 */
export class TextureRowAnimater extends FrameBasedAnimater<void> {
    *open(): Generator<ITextureRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width: w, height } = this.texture!;
        const h = height / this.frames;
        for (let i = 0; i < this.frames; i++) {
            const renderable: ITextureRenderable = {
                source: this.texture!.source,
                rect: this.texture!.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
        }
    }

    *cycled(): Generator<ITextureRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width: w, height } = this.texture!;
        const h = height / this.frames;
        let i = 0;
        while (true) {
            const renderable: ITextureRenderable = {
                source: this.texture!.source,
                rect: this.texture!.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
            i++;
            if (i === this.frames) i = 0;
        }
    }
}

/**
 * 列动画控制器，将贴图按照从左到右的顺序依次组成帧动画，创建时传入的参数代表帧数
 */
export class TextureColumnAnimater extends FrameBasedAnimater<void> {
    *open(): Generator<ITextureRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width, height: h } = this.texture!;
        const w = width / this.frames;
        for (let i = 0; i < this.frames; i++) {
            const renderable: ITextureRenderable = {
                source: this.texture!.source,
                rect: this.texture!.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
        }
    }

    *cycled(): Generator<ITextureRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width, height: h } = this.texture!;
        const w = width / this.frames;
        let i = 0;
        while (true) {
            const renderable: ITextureRenderable = {
                source: this.texture!.source,
                rect: this.texture!.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
            i++;
            if (i === this.frames) i = 0;
        }
    }
}

export interface IScanAnimaterCreate {
    /** 每帧的宽度 */
    readonly width: number;
    /** 每帧的高度 */
    readonly height: number;
    /** 总帧数 */
    readonly frames: number;
}

/**
 * 扫描动画控制器，会按照先从左到右，再从上到下的顺序依次输出，可以用于动画精灵图等
 */
export class TextureScanAnimater
    implements ITextureAnimater<IScanAnimaterCreate, void>
{
    texture: ITexture<IScanAnimaterCreate, void> | null = null;

    private width: number = 0;
    private height: number = 0;

    private frames: number = 0;
    private frameX: number = 0;
    private frameY: number = 0;

    create(texture: ITexture, data: IScanAnimaterCreate): void {
        if (this.texture) {
            logger.warn(70);
            return;
        }
        this.texture = texture;

        this.width = data.width;
        this.height = data.height;
        this.frames = data.frames;

        // 如果尺寸不匹配
        if (
            texture.width % data.width !== 0 ||
            texture.height % data.height !== 0
        ) {
            logger.warn(74);
        }

        const frameX = Math.floor(texture.width / data.width);
        const frameY = Math.floor(texture.height / data.height);
        const possibleFrames = frameX * frameY;

        // 如果传入的帧数超出了可能的帧数上限
        if (this.frames > possibleFrames) {
            this.frames = possibleFrames;
        }
    }

    *open(): Generator<ITextureRenderable, void> | null {
        const texture = this.texture;
        if (!texture) return null;

        const w = this.width;
        const h = this.height;

        for (let y = 0; y < this.frameY; y++) {
            for (let x = 0; x < this.frameX; x++) {
                const data: ITextureRenderable = {
                    source: texture.source,
                    rect: texture.clampRect({ x: x * w, y: y * h, w, h })
                };
                yield data;
            }
        }
    }

    *cycled(): Generator<ITextureRenderable, void> | null {
        const texture = this.texture;
        if (!texture) return null;

        const w = this.width;
        const h = this.height;

        let index = 0;
        while (true) {
            const x = index % this.frameX;
            const y = Math.floor(index / this.frameX);
            const data: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect({ x: x * w, y: y * h, w, h })
            };
            yield data;
            index++;
            if (index === this.frames) index = 0;
        }
    }
}
