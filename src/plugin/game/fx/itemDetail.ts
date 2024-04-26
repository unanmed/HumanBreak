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
        core.status.damage.data = [];

        floor.enemy.render(true);

        getItemDetail(floorId, onMap); // 宝石血瓶详细信息
        this.drawDamage(ctx, floorId);
    };
}

// 获取宝石信息 并绘制
function getItemDetail(floorId: FloorIds, onMap: boolean) {
    const setting = Mota.require('var', 'mainSetting');
    if (!setting.getValue('screen.itemDetail')) return;
    floorId ??= core.status.thisMap.floorId;
    let diff: Record<string | symbol, number | undefined> = {};
    const before = core.status.hero;
    const hero = core.clone(core.status.hero);
    const handler: ProxyHandler<any> = {
        set(target, key, v) {
            diff[key] = v - (target[key] || 0);
            if (!diff[key]) diff[key] = void 0;
            return true;
        }
    };
    core.status.hero = new Proxy(hero, handler);

    core.status.maps[floorId].blocks.forEach(function (block) {
        if (block.event.cls !== 'items' || block.disable) return;
        const x = block.x,
            y = block.y;
        // v2优化，只绘制范围内的部分
        if (onMap && core.bigmap.v2) {
            if (
                x < core.bigmap.posX - core.bigmap.extend ||
                x > core.bigmap.posX + core._PX_ + core.bigmap.extend ||
                y < core.bigmap.posY - core.bigmap.extend ||
                y > core.bigmap.posY + core._PY_ + core.bigmap.extend
            ) {
                return;
            }
        }
        diff = {};
        const id = block.event.id as AllIdsOf<'items'>;
        const item = core.material.items[id];
        if (item.cls === 'equips') {
            // 装备也显示
            const diff: Record<string, any> = core.clone(
                item.equip.value ?? {}
            );
            const per = item.equip.percentage ?? {};
            for (const name in per) {
                diff[name + 'per'] =
                    per[name as SelectKey<HeroStatus, number>].toString() + '%';
            }
            drawItemDetail(diff, x, y);
            return;
        }
        // 跟数据统计原理一样 执行效果 前后比较
        core.setFlag('__statistics__', true);
        try {
            eval(item.itemEffect!);
        } catch (error) {}
        drawItemDetail(diff, x, y);
    });
    core.status.hero = before;
    window.hero = before;
    window.flags = before.flags;
}

// 绘制
function drawItemDetail(diff: any, x: number, y: number) {
    const px = 32 * x + 2,
        py = 32 * y + 31;
    let content = '';
    // 获得数据和颜色
    let i = 0;
    for (const name in diff) {
        if (!diff[name]) continue;
        let color = '#fff';

        if (typeof diff[name] === 'number')
            content = core.formatBigNumber(diff[name], true);
        else content = diff[name];
        switch (name) {
            case 'atk':
            case 'atkper':
                color = '#FF7A7A';
                break;
            case 'def':
            case 'defper':
                color = '#00E6F1';
                break;
            case 'mdef':
            case 'mdefper':
                color = '#6EFF83';
                break;
            case 'hp':
                color = '#A4FF00';
                break;
            case 'hpmax':
            case 'hpmaxper':
                color = '#F9FF00';
                break;
            case 'mana':
                color = '#c66';
                break;
        }
        // 绘制
        core.status.damage.data.push({
            text: content,
            px: px,
            py: py - 10 * i,
            color: color as Color
        });
        i++;
    }
}
