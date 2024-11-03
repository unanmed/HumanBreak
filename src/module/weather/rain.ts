import {
    IShaderUniform,
    Shader,
    ShaderProgram,
    UniformType
} from '@/core/render/shader';
import { IWeather, WeatherController } from './weather';
import { MotaRenderer } from '@/core/render/render';
import { Container } from '@/core/render/container';

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
    outColor = mix(u_color, tex, 0.9);
}
`;

/** 雨滴顶点坐标 */
const vertex = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

Mota.require('var', 'loading').once('coreInit', () => {
    const shader = new RainShader();
    const gl = shader.gl;
    shader.size(480, 480);
    shader.setHD(true);
    RainWeather.shader = shader;
    const program = shader.createProgram();
    program.setVersion(shader.VERSION_ES_300);
    program.fs(rainFs);
    program.vs(rainVs);
    program.requestCompile();
    program.useDefault(false);
    const pos = program.defineAttribArray('a_rainVertex');
    program.defineAttribArray('a_offset');
    program.defineAttribArray('a_data');
    program.defineUniform('u_progress', shader.UNIFORM_1f);
    program.defineUniform('u_color', shader.UNIFORM_4f);
    program.mode(shader.DRAW_ARRAYS_INSTANCED);
    RainShader.rainProgram = program;
    shader.useProgram(program);

    if (pos) {
        pos.buffer(vertex, gl.STATIC_DRAW);
        pos.pointer(2, gl.FLOAT, false, 0, 0);
        pos.enable();
    }

    const back = shader.createProgram();
    back.requestCompile();
    back.modified = true;
    back.useDefault(false);
    RainShader.backProgram = back;
    shader.useProgram(back);
});

export class RainWeather implements IWeather {
    static id: string = 'rain';

    static shader: RainShader;

    private progress: IShaderUniform<UniformType.Uniform1f> | null = null;

    constructor(readonly level: number = 5) {}

    activate(): void {
        const render = MotaRenderer.get('render-main');
        const layer = render?.getElementById('layer-main');
        const draw = render?.getElementById('map-draw') as Container;
        if (!layer || !draw) return;
        const shader = RainWeather.shader;
        layer.append(shader);
        shader.append(draw);

        const gl = shader.gl;
        const program = RainShader.rainProgram;
        program.paramArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 100 * this.level);

        this.progress = program.getUniform<UniformType.Uniform1f>('u_progress');
        shader.generateRainPath(
            this.level * 100,
            (((Math.random() - 0.5) * Math.PI) / 30) * this.level,
            (Math.PI / 180) * (12 - this.level)
        );
    }

    frame(): void {
        RainWeather.shader.update(RainWeather.shader);
        const time = 5000 - 400 * this.level;
        const progress = (Date.now() % time) / time;

        RainWeather.shader.useProgram(RainShader.rainProgram);
        this.progress?.set(progress);
    }

    deactivate(): void {
        const render = MotaRenderer.get('render-main');
        const layer = render?.getElementById('layer-main');
        const draw = render?.getElementById('map-draw') as Container;
        if (!layer || !draw) return;
        const shader = RainWeather.shader;
        layer.append(draw);
        shader.remove();
    }
}

WeatherController.register(RainWeather);

class RainShader extends Shader {
    static rainProgram: ShaderProgram;
    static backProgram: ShaderProgram;

    /**
     * 生成雨滴
     * @param num 雨滴数量
     */
    generateRainPath(num: number, angle: number, deviation: number) {
        const program = RainShader.rainProgram;
        RainWeather.shader.useProgram(program);
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
            const width = Math.random() * 0.002 + 0.002;
            offset.set([ox, oy], i * 2);
            data.set([width, length, rad, 0], i * 4);
        }
        for (let i = half; i < num; i++) {
            const ox = Math.random() * 3 - 1.5 + tan * 2;
            const oy = Math.random() * 2 + 1;
            const rad = angle + (Math.random() - 0.5) * Math.PI * deviation;
            const length = Math.random() * 0.1 + 0.05;
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

        program.paramArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, num);
        color?.set(1, 1, 1, 0.1);
    }

    protected override preDraw(gl: WebGL2RenderingContext): boolean {
        const back = RainShader.backProgram;
        const rain = RainShader.rainProgram;
        this.useProgram(back);
        const ready = this.defaultReady();
        const param = back.getDrawParams(this.DRAW_ELEMENTS);
        const rainParam = rain.getDrawParams(this.DRAW_ARRAYS_INSTANCED);
        if (!ready || !param || !rainParam) return false;

        this.draw(gl, back, param, back.usingIndices);
        this.useProgram(rain);
        this.draw(gl, rain, rainParam, null);

        return false;
    }
}
