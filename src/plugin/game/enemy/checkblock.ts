import { drawHalo } from '../fx/halo';

export function init() {
    // 伤害弹出
    // 复写阻激夹域检测
    control.prototype.checkBlock = function (forceMockery: boolean = false) {
        const x = core.getHeroLoc('x'),
            y = core.getHeroLoc('y'),
            loc = x + ',' + y;
        const info = core.status.thisMap.enemy.mapDamage[loc];
        const damage = info?.damage;
        if (damage) {
            if (!main.replayChecking) {
                Mota.Plugin.require('pop_r').addPop(
                    (x - core.bigmap.offsetX / 32) * 32 + 12,
                    (y - core.bigmap.offsetY / 32) * 32 + 20,
                    (-damage).toString()
                );
            }
            core.status.hero.hp -= damage;
            const type = [...info.type];
            const text = type.join('，') || '伤害';
            core.drawTip('受到' + text + damage + '点');
            core.drawHeroAnimate('zone');
            this._checkBlock_disableQuickShop();
            core.status.hero.statistics.extraDamage += damage;
            if (core.status.hero.hp <= 0) {
                core.status.hero.hp = 0;
                core.updateStatusBar();
                core.events.lose();
                return;
            } else {
                core.updateStatusBar();
            }
        }
        checkMockery(loc, forceMockery);
    };

    control.prototype._drawDamage_draw = function (
        ctx: CanvasRenderingContext2D,
        onMap: boolean,
        floorId: FloorIds
    ) {
        if (!core.hasItem('book')) return;
        drawHalo(ctx, onMap, floorId);

        core.setFont(ctx, "14px 'normal'");
        core.setTextAlign(ctx, 'center');
        core.setTextBaseline(ctx, 'middle');
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
            core.fillBoldText(ctx, one.text, px, py, one.color as string);
            core.setAlpha(ctx, alpha);
        });

        core.setTextAlign(ctx, 'left');
        core.setTextBaseline(ctx, 'alphabetic');
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
            core.fillBoldText(ctx, one.text, px, py, one.color as string);
        });
    };

    control.prototype.moveHero = function (
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

        if (callback) return this.moveAction(callback);
        this._moveHero_moving();
    };
}

function checkMockery(loc: string, force: boolean = false) {
    if (core.status.lockControl && !force) return;
    const mockery = core.status.thisMap.enemy.mapDamage[loc]?.mockery;
    if (mockery) {
        mockery.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
        const action = [];
        const [tx, ty] = mockery[0];
        let { x, y } = core.status.hero.loc;
        const dir = x > tx ? 'left' : x < tx ? 'right' : y > ty ? 'up' : 'down';
        const { x: dx, y: dy } = core.utils.scan[dir];

        action.push({ type: 'changePos', direction: dir });
        const blocks = core.getMapBlocksObj();
        while (1) {
            x += dx;
            y += dy;
            const block = blocks[`${x},${y}`];
            if (block) {
                if (
                    [
                        'animates',
                        'autotile',
                        'tileset',
                        'npcs',
                        'npc48',
                        'terrains'
                    ].includes(block.event.cls)
                ) {
                    action.push(
                        {
                            type: 'hide',
                            loc: [[x, y]],
                            remove: true,
                            time: 0
                        },
                        {
                            type: 'function',
                            function: `function() { core.removeGlobalAnimate(${x}, ${y}) }`
                        },
                        {
                            type: 'animate',
                            name: 'hand',
                            loc: [x, y],
                            async: true
                        }
                    );
                }
                if (block.event.cls.startsWith('enemy')) {
                    action.push({ type: 'moveAction' });
                }
            }
            action.push({ type: 'moveAction' });
            if (x === tx && y === ty) break;
        }
        action.push({
            type: 'function',
            function: `function() { core.checkBlock(true); }`
        });
        action.push({ type: 'stopAsync' });
        core.insertAction(action);
    }
}
