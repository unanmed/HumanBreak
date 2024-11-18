import { Shader, ShaderProgram } from '@/core/render/shader';
import { IWeather, WeatherController } from './weather';
import { MotaRenderer } from '@/core/render/render';
import { Container } from '@/core/render/container';
import { GL2Program, IShaderUniform, UniformType } from '@/core/render/gl2';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { Transform } from '@/core/render/transform';

const snowVs = /* glsl */ `
in vec2 a_snowVertex;
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
    
    // const int segments = 32; // 圆的分段数
    // float angleIncrement = 2.0 * 3.14159265359 / float(segments);
    // vec2 a_roundVertex[segments];
    // for (int i = 0; i < segments; i++) {
    //     float angle = float(i) * angleIncrement;
    //     a_roundVertex[i] = vec2(cos(angle), sin(angle)); // 生成单位圆的顶点
    // }

    // vec2 pos = rotate * scale * a_roundVertex + off;
    vec2 pos = rotate * scale * a_snowVertex + off;
    v_center = off;
    v_pos = pos;
    gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const snowFs = /* glsl */ `
in vec2 v_center;
in vec2 v_data; // 雨滴的宽度与长度
in vec2 v_pos;

uniform vec4 u_color; // 雨滴的颜色

out vec4 outColor;

float random(vec2 uv) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    
    float distanceFromCenter = length(v_pos - v_center);
    if (distanceFromCenter < 0.05) {
        outColor = u_color; // 雪花颜色
    } else {
        // outColor = vec4(0.0, 0.0, 0.0, 0.2);
        discard; // 不绘制超出圆的部分
    }

    // float ran = random(v_pos);
    // vec2 pos = vec2(v_pos.x + ran * 0.01, v_pos.y);
    // vec2 texPos = (pos + 1.0) / 2.0;
    // texPos.y = 1.0 - texPos.y;
    // vec4 tex = texture(u_sampler, texPos);
    // // outColor = mix(u_color, tex, 0.9);
    // outColor = u_color;
}
`;

/** 雨滴顶点坐标 */
const vertex = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

Mota.require('var', 'loading').once('coreInit', () => {
    const shader = new SnowShader();
    const gl = shader.gl;
    shader.size(480, 480);
    shader.setHD(true);
    SnowWeather.shader = shader;
    const program = shader.createProgram(ShaderProgram);
    program.fs(snowFs);
    program.vs(snowVs);
    program.requestCompile();
    const pos = program.defineAttribArray('a_snowVertex');
    program.defineAttribArray('a_offset');
    program.defineAttribArray('a_data');
    program.defineUniform('u_progress', shader.UNIFORM_1f);
    program.defineUniform('u_color', shader.UNIFORM_4f);
    program.mode(shader.DRAW_ARRAYS_INSTANCED);
    SnowShader.snowProgram = program;
    shader.useProgram(program);

    if (pos) {
        pos.buffer(vertex, gl.STATIC_DRAW);
        pos.pointer(2, gl.FLOAT, false, 0, 0);
        pos.enable();
    }
});

export class SnowWeather implements IWeather {
    static id: string = 'snow';

    static shader: SnowShader;

    private progress: IShaderUniform<UniformType.Uniform1f> | null = null;

    constructor(readonly level: number = 5) {}

    activate(): void {
        const render = MotaRenderer.get('render-main');
        const draw = render?.getElementById('map-draw') as Container;
        if (!draw) return;
        const shader = SnowWeather.shader;
        shader.append(draw);

        const gl = shader.gl;
        const program = SnowShader.snowProgram;
        program.paramArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 100 * this.level);

        this.progress = program.getUniform<UniformType.Uniform1f>('u_progress');
        shader.generateSnowPath(
            this.level * 100,
            (((Math.random() - 0.5) * Math.PI) / 30) * this.level,
            (Math.PI / 180) * (12 - this.level)
        );
    }

    frame(): void {
        SnowWeather.shader.update(SnowWeather.shader);
        const time = 5000 - 400 * this.level;
        const progress = (Date.now() % time) / time;

        SnowWeather.shader.useProgram(SnowShader.snowProgram);
        this.progress?.set(progress);
    }

    deactivate(): void {
        const render = MotaRenderer.get('render-main');
        const layer = render?.getElementById('layer-main');
        const draw = render?.getElementById('map-draw') as Container;
        if (!layer || !draw) return;
        const shader = SnowWeather.shader;
        layer.append(draw);
        shader.remove();
    }
}

WeatherController.register(SnowWeather);

class SnowShader extends Shader {
    static snowProgram: ShaderProgram;
    static backProgram: ShaderProgram;

    /**
     * 生成雨滴
     * @param num 雨滴数量
     */
    generateSnowPath(num: number, angle: number, deviation: number) {
        const program = SnowShader.snowProgram;
        SnowWeather.shader.useProgram(program);
        const aOffset = program.getAttribArray('a_offset');
        const aData = program.getAttribArray('a_data');
        const color = program.getUniform<UniformType.Uniform4f>('u_color');
        const gl = this.gl;
        if (!aOffset || !aData) return;

        const tan = Math.tan(angle);

        const offset = new Float32Array(num * 2);
        const data = new Float32Array(num * 4);
        const half = num / 2;
        for (let i = 0; i < half; i++) {
            const ox = Math.random() * 3 - 1.5;
            const oy = Math.random() * 2 - 1;
            const rad = angle + (Math.random() - 0.5) * Math.PI * deviation;
            const length = Math.random() * 0.05 + 0.03;
            const width = Math.random() * 0.05 + 0.03;
            offset.set([ox, oy], i * 2);
            data.set([width, length, rad, 0], i * 4);
        }
        for (let i = half; i < num; i++) {
            const ox = Math.random() * 3 - 1.5 + tan * 2;
            const oy = Math.random() * 2 + 1;
            const rad = angle + (Math.random() - 0.5) * Math.PI * deviation;
            const length = Math.random() * 0.1 + 0.05;
            const width = Math.random() * 0.1 + 0.05;
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

        program.paramArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, num);
        color?.set(1, 1, 1, 0.1);
    }

    protected preDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): boolean {
        const snow = SnowShader.snowProgram;
        const snowParam = snow.getDrawParams(this.DRAW_ARRAYS_INSTANCED);
        if (!snowParam) return false;
        this.useProgram(snow);
        if (!snow.ready()) return false;
        this.draw(gl, snow);
        return false;
    }
}
