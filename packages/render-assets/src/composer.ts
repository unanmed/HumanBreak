import {
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
    ITextureComposer,
    SizedCanvasImageSource
} from './types';
import vert from './shader/pack.vert?raw';
import frag from './shader/pack.frag?raw';
import { logger } from '@motajs/common';
import { isNil } from 'lodash-es';
import { compileProgramWith } from '@motajs/client-base';

interface IndexMarkedComposedData {
    /** 组合数据 */
    readonly asset: ITextureComposedData;
    /** 组合时最后一个用到的贴图的索引 */
    readonly index: number;
}

export interface IGridComposerData {
    /** 单个贴图的宽度，与之不同的贴图将会被剔除并警告 */
    readonly width: number;
    /** 单个贴图的宽度，与之不同的贴图将会被剔除并警告 */
    readonly height: number;
}

export class TextureGridComposer
    implements ITextureComposer<IGridComposerData>
{
    /**
     * 网格组合器，将等大小的贴图组合成图集，要求每个贴图的尺寸一致。
     * 组合时按照先从左到右，再从上到下的顺序组合。
     * @param maxWidth 图集最大宽度，也是输出纹理的宽度
     * @param maxHeight 图集最大高度，也是输出纹理的高度
     */
    constructor(
        readonly maxWidth: number,
        readonly maxHeight: number
    ) {}

    private nextAsset(
        tex: ITexture[],
        start: number,
        data: IGridComposerData,
        rows: number,
        cols: number,
        index: number
    ): IndexMarkedComposedData {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = this.maxWidth;
        canvas.height = this.maxHeight;

        const count = Math.min(rows * cols, tex.length - start);
        const map = new Map<ITexture, IRect>();

        let x = 0;
        let y = 0;
        for (let i = 0; i < count; i++) {
            const dx = x * data.width;
            const dy = y * data.height;
            const texture = tex[i + start];
            const renderable = texture.render();
            const { x: sx, y: sy, w: sw, h: sh } = renderable.rect;
            ctx.drawImage(renderable.source, sx, sy, sw, sh, dx, dy, sw, sh);
            map.set(texture, { x: dx, y: dy, w: sw, h: sh });
            x++;
            if (x === cols) {
                y++;
                x = 0;
            }
        }

        const texture = new Texture(canvas);
        const composed: ITextureComposedData = {
            index,
            texture,
            assetMap: map
        };

        return { asset: composed, index: start + count };
    }

    *compose(
        input: Iterable<ITexture>,
        data: IGridComposerData
    ): Generator<ITextureComposedData, void> {
        const arr = [...input];

        const rows = Math.floor(this.maxWidth / data.width);
        const cols = Math.floor(this.maxHeight / data.height);

        let arrindex = 0;
        let i = 0;

        while (arrindex < arr.length) {
            const res = this.nextAsset(arr, arrindex, data, rows, cols, i);
            arrindex = res.index + 1;
            i++;
            yield res.asset;
        }
    }
}

export interface IMaxRectsComposerData extends IOption {
    /** 贴图之间的间距 */
    readonly padding: number;
}

interface MaxRectsRectangle extends IRectangle {
    /** 这个矩形对应的贴图对象 */
    readonly data: ITexture;
}

export class TextureMaxRectsComposer
    implements ITextureComposer<IMaxRectsComposerData>
{
    /**
     * 使用 Max Rects 算法执行贴图整合，输入数据参考 {@link IMaxRectsComposerData}，
     * 输出的纹理的图像源将会是不同的画布，注意与 {@link TextureMaxRectsWebGL2Composer} 区分
     * @param maxWidth 图集最大宽度，也是输出纹理的宽度
     * @param maxHeight 图集最大高度，也是输出纹理的高度
     */
    constructor(
        public readonly maxWidth: number,
        public readonly maxHeight: number
    ) {}

    *compose(
        input: Iterable<ITexture>,
        data: IMaxRectsComposerData
    ): Generator<ITextureComposedData, void> {
        const packer = new MaxRectsPacker<MaxRectsRectangle>(
            this.maxWidth,
            this.maxHeight,
            data.padding,
            data
        );
        const arr = [...input];
        const rects = arr.map<MaxRectsRectangle>(v => {
            const rect = v.render().rect;
            const toPack = new Rectangle(rect.w, rect.h);
            toPack.data = v;
            return toPack;
        });
        packer.addArray(rects);

        let index = 0;
        for (const bin of packer.bins) {
            const map = new Map<ITexture, IRect>();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = this.maxWidth;
            canvas.height = this.maxHeight;
            ctx.imageSmoothingEnabled = false;
            bin.rects.forEach(v => {
                const rect: IRect = { x: v.x, y: v.y, w: v.width, h: v.height };
                map.set(v.data, rect);
                const renderable = v.data.render();
                const { x, y, w, h } = renderable.rect;
                const source = renderable.source;
                ctx.drawImage(source, x, y, w, h, v.x, v.y, v.width, v.height);
            });
            const texture = new Texture(canvas);
            const data: ITextureComposedData = {
                index: index++,
                texture,
                assetMap: map
            };
            yield data;
        }
    }
}

