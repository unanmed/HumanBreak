///<reference path="../../../src/types/core.d.ts" />

import { studySkill, canStudySkill } from './study.js';

const replayableSettings = ['autoSkill'];

// 注册修改设置的录像操作
core.registerReplayAction('settings', name => {
    if (!name.startsWith('set:')) return false;
    const [, setting, value] = name.split(':');
    const v = eval(value);
    if (typeof v !== 'boolean') return false;
    if (!replayableSettings.includes(setting)) return false;
    flags[setting] = v;
    core.replay();
    return true;
});

core.registerReplayAction('upgradeSkill', name => {
    if (!name.startsWith('skill:')) return false;
    const skill = parseInt(name.slice(6));
    core.plugin.skillTree.upgradeSkill(skill);
    core.replay();
    return true;
});

core.registerReplayAction('study', name => {
    if (!name.startsWith('study:')) return false;
    const [num, x, y] = name
        .slice(6)
        .split(',')
        .map(v => parseInt(v));
    if (!canStudySkill(num)) return false;
    const id = core.getBlockId(x, y);
    const enemy = core.getEnemyInfo(id, void 0, x, y);
    if (!enemy.special.includes(num)) return false;
    studySkill(enemy, num);
    core.replay();
    return true;
});

// 商店
let shopOpened = false;
let openedShopId = '';
core.registerReplayAction('openShop', name => {
    if (!name.startsWith('openShop:')) return false;
    openedShopId = name.slice(9);
    shopOpened = true;
    core.replay();
    return true;
});

core.registerReplayAction('buy', name => {
    if (!name.startsWith('buy:') && !name.startsWith('sell:')) return false;
    if (!shopOpened) return false;
    if (!openedShopId) return false;
    const [type, id, num] = name
        .split(':')
        .map(v => (/^\d+$/.test(v) ? parseInt(v) : v));
    const shop = core.status.shops[id];
    const item = shop.choices.find(v => v.id === id);
    if (!item) return false;
    flags.itemShop ??= {};
    flags.itemShop[openedShopId] ??= {};
    flags.itemShop[openedShopId][id] ??= 0;
    if (num > item.number - flags.itemShop[openedShopId][id]) {
        return false;
    }
    let cost = 0;
    if (type === 'buy') {
        cost = item.money * num;
    } else {
        cost = -item.sell * num;
    }
    if (cost > core.status.hero.money) return false;
    core.status.hero.money -= cost;
    flags.itemShop[openedShopId][id] += type === 'buy' ? num : -num;
    core.replay();
    return true;
});

core.registerReplayAction('closeShop', name => {
    if (name !== 'closeShop') return false;
    if (!shopOpened) return false;
    shopOpened = false;
    openedShopId = '';
    core.replay();
    return true;
});
