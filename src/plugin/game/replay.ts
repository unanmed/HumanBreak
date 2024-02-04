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
}
