import { loading } from '@/game/game';

let _shouldProcessKeyUp = true;

export function openShop(shopId: string, noRoute: boolean) {
    const shop = core.status.shops[shopId] as any;
    // Step 1: 检查能否打开此商店
    if (!canOpenShop(shopId)) {
        core.drawTip('该商店尚未开启');
        return false;
    }

    // Step 2: （如有必要）记录打开商店的脚本事件
    if (!noRoute && !shop.item) {
        core.status.route.push('shop:' + shopId);
    }

    // Step 3: 检查道具商店 or 公共事件
    if (shop.item) {
        Mota.r(() => {
            if (!core.isReplaying()) {
                Mota.require('var', 'mainUi').open('shop', {
                    shopId: shopId
                });
            }
        });
        return;
    }

    if (shop.commonEvent) {
        core.insertCommonEvent(shop.commonEvent, shop.args);
        return;
    }

    _shouldProcessKeyUp = true;

    // Step 4: 执行标准公共商店
    core.insertAction(_convertShop(shop));
    return true;
}

////// 将一个全局商店转变成可预览的公共事件 //////
function _convertShop(shop: any) {
    return [
        {
            type: 'function',
            function: "function() {core.addFlag('@temp@shop', 1);}"
        },
        {
            type: 'while',
            condition: 'true',
            data: [
                // 检测能否访问该商店
                {
                    type: 'if',
                    condition:
                        "Mota.Plugin.require('shop_g').isShopVisited('" +
                        shop.id +
                        "')",
                    true: [
                        // 可以访问，直接插入执行效果
                        {
                            type: 'function',
                            function:
                                "function() { Mota.Plugin.require('shop_g')._convertShop_replaceChoices('" +
                                shop.id +
                                "', false) }"
                        }
                    ],
                    false: [
                        // 不能访问的情况下：检测能否预览
                        {
                            type: 'if',
                            condition: shop.disablePreview,
                            true: [
                                // 不可预览，提示并退出
                                { type: 'playSound', name: '操作失败' },
                                '当前无法访问该商店！',
                                { type: 'break' }
                            ],
                            false: [
                                // 可以预览：将商店全部内容进行替换
                                {
                                    type: 'tip',
                                    text: '当前处于预览模式，不可购买'
                                },
                                {
                                    type: 'function',
                                    function:
                                        "function() { Mota.Plugin.require('shop_g')._convertShop_replaceChoices('" +
                                        shop.id +
                                        "', true) }"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            type: 'function',
            function: "function() {core.addFlag('@temp@shop', -1);}"
        }
    ];
}

export function _convertShop_replaceChoices(
    shopId: string,
    previewMode: boolean
) {
    var shop = core.status.shops[shopId] as any;
    var choices = (shop.choices || [])
        .filter(function (choice: any) {
            if (choice.condition == null || choice.condition == '') return true;
            try {
                return core.calValue(choice.condition);
            } catch (e) {
                return true;
            }
        })
        .map(function (choice: any) {
            var ableToBuy = core.calValue(choice.need);
            return {
                text: choice.text,
                icon: choice.icon,
                color:
                    ableToBuy && !previewMode
                        ? choice.color
                        : [153, 153, 153, 1],
                action:
                    ableToBuy && !previewMode
                        ? [{ type: 'playSound', name: '商店' }].concat(
                              choice.action
                          )
                        : [
                              { type: 'playSound', name: '操作失败' },
                              {
                                  type: 'tip',
                                  text: previewMode
                                      ? '预览模式下不可购买'
                                      : '购买条件不足'
                              }
                          ]
            };
        })
        .concat({
            text: '离开',
            action: [{ type: 'playSound', name: '取消' }, { type: 'break' }]
        });
    core.insertAction({ type: 'choices', text: shop.text, choices: choices });
}

/// 是否访问过某个快捷商店
export function isShopVisited(id: string) {
    flags.__shops__ ??= {};
    var shops = core.getFlag<any>('__shops__');
    if (!shops[id]) shops[id] = {};
    return shops[id].visited;
}

/// 当前应当显示的快捷商店列表
export function listShopIds() {
    return Object.keys(core.status.shops).filter(id => {
        // @ts-ignore
        return isShopVisited(id) || !core.status.shops[id].mustEnable;
    });
}

/// 是否能够打开某个商店
export function canOpenShop(id: string) {
    if (isShopVisited(id)) return true;
    var shop = core.status.shops[id];
    // @ts-ignore
    if (shop.item || shop.commonEvent || shop.mustEnable) return false;
    return true;
}

/// 启用或禁用某个快捷商店
export function setShopVisited(id: string, visited: boolean) {
    if (!core.hasFlag('__shops__')) core.setFlag('__shops__', {});
    var shops = core.getFlag<any>('__shops__');
    if (!shops[id]) shops[id] = {};
    if (visited) shops[id].visited = true;
    else delete shops[id].visited;
}

/// 能否使用快捷商店
export function canUseQuickShop() {
    // 如果返回一个字符串，表示不能，字符串为不能使用的提示
    // 返回null代表可以使用

    // 检查当前楼层的canUseQuickShop选项是否为false
    if (core.status.thisMap.canUseQuickShop === false)
        return '当前楼层不能使用快捷商店。';
    return null;
}

loading.once('coreInit', () => {
    /// 允许商店X键退出
    core.registerAction(
        'keyUp',
        'shops',
        function (keycode) {
            if (!core.status.lockControl || core.status.event.id != 'action')
                return false;
            if ((keycode == 13 || keycode == 32) && !_shouldProcessKeyUp) {
                _shouldProcessKeyUp = true;
                return true;
            }

            if (
                !core.hasFlag('@temp@shop') ||
                // @ts-ignore
                core.status.event.data!.type != 'choices'
            )
                return false;
            // @ts-ignore
            var data = core.status.event.data.current;
            var choices = data.choices;
            // @ts-ignore
            var topIndex = core.actions._getChoicesTopIndex(choices.length);
            if (keycode == 88 || keycode == 27) {
                // X, ESC
                // @ts-ignore
                core.actions._clickAction(
                    core._HALF_WIDTH_ || core.__HALF_SIZE__,
                    topIndex + choices.length - 1
                );
                return true;
            }
            return false;
        },
        60
    );

    /// 允许长按空格或回车连续执行操作
    core.registerAction(
        'keyDown',
        'shops',
        function (keycode) {
            if (
                !core.status.lockControl ||
                !core.hasFlag('@temp@shop') ||
                core.status.event.id != 'action'
            )
                return false;
            // @ts-ignore
            if (core.status.event.data.type != 'choices') return false;
            // @ts-ignore
            core.status.onShopLongDown = true;
            // @ts-ignore
            var data = core.status.event.data.current;
            var choices = data.choices;
            // @ts-ignore
            var topIndex = core.actions._getChoicesTopIndex(choices.length);
            if (keycode == 13 || keycode == 32) {
                // Space, Enter
                // @ts-ignore
                core.actions._clickAction(
                    core._HALF_WIDTH_ || core.__HALF_SIZE__,
                    topIndex + core.status.event.selection
                );
                _shouldProcessKeyUp = false;
                return true;
            }
            return false;
        },
        60
    );

    // 允许长按屏幕连续执行操作
    core.registerAction(
        'longClick',
        'shops',
        function (x, y, px, py) {
            if (
                !core.status.lockControl ||
                !core.hasFlag('@temp@shop') ||
                core.status.event.id != 'action'
            )
                return false;
            // @ts-ignore
            if (core.status.event.data.type != 'choices') return false;
            // @ts-ignore
            var data = core.status.event.data.current;
            var choices = data.choices;
            // @ts-ignore
            var topIndex = core.actions._getChoicesTopIndex(choices.length);
            if (
                Math.abs(x - (core._HALF_WIDTH_ || core.__HALF_SIZE__)) <= 2 &&
                y >= topIndex &&
                y < topIndex + choices.length
            ) {
                // @ts-ignore
                core.actions._clickAction(x, y);
                return true;
            }
            return false;
        },
        60
    );
});
