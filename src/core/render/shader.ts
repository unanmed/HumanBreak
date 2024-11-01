import EventEmitter from 'eventemitter3';
import { logger } from '../common/logger';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { isWebGL2Supported } from '../fx/webgl';
import { Container } from './container';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from './item';
import { Transform } from './transform';

const SHADER_VERTEX_PREFIX_300 = /* glsl */ `#version 300 es
precision highp float;

in vec4 a_position;
in vec2 a_texCoord;

out highp vec2 v_texCoord;
`;
const SHADER_VERTEX_PREFIX_100 = /* glsl */ `
precision highp float;

attribute vec4 a_position;
attribute vec2 a_texCoord;

varying highp vec2 v_texCoord;
`;

const SHADER_FRAGMENT_PREFIX_300 = /* glsl */ `#version 300 es
precision highp float;

in highp vec2 v_texCoord;

uniform sampler2D u_sampler;
`;
const SHADER_FRAGMENT_PREFIX_100 = /* glsl */ `
precision highp float;

varying highp vec2 v_texCoord;

uniform sampler2D u_sampler;
`;

const DEFAULT_VS = /* glsl */ `
void main() {
    v_texCoord = a_texCoord;
    gl_Position = a_position;
}
`;
const DEFAULT_FS = /* glsl */ `
void main() {
    gl_FragColor = texture2D(u_sampler, v_texCoord);
}
`;

interface CompiledShader {
    vertex: WebGLShader;
    fragment: WebGLShader;
}

const enum ShaderVersion {
    ES_100,
    ES_300
}

export const enum UniformType {
    Uniform1f,
    Uniform1fv,
    Uniform1i,
    Uniform1iv,
    Uniform1ui,
    Uniform1uiv,
    Uniform2f,
    Uniform2fv,
    Uniform2i,
    Uniform2iv,
    Uniform2ui,
    Uniform2uiv,
    Uniform3f,
    Uniform3fv,
    Uniform3i,
    Uniform3iv,
    Uniform3ui,
    Uniform3uiv,
    Uniform4f,
    Uniform4fv,
    Uniform4i,
    Uniform4iv,
    Uniform4ui,
    Uniform4uiv
}

export const enum UniformMatrix {
    UMatrix2x2,
    UMatrix2x3,
    UMatrix2x4,
    UMatrix3x2,
    UMatrix3x3,
    UMatrix3x4,
    UMatrix4x2,
    UMatrix4x3,
    UMatrix4x4
}

export const enum AttribType {
    Attrib1f,
    Attrib1fv,
    Attrib2f,
    Attrib2fv,
    Attrib3f,
    Attrib3fv,
    Attrib4f,
    Attrib4fv,
    AttribI4i,
    AttribI4iv,
    AttribI4ui,
    AttribI4uiv
}

interface EShaderEvent extends ERenderItemEvent {}

export class Shader extends Container<EShaderEvent> {
    /** 是否支持此组件 */
    static readonly support: boolean = isWebGL2Supported();

    // 会用到的一些常量
    // 着色器版本
    readonly VERSION_ES_100: ShaderVersion.ES_100 = 0;
    readonly VERSION_ES_300: ShaderVersion.ES_300 = 1;
    // uniform 类型
    readonly UNIFORM_1f: UniformType.Uniform1f = UniformType.Uniform1f;
    readonly UNIFORM_1fv: UniformType.Uniform1fv = UniformType.Uniform1fv;
    readonly UNIFORM_1i: UniformType.Uniform1i = UniformType.Uniform1i;
    readonly UNIFORM_1iv: UniformType.Uniform1iv = UniformType.Uniform1iv;
    readonly UNIFORM_1ui: UniformType.Uniform1ui = UniformType.Uniform1ui;
    readonly UNIFORM_1uiv: UniformType.Uniform1uiv = UniformType.Uniform1uiv;
    readonly UNIFORM_2f: UniformType.Uniform2f = UniformType.Uniform2f;
    readonly UNIFORM_2fv: UniformType.Uniform2fv = UniformType.Uniform2fv;
    readonly UNIFORM_2i: UniformType.Uniform2i = UniformType.Uniform2i;
    readonly UNIFORM_2iv: UniformType.Uniform2iv = UniformType.Uniform2iv;
    readonly UNIFORM_2ui: UniformType.Uniform2ui = UniformType.Uniform2ui;
    readonly UNIFORM_2uiv: UniformType.Uniform2uiv = UniformType.Uniform2uiv;
    readonly UNIFORM_3f: UniformType.Uniform3f = UniformType.Uniform3f;
    readonly UNIFORM_3fv: UniformType.Uniform3fv = UniformType.Uniform3fv;
    readonly UNIFORM_3i: UniformType.Uniform3i = UniformType.Uniform3i;
    readonly UNIFORM_3iv: UniformType.Uniform3iv = UniformType.Uniform3iv;
    readonly UNIFORM_3ui: UniformType.Uniform3ui = UniformType.Uniform3ui;
    readonly UNIFORM_3uiv: UniformType.Uniform3uiv = UniformType.Uniform3uiv;
    readonly UNIFORM_4f: UniformType.Uniform4f = UniformType.Uniform4f;
    readonly UNIFORM_4fv: UniformType.Uniform4fv = UniformType.Uniform4fv;
    readonly UNIFORM_4i: UniformType.Uniform4i = UniformType.Uniform4i;
    readonly UNIFORM_4iv: UniformType.Uniform4iv = UniformType.Uniform4iv;
    readonly UNIFORM_4ui: UniformType.Uniform4ui = UniformType.Uniform4ui;
    readonly UNIFORM_4uiv: UniformType.Uniform4uiv = UniformType.Uniform4uiv;
    // uniform matrix 类型
    readonly U_MATRIX_2x2: UniformMatrix.UMatrix2x2 = UniformMatrix.UMatrix2x2;
    readonly U_MATRIX_2x3: UniformMatrix.UMatrix2x3 = UniformMatrix.UMatrix2x3;
    readonly U_MATRIX_2x4: UniformMatrix.UMatrix2x4 = UniformMatrix.UMatrix2x4;
    readonly U_MATRIX_3x2: UniformMatrix.UMatrix3x2 = UniformMatrix.UMatrix3x2;
    readonly U_MATRIX_3x3: UniformMatrix.UMatrix3x3 = UniformMatrix.UMatrix3x3;
    readonly U_MATRIX_3x4: UniformMatrix.UMatrix3x4 = UniformMatrix.UMatrix3x4;
    readonly U_MATRIX_4x2: UniformMatrix.UMatrix4x2 = UniformMatrix.UMatrix4x2;
    readonly U_MATRIX_4x3: UniformMatrix.UMatrix4x3 = UniformMatrix.UMatrix4x3;
    readonly U_MATRIX_4x4: UniformMatrix.UMatrix4x4 = UniformMatrix.UMatrix4x4;
    // attribute 类型
    readonly ATTRIB_1f: AttribType.Attrib1f = AttribType.Attrib1f;
    readonly ATTRIB_1fv: AttribType.Attrib1fv = AttribType.Attrib1fv;
    readonly ATTRIB_2f: AttribType.Attrib2f = AttribType.Attrib2f;
    readonly ATTRIB_2fv: AttribType.Attrib2fv = AttribType.Attrib2fv;
    readonly ATTRIB_3f: AttribType.Attrib3f = AttribType.Attrib3f;
    readonly ATTRIB_3fv: AttribType.Attrib3fv = AttribType.Attrib3fv;
    readonly ATTRIB_4f: AttribType.Attrib4f = AttribType.Attrib4f;
    readonly ATTRIB_4fv: AttribType.Attrib4fv = AttribType.Attrib4fv;
    readonly ATTRIB_I4i: AttribType.AttribI4i = AttribType.AttribI4i;
    readonly ATTRIB_I4iv: AttribType.AttribI4iv = AttribType.AttribI4iv;
    readonly ATTRIB_I4ui: AttribType.AttribI4ui = AttribType.AttribI4ui;
    readonly ATTRIB_I4uiv: AttribType.AttribI4uiv = AttribType.AttribI4uiv;
    // 其他常量
    readonly MAX_TEXTURE_COUNT: number = 0;

    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    /** 是否需要重新渲染着色器 */
    private shaderRenderDirty: boolean = true;

