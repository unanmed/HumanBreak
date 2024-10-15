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

interface ShaderBuffer {
    position: WebGLBuffer;
    texture: WebGLBuffer;
    indices: WebGLBuffer;
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

    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    /** 是否需要重新渲染着色器 */
    private shaderRenderDirty: boolean = true;

    /** webgl使用的程序 */
    private program: ShaderProgram | null = null;
    /** 子元素构成的纹理 */
    private texture: WebGLTexture | null = null;
    /** 缓冲区 */
    private buffer: ShaderBuffer | null = null;

    /** 当前渲染实例的所有着色器程序 */
    private programs: Set<ShaderProgram> = new Set();

    constructor(type: RenderItemPosition = 'static') {
        super(type, !Shader.support);

        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl2')!;
        if (!Shader.support) {
            this.canvas.width = 0;
            this.canvas.height = 0;
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

        const uSampler = program.getUniform<UniformType.Uniform1i>('u_sampler');
        if (!uSampler) return;

        // 清空画布
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const pre = this.preDraw();
        if (!pre) {
            this.postDraw();
            return;
        }

        // 设置顶点信息
        this.setPositionAttrib();
        this.setTextureAttrib();

        // 准备绘制
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer!.indices);
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
            this.cache.canvas
        );
        gl.uniform1i(uSampler.location, 0);

