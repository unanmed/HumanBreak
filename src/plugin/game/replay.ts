import { canStudySkill, studySkill } from '@/game/mechanism/study';
import { upgradeSkill } from './skillTree';
import { ensureFloorDamage } from '@/game/enemy/damage';

const replayableSettings = ['autoSkill'];

let cliping = false;
let startIndex = 0;

export function ready() {}

export function readyClip() {
    cliping = true;
    return (startIndex = core.status.route.length - 1);
}

export function clip(...replace: string[]) {
    if (!cliping) return;
    cliping = false;

    core.status.route.splice(startIndex);
    core.status.route.push(...replace);
}

export function init() {
    // 注册修改设置的录像操作
    core.registerReplayAction('settings', name => {
        if (!name.startsWith('set:')) return false;
        const [, setting, value] = name.split(':');
        const v = eval(value);
        if (typeof v !== 'boolean') return false;
        if (!replayableSettings.includes(setting)) return false;
        flags[setting] = v;
        core.status.route.push(name);
        core.replay();
        return true;
    });

    core.registerReplayAction('upgradeSkill', name => {
        if (!name.startsWith('skill:')) return false;
        const skill = parseInt(name.slice(6));
        upgradeSkill(skill);
        core.status.route.push(name);
        core.replay();
        return true;
    });

    // 商店
    let shopOpened = false;
    let openedShopId = '';
    core.registerReplayAction('openShop', name => {
        if (!name.startsWith('openShop:')) return false;
        if (shopOpened) return false;
        openedShopId = name.slice(9);
        shopOpened = true;
        core.status.route.push(name);
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
        const shop = core.status.shops[openedShopId] as ItemShopEvent;
        const item = shop.choices.find(v => v.id === id);
        if (!item) return false;
        flags.itemShop ??= {};
        flags.itemShop[openedShopId] ??= {};
        flags.itemShop[openedShopId][id] ??= 0;
        if ((num as number) > item.number - flags.itemShop[openedShopId][id]) {
            return false;
        }
        let cost = 0;
        if (type === 'buy') {
            cost = parseInt(item.money) * (num as number);
        } else {
            cost = -item.sell * (num as number);
        }
        if (cost > core.status.hero.money) return false;
        core.status.hero.money -= cost;
        flags.itemShop[openedShopId][id] += type === 'buy' ? num : -num;
        core.addItem(
            id as AllIdsOf<'items'>,
            (type === 'buy' ? num : -num) as number
        );
        core.status.route.push(name);
        core.replay();
        return true;
    });

    core.registerReplayAction('closeShop', name => {
        if (name !== 'closeShop') return false;
        if (!shopOpened) return false;
        shopOpened = false;
        openedShopId = '';
        core.status.route.push(name);
        core.replay();
        return true;
    });

    function skillAction(skill: string) {
        if (skill === '1') {
            if (flags.autoSkill || !flags.bladeOn) return true;
            if (flags.blade) flags.blade = false;
            else flags.blade = true;
        } else if (skill === '2') {
            if (
                !flags.chase &&
                !core.status.floorId.startsWith('tower') &&
                flags.skill2
            ) {
                Mota.Plugin.require('skill_g').jumpSkill();
            } else {
                if (core.hasItem('pickaxe')) {
                    core.useItem('pickaxe');
                }
            }
        } else if (skill === '3') {
            if (flags.autoSkill || !flags.shieldOn) return true;
            if (flags.shield) flags.shield = false;
            else flags.shield = true;
        }
        core.updateStatusBar();
        core.replay();
        return true;
    }

    core.registerReplayAction('skill', name => {
        if (!name.startsWith('skill:')) return false;
        const [type, skill] = name.split(':');
        return skillAction(skill);
    });

    // 兼容旧版
    core.registerReplayAction('key', name => {
        if (!name.startsWith('key:')) return false;
        const key = parseInt(name.slice(4));

        if (key === 49) {
            core.status.route.push(`skill:1`);
            return skillAction('1');
        } else if (key === 50) {
            core.status.route.push(`skill:2`);
            return skillAction('2');
        } else if (key === 51) {
            core.status.route.push(`skill:3`);
            return skillAction('3');
        }

        return false;
    });
}
