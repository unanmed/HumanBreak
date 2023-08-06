import { reactive, ref } from 'vue';
import { tip } from './utils';
import type { DamageEnemy } from './game/enemy/damage';

export const showMarkedEnemy = ref(false);

const markedEnemy = reactive<EnemyIds[]>([]);

interface MarkInfo {
    enemy: DamageEnemy;
    nextCritical: number;
}

export const markInfo: Partial<Record<EnemyIds, MarkInfo>> = {};
const criticalReached: Partial<Record<EnemyIds, Record<number, boolean>>> = {};
const enemyDamageInfo: Partial<Record<EnemyIds, Record<number, boolean>>> = {};

/**
 * 标记一个怪物，标记后的怪物会在勇士刚好能打过怪物时、伤害刚好小于勇士生命值的2/3和1/3时、踩到临界时提示
 * @param id 标记的怪物id
 */
export function markEnemy(id: EnemyIds) {
    const { Enemy } = core.plugin.damage;
    if (hasMarkedEnemy(id)) return;
    markedEnemy.push(id);
    const enemy = new Enemy(core.material.enemys[id]);
    enemy.calAttribute();
    enemy.getRealInfo();
    markInfo[id] = {
        nextCritical:
            enemy.calCritical(1)[0]?.atkDelta ?? 0 + core.status.hero.atk,
        enemy
    };
    criticalReached[id] = { 0: true };
    enemyDamageInfo[id] = { 1: false, 2: false, 3: false };
    getMarkInfo(id, true);
    checkMarkedEnemy(true);
}

/**
 * 是否标记过某个怪物
 */
export function hasMarkedEnemy(id: EnemyIds) {
    return markedEnemy.includes(id);
}

/**
 * 取消标记某个怪物
 */
export function unmarkEnemy(id: EnemyIds) {
    const index = markedEnemy.indexOf(id);
    if (index === -1) return;
    markedEnemy.splice(index, 1);
    checkMarkedEnemy();
}

export function unmarkAll() {
    markedEnemy.splice(0);
    checkMarkedEnemy();
}

/**
 * 获得所有被标记的怪物
 */
export function getMarkedEnemy() {
    return markedEnemy;
}

/**
 * 获取怪物的临界信息
 * @param id 怪物id
 */
export function getMarkInfo(id: EnemyIds, noMessage: boolean = false) {
    const reached = criticalReached[id]!;
    const info = markInfo[id]!;
    if (core.status.hero.atk >= info.nextCritical) {
        if (!reached[info.nextCritical] && !noMessage) {
            tip('success', `踩到了${core.material.enemys[id].name}的临界！`);
        }
        reached[info.nextCritical] = true;
        const n = info.enemy.calCritical(1)[0]?.atkDelta;
        const next = (n ?? 0) + core.status.hero.atk;
        info.nextCritical = next;
    }
}

/**
 * 检查被标记怪物的状态
 */
export function checkMarkedEnemy(noMessage: boolean = false) {
    checkMarkedStatus.value = !checkMarkedStatus.value;
    const hp = core.status.hero.hp;
    getMarkedEnemy().forEach(v => {
        getMarkInfo(v);
        const { enemy } = markInfo[v]!;
        const damage = enemy.calDamage().damage;
        if (!isFinite(damage)) return;
        const info = enemyDamageInfo[v]!;
        const name = core.material.enemys[v].name;
        let res = 0;
        if (damage <= 0) {
            if (!noMessage) tip('success', `${name}已经零伤了！`);
        } else if (damage < hp / 3) {
            if (!info[3] && !noMessage) {
                tip('success', `${name}的伤害已降至勇士生命值的1/3！`);
            }
            res = 0b111;
        } else if (damage < (hp / 3) * 2) {
            if (!info[2] && !noMessage) {
                tip('success', `${name}的伤害已降至勇士生命值的2/3！`);
            }
            res = 0b110;
        } else if (damage < hp) {
            if (!info[1] && !noMessage) {
                tip('success', `你已经能打过${name}了！`);
            }
            res = 0b100;
        }
        info[1] = info[2] = info[3] = false;
        if (res & 0b100) {
            info[1] = true;
        }
        if (res & 0b010) {
            info[2] = true;
        }
        if (res & 0b001) {
            info[3] = true;
        }
    });
}

export const checkMarkedStatus = ref(false);

export default function init() {
    // 鼠标移动时进行监听，按下M时进行快速标记
    core.registerAction(
        'onmove',
        'mark',
        (x, y) => {
            if (core.isPlaying()) {
                flags.mouseLoc = [x, y];
            }
            return false;
        },
        150
    );
    return {
        checkMarkedEnemy,
        checkStatus: checkMarkedStatus,
        markEnemy,
        hasMarkedEnemy,
        unmarkEnemy,
        showMarkedEnemy,
        unmarkAll
    };
}
