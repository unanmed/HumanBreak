import { DamageEnemy } from '@user/data-state';
import { findDir, ofDir } from '@user/data-utils';

export function createCheckBlock() {
    // 地图伤害在这实现。2.C 会修改实现方式
    control.prototype.checkBlock = function () {
        const heroLoc = core.status.hero.loc;
        const { x, y } = heroLoc;
        const loc = `${x},${y}`;
        const col = core.status.thisMap.enemy;
        const info = col.mapDamage[loc];
        if (!info) return;
        const damage = info.damage;

        // 阻击夹域伤害
        if (damage) {
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

        const actions: MotaAction[] = [];

        // 阻击效果
        if (info.repulse) {
            for (const [x, y] of info.repulse) {
                const loc2 = { x, y };
                const dir = findDir(heroLoc, loc2);
                if (dir === 'none') continue;
                const [nx, ny] = ofDir(x, y, dir);
                if (core.noPass(nx, ny) || !core.canMoveHero(x, y, dir)) {
                    continue;
                }
                actions.push({
                    type: 'move',
                    time: 250,
                    keep: true,
                    loc: [x, y],
                    steps: [`${dir}:1`],
                    async: true
                });
            }
        }

        /** 存储要和哪些捕捉怪战斗 */
        const ambushEnemies: DamageEnemy[] = [];

        // 捕捉效果
        if (info.ambush) {
            for (const [x, y] of info.ambush) {
                const loc2 = { x, y };
                const dir = findDir(loc2, heroLoc);
                if (dir === 'none') continue;
                actions.push({
                    type: 'move',
                    time: 250,
                    keep: false,
                    loc: [x, y],
                    steps: [`${dir}:1`],
                    async: true
                });
                const enemy = col.get(x, y);
                if (enemy) {
                    ambushEnemies.push(enemy);
                }
            }
        }

        if (actions.length > 0) {
            actions.push({ type: 'waitAsync' });
            // 与捕捉怪战斗
            core.insertAction(actions, void 0, void 0, () => {
                ambushEnemies.forEach(v => {
                    core.battle(v, v.y, true);
                });
            });
        }
    };
}
