import { has } from '@/plugin/game/utils';
import { EnemyInfo } from '../enemy/damage';
import { getSkillLevel } from '@/plugin/game/skillTree';
import { hook } from '../game';

// 负责勇士技能：学习
const canStudy: Set<number> = new Set([1, 4, 5, 6, 7, 10, 11, 20, 28, 30]);
const numberProp: Record<number, (keyof Enemy)[]> = {
    1: ['crit'],
    6: ['n'],
    7: ['hungry'],
    10: ['courage'],
    11: ['charge'],
    20: ['ice'],
    28: ['paleShield']
};

hook.on('afterBattle', () => {
    declineStudiedSkill();
});

/**
 * 判断是否可以学习某个技能
 * @param number 要学习的技能
 */
export function canStudySkill(number: number) {
    const s = (core.status.hero.special ??= { num: [], last: [] });
    if (Mota.Plugin.require('skillTree_g').getSkillLevel(11) === 0)
        return false;
    if (s.num.length >= 1) return false;
    if (s.num.includes(number)) return false;
    return canStudy.has(number);
}

/**
 * 学习某个怪物的某个技能
 * @param enemy 被学习的怪物
 * @param number 学习的技能
 */
export function studySkill(enemy: EnemyInfo, number: number) {
    core.status.hero.special ??= { num: [], last: [] };
    const s = core.status.hero.special;
    if (!canStudySkill(number)) return false;
    s.num.push(number);
    s.last.push(getSkillLevel(11) * 3 + 2);
    const value = numberProp[number] ?? [];
    for (const key of value) {
        s[key] = enemy[key];
    }
    return true;
}

/**
 * 忘记某个学习过的技能
 * @param num 要忘记的技能
 * @param i 技能所在索引
 */
export function forgetStudiedSkill(num: number, i: number) {
    const s = core.status.hero.special;
    const index = has(i) ? i : s.num.indexOf(num);
    if (index === -1) return;
    s.num.splice(index, 1);
    s.last.splice(index, 1);
    const value = numberProp[num] ?? [];
    for (const key of value) {
        delete s[key];
    }
}

/**
 * 战斗后减少剩余次数
 */
export function declineStudiedSkill() {
    const s = (core.status.hero.special ??= { num: [], last: [] });
    for (let i = 0; i < s.last.length; i++) {
        s.last[i]--;
        if (s.last[i] === 0) {
            forgetStudiedSkill(s.num[i], i);
        }
    }
}
