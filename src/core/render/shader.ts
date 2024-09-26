import { isNil } from 'lodash-es';
import { logger } from '../common/logger';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { isWebGL2Supported } from '../fx/webgl';
import { Container } from './container';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from './item';
import { Transform } from './transform';

const SHADER_VERTEX_PREFIX_300 = /* glsl */ `#version 300 es
`;
const SHADER_VERTEX_PREFIX_100 = /* glsl */ `
#ifdef GL_ES
    precision highp float;
#endif

attribute vec4 a_position;
attribute vec2 a_texCoord;

varying highp vec2 v_texCoord;
`;

const SHADER_FRAGMENT_PREFIX_300 = /* glsl */ `#version 300 es
`;
const SHADER_FRAGMENT_PREFIX_100 = /* glsl */ `
#ifdef GL_ES
    precision highp float;
#endif

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

export type ShaderGLSLVersion = '100' | '300';

interface CompiledShader {
    vertex: WebGLShader;
    fragment: WebGLShader;
}

interface ShaderBuffer {
    position: WebGLBuffer;
    texture: WebGLBuffer;
    indices: WebGLBuffer;
}

interface ShaderUniform {
    u_sampler: WebGLUniformLocation;

    [x: string]: WebGLUniformLocation | null;
}

interface ShaderAttribute {
    a_texCoord: number;
    a_position: number;

    [x: string]: number;
}

interface ShaderProgram {
    program: WebGLProgram | null;
    shader: CompiledShader | null;
    uniform: ShaderUniform | null;
    attribute: ShaderAttribute | null;
}

interface EShaderEvent extends ERenderItemEvent {}

export class Shader extends Container<EShaderEvent> {
    /** 是否支持此组件 */
    static readonly support: boolean = isWebGL2Supported();

    // 会用到的静态常量
    static readonly VERTEX_SHADER: number = 0b1;
    static readonly FRAGMENT_SHADER: number = 0b10;

    private version: ShaderGLSLVersion = '100';

    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    /** 是否修改过着色器，用于特定场景优化 */
    private shaderModified: boolean = false;
    /** 需要重新编译的着色器 */
    private shaderDirty: boolean = true;
    /** 是否需要重新渲染着色器 */
    private shaderRanderDirty: boolean = true;
    /** 当前程序是否被外部调用过 */
    private programExterned: boolean = false;

    /** 顶点着色器 */
    private vertex: string = DEFAULT_VS;
    /** 片元着色器 */
    private fragment: string = DEFAULT_FS;

    /** webgl使用的程序 */
    private program: WebGLProgram | null = null;
    /** 子元素构成的纹理 */
    private texture: WebGLTexture | null = null;
    /** 编译过的着色器，在切换着色器时会被删除 */
    private shader: CompiledShader | null = null;
    /** 缓冲区 */
    private buffer: ShaderBuffer | null = null;
    /** uniform */
    private uniform: ShaderUniform | null = null;
    /** attribute */
    private attribute: ShaderAttribute | null = null;

    constructor(
        type: RenderItemPosition = 'static',
        version: ShaderGLSLVersion = '100'
    ) {
        super(type, !Shader.support);

        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl2')!;
        this.setVersion(version);
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
        if (!Shader.support || !this.shaderModified) {
            super.render(canvas, transform);
        } else {
            if (this.shaderDirty) {
                this.cacheDirty = true;
                this.compileShader();
            }

            if (this.cacheDirty) {
                const { ctx } = this.cache;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                super.render(this.cache, transform);
                ctx.restore();
                this.cacheDirty = false;
            }

            if (this.shaderRanderDirty) {
                this.drawScene();
                this.shaderRanderDirty = false;
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
    }

    update(item?: RenderItem<any>): void {
        const isSelf = item === this && !this.cacheDirty;
        super.update(item);
        if (isSelf) this.cacheDirty = false;
        this.shaderRanderDirty = true;
    }

    drawScene() {
        const gl = this.gl;
        if (!this.uniform || !gl) return;

        // 清空画布
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
        gl.uniform1i(this.uniform.uSampler, 0);

        // 绘制
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * 切换着色器程序
     * @param program 着色器程序
     */
    useProgram(program: ShaderProgram) {
        this.program = program.program;
        this.shader = program.shader;
        this.uniform = program.uniform;
        this.attribute = program.attribute;
        this.gl?.useProgram(this.program);
        this.programExterned = true;
    }

    /**
     * 获取当前的着色器程序
     */
    getProgram(): ShaderProgram {
        this.programExterned = true;
        return {
            program: this.program,
            shader: this.shader,
            uniform: this.uniform,
            attribute: this.attribute
        };
    }

    /**
     * 删除指定的着色器程序
     * @param program 着色器程序
     */
    deleteProgram(program: ShaderProgram) {
        if (!this.gl) return;
        if (this.program === program.program) {
            this.gl.useProgram(null);
            this.program = null;
            this.shader = null;
            this.uniform = null;
            this.attribute = null;
        }
        if (program.program) {
            this.gl.deleteProgram(program.program);
        }
        if (program.shader) {
            this.gl.deleteShader(program.shader.vertex);
            this.gl.deleteShader(program.shader.fragment);
        }
    }

    /**
     * 设置着色器使用的glsl版本，默认使用100版本
     */
    setVersion(version: ShaderGLSLVersion) {
        this.version = version;
    }

    /**
     * 设置顶点着色器
     * @param shader 着色器
     */
    vs(shader: string) {
        this.vertex = shader;
        this.shaderModified = true;
        this.shaderDirty = true;
    }

    /**
     * 设置片元着色器
     * @param shader 着色器
     */
    fs(shader: string) {
        this.fragment = shader;
        this.shaderModified = true;
        this.shaderDirty = true;
    }

    /**
     * 编译指定着色器并附加到新程序，老程序可以在调用此函数之前通过 {@link Shader.getProgram} 获取，
     * 否则，老程序将会被删除
     */
    compileShader() {
        if (!Shader.support) return;

        const program = Shader.compileProgram(
            this,
            this.version,
            this.vertex,
            this.fragment
        );
        if (!program) return;

        if (!this.programExterned) {
            Shader.deleteProgram(this, this.getProgram());
        }
        this.programExterned = false;
        this.shaderDirty = false;

        this.program = program.program;
        this.shader = program.shader;
        this.uniform = program.uniform;
        this.attribute = program.attribute;
        this.gl?.useProgram(this.program);
    }

    /**
     * 获取属性位置
     * @param name 属性名称
     */
    getAttribute(name: string) {
        if (!this.attribute || !this.gl || !this.program) return null;
        if (!isNil(this.attribute[name])) return this.attribute[name];
        return (this.attribute[name] = this.gl.getAttribLocation(
            this.program,
            name
        ));
    }

    /**
     * 获取uniform位置
     * @param name 属性名称
     */
    getUniform(name: string) {
        if (!this.uniform || !this.gl || !this.program) return null;
        if (!isNil(this.uniform[name])) return this.uniform[name];
        return (this.uniform[name] = this.gl.getUniformLocation(
            this.program,
            name
        ));
    }

    // ----- 初始化部分

    private init() {
        if (!this.gl) return;
        this.program = this.gl.createProgram();
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
        if (!this.attribute) return;
        const gl = this.gl;
        const pos = this.attribute.a_texCoord;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer!.texture);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos);
    }

    private setPositionAttrib() {
        if (!this.attribute) return;
        const gl = this.gl;
        const pos = this.attribute.a_position;
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

    // ----- 静态api部分

    /**
     * 传入着色器，编译出对应的程序，可以直接通过 {@link Shader.useProgram} 用于Shader组件
     * @param vs 顶点着色器
     * @param fs 片元着色器
     */
    static compileProgram(
        shader: Shader,
        version: ShaderGLSLVersion,
        vs: string,
        fs: string
    ): ShaderProgram | null {
        const gl = shader.gl;
        if (!gl) return null;

        const program = gl.createProgram();
        if (!program) return null;

        const vsPrefix =
            version === '100'
                ? SHADER_VERTEX_PREFIX_100
                : SHADER_VERTEX_PREFIX_300;
        const fsPrefix =
            version === '100'
                ? SHADER_FRAGMENT_PREFIX_100
                : SHADER_FRAGMENT_PREFIX_300;

        const vertexShader = this.compileShader(
            gl,
            gl.VERTEX_SHADER,
            vsPrefix + vs
        );
        const fragmentShader = this.compileShader(
            gl,
            gl.FRAGMENT_SHADER,
            fsPrefix + fs
        );

        if (!vertexShader || !fragmentShader) return null;

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        const aTexCoord = gl.getAttribLocation(program, 'a_texCoord');
        const aPosition = gl.getAttribLocation(program, 'a_position');
        const uSampler = gl.getUniformLocation(program, 'u_sampler');

        if (!uSampler) return null;

        return {
            program,
            attribute: { a_position: aPosition, a_texCoord: aTexCoord },
            uniform: { u_sampler: uSampler },
            shader: { vertex: vertexShader, fragment: fragmentShader }
        };
    }

    private static compileShader(
        gl: WebGL2RenderingContext,
        type: number,
        source: string
    ): WebGLShader | null {
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

    /**
     * 删除着色器程序
     * @param program 要删除的程序
     */
    static deleteProgram(shader: Shader, program: ShaderProgram) {
        const gl = shader.gl;
        if (!gl) return;
        gl.deleteProgram(program.program);
        gl.deleteShader(program.shader?.vertex ?? null);
        gl.deleteShader(program.shader?.fragment ?? null);
    }

    /**
     * 获取一个程序中对应属性名的位置
     * @param program 要获取的程序
     * @param name 要获取的属性名
     */
    static getAttribute(
        shader: Shader,
        program: ShaderProgram,
        name: string
    ): number | null {
        const gl = shader.gl;
        if (!gl || !program.program || !program.attribute) return null;
        if (program.attribute[name]) return program.attribute[name];
        const loc = gl.getAttribLocation(program.program, name);
        return (program.attribute[name] = loc);
    }

    /**
     * 获取一个程序中对应uniform变量名的位置
     * @param program 要获取的程序
     * @param name 要获取的uniform变量名
     */
    static getUniform(
        shader: Shader,
        program: ShaderProgram,
        name: string
    ): WebGLUniformLocation | null {
        const gl = shader.gl;
        if (!gl || !program.program || !program.uniform) return null;
        if (name in program.uniform) return program.uniform[name];
        const loc = gl.getUniformLocation(program.program, name);
        return (program.uniform[name] = loc);
    }
}
