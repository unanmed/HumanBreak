import { isWebGLSupported } from '../webgl/utils';
import { Camera } from './camera';
import { Particle } from './particle';

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

    constructor() {
        if (!isWebGLSupported) {
            throw new Error(`Your service or browser does not support webgl!`);
        }
        this.gl = this.canvas.getContext('webgl')!;
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
}
