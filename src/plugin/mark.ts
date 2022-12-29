import { reactive, ref } from 'vue';
import { tip } from './utils';

const markedEnemy = reactive<EnemyIds[]>([]);

interface MarkInfo {
    nextCritical: number;
}

const markInfo: Partial<Record<EnemyIds, MarkInfo>> = {};
const criticalReached: Partial<Record<EnemyIds, Record<number, boolean>>> = {};
const enemyDamageInfo: Partial<Record<EnemyIds, Record<number, boolean>>> = {};

/**
 * 标记一个怪物，标记后的怪物会在勇士刚好能打过怪物时、伤害刚好小于勇士生命值的2/3和1/3时、踩到临界时提示
 * @param id 标记的怪物id
 */
export function markEnemy(id: EnemyIds) {
    if (hasMarkedEnemy(id)) return;
    markedEnemy.push(id);
    markInfo[id] = {
        nextCritical:
            core.nextCriticals(id, 1)[0]?.[0] ?? 0 + core.status.hero.atk
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
        const n = core.nextCriticals(id, 1)[0]?.[0];
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
        const damage = core.getDamageInfo(v)?.damage ?? -1;
        if (damage === -1) return;
        const info = enemyDamageInfo[v]!;
        const name = core.material.enemys[v].name;
        if (damage <= 0) {
            if (!noMessage) tip('success', `${name}已经零伤了！`);
        } else if (damage < hp / 3) {
            if (!info[3] && !noMessage) {
                tip('success', `${name}的伤害已降至勇士生命值的1/3！`);
            }
            info[1] = true;
            info[2] = true;
            info[3] = true;
        } else if (damage < (hp / 3) * 2) {
            if (!info[2] && !noMessage) {
                tip('success', `${name}的伤害已降至勇士生命值的2/3！`);
            }
            info[1] = true;
            info[2] = true;
            info[3] = false;
        } else if (damage < hp) {
            if (!info[1] && !noMessage) {
                tip('success', `你已经能打过${name}了！`);
            }
            info[1] = true;
            info[2] = false;
            info[3] = false;
        } else {
            info[1] = false;
            info[2] = false;
            info[3] = false;
        }
    });
}

export const checkMarkedStatus = ref(false);

export default function init() {
    return { checkMarkedEnemy, checkStatus: checkMarkedStatus };
}
