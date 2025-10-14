///<reference path="../../src/types/declaration/core.d.ts" />

/*
control.js：游戏主要逻辑控制
主要负责status相关内容，以及各种变量获取/存储
寻路算法和人物行走也在此文件内
 */

'use strict';

function control() {
    this._init();
}

control.prototype._init = function () {
    this.controldata = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a.control;
    this.renderFrameFuncs = [];
    this.replayActions = [];
    this.weathers = {};
    this.resizes = [];
    this.noAutoEvents = true;
    this.updateNextFrame = false;
    // --- 注册系统的animationFrame
    this.registerAnimationFrame(
        'totalTime',
        false,
        this._animationFrame_totalTime
    );
    this.registerAnimationFrame(
        'globalAnimate',
        true,
        this._animationFrame_globalAnimate
    );
    this.registerAnimationFrame('tip', true, this._animateFrame_tip);
    // --- 注册系统的replay
    this.registerReplayAction('move', this._replayAction_move);
    this.registerReplayAction('item', this._replayAction_item);
    this.registerReplayAction('equip', this._replayAction_equip);
    this.registerReplayAction('unEquip', this._replayAction_unEquip);
    this.registerReplayAction('saveEquip', this._replayAction_saveEquip);
    this.registerReplayAction('loadEquip', this._replayAction_loadEquip);
    this.registerReplayAction('fly', this._replayAction_fly);
    this.registerReplayAction('turn', this._replayAction_turn);
    this.registerReplayAction('getNext', this._replayAction_getNext);
    this.registerReplayAction('moveDirectly', this._replayAction_moveDirectly);
    this.registerReplayAction('key', this._replayAction_key);
    this.registerReplayAction('ignoreInput', this._replayAction_ignoreInput);
    this.registerReplayAction('no', this._replayAction_no);
    // --- 注册系统的resize
    this.registerResize('canvas', this._resize_canvas);
};

// ------ requestAnimationFrame 相关 ------ //

////// 注册一个 animationFrame //////
// name：名称，可用来作为注销使用；needPlaying：是否只在游戏运行时才执行（在标题界面不执行）
// func：要执行的函数，或插件中的函数名；可接受timestamp（从页面加载完毕到当前所经过的时间）作为参数
control.prototype.registerAnimationFrame = function (name, needPlaying, func) {
    this.unregisterAnimationFrame(name);
    this.renderFrameFuncs.push({
        name: name,
        needPlaying: needPlaying,
        func: func
    });
};

////// 注销一个 animationFrame //////
control.prototype.unregisterAnimationFrame = function (name) {
    this.renderFrameFuncs = this.renderFrameFuncs.filter(function (x) {
        return x.name != name;
    });
};

