import { logger } from '@/core/common/logger';
import { HeroRenderer } from './hero';
import { ILayerGroupRenderExtends, LayerGroup } from './layer';
import { Transform } from '../transform';
import { LayerGroupFloorBinder } from './floor';
import { hyper, TimingFn } from 'mutate-animate';
import { RenderAdapter } from '../adapter';

export class FloorViewport implements ILayerGroupRenderExtends {
    id: string = 'viewport';

    group!: LayerGroup;
    hero!: HeroRenderer;
    transform!: Transform;
    binder!: LayerGroupFloorBinder;

    /** 是否启用视角控制拓展 */
    enabled: boolean = true;

    /** 渐变的速率曲线 */
    transitionFn: TimingFn = hyper('sin', 'out');
    /** 加减速的速率曲线 */
    movingEaseFn: TimingFn = t => t ** 2;

    /** 突变时的渐变时长 */
    transitionTime: number = 600;

    /** 当前视角移动速度 */
    private speedX: number = 0;
    private speedY: number = 0;
    /** X方向移动状态，0表示静止，1表示加速过程，2表示匀速过程，3表示减速过程 */
    private movingStatusX: 0 | 1 | 2 | 3 = 0;
    /** X方向加减速过程进度 */
    private movingEaseProgressX: number = 0;
    /** Y方向移动状态，0表示静止，1表示加速过程，2表示匀速过程，3表示减速过程 */
    private movingStatusY: 0 | 1 | 2 | 3 = 0;
    /** Y方向加减速过程进度 */
    private movingEaseProgressY: number = 0;
    /** X方向移动结束坐标 */
    private movingEndX: number = 0;
    /** X方向移动结束坐标 */
    private movingEndY: number = 0;
    /** X方向进入第一阶段的时刻 */
    private movingAccX: number = 0;
    /** Y方向进入第一阶段的时刻 */
    private movingAccY: number = 0;
    /** X方向进入第二阶段的时刻 */
    private movingConstantX: number = 0;
    /** Y方向进入第二阶段的时刻 */
    private movingConstantY: number = 0;
    /** X方向进入第三阶段的时刻 */
    private movingDeaccX: number = 0;
    /** Y方向进入第三阶段的时刻 */
    private movingDeaccY: number = 0;
    /** X方向进入第一阶段的横坐标 */
    private movingAccPosX: number = 0;
    /** Y方向进入第一阶段的横坐标 */
    private movingAccPosY: number = 0;
    /** X方向进入第二阶段的横坐标 */
    private movingConstantPosX: number = 0;
    /** Y方向进入第二阶段的横坐标 */
    private movingConstantPosY: number = 0;
    /** X方向进入第三阶段的横坐标 */
    private movingDeaccPosX: number = 0;
    /** Y方向进入第三阶段的横坐标 */
    private movingDeaccPosY: number = 0;
    /** X方向进入第一阶段的进度 */
    private movingAccProgressX: number = 0;
    /** Y方向进入第一阶段的进度 */
    private movingAccProgressY: number = 0;
    /** X方向进入第三阶段的进度 */
    private movingDeaccProgressX: number = 0;
    /** Y方向进入第三阶段的进度 */
    private movingDeaccProgressY: number = 0;
    /** 移动的加减速时长 */
    private movingEaseTime: number = 0;

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
    moveTo(x: number, y: number) {
        if (!this.enabled) return;
        const { x: nx, y: ny } = this.getBoundedPosition(x, y);
        if (this.inTransition) {
            const distance = Math.hypot(this.nx - nx, this.ny - ny);
            const time = core.clamp(distance * 200, 200, 600);
            this.createTransition(nx, ny, time);
        } else {
            this.createTransition(nx, ny, 200);
            // const moveSpeed = 1000 / this.hero.speed;
            // this.speedX = moveSpeed;
            // this.speedY = moveSpeed;
            // this.movingEndX = x;
            // this.movingEndY = y;
            // this.movingEaseTime = moveSpeed * 2;
            // this.processMoving(x, y);
        }
    }

    private processMoving(x: number, y: number) {
        this.movingEndX = x;
        this.movingEndY = y;
        if (!this.inMoving) {
            this.movingStatusX = 0;
            this.movingEaseProgressX = 0;
            this.movingStatusY = 0;
            this.movingEaseProgressY = 0;
            this.inMoving = true;
        } else {
        }
    }

    /**
     * 当勇士位置突变至指定位置时移动视角
     * @param x 目标图格横坐标
     * @param y 目标图格纵坐标
     */
    mutateTo(x: number, y: number) {
        if (!this.enabled) return;
        const { x: nx, y: ny } = this.getBoundedPosition(x, y);
        this.createTransition(nx, ny, this.transitionTime);
    }

