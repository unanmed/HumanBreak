import type { RenderAdapter } from '@motajs/render';
import type { TimingFn } from 'mutate-animate';
import { BlockMover, heroMoveCollection, MoveStep } from '@user/data-state';
import { hook, loading } from '@user/data-base';
import { Patch, PatchClass } from '@motajs/legacy-common';
import type {
    HeroRenderer,
    LayerDoorAnimate,
    LayerGroupAnimate,
    Layer,
    FloorViewport,
    LayerFloorBinder,
    LayerGroup
} from '@user/client-modules';

// 向后兼容用，会充当两个版本间过渡的作用

interface Adapters {
    'hero-adapter'?: RenderAdapter<HeroRenderer>;
    'door-animate'?: RenderAdapter<LayerDoorAnimate>;
    animate?: RenderAdapter<LayerGroupAnimate>;
    layer?: RenderAdapter<Layer>;
    viewport?: RenderAdapter<FloorViewport>;
}

const adapters: Adapters = {};

export function initFallback() {
    let fallbackIds: number = 1e8;

    if (!main.replayChecking && main.mode === 'play') {
        const Adapter = Mota.require('@motajs/render').RenderAdapter;
        const hero = Adapter.get<HeroRenderer>('hero-adapter');
        const doorAnimate = Adapter.get<LayerDoorAnimate>('door-animate');
        const animate = Adapter.get<LayerGroupAnimate>('animate');
        const layer = Adapter.get<Layer>('layer');
        const viewport = Adapter.get<FloorViewport>('viewport');

        adapters['hero-adapter'] = hero;
        adapters['door-animate'] = doorAnimate;
        adapters['animate'] = animate;
        adapters['layer'] = layer;
        adapters['viewport'] = viewport;
    }

    const { mover: heroMover } = heroMoveCollection;

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
                    moveSteps.push(...Array(Number(number)).fill(type));
                }
            }
        });

        return moveSteps;
    }

    function setHeroDirection(dir: Dir) {
        heroMover.setFaceDir(dir);
        heroMover.setMoveDir(dir);
    }

    /**
     * 生成跳跃函数
     */
    function generateJumpFn(dx: number, dy: number): TimingFn<3> {
        const distance = Math.hypot(dx, dy);
        const peak = 3 + distance;

        return (progress: number) => {
            const x = dx * progress;
            const y = progress * dy + (progress ** 2 - progress) * peak;

            return [x, y, Math.ceil(y)];
        };
    }

    Mota.r(() => {
        // ----- 引入
        const { MotaRenderer: Renderer } = Mota.require('@motajs/render');
        const { Camera } = Mota.require('@user/client-modules');
        const Animation = Mota.require('MutateAnimate');

        const patch = new Patch(PatchClass.Control);
        const patch2 = new Patch(PatchClass.Events);
        const patch3 = new Patch(PatchClass.Maps);

        //#region 勇士移动相关
        patch.add('moveAction', async function (callback?: () => void) {
            heroMover.clearMoveQueue();
            heroMover.oneStep('forward');
            const lock = core.status.lockControl;
            const controller = heroMover.startMove(false, true, lock);
            controller?.onEnd.then(() => {
                callback?.();
            });
            heroMover.once('stepEnd', () => {
                controller?.stop();
            });
        });

        patch.add('_moveAction_moving', () => {});

        patch2.add(
            '_action_moveAction',
            function (data: any, x: number, y: number, prefix: any) {
                if (core.canMoveHero()) {
                    const nx = core.nextX(),
                        ny = core.nextY();
                    // 检查noPass决定是撞击还是移动
                    if (core.noPass(nx, ny)) {
                        core.insertAction([{ type: 'trigger', loc: [nx, ny] }]);
                    } else {
                        // 先移动一格，然后尝试触发事件
                        core.insertAction([
                            {
                                type: 'function',
                                function:
                                    'function() { core.moveAction(core.doAction); }',
                                async: true
                            },
                            { type: '_label' }
                        ]);
                    }
                }
                core.doAction();
            }
        );

        patch2.add(
            'eventMoveHero',
            async function (
                steps: string[],
                time: number = 500,
                callback?: () => void
            ) {
                if (heroMover.moving) return;
                const moveSteps = getMoveSteps(steps);

                const resolved = moveSteps.map<MoveStep>(v => {
                    if (v.startsWith('speed')) {
                        return { type: 'speed', value: Number(v.slice(6)) };
                    } else {
                        return { type: 'dir', value: v as Move2 };
                    }
                });
                const start: MoveStep = { type: 'speed', value: time };

                heroMover.insertMove(...[start, ...resolved]);
                const controller = heroMover.startMove(true, true, true, false);
                if (!controller) {
                    callback?.();
                    return;
                }
                controller.onEnd.then(() => {
                    callback?.();
                });

                const animate = fallbackIds++;

                core.animateFrame.lastAsyncId = animate;
                core.animateFrame.asyncId[animate] = controller.stop;
            }
        );

        patch.add(
            'setHeroLoc',
            function (
                name: 'x' | 'y' | 'direction',
                value: number | Dir,
                noGather?: boolean
            ) {
                if (!core.status.hero) return;
                // @ts-ignore
                core.status.hero.loc[name] = value;
                if ((name === 'x' || name === 'y') && !noGather) {
                    core.control.gatherFollowers();
                }
                if (name === 'direction') {
                    adapters['hero-adapter']?.sync('turn', value);
                    adapters['hero-adapter']?.sync('setAnimateDir', value);
                    setHeroDirection(value as Dir);
                } else if (name === 'x') {
                    // 为了防止逆天样板出问题
                    core.bigmap.posX = value as number;
                    adapters['hero-adapter']?.sync('setHeroLoc', value);
                } else {
                    // 为了防止逆天样板出问题
                    core.bigmap.posY = value as number;
                    adapters['hero-adapter']?.sync('setHeroLoc', void 0, value);
                }
            }
        );

        patch.add('waitHeroToStop', function (callback?: () => void) {
            core.stopAutomaticRoute();
            core.clearContinueAutomaticRoute();
            heroMover.controller?.stop();
            if (callback) {
                core.status.replay.animate = true;
                core.lockControl();
                core.status.automaticRoute.moveDirectly = false;
                setTimeout(
                    function () {
                        core.status.replay.animate = false;
                        callback();
                    },
                    core.status.replay.speed === 24 ? 1 : 30
                );
            }
        });

        patch.add(
            'moveHero',
            async function (
                direction?: Dir,
                callback?: () => void,
                noRoute: boolean = false
            ) {
                if (heroMover.moving) return;
                heroMover.clearMoveQueue();
                heroMover.oneStep(direction ?? 'forward');
                const lock = core.status.lockControl;
                const controller = heroMover.startMove(false, noRoute, lock);
                controller?.onEnd.then(() => {
                    callback?.();
                });
                heroMover.once('stepEnd', () => {
                    controller?.stop();
                });
            }
        );

        patch2.add('setHeroIcon', function (name: ImageIds) {
            const img = core.material.images.images[name];
            if (!img) return;
            core.status.hero.image = name;
            adapters['hero-adapter']?.sync('setImage', img);
        });

        patch.add('isMoving', function () {
            return heroMover.moving;
        });

        patch.add(
            'setAutomaticRoute',
            function (destX: number, destY: number, stepPostfix: DiredLoc[]) {
                if (heroMover.moving) return;
                if (!core.status.played || core.status.lockControl) return;
                if (core.control._setAutomaticRoute_isMoving(destX, destY))
                    return;
                if (
                    core.control._setAutomaticRoute_isTurning(
                        destX,
                        destY,
                        stepPostfix
                    )
                )
                    return;
                if (
                    core.control._setAutomaticRoute_clickMoveDirectly(
                        destX,
                        destY,
                        stepPostfix
                    )
                )
                    return;
                // 找寻自动寻路路线
                const moveStep = core.automaticRoute(destX, destY);
                if (
                    moveStep.length == 0 &&
                    (destX != core.status.hero.loc.x ||
                        destY != core.status.hero.loc.y ||
                        stepPostfix.length == 0)
                )
                    return;
                moveStep.push(...stepPostfix);
                core.status.automaticRoute.destX = destX;
                core.status.automaticRoute.destY = destY;
                core.control._setAutomaticRoute_drawRoute(moveStep);
                core.control._setAutomaticRoute_setAutoSteps(moveStep);

                // ???
                core.setAutoHeroMove();

                // 执行移动
                const steps: MoveStep[] = moveStep.map(v => {
                    return { type: 'dir', value: v.direction };
                });
                heroMover.clearMoveQueue();
                heroMover.insertMove(...steps);
                heroMover.startMove();
            }
        );

        //#region 开关门

        patch2.add(
            'openDoor',
            function (
                x: number,
                y: number,
                needKey: boolean,
                callback?: () => void
            ) {
                const block = core.getBlock(x, y);
                core.saveAndStopAutomaticRoute();
                if (!core.events._openDoor_check(block, x, y, needKey)) {
                    const locked = core.status.lockControl;
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
                        hook.emit(
                            'afterOpenDoor',
                            block.event.id as AllIdsOf<'animates'>,
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
                        core.maps._removeBlockFromMap(
                            core.status.floorId,
                            block
                        );
                        if (!locked) core.unlockControl();
                        core.status.replay.animate = false;
                        hook.emit(
                            'afterOpenDoor',
                            block.event.id as AllIdsOf<'animates'>,
                            x,
                            y
                        );
                        callback?.();
                        delete core.animateFrame.asyncId[animate];
                    };

                    adapters['door-animate']?.all('openDoor', block).then(cb);

                    const animate = fallbackIds++;
                    core.animateFrame.lastAsyncId = animate;
                    core.animateFrame.asyncId[animate] = cb;
                    // this._openDoor_animate(block, x, y, callback);
                }
            }
        );

        patch2.add(
            'closeDoor',
            function (x: number, y: number, id: AllIds, callback?: () => void) {
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
                const block = core.getBlockById(id);
                const doorInfo = (block.event || {}).doorInfo;
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
                    adapters['door-animate']
                        ?.all('closeDoor', block)
                        .then(() => {
                            cb();
                        });

                    const animate = fallbackIds++;
                    core.animateFrame.lastAsyncId = animate;
                    core.animateFrame.asyncId[animate] = cb;
                    core.events._openDoor_animate(block, x, y, callback);
                }
            }
        );

        //#region 动画

        patch3.add(
            'drawAnimate',
            function (
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
            }
        );

        patch3.add(
            'drawHeroAnimate',
            function (name: AnimationIds, callback?: () => void) {
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
            }
        );

        patch3.add(
            'moveBlock',
            async function (
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
                const block = core.getBlock(x, y);
                if (!block) {
                    callback?.();
                    return;
                }
                const mover = new BlockMover(
                    x,
                    y,
                    core.status.floorId,
                    'event'
                );
                const moveSteps = getMoveSteps(steps);
                const resolved = moveSteps.map<MoveStep>(v => {
                    if (v.startsWith('speed')) {
                        return { type: 'speed', value: Number(v.slice(6)) };
                    } else {
                        return { type: 'dir', value: v as Move2 };
                    }
                });
                const start: MoveStep = { type: 'speed', value: time };
                mover.insertMove(...[start, ...resolved]);
                const controller = mover.startMove();

                const id = fallbackIds++;
                core.animateFrame.asyncId[id] = () => {
                    if (!keep) {
                        core.removeBlock(mover.x, mover.y);
                    }
                };

                if (controller) {
                    await controller.onEnd;
                }

                delete core.animateFrame.asyncId[id];

                if (!keep) {
                    core.removeBlock(mover.x, mover.y);
                }
                callback?.();
            }
        );

        patch3.add(
            'jumpBlock',
            async function (
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
                        return v.moveAs(index, ex, ey, fn, time, keep);
                    })
                );

                core.updateStatusBar();
                core.removeBlock(sx, sy);

                const id = fallbackIds++;
                core.animateFrame.asyncId[id] = () => {
                    if (keep) {
                        core.setBlock(block.id, ex, ey);
                    }
                };

                await promise;

                delete core.animateFrame.asyncId[id];

                if (keep) {
                    core.setBlock(block.id, ex, ey);
                }
                core.updateStatusBar();

                callback?.();
            }
        );

        patch2.add(
            'jumpHero',
            async function (
                ex: number,
                ey: number,
                time: number = 500,
                callback?: () => void
            ) {
                if (heroMover.moving) return;

                const sx = core.getHeroLoc('x');
                const sy = core.getHeroLoc('y');
                adapters.viewport?.all('mutateTo', ex, ey, time);

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
            }
        );

        //#region 视角处理

        patch.add(
            'moveDirectly',
            function (destX: number, destY: number, ignoreSteps: number) {
                const data = core.control.controldata;
                const success = data.moveDirectly(destX, destY, ignoreSteps);
                if (success) adapters.viewport?.all('mutateTo', destX, destY);
                return success;
            }
        );

        patch.add(
            'moveViewport',
            function (
                x: number,
                y: number,
                _moveMode: EaseMode,
                time: number = 1,
                callback?: () => void
            ) {
                const main = Renderer.get('render-main');
                const layer = main?.getElementById('layer-main') as LayerGroup;
                if (!layer) return;
                const camera = Camera.for(layer);
                camera.clearOperation();
                const translate = camera.addTranslate();

                const animateTime =
                    time / Math.max(core.status.replay.speed, 1);
                const animate = new Animation.Animation();
                animate
                    .absolute()
                    .time(1)
                    .mode(Animation.linear())
                    .move(core.bigmap.offsetX, core.bigmap.offsetY);
                animate.time(animateTime).move(x * 32, y * 32);

                camera.applyTranslateAnimation(
                    translate,
                    animate,
                    animateTime + 50
                );
                camera.transform = layer.camera;

                const end = () => {
                    core.bigmap.offsetX = x * 32;
                    core.bigmap.offsetY = y * 32;
                    camera.destroy();
                    callback?.();
                };

                const timeout = window.setTimeout(end, animateTime + 50);

                const id = fallbackIds++;
                core.animateFrame.lastAsyncId = id;
                core.animateFrame.asyncId[id] = () => {
                    end();
                    clearTimeout(timeout);
                };
            }
        );
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
    loading.once('coreInit', () => {
        const moveAction = new Set<string>(['up', 'down', 'left', 'right']);
        // 复写录像的移动
        core.registerReplayAction('move', action => {
            if (moveAction.has(action)) {
                if (!heroMover.moving) {
                    heroMover.startMove();
                }
                if (!heroMover.controller) {
                    return false;
                }
                heroMover.controller.push({
                    type: 'dir',
                    value: action as Dir
                });

                heroMover.controller.onEnd.then(() => {
                    core.replay();
                });

                return true;
            } else {
                return false;
            }
        });
    });
}
