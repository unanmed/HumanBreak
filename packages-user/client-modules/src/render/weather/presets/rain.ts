import {
    ShaderProgram,
    IShaderUniform,
    UniformType,
    MotaOffscreenCanvas2D,
    GL2
} from '@motajs/render';
import { Weather } from '../weather';

const rainVs = /* glsl */ `
in vec2 a_rainVertex;
in vec2 a_offset; // 雨滴的中心位置
in vec4 a_data; // x: 雨滴宽度; y: 雨滴长度; z: 雨滴旋转角度，0表示向下，逆时针为正; 
                // w: 属于哪一种雨，需要两种雨反复循环，一种无法实现循环，0表示第一种，1表示第二种

uniform float u_progress; // 下雨进度，从最上落到最下是0.5个进度，以保证不会出现奇怪的问题

out vec2 v_center;
out vec2 v_data; // 雨滴宽度与高度
out vec2 v_pos;

mat2 createScaleMatrix(float x, float y) {
    return mat2(
        x, 0,
        0, y
    );
}

vec2 getOffsetByProgress(vec2 offset) {
    if (a_data.w == 0.0) {
        if (u_progress < 0.5) {
            return offset * u_progress * 2.0;
        } else {
            return offset * (u_progress - 1.0) * 2.0;
        }
    } else {
        return offset * u_progress * 2.0;
    }
}

void main() {
    float cosTheta = cos(a_data.z);
    float sinTheta = sin(a_data.z);
    mat2 rotate = mat2(
        cosTheta, -sinTheta,
        sinTheta, cosTheta
    );
    vec2 offset = getOffsetByProgress(vec2(-sinTheta * 2.0, -cosTheta * 2.0));
    mat2 scale = createScaleMatrix(a_data.x, a_data.y);
    vec2 off = a_offset + offset;
    vec2 pos = rotate * scale * a_rainVertex + off;
    v_center = off;
    v_pos = pos;
    gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const rainFs = /* glsl */ `
in vec2 v_center;
in vec2 v_data; // 雨滴的宽度与长度
in vec2 v_pos;

uniform vec4 u_color; // 雨滴的颜色

out vec4 outColor;

float random(vec2 uv) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    float ran = random(v_pos);
    vec2 pos = vec2(v_pos.x + ran * 0.01, v_pos.y);
    vec2 texPos = (pos + 1.0) / 2.0;
    texPos.y = 1.0 - texPos.y;
    vec4 tex = texture(u_sampler, texPos);
    outColor = mix(u_color, tex, 0.75);
}
`;

/** 雨滴顶点坐标 */
const vertex = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

interface RainCreateData {
    /** 进度变量 */
    readonly uProgress: IShaderUniform<UniformType.Uniform1f> | null;
    /** 下雨着色器程序 */
    readonly program: ShaderProgram;
}

class RainShader extends GL2 {
    /** 下雨程序 */
    private rainProgram: ShaderProgram | null = null;
    /** 背景程序 */
    private backProgram: ShaderProgram | null = null;

    create(level: number): RainCreateData {
        const gl = this.gl;
        const program = this.createProgram(ShaderProgram);
        program.fs(rainFs);
        program.vs(rainVs);
        program.requestCompile();
        this.useProgram(program);
        const pos = program.defineAttribArray('a_rainVertex');
        program.defineAttribArray('a_offset');
        program.defineAttribArray('a_data');
        program.defineUniform('u_color', this.UNIFORM_4f);
        const uProgress = program.defineUniform('u_progress', this.UNIFORM_1f);
        program.mode(this.DRAW_ARRAYS_INSTANCED);

        if (pos) {
            pos.buffer(vertex, gl.STATIC_DRAW);
            pos.pointer(2, gl.FLOAT, false, 0, 0);
            pos.enable();
        }

        program.paramArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 100 * level);

        this.generateRainPath(level, program);
        this.rainProgram = program;
        this.backProgram = this.createProgram(ShaderProgram);
        this.backProgram.requestCompile();

        return { uProgress, program };
    }

    /**
     * 生成雨滴
     * @param num 雨滴数量
     */
    generateRainPath(level: number, program: ShaderProgram) {
        const num = level * 100;
        const angle = (((Math.random() - 0.5) * Math.PI) / 30) * level;
        const deviation = (Math.PI / 180) * (12 - level);

        const aOffset = program.getAttribArray('a_offset');
        const aData = program.getAttribArray('a_data');
        const color = program.getUniform<UniformType.Uniform4f>('u_color');
        const gl = this.gl;
        if (!aOffset || !aData || !color) return;

        const tan = Math.tan(angle);

        const offset = new Float32Array(num * 2);
        const data = new Float32Array(num * 4);
        const half = num / 2;
        for (let i = 0; i < half; i++) {
            const ox = Math.random() * 3 - 1.5;
            const oy = Math.random() * 2 - 1;
            const rad = angle + (Math.random() - 0.5) * Math.PI * deviation;
            const length = Math.random() * 0.05 + 0.03;
            const width = Math.random() * 0.002 + 0.002;
            offset.set([ox, oy], i * 2);
            data.set([width, length, rad, 0], i * 4);
        }
        for (let i = half; i < num; i++) {
            const ox = Math.random() * 3 - 1.5 + tan * 2;
            const oy = Math.random() * 2 + 1;
            const rad = angle + (Math.random() - 0.5) * Math.PI * deviation;
            const length = Math.random() * 0.05 + 0.03;
            const width = Math.random() * 0.002 + 0.002;
            offset.set([ox, oy], i * 2);
            data.set([width, length, rad, 1], i * 4);
        }

        aOffset.buffer(offset, gl.STATIC_DRAW);
        aData.buffer(data, gl.STATIC_DRAW);
        aOffset.pointer(2, gl.FLOAT, false, 0, 0);
        aOffset.divisor(1);
        aOffset.enable();
        aData.pointer(4, gl.FLOAT, false, 0, 0);
        aData.divisor(1);
        aData.enable();

        color.set(1, 1, 1, 1);
    }

    protected drawScene(
        canvas: MotaOffscreenCanvas2D,
        gl: WebGL2RenderingContext
    ): void {
        const program1 = this.backProgram;
        const program2 = this.rainProgram;
        if (!program1 || !program2) return;
        this.useProgram(program1);
        program1.texTexture('u_sampler', canvas.canvas);
        this.draw(gl, program1);
        this.useProgram(program2);
        program2.texTexture('u_sampler', canvas.canvas);
        this.draw(gl, program2);
    }
}

export class RainWeather extends Weather<GL2> {
    /** 下雨流程的 uniform 变量 */
    private progress: IShaderUniform<UniformType.Uniform1f> | null = null;
    /** 下雨着色器程序 */
    private program: ShaderProgram | null = null;
    /** 一个周期的时长 */
    private duration: number = 1;

    createElement(level: number): GL2 {
        const shader = new RainShader();
        shader.setHD(true);
        const { uProgress, program } = shader.create(level);
        this.progress = uProgress;
        this.program = program;
        this.duration = 5000 - 300 * this.level;
        return shader;
    }

    tick(timestamp: number): void {
        if (!this.element || !this.program) return;
        this.element.update();
        const time = this.duration;
        const progress = (timestamp % time) / time;
        this.progress?.set(progress);
    }

    onDestroy(): void {}
}
