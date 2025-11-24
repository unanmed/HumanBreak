import { Texture } from './texture';
import { ITexture, ITextureSplitter, IRect } from './types';

/**
 * 按行分割贴图，即分割成一行行的贴图，按从上到下的顺序输出
 * 输入参数代表每一行的高度
 */
export class TextureRowSplitter implements ITextureSplitter<number> {
    *split(texture: ITexture, data: number): Generator<ITexture> {
        const lines = Math.ceil(texture.height / data);
        const { x, y } = texture.render().rect;
        for (let i = 0; i < lines; i++) {
            const tex = new Texture(texture.source);
            tex.clip(x, y + i * data, texture.width, data);
            yield tex;
        }
    }
}

/**
 * 按列分割贴图，即分割成一列列的贴图，按从左到右的顺序输出
 * 输入参数代表每一列的宽度
 */
export class TextureColumnSplitter implements ITextureSplitter<number> {
    *split(texture: ITexture, data: number): Generator<ITexture> {
        const lines = Math.ceil(texture.width / data);
        const { x, y } = texture.render().rect;
        for (let i = 0; i < lines; i++) {
            const tex = new Texture(texture.source);
            tex.clip(x + i * data, y, data, texture.height);
            yield tex;
        }
    }
}

/**
 * 按照网格分割贴图，按照先从左到右，再从上到下的顺序输出
 * 输入参数代表每一列的宽度和高度
 */
export class TextureGridSplitter implements ITextureSplitter<[number, number]> {
    *split(texture: ITexture, data: [number, number]): Generator<ITexture> {
        const [w, h] = data;
        const rows = Math.ceil(texture.width / w);
        const lines = Math.ceil(texture.height / h);
        const { x, y } = texture.render().rect;
        for (let ny = 0; ny < lines; ny++) {
            for (let nx = 0; nx < rows; nx++) {
                const tex = new Texture(texture.source);
                tex.clip(x + nx * w, y + ny * h, w, h);
                yield tex;
            }
        }
    }
}

/**
 * 根据图集信息分割贴图，按照传入的矩形数组的顺序输出
 * 输入参数代表每个贴图对应到图集上的矩形位置
 */
export class TextureAssetSplitter implements ITextureSplitter<IRect[]> {
    *split(texture: ITexture, data: IRect[]): Generator<ITexture> {
        for (const { x, y, w, h } of data) {
            const tex = new Texture(texture.source);
            tex.clip(x, y, w, h);
            yield tex;
        }
    }
}
