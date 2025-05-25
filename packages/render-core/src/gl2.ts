import EventEmitter from 'eventemitter3';
import { logger } from '@motajs/common';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from './item';
import { Transform } from './transform';
import { isWebGL2Supported } from './utils';

export interface IGL2ProgramPrefix {
    readonly VERTEX: string;
    readonly FRAGMENT: string;
}

const GL2_PREFIX: IGL2ProgramPrefix = {
    VERTEX: /* glsl */ `#version 300 es
precision highp float;
`,
    FRAGMENT: /* glsl */ `#version 300 es
precision highp float;
`
};

interface CompiledShader {
    vertex: WebGLShader;
    fragment: WebGLShader;
}

const enum RenderMode {
    Arrays,
    Elements,
    ArraysInstanced,
    ElementsInstanced
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

export type ProgramConstructor<T extends GL2Program> = new (
    gl2: GL2,
    vs?: string,
    fs?: string
) => T;

export interface EGL2Event extends ERenderItemEvent {}

export abstract class GL2<E extends EGL2Event = EGL2Event> extends RenderItem<
    EGL2Event | E
> {
    /** 是否支持此组件 */
    static readonly support: boolean = isWebGL2Supported();

    // 会用到的一些常量
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
    // 渲染模式
    readonly DRAW_ARRAYS = RenderMode.Arrays;
    readonly DRAW_ELEMENTS = RenderMode.Elements;
    readonly DRAW_ARRAYS_INSTANCED = RenderMode.ArraysInstanced;
    readonly DRAW_ELEMENTS_INSTANCED = RenderMode.ElementsInstanced;
    // 其他常量
    readonly MAX_TEXTURE_COUNT: number = 0;

    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    /** webgl使用的程序 */
    protected program: GL2Program | null = null;
    /** 当前渲染实例的所有着色器程序 */
    protected programs: Set<GL2Program> = new Set();
    /** framebuffer 映射 */
    protected framebufferMap: Map<string, WebGLFramebuffer> = new Map();

    constructor(type: RenderItemPosition = 'static') {
        super(type, !GL2.support);

        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl2')!;
        if (!GL2.support) {
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

    onResize(scale: number): void {
        this.sizeGL(this.width, this.height);
        super.onResize(scale);
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
        const scale = ratio * this.cache.scale;
        this.canvas.width = width * scale;
        this.canvas.height = height * scale;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        if (!GL2.support || !this.program || !this.gl) return;
        const compile = this.program.requestCompile();
        if (compile) {
            this.gl.useProgram(this.program.program);
        }

        if (this.cacheDirty) {
            // 清空画布
            const gl = this.gl;
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            this.drawScene(canvas, gl, this.program, transform);
            this.cacheDirty = false;
        }

        canvas.ctx.drawImage(this.canvas, 0, 0, this.width, this.height);
    }

    /**
     * 渲染当前 gl2 画布
     * @param canvas 渲染至的目标画布，注意系统会自动将 gl2 画布渲染至目标画布，不需要手动画到该画布上
     * @param gl 当前正在渲染的 gl2 画布
     * @param program 当前元素正在使用的着色器程序
     * @param transform 当前元素相对父元素的变换矩阵
     */
    protected abstract drawScene(
        canvas: MotaOffscreenCanvas2D,
        gl: WebGL2RenderingContext,
        program: GL2Program,
        transform: Transform
    ): void;

    /**
     * 执行顶点绘制
     * @param gl 当前正在渲染的 gl2 画布
     * @param program 当前元素正在使用的着色器程序
     */
    draw(gl: WebGL2RenderingContext, program: GL2Program) {
        const indices = program.usingIndices;
        const param = program.getDrawParams(program.renderMode);
        if (!param) return;
        switch (program.renderMode) {
            case RenderMode.Arrays: {
                const { mode, first, count } = param as DrawArraysParam;
                gl.drawArrays(mode, first, count);
                break;
            }
            case RenderMode.Elements: {
                if (!indices) return;
                const { mode, count, type, offset } =
                    param as DrawElementsParam;
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.data);
                gl.drawElements(mode, count, type, offset);
                break;
            }
            case RenderMode.ArraysInstanced: {
                const { mode, first, count, instanceCount } =
                    param as DrawArraysInstancedParam;
                gl.drawArraysInstanced(mode, first, count, instanceCount);
                break;
            }
            case RenderMode.ElementsInstanced: {
                if (!indices) return;
                const {
                    mode,
                    count,
                    type,
                    offset,
                    instanceCount: ins
                } = param as DrawElementsInstancedParam;
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.data);
                gl.drawElementsInstanced(mode, count, type, offset, ins);
                break;
            }
        }
    }

    /**
     * 将画面渲染至帧缓冲
     * @param name 帧缓冲名称
     * @param texture 渲染至的纹理
     * @param clear 是否先清空画布再渲染
     */
    framebuffer(
        name: string,
        texture: IShaderTexture2D,
        clear: boolean = true
    ) {
        const gl = this.gl;
        const buffer = this.framebufferMap.get(name);
        const program = this.program;
        if (!gl || !buffer || !program) return;

        const tex = texture.texture;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
        if (clear) {
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            tex,
            0
        );
        this.draw(gl, program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 创建一个帧缓冲对象
     * @param name 帧缓冲名称
     * @returns 是否创建成功
     */
    createFramebuffer(name: string): boolean {
        const gl = this.gl;
        if (!gl) return false;
        const buffer = gl.createFramebuffer();
        if (!buffer) return false;
        this.framebufferMap.set(name, buffer);
        return true;
    }

    /**
     * 删除一个帧缓冲对象
     * @param name 帧缓冲名称
     * @returns 是否删除成功
     */
    deleteFramebuffer(name: string): boolean {
        const gl = this.gl;
        if (!gl) return false;
        const buffer = this.framebufferMap.get(name);
        if (!buffer) return false;
        gl.deleteFramebuffer(buffer);
        return this.framebufferMap.delete(name);
    }

    /**
     * 切换着色器程序
     * @param program 着色器程序
     */
    useProgram(program: GL2Program) {
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
    }

    /**
     * 创建一个着色器程序
     * @param vs 顶点着色器，可选
     * @param fs 片元着色器，可选
     */
    createProgram<T extends GL2Program>(
        Program: ProgramConstructor<T>,
        vs?: string,
        fs?: string
    ) {
        const program = new Program(this, vs, fs);
        this.programs.add(program);
        return program;
    }

    /**
     * 删除一个着色器程序
     * @param program 要删除的着色器程序
     */
    deleteProgram(program: GL2Program) {
        if (program.element !== this) {
            logger.error(18);
            return;
        }
        program.destroy();
        this.programs.delete(program);
    }

    destroy(): void {
        this.programs.forEach(v => v.destroy());
        this.canvas.remove();
        super.destroy();
    }

    private init() {
        const gl = this.gl;
        if (!gl) return;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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

export interface IShaderUniform<T extends UniformType> {
    /** 这个 uniform 变量的内存位置 */
    readonly location: WebGLUniformLocation;
    /** 这个 uniform 变量的类型 */
    readonly type: T;
    /** 这个量所处的着色器程序 */
    readonly program: GL2Program;
    /**
     * 设置这个 uniform 变量的值，
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/uniform
     * @param params 要传递的参数，例如 uniform2f 就要传递 x0 x1 两个参数等，可以参考 mdn 文档
     */
    set(...params: UniformSetFn[T]): void;
}

export interface IShaderAttrib<T extends AttribType> {
    /** 这个 attribute 常量的内存位置 */
    readonly location: number;
    /** 这个 attribute 常量的类型 */
    readonly type: T;
    /** 这个量所处的着色器程序 */
    readonly program: GL2Program;
    /**
     * 设置这个 attribute 常量的值，
     * 浮点数参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttrib
     * 整数参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribI
     * @param params 要传递的参数
     */
    set(...params: AttribSetFn[T]): void;
}

export interface IShaderAttribArray {
    /** 这个 attribute 常量的内存位置 */
    readonly location: number;
    /** 这个 attribute 所用的缓冲区信息 */
    readonly data: WebGLBuffer;
    /** 这个量所处的着色器程序 */
    readonly program: GL2Program;
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
     * 设置顶点指针更新时刻。
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
     * @param divisor 每多少个实例更新一次，0表示每个顶点都更新
     */
    divisor(divisor: number): void;
    /**
     * 启用这个顶点数据
     */
    enable(): void;
    /**
     * 禁用这个顶点数据
     */
    disable(): void;
}

export interface IShaderIndices {
    /** 这个顶点索引所用的缓冲区信息 */
    readonly data: WebGLBuffer;
    /** 这个量所处的着色器程序 */
    readonly program: GL2Program;
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

export interface IShaderUniformMatrix {
    /** 矩阵的内存位置 */
    readonly location: WebGLUniformLocation;
    /** 矩阵类型 */
    readonly type: UniformMatrix;
    /** 这个量所处的着色器程序 */
    readonly program: GL2Program;
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

export interface IShaderUniformBlock {
    /** 这个 uniform block 的内存地址 */
    readonly location: GLuint;
    /** 与这个 uniform block 所绑定的缓冲区 */
    readonly buffer: WebGLBuffer;
    /** 这个 uniform block 的大小 */
    readonly size: number;
    /** 这个量所处的着色器程序 */
    readonly program: GL2Program;
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

export interface IShaderTexture2D {
    /** 纹理对象 */
    readonly texture: WebGLTexture;
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 纹理所属索引 */
    readonly index: number;
    /** 这个量所处的着色器程序 */
    readonly program: GL2Program;
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
        readonly gl: WebGL2RenderingContext,
        readonly program: GL2Program
    ) {}

    set(...params: UniformSetFn[T]): void {
        // 因为ts类型推导的限制，类型肯定正确，但是推导不出，所以这里直接 as any 屏蔽掉类型推导
        const [x0, x1, x2, x3] = params as any[];
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
        readonly gl: WebGL2RenderingContext,
        readonly program: GL2Program
    ) {}

    set(...params: AttribSetFn[T]) {
        // 因为ts类型推导的限制，类型肯定正确，但是推导不出，所以这里直接 as any 屏蔽掉类型推导
        const [x0, x1, x2, x3] = params as any[];
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
        readonly gl: WebGL2RenderingContext,
        readonly program: GL2Program
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

    divisor(divisor: number): void {
        const gl = this.gl;
        gl.vertexAttribDivisor(this.location, divisor);
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
        readonly gl: WebGL2RenderingContext,
        readonly program: GL2Program
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
        readonly gl: WebGL2RenderingContext,
        readonly program: GL2Program
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
        readonly gl: WebGL2RenderingContext,
        readonly program: GL2Program
    ) {}

    set(srcData: AllowSharedBufferSource | null): void;
    set(srcData: ArrayBufferView, srcOffset: number, length?: number): void;
    set(srcData: unknown, srcOffset?: unknown, length?: unknown): void {
        const gl = this.gl;
        const buffer = this.buffer;
        gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
        if (srcOffset !== void 0) {
            // @ts-expect-error 无法推断
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, srcData, srcOffset, length);
        } else {
            // @ts-expect-error 无法推断
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
        readonly program: GL2Program,
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

interface DrawArraysParam {
    mode: GLenum;
    first: number;
    count: number;
}

interface DrawElementsParam {
    mode: GLenum;
    count: number;
    type: GLenum;
    offset: GLintptr;
}

interface DrawArraysInstancedParam {
    mode: GLenum;
    first: number;
    count: number;
    instanceCount: number;
}

interface DrawElementsInstancedParam {
    mode: GLenum;
    count: number;
    type: GLenum;
    offset: GLintptr;
    instanceCount: number;
}

export interface DrawParamsMap {
    [RenderMode.Arrays]: DrawArraysParam;
    [RenderMode.ArraysInstanced]: DrawArraysInstancedParam;
    [RenderMode.Elements]: DrawElementsParam;
    [RenderMode.ElementsInstanced]: DrawElementsInstancedParam;
}

interface ShaderProgramEvent {
    load: [];
    unload: [];
}

export class GL2Program extends EventEmitter<ShaderProgramEvent> {
    /** 顶点着色器 */
    private vertex: string = '';
    /** 片元着色器 */
    private fragment: string = '';
    /** webgl2上下文 */
    gl: WebGL2RenderingContext;
    /** 当前着色器程序的着色器渲染元素 */
    element: GL2;

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
    /** 渲染模式 */
    renderMode: RenderMode = RenderMode.Elements;

    private arraysParams: DrawArraysParam | null = null;
    private elementsParams: DrawElementsParam | null = null;
    private arraysInstancedParams: DrawArraysInstancedParam | null = null;
    private elementsInstancedParams: DrawElementsInstancedParam | null = null;

    /** 是否需要重新编译着色器 */
    protected shaderDirty: boolean = true;
    /** 着色器代码的前缀，会在设置时自动添加至代码前 */
    protected readonly prefix: IGL2ProgramPrefix = GL2_PREFIX;

    constructor(shader: GL2, vs?: string, fs?: string) {
        super();
        if (vs) this.vs(vs);
        if (fs) this.fs(fs);
        this.element = shader;
        this.gl = shader.gl;
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
     * 设置渲染模式，目前可选 {@link Shader.DRAW_ARRAYS} 至 {@link Shader.DRAW_INSTANCED}
     */
    mode(mode: RenderMode) {
        this.renderMode = mode;
    }

    /**
     * 获取指定渲染模式的渲染参数
     * @param param 渲染模式
     */
    getDrawParams<T extends RenderMode>(param: T): DrawParamsMap[T] | null {
        switch (param) {
            case RenderMode.Arrays:
                return this.arraysParams as DrawParamsMap[T];
            case RenderMode.ArraysInstanced:
                return this.arraysInstancedParams as DrawParamsMap[T];
            case RenderMode.Elements:
                return this.elementsParams as DrawParamsMap[T];
            case RenderMode.ElementsInstanced:
                return this.elementsInstancedParams as DrawParamsMap[T];
        }
        return null;
    }

    /**
     * 设置 DRAW_ARRAYS 模式下的渲染参数
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawArrays
     * @param mode 渲染模式
     * @param first 第一个元素的位置
     * @param count 渲染多少个元素
     */
    paramArrays(mode: GLenum, first: number, count: number) {
        if (!this.arraysParams) {
            this.arraysParams = { mode, first, count };
        } else {
            this.arraysParams.mode = mode;
            this.arraysParams.first = first;
            this.arraysParams.count = count;
        }
    }

    /**
     * 设置 DRAW_ARRAYS_INSTANCED 模式下的渲染参数
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced
     * @param mode 渲染模式
     * @param first 第一个元素的位置
     * @param count 渲染多少个元素
     * @param instanceCount 渲染实例数量
     */
    paramArraysInstanced(
        mode: GLenum,
        first: number,
        count: number,
        instanceCount: number
    ) {
        if (!this.arraysInstancedParams) {
            this.arraysInstancedParams = { mode, first, count, instanceCount };
        } else {
            this.arraysInstancedParams.mode = mode;
            this.arraysInstancedParams.first = first;
            this.arraysInstancedParams.count = count;
            this.arraysInstancedParams.instanceCount = instanceCount;
        }
    }

    /**
     * 设置 DRAW_ELEMENTS 模式下的渲染参数
     * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawElements
     * @param mode 渲染模式
     * @param count 渲染元素数量
     * @param type 数据类型
     * @param offset 偏移量
     */
    paramElements(mode: GLenum, count: number, type: GLenum, offset: number) {
        if (!this.elementsParams) {
            this.elementsParams = { mode, count, type, offset };
        } else {
            this.elementsParams.mode = mode;
            this.elementsParams.count = count;
            this.elementsParams.type = type;
            this.elementsParams.offset = offset;
        }
    }

    /**
     * 设置 DRAW_ELEMENTS 模式下的渲染参数
     * 参考 https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
     * @param mode 渲染模式
     * @param count 渲染元素数量
     * @param type 数据类型
     * @param offset 偏移量
     * @param instanceCount 渲染实例数量
     */
    paramElementsInstanced(
        mode: GLenum,
        count: number,
        type: GLenum,
        offset: number,
        instanceCount: number
    ) {
        if (!this.elementsInstancedParams) {
            this.elementsInstancedParams = {
                mode,
                count,
                type,
                offset,
                instanceCount
            };
        } else {
            this.elementsInstancedParams.mode = mode;
            this.elementsInstancedParams.count = count;
            this.elementsInstancedParams.type = type;
            this.elementsInstancedParams.offset = offset;
            this.elementsInstancedParams.instanceCount = instanceCount;
        }
    }

    /**
     * 切换渲染时使用的顶点索引
     * @param name 要使用的顶点索引名称
     */
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
        this.vertex = this.prefix.VERTEX + vs;
        this.shaderDirty = true;
        this.modified = true;
    }

    /**
     * 设置片元着色器内容
     * @param fs 片元着色器
     */
    fs(fs: string) {
        this.fragment = this.prefix.FRAGMENT + fs;
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
     * @param type uniform 类型，可选 {@link GL2.UNIFORM_1f} 至 {@link GL2.UNIFORM_4uiv}
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
        const obj = new ShaderUniform(type, location, gl, this);
        this.uniform.set(uniform, obj);
        return obj;
    }

    /**
     * 定义一个 uniform 矩阵变量，并存入本着色器程序的 uniform 矩阵变量映射
     * @param uniform uniform 矩阵变量名
     * @param type uniform 矩阵类型，可选 {@link GL2.U_MATRIX_2x2} 至 {@link GL2.U_MATRIX_4x4}
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
        const obj = new ShaderUniformMatrix(type, location, gl, this);
        this.matrix.set(uniform, obj);
        return obj;
    }

    /**
     * 定义一个 attribute 常量，并存入本着色器程序的 attribute 常量映射，在 es 300 版本中叫做 in
     * @param attrib attribute 常量名
     * @param type attribute 类型，可选 {@link GL2.ATTRIB_1f} 至 {@link GL2.ATTRIB_I4uiv}
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
        const obj = new ShaderAttrib(type, location, gl, this);
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
        if (location === -1) return null;
        const obj = new ShaderAttribArray(buffer, location, gl, this);
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
        const obj = new ShaderIndices(buffer, gl, this);
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
        const loc = gl.getUniformBlockIndex(program, block);
        if (loc === -1) return null;
        const buf = gl.createBuffer();
        if (!buf) return null;
        const data = new Float32Array(size);
        data.fill(0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, buf);
        gl.bufferData(gl.UNIFORM_BUFFER, data, usage);
        gl.uniformBlockBinding(program, loc, binding);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, buf);
        const obj = new ShaderUniformBlock(loc, size, buf, binding, gl, this);
        this.block.set(block, obj);
        return obj;
    }

    /**
     * 定义一个材质
     * @param name 纹理名称
     * @param index 纹理索引，根据不同浏览器，其最大数量不一定相等，根据标准其数量应该大于等于 8 个，
     *              因此考虑到兼容性，不建议纹理数量超过 8 个。
     * @param w 纹理的宽度
     * @param h 纹理的高度
     * @returns 这个 texture 的操作对象，可以用于设置其内容
     */
    defineTexture(
        name: string,
        index: number,
        w?: number,
        h?: number
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
        const uni = this.defineUniform(name, UniformType.Uniform1i);
        if (!uni) return null;
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const tex = gl.createTexture();
        if (!tex) return null;
        const obj = new ShaderTexture2D(tex, index, uni, gl, this, w, h);
        this.texture.set(name, obj);
        return obj;
    }

    /**
     * 摧毁这个着色器程序，不要直接调用，请使用 {@link GL2.deleteProgram} 来删除一个着色器程序
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

    protected compile() {
        this.shaderDirty = false;
        this.clearProgram();

        const shader = this.element;
        const gl = shader.gl;
        if (!gl) return false;

        const program = gl.createProgram();
        if (!program) return false;

        const vs = this.compileShader(gl.VERTEX_SHADER, this.vertex);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, this.fragment);

        if (!vs || !fs) return false;

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        this.program = program;
        this.shader = { vertex: vs, fragment: fs };
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
