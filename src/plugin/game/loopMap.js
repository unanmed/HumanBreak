///<reference path="../../../src/types/core.d.ts" />
import { slide } from './utils.js';

const list = ['tower6'];

/**
 * 设置循环地图的偏移量
 * @param {number} offset 横向偏移量
 * @param {FloorIds} floorId
 */
function setLoopMap(offset, floorId) {
    const floor = core.status.maps[floorId];
    if (offset < 9) {
        moveMap(floor.width - 17, floorId);
    }
    if (offset > floor.width - 9) {
        moveMap(17 - floor.width, floorId);
    }
}

/**
 * 当勇士移动时自动设置循环地图
 * @param {FloorIds} floorId
 */
function autoSetLoopMap(floorId) {
    setLoopMap(core.status.hero.loc.x, floorId);
}

export function checkLoopMap() {
    if (isLoopMap(core.status.floorId)) {
        autoSetLoopMap(core.status.floorId);
    }
}

/**
 * 移动地图
 * @param {number} delta
 * @param {FloorIds} floorId
 */
function moveMap(delta, floorId) {
    core.extractBlocks(floorId);
    const floor = core.status.maps[floorId];
    core.setHeroLoc('x', core.status.hero.loc.x + delta);
    flags[`loop_${floorId}`] += delta;
    flags[`loop_${floorId}`] %= floor.width;
    const origin = floor.blocks.slice();
    for (let i = 0; i < origin.length; i++) {
        core.removeBlockByIndex(0, floorId);
        core.removeGlobalAnimate(origin[i].x, origin[i].y);
    }
    origin.forEach(v => {
        let to = v.x + delta;
        if (to >= floor.width) to -= floor.width;
        if (to < 0) to += floor.width;
        core.setBlock(v.id, to, v.y, floorId, true);
        core.setMapBlockDisabled(floorId, to, v.y, false);
    });
    core.drawMap();
    core.drawHero();
}

function isLoopMap(floorId) {
    return list.includes(floorId);
}

events.prototype._sys_changeFloor = function (data, callback) {
    data = data.event.data;
    let heroLoc = {};
    if (isLoopMap(data.floorId)) {
        const floor = core.status.maps[data.floorId];
        flags[`loop_${data.floorId}`] ??= 0;
        let tx = data.loc[0] + flags[`loop_${data.floorId}`];
        tx %= floor.width;
        if (tx < 0) tx += floor.width;
        heroLoc = {
            x: tx,
            y: data.loc[1]
        };
    } else if (data.loc) heroLoc = { x: data.loc[0], y: data.loc[1] };
    if (data.direction) heroLoc.direction = data.direction;
    if (core.status.event.id != 'action') core.status.event.id = null;
    core.changeFloor(data.floorId, data.stair, heroLoc, data.time, function () {
        core.replay();
        if (callback) callback();
    });
};

events.prototype.trigger = function (x, y, callback) {
    var _executeCallback = function () {
        // 因为trigger之后还有可能触发其他同步脚本（比如阻激夹域检测）
        // 所以这里强制callback被异步触发
        if (callback) {
            setTimeout(callback, 1); // +1是为了录像检测系统
        }
        return;
    };
    if (core.status.gameOver) return _executeCallback();
    if (core.status.event.id == 'action') {
        core.insertAction(
            {
                type: 'function',
                function:
                    'function () { core.events._trigger_inAction(' +
                    x +
                    ',' +
                    y +
                    '); }',
                async: true
            },
            null,
            null,
            null,
            true
        );
        return _executeCallback();
    }
    if (core.status.event.id) return _executeCallback();

    let block = core.getBlock(x, y);
    const id = core.status.floorId;
    const loop = isLoopMap(id);
    if (loop && flags[`loop_${id}`] !== 0) {
        if (block && block.event.trigger === 'changeFloor') {
            delete block.event.trigger;
            core.maps._addInfo(block);
        } else {
            const floor = core.status.maps[id];
            let tx = x - flags[`loop_${id}`];
            tx %= floor.width;
            if (tx < 0) tx += floor.width;
            const c = core.floors[id].changeFloor[`${tx},${y}`];
            if (c) {
                const b = { event: {}, x: tx, y };
                b.event.data = c;
                b.event.trigger = 'changeFloor';
                block = b;
            }
        }
    }

    if (block == null) return _executeCallback();

    // 执行该点的脚本
    if (block.event.script) {
        core.clearRouteFolding();
        try {
            eval(block.event.script);
        } catch (ee) {
            console.error(ee);
        }
    }

    // 碰触事件
    if (block.event.event) {
        core.clearRouteFolding();
        core.insertAction(block.event.event, block.x, block.y);
        // 不再执行该点的系统事件
        return _executeCallback();
    }

    if (block.event.trigger && block.event.trigger != 'null') {
        var noPass = block.event.noPass,
            trigger = block.event.trigger;
        if (noPass) core.clearAutomaticRouteNode(x, y);

        // 转换楼层能否穿透
        if (
            trigger == 'changeFloor' &&
            !noPass &&
            this._trigger_ignoreChangeFloor(block) &&
            !loop
        )
            return _executeCallback();
        core.status.automaticRoute.moveDirectly = false;
        this.doSystemEvent(trigger, block);
    }
    return _executeCallback();
};

maps.prototype._getBgFgMapArray = function (name, floorId, noCache) {
    floorId = floorId || core.status.floorId;
    if (!floorId) return [];
    var width = core.floors[floorId].width;
    var height = core.floors[floorId].height;

    if (!noCache && core.status[name + 'maps'][floorId])
        return core.status[name + 'maps'][floorId];

    var arr =
        main.mode == 'editor' &&
        !(window.editor && editor.uievent && editor.uievent.isOpen)
            ? core.cloneArray(editor[name + 'map'])
            : null;
    if (arr == null)
        arr = core.cloneArray(core.floors[floorId][name + 'map'] || []);

    if (isLoopMap(floorId) && window.flags) {
        flags[`loop_${floorId}`] ??= 0;
        arr.forEach(v => {
            slide(v, flags[`loop_${floorId}`] % width);
        });
    }

    for (var y = 0; y < height; ++y) {
        if (arr[y] == null) arr[y] = Array(width).fill(0);
    }
    (core.getFlag('__' + name + 'v__', {})[floorId] || []).forEach(function (
        one
    ) {
        arr[one[1]][one[0]] = one[2] || 0;
    });
    (core.getFlag('__' + name + 'd__', {})[floorId] || []).forEach(function (
        one
    ) {
        arr[one[1]][one[0]] = 0;
    });
    if (main.mode == 'editor') {
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                arr[y][x] = arr[y][x].idnum || arr[y][x] || 0;
            }
        }
    }
    if (core.status[name + 'maps']) core.status[name + 'maps'][floorId] = arr;
    return arr;
};

core.plugin.loopMap = {
    checkLoopMap
};
