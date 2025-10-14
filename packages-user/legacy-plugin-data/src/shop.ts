// @ts-nocheck

type Shop = CommonShopEvent | CommonEventShopEvent | ItemShopEvent;

export function openShop(shopId: string, noRoute: boolean) {
    const shop = core.status.shops[shopId] as Shop;
    // Step 1: 检查能否打开此商店
    if (!canOpenShop(shopId)) {
        core.drawTip('该商店尚未开启');
        return false;
    }

    if (!noRoute) {
        core.status.route.push(`openShop:${shopId}`);
    }

    // Step2: 检查公共事件商店
    if (shop.commonEvent) {
        core.insertCommonEvent(shop.commonEvent, shop.args);
        return;
    }

    // Step 3: 检查道具商店
    if (shop.item) {
        Mota.r(() => {
            if (!core.isReplaying()) {
                Mota.require('@motajs/legacy-ui').mainUi.open('shop', {
                    shopId: shopId
                });
            }
        });
        return;
    }

    // Step4 普通商店
    core.insertAction(convertShop(shop));
    return true;
}

/// 是否访问过某个快捷商店
export function isShopVisited(id: string) {
    flags.__shops__ ??= {};
    const shops = core.getFlag<any>('__shops__');
    if (!shops[id]) shops[id] = {};
    return shops[id].visited;
}

/// 当前应当显示的快捷商店列表
export function listShopIds() {
    return Object.keys(core.status.shops).filter(id => {
        // @ts-expect-error 无法推导
        return isShopVisited(id) || !core.status.shops[id].mustEnable;
    });
}

/// 是否能够打开某个商店
export function canOpenShop(id: string) {
    if (isShopVisited(id)) return true;
    const shop = core.status.shops[id];
    // @ts-expect-error 无法推导
    if (shop.item || shop.commonEvent || shop.mustEnable) return false;
    return true;
}

/// 启用或禁用某个快捷商店
export function setShopVisited(id: string, visited: boolean) {
    if (!core.hasFlag('__shops__')) core.setFlag('__shops__', {});
    const shops = core.getFlag<any>('__shops__');
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

////// 将一个全局商店转变成可预览的公共事件 //////
function convertShop(shop): MotaEvent {
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
                        "Mota.require('@user/legacy-plugin-data').isShopVisited('" +
                        shop.id +
                        "')",
                    true: [
                        // 可以访问，直接插入执行效果
                        {
                            type: 'function',
                            function:
                                "function() { Mota.require('@user/legacy-plugin-data').convertShop_replaceChoices('" +
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
                                        "function() { Mota.require('@user/legacy-plugin-data').convertShop_replaceChoices('" +
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

export function convertShop_replaceChoices(shopId, previewMode) {
    const shop = core.status.shops[shopId];
    const choices = (shop.choices || [])
        .filter(function (choice) {
            if (choice.condition == null || choice.condition == '') return true;
            try {
                return core.calValue(choice.condition);
            } catch (e) {
                return true;
            }
        })
        .map(function (choice) {
            const ableToBuy = core.calValue(choice.need);
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

    let text = shop.text.trim();
    if (text.startsWith('[')) {
        const end = text.indexOf(']');
        text = text.slice(end + 1);
    }
    core.insertAction({ type: 'choices', text: text, choices: choices });
}
