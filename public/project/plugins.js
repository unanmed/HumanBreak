///<reference path="../../src/types/core.d.ts" />

var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    init: function () {
        this._afterLoadResources = function () {
            if (!main.replayChecking && main.mode === 'play') {
                main.forward();
                core.resetSettings();
                core.plugin.showMarkedEnemy.value = true;
            }
        };
    },
    sprite: function () {
        const sprites = {};

        // 终于能用es6了（恼
        class Sprite {
            constructor(x, y, w, h, z, reference, name) {
                this.x = x;
                this.y = y;
                this.width = w;
                this.height = h;
                this.zIndex = z;
                this.reference = reference;
                /** @type {HTMLCanvasElement} */
                this.canvas = null;
                /** @type {CanvasRenderingContext2D} */
                this.context = null;
                this.count = 0;
                this.name = name;
                this.key = [];
                this.init();
            }

            init() {
                const name = this.name || `_sprite_${Sprite.count}`;
                this.name = name;
                if (this.reference === 'window') {
                    const canvas = document.createElement('canvas');
                    this.canvas = canvas;
                    this.context = canvas.getContext('2d');
                    canvas.width = this.width;
                    canvas.height = this.height;
                    canvas.style.width = this.width + 'px';
                    canvas.style.height = this.height + 'px';
                    canvas.style.position = 'absolute';
                    canvas.style.top = this.y + 'px';
                    canvas.style.left = this.x + 'px';
                    canvas.style.zIndex = this.zIndex.toString();
                    document.body.appendChild(canvas);
                } else {
                    this.context = core.createCanvas(
                        name,
                        this.x,
                        this.y,
                        this.width,
                        this.height,
                        this.zIndex
                    );
                    this.canvas = this.context.canvas;
                    this.count = Sprite.count;
                    this.canvas.style.pointerEvents = 'auto';
                }
                Sprite.count++;
                sprites[this.name] = this;
            }

            setCss(css) {
                css = css.replace('\n', ';').replace(';;', ';');
                const effects = css.split(';');
                const canvas = this.canvas;
                effects.forEach(v => {
                    const content = v.split(':');
                    let name = content[0];
                    let value = content[1];
                    name = name
                        .trim()
                        .split('-')
                        .reduce((pre, curr, i, a) => {
                            if (i === 0 && curr !== '') return curr;
                            if (a[0] === '' && i === 1) return curr;
                            return pre + curr.toUpperCase()[0] + curr.slice(1);
                        }, '');
                    if (name in canvas.style) canvas.style[name] = value;
                });
                return this;
            }

            move(x, y, isDelta) {
                if (x !== undefined && x !== null) this.x = x;
                if (y !== undefined && y !== null) this.y = y;
                if (this.reference === 'window') {
                    var ele = this.canvas;
                    ele.style.left =
                        x + (isDelta ? parseFloat(ele.style.left) : 0) + 'px';
                    ele.style.top =
                        y + (isDelta ? parseFloat(ele.style.top) : 0) + 'px';
                } else core.relocateCanvas(this.context, x, y, isDelta);
                return this;
            }

            resize(w, h, styleOnly) {
                if (w !== undefined && w !== null) this.width = w;
                if (h !== undefined && h !== null) this.height = h;
                if (this.reference === 'window') {
                    const ele = this.canvas;
                    ele.style.width = w + 'px';
                    ele.style.height = h + 'px';
                    if (!styleOnly) {
                        ele.width = w;
                        ele.height = h;
                    }
                } else core.resizeCanvas(this.context, w, h, styleOnly);
                return this;
            }

            rotate(angle, cx, cy) {
                if (this.reference === 'window') {
                    const left = this.x;
                    const top = this.y;
                    this.canvas.style.transformOrigin =
                        cx - left + 'px ' + (cy - top) + 'px';
                    if (angle === 0) {
                        canvas.style.transform = '';
                    } else {
                        canvas.style.transform = 'rotate(' + angle + 'deg)';
                    }
                } else {
                    core.rotateCanvas(this.context, angle, cx, cy);
                }
                return this;
            }

            destroy() {
                if (this.reference === 'window') {
                    if (this.canvas) document.body.removeChild(this.canvas);
                } else {
                    core.deleteCanvas(this.name);
                }
                this.key?.forEach(v =>
                    document.removeEventListener(v[0], v[1])
                );
                sprites[this.name] = void 0;
            }

            /**
             * 类似样板registerAction接口，但是是以该sprite的左上角为(0,0)计算的
             * @param {keyof HTMLElementEventMap} type
             * @param {(...param: any[]) => void} handler
             */
            on(type, handler) {
                if (this.reference !== 'game')
                    throw new ReferenceError(
                        `当sprite的reference为window时，不可使用该函数`
                    );
                const mouse = [
                    'auxclick',
                    'click',
                    'contextmenu',
                    'dblclick',
                    'mousedown',
                    'mouseup',
                    'mouseenter',
                    'mouseleave',
                    'mousemove',
                    'mouseout',
                    'mouseover'
                ];
                const key = ['keydown', 'keypress', 'keyup'];
                const touch = [
                    'touchstart',
                    'touchend',
                    'touchcancel',
                    'touchmove'
                ];
                if (mouse.includes(type)) {
                    this.addEventListener(type, e => {
                        const px = e.offsetX / core.domStyle.scale,
                            py = e.offsetY / core.domStyle.scale;
                        handler(px, py);
                    });
                } else if (type === 'wheel') {
                    this.addEventListener('wheel', e => {
                        handler(e.deltaY, e.deltaX, e.deltaZ);
                    });
                } else if (key.includes(type)) {
                    // 键盘事件只能加到document上
                    const listener = e => {
                        handler(
                            e.key,
                            e.keyCode,
                            e.altKey,
                            e.ctrlKey,
                            e.shiftKey
                        );
                    };
                    this.key.push([type, listener]);
                    document.addEventListener(type, listener);
                } else if (touch.includes(type)) {
                    this.addEventListener(type, e => {
                        /** @type {TouchList} */
                        const touches = e.touches;
                        const locs = [];
                        for (let i = 0; i < touches.length; i++) {
                            const t = touches[i];
                            const { x, y } = core.actions._getClickLoc(
                                t.clientX,
                                t.clientY
                            );
                            const px = x / core.domStyle.scale,
                                py = y / core.domStyle.scale;
                            locs.push([px, py]);
                        }
                        handler(...locs);
                    });
                }
            }

            addEventListener() {
                this.canvas.addEventListener.apply(this.canvas, arguments);
            }

            removeEventListener() {
                this.canvas.removeEventListener.apply(this.canvas, arguments);
            }
        }

        this.getSprite = function (name) {
            const s = sprites[name];
            if (!s) throw new ReferenceError(`不能获得不存在的sprite`);
            return sprites[name];
        };

        Sprite.count = 0;

        window.Sprite = Sprite;
    },
    shop: function () {
        // 【全局商店】相关的功能
        //
        // 打开一个全局商店
        // shopId：要打开的商店id；noRoute：是否不计入录像
        this.openShop = function (shopId, noRoute) {
            var shop = core.status.shops[shopId];
            // Step 1: 检查能否打开此商店
            if (!this.canOpenShop(shopId)) {
                core.drawTip('该商店尚未开启');
                return false;
            }

            // Step 2: （如有必要）记录打开商店的脚本事件
            if (!noRoute) {
                core.status.route.push('shop:' + shopId);
            }

            // Step 3: 检查道具商店 or 公共事件
            if (shop.item) {
                if (core.openItemShop) {
                    core.openItemShop(shopId);
                } else {
                    core.playSound('操作失败');
                    core.insertAction(
                        '道具商店插件不存在！请检查是否存在该插件！'
                    );
                }
                return;
            }
            if (shop.commonEvent) {
                core.insertCommonEvent(shop.commonEvent, shop.args);
                return;
            }

            // Step 4: 执行标准公共商店
            core.insertAction(this._convertShop(shop));
            return true;
        };

        ////// 将一个全局商店转变成可预览的公共事件 //////
        this._convertShop = function (shop) {
            return [
                {
                    type: 'function',
                    function: "() => {core.setFlag('@temp@shop', true);}"
                },
                {
                    type: 'while',
                    condition: 'true',
                    data: [
                        // 检测能否访问该商店
                        {
                            type: 'if',
                            condition: "core.isShopVisited('" + shop.id + "')",
                            true: [
                                // 可以访问，直接插入执行效果
                                {
                                    type: 'function',
                                    function:
                                        "() => { core.plugin._convertShop_replaceChoices('" +
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
                                                "() => { core.plugin._convertShop_replaceChoices('" +
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
                    function: "() => {core.removeFlag('@temp@shop');}"
                }
            ];
        };

        this._convertShop_replaceChoices = function (shopId, previewMode) {
            var shop = core.status.shops[shopId];
            var choices = (shop.choices || [])
                .filter(choice => {
                    if (choice.condition == null || choice.condition == '')
                        return true;
                    try {
                        return core.calValue(choice.condition);
                    } catch (e) {
                        return true;
                    }
                })
                .map(choice => {
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
                                ? [{ type: 'playSound', name: '确定' }].concat(
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
                .concat({ text: '离开', action: [{ type: 'break' }] });
            core.insertAction({
                type: 'choices',
                text: shop.text,
                choices: choices
            });
        };

        /// 是否访问过某个快捷商店
        this.isShopVisited = function (id) {
            if (!core.hasFlag('__shops__')) core.setFlag('__shops__', {});
            var shops = core.getFlag('__shops__');
            if (!shops[id]) shops[id] = {};
            return shops[id].visited;
        };

        /// 当前应当显示的快捷商店列表
        this.listShopIds = function () {
            return Object.keys(core.status.shops).filter(id => {
                return (
                    core.isShopVisited(id) || !core.status.shops[id].mustEnable
                );
            });
        };

        /// 是否能够打开某个商店
        this.canOpenShop = function (id) {
            if (this.isShopVisited(id)) return true;
            var shop = core.status.shops[id];
            if (shop.item || shop.commonEvent || shop.mustEnable) return false;
            return true;
        };

        /// 启用或禁用某个快捷商店
        this.setShopVisited = function (id, visited) {
            if (!core.hasFlag('__shops__')) core.setFlag('__shops__', {});
            var shops = core.getFlag('__shops__');
            if (!shops[id]) shops[id] = {};
            if (visited) shops[id].visited = true;
            else delete shops[id].visited;
        };

        /// 能否使用快捷商店
        this.canUseQuickShop = function () {
            // 如果返回一个字符串，表示不能，字符串为不能使用的提示
            // 返回null代表可以使用

            // 检查当前楼层的canUseQuickShop选项是否为false
            if (core.status.thisMap.canUseQuickShop === false)
                return '当前楼层不能使用快捷商店。';
            return null;
        };

        /// 允许商店X键退出
        core.registerAction(
            'keyUp',
            'shops',
            keycode => {
                if (
                    !core.status.lockControl ||
                    !core.hasFlag('@temp@shop') ||
                    core.status.event.id != 'action'
                )
                    return false;
                if (core.status.event.data.type != 'choices') return false;
                var data = core.status.event.data.current;
                var choices = data.choices;
                var topIndex =
                    core.actions.HSIZE -
                    parseInt((choices.length - 1) / 2) +
                    (core.status.event.ui.offset || 0);
                if (keycode == 88 || keycode == 27) {
                    // X, ESC
                    core.actions._clickAction(
                        core.actions.HSIZE,
                        topIndex + choices.length - 1
                    );
                    return true;
                }
                if (keycode == 13 || keycode == 32) return true;
                return false;
            },
            60
        );

        /// 允许长按空格或回车连续执行操作
        core.registerAction(
            'keyDown',
            'shops',
            keycode => {
                if (
                    !core.status.lockControl ||
                    !core.hasFlag('@temp@shop') ||
                    core.status.event.id != 'action'
                )
                    return false;
                if (core.status.event.data.type != 'choices') return false;
                var data = core.status.event.data.current;
                var choices = data.choices;
                var topIndex =
                    core.actions.HSIZE -
                    parseInt((choices.length - 1) / 2) +
                    (core.status.event.ui.offset || 0);
                if (keycode == 13 || keycode == 32) {
                    // Space, Enter
                    core.actions._clickAction(
                        core.actions.HSIZE,
                        topIndex + core.status.event.selection
                    );
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
            (x, y) => {
                if (
                    !core.status.lockControl ||
                    !core.hasFlag('@temp@shop') ||
                    core.status.event.id != 'action'
                )
                    return false;
                if (core.status.event.data.type != 'choices') return false;
                var data = core.status.event.data.current;
                var choices = data.choices;
                var topIndex =
                    core.actions.HSIZE -
                    parseInt((choices.length - 1) / 2) +
                    (core.status.event.ui.offset || 0);
                if (
                    x >= core.actions.CHOICES_LEFT &&
                    x <= core.actions.CHOICES_RIGHT &&
                    y >= topIndex &&
                    y < topIndex + choices.length
                ) {
                    core.actions._clickAction(x, y);
                    return true;
                }
                return false;
            },
            60
        );
    },
    removeMap: function () {
        // 高层塔砍层插件，删除后不会存入存档，不可浏览地图也不可飞到。
        // 推荐用法：
        // 对于超高层或分区域塔，当在1区时将2区以后的地图删除；1区结束时恢复2区，进二区时删除1区地图，以此类推
        // 这样可以大幅减少存档空间，以及加快存读档速度

        // 删除楼层
        // core.removeMaps("MT1", "MT300") 删除MT1~MT300之间的全部层
        // core.removeMaps("MT10") 只删除MT10层
        this.removeMaps = function (fromId, toId, force) {
            toId = toId || fromId;
            var fromIndex = core.floorIds.indexOf(fromId),
                toIndex = core.floorIds.indexOf(toId);
            if (toIndex < 0) toIndex = core.floorIds.length - 1;
            flags.__visited__ = flags.__visited__ || {};
            flags.__removed__ = flags.__removed__ || [];
            flags.__disabled__ = flags.__disabled__ || {};
            flags.__leaveLoc__ = flags.__leaveLoc__ || {};
            flags.__forceDelete__ ??= {};
            let deleted = false;
            for (var i = fromIndex; i <= toIndex; ++i) {
                var floorId = core.floorIds[i];
                if (core.status.maps[floorId].deleted) continue;
                delete flags.__visited__[floorId];
                flags.__removed__.push(floorId);
                delete flags.__disabled__[floorId];
                delete flags.__leaveLoc__[floorId];
                (core.status.autoEvents || []).forEach(event => {
                    if (event.floorId == floorId && event.currentFloor) {
                        core.autoEventExecuting(event.symbol, false);
                        core.autoEventExecuted(event.symbol, false);
                    }
                });
                core.status.maps[floorId].deleted = true;
                core.status.maps[floorId].canFlyTo = false;
                core.status.maps[floorId].canFlyFrom = false;
                core.status.maps[floorId].cannotViewMap = true;
                if (force) {
                    core.status.maps[floorId].forceDelete = true;
                    flags.__forceDelete__[floorId] = true;
                }
                deleted = true;
            }
            if (deleted && !main.replayChecking) {
                core.splitArea();
            }
        };

        // 恢复楼层
        // core.resumeMaps("MT1", "MT300") 恢复MT1~MT300之间的全部层
        // core.resumeMaps("MT10") 只恢复MT10层
        this.resumeMaps = function (fromId, toId) {
            toId = toId || fromId;
            var fromIndex = core.floorIds.indexOf(fromId),
                toIndex = core.floorIds.indexOf(toId);
            if (toIndex < 0) toIndex = core.floorIds.length - 1;
            flags.__removed__ = flags.__removed__ || [];
            for (var i = fromIndex; i <= toIndex; ++i) {
                var floorId = core.floorIds[i];
                if (!core.status.maps[floorId].deleted) continue;
                if (
                    core.status.maps[floorId].forceDelete ||
                    flags.__forceDelete__[floorId]
                )
                    continue;
                flags.__removed__ = flags.__removed__.filter(f => {
                    return f != floorId;
                });
                core.status.maps[floorId] = core.loadFloor(floorId);
            }
        };

        // 分区砍层相关
        var inAnyPartition = floorId => {
            var inPartition = false;
            (core.floorPartitions || []).forEach(floor => {
                var fromIndex = core.floorIds.indexOf(floor[0]);
                var toIndex = core.floorIds.indexOf(floor[1]);
                var index = core.floorIds.indexOf(floorId);
                if (fromIndex < 0 || index < 0) return;
                if (toIndex < 0) toIndex = core.floorIds.length - 1;
                if (index >= fromIndex && index <= toIndex) inPartition = true;
            });
            return inPartition;
        };

        // 分区砍层
        this.autoRemoveMaps = function (floorId) {
            if (main.mode != 'play' || !inAnyPartition(floorId)) return;
            // 根据分区信息自动砍层与恢复
            (core.floorPartitions || []).forEach(floor => {
                var fromIndex = core.floorIds.indexOf(floor[0]);
                var toIndex = core.floorIds.indexOf(floor[1]);
                var index = core.floorIds.indexOf(floorId);
                if (fromIndex < 0 || index < 0) return;
                if (toIndex < 0) toIndex = core.floorIds.length - 1;
                if (index >= fromIndex && index <= toIndex) {
                    core.resumeMaps(
                        core.floorIds[fromIndex],
                        core.floorIds[toIndex]
                    );
                } else {
                    core.removeMaps(
                        core.floorIds[fromIndex],
                        core.floorIds[toIndex]
                    );
                }
            });
        };
    },
    fiveLayers: function () {
        // 是否启用五图层（增加背景2层和前景2层） 将__enable置为true即会启用；启用后请保存后刷新编辑器
        // 背景层2将会覆盖背景层 被事件层覆盖 前景层2将会覆盖前景层
        // 另外 请注意加入两个新图层 会让大地图的性能降低一些
        // 插件作者：ad
        var __enable = true;
        if (!__enable) return;

        // 创建新图层
        function createCanvas(name, zIndex) {
            if (!name) return;
            var canvas = document.createElement('canvas');
            canvas.id = name;
            canvas.className = 'gameCanvas';
            // 编辑器模式下设置zIndex会导致加入的图层覆盖优先级过高
            if (main.mode != 'editor') canvas.style.zIndex = zIndex || 0;
            // 将图层插入进游戏内容
            document.getElementById('gameDraw').appendChild(canvas);
            var ctx = canvas.getContext('2d');
            core.canvas[name] = ctx;
            core.maps._setHDCanvasSize(ctx, core.__PIXELS__, core.__PIXELS__);

            return canvas;
        }

        var bg2Canvas = createCanvas('bg2', 20);
        var fg2Canvas = createCanvas('fg2', 63);
        // 大地图适配
        core.bigmap.canvas = [
            'bg2',
            'fg2',
            'bg',
            'event',
            'event2',
            'fg',
            'damage'
        ];
        core.initStatus.bg2maps = {};
        core.initStatus.fg2maps = {};

        if (main.mode == 'editor') {
            /*插入编辑器的图层 不做此步新增图层无法在编辑器显示*/
            // 编辑器图层覆盖优先级 eui > efg > fg(前景层) > event2(48*32图块的事件层) > event(事件层) > bg(背景层)
            // 背景层2(bg2) 插入事件层(event)之前(即bg与event之间)
            document
                .getElementById('mapEdit')
                .insertBefore(bg2Canvas, document.getElementById('event'));
            // 前景层2(fg2) 插入编辑器前景(efg)之前(即fg之后)
            document
                .getElementById('mapEdit')
                .insertBefore(fg2Canvas, document.getElementById('ebm'));
            // 原本有三个图层 从4开始添加
            var num = 4;
            // 新增图层存入editor.dom中
            editor.dom.bg2c = core.canvas.bg2.canvas;
            editor.dom.bg2Ctx = core.canvas.bg2;
            editor.dom.fg2c = core.canvas.fg2.canvas;
            editor.dom.fg2Ctx = core.canvas.fg2;
            editor.dom.maps.push('bg2map', 'fg2map');
            editor.dom.canvas.push('bg2', 'fg2');

            // 创建编辑器上的按钮
            var createCanvasBtn = name => {
                // 电脑端创建按钮
                var input = document.createElement('input');
                // layerMod4/layerMod5
                var id = 'layerMod' + num++;
                // bg2map/fg2map
                var value = name + 'map';
                input.type = 'radio';
                input.name = 'layerMod';
                input.id = id;
                input.value = value;
                editor.dom[id] = input;
                input.onchange = () => {
                    editor.uifunctions.setLayerMod(value);
                };
                return input;
            };

            var createCanvasBtn_mobile = name => {
                // 手机端往选择列表中添加子选项
                var input = document.createElement('option');
                var id = 'layerMod' + num++;
                var value = name + 'map';
                input.name = 'layerMod';
                input.value = value;
                editor.dom[id] = input;
                return input;
            };
            if (!editor.isMobile) {
                var input = createCanvasBtn('bg2');
                var input2 = createCanvasBtn('fg2');
                // 获取事件层及其父节点
                var child = document.getElementById('layerMod'),
                    parent = child.parentNode;
                // 背景层2插入事件层前
                parent.insertBefore(input, child);
                // 不能直接更改背景层2的innerText 所以创建文本节点
                var txt = document.createTextNode('背2');
                // 插入事件层前(即新插入的背景层2前)
                parent.insertBefore(txt, child);
                // 向最后插入前景层2(即插入前景层后)
                parent.appendChild(input2);
                var txt2 = document.createTextNode('前2');
                parent.appendChild(txt2);
            } else {
                var input = createCanvasBtn_mobile('bg2');
                var input2 = createCanvasBtn_mobile('fg2');
                // 手机端因为是选项 所以可以直接改innerText
                input.innerText = '背景2';
                input2.innerText = '前景2';
                var parent = document.getElementById('layerMod');
                parent.insertBefore(input, parent.children[1]);
                parent.appendChild(input2);
            }
        }
        core.maps._loadFloor_doNotCopy = function () {
            return [
                'firstArrive',
                'eachArrive',
                'blocks',
                'parallelDo',
                'map',
                'bgmap',
                'fgmap',
                'bg2map',
                'fg2map',
                'events',
                'changeFloor',
                'afterBattle',
                'afterGetItem',
                'afterOpenDoor',
                'cannotMove'
            ];
        };
        ////// 绘制背景和前景层 //////
        core.maps._drawBg_draw = function (
            floorId,
            toDrawCtx,
            cacheCtx,
            config
        ) {
            config.ctx = cacheCtx;
            core.maps._drawBg_drawBackground(floorId, config);
            // ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制背景图块；后绘制的覆盖先绘制的。
            core.maps._drawFloorImages(
                floorId,
                config.ctx,
                'bg',
                null,
                null,
                config.onMap
            );
            core.maps._drawBgFgMap(floorId, 'bg', config);
            if (config.onMap) {
                core.drawImage(
                    toDrawCtx,
                    cacheCtx.canvas,
                    core.bigmap.v2 ? -32 : 0,
                    core.bigmap.v2 ? -32 : 0
                );
                core.clearMap('bg2');
                core.clearMap(cacheCtx);
            }
            core.maps._drawBgFgMap(floorId, 'bg2', config);
            if (config.onMap)
                core.drawImage(
                    'bg2',
                    cacheCtx.canvas,
                    core.bigmap.v2 ? -32 : 0,
                    core.bigmap.v2 ? -32 : 0
                );
            config.ctx = toDrawCtx;
        };
        core.maps._drawFg_draw = function (
            floorId,
            toDrawCtx,
            cacheCtx,
            config
        ) {
            config.ctx = cacheCtx;
            // ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制前景图块；后绘制的覆盖先绘制的。
            core.maps._drawFloorImages(
                floorId,
                config.ctx,
                'fg',
                null,
                null,
                config.onMap
            );
            core.maps._drawBgFgMap(floorId, 'fg', config);
            if (config.onMap) {
                core.drawImage(
                    toDrawCtx,
                    cacheCtx.canvas,
                    core.bigmap.v2 ? -32 : 0,
                    core.bigmap.v2 ? -32 : 0
                );
                core.clearMap('fg2');
                core.clearMap(cacheCtx);
            }
            core.maps._drawBgFgMap(floorId, 'fg2', config);
            if (config.onMap)
                core.drawImage(
                    'fg2',
                    cacheCtx.canvas,
                    core.bigmap.v2 ? -32 : 0,
                    core.bigmap.v2 ? -32 : 0
                );
            config.ctx = toDrawCtx;
        };
        ////// 移动判定 //////
        core.maps._generateMovableArray_arrays = function (floorId) {
            return {
                bgArray: this.getBgMapArray(floorId),
                fgArray: this.getFgMapArray(floorId),
                eventArray: this.getMapArray(floorId),
                bg2Array: this._getBgFgMapArray('bg2', floorId),
                fg2Array: this._getBgFgMapArray('fg2', floorId)
            };
        };
    },
    itemShop: function () {
        // 道具商店相关的插件
        // 可在全塔属性-全局商店中使用「道具商店」事件块进行编辑（如果找不到可以在入口方块中找）

        var shopId = null; // 当前商店ID
        var type = 0; // 当前正在选中的类型，0买入1卖出
        var selectItem = 0; // 当前正在选中的道具
        var selectCount = 0; // 当前已经选中的数量
        var page = 0;
        var totalPage = 0;
        var totalMoney = 0;
        var list = [];
        var shopInfo = null; // 商店信息
        var choices = []; // 商店选项
        var use = 'money';
        var useText = '金币';

        var bigFont = core.ui._buildFont(20, false),
            middleFont = core.ui._buildFont(18, false);

        this._drawItemShop = function () {
            // 绘制道具商店

            // Step 1: 背景和固定的几个文字
            core.ui._createUIEvent();
            core.clearMap('uievent');
            core.ui.clearUIEventSelector();
            core.setTextAlign('uievent', 'left');
            core.setTextBaseline('uievent', 'top');
            core.fillRect('uievent', 0, 0, 480, 480, 'black');
            core.drawWindowSkin('winskin.png', 'uievent', 0, 0, 480, 64);
            core.drawWindowSkin('winskin.png', 'uievent', 0, 64, 360, 64);
            core.drawWindowSkin('winskin.png', 'uievent', 0, 128, 360, 352);
            core.drawWindowSkin('winskin.png', 'uievent', 360, 64, 120, 64);
            core.drawWindowSkin('winskin.png', 'uievent', 360, 128, 120, 352);
            core.setFillStyle('uievent', 'white');
            core.setStrokeStyle('uievent', 'white');
            core.fillText('uievent', '购买', 32, 84, 'white', bigFont);
            core.fillText('uievent', '卖出', 152, 84);
            core.fillText('uievent', '离开', 272, 84);
            core.fillText(
                'uievent',
                '当前' + useText,
                374,
                75,
                null,
                middleFont
            );
            core.setTextAlign('uievent', 'right');
            core.fillText(
                'uievent',
                core.formatBigNumber(core.status.hero.money),
                466,
                100
            );
            core.setTextAlign('uievent', 'left');
            core.ui.drawUIEventSelector(
                1,
                'winskin.png',
                22 + 120 * type,
                76,
                60,
                33
            );
            if (selectItem != null) {
                core.setTextAlign('uievent', 'center');
                core.fillText(
                    'uievent',
                    type == 0 ? '买入个数' : '卖出个数',
                    420,
                    360,
                    null,
                    bigFont
                );
                core.fillText(
                    'uievent',
                    '<   ' + selectCount + '   >',
                    420,
                    390
                );
                core.fillText('uievent', '确定', 420, 420);
            }

            // Step 2：获得列表并展示
            list = choices.filter(one => {
                if (one.condition != null && one.condition != '') {
                    try {
                        if (!core.calValue(one.condition)) return false;
                    } catch (e) {}
                }
                return (
                    (type == 0 && one.money != null) ||
                    (type == 1 && one.sell != null)
                );
            });
            var per_page = 7;
            totalPage = Math.ceil(list.length / per_page);
            page = Math.floor((selectItem || 0) / per_page) + 1;

            // 绘制分页
            if (totalPage > 1) {
                var half = 180;
                core.setTextAlign('uievent', 'center');
                core.fillText(
                    'uievent',
                    page + ' / ' + totalPage,
                    half,
                    450,
                    null,
                    middleFont
                );
                if (page > 1)
                    core.fillText('uievent', '上一页', half - 80, 450);
                if (page < totalPage)
                    core.fillText('uievent', '下一页', half + 80, 450);
            }
            core.setTextAlign('uievent', 'left');

            // 绘制每一项
            var start = (page - 1) * per_page;
            for (var i = 0; i < per_page; ++i) {
                var curr = start + i;
                if (curr >= list.length) break;
                var item = list[curr];
                core.drawIcon('uievent', item.id, 10, 141 + i * 40);
                core.setTextAlign('uievent', 'left');
                core.fillText(
                    'uievent',
                    core.material.items[item.id].name,
                    50,
                    148 + i * 40,
                    null,
                    bigFont
                );
                core.setTextAlign('uievent', 'right');
                core.fillText(
                    'uievent',
                    (type == 0
                        ? core.calValue(item.money)
                        : core.calValue(item.sell)) +
                        useText +
                        '/个',
                    340,
                    149 + i * 40,
                    null,
                    middleFont
                );
                core.setTextAlign('uievent', 'left');
                if (curr == selectItem) {
                    // 绘制描述，文字自动放缩
                    var text =
                        core.material.items[item.id].text || '该道具暂无描述';
                    try {
                        text = core.replaceText(text);
                    } catch (e) {}
                    for (var fontSize = 20; fontSize >= 8; fontSize -= 2) {
                        var config = {
                            left: 10,
                            fontSize: fontSize,
                            maxWidth: 467
                        };
                        var height = core.getTextContentHeight(text, config);
                        if (height <= 60) {
                            config.top = (64 - height) / 2;
                            core.drawTextContent('uievent', text, config);
                            break;
                        }
                    }
                    core.ui.drawUIEventSelector(
                        2,
                        'winskin.png',
                        8,
                        137 + i * 40,
                        343,
                        40
                    );
                    if (type == 0 && item.number != null) {
                        core.fillText(
                            'uievent',
                            '存货',
                            370,
                            152,
                            null,
                            bigFont
                        );
                        core.setTextAlign('uievent', 'right');
                        core.fillText(
                            'uievent',
                            item.number,
                            470,
                            152,
                            null,
                            null,
                            60
                        );
                    } else if (type == 1) {
                        core.fillText(
                            'uievent',
                            '数量',
                            370,
                            152,
                            null,
                            bigFont
                        );
                        core.setTextAlign('uievent', 'right');
                        core.fillText(
                            'uievent',
                            core.itemCount(item.id),
                            470,
                            152,
                            null,
                            null,
                            40
                        );
                    }
                    core.setTextAlign('uievent', 'left');
                    core.fillText('uievent', '预计' + useText, 370, 280);
                    core.setTextAlign('uievent', 'right');
                    totalMoney =
                        selectCount *
                        (type == 0
                            ? core.calValue(item.money)
                            : core.calValue(item.sell));
                    core.fillText(
                        'uievent',
                        core.formatBigNumber(totalMoney),
                        470,
                        310
                    );

                    core.setTextAlign('uievent', 'left');
                    core.fillText(
                        'uievent',
                        type == 0 ? '已购次数' : '已卖次数',
                        370,
                        190
                    );
                    core.setTextAlign('uievent', 'right');
                    core.fillText(
                        'uievent',
                        (type == 0 ? item.money_count : item.sell_count) || 0,
                        470,
                        220
                    );
                }
            }

            core.setTextAlign('uievent', 'left');
            core.setTextBaseline('uievent', 'alphabetic');
        };

        var _add = (item, delta) => {
            if (item == null) return;
            selectCount = core.clamp(
                selectCount + delta,
                0,
                Math.min(
                    type == 0
                        ? Math.floor(
                              core.status.hero[use] / core.calValue(item.money)
                          )
                        : core.itemCount(item.id),
                    type == 0 && item.number != null
                        ? item.number
                        : Number.MAX_SAFE_INTEGER
                )
            );
        };

        var _confirm = item => {
            if (item == null || selectCount == 0) return;
            if (type == 0) {
                core.status.hero[use] -= totalMoney;
                core.getItem(item.id, selectCount);
                if (item.number != null) item.number -= selectCount;
                item.money_count = (item.money_count || 0) + selectCount;
            } else {
                core.status.hero[use] += totalMoney;
                core.removeItem(item.id, selectCount);
                core.drawTip(
                    '成功卖出' +
                        selectCount +
                        '个' +
                        core.material.items[item.id].name,
                    item.id
                );
                if (item.number != null) item.number += selectCount;
                item.sell_count = (item.sell_count || 0) + selectCount;
            }
            selectCount = 0;
        };

        this._performItemShopKeyBoard = function (keycode) {
            var item = list[selectItem] || null;
            // 键盘操作
            switch (keycode) {
                case 38: // up
                    if (selectItem == null) break;
                    if (selectItem == 0) selectItem = null;
                    else selectItem--;
                    selectCount = 0;
                    break;
                case 37: // left
                    if (selectItem == null) {
                        if (type > 0) type--;
                        break;
                    }
                    _add(item, -1);
                    break;
                case 39: // right
                    if (selectItem == null) {
                        if (type < 2) type++;
                        break;
                    }
                    _add(item, 1);
                    break;
                case 40: // down
                    if (selectItem == null) {
                        if (list.length > 0) selectItem = 0;
                        break;
                    }
                    if (list.length == 0) break;
                    selectItem = Math.min(selectItem + 1, list.length - 1);
                    selectCount = 0;
                    break;
                case 13:
                case 32: // Enter/Space
                    if (selectItem == null) {
                        if (type == 2) core.insertAction({ type: 'break' });
                        else if (list.length > 0) selectItem = 0;
                        break;
                    }
                    _confirm(item);
                    break;
                case 27: // ESC
                    if (selectItem == null) {
                        core.insertAction({ type: 'break' });
                        break;
                    }
                    selectItem = null;
                    break;
            }
        };

        this._performItemShopClick = function (px, py) {
            var item = list[selectItem] || null;
            // 鼠标操作
            if (px >= 22 && px <= 82 && py >= 81 && py <= 112) {
                // 买
                if (type != 0) {
                    type = 0;
                    selectItem = null;
                    selectCount = 0;
                }
                return;
            }
            if (px >= 142 && px <= 202 && py >= 81 && py <= 112) {
                // 卖
                if (type != 1) {
                    type = 1;
                    selectItem = null;
                    selectCount = 0;
                }
                return;
            }
            if (px >= 262 && px <= 322 && py >= 81 && py <= 112)
                // 离开
                return core.insertAction({ type: 'break' });
            // <，>
            if (px >= 370 && px <= 395 && py >= 392 && py <= 415)
                return _add(item, -1);
            if (px >= 445 && px <= 470 && py >= 302 && py <= 415)
                return _add(item, 1);
            // 确定
            if (px >= 392 && px <= 443 && py >= 421 && py <= 446)
                return _confirm(item);

            // 上一页/下一页
            if (px >= 70 && px <= 130 && py >= 450) {
                if (page > 1) {
                    selectItem -= 7;
                    selectCount = 0;
                }
                return;
            }
            if (px >= 230 && px <= 290 && py >= 450) {
                if (page < totalPage) {
                    selectItem = Math.min(selectItem + 7, list.length - 1);
                    selectCount = 0;
                }
                return;
            }

            // 实际区域
            if (px >= 9 && px <= 351 && py >= 142 && py < 422) {
                if (list.length == 0) return;
                var index = parseInt((py - 142) / 40);
                var newItem = 7 * (page - 1) + index;
                if (newItem >= list.length) newItem = list.length - 1;
                if (newItem != selectItem) {
                    selectItem = newItem;
                    selectCount = 0;
                }
                return;
            }
        };

        this._performItemShopAction = function () {
            if (flags.type == 0)
                return this._performItemShopKeyBoard(flags.keycode);
            else return this._performItemShopClick(flags.px, flags.py);
        };

        this.openItemShop = function (itemShopId) {
            shopId = itemShopId;
            type = 0;
            page = 0;
            selectItem = null;
            selectCount = 0;
            core.isShopVisited(itemShopId);
            shopInfo = flags.__shops__[shopId];
            if (shopInfo.choices == null)
                shopInfo.choices = core.clone(
                    core.status.shops[shopId].choices
                );
            choices = shopInfo.choices;
            use = core.status.shops[shopId].use;
            if (use != 'exp') use = 'money';
            useText = use == 'money' ? '金币' : '经验';

            core.insertAction([
                {
                    type: 'while',
                    condition: 'true',
                    data: [
                        {
                            type: 'function',
                            function: '() => { core.plugin._drawItemShop(); }'
                        },
                        { type: 'wait' },
                        {
                            type: 'function',
                            function:
                                '() => { core.plugin._performItemShopAction(); }'
                        }
                    ]
                },
                {
                    type: 'function',
                    function:
                        "() => { core.deleteCanvas('uievent'); core.ui.clearUIEventSelector(); }"
                }
            ]);
        };
    },
    heroFourFrames: function () {
        // 样板的勇士/跟随者移动时只使用2、4两帧，观感较差。本插件可以将四帧全用上。

        // 是否启用本插件
        var __enable = true;
        if (!__enable) return;

        ['up', 'down', 'left', 'right'].forEach(one => {
            // 指定中间帧动画
            core.material.icons.hero[one].midFoot = 2;
        });

        var heroMoving = timestamp => {
            if (core.status.heroMoving <= 0) return;
            if (
                timestamp - core.animateFrame.moveTime >
                core.values.moveSpeed
            ) {
                core.animateFrame.leftLeg++;
                core.animateFrame.moveTime = timestamp;
            }
            core.drawHero(
                ['stop', 'leftFoot', 'midFoot', 'rightFoot'][
                    core.animateFrame.leftLeg % 4
                ],
                4 * core.status.heroMoving
            );
        };
        core.registerAnimationFrame('heroMoving', true, heroMoving);

        core.events._eventMoveHero_moving = function (step, moveSteps) {
            var curr = moveSteps[0];
            var direction = curr[0],
                x = core.getHeroLoc('x'),
                y = core.getHeroLoc('y');
            // ------ 前进/后退
            var o = direction == 'backward' ? -1 : 1;
            if (direction == 'forward' || direction == 'backward')
                direction = core.getHeroLoc('direction');
            var faceDirection = direction;
            if (direction == 'leftup' || direction == 'leftdown')
                faceDirection = 'left';
            if (direction == 'rightup' || direction == 'rightdown')
                faceDirection = 'right';
            core.setHeroLoc('direction', direction);
            if (curr[1] <= 0) {
                core.setHeroLoc('direction', faceDirection);
                moveSteps.shift();
                return true;
            }
            if (step <= 4) core.drawHero('stop', 4 * o * step);
            else if (step <= 8) core.drawHero('leftFoot', 4 * o * step);
            else if (step <= 12) core.drawHero('midFoot', 4 * o * (step - 8));
            else if (step <= 16) core.drawHero('rightFoot', 4 * o * (step - 8)); // if (step == 8) {
            if (step == 8 || step == 16) {
                core.setHeroLoc(
                    'x',
                    x + o * core.utils.scan2[direction].x,
                    true
                );
                core.setHeroLoc(
                    'y',
                    y + o * core.utils.scan2[direction].y,
                    true
                );
                core.updateFollowers();
                curr[1]--;
                if (curr[1] <= 0) moveSteps.shift();
                core.setHeroLoc('direction', faceDirection);
                return step == 16;
            }
            return false;
        };
    },
    itemDetail: function () {
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
            core.getItemDetail(floorId); // 宝石血瓶详细信息
            this.drawDamage(ctx);
        };

        // 获取宝石信息 并绘制
        this.getItemDetail = function (floorId) {
            if (!core.getFlag('itemDetail')) return;
            floorId = floorId ?? core.status.thisMap.floorId;
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
                if (
                    block.event.cls !== 'items' ||
                    block.event.id === 'superPotion' ||
                    block.disable
                )
                    return;
                const x = block.x,
                    y = block.y;
                // v2优化，只绘制范围内的部分
                if (core.bigmap.v2) {
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
        };

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
                content = diff[name];
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
    },
    skills: function () {
        // 所有的主动技能效果
        var ignoreInJump = {
            event: ['X20007', 'X20001', 'X20006', 'X20014', 'X20010', 'X20007'],
            bg: [
                'X20037',
                'X20038',
                'X20039',
                'X20045',
                'X20047',
                'X20053',
                'X20054',
                'X20055',
                'X20067',
                'X20068',
                'X20075',
                'X20076'
            ]
        };

        const jumpIgnoreFloor = ['MT31'];
        // 跳跃
        this.jumpSkill = function () {
            if (core.status.floorId.startsWith('tower'))
                return core.drawTip('当无法使用该技能');
            if (
                jumpIgnoreFloor.includes(core.status.floorId) ||
                flags.onChase
            ) {
                return core.drawTip('当前楼层无法使用该技能');
            }
            if (!flags.skill2) return;
            if (!flags['jump_' + core.status.floorId])
                flags['jump_' + core.status.floorId] = 0;
            if (
                core.status.floorId == 'MT14' &&
                flags['jump_' + core.status.floorId] == 2 &&
                !flags.MT14Jump
            ) {
                if (
                    !(
                        core.status.hero.loc.x == 77 &&
                        core.status.hero.loc.y == 5 &&
                        core.status.hero.loc.direction == 'right'
                    )
                ) {
                    return core.drawTip('该地图还有一个必跳的地方，你还没有跳');
                } else flags.MT14Jump = true;
            }
            if (flags['jump_' + core.status.floorId] >= 3)
                return core.drawTip('当前地图使用次数已用完');
            core.autosave();
            var direction = core.status.hero.loc.direction;
            var loc = core.status.hero.loc;
            var checkLoc = {};
            switch (direction) {
                case 'up':
                    checkLoc.x = loc.x;
                    checkLoc.y = loc.y - 1;
                    break;
                case 'right':
                    checkLoc.x = loc.x + 1;
                    checkLoc.y = loc.y;
                    break;
                case 'down':
                    checkLoc.x = loc.x;
                    checkLoc.y = loc.y + 1;
                    break;
                case 'left':
                    checkLoc.x = loc.x - 1;
                    checkLoc.y = loc.y;
                    break;
            }
            // 前方是否可通行 或 是怪物
            var cls = core.getBlockCls(checkLoc.x, checkLoc.y);
            var noPass = core.noPass(checkLoc.x, checkLoc.y);
            var id = core.getBlockId(checkLoc.x, checkLoc.y) || '';
            var bgId =
                core.getBlockByNumber(core.getBgNumber(checkLoc.x, checkLoc.y))
                    .event.id || '';
            // 可以通行
            if (
                !noPass ||
                cls == 'items' ||
                (id.startsWith('X') && !ignoreInJump.event.includes(id)) ||
                (bgId.startsWith('X') && !ignoreInJump.bg.includes(bgId))
            )
                return core.drawTip('当前无法使用技能');
            // 不是怪物且不可以通行
            if (noPass && !(cls == 'enemys' || cls == 'enemy48')) {
                var toLoc = checkNoPass(
                    direction,
                    checkLoc.x,
                    checkLoc.y,
                    true
                );
                if (!toLoc) return;
                if (flags.chapter <= 1) core.status.hero.hp -= 200 * flags.hard;
                core.updateStatusBar();
                flags['jump_' + core.status.floorId]++;
                if (core.status.hero.hp <= 0) {
                    core.status.hero.hp = 0;
                    core.updateStatusBar();
                    core.events.lose('你跳死了');
                }
                core.playSound('015-Jump01.ogg');
                core.insertAction([
                    { type: 'jumpHero', loc: [toLoc.x, toLoc.y], time: 500 }
                ]);
            }
            // 是怪物
            if (cls == 'enemys' || cls == 'enemy48') {
                var firstNoPass = checkNoPass(
                    direction,
                    checkLoc.x,
                    checkLoc.y,
                    false
                );
                if (!firstNoPass) return;
                if (flags.chapter <= 1) core.status.hero.hp -= 200 * flags.hard;
                core.updateStatusBar();
                flags['jump_' + core.status.floorId]++;
                if (core.status.hero.hp <= 0) {
                    core.status.hero.hp = 0;
                    core.updateStatusBar();
                    core.events.lose('你跳死了');
                }
                core.playSound('015-Jump01.ogg');
                core.insertAction([
                    {
                        type: 'jump',
                        from: [checkLoc.x, checkLoc.y],
                        to: [firstNoPass.x, firstNoPass.y],
                        time: 500,
                        keep: true
                    }
                ]);
            }
            // 检查一条线上的不可通过
            function checkNoPass(direction, x, y, startNo) {
                if (!startNo) startNo = false;
                switch (direction) {
                    case 'up':
                        y--;
                        break;
                    case 'right':
                        x++;
                        break;
                    case 'down':
                        y++;
                        break;
                    case 'left':
                        x--;
                        break;
                }
                if (
                    x > core.status.thisMap.width - 1 ||
                    y > core.status.thisMap.height - 1 ||
                    x < 0 ||
                    y < 0
                )
                    return core.drawTip('当前无法使用技能');
                var id = core.getBlockId(x, y) || '';
                if (core.getBgNumber(x, y))
                    var bgId =
                        core.getBlockByNumber(core.getBgNumber(x, y)).event
                            .id || '';
                else var bgId = '';
                if (
                    core.noPass(x, y) ||
                    core.getBlockCls(x, y) == 'items' ||
                    (id.startsWith('X') && !ignoreInJump.event.includes(id)) ||
                    (bgId.startsWith('X') && !ignoreInJump.bg.includes(bgId)) ||
                    core.getBlockCls(x, y) == 'animates'
                )
                    return checkNoPass(direction, x, y, true);
                if (!startNo) return checkNoPass(direction, x, y, false);
                return { x: x, y: y };
            }
        };
    },
    towerBoss: function () {
        // 智慧boss
        // 变量们
        var stage = 1,
            hp = 10000,
            seconds = 0,
            boomLocs = [], // 随机轰炸
            heroHp;
        // 初始化
        this.initTowerBoss = function () {
            stage = 1;
            hp = 10000;
            seconds = 0;
            heroHp = core.status.hero.hp;
            core.dynamicChangeHp(0, 10000, 10000);
            core.autoFixRouteBoss(true);
            core.insertAction([{ type: 'sleep', time: 1000, noSkip: true }]);
            setTimeout(core.bossCore, 1000);
        };
        // 录像自动修正
        this.autoFixRouteBoss = function (isStart) {
            var route = core.status.route;
            if (isStart) {
                // 开始修正 记录当前录像长度
                flags.startFix = route.length - 1;
                return;
            }
            // 结束修正 删除录像 并追加跳过步骤
            route.splice(flags.startFix);
            route.push('choices:0');
            delete flags.startFix;
        };
        // 血条
        this.healthBar = function (now, total) {
            var nowLength = (now / total) * 476; // 当前血量下绘制长度
            var color = [
                255 * 2 - (now / total) * 2 * 255,
                (now / total) * 2 * 255,
                0,
                1
            ]; // 根据当前血量计算颜色
            // 建画布
            if (!core.dymCanvas.healthBar)
                core.createCanvas('healthBar', 0, 0, 480, 16, 140);
            else core.clearMap('healthBar');
            // 底
            core.fillRect('healthBar', 0, 0, 480, 16, '#bbbbbb');
            // css特效
            var style = document.getElementById('healthBar').getContext('2d');
            style.shadowColor = 'rgba(0, 0, 0, 0.8)';
            style.shadowBlur = 5;
            style.shadowOffsetX = 10;
            style.shadowOffsetY = 5;
            style.filter = 'blur(1px)';
            // 绘制
            core.fillRect('healthBar', 2, 2, nowLength, 12, color);
            // css特效
            style.shadowColor = 'rgba(0, 0, 0, 0.5)';
            style.shadowOffsetX = 0;
            style.shadowOffsetY = 0;
            // 绘制边框
            core.strokeRect('healthBar', 1, 1, 478, 14, '#ffffff', 2);
            // 绘制文字
            style.shadowColor = 'rgba(0, 0, 0, 1)';
            style.shadowBlur = 3;
            style.shadowOffsetX = 2;
            style.shadowOffsetY = 1;
            style.filter = 'none';
            core.fillText(
                'healthBar',
                now + '/' + total,
                5,
                13.5,
                '#ffffff',
                '16px normal'
            );
        };
        // 血量变化
        this.dynamicChangeHp = function (from, to, total) {
            var frame = 0,
                speed = (to - from) / 50,
                now = from;
            var interval = window.setInterval(() => {
                frame++;
                if (frame == 50) {
                    clearInterval(interval);
                    core.healthBar(to, total);
                }
                now += speed;
                core.healthBar(now, total);
            }, 20);
        };
        // boss说话跳字
        this.skipWord = function (words, x, y, time) {
            x = x || 0;
            y = y || 16;
            time = time || 3000;
            // 创建画布
            if (!core.dymCanvas.words)
                core.createCanvas('words', x, y, 480, 24, 135);
            else core.clearMap('words');
            if (flags.wordsTimeOut) clearTimeout(flags.wordsTimeOut);
            core.dynamicCurtain(y, y + 24, time / 3);
            // css
            var style = document.getElementById('words').getContext('2d');
            style.shadowColor = 'rgba(0, 0, 0, 1)';
            style.shadowBlur = 3;
            style.shadowOffsetX = 2;
            style.shadowOffsetY = 1;
            // 一个一个绘制
            skip1(0);
            // 跳字
            function skip1(now) {
                if (parseInt(now) >= words.length) {
                    flags.wordsTimeOut = setTimeout(() => {
                        core.deleteCanvas('words');
                        core.deleteCanvas('wordsBg');
                    }, time);
                    return;
                }
                var frame = 0,
                    blur = 2,
                    nx = 4 + now * 24;
                var skip2 = window.setInterval(() => {
                    blur -= 0.4;
                    frame++;
                    core.clearMap('words', nx, 0, 24, 24);
                    style.filter = 'blur(' + blur + 'px)';
                    core.fillText(
                        'words',
                        words[now],
                        nx,
                        20,
                        '#ffffff',
                        '22px normal'
                    );
                    if (frame == 5) {
                        clearInterval(skip2);
                        skip1(now + 1);
                    }
                }, 20);
            }
        };
        // 匀变速下降背景
        this.dynamicCurtain = function (from, to, time, width) {
            width = width || 480;
            if (!core.dymCanvas.wordsBg)
                core.createCanvas('wordsBg', 0, from, width, 24, 130);
            else core.clearMap('wordsBg');
            time /= 1000;
            var ny = from,
                frame = 0,
                a = (2 * (to - from)) / Math.pow(time * 50, 2),
                speed = a * time * 50;
            var style = document.getElementById('wordsBg').getContext('2d');
            style.shadowColor = 'rgba(0, 0, 0, 0.8)';
            var wordsInterval = window.setInterval(() => {
                frame++;
                speed -= a;
                ny += speed;
                core.clearMap('wordsBg');
                style.shadowBlur = 8;
                style.shadowOffsetY = 2;
                core.fillRect(
                    'wordsBg',
                    0,
                    0,
                    width,
                    ny - from,
                    [180, 180, 180, 0.7]
                );
                style.shadowBlur = 3;
                style.shadowOffsetY = 0;
                core.strokeRect(
                    'wordsBg',
                    1,
                    1,
                    width - 2,
                    ny - from - 2,
                    [255, 255, 255, 0.7],
                    2
                );
                if (frame >= time * 50) {
                    clearInterval(wordsInterval);
                    core.clearMap('wordsBg');
                    style.shadowBlur = 8;
                    style.shadowOffsetY = 2;
                    core.fillRect(
                        'wordsBg',
                        0,
                        0,
                        width,
                        to - from,
                        [180, 180, 180, 0.7]
                    );
                    style.shadowBlur = 3;
                    style.shadowOffsetY = 0;
                    core.strokeRect(
                        'wordsBg',
                        1,
                        1,
                        width - 2,
                        ny - from - 2,
                        [255, 255, 255, 0.7],
                        2
                    );
                }
            }, 20);
        };
        // 攻击boss
        this.attackBoss = function () {
            // 每秒钟地面随机出现伤害图块 踩上去攻击boss 500血
            if (flags.canAttack) return;
            if (Math.random() < 0.8) return;
            if (hp > 3500) {
                var nx = Math.floor(Math.random() * 13 + 1),
                    ny = Math.floor(Math.random() * 13 + 1);
            } else if (hp > 2000) {
                var nx = Math.floor(Math.random() * 11 + 2),
                    ny = Math.floor(Math.random() * 11 + 2);
            } else if (hp > 1000) {
                var nx = Math.floor(Math.random() * 9 + 3),
                    ny = Math.floor(Math.random() * 9 + 3);
            } else {
                var nx = Math.floor(Math.random() * 7 + 4),
                    ny = Math.floor(Math.random() * 7 + 4);
            }
            // 在地图上显示
            flags.canAttack = true;
            if (!core.dymCanvas.attackBoss)
                core.createCanvas('attackBoss', 0, 0, 480, 480, 35);
            else core.clearMap('attackBoss');
            var style = document.getElementById('attackBoss').getContext('2d');
            var frame1 = 0,
                blur = 3,
                scale = 2,
                speed = 0.04,
                a = 0.0008;
            var atkAnimate = window.setInterval(() => {
                core.clearMap('attackBoss');
                frame1++;
                speed -= a;
                scale -= speed;
                blur -= 0.06;
                style.filter = 'blur(' + blur + 'px)';
                core.strokeCircle(
                    'attackBoss',
                    nx * 32 + 16,
                    ny * 32 + 16,
                    16 * scale,
                    [255, 150, 150, 0.7],
                    4
                );
                core.fillCircle(
                    'attackBoss',
                    nx * 32 + 16,
                    ny * 32 + 16,
                    3 * scale,
                    [255, 150, 150, 0.7]
                );
                if (frame1 == 50) {
                    clearInterval(atkAnimate);
                    core.clearMap('attactkBoss');
                    style.filter = 'none';
                    core.strokeCircle(
                        'attackBoss',
                        nx * 32 + 16,
                        ny * 32 + 16,
                        16,
                        [255, 150, 150, 0.7],
                        4
                    );
                    core.fillCircle(
                        'attackBoss',
                        nx * 32 + 16,
                        ny * 32 + 16,
                        3,
                        [255, 150, 150, 0.7]
                    );
                }
            }, 20);
            // 实时检测勇士位置
            var frame2 = 0;
            var atkBoss = window.setInterval(() => {
                frame2++;
                var x = core.status.hero.loc.x,
                    y = core.status.hero.loc.y;
                // 2秒超时
                if (frame2 > 100) {
                    setTimeout(() => {
                        delete flags.canAttack;
                    }, 4000);
                    clearInterval(atkBoss);
                    core.deleteCanvas('attackBoss');
                    return;
                }
                if (nx == x && ny == y) {
                    setTimeout(() => {
                        delete flags.canAttack;
                    }, 4000);
                    core.dynamicChangeHp(hp, hp - 500, 10000);
                    hp -= 500;
                    clearInterval(atkBoss);
                    core.deleteCanvas('attackBoss');
                    if (hp > 3500) core.drawAnimate('hand', 7, 1);
                    else if (hp > 2000) core.drawAnimate('hand', 7, 2);
                    else if (hp > 1000) core.drawAnimate('hand', 7, 3);
                    else core.drawAnimate('hand', 7, 4);
                    return;
                }
            }, 20);
        };
        // 核心函数
        this.bossCore = function () {
            var interval = window.setInterval(() => {
                if (stage == 1) {
                    if (seconds == 8)
                        core.skipWord('智慧之神：果然，你和别人不一样。');
                    if (seconds == 12)
                        core.skipWord('智慧之神：你知道去躲避那些攻击。');
                    if (seconds == 16)
                        core.skipWord(
                            '智慧之神：之前的那些人总会一头撞上我的攻击，悲剧收场。'
                        );
                    if (seconds == 20)
                        core.skipWord('提示：踩在红圈上可以对智慧之神造成伤害');
                    if (seconds > 10) core.attackBoss();
                    if (seconds % 10 == 0) core.intelligentArrow();
                    if (seconds % 7 == 0 && seconds != 0)
                        core.intelligentDoor();
                    if (seconds > 20 && seconds % 13 == 0) core.icyMomentem();
                }
                if (stage == 1 && hp <= 7000) {
                    stage++;
                    seconds = 0;
                    core.skipWord('智慧之神：不错小伙子');
                    core.pauseBgm();
                }
                if (stage == 2) {
                    if (seconds == 4)
                        core.skipWord('智慧之神：你的确拥有智慧。');
                    if (seconds == 8)
                        core.skipWord('智慧之神：或许你就是那个未来的救星。');
                    if (seconds == 12)
                        core.skipWord('智慧之神：不过，这场战斗才刚刚开始');
                    if (seconds == 25)
                        core.skipWord('提示：方形区域均为危险区域');
                    if (seconds == 15)
                        setTimeout(() => {
                            core.playSound('thunder.mp3');
                        }, 500);
                    if (seconds == 16) core.startStage2();
                    if (seconds > 20) core.attackBoss();
                    if (seconds % 4 == 0 && seconds > 20) core.randomThunder();
                    if (seconds > 30 && seconds % 12 == 0) core.ballThunder();
                }
                if (hp <= 3500 && stage == 2) {
                    stage++;
                    seconds = 0;
                    core.skipWord('智慧之神：不得不说小伙子');
                    core.pauseBgm();
                }
                if (stage >= 3) {
                    if (seconds == 4)
                        core.skipWord('智慧之神：拥有智慧就是不一样。');
                    if (seconds == 8)
                        core.skipWord('智慧之神：不过，你还得再过我一关！');
                    if (seconds == 12) core.startStage3();
                    if (seconds == 15) {
                        flags.booming = true;
                        core.randomBoom();
                    }
                    if (seconds > 20) core.attackBoss();
                    if (seconds > 20 && seconds % 10 == 0) core.chainThunder();
                    if (hp == 2000 && stage == 3) {
                        stage++;
                        flags.booming = false;
                        core.skipWord('智慧之神：还没有结束！');
                        core.startStage4();
                        setTimeout(() => {
                            flags.booming = true;
                            core.randomBoom();
                        }, 5000);
                    }
                    if (hp == 1000 && stage == 4) {
                        stage++;
                        flags.booming = false;
                        core.skipWord('智慧之神：还没有结束！！！！！！');
                        core.startStage5();
                        setTimeout(() => {
                            flags.booming = true;
                            core.randomBoom();
                        }, 5000);
                    }
                }
                if (hp == 0) {
                    clearInterval(interval);
                    clearInterval(flags.boom);
                    core.status.hero.hp = heroHp;
                    core.autoFixRouteBoss(false);
                    delete flags.__bgm__;
                    core.pauseBgm();
                    core.insertAction([
                        '\t[智慧之神,E557]\b[down,7,4]看来你真的会成为那个拯救未来的人。',
                        '\t[智慧之神,E557]\b[down,7,4]记住，拥有智慧便可以掌控万物。',
                        '\t[低级智人]\b[up,hero]智慧？智慧到底是什么？',
                        '\t[智慧之神,E557]\b[down,7,4]最终，你会知道答案的。',
                        '\t[智慧之神,E557]\b[down,7,4]继续向东前进吧，那里能找到你想要的答案。',
                        { type: 'openDoor', loc: [13, 6], floorId: 'MT19' },
                        '\t[智慧之神,E557]\b[down,7,4]我这就把你送出去',
                        { type: 'setValue', name: 'flag:boss1', value: 'true' },
                        { type: 'changeFloor', floorId: 'MT20', loc: [7, 9] },
                        { type: 'forbidSave' },
                        { type: 'showStatusBar' },
                        {
                            type: 'function',
                            function: '() => {\ncore.deleteAllCanvas();\n}'
                        }
                    ]);
                }
                seconds++;
            }, 1000);
        };
        // ------ 第一阶段 10000~7000血 ------ //
        // 技能1 智慧之箭 1000伤害
        this.intelligentArrow = function (fromSelf) {
            // 坐标
            var loc = Math.floor(Math.random() * 13 + 1);
            var direction = Math.random() > 0.5 ? 'horizon' : 'vertical';
            // 执行次数
            if (!fromSelf) {
                var times = Math.ceil(Math.random() * 8) + 4;
                var nowTime = 1;
                var times1 = window.setInterval(() => {
                    core.intelligentArrow(true);
                    nowTime++;
                    if (nowTime >= times) {
                        clearInterval(times1);
                    }
                }, 200);
            }
            // 防重复
            if (core.dymCanvas['inteArrow' + loc + direction])
                return core.intelligentArrow(true);
            // 危险区域
            if (!core.dymCanvas.danger1)
                core.createCanvas('danger1', 0, 0, 480, 480, 35);
            if (direction == 'horizon') {
                for (var nx = 1; nx < 14; nx++) {
                    core.fillRect(
                        'danger1',
                        nx * 32 + 2,
                        loc * 32 + 2,
                        28,
                        28,
                        [255, 0, 0, 0.6]
                    );
                }
            } else {
                for (var ny = 1; ny < 14; ny++) {
                    core.fillRect(
                        'danger1',
                        loc * 32 + 2,
                        ny * 32 + 2,
                        28,
                        28,
                        [255, 0, 0, 0.6]
                    );
                }
            }
            // 箭
            if (!core.dymCanvas['inteArrow' + loc + direction])
                core.createCanvas(
                    'inteArrow' + loc + direction,
                    0,
                    0,
                    544,
                    544,
                    65
                );
            core.clearMap('inteArrow' + loc + direction);
            if (direction == 'horizon')
                core.drawImage(
                    'inteArrow' + loc + direction,
                    'arrow.png',
                    448,
                    loc * 32,
                    102,
                    32
                );
            else
                core.drawImage(
                    'inteArrow' + loc + direction,
                    'arrow.png',
                    0,
                    0,
                    259,
                    75,
                    loc * 32 - 32,
                    480,
                    102,
                    32,
                    Math.PI / 2
                );
            // 动画与伤害函数
            setTimeout(() => {
                core.playSound('arrow.mp3');
                core.deleteCanvas('danger1');
                // 动画效果
                var nloc = 0,
                    speed = 0;
                var damaged = {};
                var skill1 = window.setInterval(() => {
                    speed -= 1;
                    nloc += speed;
                    if (direction == 'horizon')
                        core.relocateCanvas(
                            'inteArrow' + loc + direction,
                            nloc,
                            0
                        );
                    else
                        core.relocateCanvas(
                            'inteArrow' + loc + direction,
                            0,
                            nloc
                        );
                    if (nloc < -480) {
                        core.deleteCanvas('inteArrow' + loc + direction);
                        clearInterval(skill1);
                    }
                    // 伤害判定
                    if (!damaged[loc + direction]) {
                        var x = core.status.hero.loc.x,
                            y = core.status.hero.loc.y;
                        if (direction == 'horizon') {
                            if (
                                y == loc &&
                                Math.floor((480 + nloc) / 32) == x
                            ) {
                                damaged[loc + direction] = true;
                                core.drawHeroAnimate('hand');
                                core.status.hero.hp -= 1000;
                                core.addPop(x * 32 + 16, y * 32 + 16, -1000);
                                core.updateStatusBar();
                                if (core.status.hero.hp < 0) {
                                    clearInterval(skill1);
                                    core.status.hero.hp = 0;
                                    core.updateStatusBar();
                                    core.events.lose();
                                    return;
                                }
                            }
                        } else {
                            if (
                                x == loc &&
                                Math.floor((480 + nloc) / 32) == y
                            ) {
                                damaged[loc + direction] = true;
                                core.drawHeroAnimate('hand');
                                core.status.hero.hp -= 1000;
                                core.addPop(x * 32 + 16, y * 32 + 16, -1000);
                                core.updateStatusBar();
                                if (core.status.hero.hp < 0) {
                                    clearInterval(skill1);
                                    core.status.hero.hp = 0;
                                    core.updateStatusBar();
                                    core.events.lose();
                                    return;
                                }
                            }
                        }
                    }
                }, 20);
            }, 3000);
        };
        // 技能2 智慧之门 随机传送
        this.intelligentDoor = function () {
            if (Math.random() < 0.5) return;
            // 随机位置
            var toX = Math.floor(Math.random() * 13) + 1,
                toY = Math.floor(Math.random() * 13) + 1;
            // 在勇士身上绘制动画
            core.drawHeroAnimate('magicAtk');
            // 在目标位置绘制动画
            if (!core.dymCanvas['door' + toX + '_' + toY])
                core.createCanvas('door' + toX + '_' + toY, 0, 0, 480, 480, 35);
            else core.clearMap('door' + toX + '_' + toY);
            var style = document
                .getElementById('door' + toX + '_' + toY)
                .getContext('2d');
            var frame = 0,
                width = 0,
                a = 0.0128,
                speed = 0.64;
            // 动画
            var skill2 = window.setInterval(() => {
                frame++;
                if (frame < 40) return;
                if (frame == 100) {
                    clearInterval(skill2);
                    // 执行传送
                    core.insertAction([{ type: 'changePos', loc: [toX, toY] }]);
                    // 删除传送门
                    setTimeout(() => {
                        core.deleteCanvas('door' + toX + '_' + toY);
                    }, 2000);
                    return;
                }
                width += speed * 2;
                speed -= a;
                core.clearMap('door' + toX + '_' + toY);
                style.shadowColor = 'rgba(255, 255, 255, 1)';
                style.shadowBlur = 7;
                style.filter = 'blur(5px)';
                core.fillRect(
                    'door' + toX + '_' + toY,
                    toX * 32,
                    toY * 32 - 24,
                    width,
                    48,
                    [255, 255, 255, 0.7]
                );
                style.shadowColor = 'rgba(0, 0, 0, 0.5)';
                style.filter = 'blur(3px)';
                core.strokeRect(
                    'door' + toX + '_' + toY,
                    toX * 32,
                    toY * 32 - 24,
                    width,
                    48,
                    [255, 255, 255, 0.7],
                    3
                );
            }, 20);
        };
        // 技能3 万冰之势 全屏随机转换滑冰 如果转换时在滑冰上造成5000点伤害
        this.icyMomentem = function () {
            if (flags.haveIce) return;
            if (Math.random() < 0.5) return;
            var times = Math.floor(Math.random() * 100);
            // 防卡 就setInterval吧
            var locs = [],
                now = 0;
            flags.haveIce = true;
            if (!core.dymCanvas.icyMomentem)
                core.createCanvas('icyMomentem', 0, 0, 480, 480, 35);
            else core.clearMap('icyMomentem');
            var skill3 = window.setInterval(() => {
                var nx = Math.floor(Math.random() * 13) + 1,
                    ny = Math.floor(Math.random() * 13) + 1;
                if (!locs.includes([nx, ny])) {
                    locs.push([nx, ny]);
                    core.fillRect(
                        'icyMomentem',
                        locs[now][0] * 32 + 2,
                        locs[now][1] * 32 + 2,
                        28,
                        28,
                        [150, 150, 255, 0.6]
                    );
                }
                if (now == times) {
                    clearInterval(skill3);
                    skill3Effect();
                }
                now++;
            }, 20);
            // 动画和伤害函数
            function skill3Effect() {
                // 防卡 setInterval
                var index = 0;
                var effect = window.setInterval(() => {
                    var x = core.status.hero.loc.x,
                        y = core.status.hero.loc.y;
                    core.clearMap(
                        'icyMomentem',
                        locs[index][0] * 32,
                        locs[index][1] * 32,
                        32,
                        32
                    );
                    core.setBgFgBlock(
                        'bg',
                        167,
                        locs[index][0],
                        locs[index][1]
                    );
                    core.drawAnimate('ice', locs[index][0], locs[index][1]);
                    if (x == locs[index][0] && y == locs[index][1]) {
                        core.drawHeroAnimate('hand');
                        core.status.hero.hp -= 5000;
                        core.addPop(x * 32 + 16, y * 32 + 16, -5000);
                        core.updateStatusBar();
                        if (core.status.hero.hp < 0) {
                            core.status.hero.hp = 0;
                            core.updateStatusBar();
                            core.events.lose();
                            clearInterval(effect);
                            return;
                        }
                    }
                    if (index >= locs.length - 1) {
                        clearInterval(effect);
                        setTimeout(() => {
                            deleteIce(locs);
                        }, 5000);
                    }
                    index++;
                }, 50);
            }
            // 删除函数
            function deleteIce(locs) {
                // 照样 setInterval
                var index = 0;
                var deleteIce = window.setInterval(() => {
                    core.setBgFgBlock('bg', 0, locs[index][0], locs[index][1]);
                    index++;
                    if (index >= locs.length) {
                        clearInterval(deleteIce);
                        core.deleteCanvas('icyMomentem');
                        setTimeout(() => {
                            delete flags.haveIce;
                        }, 5000);
                    }
                }, 50);
            }
        };
        // ------ 第二阶段 7000~3500 ------ //
        // 开始第二阶段
        this.startStage2 = function () {
            // 闪烁
            core.createCanvas('flash', 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(() => {
                core.clearMap('flash');
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect('flash', 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas('flash');
                }
                if (frame == 8) {
                    changeWeather();
                }
            });
            // 切换天气
            function changeWeather() {
                core.setWeather();
                core.setWeather('rain', 10);
                core.setWeather('fog', 8);
                // 色调也得换
                core.setCurtain([0, 0, 0, 0.3]);
                // bgm
                core.playBgm('towerBoss2.mp3');
            }
        };
        // ----- 打雷相关 ----- //
        // 随机打雷
        this.randomThunder = function () {
            var x = Math.floor(Math.random() * 13) + 1,
                y = Math.floor(Math.random() * 13) + 1,
                power = Math.ceil(Math.random() * 6);
            // 绘制危险区域
            if (!core.dymCanvas.thunderDanger)
                core.createCanvas('thunderDanger', 0, 0, 480, 480, 35);
            else core.clearMap('thunderDanger');
            // 3*3范围
            for (var nx = x - 1; nx <= x + 1; nx++) {
                for (var ny = y - 1; ny <= y + 1; ny++) {
                    core.fillRect(
                        'thunderDanger',
                        nx * 32 + 2,
                        ny * 32 + 2,
                        28,
                        28,
                        [255, 255, 255, 0.6]
                    );
                }
            }
            core.deleteCanvas('flash');
            setTimeout(() => {
                core.playSound('thunder.mp3');
            }, 500);
            setTimeout(() => {
                core.deleteCanvas('thunderDanger');
                core.drawThunder(x, y, power);
            }, 1000);
        };
        // 绘制
        this.drawThunder = function (x, y, power) {
            var route = core.getThunderRoute(x * 32 + 16, y * 32 + 16, power);
            // 开始绘制
            if (!core.dymCanvas.thunder)
                core.createCanvas('thunder', 0, 0, 480, 480, 65);
            else core.clearMap('thunder');
            var style = core.dymCanvas.thunder;
            style.shadowColor = 'rgba(220, 220, 255, 1)';
            style.shadowBlur = power;
            style.filter = 'blur(2.5px)';
            for (var num in route) {
                // 一个个绘制
                for (var i = 0; i < route[num].length - 1; i++) {
                    var now = route[num][i],
                        next = route[num][i + 1];
                    core.drawLine(
                        'thunder',
                        now[0],
                        now[1],
                        next[0],
                        next[1],
                        '#ffffff',
                        2.5
                    );
                }
            }
            // 伤害
            core.getThunderDamage(x, y, power);
            // 闪一下
            var frame1 = 0,
                alpha = 0.5;
            if (!core.dymCanvas.flash)
                core.createCanvas('flash', 0, 0, 480, 480, 160);
            else core.clearMap('flash');
            var thunderFlash = window.setInterval(() => {
                alpha -= 0.05;
                frame1++;
                core.clearMap('flash');
                core.fillRect('flash', 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (frame1 >= 10) {
                    clearInterval(thunderFlash);
                    core.deleteCanvas('flash');
                    // 删除闪电
                    setTimeout(() => {
                        core.deleteCanvas('thunder');
                    }, 700);
                }
            }, 20);
        };
        // 获得雷电路径
        this.getThunderRoute = function (x, y, power) {
            var route = [];
            for (var num = 0; num < power; num++) {
                var nx = x,
                    ny = y;
                route[num] = [];
                for (var i = 0; ny >= 0; i++) {
                    if (i > 0) {
                        nx += Math.random() * 30 - 15;
                        ny -= Math.random() * 80 + 30;
                    } else {
                        nx += Math.random() * 16 - 8;
                        ny += Math.random() * 16 - 8;
                    }
                    route[num].push([nx, ny]);
                }
            }
            return route;
        };
        // 打雷伤害判定
        this.getThunderDamage = function (x, y, power) {
            var hx = core.status.hero.loc.x,
                hy = core.status.hero.loc.y;
            if (Math.abs(hx - x) <= 1 && Math.abs(hy - y) <= 1) {
                core.status.hero.hp -= 3000 * power;
                core.addPop(x * 32 + 16, y * 32 + 16, -3000 * power);
                core.updateStatusBar();
                if (core.status.hero.hp < 0) {
                    core.status.hero.hp = 0;
                    core.updateStatusBar();
                    core.events.lose();
                    return;
                }
            }
        };
        // ----- 打雷 END ----- //
        // 球形闪电 横竖
        this.ballThunder = function () {
            // 随机数量
            var times = Math.ceil(Math.random() * 12) + 6;
            var now = 0,
                locs = [];
            // setInterval执行
            var ballThunder = window.setInterval(() => {
                // 画布
                if (!core.dymCanvas['ballThunder' + now])
                    core.createCanvas('ballThunder' + now, 0, 0, 480, 480, 35);
                else core.clearMap('ballThunder' + now);
                var nx = Math.floor(Math.random() * 13) + 1,
                    ny = Math.floor(Math.random() * 13) + 1;
                // 添加位置 绘制危险区域
                if (!locs.includes([nx, ny])) {
                    locs.push([nx, ny]);
                    // 横竖都要画
                    for (var mx = 1; mx < 14; mx++) {
                        core.fillRect(
                            'ballThunder' + now,
                            mx * 32 + 2,
                            ny * 32 + 2,
                            28,
                            28,
                            [190, 190, 255, 0.6]
                        );
                    }
                    for (var my = 1; my < 14; my++) {
                        core.fillRect(
                            'ballThunder' + now,
                            nx * 32 + 2,
                            my * 32 + 2,
                            28,
                            28,
                            [190, 190, 255, 0.6]
                        );
                    }
                }
                now++;
                if (now >= times) {
                    clearInterval(ballThunder);
                    setTimeout(() => {
                        thunderAnimate(locs);
                    }, 1000);
                }
            }, 200);
            // 动画 伤害
            function thunderAnimate(locs) {
                var frame = 0;
                // 画布
                if (!core.dymCanvas.ballAnimate)
                    core.createCanvas('ballAnimate', 0, 0, 480, 480, 65);
                else core.clearMap('ballAnimate');
                var style = core.dymCanvas.ballAnimate;
                style.shadowColor = 'rgba(255, 255, 255, 1)';
                var damaged = [];
                var animate = window.setInterval(() => {
                    core.clearMap('ballAnimate');
                    for (var i = 0; i < locs.length; i++) {
                        style.shadowBlur = 16 * Math.random();
                        // 错开执行动画
                        if (frame - 10 * i > 0) {
                            var now = frame - 10 * i;
                            if (now == 1) core.playSound('electron.mp3');
                            // 动画
                            var nx = locs[i][0] * 32 + 16,
                                ny = locs[i][1] * 32 + 16;
                            if (now <= 2) {
                                core.fillCircle(
                                    'ballAnimate',
                                    nx,
                                    ny,
                                    16 + 3 * now,
                                    [255, 255, 255, 0.9]
                                );
                            } else {
                                // 上
                                core.fillCircle(
                                    'ballAnimate',
                                    nx,
                                    ny - 4 * now,
                                    7 + 2 * Math.random(),
                                    [255, 255, 255, 0.7]
                                );
                                // 下
                                core.fillCircle(
                                    'ballAnimate',
                                    nx,
                                    ny + 4 * now,
                                    7 + 2 * Math.random(),
                                    [255, 255, 255, 0.7]
                                );
                                // 左
                                core.fillCircle(
                                    'ballAnimate',
                                    nx - 4 * now,
                                    ny,
                                    7 + 2 * Math.random(),
                                    [255, 255, 255, 0.7]
                                );
                                // 右
                                core.fillCircle(
                                    'ballAnimate',
                                    nx + 4 * now,
                                    ny,
                                    7 + 2 * Math.random(),
                                    [255, 255, 255, 0.7]
                                );
                            }
                            // 清除危险区域
                            core.clearMap(
                                'ballThunder' + i,
                                nx - 16,
                                ny - 16 - 4 * now,
                                32,
                                32
                            );
                            core.clearMap(
                                'ballThunder' + i,
                                nx - 16,
                                ny - 16 + 4 * now,
                                32,
                                32
                            );
                            core.clearMap(
                                'ballThunder' + i,
                                nx - 16 - 4 * now,
                                ny - 16,
                                32,
                                32
                            );
                            core.clearMap(
                                'ballThunder' + i,
                                nx - 16 + 4 * now,
                                ny - 16,
                                32,
                                32
                            );
                            // 伤害
                            if (!damaged[i]) {
                                var x = core.status.hero.loc.x,
                                    y = core.status.hero.loc.y;
                                if (
                                    ((Math.floor((nx - 16 - 4 * now) / 32) ==
                                        x ||
                                        Math.floor((nx - 16 + 4 * now) / 32) ==
                                            x) &&
                                        locs[i][1] == y) ||
                                    ((Math.floor((ny - 16 - 4 * now) / 32) ==
                                        y ||
                                        Math.floor((ny - 16 + 4 * now) / 32) ==
                                            y) &&
                                        locs[i][0] == x)
                                ) {
                                    damaged[i] = true;
                                    core.status.hero.hp -= 3000;
                                    core.addPop(
                                        x * 32 + 16,
                                        y * 32 + 16,
                                        -3000
                                    );
                                    core.updateStatusBar();
                                    core.playSound('electron.mp3');
                                    if (core.status.hero.hp < 0) {
                                        core.status.hero.hp = 0;
                                        core.updateStatusBar();
                                        core.events.lose();
                                        clearInterval(animate);
                                        return;
                                    }
                                }
                            }
                            // 结束
                            if (i == locs.length - 1 && now > 120) {
                                clearInterval(animate);
                            }
                        }
                    }
                    frame++;
                }, 20);
            }
        };
        // ------ 第三阶段 3500~0 ------ //
        this.startStage3 = function () {
            // 闪烁
            core.createCanvas('flash', 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(() => {
                core.clearMap('flash');
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect('flash', 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas('flash');
                }
                if (frame == 8) {
                    core.playSound('thunder.mp3');
                    changeTerra();
                    core.insertAction([{ type: 'changePos', loc: [7, 7] }]);
                }
            });
            // 改变地形
            function changeTerra() {
                for (var nx = 0; nx < 15; nx++) {
                    for (var ny = 0; ny < 15; ny++) {
                        if (nx == 0 || nx == 14 || ny == 0 || ny == 14) {
                            core.removeBlock(nx, ny);
                        }
                        if (
                            (nx == 1 || nx == 13 || ny == 1 || ny == 13) &&
                            nx != 0 &&
                            nx != 14 &&
                            ny != 0 &&
                            ny != 14
                        ) {
                            core.setBlock(527, nx, ny);
                        }
                    }
                }
                core.createCanvas('tower7', 0, 0, 480, 480, 15);
                // 画贴图
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    360,
                    0,
                    32,
                    480,
                    0,
                    0,
                    32,
                    480
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    840,
                    0,
                    32,
                    480,
                    448,
                    0,
                    32,
                    480
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    392,
                    0,
                    416,
                    32,
                    32,
                    0,
                    416,
                    32
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    392,
                    448,
                    416,
                    32,
                    32,
                    448,
                    416,
                    32
                );
                core.setBlock('E557', 7, 2);
                core.playBgm('towerBoss3.mp3');
            }
        };
        // 进入第四阶段
        this.startStage4 = function () {
            // 闪烁
            core.createCanvas('flash', 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(() => {
                core.clearMap('flash');
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect('flash', 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas('flash');
                }
                if (frame == 8) {
                    core.playSound('thunder.mp3');
                    changeTerra();
                    core.insertAction([{ type: 'changePos', loc: [7, 7] }]);
                }
            });
            // 改变地形
            function changeTerra() {
                for (var nx = 1; nx < 14; nx++) {
                    for (var ny = 1; ny < 14; ny++) {
                        if (nx == 1 || nx == 13 || ny == 1 || ny == 13) {
                            core.removeBlock(nx, ny);
                        }
                        if (
                            (nx == 2 || nx == 12 || ny == 2 || ny == 12) &&
                            nx != 1 &&
                            nx != 13 &&
                            ny != 1 &&
                            ny != 13
                        ) {
                            core.setBlock(527, nx, ny);
                        }
                    }
                }
                core.createCanvas('tower7', 0, 0, 480, 480, 15);
                // 画贴图
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    360,
                    0,
                    64,
                    480,
                    0,
                    0,
                    64,
                    480
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    776,
                    0,
                    64,
                    480,
                    416,
                    0,
                    64,
                    480
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    424,
                    0,
                    352,
                    64,
                    64,
                    0,
                    352,
                    64
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    424,
                    416,
                    352,
                    64,
                    64,
                    416,
                    352,
                    64
                );
                core.setBlock('E557', 7, 3);
            }
        };
        // 进入第五阶段
        this.startStage5 = function () {
            // 闪烁
            core.createCanvas('flash', 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(() => {
                core.clearMap('flash');
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect('flash', 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas('flash');
                }
                if (frame == 8) {
                    core.playSound('thunder.mp3');
                    changeTerra();
                    core.insertAction([{ type: 'changePos', loc: [7, 7] }]);
                }
            });
            // 改变地形
            function changeTerra() {
                for (var nx = 2; nx < 13; nx++) {
                    for (var ny = 2; ny < 13; ny++) {
                        if (nx == 2 || nx == 12 || ny == 2 || ny == 12) {
                            core.removeBlock(nx, ny);
                        }
                        if (
                            (nx == 3 || nx == 11 || ny == 3 || ny == 11) &&
                            nx != 2 &&
                            nx != 12 &&
                            ny != 2 &&
                            ny != 12
                        ) {
                            core.setBlock(527, nx, ny);
                        }
                    }
                }
                core.createCanvas('tower7', 0, 0, 480, 480, 15);
                // 画贴图
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    360,
                    0,
                    96,
                    480,
                    0,
                    0,
                    96,
                    480
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    744,
                    0,
                    96,
                    480,
                    384,
                    0,
                    96,
                    480
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    456,
                    0,
                    288,
                    96,
                    96,
                    0,
                    288,
                    96
                );
                core.drawImage(
                    'tower7',
                    'tower7.jpeg',
                    456,
                    384,
                    288,
                    96,
                    96,
                    384,
                    288,
                    96
                );
                core.setBlock('E557', 7, 4);
            }
        };
        // 链状闪电 随机连接 碰到勇士则受伤
        this.chainThunder = function () {
            // 随机次数
            var times = Math.ceil(Math.random() * 6) + 3;
            // 画布
            if (!core.dymCanvas.chainDanger)
                core.createCanvas('chainDanger', 0, 0, 480, 480, 35);
            else core.clearMap('chainDanger');
            // setInterval执行
            var locs = [],
                now = 0;
            var chain = window.setInterval(() => {
                if (hp > 2000) {
                    var nx = Math.floor(Math.random() * 11) + 2,
                        ny = Math.floor(Math.random() * 11) + 2;
                } else if (hp > 1000) {
                    var nx = Math.floor(Math.random() * 9) + 3,
                        ny = Math.floor(Math.random() * 9) + 3;
                } else {
                    var nx = Math.floor(Math.random() * 7) + 4,
                        ny = Math.floor(Math.random() * 7) + 4;
                }
                if (!locs.includes([nx, ny])) {
                    locs.push([nx, ny]);
                } else return;
                // 危险线
                if (now > 0) {
                    core.drawLine(
                        'chainDanger',
                        locs[now - 1][0] * 32 + 16,
                        locs[now - 1][1] * 32 + 16,
                        nx * 32 + 16,
                        ny * 32 + 16,
                        [220, 100, 255, 0.6],
                        3
                    );
                }
                if (now >= times) {
                    clearInterval(chain);
                    setTimeout(() => {
                        core.getChainRoute(locs);
                        core.deleteCanvas('chainDanger');
                    }, 1000);
                }
                now++;
            }, 100);
        };
        // 链状闪电 动画
        this.chainAnimate = function (route) {
            if (!route) return core.chainThunder();
            // 画布
            if (!core.dymCanvas.chain)
                core.createCanvas('chain', 0, 0, 480, 480, 65);
            else core.clearMap('chain');
            var style = core.dymCanvas.chain;
            style.shadowBlur = 3;
            style.shadowColor = 'rgba(255, 255, 255, 1)';
            style.filter = 'blur(2px)';
            // 当然还是setInterval
            var frame = 0,
                now = 0;
            var animate = window.setInterval(() => {
                if (now >= route.length - 1) {
                    clearInterval(animate);
                    setTimeout(() => {
                        core.deleteCanvas('chain');
                    }, 1000);
                    return;
                }
                frame++;
                if (frame % 2 != 0) return;
                core.drawLine(
                    'chain',
                    route[now][0],
                    route[now][1],
                    route[now + 1][0],
                    route[now + 1][1],
                    '#ffffff',
                    3
                );
                // 节点
                if (now == 0) {
                    core.fillCircle(
                        'chain',
                        route[0][0],
                        route[0][1],
                        7,
                        '#ffffff'
                    );
                }
                if (
                    (route[now + 1][0] - 16) % 32 == 0 &&
                    (route[now + 1][1] - 16) % 32 == 0
                ) {
                    core.fillCircle(
                        'chain',
                        route[now + 1][0],
                        route[now + 1][1],
                        7,
                        '#ffffff'
                    );
                }
                // 判断伤害
                core.lineDamage(
                    route[now][0],
                    route[now][1],
                    route[now + 1][0],
                    route[now + 1][1],
                    4000
                );
                now++;
            }, 20);
        };
        // 链状闪电 获得闪电路径
        this.getChainRoute = function (locs) {
            // 照样用setInterval
            var now = 0,
                routes = [];
            var route = window.setInterval(() => {
                var nx = locs[now][0] * 32 + 16,
                    ny = locs[now][1] * 32 + 16;
                var tx = locs[now + 1][0] * 32 + 16,
                    ty = locs[now + 1][1] * 32 + 16;
                var dx = tx - nx,
                    dy = ty - ny;
                var angle = Math.atan(dy / dx);
                if (dy < 0 && dx < 0) angle += Math.PI;
                if (dx < 0 && dy > 0) angle += Math.PI;
                // 循环 + 随机
                var times = 0;
                while (true) {
                    times++;
                    nx += Math.random() * 50 * Math.cos(angle);
                    ny += Math.random() * 50 * Math.sin(angle);
                    routes.push([nx, ny]);
                    if (
                        Math.sqrt(
                            Math.pow(ny - ty, 2) + Math.pow(nx - tx, 2)
                        ) <= 100
                    ) {
                        routes.push([tx, ty]);
                        break;
                    }
                    if (times >= 20) {
                        clearInterval(route);
                        routes = null;
                        return;
                    }
                }
                now++;
                if (now >= locs.length - 1) {
                    clearInterval(route);
                    core.chainAnimate(routes);
                }
            }, 2);
        };
        // 随机轰炸
        this.randomBoom = function () {
            // 停止轰炸
            if (!flags.booming) {
                clearInterval(flags.boom);
                return;
            }
            // 根据阶段数 分攻击速率 和范围
            var boomTime;
            var range;
            if (hp > 2000) {
                boomTime = 500;
                range = 11;
            } else if (hp > 1000) {
                boomTime = 400;
                range = 9;
            } else {
                boomTime = 300;
                range = 7;
            }
            // setInterval
            flags.boom = window.setInterval(() => {
                var nx = Math.floor(Math.random() * range) + (15 - range) / 2,
                    ny = Math.floor(Math.random() * range) + (15 - range) / 2;
                boomLocs.push([nx, ny, 0]);
                if (!flags.booming) clearInterval(flags.boom);
            }, boomTime);
            // 动画要在这里调用
            core.boomingAnimate();
        };
        // 随机轰炸 动画
        this.boomingAnimate = function () {
            // 直接setInterval
            if (!core.dymCanvas.boom)
                core.createCanvas('boom', 0, 0, 480, 480, 65);
            else core.clearMap('boom');
            var boomAnimate = window.setInterval(() => {
                if (boomLocs.length == 0) return;
                if (!flags.booming && boomLocs.length == 0) {
                    clearInterval(boomAnimate);
                    return;
                }
                core.clearMap('boom');
                boomLocs.forEach((loc, index) => {
                    loc[2]++;
                    var x = loc[0] * 32 + 16,
                        y = loc[1] * 32 + 16;
                    if (loc[2] >= 20) {
                        var alpha = 1,
                            radius = 12;
                    } else {
                        var radius = 0.12 * Math.pow(20 - loc[2], 2) + 12,
                            alpha = Math.max(1, 2 - loc[2] * 0.1);
                    }
                    var angle = (loc[2] * Math.PI) / 50;
                    // 开始绘制
                    core.fillCircle('boom', x, y, 3, [255, 50, 50, alpha]);
                    core.strokeCircle(
                        'boom',
                        x,
                        y,
                        radius,
                        [255, 50, 50, alpha],
                        2
                    );
                    // 旋转的线
                    core.drawLine(
                        'boom',
                        x + radius * Math.cos(angle),
                        y + radius * Math.sin(angle),
                        x + (radius + 15) * Math.cos(angle),
                        y + (radius + 15) * Math.sin(angle),
                        [255, 50, 50, alpha],
                        1
                    );
                    angle += Math.PI;
                    core.drawLine(
                        'boom',
                        x + radius * Math.cos(angle),
                        y + radius * Math.sin(angle),
                        x + (radius + 15) * Math.cos(angle),
                        y + (radius + 15) * Math.sin(angle),
                        [255, 50, 50, alpha],
                        1
                    );
                    // 炸弹 下落
                    if (loc[2] > 70) {
                        var h =
                            y -
                            (20 * (85 - loc[2]) +
                                2.8 * Math.pow(85 - loc[2], 2));
                        core.drawImage(
                            'boom',
                            'boom.png',
                            x - 18,
                            h - 80,
                            36,
                            80
                        );
                    }
                    if (loc[2] == 85) {
                        core.drawAnimate(
                            'explosion1',
                            (x - 16) / 32,
                            (y - 16) / 32
                        );
                        boomLocs.splice(index, 1);
                        if (boomLocs.length == 0) core.deleteCanvas('boom');
                        // 伤害判定
                        var hx = core.status.hero.loc.x,
                            hy = core.status.hero.loc.y;
                        if (loc[0] == hx && loc[1] == hy) {
                            core.status.hero.hp -= 3000;
                            core.addPop(x * 32 + 16, y * 32 + 16, -3000);
                            core.updateStatusBar();
                            if (core.status.hero.hp < 0) {
                                core.status.hero.hp = 0;
                                core.updateStatusBar();
                                core.events.lose();
                                clearInterval(boomAnimate);
                                flags.booming = false;
                                return;
                            }
                        }
                    }
                });
            }, 20);
        };
        // 直线型伤害判定
        this.lineDamage = function (x1, y1, x2, y2, damage) {
            // 获得勇士坐标
            var x = core.status.hero.loc.x,
                y = core.status.hero.loc.y;
            // 是否可能碰到勇士
            if (
                (x1 < x * 32 - 12 && x2 < x * 32 - 12) ||
                (x1 > x * 32 + 12 && x2 > x * 32 + 12) ||
                (y1 < y * 32 - 16 && y2 < y * 32 - 16) ||
                (y1 > y * 32 + 16 && y2 > y * 32 + 16)
            )
                return;
            // 对角线的端点是否在直线异侧 勇士视为24 * 32
            for (var time = 1; time <= 2; time++) {
                // 左下右上
                if (time == 1) {
                    var loc1 = [x * 32 - 12, y * 32 + 16],
                        loc2 = [x * 32 + 12, y * 32 - 16];
                    // 直线方程 y == (y2 - y1) / (x2 - x1) * (x - x1) + y1
                    var n1 =
                            ((y2 - y1) / (x2 - x1)) * (loc1[0] - x1) +
                            y1 -
                            loc1[1],
                        n2 =
                            ((y2 - y1) / (x2 - x1)) * (loc2[0] - x1) +
                            y1 -
                            loc2[1];
                    if (n1 * n2 <= 0) {
                        core.status.hero.hp -= damage;
                        core.addPop(x * 32 + 16, y * 32 + 16, -damage);
                        core.updateStatusBar();
                        core.playSound('electron.mp3');
                        if (core.status.hero.hp < 0) {
                            core.status.hero.hp = 0;
                            core.updateStatusBar();
                            core.events.lose();
                            return;
                        }
                        return;
                    }
                } else {
                    // 左上右下
                    var loc1 = [x * 32 - 12, y * 32 - 16],
                        loc2 = [x * 32 + 12, y * 32 + 16];
                    // 直线方程 y == (y2 - y1) / (x2 - x1) * (x - x1) + y1
                    var n1 =
                            ((y2 - y1) / (x2 - x1)) * (loc1[0] - x1) +
                            y1 -
                            loc1[1],
                        n2 =
                            ((y2 - y1) / (x2 - x1)) * (loc2[0] - x1) +
                            y1 -
                            loc2[1];
                    if (n1 * n2 <= 0) {
                        core.status.hero.hp -= damage;
                        core.addPop(x * 32 + 16, y * 32 + 16, -damage);
                        core.updateStatusBar();
                        core.playSound('electron.mp3');
                        if (core.status.hero.hp < 0) {
                            core.status.hero.hp = 0;
                            core.updateStatusBar();
                            core.events.lose();
                            return;
                        }
                        return;
                    }
                }
            }
        };
    },
    popupDamage: function () {
        // 伤害弹出
        // 复写阻激夹域检测
        control.prototype.checkBlock = function (forceMockery) {
            var x = core.getHeroLoc('x'),
                y = core.getHeroLoc('y'),
                loc = x + ',' + y;
            var damage = core.status.checkBlock.damage[loc];
            if (damage) {
                if (!main.replayChecking)
                    core.addPop(
                        (x - core.bigmap.offsetX / 32) * 32 + 12,
                        (y - core.bigmap.offsetY / 32) * 32 + 20,
                        -damage.toString()
                    );
                core.status.hero.hp -= damage;
                var text =
                    Object.keys(core.status.checkBlock.type[loc] || {}).join(
                        '，'
                    ) || '伤害';
                core.drawTip('受到' + text + damage + '点');
                core.drawHeroAnimate('zone');
                this._checkBlock_disableQuickShop();
                core.status.hero.statistics.extraDamage += damage;
                if (core.status.hero.hp <= 0) {
                    core.status.hero.hp = 0;
                    core.updateStatusBar();
                    core.events.lose();
                    return;
                } else {
                    core.updateStatusBar();
                }
            }
            this._checkBlock_repulse(core.status.checkBlock.repulse[loc]);
            checkMockery(loc, forceMockery);
        };

        control.prototype.moveHero = function (direction, callback) {
            // 如果正在移动，直接return
            if (core.status.heroMoving != 0) return;
            if (core.isset(direction)) core.setHeroLoc('direction', direction);

            const nx = core.nextX();
            const ny = core.nextY();
            if (core.status.checkBlock.mockery[`${nx},${ny}`]) {
                core.autosave();
            }

            if (callback) return this.moveAction(callback);
            this._moveHero_moving();
        };

        /**
         * 电摇嘲讽
         * @param {LocString} loc
         * @param {boolean} force
         */
        function checkMockery(loc, force) {
            if (core.status.lockControl && !force) return;
            const mockery = core.status.checkBlock.mockery[loc];
            if (mockery) {
                mockery.sort((a, b) =>
                    a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]
                );
                const action = [];
                const [tx, ty] = mockery[0];
                let { x, y } = core.status.hero.loc;
                const dir =
                    x > tx ? 'left' : x < tx ? 'right' : y > ty ? 'up' : 'down';
                const { x: dx, y: dy } = core.utils.scan[dir];

                action.push({ type: 'changePos', direction: dir });
                const blocks = core.getMapBlocksObj();
                while (1) {
                    x += dx;
                    y += dy;
                    const block = blocks[`${x},${y}`];
                    if (block) {
                        block.event.cls === '';
                        if (
                            [
                                'animates',
                                'autotile',
                                'tileset',
                                'npcs',
                                'npc48'
                            ].includes(block.event.cls)
                        ) {
                            action.push(
                                {
                                    type: 'hide',
                                    loc: [[x, y]],
                                    remove: true,
                                    time: 0
                                },
                                {
                                    type: 'function',
                                    function: `function() { core.removeGlobalAnimate(${x}, ${y}) }`
                                },
                                {
                                    type: 'animate',
                                    name: 'hand',
                                    loc: [x, y],
                                    async: true
                                }
                            );
                        }
                        if (block.event.cls.startsWith('enemy')) {
                            action.push({ type: 'moveAction' });
                        }
                    }
                    action.push({ type: 'moveAction' });
                    if (x === tx && y === ty) break;
                }
                action.push({
                    type: 'function',
                    function: `function() { core.checkBlock(true); }`
                });
                action.push({ type: 'stopAsync' });
                core.insertAction(action);
            }
        }
    },
    hotReload: function () {
        if (main.mode !== 'play' || main.replayChecking) return;

        /**
         * 发送请求
         * @param {string} url
         * @param {string} type
         * @param {string} data
         * @returns {Promise<string>}
         */
        async function post(url, type, data) {
            const xhr = new XMLHttpRequest();
            xhr.open(type, url);
            xhr.send(data);
            const res = await new Promise(res => {
                xhr.onload = () => {
                    if (xhr.status !== 200) {
                        console.error(`hot reload: http ${xhr.status}`);
                        res('@error');
                    } else res('success');
                };
                xhr.onerror = () => {
                    res('@error');
                    console.error(`hot reload: error on connection`);
                };
            });
            if (res === 'success') return xhr.response;
            else return '@error';
        }

        /**
         * 热重载css
         * @param {string} data
         */
        function reloadCss(data) {
            const css = document.getElementById('mota-css');
            css.remove();
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = data;
            link.id = 'mota-css';
            document.head.appendChild(link);
            console.log(`css hot reload: ${data}`);
        }

        /**
         * 热重载楼层
         * @param {string} data
         */
        async function reloadFloor(data) {
            // 如果被砍层了直接忽略
            if (
                core.status.maps[data].deleted ||
                core.status.maps[data].forceDelete
            )
                return;
            // 首先重新加载main.floors对应的楼层
            await import(`/project/floors/${data}.js?v=${Date.now()}`);
            // 然后写入core.floors并解析
            core.floors[data] = main.floors[data];
            const floor = core.loadFloor(data);
            if (core.isPlaying()) {
                core.status.maps[data] = floor;
                delete core.status.mapBlockObjs[data];
                core.extractBlocks(data);
                if (data === core.status.floorId) {
                    core.drawMap(data);
                    let weather = core.getFlag('__weather__', null);
                    if (!weather && core.status.thisMap.weather)
                        weather = core.status.thisMap.weather;
                    if (weather) core.setWeather(weather[0], weather[1]);
                    else core.setWeather();
                }
                core.updateStatusBar(true, true);
            }
            console.log(`floor hot reload: ${data}`);
        }

        /**
         * 热重载脚本编辑及插件编写
         * @param {string} data
         */
        async function reloadScript(data) {
            if (data === 'plugins') {
                // 插件编写比较好办
                const before = plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1;
                // 这里不能用动态导入，因为动态导入会变成模块，变量就不是全局的了
                const script = document.createElement('script');
                script.src = `/project/plugins.js?v=${Date.now()}`;
                document.body.appendChild(script);
                await new Promise(res => {
                    script.onload = () => res('success');
                });
                const after = plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1;
                // 找到差异的函数
                for (const id in before) {
                    const fn = before[id];
                    if (typeof fn !== 'function') continue;
                    if (fn.toString() !== after[id]?.toString()) {
                        try {
                            core.plugin[id] = after[id];
                            core.plugin[id].call(core.plugin);
                            core.updateStatusBar(true, true);
                            console.log(`plugin hot reload: ${id}`);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            } else if (data === 'functions') {
                // 脚本编辑略微麻烦点
                const before = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a;
                // 这里不能用动态导入，因为动态导入会变成模块，变量就不是全局的了
                const script = document.createElement('script');
                script.src = `/project/functions.js?v=${Date.now()}`;
                document.body.appendChild(script);
                await new Promise(res => {
                    script.onload = () => res('success');
                });
                const after = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a;
                // 找到差异的函数
                for (const mod in before) {
                    const fns = before[mod];
                    for (const id in fns) {
                        const fn = fns[id];
                        if (typeof fn !== 'function' || id === 'hasSpecial')
                            continue;
                        const now = after[mod][id];
                        if (fn.toString() !== now.toString()) {
                            try {
                                if (mod === 'events') {
                                    core.events.eventdata[id] = now;
                                } else if (mod === 'enemys') {
                                    core.enemys.enemydata[id] = now;
                                } else if (mod === 'actions') {
                                    core.actions.actionsdata[id] = now;
                                } else if (mod === 'control') {
                                    core.control.controldata[id] = now;
                                } else if (mod === 'ui') {
                                    core.ui.uidata[id] = now;
                                }
                                core.updateStatusBar(true, true);
                                console.log(
                                    `function hot reload: ${mod}.${id}`
                                );
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                }
            }
        }

        /**
         * 属性热重载，包括全塔属性等
         * @param {string} data
         */
        async function reloadData(data) {
            const script = document.createElement('script');
            script.src = `/project/${data}.js?v=${Date.now()}`;
            document.body.appendChild(script);
            await new Promise(res => {
                script.onload = () => res('success');
            });

            let after;
            if (data === 'data')
                after = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
            if (data === 'enemys')
                after = enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80;
            if (data === 'icons')
                after = icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1;
            if (data === 'items')
                after = items_296f5d02_12fd_4166_a7c1_b5e830c9ee3a;
            if (data === 'maps')
                after = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;
            if (data === 'events')
                after = events_c12a15a8_c380_4b28_8144_256cba95f760;

            if (data === 'enemys') {
                core.enemys.enemys = after;
                for (var enemyId in after) {
                    core.enemys.enemys[enemyId].id = enemyId;
                }
                core.material.enemys = core.getEnemys();
            } else if (data === 'icons') {
                core.icons.icons = after;
                core.material.icons = core.getIcons();
            } else if (data === 'items') {
                core.items.items = after;
                for (var itemId in after) {
                    core.items.items[itemId].id = itemId;
                }
                core.material.items = core.getItems();
            } else if (data === 'maps') {
                core.maps.blocksInfo = after;
                core.status.mapBlockObjs = {};
                core.status.number2block = {};
                Object.values(core.status.maps).forEach(v => delete v.blocks);
                core.extractBlocks();
                core.setWeather(
                    core.animateFrame.weather.type,
                    core.animateFrame.weather.level
                );
                core.drawMap();
            } else if (data === 'events') {
                core.events.commonEvent = after.commonEvent;
            } else if (data === 'data') {
                location.reload();
            }
            core.updateStatusBar(true, true);
            console.log(`data hot reload: ${data}`);
        }

        // 初始化
        (async function () {
            const data = await post('/reload', 'POST', 'test');
            if (data === '@error') {
                console.log(`未检测到node服务，热重载插件将无法使用`);
            } else {
                console.log(`热重载插件加载成功`);
                // reload
                setInterval(async () => {
                    const res = await post('/reload', 'POST');
                    if (res === '@error') return;
                    if (res === 'true') location.reload();
                    else return;
                }, 1000);

                // hot reload
                setInterval(async () => {
                    const res = await post('/hotReload', 'POST');
                    const data = res.split('@@');
                    data.forEach(v => {
                        if (v === '') return;
                        const [type, file] = v.split(':');
                        if (type === 'css') reloadCss(file);
                        if (type === 'data') reloadData(file);
                        if (type === 'floor') reloadFloor(file);
                        if (type === 'script') reloadScript(file);
                    });
                }, 1000);
            }
        })();
    },
    uiChange: function () {
        if (main.replayChecking) return;

        function updateVueStatusBar() {
            if (main.replayChecking) return;
            core.plugin.statusBarStatus.value =
                !core.plugin.statusBarStatus.value;
            core.checkMarkedEnemy();
        }

        ui.prototype.drawBook = function () {
            if (!main.replayChecking)
                return (core.plugin.bookOpened.value = true);
        };

        ui.prototype._drawToolbox = function () {
            if (!core.isReplaying())
                return (core.plugin.toolOpened.value = true);
        };

        ui.prototype._drawEquipbox = function () {
            if (!core.isReplaying())
                return (core.plugin.equipOpened.value = true);
        };

        ui.prototype.drawFly = function () {
            if (!core.isReplaying())
                return (core.plugin.flyOpened.value = true);
        };

        control.prototype.updateStatusBar_update = function () {
            core.control.updateNextFrame = false;
            if (!core.isPlaying() || core.hasFlag('__statistics__')) return;
            core.control.controldata.updateStatusBar();
            if (!core.control.noAutoEvents) core.checkAutoEvents();
            core.control._updateStatusBar_setToolboxIcon();
            core.clearRouteFolding();
            core.control.noAutoEvents = true;
            // 更新vue状态栏
            updateVueStatusBar();
        };

        control.prototype.showStatusBar = function () {
            if (main.mode == 'editor') return;
            core.removeFlag('hideStatusBar');
            core.plugin.showStatusBar.value = true;
            core.dom.tools.hard.style.display = 'block';
            core.dom.toolBar.style.display = 'block';
        };

        control.prototype.hideStatusBar = function (showToolbox) {
            if (main.mode == 'editor') return;

            // 如果原本就是隐藏的，则先显示
            if (!core.domStyle.showStatusBar) this.showStatusBar();
            if (core.isReplaying()) showToolbox = true;
            core.plugin.showStatusBar.value = false;

            var toolItems = core.dom.tools;
            core.setFlag('hideStatusBar', true);
            core.setFlag('showToolbox', showToolbox || null);
            if (
                (!core.domStyle.isVertical && !core.flags.extendToolbar) ||
                !showToolbox
            ) {
                for (var i = 0; i < toolItems.length; ++i)
                    toolItems[i].style.display = 'none';
            }
            if (!core.domStyle.isVertical && !core.flags.extendToolbar) {
                core.dom.toolBar.style.display = 'none';
            }
        };

        this.showChapter = function (chapter) {
            if (core.isReplaying()) return;
            core.plugin.chapterContent.value = chapter;
            core.plugin.chapterShowed.value = true;
        };

        this.openSkill = function () {
            if (core.isReplaying()) return;
            core.plugin.skillOpened.value = true;
        };
    },
    remainEnemy: function () {
        /**
         * 检查漏怪
         * @param {FloorIds[]} floorIds
         */
        this.checkRemainEnemy = function (floorIds) {
            /**
             * @type {Record<FloorIds, {loc: LocArr, id: EnemyIds}[]>}
             */
            const enemy = {};
            floorIds.forEach(v => {
                core.extractBlocks(v);
                const blocks = core.status.maps[v].blocks;
                blocks.forEach(block => {
                    if (!block.event.cls.startsWith('enemy') || block.disable)
                        return;
                    /**
                     * @type {EnemyIds}
                     */
                    const id = block.event.id;
                    enemy[v] ??= [];
                    const info = enemy[v];
                    info.push({ loc: [block.x, block.y], id });
                });
            });
            return enemy;
        };

        /**
         * 获取剩余怪物字符串
         * @param {FloorIds[]} floorIds
         */
        this.getRemainEnemyString = function (floorIds) {
            const enemy = this.checkRemainEnemy(floorIds);
            const str = [];
            let now = [];
            for (const floor in enemy) {
                /**
                 * @type {{loc: LocArr, id: EnemyIds}[]}
                 */
                const all = enemy[floor];
                /**
                 * @type {Record<EnemyIds, number>}
                 */
                const remain = {};
                all.forEach(v => {
                    const id = v.id;
                    remain[id] ??= 0;
                    remain[id]++;
                });
                const title = core.status.maps[floor].title;
                for (const id in remain) {
                    const name = core.material.enemys[id].name;
                    now.push(`${title}(${floor}): ${name} * ${remain[id]}`);
                    if (now.length === 10) {
                        str.push(now.join('\n'));
                        now = [];
                    }
                }
            }
            if (now.length > 0) {
                str.push(now.join('\n'));
                str[0] = `当前剩余怪物：\n${str[0]}`;
            }

            return str;
        };
    },
    replay: function () {
        const replayableSettings = ['autoSkill'];

        // 注册修改设置的录像操作
        core.registerReplayAction('settings', name => {
            if (!name.startsWith('set:')) return false;
            const [, setting, value] = name.split(':');
            const v = eval(value);
            if (typeof v !== 'boolean') return false;
            if (!replayableSettings.includes(setting)) return false;
            flags[setting] = v;
            return true;
        });

        core.registerReplayAction('upgradeSkill', name => {
            if (!name.startsWith('skill:')) return false;
            const skill = parseInt(name.slice(6));
            core.upgradeSkill(skill);
        });

        core.registerReplayAction('study', name => {
            if (!name.startsWith('study:')) return false;
            const [num, x, y] = name
                .slice(6)
                .split(',')
                .map(v => parseInt(v));
            if (!core.canStudySkill(num)) return false;
            const id = core.getBlockId(x, y);
            const enemy = core.getEnemyInfo(id, void 0, x, y);
            if (!enemy.special.includes(num)) return false;
            core.studySkill(enemy, num);
            return true;
        });
    },
    skillTree: function () {
        /**
         * @type {number[]}
         */
        let levels = [];

        /**
         * @type {Record<Chapter, Skill[]>}
         */
        const skills = {
            chapter1: [
                {
                    index: 0,
                    title: '力量',
                    desc: [
                        '力量就是根本！可以通过智慧增加力量，每级增加2点攻击。'
                    ],
                    consume: '10 * level + 10',
                    front: [],
                    loc: [1, 2],
                    max: 10,
                    effect: ['攻击 + ${level * 2}']
                },
                {
                    index: 1,
                    title: '致命一击',
                    desc: ['爆发出全部力量攻击敌人，每级增加5点额外攻击。'],
                    consume: '30 * level + 30',
                    front: [[0, 5]],
                    loc: [2, 1],
                    max: 10,
                    effect: ['额外攻击 + ${level * 5}']
                },
                {
                    index: 2,
                    title: '断灭之刃',
                    desc: [
                        '<span style="color: gold">主动技能，快捷键1</span>，',
                        '开启后会在战斗时会额外增加一定量的攻击，但同时减少一定量的防御。'
                    ],
                    consume: '200 * level + 400',
                    front: [[1, 5]],
                    loc: [4, 1],
                    max: 5,
                    effect: ['增加${level * 10}%攻击，减少${level * 10}%防御']
                },
                {
                    index: 3,
                    title: '坚韧',
                    desc: ['由智慧转化出坚韧！每级增加2点防御'],
                    consume: '10 * level + 10',
                    front: [],
                    loc: [1, 4],
                    max: 10,
                    effect: ['防御 + ${level * 2}']
                },
                {
                    index: 4,
                    title: '回春',
                    desc: ['让智慧化为治愈之泉水！每级增加1点生命回复'],
                    consume: '20 * level + 20',
                    front: [[3, 5]],
                    loc: [2, 5],
                    max: 25,
                    effect: ['生命回复 + ${level}']
                },
                {
                    index: 5,
                    title: '治愈之泉',
                    desc: [
                        '让生命变得更多一些吧！每吃50瓶血瓶就增加当前生命回复10%的生命回复'
                    ],
                    consume: '1500',
                    front: [[4, 25]],
                    loc: [4, 5],
                    max: 1,
                    effect: ['50瓶血10%生命回复']
                },
                {
                    index: 6,
                    title: '坚固之盾',
                    desc: ['让护甲更加坚硬一些吧！每级增加10点防御'],
                    consume: '50 + level * 50',
                    front: [[3, 5]],
                    loc: [2, 3],
                    max: 10,
                    effect: ['防御 + ${level * 10}']
                },
                {
                    index: 7,
                    title: '无上之盾',
                    desc: [
                        '<span style="color: #dd4">第一章终极技能</span>，战斗时智慧会充当等量护盾'
                    ],
                    consume: '2500',
                    front: [
                        [6, 10],
                        [5, 1],
                        [2, 2]
                    ],
                    loc: [5, 3],
                    max: 1,
                    effect: ['战斗时智慧会充当护盾']
                }
            ],
            chapter2: [
                {
                    index: 8,
                    title: '锋利',
                    desc: ['让剑变得更加锋利！每级使攻击增加1%（buff式增加）'],
                    consume: 'level > 5 ? 50 * level ** 2 : 250 * level + 250',
                    front: [],
                    loc: [1, 2],
                    max: 15,
                    effect: ['攻击增加${level}%']
                },
                {
                    index: 9,
                    title: '坚硬',
                    desc: [
                        '让盾牌变得更加坚固！每级使防御增加1%（buff式增加）'
                    ],
                    consume: 'level > 5 ? 50 * level ** 2 : 250 * level + 250',
                    front: [],
                    loc: [1, 4],
                    max: 15,
                    effect: ['防御增加${level}%']
                },
                {
                    index: 10,
                    title: '铸剑为盾',
                    desc: [
                        '<span style="color: gold">主动技能，快捷键3</span>，',
                        '减少一定的攻击，增加一定的防御'
                    ],
                    consume: '500 * level + 1000',
                    front: [[9, 5]],
                    loc: [2, 5],
                    max: 5,
                    effect: [
                        '增加${level * 10}%的防御，减少${level * 10}%的攻击'
                    ]
                },
                {
                    index: 11,
                    title: '学习',
                    desc: [
                        '<span style="color: gold">主动技能</span>，可以消耗500智慧学习一个怪物的技能，',
                        '持续5场战斗，每学习一次消耗的智慧点增加250，每次升级使持续的战斗次数增加3次。更多信息可在学习后在百科全书查看。'
                    ],
                    consume: '2500 * level ** 2 + 2500',
                    front: [
                        [8, 10],
                        [12, 5]
                    ],
                    loc: [4, 1],
                    max: 6,
                    effect: ['学习怪物技能，持续${level * 3 + 2}场战斗']
                },
                {
                    index: 12,
                    title: '聪慧',
                    desc: [
                        '使主角变得更加聪明，每级使绿宝石增加的智慧点上升5%'
                    ],
                    consume:
                        'level > 5 ? 100 * level ** 2 : 250 * level + 1250',
                    front: [
                        [8, 10],
                        [9, 10]
                    ],
                    loc: [3, 3],
                    max: 20,
                    effect: ['增加${level * 5}%绿宝石效果']
                },
                {
                    index: 13,
                    title: '治愈',
                    desc: [
                        '使主角能够更好地回复生命，每级使血瓶的加血量增加2%'
                    ],
                    consume:
                        'level > 5 ? 100 * level ** 2 : 250 * level + 1250',
                    front: [[10, 3]],
                    loc: [4, 5],
                    max: 20,
                    effect: ['增加${level * 2}%的血瓶回血量']
                },
                {
                    index: 14,
                    title: '胜利之号',
                    desc: [
                        '<span style="color: #dd4">第二章终极技能</span>，',
                        '每打一个怪物，勇士在本楼层对怪物造成的伤害便增加1%'
                    ],
                    consume: '15000',
                    front: [
                        [13, 10],
                        [12, 10],
                        [11, 3]
                    ],
                    loc: [5, 3],
                    max: 1,
                    effect: ['每打一个怪，勇士造成的伤害增加1%']
                }
            ]
        };

        core.plugin.skills = skills;

        this.getSkillFromIndex = function (index) {
            for (const [, skill] of Object.entries(skills)) {
                const s = skill.find(v => v.index === index);
                if (s) return s;
            }
        };

        /**
         * 获取技能等级
         * @param {number} skill
         */
        this.getSkillLevel = function (skill) {
            return (levels[skill] ??= 0);
        };

        this.getSkillConsume = function (skill) {
            return eval(
                this.getSkillFromIndex(skill).consume.replace(
                    /level(:\d+)?/g,
                    (str, $1) => {
                        if ($1) return `core.getSkillLevel(${$1})`;
                        else return `core.getSkillLevel(${skill})`;
                    }
                )
            );
        };

        this.openTree = function () {
            if (main.replayChecking) return;
            core.plugin.skillTreeOpened.value = true;
        };

        /**
         * 能否升级某个技能
         * @param {number} skill
         */
        function canUpgrade(skill) {
            const consume = core.getSkillConsume(skill);
            if (consume > core.status.hero.mdef) return false;
            const level = core.getSkillLevel(skill);
            const s = core.getSkillFromIndex(skill);
            if (level === s.max) return false;
            const front = s.front;
            for (const [skill, level] of front) {
                if (core.getSkillLevel(skill) < level) return false;
            }
            return true;
        }

        /**
         * 实际升级效果
         * @param {number} skill
         */
        this.upgradeSkill = function (skill) {
            if (!canUpgrade(skill)) return false;
            switch (skill) {
                case 0: // 力量 +2攻击
                    core.status.hero.atk += 2;
                    break;
                case 1: // 致命一击 +5额外攻击
                    core.status.hero.mana += 5;
                    break;
                case 2: // 断灭之刃
                    core.setFlag('bladeOn', true);
                    break;
                case 3: // 坚韧 +2防御
                    core.status.hero.def += 2;
                    break;
                case 4: // 回春 +1回复
                    core.status.hero.hpmax += 1;
                    break;
                case 5: // 治愈之泉
                    core.setFlag('spring', true);
                    break;
                case 6: // 坚固之盾 +10防御
                    core.status.hero.def += 10;
                    break;
                case 7: // 无上之盾
                    core.setFlag('superSheild', true);
                    break;
                case 8: // 锋利 +1%攻击
                    core.addBuff('atk', 0.01);
                    break;
                case 9: // 锋利 +1%防御
                    core.addBuff('def', 0.01);
                    break;
                case 10: // 铸剑为盾
                    core.setFlag('shieldOn', true);
                    break;
                case 11: // 学习
                    core.setItem('I565', 1);
                    break;
            }
            const consume = core.getSkillConsume(skill);
            core.status.hero.mdef -= consume;
            levels[skill]++;
            core.updateStatusBar();
            return true;
        };

        this.saveSkillTree = function () {
            return levels.slice();
        };

        this.loadSkillTree = function (data) {
            levels = data ?? [];
        };
    },
    loopMap: function () {
        const list = (this.loopMapList = ['tower6']);

        /**
         * 设置循环地图的偏移量
         * @param {number} offset 横向偏移量
         * @param {FloorIds} floorId
         */
        this.setLoopMap = function (offset, floorId) {
            const floor = core.status.maps[floorId];
            if (offset < 9) {
                moveMap(floor.width - 17, floorId);
            }
            if (offset > floor.width - 9) {
                moveMap(17 - floor.width, floorId);
            }
        };

        /**
         * 当勇士移动时自动设置循环地图
         * @param {FloorIds} floorId
         */
        this.autoSetLoopMap = function (floorId) {
            this.setLoopMap(core.status.hero.loc.x, floorId);
        };

        this.checkLoopMap = function () {
            if (isLoopMap(core.status.floorId)) {
                this.autoSetLoopMap(core.status.floorId);
            }
        };

        /**
         * 滑动数组
         * @param {any[]} arr
         * @param {number} delta
         */
        this.slide = function (arr, delta) {
            if (delta === 0) return arr;
            if (delta > 0) {
                arr.unshift(...arr.splice(arr.length - delta, delta));
                return arr;
            }
            if (delta < 0) {
                arr.push(...arr.splice(0, -delta));
                return arr;
            }
        };

        /**
         * 移动地图
         * @param {number} delta
         * @param {FloorIds} floorId
         */
        function moveMap(delta, floorId) {
            core.extractBlocks(floorId);
            const floor = core.status.maps[floorId];
            core.setHeroLoc('x', core.status.hero.loc.x + delta);
            flags[`loop_${floorId}`] += delta;
            flags[`loop_${floorId}`] %= floor.width;
            const origin = floor.blocks.slice();
            for (let i = 0; i < origin.length; i++) {
                core.removeBlockByIndex(0, floorId);
                core.removeGlobalAnimate(origin[i].x, origin[i].y);
            }
            origin.forEach(v => {
                let to = v.x + delta;
                if (to >= floor.width) to -= floor.width;
                if (to < 0) to += floor.width;
                core.setBlock(v.id, to, v.y, floorId, true);
                core.setMapBlockDisabled(floorId, to, v.y, false);
            });
            core.drawMap();
            core.drawHero();
        }

        function isLoopMap(floorId) {
            return list.includes(floorId);
        }

        events.prototype._sys_changeFloor = function (data, callback) {
            data = data.event.data;
            let heroLoc = {};
            if (isLoopMap(data.floorId)) {
                const floor = core.status.maps[data.floorId];
                flags[`loop_${data.floorId}`] ??= 0;
                let tx = data.loc[0] + flags[`loop_${data.floorId}`];
                tx %= floor.width;
                if (tx < 0) tx += floor.width;
                heroLoc = {
                    x: tx,
                    y: data.loc[1]
                };
            } else if (data.loc) heroLoc = { x: data.loc[0], y: data.loc[1] };
            if (data.direction) heroLoc.direction = data.direction;
            if (core.status.event.id != 'action') core.status.event.id = null;
            core.changeFloor(
                data.floorId,
                data.stair,
                heroLoc,
                data.time,
                function () {
                    core.replay();
                    if (callback) callback();
                }
            );
        };

        events.prototype.trigger = function (x, y, callback) {
            var _executeCallback = function () {
                // 因为trigger之后还有可能触发其他同步脚本（比如阻激夹域检测）
                // 所以这里强制callback被异步触发
                if (callback) {
                    setTimeout(callback, 1); // +1是为了录像检测系统
                }
                return;
            };
            if (core.status.gameOver) return _executeCallback();
            if (core.status.event.id == 'action') {
                core.insertAction(
                    {
                        type: 'function',
                        function:
                            'function () { core.events._trigger_inAction(' +
                            x +
                            ',' +
                            y +
                            '); }',
                        async: true
                    },
                    null,
                    null,
                    null,
                    true
                );
                return _executeCallback();
            }
            if (core.status.event.id) return _executeCallback();

            let block = core.getBlock(x, y);
            const id = core.status.floorId;
            const loop = isLoopMap(id);
            if (loop && flags[`loop_${id}`] !== 0) {
                if (block && block.event.trigger === 'changeFloor') {
                    delete block.event.trigger;
                    core.maps._addInfo(block);
                } else {
                    const floor = core.status.maps[id];
                    let tx = x - flags[`loop_${id}`];
                    tx %= floor.width;
                    if (tx < 0) tx += floor.width;
                    const c = core.floors[id].changeFloor[`${tx},${y}`];
                    if (c) {
                        const b = { event: {}, x: tx, y };
                        b.event.data = c;
                        b.event.trigger = 'changeFloor';
                        block = b;
                    }
                }
            }

            if (block == null) return _executeCallback();

            // 执行该点的脚本
            if (block.event.script) {
                core.clearRouteFolding();
                try {
                    eval(block.event.script);
                } catch (ee) {
                    console.error(ee);
                }
            }

            // 碰触事件
            if (block.event.event) {
                core.clearRouteFolding();
                core.insertAction(block.event.event, block.x, block.y);
                // 不再执行该点的系统事件
                return _executeCallback();
            }

            if (block.event.trigger && block.event.trigger != 'null') {
                var noPass = block.event.noPass,
                    trigger = block.event.trigger;
                if (noPass) core.clearAutomaticRouteNode(x, y);

                // 转换楼层能否穿透
                if (
                    trigger == 'changeFloor' &&
                    !noPass &&
                    this._trigger_ignoreChangeFloor(block) &&
                    !loop
                )
                    return _executeCallback();
                core.status.automaticRoute.moveDirectly = false;
                this.doSystemEvent(trigger, block);
            }
            return _executeCallback();
        };

        maps.prototype._getBgFgMapArray = function (name, floorId, noCache) {
            floorId = floorId || core.status.floorId;
            if (!floorId) return [];
            var width = core.floors[floorId].width;
            var height = core.floors[floorId].height;

            if (!noCache && core.status[name + 'maps'][floorId])
                return core.status[name + 'maps'][floorId];

            var arr =
                main.mode == 'editor' &&
                !(window.editor && editor.uievent && editor.uievent.isOpen)
                    ? core.cloneArray(editor[name + 'map'])
                    : null;
            if (arr == null)
                arr = core.cloneArray(core.floors[floorId][name + 'map'] || []);

            if (isLoopMap(floorId) && window.flags) {
                flags[`loop_${floorId}`] ??= 0;
                arr.forEach(v => {
                    core.slide(v, flags[`loop_${floorId}`] % width);
                });
            }

            for (var y = 0; y < height; ++y) {
                if (arr[y] == null) arr[y] = Array(width).fill(0);
            }
            (core.getFlag('__' + name + 'v__', {})[floorId] || []).forEach(
                function (one) {
                    arr[one[1]][one[0]] = one[2] || 0;
                }
            );
            (core.getFlag('__' + name + 'd__', {})[floorId] || []).forEach(
                function (one) {
                    arr[one[1]][one[0]] = 0;
                }
            );
            if (main.mode == 'editor') {
                for (var x = 0; x < width; x++) {
                    for (var y = 0; y < height; y++) {
                        arr[y][x] = arr[y][x].idnum || arr[y][x] || 0;
                    }
                }
            }
            if (core.status[name + 'maps'])
                core.status[name + 'maps'][floorId] = arr;
            return arr;
        };
    },
    study: function () {
        // 负责勇士技能：学习
        const values = {
            1: ['crit'],
            6: ['n'],
            7: ['hungry'],
            8: ['together'],
            10: ['courage'],
            11: ['charge']
        };

        const cannotStudy = [9, 12, 14, 15, 24];

        this.canStudySkill = function (number) {
            const s = (core.status.hero.special ??= { num: [], last: [] });
            if (core.getSkillLevel(11) === 0) return false;
            if (s.num.length >= 1) return false;
            if (s.num.includes(number)) return false;
            if (cannotStudy.includes(number)) return false;
            return true;
        };

        this.studySkill = function (enemy, number) {
            core.status.hero.special ??= { num: [], last: [] };
            const s = core.status.hero.special;
            const specials = core.getSpecials();
            let special = specials[number - 1][1];
            if (special instanceof Function) special = special(enemy);
            if (!this.canStudySkill(number)) {
                if (!main.replayChecking) {
                    core.tip('error', `无法学习${special}`);
                }
                return;
            }
            s.num.push(number);
            s.last.push(core.getSkillLevel(11) * 3 + 2);
            const value = values[number] ?? [];
            for (const key of value) {
                s[key] = enemy[key];
            }
        };

        this.forgetStudiedSkill = function (num, i) {
            const s = core.status.hero.special;
            const index = i !== void 0 && i !== null ? i : s.num.indexOf(num);
            if (index === -1) return;
            s.num.splice(index, 1);
            s.last.splice(index, 1);
            const value = values[number] ?? [];
            for (const key of value) {
                delete s[key];
            }
        };

        this.declineStudiedSkill = function () {
            const s = (core.status.hero.special ??= { num: [], last: [] });
            s.last = s.last.map(v => v - 1);
        };

        this.checkStudiedSkill = function () {
            const s = core.status.hero.special;
            for (let i = 0; i < s.last.length; i++) {
                if (s.last[i] <= 0) {
                    this.forgetStudiedSkill(void 0, i);
                    i--;
                }
            }
        };
    },
    haloRange: function () {
        /**
         * 绘制光环范围
         * @param {CanvasRenderingContext2D} ctx
         * @param {boolean} onMap
         */
        this.drawHalo = function (ctx, onMap) {
            if (main.replayChecking) return;
            if (!core.getLocalStorage('showHalo', true)) return;
            const halo = core.status.checkBlock.halo;
            ctx.save();
            ctx.globalAlpha = 0.1;
            for (const [loc, range] of Object.entries(halo)) {
                const [x, y] = loc.split(',').map(v => parseInt(v));
                for (const r of range) {
                    const [type, value, color, border] = r.split(':');
                    if (type === 'square') {
                        // 正方形光环
                        const n = parseInt(value);
                        const r = Math.floor(n / 2);
                        let left = x - r,
                            right = x + r,
                            top = y - r,
                            bottom = y + r;
                        if (onMap && core.bigmap.v2) {
                            left -= core.bigmap.posX;
                            top -= core.bigmap.posY;
                            right -= core.bigmap.posX;
                            bottom -= core.bigmap.posY;
                            if (
                                right < -1 ||
                                left > core._PX_ / 32 + 1 ||
                                top < -1 ||
                                bottom > core._PY_ / 32 + 1
                            ) {
                                continue;
                            }
                        }
                        ctx.fillStyle = color;
                        ctx.strokeStyle = border ?? color;
                        ctx.lineWidth = 1;
                        ctx.fillRect(left * 32, top * 32, n * 32, n * 32);
                        ctx.globalAlpha = 0.6;
                        ctx.strokeRect(left * 32, top * 32, n * 32, n * 32);
                        ctx.globalAlpha = 0.1;
                    }
                }
            }
            ctx.restore();
        };
    }
};
