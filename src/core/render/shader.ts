import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from './item';
import { Transform } from './transform';
import { GL2, GL2Program, IGL2ProgramPrefix } from './gl2';

const SHADER_PREFIX: IGL2ProgramPrefix = {
    VERTEX: /* glsl */ `#version 300 es
precision highp float;

in vec4 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;
`,
    FRAGMENT: /* glsl */ `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_sampler;
`
};

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

export class Shader extends GL2 {
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
    }

    protected preDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): boolean {
        if (!program.modified) return false;
        const tex = program.getTexture('u_sampler');
        if (!tex) return false;
        const c = canvas.canvas;
        if (tex.width === c.width && tex.height === c.height) {
            tex.sub(c, 0, 0, c.width, c.height);
        } else {
            tex.set(c);
        }
        return true;
    }

    protected postDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): void {}
}

// export class Shader extends Container<EShaderEvent> {
//     /** 是否支持此组件 */
//     static readonly support: boolean = isWebGL2Supported();

//     // 会用到的一些常量
//     // 着色器版本
//     readonly VERSION_ES_100: ShaderVersion.ES_100 = 0;
//     readonly VERSION_ES_300: ShaderVersion.ES_300 = 1;
//     // uniform 类型
//     readonly UNIFORM_1f: UniformType.Uniform1f = UniformType.Uniform1f;
//     readonly UNIFORM_1fv: UniformType.Uniform1fv = UniformType.Uniform1fv;
//     readonly UNIFORM_1i: UniformType.Uniform1i = UniformType.Uniform1i;
//     readonly UNIFORM_1iv: UniformType.Uniform1iv = UniformType.Uniform1iv;
//     readonly UNIFORM_1ui: UniformType.Uniform1ui = UniformType.Uniform1ui;
//     readonly UNIFORM_1uiv: UniformType.Uniform1uiv = UniformType.Uniform1uiv;
//     readonly UNIFORM_2f: UniformType.Uniform2f = UniformType.Uniform2f;
//     readonly UNIFORM_2fv: UniformType.Uniform2fv = UniformType.Uniform2fv;
//     readonly UNIFORM_2i: UniformType.Uniform2i = UniformType.Uniform2i;
//     readonly UNIFORM_2iv: UniformType.Uniform2iv = UniformType.Uniform2iv;
//     readonly UNIFORM_2ui: UniformType.Uniform2ui = UniformType.Uniform2ui;
//     readonly UNIFORM_2uiv: UniformType.Uniform2uiv = UniformType.Uniform2uiv;
//     readonly UNIFORM_3f: UniformType.Uniform3f = UniformType.Uniform3f;
//     readonly UNIFORM_3fv: UniformType.Uniform3fv = UniformType.Uniform3fv;
//     readonly UNIFORM_3i: UniformType.Uniform3i = UniformType.Uniform3i;
//     readonly UNIFORM_3iv: UniformType.Uniform3iv = UniformType.Uniform3iv;
//     readonly UNIFORM_3ui: UniformType.Uniform3ui = UniformType.Uniform3ui;
//     readonly UNIFORM_3uiv: UniformType.Uniform3uiv = UniformType.Uniform3uiv;
//     readonly UNIFORM_4f: UniformType.Uniform4f = UniformType.Uniform4f;
//     readonly UNIFORM_4fv: UniformType.Uniform4fv = UniformType.Uniform4fv;
//     readonly UNIFORM_4i: UniformType.Uniform4i = UniformType.Uniform4i;
//     readonly UNIFORM_4iv: UniformType.Uniform4iv = UniformType.Uniform4iv;
//     readonly UNIFORM_4ui: UniformType.Uniform4ui = UniformType.Uniform4ui;
//     readonly UNIFORM_4uiv: UniformType.Uniform4uiv = UniformType.Uniform4uiv;
//     // uniform matrix 类型
//     readonly U_MATRIX_2x2: UniformMatrix.UMatrix2x2 = UniformMatrix.UMatrix2x2;
//     readonly U_MATRIX_2x3: UniformMatrix.UMatrix2x3 = UniformMatrix.UMatrix2x3;
//     readonly U_MATRIX_2x4: UniformMatrix.UMatrix2x4 = UniformMatrix.UMatrix2x4;
//     readonly U_MATRIX_3x2: UniformMatrix.UMatrix3x2 = UniformMatrix.UMatrix3x2;
//     readonly U_MATRIX_3x3: UniformMatrix.UMatrix3x3 = UniformMatrix.UMatrix3x3;
//     readonly U_MATRIX_3x4: UniformMatrix.UMatrix3x4 = UniformMatrix.UMatrix3x4;
//     readonly U_MATRIX_4x2: UniformMatrix.UMatrix4x2 = UniformMatrix.UMatrix4x2;
//     readonly U_MATRIX_4x3: UniformMatrix.UMatrix4x3 = UniformMatrix.UMatrix4x3;
//     readonly U_MATRIX_4x4: UniformMatrix.UMatrix4x4 = UniformMatrix.UMatrix4x4;
//     // attribute 类型
//     readonly ATTRIB_1f: AttribType.Attrib1f = AttribType.Attrib1f;
//     readonly ATTRIB_1fv: AttribType.Attrib1fv = AttribType.Attrib1fv;
//     readonly ATTRIB_2f: AttribType.Attrib2f = AttribType.Attrib2f;
//     readonly ATTRIB_2fv: AttribType.Attrib2fv = AttribType.Attrib2fv;
//     readonly ATTRIB_3f: AttribType.Attrib3f = AttribType.Attrib3f;
//     readonly ATTRIB_3fv: AttribType.Attrib3fv = AttribType.Attrib3fv;
//     readonly ATTRIB_4f: AttribType.Attrib4f = AttribType.Attrib4f;
//     readonly ATTRIB_4fv: AttribType.Attrib4fv = AttribType.Attrib4fv;
//     readonly ATTRIB_I4i: AttribType.AttribI4i = AttribType.AttribI4i;
//     readonly ATTRIB_I4iv: AttribType.AttribI4iv = AttribType.AttribI4iv;
//     readonly ATTRIB_I4ui: AttribType.AttribI4ui = AttribType.AttribI4ui;
//     readonly ATTRIB_I4uiv: AttribType.AttribI4uiv = AttribType.AttribI4uiv;
//     // 渲染模式
//     readonly DRAW_ARRAYS = RenderMode.Arrays;
//     readonly DRAW_ELEMENTS = RenderMode.Elements;
//     readonly DRAW_ARRAYS_INSTANCED = RenderMode.ArraysInstanced;
//     readonly DRAW_ELEMENTS_INSTANCED = RenderMode.ElementsInstanced;
//     // 其他常量
//     readonly MAX_TEXTURE_COUNT: number = 0;