interface RectProcessed {
    /** 贴图位置映射 */
    readonly texMap: Map<ITexture, Readonly<IRect>>;
    /** 顶点数组 */
    readonly attrib: Float32Array;
}

export class TextureMaxRectsWebGL2Composer
    implements ITextureComposer<IMaxRectsComposerData>
{
    /** 使用的画布 */
    readonly canvas: HTMLCanvasElement;
    /** 画布上下文 */
    readonly gl: WebGL2RenderingContext;
    /** WebGL2 程序 */
    readonly program: WebGLProgram;
    /** 顶点数组缓冲区 */
    readonly vertBuffer: WebGLBuffer;
    /** 纹理数组对象 */
    readonly texArray: WebGLTexture;
    /** 纹理数组对象的位置 */
    readonly texArrayPos: WebGLUniformLocation;
    /** `a_position` 的索引 */
    readonly posPos: number;
    /** `a_texCoord` 的索引 */
    readonly texPos: number;

    /** 本次处理的贴图宽度 */
    private opWidth: number = 0;
    /** 本次处理的贴图高度 */
    private opHeight: number = 0;

    /**
     * 使用 Max Rects 算法执行贴图整合，使用 WebGL2 执行组合操作。
     * 输入数据参考 {@link IMaxRectsComposerData}，要求每个贴图的图像源尺寸一致，贴图大小可以不同。
     * 注意，本组合器同时只能处理一个组合操作，上一个没执行完的时候再次调用 `compose` 会出现问题。
     * 所有输出的内容中，贴图对象的图像源都是同一个画布，因此获取后要么直接使用，要么立刻调用 `toBitmap`,
     * 否则在下一次调用 `next` 时，图像源将会被覆盖。
     * @param maxWidth 图集最大宽度，也是输出纹理的宽度
     * @param maxHeight 图集最大高度，也是输出纹理的高度
     */
    constructor(
        public readonly maxWidth: number,
        public readonly maxHeight: number
    ) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        this.gl = this.canvas.getContext('webgl2')!;
        const { program } = compileProgramWith(this.gl, vert, frag)!;
        this.program = program;

        // 初始化画布数据

        const texture = this.gl.createTexture();
        this.texArray = texture;
        const location = this.gl.getUniformLocation(program, 'u_textArray')!;
        this.texArrayPos = location;

        this.posPos = this.gl.getAttribLocation(program, 'a_position');
        this.texPos = this.gl.getAttribLocation(program, 'a_texCoord');

        this.vertBuffer = this.gl.createBuffer();

        this.gl.useProgram(program);
    }

    /**
     * 对贴图进行索引
     * @param textures 贴图数组
     */
    private mapTextures(
        textures: ITexture[]
    ): Map<SizedCanvasImageSource, number> {
        const map = new Map<SizedCanvasImageSource, number>();
        const { width, height } = textures[0].source;

        textures.forEach(v => {
            const source = v.source;
            if (map.has(source)) return;
            if (source.width !== width || source.height !== height) {
                logger.warn(73);
                return;
            }
            map.set(source, map.size);
        });

        this.opWidth = width;
        this.opHeight = height;

        return map;
    }

    /**
     * 传递贴图
     * @param texMap 纹理映射
     */
    private setTexture(texMap: Map<SizedCanvasImageSource, number>) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texArray);

        gl.texStorage3D(
            gl.TEXTURE_2D_ARRAY,
            1,
            gl.RGBA8,
            this.opWidth,
            this.opHeight,
            texMap.size
        );
        texMap.forEach((index, source) => {
            gl.texSubImage3D(
                gl.TEXTURE_2D_ARRAY,
                0,
                0,
                0,
                index,
                this.opWidth,
                this.opHeight,
                1,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                source
            );
        });

        gl.texParameteri(
            gl.TEXTURE_2D_ARRAY,
            gl.TEXTURE_MAG_FILTER,
            gl.NEAREST
        );
        gl.texParameteri(
            gl.TEXTURE_2D_ARRAY,
            gl.TEXTURE_MIN_FILTER,
            gl.NEAREST
        );
        gl.texParameteri(
            gl.TEXTURE_2D_ARRAY,
            gl.TEXTURE_WRAP_S,
            gl.CLAMP_TO_EDGE
        );
        gl.texParameteri(
            gl.TEXTURE_2D_ARRAY,
            gl.TEXTURE_WRAP_T,
            gl.CLAMP_TO_EDGE
        );
    }

    /**
     * 处理矩形数组，生成 WebGL2 顶点数据
     * @param rects 要处理的矩形数组
     * @param texMap 贴图到贴图数组索引的映射
     */
    private processRects(
        rects: MaxRectsRectangle[],
        texMap: Map<SizedCanvasImageSource, number>
    ): RectProcessed {
        const { width: ow, height: oh } = this.canvas;
        const map = new Map<ITexture, IRect>();
        const attrib = new Float32Array(rects.length * 5 * 6);
        rects.forEach((v, i) => {
            const rect: IRect = { x: v.x, y: v.y, w: v.width, h: v.height };
            map.set(v.data, rect);
            const renderable = v.data.render();
            const { width: tw, height: th } = v.data.source;
            const { x, y, w, h } = renderable.rect;
            // 画到目标画布上的位置
            const ol = (v.x / ow) * 2 - 1;
            const ob = (v.y / oh) * 2 - 1;
            const or = ((v.x + v.width) / ow) * 2 - 1;
            const ot = ((v.y + v.height) / oh) * 2 - 1;
            // 原始贴图位置
            const tl = x / tw;
            const tt = y / tw;
            const tr = (x + w) / tw;
            const tb = (y + h) / th;
            // 贴图索引
            const ti = texMap.get(v.data.source);

            if (isNil(ti)) return;

            // Benchmark https://www.measurethat.net/Benchmarks/Show/35246/2/different-method-to-write-a-typedarray

            // prettier-ignore
            const data = [
            //  x   y        u   v   i
                ol, -ot,     tl, tt, ti, // 左上角
                ol, -ob,     tl, tb, ti, // 左下角
                or, -ot,     tr, tt, ti, // 右上角
                or, -ot,     tr, tt, ti, // 右上角
                ol, -ob,     tl, tb, ti, // 左下角
                or, -ob,     tr, tb, ti  // 右下角
            ];

            attrib.set(data, i * 30);
        });

        const data: RectProcessed = {
            texMap: map,
            attrib
        };
        return data;
    }

    /**
     * 执行渲染操作
     * @param attrib 顶点数组
     */
    private renderAtlas(attrib: Float32Array) {
        const gl = this.gl;

        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, attrib, gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(this.posPos, 2, gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(this.texPos, 3, gl.FLOAT, false, 5 * 4, 2 * 4);
        gl.enableVertexAttribArray(this.posPos);
        gl.enableVertexAttribArray(this.texPos);

        gl.uniform1i(this.texArrayPos, 0);

        gl.drawArrays(gl.TRIANGLES, 0, attrib.length / 5);
    }

    *compose(
        input: Iterable<ITexture>,
        data: IMaxRectsComposerData
    ): Generator<ITextureComposedData, void> {
        this.opWidth = 0;
        this.opHeight = 0;

        const packer = new MaxRectsPacker<MaxRectsRectangle>(
            this.maxWidth,
            this.maxHeight,
            data.padding,
            data
        );
        const arr = [...input];
        const rects = arr.map<MaxRectsRectangle>(v => {
            const rect = v.render().rect;
            const toPack = new Rectangle(rect.w, rect.h);
            toPack.data = v;
            return toPack;
        });
        packer.addArray(rects);

        const indexMap = this.mapTextures(arr);
        this.setTexture(indexMap);

        let index = 0;
        for (const bin of packer.bins) {
            const { texMap, attrib } = this.processRects(bin.rects, indexMap);
            this.renderAtlas(attrib);
            const texture = new Texture(this.canvas);
            const data: ITextureComposedData = {
                index: index++,
                texture,
                assetMap: texMap
            };
            yield data;
        }

        this.gl.disableVertexAttribArray(this.posPos);
        this.gl.disableVertexAttribArray(this.texPos);
    }
}
