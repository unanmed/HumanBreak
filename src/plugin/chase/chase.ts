import { Animation, circle, hyper, sleep, TimingFn } from 'mutate-animate';
import { completeAchievement } from '../ui/achievement';
import { has } from '../utils';
import { ChaseCameraData, ChasePath, getChaseDataByIndex } from './data';
import { init1 } from './chase1';

// todo: 优化，可以继承自EventEmitter

export default function init() {
    return { startChase, chaseInit1: init1 };
}

export function shake2(power: number, timing: TimingFn): TimingFn {
    let r = 0;
    return t => {
        r += Math.PI / 2;
        return Math.sin(r) * power * timing(t);
    };
}

export class Chase {
    /**
     * 动画实例
     */
    ani: Animation = new Animation();

    /**
     * 追逐战的路径
     */
    path: ChasePath;

    /**
     * 是否展示路径
     */
    showPath: boolean = false;

    endFn?: (lose: boolean) => void;

    /**
     * 开始一个追逐战
     * @param index 追逐战索引
     * @param path 追逐战的路线
     * @param fn 开始时执行的函数
     */
    constructor(
        path: ChasePath,
        fns: ((chase: Chase) => void)[],
        camera: ChaseCameraData[],
        showPath: boolean = false
    ) {
        this.path = path;
        flags.__lockViewport__ = true;
        flags.onChase = true;
        flags.chaseTime = {
            [core.status.floorId]: Date.now()
        };
        this.ani
            .absolute()
            .time(0)
            .move(core.bigmap.offsetX / 32, core.bigmap.offsetY / 32);
        fns.forEach(v => v(this));
        const added: FloorIds[] = [];
        const ctx = core.createCanvas('chasePath', 0, 0, 0, 0, 35);

        for (const [id, x, y, start, time, mode, path] of camera) {
            if (!added.includes(id)) {
                this.on(
                    id,
                    0,
                    () => {
                        flags.__lockViewport__ = false;
                        core.drawHero();
                        flags.__lockViewport__ = true;
                        this.ani
                            .time(0)
                            .move(
                                core.bigmap.offsetX / 32,
                                core.bigmap.offsetY / 32
                            );
                    },
                    true
                );
                added.push(id);
            }
            if (!has(path)) {
                this.on(id, start, () => {
                    this.ani.time(time).mode(mode).move(x, y);
                });
            } else {
                this.on(id, start, () => {
                    this.ani.time(time).mode(mode).moveAs(path);
                });
            }
        }

        this.ani.ticker.add(() => {
            if (!flags.floorChanging) {
                core.setViewport(this.ani.x * 32, this.ani.y * 32);
                core.relocateCanvas(ctx, -this.ani.x * 32, -this.ani.y * 32);
            }
        });

        if (showPath) {
            for (const [id, p] of Object.entries(path) as [
                FloorIds,
                LocArr[]
            ][]) {
                this.on(id, 0, () => {
                    const floor = core.status.maps[id];
                    core.resizeCanvas(ctx, floor.width * 32, floor.height * 32);
                    ctx.beginPath();
                    ctx.moveTo(p[0][0] * 32 + 16, p[1][1] * 32 + 24);
                    ctx.lineJoin = 'round';
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'cyan';
                    ctx.globalAlpha = 0.3;
                    p.forEach((v, i, a) => {
                        if (i === 0) return;
                        const [x, y] = v;
                        ctx.lineTo(x * 32 + 16, y * 32 + 24);
                    });
                    ctx.stroke();
                });
            }
        }
    }

    /**
     * 在追逐战的某个时刻执行函数
     * @param floorId 楼层id
     * @param time 该楼层中经过的时间
     * @param fn 执行的函数
     */
    on(
        floorId: FloorIds,
        time: number,
        fn: (chase: Chase) => void,
        first: boolean = false
    ) {
        const func = () => {
            if (!flags.chaseTime?.[floorId]) return;
            if (
                Date.now() - (flags.chaseTime?.[floorId] ?? Date.now()) >=
                time
            ) {
                fn(this);
                this.ani.ticker.remove(func);
            }
        };
        this.ani.ticker.add(func, first);
    }

    /**
     * 当勇士移动到某个点上时执行函数
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param fn 执行的函数
     * @param mode 为0时，当传入数组时表示勇士在任意一个位置都执行，否则是每个位置执行一次
     */
    onHeroLoc(
        floorId: FloorIds,
        fn: (chase: Chase) => void,
        x?: number | number[],
        y?: number | number[],
        mode: 0 | 1 = 0
    ) {
        if (mode === 1) {
            if (typeof x === 'number') x = [x];
            if (typeof y === 'number') y = [y];
            x!.forEach(v => {
                (y as number[]).forEach(vv => {
                    this.onHeroLoc(floorId, fn, v, vv);
                });
            });
            return;
        }
        const judge = () => {
            if (core.status.floorId !== floorId) return false;
            if (has(x)) {
                if (typeof x === 'number') {
                    if (core.status.hero.loc.x !== x) return false;
                } else {
                    if (!x.includes(core.status.hero.loc.x)) return false;
                }
            }
            if (has(y)) {
                if (typeof y === 'number') {
                    if (core.status.hero.loc.y !== y) return false;
                } else {
                    if (!y.includes(core.status.hero.loc.y)) return false;
                }
            }
            return true;
        };
        const func = () => {
            if (judge()) {
                fn(this);
                try {
                    this.ani.ticker.remove(func);
                } catch {}
            }
        };
        this.ani.ticker.add(func);
    }

    /**
     * 设置路径显示状态
     * @param show 是否显示路径
     */
    setPathShowStatus(show: boolean) {
        this.showPath = show;
    }

    /**
     * 当追逐战结束后执行函数
     * @param fn 执行的函数
     */
    onEnd(fn: (lose: boolean) => void) {
        this.endFn = fn;
    }

    /**
     * 结束这个追逐战
     */
    end(lose: boolean = false) {
        this.ani.ticker.destroy();
        delete flags.onChase;
        delete flags.chase;
        delete flags.chaseTime;
        delete flags.chaseHard;
        delete flags.chaseIndex;
        flags.__lockViewport__ = false;
        core.deleteCanvas('chasePath');
        if (this.endFn) this.endFn(lose);
    }
}

export async function startChase(index: number) {
    const data = getChaseDataByIndex(index);
    flags.chaseIndex = index;
    flags.onChase = true;
    await sleep(20);
    const chase = new Chase(
        data.path,
        data.fns,
        data.camera,
        flags.chaseHard === 0
    );
    flags.chase = chase;
    const hard = flags.chaseHard;

    // 成就
    chase.onEnd(lose => {
        if (hard === 1) {
            if (index === 1 && !lose) {
                completeAchievement('challenge', 0);
            }
        }
    });
}
