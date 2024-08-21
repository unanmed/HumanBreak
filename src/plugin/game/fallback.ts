import type { RenderAdapter } from '@/core/render/adapter';
import type { HeroRenderer } from '@/core/render/preset/hero';

interface Adapters {
    'hero-adapter'?: RenderAdapter<HeroRenderer>;
}

const adapters: Adapters = {};

export function init() {
    if (!main.replayChecking && main.mode === 'play') {
        const Adapter = Mota.require('module', 'Render').RenderAdapter;
        const hero = Adapter.get<HeroRenderer>('hero-adapter');

        adapters['hero-adapter'] = hero;
    }

    let moving: boolean = false;
    let stopChian: boolean = false;
    let moveDir: Dir;
    let stepDir: Dir;
    let moveEnding: Promise<any[]>;

    const pressedArrow: Set<Dir> = new Set();
    Mota.r(() => {
        const gameKey = Mota.require('var', 'gameKey');
        gameKey
            .realize('moveUp', onMoveKeyDown('up'), { type: 'down' })
            .realize('moveUp', onMoveKeyUp('up'))
            .realize('moveDown', onMoveKeyDown('down'), { type: 'down' })
            .realize('moveDown', onMoveKeyUp('down'))
            .realize('moveLeft', onMoveKeyDown('left'), { type: 'down' })
            .realize('moveLeft', onMoveKeyUp('left'))
            .realize('moveRight', onMoveKeyDown('right'), { type: 'down' })
            .realize('moveRight', onMoveKeyUp('right'));
    });

    function onMoveKeyDown(type: Dir) {
        return () => {
            pressedArrow.add(type);
            moveDir = type;
            if (!moving) {
                stepDir = moveDir;
                readyMove();
            }
            if (moving && stopChian) {
                stopChian = false;
            }
        };
    }

    function onMoveKeyUp(type: Dir) {
        return () => {
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
        };
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
            return startHeroMoveChain();
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
            if (core.status.lockControl) {
                pressedArrow.clear();
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
    });

    return { readyMove, endMove, move };
}