    /** webgl使用的程序 */
    private program: ShaderProgram | null = null;

    /** 当前渲染实例的所有着色器程序 */
    private programs: Set<ShaderProgram> = new Set();

    constructor(type: RenderItemPosition = 'static') {
        super(type, !Shader.support);

        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl2')!;
        if (!Shader.support) {
            this.canvas.width = 0;
            this.canvas.height = 0;
        } else {
            const num = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
            if (typeof num === 'number') {
                this.MAX_TEXTURE_COUNT = num;
            }
        }

        this.init();
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        if (!Shader.support || !this.program || !this.program.modified) {
            super.render(canvas, transform);
        } else {
            const compile = this.program.requestCompile();
            if (compile) {
                this.gl.useProgram(this.program.program);
            }

            if (this.cacheDirty) {
                const { ctx } = this.cache;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                super.render(this.cache, transform);
                ctx.restore();
                this.cacheDirty = false;
            }

            if (this.shaderRenderDirty) {
                this.drawScene();
                this.shaderRenderDirty = false;
            }

            canvas.ctx.drawImage(this.canvas, 0, 0, this.width, this.height);
        }
    }

    setHD(hd: boolean): void {
        super.setHD(hd);
        this.sizeGL(this.width, this.height);
    }

    size(width: number, height: number): void {
        super.size(width, height);
        this.sizeGL(width, height);
    }

    private sizeGL(width: number, height: number) {
        const ratio = this.highResolution ? devicePixelRatio : 1;
        const scale = ratio * core.domStyle.scale;
        this.canvas.width = width * scale;
        this.canvas.height = height * scale;
        this.shaderRenderDirty = true;
    }

    update(item?: RenderItem<any>): void {
        const isSelf = item === this && !this.cacheDirty;
        super.update(item);
        if (isSelf) this.cacheDirty = false;
        this.shaderRenderDirty = true;
    }

    drawScene() {
        const gl = this.gl;
        const program = this.program;
        if (!gl || !program) return;
        const ready = this.defaultReady() && program.ready();
        if (!ready) return;
        const indices = program.usingIndices;
        if (!indices) return;

        // 清空画布
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const pre = this.preDraw();
        if (!pre) {
            this.postDraw();
            return;
        }

        // 准备顶点索引
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.data);

