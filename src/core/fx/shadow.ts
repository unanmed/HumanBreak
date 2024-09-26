import { mat4 } from 'gl-matrix';
import { logger } from '../common/logger';
import {
    WebGLColorArray,
    createProgram,
    isWebGL2Supported
} from './webgl';
import { ILayerRenderExtends, Layer } from '../render/preset/layer';
import { HeroRenderer } from '../render/preset/hero';
import { Sprite } from '../render/sprite';

/** 
 * 最大光源数量，必须设置，且光源数不能超过这个值，这个值决定了会预留多少的缓冲区，因此最好尽可能小，同时游戏过程中不可修改
 * 这个值越大，对显卡尤其是显存的要求会越大，不过考虑到各种设备的性能差异，不建议超过10
 */
const MAX_LIGHT_NUM = 5;
/** 阴影层的Z值 */
const Z_INDEX = 55;
// 我也不知道这个数怎么来的，试出来是这个，别动就行
const FOVY = Math.PI / 2;
const ignore: Set<AllNumbers> = new Set([660, 661]);

interface LightConfig {
    decay: number;
    r: number;
    color: WebGLColorArray;
    noShelter?: boolean;
}

interface ShadowConfig {
    background?: WebGLColorArray;
    immerse?: number;
    blur?: number;
}

function addLightFromBlock(floors: FloorIds[], block: number, config: LightConfig, sc?: ShadowConfig, hero?: LightConfig) {
    floors.forEach(v => {
        const shadow = new Shadow(v);
        shadow.background = [0, 0, 0, 0.2];
        if (sc) {
            if (sc.background) shadow.background = sc.background;
            if (sc.blur) shadow.blur = sc.blur;
            if (sc.immerse) shadow.immerse = sc.immerse;
        }
        if (hero) {
            shadow.addLight({
                id: `${v}_hero`,
                x: 0,
                y: 0,
                decay: hero.decay,
                r: hero.r,
                color: hero.color,
                followHero: true,
                noShelter: hero.noShelter
            });
        }
        core.floors[v].map.forEach((arr, y) => {
            arr.forEach((num, x) => {
                if (num === block) {
                    shadow.addLight({
                        id: `${v}_${x}_${y}`,
                        x: x * 32 + 16,
                        y: y * 32 + 16,
                        decay: config.decay,
                        r: config.r,
                        color: config.color,
                        noShelter: config.noShelter
                    });
                }
            });
        });
    })
}

const hook = Mota.require('var', 'hook');

hook.once('reset', () => {
    Shadow.init();
    addLightFromBlock(
        core.floorIds.slice(61, 70).concat(core.floorIds.slice(72, 81)).concat(core.floorIds.slice(85, 103)),
        103,
        { decay: 50, r: 300, color: [0.9333, 0.6, 0.333, 0.3] },
        { background: [0, 0, 0, 0.2] },
        { decay: 50, r: 250, color: [0, 0, 0, 0] }
    );
    addLightFromBlock(
        ['MT50', 'MT60', 'MT61', 'MT72', 'MT73', 'MT74', 'MT75'],
        103,
        { decay: 20, r: 150, color: [0.9333, 0.6, 0.333, 0.3], noShelter: true },
        { background: [0, 0, 0, 0.3] }
    );
    // Shadow.mount();

    // 勇士身上的光源
    // Mota.rewrite(core.control, 'drawHero', 'add', () => {
    //     if (core.getFlag('__heroOpacity__') !== 0) {
    //         const shadow = Shadow.now();
    //         if (shadow) {
    //             shadow.followHero.forEach(v => {
    //                 shadow.modifyLight(v, {
    //                     x: core.status.heroCenter.px, 
    //                     y: core.status.heroCenter.py + 8
    //                 });
    //             });
    //             if (shadow.followHero.size > 0) shadow.requestRefresh();
    //         }
    //     }
    // });
    // 更新地形数据
    // Mota.rewrite(core.maps, 'removeBlock', 'add', success => {
    //     if (success && !main.replayChecking) {
    //         Shadow.update(true);
    //     }
    //     return success;
    // });
    // Mota.rewrite(core.maps, 'setBlock', 'add', () => {
    //     if (!main.replayChecking) {
    //         Shadow.update(true);
    //     }
    // });
    Mota.rewrite(core.control, 'loadData', 'add', () => {
        if (!main.replayChecking) {
            Shadow.update(true);
            LayerShadowExtends.shadowList.forEach(v => v.update());
        }
    });
    // Mota.require('var', 'hook').on('changingFloor', (floorId) => {
    //     if (!main.replayChecking) {
    //         Shadow.clearBuffer();
    //         Shadow.update();
    //         setCanvasFilterByFloorId(floorId);
    //     }
    // })
});
hook.on('reset', () => {
    Shadow.update(true);
    LayerShadowExtends.shadowList.forEach(v => v.update());
})
hook.on('setBlock', () => {
    Shadow.update(true);
    LayerShadowExtends.shadowList.forEach(v => v.update());
})
hook.on('changingFloor', floorId => {        
    Shadow.clearBuffer();
    Shadow.update(true);
    // setCanvasFilterByFloorId(floorId);
    LayerShadowExtends.shadowList.forEach(v => v.update());
})

