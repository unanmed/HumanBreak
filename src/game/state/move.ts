import EventEmitter from 'eventemitter3';
import { backDir, toDir } from './utils';
import { loading } from '../game';
import type { RenderAdapter } from '@/core/render/adapter';
import type { HeroRenderer } from '@/core/render/preset/hero';
import type { FloorViewport } from '@/core/render/preset/viewport';
import type { KeyCode } from '@/plugin/keyCodes';

interface MoveStepDir {
    type: 'dir';
    value: Move2;
}

interface MoveStepSpeed {
    type: 'speed';
    value: number;
}

type MoveStep = MoveStepDir | MoveStepSpeed;

export interface IMoveController {
    /** 本次移动是否完成 */
    done: boolean;
    /** 当前移动队列 */
    queue: MoveStep[];
    /** 当本次移动完成时兑现 */
    onEnd: Promise<void>;

    /**
     * 停止本次移动，停止后将不再能继续移动
     */
    stop(): Promise<void>;

    /**
     * 向队列末尾添加移动信息
     * @param step 移动信息
     */
    push(...step: MoveStep[]): void;
}

interface EObjectMovingEvent {
    stepEnd: [step: MoveStep];
    moveEnd: [];
    moveStart: [queue: MoveStep[]];
}

export abstract class ObjectMoverBase extends EventEmitter<EObjectMovingEvent> {
    /** 移动队列 */
    private moveQueue: MoveStep[] = [];

    /** 当前的移动速度 */
    moveSpeed: number = 100;
    /** 当前的移动方向 */
    moveDir: Dir2 = 'down';
    /** 当前是否正在移动 */
    moving: boolean = false;

    /**
     * 当本次移动开始时执行的函数
     * @param controller 本次移动的控制对象
     */
    protected abstract onMoveStart(controller: IMoveController): Promise<void>;

    /**
     * 当本次移动结束时执行的函数
     * @param controller 本次移动的控制对象
     */
    protected abstract onMoveEnd(controller: IMoveController): Promise<void>;

    /**
     * 当这一步开始移动时执行的函数，可以用来播放移动动画等
     * @param step 这一步的移动信息
     * @param controller 本次移动的控制对象
     * @returns 一个Promise，其值表示本次移动的代码，并将其值传入这一步移动后的操作，即{@link onStepEnd}
     */
    protected abstract onStepStart(
        step: MoveStepDir,
        controller: IMoveController
    ): Promise<number>;

    /**
     * 当这一步移动结束后执行的函数（即{@link onStepStart}成功兑现后），可以用于设置物体坐标等
     * @param step 这一步的移动信息
     * @param code 本步移动的代码，即onMoveStart的返回值
     * @param controller 本次移动的控制对象
     * @returns 一个Promise，当其兑现时，本步移动全部完成，将会开始下一步的移动
     */
    protected abstract onStepEnd(
        step: MoveStepDir,
        code: number,
        controller: IMoveController
    ): Promise<void>;

    private getMoveDir(move: Move2): Dir2 {
        if (move === 'forward') return this.moveDir;
        if (move === 'backward') return backDir(this.moveDir);
        return move;
    }

    /**
     * 开始移动，这个操作后，本次移动将不能通过{@link insertMove}添加移动步骤，
     * 只能通过{@link IMoveController.push}添加，而通过前者添加的移动步骤会在下次移动生效
     */
    startMove(): IMoveController | null {
        if (this.moving) return null;
        const queue = this.moveQueue.slice();
        this.clearMoveQueue();

        this.moving = true;
        let stopMove = false;

        const start = async () => {
            // 等待宏任务执行完成，不然controller会在首次调用中未定义
            await new Promise<void>(res => res());
            this.emit('moveStart', queue);
            await this.onMoveStart(controller);
            while (queue.length > 0) {
                if (stopMove || !this.moving) break;
                const step = queue.shift();
                if (!step) break;
                if (step.type === 'dir') {
                    this.moveDir = this.getMoveDir(step.value);
                    const code = await this.onStepStart(step, controller);
                    await this.onStepEnd(step, code, controller);
                } else {
                    this.moveSpeed = step.value;
                }
                this.emit('stepEnd', step);
            }
            this.moving = false;
            this.emit('moveEnd');

            await this.onMoveEnd(controller);
        };

        const onEnd = start();
        const controller: IMoveController = {
            done: false,
            onEnd,
            queue,
            push(...step) {
                queue.push(...step);
            },
            stop() {
                stopMove = true;
                return onEnd;
            }
        };

        return controller;
    }

