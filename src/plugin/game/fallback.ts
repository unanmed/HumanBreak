import type { RenderAdapter } from '@/core/render/adapter';
import type { LayerDoorAnimate } from '@/core/render/preset/floor';
import type { HeroRenderer } from '@/core/render/preset/hero';
import { hook } from '@/game/game';

interface Adapters {
    'hero-adapter'?: RenderAdapter<HeroRenderer>;
    'door-animate'?: RenderAdapter<LayerDoorAnimate>;
}

const adapters: Adapters = {};

export function init() {
    const hook = Mota.require('var', 'hook');
    let fallbackIds: number = 1e8;

    if (!main.replayChecking && main.mode === 'play') {
        const Adapter = Mota.require('module', 'Render').RenderAdapter;
        const hero = Adapter.get<HeroRenderer>('hero-adapter');
        const doorAnimate = Adapter.get<LayerDoorAnimate>('door-animate');

        adapters['hero-adapter'] = hero;
        adapters['door-animate'] = doorAnimate;
    }

    let moving: boolean = false;
    let stopChian: boolean = false;
    let moveDir: Dir;
    let stepDir: Dir;
    let moveEnding: Promise<any[]>;

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

        if (noPass || !canMove) {
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
        if (!noPass) {
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

    // ----- 勇士移动相关

    Mota.r(() => {
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

            // var blockInfo = core.getBlockInfo(block);
            // var speed = (doorInfo.time || 160) / 4;
            // blockInfo.posX = 3;
            // core.maps._drawBlockInfo(blockInfo, x, y);

            // var animate = window.setInterval(
            //     function () {
            //         blockInfo.posX--;
            //         if (blockInfo.posX < 0) {
            //             clearInterval(animate);
            //             delete core.animateFrame.asyncId[animate];
            //             cb();
            //             return;
            //         }
            //         core.maps._drawBlockInfo(blockInfo, x, y);
            //     },
            //     core.status.replay.speed == 24
            //         ? 1
            //         : speed / Math.max(core.status.replay.speed, 1)
            // );

            // core.animateFrame.lastAsyncId = animate;
            // core.animateFrame.asyncId[animate] = cb;
        };
    });

    return { readyMove, endMove, move };
}
