import { logger } from '@/core/common/logger';
import { HeroRenderer } from './hero';
import { ILayerGroupRenderExtends, LayerGroup } from './layer';
import { LayerGroupFloorBinder } from './floor';
import { hyper, TimingFn } from 'mutate-animate';
import { RenderAdapter } from '../adapter';

export class FloorViewport implements ILayerGroupRenderExtends {
    id: string = 'viewport';

    group!: LayerGroup;
    hero!: HeroRenderer;
    binder!: LayerGroupFloorBinder;

    /** 是否启用视角控制拓展 */
    enabled: boolean = true;
    /** 是否自动限定视角范围至地图范围 */
    boundX: boolean = true;
    boundY: boolean = true;

    /** 渐变的速率曲线 */
    transitionFn: TimingFn = hyper('sin', 'out');
    /** 瞬移的速率曲线 */
    mutateFn: TimingFn = hyper('sin', 'out');

    /** 突变时的渐变时长 */
    transitionTime: number = 600;

    /** 当前视角位置 */
    private nx: number = 0;
    private ny: number = 0;
    /** 移动时的偏移位置 */
    private ox: number = 0;
    private oy: number = 0;
    /** 移动时的偏移最大值 */
    private maxOffset: number = 1;

    /** 委托ticker */
    private delegation: number = -1;
    /** 渐变委托ticker */
    private transition: number = -1;
    /** 移动的委托ticker */
    private moveDelegation: number = -1;
    /** 移动委托ticker */
    private moving: number = -1;
    /** 是否在渐变过程中 */
    private inTransition: boolean = false;
    /** 是否在移动过程中 */
    private inMoving: boolean = false;

    /** 移动的监听函数 */
    private movingFramer?: () => void;

    /**
     * 禁用自动视角控制
     */
    disable() {
        this.enabled = false;
    }

    /**
     * 启用自动视角控制
     */
    enable() {
        this.enabled = true;
        const { x, y } = core.status.hero.loc;
        const { x: nx, y: ny } = this.group.camera;
        const halfWidth = core._PX_ / 2;
        const halfHeight = core._PY_ / 2;
        const cell = this.group.cellSize;
        const half = cell / 2;
        this.nx = -(nx - halfWidth + half) / this.group.cellSize;
        this.ny = -(ny - halfHeight + half) / this.group.cellSize;
        this.mutateTo(x, y);
    }

    /**
     * 设置是否自动限定视角范围至地图范围
     * @param boundX 是否自动限定水平视角范围
     * @param boundY 是否自动限定竖直视角范围
     */
    setAutoBound(boundX: boolean = this.boundX, boundY: boolean = this.boundY) {
        this.boundX = boundX;
        this.boundY = boundY;
    }

    /**
     * 传入视角的目标位置，将其限定在地图范围内后返回
     * @param x 图格横坐标
     * @param y 图格纵坐标
     */
    getBoundedPosition(x: number, y: number) {
        if (!this.boundX && !this.boundY) return { x, y };
        const width = core._WIDTH_;
        const height = core._HEIGHT_;
        const minX = (width - 1) / 2;
        const minY = (height - 1) / 2;
        const floor = core.status.maps[this.binder.getFloor()];
        const maxX = floor.width - minX - 1;
        const maxY = floor.height - minY - 1;

        return {
            x: this.boundX ? core.clamp(x, minX, maxX) : x,
            y: this.boundY ? core.clamp(y, minY, maxY) : y
        };
    }

    /**
     * 设置视角位置
     * @param x 目标图格横坐标
     * @param y 目标图格纵坐标
     */
    setPosition(x: number, y: number) {
        if (!this.enabled) return;
        const { x: nx, y: ny } = this.getBoundedPosition(x, y);
        this.group.removeTicker(this.transition, false);
        this.nx = nx;
        this.ny = ny;
    }

    /**
     * 开始移动
     */
    startMove() {
        if (this.inMoving) return;
        this.inMoving = true;
        this.createMoveTransition();
    }

    /**
     * 结束移动
     */
    endMove() {
        this.inMoving = false;
    }

    /**
     * 当勇士通过移动改变至指定位置时移动视角
     * @param x 目标图格横坐标
     * @param y 目标图格纵坐标
     */
    moveTo(x: number, y: number, time: number = 200) {
        if (!this.enabled) return;
        const { x: nx, y: ny } = this.getBoundedPosition(x, y);
        if (this.inTransition) {
            const distance = Math.hypot(this.nx - nx, this.ny - ny);
            const t = core.clamp(distance * time, time, time * 3);
            this.createTransition(nx, ny, t, this.transitionFn);
        }
    }