// 深度测试着色器

const depthVertex = /* glsl */ `
precision mediump float;

attribute vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;

void main() {
    gl_Position = u_projection * u_view * a_position;
}
`;
const depthFragment = /* glsl */ `
void main() {
    // 深度测试中不需要片元着色器
    gl_FragColor = vec4(0.7, 0.7, 0.7, 1.0);
}
`;

// 渲染着色器
const colorVertex = /* glsl */ `#version 300 es
precision mediump float;

in vec2 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = a_texcoord;
}
`;
const colorFragment = /* glsl */ `#version 300 es
precision mediump float;
precision mediump sampler2DArray;

in vec2 v_texcoord;

uniform sampler2DArray u_depthTexture; // 深度检测结果
uniform vec4 u_background; // 背景色
uniform int u_lightCount;
uniform vec2 u_screen; // 画布大小信息

layout (std140) uniform LightInfo {
    vec2 pos[${MAX_LIGHT_NUM}]; // 光源坐标
    vec4 color[${MAX_LIGHT_NUM}]; // 光源颜色
    vec3 decay[${MAX_LIGHT_NUM}]; // 光源半径、开始衰减半径、是否会被遮挡
};

out vec4 outColor;

vec4 blend(vec4 color1, vec4 color2) {
    vec3 co = color2.rgb * color2.a + color1.rgb * color1.a * (1.0 - color2.a);
    float ao = color2.a + color1.a * (1.0 - color2.a);
    return vec4(co, ao);
}

void main() {
    vec4 lightColor = vec4(0.0, 0.0, 0.0, 0.0);
    float strengthTotal = 0.0;

    for (int i = 0; i < u_lightCount; i++) {
        vec2 p = pos[i];
        vec4 c = color[i];
        vec3 d = decay[i];
        vec2 loc = vec2((gl_FragCoord.x - p.x) / u_screen.x / 2.0 + 0.5, (gl_FragCoord.y - p.y) / u_screen.y / 2.0 + 0.5);
        float sheltered = texture(u_depthTexture, vec3(loc, i)).a;

        float dis = distance(gl_FragCoord.xy, p); // 计算距离
        float strength = clamp((dis - d.r) / (d.g - d.r), 0.0, 1.0); // 限制强度范围

        if (sheltered > 0.5 && d.z < 0.5) strength = 0.0; // 遮挡逻辑

        strengthTotal += strength; // 累计强度
        lightColor = mix(lightColor, vec4(c.rgb, c.a), strength); // 混合光源颜色
    }
    if (strengthTotal > 1.0) strengthTotal = 1.0;

    outColor = blend(vec4(u_background.rgb, u_background.a * (1.0 - strengthTotal)), lightColor);
}
`;

// 高斯模糊着色器，顶点着色器依然可以使用colorVertex
const blur1Fragment = /* glsl */ `#version 300 es
precision mediump float;

uniform sampler2D u_texture; // 输入纹理
uniform float u_blurRadius;  // 模糊半径
uniform vec2 u_textureSize;  // 纹理的大小

in vec2 v_texcoord;  // 接受顶点着色器传递的纹理坐标
out vec4 fragColor;  // 输出颜色

// 计算高斯权重
float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.141592653589793) * sigma);
}

void main() {
    float sigma = u_blurRadius / 3.0;  // 标准差
    int kernelSize = int(u_blurRadius) * 2 + 1; // 高斯核的大小
    float sum = 0.0;  // 权重总和
    vec4 color = vec4(0.0); // 初始颜色

    for (int i = -int(u_blurRadius); i <= int(u_blurRadius); i++) {
        float weight = gaussian(float(i), sigma);  // 计算权重
        sum += weight;  // 权重累积
        vec2 offset = vec2(i, 0) / u_textureSize;  // 水平方向偏移
        float x = v_texcoord.x + offset.x;
        float y = v_texcoord.y + offset.y;
        if (x < 0.0 || y < 0.0 || x > 1.0 || y > 1.0) continue;
        color += texture(u_texture, vec2(x, y)) * weight;  // 采样并加权
    }

    fragColor = color / sum;  // 归一化结果
}
`;
const blur2Fragment = /* glsl */ `#version 300 es
precision mediump float;

uniform sampler2D u_texture; // 输入纹理
uniform float u_blurRadius;  // 模糊半径
uniform vec2 u_textureSize;  // 纹理的大小

in vec2 v_texcoord;  // 接受顶点着色器传递的纹理坐标
out vec4 fragColor;  // 输出颜色

// 计算高斯权重
float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.141592653589793) * sigma);
}

void main() {
    float sigma = u_blurRadius / 3.0;  // 标准差
    int kernelSize = int(u_blurRadius) * 2 + 1; // 高斯核的大小
    float sum = 0.0;  // 权重总和
    vec4 color = vec4(0.0); // 初始颜色

    for (int i = -int(u_blurRadius); i <= int(u_blurRadius); i++) {
        float weight = gaussian(float(i), sigma);  // 计算权重
        sum += weight;  // 权重累积
        vec2 offset = vec2(0, i) / u_textureSize;  // 垂直方向偏移
        color += texture(u_texture, v_texcoord + offset) * weight;  // 采样并加权
    }

    fragColor = color / sum;  // 归一化结果
}
`;


