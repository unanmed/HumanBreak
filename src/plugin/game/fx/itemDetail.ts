import { EnemyCollection, ensureFloorDamage } from '@/game/enemy/damage';
import { checkV2, formatDamage } from '../utils';

export function init() {
    core.control.updateDamage = function (
        floorId = core.status.floorId,
        ctx,
        thumbnail: boolean = false
    ) {
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
        if (thumbnail) {
            renderThumbnailDamage(floor.enemy);
            this.drawDamage(ctx, floorId);
        }
    };
}

function renderThumbnailDamage(col: EnemyCollection) {
    core.status.damage.data = [];
    core.status.damage.extraData = [];
    core.status.damage.dir = [];

    // 怪物伤害
    col.list.forEach(v => {
        const { damage } = v.calDamage();

        // 伤害全部相等，绘制在怪物本身所在位置
        const { damage: dam, color } = formatDamage(damage);
        const critical = v.calCritical(1)[0];
        core.status.damage.data.push({
            text: dam,
            px: 32 * v.x! + 1,
            py: 32 * (v.y! + 1) - 1,
            color: color
        });
        const setting = Mota.require('var', 'mainSetting');
        const criGem = setting.getValue('screen.criticalGem', false);
        const n = critical?.atkDelta ?? Infinity;
        const ratio = core.status.maps[col.floorId].ratio;
        const cri = criGem ? Math.ceil(n / ratio) : n;

        core.status.damage.data.push({
            text: isFinite(cri) ? cri.toString() : '?',
            px: 32 * v.x! + 1,
            py: 32 * (v.y! + 1) - 11,
            color: '#fff'
        });
    });

    // 地图伤害
    const floor = core.status.maps[col.floorId];
    const width = floor.width;
    const height = floor.height;
    const objs = core.getMapBlocksObj(col.floorId);

    const startX = 0;
    const endX = width;
    const startY = 0;
    const endY = height;

    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            const id = `${x},${y}` as LocString;
            const dam = col.mapDamage[id];
            if (!dam || objs[id]?.event.noPass) continue;

            // 地图伤害
            if (dam.damage !== 0) {
                const damage = core.formatBigNumber(dam.damage, true);
                const color = dam.damage < 0 ? '#6eff6a' : '#fa3';
                core.status.damage.extraData.push({
                    text: damage,
                    px: 32 * x + 16,
                    py: 32 * y + 16,
                    color,
                    alpha: 1
                });
            }

            // 电摇嘲讽
            if (dam.mockery) {
                dam.mockery.sort((a, b) =>
                    a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]
                );
                const [tx, ty] = dam.mockery[0];
                const dir = x > tx ? '←' : x < tx ? '→' : y > ty ? '↑' : '↓';
                core.status.damage.extraData.push({
                    text: '嘲' + dir,
                    px: 32 * x + 16,
                    py: 32 * (y + 1) - 14,
                    color: '#fd4',
                    alpha: 1
                });
            }

            // 追猎
            if (dam.hunt) {
                core.status.damage.extraData.push({
                    text: '猎',
                    px: 32 * x + 16,
                    py: 32 * (y + 1) - 14,
                    color: '#fd4',
                    alpha: 1
                });
            }
        }
    }
}