        // 绘制
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        this.postDraw();
    }

    /**
     * 在本着色器内部渲染之前执行的渲染，如果返回false，则表示不进行内部渲染，但依然会执行 {@link postDraw}
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
        this.program = program;
        this.gl.useProgram(program.program);
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
        this.gl.deleteTexture(this.texture);
        if (this.buffer) {
            this.gl.deleteBuffer(this.buffer.indices);
            this.gl.deleteBuffer(this.buffer.position);
            this.gl.deleteBuffer(this.buffer.texture);
        }
        this.programs.forEach(v => v.destroy());
        super.destroy();
    }

    // ----- 初始化部分

    private init() {
        if (!this.gl) return;
        this.initTexture();
        this.initBuffers();
    }

    private initTexture() {
        const gl = this.gl;
        if (!gl) return;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.cache.canvas
        );
        gl.generateMipmap(gl.TEXTURE_2D);

        this.texture = texture;
    }

    private setTextureAttrib() {
        if (!this.program) return;
        const aTexCoord = this.program.getAttribute('a_texCoord');
        if (!aTexCoord) return;
        const gl = this.gl;
        const pos = aTexCoord.location;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer!.texture);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos);
    }

    private setPositionAttrib() {
        if (!this.program) return;
        const aPosition = this.program.getAttribute('a_position');
        if (!aPosition) return;
        const gl = this.gl;
        const pos = aPosition.location;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer!.position);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos);
    }

    private initBuffers() {
        const positions = new Float32Array([1, -1, -1, -1, 1, 1, -1, 1]);
        const posBuffer = this.initBuffer(positions);
        const textureCoord = new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]);
        const textureBuffer = this.initBuffer(textureCoord);

        this.buffer = {
            position: posBuffer!,
            texture: textureBuffer!,
            indices: this.initIndexBuffer()!
        };
    }

    private initBuffer(pos: Float32Array) {
        const gl = this.gl;
        if (!gl) return;
        const posBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);

        return posBuffer;
    }

    private initIndexBuffer() {
        const gl = this.gl;
        if (!gl) return;
        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        const indices = new Uint16Array([0, 1, 2, 2, 3, 1]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        return buffer;
    }
}

type _U1 = (x0: number) => void;
type _U2 = (x0: number, x1: number) => void;
type _U3 = (x0: number, x1: number, x2: number) => void;
type _U4 = (x0: number, x1: number, x2: number, x3: number) => void;
type _UV<T> = (data: T, srcOffset?: number, srcLength?: number) => void;
type _A<T> = (data: T) => void;
type _UMatrix = (
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    transpose: GLboolean,
    data: Iterable<GLfloat>,
    srcOffset?: number,
    srcLength?: GLuint
) => void;

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

interface ShaderUniform<T extends UniformType> {
    location: WebGLUniformLocation;
    type: T;
    set: UniformSetFn[T];
}

interface ShaderAttrib<T extends AttribType> {
    location: number;
    type: T;
    set: AttribSetFn[T];
    pointer: (
        size: GLint,
        type: GLenum,
        normalized: GLboolean,
        stride: GLsizei,
        offset: GLintptr
    ) => void;
    pointerI: (
        size: GLint,
        type: GLenum,
        stride: GLsizei,
        offset: GLintptr
    ) => void;
    divisor: (divisor: GLuint) => void;
}

interface ShaderUniformMatrix {
    location: WebGLUniformLocation;
    type: UniformMatrix;
    set: (
        transpose: GLboolean,
        data: Float32List,
        srcOffset?: number,
        srcLength?: number
    ) => void;
}

interface ShaderUniformBlock {
    location: GLuint;
    buffer: WebGLBuffer;
    size: number;
    set(srcData: AllowSharedBufferSource | null): void;
    set(srcData: ArrayBufferView, srcOffset: number, length?: GLuint): void;
}

type UniformDefineFn = {
    [P in UniformType]: (
        gl: WebGL2RenderingContext,
        location: WebGLUniformLocation,
        ...params: Parameters<UniformSetFn[P]>
    ) => void;
};

type AttribDefineFn = {
    [P in AttribType]: (
        gl: WebGL2RenderingContext,
        location: number,
        ...params: Parameters<AttribSetFn[P]>
    ) => void;
};

type UniformMatrixSetFn = Record<UniformMatrix, _UMatrix>;

const uniformDefine: UniformDefineFn = {
    [UniformType.Uniform1f]: (gl, location, x0) => {
        gl.uniform1f(location, x0);
    },
    [UniformType.Uniform1fv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform1fv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform1i]: (gl, location, x0) => {
        gl.uniform1i(location, x0);
    },
    [UniformType.Uniform1iv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform1iv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform1ui]: (gl, location, x0) => {
        gl.uniform1ui(location, x0);
    },
    [UniformType.Uniform1uiv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform1uiv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform2f]: (gl, location, x0, x1) => {
        gl.uniform2f(location, x0, x1);
    },
    [UniformType.Uniform2fv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform2fv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform2i]: (gl, location, x0, x1) => {
        gl.uniform2i(location, x0, x1);
    },
    [UniformType.Uniform2iv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform2iv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform2ui]: (gl, location, x0, x1) => {
        gl.uniform2ui(location, x0, x1);
    },
    [UniformType.Uniform2uiv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform2uiv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform3f]: (gl, location, x0, x1, x2) => {
        gl.uniform3f(location, x0, x1, x2);
    },
    [UniformType.Uniform3fv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform3fv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform3i]: (gl, location, x0, x1, x2) => {
        gl.uniform3i(location, x0, x1, x2);
    },
    [UniformType.Uniform3iv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform3iv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform3ui]: (gl, location, x0, x1, x2) => {
        gl.uniform3ui(location, x0, x1, x2);
    },
    [UniformType.Uniform3uiv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform3uiv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform4f]: (gl, location, x0, x1, x2, x3) => {
        gl.uniform4f(location, x0, x1, x2, x3);
    },
    [UniformType.Uniform4fv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform4fv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform4i]: (gl, location, x0, x1, x2, x3) => {
        gl.uniform4i(location, x0, x1, x2, x3);
    },
    [UniformType.Uniform4iv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform4iv(location, data, srcOffset, srcLength);
    },
    [UniformType.Uniform4ui]: (gl, location, x0, x1, x2, x3) => {
        gl.uniform4ui(location, x0, x1, x2, x3);
    },
    [UniformType.Uniform4uiv]: (gl, location, data, srcOffset, srcLength) => {
        gl.uniform4uiv(location, data, srcOffset, srcLength);
    }
};

const uniformMatrix: UniformMatrixSetFn = {
    [UniformMatrix.UMatrix2x2]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix2fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix2x3]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix2x3fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix2x4]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix2x4fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix3x2]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix3x2fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix3x3]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix3fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix3x4]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix3x4fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix4x2]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix4x2fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix4x3]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix4x3fv(x1, x2, x3, x4, x5);
    },
    [UniformMatrix.UMatrix4x4]: (gl, x1, x2, x3, x4, x5) => {
        gl.uniformMatrix4fv(x1, x2, x3, x4, x5);
    }
};

const attribDefine: AttribDefineFn = {
    [AttribType.Attrib1f]: (gl, location, x0) => {
        gl.vertexAttrib1f(location, x0);
    },
    [AttribType.Attrib1fv]: (gl, location, data) => {
        gl.vertexAttrib1fv(location, data);
    },
    [AttribType.Attrib2f]: (gl, location, x0, x1) => {
        gl.vertexAttrib2f(location, x0, x1);
    },
    [AttribType.Attrib2fv]: (gl, location, data) => {
        gl.vertexAttrib2fv(location, data);
    },
    [AttribType.Attrib3f]: (gl, location, x0, x1, x2) => {
        gl.vertexAttrib3f(location, x0, x1, x2);
    },
    [AttribType.Attrib3fv]: (gl, location, data) => {
        gl.vertexAttrib3fv(location, data);
    },
    [AttribType.Attrib4f]: (gl, location, x0, x1, x2, x3) => {
        gl.vertexAttrib4f(location, x0, x1, x2, x3);
    },
    [AttribType.Attrib4fv]: (gl, location, data) => {
        gl.vertexAttrib4fv(location, data);
    },
    [AttribType.AttribI4i]: (gl, location, x0, x1, x2, x3) => {
        gl.vertexAttribI4i(location, x0, x1, x2, x3);
    },
    [AttribType.AttribI4iv]: (gl, location, data) => {
        gl.vertexAttribI4iv(location, data);
    },
    [AttribType.AttribI4ui]: (gl, location, x0, x1, x2, x3) => {
        gl.vertexAttribI4ui(location, x0, x1, x2, x3);
    },
    [AttribType.AttribI4uiv]: (gl, location, data) => {
        gl.vertexAttribI4uiv(location, data);
    }
};

export class ShaderProgram {
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
    private uniform: Map<string, ShaderUniform<UniformType>> = new Map();
    /** attribute存放地址，300版本里面叫做in */
    private attribute: Map<string, ShaderAttrib<AttribType>> = new Map();
    /** uniform矩阵存放地址 */
    private matrix: Map<string, ShaderUniformMatrix> = new Map();
    /** uniform block 存放地址 */
    private block: Map<string, ShaderUniformBlock> = new Map();
    /** 当前编译完成的shader程序 */
    private shader: CompiledShader | null = null;
    /** 当前的webgl程序 */
    program: WebGLProgram | null = null;

    /** 着色器内容是否是默认内容，可以用于优化空着色器 */
    modified: boolean = false;

    /** 是否需要重新编译着色器 */
    private shaderDirty: boolean = true;

    constructor(shader: Shader, vs?: string, fs?: string) {
        if (vs) this.vs(vs);
        if (fs) this.fs(fs);
        this.element = shader;
        this.gl = shader.gl;
        this.version = shader.VERSION_ES_100;
        this.requestCompile();
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
     * 获取一个uniform，需要事先定义，否则返回null
     * @param uniform uniform名称
     */
    getUniform<T extends UniformType = UniformType>(
        uniform: string
    ): ShaderUniform<T> | null {
        return (this.uniform.get(uniform) as ShaderUniform<T>) ?? null;
    }

    /**
     * 获取一个attribute，需要事先定义，否则返回null
     * @param attrib attribute名称
     */
    getAttribute<T extends AttribType = AttribType>(
        attrib: string
    ): ShaderAttrib<T> | null {
        return (this.attribute.get(attrib) as ShaderAttrib<T>) ?? null;
    }

    /**
     * 获取一个 uniform matrix，需要事先定义，否则返回null
     * @param matrix uniform matrix 的名称
     */
    getMatrix(matrix: string): ShaderUniformMatrix | null {
        return this.matrix.get(matrix) ?? null;
    }

    /**
     * 获取一个 uniform block，例如 UBO，需要事先定义，否则返回null
     * @param block uniform block 的名称
     */
    getUniformBlock(block: string): ShaderUniformBlock | null {
        return this.block.get(block) ?? null;
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
    ): ShaderUniform<T> | null {
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const location = gl.getUniformLocation(program, uniform);
        if (!location) return null;
        const fn = uniformDefine[type];
        // @ts-ignore
        const obj: ShaderUniform<T> = {
            location,
            type,
            set: (p0, p1, p2, p3) => {
                // @ts-ignore
                fn(gl, location, p0, p1, p2, p3);
            }
        };
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
    ): ShaderUniformMatrix | null {
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const location = gl.getUniformLocation(program, uniform);
        if (!location) return null;
        const fn = uniformMatrix[type];
        const obj: ShaderUniformMatrix = {
            location,
            type,
            set: (transpose, data, srcOffset, srcLength) => {
                fn(gl, location, transpose, data, srcOffset, srcLength);
            }
        };
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
    ): ShaderAttrib<T> | null {
        const program = this.program;
        const gl = this.element.gl;
        if (!program || !gl) return null;
        const location = gl.getAttribLocation(program, attrib);
        if (location === -1) return null;
        const fn = attribDefine[type];
        // @ts-ignore
        const obj: ShaderAttrib<T> = {
            location,
            type,
            set: (p0, p1, p2, p3) => {
                // @ts-ignore
                fn(gl, location, p0, p1, p2, p3);
            },
            pointer: (p0, p1, p2, p3, p4) => {
                gl.vertexAttribPointer(location, p0, p1, p2, p3, p4);
            },
            pointerI: (size, type, stride, offset) => {
                gl.vertexAttribIPointer(location, size, type, stride, offset);
            },
            divisor: divisor => {
                gl.vertexAttribDivisor(location, divisor);
            }
        };
        this.attribute.set(attrib, obj);
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
    ): ShaderUniformBlock | null {
        if (this.version === this.element.VERSION_ES_100) {
            logger.warn(24);
            return null;
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
        const obj: ShaderUniformBlock = {
            location,
            buffer,
            size,
            set: (data, o?: number, l?: number) => {
                gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
                if (o !== void 0) {
                    // @ts-ignore
                    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data, o, l);
                } else {
                    // @ts-ignore
                    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data);
                }
                // gl.uniformBlockBinding(program, location, binding);
                gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, buffer);
                // const array = new Float32Array(160);
                // gl.getBufferSubData(gl.UNIFORM_BUFFER, 0, array);
                // console.log(array[0]);
            }
        };
        this.block.set(block, obj);
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

        this.program = program;
        this.shader = { vertex: vertexShader, fragment: fragmentShader };
        const tex = this.defineAttribute('a_texCoord', shader.ATTRIB_2fv);
        const position = this.defineAttribute('a_position', shader.ATTRIB_4fv);
        const sampler = this.defineUniform('u_sampler', shader.UNIFORM_1i);
        if (!tex || !position || !sampler) {
            return false;
        }
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
