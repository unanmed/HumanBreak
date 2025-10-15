///<reference path="../../src/types/declaration/core.d.ts" />

/*
actions.js：用户交互的事件的处理
键盘、鼠标、触摸屏事件相关
 */

'use strict';

function actions() {
    this._init();
    this._HX_ = core._HALF_WIDTH_;
    this._HY_ = core._HALF_HEIGHT_;
    this._out = function (x) {
        return x < this._HX_ - 2 || this._HX_ + 2 < x;
    };
    this.LAST = core._WIDTH_ - 1;
}

actions.prototype._init = function () {
    this.actions = {};
    // --- onkeyDown注册
    this.registerAction(
        'onkeyDown',
        '_sys_checkReplay',
        this._sys_checkReplay,
        100
    );
    this.registerAction('onkeyDown', '_sys_onkeyDown', this._sys_onkeyDown, 0);
    // --- onkeyUp注册
    this.registerAction(
        'onkeyUp',
        '_sys_onkeyUp_replay',
        this._sys_onkeyUp_replay,
        100
    );
    this.registerAction('onkeyUp', '_sys_onkeyUp', this._sys_onkeyUp, 0);
    // --- pressKey注册
    this.registerAction(
        'pressKey',
        '_sys_checkReplay',
        this._sys_checkReplay,
        100
    );
    this.registerAction('pressKey', '_sys_pressKey', this._sys_pressKey, 0);
    // --- keyDown注册
    this.registerAction(
        'keyDown',
        '_sys_checkReplay',
        this._sys_checkReplay,
        100
    );
    this.registerAction(
        'keyDown',
        '_sys_keyDown_lockControl',
        this._sys_keyDown_lockControl,
        50
    );
    this.registerAction('keyDown', '_sys_keyDown', this._sys_keyDown, 0);
    // --- keyUp注册
    this.registerAction(
        'keyUp',
        '_sys_keyUp_replay',
        this._sys_keyUp_replay,
        100
    );
    this.registerAction(
        'keyUp',
        '_sys_keyUp_lockControl',
        this._sys_keyUp_lockControl,
        50
    );
    this.registerAction('keyUp', '_sys_keyUp', this._sys_keyUp, 0);
    // --- ondown注册
    this.registerAction(
        'ondown',
        '_sys_checkReplay',
        this._sys_checkReplay,
        100
    );
    this.registerAction(
        'ondown',
        '_sys_ondown_lockControl',
        this._sys_ondown_lockControl,
        30
    );
    this.registerAction('ondown', '_sys_ondown', this._sys_ondown, 0);
    // --- onmove注册
    this.registerAction(
        'onmove',
        '_sys_checkReplay',
        this._sys_checkReplay,
        100
    );
    this.registerAction(
        'onmove',
        '_sys_onmove_choices',
        this._sys_onmove_choices,
        30
    );
    this.registerAction('onmove', '_sys_onmove', this._sys_onmove, 0);
    // --- onup注册
    this.registerAction('onup', '_sys_checkReplay', this._sys_checkReplay, 100);
    this.registerAction('onup', '_sys_onup', this._sys_onup, 0);
    // --- onclick已废弃，将视为ondown
    // --- onmousewheel注册
    this.registerAction(
        'onmousewheel',
        '_sys_onmousewheel',
        this._sys_onmousewheel,
        0
    );
    // --- keyDownCtrl注册
    this.registerAction(
        'keyDownCtrl',
        '_sys_keyDownCtrl',
        this._sys_keyDownCtrl,
        0
    );
    // --- longClick注册
    this.registerAction(
        'longClick',
        '_sys_longClick_lockControl',
        this._sys_longClick_lockControl,
        50
    );
};

//////  注册一个用户交互行为 //////
/*
 * 此函数将注册一个用户交互行为。
 * action：要注册的交互类型，如 ondown, onup, keyDown 等等。
 * name：你的自定义名称，可被注销使用；同名重复注册将后者覆盖前者。
 * func：执行函数。
 * priority：优先级；优先级高的将会被执行。此项可不填，默认为0。
 * 返回：如果func返回true，则不会再继续执行其他的交互函数；否则会继续执行其他的交互函数。
 */
actions.prototype.registerAction = function (action, name, func, priority) {
    if (!name || !func) return;
    // 将onclick视为ondown处理
    if (action == 'onclick') action = 'ondown';
    priority = priority || 0;
    if (!this.actions[action]) {
        this.actions[action] = [];
    }
    this.unregisterAction(action, name);
    this.actions[action].push({
        action: action,
        name: name,
        func: func,
        priority: priority
    });
    this.actions[action] = this.actions[action].sort(function (a, b) {
        return b.priority - a.priority;
    });
};

////// 注销一个用户交互行为 //////
actions.prototype.unregisterAction = function (action, name) {
    // 将onclick视为ondown处理
    if (action == 'onclick') action = 'ondown';
    if (!this.actions[action]) return;
    this.actions[action] = this.actions[action].filter(function (x) {
        return x.name != name;
    });
};

////// 执行一个用户交互行为 //////
actions.prototype.doRegisteredAction = function (action, ...params) {
    var actions = this.actions[action];
    if (!actions) return false;
    for (var i = 0; i < actions.length; ++i) {
        try {
            const res = actions[i].func.apply(this, params);
            if (res) return true;
        } catch (e) {
            console.error(e);
            console.error('ERROR in actions[' + actions[i].name + '].');
        }
    }
    return false;
};

actions.prototype._checkReplaying = function () {
    if (
        core.isReplaying() &&
        [
            'save',
            'book',
            'book-detail',
            'viewMaps',
            'toolbox',
            'equipbox',
            'text'
        ].indexOf(core.status.event.id) < 0
    )
        return true;
    return false;
};

////// 检查是否在录像播放中，如果是，则停止交互
actions.prototype._sys_checkReplay = function () {
    if (this._checkReplaying()) return true;
};

////// 检查左手模式
actions.prototype.__checkLeftHandPrefer = function (e) {
    return e;
};

////// 按下某个键时 //////
actions.prototype.onkeyDown = function (e) {
    this.doRegisteredAction('onkeyDown', this.__checkLeftHandPrefer(e));
};

actions.prototype._sys_onkeyDown = function (e) {
    core.status.holdingKeys = core.status.holdingKeys || [];
    if (e.keyCode == 17) core.status.ctrlDown = true;
    this.keyDown(e.keyCode);
};

////// 放开某个键时 //////
actions.prototype.onkeyUp = function (e) {
    this.doRegisteredAction('onkeyUp', this.__checkLeftHandPrefer(e));
};

