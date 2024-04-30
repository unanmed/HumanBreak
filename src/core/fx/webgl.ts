import { ensureArray, tip } from '@/plugin/utils';
import { sleep } from 'mutate-animate';
import { logger } from '../common/logger';

const { gl, gl2 } = checkSupport();

function checkSupport() {
    const canvas = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const gl2 = canvas2.getContext('webgl2');
    if (!gl) {
        sleep(3000).then(() => {
            tip(
                'warning',
                `您的浏览器不支持WebGL，大部分特效将会无法显示，建议使用新版浏览器`
            );
        });
    }
    if (!gl2) {
        sleep(3000).then(() => {
            tip(
                'warning',
                `您的浏览器不支持WebGL2，一部分特效将会无法显示，建议使用新版浏览器`
            );
        });
    }
    return { gl: !!gl, gl2: !!gl2 };
}

export function isWebGLSupported() {
    return gl;
}

export function isWebGL2Supported() {
    return gl2;
}

export type WebGLColorArray = [number, number, number, number];

interface WebGLShaderInfo {
    vertex: WebGLShader;
    fragment: WebGLShader;
}

type UniformBinderNum = 1 | 2 | 3 | 4;
type UniformBinderType = 'f' | 'i';
type UniformFunc<
    N extends UniformBinderNum,
    T extends UniformBinderType,
    V extends 'v' | ''
> = `uniform${N}${T}${V}`;

type UniformBinderValue<N extends UniformBinderNum> = N extends 1
    ? number
    : N extends 2
    ? [number, number]
    : N extends 3
    ? [number, number, number]
    : [number, number, number, number];

interface UniformBinder<
    N extends UniformBinderNum,
    T extends UniformBinderType,
    V extends 'v' | ''
> {
    value: UniformBinderValue<N>;
    set(value: UniformBinderValue<N>): void;
    get(): UniformBinderValue<N>;
}

abstract class WebGLBase {
    abstract canvas: HTMLCanvasElement;
    abstract gl: WebGLRenderingContext | WebGL2RenderingContext;

    background: WebGLColorArray = [0, 0, 0, 0];

    vsSource: string = '';
    fsSource: string = '';

    program: WebGLProgram | null = null;
    shader: WebGLShaderInfo | null = null;

    resetCanvas() {
        this.gl.clearColor(...this.background);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    setSize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    compile() {
        const gl = this.gl;
        gl.deleteProgram(this.program);
        gl.deleteShader(this.shader?.vertex ?? null);
        gl.deleteShader(this.shader?.fragment ?? null);

        this.program = this.createProgram();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.useProgram(this.program);
    }

    vs(vs: string) {
        this.vsSource = vs;
    }

    fs(fs: string) {
        this.fsSource = fs;
    }

    /**
     * 创建一个全局变量绑定器，用于操作全局变量
     * @param uniform 全局变量的变量名
     * @param num 变量的元素数量，float和int视为1，vec2 vec3 vec4分别视为 2 3 4
     * @param type 数据类型，可以填'f'，表示浮点型，或者填'i'，表示整型
     * @param vector 是否为向量，可以填'v'，表示是向量，或者填''，表示不是向量
     * @returns 一个uniform绑定器，用于操作全局变量uniform
     */
    createUniformBinder<
        N extends UniformBinderNum,
        T extends UniformBinderType,
        V extends 'v' | ''
    >(uniform: string, num: N, type: T, vector: V): UniformBinder<N, T, V> {
        if (!this.program) {
            throw new Error(
                `Uniform binder should be use when the program initialized.`
            );
        }

        const suffix = `${num}${type}${vector ? 'v' : ''}`;
        const func = `uniform${suffix}` as UniformFunc<N, T, V>;
        const value = (
            num === 1 ? 0 : Array(num).fill(0)
        ) as UniformBinderValue<N>;

        const loc = this.gl.getUniformLocation(this.program, uniform);
        const gl = this.gl;

        return {
            value,
            set(value) {
                this.value = value;
                let v;
                if (vector === 'v') {
                    let _v = ensureArray(value);
                    if (type === 'f') {
                        v = new Float32Array(_v);
                    } else {
                        v = new Int32Array(_v);
                    }
                } else {
                    v = ensureArray(value);
                }
                // 对uniform赋值
                if (vector === 'v') {
                    // @ts-ignore
                    gl[func](loc, v);
                } else {
                    // @ts-ignore
                    gl[func](loc, ...v);
                }
            },
            get() {
                return this.value;
            }
        };
    }

    protected createProgram() {
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
            logger.error(
                9,
                `Cannot initialize shader program. Error info: ${gl.getProgramInfoLog(
                    program
                )}`
            );
        }

        return program;
    }

    protected loadShader(type: number, source: string) {
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
}

export class WebGLCanvas extends WebGLBase {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    constructor(canvas?: HTMLCanvasElement) {
        super();
        this.canvas = canvas ?? document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl')!;
    }
}

export class WebGL2Canvas extends WebGLBase {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    constructor(canvas?: HTMLCanvasElement) {
        super();
        this.canvas = canvas ?? document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl2')!;
    }

    vs(vs: string): void {
        if (!vs.startsWith('#version 300 es')) {
            this.vsSource = `#version 300 es\n` + vs;
        } else {
            this.vsSource = vs;
        }
    }

    fs(fs: string): void {
        if (!fs.startsWith('#version 300 es')) {
            this.fsSource = `#version 300 es\n` + fs;
        } else {
            this.vsSource = fs;
        }
    }
}

export function loadShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        logger.error(
            10,
            `Cannot compile ${
                type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
            } shader. Error info: ${gl.getShaderInfoLog(shader)}`
        );
    }

    return shader;
}

export function createProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
) {
    const vs = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        logger.error(
            9,
            `Cannot initialize shader program. Error info: ${gl.getProgramInfoLog(
                program
            )}`
        );
    }

    return program;
}
