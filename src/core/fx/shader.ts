import { Ticker } from 'mutate-animate';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import { loading } from '../loader/load';

interface ShaderEvent extends EmitableEvent {}

const isWebGLSupported = (() => {
    return !!document.createElement('canvas').getContext('webgl');
})();

type ShaderColorArray = [number, number, number, number];
type ShaderEffectImage = Exclude<TexImageSource, VideoFrame | ImageData>;

interface ProgramInfo {
    program: WebGLProgram;
    attrib: Record<string, number>;
    uniform: Record<string, WebGLUniformLocation>;
}

interface ShaderEffectBuffer {
    position: WebGLBuffer;
    texture: WebGLBuffer;
    indices: WebGLBuffer;
}

interface ShaderEffectShader {
    vertex: WebGLShader;
    fragment: WebGLShader;
}

interface MixedImage {
    canvas: HTMLCanvasElement;
    update(): void;
}

const builtinVs = `
#ifdef GL_ES
    precision highp float;
#endif

attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

varying highp vec2 vTextureCoord;
`;
const builtinFs = `
#ifdef GL_ES
    precision highp float;
#endif

varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;
`;

export class ShaderEffect extends EventEmitter<ShaderEvent> {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    program: WebGLProgram | null = null;
    texture: WebGLTexture | null = null;
    programInfo: ProgramInfo | null = null;
    buffer: ShaderEffectBuffer | null = null;
    shader: ShaderEffectShader | null = null;
    textureCanvas: MixedImage | null = null;

    private baseImages: ShaderEffectImage[] = [];
    private background: ShaderColorArray = [0, 0, 0, 0];

    private _vsSource: string = '';
    private _fsSource: string = '';

    get vsSource() {
        return builtinVs + this._vsSource;
    }
    get fsSource() {
        return builtinFs + this._fsSource;
    }

    constructor(background: ShaderColorArray) {
        super();
        this.canvas = document.createElement('canvas');
        if (!isWebGLSupported) {
            throw new Error(
                `Cannot initialize ShaderEffect, since your device does not support webgl.`
            );
        }
        this.gl = this.canvas.getContext('webgl')!;
        this.gl.clearColor(...background);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.background = background;
        const s = core.domStyle.scale * devicePixelRatio;
        this.canvas.width = s * core._PX_;
        this.canvas.height = s * core._PY_;
    }

    /**
     * 设置特效作用于的图片，不会修改原图片，而是会在 ShaderEffect.canvas 画布元素中展现
     * @param img 特效作用于的图片
     */
    baseImage(...img: ShaderEffectImage[]) {
        this.baseImages = img;
    }

    /**
     * 强制重新渲染特效
     * @param compile 是否重新编译着色器脚本，并重新创建纹理
     */
    update(compile: boolean = false) {
        const gl = this.gl;
        if (compile) {
            gl.deleteProgram(this.program);
            gl.deleteTexture(this.texture);
            gl.deleteBuffer(this.buffer?.position ?? null);
            gl.deleteBuffer(this.buffer?.texture ?? null);
            gl.deleteShader(this.shader?.vertex ?? null);
            gl.deleteShader(this.shader?.fragment ?? null);

            this.program = this.createProgram();
            this.programInfo = this.getProgramInfo();
            this.buffer = this.initBuffers();
            this.texture = this.createTexture();
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        }
        this.textureCanvas?.update();
        this.drawScene();
    }

    /**
     * 设置顶点着色器，使用 glsl 编写，插件提供了一些新的 api
     * 着色器中必须包含 main 函数，同时为 gl_Position 赋值
     * @param shader 顶点着色器代码
     */
    vs(shader: string) {
        this._vsSource = shader;
    }

    /**
     * 设置片元着色器，使用 glsl 编写，插件提供了一些新的 api
     * 着色器中必须包含 main 函数，同时为 gl_FragColor 赋值
     * @param shader 片元着色器代码
     */
    fs(shader: string) {
        this._fsSource = shader;
    }

    /**
     * 绘制特效
     */
    drawScene() {
        // 清空画布
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.clearColor(...this.background);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 设置顶点信息
        this.setPositionAttrib();
        this.setTextureAttrib();

        // 准备绘制
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer!.indices);
        gl.useProgram(this.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.textureCanvas!.canvas
        );
        gl.uniform1i(this.programInfo!.uniform.uSampler, 0);

        // 绘制
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    private createProgram() {
        const gl = this.gl;
        const vs = this.loadShader(gl.VERTEX_SHADER, this.vsSource);
        const fs = this.loadShader(gl.FRAGMENT_SHADER, this.fsSource);

        this.shader = {
            vertex: vs,
            fragment: fs
        };

        const program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(
                `Cannot initialize shader program. Error info: ${gl.getProgramInfoLog(
                    program
                )}`
            );
        }