        // 绘制
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        this.postDraw();
    }

    /**
     * 在本着色器内部渲染之前执行的渲染，如果返回false，则表示不进行内部渲染，但依然会执行 {@link postDraw}。
     * 继承本类，并复写此方法即可实现前置渲染功能
     */
    protected preDraw(): boolean {
        return true;
    }

    /**
     * 在本着色器内部渲染之后执行的渲染，即使preDraw返回false，本函数也会执行
     * 继承本类，并复写此方法即可实现后置渲染功能
     */
    protected postDraw() {}

    private defaultReady(): boolean {
        const program = this.program;
        if (!program) return false;
        const tex = program.getTexture('u_sampler');
        if (!tex) return false;
        const canvas = this.cache.canvas;
        if (tex.width === canvas.width && tex.height === canvas.height) {
            tex.sub(canvas, 0, 0, canvas.width, canvas.height);
        } else {
            tex.set(canvas);
        }
        return true;
    }

    /**
     * 切换着色器程序
     * @param program 着色器程序
     */
    useProgram(program: ShaderProgram) {
        if (!this.gl) return;
        if (program.element !== this) {
            logger.error(17);
            return;
        }
        if (this.program !== program) {
            this.program?.unload();
            this.program = program;
            this.gl.useProgram(program.program);
            program.load();
        }
        this.shaderRenderDirty = true;
    }

    /**
     * 创建一个着色器程序
     * @param vs 顶点着色器，可选
     * @param fs 片元着色器，可选
     */
    createProgram(vs?: string, fs?: string) {
        const program = new ShaderProgram(this, vs, fs);
        this.programs.add(program);
        return program;
    }

    /**
     * 删除一个着色器程序
     * @param program 要删除的着色器程序
     */
    deleteProgram(program: ShaderProgram) {
        if (program.element !== this) {
            logger.error(18);
            return;
        }
        program.destroy();
        this.programs.delete(program);
    }

    destroy(): void {
        this.programs.forEach(v => v.destroy());
        super.destroy();
    }

    // ----- 初始化部分

    private init() {
        const gl = this.gl;
        if (!gl) return;
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }
}

type _U1 = [x0: number];
type _U2 = [x0: number, x1: number];
type _U3 = [x0: number, x1: number, x2: number];
type _U4 = [x0: number, x1: number, x2: number, x3: number];
type _UV<T> = [data: T, srcOffset?: number, srcLength?: number];
type _A<T> = [data: T];

interface UniformSetFn {
    [UniformType.Uniform1f]: _U1;
    [UniformType.Uniform1fv]: _UV<Float32List>;
    [UniformType.Uniform1i]: _U1;
    [UniformType.Uniform1iv]: _UV<Int32List>;
    [UniformType.Uniform1ui]: _U1;
    [UniformType.Uniform1uiv]: _UV<Uint32List>;
    [UniformType.Uniform2f]: _U2;
    [UniformType.Uniform2fv]: _UV<Float32List>;
    [UniformType.Uniform2i]: _U2;
    [UniformType.Uniform2iv]: _UV<Int32List>;
    [UniformType.Uniform2ui]: _U2;
    [UniformType.Uniform2uiv]: _UV<Uint32List>;
    [UniformType.Uniform3f]: _U3;
    [UniformType.Uniform3fv]: _UV<Float32List>;
    [UniformType.Uniform3i]: _U3;
    [UniformType.Uniform3iv]: _UV<Int32List>;
    [UniformType.Uniform3ui]: _U3;
    [UniformType.Uniform3uiv]: _UV<Uint32List>;
    [UniformType.Uniform4f]: _U4;
    [UniformType.Uniform4fv]: _UV<Float32List>;
    [UniformType.Uniform4i]: _U4;
    [UniformType.Uniform4iv]: _UV<Int32List>;
    [UniformType.Uniform4ui]: _U4;
    [UniformType.Uniform4uiv]: _UV<Uint32List>;
}

interface AttribSetFn {
    [AttribType.Attrib1f]: _U1;
    [AttribType.Attrib1fv]: _A<Float32List>;
    [AttribType.Attrib2f]: _U2;
    [AttribType.Attrib2fv]: _A<Float32List>;
    [AttribType.Attrib3f]: _U3;
    [AttribType.Attrib3fv]: _A<Float32List>;
    [AttribType.Attrib4f]: _U4;
    [AttribType.Attrib4fv]: _A<Float32List>;
    [AttribType.AttribI4i]: _U4;
    [AttribType.AttribI4iv]: _A<Int32List>;
    [AttribType.AttribI4ui]: _U4;
    [AttribType.AttribI4uiv]: _A<Uint32List>;
}

interface IShaderUniform<T extends UniformType> {
    /** 这个 uniform 变量的内存位置 */
    readonly location: WebGLUniformLocation;
    /** 这个 uniform 变量的类型 */
    readonly type: T;
    /**
     * 设置这个 uniform 变量的值，
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/uniform
     * @param params 要传递的参数，例如 uniform2f 就要传递 x0 x1 两个参数等，可以参考 mdn 文档
     */
    set(...params: UniformSetFn[T]): void;
}

interface IShaderAttrib<T extends AttribType> {
    /** 这个 attribute 常量的内存位置 */
    readonly location: number;
    /** 这个 attribute 常量的类型 */
    readonly type: T;
    /**
     * 设置这个 attribute 常量的值，
     * 浮点数参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttrib
     * 整数参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribI
     * @param params 要传递的参数
     */
    set(...params: AttribSetFn[T]): void;
}

interface IShaderAttribArray {
    /** 这个 attribute 常量的内存位置 */
    readonly location: number;
    /** 这个 attribute 所用的缓冲区信息 */
    readonly data: WebGLBuffer;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     */
    buffer(data: AllowSharedBufferSource | null, usage: GLenum): void;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    buffer(
        data: ArrayBufferView,
        usage: GLenum,
        srcOffset: number,
        length?: number
    ): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     */
    sub(dstByteOffset: GLintptr, srcData: AllowSharedBufferSource): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    sub(
        dstByteOffset: GLintptr,
        srcData: ArrayBufferView,
        srcOffset: number,
        length?: GLuint
    ): void;
    /**
     * 告诉 gpu 将读取此 attribute 数据
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     * @param size 单个数据大小
     * @param type 数据类型
     * @param normalized 是否要经过归一化处理
     * @param stride 每一部分字节偏移量
     * @param offset 第一部分字节偏移量
     */
    pointer(
        size: GLint,
        type: GLenum,
        normalized: GLboolean,
        stride: GLsizei,
        offset: GLintptr
    ): void;
    /**
     * 告诉 gpu 将由整数类型读取此 attribute 数据
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer
     * @param size 单个数据大小
     * @param type 数据类型
     * @param stride 每一部分字节偏移量
     * @param offset 第一部分字节偏移量
     */
    pointerI(
        size: GLint,
        type: GLenum,
        stride: GLsizei,
        offset: GLintptr
    ): void;
    /**
     * 启用这个顶点数据
     */
    enable(): void;
    /**
     * 禁用这个顶点数据
     */
    disable(): void;
}

