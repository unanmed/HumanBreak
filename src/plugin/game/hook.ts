import { hook } from '@/game/game';

export {};

const potionItems: AllIdsOf<'items'>[] = [
    'redPotion',
    'bluePotion',
    'yellowPotion',
    'greenPotion',
    'I482',
    'I484',
    'I487',
    'I491'
];

hook.on('afterGetItem', (itemId, x, y, isGentleClick) => {
    // 获得一个道具后触发的事件
    // itemId：获得的道具ID；x和y是该道具所在的坐标
    // isGentleClick：是否是轻按触发的
    if (potionItems.includes(itemId)) core.playSound('回血');
    else core.playSound('获得道具');

    const todo: any[] = [];
    // 检查该点的获得道具后事件。
    if (core.status.floorId == null) return;
    const event = core.floors[core.status.floorId].afterGetItem[`${x},${y}`];
    if (
        event &&
        (event instanceof Array ||
            !isGentleClick ||
            !event.disableOnGentleClick)
    ) {
        core.unshift(todo, event as any[]);
    }
    if (core.hasFlag('spring')) {
        if (!core.hasFlag('springCount')) core.setFlag('springCount', 0);
        if (potionItems.includes(itemId)) {
            core.addFlag('springCount', 1);
        }
        if (core.getFlag<number>('springCount', 0) === 50) {
            core.setFlag('springCount', 0);
            core.status.hero.hpmax += core.getNakedStatus('hpmax') * 0.1;
        }
        core.updateStatusBar();
    }

    if (todo.length > 0) core.insertAction(todo, x, y);
});

hook.on('afterOpenDoor', (doorId, x, y) => {
    // 开一个门后触发的事件

    const todo: any[] = [];
    // 检查该点的获得开门后事件。
    if (core.status.floorId == null) return;
    const event = core.floors[core.status.floorId].afterOpenDoor[`${x},${y}`];
    if (event) core.unshift(todo, event as any[]);

    if (todo.length > 0) core.insertAction(todo, x, y);

    if (core.status.event.id == null) core.continueAutomaticRoute();
    else core.clearContinueAutomaticRoute();
});
