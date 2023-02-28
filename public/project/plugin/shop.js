///<reference path="../../../src/types/core.d.ts" />
'use strict';

(function () {
    const { openItemShop } = core.plugin.gameUi;

    function openShop(shopId, noRoute) {
        var shop = core.status.shops[shopId];
        // Step 1: 检查能否打开此商店
        if (!this.canOpenShop(shopId)) {
            core.drawTip('该商店尚未开启');
            return false;
        }

        // Step 3: 检查道具商店 or 公共事件
        if (shop.item) {
            if (openItemShop) openItemShop(shopId);
            return;
        }
        return true;
    }

    /// 是否访问过某个快捷商店
    function isShopVisited(id) {
        flags.__shops__ ??= {};
        var shops = core.getFlag('__shops__');
        if (!shops[id]) shops[id] = {};
        return shops[id].visited;
    }

    /// 当前应当显示的快捷商店列表
    function listShopIds() {
        return Object.keys(core.status.shops).filter(id => {
            return (
                core.plugin.shop.isShopVisited(id) ||
                !core.status.shops[id].mustEnable
            );
        });
    }

    /// 是否能够打开某个商店
    function canOpenShop(id) {
        if (this.isShopVisited(id)) return true;
        var shop = core.status.shops[id];
        if (shop.item || shop.commonEvent || shop.mustEnable) return false;
        return true;
    }

    /// 启用或禁用某个快捷商店
    function setShopVisited(id, visited) {
        if (!core.hasFlag('__shops__')) core.setFlag('__shops__', {});
        var shops = core.getFlag('__shops__');
        if (!shops[id]) shops[id] = {};
        if (visited) shops[id].visited = true;
        else delete shops[id].visited;
    }

    /// 能否使用快捷商店
    function canUseQuickShop() {
        // 如果返回一个字符串，表示不能，字符串为不能使用的提示
        // 返回null代表可以使用

        // 检查当前楼层的canUseQuickShop选项是否为false
        if (core.status.thisMap.canUseQuickShop === false)
            return '当前楼层不能使用快捷商店。';
        return null;
    }

    core.plugin.shop = {
        openShop,
        isShopVisited,
        listShopIds,
        canOpenShop,
        setShopVisited,
        canUseQuickShop
    };
})();
