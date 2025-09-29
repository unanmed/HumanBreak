export function createCheckBlock() {
    // 伤害弹出
    // 复写阻激夹域检测
    control.prototype.checkBlock = function () {
        const x = core.getHeroLoc('x'),
            y = core.getHeroLoc('y'),
            loc = x + ',' + y;
        const info = core.status.thisMap.enemy.mapDamage[loc];
        const damage = info?.damage;
        if (damage) {
            core.status.hero.hp -= damage;
            const type = [...info.type];
            const text = type.join('，') || '伤害';
            core.drawTip('受到' + text + damage + '点');
            core.drawHeroAnimate('zone');
            this._checkBlock_disableQuickShop();
            core.status.hero.statistics.extraDamage += damage;
            if (core.status.hero.hp <= 0) {
                core.status.hero.hp = 0;
                core.updateStatusBar();
                core.events.lose();
                return;
            } else {
                core.updateStatusBar();
            }
        }
    };
}
