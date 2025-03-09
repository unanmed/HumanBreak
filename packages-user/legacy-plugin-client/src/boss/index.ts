import { BarrageBoss } from './barrage';
import { TowerBoss } from './towerBoss';

let boss: BarrageBoss | null;

export function startTowerBoss() {
    boss = new TowerBoss();
    boss.start();
    boss.once('end', () => {
        boss = null;
    });
}

export function getBoss<T extends BarrageBoss>(): T | null {
    return boss as T;
}

Mota.require('var', 'hook').on('reset', () => {
    if (boss) {
        boss.end();
    }
});
