import { HeroSkill } from '@user/data-state';
import {
    getSkillFromIndex,
    upgradeSkill
} from '../../data-state/src/mechanism/skillTree';
import { canOpenShop } from './shop';
import { hook } from '@user/data-base';
import { jumpSkill } from './skill';

const replayableSettings = ['autoSkill'];

let cliping = false;
let startIndex = 0;

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

export function initReplay() {
    function tipAndWait(content: string, time: number) {
        const speed = core.status.replay.speed;
        if (main.replayChecking || speed === 24) return Promise.resolve();
        const { tip } = Mota.require('@motajs/legacy-ui');
        tip('info', '录像播放操作：' + content);
        return new Promise<void>(res => {
            setTimeout(res, time / speed);
        });
    }

    // 注册修改设置的录像操作
    const settingNameMap: Record<string, string> = {
        autoSkill: '自动切换技能'
    };
    core.registerReplayAction('settings', name => {
        if (!name.startsWith('set:')) return false;
        const [, setting, value] = name.split(':');
        const v = eval(value);
        if (typeof v !== 'boolean') return false;
        if (!replayableSettings.includes(setting)) return false;
        switch (setting) {
            case 'autoSkill':
                HeroSkill.setAutoSkill(v);
                break;
        }
        const settingName = settingNameMap[setting];
        core.status.route.push(name);
        if (settingName) {
            tipAndWait(`切换设置：${settingName}`, 1000).then(() => {
                core.replay();
            });
        } else {
            core.replay();
        }
        return true;
    });

    core.registerReplayAction('upgradeSkill', name => {
        if (!name.startsWith('skill:')) return false;
        const skill = parseInt(name.slice(6));
        upgradeSkill(skill);
        const s = getSkillFromIndex(skill);
        const skillName = s?.title;
        core.status.route.push(name);
        tipAndWait(`升级技能：${skillName}`, 1000).then(() => {
            core.replay();
        });
        return true;
    });

    // 商店
    let shopOpened = false;
    let openedShopId = '';

    hook.on('reset', () => {
        shopOpened = false;
        openedShopId = '';
    });

    core.registerReplayAction('openShop', name => {
        if (!name.startsWith('openShop:')) return false;
        const id = name.slice(9);
        if (!canOpenShop(id)) return false;
        if (shopOpened && openedShopId === id) return true;
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
        const [type, id, n] = name.split(':');
        const num = parseInt(n);
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
        const { name: itemName } = core.material.items[id as AllIdsOf<'items'>];
        core.status.route.push(name);
        tipAndWait(`购买物品：${itemName}`, 1000).then(() => {
            core.replay();
        });
        return true;
    });

    core.registerReplayAction('closeShop', name => {
        if (name !== 'closeShop') return false;
        shopOpened = false;
        openedShopId = '';
        core.status.route.push(name);
        core.replay();
        return true;
    });

    const skillNameMap: Record<string, string> = {
        Blade: '断灭之刃',
        Shield: '铸剑为盾'
    };
    function skillAction(skill: string) {
        let toEmit = skill;

        // 兼容性处理
        if (skill === '1') {
            toEmit = 'Blade';
        } else if (skill === '2') {
            toEmit = 'Jump';
        } else if (skill === '3') {
            toEmit = 'Shield';
        }

        if (toEmit === 'Jump') {
            if (
                !flags.onChase &&
                !core.status.floorId.startsWith('tower') &&
                HeroSkill.learnedSkill(HeroSkill.Jump)
            ) {
                const success = jumpSkill();
                core.status.route.push(`useSkill:${toEmit}`);
                if (!success) core.replay();
                return true;
            } else {
                if (core.hasItem('pickaxe')) {
                    core.useItem('pickaxe');
                }
            }
        } else {
            if (HeroSkill.getAutoSkill()) {
                core.replay();
                core.updateStatusBar();
                return true;
            }
            let num = HeroSkill.Skill.None;
            switch (toEmit) {
                case 'Blade':
                    num = HeroSkill.Blade;
                    break;
                case 'Shield':
                    num = HeroSkill.Shield;
                    break;
            }
            HeroSkill.toggleSkill(num);
        }
        core.updateStatusBar();
        const name = skillNameMap[toEmit];
        core.status.route.push(`useSkill:${toEmit}`);
        if (name) {
            tipAndWait(`切换技能：${name}`, 1000).then(() => {
                core.replay();
            });
        } else {
            core.replay();
        }
        return true;
    }

    core.registerReplayAction('useSkill', name => {
        if (!name.startsWith('useSkill:')) return false;
        const [, skill] = name.split(':');
        return skillAction(skill);
    });

    // 兼容旧版
    core.registerReplayAction('key', name => {
        if (!name.startsWith('key:')) return false;
        const key = parseInt(name.slice(4));

        if (key === 49) {
            return skillAction('1');
        } else if (key === 50) {
            return skillAction('2');
        } else if (key === 51) {
            return skillAction('3');
        }

        return false;
    });

    core.registerReplayAction('fly', action => {
        if (!action.startsWith('fly:')) return false;
        const floorId = action.slice(4) as FloorIds;
        if (
            !core.canUseItem('fly') ||
            (core.flags.flyNearStair && !core.nearStair())
        )
            return false;
        tipAndWait(`飞往：${floorId}`, 1000).then(() => {
            if (!core.flyTo(floorId, core.replay)) {
                core.control._replay_error(action);
            }
        });
        return true;
    });
}