//     canvas: HTMLCanvasElement;
//     gl: WebGL2RenderingContext;

//     /** 是否需要重新渲染着色器 */
//     private shaderRenderDirty: boolean = true;

//     /** webgl使用的程序 */
//     private program: ShaderProgram | null = null;

//     /** 当前渲染实例的所有着色器程序 */
//     private programs: Set<ShaderProgram> = new Set();
//     /** framebuffer 映射 */
//     private framebufferMap: Map<string, WebGLFramebuffer> = new Map();

//     constructor(type: RenderItemPosition = 'static') {
//         super(type, !Shader.support);

//         this.canvas = document.createElement('canvas');
//         this.gl = this.canvas.getContext('webgl2')!;
//         if (!Shader.support) {
//             this.canvas.width = 0;
//             this.canvas.height = 0;
//         } else {
//             const num = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
//             if (typeof num === 'number') {
//                 this.MAX_TEXTURE_COUNT = num;
//             }
//         }

//         this.init();
//     }

//     protected render(
//         canvas: MotaOffscreenCanvas2D,
//         transform: Transform
//     ): void {
//         if (!Shader.support || !this.program || !this.program.modified) {
//             super.render(canvas, transform);
//         } else {
//             const compile = this.program.requestCompile();
//             if (compile) {
//                 this.gl.useProgram(this.program.program);
//             }

//             if (this.cacheDirty) {
//                 const { ctx } = this.cache;
//                 ctx.clearRect(0, 0, canvas.width, canvas.height);
//                 ctx.save();
//                 super.render(this.cache, transform);
//                 ctx.restore();
//                 this.cacheDirty = false;
//             }

//             if (this.shaderRenderDirty) {
//                 this.drawScene();
//                 this.shaderRenderDirty = false;
//             }

//             canvas.ctx.drawImage(this.canvas, 0, 0, this.width, this.height);
//         }
//     }

//     setHD(hd: boolean): void {
//         super.setHD(hd);
//         this.sizeGL(this.width, this.height);
//     }

//     size(width: number, height: number): void {
//         super.size(width, height);
//         this.sizeGL(width, height);
//     }

