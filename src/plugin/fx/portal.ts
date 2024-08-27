import { logger } from '@/core/common/logger';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { mainSetting, MotaSettingItem } from '@/core/main/setting';
import { LayerGroupFloorBinder } from '@/core/render/preset/floor';
import {
    ILayerGroupRenderExtends,
    LayerGroup
} from '@/core/render/preset/layer';
import { Sprite } from '@/core/render/sprite';
import type { BluePalace } from '@/game/mechanism/misc';

/** 最大粒子数 */
const MAX_PARTICLES = 10;
/** 粒子持续时长 */
const PARTICLE_LAST = 2000;
/** 粒子产生间隔 */
const PARTICLE_INTERVAL = PARTICLE_LAST / MAX_PARTICLES;

export class LayerGroupPortal implements ILayerGroupRenderExtends {
    id: string = 'portal';

    group!: LayerGroup;
    binder!: LayerGroupFloorBinder;
    portal!: Portal;

    private onFloorChange = (floor: FloorIds) => {
        const data = Mota.require('module', 'Mechanism').BluePalace.portals;
        this.portal.cellSize = this.group.cellSize;
        this.portal.setData(data[floor] ?? []);
    };

    private listen() {
        this.binder.on('floorChange', this.onFloorChange);
    }

    awake(group: LayerGroup): void {
        this.group = group;
        const ex = group.getExtends('floor-binder');
        if (ex instanceof LayerGroupFloorBinder) {
            this.binder = ex;
            this.portal = new Portal();
            this.portal.setHD(true);
            this.portal.size(group.width, group.height);
            group.getLayer('event')?.appendChild(this.portal);
            this.listen();
        } else {
            logger.error(
                1301,
                `Portal extends need 'floor-binder' extends as dependency.`
            );
            group.removeExtends('portal');
        }
    }

    onDestroy(group: LayerGroup): void {
        this.binder.off('floorChange', this.onFloorChange);
    }
}

interface DrawingPortal {
    color: string;
    x: number;
    y: number;
    particles: Set<PortalParticle>;
    /** v表示竖向，h表示横向 */
    type: 'v' | 'h';
    /** 上一次新增粒子的时间 */
    lastParticle: number;
}

interface PortalParticle {
    fx: number;
    fy: number;
    totalTime: number;
    time: number;
    tx: number;
    ty: number;
    r: number;
}

export class Portal extends Sprite {
    static colors: string[] = ['#0f0', '#ff0', '#0ff', '#fff', '#f0f'];

    cellSize: number = 32;
    /** 当前的渲染数据 */
    private renderData: BluePalace.Portal[] = [];
    /** 渲染内容 */
    private renderable: Set<DrawingPortal> = new Set();

    /** 粒子开关设置 */
    private particleSetting: MotaSettingItem;
    /** 上一帧时刻 */
    private lastTime: number = 0;

    private delegation: number;

    constructor() {
        super('static', false);

        this.particleSetting = mainSetting.getSetting('fx.portalParticle')!;

        this.delegation = this.delegateTicker(() => {
            if (this.particleSetting.value) this.update(this);
        });

        this.setRenderFn((canvas, transform) => {
            // console.time();
            this.renderPortal(canvas);
            // console.timeEnd();
        });
    }

    /**
     * 设置渲染内容
     */
    setData(data: BluePalace.Portal[]) {
        this.renderData = data;
        this.generateRenderable();
        this.update(this);
    }

    private generateRenderable() {
        this.renderable.clear();
        if (this.renderData.length === 0) return;
        const colorLength = Portal.colors.length;
        const cell = this.cellSize;
        this.renderData.forEach((v, i) => {
            const c = Portal.colors[i % colorLength];
            const { fx, fy, tx, ty, dir, toDir } = v;

            let x1 = fx * cell;
            let y1 = fy * cell;
            let x2 = tx * cell;
            let y2 = ty * cell;

            if (dir === 'down') y1 += cell;
            else if (dir === 'right') x1 += cell;

            if (toDir === 'down') y2 += cell;
            else if (toDir === 'right') x2 += cell;

            this.renderable.add({
                x: x1,
                y: y1,
                type: dir === 'left' || dir === 'right' ? 'v' : 'h',
                color: c,
                particles: new Set(),
                lastParticle: Date.now()
            });

            this.renderable.add({
                x: x2,
                y: y2,
                type: toDir === 'left' || toDir === 'right' ? 'v' : 'h',
                color: c,
                particles: new Set(),
                lastParticle: Date.now()
            });
        });
    }

