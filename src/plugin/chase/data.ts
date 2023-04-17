import { PathFn, TimingFn } from 'mutate-animate';
import { Chase } from './chase';

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
    throw new ReferenceError(`Deliver wrong chase index.`);
}