actions.prototype._sys_onkeyUp_replay = function (e) {
    if (this._checkReplaying()) {
        if (e.keyCode == 27)
            // ESCAPE
            core.stopReplay();
        else if (e.keyCode == 90)
            // Z
            core.speedDownReplay();
        else if (e.keyCode == 67)
            // C
            core.speedUpReplay();
        else if (e.keyCode == 32)
            // SPACE
            core.triggerReplay();
        else if (e.keyCode == 65)
            // A
            core.rewindReplay();
        else if (e.keyCode == 83) {
            // S
            const { saveSave, mainUIController, MAIN_WIDTH, MAIN_HEIGHT } =
                Mota.require('@user/client-modules');
            saveSave(mainUIController, [0, 0, MAIN_WIDTH, MAIN_HEIGHT]);
        } else if (e.keyCode == 88)
            // X
            core.control._replay_book();
        else if (e.keyCode == 33 || e.keyCode == 34)
            // PgUp/PgDn
            core.control._replay_viewMap();
        else if (e.keyCode == 78)
            // N
            core.stepReplay();
        else if (e.keyCode == 66)
            // B
            core.ui._drawStatistics();
        else if (e.keyCode >= 49 && e.keyCode <= 51)
            // 1-3
            core.setReplaySpeed(e.keyCode - 48);
        else if (e.keyCode == 52)
            // 4
            core.setReplaySpeed(6);
        else if (e.keyCode == 53)
            // 5
            core.setReplaySpeed(12);
        else if (e.keyCode == 54)
            // 6
            core.setReplaySpeed(24);
        return true;
    }
};

actions.prototype._sys_onkeyUp = function (e) {
    var isArrow = { 37: true, 38: true, 39: true, 40: true }[e.keyCode];
    if (isArrow && !core.status.lockControl) {
        for (var ii = 0; ii < core.status.holdingKeys.length; ii++) {
            if (core.status.holdingKeys[ii] === e.keyCode) {
                core.status.holdingKeys = core.status.holdingKeys
                    .slice(0, ii)
                    .concat(core.status.holdingKeys.slice(ii + 1));
                if (
                    ii === core.status.holdingKeys.length &&
                    core.status.holdingKeys.length !== 0
                )
                    core.pressKey(core.status.holdingKeys.slice(-1)[0]);
                break;
            }
        }
        if (e.preventDefault) e.preventDefault();
        this.keyUp(e.keyCode, e.altKey);
    } else {
        if (e.keyCode == 17) core.status.ctrlDown = false;
        this.keyUp(e.keyCode, e.altKey);
    }
};

////// 按住某个键时 //////
actions.prototype.pressKey = function (keyCode) {
    this.doRegisteredAction('pressKey', keyCode);
};

actions.prototype._sys_pressKey = function (keyCode) {
    if (keyCode === core.status.holdingKeys.slice(-1)[0]) {
        this.keyDown(keyCode);
        window.setTimeout(function () {
            core.pressKey(keyCode);
        }, 30);
    }
};

////// 根据按下键的code来执行一系列操作 //////
actions.prototype.keyDown = function (keyCode) {
    this.doRegisteredAction('keyDown', keyCode);
};

actions.prototype._sys_keyDown_lockControl = function (keyCode) {
    if (!core.status.lockControl) return false;
    // Ctrl跳过对话
    if (keyCode == 17) {
        this.keyDownCtrl();
        return true;
    }
    switch (core.status.event.id) {
        case 'action':
            this._keyDownAction(keyCode);
            break;
        case 'viewMaps':
            this._keyDownViewMaps(keyCode);
            break;
        case 'save':
        case 'load':
        case 'replayLoad':
        case 'replayRemain':
        case 'replaySince':
            this._keyDownSL(keyCode);
            break;
        case 'selectShop':
        case 'switchs':
        case 'switchs-sounds':
        case 'switchs-display':
        case 'switchs-action':
        case 'notes':
        case 'settings':
        case 'syncSave':
        case 'syncSelect':
        case 'localSaveSelect':
        case 'storageRemove':
        case 'replay':
        case 'gameInfo':
            this._keyDownChoices(keyCode);
            break;
        case 'cursor':
            this._keyDownCursor(keyCode);
            break;
    }
    return true;
};

actions.prototype._sys_keyDown = function (keyCode) {
    return true;
};

////// 根据放开键的code来执行一系列操作 //////
actions.prototype.keyUp = function (keyCode, altKey, fromReplay) {
    this.doRegisteredAction('keyUp', keyCode, altKey, fromReplay);
};

actions.prototype._sys_keyUp_replay = function (keyCode, altKey, fromReplay) {
    if (!fromReplay && this._checkReplaying()) return true;
};

actions.prototype._sys_keyUp_lockControl = function (keyCode, altKey) {
    if (!core.status.lockControl) return false;

    var ok = function () {
        return (
            keyCode == 27 ||
            keyCode == 88 ||
            keyCode == 13 ||
            keyCode == 32 ||
            keyCode == 67
        );
    };

    core.status.holdingKeys = [];
    switch (core.status.event.id) {
        case 'action':
            this._keyUpAction(keyCode);
            break;
        case 'about':
            ok() && core.closePanel();
            break;
        case 'help':
            ok() && core.closePanel();
            break;
        case 'viewMaps':
            this._keyUpViewMaps(keyCode);
            break;
        case 'selectShop':
            this._keyUpQuickShop(keyCode);
            break;
        case 'save':
        case 'load':
        case 'replayLoad':
        case 'replayRemain':
        case 'replaySince':
            this._keyUpSL(keyCode);
            break;
        case 'keyBoard':
            ok() && core.closePanel();
            break;
        case 'switchs':
            this._keyUpSwitchs(keyCode);
            break;
        case 'switchs-sounds':
            this._keyUpSwitchs_sounds(keyCode);
            break;
        case 'switchs-display':
            this._keyUpSwitchs_display(keyCode);
            break;
        case 'switchs-action':
            this._keyUpSwitchs_action(keyCode);
            break;
        case 'settings':
            this._keyUpSettings(keyCode);
            break;
        case 'notes':
            this._keyUpNotes(keyCode);
            break;
        case 'syncSave':
            this._keyUpSyncSave(keyCode);
            break;
        case 'syncSelect':
            this._keyUpSyncSelect(keyCode);
            break;
        case 'localSaveSelect':
            this._keyUpLocalSaveSelect(keyCode);
            break;
        case 'storageRemove':
            this._keyUpStorageRemove(keyCode);
            break;
        case 'cursor':
            this._keyUpCursor(keyCode);
            break;
        case 'replay':
            this._keyUpReplay(keyCode);
            break;
        case 'gameInfo':
            this._keyUpGameInfo(keyCode);
            break;
        case 'centerFly':
            this._keyUpCenterFly(keyCode);
            break;
    }
    return true;
};

