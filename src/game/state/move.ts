import EventEmitter from 'eventemitter3';
import { backDir, toDir } from './utils';
import { loading } from '../game';
import type { RenderAdapter } from '@/core/render/adapter';
import type { HeroRenderer } from '@/core/render/preset/hero';
import type { FloorViewport } from '@/core/render/preset/viewport';
import type { HeroKeyMover } from '@/core/main/action/move';
import type {
    FloorLayer,
    Layer,
    LayerMovingRenderable
} from '@/core/render/preset/layer';
import type { LayerFloorBinder } from '@/core/render/preset/floor';
import { BluePalace } from '../mechanism/misc';

interface MoveStepDir {
    type: 'dir';
    value: Move2;
}

interface MoveStepSpeed {
    type: 'speed';
    value: number;
}

export type MoveStep = MoveStepDir | MoveStepSpeed;

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
    /** 面朝方向 */
    faceDir: Dir2 = 'down';

    /** 当前的控制对象 */
    controller?: IMoveController;

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

    /**
     * 当移动速度被设置时执行的函数
     * @param speed 设置为的移动速度
     * @param controller 本次移动的控制对象
     */
    protected abstract onSetMoveSpeed(
        speed: number,
        controller: IMoveController
    ): void;

    private getMoveDir(move: Move2): Dir2 {
        if (move === 'forward') return this.moveDir;
        if (move === 'backward') return backDir(this.faceDir);
        return move;
    }

    private getFaceDir(move: Move2): Dir2 {
        if (move === 'forward' || move === 'backward') return this.faceDir;
        return move;
    }

    /**
     * 设置当前面朝方向，移动中设置无效
     * @param dir 面朝方向
     */
    setFaceDir(dir: Dir2) {
        if (!this.moving) this.faceDir = dir;
    }

    /**
     * 设置当前移动方向，移动中设置无效
     * @param dir 移动方向
     */
    setMoveDir(dir: Dir2) {
        if (!this.moving) this.moveDir = dir;
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
            await this.onMoveStart(controller);
            this.emit('moveStart', queue);
            while (queue.length > 0) {
                if (stopMove || !this.moving) break;
                const step = queue.shift();
                if (!step) break;
                if (step.type === 'dir') {
                    this.moveDir = this.getMoveDir(step.value);
                    this.faceDir = this.getFaceDir(step.value);
                    const code = await this.onStepStart(step, controller);
                    await this.onStepEnd(step, code, controller);
                } else {
                    const replay = core.status.replay.speed;
                    const speed = replay === 24 ? 1 : step.value / replay;
                    this.moveSpeed = speed;
                    this.onSetMoveSpeed(speed, controller);
                }
                this.emit('stepEnd', step);
            }
            this.moving = false;
            this.emit('moveEnd');

            await this.onMoveEnd(controller);
        };

        const onEnd = start().then(() => {
            this.controller = void 0;
            controller.done = true;
        });
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
        this.controller = controller;

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

const enum BlockMoveCode {
    Step
}

export class BlockMover extends ObjectMoverBase {
    /** 楼层渲染适配器，用于显示动画 */
    static adapter?: RenderAdapter<Layer>;

    x: number;
    y: number;
    floorId: FloorIds;
    layer: FloorLayer;

    /** 本次移动中需要进行动画移动的楼层渲染组件 */
    private layerItems: Layer[] = [];
    /** 本次移动过程中的移动renderable实例 */
    private renderable?: LayerMovingRenderable;
    /** 本次移动的图块id */
    private blockNum: number = 0;

    constructor(
        x: number,
        y: number,
        floorId: FloorIds,
        layer: FloorLayer,
        dir: Dir = 'down'
    ) {
        super();

        this.x = x;
        this.y = y;
        this.floorId = floorId;
        this.moveDir = dir;
        this.layer = layer;
    }

    /**
     * 绑定移动点
     * @param x 绑定点横坐标
     * @param y 绑定点纵坐标
     * @param floorId 绑定点楼层
     * @returns 是否绑定成功，例如如果当前绑定点正在移动，那么就会绑定失败
     */
    bind(
        x: number,
        y: number,
        floorId: FloorIds,
        layer: FloorLayer,
        dir: Dir = 'down'
    ) {
        if (this.moving) return false;
        this.x = x;
        this.y = y;
        this.floorId = floorId;
        this.moveDir = dir;
        this.layer = layer;
        return true;
    }