interface ShadowProgram {
    depth: WebGLProgram;
    color: WebGLProgram;
    blur1: WebGLProgram;
    blur2: WebGLProgram;
}

interface ShadowCache {
    position: Float32Array;
}

interface LightInfo {
    id: string;
    x: number;
    y: number;
    r: number;
    decay: number;
    color: WebGLColorArray;
    noShelter?: boolean;
    followHero?: boolean;
}

interface ShadowLocations {
    depth: {
        a_position: number;
        u_projection: WebGLUniformLocation;
        u_view: WebGLUniformLocation;
    };
    color: {
        a_position: number;
        a_texcoord: number;
        u_background: WebGLUniformLocation;
        u_lightCount: WebGLUniformLocation;
        u_screen: WebGLUniformLocation;
        u_depthTexture: WebGLUniformLocation;
        LightInfo: number;
    };
    blur1: {
        a_position: number;
        a_texcoord: number;
        u_texture: WebGLUniformLocation;
        u_textureSize: WebGLUniformLocation;
        u_blurRadius: WebGLUniformLocation;
    };
    blur2: {
        a_position: number;
        a_texcoord: number;
        u_texture: WebGLUniformLocation;
        u_textureSize: WebGLUniformLocation;
        u_blurRadius: WebGLUniformLocation;
    };
}

interface ShadowMatrix {
    projection: mat4;
}

interface ShadowBuffer {
    depth: {
        position: WebGLBuffer;
        framebuffer: WebGLFramebuffer[];
    };
    color: {
        position: WebGLBuffer;
        texcoord: WebGLBuffer;
        indices: WebGLBuffer;
        lights: WebGLBuffer;
        framebuffer: WebGLFramebuffer;
    };
    blur1: {
        position: WebGLBuffer;
        texcoord: WebGLBuffer;
        indices: WebGLBuffer;
        framebuffer: WebGLFramebuffer;
    };
    blur2: {
        position: WebGLBuffer;
        texcoord: WebGLBuffer;
        indices: WebGLBuffer;
    };
}

interface ShadowTexture {
    depth: WebGLTexture;
    color: WebGLTexture;
    blur: WebGLTexture;
}

export class Shadow {
    static canvas: HTMLCanvasElement;
    static gl: WebGL2RenderingContext;
    static program: ShadowProgram;

    static map: Partial<Record<FloorIds, Shadow>> = {};

    private static locations: ShadowLocations;
    private static martix: ShadowMatrix;
    private static buffer: ShadowBuffer;
    private static texture: ShadowTexture;
    private static cached: Set<FloorIds> = new Set();

    floorId: FloorIds;
    lights: LightInfo[] = [];
    immerse: number = 4;
    blur: number = 4;
    background: WebGLColorArray = [0, 0, 0, 0];
    originLightInfo: Record<string, LightInfo> = {};
    followHero: Set<string> = new Set();

    private cache?: ShadowCache;

    private needRefresh: boolean = false;
    private refreshNoCache: boolean = false;

    constructor(floor: FloorIds) {
        this.floorId = floor;
        Shadow.map[floor] = this;
    }

    /**
     * 计算墙壁的立体信息，用于深度测试
     * @param nocache 是否不使用缓存
     */
    calShadowInfo(nocache: boolean = false) {
        if (!nocache && this.cache && Shadow.cached.has(this.floorId)) return this.cache;        
        Shadow.cached.add(this.floorId);
        Shadow.clearBuffer();

        const polygons = calMapPolygons(this.floorId, this.immerse, nocache);

        const res: number[] = [];
        const ratio = devicePixelRatio * core.domStyle.scale;
        const m = core._PX_ * ratio * 2;

        polygons.forEach(v => {
            v.forEach(([x, y, w, h]) => {
                const l = x * ratio;
                const b = (core._PY_ - y) * ratio;
                const r = (x + w) * ratio;
                const t = (core._PY_ - (y + h)) * ratio;
                res.push(
                    // 上边缘
                    l, t, 0,
                    l, t, m,
                    r, t, m,
                    r, t, 0,
                    r, t, m,
                    l, t, 0,
                    // 右
                    r, t, 0,
                    r, t, m,
                    r, b, m,
                    r, b, 0,
                    r, b, m,
                    r, t, 0,
                    // 下
                    r, b, 0,
                    r, b, m,
                    l, b, m,
                    l, b, 0,
                    l, b, m,
                    r, b, 0,
                    // 左
                    l, b, 0,
                    l, b, m,
                    l, t, m,
                    l, t, 0,
                    l, t, m,
                    l, b, 0
                );
            });
        });

        return (this.cache = { position: new Float32Array(res) });
    }

    /**
     * 添加一个光源
     */
    addLight(info: LightInfo) {
        if (this.originLightInfo[info.id]) {
            logger.warn(19, info.id);
            return;
        }
        this.originLightInfo[info.id] = info;
        this.lights.push({
            ...info,
            y: core._PY_ - info.y
        });
        if (info.followHero) {
            this.followHero.add(info.id);
        }
        this.requestRefresh();
    }