interface IShaderIndices {
    /** 这个顶点索引所用的缓冲区信息 */
    readonly data: WebGLBuffer;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     */
    buffer(data: AllowSharedBufferSource | null, usage: GLenum): void;
    /**
     * 修改缓冲区数据，会更改数据大小，重新分配内存，不更改数据大小的情况下建议使用 {@link sub} 代替。
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     * @param data 数据
     * @param usage 用途
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    buffer(
        data: ArrayBufferView,
        usage: GLenum,
        srcOffset: number,
        length?: number
    ): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     */
    sub(dstByteOffset: GLintptr, srcData: AllowSharedBufferSource): void;
    /**
     * 修改缓冲区数据，但是不修改数据大小，不重新分配内存。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     * @param dstByteOffset 数据修改的起始位置
     * @param srcData 数据
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    sub(
        dstByteOffset: GLintptr,
        srcData: ArrayBufferView,
        srcOffset: number,
        length?: GLuint
    ): void;
}

interface IShaderUniformMatrix {
    /** 矩阵的内存位置 */
    readonly location: WebGLUniformLocation;
    /** 矩阵类型 */
    readonly type: UniformMatrix;
    /**
     * 设置矩阵的值，参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/uniformMatrix
     * @param transpose 是否转置矩阵
     * @param data 矩阵数据，列主序
     * @param srcOffset 数据偏移量
     * @param srcLength 数据长度
     */
    set(
        transpose: GLboolean,
        data: Float32List,
        srcOffset?: number,
        srcLength?: number
    ): void;
}

interface IShaderUniformBlock {
    /** 这个 uniform block 的内存地址 */
    location: GLuint;
    /** 与这个 uniform block 所绑定的缓冲区 */
    buffer: WebGLBuffer;
    /** 这个 uniform block 的大小 */
    size: number;
    /**
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/bindBufferBase
     * @param srcData 要设置为的值
     */
    set(srcData: AllowSharedBufferSource | null): void;
    /**
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/bindBufferBase
     * @param srcData 要设置为的值
     * @param srcOffset 数据偏移量
     * @param length 数据长度
     */
    set(srcData: ArrayBufferView, srcOffset: number, length?: number): void;
}

interface IShaderTexture2D {
    /** 纹理对象 */
    readonly texture: WebGLTexture;
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 纹理所属索引 */
    readonly index: number;
    /**
     * 设置这个纹理的图像，不建议使用，会修改宽高
     * @param source 要设置成的图像源
     */
    set(source: TexImageSource): void;
    /**
     * 设置纹理的一部分信息，不会修改宽高
     * @param source 要设置的图像源
     * @param x 要设置到的起始点横坐标
     * @param y 要设置到的起始点纵坐标
     * @param width 宽度
     * @param height 高度
     */
    sub(
        source: TexImageSource,
        x: number,
        y: number,
        width: number,
        height: number
    ): void;
}

class ShaderUniform<T extends UniformType> implements IShaderUniform<T> {
    constructor(
        readonly type: T,
        readonly location: WebGLUniformLocation,
        readonly gl: WebGL2RenderingContext
    ) {}