    private createMoveTransition() {
        let xTarget: number = 0;
        let yTarget: number = 0;
        let xStart: number = this.ox;
        let yStart: number = this.oy;
        let xStartTime: number = Date.now();
        let yStartTime: number = Date.now();
        let ending: boolean = false;
        // 这个数等于 sinh(2)，用这个数的话，可以正好在刚开始移动的时候达到1的斜率，效果会比较好
        const transitionTime = this.hero.speed * 3.626860407847019;

        const setTargetX = (x: number, time: number) => {
            if (x === xTarget) return;
            xTarget = x;
            xStartTime = time;
            xStart = this.ox;
        };
        const setTargetY = (y: number, time: number) => {
            if (y === yTarget) return;
            yTarget = y;
            yStart = this.oy;
            yStartTime = time;
        };

        if (this.movingFramer) {
            this.hero.off('moveTick', this.movingFramer);
        }
        this.movingFramer = () => {
            const now = Date.now();
            if (!this.inMoving && !ending) {
                setTargetX(0, now);
                setTargetY(0, now);
                ending = true;
            }
            if (!ending) {
                const dir = this.hero.stepDir;
                const { x, y } = core.utils.scan2[dir];
                setTargetX(-x * this.maxOffset, now);
                setTargetY(-y * this.maxOffset, now);
            }

            if (!this.hero.renderable) return;

            this.nx = this.hero.renderable.x;
            this.ny = this.hero.renderable.y;

            if (ending) {
                if (this.ox === xTarget && this.oy == yTarget) {
                    this.group.removeTicker(this.moveDelegation);
                    return;
                }
            }
            if (this.ox !== xTarget) {
                const time = transitionTime * Math.abs(xStart - xTarget);
                const progress = (now - xStartTime) / time;
                if (progress > 1) {
                    this.ox = xTarget;
                } else {
                    const p = this.transitionFn(progress);
                    this.ox = (xTarget - xStart) * p + xStart;
                }
            }
            if (this.oy !== yTarget) {
                const time = transitionTime * Math.abs(yStart - yTarget);
                const progress = (now - yStartTime) / time;
                if (progress > 1) {
                    this.oy = yTarget;
                } else {
                    const p = this.transitionFn(progress);
                    this.oy = (yTarget - yStart) * p + yStart;
                }
            }
        };
        this.hero.on('moveTick', this.movingFramer);
    }

    /**
     * 当勇士位置突变至指定位置时移动视角
     * @param x 目标图格横坐标
     * @param y 目标图格纵坐标
     */
    mutateTo(x: number, y: number, time: number = this.transitionTime) {
        if (!this.enabled) return;
        const { x: nx, y: ny } = this.getBoundedPosition(x, y);
        this.createTransition(nx, ny, time, this.mutateFn);
    }

    private createTransition(x: number, y: number, time: number, fn: TimingFn) {
        const start = Date.now();
        const end = start + time;
        const sx = this.nx;
        const sy = this.ny;
        const dx = x - sx;
        const dy = y - sy;

        this.inTransition = true;
        this.group.removeTicker(this.transition, false);
        this.transition = this.group.delegateTicker(
            () => {
                const now = Date.now();
                if (now >= end) {
                    this.group.removeTicker(this.transition, true);
                    return;
                }
                const progress = fn((now - start) / time);
                const tx = dx * progress;
                const ty = dy * progress;
                this.nx = tx + sx;
                this.ny = ty + sy;
            },
            time,
            () => {
                this.nx = x;
                this.ny = y;
                this.inTransition = false;
            }
        );
    }

    private create() {
        let nx = this.nx;
        let ny = this.ny;
        let ox = this.ox;
        let oy = this.oy;
        const halfWidth = core._PX_ / 2;
        const halfHeight = core._PY_ / 2;
        this.delegation = this.group.delegateTicker(() => {
            if (!this.enabled) return;
            if (
                this.nx === nx &&
                this.ny === ny &&
                this.ox === ox &&
                this.oy === oy
            ) {
                return;
            }
            const cell = this.group.cellSize;
            const half = cell / 2;
            nx = this.nx;
            ny = this.ny;
            ox = this.ox;
            oy = this.oy;
            const { x: bx, y: by } = this.getBoundedPosition(nx + ox, ny + oy);
            const rx = bx * cell - halfWidth + half;
            const ry = by * cell - halfHeight + half;
            core.bigmap.offsetX = rx;
            core.bigmap.offsetY = ry;

            this.group.camera.setTranslate(-rx, -ry);
            this.group.update(this.group);
        });
        // this.createMoving();
    }

    awake(group: LayerGroup): void {
        this.group = group;
        const ex1 = group.getLayer('event')?.getExtends('floor-hero');
        const ex2 = group.getExtends('floor-binder');
        if (
            ex1 instanceof HeroRenderer &&
            ex2 instanceof LayerGroupFloorBinder
        ) {
            this.hero = ex1;
            this.binder = ex2;
            this.create();
            adapter.add(this);
        } else {
            logger.error(15);
            group.removeExtends('viewport');
        }
    }

    onDestroy(group: LayerGroup): void {
        group.removeTicker(this.delegation);
        group.removeTicker(this.transition);
        group.removeTicker(this.moving);
        adapter.remove(this);
    }
}

const adapter = new RenderAdapter<FloorViewport>('viewport');
adapter.receive('mutateTo', (item, x, y, time) => {
    item.mutateTo(x, y, time);
    return Promise.resolve();
});
adapter.receive('moveTo', (item, x, y, time) => {
    item.moveTo(x, y, time);
    return Promise.resolve();
});
adapter.receive('setPosition', (item, x, y) => {
    item.setPosition(x, y);
    return Promise.resolve();
});
adapter.receiveSync('disable', item => {
    item.disable();
});
adapter.receiveSync('enable', item => {
    item.enable();
});
adapter.receiveSync('startMove', item => {
    item.startMove();
});
adapter.receiveSync('endMove', item => {
    item.endMove();
});

const hook = Mota.require('var', 'hook');
hook.on('changingFloor', (_, loc) => {
    adapter.all('setPosition', loc.x, loc.y);
});
