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

    /** 渐变的速率曲线 */
    transitionFn: TimingFn = hyper('sec', 'out');
    /** 瞬移的速率曲线 */
    mutateFn: TimingFn = hyper('sin', 'out');
    /** 加减速的速率曲线 */
    movingEaseFn: TimingFn = t => t ** 2;

    /** 突变时的渐变时长 */
    transitionTime: number = 600;

    /** 当前视角位置 */
    private nx: number = 0;
    private ny: number = 0;

    /** 委托ticker */
    private delegation: number = -1;
    /** 渐变委托ticker */
    private transition: number = -1;
    /** 移动委托ticker */
    private moving: number = -1;
    /** 是否在渐变过程中 */
    private inTransition: boolean = false;
    /** 是否在移动过程中 */
    private inMoving: boolean = false;

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
     * 传入视角的目标位置，将其限定在地图范围内后返回
     * @param x 图格横坐标
     * @param y 图格纵坐标
     */
    getBoundedPosition(x: number, y: number) {
        const width = core._WIDTH_;
        const height = core._HEIGHT_;
        const minX = (width - 1) / 2;
        const minY = (height - 1) / 2;
        const floor = core.status.maps[this.binder.getFloor()];
        const maxX = floor.width - minX - 1;
        const maxY = floor.height - minY - 1;

        // return { x, y };
        return { x: core.clamp(x, minX, maxX), y: core.clamp(y, minY, maxY) };
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
        } else {
            this.createTransition(nx, ny, time, this.transitionFn);
        }
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
        const halfWidth = core._PX_ / 2;
        const halfHeight = core._PY_ / 2;
        this.delegation = this.group.delegateTicker(() => {
            if (!this.enabled) return;
            if (this.nx === nx && this.ny === ny) return;
            const cell = this.group.cellSize;
            const half = cell / 2;
            nx = this.nx;
            ny = this.ny;
            const ox = this.nx * cell - halfWidth + half;
            const oy = this.ny * cell - halfHeight + half;
            core.bigmap.offsetX = ox;
            core.bigmap.offsetY = oy;

            this.group.camera.setTranslate(-ox, -oy);
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

const hook = Mota.require('var', 'hook');
hook.on('changingFloor', (_, loc) => {
    adapter.all('setPosition', loc.x, loc.y);
});
