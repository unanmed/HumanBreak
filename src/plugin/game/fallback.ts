import type { RenderAdapter } from '@/core/render/adapter';
import type { LayerGroupAnimate } from '@/core/render/preset/animate';
import type {
    LayerDoorAnimate,
    LayerFloorBinder
} from '@/core/render/preset/floor';
import type { HeroRenderer } from '@/core/render/preset/hero';
import type { Layer, LayerMovingRenderable } from '@/core/render/preset/layer';
import { BluePalace } from '@/game/mechanism/misc';
import { backDir } from './utils';
import type { TimingFn } from 'mutate-animate';

interface Adapters {
    'hero-adapter'?: RenderAdapter<HeroRenderer>;
    'door-animate'?: RenderAdapter<LayerDoorAnimate>;
    animate?: RenderAdapter<LayerGroupAnimate>;
    layer?: RenderAdapter<Layer>;
}

const adapters: Adapters = {};

export function init() {
    const hook = Mota.require('var', 'hook');
    const loading = Mota.require('var', 'loading');
    let fallbackIds: number = 1e8;

    if (!main.replayChecking && main.mode === 'play') {
        const Adapter = Mota.require('module', 'Render').RenderAdapter;
        const hero = Adapter.get<HeroRenderer>('hero-adapter');
        const doorAnimate = Adapter.get<LayerDoorAnimate>('door-animate');
        const animate = Adapter.get<LayerGroupAnimate>('animate');
        const layer = Adapter.get<Layer>('layer');

        adapters['hero-adapter'] = hero;
        adapters['door-animate'] = doorAnimate;
        adapters['animate'] = animate;
        adapters['layer'] = layer;
    }

    let moving: boolean = false;
    let stopChian: boolean = false;
    let moveDir: Dir;
    let stepDir: Dir;
    let moveEnding: Promise<any[]> = Promise.resolve([]);

    /** 传送门信息，下一步传送到哪 */
    let portalData: BluePalace.PortalTo | undefined;
    /** 下一步是否步入传送门 */
    let portal: boolean = false;

    const pressedArrow: Set<Dir> = new Set();
    Mota.r(() => {
        const gameKey = Mota.require('var', 'gameKey');
        const { moveUp, moveDown, moveLeft, moveRight } = gameKey.data;
        const symbol = Symbol.for('@key_main');
        gameKey.on('press', code => {
            if (core.status.lockControl || gameKey.scope !== symbol) return;
            if (code === moveUp.key) onMoveKeyDown('up');
            if (code === moveDown.key) onMoveKeyDown('down');
            if (code === moveLeft.key) onMoveKeyDown('left');
            if (code === moveRight.key) onMoveKeyDown('right');
        });
        gameKey.on('release', code => {
            if (code === moveUp.key) onMoveKeyUp('up');
            if (code === moveDown.key) onMoveKeyUp('down');
            if (code === moveLeft.key) onMoveKeyUp('left');
            if (code === moveRight.key) onMoveKeyUp('right');
        });
    });

    function onMoveKeyDown(type: Dir) {
        pressedArrow.add(type);
        moveDir = type;
        if (!moving) {
            stepDir = moveDir;
            readyMove();
        }
        if (moving && stopChian) {
            stopChian = false;
        }
    }

    function onMoveKeyUp(type: Dir) {
        pressedArrow.delete(type);
        if (pressedArrow.size === 0) {
            stopChian = true;
        } else {
            const arr = [...pressedArrow];
            moveDir = arr[0];
            if (!moving) {
                stepDir = moveDir;
                readyMove();
            }
        }
    }

    async function readyMove() {
        const adapter = adapters['hero-adapter'];
        if (!adapter) {
            return Promise.resolve();
        } else {
            if (!checkCanMoveStatus()) {
                continueAfterEnd();
                return Promise.resolve();
            }
            await adapter.all('readyMove');
            moving = true;
            stopChian = false;
            startHeroMoveChain();
        }
    }

    async function endMove() {
        const adapter = adapters['hero-adapter'];
        if (!adapter) {
            return Promise.resolve();
        } else {
            if (moving) {
                stopChian = true;
                moveEnding = adapter.all('endMove');
                await moveEnding;
                moving = false;
                continueAfterEnd();
            }
            return Promise.resolve();
        }
    }

    function move(dir: Dir) {
        moveDir = dir;
    }

    function continueAfterEnd() {
        requestAnimationFrame(() => {
            if (pressedArrow.size === 0 || moving) {
                stopChian = true;
                return;
            }
            if (checkCanMoveStatus()) {
                if (!moving) {
                    stepDir = moveDir;
                    readyMove();
                }
            } else {
                continueAfterEnd();
            }
        });
    }

    async function startHeroMoveChain(callback?: () => void) {
        const adapter = adapters['hero-adapter'];
        if (!adapter) {
            return Promise.resolve();
        } else {
            while (moving || !stopChian) {
                if (stopChian || core.status.lockControl) break;
                stepDir = moveDir;
                if (!checkCanMoveStatus(callback)) break;
                if (portal) renderHeroSwap();
                await adapter.all('move', moveDir);
                onMoveEnd(false, callback);
            }
            endMove();
            stopChian = false;
        }
    }

    function checkCanMoveStatus(callback?: () => void) {
        core.setHeroLoc('direction', stepDir);
        const { noPass, canMove } = checkCanMove();
        checkPortal();

        if (!portal && (noPass || !canMove)) {
            onCannotMove(canMove, callback);
            if (moving) endMove();
            return false;
        }
        return true;
    }

    function getNextLoc() {
        const { x: dx, y: dy } = core.utils.scan[stepDir];
        const { x, y } = core.status.hero.loc;
        const nx = x + dx;
        const ny = y + dy;
        return { nx, ny };
    }

    /**
     * 检查下一格是否可以移动
     */
    function checkCanMove() {
        const { nx, ny } = getNextLoc();
        const { x, y } = core.status.hero.loc;
        const noPass = core.noPass(nx, ny);
        const canMove = core.canMoveHero(x, y, stepDir);
        return { noPass, canMove };
    }

    function onCannotMove(canMove: boolean, callback?: () => void) {
        const { nx, ny } = getNextLoc();
        core.status.route.push(core.getHeroLoc('direction'));
        // @ts-ignore
        core.status.automaticRoute.moveStepBeforeStop = [];
        // @ts-ignore
        core.status.automaticRoute.lastDirection = core.getHeroLoc('direction');
        if (canMove) core.trigger(nx, ny);
        core.drawHero();

        if (core.status.automaticRoute.moveStepBeforeStop.length == 0) {
            core.clearContinueAutomaticRoute();
            core.stopAutomaticRoute();
        }
        callback?.();
    }

    function onMoveEnd(noPass: boolean, callback?: () => void) {
        if (portal && portalData) {
            const { x, y, dir } = portalData;
            core.setHeroLoc('x', x);
            core.setHeroLoc('y', y);
            core.setHeroLoc('direction', dir);
            portal = false;
        } else if (!noPass) {
            const { nx, ny } = getNextLoc();
            core.setHeroLoc('x', nx, true);
            core.setHeroLoc('y', ny, true);
        }

        var direction = core.getHeroLoc('direction');
        core.control._moveAction_popAutomaticRoute();
        core.status.route.push(direction);

        core.moveOneStep();
        core.checkRouteFolding();
        callback?.();
    }

    // ----- 移动 - 传送门
    function checkPortal() {
        const map = BluePalace.portalMap.get(core.status.floorId);
        if (!map) {
            portal = false;
            portalData = void 0;
            return;
        }
        const width = core.status.thisMap.width;
        const { x, y, direction } = core.status.hero.loc;
        const index = x + y * width;
        const data = map?.get(index);
        if (!data) {
            portal = false;
            portalData = void 0;
            return;
        }
        const to = data[direction];
        if (to) {
            portal = true;
            portalData = to;
        }
    }

    const end: Record<Dir, [number, number]> = {
        left: [-1, 0],
        right: [1, 0],
        down: [0, 1],
        up: [0, -1]
    };

    /**
     * 对勇士进行切割渲染，分成两个renderable进行渲染
     */
    function renderHeroSwap() {
        if (!portal || !portalData) return;
        const list = adapters['hero-adapter']?.items;
        if (!list) return;
        const { x: tx, y: ty, dir: toDir } = portalData;
        const { x, y, direction } = core.status.hero.loc;
        const [dx, dy] = end[direction];
        const [tdx] = end[toDir];
        const checkX = x + dx;
        const checkY = y + dy;

        list.forEach(v => {
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
            v.on('moveTick', function func() {
                const progress =
                    heroDir === 'left' || heroDir === 'right'
                        ? 1 - Math.abs(checkX - v.renderable!.x)
                        : 1 - Math.abs(checkY - v.renderable!.y);
                if (progress >= 1 || !portal) {
                    v.renderable!.render = originFrom;
                    v.off('moveTick', func);
                    v.layer.moving.delete(renderable);
                    v.layer.requestUpdateMoving();
                    return;
                }
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
                            v[1] = originFrom[i][1] + clipHeight + restHeight;
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
            });
        });
    }

    // ----- 工具函数

    /**
     * 根据事件中给出的移动数组解析出全部的移动步骤
     */
    function getMoveSteps(steps: string[]) {
        const moveSteps: string[] = [];
        steps.forEach(v => {
            const [type, number] = v.split(':');
            if (!number) moveSteps.push(type);
            else {
                if (type === 'speed') moveSteps.push(v);
                else {
                    moveSteps.push(...Array(number).fill(type));
                }
            }
        });

        const step0 = steps.find(v => !v.startsWith('speed')) as Dir2;
        return { steps, start: step0 };
    }

    /**
     * 移动一个LayerMovingRenderable
     */
    function moveRenderable(
        item: Layer,
        data: LayerMovingRenderable,
        time: number,
        x: number,
        y: number
    ) {
        const fx = data.x;
        const fy = data.y;
        const dx = x - fx;
        const dy = y - fy;
        const start = Date.now();
        return new Promise<void>(res => {
            item.delegateTicker(
                () => {
                    const now = Date.now() - start;
                    const progress = now / time;
                    data.x = fx + dx * progress;
                    data.y = fy + dy * progress;
                    item.update(item);
                },
                time,
                () => {
                    data.x = x;
                    data.y = y;
                    res();
                }
            );
        });
    }

    /**
     * 生成跳跃函数
     */
    function generateJumpFn(dx: number, dy: number): TimingFn<3> {
        const distance = Math.hypot(dx, dy);
        const peak = 3 + distance;
        const k = dy / dx;

        return (progress: number) => {
            const x = dx * progress;
            const y = k * x + (progress ** 2 - progress) * peak;
            return [x, y, Math.ceil(y)];
        };
    }

    Mota.r(() => {
        // ----- 勇士移动相关
        control.prototype._moveAction_moving = function (
            callback?: () => void
        ) {};
        events.prototype.eventMoveHero = async function (
            steps: string[],
            time?: number,
            callback?: () => void
        ) {};

        control.prototype.setHeroLoc = function (
            name: 'x' | 'y' | 'direction',
            value: number | Dir,
            noGather?: boolean
        ) {
            if (!core.status.hero) return;
            // @ts-ignore
            core.status.hero.loc[name] = value;
            if ((name === 'x' || name === 'y') && !noGather) {
                this.gatherFollowers();
            }
            if (name === 'direction') {
                adapters['hero-adapter']?.sync('turn', value);
            } else if (name === 'x') {
                adapters['hero-adapter']?.sync('setHeroLoc', value);
            } else {
                adapters['hero-adapter']?.sync('setHeroLoc', void 0, value);
            }
        };

        ////// 停止勇士的一切行动，等待勇士行动结束后，再执行callback //////
        control.prototype.waitHeroToStop = function (callback?: () => void) {
            core.stopAutomaticRoute();
            core.clearContinueAutomaticRoute();
            moveEnding.then(() => {
                callback?.();
            });
        };

        control.prototype.moveHero = async function (
            direction: Dir,
            callback: () => void
        ) {
            // 如果正在移动，直接return
            if (core.status.heroMoving != 0) return;
            if (core.isset(direction)) core.setHeroLoc('direction', direction);

            const nx = core.nextX();
            const ny = core.nextY();
            if (core.status.thisMap.enemy.mapDamage[`${nx},${ny}`]?.mockery) {
                core.autosave();
            }

            moveDir = direction;
            stepDir = direction;
            await readyMove();
            stopChian = true;

            callback?.();
        };

        events.prototype.setHeroIcon = function (name: ImageIds) {
            const img = core.material.images.images[name];
            if (!img) return;
            adapters['hero-adapter']?.all('setImage', img);
        };

        control.prototype.isMoving = function () {
            return moving;
        };

        hook.on('reset', () => {
            moveDir = core.status.hero.loc.direction;
            stepDir = moveDir;
        });

        // ----- 开关门
        events.prototype.openDoor = function (
            x: number,
            y: number,
            needKey: boolean,
            callback?: () => void
        ) {
            var block = core.getBlock(x, y);
            core.saveAndStopAutomaticRoute();
            if (!this._openDoor_check(block, x, y, needKey)) {
                var locked = core.status.lockControl;
                core.waitHeroToStop(function () {
                    if (!locked) core.unlockControl();
                    if (callback) callback();
                });
                return;
            }
            if (core.status.replay.speed === 24) {
                core.status.replay.animate = true;
                core.removeBlock(x, y);
                setTimeout(function () {
                    core.status.replay.animate = false;
                    Mota.require('var', 'hook').emit(
                        'afterOpenDoor',
                        block.event.id,
                        x,
                        y
                    );
                    if (callback) callback();
                }, 1); // +1是为了录像检测系统
            } else {
                const locked = core.status.lockControl;
                core.lockControl();
                core.status.replay.animate = true;
                core.removeBlock(x, y);

                const cb = () => {
                    core.maps._removeBlockFromMap(core.status.floorId, block);
                    if (!locked) core.unlockControl();
                    core.status.replay.animate = false;
                    hook.emit('afterOpenDoor', block.event.id, x, y);
                    callback?.();
                };

                adapters['door-animate']?.all('openDoor', block).then(cb);

                const animate = fallbackIds++;
                core.animateFrame.lastAsyncId = animate;
                core.animateFrame.asyncId[animate] = cb;
                this._openDoor_animate(block, x, y, callback);
            }
        };

        events.prototype.closeDoor = function (
            x: number,
            y: number,
            id: AllIds,
            callback?: () => void
        ) {
            id = id || '';
            if (
                // @ts-ignore
                (core.material.icons.animates[id] == null &&
                    // @ts-ignore
                    core.material.icons.npc48[id] == null) ||
                core.getBlock(x, y) != null
            ) {
                if (callback) callback();
                return;
            }
            var block = core.getBlockById(id);
            var doorInfo = (block.event || {}).doorInfo;
            if (!doorInfo) {
                if (callback) callback();
                return;
            }

            core.playSound(doorInfo.closeSound);

            const locked = core.status.lockControl;
            core.lockControl();
            core.status.replay.animate = true;
            const cb = function () {
                if (!locked) core.unlockControl();
                core.status.replay.animate = false;
                core.setBlock(id, x, y);
                core.showBlock(x, y);
                callback?.();
            };

            if (core.status.replay.speed === 24) {
                cb();
            } else {
                adapters['door-animate']?.all('closeDoor', block).then(() => {
                    cb();
                });

                const animate = fallbackIds++;
                core.animateFrame.lastAsyncId = animate;
                core.animateFrame.asyncId[animate] = cb;
                this._openDoor_animate(block, x, y, callback);
            }
        };

        // ----- animate & hero animate
        ////// 绘制动画 //////
        maps.prototype.drawAnimate = function (
            name: AnimationIds,
            x: number,
            y: number,
            alignWindow?: boolean,
            callback?: () => void
        ) {
            // @ts-ignore
            name = core.getMappedName(name);

            // 正在播放录像：不显示动画
            if (
                core.isReplaying() ||
                !core.material.animates[name] ||
                x == null ||
                y == null
            ) {
                if (callback) callback();
                return -1;
            }

            adapters.animate
                ?.all(
                    'drawAnimate',
                    name,
                    x * 32 + 16,
                    y * 32 + 16,
                    alignWindow ?? false
                )
                .then(() => {
                    callback?.();
                });
        };

        maps.prototype.drawHeroAnimate = function (
            name: AnimationIds,
            callback?: () => void
        ) {
            // @ts-ignore
            name = core.getMappedName(name);

            // 正在播放录像或动画不存在：不显示动画
            if (core.isReplaying() || !core.material.animates[name]) {
                if (callback) callback();
                return -1;
            }

            adapters.animate?.global('drawHeroAnimate', name).then(() => {
                callback?.();
            });
        };

        // 移动跳跃图块 & 跳跃勇士
        maps.prototype.moveBlock = async function (
            x: number,
            y: number,
            steps: string[],
            time: number = 500,
            keep: boolean = false,
            callback?: () => void
        ) {
            if (!steps || steps.length === 0) {
                callback?.();
                return;
            }
            const speed = core.status.replay.speed;
            if (speed === 24) time = 1;
            const block = core.getBlock(x, y);
            if (!block) {
                callback?.();
                return;
            }
            core.removeBlock(x, y);
            const list = adapters.layer?.items ?? [];
            const items = [...list].filter(v => {
                if (v.layer !== 'event') return false;
                const ex = v.getExtends('floor-binder') as LayerFloorBinder;
                if (!ex) return false;
                return ex.getFloor() === core.status.floorId;
            });

            const { steps: moveSteps, start } = getMoveSteps(steps);
            if (!start || items.length === 0) {
                callback?.();
                return;
            }
            let stepDir: Dir2 = start;
            let nx = x;
            let ny = y;

            const { Layer } = Mota.require('module', 'Render');
            const moving = Layer.getMovingRenderable(block.id, x, y);
            if (!moving) {
                callback?.();
                return;
            }
            items.forEach(v => v.moving.add(moving));

            for (const step of moveSteps) {
                if (step === 'backward') stepDir = backDir(stepDir);
                if (step.startsWith('speed')) {
                    time = parseInt(step.slice(6));
                    continue;
                }
                const { x, y } = core.utils.scan2[stepDir];
                const tx = nx + x;
                const ty = ny + y;
                await moveRenderable(items[0], moving, time / speed, tx, ty);
                nx = tx;
                ny = ty;
                moving.zIndex = ty;
            }

            items.forEach(v => v.moving.delete(moving));
            if (keep) {
                core.setBlock(block.id, nx, ny);
            }
            callback?.();
        };

        ////// 显示跳跃某块的动画，达到{"type":"jump"}的效果 //////
        maps.prototype.jumpBlock = async function (
            sx: number,
            sy: number,
            ex: number,
            ey: number,
            time: number = 500,
            keep: boolean = false,
            callback?: () => void
        ) {
            const block = core.getBlock(sx, sy);
            if (!block) {
                callback?.();
                return;
            }
            time /= core.status.replay.speed;
            if (core.status.replay.speed === 24) time = 1;
            const dx = ex - sx;
            const dy = ey - sy;

            const fn = generateJumpFn(dx, dy);

            const list = adapters.layer?.items ?? [];
            const items = [...list].filter(v => {
                if (v.layer !== 'event') return false;
                const ex = v.getExtends('floor-binder') as LayerFloorBinder;
                if (!ex) return false;
                return ex.getFloor() === core.status.floorId;
            });
            const width = core.status.thisMap.width;
            const index = sx + sy * width;

            const promise = Promise.all(
                items.map(v => {
                    return v.moveAs(index, ex, ey, fn, time);
                })
            );

            core.removeBlock(sx, sy);
            await promise;
            if (keep) {
                core.setBlock(block.id, ex, ey);
            }

            callback?.();
        };

        events.prototype.jumpHero = async function (
            ex: number,
            ey: number,
            time: number = 500,
            callback?: () => void
        ) {
            const sx = core.getHeroLoc('x');
            const sy = core.getHeroLoc('y');

            const locked = core.status.lockControl;
            core.lockControl();
            const list = adapters['hero-adapter']?.items ?? [];
            const items = [...list];

            time /= core.status.replay.speed;
            if (core.status.replay.speed === 24) time = 1;
            const fn = generateJumpFn(ex - sx, ey - sy);
            await Promise.all(
                items.map(v => {
                    if (!v.renderable) return Promise.reject();
                    return v.layer.moveRenderable(
                        v.renderable,
                        sx,
                        sy,
                        fn,
                        time
                    );
                })
            );

            if (!locked) core.unlockControl();
            core.setHeroLoc('x', ex);
            core.setHeroLoc('y', ey);
            callback?.();
        };
    });

    loading.once('loaded', () => {
        for (const animate of Object.values(core.material.animates)) {
            animate.se ??= {};
            if (typeof animate.se === 'string') {
                animate.se = { 1: animate.se };
            }
            animate.pitch ??= {};
        }
    });

    // 复写录像的移动
    core.registerReplayAction('move', action => {
        if (
            action === 'up' ||
            action === 'down' ||
            action === 'left' ||
            action === 'right'
        ) {
            stepDir = action;
            const { noPass, canMove } = checkCanMove();
            const { nx, ny } = getNextLoc();
            if (noPass || !canMove) {
                if (canMove) core.trigger(nx, ny);
            } else {
                core.setHeroLoc('x', nx);
                core.setHeroLoc('y', ny);
                core.setHeroLoc('direction', action);
            }
            if (!main.replayChecking) {
                setTimeout(core.replay, 100);
            } else {
                core.replay();
            }

            return true;
        } else {
            return false;
        }
    });

    return { readyMove, endMove, move };
}
