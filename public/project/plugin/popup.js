///<reference path="../../../src/types/core.d.ts" />
'use strict';

(function () {
    // 伤害弹出
    // 复写阻激夹域检测
    control.prototype.checkBlock = function (forceMockery) {
        var x = core.getHeroLoc('x'),
            y = core.getHeroLoc('y'),
            loc = x + ',' + y;
        var damage = core.status.checkBlock.damage[loc];
        if (damage) {
            if (!main.replayChecking)
                core.addPop(
                    (x - core.bigmap.offsetX / 32) * 32 + 12,
                    (y - core.bigmap.offsetY / 32) * 32 + 20,
                    -damage.toString()
                );
            core.status.hero.hp -= damage;
            var text =
                Object.keys(core.status.checkBlock.type[loc] || {}).join(
                    '，'
                ) || '伤害';
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
        this._checkBlock_repulse(core.status.checkBlock.repulse[loc]);
        checkMockery(loc, forceMockery);
    };

    control.prototype.moveHero = function (direction, callback) {
        // 如果正在移动，直接return
        if (core.status.heroMoving != 0) return;
        if (core.isset(direction)) core.setHeroLoc('direction', direction);

        const nx = core.nextX();
        const ny = core.nextY();
        if (core.status.checkBlock.mockery[`${nx},${ny}`]) {
            core.autosave();
        }

        if (callback) return this.moveAction(callback);
        this._moveHero_moving();
    };

    /**
     * 电摇嘲讽
     * @param {LocString} loc
     * @param {boolean} force
     */
    function checkMockery(loc, force) {
        if (core.status.lockControl && !force) return;
        const mockery = core.status.checkBlock.mockery[loc];
        if (mockery) {
            mockery.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
            const action = [];
            const [tx, ty] = mockery[0];
            let { x, y } = core.status.hero.loc;
            const dir =
                x > tx ? 'left' : x < tx ? 'right' : y > ty ? 'up' : 'down';
            const { x: dx, y: dy } = core.utils.scan[dir];

            action.push({ type: 'changePos', direction: dir });
            const blocks = core.getMapBlocksObj();
            while (1) {
                x += dx;
                y += dy;
                const block = blocks[`${x},${y}`];
                if (block) {
                    block.event.cls === '';
                    if (
                        [
                            'animates',
                            'autotile',
                            'tileset',
                            'npcs',
                            'npc48'
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
})();