////// 设置requestAnimationFrame //////
control.prototype._setRequestAnimationFrame = function () {
    this._checkRequestAnimationFrame();
    core.animateFrame.totalTime = Math.max(
        core.animateFrame.totalTime,
        core.getLocalStorage('totalTime', 0)
    );
    var loop = function (timestamp) {
        core.control.renderFrameFuncs.forEach(function (b) {
            if (b.func) {
                try {
                    if (core.isPlaying() || !b.needPlaying)
                        b.func.call(core.control, timestamp);
                } catch (e) {
                    console.error(e);
                    console.error(
                        'ERROR in requestAnimationFrame[' +
                            b.name +
                            ']：已自动注销该项。'
                    );
                    core.unregisterAnimationFrame(b.name);
                }
            }
        });
        window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
};

control.prototype._checkRequestAnimationFrame = function () {
    (function () {
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for (
            var x = 0;
            x < vendors.length && !window.requestAnimationFrame;
            ++x
        ) {
            window.requestAnimationFrame =
                window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame =
                window[vendors[x] + 'CancelAnimationFrame'] || // Webkit中此取消方法的名字变了
                window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
                var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    })();
};

control.prototype._animationFrame_totalTime = function (timestamp) {
    core.animateFrame.totalTime += timestamp - core.animateFrame.totalTimeStart;
    core.animateFrame.totalTimeStart = timestamp;
    if (core.isPlaying()) {
        core.status.hero.statistics.totalTime = core.animateFrame.totalTime;
        core.status.hero.statistics.currTime +=
            timestamp - (core.status.hero.statistics.start || timestamp);
        core.status.hero.statistics.start = timestamp;
    }
};

control.prototype._animationFrame_autoSave = function (timestamp) {};

control.prototype._animationFrame_globalAnimate = function (timestamp) {
    if (timestamp - core.animateFrame.globalTime <= core.values.animateSpeed)
        return;
    core.status.globalAnimateStatus++;
    if (core.status.floorId) {
        // Global Animate
        core.status.globalAnimateObjs.forEach(function (block) {
            core.drawBlock(block, core.status.globalAnimateStatus);
        });

        // Global floor images
        core.maps._drawFloorImages(
            core.status.floorId,
            core.canvas.bg,
            'bg',
            core.status.floorAnimateObjs || [],
            core.status.globalAnimateStatus
        );
        core.maps._drawFloorImages(
            core.status.floorId,
            core.canvas.fg,
            'fg',
            core.status.floorAnimateObjs || [],
            core.status.globalAnimateStatus
        );

        // Global Autotile Animate
        core.status.autotileAnimateObjs.forEach(function (block) {
            core.maps._drawAutotileAnimate(
                block,
                core.status.globalAnimateStatus
            );
        });

        // Global hero animate
        if (
            (core.status.hero || {}).animate &&
            core.status.heroMoving == 0 &&
            main.mode == 'play'
        ) {
            core.drawHero('stop', null, core.status.globalAnimateStatus);
        }
    }
    // Box animate
    core.drawBoxAnimate();
    core.animateFrame.globalTime = timestamp;
};

control.prototype._animationFrame_animate = function (timestamp) {};

control.prototype._animationFrame_heroMoving = function (timestamp) {};

control.prototype._animationFrame_weather = function (timestamp) {};

control.prototype._animationFrame_weather_rain = function (timestamp, level) {};

control.prototype._animationFrame_weather_snow = function (timestamp, level) {};

control.prototype.__animateFrame_weather_image = function (timestamp, level) {};

control.prototype._animationFrame_weather_sun = function (timestamp, level) {};

control.prototype._animateFrame_tip = function (timestamp) {
    if (core.animateFrame.tip == null) return;
    var tip = core.animateFrame.tip;
    if (timestamp - tip.time <= 30) return;
    var delta = timestamp - tip.time;
    tip.time = timestamp;

    core.setFont('data', '16px Arial');
    core.setTextAlign('data', 'left');
    core.clearMap('data', 0, 0, core._PX_, 50);
    core.ui._drawTip_drawOne(tip);
    if (tip.stage == 1) {
        tip.opacity += 0.05;
        if (tip.opacity >= 0.6) {
            tip.stage = 2;
            tip.displayTime = 0;
        }
    } else if (tip.stage == 2) {
        tip.displayTime += delta;
        if (tip.displayTime >= 1000) tip.stage = 3;
    } else tip.opacity -= 0.05;

    if (tip.opacity <= 0) {
        core.animateFrame.tip = null;
    }
};

// ------ 标题界面的处理 ------ //

////// 显示游戏开始界面 //////
control.prototype.showStartAnimate = function (noAnimate, callback) {
    this._showStartAnimate_resetDom();
    if (core.flags.startUsingCanvas || noAnimate)
        return this._showStartAnimate_finished(
            core.flags.startUsingCanvas,
            callback
        );
};

control.prototype._showStartAnimate_resetDom = function () {
    core.status.played = false;
    core.clearStatus();
    core.clearMap('all');
    // 重置音量
    core.events.setVolume(1, 0);
    core.updateStatusBar();
};

control.prototype._showStartAnimate_finished = function (start, callback) {
    main.selectedButton = null;
    if (start) core.startGame();
    if (callback) callback();
};

////// 隐藏游戏开始界面 //////
control.prototype.hideStartAnimate = function (callback) {
    callback?.();
};

////// 游戏是否已经开始 //////
control.prototype.isPlaying = function () {
    return core.status.played;
};

////// 清除游戏状态和数据 //////
control.prototype.clearStatus = function () {
    // 停止各个Timeout和Interval
    for (var i in core.timeout) {
        clearTimeout(core.timeout[i]);
        core.timeout[i] = null;
    }
    for (var i in core.interval) {
        clearInterval(core.interval[i]);
        core.interval[i] = null;
    }
    core.status = {};
    core.clearStatusBar();
    core.deleteAllCanvas();
    core.status.played = false;
};

control.prototype._initStatistics = function (totalTime) {
    if (!core.isset(core.status.hero.statistics))
        core.status.hero.statistics = {
            totalTime: totalTime,
            currTime: 0,
            hp: 0,
            battle: 0,
            money: 0,
            exp: 0,
            battleDamage: 0,
            poisonDamage: 0,
            extraDamage: 0,
            moveDirectly: 0,
            ignoreSteps: 0
        };
};

// ------ 自动寻路，人物行走 ------ //

////// 清除自动寻路路线 //////
control.prototype.clearAutomaticRouteNode = function (x, y) {
    // core.clearMap(
    //     'route',
    //     x * 32 + 5 - core.status.automaticRoute.offsetX,
    //     y * 32 + 5 - core.status.automaticRoute.offsetY,
    //     27,
    //     27
    // );
};

////// 停止自动寻路操作 //////
control.prototype.stopAutomaticRoute = function () {
    if (!core.status.played) return;
    core.status.automaticRoute.autoHeroMove = false;
    core.status.automaticRoute.autoStep = 0;
    core.status.automaticRoute.destStep = 0;
    core.status.automaticRoute.movedStep = 0;
    core.status.automaticRoute.autoStepRoutes = [];
    core.status.automaticRoute.destX = null;
    core.status.automaticRoute.destY = null;
    core.status.automaticRoute.lastDirection = null;
    core.status.heroStop = true;
    // if (core.status.automaticRoute.moveStepBeforeStop.length == 0)
    //     core.deleteCanvas('route');
};

////// 保存剩下的寻路，并停止 //////
control.prototype.saveAndStopAutomaticRoute = function () {
    var automaticRoute = core.status.automaticRoute;
    if (automaticRoute.moveStepBeforeStop.length == 0) {
        automaticRoute.moveStepBeforeStop = automaticRoute.autoStepRoutes.slice(
            automaticRoute.autoStep - 1
        );
        if (automaticRoute.moveStepBeforeStop.length >= 1)
            automaticRoute.moveStepBeforeStop[0].step -=
                automaticRoute.movedStep;
    }
    this.stopAutomaticRoute();
};

////// 继续剩下的自动寻路操作 //////
control.prototype.continueAutomaticRoute = function () {
    // 此函数只应由events.afterOpenDoor和events.afterBattle调用
    var moveStep = core.status.automaticRoute.moveStepBeforeStop;
    //core.status.automaticRoute.moveStepBeforeStop = [];
    if (
        moveStep.length === 0 ||
        (moveStep.length === 1 && moveStep[0].step === 1)
    ) {
        core.status.automaticRoute.moveStepBeforeStop = [];
    } else {
        core.setAutoHeroMove(moveStep);
    }
};

////// 清空剩下的自动寻路列表 //////
control.prototype.clearContinueAutomaticRoute = function (callback) {
    // core.deleteCanvas('route');
    core.status.automaticRoute.moveStepBeforeStop = [];
    if (callback) callback();
};

////// 设置自动寻路路线 //////
control.prototype.setAutomaticRoute = function (destX, destY, stepPostfix) {
    if (!core.status.played || core.status.lockControl) return;
    if (this._setAutomaticRoute_isMoving(destX, destY)) return;
    if (this._setAutomaticRoute_isTurning(destX, destY, stepPostfix)) return;
    if (this._setAutomaticRoute_clickMoveDirectly(destX, destY, stepPostfix))
        return;
    // 找寻自动寻路路线
    var moveStep = core.automaticRoute(destX, destY);
    if (
        moveStep.length == 0 &&
        (destX != core.status.hero.loc.x ||
            destY != core.status.hero.loc.y ||
            stepPostfix.length == 0)
    )
        return;
    moveStep = moveStep.concat(stepPostfix);
    core.status.automaticRoute.destX = destX;
    core.status.automaticRoute.destY = destY;
    this._setAutomaticRoute_drawRoute(moveStep);
    this._setAutomaticRoute_setAutoSteps(moveStep);
    // 立刻移动
    core.setAutoHeroMove();
};

control.prototype._setAutomaticRoute_isMoving = function (destX, destY) {
    if (core.status.automaticRoute.autoHeroMove) {
        var lastX = core.status.automaticRoute.destX,
            lastY = core.status.automaticRoute.destY;
        core.stopAutomaticRoute();
        // 双击瞬移
        if (lastX == destX && lastY == destY) {
            core.status.automaticRoute.moveDirectly = true;
            setTimeout(function () {
                if (
                    core.status.automaticRoute.moveDirectly &&
                    core.status.heroMoving == 0
                ) {
                    core.control.tryMoveDirectly(destX, destY);
                }
                core.status.automaticRoute.moveDirectly = false;
            }, core.values.moveSpeed);
        }
        return true;
    }
    return false;
};

control.prototype._setAutomaticRoute_isTurning = function (
    destX,
    destY,
    stepPostfix
) {
    if (
        destX == core.status.hero.loc.x &&
        destY == core.status.hero.loc.y &&
        stepPostfix.length == 0
    ) {
        if (core.timeout.turnHeroTimeout == null) {
            var routeLength = core.status.route.length;
            core.timeout.turnHeroTimeout = setTimeout(function () {
                if (core.status.route.length == routeLength) core.turnHero();
                clearTimeout(core.timeout.turnHeroTimeout);
                core.timeout.turnHeroTimeout = null;
            }, 250);
        } else {
            clearTimeout(core.timeout.turnHeroTimeout);
            core.timeout.turnHeroTimeout = null;
            core.getNextItem();
        }
        return true;
    }
    if (core.timeout.turnHeroTimeout != null) return true;
    return false;
};

control.prototype._setAutomaticRoute_clickMoveDirectly = function (
    destX,
    destY,
    stepPostfix
) {
    // 单击瞬间移动
    if (core.status.heroStop && core.status.heroMoving == 0) {
        if (
            stepPostfix.length <= 1 &&
            !core.hasFlag('__noClickMove__') &&
            core.control.tryMoveDirectly(destX, destY)
        )
            return true;
    }
    return false;
};

control.prototype._setAutomaticRoute_drawRoute = function (moveStep) {
    // Deprecated.
};

control.prototype._setAutomaticRoute_setAutoSteps = function (moveStep) {
    // 路线转autoStepRoutes
    var step = 0,
        currStep = null;
    moveStep.forEach(function (t) {
        var dir = t.direction;
        if (currStep == null || currStep == dir) step++;
        else {
            core.status.automaticRoute.autoStepRoutes.push({
                direction: currStep,
                step: step
            });
            step = 1;
        }
        currStep = dir;
    });
    core.status.automaticRoute.autoStepRoutes.push({
        direction: currStep,
        step: step
    });
};

////// 设置勇士的自动行走路线 //////
control.prototype.setAutoHeroMove = function (steps) {
    steps = steps || core.status.automaticRoute.autoStepRoutes;
    if (steps.length == 0) return;
    core.status.automaticRoute.autoStepRoutes = steps;
    core.status.automaticRoute.autoHeroMove = true;
    core.status.automaticRoute.autoStep = 1;
    core.status.automaticRoute.destStep = steps[0].step;
    // core.moveHero(steps[0].direction);
};

////// 设置行走的效果动画 //////
control.prototype.setHeroMoveInterval = function (callback) {
    if (core.status.heroMoving > 0) return;
    if (core.status.replay.speed == 24) {
        if (callback) callback();
        return;
    }

    core.status.heroMoving = 1;

    var toAdd = 1;
    if (core.status.replay.speed > 3) toAdd = 2;
    if (core.status.replay.speed > 6) toAdd = 4;
    if (core.status.replay.speed > 12) toAdd = 8;

    // Mota.r(() => {
    //     const render = Mota.require('module', 'Render').heroRender;
    //     render.move(true);
    // });

    core.interval.heroMoveInterval = window.setInterval(
        function () {
            // render.offset += toAdd * 4;
            core.status.heroMoving += toAdd;
            if (core.status.heroMoving >= 8) {
                clearInterval(core.interval.heroMoveInterval);
                core.status.heroMoving = 0;
                // render.offset = 0;
                // render.move(false);
                if (callback) callback();
            }
        },
        ((core.values.moveSpeed / 8) * toAdd) / core.status.replay.speed
    );
};

////// 每移动一格后执行的事件 //////
control.prototype.moveOneStep = function (callback) {
    return this.controldata.moveOneStep(callback);
};

////// 实际每一步的行走过程 //////
control.prototype.moveAction = function (callback) {
    if (core.status.heroMoving > 0) return;
    var noPass = core.noPass(core.nextX(), core.nextY()),
        canMove = core.canMoveHero();
    // 下一个点如果不能走
    if (noPass || !canMove) return this._moveAction_noPass(canMove, callback);
    this._moveAction_moving(callback);
};

control.prototype._moveAction_noPass = function (canMove, callback) {
    core.status.route.push(core.getHeroLoc('direction'));
    core.status.automaticRoute.moveStepBeforeStop = [];
    core.status.automaticRoute.lastDirection = core.getHeroLoc('direction');
    if (canMove) core.trigger(core.nextX(), core.nextY());
    core.drawHero();

    if (core.status.automaticRoute.moveStepBeforeStop.length == 0) {
        core.clearContinueAutomaticRoute();
        core.stopAutomaticRoute();
    }
    if (callback) callback();
};

control.prototype._moveAction_moving = function (callback) {
    core.setHeroMoveInterval(function () {
        core.setHeroLoc('x', core.nextX(), true);
        core.setHeroLoc('y', core.nextY(), true);

        var direction = core.getHeroLoc('direction');
        core.control._moveAction_popAutomaticRoute();
        core.status.route.push(direction);

        core.moveOneStep();
        core.checkRouteFolding();
        if (callback) callback();
    });
};

control.prototype._moveAction_popAutomaticRoute = function () {
    var automaticRoute = core.status.automaticRoute;
    // 检查自动寻路是否被弹出
    if (automaticRoute.autoHeroMove) {
        automaticRoute.movedStep++;
        automaticRoute.lastDirection = core.getHeroLoc('direction');
        if (automaticRoute.destStep == automaticRoute.movedStep) {
            if (
                automaticRoute.autoStep == automaticRoute.autoStepRoutes.length
            ) {
                core.clearContinueAutomaticRoute();
                core.stopAutomaticRoute();
            } else {
                automaticRoute.movedStep = 0;
                automaticRoute.destStep =
                    automaticRoute.autoStepRoutes[automaticRoute.autoStep].step;
                core.setHeroLoc(
                    'direction',
                    automaticRoute.autoStepRoutes[automaticRoute.autoStep]
                        .direction
                );
                core.status.automaticRoute.autoStep++;
            }
        }
    }
};

////// 让勇士开始移动 //////
control.prototype.moveHero = function (direction, callback) {
    // see src/plugin/game/popup.js
};

control.prototype._moveHero_moving = function () {
    // ------ 我已经看不懂这个函数了，反正好用就行23333333
    core.status.heroStop = false;
    core.status.automaticRoute.moveDirectly = false;

    var move = function () {
        if (!core.status.heroStop) {
            if (core.hasFlag('debug') && core.status.ctrlDown) {
                if (core.status.heroMoving != 0) return;
                // 检测是否穿出去
                var nx = core.nextX(),
                    ny = core.nextY();
                if (
                    nx < 0 ||
                    nx >= core.bigmap.width ||
                    ny < 0 ||
                    ny >= core.bigmap.height
                )
                    return;
                core.eventMoveHero(
                    [core.getHeroLoc('direction')],
                    core.values.moveSpeed,
                    move
                );
            } else {
                core.moveAction();
                setTimeout(move, 50);
            }
        }
    };
    move();
};

////// 当前是否正在移动 //////
control.prototype.isMoving = function () {
    return !core.status.heroStop || core.status.heroMoving > 0;
};

////// 停止勇士的一切行动，等待勇士行动结束后，再执行callback //////
control.prototype.waitHeroToStop = function (callback) {
    var lastDirection = core.status.automaticRoute.lastDirection;
    core.stopAutomaticRoute();
    core.clearContinueAutomaticRoute();
    if (callback) {
        core.status.replay.animate = true;
        core.lockControl();
        core.status.automaticRoute.moveDirectly = false;
        setTimeout(
            function () {
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

////// 转向 //////
control.prototype.turnHero = function (direction) {
    if (direction) {
        core.setHeroLoc('direction', direction);
        core.drawHero();
        core.status.route.push('turn:' + direction);
        return;
    }
    core.setHeroLoc('direction', core.turnDirection(':right'));
    core.drawHero();
    core.status.route.push('turn');
    core.checkRouteFolding();
};

////// 瞬间移动 //////
control.prototype.moveDirectly = function (destX, destY, ignoreSteps) {
    return this.controldata.moveDirectly(destX, destY, ignoreSteps);
};

////// 尝试瞬间移动 //////
control.prototype.tryMoveDirectly = function (destX, destY) {
    if (core.isMoving()) return false;
    if (this.nearHero(destX, destY)) return false;
    var canMoveArray = core.maps.generateMovableArray();
    var dirs = [
        [destX, destY],
        [destX - 1, destY, 'right'],
        [destX, destY - 1, 'down'],
        [destX, destY + 1, 'up'],
        [destX + 1, destY, 'left']
    ];
    var canMoveDirectlyArray = core.canMoveDirectlyArray(dirs, canMoveArray);

    for (let i = 0; i < dirs.length; ++i) {
        var d = dirs[i];
        const [dx, dy, dir] = d;

        if (
            dx < 0 ||
            dx >= core.bigmap.width ||
            dy < 0 ||
            dy >= core.bigmap.height
        )
            continue;
        if (dir && !core.inArray(canMoveArray[dx][dy], dir)) continue;
        if (canMoveDirectlyArray[i] < 0) continue;
        core.clearRouteFolding();
        if (core.control.moveDirectly(dx, dy, canMoveDirectlyArray[i])) {
            if (dir) {
                core.moveHero(dir, function () {});
            }
            return true;
        }
    }
    return false;
};

////// 绘制勇士 //////
control.prototype.drawHero = function (status, offset = 0, frame) {
    return;
};

control.prototype._drawHero_updateViewport = function (x, y, offset) {
    core.bigmap.offsetX = core.clamp(
        (x - core._HALF_WIDTH_) * 32 + offset.x,
        0,
        Math.max(32 * core.bigmap.width - core._PX_, 0)
    );
    core.bigmap.offsetY = core.clamp(
        (y - core._HALF_HEIGHT_) * 32 + offset.y,
        0,
        Math.max(32 * core.bigmap.height - core._PY_, 0)
    );
    core.control.updateViewport();
};

control.prototype._drawHero_draw = function (
    direction,
    x,
    y,
    status,
    offset,
    frame
) {
    offset = offset || { x: 0, y: 0, offset: 0, px: 0, py: 0 };
    var opacity = core.setAlpha('hero', core.getFlag('__heroOpacity__', 1));
    this._drawHero_getDrawObjs(direction, x, y, status, offset).forEach(
        function (block) {
            core.drawImage(
                'hero',
                block.img,
                ((block.heroIcon[block.status] + (frame || 0)) % 4) *
                    block.width,
                block.heroIcon.loc * block.height,
                block.width,
                block.height,
                block.posx + (32 - block.width) / 2,
                block.posy + 32 - block.height,
                block.width,
                block.height
            );
        }
    );
    core.setAlpha('hero', opacity);
};

control.prototype._drawHero_getDrawObjs = function (
    direction,
    x,
    y,
    status,
    offset
) {
    var heroIconArr = core.material.icons.hero,
        drawObjs = [],
        index = 0;
    drawObjs.push({
        img: core.material.images.hero,
        width: core.material.icons.hero.width || 32,
        height: core.material.icons.hero.height,
        heroIcon: heroIconArr[direction],
        posx: x * 32 - core.bigmap.offsetX + offset.x,
        posy: y * 32 - core.bigmap.offsetY + offset.y,
        status: status,
        index: index++
    });
    if (typeof offset.offset == 'number') {
        core.status.hero.followers.forEach(function (t) {
            drawObjs.push({
                img: core.material.images.images[t.name],
                width: core.material.images.images[t.name].width / 4,
                height: core.material.images.images[t.name].height / 4,
                heroIcon: heroIconArr[t.direction],
                posx:
                    32 * t.x -
                    core.bigmap.offsetX +
                    (t.stop
                        ? 0
                        : core.utils.scan2[t.direction].x *
                          Math.abs(offset.offset)),
                posy:
                    32 * t.y -
                    core.bigmap.offsetY +
                    (t.stop
                        ? 0
                        : core.utils.scan2[t.direction].y *
                          Math.abs(offset.offset)),
                status: t.stop ? 'stop' : status,
                index: index++
            });
        });
    }
    return drawObjs.sort(function (a, b) {
        return a.posy == b.posy ? b.index - a.index : a.posy - b.posy;
    });
};

control.prototype.setHeroOpacity = function (
    opacity,
    moveMode,
    time,
    callback
) {
    time = time || 0;
    if (time == 0) {
        core.setFlag('__heroOpacity__', opacity);
        core.drawHero();
        if (callback) callback();
        return;
    }
    time /= Math.max(core.status.replay.speed, 1);

    var fromOpacity = core.getFlag('__heroOpacity__', 1);
    var step = 0,
        steps = Math.floor(time / 10);
    if (steps <= 0) steps = 1;
    var moveFunc = core.applyEasing(moveMode);

    var animate = setInterval(function () {
        step++;
        core.setFlag(
            '__heroOpacity__',
            fromOpacity + (opacity - fromOpacity) * moveFunc(step / steps)
        );
        core.drawHero();
        if (step == steps) {
            delete core.animateFrame.asyncId[animate];
            clearInterval(animate);
            if (callback) callback();
        }
    }, 10);

    core.animateFrame.lastAsyncId = animate;
    core.animateFrame.asyncId[animate] = callback;
};

// ------ 画布、位置、阻激夹域，显伤 ------ //

////// 设置画布偏移
control.prototype.setGameCanvasTranslate = function (canvas, x, y) {
    // Deprecated. Use RenderItem.transform instead.
    // For editor compatibility.
    var c = core.dom.gameCanvas[canvas];
    x = x * core.domStyle.scale;
    y = y * core.domStyle.scale;
    c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    c.style.webkitTransform = 'translate(' + x + 'px,' + y + 'px)';
    c.style.OTransform = 'translate(' + x + 'px,' + y + 'px)';
    c.style.MozTransform = 'translate(' + x + 'px,' + y + 'px)';
    if (main.mode === 'editor' && editor.isMobile) {
        c.style.transform =
            'translate(' +
            (x / core._PX_) * 96 +
            'vw,' +
            (y / core._PY_) * 96 +
            'vw)';
    }
};

////// 加减画布偏移
control.prototype.addGameCanvasTranslate = function (x, y) {
    // Deprecated. Use RenderItem.transform instead.
};

////// 更新视野范围 //////
control.prototype.updateViewport = function () {
    // 当前是否应该重绘？
    if (core.bigmap.v2) {
        if (
            core.bigmap.offsetX >= core.bigmap.posX * 32 + 32 ||
            core.bigmap.offsetX <= core.bigmap.posX * 32 - 32 ||
            core.bigmap.offsetY >= core.bigmap.posY * 32 + 32 ||
            core.bigmap.offsetY <= core.bigmap.posY * 32 - 32
        ) {
            core.bigmap.posX = Math.floor(core.bigmap.offsetX / 32);
            core.bigmap.posY = Math.floor(core.bigmap.offsetY / 32);
            core.redrawMap();
        }
    } else {
        core.bigmap.posX = core.bigmap.posY = 0;
    }
    var offsetX = core.bigmap.v2
        ? -(core.bigmap.offsetX - 32 * core.bigmap.posX) - 32
        : -core.bigmap.offsetX;
    var offsetY = core.bigmap.v2
        ? -(core.bigmap.offsetY - 32 * core.bigmap.posY) - 32
        : -core.bigmap.offsetY;

    core.bigmap.canvas.forEach(function (cn) {
        core.control.setGameCanvasTranslate(cn, offsetX, offsetY);
    });
    // ------ 路线
    // core.relocateCanvas(
    //     'route',
    //     core.status.automaticRoute.offsetX - core.bigmap.offsetX,
    //     core.status.automaticRoute.offsetY - core.bigmap.offsetY
    // );
    // ------ 所有的大怪物也都需要重定位
    for (var one in core.dymCanvas) {
        if (one.startsWith('_bigImage_')) {
            var ox = core.dymCanvas[one].canvas.getAttribute('_ox');
            var oy = core.dymCanvas[one].canvas.getAttribute('_oy');
            if (ox != null && oy != null) {
                core.relocateCanvas(
                    one,
                    Number(ox) - core.bigmap.offsetX,
                    Number(oy) - core.bigmap.offsetY
                );
            }
        }
    }
};

////// 设置视野范围 //////
control.prototype.setViewport = function (px, py) {
    var originOffsetX = core.bigmap.offsetX,
        originOffsetY = core.bigmap.offsetY;
    core.bigmap.offsetX = core.clamp(px, 0, 32 * core.bigmap.width - core._PX_);
    core.bigmap.offsetY = core.clamp(
        py,
        0,
        32 * core.bigmap.height - core._PY_
    );
    this.updateViewport();
    // ------ hero层也需要！
    var px = parseFloat(core.canvas.hero._px) || 0;
    var py = parseFloat(core.canvas.hero._py) || 0;
    px += originOffsetX - core.bigmap.offsetX;
    py += originOffsetY - core.bigmap.offsetY;
    core.control.setGameCanvasTranslate('hero', px, py);
    core.canvas.hero._px = px;
    core.canvas.hero._py = py;
};

////// 移动视野范围 //////
control.prototype.moveViewport = function (x, y, moveMode, time, callback) {
    time = time || 0;
    time /= Math.max(core.status.replay.speed, 1);
    var per_time = 10,
        step = 0,
        steps = Math.floor(time / per_time);
    if (steps <= 0) {
        this.setViewport(32 * x, 32 * y);
        if (callback) callback();
        return;
    }
    var px = core.clamp(32 * x, 0, 32 * core.bigmap.width - core._PX_);
    var py = core.clamp(32 * y, 0, 32 * core.bigmap.height - core._PY_);
    var cx = core.bigmap.offsetX;
    var cy = core.bigmap.offsetY;
    var moveFunc = core.applyEasing(moveMode);

    var animate = window.setInterval(function () {
        step++;
        core.setViewport(
            cx + moveFunc(step / steps) * (px - cx),
            cy + moveFunc(step / steps) * (py - cy)
        );
        if (step == steps) {
            delete core.animateFrame.asyncId[animate];
            clearInterval(animate);
            core.setViewport(px, py);
            if (callback) callback();
        }
    }, per_time);

    core.animateFrame.lastAsyncId = animate;
    core.animateFrame.asyncId[animate] = callback;
};

////// 获得勇士面对位置的x坐标 //////
control.prototype.nextX = function (n) {
    if (n == null) n = 1;
    return (
        core.getHeroLoc('x') +
        core.utils.scan[core.getHeroLoc('direction')].x * n
    );
};

////// 获得勇士面对位置的y坐标 //////
control.prototype.nextY = function (n) {
    if (n == null) n = 1;
    return (
        core.getHeroLoc('y') +
        core.utils.scan[core.getHeroLoc('direction')].y * n
    );
};

////// 某个点是否在勇士旁边 //////
control.prototype.nearHero = function (x, y, n) {
    if (n == null) n = 1;
    return (
        Math.abs(x - core.getHeroLoc('x')) +
            Math.abs(y - core.getHeroLoc('y')) <=
        n
    );
};

////// 聚集跟随者 //////
control.prototype.gatherFollowers = function () {
    var x = core.getHeroLoc('x'),
        y = core.getHeroLoc('y'),
        dir = core.getHeroLoc('direction');
    core.status.hero.followers.forEach(function (t) {
        t.x = x;
        t.y = y;
        t.stop = true;
        t.direction = dir;
    });
};

////// 更新跟随者坐标 //////
control.prototype.updateFollowers = function () {
    core.status.hero.followers.forEach(function (t) {
        if (!t.stop) {
            t.x += core.utils.scan2[t.direction].x;
            t.y += core.utils.scan2[t.direction].y;
        }
    });

    var nowx = core.getHeroLoc('x'),
        nowy = core.getHeroLoc('y');
    core.status.hero.followers.forEach(function (t) {
        t.stop = true;
        var dx = nowx - t.x,
            dy = nowy - t.y;
        for (var dir in core.utils.scan2) {
            if (
                core.utils.scan2[dir].x == dx &&
                core.utils.scan2[dir].y == dy
            ) {
                t.stop = false;
                t.direction = dir;
            }
        }
        nowx = t.x;
        nowy = t.y;
    });
};

////// 瞬移更新跟随者坐标 //////
control.prototype._moveDirectyFollowers = function (x, y) {
    var route = core.automaticRoute(x, y);
    if (route.length == 0)
        route = [{ x: x, y: y, direction: core.getHeroLoc('direction') }];

    var nowx = x,
        nowy = y;
    for (var i = 0; i < core.status.hero.followers.length; ++i) {
        var t = core.status.hero.followers[i];
        var index = route.length - i - 2;
        if (index < 0) index = 0;
        t.stop = true;
        t.x = route[index].x;
        t.y = route[index].y;
        t.direction = route[index].direction;
        var dx = nowx - t.x,
            dy = nowy - t.y;
        for (var dir in core.utils.scan2) {
            if (
                core.utils.scan2[dir].x == dx &&
                core.utils.scan2[dir].y == dy
            ) {
                t.stop = false;
                t.direction = dir;
            }
        }
        nowx = t.x;
        nowy = t.y;
    }
};

////// 更新领域、夹击、阻击的伤害地图 //////
control.prototype.updateCheckBlock = function (floorId) {
    // Deprecated
};

////// 检查并执行领域、夹击、阻击事件 //////
control.prototype.checkBlock = function () {
    // see src/plugin/game/popup.js
};

control.prototype._checkBlock_disableQuickShop = function () {
    // 禁用快捷商店
    const { setShopVisited } = Mota.require('@user/data-state');
    if (core.flags.disableShopOnDamage) {
        Object.keys(core.status.shops).forEach(function (shopId) {
            setShopVisited(shopId, false);
        });
    }
};

////// 阻击 //////
control.prototype._checkBlock_repulse = function (repulse) {
    // Deprecated.
};

////// 更新全地图显伤 //////
control.prototype.updateDamage = function (floorId, ctx) {
    // see src/plugin/game/itemDetail.js
};

control.prototype._updateDamage_damage = function (floorId, onMap) {
    // Deprecated. See src/game/enemy/damage.ts EnemyCollection.render.
};

control.prototype._updateDamage_extraDamage = function (floorId, onMap) {
    // Deprecated. See src/game/enemy/damage.ts EnemyCollection.render.
};

////// 重绘地图显伤 //////
control.prototype.drawDamage = function (ctx, floorId = core.status.floorId) {
    // return;
    if (core.status.gameOver || !core.status.damage || main.mode != 'play')
        return;
    var onMap = false;
    if (ctx == null) {
        ctx = core.canvas.damage;
        core.clearMap('damage');
        onMap = true;
    }

    if (onMap && core.bigmap.v2) {
        // 检查是否需要重算...
        if (
            Math.abs(core.bigmap.posX - core.status.damage.posX) >=
                core.bigmap.extend - 1 ||
            Math.abs(core.bigmap.posY - core.status.damage.posY) >=
                core.bigmap.extend - 1
        ) {
            return this.updateDamage();
        }
    }
    return this._drawDamage_draw(ctx, onMap, floorId);
};

control.prototype._drawDamage_draw = function (ctx, onMap) {
    if (!core.hasItem('book')) return;

    core.setFont(ctx, '300 9px Verdana');
    core.setTextAlign(ctx, 'left');
    core.status.damage.data.forEach(function (one) {
        var px = one.px,
            py = one.py;
        if (onMap && core.bigmap.v2) {
            px -= core.bigmap.posX * 32;
            py -= core.bigmap.posY * 32;
            if (
                px < -32 * 2 ||
                px > core._PX_ + 32 ||
                py < -32 ||
                py > core._PY_ + 32
            )
                return;
        }
        core.fillBoldText(ctx, one.text, px, py, one.color);
    });

    core.setTextAlign(ctx, 'center');
    core.status.damage.extraData.forEach(function (one) {
        var px = one.px,
            py = one.py;
        if (onMap && core.bigmap.v2) {
            px -= core.bigmap.posX * 32;
            py -= core.bigmap.posY * 32;
            if (
                px < -32 ||
                px > core._PX_ + 32 ||
                py < -32 ||
                py > core._PY_ + 32
            )
                return;
        }
        var alpha = core.setAlpha(ctx, one.alpha);
        core.fillBoldText(ctx, one.text, px, py, one.color);
        core.setAlpha(ctx, alpha);
    });
};

// ------ 录像相关 ------ //

////// 选择录像文件 //////
control.prototype.chooseReplayFile = function () {
    core.readFile(
        function (obj) {
            if (obj.name != core.firstData.name)
                return alert('存档和游戏不一致！');
            if (!obj.route) return core.drawTip('无效的录像！');
            var _replay = function () {
                core.startGame(
                    core.flags.startUsingCanvas ? '' : obj.hard || '',
                    obj.seed,
                    core.decodeRoute(obj.route)
                );
            };
            if (obj.version && obj.version != core.firstData.version) {
                core.myconfirm(
                    '游戏版本不一致！\n你仍然想播放录像吗？',
                    _replay
                );
                return;
            }
            _replay();
        },
        null,
        '.h5route'
    );
};

////// 开始播放 //////
control.prototype.startReplay = function (list) {
    if (!core.isPlaying()) return;
    core.status.replay.replaying = true;
    core.status.replay.pausing = true;
    core.status.replay.failed = false;
    core.status.replay.speed = 1.0;
    core.status.replay.toReplay = core.cloneArray(list);
    core.status.replay.totalList = core.status.route.concat(list);
    core.status.replay.steps = 0;
    core.status.replay.save = [];
    core.setOpacity('replay', 0.6);
    this._replay_drawProgress();
    core.updateStatusBar(false, true);
    Mota.require('@user/data-base').hook.emit('replayStatus', false);
    this.replay();
};

////// 更改播放状态 //////
control.prototype.triggerReplay = function () {
    if (core.status.replay.pausing) this.resumeReplay();
    else this.pauseReplay();
};

////// 暂停播放 //////
control.prototype.pauseReplay = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    core.status.replay.pausing = true;
    core.drawTip('暂停播放');
    Mota.require('@user/data-base').hook.emit('replayStatus', false);
    core.updateStatusBar(false, true);
};

////// 恢复播放 //////
control.prototype.resumeReplay = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    core.status.replay.pausing = false;
    core.drawTip('恢复播放');
    core.replay();
    Mota.require('@user/data-base').hook.emit('replayStatus', true);
    core.updateStatusBar(false, true);
};

////// 单步播放 //////
control.prototype.stepReplay = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (!core.status.replay.pausing) {
        core.playSound('操作失败');
        return core.drawTip('请先暂停录像');
    }
    if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    core.replay(true);
};

////// 加速播放 //////
control.prototype.speedUpReplay = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    var speeds = [0.2, 0.5, 1, 2, 3, 6, 12, 24];
    for (var i = speeds.length - 2; i >= 0; i--) {
        if (speeds[i] <= core.status.replay.speed) {
            core.status.replay.speed = speeds[i + 1];
            break;
        }
    }
    core.updateStatusBar(false, true);
};

////// 减速播放 //////
control.prototype.speedDownReplay = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    var speeds = [0.2, 0.5, 1, 2, 3, 6, 12, 24];
    for (var i = 1; i <= speeds.length; i++) {
        if (speeds[i] >= core.status.replay.speed) {
            core.status.replay.speed = speeds[i - 1];
            break;
        }
    }
    core.updateStatusBar(false, true);
};

////// 设置播放速度 //////
control.prototype.setReplaySpeed = function (speed) {
    if (!core.isPlaying() || !core.isReplaying()) return;
    core.status.replay.speed = speed;
    core.drawTip('x' + core.status.replay.speed + '倍');
};

////// 停止播放 //////
control.prototype.stopReplay = function (force) {
    if (!core.isPlaying()) return;
    if (!core.isReplaying() && !force) return;
    core.status.replay.toReplay = [];
    core.status.replay.totalList = [];
    core.status.replay.replaying = false;
    core.status.replay.pausing = false;
    core.status.replay.failed = false;
    core.status.replay.speed = 1.0;
    core.status.replay.steps = 0;
    core.status.replay.save = [];
    core.deleteCanvas('replay');
    core.updateStatusBar(false, true);
    core.drawTip('停止播放并恢复游戏');
    Mota.require('@user/data-base').hook.emit('replayStatus', true);
};

////// 回退 //////
control.prototype.rewindReplay = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (!core.status.replay.pausing) {
        core.playSound('操作失败');
        return core.drawTip('请先暂停录像');
    }
    if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    if (core.status.replay.save.length == 0) {
        core.playSound('操作失败');
        return core.drawTip('无法再回到上一个节点');
    }
    var save = core.status.replay.save,
        data = save.pop();
    core.loadData(data.data, function () {
        core.removeFlag('__fromLoad__');
        core.status.replay = {
            replaying: true,
            pausing: true,
            animate: false,
            toReplay: data.replay.toReplay,
            totalList: data.replay.totalList,
            speed: core.status.replay.speed,
            steps: data.replay.steps,
            save: save
        };
        core.setOpacity('replay', 0.6);
        core.control._replay_drawProgress();
        core.updateStatusBar(false, true);
        core.drawTip('成功回退到上一个节点');
    });
};

