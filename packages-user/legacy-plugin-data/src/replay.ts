import { canOpenShop } from './shop';
import { hook } from '@user/data-base';

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