actions.prototype._sys_keyUp = function (keyCode, altKey) {
    if (!core.status.played) return true;
    if (core.status.automaticRoute && core.status.automaticRoute.autoHeroMove) {
        core.stopAutomaticRoute();
    }
    core.status.heroStop = true;
    return true;
};

////// 点击（触摸）事件按下时 //////
actions.prototype.ondown = function (loc) {
    var x = Math.floor(loc.x / loc.size),
        y = Math.floor(loc.y / loc.size);
    var px = Math.floor(loc.x / core.domStyle.scale),
        py = Math.floor(loc.y / core.domStyle.scale);
    this.doRegisteredAction('ondown', x, y, px, py);
};

actions.prototype._sys_ondown_lockControl = function (x, y, px, py) {
    if (core.status.played && !core.status.lockControl) return false;

    switch (core.status.event.id) {
        case 'centerFly':
            this._clickCenterFly(x, y, px, py);
            break;
        case 'viewMaps':
            this._clickViewMaps(x, y, px, py);
            break;
        case 'switchs':
            this._clickSwitchs(x, y, px, py);
            break;
        case 'switchs-sounds':
            this._clickSwitchs_sounds(x, y, px, py);
            break;
        case 'switchs-display':
            this._clickSwitchs_display(x, y, px, py);
            break;
        case 'switchs-action':
            this._clickSwitchs_action(x, y, px, py);
            break;
        case 'settings':
            this._clickSettings(x, y, px, py);
            break;
        case 'selectShop':
            this._clickQuickShop(x, y, px, py);
            break;
        case 'toolbox':
            this._clickToolbox(x, y, px, py);
            break;
        case 'save':
        case 'load':
        case 'replayLoad':
        case 'replayRemain':
        case 'replaySince':
            this._clickSL(x, y, px, py);
            break;
        case 'confirmBox':
            this._clickConfirmBox(x, y, px, py);
            break;
        case 'keyBoard':
            this._clickKeyBoard(x, y, px, py);
            break;
        case 'action':
            this._clickAction(x, y, px, py);
            break;
        case 'notes':
            this._clickNotes(x, y, px, py);
            break;
        case 'syncSave':
            this._clickSyncSave(x, y, px, py);
            break;
        case 'syncSelect':
            this._clickSyncSelect(x, y, px, py);
            break;
        case 'localSaveSelect':
            this._clickLocalSaveSelect(x, y, px, py);
            break;
        case 'storageRemove':
            this._clickStorageRemove(x, y, px, py);
            break;
        case 'cursor':
            this._clickCursor(x, y, px, py);
            break;
        case 'replay':
            this._clickReplay(x, y, px, py);
            break;
        case 'gameInfo':
            this._clickGameInfo(x, y, px, py);
            break;
    }

    // --- 长按判定
    if (core.timeout.onDownTimeout == null) {
        core.timeout.onDownTimeout = setTimeout(function () {
            if (core.interval.onDownInterval == null) {
                core.interval.onDownInterval = setInterval(function () {
                    if (!core.actions.longClick(x, y, px, py)) {
                        clearInterval(core.interval.onDownInterval);
                        core.interval.onDownInterval = null;
                    }
                }, 40);
            }
        }, 500);
    }
    return true;
};

actions.prototype._sys_ondown = function (x, y, px, py) {
    if (core.status.lockControl) return false;
    core.status.downTime = new Date();
    var pos = {
        x: Math.floor((px + core.bigmap.offsetX) / 32),
        y: Math.floor((py + core.bigmap.offsetY) / 32)
    };

    core.status.stepPostfix = [];
    core.status.stepPostfix.push(pos);

    clearTimeout(core.timeout.onDownTimeout);
    core.timeout.onDownTimeout = null;
};

////// 当在触摸屏上滑动时 //////
actions.prototype.onmove = function (loc) {
    var x = Math.floor(loc.x / loc.size),
        y = Math.floor(loc.y / loc.size);
    var px = Math.floor(loc.x / core.domStyle.scale),
        py = Math.floor(loc.y / core.domStyle.scale);
    this.doRegisteredAction('onmove', x, y, px, py);
};

actions.prototype._sys_onmove_choices = function (x, y, px, py) {
    if (!core.status.lockControl) return false;

    switch (core.status.event.id) {
        case 'action':
            if (core.status.event.data.type == 'choices') {
                this._onMoveChoices(x, y);
                return true;
            }
            if (core.status.event.data.type == 'confirm') {
                this._onMoveConfirmBox(x, y, px, py);
                return true;
            }
            break;
        case 'selectShop':
        case 'switchs':
        case 'switchs-sounds':
        case 'switchs-display':
        case 'switchs-action':
        case 'notes':
        case 'settings':
        case 'syncSave':
        case 'syncSelect':
        case 'localSaveSelect':
        case 'storageRemove':
        case 'replay':
        case 'gameInfo':
            this._onMoveChoices(x, y);
            return true;
        case 'confirmBox':
            this._onMoveConfirmBox(x, y, px, py);
            return true;
        default:
            break;
    }
    return false;
};

actions.prototype._sys_onmove = function (x, y, px, py) {
    if (core.status.lockControl) return false;

    clearTimeout(core.timeout.onDownTimeout);
    core.timeout.onDownTimeout = null;

    if ((core.status.stepPostfix || []).length > 0) {
        var pos = {
            x: Math.floor((px + core.bigmap.offsetX) / 32),
            y: Math.floor((py + core.bigmap.offsetY) / 32)
        };
        var pos0 = core.status.stepPostfix[core.status.stepPostfix.length - 1];
        var directionDistance = [
            pos.y - pos0.y,
            pos0.x - pos.x,
            pos0.y - pos.y,
            pos.x - pos0.x
        ];
        var max = 0,
            index = 4;
        for (var ii = 0; ii < 4; ii++) {
            if (directionDistance[ii] > max) {
                index = ii;
                max = directionDistance[ii];
            }
        }
        pos = [
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            false
        ][index];
        if (pos) {
            pos.x += pos0.x;
            pos.y += pos0.y;
            core.status.stepPostfix.push(pos);
        }
    }
    return true;
};

////// 当点击（触摸）事件放开时 //////
actions.prototype.onup = function (loc) {
    var x = Math.floor(loc.x / loc.size),
        y = Math.floor(loc.y / loc.size);
    var px = Math.floor(loc.x / core.domStyle.scale),
        py = Math.floor(loc.y / core.domStyle.scale);
    this.doRegisteredAction('onup', x, y, px, py);
};

