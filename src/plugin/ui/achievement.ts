import list from '../../data/achievement.json';

type AchievementList = typeof list;
type AchievementType = keyof AchievementList;

export default function init() {
    return {};
}

export function completeAchievement(type: AchievementType, index: number) {}

export function hasCompletedAchievement(type: AchievementType, index: number) {
    return true;
}
