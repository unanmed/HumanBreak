import {
    AchievementType,
    completeAchievement,
    hasCompletedAchievement
} from './ui/achievement';
import { changeLocalStorage } from './utils';
import list from '../data/achievement.json';

export const floors: Record<number, FloorIds[]> = {
    1: ['MT0', 'tower7']
};
const achis: Record<number, Record<AchievementType, number[]>> = {
    1: {
        normal: [0, 1],
        challenge: [0],
        explore: [1]
    }
};

export const achiDict: Record<number, number> = {
    1: 0
};

export function init() {
    Object.values(floors).forEach((v, i) => {
        const from = core.floorIds.indexOf(v[0]);
        const to = core.floorIds.indexOf(v[1]);
        const all = core.floorIds.slice(from, to + 1);
        floors[i + 1] = all;
    });
}

/**
 * 检查所有到达过的楼层，用于成就的计算
 */
export function checkVisitedFloor() {
    changeLocalStorage<Partial<Record<FloorIds, boolean>>>(
        'visitedFloor',
        data => {
            let needUpdate = false;
            core.floorIds.forEach(v => {
                if (core.hasVisitedFloor(v)) {
                    data[v] = true;
                    needUpdate = true;
                }
            });
            if (needUpdate) {
                checkCompletionAchievement();
            }

            return data;
        },
        {}
    );
}

/**
 * 获取一个章节的完成度
 * @param num 章节
 */
export function getChapterCompletion(num: number) {
    if (!achis[num]) return 0;
    let res = 0;
    const all = floors[num];
    const achiNum = Object.values(achis[num]).reduce(
        (pre, cur) => pre + cur.length,
        0
    );

    // 计算到达过的楼层
    let visitedFloor = 0;
    const visited = core.getLocalStorage<Partial<Record<FloorIds, boolean>>>(
        'visitedFloor',
        {}
    );
    all.forEach(v => {
        if (visited[v]) visitedFloor++;
    });
    const floorRatio = all.length / (all.length + achiNum);
    const floorPoint = (floorRatio * visitedFloor) / all.length;

    let completedPoint = 0;
    let totalPoint = 0;

    // 计算成就，占比按成就点走
    for (const [type, achi] of Object.entries(achis[num]) as [
        AchievementType,
        number[]
    ][]) {
        achi.forEach(v => {
            totalPoint += list[type][v].point;
            if (hasCompletedAchievement(type, v)) {
                completedPoint += list[type][v].point;
            }
        });
    }
    const achiPoint = (completedPoint / totalPoint) * (1 - floorRatio);

    res = floorPoint + achiPoint;

    return Math.floor(res * 100);
}

/**
 * 检查完成度成就是否完成
 */
export function checkCompletionAchievement() {
    [1].forEach(v => {
        if (getChapterCompletion(v) >= 100) {
            completeAchievement('explore', achiDict[v]);
        }
    });
}