actions.prototype._sys_onup = function (x, y, px, py) {
    clearTimeout(core.timeout.onDownTimeout);
    core.timeout.onDownTimeout = null;
    clearInterval(core.interval.onDownInterval);
    core.interval.onDownInterval = null;

    if ((core.status.stepPostfix || []).length == 0) return false;

    var stepPostfix = [];
    var direction = {
        0: { 1: 'down', '-1': 'up' },
        '-1': { 0: 'left' },
        1: { 0: 'right' }
    };
    for (var ii = 1; ii < core.status.stepPostfix.length; ii++) {
        var pos0 = core.status.stepPostfix[ii - 1];
        var pos = core.status.stepPostfix[ii];
        stepPostfix.push({
            direction: direction[pos.x - pos0.x][pos.y - pos0.y],
            x: pos.x,
            y: pos.y
        });
    }
    var posx = core.status.stepPostfix[0].x;
    var posy = core.status.stepPostfix[0].y;
    core.status.stepPostfix = [];

    // 长按
    if (
        !core.status.lockControl &&
        stepPostfix.length == 0 &&
        core.status.downTime != null &&
        new Date() - core.status.downTime >= 1000
    ) {
        core.actions.longClick(x, y, px, py);
    } else {
        //posx,posy是寻路的目标点,stepPostfix是后续的移动
        core.setAutomaticRoute(posx, posy, stepPostfix);
    }
    core.status.downTime = null;
    return true;
};

////// 获得点击事件相对左上角的坐标 //////
actions.prototype._getClickLoc = function (x, y, isClient = false) {
    var size = 32 * core.domStyle.scale;

    if (!isClient) {
        return { x, y, size };
    } else {
        const ele = core.dom.gameDraw;
        const left = ele.offsetLeft;
        const top = ele.offsetTop;
        return { x: x - left, y: y - top, size };
    }
};

////// 滑动鼠标滚轮时的操作 //////
actions.prototype.onmousewheel = function (direct) {
    this.doRegisteredAction('onmousewheel', direct);
};

actions.prototype._sys_onmousewheel = function (direct) {
    // 向下滚动是 -1 ,向上是 1

    if (this._checkReplaying()) {
        // 滚轮控制速度
        if (direct == 1) core.speedUpReplay();
        if (direct == -1) core.speedDownReplay();
        return;
    }

    // 存读档
    if (
        core.status.lockControl &&
        (core.status.event.id == 'save' || core.status.event.id == 'load')
    ) {
        var index =
            core.status.event.data.page * 10 + core.status.event.data.offset;
        if (direct == 1) core.ui._drawSLPanel(index - 10);
        if (direct == -1) core.ui._drawSLPanel(index + 10);
        return;
    }

    // 浏览地图
    if (core.status.lockControl && core.status.event.id == 'viewMaps') {
        if (direct == 1)
            this._clickViewMaps(
                this._HX_,
                this._HY_ - 3,
                core._PX_ / 2,
                (core._PY_ / 5) * 1.5
            );
        if (direct == -1)
            this._clickViewMaps(
                this._HX_,
                this._HY_ + 3,
                core._PX_ / 2,
                (core._PY_ / 5) * 3.5
            );
        return;
    }

    // wait事件
    if (
        core.status.lockControl &&
        core.status.event.id == 'action' &&
        core.status.event.data.type == 'wait'
    ) {
        var timeout =
            Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
        core.setFlag('type', 0);
        var keycode = direct == 1 ? 33 : 34;
        core.setFlag('keycode', keycode);
        core.setFlag('timeout', timeout);
        var executed = core.events.__action_wait_afterGet(
            core.status.event.data.current
        );
        if (executed || !core.status.event.data.current.forceChild) {
            core.status.route.push('input:' + (1e8 * timeout + keycode));
            clearTimeout(core.status.event.interval);
            delete core.status.event.timeout;
            core.doAction();
        }
        return;
    }
};

////// 长按Ctrl键时 //////
actions.prototype.keyDownCtrl = function () {
    this.doRegisteredAction('keyDownCtrl');
};

actions.prototype._sys_keyDownCtrl = function () {
    if (
        core.status.event.id == 'action' &&
        core.status.event.data.type == 'text'
    ) {
        this._clickAction_text();
        return true;
    }
    if (
        core.status.event.id == 'action' &&
        core.status.event.data.type == 'sleep' &&
        !core.status.event.data.current.noSkip
    ) {
        if (core.timeout.sleepTimeout && !core.hasAsync()) {
            clearTimeout(core.timeout.sleepTimeout);
            core.timeout.sleepTimeout = null;
            core.doAction();
        }
        return true;
    }
};

////// 长按 //////
actions.prototype.longClick = function (x, y, px, py) {
    if (!core.isPlaying()) return false;
    return this.doRegisteredAction('longClick', x, y, px, py);
};

actions.prototype._sys_longClick_lockControl = function (x, y, px, py) {
    if (!core.status.lockControl) return false;
    if (
        core.status.event.id == 'action' &&
        core.status.event.data.type == 'text'
    ) {
        const [now, next] = core.status.event.data.list;
        if (next?.type !== 'text') {
            const Store = Mota.require('@user/client-modules').TextboxStore;
            const textbox = Store.get(now.textbox ?? 'main-textbox');
            textbox.hide();
        }
        core.doAction();
        return true;
    }
    // 长按SL上下页快速翻页
    if (
        ['save', 'load', 'replayLoad', 'replayRemain', 'replaySince'].indexOf(
            core.status.event.id
        ) >= 0
    ) {
        if (
            [
                this._HX_ - 2,
                this._HX_ - 3,
                this._HX_ + 2,
                this._HX_ + 3
            ].indexOf(x) >= 0 &&
            y === core._HEIGHT_ - 1
        ) {
            this._clickSL(x, y);
            return true;
        }
    }
    // 长按可以跳过等待事件
    if (
        core.status.event.id == 'action' &&
        core.status.event.data.type == 'sleep' &&
        !core.status.event.data.current.noSkip
    ) {
        if (core.timeout.sleepTimeout && !core.hasAsync()) {
            clearTimeout(core.timeout.sleepTimeout);
            core.timeout.sleepTimeout = null;
            core.doAction();
            return true;
        }
    }
    return false;
};

/////////////////// 在某个界面时的按键点击效果 ///////////////////

actions.prototype._getChoicesTopIndex = function (length) {
    // Deprecated.
};

// 数字键快速选择选项
actions.prototype._selectChoices = function (length, keycode, callback) {
    // Deprecated.
};

// 上下键调整选项
actions.prototype._keyDownChoices = function (keycode) {
    // Deprecated.
};

// 移动光标
actions.prototype._onMoveChoices = function (x, y) {
    // Deprecated.
};

////// 点击中心对称飞行器时
actions.prototype._clickCenterFly = function (x, y) {
    var posX = core.status.event.data.posX,
        posY = core.status.event.data.posY;
    core.ui.closePanel();
    if (x == posX && y == posY) {
        if (core.canUseItem('centerFly')) {
            core.useItem('centerFly');
        } else {
            core.playSound('操作失败');
            core.drawTip(
                '当前不能使用' + core.material.items['centerFly'].name,
                'centerFly'
            );
        }
    }
};

