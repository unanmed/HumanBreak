import { Ticker } from 'mutate-animate';
import { MotaCanvas2D } from '@/core/fx/canvas2d';
import { MotaSettingItem, mainSetting } from '@/core/main/setting';

// 苍蓝殿左上角区域的传送门机制的绘制部分，传送部分看 src/game/machanism/misc.ts

interface DrawingPortal {
    color: string;
    x: number;
    y: number;
    particles: PortalParticle[];
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

const MAX_PARTICLES = 10;
const PARTICLE_LAST = 2000;
const PARTICLE_INTERVAL = PARTICLE_LAST / MAX_PARTICLES;

const color: string[] = ['#0f0', '#ff0', '#0ff', '#fff', '#f0f'];

const drawing: DrawingPortal[] = [];
const ticker = new Ticker();

let canvas: MotaCanvas2D;
let ctx: CanvasRenderingContext2D;
let particleSetting: MotaSettingItem;

let lastTime = 0;
// Mota.require('var', 'loading').once('coreInit', () => {
//     canvas = MotaCanvas2D.for('@portal');
//     ctx = canvas.ctx;
//     canvas.mount();
//     canvas.css(`z-index: 51`);
//     canvas.withGameScale(true);
//     canvas.pos(0, 0);
//     canvas.size(480, 480);
//     canvas.on('resize', () => {
//         canvas.css(`z-index: 51`);
//     });
//     particleSetting = mainSetting.getSetting('fx.portalParticle')!;
//     ticker.add(tickPortal);
// });

// Mota.require('var', 'hook').on('changingFloor', id => {
//     drawPortals(id);
// });

let needDraw = false;
function tickPortal(time: number) {
    const last = lastTime;
    lastTime = time;
    const p = particleSetting.value;

    if (!core.isPlaying() || drawing.length === 0) return;
    if (!p && !needDraw) return;

    needDraw = false;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    if (p) {
        ctx.shadowBlur = 8;
    } else {
        ctx.shadowBlur = 0;
    }

    drawing.forEach(v => {
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

        if (p) {
            // 绘制粒子效果
            let needDelete = false;
            const dt = time - last;

            particles.forEach(v => {
                const { fx, fy, tx, ty, time: t, totalTime, r } = v;
                const progress = t / totalTime;
                const nx = (tx - fx) * progress + fx;
                const ny = (ty - fy) * progress + fy;
                v.time += dt;

                if (progress > 1) {
                    needDelete = true;
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
            if (needDelete) {
                particles.shift();
            }
            if (
                time - lastParticle >= PARTICLE_INTERVAL &&
                particles.length < MAX_PARTICLES
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
                        particles.push({
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
                        particles.push({
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
                        particles.push({
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
                        particles.push({
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
        }
    });
}

/**
 * 绘制传送门
 * @param floorId 要绘制传送门的楼层
 */
export function drawPortals(floorId: FloorIds) {
    drawing.splice(0);
    const p = Mota.require('module', 'Mechanism').BluePalace.portals[floorId];
    if (!p) return;
    p.forEach((v, i) => {
        const c = color[i % color.length];
        const { fx, fy, tx, ty, dir, toDir } = v;

        let x1 = fx * 32;
        let y1 = fy * 32;
        let x2 = tx * 32;
        let y2 = ty * 32;

        if (dir === 'down') y1 += 32;
        else if (dir === 'right') x1 += 32;

        if (toDir === 'down') y2 += 32;
        else if (toDir === 'right') x2 += 32;

        drawing.push({
            x: x1,
            y: y1,
            type: dir === 'left' || dir === 'right' ? 'v' : 'h',
            color: c,
            particles: [],
            lastParticle: lastTime
        });

        drawing.push({
            x: x2,
            y: y2,
            type: toDir === 'left' || toDir === 'right' ? 'v' : 'h',
            color: c,
            particles: [],
            lastParticle: lastTime
        });
    });
    needDraw = true;
}
