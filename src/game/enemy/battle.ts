import { DamageEnemy, ensureFloorDamage, getSingleEnemy } from './damage';
import { findDir, has } from '../../plugin/game/utils';
import { hook, loading } from '../game';

export interface CurrentEnemy {
    enemy: DamageEnemy;
    // 这个是干啥的？
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
        x: number | DamageEnemy,
        y: number,
        floorId: FloorIds = core.status.floorId
    ) {
        const enemy = typeof x === 'number' ? getEnemy(x, y, floorId) : x;
        if (!enemy) {
            throw new Error(
                `Cannot get enemy on x:${x}, y:${y}, floor: ${floorId}`
            );
        }
        const { damage } = enemy.calDamage();

        return damage < core.status.hero.hp;
    };

    core.events.battle = function battle(
        x: number | DamageEnemy,
        y: number,
        force: boolean = false,
        callback?: () => void
    ) {
        core.saveAndStopAutomaticRoute();
        const isLoc = typeof x === 'number';
        const enemy = isLoc ? getEnemy(x, y) : x;
        if (!enemy) {
            throw new Error(
                `Cannot battle with enemy since no enemy on ${x},${y}`
            );
        }
        // 非强制战斗
        // @ts-ignore
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
        core.afterBattle(enemy, isLoc ? x : enemy.x, y);
        callback?.();
    };

    const getFacedId = (enemy: DamageEnemy) => {
        const e = enemy.enemy;

        if (e.displayIdInBook) return e.displayIdInBook;
        if (e.faceIds) return e.faceIds.down;
        return e.id;
    };

    core.enemys.getCurrentEnemys = function getCurrentEnemys(
        floorId = core.status.floorId
    ) {
        floorId = floorId || core.status.floorId;
        const enemys: CurrentEnemy[] = [];
        const used: Record<string, DamageEnemy[]> = {};
        ensureFloorDamage(floorId);
        const floor = core.status.maps[floorId];
        floor.enemy.list.forEach(v => {
            const id = getFacedId(v);
            if (!(id in used)) {
                const e = new DamageEnemy(v.enemy);
                e.calAttribute();
                e.getRealInfo();
                e.calDamage();
                const curr: CurrentEnemy = {
                    enemy: e,
                    onMapEnemy: [v]
                };
                enemys.push(curr);
                used[id] = curr.onMapEnemy;
            } else {
                used[id].push(v);
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
            const enemy = getSingleEnemy(data.id as EnemyIds);
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

    core.events.afterBattle = function afterBattle(
        enemy: DamageEnemy,
        x?: number,
        y?: number
    ) {
        const floorId = core.status.floorId;
        const special = enemy.info.special;

        // 播放战斗动画
        let animate: AnimationIds = 'hand';
        // 检查当前装备是否存在攻击动画
        const equipId = core.getEquip(0);
        if (equipId && (core.material.items[equipId].equip || {}).animate)
            animate = core.material.items[equipId].equip.animate;

        // 检查该动画是否存在SE，如果不存在则使用默认音效
        if (!core.material.animates[animate]?.se) core.playSound('attack.mp3');

        // 战斗伤害
        const info = enemy.calDamage(core.status.hero);
        const damage = info.damage;
        // 判定是否致死
        if (damage >= core.status.hero.hp) {
            core.status.hero.hp = 0;
            core.updateStatusBar(false, true);
            core.events.lose('战斗失败');
            return;
        }

        // 扣减体力值并记录统计数据
        core.status.hero.hp -= damage;
        core.status.hero.statistics.battleDamage += damage;
        core.status.hero.statistics.battle++;

        // 智慧之源
        if (special.includes(14) && flags.hard === 2) {
            core.addFlag(
                'inte_' + floorId,
                Math.ceil((core.status.hero.mdef / 10) * 0.3) * 10
            );
            core.status.hero.mdef -=
                Math.ceil((core.status.hero.mdef / 10) * 0.3) * 10;
        }

        // 极昼永夜
        if (special.includes(22)) {
            flags[`night_${floorId}`] ??= 0;
            flags[`night_${floorId}`] -= enemy.info.night!;
        }
        if (special.includes(23)) {
            flags[`night_${floorId}`] ??= 0;
            flags[`night_${floorId}`] += enemy.info.day;
        }

        // if (core.plugin.skillTree.getSkillLevel(11) > 0) {
        //     core.plugin.study.declineStudiedSkill();
        // }

        // 如果是融化怪，需要特殊标记一下
        if (special.includes(25) && has(x) && has(y)) {
            flags[`melt_${floorId}`] ??= {};
            flags[`melt_${floorId}`][`${x},${y}`] = enemy.info.melt;
        }

        // 获得金币
        const money = enemy.info.money!;
        core.status.hero.money += money;
        core.status.hero.statistics.money += money;

        // 获得经验
        const exp = enemy.info.exp!;
        core.status.hero.exp += exp;
        core.status.hero.statistics.exp += exp;

        const hint =
            '打败 ' + enemy.enemy.name + '，金币+' + money + '，经验+' + exp;
        core.drawTip(hint, enemy.id);

        if (core.getFlag('bladeOn') && core.getFlag('blade')) {
            core.setFlag('blade', false);
        }
        if (core.getFlag('shieldOn') && core.getFlag('shield')) {
            core.setFlag('shield', false);
        }

        // 事件的处理
        const todo: MotaEvent = [];

        // 战后事件
        if (has(core.status.floorId)) {
            const loc = `${x},${y}` as LocString;
            todo.push(
                ...(core.floors[core.status.floorId].afterBattle[loc] ?? [])
            );
        }
        todo.push(...(enemy.enemy.afterBattle ?? []));

        // 如果事件不为空，将其插入
        if (todo.length > 0) core.insertAction(todo, x, y);

        if (has(x) && has(y)) {
            core.drawAnimate(animate, x, y);
            core.removeBlock(x, y);
        } else core.drawHeroAnimate(animate);

        // 如果已有事件正在处理中
        if (core.status.event.id == null) core.continueAutomaticRoute();
        else core.clearContinueAutomaticRoute();

        core.checkAutoEvents();

        hook.emit('afterBattle', enemy, x, y);
    };
}
loading.once('coreInit', init);

declare global {
    interface Enemys {
        getCurrentEnemys(floorId: FloorIds): CurrentEnemy[];
        canBattle(enemy: DamageEnemy, _?: number, floorId?: FloorIds): boolean;
        canBattle(x: number, y: number, floorId?: FloorIds): boolean;
    }

    interface Events {
        battle(
            enemy: DamageEnemy,
            _?: number,
            force?: boolean,
            callback?: () => void
        ): void;
        battle(
            x: number,
            y?: number,
            force?: boolean,
            callback?: () => void
        ): void;
    }
}