    set(...params: UniformSetFn[T]): void {
        this.gl.vertexAttribIPointer;
        // 因为ts类型推导的限制，类型肯定正确，但是推导不出，所以这里直接 as any 屏蔽掉类型推导
        const x0 = params[0] as any;
        const x1 = params[1] as any;
        const x2 = params[2] as any;
        const x3 = params[3] as any;
        switch (this.type) {
            case UniformType.Uniform1f:
                this.gl.uniform1f(this.location, x0);
                break;
            case UniformType.Uniform1fv:
                this.gl.uniform1fv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform1i:
                this.gl.uniform1i(this.location, x0);
                break;
            case UniformType.Uniform1iv:
                this.gl.uniform1iv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform1ui:
                this.gl.uniform1ui(this.location, x0);
                break;
            case UniformType.Uniform1uiv:
                this.gl.uniform1uiv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform2f:
                this.gl.uniform2f(this.location, x0, x1);
                break;
            case UniformType.Uniform2fv:
                this.gl.uniform2fv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform2i:
                this.gl.uniform2i(this.location, x0, x1);
                break;
            case UniformType.Uniform2iv:
                this.gl.uniform2iv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform2ui:
                this.gl.uniform2ui(this.location, x0, x1);
                break;
            case UniformType.Uniform2uiv:
                this.gl.uniform2uiv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform3f:
                this.gl.uniform3f(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform3fv:
                this.gl.uniform3fv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform3i:
                this.gl.uniform3i(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform3iv:
                this.gl.uniform3iv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform3ui:
                this.gl.uniform3ui(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform3uiv:
                this.gl.uniform3uiv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform4f:
                this.gl.uniform4f(this.location, x0, x1, x2, x3);
                break;
            case UniformType.Uniform4fv:
                this.gl.uniform4fv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform4i:
                this.gl.uniform4i(this.location, x0, x1, x2, x3);
                break;
            case UniformType.Uniform4iv:
                this.gl.uniform4iv(this.location, x0, x1, x2);
                break;
            case UniformType.Uniform4ui:
                this.gl.uniform4ui(this.location, x0, x1, x2, x3);
                break;
            case UniformType.Uniform4uiv:
                this.gl.uniform4uiv(this.location, x0, x1, x2);
                break;
        }
    }
}

class ShaderAttrib<T extends AttribType> implements IShaderAttrib<T> {
    constructor(
        readonly type: T,
        readonly location: number,
        readonly gl: WebGL2RenderingContext
    ) {}

    set(...params: AttribSetFn[T]) {
        // 因为ts类型推导的限制，类型肯定正确，但是推导不出，所以这里直接 as any 屏蔽掉类型推导
        const x0 = params[0] as any;
        const x1 = params[1] as any;
        const x2 = params[2] as any;
        const x3 = params[3] as any;
        switch (this.type) {
            case AttribType.Attrib1f:
                this.gl.vertexAttrib1f(this.location, x0);
                break;
            case AttribType.Attrib1fv:
                this.gl.vertexAttrib1fv(this.location, x0);
                break;
            case AttribType.Attrib2f:
                this.gl.vertexAttrib2f(this.location, x0, x1);
                break;
            case AttribType.Attrib2fv:
                this.gl.vertexAttrib2fv(this.location, x0);
                break;
            case AttribType.Attrib3f:
                this.gl.vertexAttrib3f(this.location, x0, x1, x2);
                break;
            case AttribType.Attrib3fv:
                this.gl.vertexAttrib3fv(this.location, x0);
                break;
            case AttribType.Attrib4f:
                this.gl.vertexAttrib4f(this.location, x0, x1, x2, x3);
                break;
            case AttribType.Attrib4fv:
                this.gl.vertexAttrib4fv(this.location, x0);
                break;
            case AttribType.AttribI4i:
                this.gl.vertexAttribI4i(this.location, x0, x1, x2, x3);
                break;
            case AttribType.AttribI4iv:
                this.gl.vertexAttribI4iv(this.location, x0);
                break;
            case AttribType.AttribI4ui:
                this.gl.vertexAttribI4ui(this.location, x0, x1, x2, x3);
                break;
            case AttribType.AttribI4uiv:
                this.gl.vertexAttribI4uiv(this.location, x0);
                break;
            default: {
                logger.warn(26);
                return;
            }
        }
    }
}

class ShaderAttribArray implements IShaderAttribArray {
    constructor(
        readonly data: WebGLBuffer,
        readonly location: number,
        readonly gl: WebGL2RenderingContext
    ) {}

    buffer(data: AllowSharedBufferSource | null, usage: GLenum): void;
    buffer(
        data: ArrayBufferView,
        usage: GLenum,
        srcOffset: number,
        length?: number
    ): void;
    buffer(data: any, usage: any, srcOffset?: any, length?: any): void {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.data);
        if (typeof srcOffset === 'number') {
            gl.bufferData(gl.ARRAY_BUFFER, data, usage, srcOffset, length);
        } else {
            gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        }
    }

    sub(dstByteOffset: GLintptr, srcData: AllowSharedBufferSource): void;
    sub(
        dstByteOffset: GLintptr,
        srcData: ArrayBufferView,
        srcOffset: number,
        length?: GLuint
    ): void;
    sub(dstOffset: any, data: any, offset?: any, length?: any): void {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.data);
        if (typeof offset === 'number') {
            gl.bufferSubData(gl.ARRAY_BUFFER, dstOffset, data, offset, length);
        } else {
            gl.bufferSubData(gl.ARRAY_BUFFER, dstOffset, data);
        }
    }

    pointer(
        p0: GLint,
        p1: GLenum,
        p2: GLboolean,
        p3: GLsizei,
        p4: GLintptr
    ): void {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.data);
        gl.vertexAttribPointer(this.location, p0, p1, p2, p3, p4);
    }

    pointerI(
        size: GLint,
        type: GLenum,
        stride: GLsizei,
        offset: GLintptr
    ): void {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.data);
        gl.vertexAttribIPointer(this.location, size, type, stride, offset);
    }

    enable(): void {
        this.gl.enableVertexAttribArray(this.location);
    }

    disable(): void {
        this.gl.disableVertexAttribArray(this.location);
    }
}

class ShaderIndices implements IShaderIndices {
    constructor(
        readonly data: WebGLBuffer,
        readonly gl: WebGL2RenderingContext
    ) {}

    buffer(data: AllowSharedBufferSource | null, usage: GLenum): void;
    buffer(
        data: ArrayBufferView,
        usage: GLenum,
        srcOffset: number,
        length?: number
    ): void;
    buffer(p0: any, p1: any, p2?: any, p3?: any): void {
        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.data);
        if (typeof p2 === 'number') {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, p0, p1, p2, p3);
        } else {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, p0, p1);
        }
    }

    sub(dstByteOffset: GLintptr, srcData: AllowSharedBufferSource): void;
    sub(
        dstByteOffset: GLintptr,
        srcData: ArrayBufferView,
        srcOffset: number,
        length?: GLuint
    ): void;
    sub(p0: any, p1: any, p2?: any, p3?: any): void {
        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.data);
        if (typeof p2 === 'number') {
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, p0, p1, p2, p3);
        } else {
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, p0, p1);
        }
    }
}

class ShaderUniformMatrix implements IShaderUniformMatrix {
    constructor(
        readonly type: UniformMatrix,
        readonly location: WebGLUniformLocation,
        readonly gl: WebGL2RenderingContext
    ) {}

    set(x2: GLboolean, x3: Float32List, x4?: number, x5?: number): void {
        switch (this.type) {
            case UniformMatrix.UMatrix2x2:
                this.gl.uniformMatrix2fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix2x3:
                this.gl.uniformMatrix2x3fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix2x4:
                this.gl.uniformMatrix2x4fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix3x2:
                this.gl.uniformMatrix3x2fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix3x3:
                this.gl.uniformMatrix3fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix3x4:
                this.gl.uniformMatrix3x4fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix4x2:
                this.gl.uniformMatrix4x2fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix4x3:
                this.gl.uniformMatrix4x3fv(this.location, x2, x3, x4, x5);
                break;
            case UniformMatrix.UMatrix4x4:
                this.gl.uniformMatrix4fv(this.location, x2, x3, x4, x5);
                break;
        }
    }
}