//     private sizeGL(width: number, height: number) {
//         const ratio = this.highResolution ? devicePixelRatio : 1;
//         const scale = ratio * core.domStyle.scale;
//         this.canvas.width = width * scale;
//         this.canvas.height = height * scale;
//         this.shaderRenderDirty = true;
//     }

//     update(item?: RenderItem<any>): void {
//         super.update(item);
//         this.shaderRenderDirty = true;
//     }

//     drawScene() {
//         const gl = this.gl;
//         const program = this.program;
//         if (!gl || !program) return;
//         const useDefault = program.defaultReady;
//         const dr = useDefault ? this.defaultReady() : true;
//         const ready = dr && program.ready();
//         if (!ready) return;
//         const indices = program.usingIndices;
//         const param = program.getDrawParams(program.renderMode);
//         if (!param) return;

//         // 清空画布
//         gl.viewport(0, 0, this.canvas.width, this.canvas.height);
//         gl.clearColor(0, 0, 0, 0);
//         gl.clearDepth(1);
//         gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//         const pre = this.preDraw(gl, program, param, indices);
//         if (!pre) {
//             this.postDraw(gl, program, param, indices);
//             return;
//         }

//         this.draw(gl, program, param, indices);

//         this.postDraw(gl, program, param, indices);
//     }

//     draw(
//         gl: WebGL2RenderingContext,
//         program: ShaderProgram,
//         param: DrawParamsMap[keyof DrawParamsMap],
//         indices: IShaderIndices | null
//     ) {
//         switch (program.renderMode) {
//             case RenderMode.Arrays: {
//                 const { mode, first, count } = param as DrawArraysParam;
//                 gl.drawArrays(mode, first, count);
//             }
//             case RenderMode.Elements: {
//                 if (!indices) return;
//                 const { mode, count, type, offset } =
//                     param as DrawElementsParam;
//                 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.data);
//                 gl.drawElements(mode, count, type, offset);
//             }
//             case RenderMode.ArraysInstanced: {
//                 const { mode, first, count, instanceCount } =
//                     param as DrawArraysInstancedParam;
//                 gl.drawArraysInstanced(mode, first, count, instanceCount);
//             }
//             case RenderMode.ElementsInstanced: {
//                 if (!indices) return;
//                 const {
//                     mode,
//                     count,
//                     type,
//                     offset,
//                     instanceCount: ins
//                 } = param as DrawElementsInstancedParam;
//                 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.data);
//                 gl.drawElementsInstanced(mode, count, type, offset, ins);
//             }
//         }
//     }

//     /**
//      * 在本着色器内部渲染之前执行的渲染，如果返回false，则表示不进行内部渲染，但依然会执行 {@link postDraw}。
//      * 继承本类，并复写此方法即可实现前置渲染功能
//      */
//     protected preDraw(
//         gl: WebGL2RenderingContext,
//         program: ShaderProgram,
//         param: DrawParamsMap[keyof DrawParamsMap],
//         indices: IShaderIndices | null
//     ): boolean {
//         return true;
//     }

//     /**
//      * 在本着色器内部渲染之后执行的渲染，即使preDraw返回false，本函数也会执行
//      * 继承本类，并复写此方法即可实现后置渲染功能
//      */
//     protected postDraw(
//         gl: WebGL2RenderingContext,
//         program: ShaderProgram,
//         param: DrawParamsMap[keyof DrawParamsMap],
//         indices: IShaderIndices | null
//     ) {}

//     /**
//      * 默认的准备函数
//      * @returns 是否准备成功
//      */
//     protected defaultReady(): boolean {
//         const program = this.program;
//         if (!program) return false;
//         const tex = program.getTexture('u_sampler');
//         if (!tex) return false;
//         const canvas = this.cache.canvas;
//         if (tex.width === canvas.width && tex.height === canvas.height) {
//             tex.sub(canvas, 0, 0, canvas.width, canvas.height);
//         } else {
//             tex.set(canvas);
//         }
//         return true;
//     }

//     /**
//      * 将画面渲染至帧缓冲
//      * @param name 帧缓冲名称
//      * @param texture 渲染至的纹理
//      * @param clear 是否先清空画布再渲染
//      */
//     framebuffer(
//         name: string,
//         texture: IShaderTexture2D,
//         clear: boolean = true
//     ) {
//         const gl = this.gl;
//         const buffer = this.framebufferMap.get(name);
//         const program = this.program;
//         if (!gl || !buffer || !program) return;
//         const indices = program.usingIndices;
//         if (!indices) return;
//         const param = program.getDrawParams(program.renderMode);
//         if (!param) return;

