import { DamageEnemy, Damage } from './damage';
import { findDir, has } from '../../plugin/game/utils';
import { loading } from '../game';

export interface CurrentEnemy {
    enemy: DamageEnemy;
    onMapEnemy: DamageEnemy[];
}

export function getEnemy(
    x: number,
    y: number,
    floorId: FloorIds = core.status.floorId
) {
    const enemy = core.status.maps[floorId].enemy.list.find(v => {
        return v.x === x && v.y === y;
    });
    if (!enemy) {
        return null;
    }
    return enemy;
}

function init() {
    core.enemys.canBattle = function canBattle(
        x: number,
        y: number,
        floorId: FloorIds = core.status.floorId
    ) {
        const enemy = getEnemy(x, y, floorId);
        const { damage } = enemy!.calDamage();

        return damage < core.status.hero.hp;
    };

    core.events.battle = function battle(
        x: number,
        y: number,
        force: boolean = false,
        callback?: () => void
    ) {
        core.saveAndStopAutomaticRoute();
        const enemy = getEnemy(x, y);
        // 非强制战斗
        if (!core.canBattle(x, y) && !force && !core.status.event.id) {
            core.stopSound();
            core.playSound('操作失败');
            core.drawTip('你打不过此怪物！', enemy!.id);
            return core.clearContinueAutomaticRoute(callback);
        }
        // 自动存档
        if (!core.status.event.id) core.autosave(true);
        // 战前事件
        // 战后事件
        core.afterBattle(enemy, x, y);
        callback?.();
    };

    core.enemys.getCurrentEnemys = function getCurrentEnemys(
        floorId = core.status.floorId
    ) {
        floorId = floorId || core.status.floorId;
        const enemys: CurrentEnemy[] = [];
        const used: Record<string, DamageEnemy[]> = {};
        Damage.ensureFloorDamage(floorId);
        const floor = core.status.maps[floorId];
        floor.enemy.list.forEach(v => {
            if (!(v.id in used)) {
                const e = new DamageEnemy(v.enemy);
                e.calAttribute();
                e.getRealInfo();
                e.calDamage();
                const curr: CurrentEnemy = {
                    enemy: e,
                    onMapEnemy: [v]
                };
                enemys.push(curr);
                used[v.id] = curr.onMapEnemy;
            } else {
                used[v.id].push(v);
            }
        });

        return enemys.sort((a, b) => {
            const ad = a.enemy.calDamage().damage;
            const bd = b.enemy.calDamage().damage;
            return ad - bd;
        });
    };

    core.events._sys_battle = function (data: Block, callback?: () => void) {
        // 检查战前事件
        const floor = core.floors[core.status.floorId];
        const beforeBattle: MotaEvent = [];
        const loc = `${data.x},${data.y}` as LocString;
        const enemy = getEnemy(data.x, data.y);

        beforeBattle.push(...(floor.beforeBattle[loc] ?? []));
        beforeBattle.push(...(enemy!.enemy.beforeBattle ?? []));

        if (beforeBattle.length > 0) {
            beforeBattle.push({ type: 'battle', x: data.x, y: data.y });
            core.clearContinueAutomaticRoute();

            // 自动存档
            var inAction = core.status.event.id == 'action';
            if (inAction) {
                core.insertAction(beforeBattle, data.x, data.y);
                core.doAction();
            } else {
                core.autosave(true);
                core.insertAction(beforeBattle, data.x, data.y, callback);
            }
        } else {
            core.battle(data.x, data.y, false, callback);
        }
    };

    core.events._action_battle = function (data, x, y, prefix) {
        if (data.id) {
            const enemy = Damage.getSingleEnemy(data.id as EnemyIds);
            // todo: 与不在地图上的怪物战斗
        } else {
            if (data.floorId != core.status.floorId) {
                core.doAction();
                return;
            }
            const [ex, ey] = this.__action_getLoc(
                data.loc,
                x,
                y,
                prefix
            ) as LocArr;
            core.battle(ex, ey, true, core.doAction);
        }
    };
}
loading.once('coreInit', init);

declare global {
    interface Enemys {
        getCurrentEnemys(floorId: FloorIds): CurrentEnemy[];
    }
}