actions.prototype._keyUpCenterFly = function (keycode) {
    core.ui.closePanel();
    if (keycode == 51 || keycode == 13 || keycode == 32 || keycode == 67) {
        if (core.canUseItem('centerFly')) {
            core.useItem('centerFly');
        } else {
            core.playSound('操作失败');
            core.drawTip(
                '当前不能使用' + core.material.items['centerFly'].name,
                'centerFly'
            );
        }
    }
};

////// 点击确认框时 //////
actions.prototype._clickConfirmBox = function (x, y, px, py) {
    if (
        px >= core._PX_ / 2 - 70 &&
        px <= core._PX_ / 2 - 10 &&
        py >= core._PY_ / 2 &&
        py <= core._PY_ / 2 + 64 &&
        core.status.event.data.yes
    )
        core.status.event.data.yes();
    if (
        px >= core._PX_ / 2 + 10 &&
        px <= core._PX_ / 2 + 70 &&
        py >= core._PY_ / 2 &&
        py <= core._PY_ / 2 + 64 &&
        core.status.event.data.no
    )
        core.status.event.data.no();
};

////// 键盘操作确认框时 //////
actions.prototype._keyUpConfirmBox = function (keycode) {};

////// 鼠标在确认框上移动时 //////
actions.prototype._onMoveConfirmBox = function (x, y, px, py) {};

actions.prototype._clickAction_text = function () {
    // 正在淡入淡出的话不执行
    if (core.status.event.animateUI) return;

    const Store = Mota.require('@user/client-modules').TextboxStore;
    const id = core.events.nowTextbox ?? 'main-textbox';
    const store = Store.get(id);
    // 打字机效果显示全部文字
    if (store.typing) {
        store.endType();
        return;
    } else {
        store.hide();
    }

    core.doAction();
};

////// 自定义事件时的点击操作 //////
actions.prototype._clickAction = function (x, y, px, py) {
    if (core.status.event.data.type == 'text') {
        return this._clickAction_text();
    }

    if (core.status.event.data.type == 'wait') {
        var timeout =
            Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
        core.setFlag('type', 1);
        core.setFlag('x', x);
        core.setFlag('y', y);
        core.setFlag('px', px);
        core.setFlag('py', py);
        core.setFlag('timeout', timeout);
        var executed = core.events.__action_wait_afterGet(
            core.status.event.data.current
        );
        if (executed || !core.status.event.data.current.forceChild) {
            core.status.route.push(
                'input:' + (1e8 * timeout + 1000000 + 1000 * px + py)
            );
            clearTimeout(core.status.event.interval);
            delete core.status.event.timeout;
            core.doAction();
        }
        return;
    }

    if (core.status.event.data.type == 'choices') {
        // Deprecated.
        return;
    }

    if (core.status.event.data.type == 'confirm') {
        // Deprecated.
        return;
    }
};

////// 自定义事件时，按下某个键的操作 //////
actions.prototype._keyDownAction = function (keycode) {};

////// 自定义事件时，放开某个键的操作 //////
actions.prototype._keyUpAction = function (keycode) {
    if (
        core.status.event.data.type == 'text' &&
        (keycode == 13 || keycode == 32 || keycode == 67)
    ) {
        return this._clickAction_text();
    }
    if (core.status.event.data.type == 'wait') {
        var timeout =
            Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
        core.setFlag('type', 0);
        core.setFlag('keycode', keycode);
        core.setFlag('timeout', timeout);
        var executed = core.events.__action_wait_afterGet(
            core.status.event.data.current
        );
        if (executed || !core.status.event.data.current.forceChild) {
            core.status.route.push('input:' + (1e8 * timeout + keycode));
            clearTimeout(core.status.event.interval);
            delete core.status.event.timeout;
            core.doAction();
        }
        return;
    }
    if (core.status.event.data.type == 'choices') {
        var data = core.status.event.data.current;
        var choices = data.choices;
        if (choices.length > 0) {
            this._selectChoices(choices.length, keycode, this._clickAction);
        }
        return;
    }
    if (
        core.status.event.data.type == 'confirm' &&
        (keycode == 13 || keycode == 32 || keycode == 67)
    ) {
        var timeout =
            Math.max(0, core.status.event.timeout - new Date().getTime()) || 0;
        delete core.status.event.timeout;
        core.setFlag('timeout', timeout);
        core.status.route.push(
            'choices:' + (100 * timeout + core.status.event.selection)
        );
        if (core.status.event.selection == 0)
            core.insertAction(core.status.event.ui.yes);
        else core.insertAction(core.status.event.ui.no);
        core.doAction();
        return;
    }
};

////// 查看地图界面时的点击操作 //////
actions.prototype._clickViewMaps = function (x, y, px, py) {
    if (core.status.event.data == null) {
        core.ui._drawViewMaps(core.floorIds.indexOf(core.status.floorId));
        return;
    }
    var now = core.floorIds.indexOf(core.status.floorId);
    var index = core.status.event.data.index;
    var cx = core.status.event.data.x,
        cy = core.status.event.data.y;
    var floorId = core.floorIds[index],
        mh = core.floors[floorId].height;
    var perpx = core._PX_ / 5,
        cornerpx = (perpx * 3) / 4,
        perpy = core._PY_ / 5,
        cornerpy = (perpy * 3) / 4;

    if (px <= cornerpx && py <= cornerpy) {
        core.status.event.data.damage = !core.status.event.data.damage;
        core.playSound('光标移动');
        core.ui._drawViewMaps(index, cx, cy);
        return;
    }
    if (px <= cornerpx && py >= core._PY_ - cornerpy) {
        if (core.markedFloorIds[floorId]) delete core.markedFloorIds[floorId];
        else core.markedFloorIds[floorId] = true;
        core.playSound('光标移动');
        core.ui._drawViewMaps(index, cx, cy);
        return;
    }
    if (px >= core._PX_ - cornerpx && py <= cornerpy) {
        core.status.event.data.all = !core.status.event.data.all;
        core.playSound('光标移动');
        core.ui._drawViewMaps(index, cx, cy);
        return;
    }

    if (
        px >= perpx &&
        px <= core._PX_ - perpx &&
        py <= perpy &&
        !core.status.event.data.all &&
        mh > core._HEIGHT_
    ) {
        core.playSound('光标移动');
        core.ui._drawViewMaps(index, cx, cy - 1);
        return;
    }
    if (
        px >= perpx &&
        px <= core._PX_ - perpx &&
        py >= core._PY_ - perpy &&
        !core.status.event.data.all &&
        mh > core._HEIGHT_
    ) {
        core.playSound('光标移动');
        core.ui._drawViewMaps(index, cx, cy + 1);
        return;
    }
    if (px <= perpx && py >= perpy && py <= core._PY_ - perpy) {
        core.playSound('光标移动');
        core.ui._drawViewMaps(index, cx - 1, cy);
        return;
    }
    if (px >= core._PX_ - perpx && py >= perpy && py <= core._PY_ - perpy) {
        core.playSound('光标移动');
        core.ui._drawViewMaps(index, cx + 1, cy);
        return;
    }

    if (
        py <= 2 * perpy &&
        (mh == core._HEIGHT_ || (px >= perpx && px <= core._PX_ - perpx))
    ) {
        core.playSound('光标移动');
        index++;
        while (
            index < core.floorIds.length &&
            index != now &&
            (core.status.maps[core.floorIds[index]].cannotViewMap ||
                core.status.maps[core.floorIds[index]].deleted)
        )
            index++;
        if (index < core.floorIds.length) core.ui._drawViewMaps(index);
        return;
    }
    if (
        py >= 3 * perpy &&
        (mh == core._HEIGHT_ || (px >= perpx && px <= core._PX_ - perpx))
    ) {
        core.playSound('光标移动');
        index--;
        while (
            index >= 0 &&
            index != now &&
            (core.status.maps[core.floorIds[index]].cannotViewMap ||
                core.status.maps[core.floorIds[index]].deleted)
        )
            index--;
        if (index >= 0) core.ui._drawViewMaps(index);
        return;
    }
    if (
        px >= perpx &&
        px <= core._PX_ - perpx &&
        py >= perpy * 2 &&
        py <= perpy * 3
    ) {
        core.clearMap('data');
        core.playSound('取消');
        core.ui.closePanel();
        return;
    }
};