class ShaderUniformBlock implements IShaderUniformBlock {
    constructor(
        readonly location: number,
        readonly size: number,
        readonly buffer: WebGLBuffer,
        readonly binding: number,
        readonly gl: WebGL2RenderingContext
    ) {}

    set(srcData: AllowSharedBufferSource | null): void;
    set(srcData: ArrayBufferView, srcOffset: number, length?: number): void;
    set(srcData: unknown, srcOffset?: unknown, length?: unknown): void {
        const gl = this.gl;
        const buffer = this.buffer;
        gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
        if (srcOffset !== void 0) {
            // @ts-ignore
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, srcData, srcOffset, length);
        } else {
            // @ts-ignore
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, srcData);
        }
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.binding, buffer);
    }
}

class ShaderTexture2D implements IShaderTexture2D {
    constructor(
        readonly texture: WebGLTexture,
        readonly index: number,
        readonly uniform: IShaderUniform<UniformType.Uniform1i>,
        readonly gl: WebGL2RenderingContext,
        public width: number = 0,
        public height: number = 0
    ) {
        uniform.set(index);
    }

    set(source: TexImageSource): void {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + this.index);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source
        );
        if (source instanceof VideoFrame) {
            this.width = source.codedWidth;
            this.height = source.codedHeight;
        } else {
            this.width = source.width;
            this.height = source.height;
        }
    }

    sub(
        source: TexImageSource,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + this.index);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // 进行边界检查，避免超出纹理边界
        if (x + width > this.width || y + height > this.height) {
            logger.warn(32);
            width = Math.min(width, this.width - x);
            height = Math.min(height, this.height - y);
        }
        console.log(1);

        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            x,
            y,
            width,
            height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source
        );
    }
}

interface ShaderProgramEvent {
    load: [];
    unload: [];
}

export class ShaderProgram extends EventEmitter<ShaderProgramEvent> {
    /** 顶点着色器 */
    private vertex: string = DEFAULT_VS;
    /** 片元着色器 */
    private fragment: string = DEFAULT_FS;
    /** glsl版本 */
    version: ShaderVersion;
    /** webgl2上下文 */
    gl: WebGL2RenderingContext;
    /** 当前着色器程序的着色器渲染元素 */
    element: Shader;

    /** uniform存放地址 */
    private uniform: Map<string, IShaderUniform<UniformType>> = new Map();
    /** attribute存放地址，300版本里面叫做in */
    private attribute: Map<string, IShaderAttrib<AttribType>> = new Map();
    /** attribute array 存放地址 */
    private attribArray: Map<string, IShaderAttribArray> = new Map();
    /** 顶点索引存放地址 */
    private indices: Map<string, IShaderIndices> = new Map();
    /** uniform矩阵存放地址 */
    private matrix: Map<string, IShaderUniformMatrix> = new Map();
    /** uniform block 存放地址 */
    private block: Map<string, IShaderUniformBlock> = new Map();
    /** 纹理存放地址 */
    private texture: Map<string, IShaderTexture2D> = new Map();
    /** 当前编译完成的shader程序 */
    private shader: CompiledShader | null = null;
    /** 当前的webgl程序 */
    program: WebGLProgram | null = null;
    /** 准备函数 */
    private readyFn?: () => boolean;
    /** 当前正在使用的顶点索引数组 */
    usingIndices: IShaderIndices | null = null;

    /** 着色器内容是否是默认内容，可以用于优化空着色器 */
    modified: boolean = false;

    /** 是否需要重新编译着色器 */
    private shaderDirty: boolean = true;

    constructor(shader: Shader, vs?: string, fs?: string) {
        super();
        if (vs) this.vs(vs);
        if (fs) this.fs(fs);
        this.element = shader;
        this.gl = shader.gl;
        this.version = shader.VERSION_ES_100;
        if (vs || fs) this.requestCompile();
    }

    /**
     * 使用这个着色器程序时，在渲染之前执行的准备函数
     * @param fn 准备函数，返回 false 时将不执行绘制
     */
    setReady(fn: () => boolean) {
        this.readyFn = fn;
    }

    /**
     * 执行准备函数
     */
    ready(): boolean {
        return this.readyFn?.() ?? true;
    }

    /**
     * 切换渲染时使用的顶点索引
     * @param name 要使用的顶点索引名称
     */
    useIndices(name: string): void;
    useIndices(name: IShaderIndices): void;
    useIndices(name: string | IShaderIndices) {
        if (typeof name === 'string') {
            const indices = this.getIndices(name);
            if (!indices) {
                logger.warn(30, name);
                return;
            }
            this.usingIndices = indices;
        } else {
            if ([...this.indices.values()].includes(name)) {
                this.usingIndices = name;
            } else {
                logger.warn(31);
            }
        }
    }

    /**
     * 设置着色器使用的glsl版本，默认使用100版本，注意切换后一定要重新设置着色器内容
     * @param version glsl版本，可选 {@link Shader.VERSION_ES_100} 或 {@link Shader.VERSION_ES_300}
     */
    setVersion(version: ShaderVersion) {
        this.version = version;
    }

    /**
     * 检查当前是否需要重新编译着色器，如果需要，则重新编译
     * @param force 是否强制重新编译
     */
    requestCompile(force: boolean = false): boolean {
        if (!force && !this.shaderDirty) return false;
        return this.compile();
    }

    /**
     * 设置顶点着色器内容
     * @param vs 顶点着色器
     */
    vs(vs: string) {
        this.vertex = vs;
        this.shaderDirty = true;
        this.modified = true;
    }