    private renderPortal(canvas: MotaOffscreenCanvas2D) {
        const { ctx } = canvas;

        const p = this.particleSetting.value;
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        if (p) {
            ctx.shadowBlur = 8;
        } else {
            ctx.shadowBlur = 0;
        }

        const time = Date.now();
        const dt = time - this.lastTime;
        this.lastTime = time;
        this.renderable.forEach(v => {
            const { color, x, y, type, lastParticle, particles } = v;

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.globalAlpha = 1;
            ctx.shadowColor = color;
            if (type === 'v') {
                ctx.beginPath();
                ctx.moveTo(x, y - 14);
                ctx.lineTo(x, y + 30);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(x + 2, y);
                ctx.lineTo(x + 30, y);
                ctx.stroke();
            }

            if (!p) return;

            const needDelete = new Set<PortalParticle>();
            particles.forEach(v => {
                const { fx, fy, tx, ty, time: t, totalTime, r } = v;
                const progress = t / totalTime;
                const nx = (tx - fx) * progress + fx;
                const ny = (ty - fy) * progress + fy;
                v.time += dt;

                if (progress > 1) {
                    needDelete.add(v);
                    return;
                } else if (progress > 0.75) {
                    ctx.globalAlpha = (1 - progress) * 4;
                } else if (progress < 0.25) {
                    ctx.globalAlpha = progress * 4;
                } else {
                    ctx.globalAlpha = 1;
                }

                ctx.beginPath();
                ctx.arc(nx, ny, r, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            });
            needDelete.forEach(v => {
                particles.delete(v);
            });
            if (
                time - lastParticle >= PARTICLE_INTERVAL &&
                particles.size < MAX_PARTICLES
            ) {
                // 添加新粒子
                const direction = Math.random();
                const k = Math.random() / 2 - 0.3;
                const verticle = Math.floor(Math.random() * 8 + 8);
                const r = Math.random() * 2;
                v.lastParticle = time;
                if (direction > 0.5) {
                    // 左边 | 上边
                    if (type === 'h') {
                        const fx = Math.floor(Math.random() * 24 + x + 4);
                        particles.add({
                            fx: fx,
                            fy: y - 1,
                            tx: verticle * k + fx + 4,
                            ty: -verticle + y - 1,
                            r: r,
                            time: 0,
                            totalTime: PARTICLE_LAST
                        });
                    } else {
                        const fy = Math.floor(Math.random() * 44 + y - 14);
                        particles.add({
                            fy: fy,
                            fx: x - 1,
                            ty: verticle * k + fy + 4,
                            tx: -verticle + x - 1,
                            r: r,
                            time: 0,
                            totalTime: PARTICLE_LAST
                        });
                    }
                } else {
                    // 右边 | 下边
                    if (type === 'h') {
                        const fx = Math.floor(Math.random() * 24 + x + 4);
                        particles.add({
                            fx: fx,
                            fy: y + 1,
                            tx: verticle * k + fx + 4,
                            ty: verticle + y - 1,
                            r: r,
                            time: 0,
                            totalTime: PARTICLE_LAST
                        });
                    } else {
                        const fy = Math.floor(Math.random() * 44 + y - 14);
                        particles.add({
                            fy: fy,
                            fx: x + 1,
                            ty: verticle * k + fy + 4,
                            tx: verticle + x + 1,
                            r: r,
                            time: 0,
                            totalTime: PARTICLE_LAST
                        });
                    }
                }
            }
        });
    }

    destroy(): void {
        super.destroy();
        this.removeTicker(this.delegation);
    }
}
