import { logger } from '@/core/common/logger';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { CameraAnimation } from '@/core/render/camera';
import { LayerGroup } from '@/core/render/preset/layer';
import { MotaRenderer } from '@/core/render/render';
import { Sprite } from '@/core/render/sprite';
import { disableViewport, enableViewport } from '@/core/render/utils';
import type { HeroMover, MoveStep } from '@/game/state/move';
import EventEmitter from 'eventemitter3';

export interface ChaseData {
    path: Partial<Record<FloorIds, LocArr[]>>;
    camera: Partial<Record<FloorIds, CameraAnimation>>;
}

interface TimeListener {
    fn: (emitTime: number) => void;
    time: number;
}

interface LocListener {
    fn: (x: number, y: number) => void;
    floorId: FloorIds;
    once: boolean;
}

interface ChaseEvent {
    changeFloor: [floor: FloorIds];
    end: [success: boolean];
    start: [];
    step: [x: number, y: number];
    frame: [totalTime: number, floorTime: number];
}

export class Chase extends EventEmitter<ChaseEvent> {
    /** 本次追逐战的数据 */
    private readonly data: ChaseData;

    /** 是否显示路线 */
    private showPath: boolean = false;
    /** 每层的路线显示 */
    private pathMap: Map<FloorIds, MotaOffscreenCanvas2D> = new Map();
    /** 当前的摄像机动画 */
    private nowCamera?: CameraAnimation;
    /** 当前楼层 */
    private nowFloor?: FloorIds;

    /** 开始时刻 */
    startTime: number = 0;
    /** 进入当前楼层的时刻 */
    nowFloorTime: number = 0;
    /** 是否正在进行追逐战 */
    started: boolean = false;

    /** 路径显示的sprite */
    private pathSprite?: Sprite;
    /** 当前 LayerGroup 渲染元素 */
    private layer: LayerGroup;
    /** 委托ticker的id */
    private delegation: number = -1;

    /** 时间监听器 */
    private onTimeListener: TimeListener[] = [];
    /** 楼层时间监听器 */
    private onFloorTimeListener: Partial<Record<FloorIds, TimeListener[]>> = {};
    /** 勇士位置监听器 */
    private onHeroLocListener: Map<number, Set<LocListener>> = new Map();

    /** 勇士移动实例 */
    private heroMove: HeroMover;

    constructor(data: ChaseData, showPath: boolean = false) {
        super();

        this.data = data;
        this.showPath = showPath;

        const render = MotaRenderer.get('render-main')!;
        const layer = render.getElementById('layer-main')! as LayerGroup;
        this.layer = layer;

        const mover = Mota.require('module', 'State').heroMoveCollection.mover;
        this.heroMove = mover;

        mover.on('stepEnd', this.onStepEnd);
    }

    private onStepEnd = (step: MoveStep) => {
        if (step.type === 'speed') return;
        const { x, y } = core.status.hero.loc;
        this.emitHeroLoc(x, y);
        this.emit('step', x, y);
    };

    private emitHeroLoc(x: number, y: number) {
        if (!this.nowFloor) return;
        const floor = core.status.maps[this.nowFloor];
        const width = floor.width;
        const index = x + y * width;
        const list = this.onHeroLocListener.get(index);
        if (!list) return;
        const toDelete = new Set<LocListener>();
        list.forEach(v => {
            if (v.floorId === this.nowFloor) {
                v.fn(x, y);
                if (v.once) toDelete.add(v);
            }
        });
        toDelete.forEach(v => list.delete(v));
    }

    private emitTime() {
        const now = Date.now();
        const nTime = now - this.startTime;
        const fTime = now - this.nowFloorTime;

        this.emit('frame', nTime, fTime);

        while (1) {
            const time = this.onTimeListener[0];
            if (!time) break;
            if (time.time <= nTime) {
                time.fn(nTime);
                this.onTimeListener.shift();
            } else {
                break;
            }
        }

        if (!this.nowFloor) return;
        const floor = this.onFloorTimeListener[this.nowFloor];
        if (!floor) return;

        while (1) {
            const time = floor[0];
            if (!time) break;
            if (time.time <= fTime) {
                time.fn(nTime);
                floor.shift();
            } else {
                break;
            }
        }
    }

    private tick = () => {
        if (!this.started) return;
        const floor = core.status.floorId;
        if (floor !== this.nowFloor) {
            this.changeFloor(floor);
        }
        this.emitTime();
    };