    /**
     * 移除一个光源
     * @param id 要移除的光源id
     */
    removeLight(id: string) {
        const index = this.lights.findIndex(v => v.id === id);
        this.lights.splice(index, 1);
        delete this.originLightInfo[id]
        this.followHero.delete(id);
        this.requestRefresh();
    }

    /**
     * 修改光源信息，注意不能直接对光源操作，如果需要操作务必使用本函数
     * @param id 要修改的光源id
     * @param light 修改的信息，例如想修改x就填 { x: 100 }
     */
    modifyLight(id: string, light: Partial<LightInfo>) {
        const origin = this.originLightInfo[id];
        const l = this.lights.find(v => v.id === id);
        if (!origin || !l) return;
        for (const [key, value] of Object.entries(light)) {
            const k = key as keyof LightInfo;
            // @ts-ignore
            origin[k] = value;
            if (k === 'y') {
                l.y = core._PY_ - (value as number);
            } else {
                // @ts-ignore
                l[k] = value;
            }
        }
    }

    /**
     * 刷新阴影信息，并重新渲染
     * @param nocahce 是否不使用缓存
     */
    requestRefresh(nocahce: boolean = false) {
        if (core.status.floorId !== this.floorId) return;
        if (nocahce) this.refreshNoCache = true;
        if (this.needRefresh) return;

        requestAnimationFrame(() => {
            this.refresh(this.refreshNoCache);
            this.refreshNoCache = false;
        });
    }

    /**
     * 渲染阴影
     * @param nocache 是否不使用缓存
     * @param resize 是否resize canvas
     */
    private refresh(nocache: boolean = false, resize: boolean = false) {        
        this.calShadowInfo(nocache);
        if (resize) {
            Shadow.resizeCanvas();
        }

        // clear
        const canvas = Shadow.canvas;
        const gl = Shadow.gl;
        const ratio = core.domStyle.scale * devicePixelRatio;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ZERO);

        // depth test
        gl.useProgram(Shadow.program.depth);
        const lightProjection = Shadow.martix.projection

        // 使用 3D 纹理存储深度信息
        const texture = Shadow.texture.depth;
        const info = this.calShadowInfo(nocache).position;
        const length = info.length;
        const positionBuffer = Shadow.buffer.depth.position;
        const position = Shadow.locations.depth.a_position;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, info, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
        const proj = Shadow.locations.depth.u_projection;
        const view = Shadow.locations.depth.u_view;

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        this.lights.forEach((light, i) => {
            this.depthTest(lightProjection, light, i, texture, length, proj, view);
        });

        gl.disableVertexAttribArray(position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(info.length), gl.STATIC_DRAW);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // render
        gl.useProgram(Shadow.program.color);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Buffers
        const posColor = Shadow.locations.color.a_position;
        const texColor = Shadow.locations.color.a_texcoord;
        const posColorBuffer = Shadow.buffer.color.position;
        gl.bindBuffer(gl.ARRAY_BUFFER, posColorBuffer);
        gl.enableVertexAttribArray(posColor);
        gl.vertexAttribPointer(posColor, 2, gl.FLOAT, false, 0, 0);
        const texColorBuffer = Shadow.buffer.color.texcoord;
        gl.bindBuffer(gl.ARRAY_BUFFER, texColorBuffer);
        gl.enableVertexAttribArray(texColor);
        gl.vertexAttribPointer(texColor, 2, gl.FLOAT, false, 0, 0);
        const buffer = Shadow.buffer.color.indices;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

        // Background & lightCount
        const backgroundPos = Shadow.locations.color.u_background;
        gl.uniform4f(backgroundPos, ...this.background);
        const lightCountPos = Shadow.locations.color.u_lightCount;
        gl.uniform1i(lightCountPos, this.lights.length);
        const screenPos = Shadow.locations.color.u_screen;
        gl.uniform2f(screenPos, canvas.width, canvas.height);

        // Texture
        const textureLoc = Shadow.locations.color.u_depthTexture;
        gl.uniform1i(textureLoc, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);

        // UBO
        const data = [];
        for (let i = 0; i < MAX_LIGHT_NUM; i++) {
            if (this.lights[i]) {
                const v = this.lights[i];
                data.push(
                    // 坐标
                    v.x * ratio, v.y * ratio, 0, 0 // 填充到 4 个分量以确保对齐
                );
            } else {
                // 如果没有光源，添加填充以确保统一缓冲区大小保持一致
                data.push(
                    0, 0, 0, 0
                );
            }
        }
        for (let i = 0; i < MAX_LIGHT_NUM; i++) {
            if (this.lights[i]) {
                const v = this.lights[i];
                data.push(
                    // 颜色
                    v.color[0], v.color[1], v.color[2], v.color[3] // 4 个分量的颜色
                );
            } else {
                // 如果没有光源，添加填充以确保统一缓冲区大小保持一致
                data.push(
                    0, 0, 0, 0
                );
            }
        }
        for (let i = 0; i < MAX_LIGHT_NUM; i++) {
            if (this.lights[i]) {
                const v = this.lights[i];
                data.push(
                    // 半径、衰减半径、遮挡
                    v.r * ratio, v.decay * ratio, v.noShelter ? 1 : 0, 0 // 填充到 4 个分量
                );
            } else {
                // 如果没有光源，添加填充以确保统一缓冲区大小保持一致
                data.push(
                    0, 0, 0, 0
                );
            }
        }

