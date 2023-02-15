import { circle, sleep, Ticker } from 'mutate-animate';
import { has } from '../utils';
import { createProgram } from '../webgl/canvas';
import { Matrix4 } from '../webgl/matrix';
import { isWebGLSupported } from '../webgl/utils';
import { Camera, Position3D } from './camera';
import { Particle, ParticleColor, ParticleOne } from './particle';

// 顶点着色器与片元着色器
// 很像C对吧（但这不是C，是glsl
const vshader = `
    attribute vec4 position;
    attribute vec4 color;
    attribute vec2 radius;
    uniform mat4 camera;
    uniform mat4 projection;
    varying vec4 vColor;
    varying vec4 vPosition;
    varying float vRadius;

    void main() {
        vec4 p = projection * camera * position;
        gl_Position = p;
        vColor = color;
        vPosition = p;
        vRadius = radius.x;
        gl_PointSize = vRadius;
    }
`;
const fshader = `
    #ifdef GL_ES
        precision mediump float;
    #endif

    varying vec4 vColor;
    varying vec4 vPosition;
    varying float vRadius;

    void main() {
        vec2 position = gl_PointCoord.xy;
        if (distance(position, vec2(0.5)) > 0.5) {
            discard;
        } else {
            gl_FragColor = vColor;
        }
    }
`;

export class Renderer {
    /** 粒子列表 */
    particleList: Particle[] = [];
    /** 渲染画布 */
    canvas: HTMLCanvasElement = document.createElement('canvas');
    /** webgl绘制上下文 */
    gl: WebGLRenderingContext;
    /** 绑定的摄像机 */
    camera?: Camera;
    /** 缩放比例 */
    ratio: number = devicePixelRatio;
    /** gl的程序对象 */
    program: WebGLProgram;

    /** 画布缓冲区 */
    private buffer: WebGLBuffer;
    /** 各个attribute的内存地址 */
    private attribLocation: Record<string, number> = {};
    /** 各个uniform的内存地址 */
    private uniformLocation: Record<string, WebGLUniformLocation> = {};

    private static readonly attributes: string[] = [
        'position',
        'color',
        'radius'
    ];
    private static readonly uniforms: string[] = ['camera', 'projection'];