    /**
     * 向移动队列末尾插入移动实例
     * @param move 移动实例
     */
    insertMove(...move: MoveStep[]) {
        this.moveQueue.push(...move);
    }

    /**
     * 清空移动队列
     */
    clearMoveQueue() {
        this.moveQueue = [];
    }

    /**
     * 向移动队列末尾插入一个移动操作
     * @param step 移动方向
     */
    oneStep(step: Move2) {
        this.moveQueue.push({ type: 'dir', value: step });
    }

    /**
     * 按照传入的数组移动物体，插入至移动队列末尾
     * @param steps 移动步骤
     */
    moveAs(steps: MoveStep[]) {
        this.moveQueue.push(...steps);
    }
}

interface CanMoveStatus {
    /** 由CannotIn和CannotOut计算出的信息，不可移动时不会触发触发器 */
    canMove: boolean;
    /** 由图块的noPass计算出的信息，不可移动时会触发触发器 */
    noPass: boolean;
}

const enum HeroMoveCode {
    Step,
    Stop,
    /** 不能移动，并撞击前面一格的图块，触发其触发器 */
    Hit,
    /** 不能移动，同时当前格有CannotOut，或目标格有CannotIn，不会触发前面一格的触发器 */
    CannotMove
}

export class HeroMover extends ObjectMoverBase {
    /** 勇士渲染适配器，用于等待动画等操作 */
    static adapter?: RenderAdapter<HeroRenderer>;
    /** 视角适配器 */
    static viewport?: RenderAdapter<FloorViewport>;

    /** 当前移动是否忽略地形 */
    private ignoreTerrain: boolean = false;
    /** 当前移动是否不计入录像 */
    private noRoute: boolean = false;
    /** 当前移动是否是在lockControl条件下开始的 */
    private inLockControl: boolean = false;

    override startMove(
        ignoreTerrain: boolean = false,
        noRoute: boolean = false,
        inLockControl: boolean = false
    ): IMoveController | null {
        this.ignoreTerrain = ignoreTerrain;
        this.noRoute = noRoute;
        this.inLockControl = inLockControl;
        return super.startMove();
    }

    protected async onMoveStart(controller: IMoveController): Promise<void> {
        const adapter = HeroMover.adapter;
        if (!adapter) return;
        await adapter.all('readyMove');
        adapter.sync('startAnimate');
    }

    protected async onMoveEnd(controller: IMoveController): Promise<void> {
        const adapter = HeroMover.adapter;
        if (!adapter) return;
        await adapter.all('endMove');
        adapter.sync('endAnimate');
    }

    protected async onStepStart(
        step: MoveStepDir,
        controller: IMoveController
    ): Promise<HeroMoveCode> {
        const showDir = toDir(this.moveDir);
        core.setHeroLoc('direction', showDir);
        const adapter = HeroMover.adapter;
        adapter?.sync('setAnimateDir', showDir);

        const { x, y } = core.status.hero.loc;
        const { x: nx, y: ny } = this.nextLoc(x, y, this.moveDir);

        if (!this.inLockControl && core.status.lockControl) {
            controller.stop();
            return HeroMoveCode.Stop;
        }

        if (!this.ignoreTerrain || !this.noRoute) {
            this.moveDir = showDir;
        }

        const dir = this.moveDir;
        if (!this.ignoreTerrain) {
            const { noPass, canMove } = this.checkCanMove(x, y, showDir);

            // 不能移动
            if (noPass || !canMove) {
                if (!canMove) return HeroMoveCode.CannotMove;
                else return HeroMoveCode.Hit;
            }
        }

        // 可以移动，显示移动动画
        await this.moveAnimate(nx, ny, showDir, dir);

        return HeroMoveCode.Step;
    }

