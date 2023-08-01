import {
    DamageDir,
    DamageEnemy,
    ensureFloorDamage,
    getNeedCalDir,
    getSingleEnemy
} from './damage';
import { findDir, has } from '../utils';

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
        throw new Error(
            `Get null when getting enemy on '${x},${y}' in '${floorId}'`
        );
    }
    return enemy;
}

core.enemys.canBattle = function (
    x: number,
    y: number,
    floorId: FloorIds = core.status.floorId,
    dir: DamageDir | DamageDir[] = getNeedCalDir(x, y, floorId)
) {
    const enemy = getEnemy(x, y, floorId);
    const damage = enemy.calEnemyDamage(core.status.hero, dir);

    return damage.some(v => {
        return v.damage < core.status.hero.hp;
    });
};

core.events.battle = function (
    x: number,
    y: number,
    dir: DamageDir,
    force: boolean = false,
    callback?: () => void
) {
    core.saveAndStopAutomaticRoute();
    const enemy = getEnemy(x, y);
    // 非强制战斗
    if (
        !core.enemys.canBattle(x, y, void 0, dir) &&
        !force &&
        !core.status.event.id
    ) {
        core.stopSound();
        core.playSound('操作失败');
        core.drawTip('你打不过此怪物！', enemy.id);
        return core.clearContinueAutomaticRoute(callback);
    }
    // 自动存档
    if (!core.status.event.id) core.autosave(true);
    // 战前事件
    if (!this.beforeBattle(enemy, x, y, dir))
        return core.clearContinueAutomaticRoute(callback);
    // 战后事件
    this.afterBattle(enemy, x, y, dir);
    callback?.();
};

core.events.beforeBattle = function () {
    return true;
};

core.events.afterBattle = function (
    enemy: DamageEnemy,
    x?: number,
    y?: number,
    dir: DamageDir = 'none'
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
    const info = enemy.calEnemyDamage(core.status.hero, dir)[0];
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
    if (core.hasSpecial(special, 14) && flags.hard === 2) {
        core.addFlag(
            'inte_' + floorId,
            Math.ceil((core.status.hero.mdef / 10) * 0.3) * 10
        );
        core.status.hero.mdef -=
            Math.ceil((core.status.hero.mdef / 10) * 0.3) * 10;
    }

    // 极昼永夜
    if (core.hasSpecial(special, 22)) {
        flags[`night_${floorId}`] ??= 0;
        flags[`night_${floorId}`] -= enemy.enemy.night!;
    }
    if (core.hasSpecial(special, 23)) {
        flags[`night_${floorId}`] ??= 0;
        flags[`night_${floorId}`] += enemy.enemy.day;
    }

    // if (core.plugin.skillTree.getSkillLevel(11) > 0) {
    //     core.plugin.study.declineStudiedSkill();
    // }

    // 如果是融化怪，需要特殊标记一下
    if (core.hasSpecial(special, 25) && core.has(x) && core.has(y)) {
        flags[`melt_${floorId}`] ??= {};
        flags[`melt_${floorId}`][`${x},${y}`] = enemy.enemy.melt;
    }

    // 获得金币
    const money = enemy.enemy.money;
    core.status.hero.money += money;
    core.status.hero.statistics.money += money;

    // 获得经验
    const exp = enemy.enemy.exp;
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
        todo.push(...(core.floors[core.status.floorId].afterBattle[loc] ?? []));
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

    // 打怪特效
    if (has(x) && has(y)) {
        const frame = core.status.globalAnimateStatus % 2;
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        core.drawIcon(canvas, enemy.id, 0, 0, 32, 32, frame);
        const manager = core.applyFragWith(canvas);
        const frag = manager.canvas;
        frag.style.imageRendering = 'pixelated';
        frag.style.width = `${frag.width * core.domStyle.scale}px`;
        frag.style.height = `${frag.height * core.domStyle.scale}px`;
        const left =
            (x * 32 + 16 - frag.width / 2 - core.bigmap.offsetX) *
            core.domStyle.scale;
        const top =
            (y * 32 + 16 - frag.height / 2 - core.bigmap.offsetY) *
            core.domStyle.scale;
        frag.style.left = `${left}px`;
        frag.style.top = `${top}px`;
        frag.style.zIndex = '45';
        frag.style.position = 'absolute';
        core.dom.gameDraw.appendChild(frag);
        manager.onEnd.then(() => {
            frag.remove();
        });
    }
};

core.events._sys_battle = function (data: Block, callback?: () => void) {
    // 检查战前事件
    const floor = core.floors[core.status.floorId];
    const beforeBattle: MotaEvent = [];
    const loc = `${data.x},${data.y}` as LocString;
    const enemy = getEnemy(data.x, data.y);

    beforeBattle.push(...(floor.beforeBattle[loc] ?? []));
    beforeBattle.push(...(enemy.enemy.beforeBattle ?? []));

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
        const dir = findDir(data, core.status.hero.loc) as DamageDir;
        this.battle(data.x, data.y, dir, false, callback);
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
        const [ex, ey] = this.__action_getLoc(data.loc, x, y, prefix) as LocArr;
        const dir = findDir(core.status.hero.loc, {
            x: ex,
            y: ey
        }) as DamageDir;
        this.battle(ex, ey, dir, true, core.doAction);
    }
};

core.enemys.getCurrentEnemys = function (floorId = core.status.floorId) {
    floorId = floorId || core.status.floorId;
    const enemys: CurrentEnemy[] = [];
    const used: Record<string, DamageEnemy[]> = {};
    ensureFloorDamage(floorId);
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
        return (
            (a.enemy.damage?.[0]?.damage ?? Infinity) -
            (b.enemy.damage?.[0]?.damage ?? Infinity)
        );
    });
};

declare global {
    interface Events {
        beforeBattle(
            enemy: DamageEnemy,
            x: number,
            y: number,
            dir: DamageDir
        ): boolean;

        afterBattle(
            enemy: DamageEnemy,
            x: number,
            y: number,
            dir: DamageDir
        ): void;
    }

    interface Enemys {
        getCurrentEnemys(floorId?: FloorIds): CurrentEnemy[];
    }
}
