import { PathFn, TimingFn } from 'mutate-animate';
import { Chase } from './chase';
import {
    camera1,
    para1,
    para2,
    para3,
    path1,
    chaseShake,
    wolfMove,
    init1,
    judgeFail1,
    drawBack
} from './chase1';

export type ChaseCameraData = [
    floorId: FloorIds, // 楼层
    x: number, // 目标横坐标
    y: number, // 目标纵坐标
    start: number, // 开始时间
    time: number, // 持续时间
    mode: TimingFn, // 渐变函数
    path?: PathFn // 路径函数
];

export type ChasePath = Partial<Record<FloorIds, LocArr[]>>;

interface ChaseData {
    camera: ChaseCameraData[];
    fns: ((chase: Chase) => void)[];
    path: ChasePath;
}

export function getChaseDataByIndex(index: number): ChaseData {
    if (index === 1) {
        init1();
        return {
            camera: camera1,
            fns: [
                para1,
                para2,
                para3,
                chaseShake,
                wolfMove,
                drawBack,
                judgeFail1
            ],
            path: path1
        };
    }
    throw new ReferenceError(`Deliver wrong chase index.`);
}
