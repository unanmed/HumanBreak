import { DamageEnemy, ensureFloorDamage, getEnemy } from '@user/data-state';
import { hook } from '@user/data-base';
import { Patch, PatchClass } from '@motajs/legacy-common';
import { isNil } from 'lodash-es';

export interface CurrentEnemy {
    enemy: DamageEnemy;
    // 这个是干啥的？
    onMapEnemy: DamageEnemy[];
}

export function patchBattle() {
    const patch = new Patch(PatchClass.Enemys);
    const patch2 = new Patch(PatchClass.Events);

    patch.add('canBattle', function (x, y, floorId) {
        const enemy = typeof x === 'number' ? getEnemy(x, y!, floorId) : x;
        if (!enemy) {
            throw new Error(
                `Cannot get enemy on x:${x}, y:${y}, floor: ${floorId}`
            );
        }
        const { damage } = enemy.calDamage();

        return damage < core.status.hero.hp;
    });

    function battle(
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
        // @ts-expect-error 2.c 重构
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
    }

    const getFacedId = (enemy: DamageEnemy) => {
        const e = enemy.enemy;

        if (e.displayIdInBook) return e.displayIdInBook;
        if (e.faceIds) return e.faceIds.down;
        return e.id;
    };

    patch.add('getCurrentEnemys', function (floorId = core.status.floorId) {
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
    });

    patch2.add('battle', battle);

    patch2.add('_sys_battle', function (data: Block, callback?: () => void) {
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
            const inAction = core.status.event.id === 'action';
            if (inAction) {
                core.insertAction(beforeBattle, data.x, data.y);
                core.doAction();
            } else {
                core.autosave(true);
                core.insertAction(beforeBattle, data.x, data.y, callback);
            }
        } else {
            battle(data.x, data.y, false, callback);
        }
    });

    patch2.add('_action_battle', function (data, x, y, prefix) {
        if (data.id) {
            // const enemy = getSingleEnemy(data.id as EnemyIds);
            // todo: 与不在地图上的怪物战斗
        } else {
            if (data.floorId !== core.status.floorId) {
                core.doAction();
                return;
            }
            const [ex, ey] = core.events.__action_getLoc(
                data.loc,
                x,
                y,
                prefix
            ) as LocArr;
            battle(ex, ey, true, core.doAction);
        }
    });

    patch2.add(
        'afterBattle',
        function (enemy: DamageEnemy, x?: number, y?: number) {
            // 播放战斗动画
            let animate: AnimationIds = 'hand';
            // 检查当前装备是否存在攻击动画
            const equipId = core.getEquip(0);
            if (equipId && (core.material.items[equipId].equip || {}).animate)
                animate = core.material.items[equipId].equip.animate;

            // 检查该动画是否存在SE，如果不存在则使用默认音效
            if (!core.material.animates[animate]?.se)
                core.playSound('attack.opus');

            // 战斗伤害
            const info = enemy.getRealInfo();
            const damageInfo = enemy.calDamage(core.status.hero);
            const damage = damageInfo.damage;
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

            // 获得金币经验
            const money = core.hasFlag('curse') ? 0 : enemy.info.money!;
            const exp = core.hasFlag('curse') ? 0 : enemy.info.exp!;

            core.status.hero.money += money;
            core.status.hero.statistics.money += money;
            core.status.hero.exp += exp;
            core.status.hero.statistics.exp += exp;

            const hint = `打败 ${enemy.enemy.name}，金币+${money}，经验+${exp}`;
            core.drawTip(hint, enemy.id);

            // 毒衰咒
            if (info.special.has(12)) core.setFlag('poison', true);
            if (info.special.has(13)) core.setFlag('weak', true);
            if (info.special.has(14)) core.setFlag('curse', true);

            // 仇恨
            if (info.special.has(17)) {
                core.setFlag('hatred', core.getFlag('hatred', 0) / 2);
            } else {
                core.addFlag('hatred', core.values.hatred);
            }

            // 自爆
            if (info.special.has(19)) {
                core.status.hero.hp = 1;
            }

            // 退化
            if (info.special.has(21)) {
                core.status.hero.atk -= info.atkValue ?? 0;
                core.status.hero.def -= info.defValue ?? 0;
            }

            // 事件的处理
            const todo: MotaEvent = [];

            // 战后事件
            if (!isNil(core.status.floorId)) {
                const loc = `${x},${y}` as LocString;
                todo.push(
                    ...(core.floors[core.status.floorId].afterBattle[loc] ?? [])
                );
            }
            todo.push(...(enemy.enemy.afterBattle ?? []));

            // 如果事件不为空，将其插入
            if (todo.length > 0) core.insertAction(todo, x, y);

            if (!isNil(x) && !isNil(y)) {
                core.drawAnimate(animate, x, y);
                core.removeBlock(x, y);
            } else core.drawHeroAnimate(animate);

            // 如果已有事件正在处理中
            if (isNil(core.status.event.id)) core.continueAutomaticRoute();
            else core.clearContinueAutomaticRoute();

            core.checkAutoEvents();

            hook.emit('afterBattle', enemy, x, y);
        }
    );
}

declare global {
    interface Enemys {
        getCurrentEnemys(floorId: FloorIds): CurrentEnemy[];
        canBattle(enemy: DamageEnemy, _?: number, floorId?: FloorIds): boolean;
        canBattle(x: number, y: number, floorId?: FloorIds): boolean;
    }

    interface Events {
        battle(
            enemy: DamageEnemy,
            y?: number,
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
