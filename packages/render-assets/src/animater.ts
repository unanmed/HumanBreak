import { ITexture, ITextureAnimater, ITextureRenderable } from './types';

/**
 * 行动画控制器，将贴图按照从上到下的顺序依次组成帧动画，动画传入的参数代表帧数
 */
export class TextureRowAnimater implements ITextureAnimater<number> {
    *once(texture: ITexture, frames: number): Generator<ITextureRenderable> {
        if (frames <= 0) return;
        const renderable = texture.render();
        const { x: ox, y: oy } = renderable.rect;
        const { width: w, height } = texture!;
        const h = height / frames;
        for (let i = 0; i < frames; i++) {
            const renderable: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
        }
    }

    *cycled(texture: ITexture, frames: number): Generator<ITextureRenderable> {
        if (frames <= 0) return;
        const renderable = texture.render();
        const { x: ox, y: oy } = renderable.rect;
        const { width: w, height } = texture;
        const h = height / frames;
        let i = 0;
        while (true) {
            const renderable: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
            i++;
            if (i === frames) i = 0;
        }
    }
}

/**
 * 列动画控制器，将贴图按照从左到右的顺序依次组成帧动画，动画传入的参数代表帧数
 */
export class TextureColumnAnimater implements ITextureAnimater<number> {
    *once(texture: ITexture, frames: number): Generator<ITextureRenderable> {
        if (frames <= 0) return;
        const renderable = texture.render();
        const { x: ox, y: oy, w: width, h } = renderable.rect;
        const w = width / frames;
        for (let i = 0; i < frames; i++) {
            const renderable: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
        }
    }

    *cycled(texture: ITexture, frames: number): Generator<ITextureRenderable> {
        if (frames <= 0) return null;
        const renderable = texture.render();
        const { x: ox, y: oy } = renderable.rect;
        const { width, height: h } = texture;
        const w = width / frames;
        let i = 0;
        while (true) {
            const renderable: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect({ x: i * w + ox, y: oy, w, h })
            };
            yield renderable;
            i++;
            if (i === frames) i = 0;
        }
    }
}

export interface IScanAnimaterData {
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
    implements ITextureAnimater<IScanAnimaterData>
{
    *once(
        texture: ITexture,
        data: IScanAnimaterData
    ): Generator<ITextureRenderable, void> {
        const w = texture.width;
        const h = texture.height;

        let frame = 0;
        for (let y = 0; y < data.width; y++) {
            for (let x = 0; x < data.height; x++) {
                const renderable: ITextureRenderable = {
                    source: texture.source,
                    rect: texture.clampRect({ x: x * w, y: y * h, w, h })
                };
                yield renderable;
                frame++;
                if (frame === data.frames) break;
            }
        }
    }

    *cycled(
        texture: ITexture,
        data: IScanAnimaterData
    ): Generator<ITextureRenderable, void> {
        const w = texture.width;
        const h = texture.height;

        let index = 0;
        while (true) {
            const x = index % data.width;
            const y = Math.floor(index / data.height);
            const renderable: ITextureRenderable = {
                source: texture.source,
                rect: texture.clampRect({ x: x * w, y: y * h, w, h })
            };
            yield renderable;
            index++;
            if (index === data.frames) index = 0;
        }
    }
}