    /**
     * 设置片元着色器内容
     * @param fs 片元着色器
     */
    fs(fs: string) {
        this.fragment = fs;
        this.shaderDirty = true;
        this.modified = true;
    }

    /**
     * 当这个程序被卸载时执行的函数
     */
    unload() {
        this.attribArray.forEach(v => {
            v.disable();
        });
        this.emit('load');
    }

    /**
     * 当这个程序被加载（使用）时执行的函数
     */
    load() {
        this.attribArray.forEach(v => {
            v.enable();
        });
        this.emit('unload');
    }

    /**
     * 获取一个uniform，需要事先定义，否则返回null
     * @param uniform uniform名称
     */
    getUniform<T extends UniformType = UniformType>(
        uniform: string
    ): IShaderUniform<T> | null {
        return (this.uniform.get(uniform) as IShaderUniform<T>) ?? null;
    }

    /**
     * 获取一个attribute，需要事先定义，否则返回null
     * @param attrib attribute名称
     */
    getAttribute<T extends AttribType = AttribType>(
        attrib: string
    ): IShaderAttrib<T> | null {
        return (this.attribute.get(attrib) as IShaderAttrib<T>) ?? null;
    }

    /**
     * 获取一个attribute array，需要事先定义，否则返回null
     * @param name attribute array名称
     */
    getAttribArray(name: string): IShaderAttribArray | null {
        return this.attribArray.get(name) ?? null;
    }

    /**
     * 获取一个顶点索引数组，需要提前定义，否则返回null
     * @param name 顶点索引数组的名称
     */
    getIndices(name: string): IShaderIndices | null {
        return this.indices.get(name) ?? null;
    }

    /**
     * 获取一个 uniform matrix，需要事先定义，否则返回null
     * @param matrix uniform matrix 的名称
     */
    getMatrix(matrix: string): IShaderUniformMatrix | null {
        return this.matrix.get(matrix) ?? null;
    }

    /**
     * 获取一个 uniform block，例如 UBO，需要事先定义，否则返回null
     * @param block uniform block 的名称
     */
    getUniformBlock(block: string): IShaderUniformBlock | null {
        return this.block.get(block) ?? null;
    }

    /**
     * 获取一个 texture，需要事先定义，否则返回null
     * @param name texture 的名称
     */
    getTexture(name: string): IShaderTexture2D | null {
        return this.texture.get(name) ?? null;
    }

    /**
     * 定义一个 uniform 变量，并存入本着色器程序的 uniform 变量映射
     * @param uniform uniform 变量名
     * @param type uniform 类型，可选 {@link Shader.UNIFORM_1f} 至 {@link Shader.UNIFORM_4uiv}
     * @returns uniform 变量的操作对象，可用于设置其值
     */
    defineUniform<T extends UniformType>(
        uniform: string,
        type: T
    ): IShaderUniform<T> | null {
        const u = this.getUniform<T>(uniform);
        if (u) {
            if (u.type === type) return u;
            else {
                logger.warn(28, 'uniform', uniform);
                return null;
            }
        }
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const location = gl.getUniformLocation(program, uniform);
        if (!location) return null;
        const obj = new ShaderUniform(type, location, gl);
        this.uniform.set(uniform, obj);
        return obj;
    }

    /**
     * 定义一个 uniform 矩阵变量，并存入本着色器程序的 uniform 矩阵变量映射
     * @param uniform uniform 矩阵变量名
     * @param type uniform 矩阵类型，可选 {@link Shader.U_MATRIX_2x2} 至 {@link Shader.U_MATRIX_4x4}
     * @returns uniform 矩阵变量的操作对象，可用于设置其值
     */
    defineUniformMatrix(
        uniform: string,
        type: UniformMatrix
    ): IShaderUniformMatrix | null {
        const u = this.getMatrix(uniform);
        if (u) {
            if (u.type === type) return u;
            else {
                logger.warn(28, 'uniform matrix', uniform);
                return null;
            }
        }
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const location = gl.getUniformLocation(program, uniform);
        if (!location) return null;
        const obj = new ShaderUniformMatrix(type, location, gl);
        this.matrix.set(uniform, obj);
        return obj;
    }

    /**
     * 定义一个 attribute 常量，并存入本着色器程序的 attribute 常量映射，在 es 300 版本中叫做 in
     * @param attrib attribute 常量名
     * @param type attribute 类型，可选 {@link Shader.Attrib1f} 至 {@link Shader.AttribI4uiv}
     * @returns attribute 常量的操作对象，可用于设置其值
     */
    defineAttribute<T extends AttribType>(
        attrib: string,
        type: T
    ): IShaderAttrib<T> | null {
        const u = this.getAttribute<T>(attrib);
        if (u) {
            if (u.type === type) return u;
            else {
                logger.warn(28, 'attribute', attrib);
                return null;
            }
        }
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const location = gl.getAttribLocation(program, attrib);
        if (location === -1) return null;
        const obj = new ShaderAttrib(type, location, gl);
        this.attribute.set(attrib, obj);
        return obj;
    }

    /**
     * 定义一个顶点数组
     * @param name 顶点数组名称
     */
    defineAttribArray(name: string) {
        const u = this.getAttribArray(name);
        if (u) return u;
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const buffer = gl.createBuffer();
        if (!buffer) return null;
        const location = gl.getAttribLocation(program, name);
        const obj = new ShaderAttribArray(buffer, location, gl);
        this.attribArray.set(name, obj);
        return obj;
    }

    /**
     * 定义一个顶点索引数组
     * @param name 顶点索引数组的名称
     */
    defineIndices(name: string) {
        const u = this.getIndices(name);
        if (u) return u;
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const buffer = gl.createBuffer();
        if (!buffer) return null;
        const obj = new ShaderIndices(buffer, gl);
        this.indices.set(name, obj);
        return obj;
    }

