import { linear, TimingFn } from 'mutate-animate';
import { IMapRenderer, IMapVertexGenerator, IMovingBlock } from './types';
import { IMaterialFramedData, IMaterialManager } from '@user/client-base';
import { logger } from '@motajs/common';
import { IMapLayer } from '@user/data-state';

export interface IMovingRenderer {
    /** 素材管理器 */
    readonly manager: IMaterialManager;
    /** 顶点数组生成器 */
    readonly vertex: IMapVertexGenerator;

    /**
     * 获得当前时间戳
     */
    getTimestamp(): number;

    /**
     * 删除指定的移动图块对象
     * @param block 移动图块对象
     */
    deleteMoving(block: IMovingBlock): void;
}

export class MovingBlock implements IMovingBlock {
    readonly texture: IMaterialFramedData;
    readonly tile: number;
    readonly renderer: IMovingRenderer;
    readonly index: number;
    readonly layer: IMapLayer;

    x: number = 0;
    y: number = 0;

    /** 当前动画开始的时刻 */
    private startTime: number = 0;

    /** 是否是直线动画 */
    private line: boolean = false;
    /** 是否是相对模式 */
    private relative: boolean = false;
    /** 目标横坐标 */
    private targetX: number = 0;
    /** 目标纵坐标 */
    private targetY: number = 0;
    /** 直线移动的横坐标增量 */
    private dx: number = 0;
    /** 直线移动的纵坐标增量 */
    private dy: number = 0;
    /** 动画时长 */
    private time: number = 0;
    /** 速率曲线 */
    private timing: TimingFn = () => 0;
    /** 移动轨迹曲线 */
    private curve: TimingFn<2> = () => [0, 0];

    /** 动画开始时横坐标 */
    private startX: number = 0;
    /** 动画开始时纵坐标 */
    private startY: number = 0;
    /** 当前动画是否已经结束 */
    private end: boolean = false;

    /** 兑现函数 */
    private promiseFunc: () => void = () => {};

    constructor(
        renderer: IMovingRenderer & IMapRenderer,
        index: number,
        layer: IMapLayer,
        block: number | IMaterialFramedData,
        x: number,
        y: number
    ) {
        this.renderer = renderer;
        this.index = index;
        this.layer = layer;
        this.x = x;
        this.y = y;
        if (typeof block === 'number') {
            this.texture = renderer.manager.getTile(block)!;
            this.tile = block;
        } else {
            if (!renderer.manager.assetContainsTexture(block.texture)) {
                logger.error(34);
            }
            if (renderer.getOffsetIndex(block.offset) === -1) {
                logger.error(41);
            }
            this.texture = block;
            this.tile = -1;
        }
    }

    lineTo(
        x: number,
        y: number,
        time: number,
        timing?: TimingFn
    ): Promise<this> {
        this.startX = this.x;
        this.startY = this.y;
        this.targetX = x;
        this.targetY = y;
        this.dx = x - this.x;
        this.dy = y - this.y;
        this.time = time;
        this.relative = false;
        if (time === 0) {
            this.x = x;
            this.y = y;
            this.end = true;
            return Promise.resolve(this);
        }
        this.end = false;
        this.timing = timing ?? linear();
        this.line = true;
        return new Promise(res => {
            this.promiseFunc = () => res(this);
        });
    }

    moveAs(curve: TimingFn<2>, time: number, timing?: TimingFn): Promise<this> {
        this.time = time;
        this.line = false;
        this.relative = false;
        this.startX = this.x;
        this.startY = this.y;
        if (time === 0) {
            const [tx, ty] = curve(1);
            this.x = tx;
            this.y = ty;
            this.end = true;
            return Promise.resolve(this);
        }
        this.end = false;
        this.timing = timing ?? linear();
        this.curve = curve;
        return new Promise(res => {
            this.promiseFunc = () => res(this);
        });
    }

    moveRelative(
        curve: TimingFn<2>,
        time: number,
        timing?: TimingFn
    ): Promise<this> {
        this.time = time;
        this.line = false;
        this.relative = false;
        this.startX = this.x;
        this.startY = this.y;
        if (time === 0) {
            const [tx, ty] = curve(1);
            this.x = tx + this.startX;
            this.y = ty + this.startY;
            this.end = true;
            return Promise.resolve(this);
        }
        this.end = false;
        this.timing = timing ?? linear();
        this.curve = curve;
        return new Promise(res => {
            this.promiseFunc = () => res(this);
        });
    }

    stepMoving(timestamp: number): boolean {
        if (this.end) return false;
        const dt = timestamp - this.startTime;
        if (this.line) {
            if (dt > this.time) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.end = true;
                this.promiseFunc();
                return false;
            } else {
                const timeProgress = dt / this.time;
                const progress = this.timing(timeProgress);
                this.x = this.startX + progress * this.dx;
                this.y = this.startY + progress * this.dy;
            }
        } else {
            if (dt > this.time) {
                const [tx, ty] = this.curve(1);
                if (this.relative) {
                    this.x = tx + this.startX;
                    this.y = ty + this.startY;
                } else {
                    this.x = tx;
                    this.y = ty;
                }
                this.end = true;
                this.promiseFunc();
                return false;
            } else {
                const timeProgress = dt / this.time;
                const progress = this.timing(timeProgress);
                const [tx, ty] = this.curve(progress);
                if (this.relative) {
                    this.x = tx + this.startX;
                    this.y = ty + this.startY;
                } else {
                    this.x = tx;
                    this.y = ty;
                }
            }
        }
        return true;
    }

    enableFrameAnimate(): void {
        this.renderer.vertex.enableDynamicFrameAnimate(this);
    }

    disableFrameAnimate(): void {
        this.renderer.vertex.disableDynamicFrameAnimate(this);
    }

    setAlpha(alpha: number): void {
        this.renderer.vertex.setDynamicAlpha(this, alpha);
    }

    destroy(): void {
        this.renderer.deleteMoving(this);
    }
}
