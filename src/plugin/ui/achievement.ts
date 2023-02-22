import list from '../../data/achievement.json';
import { has } from '../utils';

type AchievementList = typeof list;
type AchievementType = keyof AchievementList;

type AchievementData = Record<AchievementType, boolean[]>;

export default function init() {
    return {};
}

export function completeAchievement(type: AchievementType, index: number) {}

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