////// 查看地图界面时，按下某个键的操作 //////
actions.prototype._keyDownViewMaps = function (keycode) {
    if (core.status.event.data == null) return;

    var floorId = core.floorIds[core.status.event.data.index],
        mh = core.floors[floorId].height;

    if (keycode == 38 || keycode == 33)
        this._clickViewMaps(
            this._HX_,
            this._HY_ - 3,
            core._PX_ / 2,
            (core._PY_ / 5) * 1.5
        );
    if (keycode == 40 || keycode == 34)
        this._clickViewMaps(
            this._HX_,
            this._HY_ + 3,
            core._PX_ / 2,
            (core._PY_ / 5) * 3.5
        );
    if (keycode == 87 && mh > core._HEIGHT_)
        this._clickViewMaps(this._HX_, 0, core._PX_ / 2, 1);
    if (keycode == 65) this._clickViewMaps(0, this._HY_, 1, core._PY_ / 2);
    if (keycode == 83 && mh > core._HEIGHT_)
        this._clickViewMaps(
            this._HX_,
            core._HEIGHT_ - 1,
            core._PX_ / 2,
            core._PY_ - 1
        );
    if (keycode == 68)
        this._clickViewMaps(
            core._WIDTH_ - 1,
            this._HY_,
            core._PX_,
            core._PY_ / 2 - 1
        );
    return;
};

////// 查看地图界面时，放开某个键的操作 //////
actions.prototype._keyUpViewMaps = function (keycode) {
    if (core.status.event.data == null) {
        core.ui._drawViewMaps(core.floorIds.indexOf(core.status.floorId));
        return;
    }
    var floorId = core.floorIds[core.status.event.data.index];

    if (
        keycode == 27 ||
        keycode == 13 ||
        keycode == 32 ||
        (!core.isReplaying() && keycode == 67)
    ) {
        core.clearMap('data');
        core.playSound('取消');
        core.ui.closePanel();
        return;
    }
    if (keycode == 86) {
        core.status.event.data.damage = !core.status.event.data.damage;
        core.playSound('光标移动');
        core.ui._drawViewMaps(core.status.event.data);
        return;
    }
    if (keycode == 90) {
        core.status.event.data.all = !core.status.event.data.all;
        core.playSound('光标移动');
        core.ui._drawViewMaps(core.status.event.data);
        return;
    }
    if (keycode == 66) {
        if (core.markedFloorIds[floorId]) delete core.markedFloorIds[floorId];
        else core.markedFloorIds[floorId] = true;
        core.playSound('光标移动');
        core.ui._drawViewMaps(core.status.event.data);
        return;
    }
    if (keycode == 88 || (core.isReplaying() && keycode == 67)) {
        if (core.isReplaying()) {
            core.control._replay_book();
        } else {
            core.openBook(false);
        }
        return;
    }
    if (keycode == 71 && !core.isReplaying()) {
        core.useFly(false);
        return;
    }
    return;
};

////// 快捷商店界面时的点击操作 //////
actions.prototype._clickQuickShop = function (x, y) {
    const shop = Mota.require('@user/legacy-plugin-data');
    var shopIds = shop.listShopIds();
    if (this._out(x)) return;
    var topIndex =
        this._HY_ -
        Math.floor(shopIds.length / 2) +
        (core.status.event.ui.offset || 0);
    if (y >= topIndex && y < topIndex + shopIds.length) {
        var shopId = shopIds[y - topIndex];
        if (!shop.canOpenShop(shopId)) {
            core.playSound('操作失败');
            core.drawTip('当前项尚未开启');
            return;
        }
        var message = shop.canUseQuickShop(shopId);
        if (message == null) {
            // core.ui.closePanel();
            shop.openShop(shopIds[y - topIndex], false);
        } else {
            core.playSound('操作失败');
            core.drawTip(message);
        }
    }
    // 离开
    else if (y == topIndex + shopIds.length) {
        core.playSound('取消');
        core.ui.closePanel();
    }
};

////// 快捷商店界面时，放开某个键的操作 //////
actions.prototype._keyUpQuickShop = function (keycode) {
    if (keycode == 27 || keycode == 75 || keycode == 88 || keycode == 86) {
        core.playSound('取消');
        core.ui.closePanel();
        return;
    }
    this._selectChoices(
        Mota.require('@user/data-state').listShopIds().length + 1,
        keycode,
        this._clickQuickShop
    );
    return;
};