        const blockIndex = Shadow.locations.color.LightInfo;

        const lightsBuffer = Shadow.buffer.color.lights;
        gl.bindBuffer(gl.UNIFORM_BUFFER, lightsBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.uniformBlockBinding(Shadow.program.color, blockIndex, 0);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, lightsBuffer);

        // Render to framebuffer
        const colorTexture = Shadow.texture.color;
        const colorFramebuffer = Shadow.buffer.color.framebuffer;
        gl.enable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, colorFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disableVertexAttribArray(posColor);
        gl.disableVertexAttribArray(texColor);

        // Apply blur
        gl.useProgram(Shadow.program.blur1);

        // Buffer
        const posBlur1 = Shadow.locations.blur1.a_position;
        const texBlur1 = Shadow.locations.blur1.a_texcoord;
        const posBlur1Buffer = Shadow.buffer.blur1.position;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBlur1Buffer);
        gl.enableVertexAttribArray(posBlur1);
        gl.vertexAttribPointer(posBlur1, 2, gl.FLOAT, false, 0, 0);
        const texBlur1Buffer = Shadow.buffer.blur1.texcoord;
        gl.bindBuffer(gl.ARRAY_BUFFER, texBlur1Buffer);
        gl.enableVertexAttribArray(texBlur1);
        gl.vertexAttribPointer(texBlur1, 2, gl.FLOAT, false, 0, 0);
        const blur1IndicesBuffer = Shadow.buffer.blur1.indices;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, blur1IndicesBuffer);
        const blur1Indices = new Uint16Array([0, 1, 2, 2, 3, 1]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, blur1Indices, gl.STATIC_DRAW);

        // Texture
        const blur1TextureLoc = Shadow.locations.blur1.u_texture;
        const blur1TextureSizeLoc = Shadow.locations.blur1.u_textureSize;
        const blur1BlurRadiusLoc = Shadow.locations.blur1.u_blurRadius;
        gl.uniform1i(blur1TextureLoc, 0);
        gl.uniform1f(blur1BlurRadiusLoc, this.blur * ratio);
        gl.uniform2f(blur1TextureSizeLoc, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        // Render blur
        const blurTexture = Shadow.texture.blur;
        const blurFramebuffer = Shadow.buffer.blur1.framebuffer;
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, blurTexture, 0);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disableVertexAttribArray(posBlur1);
        gl.disableVertexAttribArray(texBlur1);

        // Applay blur 2
        gl.useProgram(Shadow.program.blur2);

        // Buffer
        const posBlur2 = Shadow.locations.blur2.a_position;
        const texBlur2 = Shadow.locations.blur2.a_texcoord;
        const posBlur2Buffer = Shadow.buffer.blur2.position;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBlur2Buffer);
        gl.enableVertexAttribArray(posBlur1);
        gl.vertexAttribPointer(posBlur2, 2, gl.FLOAT, false, 0, 0);
        const textBlur2Buffer = Shadow.buffer.blur2.texcoord;
        gl.bindBuffer(gl.ARRAY_BUFFER, textBlur2Buffer);
        gl.enableVertexAttribArray(texBlur2);
        gl.vertexAttribPointer(texBlur2, 2, gl.FLOAT, false, 0, 0);
        const blur2IndicesBuffer = Shadow.buffer.blur2.indices;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, blur2IndicesBuffer);
    
        // Texture
        const blur2TextureLoc = Shadow.locations.blur2.u_texture;
        const blur2TextureSizeLoc = Shadow.locations.blur2.u_textureSize;
        const blur2BlurRadiusLoc = Shadow.locations.blur2.u_blurRadius;
        gl.uniform1i(blur2TextureLoc, 0);
        gl.uniform1f(blur2BlurRadiusLoc, this.blur * ratio);
        gl.uniform2f(blur2TextureSizeLoc, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, blurTexture);

        // Render to target
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disableVertexAttribArray(posBlur2);
        gl.disableVertexAttribArray(texBlur2);
    }

    private depthTest(
        lightProjection: mat4,
        light: LightInfo,
        index: number,
        texture: WebGLTexture,
        length: number,
        proj: WebGLUniformLocation,
        view: WebGLUniformLocation
    ) {
        const gl = Shadow.gl;
        const ratio = core.domStyle.scale * devicePixelRatio;
        const cameraMatrix = mat4.create();
        mat4.lookAt(cameraMatrix, [light.x * ratio, light.y * ratio, core._PX_ * 2 * ratio], [light.x * ratio, light.y * ratio, 0], [0, 1, 0]);

        const size = core._PX_ * ratio * 2;
        gl.viewport(0, 0, size, size);
        const framebuffer = Shadow.buffer.depth.framebuffer[index];
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texture, 0, index);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        gl.uniformMatrix4fv(proj, false, lightProjection);
        gl.uniformMatrix4fv(view, false, cameraMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, length);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return framebuffer;
    }

    private static create3DTexture(size: number, depth: number) {
        const gl = Shadow.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
        gl.texImage3D(
            gl.TEXTURE_2D_ARRAY,
            0,
            gl.RGBA,
            size * 2,
            size * 2,
            depth, // 层数
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return texture!;
    }

    private static create2DTexture(size: number) {        
        const gl = Shadow.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            size,
            size,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture!;
    }

    private static initBuffer(pos: Float32Array) {
        const gl = this.gl;
        const posBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return posBuffer;
    }

    private static initIndicesBuffer() {
        const gl = this.gl;
        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        const indices = new Uint16Array([0, 1, 2, 2, 3, 1]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return buffer;
    }

    static resizeCanvas() {
        const canvas = this.canvas;
        const scale = core.domStyle.scale;
        const ratio = scale * devicePixelRatio;

        canvas.width = core._PX_ * ratio;
        canvas.height = core._PY_ * ratio;
        canvas.style.left = `0px`;
        canvas.style.top = `0px`;
        canvas.style.width = `${scale * core._PX_}px`;
        canvas.style.height = `${scale * core._PY_}px`;

        // Texture
        const gl = this.gl;
        gl.deleteTexture(this.texture.blur);
        gl.deleteTexture(this.texture.color);
        gl.deleteTexture(this.texture.depth);

        this.texture.blur = this.create2DTexture(canvas.width);
        this.texture.color = this.create2DTexture(canvas.width);
        this.texture.depth = this.create3DTexture(canvas.width, MAX_LIGHT_NUM);

        Shadow.cached.clear();

        this.now()?.requestRefresh();
    }

    /**
     * 初始化阴影绘制
     */
    static init() {
        const gl = this.gl;
        if (!isWebGL2Supported()) return;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        const ratio = core.domStyle.scale * devicePixelRatio;

        // program
        const depth = createProgram(gl, depthVertex, depthFragment);
        const color = createProgram(gl, colorVertex, colorFragment);
        const blur1 = createProgram(gl, colorVertex, blur1Fragment);
        const blur2 = createProgram(gl, colorVertex, blur2Fragment);

        this.program = { depth, color, blur1, blur2 };

        // canvas
        const canvas = this.canvas;
        canvas.id = `shadow`;
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = Z_INDEX.toString();

        // Locations
        this.locations = {
            depth: {
                a_position: gl.getAttribLocation(depth, 'a_position')!,
                u_projection: gl.getUniformLocation(depth, 'u_projection')!,
                u_view: gl.getUniformLocation(depth, 'u_view')!
            },
            color: {
                a_position: gl.getAttribLocation(color, 'a_position')!,
                a_texcoord: gl.getAttribLocation(color, 'a_texcoord')!,
                u_background: gl.getUniformLocation(color, 'u_background')!,
                u_depthTexture: gl.getUniformLocation(color, 'u_depthTexture')!,
                u_lightCount: gl.getUniformLocation(color, 'u_lightCount')!,
                u_screen: gl.getUniformLocation(color, 'u_screen')!,
                LightInfo: gl.getUniformBlockIndex(color, 'LightInfo')
            },
            blur1: {
                a_position: gl.getAttribLocation(blur1, 'a_position')!,
                a_texcoord: gl.getAttribLocation(blur1, 'a_texcoord')!,
                u_blurRadius: gl.getUniformLocation(blur1, 'u_blurRadius')!,
                u_texture: gl.getUniformLocation(blur1, 'u_texture')!,
                u_textureSize: gl.getUniformLocation(blur1, 'u_textureSize')!
            },
            blur2: {
                a_position: gl.getAttribLocation(blur2, 'a_position')!,
                a_texcoord: gl.getAttribLocation(blur2, 'a_texcoord')!,
                u_blurRadius: gl.getUniformLocation(blur2, 'u_blurRadius')!,
                u_texture: gl.getUniformLocation(blur2, 'u_texture')!,
                u_textureSize: gl.getUniformLocation(blur2, 'u_textureSize')!
            }
        }

        // Matrix
        const lightProjection = mat4.create();
        mat4.perspective(lightProjection, FOVY, 1, 1, core._PX_ * ratio);
        this.martix = {
            projection: lightProjection
        }

        // Buffer
        const depthFramebuffers = Array(MAX_LIGHT_NUM).fill(1).map(v => gl.createFramebuffer()!);
        this.buffer = {
            depth: {
                position: gl.createBuffer()!,
                framebuffer: depthFramebuffers
            },
            color: {
                position: this.initBuffer(new Float32Array([1, 1, -1, 1, 1, -1, -1, -1])),
                texcoord: this.initBuffer(new Float32Array([1, 1, 0, 1, 1, 0, 0, 0])),
                indices: this.initIndicesBuffer(),
                framebuffer: gl.createFramebuffer()!,
                lights: gl.createBuffer()!
            },
            blur1: {
                position: this.initBuffer(new Float32Array([1, 1, -1, 1, 1, -1, -1, -1])),
                texcoord: this.initBuffer(new Float32Array([1, 1, 0, 1, 1, 0, 0, 0])),
                indices: this.initIndicesBuffer(),
                framebuffer: gl.createFramebuffer()!
            },
            blur2: {
                position: this.initBuffer(new Float32Array([1, 1, -1, 1, 1, -1, -1, -1])),
                texcoord: this.initBuffer(new Float32Array([1, 1, 0, 1, 1, 0, 0, 0])),
                indices: this.initIndicesBuffer()
            }
        }

        // Texture
        this.texture = {
            depth: this.create3DTexture(core._PX_, MAX_LIGHT_NUM),
            color: this.create2DTexture(core._PX_),
            blur: this.create2DTexture(core._PX_)
        }
        this.resizeCanvas();
    }

    static resize() {
        if (this.martix) {
            const ratio = core.domStyle.scale * devicePixelRatio;
            const lightProjection = mat4.create();
            mat4.perspective(lightProjection, FOVY, 1, 1, core._PX_ * ratio);
            this.martix = {
                projection: lightProjection
            }
        }
    }

    /**
     * 清除一些关键缓冲区的内容，当且仅当图块变化或者切换地图时调用
     */
    static clearBuffer() {
        const gl = this.gl;
        const canvas = this.canvas;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.depth.position);
        gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer.color.lights);
        gl.bufferData(gl.UNIFORM_BUFFER, 0, gl.STATIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    static mount() {
        core.dom.gameDraw.appendChild(this.canvas);
    }

    /**
     * 更新当前的阴影绘制
     * @param nocache 是否不使用缓存
     */
    static update(nocache: boolean = false) {
        const floor = core.status.floorId;
        this.map[floor]?.requestRefresh(nocache);
        if (!this.map[floor]) {
            this.canvas.style.display = 'none';
        } else {
            this.canvas.style.display = 'block';
        }
    }

    static now() {
        return this.map[core.status.floorId];
    }
}

Shadow.canvas = document.createElement('canvas');
Shadow.gl = Shadow.canvas.getContext('webgl2')!;

const wallCache: Partial<Record<FloorIds, [number, number][][]>> = {};
const polygonCache: Partial<
    Record<FloorIds, [number, number, number, number][][]>
> = {};
const requiredCls = ['terrains', 'autotile', 'tileset', 'animates'];

interface PolygonStack {
    x: number;
    y: number;
    dir: Dir;
}

/**
 * 计算一个地图的墙壁组成的多边形
 */
export function calMapPolygons(
    floor: FloorIds,
    immerse: number = 4,
    nocache: boolean = false
) {
    if (!nocache && polygonCache[floor]) return polygonCache[floor]!;

    const wall = calMapWalls(floor, nocache);
    const used: Set<number> = new Set();
    const { width } = core.floors[floor];

    const res: [number, number, number, number][][] = [];

    for (const nodes of wall) {
        used.clear();

        if (nodes.length === 1) {
            const [x, y] = nodes[0];
            res.push([
                [
                    x * 32 + immerse,
                    y * 32 + immerse,
                    32 - immerse * 2,
                    32 - immerse * 2
                ]
            ]);
        }

        const walls = new Set(nodes.map(([x, y]) => x + y * width));
        const arr: [number, number, number, number][] = [];
        const [fx, fy] = nodes[0];

        // 不那么标准的dfs，一条线走到黑，然后再看分支
        // 这么做的目的是尽量增大矩形的面积，减少节点数
        const stack: PolygonStack[] = [];
        let f = false;
        for (const [dir, { x: dx, y: dy }] of Object.entries(core.utils.scan)) {
            const nx = fx + dx;
            const ny = fy + dy;
            if (walls.has(nx + ny * width)) {
                stack.unshift({
                    x: f ? nx : fx,
                    y: f ? ny : fy,
                    dir: dir as Dir
                });
                f = true;
            }
        }

        while (stack.length > 0) {
            const { x, y, dir } = stack.pop()!;
            const { x: dx, y: dy } = core.utils.scan[dir];
            let nx = x;
            let ny = y;
            let hasForward = false;

            if (used.has(x + y * width)) continue;

            used.add(x + y * width);

            while (1) {
                if (!walls.has(nx + ny * width)) {
                    break;
                }

                let hasNext = false;
                for (const [d, { x: ddx, y: ddy }] of Object.entries(
                    core.utils.scan
                )) {
                    const nnx = ddx + nx;
                    const nny = ddy + ny;
                    if (nnx < 0 || nny < 0 || nnx >= width) continue;
                    const num = nnx + nny * width;
                    if (walls.has(num)) {
                        if (dir === d) {
                            hasNext = true;
                            if (used.has(num)) hasForward = true;
                        } else if (!used.has(num)) {
                            stack.push({
                                x: nnx,
                                y: nny,
                                dir: d as Dir
                            });
                        }
                    }
                }

                if (!hasNext || hasForward) break;
                nx += dx;
                ny += dy;
                used.add(nx + ny * width);
            }

            const bx = x - dx;
            const by = y - dy;

            let hasBack =
                walls.has(bx + by * width) && used.has(bx + by * width);

            // 纯纯的数学计算，别动就行了
            switch (dir) {
                case 'up': {
                    let sy = ny * 32 + immerse;
                    let sh = (y - ny + 1) * 32 - immerse * 2;
                    if (hasForward) {
                        sy -= immerse * 2;
                        sh += immerse * 2;
                    }
                    if (hasBack) sh += immerse * 2;
                    arr.push([nx * 32 + immerse, sy, 32 - immerse * 2, sh]);
                    break;
                }
                case 'right': {
                    let sx = x * 32 + immerse;
                    let sw = (nx - x + 1) * 32 - immerse * 2;
                    if (hasForward) sw += immerse * 2;
                    if (hasBack) {
                        sx -= immerse * 2;
                        sw += immerse * 2;
                    }
                    arr.push([sx, y * 32 + immerse, sw, 32 - immerse * 2]);
                    break;
                }
                case 'down': {
                    let sy = y * 32 + immerse;
                    let sh = (ny - y + 1) * 32 - immerse * 2;
                    if (hasForward) sh += immerse * 2;
                    if (hasBack) {
                        sy -= immerse * 2;
                        sh += immerse * 2;
                    }
                    arr.push([x * 32 + immerse, sy, 32 - immerse * 2, sh]);
                    break;
                }
                case 'left': {
                    let sx = nx * 32 + immerse;
                    let sw = (x - nx + 1) * 32 - immerse * 2;
                    if (hasForward) {
                        sx -= immerse * 2;
                        sw += immerse * 2;
                    }
                    if (hasBack) sw += immerse * 2;
                    arr.push([sx, ny * 32 + immerse, sw, 32 - immerse * 2]);
                    break;
                }
            }
        }
        res.push(arr);
    }

    polygonCache[floor] = res;

    return res;
}

/**
 * 计算一个地图的墙壁连接情况
 */
export function calMapWalls(floor: FloorIds, nocache: boolean = false) {
    if (!nocache && wallCache[floor]) return wallCache[floor]!;
    const used: Set<number> = new Set();

    const obj = core.getMapBlocksObj(floor);
    const { width } = core.floors[floor];

    const res: [number, number][][] = [];

    for (const block of Object.values(obj)) {
        const { x, y } = block;
        if (
            !used.has(x + y * width) &&
            requiredCls.includes(block.event.cls) &&
            block.event.noPass &&
            !ignore.has(block.id)
        ) {
            const queue: Block[] = [block];
            const arr: [number, number][] = [];

            // bfs
            while (queue.length > 0) {
                const block = queue.shift()!;
                const { x, y } = block;

                arr.push([x, y]);

                for (const [, { x: dx, y: dy }] of Object.entries(
                    core.utils.scan
                )) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width) continue;
                    const loc: LocString = `${nx},${ny}`;

                    const blk = obj[loc];

                    if (blk) {
                        if (
                            requiredCls.includes(blk.event.cls) &&
                            blk.event.noPass &&
                            !used.has(blk.x + blk.y * width) &&
                            !ignore.has(blk.id)
                        ) {
                            used.add(blk.x + blk.y * width);
                            queue.push(blk);
                        }
                    }
                }

                used.add(x + y * width);
            }

            res.push(arr);
        }
    }

    wallCache[floor] = res;

    return res;
}