////// 回放时存档 //////
control.prototype._replay_SL = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (!core.status.replay.pausing) {
        core.playSound('操作失败');
        return core.drawTip('请先暂停录像');
    }
    if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    if (core.hasFlag('__forbidSave__')) {
        core.playSound('操作失败');
        return core.drawTip('当前禁止存档');
    }
    this._replay_hideProgress();

    core.lockControl();
    core.status.event.id = 'save';
    var saveIndex = core.saves.saveIndex;
    var page = Math.floor((saveIndex - 1) / 5),
        offset = saveIndex - 5 * page;

    core.ui._drawSLPanel(10 * page + offset);
};

////// 回放时查看怪物手册 //////
control.prototype._replay_book = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (!core.status.replay.pausing) {
        core.playSound('操作失败');
        return core.drawTip('请先暂停录像');
    }
    if (
        core.isMoving() ||
        core.status.replay.animate ||
        (core.status.event.id && core.status.event.id != 'viewMaps')
    ) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    if (!core.hasItem('book')) {
        core.playSound('操作失败');
        return core.drawTip(
            '你没有' + core.material.items['book'].name,
            'book'
        );
    }
    this._replay_hideProgress();

    // 从“浏览地图”页面打开
    if (core.status.event.id == 'viewMaps')
        core.status.event.ui = core.status.event.data;

    core.lockControl();
    core.status.event.id = 'book';
    core.useItem('book', true);
};