    protected async onMoveStart(controller: IMoveController): Promise<void> {
        const adapter = BlockMover.adapter;
        if (adapter) {
            const list = adapter.items;
            const items = [...list].filter(v => {
                if (v.layer !== this.layer) return false;
                const ex = v.getExtends('floor-binder') as LayerFloorBinder;
                if (!ex) return false;
                return ex.getFloor() === core.status.floorId;
            });
            this.layerItems = items;
        }

        let blockNum: number = 0;
        if (this.layer === 'event') {
            blockNum = core.status.maps[this.floorId].map[this.y][this.x];
        } else {
            const array = core.maps._getBgFgMapArray(this.layer, this.floorId);
            blockNum = array[this.y][this.x];
        }
        this.blockNum = blockNum;

        Mota.r(() => {
            const { Layer } = Mota.require('module', 'Render');
            const r = Layer.getMovingRenderable(blockNum, this.x, this.y);

            if (r) {
                this.renderable = r;
                this.layerItems.forEach(v => {
                    v.moving.add(r);
                });
            }
        });

        if (this.layer === 'event') {
            core.removeBlock(this.x, this.y, this.floorId);
        }
    }

    protected async onMoveEnd(controller: IMoveController): Promise<void> {
        if (this.renderable) {
            this.layerItems.forEach(v => {
                v.moving.delete(this.renderable!);
            });
        }

        this.layerItems = [];
        this.renderable = void 0;

        if (this.layer === 'event') {
            core.setBlock(this.blockNum as AllNumbers, this.x, this.y);
        }
    }

    protected async onStepStart(
        step: MoveStepDir,
        controller: IMoveController
    ): Promise<BlockMoveCode> {
        await this.moveAnimate(step);
        const { x: dx, y: dy } = core.utils.scan2[this.moveDir];
        this.x += dx;
        this.y += dy;

        return BlockMoveCode.Step;
    }

    protected async onStepEnd(
        step: MoveStepDir,
        code: BlockMoveCode,
        controller: IMoveController
    ): Promise<void> {}

    protected onSetMoveSpeed(
        speed: number,
        controller: IMoveController
    ): void {}

    private moveAnimate(step: MoveStepDir) {
        const layer = this.layerItems[0];
        if (!layer) return;
        if (!this.renderable) return;
        const data = this.renderable;
        const fx = this.x;
        const fy = this.y;
        const { x: dx, y: dy } = core.utils.scan2[this.moveDir];
        const start = Date.now();
        const time = this.moveSpeed;

        return new Promise<void>(res => {
            layer.delegateTicker(
                () => {
                    const now = Date.now() - start;
                    const progress = now / time;
                    data.x = fx + dx * progress;
                    data.y = fy + dy * progress;
                    this.layerItems.forEach(v => {
                        v.update(v);
                    });
                },
                this.moveSpeed,
                () => {
                    data.x = fx + dx;
                    data.y = fy + dy;
                    data.zIndex = fy + dy;
                    res();
                }
            );
        });
    }
}

interface CanMoveStatus {
    /** 由CannotIn和CannotOut计算出的信息，不可移动时不会触发触发器 */
    canMove: boolean;
    /** 由图块的noPass计算出的信息，不可移动时会触发触发器 */
    noPass: boolean;
}

interface PortalStatus {
    /** 下一步是否会步入传送门 */
    portal: boolean;
    /** 传送门会传到哪 */
    data?: BluePalace.PortalTo;
}