    protected async onStepEnd(
        step: MoveStepDir,
        code: HeroMoveCode,
        controller: IMoveController
    ): Promise<void> {
        const { x, y } = core.status.hero.loc;
        const { x: nx, y: ny } = this.nextLoc(x, y, this.moveDir);
        const showDir = toDir(this.moveDir);

        // 前方不能移动
        if (code === HeroMoveCode.CannotMove || code === HeroMoveCode.Hit) {
            controller.stop();
            this.onCannotMove(showDir);
            if (code === HeroMoveCode.Hit) {
                core.trigger(nx, ny);
            }
            return;
        }

        // 本次移动停止
        if (code === HeroMoveCode.Stop) {
            controller.stop();
            return;
        }

        // 本次移动正常完成
        if (code === HeroMoveCode.Step) {
            core.setHeroLoc('x', nx, true);
            core.setHeroLoc('y', ny, true);

            const direction = core.getHeroLoc('direction');
            core.control._moveAction_popAutomaticRoute();
            if (!this.noRoute) core.status.route.push(direction);

            core.moveOneStep();
            core.checkRouteFolding();
        }
    }

    /**
     * 移动动画
     * @param x 目标横坐标
     * @param y 目标纵坐标
     * @param showDir 显示方向
     * @param moveDir 移动方向
     */
    private async moveAnimate(
        x: number,
        y: number,
        showDir: Dir,
        moveDir: Dir2
    ) {
        const adapter = HeroMover.adapter;
        const viewport = HeroMover.viewport;
        if (!adapter || !viewport) return;
        viewport.all('moveTo', x, y);
        await adapter.all('move', moveDir);
    }

    /**
     * 当前方一格不能走时，执行的函数
     * @param dir 移动方向
     */
    private onCannotMove(dir: Dir) {
        if (!this.noRoute) core.status.route.push(dir);
        core.status.automaticRoute.moveStepBeforeStop = [];
        core.status.automaticRoute.lastDirection = dir;

        if (core.status.automaticRoute.moveStepBeforeStop.length == 0) {
            core.clearContinueAutomaticRoute();
            core.stopAutomaticRoute();
        }
    }

    /**
     * 检查前方是否可以移动
     * @param x 当前横坐标
     * @param y 当前纵坐标
     * @param dir 移动方向
     */
    private checkCanMove(x: number, y: number, dir: Dir): CanMoveStatus {
        const { x: nx, y: ny } = this.nextLoc(x, y, dir);
        const noPass = core.noPass(nx, ny);
        const canMove = core.canMoveHero(x, y, dir);
        return { noPass, canMove };
    }

    /**
     * 获取前方一格的坐标
     * @param x 当前横坐标
     * @param y 当前纵坐标
     * @param dir 移动方向
     */
    private nextLoc(x: number, y: number, dir: Dir2): Loc {
        const { x: dx, y: dy } = core.utils.scan2[dir];
        const nx = x + dx;
        const ny = y + dy;
        return { x: nx, y: ny };
    }
}

// 初始化基础勇士移动实例
export const heroMover = new HeroMover();
loading.once('coreInit', () => {
    // 注册按键操作
    Mota.r(() => {
        const { HeroKeyMover } = Mota.require('module', 'Action');
        const gameKey = Mota.require('var', 'gameKey');
        const keyMover = new HeroKeyMover(gameKey, heroMover);
    });
});

// Adapter初始化
loading.once('coreInit', () => {
    if (main.replayChecking || main.mode === 'editor') return;
    const Adapter = Mota.require('module', 'Render').RenderAdapter;
    const adapter = Adapter.get<HeroRenderer>('hero-adapter');
    const viewport = Adapter.get<FloorViewport>('viewport');
    HeroMover.adapter = adapter;
    HeroMover.viewport = viewport;
});