////// 存读档界面时的点击操作 //////
actions.prototype._clickSL = function (x, y) {
    var page = core.status.event.data.page,
        offset = core.status.event.data.offset;
    var index = page * 10 + offset;

    // 上一页
    if ((x == this._HX_ - 2 || x == this._HX_ - 3) && y === core._HEIGHT_ - 1) {
        core.playSound('光标移动');
        core.ui._drawSLPanel(10 * (page - 1) + offset);
        return;
    }
    // 下一页
    if ((x == this._HX_ + 2 || x == this._HX_ + 3) && y === core._HEIGHT_ - 1) {
        core.playSound('光标移动');
        core.ui._drawSLPanel(10 * (page + 1) + offset);
        return;
    }
    // 返回
    if (x >= this.LAST - 2 && y === core._HEIGHT_ - 1) {
        core.playSound('取消');
        if (core.events.recoverEvents(core.status.event.interval)) return;
        core.ui.closePanel();
        delete core.status.tempRoute;
        if (!core.isPlaying()) document.getElementById('start').style.top = '0';
        return;
    }
    // 删除
    if (x >= 0 && x <= 2 && y === core._HEIGHT_ - 1) {
        if (core.status.event.id == 'save') {
            core.status.event.selection = !core.status.event.selection;
            core.ui._drawSLPanel(index);
        } else {
            // 显示收藏
            core.status.event.data.mode =
                core.status.event.data.mode == 'all' ? 'fav' : 'all';
            if (core.status.event.data.mode == 'fav')
                core.ui._drawSLPanel(1, true);
            else {
                page = Math.floor((core.saves.saveIndex - 1) / 5);
                offset = core.saves.saveIndex - 5 * page;
                core.ui._drawSLPanel(10 * page + offset, true);
            }
        }
        return;
    }
    // 点存档名
    var xLeft = Math.floor(core._WIDTH_ / 3),
        xRight = Math.floor((core._WIDTH_ * 2) / 3);
    var topY1 = 0,
        topY2 = this._HY_;
    if (y >= topY1 && y <= topY1 + 1) {
        if (x >= xLeft && x < xRight) return this._clickSL_favorite(page, 1);
        if (x >= xRight) return this._clickSL_favorite(page, 2);
    }
    if (y >= topY2 && y <= topY2 + 1) {
        if (x < xLeft) return this._clickSL_favorite(page, 3);
        if (x >= xLeft && x < xRight) return this._clickSL_favorite(page, 4);
        if (x >= xRight) return this._clickSL_favorite(page, 5);
    }

    var id = null;
    if (y >= topY1 + 2 && y < this._HY_ - 1) {
        if (x < xLeft) id = 'autoSave';
        if (x >= xLeft && x < xRight) id = 5 * page + 1;
        if (x >= xRight) id = 5 * page + 2;
    }
    if (y >= topY2 + 2 && y < core._HEIGHT_ - 1) {
        if (x < xLeft) id = 5 * page + 3;
        if (x >= xLeft && x < xRight) id = 5 * page + 4;
        if (x >= xRight) id = 5 * page + 5;
    }
    if (id != null) {
        if (core.status.event.selection) {
            if (id == 'autoSave') {
                core.playSound('操作失败');
                core.drawTip('无法删除自动存档！');
            } else {
                core.removeSave(id, function () {
                    core.ui._drawSLPanel(index, true);
                });
            }
        } else {
            if (core.status.event.data.mode == 'fav' && id != 'autoSave')
                id = core.saves.favorite[id - 1];
            core.doSL(id, core.status.event.id);
        }
    }
};

actions.prototype._clickSL_favorite = function (page, offset) {
    if (offset == 0) return;
    var index = 5 * page + offset;
    if (core.status.event.data.mode == 'fav') {
        // 收藏模式下点击的下标直接对应favorite
        index = core.saves.favorite[index - 1];
        core.myprompt(
            '请输入想要显示的存档名(长度不超过5字符)',
            null,
            function (value) {
                if (value && value.length <= 5) {
                    core.saves.favoriteName[index] = value;
                    core.control._updateFavoriteSaves();
                    core.ui._drawSLPanel(10 * page + offset);
                } else if (value) {
                    alert('无效的输入！');
                }
            }
        );
    } else {
        var v = core.saves.favorite.indexOf(index);
        core.playSound('确定');
        if (v >= 0) {
            // 已经处于收藏状态：取消收藏
            core.saves.favorite.splice(v, 1);
            delete core.saves.favoriteName[index];
        } else if (core.hasSave(index)) {
            // 存在存档则进行收藏
            core.saves.favorite.push(index);
            core.saves.favorite = core.saves.favorite.sort(function (a, b) {
                return a - b;
            }); // 保证有序
            core.drawTip('收藏成功！');
        }
        core.control._updateFavoriteSaves();
        core.ui._drawSLPanel(10 * page + offset);
    }
};

////// 存读档界面时，按下某个键的操作 //////
actions.prototype._keyDownSL = function (keycode) {
    var page = core.status.event.data.page,
        offset = core.status.event.data.offset;
    var index = page * 10 + offset;

    if (keycode == 37) {
        // left
        core.playSound('光标移动');
        if (offset == 0) {
            core.ui._drawSLPanel(10 * (page - 1) + 5);
        } else {
            core.ui._drawSLPanel(index - 1);
        }
        return;
    }
    if (keycode == 38) {
        // up
        core.playSound('光标移动');
        if (offset < 3) {
            core.ui._drawSLPanel(10 * (page - 1) + offset + 3);
        } else {
            core.ui._drawSLPanel(index - 3);
        }
        return;
    }
    if (keycode == 39) {
        // right
        core.playSound('光标移动');
        if (offset == 5) {
            core.ui._drawSLPanel(10 * (page + 1) + 1);
        } else {
            core.ui._drawSLPanel(index + 1);
        }
        return;
    }
    if (keycode == 40) {
        // down
        core.playSound('光标移动');
        if (offset >= 3) {
            core.ui._drawSLPanel(10 * (page + 1) + offset - 3);
        } else {
            core.ui._drawSLPanel(index + 3);
        }
        return;
    }
    if (keycode == 33) {
        // PAGEUP
        core.playSound('光标移动');
        core.ui._drawSLPanel(10 * (page - 1) + offset);
        return;
    }
    if (keycode == 34) {
        // PAGEDOWN
        core.playSound('光标移动');
        core.ui._drawSLPanel(10 * (page + 1) + offset);
        return;
    }
};

////// 存读档界面时，放开某个键的操作 //////
actions.prototype._keyUpSL = function (keycode) {
    var page = core.status.event.data.page,
        offset = core.status.event.data.offset;
    var index = page * 10 + offset;

    if (
        keycode == 27 ||
        keycode == 88 ||
        (core.status.event.id == 'save' && keycode == 83) ||
        (core.status.event.id == 'load' && keycode == 68)
    ) {
        this._clickSL(core._WIDTH_ - 1, core._HEIGHT_ - 1);
        return;
    }
    if (keycode >= 48 && keycode <= 57) {
        if (keycode == 48) keycode = 58;
        core.ui._drawSLPanel((keycode - 49) * 1000 + 1);
        return;
    }
    if (keycode == 13 || keycode == 32 || keycode == 67) {
        if (offset == 0) core.doSL('autoSave', core.status.event.id);
        else {
            var id = 5 * page + offset;
            if (core.status.event.data.mode == 'fav')
                id = core.saves.favorite[id - 1];
            core.doSL(id, core.status.event.id);
        }
        return;
    }
    if (keycode == 69 && core.status.event.id != 'save') {
        // E 收藏切换
        this._clickSL(0, core._HEIGHT_ - 1);
        return;
    }
    if (keycode == 46) {
        if (offset == 0) {
            core.playSound('操作失败');
            core.drawTip('无法删除自动存档！');
        } else {
            var id = 5 * page + offset;
            if (core.status.event.data.mode == 'fav')
                id = core.saves.favorite[id - 1];
            core.removeSave(id, function () {
                core.ui._drawSLPanel(index, true);
            });
        }
    }
    if (keycode == 70 && core.status.event.data.mode == 'all') {
        // F
        this._clickSL_favorite(page, offset);
    }
};

