import type { RenderAdapter } from '@/core/render/adapter';
import type { HeroRenderer } from '@/core/render/preset/hero';
import { backDir } from './utils';

interface Adapters {
    'hero-adapter'?: RenderAdapter<HeroRenderer>;
}

const adapters: Adapters = {};

export function init() {
    if (!main.replayChecking) {
        const Adapter = Mota.require('module', 'Render').RenderAdapter;
        const hero = Adapter.get<HeroRenderer>('hero-adapter');

        adapters['hero-adapter'] = hero;
    }

    function onMoveEnd(callback?: () => void) {
        core.setHeroLoc('x', core.nextX(), true);
        core.setHeroLoc('y', core.nextY(), true);

        var direction = core.getHeroLoc('direction');
        core.control._moveAction_popAutomaticRoute();
        core.status.route.push(direction);

        core.moveOneStep();
        core.checkRouteFolding();
        callback?.();
    }

    // ----- 勇士移动相关

    control.prototype._moveAction_moving = function (callback?: () => void) {
        const adapter = adapters['hero-adapter'];
        if (!adapter) {
            onMoveEnd(callback);
            return;
        } else {
            adapter
                .all('readyMove')
                .then(() => {
                    return adapter.all('move', 'forward');
                })
                .then(() => {
                    onMoveEnd(callback);
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
            adapters['hero-adapter']?.all('turn', direction);
        }
    };
}