    /**
     * 定义一个 uniform block，例如 UBO，并存入本着色器程序的 uniform block 映射
     * 用于一次性向着色器传输大量数据
     * @param block uniform block 名称
     * @param size 数据量，即数据长度，例如一个vec4就是4个长度
     * @param usage 缓冲区用途，例如 gl.STATIC_DRAW 是指会频繁读取但不会频繁写入
     *              参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     *              的 `usage` 参数
     * @param binding uniform block 的索引，例如这是你设置的第一个uniform block，就可以填0，第二个填1，以此类推
     * @returns uniform block 的操作对象，可用于设置其值
     */
    defineUniformBlock(
        block: string,
        size: number,
        usage: number,
        binding: number
    ): IShaderUniformBlock | null {
        if (this.version === this.element.VERSION_ES_100) {
            logger.warn(24);
            return null;
        }
        const u = this.getUniformBlock(block);
        if (u) {
            if (u.size === size) return u;
            else {
                logger.warn(28, 'uniform block', block);
                return null;
            }
        }
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const location = gl.getUniformBlockIndex(program, block);
        if (location === -1) return null;
        const buffer = gl.createBuffer();
        if (!buffer) return null;
        const data = new Float32Array(size);
        data.fill(0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
        gl.bufferData(gl.UNIFORM_BUFFER, data, usage);
        gl.uniformBlockBinding(program, location, binding);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, buffer);
        const obj = new ShaderUniformBlock(location, size, buffer, binding, gl);
        this.block.set(block, obj);
        return obj;
    }

    /**
     * 定义一个材质
     * @param name 纹理名称
     * @param index 纹理索引，根据不同浏览器，其最大数量不一定相等，根据标准其数量应该大于等于 8 个，
     *              因此考虑到兼容性，不建议纹理数量超过 8 个。
     * @param width 纹理的宽度
     * @param height 纹理的高度
     * @returns 这个 texture 的操作对象，可以用于设置其内容
     */
    defineTexture(
        name: string,
        index: number,
        width?: number,
        height?: number
    ): IShaderTexture2D | null {
        const u = this.getTexture(name);
        if (u) {
            if (u.index === index) return u;
            else {
                logger.warn(28, 'texture', name);
                return null;
            }
        }
        if (index > this.element.MAX_TEXTURE_COUNT) {
            logger.warn(29);
            return null;
        }
        const uniform = this.defineUniform(name, UniformType.Uniform1i);
        if (!uniform) return null;
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const tex = gl.createTexture();
        if (!tex) return null;
        const obj = new ShaderTexture2D(tex, index, uniform, gl, width, height);
        this.texture.set(name, obj);
        return obj;
    }

    /**
     * 摧毁这个着色器程序，不要直接调用，请使用 {@link Shader.deleteProgram} 来删除一个着色器程序
     */
    destroy() {
        this.clearProgram();
    }

    private clearProgram() {
        if (!this.gl) return;
        this.uniform.clear();
        this.attribute.clear();
        this.matrix.clear();
        this.gl.deleteProgram(this.program);
        if (this.shader) {
            this.gl.deleteShader(this.shader.vertex);
            this.gl.deleteShader(this.shader.fragment);
        }
        this.block.forEach(v => {
            this.gl.deleteBuffer(v.buffer);
        });
        this.attribArray.forEach(v => {
            this.gl.deleteBuffer(v.data);
        });
        this.texture.forEach(v => {
            this.gl.deleteTexture(v.texture);
        });
        this.indices.forEach(v => {
            this.gl.deleteBuffer(v.data);
        });
        this.texture.clear();
        this.indices.clear();
        this.attribArray.clear();
        this.block.clear();
    }

    private compile() {
        this.shaderDirty = false;
        this.clearProgram();

        const shader = this.element;
        const gl = shader.gl;
        if (!gl) return false;

        const program = gl.createProgram();
        if (!program) return false;

        const vsPrefix =
            this.version === shader.VERSION_ES_100
                ? SHADER_VERTEX_PREFIX_100
                : SHADER_VERTEX_PREFIX_300;
        const fsPrefix =
            this.version === shader.VERSION_ES_100
                ? SHADER_FRAGMENT_PREFIX_100
                : SHADER_FRAGMENT_PREFIX_300;

        const vertexShader = this.compileShader(
            gl.VERTEX_SHADER,
            vsPrefix + this.vertex
        );
        const fragmentShader = this.compileShader(
            gl.FRAGMENT_SHADER,
            fsPrefix + this.fragment
        );

        if (!vertexShader || !fragmentShader) return false;

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        this.program = program;
        this.shader = { vertex: vertexShader, fragment: fragmentShader };
        const tex = this.defineAttribArray('a_texCoord');
        const position = this.defineAttribArray('a_position');
        const sampler = this.defineTexture('u_sampler', 0);
        const indices = this.defineIndices('defalutIndices');
        if (!tex || !position || !sampler || !indices) {
            return false;
        }
        position.buffer(
            new Float32Array([1, -1, -1, -1, 1, 1, -1, 1]),
            gl.STATIC_DRAW
        );
        position.pointer(2, gl.FLOAT, false, 0, 0);
        position.enable();
        tex.buffer(new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
        tex.pointer(2, gl.FLOAT, false, 0, 0);
        tex.enable();
        indices.buffer(new Uint16Array([0, 1, 2, 2, 3, 1]), gl.STATIC_DRAW);
        this.useIndices(indices);

        return true;
    }

    private compileShader(type: number, source: string): WebGLShader | null {
        const gl = this.element.gl;
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            logger.error(
                13,
                type === gl.VERTEX_SHADER ? 'vertex' : 'fragment',
                gl.getShaderInfoLog(shader) ?? ''
            );
        }

        return shader;
    }
}