    private readyPath() {
        for (const [key, nodes] of Object.entries(this.data.path)) {
            if (nodes.length === 0) return;
            const floor = key as FloorIds;
            const canvas = new MotaOffscreenCanvas2D();
            const ctx = canvas.ctx;
            const cell = 32;
            const half = cell / 2;
            const { width, height } = core.status.maps[floor];
            canvas.setHD(true);
            canvas.size(width * cell, height * cell);
            const [fx, fy] = nodes.shift()!;
            ctx.beginPath();
            ctx.moveTo(fx * cell + half, fy * cell + half);
            nodes.forEach(([x, y]) => {
                ctx.lineTo(x * cell + half, y * cell + half);
            });
            ctx.strokeStyle = '#0ff';
            ctx.globalAlpha = 0.6;
            ctx.stroke();
            this.pathMap.set(floor, canvas);
        }
        this.pathSprite = new Sprite('static', false, true);
        this.pathSprite.size(480, 480);
        this.pathSprite.pos(0, 0);
        this.pathSprite.setZIndex(120);
        this.pathSprite.setAntiAliasing(false);
        this.layer.appendChild(this.pathSprite);
        this.pathSprite.setRenderFn(canvas => {
            const ctx = canvas.ctx;
            const path = this.pathMap.get(core.status.floorId);
            if (!path) return;
            ctx.drawImage(path.canvas, 0, 0, path.width, path.height);
        });
    }

    /**
     * 当到达某个时间时触发函数
     * @param time 触发时刻
     * @param fn 触发时执行的函数，函数的参数表示实际触发时间
     */
    onTime(time: number, fn: (emitTime: number) => void) {
        if (this.started) {
            logger.error(1501);
            return;
        }
        this.onTimeListener.push({ time, fn });
    }

    /**
     * 当在某个楼层中到达某个时间时触发函数
     * @param floor 触发楼层
     * @param time 从进入该楼层开始计算的触发时刻
     * @param fn 触发时执行的函数
     */
    onFloorTime(floor: FloorIds, time: number, fn: (emitTime: number) => void) {
        if (this.started) {
            logger.error(1501);
            return;
        }
        this.onFloorTimeListener[floor] ??= [];
        const list = this.onFloorTimeListener[floor];
        list.push({ time, fn });
    }

    private ensureLocListener(index: number) {
        const listener = this.onHeroLocListener.get(index);
        if (listener) return listener;
        else {
            const set = new Set<LocListener>();
            this.onHeroLocListener.set(index, set);
            return set;
        }
    }

    /**
     * 当勇士走到某一层的某一格时执行函数
     * @param x 触发横坐标
     * @param y 触发纵坐标
     * @param floor 触发楼层
     * @param fn 触发函数
     * @param once 是否只执行一次
     */
    onLoc(
        x: number,
        y: number,
        floor: FloorIds,
        fn: (x: number, y: number) => void,
        once: boolean = false
    ) {
        if (this.started) {
            logger.error(1501);
            return;
        }
        const map = core.status.maps[floor];
        const { width } = map;
        const index = x + y * width;
        const set = this.ensureLocListener(index);
        set.add({ floorId: floor, fn, once });
    }

    /**
     * 当勇士走到某一层的某一格时执行函数，且只执行一次
     * @param x 触发横坐标
     * @param y 触发纵坐标
     * @param floor 触发楼层
     * @param fn 触发函数
     */
    onceLoc(
        x: number,
        y: number,
        floor: FloorIds,
        fn: (x: number, y: number) => void
    ) {
        this.onLoc(x, y, floor, fn, true);
    }

    /**
     * 切换楼层
     * @param floor 目标楼层
     */
    changeFloor(floor: FloorIds) {
        if (floor === this.nowFloor) return;
        this.nowFloor = floor;
        if (this.nowCamera) {
            this.nowCamera.destroy();
        }
        const camera = this.data.camera[floor];
        if (camera) {
            camera.start();
            this.nowCamera = camera;
        }
        this.nowFloorTime = Date.now();
        this.emit('changeFloor', floor);
    }

    start() {
        disableViewport();
        if (this.showPath) this.readyPath();
        this.changeFloor(core.status.floorId);
        this.startTime = Date.now();
        this.delegation = this.layer.delegateTicker(this.tick);
        this.started = true;
        for (const floorTime of Object.values(this.onFloorTimeListener)) {
            floorTime.sort((a, b) => a.time - b.time);
        }
        this.onTimeListener.sort((a, b) => a.time - b.time);
        this.emit('start');
    }

    /**
     * 结束这次追逐战
     * @param success 是否成功逃脱
     */
    end(success: boolean) {
        enableViewport();
        this.layer.removeTicker(this.delegation);
        this.pathSprite?.destroy();
        this.heroMove.off('stepEnd', this.onStepEnd);
        this.emit('end', success);
    }
}