////// 回放录像时浏览地图 //////
control.prototype._replay_viewMap = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (!core.status.replay.pausing) {
        core.playSound('操作失败');
        return core.drawTip('请先暂停录像');
    }
    if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    this._replay_hideProgress();

    core.lockControl();
    core.status.event.id = 'viewMaps';
    core.ui._drawViewMaps();
};

control.prototype._replay_toolbox = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (!core.status.replay.pausing) {
        core.playSound('操作失败');
        return core.drawTip('请先暂停录像');
    }
    if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    this._replay_hideProgress();

    core.lockControl();
    core.status.event.id = 'toolbox';
    core.ui._drawToolbox();
};

control.prototype._replay_equipbox = function () {
    if (!core.isPlaying() || !core.isReplaying()) return;
    if (!core.status.replay.pausing) {
        core.playSound('操作失败');
        return core.drawTip('请先暂停录像');
    }
    if (core.isMoving() || core.status.replay.animate || core.status.event.id) {
        core.playSound('操作失败');
        return core.drawTip('请等待当前事件的处理结束');
    }
    this._replay_hideProgress();

    core.lockControl();
    core.status.event.id = 'equipbox';
    core.ui._drawEquipbox();
};

////// 是否正在播放录像 //////
control.prototype.isReplaying = function () {
    return (core.status.replay || {}).replaying;
};