const enum HeroMoveCode {
    Step,
    Stop,
    /** 不能移动，并撞击前面一格的图块，触发其触发器 */
    Hit,
    /** 不能移动，同时当前格有CannotOut，或目标格有CannotIn，不会触发前面一格的触发器 */
    CannotMove,
    /** 进入传送门 */
    Portal
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
    /** 是否会在特殊时刻进行自动存档 */
    private autoSave: boolean = false;

    /** 本次移动开始时的移动速度 */
    private beforeMoveSpeed: number = 100;

    /** 这一步的传送门信息 */
    private portalData?: BluePalace.PortalTo;

    override startMove(
        ignoreTerrain: boolean = false,
        noRoute: boolean = false,
        inLockControl: boolean = false,
        autoSave: boolean = false
    ): IMoveController | null {
        if (this.moving) return null;
        this.ignoreTerrain = ignoreTerrain;
        this.noRoute = noRoute;
        this.inLockControl = inLockControl;
        this.autoSave = autoSave;
        return super.startMove();
    }

    private checkAutoSave(x: number, y: number, nx: number, ny: number) {
        const index = `${x},${y}`;
        const nIndex = `${nx},${ny}`;
        const map = core.status.thisMap.enemy.mapDamage;
        const dam = map[index];
        const nextDam = map[nIndex];
        if (nextDam?.mockery || (!dam?.hunt && nextDam?.hunt)) {
            core.autosave();
            return true;
        }
    }

    protected async onMoveStart(controller: IMoveController): Promise<void> {
        this.beforeMoveSpeed = this.moveSpeed;
        const adapter = HeroMover.adapter;
        if (!adapter) return;
        await adapter.all('readyMove');
        adapter.sync('startAnimate');
    }

    protected async onMoveEnd(controller: IMoveController): Promise<void> {
        this.moveSpeed = this.beforeMoveSpeed;
        this.onSetMoveSpeed(this.moveSpeed, controller);
        const adapter = HeroMover.adapter;
        if (!adapter) return;
        await adapter.all('endMove');
        adapter.sync('endAnimate');
        core.clearContinueAutomaticRoute();
        core.stopAutomaticRoute();
    }

    protected async onStepStart(
        step: MoveStepDir,
        controller: IMoveController
    ): Promise<HeroMoveCode> {
        const showDir = toDir(this.faceDir);
        core.setHeroLoc('direction', showDir);

        const { x, y } = core.status.hero.loc;
        const { x: nx, y: ny } = this.nextLoc(x, y, this.moveDir);

        if (this.autoSave && !this.ignoreTerrain) {
            this.checkAutoSave(x, y, nx, ny);
        }

        if (!this.inLockControl && core.status.lockControl) {
            controller.stop();
            return HeroMoveCode.Stop;
        }

        if (!this.ignoreTerrain || !this.noRoute) {
            this.moveDir = showDir;
        }

        // 检查传送门
        if (!this.ignoreTerrain) {
            const { portal, data } = this.checkPortal(x, y, showDir);
            if (portal && data) {
                this.portalData = data;
                await this.renderHeroSwap(data);
                return HeroMoveCode.Portal;
            }
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
            core.clearContinueAutomaticRoute();
            core.stopAutomaticRoute();
            controller.stop();
            return;
        }

        // 本次移动正常完成
        if (code === HeroMoveCode.Step || code === HeroMoveCode.Portal) {
            if (code === HeroMoveCode.Portal) {
                const data = this.portalData;
                if (!data) return;
                core.setHeroLoc('x', data.x);
                core.setHeroLoc('y', data.y);
                core.setHeroLoc('direction', data.dir);
            } else {
                core.setHeroLoc('x', nx, true);
                core.setHeroLoc('y', ny, true);
            }

            if (!this.ignoreTerrain) {
                const direction = core.getHeroLoc('direction');
                core.control._moveAction_popAutomaticRoute();
                if (!this.noRoute) core.status.route.push(direction);

                core.moveOneStep();
                core.checkRouteFolding();
            }
        }
    }

    protected onSetMoveSpeed(speed: number, controller: IMoveController): void {
        const adapter = HeroMover.adapter;
        if (!adapter) return;
        adapter.sync('setMoveSpeed', speed);
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
        viewport.all('moveTo', x, y, this.moveSpeed * 1.6);
        adapter.sync('setAnimateDir', showDir);
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

    /**
     * 检查前方一格是否会步入传送门
     * @param x 横坐标
     * @param y 纵坐标
     * @param dir 移动方向
     */
    private checkPortal(x: number, y: number, dir: Dir): PortalStatus {
        const map = BluePalace.portalMap.get(core.status.floorId);
        if (!map) {
            return { portal: false };
        }
        const width = core.status.thisMap.width;
        const index = x + y * width;
        const data = map?.get(index);
        if (!data) {
            return { portal: false };
        }
        const to = data[dir];
        if (to) {
            return { portal: true, data: to };
        }
        return { portal: false };
    }

    private renderHeroSwap(data: BluePalace.PortalTo) {
        const adapter = HeroMover.adapter;
        if (!adapter) return;
        const list = adapter.items;
        const { x: tx, y: ty, dir: toDir } = data;
        const { x, y, direction } = core.status.hero.loc;
        const { x: dx, y: dy } = core.utils.scan[direction];
        const { x: tdx } = core.utils.scan[toDir];

        const promises = [...list].map(v => {
            if (!v.renderable) return;
            const renderable = { ...v.renderable };
            renderable.render = v.getRenderFromDir(toDir);
            renderable.zIndex = ty;
            const heroDir = v.moveDir;

            const width = v.renderable.render[0][2];
            const height = v.renderable.render[0][3];
            const cell = v.layer.cellSize;
            const restHeight = height - cell;
            if (!width || !height) return;

            const originFrom = structuredClone(v.renderable.render);
            const originTo = structuredClone(renderable.render);
            v.layer.moving.add(renderable);
            v.layer.requestUpdateMoving();

            const start = Date.now();
            return new Promise<void>(res => {
                const tick = () => {
                    const now = Date.now();
                    const progress = (now - start) / this.moveSpeed;
                    const clipWidth = cell * progress;
                    const clipHeight = cell * progress;
                    const beforeWidth = width - clipWidth;
                    const beforeHeight = height - clipHeight;

                    v.renderable!.x = x;
                    v.renderable!.y = y;
                    if (heroDir === 'left' || heroDir === 'right') {
                        v.renderable!.x = x + (clipWidth / 2 / cell) * dx;
                        v.renderable!.render.forEach((v, i) => {
                            v[2] = beforeWidth;
                            if (heroDir === 'left') {
                                v[0] = originFrom[i][0] + clipWidth;
                            }
                        });
                    } else {
                        v.renderable!.render.forEach((v, i) => {
                            v[3] = beforeHeight;
                            if (heroDir === 'up') {
                                v[1] =
                                    originFrom[i][1] + clipHeight + restHeight;
                            }
                        });
                    }

                    renderable.x = tx;
                    renderable.y = ty;
                    if (toDir === 'left' || toDir === 'right') {
                        renderable.x = tx + (clipWidth / 2 / cell - 0.5) * tdx;
                        renderable.render.forEach((v, i) => {
                            v[2] = clipWidth;
                            if (toDir === 'right') {
                                v[0] = originTo[i][0] + beforeWidth;
                            }
                        });
                    } else {
                        if (toDir === 'down') renderable.y = ty - 1 + progress;
                        renderable.render.forEach((v, i) => {
                            v[3] = clipHeight + restHeight;
                            if (toDir === 'down') {
                                v[1] = originTo[i][1] + clipHeight + restHeight;
                                v[3] = clipHeight;
                            }
                        });
                    }
                };
                v.layer.delegateTicker(tick, this.moveSpeed, () => {
                    v.renderable!.render = originFrom;
                    v.setAnimateDir(data.dir);
                    v.layer.moving.delete(renderable);
                    v.layer.requestUpdateMoving();
                    res();
                });
            });
        });

        return Promise.all(promises);
    }
}

interface HeroMoveCollection {
    mover: HeroMover;
    keyMover?: HeroKeyMover;
}

// 初始化基础勇士移动实例
const heroMover = new HeroMover();
export const heroMoveCollection: HeroMoveCollection = {
    mover: heroMover
};
loading.once('coreInit', () => {
    // 注册按键操作
    Mota.r(() => {
        const { HeroKeyMover } = Mota.require('module', 'Action');
        const gameKey = Mota.require('var', 'gameKey');
        const keyMover = new HeroKeyMover(gameKey, heroMover);
        heroMoveCollection.keyMover = keyMover;
    });
});

// Adapter初始化
loading.once('coreInit', () => {
    if (main.replayChecking || main.mode === 'editor') return;
    const Adapter = Mota.require('module', 'Render').RenderAdapter;
    const adapter = Adapter.get<HeroRenderer>('hero-adapter');
    const viewport = Adapter.get<FloorViewport>('viewport');
    const layerAdapter = Adapter.get<Layer>('layer');
    HeroMover.adapter = adapter;
    HeroMover.viewport = viewport;
    BlockMover.adapter = layerAdapter;
});
