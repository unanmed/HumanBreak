///<reference path="../../../src/types/core.d.ts" />
export {};

core.control.updateDamage = function (floorId, ctx) {
    floorId = floorId || core.status.floorId;
    if (!floorId || core.status.gameOver || main.mode != 'play') return;
    const onMap = ctx == null;

    // 没有怪物手册
    if (!core.hasItem('book')) return;
    core.status.damage.posX = core.bigmap.posX;
    core.status.damage.posY = core.bigmap.posY;
    if (!onMap) {
        const width = core.floors[floorId].width,
            height = core.floors[floorId].height;
        // 地图过大的缩略图不绘制显伤
        if (width * height > core.bigmap.threshold) return;
    }
    this._updateDamage_damage(floorId, onMap);
    this._updateDamage_extraDamage(floorId, onMap);
    getItemDetail(floorId, onMap); // 宝石血瓶详细信息
    this.drawDamage(ctx);
};

// 获取宝石信息 并绘制
function getItemDetail(floorId, onMap) {
    if (!core.getFlag('itemDetail')) return;
    floorId ??= core.status.thisMap.floorId;
    let diff = {};
    const before = core.status.hero;
    const hero = core.clone(core.status.hero);
    const handler = {
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
        const id = block.event.id;
        const item = core.material.items[id];
        if (item.cls === 'equips') {
            // 装备也显示
            const diff = core.clone(item.equip.value ?? {});
            const per = item.equip.percentage ?? {};
            for (const name in per) {
                diff[name + 'per'] = per[name].toString() + '%';
            }
            drawItemDetail(diff, x, y);
            return;
        }
        // 跟数据统计原理一样 执行效果 前后比较
        core.setFlag('__statistics__', true);
        try {
            eval(item.itemEffect);
        } catch (error) {}
        drawItemDetail(diff, x, y);
    });
    core.status.hero = before;
    window.hero = before;
    window.flags = before.flags;
}

// 绘制
function drawItemDetail(diff, x, y) {
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
            color: color
        });
        i++;
    }
}