////// 回放 //////
control.prototype.replay = function (force) {
    if (
        !core.isPlaying() ||
        !core.isReplaying() ||
        core.status.replay.animate ||
        core.status.event.id ||
        core.status.replay.failed
    )
        return;
    if (core.status.replay.pausing && !force) return;
    this._replay_drawProgress();
    if (core.status.replay.toReplay.length == 0) return this._replay_finished();
    this._replay_save();
    var action = core.status.replay.toReplay.shift();
    if (this._doReplayAction(action)) return;
    this._replay_error(action);
};

////// 注册一个录像行为 //////
// name：自定义名称，可用于注销使用
// func：具体执行录像的函数，可为一个函数或插件中的函数名；
//       需要接受一个action参数，代表录像回放时的下一个操作
// func返回true代表成功处理了此录像行为，false代表没有处理此录像行为。
control.prototype.registerReplayAction = function (name, func) {
    this.unregisterReplayAction(name);
    this.replayActions.push({ name: name, func: func });
};

////// 注销一个录像行为 //////
control.prototype.unregisterReplayAction = function (name) {
    this.replayActions = this.replayActions.filter(function (b) {
        return b.name != name;
    });
};

////// 执行录像行为，会在注册的函数中依次执行直到得到true为止 //////
control.prototype._doReplayAction = function (action) {
    for (var i in this.replayActions) {
        try {
            if (this.replayActions[i].func.call(this, action)) return true;
        } catch (e) {
            console.error(e);
            console.error(
                'ERROR in replayActions[' +
                    this.replayActions[i].name +
                    ']：已自动注销该项。'
            );
            core.unregisterReplayAction(this.replayActions[i].name);
        }
    }
    return false;
};

control.prototype._replay_finished = function () {
    core.status.replay.replaying = false;
    core.status.replay.failed = false;
    core.status.event.selection = 0;
    var str = '录像播放完毕，你想退出播放吗？';
    if (
        core.status.route.length != core.status.replay.totalList.length ||
        core.subarray(core.status.route, core.status.replay.totalList) == null
    ) {
        str =
            '录像播放完毕，但记录不一致。\n请检查录像播放时的二次记录问题。\n你想退出播放吗？';
    }
    core.ui.drawConfirmBox(
        str,
        function () {
            core.ui.closePanel();
            core.stopReplay(true);
        },
        function () {
            core.status.replay.replaying = true;
            core.ui.closePanel();
            core.pauseReplay();
        },
        true
    );
};

control.prototype._replay_save = function () {
    core.status.replay.steps++;
    if (core.status.replay.steps % 40 == 1) {
        if (core.status.replay.save.length == 30)
            core.status.replay.save.shift();
        core.status.replay.save.push({
            data: core.saveData(true),
            replay: {
                totalList: core.cloneArray(core.status.replay.totalList),
                toReplay: core.cloneArray(core.status.replay.toReplay),
                steps: core.status.replay.steps
            }
        });
    }
};

control.prototype._replay_error = function (action, callback) {
    core.ui.closePanel();
    core.status.replay.replaying = false;
    core.status.replay.failed = true;
    var len = core.status.replay.toReplay.length;
    var prevList = core.status.replay.totalList.slice(-len - 11, -len - 1);
    var nextList = core.status.replay.toReplay.slice(0, 10);
    console.log('录像文件出错，当前操作：' + action);
    console.log('之前的10个操作是：\n' + prevList.toString());
    console.log('接下来10个操作是：\n' + nextList.toString());
    core.ui.drawConfirmBox(
        '录像文件出错，你想回到上个节点吗？',
        function () {
            core.status.replay.failed = false;
            core.ui.closePanel();
            if (core.status.replay.save.length > 0) {
                core.status.replay.replaying = true;
                core.status.replay.pausing = true;
                Mota.require('@user/data-base').hook.emit(
                    'replayStatus',
                    false
                );
                core.rewindReplay();
            } else {
                core.playSound('操作失败');
                core.stopReplay(true);
                core.drawTip('无法回到上一个节点');
                if (callback) callback();
            }
        },
        function () {
            core.status.replay.failed = false;
            core.ui.closePanel();
            core.stopReplay(true);
            if (callback) callback();
        },
        true
    );
};

control.prototype._replay_hideProgress = function () {
    if (core.dymCanvas.replay)
        core.dymCanvas.replay.canvas.style.display = 'none';
};

control.prototype._replay_drawProgress = function () {
    if (!core.dymCanvas.replay) return;
    if (core.dymCanvas.replay.canvas.style.display == 'none')
        core.dymCanvas.replay.canvas.style.display = 'block';
    var total = core.status.replay.totalList.length,
        left = total - core.status.replay.toReplay.length;
    var content =
        '播放进度：' +
        left +
        ' / ' +
        total +
        '（' +
        ((left / total) * 100).toFixed(2) +
        '%）';
    var width = 26 + core.calWidth('replay', content, '16px Arial');
    core.clearMap('replay');
    core.fillRect('replay', 0, 0, width, 40, '#000000');
    core.fillText('replay', content, 16, 27, '#FFFFFF');
};

control.prototype.__replay_getTimeout = function () {
    if (core.status.replay.speed == 24) return 0;
    return 750 / Math.max(1, core.status.replay.speed);
};

control.prototype._replayAction_move = function (action) {
    if (['up', 'down', 'left', 'right'].indexOf(action) < 0) return false;
    core.moveHero(action, core.replay);
    return true;
};

control.prototype._replayAction_item = function (action) {
    if (action.indexOf('item:') != 0) return false;
    var itemId = action.substring(5);
    if (!core.canUseItem(itemId)) return false;
    if (
        core.material.items[itemId].hideInReplay ||
        core.status.replay.speed == 24
    ) {
        core.useItem(itemId, false, core.replay);
        return true;
    }
    var tools = core.getToolboxItems('tools'),
        constants = core.getToolboxItems('constants');
    var index,
        per = core._WIDTH_ - 1;
    if ((index = tools.indexOf(itemId)) >= 0) {
        core.status.event.data = {
            toolsPage: Math.floor(index / per) + 1,
            constantsPage: 1
        };
        index = index % per;
    } else if ((index = constants.indexOf(itemId)) >= 0) {
        core.status.event.data = {
            toolsPage: 1,
            constantsPage: Math.floor(index / per) + 1
        };
        index = (index % per) + per;
    }
    if (index < 0) return false;
    core.ui._drawToolbox(index);
    setTimeout(function () {
        core.ui.closePanel();
        core.useItem(itemId, false, core.replay);
    }, core.control.__replay_getTimeout());
    return true;
};

control.prototype._replayAction_equip = function (action) {
    if (action.indexOf('equip:') != 0) return false;
    const [, type, id] = action.split(':');
    let t = Number(type);
    const hasType = !isNaN(t);
    const equipId = hasType ? id : type;
    const ownEquipment = core.getToolboxItems('equips');
    if (!ownEquipment.includes(equipId)) {
        core.removeFlag('__doNotCheckAutoEvents__');
        return false;
    }
    if (!hasType) {
        const type = core.getEquipTypeById(equipId);
        if (type >= 0) t = type;
        else {
            Mota.require('@motajs/legacy-ui').tip(
                'error',
                '无法装备' + core.material.items[equipId]?.name
            );
            return false;
        }
    }
    const now = core.status.hero.equipment[t];

    const cb = function () {
        const next = core.status.replay.toReplay[0] || '';
        if (!next.startsWith('equip:') && !next.startsWith('unequip:')) {
            core.removeFlag('__doNotCheckAutoEvents__');
            core.checkAutoEvents();
        }
        core.replay();
    };
    core.setFlag('__doNotCheckAutoEvents__', true);

    if (
        core.material.items[equipId].hideInReplay ||
        core.status.replay.speed == 24
    ) {
        core.items._realLoadEquip(t, equipId, now);
        cb();
        return true;
    }
    setTimeout(function () {
        core.ui.closePanel();
        core.items._realLoadEquip(t, equipId, now);
        cb();
    }, core.control.__replay_getTimeout());
    return true;
};

control.prototype._replayAction_unEquip = function (action) {
    if (action.indexOf('unequip:') != 0) return false;
    const type = action.slice(8);
    let equipType = Number(type);
    if (!core.isset(equipType)) {
        const id = core.status.hero.equipment.indexOf(type);
        if (id === -1) {
            core.removeFlag('__doNotCheckAutoEvents__');
            return false;
        } else {
            equipType = id;
        }
    }

    var cb = function () {
        var next = core.status.replay.toReplay[0] || '';
        if (!next.startsWith('equip:') && !next.startsWith('unequip:')) {
            core.removeFlag('__doNotCheckAutoEvents__');
            core.checkAutoEvents();
        }
        core.replay();
    };
    core.setFlag('__doNotCheckAutoEvents__', true);

    if (core.status.replay.speed == 24) {
        core.unloadEquip(equipType);
        cb();
        return true;
    }
    setTimeout(function () {
        core.ui.closePanel();
        core.unloadEquip(equipType);
        cb();
    }, core.control.__replay_getTimeout());
    return true;
};

control.prototype._replayAction_saveEquip = function (action) {
    if (action.indexOf('saveEquip:') != 0) return false;
    core.quickSaveEquip(parseInt(action.substring(10)));
    core.replay();
    return true;
};

control.prototype._replayAction_loadEquip = function (action) {
    if (action.indexOf('loadEquip:') != 0) return false;
    core.quickLoadEquip(parseInt(action.substring(10)));
    core.replay();
    return true;
};

control.prototype._replayAction_fly = function (action) {
    if (action.indexOf('fly:') != 0) return false;
    var floorId = action.substring(4);
    var toIndex = core.floorIds.indexOf(floorId);
    if (
        !core.canUseItem('fly') ||
        (core.flags.flyNearStair && !core.nearStair())
    )
        return false;
    core.ui.drawFly(toIndex);
    if (core.status.replay.speed == 24) {
        if (!core.flyTo(floorId, core.replay))
            core.control._replay_error(action);
        return true;
    }
    setTimeout(function () {
        if (!core.flyTo(floorId, core.replay))
            core.control._replay_error(action);
    }, core.control.__replay_getTimeout());
    return true;
};

control.prototype._replayAction_turn = function (action) {
    if (action != 'turn' && action.indexOf('turn:') != 0) return false;
    if (action == 'turn') core.turnHero();
    else core.turnHero(action.substring(5));
    core.replay();
    return true;
};

control.prototype._replayAction_getNext = function (action) {
    if (action != 'getNext') return false;
    core.getNextItem();
    core.replay();
    return true;
};

