import { Ticker } from 'mutate-animate';
import { has } from '../utils';
import { Camera } from './camera';
import { Renderer } from './render';

export type ParticleColor = [number, number, number, number];

interface ParticleThreshold {
    radius: number;
    color: number;
    posX: number;
    posY: number;
    posZ: number;
}

export interface ParticleOne {
    x: number;
    y: number;
    z: number;
    r: number;
    color: ParticleColor;
}

interface Loc3D extends Loc {
    z: number;
}

interface ParticleInfo {
    pos: Loc3D;
    density: number;
    color: ParticleColor;
    radius: number;
    threshold: ParticleThreshold;
}

export class Particle {
    /** 绑定的摄像机 */
    camera?: Camera;
    /** 粒子中心位置 */
    pos: Loc3D = { x: 0, y: 0, z: 0 };
    /** 粒子密度，即粒子总数 */
    density: number = 50;
    /** 粒子颜色 */
    color: ParticleColor = [0, 0, 0, 0];
    /** 每个粒子的半径 */
    radius: number = 2;
    /** 渲染器 */
    renderer?: Renderer;

    /** 需要渲染的粒子列表 */
    list: ParticleOne[] = [];

    /** 是否需要更新 */
    private needUpdate: boolean = false;
    private ticker: Ticker = new Ticker();

    /** 设置信息前的信息 */
    private originInfo: DeepPartial<ParticleInfo> = {};

    /** 各个属性的阈值 */
    threshold: ParticleThreshold = {
        radius: 2,
        color: 0.1,
        posX: 0.1,
        posY: 0.1,
        posZ: 0.1
    };

    constructor() {
        this.ticker.add(() => {
            this.updateParticleData.call(this);
        });
    }

    /**
     * 设置粒子中心的位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPos(x?: number, y?: number, z?: number): Particle {
        this.originInfo.pos ??= {};
        if (has(x)) {
            this.pos.x = x;
            this.originInfo.pos.x = x;
        }
        if (has(y)) {
            this.pos.y = y;
            this.originInfo.pos.y = y;
        }
        if (has(z)) {
            this.pos.z = z;
            this.originInfo.pos.z = z;
        }
        this.needUpdate = true;
        return this;
    }

    /**
     * 设置粒子的密度，即粒子总数
     * @param density 密度
     */
    setDensity(density: number): Particle {
        this.density = density;
        this.originInfo.density = density;
        this.needUpdate = true;
        return this;
    }

    /**
     * 设置粒子的颜色
     * @param color 颜色
     */
    setColor(color: ParticleColor) {
        this.color = color;
        this.originInfo.color = color;
        this.needUpdate = true;
        return this;
    }

    /**
     * 设置粒子的半径
     * @param radius 半径
     */
    setRadius(radius: number) {
        this.radius = radius;
        this.originInfo.radius = radius;
        this.needUpdate = true;
        return this;
    }

    /**
     * 设置粒子的阈值信息
     * @param data 阈值信息
     */
    setThreshold(data: Partial<ParticleThreshold>): Particle {
        this.originInfo.threshold ??= {};
        for (const [key, value] of Object.entries(data) as [
            keyof ParticleThreshold,
            any
        ][]) {
            this.threshold[key] = value;
            this.originInfo.threshold[key] = value;
        }
        this.needUpdate = true;
        return this;
    }

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
     * 生成粒子，注意该函数会删除当前的所有粒子，然后再重新生成
     */
    generate() {
        const particles = this.generateNewParticles(this.density);
        this.list = particles;
    }

    /**
     * 每帧执行的粒子更新器
     */
    private updateParticleData() {
        if (!this.needUpdate || this.list.length === 0) return;
        this.needUpdate = false;

        // check number
        if (this.list.length > this.density) {
            this.list.splice(this.density);
        } else if (this.list.length < this.density) {
            this.list.push(
                ...this.generateNewParticles(this.density - this.list.length)
            );
        }

        // check radius
        if (has(this.originInfo.radius)) {
            if (this.radius !== this.originInfo.radius) {
                const delta = this.radius - this.originInfo.radius;
                this.list.forEach(v => {
                    v.r += delta;
                });
            }
        }

        // check color
        if (has(this.originInfo.color)) {
            if (!core.same(this.color, this.originInfo.color)) {
                const r = this.color[0] - this.originInfo.color[0]!;
                const g = this.color[1] - this.originInfo.color[1]!;
                const b = this.color[2] - this.originInfo.color[2]!;
                const a = this.color[3] - this.originInfo.color[3]!;
                this.list.forEach(v => {
                    v.color[0] += r;
                    v.color[1] += g;
                    v.color[2] += b;
                    v.color[3] += a;
                });
            }
        }

        // check position
        if (has(this.originInfo.pos)) {
            if (!core.same(this.pos, this.originInfo.pos)) {
                const x = this.pos.x - this.originInfo.pos.x!;
                const y = this.pos.y - this.originInfo.pos.y!;
                const z = this.pos.z - this.originInfo.pos.z!;
                this.list.forEach(v => {
                    v.x += x;
                    v.y += y;
                    v.z += z;
                });
            }
        }

        // check threshold
        if (has(this.originInfo.threshold)) {
            for (const [key, v] of Object.entries(this.threshold) as [
                keyof ParticleThreshold,
                any
            ][]) {
                const now = v;
                const origin = this.originInfo.threshold[key];
                if (origin === now || !has(origin)) {
                    continue;
                }
                const ratio = now / origin;
                if (key === 'posX') {
                    this.list.forEach(v => {
                        v.x = (v.x - this.pos.x) * ratio + this.pos.x;
                    });
                } else if (key === 'posY') {
                    this.list.forEach(v => {
                        v.y = (v.y - this.pos.y) * ratio + this.pos.y;
                    });
                } else if (key === 'posZ') {
                    this.list.forEach(v => {
                        v.z = (v.z - this.pos.z) * ratio + this.pos.z;
                    });
                } else if (key === 'radius') {
                    this.list.forEach(v => {
                        v.r = (v.r - this.radius) * ratio + this.radius;
                    });
                } else {
                    this.list.forEach(v => {
                        v.color = v.color.map((v, i) => {
                            return (v - this.color[i]) * ratio + this.color[i];
                        }) as ParticleColor;
                    });
                }
            }
        }

        this.render();
    }

    /**
     * 生成指定数量的粒子
     * @param num 生成数量
     */
    private generateNewParticles(num: number): ParticleOne[] {
        const res: ParticleOne[] = new Array(num);
        const { posX, posY, posZ, radius, color } = this.threshold;
        for (let i = 0; i < num; i++) {
            const p: ParticleOne = {
                x: this.pos.x + (Math.random() - 0.5) * 2 * posX,
                y: this.pos.y + (Math.random() - 0.5) * 2 * posY,
                z: this.pos.z + (Math.random() - 0.5) * 2 * posZ,
                r: this.radius + (Math.random() - 0.5) * 2 * radius,
                color: [0, 0, 0, 0].map(
                    (v, i) => this.color[i] + (Math.random() - 0.5) * 2 * color
                ) as ParticleColor
            };
            res[i] = p;
        }
        return res;
    }

    /**
     * 渲染这个粒子
     */
    private render() {
        this.renderer?.render(this);
    }
}
