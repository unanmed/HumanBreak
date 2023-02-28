///<reference path="../../../src/types/core.d.ts" />
'use strict';

(function () {
    /**
     * 检查漏怪
     * @param {FloorIds[]} floorIds
     */
    function checkRemainEnemy(floorIds) {
        /**
         * @type {Record<FloorIds, {loc: LocArr, id: EnemyIds}[]>}
         */
        const enemy = {};
        floorIds.forEach(v => {
            core.extractBlocks(v);
            const blocks = core.status.maps[v].blocks;
            blocks.forEach(block => {
                if (!block.event.cls.startsWith('enemy') || block.disable)
                    return;
                /**
                 * @type {EnemyIds}
                 */
                const id = block.event.id;
                enemy[v] ??= [];
                const info = enemy[v];
                info.push({ loc: [block.x, block.y], id });
            });
        });
        return enemy;
    }

    /**
     * 获取剩余怪物字符串
     * @param {FloorIds[]} floorIds
     */
    function getRemainEnemyString(floorIds) {
        const enemy = checkRemainEnemy(floorIds);
        const str = [];
        let now = [];
        for (const floor in enemy) {
            /**
             * @type {{loc: LocArr, id: EnemyIds}[]}
             */
            const all = enemy[floor];
            /**
             * @type {Record<EnemyIds, number>}
             */
            const remain = {};
            all.forEach(v => {
                const id = v.id;
                remain[id] ??= 0;
                remain[id]++;
            });
            const title = core.status.maps[floor].title;
            for (const id in remain) {
                const name = core.material.enemys[id].name;
                now.push(`${title}(${floor}): ${name} * ${remain[id]}`);
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

    core.plugin.remainEnemy = {
        checkRemainEnemy,
        getRemainEnemyString
    };
})();
