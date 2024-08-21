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
            // onMoveEnd(true);
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
        const noPass = core.noPass(nx, ny);
        const canMove = core.canMoveHero(nx, ny, stepDir);
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

    control.prototype._moveAction_moving = function (callback?: () => void) {
        return;
        const adapter = adapters['hero-adapter'];
        if (!adapter) {
            onMoveEnd(callback);
            return;
        } else {
            core.status.heroMoving = 1;

            adapter
                .all('readyMove')
                .then(() => {
                    return adapter.all('move', 'forward');
                })
                .then(() => {
                    onMoveEnd(callback);
                    core.status.heroMoving = 0;
                    return adapter.all('endMove');
                });
        }
    };

    const dir8to4: Record<Dir2, Dir> = {
        up: 'up',
        down: 'down',
        left: 'left',
        right: 'right',
        leftup: 'left',
        leftdown: 'left',
        rightup: 'right',
        rightdown: 'right'
    };

    events.prototype.eventMoveHero = async function (
        steps: string[],
        time?: number,
        callback?: () => void
    ) {
        return;
        time = time || core.values.moveSpeed;

        // const render = Mota.require('module', 'Render').heroRender;
        var step = 0,
            moveSteps = (steps || [])
                .map(function (t) {
                    return [t.split(':')[0], parseInt(t.split(':')[1] || '1')];
                })
                .filter(function (t) {
                    return (
                        [
                            'up',
                            'down',
                            'left',
                            'right',
                            'forward',
                            'backward',
                            'leftup',
                            'leftdown',
                            'rightup',
                            'rightdown',
                            'speed'
                            // @ts-ignore
                        ].indexOf(t[0]) >= 0 && !(t[0] == 'speed' && t[1] < 16)
                    );
                });

        if (main.replayChecking) {
            // 录像验证中，直接算出来最终位置瞬移过去即可
            const steps = moveSteps;
            let { x: nx, y: ny, direction: nowDir } = core.status.hero.loc;
            while (steps.length > 0) {
                const [dir, count] = steps.shift()! as [string, number];
                if (dir === 'speed') continue;
                let resolved: Dir2;
                if (dir === 'forward' || dir === 'backward') resolved = nowDir;
                else resolved = dir as Dir2;

                nowDir = dir8to4[resolved];

                const { x, y } = core.utils.scan2[resolved];
                nx += x * count;
                ny += y * count;
            }
            core.setHeroLoc('x', nx, true);
            core.setHeroLoc('y', ny, true);
            core.setHeroLoc('direction', nowDir, true);
            core.updateFollowers();
            core.status.heroMoving = 0;
            core.drawHero();
            callback?.();
        } else {
            const adapter = adapters['hero-adapter'];
            if (!adapter) return;
            const steps: string[] = [];
            moveSteps.forEach(([dir, count]) => {
                if (dir === 'speed') {
                    steps.push(`speed:${count}`);
                } else {
                    steps.push(...Array(count as number).fill(dir as string));
                }
            });
            await adapter.all('readyMove');
            core.status.heroMoving = 1;
            for (const dir of steps) {
                if (dir.startsWith('speed')) {
                    const speed = parseInt(dir.slice(6));
                    await adapter.all('setMoveSpeed', speed);
                } else {
                    await adapter.all('move', dir as Move2);
                }
            }
            await adapter.all('endMove');
            core.status.heroMoving = 0;
            core.drawHero();
            callback?.();
        }
        // core.status.heroMoving = -1;
        // // render.move(false);
        // var _run = function () {
        //     var cb = function () {
        //         core.status.heroMoving = 0;
        //         // render.move(false);
        //         core.drawHero();
        //         if (callback) callback();
        //     };

        //     var animate = window.setInterval(
        //         function () {
        //             if (moveSteps.length == 0) {
        //                 delete core.animateFrame.asyncId[animate];
        //                 clearInterval(animate);
        //                 cb();
        //             } else {
        //                 if (
        //                     step == 0 &&
        //                     moveSteps[0][0] == 'speed' &&
        //                     moveSteps[0][1] >= 16
        //                 ) {
        //                     time = moveSteps[0][1];
        //                     moveSteps.shift();
        //                     clearInterval(animate);
        //                     delete core.animateFrame.asyncId[animate];
        //                     _run();
        //                 } else if (
        //                     core.events._eventMoveHero_moving(++step, moveSteps)
        //                 )
        //                     step = 0;
        //             }
        //         },
        //         core.status.replay.speed == 24
        //             ? 1
        //             : time / 8 / core.status.replay.speed
        //     );

        //     core.animateFrame.lastAsyncId = animate;
        //     core.animateFrame.asyncId[animate] = cb;
        // };
        // _run();
    };

    control.prototype.turnHero = function (direction?: Dir) {
        if (direction) {
            core.setHeroLoc('direction', direction);
            core.drawHero();
            core.status.route.push('turn:' + direction);
            return;
        }
        core.setHeroLoc('direction', core.turnDirection(':right') as Dir);
        core.drawHero();
        core.status.route.push('turn');
        core.checkRouteFolding();
        if (!main.replayChecking) {
            // adapters['hero-adapter']?.sync('turn', direction);
        }
    };

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
        var lastDirection = core.status.automaticRoute.lastDirection;
        core.stopAutomaticRoute();
        core.clearContinueAutomaticRoute();
        if (!main.replayChecking) {
            moveEnding.then(() => {
                callback?.();
            });
            return;
        }
        if (callback) {
            // @ts-ignore
            core.status.replay.animate = true;
            core.lockControl();
            // @ts-ignore
            core.status.automaticRoute.moveDirectly = false;
            setTimeout(
                function () {
                    // @ts-ignore
                    core.status.replay.animate = false;
                    if (core.isset(lastDirection))
                        core.setHeroLoc('direction', lastDirection);
                    core.drawHero();
                    callback();
                },
                core.status.replay.speed == 24 ? 1 : 30
            );
        }
    };
}
