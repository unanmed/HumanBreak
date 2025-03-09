import { hook } from '@user/data-base';
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

hook.on('reset', () => {
    if (boss) {
        boss.end();
    }
});
