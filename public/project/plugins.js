///<reference path="../../src/types/core.d.ts" />

var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    init: function () {
        this._afterLoadResources = function () {
            if (!main.replayChecking) {
                core.resetSettings();
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
        this.canUseQuickShop = function (id) {
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
            (x, y, px, py) => {
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
        this.removeMaps = function (fromId, toId) {
            toId = toId || fromId;
            var fromIndex = core.floorIds.indexOf(fromId),
                toIndex = core.floorIds.indexOf(toId);
            if (toIndex < 0) toIndex = core.floorIds.length - 1;
            flags.__visited__ = flags.__visited__ || {};
            flags.__removed__ = flags.__removed__ || [];
            flags.__disabled__ = flags.__disabled__ || {};
            flags.__leaveLoc__ = flags.__leaveLoc__ || {};
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
            if (core.domStyle.hdCanvas.indexOf('name') >= 0)
                core.maps._setHDCanvasSize(
                    ctx,
                    core.__PIXELS__,
                    core.__PIXELS__
                );
            else {
                canvas.width = core.__PIXELS__;
                canvas.height = core.__PIXELS__;
            }
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
        /* 宝石血瓶左下角显示数值
         * 需要将 变量：itemDetail改为true才可正常运行
         * 请尽量减少勇士的属性数量，否则可能会出现严重卡顿
         * 注意：这里的属性必须是core.status.hero里面的，flag无法显示
         * 如果不想显示，可以core.setFlag("itemDetail", false);
         * 然后再core.getItemDetail();
         * 如有bug在大群或造塔群@古祠
         */

        core.bigmap.threshold = 256;

        core.control.updateDamage = function (floorId, ctx) {
            floorId = floorId || core.status.floorId;
            if (!floorId || core.status.gameOver || main.mode != 'play') return;
            var onMap = ctx == null;

            // 没有怪物手册
            if (!core.hasItem('book')) return;
            core.status.damage.posX = core.bigmap.posX;
            core.status.damage.posY = core.bigmap.posY;
            if (!onMap) {
                var width = core.floors[floorId].width,
                    height = core.floors[floorId].height;
                // 地图过大的缩略图不绘制显伤
                if (width * height > core.bigmap.threshold) return;
            }
            this._updateDamage_damage(floorId, onMap);
            this._updateDamage_extraDamage(floorId, onMap);
            core.getItemDetail(floorId); // 宝石血瓶详细信息
            this.drawDamage(ctx);
        };
        // 绘制地图显示
        control.prototype._drawDamage_draw = function (ctx, onMap) {
            if (!core.hasItem('book')) return;
            // *** 下一句话可以更改你想要的显示字体
            core.setFont(ctx, '14px normal');
            // ***
            core.setTextAlign(ctx, 'left');
            core.status.damage.data.forEach(function (one) {
                var px = one.px,
                    py = one.py;
                if (onMap && core.bigmap.v2) {
                    px -= core.bigmap.posX * 32;
                    py -= core.bigmap.posY * 32;
                    if (
                        px < -32 * 2 ||
                        px > core.__PX__ + 32 ||
                        py < -32 ||
                        py > core.__PY__ + 32
                    )
                        return;
                }
                core.fillBoldText(ctx, one.text, px, py, one.color);
            });
            core.setTextAlign(ctx, 'center');
            core.status.damage.extraData.forEach(function (one) {
                var px = one.px,
                    py = one.py;
                if (onMap && core.bigmap.v2) {
                    px -= core.bigmap.posX * 32;
                    py -= core.bigmap.posY * 32;
                    if (
                        px < -32 ||
                        px > core.__PX__ + 32 ||
                        py < -32 ||
                        py > core.__PY__ + 32
                    )
                        return;
                }
                core.fillBoldText(ctx, one.text, px, py, one.color);
            });
        };
        // 获取宝石信息 并绘制
        this.getItemDetail = function (floorId) {
            if (!core.getFlag('itemDetail')) return;
            floorId = floorId || core.status.thisMap.floorId;
            core.status.maps[floorId].blocks.forEach(function (block) {
                if (
                    block.event.cls !== 'items' ||
                    block.event.id === 'superPotion' ||
                    block.disable
                )
                    return;
                var x = block.x,
                    y = block.y;
                // v2优化，只绘制范围内的部分
                if (core.bigmap.v2) {
                    if (
                        x < core.bigmap.posX - core.bigmap.extend ||
                        x >
                            core.bigmap.posX +
                                core.__SIZE__ +
                                core.bigmap.extend ||
                        y < core.bigmap.posY - core.bigmap.extend ||
                        y >
                            core.bigmap.posY +
                                core.__SIZE__ +
                                core.bigmap.extend
                    ) {
                        return;
                    }
                }
                var id = block.event.id;
                var item = core.material.items[id];
                if (item.cls === 'equips') {
                    // 装备也显示
                    var diff = core.clone(item.equip.value || {});
                    var per = item.equip.percentage;
                    for (var name in per) {
                        diff[name + 'per'] = per[name].toString() + '%';
                    }
                    drawItemDetail(diff, x, y);
                    return;
                }
                var before = core.clone(core.status.hero);
                // 跟数据统计原理一样 执行效果 前后比较
                core.setFlag('__statistics__', true);
                try {
                    eval(item.itemEffect);
                } catch (error) {}
                var diff = compareObject(before, core.status.hero);
                core.status.hero = hero = before;
                flags = core.status.hero.flags;
                drawItemDetail(diff, x, y);
            });
        };
        // 比较两个对象之间每一项的数值差异（弱等于） 返回数值差异
        function compareObject(a, b) {
            a = a || {};
            b = b || {};
            var diff = {}; // 差异
            for (var name in a) {
                diff[name] = b[name] - (a[name] || 0);
                if (!diff[name]) diff[name] = void 0;
            }
            return diff;
        }
        // 绘制
        function drawItemDetail(diff, x, y) {
            var px = 32 * x + 2,
                py = 32 * y + 30;
            var content = '';
            // 获得数据和颜色
            var i = 0;
            for (var name in diff) {
                if (!diff[name]) continue;
                var color = '#ffffff';
                if (typeof diff[name] === 'number')
                    diff[name] = core.formatBigNumber(diff[name], true);
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
                        color = '#cc6666';
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
    intelligenceTree: function () {
        // 智慧加点
        var list;
        var levels;
        var currPage = 1,
            selector = [1, 1];
        // 获取技能等级
        this.getSkillLevel = function () {
            if (!flags.levels) flags.levels = [];
            for (var i = 0; i < 10; i++) {
                if (flags.levels[i] == null) flags.levels[i] = 0;
            }
            return flags.levels;
        };
        // 初始化
        this.initializeList = function (changePage) {
            // 初始化等级
            levels = core.clone(core.getSkillLevel());
            // 技能定义 0索引 1名称 2描述 3等级 4消耗 5前置技能[索引,等级,索引,等级] 6位置(5×5) 7最大等级 8页码数 9效果
            list = [
                [
                    0,
                    '力量',
                    '力量就是根本！可以通过智慧增加力量',
                    0,
                    10 * levels[0] + 10,
                    null,
                    [1, 2],
                    10,
                    1,
                    '攻击＋' + levels[0] * 2
                ],
                [
                    1,
                    '致命一击',
                    '爆发出全部力量攻击敌人',
                    0,
                    30 * levels[1] + 30,
                    [0, 5],
                    [2, 1],
                    10,
                    1,
                    '每回合额外伤害＋' + levels[1] * 5
                ],
                [
                    2,
                    '断灭之刃',
                    '\\r[#dddd44]主动技能\\r[]，开启后会在战斗时会额外增加一定量的攻击， 但同时减少一定量的防御，快捷键1',
                    0,
                    200 * levels[2] + 400,
                    [1, 5],
                    [4, 1],
                    5,
                    1,
                    levels[2] * 10 +
                        '%攻击加成，减少' +
                        levels[2] * 10 +
                        '%的防御'
                ],
                [
                    3,
                    '坚韧',
                    '由智慧转化出坚韧！',
                    0,
                    10 * levels[3] + 10,
                    null,
                    [1, 4],
                    10,
                    1,
                    '防御+' + levels[3] * 2
                ],
                [
                    4,
                    '回春',
                    '让智慧化为治愈之泉水！',
                    0,
                    20 + levels[4] * 20,
                    [3, 5],
                    [2, 5],
                    25,
                    1,
                    '每回合回复' + 1 * levels[4] + '生命'
                ],
                [
                    5,
                    '治愈之泉',
                    '让生命变得更多一些吧！每吃50瓶血瓶就增加当前生命回复10%的生命回复',
                    0,
                    1500,
                    [4, 25],
                    [4, 5],
                    1,
                    1,
                    '50瓶血10%生命回复'
                ],
                [
                    6,
                    '坚固之盾',
                    '让护甲更加坚硬一些吧！',
                    0,
                    50 + levels[6] * 50,
                    [3, 5],
                    [2, 3],
                    10,
                    1,
                    '防御+' + 10 * levels[6]
                ],
                [
                    7,
                    '无上之盾',
                    '\\r[#dddd44]第一章终极技能\\r[]，战斗时智慧会充当等量护盾',
                    0,
                    2500,
                    [6, 10, 5, 1, 2, 2],
                    [5, 3],
                    1,
                    1,
                    '战斗时智慧会充当护盾'
                ]
            ];
            // 深拷贝list
            list = core.clone(list);
            var acted = false;
            for (var i in list) {
                list[i][3] = levels[i];
                if (!list[i][5]) list[i][5] = [];
                // 根据页码获取光标应该在的位置
                if (changePage && !acted) {
                    if (list[i][8] == currPage) {
                        selector = list[i][6];
                        acted = true;
                    }
                }
            }
        };
        // 升级效果
        this.treeEffect = function (index) {
            index = parseInt(index);
            switch (index) {
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
            }
            core.status.hero.mdef -= list[index][4];
        };
        // 由光标位置获得索引
        this.getIdBySelector = function (x, y, page) {
            for (var i in list) {
                if (
                    list[i][8] == page &&
                    x == list[i][6][0] &&
                    y == list[i][6][1]
                ) {
                    return i;
                }
            }
        };
        // 绘制技能树界面
        this.drawTree = function (changePage) {
            // 初始化
            if (!changePage) changePage = false;
            core.initializeList(changePage);
            var id = core.getIdBySelector(selector[0], selector[1], currPage);
            var name = list[id][1],
                description = list[id][2],
                level = levels[id],
                cost = list[id][4],
                foreSkill = list[id][5],
                max = list[id][7],
                effect = list[id][9];
            // 先建画布
            core.createCanvas('tree', 0, 0, 480, 480, 130);
            // 背景
            core.fillRect('tree', 0, 0, 480, 480, [0, 0, 0, 0.95]);
            core.drawLine('tree', 0, 172, 480, 172, [200, 200, 200, 0.95], 1);
            core.drawLine('tree', 308, 172, 308, 480, [200, 200, 200, 0.95], 1);
            core.drawLine('tree', 308, 450, 480, 450, [200, 200, 200, 0.95], 1);
            core.drawLine('tree', 308, 220, 480, 220, [200, 200, 200, 0.95], 1);
            core.drawLine('tree', 308, 413, 480, 413, [200, 200, 200, 0.95], 1);
            for (var i = 0; i <= 239; i++) {
                core.drawLine(
                    'tree',
                    i,
                    40,
                    480 - i,
                    40,
                    [0, 255, 107, 0.002],
                    2
                );
            }
            // 每一项技能图标
            for (var i in list) {
                if (list[i][8] != currPage) continue;
                // 技能间的线
                for (var j = 0; j < list[i][5].length; j += 2) {
                    if (!list[i][5]) break;
                    if (levels[list[i][5][j]] < list[i][5][j + 1])
                        core.drawLine(
                            'tree',
                            list[list[i][5][j]][6][0] * 56 - 14,
                            list[list[i][5][j]][6][1] * 56 + 158,
                            list[i][6][0] * 56 - 14,
                            list[i][6][1] * 56 + 158,
                            '#aaaaaa',
                            1
                        );
                    else
                        core.drawLine(
                            'tree',
                            list[list[i][5][j]][6][0] * 56 - 14,
                            list[list[i][5][j]][6][1] * 56 + 158,
                            list[i][6][0] * 56 - 14,
                            list[i][6][1] * 56 + 158,
                            '#00FF88',
                            1
                        );
                }
            }
            // 图标
            for (var i in list) {
                // 图标
                core.drawImage(
                    'tree',
                    'skill' + i + '.png',
                    0,
                    0,
                    114,
                    114,
                    list[i][6][0] * 56 - 28,
                    list[i][6][1] * 56 + 144,
                    28,
                    28
                );
                // 方框
                if (levels[i] == 0)
                    core.strokeRect(
                        'tree',
                        list[i][6][0] * 56 - 28,
                        list[i][6][1] * 56 + 144,
                        28,
                        28,
                        '#888888',
                        1
                    );
                else if (levels[i] == list[i][7])
                    core.strokeRect(
                        'tree',
                        list[i][6][0] * 56 - 28,
                        list[i][6][1] * 56 + 144,
                        28,
                        28,
                        '#F7FF68',
                        1
                    );
                else
                    core.strokeRect(
                        'tree',
                        list[i][6][0] * 56 - 28,
                        list[i][6][1] * 56 + 144,
                        28,
                        28,
                        '#00FF69',
                        1
                    );
                // 光标
                core.strokeRect(
                    'tree',
                    selector[0] * 56 - 28,
                    selector[1] * 56 + 144,
                    28,
                    28,
                    '#ffff00',
                    1
                );
            }
            // 说明
            core.setTextAlign('tree', 'center');
            core.fillText('tree', name, 240, 30, '#00FFD5', '28px normal');
            core.setTextAlign('tree', 'left');
            core.drawTextContent('tree', '     ' + description, {
                left: 10,
                top: 42,
                maxWidth: 460,
                font: 'normal',
                fontSize: 18
            });
            // 效果
            if (level != 0)
                core.drawTextContent('tree', '当前效果：' + effect, {
                    left: 10,
                    top: 122,
                    maxWidth: 460,
                    font: 'normal',
                    fontSize: 18
                });
            if (level != max) {
                flags.levels[id] += 1;
                core.initializeList(false);
                effect = list[id][9];
                core.drawTextContent('tree', '下一级效果：' + effect, {
                    left: 10,
                    top: 147,
                    maxWidth: 460,
                    font: 'normal',
                    fontSize: 18
                });
                flags.levels[id]--;
                core.initializeList(false);
                effect = list[id][9];
            }
            core.setTextAlign('tree', 'center');
            // 等级
            core.fillText(
                'tree',
                '等级：' + level + '/' + max,
                394,
                190,
                '#ffffff',
                '18px normal'
            );
            // 升级
            if (level != max)
                core.fillText(
                    'tree',
                    '升级花费：' + cost,
                    394,
                    210,
                    '#ffffff',
                    '18px normal'
                );
            // 退出
            core.fillText('tree', '退出', 394, 470, '#ffffff', '18px normal');
            // 页码数
            var text = core.replaceNumberWithChinese(currPage);
            core.fillText(
                'tree',
                '第' + text + '章',
                394,
                440,
                '#ffffff',
                '24px normal'
            );
            if (currPage != 1)
                core.fillText('tree', '<', 334, 440, '#ffffff', '24px normal');
            if (currPage != flags.chapter)
                core.fillText('tree', '>', 454, 440, '#ffffff', '24px normal');
            // 前置技能
            core.fillText(
                'tree',
                '前置技能',
                394,
                245,
                '#ffffff',
                '20px normal'
            );
            if (foreSkill.length > 0) {
                for (var i = 0; i < foreSkill.length; i += 2) {
                    core.fillText(
                        'tree',
                        foreSkill[i + 1] + '级  ' + list[foreSkill[i]][1],
                        394,
                        270 + 10 * i
                    );
                }
            }
        };
        // 升级操作
        this.upgradeTree = function (index) {
            // 执行操作
            if (levels[index] == list[index][7]) {
                core.playSound('操作失败');
                core.insertAction(['该技能已满级！']);
                return;
            }
            // 判断前置技能
            var fore = list[index][5];
            for (var i = 0; i < fore.length; i += 2) {
                if (levels[fore[i]] < fore[i + 1]) {
                    core.playSound('操作失败');
                    core.insertAction(['前置技能未满足！']);
                    return;
                }
            }
            if (core.status.hero.mdef < list[index][4]) {
                core.playSound('操作失败');
                core.insertAction(['智慧点不足！']);
                return;
            }
            flags.levels[index]++;
            core.treeEffect(index);
            // 刷新
            core.drawTree(false);
            core.updateStatusBar();
            core.updateDamage();
            // 音效
            core.playSound('tree.mp3');
            core.insertAction([{ type: 'sleep', time: 100, noSkip: true }]);
        };
        // 上下左右
        this.moveSelector = function (keycode, times) {
            times = times || 0;
            core.playSound('光标移动');
            if (keycode == 37 || keycode == 39) {
                // left right
                if (times > 3) {
                    // 正左右没有东西 移动至下一列
                    selector[0] -= 3 * (keycode - 38);
                    for (var i in list) {
                        if (list[i][8] != currPage) continue;
                        if (list[i][6][0] == selector[0]) {
                            selector = list[i][6];
                            return;
                        }
                    }
                    selector[0] -= keycode - 38;
                    return;
                }
                selector[0] += keycode - 38;
                for (var i in list) {
                    // 正左右有技能 移动至最近的技能
                    if (list[i][8] != currPage) continue;
                    if (
                        list[i][6][0] == selector[0] &&
                        list[i][6][1] == selector[1]
                    ) {
                        selector = list[i][6];
                        return;
                    }
                }
                return core.moveSelector(keycode, times + 1);
            } else {
                // up down
                if (times > 3) {
                    selector[1] -= 3 * (keycode - 39);
                    for (var i in list) {
                        if (list[i][8] != currPage) continue;
                        if (list[i][6][1] == selector[1]) {
                            selector = list[i][6];
                            return;
                        }
                    }
                    selector[1] -= keycode - 39;
                    return;
                }
                selector[1] += keycode - 39;
                for (var i in list) {
                    if (list[i][8] != currPage) continue;
                    if (
                        list[i][6][1] == selector[1] &&
                        list[i][6][0] == selector[0]
                    ) {
                        selector = list[i][6];
                        return;
                    }
                }
                return core.moveSelector(keycode, times + 1);
            }
        };
        // 由点击位置获取光标位置
        this.getSelectorByLoc = function (px, py) {
            if (px % 56 < 28 || (py - 172) % 56 < 28) return;
            var x = Math.ceil(px / 56),
                y = Math.ceil((py - 172) / 56);
            if (selector[0] == x && selector[1] == y) {
                var id = core.getIdBySelector(
                    selector[0],
                    selector[1],
                    currPage
                );
                core.upgradeTree(id);
            } else {
                for (var i in list) {
                    if (list[i][8] != currPage) continue;
                    if (list[i][6][0] == x && list[i][6][1] == y) {
                        selector = [x, y];
                        core.playSound('光标移动');
                        return;
                    }
                }
            }
        };
        // 键盘操作
        this.treeKeyboard = function (keycode) {
            var id = core.getIdBySelector(selector[0], selector[1], currPage);
            switch (keycode) {
                case 13:
                case 32: // 确认升级
                    core.upgradeTree(id);
                    break;
                case 27:
                case 88: // 退出
                    core.playSound('取消');
                    core.insertAction({ type: 'break' });
                    break;
                case 37:
                case 38:
                case 39:
                case 40: // 移动光标
                    core.moveSelector(keycode);
                    break;
            }
        };
        // 点击操作
        this.treeClick = function (px, py) {
            if (px >= 308 && py >= 450) {
                core.playSound('取消');
                core.insertAction({ type: 'break' });
            }
            if (px <= 308 && py >= 172) {
                core.getSelectorByLoc(px, py);
            }
        };
        // 操作
        this.actTree = function () {
            if (flags.type == 0) return this.treeKeyboard(flags.keycode);
            else return this.treeClick(flags.px, flags.py);
        };
        // 开启
        this.openTree = function () {
            // 插入事件
            core.initializeList(true);
            core.playSound('打开界面');
            core.insertAction([
                {
                    type: 'while',
                    condition: 'true',
                    data: [
                        {
                            type: 'function',
                            function: '() => { core.plugin.drawTree(false); }'
                        },
                        { type: 'wait' },
                        {
                            type: 'function',
                            function: '() => { core.plugin.actTree(); }'
                        }
                    ]
                },
                {
                    type: 'function',
                    function: "() => { core.deleteCanvas('tree');}"
                }
            ]);
        };
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
        // 跳跃
        this.jumpSkill = function () {
            if (core.status.floorId.startsWith('tower'))
                return core.drawTip('当无法使用该技能');
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
                core.status.hero.hp -= 200 * flags.hard;
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
                core.status.hero.hp -= 200 * flags.hard;
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
    changeFly: async function () {
        // 该插件可自定义空间很大，自定义内容请看注释

        // ------------------------- 安装说明 ------------------------- //
        // 先安装基于canvas的sprite化插件（2.10.0以上自带）
        // 再将以下代码复制进插件中，并将第一行的  function ()  改为  async function ()
        // 提供的api请看以this.xxx = function开头的函数，函数前会有函数说明及参数说明

        // ------------------------- 使用说明 ------------------------- //
        /*
         * 直接复制进插件中，然后添加一个快捷键或道具效果为core.plugin.drawFlyMap()即可使用，不需额外设置
         * 楼层id中不要出现下划线
         * 该插件具体功能有：
         * 1.绘制区域内的地图
         * 2.可以拖动地图
         * 3.点击地图可直接传送至目标地图，同时降低背景的不透明度，方便观察
         * 4.滚轮或双指可以放缩绘制内容
         * 5.放缩较大时，绘制地图的缩略图，可能会比较卡，但移动不会卡
         * 6.整合漏怪检测，如果想忽略怪物，请在下方改动或用脚本修改core.plugin.ignoreEnemies，类型为数组
         * 7.整合区域显示，所有单独或连在一起的地图会被视为一个区域
         * 8.键盘操作，上下左右移动
         */

        // ------------------------- 插件说明 ------------------------- //
        /*
         * 该插件注释极其详细，可以帮助那些想要提升代码力，但实力有不足的作者
         * 注意！！！该插件难度极大，没有代码底力的不建议研究
         * 该插件涉及部分较为高级的算法，如bfs
         */

        // 录像验证直接干掉这个插件
        if (main.replayChecking || main.mode === 'editor') return;

        // 延迟初始化，就不用安装到sprite化插件之后了
        await new Promise(res => setTimeout(res, 500));

        // ----- 不可自定义 杂七杂八的变量
        /** @type {{[x: string]: BFSResult}} */
        let mapCache = {}; // 地图缓存
        let drawCache = {}; // 绘制信息缓存
        let status = 'none'; // 当前的绘制状态
        /** @type {{[x: string]: Sprite}} */
        let sprites = {}; // 当前所有的sprite
        /** @type {{[x: string]: Sprite}} */
        let canDrag = {}; // 可以拖拽的sprite
        /** @type {{[x: string]: Button}} */
        let areaSprite = {}; // 区域列表对应的sprite
        let clicking = false; // 是否正在点击，用于拖拽判定
        let drawingMap = ''; // 正在绘制的中心楼层
        let nowScale = 0; // 当前绘制的放缩比例
        let lastTouch = {}; // 上一次的单点点击信息
        let lastLength = 0; // 手机端缩放时上一次的两指间距离
        let nowDepth = 0; // 当前的遍历深度
        let drawedThumbnail = {}; // 已经绘制过的缩略图
        let moved = false; // 鼠标按下后是否移动了
        let noBorder = false; // 是否是无边框拼接模式
        let lastScale = 0; // 上一次缩放，用于优化缩略图绘制
        let showEnemy = false; // 是否显示漏怪
        let areaPage = 0; // 区域显示的当前页数
        let nowArea = 0; // 当前区域index
        let selecting = ''; // 选择时当前正在选择的地图

        // ---- 不可自定义，常量
        /** @type {Area} */
        let areas = []; // 区域信息
        const perPage = Math.floor((core._PY_ - 60) / 30); // 区域的每页显示数量

        // ---- 可自定义，默认的切换地图的图块id
        const defaultChange = {
            left: 'leftPortal', // 左箭头
            up: 'upPortal', // 上箭头
            right: 'rightPortal', // 右箭头
            down: 'downPortal', // 下箭头
            upFloor: 'upFloor', // 上楼
            downFloor: 'downFloor' // 下楼
        };
        // ---- 可自定义，默认数值
        const defaultValue = {
            font: 'Verdana', // 默认字体
            scale: 3, // 默认地图缩放比例
            depth: Infinity // 默认的遍历深度
        };

        // ---- 不可自定义，计算数据
        const dirData = {
            up: [1, 0],
            down: [-1, 0],
            left: [0, 1],
            right: [0, -1],
            upFloor: [0, 0],
            downFloor: [0, 0]
        };

        let ignoreEnemies = (this.ignoreEnemies = []);

        let allChangeEntries = Object.entries(defaultChange);

        const reset = core.events.resetGame;
        core.events.resetGame = function () {
            reset.apply(core.events, arguments);
            areas = [];
            // 获取所有分区，使用异步函数，保证不会卡顿
            // 原理是用bfs扫，将所有连在一起的地图合并成一个区域
            (async function () {
                let all = core.floorIds.slice();
                const scanned = { [all[0]]: true };
                while (all.length > 0) {
                    let now = all.shift();
                    if (core.status.maps[now].deleted) continue;
                    if (!now) return;
                    await new Promise(res => {
                        const result = bfsSearch(now, Infinity, true);
                        mapCache[`${now}_Infinity_false`] = result;
                        areas.push({
                            name: core.floors[now].title,
                            maps: result.order
                        });
                        for (const map of result.order) {
                            scanned[map] = true;
                            all = all.filter(v => !result.order.includes(v));
                        }
                        res('success');
                    });
                }
            })();
        };

        /** 工具按钮 */
        class Button extends Sprite {
            constructor(
                name,
                x,
                y,
                w,
                h,
                text,
                fontSize = '20px',
                transition = true
            ) {
                const btn = super(x, y, w, h, 1050, 'game', name);
                this.css(transition);
                setTimeout(() => btn.setCss(`opacity: 1;`), 50);
                const ctx = btn.context;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                core.fillText(
                    ctx,
                    text,
                    w / 2,
                    h / 2,
                    '#fff',
                    `${fontSize} normal`,
                    w - 10
                );
                sprites[name] = btn;
            }

            css(transition) {
                this.setCss(
                    'transition: opacity 0.6s linear, transform 0.2s linear;' +
                        'background-color: #aaa;' +
                        'box-shadow: 0px 0px 0px black;' +
                        (transition ? 'opacity: 0;' : '') +
                        'filter: drop-shadow(1px 1px 2px black);' +
                        'box-shadow: 0px 0px 4px black;' +
                        'cursor: pointer;'
                );
            }
        }

        /** 背景 */
        class Back extends Sprite {
            constructor(name, x, y, w, h, z, color) {
                const sprite = super(x, y, w, h, z, 'game', name);
                sprites[name] = sprite;
                this.setCss(`transition: all 0.6s linear;`);
                setTimeout(() => {
                    this.setCss(`background-color: ${color};`);
                }, 50);
            }
        }

        /**
         * 获取绘制信息
         * @param {string?} center 中心地图id
         * @param {number?} depth 搜索深度
         * @param {boolean?} noCache 是否不使用缓存
         * @returns {MapDrawInfo}
         */
        this.getMapDrawInfo = function (
            center = core.status.floorId,
            depth = defaultValue.depth,
            noCache = false
        ) {
            nowDepth = depth;
            drawingMap = center;
            const id = `${center}_${depth}_${noBorder}`;
            // 检查缓存
            if (drawCache[id] && !noCache) return drawCache[id];
            const map = bfsSearch(center, depth, noCache);
            mapCache[id] = map;
            const res = getDrawInfo(map.res, center, map.order);
            res.upOrDown = map.upOrDown;
            drawCache[id] = res;
            return res;
        };

        /**
         * 绘制大地图，可拖动、滚轮缩放、点击对应位置可以楼传等
         * @param {string} floorId 中心地图的id
         * @param {number} depth 遍历深度
         * @param {boolean} noCache 是否不使用缓存
         * @param {number} scale 绘制的缩放比例
         */
        this.drawFlyMap = function (
            floorId = core.status.floorId,
            depth = defaultValue.depth,
            noCache = false,
            scale = defaultValue.scale
        ) {
            if (core.isReplaying()) return;

            // 把区域页码归零
            nowArea = areas.findIndex(v =>
                v.maps.includes(core.status.floorId)
            );
            areaPage = 0;
            nowScale = scale;
            selecting = floorId;
            const info = this.getMapDrawInfo(floorId, depth, noCache);
            if (status !== 'scale' && status !== 'border') {
                drawBack();
                drawTools();
            }
            drawMap(info, scale);
            status = 'flyMap';
            core.lockControl();
            core.canvas.data.canvas.style.zIndex = '990';
        };

        /**
         * 获得某个区域的剩余怪物
         * @param {string} floorId 区域包含的地图或要扫描的地图
         * @param {boolean} area 是否扫描整个区域
         * @returns {RemainEnemy} 怪物总数、所在地图、位置
         * 返回值格式：{
         *  rough: 每种怪物的数量及所有怪物的总数，为字符串，每个怪物独占一行
         *  detail: 每个怪物的所在位置，每个怪物独占一行，以每20个整合成字符串，为字符串数组形式
         *  data: 怪物数量的原始信息，格式为{ 楼层id: { 'x,y': 怪物id } }
         * }
         */
        this.getRemainEnemy = function (
            floorId = core.status.floorId,
            area = false
        ) {
            const res = bfsSearch(floorId, Infinity, false);
            // 整合怪物总数
            /** @type {{[x: string]: number}} */
            const category = {};
            const toShow = area ? res.order : [floorId];
            const strArr = [];
            const add = (...num) => num.reduce((pre, cur) => pre + cur, 0);
            const name = id => core.material.enemys[id].name;
            const title = id => core.status.maps[id].title;
            for (const id of toShow) {
                const enemies = res.enemies[id];
                Object.values(enemies).forEach(v => {
                    // 编辑器不支持 ??=，悲
                    category[v] = category[v] ?? 0;
                    category[v]++;
                });
                // 每个怪物的信息
                strArr.push(
                    ...Object.entries(enemies).map(
                        v =>
                            `${name(v[1])}    楼层:${title(
                                id
                            )},楼层id:${id},坐标:${v[0]}`
                    )
                );
            }
            // 输出字符串
            const all = `当前${area ? '区域' : '地图'}中剩余怪物数量：${add(
                ...Object.values(category)
            )}`;
            const classified = Object.entries(category).map(
                v => `${name(v[0])} × ${v[1]}`
            ).join`\n`;
            const detail = [];
            while (strArr.length > 0) {
                detail.push(strArr.splice(0, 20).join`\n`);
            }
            return {
                rough: `${all}\n${classified}`,
                detail,
                data: res.enemies
            };
        };

        /**
         * 广度优先搜索搜索地图路径
         * @param {string} center 中心地图的id
         * @param {number} depth 搜索深度
         * @param {boolean} noCache 是否不使用缓存
         * @returns {BFSResult} 格式：floorId_x_y_dir: floorId_x_y
         */
        function bfsSearch(center, depth, noCache) {
            // 检查缓存
            const id = `${center}_${depth}_${noBorder}`;
            if (mapCache[id] && !noCache) return mapCache[id];
            const used = { [center]: true }; // 搜索过的楼层
            let queue = [];
            let stack = [center]; // 当前栈
            let nowDepth = -1;
            const mapOrder = [center]; // 遍历顺序，顺便还能记录遍历了哪些楼层

            const res = {}; // 输出结果，格式：floorId_x_y_dir: floorId_x_y
            const enemies = {};
            const upOrDown = {};

            // 开始循环搜索
            while (nowDepth < depth && stack.length > 0) {
                const now = stack.shift(); // 当前id
                if (core.status.maps[now].deleted) continue;
                const blocks = core.getMapBlocksObj(now); // 获取当前地图的每点的事件
                enemies[now] = {};
                // 遍历，获取可以传送的点，只检测绿点事件，因此可用红点事件进行传送来实现分区功能
                for (const i in blocks) {
                    const block = blocks[i];
                    // 整合漏怪检测，所以要检测怪物
                    if (block.event.trigger === 'battle') {
                        const id = block.event.id;
                        if (ignoreEnemies.includes(id)) continue;
                        else enemies[now][i] = block.event.id;
                        continue;
                    }
                    // 检测触发器是否为切换楼层，不是则直接跳过
                    if (block.event.trigger !== 'changeFloor') continue;
                    const dirEntries = allChangeEntries.find(
                        v => v[1] === block.event.id
                    );
                    // 如果不是那六种传送门，直接忽略
                    if (!dirEntries) continue;
                    const data = block.event.data;
                    const dir = dirEntries[0];
                    const route = `${now}_${i.replace(',', '_')}_${dir}`;
                    const target = `${data.floorId}_${data.loc.join('_')}`;
                    if (!used[data.floorId]) {
                        if (dir === 'upFloor' || dir === 'downFloor') {
                            upOrDown[now] = upOrDown[id] ?? [];
                            upOrDown[now].push(dir);
                        }
                        queue.push(data.floorId); // 没有搜索过，则加入栈中
                        mapOrder.push(data.floorId);
                        used[data.floorId] = true;
                    }
                    res[route] = target;
                }
                if (stack.length === 0) {
                    stack = queue;
                    queue = [];
                    nowDepth++;
                }
                if (stack.length === 0 && queue.length === 0) break;
            }
            return { res, order: mapOrder, enemies, upOrDown };
        }

        /**
         * 提供地图的绘制信息
         * @param {{[x: string]: string}} map 要绘制的地图，格式：floorId_x_y_dir: floorId_x_y
         * @param {string} center 中心地图的id
         * @param {string[]} order 遍历顺序
         * @returns {MapDrawInfo} 地图的绘制信息
         */
        function getDrawInfo(map, center, order) {
            // 先根据地图id分类，从而确定每个地图连接哪些地图，同时方便处理
            const links = {};
            for (const i in map) {
                const splitted = i.split('_');
                const id = splitted[0];
                if (!links[id]) links[id] = {};
                links[id][i] = map[i];
            }
            // 分类完毕，然后根据连接点先计算出各个地图的坐标，然后再进行判断
            const centerFloor = core.status.maps[center];
            const visitedCenter = core.hasVisitedFloor(center);
            const locs = {
                // 格式：[中心x, 中心y, 宽, 高, 是否到达过]
                [center]: [
                    0,
                    0,
                    centerFloor.width,
                    centerFloor.height,
                    visitedCenter
                ]
            };
            const lines = {}; // 地图间的连线
            // 可以上楼下楼的地图
            const upOrDown = {};
            for (const id of order) {
                const now = links[id];
                // 遍历每一个地图的连接情况
                for (const from in now) {
                    const to = now[from];
                    // 先根据from to计算物理位置
                    const fromData = from.split('_'),
                        toData = to.split('_');
                    const dir = fromData[3];
                    if (dir === 'upFloor' || dir === 'downFloor') continue;
                    if (!defaultChange[dir]) continue;
                    const v = dirData[dir][1], // 竖直数值
                        h = dirData[dir][0], // 水平数值
                        ha = Math.abs(h),
                        va = Math.abs(v);
                    const fx = parseInt(fromData[1]), // fromX
                        fy = parseInt(fromData[2]), // fromY
                        tx = parseInt(toData[1]), // toX
                        ty = parseInt(toData[2]), // toY
                        ff = id, // fromFloorId
                        tf = toData[0]; // toFloorId
                    const fromFloor = core.status.maps[ff],
                        toFloor = core.status.maps[tf];
                    const fhw = Math.floor(fromFloor.width / 2), // fromFloorHalfWidth
                        fhh = Math.floor(fromFloor.height / 2),
                        thw = Math.floor(toFloor.width / 2),
                        thh = Math.floor(toFloor.height / 2);
                    const fLoc = locs[id] ?? [0, 0];
                    if (!locs[ff]) continue;
                    let x, y;
                    const dis = noBorder ? 1 : 5;
                    if (locs && locs[tf]) {
                        x = locs[tf][0];
                        y = locs[tf][1];
                    } else {
                        // 计算坐标，公式可以通过画图推断出
                        x =
                            fLoc[0] -
                            ha * (fhw - fx + tx - thw) -
                            v * (fhw + thw + dis);
                        y =
                            fLoc[1] -
                            va * (fhh - fy + ty - thh) -
                            h * (fhh + thh + dis);
                    }
                    locs[tf] = locs[tf] ?? [
                        x,
                        y,
                        toFloor.width,
                        toFloor.height,
                        core.hasVisitedFloor(tf)
                    ];
                    // 添加连线
                    lines[`${from}_${to}`] = [
                        [
                            fx - fhw + locs[ff][0],
                            fy - fhh + locs[ff][1],
                            x + tx - thw,
                            y + ty - thh
                        ]
                    ];
                }
            }
            // 获取地图绘制需要的长宽
            let width = 0,
                height = 0;
            let left, right, up, down;
            for (const id in locs) {
                const [x, y, w, h] = locs[id];
                if (left === void 0) {
                    left = right = x;
                    up = down = y;
                }
                left = Math.min(x - w / 2 - 1, left);
                right = Math.max(x + w / 2 + 1, right);
                up = Math.min(y - h / 2 - 1, up);
                down = Math.max(y + h / 2 + 1, down);
            }
            width = right - left;
            height = down - up;
            // 所有地图和连线向右下移动，避免绘制出现问题
            for (const id in locs) {
                const loc = locs[id];
                loc[0] -= left; // 这时候left和up是负值，所以要减
                loc[1] -= up;
            }
            for (const route in lines) {
                const line = lines[route];
                for (const node of line) {
                    node[0] -= left;
                    node[1] -= up;
                    node[2] -= left;
                    node[3] -= up;
                }
            }

            return { locs, lines, width, height, layer: upOrDown };
        }

        /** 绘制背景 */
        function drawBack() {
            if (status !== 'none') return;
            new Back(
                '__map_back__',
                0,
                0,
                core._PX_,
                core._PY_,
                175,
                'rgba(0, 0, 0, 0.9)'
            );
            const listen = new Sprite(
                0,
                0,
                core._PX_,
                core._PY_,
                1000,
                'game',
                '__map_listen__'
            );
            addDrag(listen);
            const exit = new Button(
                '__map_exit__',
                core._PX_ - 64,
                core._PY_ - 26,
                60,
                22,
                '退出'
            );
            exit.addEventListener('click', close);
            sprites.listen = listen;
        }

        /** 绘制工具栏 */
        function drawTools() {
            new Back(
                '__map_toolback__',
                0,
                core._PY_ - 30,
                core._PX_,
                30,
                600,
                'rgba(200, 200, 200, 0.9)'
            );
            // 无边框
            const border = new Button(
                '__map_border__',
                core._PX_ - 150,
                core._PY_ - 26,
                60,
                22,
                '边框'
            );
            border.addEventListener('click', changeBorder);
            // 怪物数量
            const enemy = new Button(
                '__map_enemy__',
                core._PX_ - 240,
                core._PY_ - 26,
                60,
                22,
                '怪物'
            );
            enemy.addEventListener('click', triggerEnemy);
            // 区域显示
            const area = new Back(
                '__map_areasback__',
                core._PX_ - 80,
                0,
                80,
                core._PY_ - 30,
                550,
                'rgba(200, 200, 200, 0.9)'
            );
            drawAreaList();
            core.drawLine(
                area.context,
                0,
                core._PY_ - 30,
                80,
                core._PY_ - 30,
                '#222',
                2
            );
        }

        /** 绘制区域列表 */
        function drawAreaList(transition = true) {
            const start = perPage * areaPage;
            Object.values(areaSprite).forEach(v => v.destroy());
            areaSprite = {};
            for (let i = start; i < start + perPage && areas[i]; i++) {
                const n = i % perPage;
                const { name, maps } = areas[i];
                const btn = new Button(
                    `_area_${maps[0]}`,
                    core._PX_ - 75,
                    4 + 30 * n,
                    70,
                    22,
                    name,
                    '16px',
                    transition
                );
                areaSprite[maps[0]] = btn;
                if (i === nowArea) btn.setCss(`border: 2px solid gold;`);
                btn.addEventListener('click', e => {
                    if (i === nowArea) return;
                    changeArea(i);
                });
            }
            // 上一页下一页
            if (areaPage > 0) {
                const last = new Button(
                    '_area_last_',
                    core._PX_ - 75,
                    core._PY_ - 50,
                    30,
                    16,
                    '上一页',
                    '14px',
                    transition
                );
                areaSprite._area_last_ = last;
                last.addEventListener('click', e => {
                    areaPage--;
                    drawAreaList(false);
                });
            }
            if (areaPage < Math.floor(areas.length / perPage)) {
                const next = new Button(
                    '_area_next_',
                    core._PX_ - 35,
                    core._PY_ - 50,
                    30,
                    16,
                    '下一页',
                    '14px',
                    transition
                );
                areaSprite._area_next_ = next;
                next.addEventListener('click', e => {
                    areaPage++;
                    drawAreaList(false);
                });
            }
        }

        /**
         * 绘制大地图
         * @param {MapDrawInfo} info 地图绘制信息
         * @param {number} scale 地图的绘制比例
         */
        function drawMap(info, scale = defaultValue.scale) {
            if (status === 'flyMap') return;
            const PX = core._PX_,
                PY = core._PY_;
            const w = info.width * scale,
                h = info.height * scale;
            const id = `__flyMap__`;
            const cx = PX / 2 - w / 2,
                cy = PY / 2 - h / 2;
            const map = new Sprite(cx, cy, w, h, 500, 'game', id);
            sprites[id] = map;
            canDrag[id] = map;
            map.canvas.className = 'fly-map';
            const ctx = map.context;
            core.clearMap(ctx);
            if (!noBorder) {
                const drawed = {}; // 绘制过的线
                // 先绘制连线
                const lines = info.lines;
                for (const route in lines) {
                    const line = lines[route];
                    for (const node of line) {
                        const from = `${node[0]},${node[1]}`,
                            to = `${node[2]},${node[3]}`;
                        if (drawed[`${from}-${to}`] || drawed[`${to}-${from}`])
                            continue;
                        drawed[`${from}-${to}`] = true;
                        let lineWidth = scale / 2;
                        core.drawLine(
                            ctx,
                            node[0] * scale,
                            node[1] * scale,
                            node[2] * scale,
                            node[3] * scale,
                            '#fff',
                            lineWidth
                        );
                    }
                }
                // 再绘制楼层
                const locs = info.locs;
                for (const id in locs) {
                    const loc = locs[id];
                    let color = '#000';
                    if (!loc[4]) color = '#f0f';
                    const [x, y, w, h] = loc.map(
                        v => typeof v === 'number' && v * scale
                    );
                    let dx = 0,
                        dy = 0; // 避免绘图误差
                    if (loc[2] % 2 === 0) dx = 0.5 * scale;
                    if (loc[3] % 2 === 0) dy = 0.5 * scale;
                    const fx = x - w / 2 - dx,
                        fy = y - h / 2 - dy;
                    core.fillRect(ctx, fx, fy, w, h, color);
                    if (id === selecting)
                        core.strokeRect(ctx, fx, fy, w, h, 'gold', scale / 2);
                    else core.strokeRect(ctx, fx, fy, w, h, '#fff', scale / 2);
                    const layer = info.upOrDown[id];
                    const min = Math.min(w, h);
                    if (layer?.includes('upFloor'))
                        core.drawIcon(
                            ctx,
                            defaultChange.upFloor,
                            fx,
                            fy,
                            min / 3,
                            min / 3
                        );
                    if (layer?.includes('downFloor'))
                        core.drawIcon(
                            ctx,
                            defaultChange.downFloor,
                            fx + w - min / 3,
                            fy + h - min / 3,
                            min / 3,
                            min / 3
                        );
                    // 显示漏怪数量
                    if (showEnemy) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const c = `${drawingMap}_${nowDepth}_${noBorder}`;
                        const n = Object.keys(mapCache[c].enemies[id]).length;
                        color = '#3f3';
                        if (n > 0) color = '#fff';
                        if (n > 10) color = '#fc3';
                        if (n > 20) color = '#f22';
                        ctx.shadowBlur = 0.6 * nowScale;
                        ctx.shadowColor = '#000';
                        core.fillText(
                            ctx,
                            `怪物数量：${n}`,
                            x,
                            y,
                            color,
                            `${2 * nowScale}px normal`
                        );
                        ctx.shadowBlur = 0;
                    }
                }
            }
            checkThumbnail();
        }

        /**
         * 重新绘制缩略图
         * @param {Sprite} sprite
         * @param {string} floor
         */
        function drawThumbnail(sprite, floor, x, y, w, h) {
            const ctx = sprite.context;
            const scale = nowScale;
            core.drawThumbnail(floor, void 0, {
                ctx: ctx,
                x: x - w / 2,
                y: y - h / 2,
                damage: true,
                all: true,
                size: Math.max(w, h) / Math.max(core._PX_, core._PY_),
                fromMap: true
            });
            const color = floor === core.status.floorId ? 'gold' : '#fff';
            if (!noBorder)
                core.strokeRect(
                    ctx,
                    x - w / 2,
                    y - h / 2,
                    w,
                    h,
                    color,
                    scale / 2
                );
        }

        /** 检查是否需要绘制缩略图 */
        function checkThumbnail() {
            const id = `${drawingMap}_${nowDepth}_${noBorder}`;
            const locs = drawCache[id].locs;
            const map = canDrag[`__flyMap__`];
            for (const id in locs) {
                const loc = locs[id];
                const scale = nowScale;
                const [x, y, w, h] = loc.map(
                    v => typeof v === 'number' && v * scale
                );
                let dx = 0,
                    dy = 0; // 避免绘图误差
                if (loc[2] % 2 === 0) dx = 0.5 * scale;
                if (loc[3] % 2 === 0) dy = 0.5 * scale;
                if (
                    !drawedThumbnail[id] &&
                    x + map.x > 0 &&
                    x + map.x < core._PX_ &&
                    y + map.y > 0 &&
                    y + map.y < core._PY_
                ) {
                    if (!noBorder && core.hasVisitedFloor(id) && scale > 5) {
                        drawThumbnail(map, id, x - dx, y - dy, w, h);
                        drawedThumbnail[id] = true;
                    }
                    if (noBorder) {
                        drawThumbnail(map, id, x - dx, y - dy, w, h);
                        drawedThumbnail[id] = true;
                        if (!core.hasVisitedFloor(id))
                            core.fillRect(
                                map.context,
                                x - dx - w / 2,
                                y - dy - h / 2,
                                w,
                                h,
                                'rgba(255,0,255,0.2)'
                            );
                    }
                }
            }
            // 如果是无边框模式，那就只绘制当前地图的边框
            if (noBorder) {
                const loc = locs[selecting];
                const scale = nowScale;
                if (loc) {
                    const [x, y, w, h] = loc.map(
                        v => typeof v === 'number' && v * scale
                    );
                    core.strokeRect(
                        map.context,
                        x - w / 2,
                        y - h / 2,
                        w,
                        h,
                        'gold',
                        scale / 2
                    );
                }
            }
        }

        /** 检查点击点是否在以x,y为中心的某一矩形中 */
        function inRect(x, y, w, h, px, py) {
            x -= w / 2;
            y -= h / 2;
            return px > x && px < x + w && py > y && py < y + h;
        }

        /** 测试画布是否超过上限，摘自https://github.com/jhildenbiddle/canvas-size */
        function canvasTest(size) {
            const width = Math.max(Math.ceil(size[0]), 1);
            const height = Math.max(Math.ceil(size[1]), 1);
            if (width === 0 || height === 0) return true;
            const fill = [width - 1, height - 1, 1, 1];
            let cropCvs, testCvs;
            cropCvs = document.createElement('canvas');
            cropCvs.width = 1;
            cropCvs.height = 1;
            testCvs = document.createElement('canvas');
            testCvs.width = width;
            testCvs.height = height;
            const cropCtx = cropCvs.getContext('2d');
            const testCtx = testCvs.getContext('2d');
            if (testCtx) {
                testCtx.fillRect.apply(testCtx, fill);
                cropCtx.drawImage(
                    testCvs,
                    width - 1,
                    height - 1,
                    1,
                    1,
                    0,
                    0,
                    1,
                    1
                );
            }
            const isTestPass =
                cropCtx && cropCtx.getImageData(0, 0, 1, 1).data[3] !== 0;
            return isTestPass;
        }

        /** 检查浏览器限制 */
        function checkMaximum(before, scale) {
            for (const id in canDrag) {
                const sprite = canDrag[id];
                const rate = scale / before;
                const w = sprite.width * rate * core.domStyle.scale,
                    h = sprite.height * rate * core.domStyle.scale;
                const valid = canvasTest([w, h]);
                if (!valid) {
                    core.drawTip('画布大小将超过浏览器限制！请勿继续放大！');
                    return true;
                }
            }
            return false;
        }

        /** 关闭事件 */
        function close() {
            document.body.removeEventListener('keyup', keyboard);
            Object.values(sprites).forEach(v => {
                v.setCss('transition: opacity 0.6s linear;');
            });
            setTimeout(() => {
                Object.values(sprites).forEach(v => {
                    v.setCss('opacity: 0;');
                });
            }, 50);
            setTimeout(() => {
                core.unlockControl();
                Object.values(sprites).forEach(v => {
                    v.destroy();
                });
                drawedThumbnail = {};
                sprites = {};
                canDrag = {};
                status = 'none';
                core.canvas.data.canvas.style.zIndex = '170';
            }, 650);
        }

        /**
         * 点击地图事件，尝试楼层传送
         * @param {MouseEvent} e
         */
        function clickMap(e) {
            if (moved) return (moved = false);
            const { x, y } = core.actions._getClickLoc(e.clientX, e.clientY);
            let px = x / core.domStyle.scale,
                py = y / core.domStyle.scale;
            const scale = nowScale;
            const id = `${drawingMap}_${nowDepth}_${noBorder}`;
            const locs = drawCache[id].locs;
            const sprite = canDrag.__flyMap__;
            px -= sprite.x;
            py -= sprite.y;
            for (const id in locs) {
                const loc = locs[id];
                const [x, y, w, h] = loc.map(
                    v => typeof v === 'number' && v * scale
                );
                if (inRect(x, y, w, h, px, py)) {
                    return flyTo(id);
                }
            }
        }

        /** 飞向某个楼层 */
        function flyTo(id) {
            if (!core.hasItem('fly')) return core.drawTip('你没有楼层传送器');
            sprites.__map_back__.setCss('opacity: 0.2;');
            return core.flyTo(id, () =>
                setTimeout(() => {
                    if (sprites.__map_back__) core.lockControl();
                }, 100)
            );
        }

        /**
         * 拖拽事件
         * @param {MouseEvent} e
         */
        function drag(e) {
            if (!clicking) return;
            const scale = core.domStyle.scale;
            moveEle(e.movementX / scale, e.movementY / scale);
        }

        /**
         * 手机端点击拖动事件
         * @param {TouchEvent} e
         * @this {HTMLCanvasElement}
         */
        function touchDrag(e) {
            moved = true;
            const scale = core.domStyle.scale;
            if (e.touches.length === 1) {
                // 拖拽
                const info = e.touches[0];
                if (!lastTouch[this.id]) {
                    lastTouch[this.id] = [info.clientX, info.clientY];
                    return;
                }
                const { clientX: x, clientY: y } = info;
                const dx = x - lastTouch[this.id][0],
                    dy = y - lastTouch[this.id][1];
                moveEle(dx / scale, dy / scale);
                lastTouch[this.id] = [info.clientX, info.clientY];
            } else if (e.touches.length >= 2) {
                // 双指放缩
                const [first, second] = e.touches;
                const dx = first.clientX - second.clientX,
                    dy = first.clientY - second.clientY;
                if (lastLength === 0) {
                    lastLength = Math.sqrt(dx * dx + dy * dy);
                    return;
                }
                let cx = (first.clientX + second.clientX) / 2,
                    cy = (first.clientY + second.clientY) / 2;
                const { x, y } = core.actions._getClickLoc(cx, cy);
                cx = x / scale;
                cy = y / scale;
                const length = Math.sqrt(dx * dx + dy * dy);
                const delta = length / lastLength;
                const info = {};
                for (const id in canDrag) {
                    const sprite = canDrag[id];
                    const sx = sprite.x + sprite.width / 2,
                        sy = sprite.y + sprite.height / 2;
                    const dx = sx - mx,
                        dy = sy - my;
                    info[id] = [cx + dx * delta, cy + dy * delta];
                }
                scaleMap(delta * nowScale, info);
            }
        }

        /**
         * 滚轮缩放
         * @param {WheelEvent} e
         */
        function wheel(e) {
            const delta = 1 - Math.sign(e.deltaY) / 10;
            const { x, y } = core.actions._getClickLoc(e.clientX, e.clientY);
            const scale = core.domStyle.scale;
            const mx = x / scale,
                my = y / scale;
            const info = {};
            for (const id in canDrag) {
                const sprite = canDrag[id];
                const cx = sprite.x + sprite.width / 2,
                    cy = sprite.y + sprite.height / 2;
                const dx = cx - mx,
                    dy = cy - my;
                info[id] = [mx + dx * delta, my + dy * delta];
            }
            scaleMap(delta * nowScale, info);
        }

        /** 切换边框 */
        function changeBorder() {
            noBorder = !noBorder;
            redraw('border');
        }

        /** 切换是否显示漏怪数量 */
        function triggerEnemy() {
            showEnemy = !showEnemy;
            redraw('enemy');
        }

        /** 改变区域 */
        function changeArea(index) {
            nowArea = index;
            drawAreaList(false);
            drawedThumbnail = {};
            status = 'area';
            nowScale = defaultValue.scale;
            drawMap(core.plugin.getMapDrawInfo(areas[index].maps[0]));
        }

        /** 重绘 */
        function redraw(id, px, py, move = true) {
            const { x, y } = canDrag.__flyMap__;
            status = id;
            drawedThumbnail = {};
            drawMap(
                core.plugin.getMapDrawInfo(drawingMap, nowDepth, true),
                nowScale
            );
            if (move) canDrag.__flyMap__.move(px ?? x, py ?? y);
            checkThumbnail();
        }

        /**
         * 拖拽时移动需要元素
         * @param {string} dx
         * @param {string} dy
         */
        function moveEle(dx, dy) {
            moved = true;
            for (const id in canDrag) {
                const sprite = canDrag[id];
                const ctx = sprite.context;
                sprite.x += dx;
                sprite.y += dy;
                core.relocateCanvas(ctx, dx, dy, true);
            }
            checkThumbnail();
        }

        /**
         * 缩放绘制地图
         * @param {number} target 目标缩放比例
         * @param {{[x: string]: [number, number]}} info 缩放后的sprite位置数据
         */
        function scaleMap(target, info) {
            // 检查浏览器限制
            if (checkMaximum(nowScale, target)) return;
            clearTimeout(lastScale);
            const [x, y] = info.__flyMap__;
            // 先直接修改style，延迟200ms再绘制，进行性能优化
            const sprite = canDrag.__flyMap__;
            const rate = target / nowScale;
            nowScale = target;
            sprite.resize(sprite.width * rate, sprite.height * rate, true);
            sprite.move(x - sprite.width / 2, y - sprite.height / 2);
            lastScale = setTimeout(() => {
                redraw('scale', x - sprite.width / 2, y - sprite.height / 2);
            }, 200);
        }

        /** 键盘操作
         * @param {KeyboardEvent} e
         */
        function keyboard(e) {
            if (
                e.key === 'Enter' ||
                e.key === 'C' ||
                e.key === 'c' ||
                e.key === ''
            ) {
                return flyTo(selecting);
            } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
                return close();
            } else if (e.key.startsWith('Arrow')) {
                const dir = e.key.slice(5).toLowerCase();
                // 获取目标楼层
                const res =
                    mapCache[`${drawingMap}_${nowDepth}_${noBorder}`].res;
                const key = Object.keys(res).find(v => {
                    const [floorId, x, y, d] = v.split('_');
                    return floorId === selecting && d === dir;
                });
                if (!key) return;
                const target = res[key].split('_')[0];
                selecting = target;
                redraw('key');
            }
        }

        /**
         * 给需要的元素添加拖拽等事件
         * @param {HTMLCanvasElement} ele
         */
        function addDrag(ele) {
            ele.addEventListener('wheel', wheel);
            ele.addEventListener('mousemove', drag);
            ele.addEventListener('touchmove', touchDrag);
            ele.addEventListener('click', clickMap);
            ele.addEventListener('mousedown', () => {
                clicking = true;
            });
            ele.addEventListener('mouseup', () => {
                clicking = false;
            });
            ele.addEventListener('touchend', () => {
                lastTouch = {};
                lastLength = 0;
            });
            document.body.addEventListener('keyup', keyboard);
        }

        maps.prototype._drawThumbnail_drawToTarget = function (
            floorId,
            options
        ) {
            const ctx = core.getContextByName(options.ctx);
            if (ctx == null) return;
            const x = options.x || 0,
                y = options.y || 0,
                size = options.size || 1;
            // size的含义改为(0,1]范围的系数以适配长方形，默认为1，楼传为3/4，SL界面为0.3
            let w = Math.ceil(size * core._PX_),
                h = Math.ceil(size * core._PY_);
            // 特判是否为编辑器，编辑器中长宽均采用core.js的遗留正方形像素边长，以保证下面的绘制正常
            if (main.mode == 'editor') w = h = size * core.__PIXELS__;
            const width = core.floors[floorId].width,
                height = core.floors[floorId].height;
            let centerX = options.centerX,
                centerY = options.centerY;
            if (centerX == null) centerX = Math.floor(width / 2);
            if (centerY == null) centerY = Math.floor(height / 2);
            const tempCanvas = core.bigmap.tempCanvas;

            if (options.all) {
                const tempWidth = tempCanvas.canvas.width,
                    tempHeight = tempCanvas.canvas.height;
                // 绘制全景图
                if (tempWidth <= tempHeight) {
                    const realHeight = h,
                        realWidth = (realHeight * tempWidth) / tempHeight;
                    const side = (w - realWidth) / 2;
                    if (options.fromMap) {
                        return core.drawImage(
                            ctx,
                            tempCanvas.canvas,
                            0,
                            0,
                            tempWidth,
                            tempHeight,
                            x,
                            y,
                            realWidth,
                            realHeight
                        );
                    }
                    core.fillRect(ctx, x, y, side, realHeight, '#000000');
                    core.fillRect(ctx, x + w - side, y, side, realHeight);
                    core.drawImage(
                        ctx,
                        tempCanvas.canvas,
                        0,
                        0,
                        tempWidth,
                        tempHeight,
                        x + side,
                        y,
                        realWidth,
                        realHeight
                    );
                } else {
                    const realWidth = w,
                        realHeight = (realWidth * tempHeight) / tempWidth;
                    const side = (h - realHeight) / 2;
                    if (options.fromMap) {
                        return core.drawImage(
                            ctx,
                            tempCanvas.canvas,
                            0,
                            0,
                            tempWidth,
                            tempHeight,
                            x,
                            y,
                            realWidth,
                            realHeight
                        );
                    }
                    core.fillRect(ctx, x, y, realWidth, side, '#000000');
                    core.fillRect(ctx, x, y + h - side, realWidth, side);
                    core.drawImage(
                        ctx,
                        tempCanvas.canvas,
                        0,
                        0,
                        tempWidth,
                        tempHeight,
                        x,
                        y + side,
                        realWidth,
                        realHeight
                    );
                }
            } else {
                // 只绘制可见窗口
                let pw = core._PX_,
                    ph = core._PY_,
                    hw = core._HALF_WIDTH_,
                    hh = core._HALF_HEIGHT_,
                    W = core._WIDTH_,
                    H = core._HEIGHT_;
                const ratio = core.domStyle.isVertical
                    ? core.domStyle.ratio
                    : core.domStyle.scale;
                if (main.mode == 'editor') {
                    pw = ph = core.__PIXELS__;
                    hw = hh = core.__HALF_SIZE__;
                    W = H = core.__SIZE__;
                }
                if (options.v2) {
                    core.drawImage(
                        ctx,
                        tempCanvas.canvas,
                        0,
                        0,
                        pw * ratio,
                        ph * ratio,
                        x,
                        y,
                        w,
                        h
                    );
                } else {
                    const offsetX = core.clamp(centerX - hw, 0, width - W),
                        offsetY = core.clamp(centerY - hh, 0, height - H);
                    if (options.noHD) {
                        core.drawImage(
                            ctx,
                            tempCanvas.canvas,
                            offsetX * 32,
                            offsetY * 32,
                            pw,
                            ph,
                            x,
                            y,
                            w,
                            h
                        );
                        return;
                    }
                    core.drawImage(
                        ctx,
                        tempCanvas.canvas,
                        offsetX * 32 * ratio,
                        offsetY * 32 * ratio,
                        pw * ratio,
                        ph * ratio,
                        x,
                        y,
                        w,
                        h
                    );
                }
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
            // 关闭小地图
            flags.__useMinimap__ = false;
            core.drawMinimap();
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
                        core.skipWord('智慧之神：你和之前来的人不一样');
                    if (seconds == 12)
                        core.skipWord('智慧之神：他们只会一股脑地向前冲');
                    if (seconds == 16)
                        core.skipWord('智慧之神：而你却会躲避这些攻击');
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
                    if (seconds == 4) core.skipWord('智慧之神：你很有潜力');
                    if (seconds == 8)
                        core.skipWord('智慧之神：看来你很可能成为改变历史的人');
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
                        core.skipWord('智慧之神：我越来越欣赏你了');
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
                        '\t[智慧之神,E557]\b[down,7,4]不错不错，你确实可以成为改变历史的人',
                        '\t[智慧之神,E557]\b[down,7,4]我的职责就到此结束了',
                        '\t[智慧之神,E557]\b[down,7,4]之后还是要看你自己了，千万不要让我失望！',
                        '\t[智慧之神,E557]\b[down,7,4]东边的机关门我已经替你打开了',
                        { type: 'openDoor', loc: [13, 6], floorId: 'MT19' },
                        '\t[智慧之神,E557]\b[down,7,4]我这就把你传送出去',
                        { type: 'setValue', name: 'flag:boss1', value: 'true' },
                        { type: 'changeFloor', floorId: 'MT20', loc: [7, 9] },
                        {
                            type: 'function',
                            function: '() => {\ncore.deleteAllCanvas();\n}'
                        },
                        { type: 'forbidSave' }
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
                                core.popupDamage(1000, x, y, false);
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
                                core.popupDamage(1000, x, y, false);
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
                        core.popupDamage(5000, x, y, false);
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
                core.popupDamage(3000 * power, x, y, false);
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
                                    core.popupDamage(3000, x, y, false);
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
                            core.popupDamage(3000, hx, hy, false);
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
                        core.popupDamage(damage, x, y, false);
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
                        core.popupDamage(damage, x, y, false);
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
        control.prototype.checkBlock = function () {
            var x = core.getHeroLoc('x'),
                y = core.getHeroLoc('y'),
                loc = x + ',' + y;
            var damage = core.status.checkBlock.damage[loc];
            if (damage) {
                if (!main.replayChecking)
                    core.addPop(
                        x * 32 + 12,
                        y * 32 + 20,
                        damage,
                        '#f00',
                        '#000'
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
            this._checkBlock_ambush(core.status.checkBlock.ambush[loc]);
            this._checkBlock_repulse(core.status.checkBlock.repulse[loc]);
        };
    },
    chase: function () {
        // 山野追逐战
        // 初始变量
        // 视野路线 x, y, frame
        var route = [
            [10, 10, 0],
            [0, 10, 100],
            [0, 10, 200],
            [49, 0, 500],
            [49, 0, 550],
            [45, 0, 640],
            [40, 0, 760],
            [40, 0, 820],
            [41, 0, 850],
            [37, 0, 950],
            [31, 0, 1000],
            [29, 0, 1020],
            [29, 0, 1210],
            [25, 0, 1270],
            [12, 0, 1330],
            [0, 0, 1470],
            [0, 0, 2000],
            [113, 0, 2500],
            [109, 0, 2580],
            [104, 0, 2600],
            [104, 0, 2830],
            [92, 0, 3000],
            [84, 0, 3120],
            [74, 0, 3300],
            [65, 0, 3480],
            [58, 0, 3600],
            [47, 0, 3800],
            [36, 0, 4000],
            [0, 0, 4600]
        ];
        // 效果函数
        var funcs = [[0, wolfRun], [550, shake1], [10000000]];
        var parrallels = [para1, para2]; // 并行脚本
        var speed = 0; // 速度
        var index = 0; // 当前要到达的索引
        var fIndex = 0; // 函数索引
        var frame = 0; // 帧数
        var acc = 0; // 加速度
        var currX = route[0][1] * 32; // 当前x轴
        var inBlack = false;
        var x = core.getHeroLoc('x');
        var y = core.getHeroLoc('y'); // 勇士坐标
        // 初始化，删除门和道具
        this.initChase = function () {
            speed = 0; // 速度
            index = 0; // 当前要到达的索引
            fIndex = 0; // 函数索引
            frame = 0; // 帧数
            acc = 0; // 加速度
            currX = route[0][1] * 32; // 当前x轴
            inBlack = false;
            x = core.getHeroLoc('x');
            y = core.getHeroLoc('y'); // 勇士坐标
            // 循环删除
            for (var i = 13; i < 16; i++) {
                var floorId = 'MT' + i;
                // 不可瞬移
                core.status.maps[floorId].cannotMoveDirectly = true;
                core.extractBlocks(floorId);
                for (
                    var j = 0;
                    j < core.status.maps[floorId].blocks.length;
                    j++
                ) {
                    var block = core.status.maps[floorId].blocks[j];
                    var cls = block.event.cls,
                        id = block.event.id;
                    if (
                        (cls == 'animates' || cls == 'items') &&
                        !id.endsWith('Portal')
                    ) {
                        core.removeBlock(block.x, block.y, floorId);
                        j--;
                    }
                }
            }
        };
        // 函数们
        function wolfRun() {
            core.moveBlock(
                23,
                17,
                ['down', 'down', 'down', 'down', 'down', 'down'],
                80
            );
            setTimeout(() => {
                core.setBlock(508, 23, 23);
                core.moveBlock(
                    23,
                    23,
                    [
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left',
                        'left'
                    ],
                    80,
                    true
                );
            }, 500);
        }
        // MT15函数1
        function shake1() {
            core.vibrate('vertical', 1000, 25, 2);
            for (var tx = 53; tx < 58; tx++) {
                for (var ty = 3; ty < 8; ty++) {
                    core.setBlock(336, tx, ty);
                }
            }
            core.drawAnimate('explosion3', 55, 5);
            core.drawAnimate('stone', 55, 5);
            setTimeout(() => {
                core.setBlock(336, 58, 9);
                core.setBlock(336, 59, 9);
                core.drawAnimate('explosion1', 58, 9);
                core.drawAnimate('explosion1', 59, 9);
            }, 250);
            setTimeout(() => {
                core.setBlock(336, 53, 8);
                core.setBlock(336, 52, 8);
                core.drawAnimate('explosion1', 53, 8);
                core.drawAnimate('explosion1', 52, 8);
            }, 360);
            setTimeout(() => {
                core.setBlock(336, 51, 7);
                core.drawAnimate('explosion1', 51, 7);
            }, 750);
            setTimeout(() => {
                core.vibrate('vertical', 6000, 25, 1);
                core.setBlock(336, 47, 7);
                core.setBlock(336, 49, 9);
                core.drawAnimate('explosion1', 49, 9);
                core.drawAnimate('explosion1', 47, 7);
            }, 1000);
        }
        // 并行1
        function para1() {
            if (core.status.floorId != 'MT15') return;
            if (x == 45 && y == 8 && !flags.p11) {
                core.setBlock(336, 45, 9);
                core.drawAnimate('explosion1', 45, 9);
                flags.p11 = true;
            }
            if (x == 45 && y == 6 && !flags.p12) {
                core.setBlock(336, 44, 6);
                core.drawAnimate('explosion1', 44, 6);
                flags.p12 = true;
            }
            if (x == 45 && y == 4 && !flags.p13) {
                core.setBlock(336, 44, 4);
                core.drawAnimate('explosion1', 44, 4);
                core.drawAnimate('explosion1', 48, 6);
                core.removeBlock(48, 6);
                flags.p13 = true;
            }
            if (x == 41 && y == 3 && !flags.p14) {
                core.setBlock(336, 41, 4);
                core.setBlock(336, 32, 6);
                core.drawAnimate('explosion1', 41, 4);
                core.drawAnimate('explosion1', 32, 6);
                flags.p14 = true;
            }
            if (x == 35 && y == 3 && !flags.p15) {
                core.drawAnimate('explosion3', 37, 7);
                core.vibrate('vertical', 1000, 25, 10);
                for (var tx = 36; tx < 42; tx++) {
                    for (var ty = 4; ty < 11; ty++) {
                        core.setBlock(336, tx, ty);
                    }
                }
                flags.p15 = true;
            }
            if (x == 31 && y == 5 && !flags.p16) {
                core.vibrate('vertical', 10000, 25, 1);
                core.removeBlock(34, 8);
                core.removeBlock(33, 8);
                core.drawAnimate('explosion1', 34, 8);
                core.drawAnimate('explosion1', 33, 8);
                flags.p16 = true;
            }
            if (x == 33 && y == 7 && !flags.p17) {
                core.setBlock(336, 32, 9);
                core.drawAnimate('explosion1', 32, 9);
                flags.p17 = true;
            }
            if ((x == 33 || x == 34 || x == 35) && y == 9 && !flags.p18) {
                core.removeBlock(32, 9);
                core.drawAnimate('explosion1', 32, 9);
                flags.p18 = true;
            }
            if (x > 18 && x < 31 && y == 11 && !flags['p19' + x]) {
                core.setBlock(336, x + 1, 11);
                core.drawAnimate('explosion1', x + 1, 11);
                flags['p19' + x] = true;
            }
        }
        // 并行2
        function para2() {
            if (core.status.floorId != 'MT14') return;
            if (x == 126 && y == 7 && !flags.p21) {
                core.setBlock(336, 126, 6);
                core.setBlock(336, 124, 6);
                core.setBlock(336, 124, 9);
                core.setBlock(336, 126, 9);
                core.drawAnimate('explosion1', 126, 6);
                core.drawAnimate('explosion1', 124, 6);
                core.drawAnimate('explosion1', 124, 9);
                core.drawAnimate('explosion1', 126, 9);
                flags.p21 = true;
            }
            if (x == 123 && y == 7 && !flags.p22) {
                core.setBlock(508, 127, 7);
                core.jumpBlock(127, 7, 112, 7, 500, true);
                setTimeout(() => {
                    core.setBlock(509, 112, 7);
                }, 520);
                core.drawHeroAnimate('amazed');
                core.setBlock(336, 121, 6);
                core.setBlock(336, 122, 6);
                core.setBlock(336, 120, 8);
                core.setBlock(336, 121, 8);
                core.setBlock(336, 122, 8);
                core.drawAnimate('explosion1', 121, 6);
                core.drawAnimate('explosion1', 122, 6);
                core.drawAnimate('explosion1', 120, 8);
                core.drawAnimate('explosion1', 121, 8);
                core.drawAnimate('explosion1', 122, 8);
                flags.p22 = true;
            }
            if (x == 110 && y == 10 && !flags.p23) {
                core.setBlock(336, 109, 11);
                core.removeBlock(112, 8);
                core.drawAnimate('explosion1', 109, 11);
                core.drawAnimate('explosion1', 112, 8);
                core.insertAction([
                    { type: 'moveHero', time: 400, steps: ['backward:1'] }
                ]);
                flags.p23 = true;
            }
            if (x == 112 && y == 8 && !flags.p24 && flags.p23) {
                core.jumpBlock(112, 7, 110, 4, 500, true);
                core.drawHeroAnimate('amazed');
                setTimeout(() => {
                    core.setBlock(506, 110, 4);
                }, 540);
                flags.p24 = true;
            }
            if (x == 118 && y == 7 && !flags.p25) {
                core.setBlock(336, 117, 6);
                core.setBlock(336, 116, 6);
                core.setBlock(336, 115, 6);
                core.setBlock(336, 114, 6);
                core.setBlock(336, 117, 8);
                core.setBlock(336, 116, 8);
                core.drawAnimate('explosion1', 117, 6);
                core.drawAnimate('explosion1', 116, 6);
                core.drawAnimate('explosion1', 115, 6);
                core.drawAnimate('explosion1', 114, 6);
                core.drawAnimate('explosion1', 116, 8);
                core.drawAnimate('explosion1', 117, 8);
                flags.p25 = true;
            }
            if (x == 112 && y == 7 && !flags.p26) {
                core.setBlock(336, 112, 8);
                core.setBlock(336, 113, 7);
                core.drawAnimate('explosion1', 112, 8);
                core.drawAnimate('explosion1', 113, 7);
                flags.p26 = true;
            }
            if (x == 115 && y == 7 && !flags.p39) {
                for (var tx = 111; tx <= 115; tx++) {
                    core.setBlock(336, tx, 10);
                    core.drawAnimate('explosion1', tx, 10);
                }
                core.setBlock(336, 112, 8);
                core.drawAnimate('explosion1', 112, 8);
                flags.p39 = true;
            }
            if (x == 110 && y == 7 && !flags.p27) {
                core.jumpBlock(97, 4, 120, -3, 2000);
                for (var tx = 109; tx <= 120; tx++) {
                    for (var ty = 3; ty <= 11; ty++) {
                        if (ty == 7) continue;
                        core.setBlock(336, tx, ty);
                    }
                }
                core.vibrate('vertical', 3000, 25, 10);
                core.drawAnimate('explosion2', 119, 7);
                core.insertAction([
                    {
                        type: 'autoText',
                        text: '\t[原始人]\b[down,hero]卧槽！！吓死我了！！',
                        time: 600
                    }
                ]);
                core.removeBlock(105, 7);
                core.drawAnimate('explosion1', 105, 7);
                flags.p27 = true;
            }
            if (x == 97 && y == 3 && !flags.p28) {
                core.setBlock(336, 95, 3);
                core.setBlock(336, 93, 6);
                core.drawAnimate('explosion1', 95, 3);
                core.drawAnimate('explosion1', 93, 6);
                flags.p28 = true;
            }
            if (x == 88 && y == 6 && !flags.p29) {
                core.setBlock(336, 87, 4);
                core.setBlock(336, 88, 5);
                core.drawAnimate('explosion1', 87, 4);
                core.drawAnimate('explosion1', 88, 5);
                flags.p29 = true;
            }
            if (x == 86 && y == 6 && !flags.p30) {
                core.setBlock(336, 84, 6);
                core.setBlock(336, 85, 5);
                core.setBlock(336, 86, 8);
                core.drawAnimate('explosion1', 84, 6);
                core.drawAnimate('explosion1', 85, 5);
                core.drawAnimate('explosion1', 86, 8);
                flags.p30 = true;
            }
            if (x == 81 && y == 9 && !flags.p31) {
                core.setBlock(336, 81, 8);
                core.setBlock(336, 82, 11);
                core.drawAnimate('explosion1', 81, 8);
                core.drawAnimate('explosion1', 82, 11);
                flags.p31 = true;
            }
            if (x == 72 && y == 11 && !flags.p32) {
                core.setBlock(336, 73, 8);
                core.setBlock(336, 72, 4);
                core.drawAnimate('explosion1', 73, 8);
                core.drawAnimate('explosion1', 72, 4);
                flags.p32 = true;
            }
            if (x == 72 && y == 7 && !flags.p33) {
                for (var tx = 74; tx < 86; tx++) {
                    for (var ty = 3; ty < 12; ty++) {
                        core.setBlock(336, tx, ty);
                    }
                }
                core.drawAnimate('explosion2', 79, 7);
                core.vibrate('vertical', 4000, 25, 15);
                setTimeout(() => {
                    core.vibrate(10000, null, 4);
                });
                flags.p33 = true;
            }
            if (x == 68 && y == 5 && !flags.p34) {
                core.setBlock(336, 68, 4);
                core.setBlock(336, 67, 6);
                core.drawAnimate('explosion1', 68, 4);
                core.drawAnimate('explosion1', 67, 6);
                flags.p34 = true;
            }
            if (x == 67 && y == 10 && !flags.p35) {
                for (var tx = 65; tx <= 72; tx++) {
                    for (var ty = 3; ty <= 9; ty++) {
                        core.setBlock(336, tx, ty);
                    }
                }
                core.setBlock(336, 72, 10);
                core.setBlock(336, 72, 11);
                core.drawAnimate('explosion3', 69, 5);
                core.vibrate('vertical', 2000, 25, 7);
                flags.p35 = true;
            }
            if (x == 64 && y == 11 && !flags.p36) {
                core.setBlock(336, 63, 9);
                core.setBlock(336, 60, 8);
                core.setBlock(336, 56, 11);
                core.drawAnimate('explosion1', 63, 9);
                core.drawAnimate('explosion1', 60, 8);
                core.drawAnimate('explosion1', 56, 11);
                flags.p36 = true;
            }
            if (x == 57 && y == 9 && !flags.p37) {
                for (tx = 58; tx <= 64; tx++) {
                    for (var ty = 3; ty <= 11; ty++) {
                        core.setBlock(336, tx, ty);
                    }
                }
                core.drawAnimate('explosion2', 61, 7);
                core.vibrate('vertical', 3000, 25, 12);
                setTimeout(() => {
                    core.vibrate(20000, null, 4);
                }, 3000);
                flags.p37 = true;
            }
            if (x <= 48 && !flags['p38' + x] && x >= 21) {
                for (var ty = 3; ty <= 11; ty++) {
                    core.setBlock(336, x + 4, ty);
                    core.drawAnimate('explosion1', x + 4, ty);
                }
                flags['p38' + x] = true;
            }
            if (x == 21 && flags.p37) {
                core.endChase();
            }
        }
        // 开始追逐
        this.startChase = function () {
            flags.__lockViewport__ = true;
            flags.chase = true;
            speed = 0; // 速度
            index = 0; // 当前要到达的索引
            fIndex = 0; // 函数索引
            frame = 0; // 帧数
            acc = 0; // 加速度
            currX = route[0][1] * 32; // 当前x轴
            inBlack = false;
            x = core.getHeroLoc('x');
            y = core.getHeroLoc('y'); // 勇士坐标
            core.values.moveSpeed = 100;
            core.loadOneSound('quake.mp3');
            core.drawHero();
            core.pauseBgm();
            core.playBgm('escape.mp3', 43.5);
        };
        // 视野变化 useAcc:是否匀变速
        this.changeChaseView = function (useAcc) {
            if (flags.haveLost) return;
            var floorId = core.status.floorId;
            if (frame >= 3600) useAcc = false;
            // 刚进MT15时
            if (floorId === 'MT15' && !inBlack) {
                frame = 500;
                index = 3;
                fIndex = 1;
                speed = 0;
                acc = 0;
                currX = 32 * 49;
                inBlack = true;
                core.setGameCanvasTranslate('hero', 224, 0);
                flags.startShake = true;
                core.playSound('地震');
                core.insertAction([{ type: 'sleep', time: 500, noSkip: true }]);
                var interval = setInterval(() => {
                    core.playSound('地震');
                    if (index >= route.length - 1) clearInterval(interval);
                }, 15000);
                core.vibrate('vertical', 1000, 25);
                setTimeout(() => {
                    core.blackEdge();
                    core.insertAction([
                        {
                            type: 'autoText',
                            text: '\t[原始人]\b[down,hero]糟糕，还地震了！',
                            time: 1500
                        },
                        {
                            type: 'autoText',
                            text: '\t[原始人]\b[down,hero]快跑！',
                            time: 1000
                        }
                    ]);
                    flags.startShake = false;
                }, 500);
            }
            // 超范围失败
            if (x * 32 > currX + 480 + 64) {
                flags.haveLost = true;
                core.lose('逃跑失败');
                return;
            }
            // 刚进MT14
            if (floorId == 'MT14' && !flags.first14) {
                frame = 2500;
                index = 17;
                fIndex = 2;
                speed = 0;
                acc = 0;
                currX = 117 * 32;
                core.vibrate('vertical', 10000, 25, 2);
                core.setGameCanvasTranslate('hero', 224, 0);
                flags.first14 = true;
            }
            // 停止运行
            if (index >= route.length) return;
            // 切换索引
            if (frame > route[index][2]) {
                index++;
                if (index == 3 && floorId == 'MT16') {
                    core.lose('逃跑失败');
                }
                if (index >= route.length) {
                    return;
                }
                core.changeChaseIndex(useAcc);
            }
            // 碰到狼就死
            if (floorId == 'MT16') {
                if (x >= 6) {
                    if (x > 25 - (frame - 29) / 5) {
                        flags.haveLost = true;
                        core.lose('逃跑失败');
                        return;
                    }
                }
            }
            // 执行函数
            if (frame == funcs[fIndex][0]) {
                funcs[fIndex][1]();
                fIndex++;
            }
            // 并行
            for (var i in parrallels) {
                parrallels[i]();
            }
            if (useAcc) speed += acc;
            currX += speed;
            if (floorId == 'MT16') core.setViewport(currX, 320);
            else core.setViewport(currX, 0);
            x = core.getHeroLoc('x');
            y = core.getHeroLoc('y');
            frame++;
        };
        // 路线索引切换
        this.changeChaseIndex = function (useAcc) {
            var fromR = route[index - 1],
                toR = route[index];
            var dt = toR[2] - fromR[2],
                dx = (toR[0] - fromR[0]) * 32;
            if (dx == 0) {
                acc = 0;
                speed = 0;
            }
            if (useAcc) {
                acc = (2 * (dx - speed * dt)) / (dt * dt);
            } else {
                speed = dx / dt;
            }
        };
        // 黑边
        this.blackEdge = function () {
            core.createCanvas('edge', 0, 0, 480, 480, 100);
            var f = 0;
            var h = 0,
                s = 2.56;
            // 初始动画
            function start() {
                core.clearMap('edge');
                core.fillRect('edge', 0, 0, 480, h);
                core.fillRect('edge', 0, 480, 480, -h);
                f++;
                s -= 0.0512;
                h += s;
                if (f == 50) clearInterval(interval);
            }
            var interval = setInterval(start, 20);
        };
        // 结束追逐
        this.endChase = function () {
            flags.chase = false;
            flags.__lockViewport__ = false;
            core.autoFixRouteBoss(false);
            // 黑边消失
            clearInterval(interval);
            var f = 0;
            var h = 64,
                s = 0;
            var interval = setInterval(() => {
                core.clearMap('edge');
                core.fillRect('edge', 0, 0, 480, h);
                core.fillRect('edge', 0, 480, 480, -h);
                f++;
                s += 0.0512;
                h -= s;
                if (f == 50) {
                    clearInterval(interval);
                    core.deleteCanvas('edge');
                    flags.finishChase = true;
                }
            });
        };
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
                xhr.onload = e => {
                    if (xhr.status !== 200) {
                        console.error(`hot reload: http ${xhr.status}`);
                        res('@error');
                    } else res('success');
                };
                xhr.onerror = e => {
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
            const all = Array.from(document.getElementsByTagName('link'));
            all.forEach(v => {
                if (v.rel !== 'stylesheet') return;
                if (v.href === `http://127.0.0.1:3000/${data}`) {
                    v.remove();
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.type = 'text/css';
                    link.href = data;
                    document.head.appendChild(link);
                    console.log(`css hot reload: ${data}`);
                }
            });
        }

        /**
         * 热重载楼层
         * @param {string} data
         */
        async function reloadFloor(data) {
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
                    core.setWeather(
                        core.animateFrame.weather.type,
                        core.animateFrame.weather.level
                    );
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
            return (core.plugin.bookOpened.value = true);
        };

        ui.prototype._drawToolbox = function () {
            return (core.plugin.toolOpened.value = true);
        };

        ui.prototype._drawEquipbox = function () {
            return (core.plugin.equipOpened.value = true);
        };

        control.prototype.updateStatusBar_update = function () {
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

            var statusItems = core.dom.status,
                toolItems = core.dom.tools;
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
            core.plugin.chapterContent.value = chapter;
            core.plugin.chapterShowed.value = true;
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
                    if (!block.event.cls.startsWith('enemy')) return;
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
                    if (now.length === 20) {
                        str.push(now.join('\n'));
                        now = [];
                    }
                }
            }
            if (now.length > 0) str.push(now.join('\n'));
            return str;
        };
    }
};