control.prototype._replayAction_moveDirectly = function (action) {
    if (action.indexOf('move:') != 0) return false;
    // 忽略连续的瞬移事件；如果大地图某一边超过计算范围则不合并
    if (
        !core.hasFlag('poison') &&
        core.status.thisMap.width < 2 * core.bigmap.extend + core._WIDTH_ &&
        core.status.thisMap.height < 2 * core.bigmap.extend + core._HEIGHT_
    ) {
        while (
            core.status.replay.toReplay.length > 0 &&
            core.status.replay.toReplay[0].indexOf('move:') == 0
        ) {
            core.status.route.push(action);
            action = core.status.replay.toReplay.shift();
        }
    }

    var pos = action.substring(5).split(':');
    var x = parseInt(pos[0]),
        y = parseInt(pos[1]);
    var nowx = core.getHeroLoc('x'),
        nowy = core.getHeroLoc('y');
    var ignoreSteps = core.canMoveDirectly(x, y);
    if (!core.moveDirectly(x, y, ignoreSteps)) return false;
    if (core.status.replay.speed == 24) {
        core.replay();
        return true;
    }

    core.ui.drawArrow(
        'ui',
        32 * nowx + 16 - core.bigmap.offsetX,
        32 * nowy + 16 - core.bigmap.offsetY,
        32 * x + 16 - core.bigmap.offsetX,
        32 * y + 16 - core.bigmap.offsetY,
        '#FF0000',
        3
    );
    var timeout = this.__replay_getTimeout();
    if (ignoreSteps < 10) timeout = (timeout * ignoreSteps) / 10;
    setTimeout(function () {
        core.clearMap('ui');
        core.replay();
    }, timeout);
    return true;
};

control.prototype._replayAction_key = function (action) {
    if (action.indexOf('key:') != 0) return false;
    core.actions.keyUp(parseInt(action.substring(4)), false, true);
    core.replay();
    return true;
};

control.prototype._replayAction_ignoreInput = function (action) {
    if (
        action.indexOf('input:') == 0 ||
        action.indexOf('input2:') == 0 ||
        action.indexOf('choices:') == 0 ||
        action.indexOf('random:') == 0
    ) {
        console.warn('警告！录像播放中出现了未知的 ' + action + '！');
        core.replay();
        return true;
    }
    return false;
};

control.prototype._replayAction_no = function (action) {
    if (action != 'no') return false;
    core.status.route.push(action);
    core.replay();
    return true;
};

// ------ 存读档相关 ------ //

////// 自动存档 //////
control.prototype.autosave = function (removeLast) {
    if (core.hasFlag('__forbidSave__')) return;
    var x = null;
    if (removeLast) {
        x = core.status.route.pop();
        core.status.route.push('turn:' + core.getHeroLoc('direction'));
    }
    if (core.status.event.id == 'action' && !removeLast)
        // 事件中自动存档，读档后是否回到事件触发前
        core.setFlag('__events__', core.clone(core.status.event.data));
    if (core.saves.autosave.data == null) {
        core.saves.autosave.data = [];
    }
    core.saves.autosave.data.splice(
        core.saves.autosave.now,
        0,
        core.saveData(true)
    );
    core.saves.autosave.now += 1;
    if (core.saves.autosave.data.length > core.saves.autosave.max) {
        if (core.saves.autosave.now < core.saves.autosave.max / 2)
            core.saves.autosave.data.pop();
        else {
            core.saves.autosave.data.shift();
            core.saves.autosave.now = core.saves.autosave.now - 1;
        }
    }
    core.saves.autosave.updated = true;
    core.saves.ids[0] = true;
    core.removeFlag('__events__');
    if (removeLast) {
        core.status.route.pop();
        if (x) core.status.route.push(x);
    }
};

/////// 实际进行自动存档 //////
control.prototype.checkAutosave = function () {
    if (!core.animateFrame || !core.saves || !core.saves.autosave) return;
    core.setLocalStorage('totalTime', core.animateFrame.totalTime);
    var autosave = core.saves.autosave;
    if (autosave.data == null || !autosave.updated || !autosave.storage) return;
    autosave.updated = false;
    if (autosave.data.length >= 1) {
        core.setLocalForage('autoSave', autosave.data[autosave.now - 1]);
    }
};

////// 实际进行存读档事件 //////
control.prototype.doSL = function (id, type) {
    switch (type) {
        case 'save':
            this._doSL_save(id);
            break;
        case 'load':
            this._doSL_load(id, this._doSL_load_afterGet);
            break;
        case 'reload':
            this._doSL_reload(id, this._doSL_load_afterGet);
            break;
        case 'replayLoad':
            this._doSL_load(id, this._doSL_replayLoad_afterGet);
            break;
        case 'replayRemain':
            return this._doSL_load(id, this._doSL_replayRemain_afterGet);
            break;
        case 'replaySince':
            this._doSL_load(id, this._doSL_replaySince_afterGet);
            break;
    }
};

control.prototype._doSL_save = function (id) {
    if (id == 'autoSave') {
        core.playSound('操作失败');
        return core.drawTip('不能覆盖自动存档！');
    }
    // 在事件中的存档
    if (core.status.event.interval != null)
        core.setFlag('__events__', core.status.event.interval);
    var data = core.saveData();
    if (core.isReplaying() && core.status.replay.toReplay.length > 0) {
        data.__toReplay__ = core.encodeRoute(core.status.replay.toReplay);
    }
    core.setLocalForage(
        'save' + id,
        data,
        function () {
            core.saves.saveIndex = id;
            core.setLocalStorage('saveIndex', core.saves.saveIndex);
            // 恢复事件
            if (!core.events.recoverEvents(core.status.event.interval))
                core.ui.closePanel();
            core.playSound('存档');
            core.drawTip('存档成功！');
        },
        function (err) {
            console.error(err);
            alert('存档失败，错误信息：\n' + err);
        }
    );
    core.removeFlag('__events__');
    return;
};

control.prototype._doSL_load = function (id, callback) {
    if (id == 'autoSave' && core.saves.autosave.data != null) {
        core.saves.autosave.now -= 1;
        var data = core.saves.autosave.data.splice(
            core.saves.autosave.now,
            1
        )[0];
        if (!main.replayChecking) {
            Mota.require('@motajs/legacy-ui').fixedUi.closeByName('start');
        }
        if (core.isPlaying() && !core.status.gameOver) {
            core.control.autosave(0);
            core.saves.autosave.now -= 1;
        }
        if (core.saves.autosave.now == 0) {
            core.saves.autosave.data.unshift(core.clone(data));
            core.saves.autosave.now += 1;
        }
        callback(id, data);
    } else {
        core.getLocalForage(
            id == 'autoSave' ? id : 'save' + id,
            null,
            function (data) {
                if (!main.replayChecking && data) {
                    Mota.require('@motajs/legacy-ui').fixedUi.closeByName(
                        'start'
                    );
                }
                if (id == 'autoSave' && data != null) {
                    core.saves.autosave.data = data;
                    if (!(core.saves.autosave.data instanceof Array)) {
                        core.saves.autosave.data = [core.saves.autosave.data];
                    }
                    core.saves.autosave.now = core.saves.autosave.data.length;
                    return core.control._doSL_load(id, callback);
                }
                callback(id, data);
            },
            function (err) {
                console.error(err);
                core.drawTip('无效的存档');
            }
        );
    }
    return;
};

control.prototype._doSL_reload = function (id, callback) {
    if (
        core.saves.autosave.data != null &&
        core.saves.autosave.now < core.saves.autosave.data.length
    ) {
        var data = core.saves.autosave.data.splice(
            core.saves.autosave.now,
            1
        )[0];
        core.control.autosave(false);
        callback(id, data);
    }
    return;
};

control.prototype._doSL_load_afterGet = function (id, data) {
    if (!data) return core.drawTip('无效的存档');
    var _replay = function () {
        core.startGame(
            data.hard,
            data.hero.flags.__seed__,
            core.decodeRoute(data.route)
        );
    };
    if (data.version != core.firstData.version) {
        core.myconfirm(
            '存档版本不匹配！\n你想回放此存档的录像吗？\n可以随时停止录像播放以继续游戏。',
            _replay
        );
        return;
    }
    if (data.hero.flags.__events__ && data.guid != core.getGuid()) {
        core.myconfirm('此存档可能存在风险，你想要播放录像么？', _replay);
        return;
    }
    // core.ui.closePanel();
    core.loadData(data, function () {
        core.removeFlag('__fromLoad__');
        core.drawTip('读档成功');
        if (id != 'autoSave') {
            core.saves.saveIndex = id;
            core.setLocalStorage('saveIndex', core.saves.saveIndex);
        }
    });
};

control.prototype._doSL_replayLoad_afterGet = function (id, data) {
    if (!data) {
        core.playSound('操作失败');
        return core.drawTip('无效的存档');
    }
    if (data.version != core.firstData.version) {
        core.playSound('操作失败');
        return core.drawTip('存档版本不匹配');
    }
    if (data.hero.flags.__events__ && data.guid != core.getGuid()) {
        core.playSound('操作失败');
        return core.drawTip('此存档可能存在风险，无法读档');
    }
    var route = core.subarray(core.status.route, core.decodeRoute(data.route));
    if (route == null) {
        core.playSound('操作失败');
        return core.drawTip('无法从此存档回放录像');
    }
    core.loadData(data, function () {
        core.removeFlag('__fromLoad__');
        core.startReplay(route);
        core.drawTip('回退到存档节点');
    });
};

control.prototype._doSL_replayRemain_afterGet = function (id, data) {
    if (!data) {
        core.playSound('操作失败');
        core.drawTip('无效的存档');
        return false;
    }
    var route = core.decodeRoute(data.route);
    if (core.status.tempRoute) {
        var remainRoute = core.subarray(route, core.status.tempRoute);
        if (remainRoute == null)
            return alert(
                '无法接续播放录像！\n该存档必须是前一个选择的存档的后续内容。'
            );
        delete core.status.tempRoute;
        core.ui.closePanel();
        core.startReplay(remainRoute);
        core.drawTip('接续播放录像');
        return true;
    } else if (
        data.floorId != core.status.floorId ||
        data.hero.loc.x != core.getHeroLoc('x') ||
        data.hero.loc.y != core.getHeroLoc('y')
    ) {
        alert('楼层或坐标不一致！');
        return false;
    }

    core.status.tempRoute = route;
    return true;
};

control.prototype._doSL_replaySince_afterGet = function (id, data) {
    if (
        data.floorId != core.status.floorId ||
        data.hero.loc.x != core.getHeroLoc('x') ||
        data.hero.loc.y != core.getHeroLoc('y')
    )
        return alert('楼层或坐标不一致！');
    if (!data.__toReplay__) return alert('该存档没有剩余录像！');
    core.ui.closePanel();
    core.startReplay(core.decodeRoute(data.__toReplay__));
    core.drawTip('播放存档剩余录像');
    return;
};

////// 同步存档到服务器 //////
control.prototype.syncSave = function (type) {
    core.ui.drawWaiting('正在同步，请稍候...');
    var callback = function (saves) {
        core.control._syncSave_http(type, saves);
    };
    if (type == 'all') core.getAllSaves(callback);
    else core.getSave(core.saves.saveIndex, callback);
};

control.prototype._syncSave_http = function (type, saves) {
    // Deprecated.
};