////// 系统设置界面时的点击操作 //////
actions.prototype._clickSwitchs = function (x, y) {
    // Deprecated.
};

////// 系统设置界面时，放开某个键的操作 //////
actions.prototype._keyUpSwitchs = function (keycode) {
    // Deprecated.
};

actions.prototype._clickSwitchs_sounds = function (x, y) {
    // Deprecated.
};

actions.prototype._clickSwitchs_sounds_bgm = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_sounds_se = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_sounds_userVolume = function (delta) {
    // Deprecated.
};

actions.prototype._keyUpSwitchs_sounds = function (keycode) {
    // Deprecated.
};

actions.prototype._clickSwitchs_display = function (x, y) {
    // Deprecated.
};

actions.prototype._clickSwitchs_display_setSize = function (delta) {
    // Deprecated.
};

actions.prototype._clickSwitchs_display_enableHDCanvas = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_display_enableEnemyPoint = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_display_enemyDamage = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_display_critical = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_display_extraDamage = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_display_extraDamageType = function () {
    // Deprecated.
};

actions.prototype._keyUpSwitchs_display = function (keycode) {
    // Deprecated.
};

actions.prototype._clickSwitchs_action = function (x, y) {
    // Deprecated.
};

actions.prototype._clickSwitchs_action_moveSpeed = function (delta) {
    // Deprecated.
};

actions.prototype._clickSwitchs_action_floorChangeTime = function (delta) {
    // Deprecated.
};

actions.prototype._clickSwitchs_action_potionNoRouting = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_action_clickMove = function () {
    // Deprecated.
};

actions.prototype._clickSwitchs_action_leftHandPrefer = function () {
    // Deprecated.
};

actions.prototype._keyUpSwitchs_action = function (keycode) {
    // Deprecated.
};

////// 系统菜单栏界面时的点击操作 //////
actions.prototype._clickSettings = function (x, y) {
    // Deprecated.
};

////// 系统菜单栏界面时，放开某个键的操作 //////
actions.prototype._keyUpSettings = function (keycode) {
    // Deprecated.
};

////// 存档笔记页面时的点击操作 //////
actions.prototype._clickNotes = function (x, y) {
    // Deprecated.
};

actions.prototype.__clickNotes_replaceText = function (data) {
    // Deprecated.
};

actions.prototype._clickNotes_new = function () {
    // Deprecated.
};

actions.prototype._clickNotes_show = function () {
    // Deprecated.
};

actions.prototype._clickNotes_edit = function () {
    // Deprecated.
};

actions.prototype._clickNotes_delete = function () {
    // Deprecated.
};

////// 存档笔记页面时，放开某个键的操作 //////
actions.prototype._keyUpNotes = function (keycode) {
    // Deprecated.
};

////// 同步存档界面时的点击操作 //////
actions.prototype._clickSyncSave = function (x, y) {
    // Deprecated.
};

actions.prototype._clickSyncSave_readFile = function () {
    // Deprecated.
};

actions.prototype._clickSyncSave_replay = function () {
    // Deprecated.
};

////// 同步存档界面时，放开某个键的操作 //////
actions.prototype._keyUpSyncSave = function (keycode) {
    // Deprecated.
};

////// 同步存档选择界面时的点击操作 //////
actions.prototype._clickSyncSelect = function (x, y) {
    // Deprecated.
};

////// 同步存档选择界面时，放开某个键的操作 //////
actions.prototype._keyUpSyncSelect = function (keycode) {
    // Deprecated.
};

////// 存档下载界面时的点击操作 //////
actions.prototype._clickLocalSaveSelect = function (x, y) {
    // Deprecated.
};

////// 存档下载界面时，放开某个键的操作 //////
actions.prototype._keyUpLocalSaveSelect = function (keycode) {
    // Deprecated.
};

////// 存档删除界面时的点击操作 //////
actions.prototype._clickStorageRemove = function (x, y) {
    // Deprecated.
};

actions.prototype._clickStorageRemove_all = function () {
    // Deprecated.
};

actions.prototype._clickStorageRemove_current = function () {
    // Deprecated.
};

////// 存档删除界面时，放开某个键的操作 //////
actions.prototype._keyUpStorageRemove = function (keycode) {
    // Deprecated.
};

////// 回放选择界面时的点击操作 //////
actions.prototype._clickReplay = function (x, y) {
    // Deprecated.
};

actions.prototype._clickReplay_fromBeginning = function () {
    // Deprecated.
};

actions.prototype._clickReplay_fromLoad = function () {
    // Deprecated.
};

actions.prototype._clickReplay_replayRemain = function () {
    // Deprecated.
};

actions.prototype._clickReplay_replaySince = function () {
    // Deprecated.
};

actions.prototype._clickReplay_download = function () {
    // Deprecated.
};

////// 回放选择界面时，放开某个键的操作 //////
actions.prototype._keyUpReplay = function (keycode) {
    // Deprecated.
};

////// 游戏信息界面时的点击操作 //////
actions.prototype._clickGameInfo = function (x, y) {
    // Deprecated.
};

actions.prototype._clickGameInfo_openProject = function () {
    // Deprecated.
};

actions.prototype._clickGameInfo_openComments = function () {
    // Deprecated.
};

actions.prototype._clickGameInfo_download = function () {
    // Deprecated.
};

////// 游戏信息界面时，放开某个键的操作 //////
actions.prototype._keyUpGameInfo = function (keycode) {
    // Deprecated.
};

////// “虚拟键盘”界面时的点击操作 //////
actions.prototype._clickKeyBoard = function (x, y) {
    // Deprecated.
};

////// 光标界面时的点击操作 //////
actions.prototype._clickCursor = function (x, y, px, py) {
    // Deprecated.
};

////// 光标界面时，按下某个键的操作 //////
actions.prototype._keyDownCursor = function (keycode) {
    // Deprecated.
};

////// 光标界面时，放开某个键的操作 //////
actions.prototype._keyUpCursor = function (keycode) {
    // Deprecated.
};