    private createTransition(x: number, y: number, time: number) {
        const start = Date.now();
        const end = start + time;
        const sx = this.nx;
        const sy = this.ny;
        const dx = x - sx;
        const dy = y - sy;
        this.speedX = 0;
        this.speedY = 0;

        this.inTransition = true;
        this.group.removeTicker(this.transition, false);
        this.transition = this.group.delegateTicker(
            () => {
                const now = Date.now();
                if (now >= end) {
                    this.group.removeTicker(this.transition, true);
                    return;
                }
                const progress = this.transitionFn((now - start) / time);
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

    private createMoving() {
        this.moving = this.group.delegateTicker(() => {
            const nx = this.nx;
            const ny = this.ny;
            const now = Date.now();
            const dx = Math.sign(this.movingEndX - nx);
            const dy = Math.sign(this.movingEndY - ny);
            const fn = this.movingEaseFn;
            // 进行进度判断
            if (this.movingEndX !== nx && this.movingStatusX === 0) {
                this.movingStatusX = 1;
                this.movingAccX = now;
                this.movingAccProgressX = this.movingEaseProgressX;
                this.movingAccPosX = nx - fn(this.movingAccProgressX) * dx;
            }
            if (this.movingEndY !== ny && this.movingStatusY === 0) {
                this.movingEaseProgressY = 1;
                this.movingAccY = now;
                this.movingAccProgressY = this.movingEaseProgressY;
                this.movingAccPosY = ny - fn(this.movingAccProgressY) * dy;
            }
            if (
                Math.abs(this.movingEndX - nx) <= 1 &&
                this.movingStatusX !== 3
            ) {
                this.movingStatusX = 3;
                this.movingDeaccX = now;
                this.movingDeaccProgressX = this.movingEaseProgressX;
                this.movingDeaccPosX =
                    nx - (fn(this.movingDeaccProgressX) + 1) * dx;
            }
            if (
                Math.abs(this.movingEndY - ny) <= 1 &&
                this.movingStatusY !== 3
            ) {
                this.movingStatusY = 3;
                this.movingDeaccY = now;
                this.movingDeaccProgressY = this.movingEaseProgressY;
                this.movingDeaccPosY =
                    ny - (fn(this.movingDeaccProgressY) + 1) * dy;
            }
            if (this.movingEaseProgressX >= 1 && this.movingStatusX === 1) {
                this.movingStatusX = 2;
                this.movingConstantX = now;
                this.movingConstantPosX = nx;
            }
            if (this.movingEaseProgressY >= 1 && this.movingStatusY === 1) {
                this.movingStatusY = 2;
                this.movingConstantY = now;
                this.movingConstantPosY = ny;
            }
            if (this.movingEaseProgressX <= 0 && this.movingStatusX === 3) {
                this.nx = this.movingEndX;
                this.movingStatusX = 0;
                this.movingEaseProgressX = 0;
            }
            if (this.movingEaseProgressY <= 0 && this.movingStatusY === 3) {
                this.ny = this.movingEndY;
                this.movingStatusY = 0;
                this.movingEaseProgressY = 0;
            }

            // 平滑视角位置计算
            if (this.movingEaseProgressX === 1) {
                // 加速阶段
                this.movingEaseProgressX =
                    (now - this.movingAccX) / this.movingEaseTime;
                const tx = fn(this.movingEaseProgressX) * dx;
                this.nx = this.movingAccPosX + tx;
            } else if (this.movingEaseProgressX === 2) {
                // 匀速阶段
                const time = now - this.movingConstantX;
                this.nx = this.movingConstantPosX + time * this.speedX * dx;
            } else if (this.movingEaseProgressX === 3) {
                // 减速阶段
                this.movingEaseProgressX =
                    1 - (now - this.movingDeaccX) / this.movingEaseTime;
                const tx = fn(this.movingEaseProgressX) * dx;
                this.nx = this.movingDeaccPosX + tx;
            }

            if (this.movingEaseProgressY === 1) {
                // 加速阶段
                this.movingEaseProgressY =
                    (now - this.movingAccY) / this.movingEaseTime;
                const ty = fn(this.movingEaseProgressY) * dy;
                this.ny = this.movingAccPosY + ty;
            } else if (this.movingEaseProgressY === 2) {
                // 匀速阶段
                const time = now - this.movingConstantY;
                this.ny = this.movingConstantPosY + time * this.speedY * dy;
            } else if (this.movingEaseProgressY === 3) {
                // 减速阶段
                this.movingEaseProgressY =
                    1 - (now - this.movingDeaccY) / this.movingEaseTime;
                const ty = fn(this.movingEaseProgressY) * dy;
                this.ny = this.movingDeaccPosY + ty;
            }
        });
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
        this.transform = group.transform;
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
adapter.receive('mutateTo', (item, x, y) => {
    item.mutateTo(x, y);
    return Promise.resolve();
});
adapter.receive('moveTo', (item, x, y) => {
    item.moveTo(x, y);
    return Promise.resolve();
});
adapter.receive('setPosition', (item, x, y) => {
    item.setPosition(x, y);
    return Promise.resolve();
});

const hook = Mota.require('var', 'hook');
hook.on('changingFloor', (_, loc) => {
    adapter.all('setPosition', loc.x, loc.y);
});