////// 从服务器加载存档 //////
control.prototype.syncLoad = function () {
    // Deprecated.
};

control.prototype._syncLoad_http = function (id, password) {
    // Deprecated.
};

control.prototype._syncLoad_write = function (data) {
    // Deprecated.
};

////// 存档到本地 //////
control.prototype.saveData = function (fromAutosave) {
    return this.controldata.saveData(fromAutosave);
};

////// 从本地读档 //////
control.prototype.loadData = function (data, callback) {
    return this.controldata.loadData(data, callback);
};

control.prototype.getSave = function (index, callback) {
    if (index == 0) {
        // --- 自动存档先从缓存中获取
        if (core.saves.autosave.data != null)
            callback(core.saves.autosave.data);
        else {
            core.getLocalForage(
                'autoSave',
                null,
                function (data) {
                    if (data != null) {
                        core.saves.autosave.data = data;
                        if (!(core.saves.autosave.data instanceof Array)) {
                            core.saves.autosave.data = [
                                core.saves.autosave.data
                            ];
                        }
                        core.saves.autosave.now =
                            core.saves.autosave.data.length;
                    }
                    callback(core.saves.autosave.data);
                },
                function (err) {
                    console.error(err);
                    callback(null);
                }
            );
        }
        return;
    }
    core.getLocalForage(
        'save' + index,
        null,
        function (data) {
            if (callback) callback(data);
        },
        function (err) {
            console.error(err);
            if (callback) callback(null);
        }
    );
};

control.prototype.getSaves = function (ids, callback) {
    if (!(ids instanceof Array)) return this.getSave(ids, callback);
    var count = ids.length,
        data = {};
    for (var i = 0; i < ids.length; ++i) {
        (function (i) {
            core.getSave(ids[i], function (result) {
                data[i] = result;
                if (Object.keys(data).length == count) callback(data);
            });
        })(i);
    }
};

control.prototype.getAllSaves = function (callback) {
    var ids = Object.keys(core.saves.ids)
            .filter(function (x) {
                return x != 0;
            })
            .sort(function (a, b) {
                return a - b;
            }),
        saves = [];
    this.getSaves(ids, function (data) {
        for (var i = 0; i < ids.length; ++i) {
            if (data[i] != null) saves.push(data[i]);
        }
        callback(saves);
    });
};

////// 获得所有存在存档的存档位 //////
control.prototype.getSaveIndexes = function (callback) {
    var indexes = {};
    core.keysLocalForage(function (err, keys) {
        if (err) {
            console.error(err);
            return callback(indexes);
        }
        keys.forEach(function (key) {
            core.control._getSaveIndexes_getIndex(indexes, key);
        });
        callback(indexes);
    });
};

control.prototype._getSaveIndexes_getIndex = function (indexes, name) {
    var e = new RegExp(
        '^' + core.firstData.name + '_(save\\d+|autoSave)$'
    ).exec(name);
    if (e) {
        if (e[1] == 'autoSave') indexes[0] = true;
        else indexes[parseInt(e[1].substring(4))] = true;
    }
};

////// 判断某个存档位是否存在存档 //////
control.prototype.hasSave = function (index) {
    return core.saves.ids[index] || false;
};

////// 删除某个存档
control.prototype.removeSave = function (index, callback) {
    if (index == 0 || index == 'autoSave') {
        index = 'autoSave';
        core.removeLocalForage(index, function () {
            core.saves.autosave.data = null;
            core.saves.autosave.updated = false;
            if (callback) callback();
        });
        return;
    }
    core.removeLocalForage(
        'save' + index,
        function () {
            core.saves.favorite = core.saves.favorite.filter(function (i) {
                return core.hasSave(i);
            });
            delete core.saves.favoriteName[index];
            core.control._updateFavoriteSaves();
            if (callback) callback();
        },
        function () {
            core.playSound('操作失败');
            core.drawTip('无法删除存档！');
            if (callback) callback();
        }
    );
};

////// 读取收藏信息
control.prototype._loadFavoriteSaves = function () {
    core.saves.favorite = core.getLocalStorage('favorite', []);
    // --- 移除不存在的收藏
    core.saves.favorite = core.saves.favorite.filter(function (i) {
        return core.hasSave(i);
    });
    core.saves.favoriteName = core.getLocalStorage('favoriteName', {});
};

control.prototype._updateFavoriteSaves = function () {
    core.setLocalStorage('favorite', core.saves.favorite);
    core.setLocalStorage('favoriteName', core.saves.favoriteName);
};

// ------ 属性，状态，位置，buff，变量，锁定控制等 ------ //

////// 设置勇士属性 //////
control.prototype.setStatus = function (name, value) {
    if (!core.status.hero) return;
    if (name == 'x' || name == 'y' || name == 'direction')
        this.setHeroLoc(name, value);
    else core.status.hero[name] = value;
};

////// 增减勇士属性 //////
control.prototype.addStatus = function (name, value) {
    this.setStatus(name, this.getStatus(name) + value);
};

////// 获得勇士属性 //////
control.prototype.getStatus = function (name) {
    if (!core.status.hero) return null;
    if (name == 'x' || name == 'y' || name == 'direction')
        return this.getHeroLoc(name);
    if (main.mode == 'editor' && !core.hasFlag('__statistics__')) {
        return data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.firstData.hero[name];
    }
    return core.status.hero[name];
};

////// 从status中获得属性，如果不存在则从勇士属性中获取 //////
control.prototype.getStatusOrDefault = function (status, name) {
    // Deprecated. See src/plugin/game/hero.ts
};

////// 获得勇士实际属性（增幅后的） //////
control.prototype.getRealStatus = function (name) {
    // Deprecated. See src/plugin/game/hero.ts
};

////// 从status中获得实际属性（增幅后的），如果不存在则从勇士属性中获取 //////
control.prototype.getRealStatusOrDefault = function (status, name) {
    // Deprecated. See src/plugin/game/hero.ts
};

////// 获得勇士原始属性（无装备和衰弱影响） //////
control.prototype.getNakedStatus = function (name) {
    var value = this.getStatus(name);
    if (value == null) return value;
    // 装备增幅
    core.status.hero.equipment.forEach(function (v) {
        if (!v || !(core.material.items[v] || {}).equip) return;
        value -= core.material.items[v].equip.value[name] || 0;
    });
    // 衰弱扣除
    if (
        core.hasFlag('weak') &&
        core.values.weakValue >= 1 &&
        (name == 'atk' || name == 'def')
    ) {
        value += core.values.weakValue;
    }
    return value;
};

////// 获得某个属性的名字 //////
control.prototype.getStatusLabel = function (name) {
    if (this.controldata.getStatusLabel) {
        return this.controldata.getStatusLabel(name) || name;
    }
    return (
        {
            name: '名称',
            lv: '等级',
            hpmax: '生命上限',
            hp: '生命',
            manamax: '魔力上限',
            mana: '魔力',
            atk: '攻击',
            def: '防御',
            mdef: '护盾',
            money: '金币',
            exp: '经验',
            point: '加点',
            steps: '步数'
        }[name] || name
    );
};

////// 设置某个属性的增幅值 //////
control.prototype.setBuff = function (name, value) {
    core.status.hero.buff[name] ??= 1;
    core.status.hero.buff[name] = value;
};

////// 加减某个属性的增幅值 //////
control.prototype.addBuff = function (name, value) {
    core.status.hero.buff[name] ??= 1;
    core.status.hero.buff[name] += value;
};

////// 获得某个属性的增幅值 //////
control.prototype.getBuff = function (name) {
    return core.status.hero.buff[name] ?? 1;
};

////// 设置勇士的位置 //////
control.prototype.setHeroLoc = function (name, value, noGather) {
    if (!core.status.hero) return;
    core.status.hero.loc[name] = value;
    if ((name == 'x' || name == 'y') && !noGather) {
        this.gatherFollowers();
    }
};

////// 获得勇士的位置 //////
control.prototype.getHeroLoc = function (name) {
    if (!core.status.hero) return;
    if (main.mode == 'editor') {
        if (name == null)
            return data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.firstData.hero.loc;
        return data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.firstData.hero.loc[
            name
        ];
    }
    if (name == null) return core.status.hero.loc;
    return core.status.hero.loc[name];
};

////// 获得某个等级的名称 //////
control.prototype.getLvName = function (lv) {
    if (!core.status.hero) return null;
    if (lv == null) lv = core.status.hero.lv;
    return ((core.firstData.levelUp || [])[lv - 1] || {}).title || lv;
};

////// 获得下个等级所需经验；如果不存在下个等级，返回null。 //////
control.prototype.getNextLvUpNeed = function () {
    if (!core.status.hero) return null;
    if (core.status.hero.lv >= core.firstData.levelUp.length) return null;
    var need = core.calValue(core.firstData.levelUp[core.status.hero.lv].need);
    if (core.flags.statusBarItems.indexOf('levelUpLeftMode') >= 0)
        return Math.max(need - core.getStatus('exp'), 0);
    else return need;
};

////// 设置某个自定义变量或flag //////
control.prototype.setFlag = function (name, value) {
    if (value == null) return this.removeFlag(name);
    if (!core.status.hero) return;
    core.status.hero.flags[name] = value;
};

////// 增加某个flag数值 //////
control.prototype.addFlag = function (name, value) {
    if (!core.status.hero) return;
    core.setFlag(name, core.getFlag(name, 0) + value);
};

////// 获得某个自定义变量或flag //////
control.prototype.getFlag = function (name, defaultValue) {
    if (!core.status.hero) return defaultValue;
    var value = core.status.hero.flags[name];
    return value != null ? value : defaultValue;
};

////// 是否存在某个自定义变量或flag，且值为true //////
control.prototype.hasFlag = function (name) {
    return !!core.getFlag(name);
};

////// 删除某个自定义变量或flag //////
control.prototype.removeFlag = function (name) {
    if (!core.status.hero) return;
    delete core.status.hero.flags[name];
};

////// 获得某个点的独立开关 //////
control.prototype.getSwitch = function (x, y, floorId, name, defaultValue) {
    var prefix = [
        floorId || core.status.floorId || ':f',
        x != null ? x : 'x',
        y != null ? y : 'y'
    ].join('@');
    return this.getFlag(prefix + '@' + name, defaultValue);
};

////// 设置某个点的独立开关 //////
control.prototype.setSwitch = function (x, y, floorId, name, value) {
    var prefix = [
        floorId || core.status.floorId || ':f',
        x != null ? x : 'x',
        y != null ? y : 'y'
    ].join('@');
    return this.setFlag(prefix + '@' + name, value);
};

////// 增加某个点的独立开关 //////
control.prototype.addSwitch = function (x, y, floorId, name, value) {
    var prefix = [
        floorId || core.status.floorId || ':f',
        x != null ? x : 'x',
        y != null ? y : 'y'
    ].join('@');
    return this.addFlag(prefix + '@' + name, value);
};

////// 判定某个点的独立开关 //////
control.prototype.hasSwitch = function (x, y, floorId, name) {
    var prefix = [
        floorId || core.status.floorId || ':f',
        x != null ? x : 'x',
        y != null ? y : 'y'
    ].join('@');
    return this.hasFlag(prefix + '@' + name);
};