    constructor(width?: number, height?: number) {
        if (!isWebGLSupported) {
            throw new Error(`Your service or browser does not support webgl!`);
        }
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        if (has(width)) {
            this.canvas.width = width * devicePixelRatio;
        }
        if (has(height)) {
            this.canvas.height = height * devicePixelRatio;
        }
        this.gl = this.canvas.getContext('webgl')!;
        this.program = createProgram(this.gl, vshader, fshader);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.buffer = this.bindBuffer();
        this.getGLVariblesLocation();
        this.gl.enable(this.gl.BLEND);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    /**
     * 初始化粒子画布
     * @param width 画布宽度
     * @param height 画布高度
     */
    initCanvas(width: number, height: number) {
        const ratio = devicePixelRatio;
        this.ratio = ratio;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
    }

    /**
     * 绑定摄像机
     * @param camera 摄像机
     */
    bindCamera(camera: Camera) {
        this.camera = camera;
    }

    /**
     * 取消绑定摄像机
     */
    unbindCamera() {
        this.camera = void 0;
    }

    /**
     * 添加到一个html元素中
     * @param ele html元素
     */
    append(ele: HTMLElement) {
        ele.appendChild(this.canvas);
    }

    /**
     * 从当前html元素中移除
     */
    remove() {
        this.canvas.remove();
    }

    /**
     * 添加一个粒子
     * @param particle 粒子
     */
    addParticle(particle: Particle) {
        this.particleList.push(particle);
    }

    /**
     * 移除一个粒子
     * @param particle 粒子
     */
    removeParticle(particle: Particle) {
        const index = this.particleList.findIndex(v => v === particle);
        if (index === -1) return;
        this.particleList.splice(index, 1);
    }

    /**
     * 设置画布的背景色
     * @param color 背景色
     */
    setBackground(color: ParticleColor) {
        this.gl.clearColor(...color);
    }

    /**
     * 渲染所有或单个粒子
     */
    render(particle?: Particle | number) {
        const { position, color } = this.attribLocation;
        const { camera } = this.uniformLocation;
        if (!has(position) || !has(color)) {
            throw new Error(`Unexpected unset of attribute location`);
        }
        if (!has(camera)) {
            throw new Error(`Unexpected unset of uniform location`);
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        if (!has(particle)) this.particleList.forEach(v => this.renderOne(v));
        else {
            const p =
                typeof particle === 'number'
                    ? this.particleList[particle]
                    : particle;
            this.renderOne(p);
        }
    }

    /**
     * 绑定画布的缓冲区
     * @returns 绑定的缓冲区
     */
    private bindBuffer() {
        const buffer = this.gl.createBuffer();
        if (!buffer) throw this.notSupport();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        return buffer;
    }

    /**
     * 更新一个粒子的缓冲区数据
     * @param array 粒子的粒子元素数组
     */
    private updateOneParticleBufferData(array: ParticleOne[]) {
        const particleArray = new Float32Array(
            array
                .map(v => {
                    const [r, g, b, a] = v.color;
                    return [v.x, v.y, v.z, r, g, b, a, v.r, 0];
                })
                .flat()
        );
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            particleArray,
            this.gl.DYNAMIC_DRAW
        );
        return particleArray;
    }

    /**
     * 获取gl变量的内存地址
     */
    private getGLVariblesLocation() {
        Renderer.attributes.forEach(v => {
            this.attribLocation[v] = this.gl.getAttribLocation(this.program, v);
        });
        Renderer.uniforms.forEach(v => {
            const loc = this.gl.getUniformLocation(this.program, v);
            if (!loc) {
                throw new Error(`Cannot get the location of uniform '${v}'`);
            }
            this.uniformLocation[v] = loc;
        });
    }

    /**
     * 渲染某一个粒子
     * @param particle 要渲染的粒子
     */
    private renderOne(particle: Particle) {
        const arr = this.updateOneParticleBufferData(particle.list);
        const size = arr.BYTES_PER_ELEMENT;

        const { position, color, radius } = this.attribLocation;
        const { camera, projection } = this.uniformLocation;

        // 给gl变量赋值
        this.gl.vertexAttribPointer(
            position,
            3,
            this.gl.FLOAT,
            false,
            size * 9,
            0
        );
        this.gl.vertexAttribPointer(
            color,
            4,
            this.gl.FLOAT,
            false,
            size * 9,
            size * 3
        );
        this.gl.vertexAttribPointer(
            radius,
            2,
            this.gl.FLOAT,
            false,
            size * 9,
            size * 7
        );
        this.gl.enableVertexAttribArray(position);
        this.gl.enableVertexAttribArray(color);
        this.gl.enableVertexAttribArray(radius);
        const matrix = new Matrix4();
        const c =
            this.camera?.view.toWebGLFloat32Array() ??
            matrix.toWebGLFloat32Array();
        const p =
            this.camera?.projection.toWebGLFloat32Array() ??
            matrix.toWebGLFloat32Array();

        this.gl.uniformMatrix4fv(camera, false, c);
        this.gl.uniformMatrix4fv(projection, false, p);

        // 绘制
        this.gl.drawArrays(this.gl.POINTS, 0, particle.list.length);
    }

    private notSupport() {
        throw new Error(`Your service or browser does not support webgl!`);
    }
}

window.addEventListener('load', async () => {
    const renderer = new Renderer(
        480 * core.domStyle.scale,
        480 * core.domStyle.scale
    );
    const particle = new Particle();
    const camera = new Camera();
    renderer.bindCamera(camera);
    particle.appendTo(renderer);
    renderer.append(core.dom.gameDraw);
    camera.lookAt([1, 1, 5], [0, 0, 0], [0, 1, 0]);
    camera.setPerspective(20, 1, 1, 100);

    console.log(camera.view, camera.projection);

    particle.setColor([0.3, 0.6, 0.7, 0.7]);
    particle.setRadius(3);
    particle.setDensity(1000);
    particle.setThreshold({
        posX: 0.2,
        posY: 0.2,
        posZ: 10,
        radius: 0,
        color: 0
    });
    particle.generate();

    renderer.canvas.style.position = 'absolute';
    renderer.canvas.style.zIndex = '160';

    renderer.render();

    await sleep(5000);
    const now: Position3D = [1, 1, 5];
    const path = circle(1, 1000, [0, 0]);
    let f = 0;
    new Ticker().add(() => {
        camera.lookAt(now, [0, 0, 0], [0, 1, 0]);
        const [x, y] = path(f / 1000 / 2000);
        f++;
        now[0] = x;
        now[1] = y;
        renderer.render();
    });
});