        return program;
    }

    private loadShader(type: number, source: string) {
        const gl = this.gl;
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(
                `Cannot compile ${
                    type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
                } shader. Error info: ${gl.getShaderInfoLog(shader)}`
            );
        }

        return shader;
    }

    private createTexture() {
        const gl = this.gl;

        const img = mixImage(this.baseImages);
        this.textureCanvas = img;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img.canvas
        );
        gl.generateMipmap(gl.TEXTURE_2D);

        return texture;
    }

    private initBuffers(): ShaderEffectBuffer {
        const positions = new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]);
        const posBuffer = this.initBuffer(positions);
        const textureCoord = new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]);
        const textureBuffer = this.initBuffer(textureCoord);

        return (this.buffer = {
            position: posBuffer,
            texture: textureBuffer,
            indices: this.initIndexBuffer()
        });
    }

    private initBuffer(pos: Float32Array) {
        const gl = this.gl;
        const posBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);

        return posBuffer;
    }

    private initIndexBuffer() {
        const gl = this.gl;
        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        const indices = new Uint16Array([0, 1, 2, 2, 3, 1]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        return buffer;
    }

    private getProgramInfo(): ProgramInfo | null {
        if (!this.program) return null;
        const gl = this.gl;
        const pro = this.program;
        return (this.programInfo = {
            program: pro,
            attrib: {
                vertexPosition: gl.getAttribLocation(pro, 'aVertexPosition'),
                textureCoord: gl.getAttribLocation(pro, 'aTextureCoord')
            },
            uniform: {
                uSampler: gl.getUniformLocation(pro, 'uSampler')!
            }
        });
    }

    private setTextureAttrib() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer!.texture);
        gl.vertexAttribPointer(
            this.programInfo!.attrib.textureCoord,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(this.programInfo!.attrib.textureCoord);
    }

    private setPositionAttrib() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer!.position);
        gl.vertexAttribPointer(
            this.programInfo!.attrib.vertexPosition,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(this.programInfo!.attrib.vertexPosition);
    }

    static defaultVs: string = `
        void main() {
            vTextureCoord = aTextureCoord;
            gl_Position = aVertexPosition;
        }
    `;
    static defaultFs: string = `
        void main() {
            gl_FragColor = texture2D(uSampler, vTextureCoord);
        }
    `;
}

function floorPower2(value: number) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}

/**
 * 规范化 webgl 纹理图片，规范成2的幂的形式
 * @param img 要被规范化的图片
 */
function normalizeTexture(img: ShaderEffectImage) {
    const canvas = document.createElement('canvas');
    canvas.width = floorPower2(img.width);
    canvas.height = floorPower2(img.height);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function mixImage(imgs: ShaderEffectImage[]): MixedImage {
    // todo: 直接使用webgl纹理进行图片混合
    if (imgs.length === 0) {
        throw new Error(`Cannot mix images whose count is 0.`);
    }
    if (
        imgs.some(v => v.width !== imgs[0].width || v.height !== imgs[0].height)
    ) {
        throw new Error(`Cannot mix images with different size.`);
    }
    const canvas = document.createElement('canvas');
    canvas.width = floorPower2(imgs[0].width);
    canvas.height = floorPower2(imgs[0].height);
    const ctx = canvas.getContext('2d')!;
    imgs.forEach(v => {
        const img = normalizeTexture(v);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    });
    return {
        canvas,
        update() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            imgs.forEach(v => {
                const img = normalizeTexture(v);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            });
        }
    };
}

/**
 * 为一个着色器特效创建每帧更新的 ticker，部分条件下性能表现可能较差
 * @param effect 要每帧更新的着色器特效
 */
export function setTickerFor(effect: ShaderEffect) {
    const ticker = new Ticker();
    ticker.add(() => {
        effect.update();
    });

    return ticker;
}

export function replaceGameCanvas(effect: ShaderEffect, canvas: string[]) {
    let zIndex = 0;
    canvas.forEach(v => {
        const canvas = core.canvas[v].canvas;
        const z = parseInt(canvas.style.zIndex);
        if (z > zIndex) zIndex = z;
        canvas.style.display = 'none';
    });
    const gl = effect.canvas;
    gl.style.left = '0';
    gl.style.top = '0';
    gl.style.position = 'absolute';
    gl.style.zIndex = zIndex.toString();
    gl.style.display = 'block';
    gl.style.width = `${core._PX_ * core.domStyle.scale}px`;
    gl.style.height = `${core._PY_ * core.domStyle.scale}px`;
    core.dom.gameDraw.appendChild(gl);

    return {
        recover() {
            canvas.forEach(v => {
                const canvas = core.canvas[v].canvas;
                canvas.style.display = 'block';
            });
            gl.style.display = 'none';
        },
        append() {
            canvas.forEach(v => {
                const canvas = core.canvas[v].canvas;
                canvas.style.display = 'none';
            });
            gl.style.display = 'block';
        },
        remove() {
            this.recover();
            gl.remove();
        },
        update(compile?: boolean) {
            effect.update(compile);
        }
    };
}
