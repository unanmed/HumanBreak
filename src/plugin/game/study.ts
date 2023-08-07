// 负责勇士技能：学习
const values: Record<number, string[]> = {
    1: ['crit'],
    6: ['n'],
    7: ['hungry'],
    8: ['together'],
    10: ['courage'],
    11: ['charge']
};

const cannotStudy = [9, 12, 14, 15, 24];

export function canStudySkill(number: number) {
    const s = (core.status.hero.special ??= { num: [], last: [] });
    if (core.plugin.skillTree.getSkillLevel(11) === 0) return false;
    if (s.num.length >= 1) return false;
    if (s.num.includes(number)) return false;
    if (cannotStudy.includes(number)) return false;
    return true;
}

export function studySkill(enemy: any, number: number) {
    core.status.hero.special ??= { num: [], last: [] };
    const s = core.status.hero.special;
}

export function forgetStudiedSkill(num: number, i: number) {
    const s = core.status.hero.special;
    const index = i !== void 0 && i !== null ? i : s.num.indexOf(num);
    if (index === -1) return;
    s.num.splice(index, 1);
    s.last.splice(index, 1);
    const value = values[num] ?? [];
    for (const key of value) {
        delete s[key];
    }
}

export function declineStudiedSkill() {
    const s = (core.status.hero.special ??= { num: [], last: [] });
    s.last = s.last.map(v => v - 1);
}

export function checkStudiedSkill() {
    const s = core.status.hero.special;
    for (let i = 0; i < s.last.length; i++) {
        if (s.last[i] <= 0) {
            forgetStudiedSkill(1, i);
            i--;
        }
    }
}