////// 删除某个点的独立开关 //////
control.prototype.removeSwitch = function (x, y, floorId, name) {
    var prefix = [
        floorId || core.status.floorId || ':f',
        x != null ? x : 'x',
        y != null ? y : 'y'
    ].join('@');
    return this.removeFlag(prefix + '@' + name);
};

////// 锁定状态栏，常常用于事件处理 //////
control.prototype.lockControl = function () {
    core.status.lockControl = true;
};

////// 解锁状态栏 //////
control.prototype.unlockControl = function () {
    core.status.lockControl = false;
};

////// 开启debug模式 //////
control.prototype.debug = function () {
    core.setFlag('debug', true);
    core.drawTip('[调试模式开启]此模式下按住Ctrl键可以穿墙并忽略一切事件');
};

control.prototype._bindRoutePush = function () {
    core.status.route.push = function (element) {
        // 忽视移动、转向、瞬移
        if (
            ['up', 'down', 'left', 'right', 'turn'].indexOf(element) < 0 &&
            !element.startsWith('move:')
        ) {
            core.clearRouteFolding();
        }
        Array.prototype.push.call(core.status.route, element);
    };
};

////// 清除录像折叠信息 //////
control.prototype.clearRouteFolding = function () {
    core.status.routeFolding = {};
};

////// 检查录像折叠 //////
control.prototype.checkRouteFolding = function () {
    // 未开启、未开始游戏、录像播放中、正在事件中：不执行
    if (
        !core.flags.enableRouteFolding ||
        !core.isPlaying() ||
        core.isReplaying() ||
        core.status.event.id
    ) {
        return this.clearRouteFolding();
    }
    var hero = core.clone(core.status.hero, function (name, value) {
        return name != 'steps' && typeof value == 'number';
    });
    var index = [
        core.getHeroLoc('x'),
        core.getHeroLoc('y'),
        core.getHeroLoc('direction').charAt(0)
    ].join(',');
    core.status.routeFolding = core.status.routeFolding || {};
    if (core.status.routeFolding[index]) {
        var one = core.status.routeFolding[index];
        if (
            core.same(one.hero, hero) &&
            one.length < core.status.route.length
        ) {
            Object.keys(core.status.routeFolding).forEach(function (v) {
                if (core.status.routeFolding[v].length >= one.length)
                    delete core.status.routeFolding[v];
            });
            core.status.route.splice(one.length);
            this._bindRoutePush();
        }
    }
    core.status.routeFolding[index] = {
        hero: hero,
        length: core.status.route.length
    };
};

// ------ 天气，色调，BGM ------ //

control.prototype.getMappedName = function (name) {
    return (
        core.getFlag('__nameMap__', {})[name] ||
        (main.nameMap || {})[name] ||
        name
    );
};

////// 更改天气效果 //////
control.prototype.setWeather = function (type, level) {
    // Deprecated. Use WeatherController API instead.
    // Fallback see src/module/fallback/weather.ts
};

////// 注册一个天气 //////
// name为天气类型，如 sun, rain, snow 等
// initFunc 为设置为此天气时的初始化，接受level参数
// frameFunc 为该天气下每帧的效果，接受和timestamp参数（从页面加载完毕到当前经过的时间）
control.prototype.registerWeather = function (name, initFunc, frameFunc) {};

////// 取消注册一个天气 //////
control.prototype.unregisterWeather = function (name) {};

control.prototype._weather_rain = function (level) {};

control.prototype._weather_snow = function (level) {};

control.prototype._weather_fog = function (level) {};

control.prototype._weather_cloud = function (level) {};

control.prototype._weather_sun = function (level) {};

////// 更改画面色调 //////
control.prototype.setCurtain = function (color, time, moveMode, callback) {
    if (time == null) time = 750;
    if (time <= 0) time = 0;
    if (!core.status.curtainColor) core.status.curtainColor = [0, 0, 0, 0];
    if (!color) color = [0, 0, 0, 0];
    if (color[3] == null) color[3] = 1;
    color[3] = core.clamp(color[3], 0, 1);

    if (time == 0) {
        // 直接变色
        core.clearMap('curtain');
        core.fillRect(
            'curtain',
            0,
            0,
            core._PX_,
            core._PY_,
            core.arrayToRGBA(color)
        );
        core.status.curtainColor = color;
        if (callback) callback();
        return;
    }

    this._setCurtain_animate(
        core.status.curtainColor,
        color,
        time,
        moveMode,
        callback
    );
};

control.prototype._setCurtain_animate = function (
    nowColor,
    color,
    time,
    moveMode,
    callback
) {
    time /= Math.max(core.status.replay.speed, 1);
    var per_time = 10,
        step = 0,
        steps = Math.floor(time / per_time);
    if (steps <= 0) steps = 1;
    var curr = nowColor;
    var moveFunc = core.applyEasing(moveMode);

    var cb = function () {
        core.status.curtainColor = curr;
        if (callback) callback();
    };
    var animate = setInterval(function () {
        step++;
        curr = [
            nowColor[0] + (color[0] - nowColor[0]) * moveFunc(step / steps),
            nowColor[1] + (color[1] - nowColor[1]) * moveFunc(step / steps),
            nowColor[2] + (color[2] - nowColor[2]) * moveFunc(step / steps),
            nowColor[3] + (color[3] - nowColor[3]) * moveFunc(step / steps)
        ];
        core.clearMap('curtain');
        core.fillRect(
            'curtain',
            0,
            0,
            core._PX_,
            core._PY_,
            core.arrayToRGBA(curr)
        );
        if (step == steps) {
            delete core.animateFrame.asyncId[animate];
            clearInterval(animate);
            cb();
        }
    }, per_time);

    core.animateFrame.lastAsyncId = animate;
    core.animateFrame.asyncId[animate] = cb;
};

////// 画面闪烁 //////
control.prototype.screenFlash = function (
    color,
    time,
    times,
    moveMode,
    callback
) {
    times = times || 1;
    time = time / 3;
    var nowColor = core.clone(core.status.curtainColor);
    core.setCurtain(color, time, moveMode, function () {
        core.setCurtain(nowColor, time * 2, moveMode, function () {
            if (times > 1)
                core.screenFlash(
                    color,
                    time * 3,
                    times - 1,
                    moveMode,
                    callback
                );
            else {
                if (callback) callback();
            }
        });
    });
};

////// 播放背景音乐 //////
control.prototype.playBgm = function (bgm, startTime) {
    // see src/module/fallback/audio.ts
};

////// 暂停背景音乐的播放 //////
control.prototype.pauseBgm = function () {
    // see src/module/fallback/audio.ts
};

////// 恢复背景音乐的播放 //////
control.prototype.resumeBgm = function (resumeTime) {
    // see src/module/fallback/audio.ts
};

////// 更改背景音乐的播放 //////
control.prototype.triggerBgm = function () {
    // see src/module/fallback/audio.ts
};

////// 播放音频 //////
control.prototype.playSound = function (sound, pitch, callback) {
    // see src/module/fallback/audio.ts
};

////// 停止所有音频 //////
control.prototype.stopSound = function (id) {
    // see src/module/fallback/audio.ts
};

////// 获得当前正在播放的所有（指定）音效的id列表 //////
control.prototype.getPlayingSounds = function (name) {
    // see src/module/fallback/audio.ts
};

////// 检查bgm状态 //////
control.prototype.checkBgm = function () {
    // see src/module/fallback/audio.ts
};

///// 设置屏幕放缩 //////
control.prototype.setDisplayScale = function (delta) {};

// ------ 状态栏，工具栏等相关 ------ //

////// 清空状态栏 //////
control.prototype.clearStatusBar = function () {
    // Deprecated.
};

////// 更新状态栏 //////
control.prototype.updateStatusBar = function (doNotCheckAutoEvents, immediate) {
    if (!core.isPlaying()) return;
    core.clearRouteFolding();
    if (immediate) {
        return this.updateStatusBar_update();
    }
    if (!doNotCheckAutoEvents) this.noAutoEvents = false;
    if (core.isReplaying()) return this.updateStatusBar_update();
    if (!core.control.updateNextFrame) {
        core.control.updateNextFrame = true;
        requestAnimationFrame(this.updateStatusBar_update);
    }
};

control.prototype.updateStatusBar_update = function () {
    // see src/plugin/game/ui.js
};

control.prototype._updateStatusBar_setToolboxIcon = function () {};

control.prototype.showStatusBar = function () {
    // see src/plugin/game/ui.js
};

control.prototype.hideStatusBar = function (showToolbox) {
    // see src/plugin/game/ui.js
};

////// 改变工具栏为按钮1-8 //////
control.prototype.setToolbarButton = function (useButton) {
    // Deprecated. Use CustomToolbar instead.
};

////// ------ resize处理 ------ //

////// 注册一个resize函数 //////
// name为名称，可供注销使用
// func可以是一个函数，或者是插件中的函数名；可以接受obj参数，详见resize函数。
control.prototype.registerResize = function (name, func) {
    this.unregisterResize(name);
    this.resizes.push({ name: name, func: func });
};

////// 注销一个resize函数 //////
control.prototype.unregisterResize = function (name) {
    this.resizes = this.resizes.filter(function (b) {
        return b.name != name;
    });
};

control.prototype._doResize = function (obj) {
    for (var i in this.resizes) {
        try {
            if (this.resizes[i].func.call(this, obj)) return true;
        } catch (e) {
            console.error(e);
            console.error(
                'ERROR in resizes[' +
                    this.resizes[i].name +
                    ']：已自动注销该项。'
            );
            this.unregisterResize(this.resizes[i].name);
        }
    }
    return false;
};

////// 屏幕分辨率改变后重新自适应 //////
control.prototype.resize = function () {
    if (main.mode === 'editor') return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // if (window.innerWidth >= 600) {
    //     // 横屏
    //     core.domStyle.isVertical = false;
    //     core.domStyle.availableScale = [];
    //     const maxScale = Math.min(width / core._PX_, height / core._PY_);
    //     [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5].forEach(function (v) {
    //         if (v < maxScale) {
    //             core.domStyle.availableScale.push(v);
    //         }
    //     });
    //     if (!core.domStyle.availableScale.includes(core.domStyle.scale)) {
    //         core.domStyle.scale = 1;
    //     }
    // } else {
    //     // 竖屏
    //     core.domStyle.isVertical = true;
    //     core.domStyle.scale = window.innerWidth / core._PX_;
    //     core.domStyle.availableScale = [];
    // }

    // if (!core.domStyle.isVertical) {
    //     const height = window.innerHeight;
    //     const width = window.innerWidth;
    //     const maxScale = Math.min(height / core._PY_, width / core._PX_);
    //     const target = Number((Math.floor(maxScale * 4) / 4).toFixed(2));
    //     core.domStyle.scale = target - 0.25;
    // }

    this._doResize({});
    this.setToolbarButton();
    core.updateStatusBar();
};

control.prototype._resize_gameGroup = function (obj) {
    // Deprecated.
};

control.prototype._resize_canvas = function (obj) {
    // Deprecated.
};

control.prototype._resize_toolBar = function (obj) {
    // Deprecated. Use CustomToolbar instead.
};

control.prototype._resize_tools = function (obj) {
    // Deprecated. Use CustomToolbar instead.
};
