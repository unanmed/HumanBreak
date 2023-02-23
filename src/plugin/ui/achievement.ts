import { ref } from 'vue';
import list from '../../data/achievement.json';
import { achiDict, checkCompletionAchievement } from '../completion';
import { changeLocalStorage, has } from '../utils';

type AchievementList = typeof list;
export type AchievementType = keyof AchievementList;

type AchievementData = Record<AchievementType, boolean[]>;

export interface Achievement {
    name: string;
    text: string[];
    point: number;
    hide?: string;
    progress?: string;
    percent?: boolean;
}

export default function init() {
    return { completeAchievement, hasCompletedAchievement, addMountSign };
}

export const showComplete = ref(false);
export const completeAchi = ref('explore,1');

export const totalPoint = Object.values(list)
    .map((v: Achievement[]) =>
        v.reduce((prev, curr) => {
            return curr.point + prev;
        }, 0)
    )
    .reduce((prev, curr) => prev + curr);

/**
 * 完成一个成就
 * @param type 成就类型
 * @param index 成就索引
 */
export function completeAchievement(type: AchievementType, index: number) {
    if (flags.debug) return;
    changeLocalStorage<AchievementData>(
        'achievement',
        data => {
            data[type][index] = true;
            return data;
        },
        {
            normal: [],
            challenge: [],
            explore: []
        }
    );
    if (type === 'explore' && !Object.values(achiDict).includes(index)) {
        checkCompletionAchievement();
    }
    completeAchi.value = `${type},${index}`;
    showComplete.value = true;
}

/**
 * 是否完成了某个成就
 * @param type 成就类型
 * @param index 成就索引
 */
export function hasCompletedAchievement(type: AchievementType, index: number) {
    let data = core.getLocalStorage<AchievementData>('achievement');
    if (!has(data)) {
        const d = {
            normal: [],
            challenge: [],
            explore: []
        };
        data = d;
        core.setLocalStorage('achievement', d);
    }
    return data[type][index] ?? false;
}

/**
 * 获取当前成就点数
 */
export function getNowPoint() {
    let res = 0;
    for (const [type, achi] of Object.entries(list)) {
        achi.forEach((v, i) => {
            if (hasCompletedAchievement(type as AchievementType, i)) {
                res += v.point;
            }
        });
    }
    return res;
}

// ----- 各个成就相关的函数

/**
 * 山路木牌
 * @param id 木牌id
 */
export function addMountSign(id: number) {
    if (flags.debug) return;
    if (
        !core.getLocalStorage(`mountSign_${id}`, false) &&
        !hasCompletedAchievement('explore', 1)
    ) {
        changeLocalStorage(
            'mountSign',
            n => {
                if (n + 1 >= 5) {
                    completeAchievement('explore', 1);
                    for (const i of [1, 2, 3, 4, 5]) {
                        core.removeLocalStorage(`mountSign_${i}`);
                    }
                }
                return n + 1;
            },
            0
        );
        core.setLocalStorage(`mountSign_${id}`, true);
    }
}
