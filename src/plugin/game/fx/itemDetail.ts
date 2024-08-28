import { ensureFloorDamage } from '@/game/enemy/damage';

export function init() {
    core.control.updateDamage = function (floorId = core.status.floorId, ctx) {
        if (!floorId || core.status.gameOver || main.mode !== 'play') return;
        const onMap = ctx == null;
        const floor = core.status.maps[floorId];

        // 没有怪物手册
        // if (!core.hasItem('book')) return;
        core.status.damage.posX = core.bigmap.posX;
        core.status.damage.posY = core.bigmap.posY;
        if (!onMap) {
            const width = core.floors[floorId].width,
                height = core.floors[floorId].height;
            // 地图过大的缩略图不绘制显伤
            if (width * height > core.bigmap.threshold) return;
        }
        // 计算伤害
        ensureFloorDamage(floorId);

        floor.enemy.extract();
        floor.enemy.calRealAttribute();
        floor.enemy.calMapDamage();
        floor.enemy.emit('calculated');
        core.status.damage.data = [];

        // floor.enemy.render(true);

        // getItemDetail(floorId, onMap); // 宝石血瓶详细信息
        // this.drawDamage(ctx, floorId);
    };
}