//         const tex = texture.texture;
//         gl.bindTexture(gl.TEXTURE_2D, tex);
//         gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
//         if (clear) {
//             gl.viewport(0, 0, this.canvas.width, this.canvas.height);
//             gl.clearColor(0, 0, 0, 0);
//             gl.clearDepth(1);
//             gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//         }
//         gl.framebufferTexture2D(
//             gl.FRAMEBUFFER,
//             gl.COLOR_ATTACHMENT0,
//             gl.TEXTURE_2D,
//             tex,
//             0
//         );
//         this.draw(gl, program, param, indices);
//         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//         gl.bindTexture(gl.TEXTURE_2D, null);
//     }

//     /**
//      * 创建一个帧缓冲对象
//      * @param name 帧缓冲名称
//      * @returns 是否创建成功
//      */
//     createFramebuffer(name: string): boolean {
//         const gl = this.gl;
//         if (!gl) return false;
//         const buffer = gl.createFramebuffer();
//         if (!buffer) return false;
//         this.framebufferMap.set(name, buffer);
//         return true;
//     }

//     /**
//      * 删除一个帧缓冲对象
//      * @param name 帧缓冲名称
//      * @returns 是否删除成功
//      */
//     deleteFramebuffer(name: string): boolean {
//         const gl = this.gl;
//         if (!gl) return false;
//         const buffer = this.framebufferMap.get(name);
//         if (!buffer) return false;
//         gl.deleteFramebuffer(buffer);
//         return this.framebufferMap.delete(name);
//     }

//     /**
//      * 切换着色器程序
//      * @param program 着色器程序
//      */
//     useProgram(program: ShaderProgram) {
//         if (!this.gl) return;
//         if (program.element !== this) {
//             logger.error(17);
//             return;
//         }
//         if (this.program !== program) {
//             this.program?.unload();
//             this.program = program;
//             this.gl.useProgram(program.program);
//             program.load();
//         }
//         this.shaderRenderDirty = true;
//     }

//     /**
//      * 创建一个着色器程序
//      * @param vs 顶点着色器，可选
//      * @param fs 片元着色器，可选
//      */
//     createProgram(vs?: string, fs?: string) {
//         const program = new ShaderProgram(this, vs, fs);
//         this.programs.add(program);
//         return program;
//     }

//     /**
//      * 删除一个着色器程序
//      * @param program 要删除的着色器程序
//      */
//     deleteProgram(program: ShaderProgram) {
//         if (program.element !== this) {
//             logger.error(18);
//             return;
//         }
//         program.destroy();
//         this.programs.delete(program);
//     }

//     destroy(): void {
//         this.programs.forEach(v => v.destroy());
//         super.destroy();
//     }

//     // ----- 初始化部分

//     private init() {
//         const gl = this.gl;
//         if (!gl) return;
//         gl.enable(gl.DEPTH_TEST);
//         gl.enable(gl.BLEND);
//         gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
//         gl.depthFunc(gl.LEQUAL);
//     }
// }

export class ShaderProgram extends GL2Program {
    protected readonly prefix: IGL2ProgramPrefix = SHADER_PREFIX;

    constructor(gl2: GL2, vs?: string, fs?: string) {
        super(gl2, vs, fs);
        if (!vs) this.vs(DEFAULT_VS);
        if (!fs) this.fs(DEFAULT_FS);
        if (!vs && !fs) {
            this.modified = false;
        }
        this.setReady(() => {
            const tex = this.getTexture('u_sampler');
            if (!tex) return false;
            const c = this.element.canvas;
            if (tex.width === c.width && tex.height === c.height) {
                tex.sub(c, 0, 0, c.width, c.height);
            } else {
                tex.set(c);
            }
            return true;
        });
    }

    protected override compile() {
        const success = super.compile();
        if (!success) return false;
        const shader = this.element;
        const gl = shader.gl;
        if (!gl) return false;

        const tex = this.defineAttribArray('a_texCoord');
        const position = this.defineAttribArray('a_position');
        const sampler = this.defineTexture('u_sampler', 0);
        const indices = this.defineIndices('defalutIndices');
        if (!tex || !position || !sampler || !indices) {
            return true;
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
        this.paramElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        return true;
    }
}
