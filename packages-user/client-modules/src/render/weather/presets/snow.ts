import {
    ShaderProgram,
    IShaderUniform,
    UniformType,
    MotaOffscreenCanvas2D,
    GL2
} from '@motajs/render';
import { Weather } from '../weather';

const snowVs = /* glsl */ `
in vec2 a_snowVertex;
in vec2 a_offset; // 雪花的中心位置
in vec4 a_data; // x: 雪花直径; y: 留空; z: 雨滴旋转角度，0表示向下，逆时针为正; 
                // w: 属于哪一种雪，需要两种雪反复循环，一种无法实现循环，0表示第一种，1表示第二种

uniform float u_progress; // 下雪进度，从最上落到最下是0.5个进度，以保证不会出现奇怪的问题

out vec2 v_center;
out vec2 v_data; // 雪花宽度与高度
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
    mat2 scale = createScaleMatrix(a_data.x, a_data.x);
    vec2 off = a_offset + offset;
    vec2 pos = rotate * scale * a_snowVertex + off;
    v_center = off;
    v_pos = pos;
    gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const snowFs = /* glsl */ `
in vec2 v_center;
in vec2 v_data; // 雪花的宽度与长度
in vec2 v_pos;

uniform vec4 u_color; // 雪花的颜色

out vec4 outColor;

void main() {
    vec2 pos = vec2(v_pos.x, v_pos.y);
    vec2 texPos = (pos + 1.0) / 2.0;
    texPos.y = 1.0 - texPos.y;
    vec4 tex = texture(u_sampler, texPos);
    outColor = mix(u_color, tex, 0.2);
}
`;

const CIRCLE_POINTS = 8;

function generateCircle(points: number) {
    const array: number[] = [0, 0];
    for (let i = 0; i < points; i++) {
        const rad = Math.PI * 2 - (Math.PI * 2 * i) / points;
        array.push(Math.cos(rad), Math.sin(rad));
    }
    array.push(Math.cos(0), Math.sin(0));
    return array;
}

/** 雪花顶点坐标 */
const vertex = new Float32Array(generateCircle(CIRCLE_POINTS));

interface SnowCreateData {
    /** 进度变量 */
    readonly uProgress: IShaderUniform<UniformType.Uniform1f> | null;
    /** 下雪着色器程序 */
    readonly program: ShaderProgram;
}

class SnowShader extends GL2 {
    /** 下雪程序 */
    private snowProgram: ShaderProgram | null = null;
    /** 背景程序 */
    private backProgram: ShaderProgram | null = null;

    create(level: number): SnowCreateData {
        const gl = this.gl;
        const program = this.createProgram(ShaderProgram);
        program.fs(snowFs);
        program.vs(snowVs);
        program.requestCompile();
        this.useProgram(program);
        const pos = program.defineAttribArray('a_snowVertex');
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

        program.paramArraysInstanced(
            gl.TRIANGLE_FAN,
            0,
            CIRCLE_POINTS * 2 + 4,
            200 * level
        );

        this.generateSnowPath(level, program);
        this.snowProgram = program;
        this.backProgram = this.createProgram(ShaderProgram);
        this.backProgram.requestCompile();

        return { uProgress, program };
    }

    /**
     * 生成雪花
     * @param level 天气等级
     */
    generateSnowPath(level: number, program: ShaderProgram) {
        const num = level * 200;
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
            const diameter = Math.random() * 0.002 + 0.005;
            offset.set([ox, oy], i * 2);
            data.set([diameter, 0, rad, 0], i * 4);
        }
        for (let i = half; i < num; i++) {
            const ox = Math.random() * 3 - 1.5 + tan * 2;
            const oy = Math.random() * 2 + 1;
            const rad = angle + (Math.random() - 0.5) * Math.PI * deviation;
            const diameter = Math.random() * 0.002 + 0.005;
            offset.set([ox, oy], i * 2);
            data.set([diameter, 0, rad, 1], i * 4);
        }

        aOffset.buffer(offset, gl.STATIC_DRAW);
        aData.buffer(data, gl.STATIC_DRAW);
        aOffset.pointer(2, gl.FLOAT, false, 0, 0);
        aOffset.divisor(1);
        aOffset.enable();
        aData.pointer(4, gl.FLOAT, false, 0, 0);
        aData.divisor(1);
        aData.enable();

        color.set(1, 1, 1, 0.8);
    }

    protected drawScene(
        canvas: MotaOffscreenCanvas2D,
        gl: WebGL2RenderingContext
    ): void {
        const program1 = this.backProgram;
        const program2 = this.snowProgram;
        if (!program1 || !program2) return;
        this.useProgram(program1);
        program1.texTexture('u_sampler', canvas.canvas);
        this.draw(gl, program1);
        this.useProgram(program2);
        this.draw(gl, program2);
    }
}

export class SnowWeather extends Weather<GL2> {
    /** 下雪流程的 uniform 变量 */
    private progress: IShaderUniform<UniformType.Uniform1f> | null = null;
    /** 下雪着色器程序 */
    private program: ShaderProgram | null = null;
    /** 一个周期的时长 */
    private duration: number = 1;

    createElement(level: number): GL2 {
        const shader = new SnowShader();
        shader.setHD(true);
        const { uProgress, program } = shader.create(level);
        this.progress = uProgress;
        this.program = program;
        this.duration = 15000 - 800 * this.level;
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
