import { Ticker } from 'mutate-animate';
import { has } from '../utils';
import { Camera } from './camera';
import { Renderer } from './render';

interface ParticleThreshold {
    radius: number;
    color: number;
    position: number;
}

interface ParticleOne {
    x: number;
    y: number;
    z: number;
    r: number;
}

interface Loc3D extends Loc {
    z: number;
}

export class Particle {
    /** 绑定的摄像机 */
    camera?: Camera;
    /** 粒子中心位置 */
    pos: Loc3D;
    /** 粒子密度 */
    density: number;
    /** 渲染器 */
    renderer?: Renderer;

    /** 需要渲染的粒子列表 */
    list: ParticleOne[] = [];

    /** 是否需要更新 */
    private needUpdate: boolean = false;
    private ticker: Ticker = new Ticker();

    /** 各个属性的阈值 */
    threshold: ParticleThreshold = {
        radius: 2,
        color: 16,
        position: 50
    };

    constructor(density: number, x: number, y: number, z: number) {
        this.pos = { x, y, z };
        this.density = density;
        this.ticker.add(this.updateParticleData);
    }

    /**
     * 设置粒子中心的位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPos(x?: number, y?: number): Particle {
        has(x) && (this.pos.x = x);
        has(y) && (this.pos.y = y);
        this.needUpdate = true;
        return this;
    }

    /**
     * 设置粒子的阈值信息
     * @param data 阈值信息
     */
    setThreshold(data: Partial<ParticleThreshold>): Particle {
        const { radius, color, position } = data;
        has(radius) && (this.threshold.radius = radius);
        has(color) && (this.threshold.radius = color);
        has(position) && (this.threshold.radius = position);
        this.needUpdate = true;
        return this;
    }

    /**
     * 生成粒子
     */
    generate() {}

    /**
     * 添加到一个渲染器上
     * @param renderer 渲染器
     */
    appendTo(renderer: Renderer) {
        renderer.addParticle(this);
    }

    /**
     * 从当前渲染器上移除
     */
    remove() {
        this.renderer?.removeParticle(this);
    }

    /**
     * 更新粒子信息
     */
    update() {
        this.needUpdate = true;
    }

    /**
     * 每帧执行的粒子更新器
     */
    private updateParticleData() {
        if (!this.needUpdate) return;
        this.needUpdate = false;
    }
}