/* @__PURE__ */ export function drawPolygons(floor: FloorIds) {
    const polygons = calMapPolygons(floor);
    const ctx = core.createCanvas('polygons', 0, 0, 480, 480, 130);

    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'white';
    for (const p of polygons) {
        for (const [x, y, w, h] of p) {
            ctx.strokeRect(x, y, w, h);
        }
    }
}

export class LayerShadowExtends implements ILayerRenderExtends {
    static shadowList: Set<LayerShadowExtends> = new Set();
    id: string = 'shadow';

    layer!: Layer
    hero!: HeroRenderer
    sprite!: Sprite;

    update() {
        this.sprite.update(this.sprite);
    }

    private onMoveTick = (x: number, y: number) => {
        const now = Shadow.now();
        if (!now) return;
        if (now.followHero.size === 0) return;                
        now.followHero.forEach(v => {
            now.modifyLight(v, {
                x: x * 32 + 16,
                y: y * 32 + 16
            });
        });
        now.requestRefresh();        
        
        this.layer.requestAfterFrame(() => {
            this.sprite.update(this.sprite);
        });
    }

    private listen() {
        this.hero.on('moveTick', this.onMoveTick);
    }

    awake(layer: Layer): void {
        const ex = layer.getExtends('floor-hero');
        if (!(ex instanceof HeroRenderer)) {
            layer.removeExtends('shadow');
            logger.error(1101);
            return;
        }
        this.hero = ex;
        this.layer = layer;
        this.listen();
        LayerShadowExtends.shadowList.add(this);
        this.sprite = new Sprite('static', false);
        this.sprite.setHD(true);
        this.sprite.size(layer.width, layer.height);
        this.sprite.setRenderFn((canvas, transform) => {            
            canvas.ctx.drawImage(Shadow.canvas, 0, 0, layer.width, layer.height);
        });

        layer.appendChild(this.sprite);
    }

    onDestroy(layer: Layer): void {
        this.hero.off('moveTick', this.onMoveTick);
        this.sprite.destroy();
        LayerShadowExtends.shadowList.delete(this);
    }
}
