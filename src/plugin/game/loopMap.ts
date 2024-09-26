import { slide } from './utils';

const list = ['tower6'];

/**
 * 设置循环地图的偏移量
 * @param offset 横向偏移量
 */
function setLoopMap(offset: number, floorId: FloorIds) {
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
 */
function autoSetLoopMap(floorId: FloorIds) {
    setLoopMap(core.status.hero.loc.x, floorId);
}

export function checkLoopMap() {
    if (isLoopMap(core.status.floorId)) {
        autoSetLoopMap(core.status.floorId);
    }
}

/**
 * 移动地图
 */
function moveMap(delta: number, floorId: FloorIds) {
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

function isLoopMap(floorId: FloorIds) {
    return list.includes(floorId);
}

export function init() {
    events.prototype._sys_changeFloor = function (
        data: any,
        callback: () => void
    ) {
        data = data.event.data;
        let heroLoc: Partial<DiredLoc> = {};
        if (isLoopMap(data.floorId)) {
            const floor = core.status.maps[data.floorId as FloorIds] as Floor;
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
        // @ts-ignore
        if (core.status.event.id != 'action') core.status.event.id = null;
        core.changeFloor(
            data.floorId,
            data.stair,
            heroLoc,
            data.time,
            function () {
                core.replay();
                if (callback) callback();
            }
        );
    };

    events.prototype.trigger = function (
        x: number,
        y: number,
        callback: () => void
    ) {
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
                void 0,
                void 0,
                void 0,
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
                // @ts-ignore
                core.maps._addInfo(block);
            } else {
                const floor = core.status.maps[id];
                let tx = x - flags[`loop_${id}`];
                tx %= floor.width;
                if (tx < 0) tx += floor.width;
                const c = core.floors[id].changeFloor[`${tx},${y}`];
                if (c) {
                    const b: DeepPartial<Block> = { event: {}, x: tx, y };
                    b.event!.data = c;
                    b.event!.trigger = 'changeFloor';
                    block = b as Block;
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

        if (block.event.trigger && block.event.trigger !== 'null') {
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
            // @ts-ignore
            core.status.automaticRoute.moveDirectly = false;
            this.doSystemEvent(trigger, block, core.doAction);
        }
        return _executeCallback();
    };

    maps.prototype._getBgFgMapArray = function (
        name: string,
        floorId: FloorIds,
        noCache: boolean = false
    ) {
        floorId = floorId || core.status.floorId;
        if (!floorId) return [];
        var width = core.floors[floorId].width;
        var height = core.floors[floorId].height;

        // @ts-ignore
        if (!noCache && core.status[name + 'maps'][floorId])
            // @ts-ignore
            return core.status[name + 'maps'][floorId];

        var arr: number[][] =
            main.mode == 'editor' &&
            // @ts-ignore
            !(window.editor && editor.uievent && editor.uievent.isOpen)
                ? // @ts-ignore
                  core.cloneArray(editor[name + 'map'])
                : null;
        if (arr == null)
            // @ts-ignore
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
        // @ts-ignore
        (core.getFlag('__' + name + 'v__', {})[floorId] || []).forEach(
            // @ts-ignore
            function (one) {
                arr[one[1]][one[0]] = one[2] || 0;
            }
        );
        // @ts-ignore
        (core.getFlag('__' + name + 'd__', {})[floorId] || []).forEach(
            // @ts-ignore
            function (one) {
                arr[one[1]][one[0]] = 0;
            }
        );
        if (main.mode == 'editor') {
            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    // @ts-ignore
                    arr[y][x] = arr[y][x].idnum || arr[y][x] || 0;
                }
            }
        }
        // @ts-ignore
        if (core.status[name + 'maps'])
            // @ts-ignore
            core.status[name + 'maps'][floorId] = arr;
        return arr;
    };
}
