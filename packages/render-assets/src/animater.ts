import { logger } from '@motajs/common';
import {
    IRect,
    ITexture,
    ITextureAnimater,
    ITextureListedRenderable
} from './types';

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

    abstract open(init: T): Generator<ITextureListedRenderable> | null;

    abstract cycled(init: T): Generator<ITextureListedRenderable> | null;
}

/**
 * 行动画控制器，将贴图按照从上到下的顺序依次组成帧动画，创建时传入的参数代表帧数
 */
export class TextureRowAnimater extends FrameBasedAnimater<void> {
    *open(): Generator<ITextureListedRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width: w, height } = this.texture!;
        const h = height / this.frames;
        for (let i = 0; i < this.frames; i++) {
            const renderable: ITextureListedRenderable = {
                source: this.texture!.source,
                rect: [{ x: ox, y: i * h + oy, w, h }]
            };
            yield renderable;
        }
    }

    *cycled(): Generator<ITextureListedRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width: w, height } = this.texture!;
        const h = height / this.frames;
        let i = 0;
        while (true) {
            if (i === this.frames) i = 0;
            const renderable: ITextureListedRenderable = {
                source: this.texture!.source,
                rect: [{ x: ox, y: i * h + oy, w, h }]
            };
            yield renderable;
        }
    }
}

/**
 * 列动画控制器，将贴图按照从左到右的顺序依次组成帧动画，创建时传入的参数代表帧数
 */
export class TextureColumnAnimater extends FrameBasedAnimater<void> {
    *open(): Generator<ITextureListedRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width, height: h } = this.texture!;
        const w = width / this.frames;
        for (let i = 0; i < this.frames; i++) {
            const renderable: ITextureListedRenderable = {
                source: this.texture!.source,
                rect: [{ x: i * width + ox, y: oy, w, h }]
            };
            yield renderable;
        }
    }

    *cycled(): Generator<ITextureListedRenderable> | null {
        if (!this.check()) return null;
        const renderable = this.texture!.static();
        const { x: ox, y: oy } = renderable.rect;
        const { width, height: h } = this.texture!;
        const w = width / this.frames;
        let i = 0;
        while (true) {
            if (i === this.frames) i = 0;
            const renderable: ITextureListedRenderable = {
                source: this.texture!.source,
                rect: [{ x: i * w + ox, y: oy, w, h }]
            };
            yield renderable;
        }
    }
}

export interface IAnimaterTranslatedInit<T> {
    /** 以此矩形作为参考矩形 */
    readonly rect: Readonly<IRect>;
    /** 传递给原先的动画控制器的参数 */
    readonly data: T;
    /** 原本所属的纹理 */
    readonly texture: ITexture<unknown, T>;
}

type AdderImplements<T> = ITextureAnimater<void, IAnimaterTranslatedInit<T>>;

type AdderTexture<T> = ITexture<void, IAnimaterTranslatedInit<T>>;

/**
 * 对一个动画控制器执行偏移操作的控制器，一般用于图集上。
 * 创建时传入的参数代表要执行偏移操作的动画控制器，动画参数包含两部分，一个是参考矩形，一个是传递给原先动画控制器的参数
 */
export class TextureAnimaterTranslated<T> implements AdderImplements<T> {
    texture: AdderTexture<T> | null = null;

    create(texture: ITexture): void {
        this.texture = texture;
    }

    *output(
        ani: Generator<ITextureListedRenderable>,
        origin: Readonly<IRect>,
        rect: Readonly<IRect>
    ) {
        const { x: ox, y: oy } = origin;
        const { x: nx, y: ny } = rect;
        const source = this.texture!.source;

        while (true) {
            const next = ani.next();
            if (next.done) break;
            const renderable = next.value;
            const list: IRect[] = [];
            renderable.rect.forEach(({ x, y, w, h }) => {
                list.push({ x: x - ox + nx, y: y - oy + ny, w, h });
            });
            const res: ITextureListedRenderable = {
                source,
                rect: list
            };
            yield res;
        }
    }

    open(
        init: IAnimaterTranslatedInit<T>
    ): Generator<ITextureListedRenderable> | null {
        const ani = init.texture.dynamic(init.data);
        const origin = init.texture.static().rect;
        if (!ani || !origin) return null;
        return this.output(ani, origin, init.rect);
    }

    cycled(
        init: IAnimaterTranslatedInit<T>
    ): Generator<ITextureListedRenderable> | null {
        const ani = init.texture.cycled(init.data);
        const origin = init.texture.static().rect;
        if (!ani || !origin) return null;
        return this.output(ani, origin, init.rect);
    }
}
