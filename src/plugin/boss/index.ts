import { BarrageBoss } from './barrage';
import { TowerBoss } from './towerBoss';

let boss: BarrageBoss;

export function startTowerBoss() {
    boss = new TowerBoss();
    boss.start();
}

export function getBoss<T extends BarrageBoss>(): T {
    return boss as T;
}
