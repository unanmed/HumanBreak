// todo: 优化，直接调用 floor.enemy.list 进行计算

/**
 * 检查漏怪
 */
export function checkRemainEnemy(floorIds: FloorIds[]) {
    const enemy: Partial<Record<FloorIds, { loc: LocArr; id: EnemyIds }[]>> =
        {};
    floorIds.forEach(v => {
        core.extractBlocks(v);
        const blocks = core.status.maps[v].blocks;
        blocks.forEach(block => {
            if (!block.event.cls.startsWith('enemy') || block.disable) return;
            const id: EnemyIds = block.event.id as EnemyIds;
            enemy[v] ??= [];
            const info = enemy[v]!;
            info.push({ loc: [block.x, block.y], id });
        });
    });
    return enemy;
}

/**
 * 获取剩余怪物字符串
 */
export function getRemainEnemyString(floorIds: FloorIds[]) {
    const enemy = checkRemainEnemy(floorIds);
    const str = [];
    let now = [];
    for (const floor in enemy) {
        const all: { loc: LocArr; id: EnemyIds }[] = enemy[floor as FloorIds]!;
        const remain: Partial<Record<EnemyIds, number>> = {};
        all.forEach(v => {
            const id = v.id;
            remain[id] ??= 0;
            remain[id]!++;
        });
        const title = core.status.maps[floor as FloorIds].title;
        for (const id in remain) {
            const name = core.material.enemys[id as EnemyIds].name;
            now.push(`${title}(${floor}): ${name} * ${remain[id as EnemyIds]}`);
            if (now.length === 10) {
                str.push(now.join('\n'));
                now = [];
            }
        }
    }
    if (now.length > 0) {
        str.push(now.join('\n'));
        str[0] = `当前剩余怪物：\n${str[0]}`;
    }

    return str;
}
