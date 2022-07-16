var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    "init": function () {
        console.log("插件编写测试");
        this._afterLoadResources = function () { }
    },
    "sprite": function () {
        var count = 0;

        /** 创建一个sprite画布
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} z
         * @param {'game' | 'window'} reference 参考系，游戏画面或者窗口
         * @param {string} name 可选，sprite的名称，方便通过core.dymCanvas获取
         */
        function Sprite (x, y, w, h, z, reference, name) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
            this.zIndex = z;
            this.reference = reference;
            this.canvas = null;
            this.context = null;
            this.count = 0;
            this.name = name;
            /** 初始化 */
            this.init = function () {
                if (reference === 'window') {
                    var canvas = document.createElement('canvas');
                    this.canvas = canvas;
                    this.context = canvas.getContext('2d');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.style.width = w + 'px';
                    canvas.style.height = h + 'px';
                    canvas.style.position = 'absolute';
                    canvas.style.top = y + 'px';
                    canvas.style.left = x + 'px';
                    canvas.style.zIndex = z.toString();
                    document.body.appendChild(canvas);
                } else {
                    this.context = core.createCanvas(this.name || '_sprite_' + count, x, y, w, h, z);
                    this.canvas = this.context.canvas;
                    this.count = count;
                    this.canvas.style.pointerEvents = 'auto';
                    count++;
                }
            }
            this.init();

            /** 设置css特效
             * @param {string} css
             */
            this.setCss = function (css) {
                css = css.replace('\n', ';').replace(';;', ';');
                var effects = css.split(';');
                var self = this;
                effects.forEach(function (v) {
                    var content = v.split(':');
                    var name = content[0];
                    var value = content[1];
                    name = name.trim().split('-').reduce(function (pre, curr, i, a) {
                        if (i === 0 && curr !== '') return curr;
                        if (a[0] === '' && i === 1) return curr;
                        return pre + curr.toUpperCase()[0] + curr.slice(1);
                    }, '');
                    var canvas = self.canvas;
                    if (name in canvas.style) canvas.style[name] = value;
                });
            }

            /** 删除 */
            this.destroy = function () {
                if (this.reference === 'window') {
                    if (this.canvas) document.body.removeChild(this.canvas);
                } else {
                    core.deleteCanvas(this.name || '_sprite_' + this.count);
                }
            }

            /** 添加事件监听器 */
            this.addEventListener = function () {
                return document.addEventListener.apply(this.canvas, arguments);
            }

            /** 移除事件监听器 */
            this.removeEventListener = function () {
                return document.removeEventListener.apply(this.canvas, arguments);
            }
        }

        window.Sprite = Sprite;
    },
    "shop": function () {
        // 【全局商店】相关的功能
        // 
        // 打开一个全局商店
        // shopId：要打开的商店id；noRoute：是否不计入录像
        this.openShop = function (shopId, noRoute) {
            var shop = core.status.shops[shopId];
            // Step 1: 检查能否打开此商店
            if (!this.canOpenShop(shopId)) {
                core.drawTip("该商店尚未开启");
                return false;
            }

            // Step 2: （如有必要）记录打开商店的脚本事件
            if (!noRoute) {
                core.status.route.push("shop:" + shopId);
            }

            // Step 3: 检查道具商店 or 公共事件
            if (shop.item) {
                if (core.openItemShop) {
                    core.openItemShop(shopId);
                } else {
                    core.playSound('操作失败');
                    core.insertAction("道具商店插件不存在！请检查是否存在该插件！");
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
        }

        ////// 将一个全局商店转变成可预览的公共事件 //////
        this._convertShop = function (shop) {
            return [
                { "type": "function", "function": "function() {core.setFlag('@temp@shop', true);}" },
                {
                    "type": "while",
                    "condition": "true",
                    "data": [
                        // 检测能否访问该商店
                        {
                            "type": "if",
                            "condition": "core.isShopVisited('" + shop.id + "')",
                            "true": [
                                // 可以访问，直接插入执行效果
                                { "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', false) }" },
                            ],
                            "false": [
                                // 不能访问的情况下：检测能否预览
                                {
                                    "type": "if",
                                    "condition": shop.disablePreview,
                                    "true": [
                                        // 不可预览，提示并退出
                                        { "type": "playSound", "name": "操作失败" },
                                        "当前无法访问该商店！",
                                        { "type": "break" },
                                    ],
                                    "false": [
                                        // 可以预览：将商店全部内容进行替换
                                        { "type": "tip", "text": "当前处于预览模式，不可购买" },
                                        { "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', true) }" },
                                    ]
                                }
                            ]
                        }
                    ]
                },
                { "type": "function", "function": "function() {core.removeFlag('@temp@shop');}" }
            ];
        }

        this._convertShop_replaceChoices = function (shopId, previewMode) {
            var shop = core.status.shops[shopId];
            var choices = (shop.choices || []).filter(function (choice) {
                if (choice.condition == null || choice.condition == '') return true;
                try { return core.calValue(choice.condition); } catch (e) { return true; }
            }).map(function (choice) {
                var ableToBuy = core.calValue(choice.need);
                return {
                    "text": choice.text,
                    "icon": choice.icon,
                    "color": ableToBuy && !previewMode ? choice.color : [153, 153, 153, 1],
                    "action": ableToBuy && !previewMode ? [{ "type": "playSound", "name": "确定" }].concat(choice.action) : [
                        { "type": "playSound", "name": "操作失败" },
                        { "type": "tip", "text": previewMode ? "预览模式下不可购买" : "购买条件不足" }
                    ]
                };
            }).concat({ "text": "离开", "action": [{ "type": "break" }] });
            core.insertAction({ "type": "choices", "text": shop.text, "choices": choices });
        }

        /// 是否访问过某个快捷商店
        this.isShopVisited = function (id) {
            if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
            var shops = core.getFlag("__shops__");
            if (!shops[id]) shops[id] = {};
            return shops[id].visited;
        }

        /// 当前应当显示的快捷商店列表
        this.listShopIds = function () {
            return Object.keys(core.status.shops).filter(function (id) {
                return core.isShopVisited(id) || !core.status.shops[id].mustEnable;
            });
        }

        /// 是否能够打开某个商店
        this.canOpenShop = function (id) {
            if (this.isShopVisited(id)) return true;
            var shop = core.status.shops[id];
            if (shop.item || shop.commonEvent || shop.mustEnable) return false;
            return true;
        }

        /// 启用或禁用某个快捷商店
        this.setShopVisited = function (id, visited) {
            if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
            var shops = core.getFlag("__shops__");
            if (!shops[id]) shops[id] = {};
            if (visited) shops[id].visited = true;
            else delete shops[id].visited;
        }

        /// 能否使用快捷商店
        this.canUseQuickShop = function (id) {
            // 如果返回一个字符串，表示不能，字符串为不能使用的提示
            // 返回null代表可以使用

            // 检查当前楼层的canUseQuickShop选项是否为false
            if (core.status.thisMap.canUseQuickShop === false)
                return '当前楼层不能使用快捷商店。';
            return null;
        }

        /// 允许商店X键退出
        core.registerAction('keyUp', 'shops', function (keycode) {
            if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
            if (core.status.event.data.type != 'choices') return false;
            var data = core.status.event.data.current;
            var choices = data.choices;
            var topIndex = core.actions.HSIZE - parseInt((choices.length - 1) / 2) + (core.status.event.ui.offset || 0);
            if (keycode == 88 || keycode == 27) { // X, ESC
                core.actions._clickAction(core.actions.HSIZE, topIndex + choices.length - 1);
                return true;
            }
            if (keycode == 13 || keycode == 32) return true;
            return false;
        }, 60);

        /// 允许长按空格或回车连续执行操作
        core.registerAction('keyDown', 'shops', function (keycode) {
            if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
            if (core.status.event.data.type != 'choices') return false;
            var data = core.status.event.data.current;
            var choices = data.choices;
            var topIndex = core.actions.HSIZE - parseInt((choices.length - 1) / 2) + (core.status.event.ui.offset || 0);
            if (keycode == 13 || keycode == 32) { // Space, Enter
                core.actions._clickAction(core.actions.HSIZE, topIndex + core.status.event.selection);
                return true;
            }
            return false;
        }, 60);

        // 允许长按屏幕连续执行操作
        core.registerAction('longClick', 'shops', function (x, y, px, py) {
            if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
            if (core.status.event.data.type != 'choices') return false;
            var data = core.status.event.data.current;
            var choices = data.choices;
            var topIndex = core.actions.HSIZE - parseInt((choices.length - 1) / 2) + (core.status.event.ui.offset || 0);
            if (x >= core.actions.CHOICES_LEFT && x <= core.actions.CHOICES_RIGHT && y >= topIndex && y < topIndex + choices.length) {
                core.actions._clickAction(x, y);
                return true;
            }
            return false;
        }, 60);
    },
    "removeMap": function () {
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
                (core.status.autoEvents || []).forEach(function (event) {
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
        }

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
                flags.__removed__ = flags.__removed__.filter(function (f) { return f != floorId; });
                core.status.maps[floorId] = core.loadFloor(floorId);
            }
        }

        // 分区砍层相关
        var inAnyPartition = function (floorId) {
            var inPartition = false;
            (core.floorPartitions || []).forEach(function (floor) {
                var fromIndex = core.floorIds.indexOf(floor[0]);
                var toIndex = core.floorIds.indexOf(floor[1]);
                var index = core.floorIds.indexOf(floorId);
                if (fromIndex < 0 || index < 0) return;
                if (toIndex < 0) toIndex = core.floorIds.length - 1;
                if (index >= fromIndex && index <= toIndex) inPartition = true;
            });
            return inPartition;
        }

        // 分区砍层
        this.autoRemoveMaps = function (floorId) {
            if (main.mode != 'play' || !inAnyPartition(floorId)) return;
            // 根据分区信息自动砍层与恢复
            (core.floorPartitions || []).forEach(function (floor) {
                var fromIndex = core.floorIds.indexOf(floor[0]);
                var toIndex = core.floorIds.indexOf(floor[1]);
                var index = core.floorIds.indexOf(floorId);
                if (fromIndex < 0 || index < 0) return;
                if (toIndex < 0) toIndex = core.floorIds.length - 1;
                if (index >= fromIndex && index <= toIndex) {
                    core.resumeMaps(core.floorIds[fromIndex], core.floorIds[toIndex]);
                } else {
                    core.removeMaps(core.floorIds[fromIndex], core.floorIds[toIndex]);
                }
            });
        }
    },
    "fiveLayers": function () {
        // 是否启用五图层（增加背景2层和前景2层） 将__enable置为true即会启用；启用后请保存后刷新编辑器
        // 背景层2将会覆盖背景层 被事件层覆盖 前景层2将会覆盖前景层
        // 另外 请注意加入两个新图层 会让大地图的性能降低一些
        // 插件作者：ad
        var __enable = true;
        if (!__enable) return;

        // 创建新图层
        function createCanvas (name, zIndex) {
            if (!name) return;
            var canvas = document.createElement('canvas');
            canvas.id = name;
            canvas.className = 'gameCanvas';
            // 编辑器模式下设置zIndex会导致加入的图层覆盖优先级过高
            if (main.mode != "editor") canvas.style.zIndex = zIndex || 0;
            // 将图层插入进游戏内容
            document.getElementById('gameDraw').appendChild(canvas);
            var ctx = canvas.getContext('2d');
            core.canvas[name] = ctx;
            if (core.domStyle.hdCanvas.indexOf('name') >= 0)
                core.maps._setHDCanvasSize(ctx, core.__PIXELS__, core.__PIXELS__);
            else {
                canvas.width = core.__PIXELS__;
                canvas.height = core.__PIXELS__;
            }
            return canvas;
        }

        var bg2Canvas = createCanvas('bg2', 20);
        var fg2Canvas = createCanvas('fg2', 63);
        // 大地图适配
        core.bigmap.canvas = ["bg2", "fg2", "bg", "event", "event2", "fg", "damage"];
        core.initStatus.bg2maps = {};
        core.initStatus.fg2maps = {};

        if (main.mode == 'editor') {
            /*插入编辑器的图层 不做此步新增图层无法在编辑器显示*/
            // 编辑器图层覆盖优先级 eui > efg > fg(前景层) > event2(48*32图块的事件层) > event(事件层) > bg(背景层)
            // 背景层2(bg2) 插入事件层(event)之前(即bg与event之间)
            document.getElementById('mapEdit').insertBefore(bg2Canvas, document.getElementById('event'));
            // 前景层2(fg2) 插入编辑器前景(efg)之前(即fg之后)
            document.getElementById('mapEdit').insertBefore(fg2Canvas, document.getElementById('ebm'));
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
            var createCanvasBtn = function (name) {
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
                input.onchange = function () {
                    editor.uifunctions.setLayerMod(value);
                }
                return input;
            };

            var createCanvasBtn_mobile = function (name) {
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
                "firstArrive", "eachArrive", "blocks", "parallelDo", "map", "bgmap", "fgmap", "bg2map", "fg2map",
                "events", "changeFloor", "afterBattle", "afterGetItem", "afterOpenDoor", "cannotMove"
            ];
        }
        ////// 绘制背景和前景层 //////
        core.maps._drawBg_draw = function (floorId, toDrawCtx, cacheCtx, config) {
            config.ctx = cacheCtx;
            core.maps._drawBg_drawBackground(floorId, config);
            // ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制背景图块；后绘制的覆盖先绘制的。
            core.maps._drawFloorImages(floorId, config.ctx, 'bg', null, null, config.onMap);
            core.maps._drawBgFgMap(floorId, 'bg', config);
            if (config.onMap) {
                core.drawImage(toDrawCtx, cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
                core.clearMap('bg2');
                core.clearMap(cacheCtx);
            }
            core.maps._drawBgFgMap(floorId, 'bg2', config);
            if (config.onMap) core.drawImage('bg2', cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
            config.ctx = toDrawCtx;
        }
        core.maps._drawFg_draw = function (floorId, toDrawCtx, cacheCtx, config) {
            config.ctx = cacheCtx;
            // ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制前景图块；后绘制的覆盖先绘制的。
            core.maps._drawFloorImages(floorId, config.ctx, 'fg', null, null, config.onMap);
            core.maps._drawBgFgMap(floorId, 'fg', config);
            if (config.onMap) {
                core.drawImage(toDrawCtx, cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
                core.clearMap('fg2');
                core.clearMap(cacheCtx);
            }
            core.maps._drawBgFgMap(floorId, 'fg2', config);
            if (config.onMap) core.drawImage('fg2', cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
            config.ctx = toDrawCtx;
        }
        ////// 移动判定 //////
        core.maps._generateMovableArray_arrays = function (floorId) {
            return {
                bgArray: this.getBgMapArray(floorId),
                fgArray: this.getFgMapArray(floorId),
                eventArray: this.getMapArray(floorId),
                bg2Array: this._getBgFgMapArray('bg2', floorId),
                fg2Array: this._getBgFgMapArray('fg2', floorId)
            };
        }
    },
    "itemShop": function () {
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
            core.fillText("uievent", "购买", 32, 84, 'white', bigFont);
            core.fillText("uievent", "卖出", 152, 84);
            core.fillText("uievent", "离开", 272, 84);
            core.fillText("uievent", "当前" + useText, 374, 75, null, middleFont);
            core.setTextAlign("uievent", "right");
            core.fillText("uievent", core.formatBigNumber(core.status.hero.money), 466, 100);
            core.setTextAlign("uievent", "left");
            core.ui.drawUIEventSelector(1, "winskin.png", 22 + 120 * type, 76, 60, 33);
            if (selectItem != null) {
                core.setTextAlign('uievent', 'center');
                core.fillText("uievent", type == 0 ? "买入个数" : "卖出个数", 420, 360, null, bigFont);
                core.fillText("uievent", "<   " + selectCount + "   >", 420, 390);
                core.fillText("uievent", "确定", 420, 420);
            }

            // Step 2：获得列表并展示
            list = choices.filter(function (one) {
                if (one.condition != null && one.condition != '') {
                    try { if (!core.calValue(one.condition)) return false; } catch (e) { }
                }
                return (type == 0 && one.money != null) || (type == 1 && one.sell != null);
            });
            var per_page = 7;
            totalPage = Math.ceil(list.length / per_page);
            page = Math.floor((selectItem || 0) / per_page) + 1;

            // 绘制分页
            if (totalPage > 1) {
                var half = 180;
                core.setTextAlign('uievent', 'center');
                core.fillText('uievent', page + " / " + totalPage, half, 450, null, middleFont);
                if (page > 1) core.fillText('uievent', '上一页', half - 80, 450);
                if (page < totalPage) core.fillText('uievent', '下一页', half + 80, 450);
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
                core.fillText('uievent', core.material.items[item.id].name, 50, 148 + i * 40, null, bigFont);
                core.setTextAlign('uievent', 'right');
                core.fillText('uievent', (type == 0 ? core.calValue(item.money) : core.calValue(item.sell)) + useText + "/个", 340, 149 + i * 40, null, middleFont);
                core.setTextAlign("uievent", "left");
                if (curr == selectItem) {
                    // 绘制描述，文字自动放缩
                    var text = core.material.items[item.id].text || "该道具暂无描述";
                    try { text = core.replaceText(text); } catch (e) { }
                    for (var fontSize = 20; fontSize >= 8; fontSize -= 2) {
                        var config = { left: 10, fontSize: fontSize, maxWidth: 467 };
                        var height = core.getTextContentHeight(text, config);
                        if (height <= 60) {
                            config.top = (64 - height) / 2;
                            core.drawTextContent("uievent", text, config);
                            break;
                        }
                    }
                    core.ui.drawUIEventSelector(2, "winskin.png", 8, 137 + i * 40, 343, 40);
                    if (type == 0 && item.number != null) {
                        core.fillText("uievent", "存货", 370, 152, null, bigFont);
                        core.setTextAlign("uievent", "right");
                        core.fillText("uievent", item.number, 470, 152, null, null, 60);
                    } else if (type == 1) {
                        core.fillText("uievent", "数量", 370, 152, null, bigFont);
                        core.setTextAlign("uievent", "right");
                        core.fillText("uievent", core.itemCount(item.id), 470, 152, null, null, 40);
                    }
                    core.setTextAlign("uievent", "left");
                    core.fillText("uievent", "预计" + useText, 370, 280);
                    core.setTextAlign("uievent", "right");
                    totalMoney = selectCount * (type == 0 ? core.calValue(item.money) : core.calValue(item.sell));
                    core.fillText("uievent", core.formatBigNumber(totalMoney), 470, 310);

                    core.setTextAlign("uievent", "left");
                    core.fillText("uievent", type == 0 ? "已购次数" : "已卖次数", 370, 190);
                    core.setTextAlign("uievent", "right");
                    core.fillText("uievent", (type == 0 ? item.money_count : item.sell_count) || 0, 470, 220);
                }
            }

            core.setTextAlign('uievent', 'left');
            core.setTextBaseline('uievent', 'alphabetic');
        }

        var _add = function (item, delta) {
            if (item == null) return;
            selectCount = core.clamp(
                selectCount + delta, 0,
                Math.min(type == 0 ? Math.floor(core.status.hero[use] / core.calValue(item.money)) : core.itemCount(item.id),
                    type == 0 && item.number != null ? item.number : Number.MAX_SAFE_INTEGER)
            );
        }

        var _confirm = function (item) {
            if (item == null || selectCount == 0) return;
            if (type == 0) {
                core.status.hero[use] -= totalMoney;
                core.getItem(item.id, selectCount);
                if (item.number != null) item.number -= selectCount;
                item.money_count = (item.money_count || 0) + selectCount;
            } else {
                core.status.hero[use] += totalMoney;
                core.removeItem(item.id, selectCount);
                core.drawTip("成功卖出" + selectCount + "个" + core.material.items[item.id].name, item.id);
                if (item.number != null) item.number += selectCount;
                item.sell_count = (item.sell_count || 0) + selectCount;
            }
            selectCount = 0;
        }

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
                        if (type == 2)
                            core.insertAction({ "type": "break" });
                        else if (list.length > 0)
                            selectItem = 0;
                        break;
                    }
                    _confirm(item);
                    break;
                case 27: // ESC
                    if (selectItem == null) {
                        core.insertAction({ "type": "break" });
                        break;
                    }
                    selectItem = null;
                    break;
            }
        }

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
            if (px >= 262 && px <= 322 && py >= 81 && py <= 112) // 离开
                return core.insertAction({ "type": "break" });
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
        }

        this._performItemShopAction = function () {
            if (flags.type == 0) return this._performItemShopKeyBoard(flags.keycode);
            else return this._performItemShopClick(flags.px, flags.py);
        }

        this.openItemShop = function (itemShopId) {
            shopId = itemShopId;
            type = 0;
            page = 0;
            selectItem = null;
            selectCount = 0;
            core.isShopVisited(itemShopId);
            shopInfo = flags.__shops__[shopId];
            if (shopInfo.choices == null) shopInfo.choices = core.clone(core.status.shops[shopId].choices);
            choices = shopInfo.choices;
            use = core.status.shops[shopId].use;
            if (use != 'exp') use = 'money';
            useText = use == 'money' ? '金币' : '经验';

            core.insertAction([{
                "type": "while",
                "condition": "true",
                "data": [
                    { "type": "function", "function": "function () { core.plugin._drawItemShop(); }" },
                    { "type": "wait" },
                    { "type": "function", "function": "function() { core.plugin._performItemShopAction(); }" }
                ]
            },
            {
                "type": "function",
                "function": "function () { core.deleteCanvas('uievent'); core.ui.clearUIEventSelector(); }"
            }
            ]);
        }

    },
    "enemyLevel": function () {
        // 此插件将提供怪物手册中的怪物境界显示
        // 使用此插件需要先给每个怪物定义境界，方法如下：
        // 点击怪物的【配置表格】，找到“【怪物】相关的表格配置”，然后在【名称】仿照增加境界定义：
        /*
         "level": {
              "_leaf": true,
              "_type": "textarea",
              "_string": true,
              "_data": "境界"
         },
         */
        // 然后保存刷新，可以看到怪物的属性定义中出现了【境界】。再开启本插件即可。

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        // 这里定义每个境界的显示颜色；可以写'red', '#RRGGBB' 或者[r,g,b,a]四元数组
        var levelToColors = {
            "野蛮人": "white",
            "智人": "#FF0000",
            "": [255, 0, 0, 1],
        };

        // 复写 _drawBook_drawName
        var originDrawBook = core.ui._drawBook_drawName;
        core.ui._drawBook_drawName = function (index, enemy, top, left, width) {
            // 如果没有境界，则直接调用原始代码绘制
            if (!enemy.level) return originDrawBook.call(core.ui, index, enemy, top, left, width);
            // 存在境界，则额外进行绘制
            core.setTextAlign('ui', 'center');
            if (enemy.specialText.length == 0) {
                core.fillText('ui', enemy.name, left + width / 2,
                    top + 27, '#DDDDDD', this._buildFont(17, true));
                core.fillText('ui', enemy.level, left + width / 2,
                    top + 51, core.arrayToRGBA(levelToColors[enemy.level] || '#DDDDDD'), this._buildFont(14, true));
            } else {
                core.fillText('ui', enemy.name, left + width / 2,
                    top + 20, '#DDDDDD', this._buildFont(17, true), width);
                switch (enemy.specialText.length) {
                    case 1:
                        core.fillText('ui', enemy.specialText[0], left + width / 2,
                            top + 38, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'),
                            this._buildFont(14, true), width);
                        break;
                    case 2:
                        // Step 1: 计算字体
                        var text = enemy.specialText[0] + "  " + enemy.specialText[1];
                        core.setFontForMaxWidth('ui', text, width, this._buildFont(14, true));
                        // Step 2: 计算总宽度
                        var totalWidth = core.calWidth('ui', text);
                        var leftWidth = core.calWidth('ui', enemy.specialText[0]);
                        var rightWidth = core.calWidth('ui', enemy.specialText[1]);
                        // Step 3: 绘制
                        core.fillText('ui', enemy.specialText[0], left + (width + leftWidth - totalWidth) / 2,
                            top + 38, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'));
                        core.fillText('ui', enemy.specialText[1], left + (width + totalWidth - rightWidth) / 2,
                            top + 38, core.arrayToRGBA((enemy.specialColor || [])[1] || '#FF6A6A'));
                        break;
                    default:
                        core.fillText('ui', '多属性...', left + width / 2,
                            top + 38, '#FF6A6A', this._buildFont(14, true), width);
                }
                core.fillText('ui', enemy.level, left + width / 2,
                    top + 56, core.arrayToRGBA(levelToColors[enemy.level] || '#DDDDDD'), this._buildFont(14, true));
            }
        }

        // 也可以复写其他的属性颜色如怪物攻防等，具体参见下面的例子的注释部分
        core.ui._drawBook_drawRow1 = function (index, enemy, top, left, width, position) {
            // 绘制第一行
            core.setTextAlign('ui', 'left');
            var b13 = this._buildFont(13, true),
                f13 = this._buildFont(13, false);
            var col1 = left,
                col2 = left + width * 9 / 25,
                col3 = left + width * 17 / 25;
            core.fillText('ui', '生命', col1, position, '#DDDDDD', f13);
            core.fillText('ui', core.formatBigNumber(enemy.hp || 0), col1 + 30, position, /*'red' */ null, b13);
            core.fillText('ui', '攻击', col2, position, null, f13);
            core.fillText('ui', core.formatBigNumber(enemy.atk || 0), col2 + 30, position, /* '#FF0000' */ null, b13);
            core.fillText('ui', '防御', col3, position, null, f13);
            core.fillText('ui', core.formatBigNumber(enemy.def || 0), col3 + 30, position, /* [255, 0, 0, 1] */ null, b13);
        }


    },
    "heroFourFrames": function () {
        // 样板的勇士/跟随者移动时只使用2、4两帧，观感较差。本插件可以将四帧全用上。

        // 是否启用本插件
        var __enable = true;
        if (!__enable) return;

        ["up", "down", "left", "right"].forEach(function (one) {
            // 指定中间帧动画
            core.material.icons.hero[one].midFoot = 2;
        });

        var heroMoving = function (timestamp) {
            if (core.status.heroMoving <= 0) return;
            if (timestamp - core.animateFrame.moveTime > core.values.moveSpeed) {
                core.animateFrame.leftLeg++;
                core.animateFrame.moveTime = timestamp;
            }
            core.drawHero(['stop', 'leftFoot', 'midFoot', 'rightFoot'][core.animateFrame.leftLeg % 4], 4 * core.status.heroMoving);
        }
        core.registerAnimationFrame('heroMoving', true, heroMoving);

        core.events._eventMoveHero_moving = function (step, moveSteps) {
            var curr = moveSteps[0];
            var direction = curr[0],
                x = core.getHeroLoc('x'),
                y = core.getHeroLoc('y');
            // ------ 前进/后退
            var o = direction == 'backward' ? -1 : 1;
            if (direction == 'forward' || direction == 'backward') direction = core.getHeroLoc('direction');
            var faceDirection = direction;
            if (direction == 'leftup' || direction == 'leftdown') faceDirection = 'left';
            if (direction == 'rightup' || direction == 'rightdown') faceDirection = 'right';
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
                core.setHeroLoc('x', x + o * core.utils.scan2[direction].x, true);
                core.setHeroLoc('y', y + o * core.utils.scan2[direction].y, true);
                core.updateFollowers();
                curr[1]--;
                if (curr[1] <= 0) moveSteps.shift();
                core.setHeroLoc('direction', faceDirection);
                return step == 16;
            }
            return false;
        }
    },
    "fixed": function () {
        // 定点查看怪物属性及怪物属性界面重绘
        ////// 点击状态栏中的怪物手册时 //////
        main.statusBar.image.book.onclick = function (e) {
            e.stopPropagation();
            if (core.isReplaying()) {
                core.triggerReplay();
                return;
            }
            if (main.core.isPlaying()) {
                if (!main.core.getFlag("fixToBook"))
                    main.core.openBook(true);
                else main.core.useItem("wand");
            }
        };
        if (main.replayChecking) return;

        var selected = -1;
        var enemyList = [];
        var canvases = [];
        var size = core.__PIXELS__;
        var half = core.__HALF_SIZE__;
        var length = core.__SIZE__;
        var opened = false;
        var timeout = 0;

        /** 获取某个怪物的特殊属性
         * @param {string} enemy
         * @param {number} x
         * @param {number} y
         * @returns {string[]}
         */
        function getSpecial (enemy, x, y) {
            var e = core.getEnemyInfo(enemy, null, x, y);
            if (typeof e.special === 'number') e.special = [e.special];
            if (!e.special) e.special = [];
            var all = core.getSpecials();
            all = all.filter(function (v) { return e.special.includes(v[0]); });
            var texts = [];
            all.forEach(function (v) {
                var t = core.getSpecialHint(enemy, v[0]);
                texts.push(t);
            });
            return texts;
        }

        /** 获得指定怪物特殊属性名称
         * @param {Enemy} enemy
         */
        function getSpecialName (enemy, id) {
            var all = core.getSpecials();
            var text = [];
            if (typeof enemy.special === 'number') enemy.special = [enemy.special];
            all.forEach(function (v) {
                if (!enemy.special.includes(v[0])) return;
                text.push('\r[' + v[3] + ']' +
                    core.enemys._calSpecialContent(id, v[1]));
            });
            if (text.length === 0) return '无';
            return text.join('  ');
        }

        /** 获取属性的颜色 */
        function getAttributeColor (name) {
            switch (name) {
                case 'hp':
                    return '#3f3';
                case 'atk':
                    return '#f55';
                case 'def':
                    return '#79f';
                case 'point':
                    return '#ff8';
                case 'exp':
                    return 'green';
                case 'money':
                    return 'gold';
                default:
                    return 'white';
            }
        }

        /** 获取粗略信息
         * @param {number} index 
         * @param {number} x 
         * @param {number} y
         */
        function getRoughDetail (id, x, y) {
            var enemy = core.getEnemyInfo(id, null, x, y);
            var toDisplay = [];

            /** 由内容获取字符串 */
            function getString (data) {
                if (typeof data === 'string') return data;
                if (typeof data === 'number') return core.formatBigNumber(data);
                if (data instanceof Object) {
                    var arr = [];
                    Object.values(data).forEach(function (v) { arr.push(getString(v)); });
                    return arr;
                }
            }

            // 获取文字
            for (var i in enemy) {
                if (i === 'guards') continue;
                if (i === 'special') continue;
                if (core.flags.statusBarItems.indexOf('enableMoney') === -1 && i === 'money') continue;
                if (core.flags.statusBarItems.indexOf('enableExp') === -1 && i === 'exp') continue;
                if (!core.flags.enableAddPoint && i === 'point') continue;
                var t = getString(enemy[i]);
                toDisplay.push('\r[' + getAttributeColor(i) + ']' + core.getStatusLabel(i) + '\r[]' + '：' + t);
            }
            var damage = core.getDamageString(id, x, y);
            // 伤害
            toDisplay.push('伤害：\r[' + damage.color + ']' + damage.damage + '\r[]');
            toDisplay.push('特殊属性：' + getSpecialName(enemy, id));
            return toDisplay.join('\n');
        }

        /** 绘制怪物 */
        function drawEnemy (frame) {
            enemyList.forEach(function (v, i) {
                var info = core.getBlockInfo(v);
                info.posX = frame % info.animate;
                var ctx = core.getContextByName('fixed' + i);
                core.clearMap(ctx);
                core.drawImage(ctx, info.image, info.posX * 32, info.posY * 32, 32, 32, 0, 0, 32, 32);
            });
        }

        /** 绘制其余内容 */
        function drawOther () {
            // 退出
            var exit = core.createCanvas('fixedExit', 3, 3, 60, 22, 185);
            exit.canvas.className = 'fixed';
            exit.canvas.style.pointerEvents = 'auto';
            exit.canvas.style.backgroundColor = '#aaa';
            exit.canvas.style.border = '0.2em outset #ccc';
            exit.canvas.style.boxShadow = '0px 0px 0px black';
            exit.canvas.style.opacity = '0';
            exit.canvas.addEventListener('click', function () {
                close();
            });
            requestAnimationFrame(function () { exit.canvas.style.opacity = '1'; });
            core.setTextAlign(exit, 'center');
            core.fillText(exit, '退出', 30, 20, '#fff', '24px normal');
        }

        /** 当鼠标移动到怪物上时，绘制粗略信息 */
        function drawDetail (index, x, y) {
            var data = getRoughDetail(enemyList[index].event.id, x, y);
            var width = core.clamp((x > half ? x * 32 : ((length - x) * 32)) - 24, 0, 280);
            var left = x < half ? size - 20 - width : 10;
            var config = { maxWidth: width - 20, font: 'normal', fontSize: 19, left: 10 };
            var height = 500;
            while (height > size - 20) {
                config.fontSize--;
                height = core.getTextContentHeight(data, config) + 20;
            }
            var top = core.clamp(y * 32 - height / 2, 10, size - 20 - height);
            config.top = 10;
            config.time = 2;
            config.color = 'white';
            config.align = 'left';
            // 开始绘制
            var box = core.createCanvas('fixedBox', left, top, width, height, 190);
            box.canvas.className = 'fixed';
            box.canvas.style.border = 'thick double #32a1ce';
            box.canvas.style.opacity = '0';
            box.canvas.style.transition = 'opacity 0.2s linear';
            box.canvas.style.backgroundColor = '#333';
            box.canvas.style.boxShadow = '0px 0px 0px black';
            requestAnimationFrame(function () { box.canvas.style.opacity = '1'; });
            setTimeout(function () {
                clearInterval(core.status.event.interval);
                core.clearMap(box);
                core.drawTextContent(box, data, config);
            }, 250);
        }

        /** 鼠标移开时关闭详细信息 */
        function deleteDetail (immediate) {
            var box = core.getContextByName('fixedBox');
            clearTimeout(timeout);
            if (!box) return;
            if (immediate) {
                core.deleteCanvas(box);
                return;
            }
            box.canvas.style.opacity = '0';
            timeout = setTimeout(function () {
                core.deleteCanvas(box);
            }, 200);
        }

        /** 当点击怪物时，绘制所有详细信息 */
        function drawAllDetail (index, x, y, selected) {
            deleteDetail();
            var block = enemyList[index];
            // 移动怪物图标至中心上方
            var ctx = canvases[index];
            core.relocateCanvas(ctx, size / 2 - 16, 40);
            ctx.canvas.style.transform = 'scale(1.5)';
            ctx.canvas.style.border = 'none';
            ctx.canvas.style.zIndex = '210';
            ctx.canvas.style.backgroundColor = 'transparent';
            // 背景
            var back = core.createCanvas('fixedDBack', 0, 0, size, size, 200);
            back.canvas.style.backgroundColor = 'black';
            back.canvas.style.opacity = '0';
            back.canvas.style.pointerEvents = 'auto';
            back.canvas.addEventListener('click', function () {
                closeAllDetail(selected);
            });
            core.drawWindowSkin('winskin.png', back, 0, 0, size, size);
            requestAnimationFrame(function () { back.canvas.style.opacity = '1'; });
            // 绘制攻防等 特殊属性暂且不管
            var data = getRoughDetail(block.event.id, x, y).split('\n');
            data.pop();
            // 确定每一边要绘制的行数
            var left = Math.ceil(data.length / 2);
            var right = data.length - left;
            // 绘制左边
            for (var i = 0; i < left; i++) {
                var config = { left: 10, top: 10 + i * 64 / left, fontSize: 18 };
                core.drawTextContent(back, data[i], config);
            }
            // 绘制右边
            for (var i = data.length % 2 === 0 ? right : right + 1; i < data.length; i++) {
                var config = { left: size / 2 + 42, top: 10 + (i - left) * 64 / right, fontSize: 18 };
                core.drawTextContent(back, data[i], config);
            }
            // 绘制分割线
            core.drawLine(back, 6, 100, size - 6, 100, 'white', 1);
            core.drawLine(back, 3, 180, size - 3, 180, 'white', 1);
            // 回合数
            var damageInfo = core.getDamageInfo(block.event.id, null, x, y);
            var config = { left: 10, top: 80, fontSize: 18 };
            core.drawTextContent(back, "\r[#FF6A6A]\\d战斗回合数：\\d\r[]" + ((damageInfo || {}).turn || 0), config)
            // 临界表
            var criticals = core.enemys.nextCriticals(block.event.id, 8, x, y).map(function (v) {
                return core.formatBigNumber(v[0]) + ":" + core.formatBigNumber(v[1]);
            });
            while (criticals[0] == '0:0') criticals.shift();
            var config = { left: 10, top: 105, maxWidth: size - 20, fontSize: 18 };
            var text = "\r[#FF6A6A]\\d临界表：\\d\r[]" + JSON.stringify(criticals);
            core.drawTextContent(back, text, config);
            // 绘制特殊属性说明
            var specials = getSpecial(block.event.id, x, y);
            if (specials.length !== 0) core.fillRect(back, 3, 180, size - 6, size - 183, 'rgba(0,0,0,0.8)');
            var text = specials.join('\n');
            var config = { top: 190, left: 10, maxWidth: size - 20, fontSize: 18 };
            while (core.getTextContentHeight(text, config) > size - 200) config.fontSize--;
            core.drawTextContent(back, text, config);
        }

        /** 关闭详细属性页面 */
        function closeAllDetail (selected) {
            var ctx = canvases[selected];
            core.relocateCanvas(ctx, enemyList[selected].x * 32, enemyList[selected].y * 32);
            ctx.canvas.style.transform = 'none';
            ctx.canvas.style.border = '0.1em ridge';
            ctx.canvas.style.backgroundColor = '#555';
            ctx.canvas.style.pointerEvents = 'auto';
            ctx.canvas.style.zIndex = '180';
            core.deleteCanvas('fixedDBack');
        }

        /** 获得怪物 */
        function getEnemy () {
            var all = core.searchBlockWithFilter(function (v) {
                return v.event.cls.startsWith('enemy');
            });
            all.forEach(function (v, i) {
                enemyList.push(v.block);
                var enemy = core.createCanvas('fixed' + i, v.x * 32, v.y * 32, 32, 32, 180);
                enemy.canvas.className = 'fixed';
                enemy.canvas.style.opacity = '0';
                enemy.canvas.style.pointerEvents = 'auto';
                enemy.canvas.style.backgroundColor = '#555';
                requestAnimationFrame(function () { enemy.canvas.style.opacity = '1'; });
                canvases.push(enemy);
                // 鼠标移动到怪物上面
                enemy.canvas.addEventListener('mouseenter', function () {
                    var index = parseInt(this.id.match(/[0-9]+/)[0]);
                    selected = index;
                    drawDetail(index, enemyList[index].x, enemyList[index].y);
                });
                // 鼠标点击
                enemy.canvas.addEventListener('click', function () {
                    var index = parseInt(this.id.match(/[0-9]+/)[0]);
                    if (selected === index) {
                        var block = enemyList[index];
                        drawAllDetail(index, block.x, block.y, selected);
                        this.style.pointerEvents = 'none';
                        selected === -1;
                    }
                });
                // 鼠标离开
                enemy.canvas.addEventListener('mouseleave', function () {
                    selected = -1;
                    deleteDetail();
                });
            });
            drawEnemy(core.status.globalAnimateStatus);
        }

        /** 关闭界面 */
        function close () {
            core.playSound('光标移动');
            var all = Object.values(core.dymCanvas).filter(function (v) { return v.canvas.id.startsWith('fixed'); });
            all.forEach(function (v) {
                v.canvas.style.opacity = '0';
            });
            setTimeout(function () {
                core.deleteCanvas(function (name) { return name.startsWith('fixed'); });
                clearTimeout(timeout);
                enemyList = [];
                canvases = [];
                selected = -1;
                core.unlockControl();
            }, 600);
        }

        /** 打开 */
        this.openFixed = function () {
            if (Object.keys(core.dymCanvas).some(function (v) { return v.startsWith('fixed'); }));
            core.lockControl();
            var back = core.createCanvas('fixedBack', 0, 0, size, size, 180);
            back.canvas.className = 'fixed';
            back.canvas.style.opacity = '0';
            back.canvas.style.backgroundColor = 'black';
            requestAnimationFrame(function () { back.canvas.style.opacity = '0.9'; });
            drawOther();
            getEnemy();
            opened = true;
        }

        control.prototype._animationFrame_globalAnimate = function (timestamp) {
            if (timestamp - core.animateFrame.globalTime <= core.values.animateSpeed) return;
            core.status.globalAnimateStatus++;
            if (opened) {
                drawEnemy(core.status.globalAnimateStatus);
            }
            if (core.status.floorId) {
                // Global Animate
                core.status.globalAnimateObjs.forEach(function (block) {
                    core.drawBlock(block, core.status.globalAnimateStatus);
                });

                // Global floor images
                core.maps._drawFloorImages(core.status.floorId, core.canvas.bg, 'bg', core.status.floorAnimateObjs || [], core.status.globalAnimateStatus);
                core.maps._drawFloorImages(core.status.floorId, core.canvas.fg, 'fg', core.status.floorAnimateObjs || [], core.status.globalAnimateStatus);

                // Global Autotile Animate
                core.status.autotileAnimateObjs.forEach(function (block) {
                    core.maps._drawAutotileAnimate(block, core.status.globalAnimateStatus);
                });

                // Global hero animate
                if ((core.status.hero || {}).animate && core.status.heroMoving == 0 && main.mode == 'play' && !core.status.preview.enabled) {
                    core.drawHero('stop', null, core.status.globalAnimateStatus);
                }
            }
            // Box animate
            core.drawBoxAnimate();
            core.animateFrame.globalTime = timestamp;
        }
        core.registerAnimationFrame('globalAnimate', true, control.prototype._animationFrame_globalAnimate);

        ////// 获得每个特殊属性的说明 //////
        enemys.prototype.getSpecialHint = function (enemy, special) {
            var specials = this.getSpecials();

            if (special == null) {
                if (specials == null) return [];
                var hints = [];
                for (var i = 0; i < specials.length; i++) {
                    if (this.hasSpecial(enemy, specials[i][0]))
                        hints.push("\r[" + core.arrayToRGBA(specials[i][3] || "#FF6A6A") + "]\\d" + this._calSpecialContent(enemy, specials[i][1]) +
                            "：\\d\r[]" + this._calSpecialContent(enemy, specials[i][2]));
                }
                return hints;
            }

            if (specials == null) return "";
            for (var i = 0; i < specials.length; i++) {
                if (special == specials[i][0])
                    return "\r[" + core.arrayToRGBA(specials[i][3] || "#FF6A6A") + "]\\d" + this._calSpecialContent(enemy, specials[i][1]) +
                        "：\\d\r[]" + this._calSpecialContent(enemy, specials[i][2]);
            }
            return "";
        }
    },
    "itemDetail": function () {
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
            core.setFont(ctx, "15px normal");
            core.setTextAlign(ctx, 'left');
            core.status.damage.data.forEach(function (one) {
                var px = one.px,
                    py = one.py;
                if (onMap && core.bigmap.v2) {
                    px -= core.bigmap.posX * 32;
                    py -= core.bigmap.posY * 32;
                    if (px < -32 * 2 || px > core.__PIXELS__ + 32 || py < -32 || py > core.__PIXELS__ + 32)
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
                    if (px < -32 || px > core.__PIXELS__ + 32 || py < -32 || py > core.__PIXELS__ + 32)
                        return;
                }
                core.fillBoldText(ctx, one.text, px, py, one.color);
            });
        };
        ////// 更改地图画布的尺寸 //////
        maps.prototype.resizeMap = function (floorId) {
            floorId = floorId || core.status.floorId;
            if (!floorId) return;
            core.bigmap.width = core.floors[floorId].width;
            core.bigmap.height = core.floors[floorId].height;
            core.bigmap.posX = core.bigmap.posY = 0;

            core.bigmap.v2 = core.bigmap.width * core.bigmap.height > core.bigmap.threshold / 4;
            var width = core.bigmap.v2 ? core.__PIXELS__ + 64 : core.bigmap.width * 32;
            var height = core.bigmap.v2 ? core.__PIXELS__ + 64 : core.bigmap.height * 32;

            core.bigmap.canvas.forEach(function (cn) {
                if (core.domStyle.hdCanvas.indexOf(cn) >= 0)
                    core.maps._setHDCanvasSize(core.canvas[cn], width, height);
                else {
                    core.canvas[cn].canvas.width = width;
                    core.canvas[cn].canvas.height = height;
                }
                core.canvas[cn].canvas.style.width = width * core.domStyle.scale + "px";
                core.canvas[cn].canvas.style.height = height * core.domStyle.scale + "px";
                core.canvas[cn].translate(core.bigmap.v2 ? 32 : 0, core.bigmap.v2 ? 32 : 0);
                if (main.mode === 'editor' && editor.isMobile) {
                    core.canvas[cn].canvas.style.width = width / core.__PIXELS__ * 96 + "vw";
                    core.canvas[cn].canvas.style.height = height / core.__PIXELS__ * 96 + "vw";
                }
            });
        };
        core.formatBigNumber = function (x, onMap, onCritical) {
            x = Math.floor(parseFloat(x));
            if (!core.isset(x) || !Number.isFinite(x)) return '???';
            if (x > 1e24 || x < -1e24) return x.toExponential(2);
            var c = x < 0 ? "-" : "";
            if (onCritical) c = '-> ';
            x = Math.abs(x);
            if (x <= 9999 || (!onMap && x <= 999999)) return c + x;
            var all = [
                { "val": 1e20, "c": "g" },
                { "val": 1e16, "c": "j" },
                { "val": 1e12, "c": "z" },
                { "val": 1e8, "c": "e" },
                { "val": 1e4, "c": "w" },
            ]
            for (var i = 0; i < all.length; i++) {
                var one = all[i];
                if (onMap) {
                    if (x >= one.val) {
                        var v = x / one.val;
                        return c + v.toFixed(Math.max(0, Math.floor((c == "-" ? 2 : 3) - Math.log10(v + 1)))) + one.c;
                    }
                } else {
                    if (x >= 10 * one.val) {
                        var v = x / one.val;
                        return c + v.toFixed(Math.max(0, Math.floor(4 - Math.log10(v + 1)))) + one.c;
                    }
                }
            }
            return c + x;
        };
        // 获取宝石信息 并绘制
        this.getItemDetail = function (floorId) {
            if (!core.getFlag("itemDetail")) return;
            floorId = floorId || core.status.thisMap.floorId;
            core.status.maps[floorId].blocks.forEach(function (block) {
                var x = block.x,
                    y = block.y;
                // v2优化，只绘制范围内的部分
                if (core.bigmap.v2) {
                    if (x < core.bigmap.posX - core.bigmap.extend || x > core.bigmap.posX + core.__SIZE__ + core.bigmap.extend ||
                        y < core.bigmap.posY - core.bigmap.extend || y > core.bigmap.posY + core.__SIZE__ + core.bigmap.extend) {
                        return;
                    }
                }
                if (block.event.cls == "items" && block.event.id != "superPotion") {
                    var before = core.clone(core.status.hero),
                        id = block.event.id;
                    // 跟数据统计原理一样 执行效果 前后比较
                    core.setFlag("__statistics__", true);
                    try {
                        eval(core.material.items[id].itemEffect);
                    } catch (error) { }
                    var diff = core.compareObject(before, core.status.hero);
                    core.status.hero = before;
                    window.hero = core.status.hero;
                    window.flags = core.status.hero.flags;
                    core.drawItemDetail(diff, block.x, block.y, floorId, id);
                }
            });
        };
        // 比较两个对象之间每一项的数值差异（弱等于） 返回数值差异
        this.compareObject = function (a, b) {
            a = a || {};
            b = b || {};
            var diff = {}; // 差异
            for (var name in a) {
                if (a[name] != b[name]) { // a != b
                    try {
                        diff[name] = b[name] - (a[name] || 0);
                    } catch (error) { }
                    if (isNaN(diff[name])) delete diff[name];
                    if (diff[name] == 0) delete diff[name];
                }
            }
            return diff;
        };
        // 绘制
        this.drawItemDetail = function (diff, x, y, floorId, id) {
            if (core.same(diff, {}) || !diff) return;
            var px = 32 * x + 2,
                py = 32 * y + 30;
            var content = "";
            // 获得数据和颜色
            var i = 0;
            for (var name in diff) {
                var color = "#ffffff"
                diff[name] = core.formatBigNumber(diff[name], true);
                switch (name) {
                    case 'atk':
                        color = "#FF7A7A";
                        break;
                    case 'def':
                        color = "#00E6F1";
                        break;
                    case 'mdef':
                        color = "#6EFF83";
                        break;
                    case 'hp':
                        color = "#A4FF00";
                        break;
                    case 'hpmax':
                        color = "#F9FF00";
                        break;
                    case 'mana':
                        color = "#cc6666";
                        break;
                }
                content = diff[name];
                // 绘制
                core.status.damage.data.push({ text: content, px: px, py: py - 10 * i, color: color });
                i++;
            }
        }
    },
    "checkEnemy": function () {
        // 检查漏怪
        this.checkEnemy = function (floorIds) {
            var enemys = [],
                result = "当前剩余怪物：\n",
                have = false,
                skipEnemy = [], // 略过怪物
                whetherSkip = false;
            switch (floorIds[0]) {
                default: skipEnemy = [];
            }
            // 是否为略过怪物
            function skip (enemy) {
                for (var a = 0; a < skipEnemy.length; a++) {
                    if (enemy.id == skipEnemy[a]) {
                        whetherSkip = true;
                    }
                }
                return whetherSkip;
            }
            // 检查漏怪
            for (var i = 1; i < floorIds.length; i++) {
                var floorId = floorIds[i];
                if (core.enemys.getCurrentEnemys(floorId).length > 0) {
                    // 若当前地图的怪物数量大于0，则遍历每个图块
                    core.status.maps[floorId].blocks.forEach(function (block) {
                        if (core.isset(block.event) && !block.disable) {
                            var id = block.event.id,
                                enemy = core.material.enemys[id];
                            if (enemy) { // 是否是怪物 是否略过
                                if (!skip(enemy)) {
                                    if (enemys.length == 0) {
                                        enemys.push([enemy.id, enemy.name, 1, floorId]);
                                    } else {
                                        for (var j = 0; j < enemys.length; j++) { // 是否重复
                                            if (enemys[j][0] == enemy.id && enemys[j][3] == floorId) {
                                                enemys[j][2]++; // 重复则数量+1
                                                have = true;
                                                break;
                                            }
                                        }
                                        if (!have) { // 不重复新增一项
                                            enemys.push([enemy.id, enemy.name, 1, floorId]);
                                        }
                                        have = false; // 重置
                                    }
                                }
                                whetherSkip = false; // 重置
                            }
                        }
                    });
                }
            }
            if (enemys.length > 0) { // 楼层名
                for (var i = 0; i < enemys.length; i++) {
                    enemys[i][3] = core.floors[enemys[i][3]].title + "（" + enemys[i][3] + "）";
                }
            }
            if (enemys.length > 0 && enemys.length < 15) { // 输出结果 个数较少
                for (var i = 0; i < enemys.length; i++) {
                    result += enemys[i][3] + ":" + enemys[i][1] + " × " + enemys[i][2];
                    if (i != enemys.length - 1) result += "\n";
                }
            } else if (enemys.length == 0) { // 没有怪物
                result = "当前无剩余怪物！"
            } else { // 怪物较多
                var number = 0;
                for (var i = 0; i < enemys.length; i++) {
                    number += enemys[i][2]; // 总个数
                }
                result = "当前剩余怪物较多，请手动检查，当前剩余" + number + "个\n分布楼层：\n";
                for (var j = 0; j < 100; j++) { // 除去重复楼层
                    for (var i = 0; i < enemys.length - 1; i++) {
                        if (enemys[i][3] == enemys[i + 1][3]) {
                            enemys.splice(i, 1);
                            i--;
                        }
                    }
                }
                for (var i = 0; i < enemys.length; i++) { // 结果
                    result += enemys[i][3];
                    if (i != enemys.length - 1) result += "\n";
                }
            }
            core.setFlag("remainEnemy", result); // 赋给flag
            core.setFlag("enemyNumber", enemys.length);
            core.insertAction([{
                "type": "if",
                "condition": "(flag:enemyNumber == 0)",
                "true": [
                    "${flag:remainEnemy}",
                    { "type": "hide", "remove": true },
                ],
                "false": [
                    "${flag:remainEnemy}",
                ]
            },]);
        }
    },
    "chapter": function () {
        // 章节显示
        var chapter = "",
            description = "";
        // 显示章节
        this.displayChapter = function (index) {
            if (core.isReplaying()) return;
            var number = core.replaceNumberWithChinese(index);
            // 获取第几章
            chapter = "第" + number + "章";
            if (index == 0) chapter = "序章";
            // 获取描述
            switch (index) {
                case 0:
                    description = "起源";
                    break;
                case 1:
                    description = "勇气";
                    break;
                case 2:
                    description = "智慧";
                    break;
            }
            core.coreChapterAnimate(chapter, description);
        };
        // 替换数字大小写
        this.replaceNumberWithChinese = function (number) {
            if (number == 0) return "零";
            if (number == 1) return "一";
            if (number == 2) return "二";
            if (number == 3) return "三";
            if (number == 4) return "四";
            if (number == 5) return "五";
            if (number == 6) return "六";
            if (number == 7) return "七";
            if (number == 8) return "八";
            if (number == 9) return "九";
            if (number == 10) return "十";
        };
        // 核心动画运算
        this.coreChapterAnimate = function (chapter, description) {
            // 先建画布
            if (core.isReplaying()) return;
            core.createCanvas("chapter", 0, 0, 480, 480, 100);
            var frame = 0,
                speed = 0,
                left = -480,
                down = 240;
            // 一秒50帧
            core.lockControl();
            var interval = setInterval(function () {
                core.clearMap("chapter");
                speed = core.hyperbolicCosine((frame - 84) * 0.05);
                left += speed / 2;
                // 背景
                if (frame <= 110) {
                    core.fillRect("chapter", 0, -240 - left, 480, left + 480, "#000000");
                    core.fillRect("chapter", 0, 240, 480, left + 480, "#000000");
                } else {
                    core.fillRect("chapter", 0, 0, 480, down, "#000000");
                    core.fillRect("chapter", 0, 480 - down, 480, down, "#000000");
                    down -= speed / 2;
                }
                // 中间矩形
                if (frame <= 100) {
                    core.fillRect("chapter", 0, 240 - frame / 5, 480, frame / 2.5, [255, 255, 255, 0.5 + frame / 200]);
                } else {
                    core.fillRect("chapter", 0, 240 - (2100 / (205 - frame)), 480, 4200 / (205 - frame), [255, 255, 255, (175 - frame) / 75]);
                }
                // 上下方线
                core.fillRect("chapter", left, 210, 300, 10, "#FF4D00");
                core.fillRect("chapter", 180 - left, 260, 300, 10, "#2DFFFC");
                core.fillRect("chapter", left + 310, 210, 10, 10, "#FF4D00");
                core.fillRect("chapter", 160 - left, 260, 10, 10, "#2DFFFC");
                core.fillPolygon("chapter", [
                    [left + 330, 210],
                    [left + 330, 220],
                    [left + 340, 220]
                ], "#FF4D00");
                core.fillPolygon("chapter", [
                    [150 - left, 260],
                    [140 - left, 260],
                    [150 - left, 270]
                ], "#2DFFFC");
                // 闪光条
                for (var i = 5; i > 0; i--) {
                    if (frame <= 150) {
                        core.drawLine("chapter", 0, 220, left + 320, 220, [255, 255, 255, 0.4], i);
                        core.drawLine("chapter", 480, 260, 160 - left, 260, [255, 255, 255, 0.4], i);
                    } else {
                        core.drawLine("chapter", 0, 220, left + 320, 220, [255, 255, 255, 0.4 - (frame - 150) / 125], i);
                        core.drawLine("chapter", 480, 260, 160 - left, 260, [255, 255, 255, 0.4 - (frame - 150) / 125], i);
                    }
                }
                core.fillEllipse("chapter", left + 320, 220, 7, 3, 0, [255, 255, 255, 0.8]);
                core.fillEllipse("chapter", left + 320, 220, 2, 10, 0, [255, 255, 255, 0.8]);
                core.fillEllipse("chapter", 160 - left, 260, 7, 3, 0, [255, 255, 255, 0.8]);
                core.fillEllipse("chapter", 160 - left, 260, 2, 10, 0, [255, 255, 255, 0.8]);
                // 字
                core.setTextAlign("chapter", "center");
                core.fillBoldText("chapter", chapter + " " + description, left + 360, 250, "#ffffff", "#000000", "28px scroll");
                if (frame >= 200) {
                    clearInterval(interval);
                    core.deleteCanvas("chapter");
                    core.unlockControl();
                }
                if (frame == 80) core.playSound("chapter.mp3");
                frame++;
            }, 20);
        };
        // 返回双曲余弦值
        this.hyperbolicCosine = function (number) {
            return 0.5 * (Math.pow(Math.E, number) + Math.pow(Math.E, -number));
        }
    },
    "intelligenceTree": function () {
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
                [0, "力量", "力量就是根本！可以通过智慧增加力量", 0, 10 * levels[0] + 10, null, [1, 2], 10, 1, "攻击＋" + (levels[0] * 2)],
                [1, "致命一击", "爆发出全部力量攻击敌人", 0, 30 * levels[1] + 30, [0, 5],
                    [2, 1], 10, 1, "每回合额外伤害＋" + (levels[1] * 5)
                ],
                [2, "断灭之刃", "\\r[#dddd44]主动技能\\r[]，开启后会在战斗时会额外增加一定量的攻击， 但同时减少一定量的防御，快捷键1", 0, 200 * levels[2] + 400, [1, 5],
                    [4, 1], 5, 1, levels[2] * 10 + "%攻击加成，减少" + levels[2] * 10 + "%的防御"
                ],
                [3, "坚韧", "由智慧转化出坚韧！", 0, 10 * levels[3] + 10, null, [1, 4], 10, 1, "防御+" + levels[3] * 2],
                [4, "回春", "让智慧化为治愈之泉水！", 0, 20 + levels[4] * 20, [3, 5],
                    [2, 5], 25, 1, "每回合回复" + 1 * levels[4] + "生命"
                ],
                [5, "治愈之泉", "让生命变得更多一些吧！每吃50瓶血瓶就增加当前生命回复10%的生命回复", 0, 1500, [4, 25],
                    [4, 5], 1, 1, "50瓶血10%生命回复"
                ],
                [6, "坚固之盾", "让护甲更加坚硬一些吧！", 0, 50 + levels[6] * 50, [3, 5],
                    [2, 3], 10, 1, "防御+" + 10 * levels[6]
                ],
                [7, "无上之盾", "\\r[#dddd44]第一章终极技能\\r[]，战斗时智慧会充当等量护盾", 0, 2500, [6, 10, 5, 1, 2, 2],
                    [5, 3], 1, 1, "战斗时智慧会充当护盾"
                ],
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
                    core.setFlag("bladeOn", true);
                    break;
                case 3: // 坚韧 +2防御
                    core.status.hero.def += 2;
                    break;
                case 4: // 回春 +1回复
                    core.status.hero.hpmax += 1;
                    break;
                case 5: // 治愈之泉
                    core.setFlag("spring", true);
                    break;
                case 6: // 坚固之盾 +10防御
                    core.status.hero.def += 10;
                    break;
                case 7: // 无上之盾
                    core.setFlag("superSheild", true);
                    break;
            }
            core.status.hero.mdef -= list[index][4];
        };
        // 由光标位置获得索引
        this.getIdBySelector = function (x, y, page) {
            for (var i in list) {
                if (list[i][8] == page && x == list[i][6][0] && y == list[i][6][1]) {
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
            core.createCanvas("tree", 0, 0, 480, 480, 130);
            // 背景
            core.fillRect("tree", 0, 0, 480, 480, [0, 0, 0, 0.95]);
            core.drawLine("tree", 0, 172, 480, 172, [200, 200, 200, 0.95], 1);
            core.drawLine("tree", 308, 172, 308, 480, [200, 200, 200, 0.95], 1);
            core.drawLine("tree", 308, 450, 480, 450, [200, 200, 200, 0.95], 1);
            core.drawLine("tree", 308, 220, 480, 220, [200, 200, 200, 0.95], 1);
            core.drawLine("tree", 308, 413, 480, 413, [200, 200, 200, 0.95], 1);
            for (var i = 0; i <= 239; i++) {
                core.drawLine("tree", i, 40, 480 - i, 40, [0, 255, 107, 0.002], 2);
            }
            // 每一项技能图标
            for (var i in list) {
                if (list[i][8] != currPage) continue;
                // 技能间的线
                for (var j = 0; j < list[i][5].length; j += 2) {
                    if (!list[i][5]) break;
                    if (levels[list[i][5][j]] < list[i][5][j + 1])
                        core.drawLine("tree", list[list[i][5][j]][6][0] * 56 - 14, list[list[i][5][j]][6][1] * 56 + 158,
                            list[i][6][0] * 56 - 14, list[i][6][1] * 56 + 158, "#aaaaaa", 1);
                    else core.drawLine("tree", list[list[i][5][j]][6][0] * 56 - 14, list[list[i][5][j]][6][1] * 56 + 158,
                        list[i][6][0] * 56 - 14, list[i][6][1] * 56 + 158, "#00FF88", 1);
                }
            }
            // 图标
            for (var i in list) {
                // 图标
                core.drawImage("tree", "skill" + i + ".png", 0, 0, 114, 114, list[i][6][0] * 56 - 28, list[i][6][1] * 56 + 144, 28, 28);
                // 方框
                if (levels[i] == 0)
                    core.strokeRect("tree", list[i][6][0] * 56 - 28, list[i][6][1] * 56 + 144, 28, 28, "#888888", 1);
                else if (levels[i] == list[i][7])
                    core.strokeRect("tree", list[i][6][0] * 56 - 28, list[i][6][1] * 56 + 144, 28, 28, "#F7FF68", 1);
                else
                    core.strokeRect("tree", list[i][6][0] * 56 - 28, list[i][6][1] * 56 + 144, 28, 28, "#00FF69", 1);
                // 光标
                core.strokeRect("tree", selector[0] * 56 - 28, selector[1] * 56 + 144, 28, 28, "#ffff00", 1);
            }
            // 说明
            core.setTextAlign("tree", "center");
            core.fillText("tree", name, 240, 30, "#00FFD5", "28px normal");
            core.setTextAlign("tree", "left")
            core.drawTextContent("tree", "     " + description, { left: 10, top: 42, maxWidth: 460, font: "normal", fontSize: 18 });
            // 效果
            if (level != 0)
                core.drawTextContent("tree", "当前效果：" + effect, { left: 10, top: 122, maxWidth: 460, font: "normal", fontSize: 18 });
            if (level != max) {
                flags.levels[id] += 1;
                core.initializeList(false);
                effect = list[id][9];
                core.drawTextContent("tree", "下一级效果：" + effect, { left: 10, top: 147, maxWidth: 460, font: "normal", fontSize: 18 });
                flags.levels[id]--;
                core.initializeList(false);
                effect = list[id][9];
            }
            core.setTextAlign("tree", "center");
            // 等级
            core.fillText("tree", "等级：" + level + "/" + max, 394, 190, "#ffffff", "18px normal");
            // 升级
            if (level != max)
                core.fillText("tree", "升级花费：" + cost, 394, 210, "#ffffff", "18px normal");
            // 退出
            core.fillText("tree", "退出", 394, 470, "#ffffff", "18px normal");
            // 页码数
            var text = core.replaceNumberWithChinese(currPage);
            core.fillText("tree", "第" + text + "章", 394, 440, "#ffffff", "24px normal");
            if (currPage != 1) core.fillText("tree", "<", 334, 440, "#ffffff", "24px normal");
            if (currPage != flags.chapter) core.fillText("tree", ">", 454, 440, "#ffffff", "24px normal");
            // 前置技能
            core.fillText("tree", "前置技能", 394, 245, "#ffffff", "20px normal");
            if (foreSkill.length > 0) {
                for (var i = 0; i < foreSkill.length; i += 2) {
                    core.fillText("tree", foreSkill[i + 1] + "级  " + list[foreSkill[i]][1], 394, 270 + 10 * i);
                }
            }
        };
        // 升级操作
        this.upgradeTree = function (index) {
            // 执行操作
            if (levels[index] == list[index][7]) {
                core.playSound("操作失败");
                core.insertAction(["该技能已满级！"]);
                return;
            }
            // 判断前置技能
            var fore = list[index][5];
            for (var i = 0; i < fore.length; i += 2) {
                if (levels[fore[i]] < fore[i + 1]) {
                    core.playSound("操作失败");
                    core.insertAction(["前置技能未满足！"]);
                    return;
                }
            }
            if (core.status.hero.mdef < list[index][4]) {
                core.playSound("操作失败");
                core.insertAction(["智慧点不足！"]);
                return;
            }
            flags.levels[index]++;
            core.treeEffect(index);
            // 刷新
            core.drawTree(false);
            core.updateStatusBar();
            core.updateDamage();
            // 音效
            core.playSound("tree.mp3");
            core.insertAction([
                { "type": "sleep", "time": 100, "noSkip": true },
            ]);
        };
        // 上下左右
        this.moveSelector = function (keycode, times) {
            times = times || 0;
            core.playSound("光标移动");
            if (keycode == 37 || keycode == 39) { // left right
                if (times > 3) { // 正左右没有东西 移动至下一列
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
                for (var i in list) { // 正左右有技能 移动至最近的技能
                    if (list[i][8] != currPage) continue;
                    if (list[i][6][0] == selector[0] && list[i][6][1] == selector[1]) {
                        selector = list[i][6];
                        return;
                    }
                }
                return core.moveSelector(keycode, times + 1);
            } else { // up down
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
                    if (list[i][6][1] == selector[1] && list[i][6][0] == selector[0]) {
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
                var id = core.getIdBySelector(selector[0], selector[1], currPage);
                core.upgradeTree(id);
            } else {
                for (var i in list) {
                    if (list[i][8] != currPage) continue;
                    if (list[i][6][0] == x && list[i][6][1] == y) {
                        selector = [x, y];
                        core.playSound("光标移动");
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
                    core.playSound("取消");
                    core.insertAction({ "type": "break" });
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
                core.playSound("取消");
                core.insertAction({ "type": "break" });
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
            core.playSound("打开界面");
            core.insertAction([{
                "type": "while",
                "condition": "true",
                "data": [
                    { "type": "function", "function": "function () { core.plugin.drawTree(false); }" },
                    { "type": "wait" },
                    { "type": "function", "function": "function() { core.plugin.actTree(); }" }
                ]
            },
            {
                "type": "function",
                "function": "function () { core.deleteCanvas('tree');}"
            }
            ]);
        };
    },
    "skills": function () {
        // 所有的主动技能效果
        var ignoreInJump = {
            event: ['X20007', 'X20001', 'X20006', 'X20014', 'X20010', 'X20007'],
            bg: ['X20037', 'X20038', 'X20039', 'X20045', 'X20047', 'X20053',
                'X20054', 'X20055', 'X20067', 'X20068', 'X20075', 'X20076']
        };
        // 跳跃
        this.jumpSkill = function () {
            if (core.status.floorId.startsWith("tower")) return core.drawTip("当无法使用该技能");
            if (!flags.skill2) return;
            if (!flags['jump_' + core.status.floorId]) flags['jump_' + core.status.floorId] = 0;
            if (core.status.floorId == 'MT14' && flags['jump_' + core.status.floorId] == 2 && !flags.MT14Jump) {
                if (!(core.status.hero.loc.x == 77 && core.status.hero.loc.y == 5 && core.status.hero.loc.direction == 'right')) {
                    return core.drawTip("该地图还有一个必跳的地方，你还没有跳");
                } else flags.MT14Jump = true;
            }
            if (flags['jump_' + core.status.floorId] >= 3) return core.drawTip('当前地图使用次数已用完');
            core.autosave();
            var direction = core.status.hero.loc.direction;
            var loc = core.status.hero.loc;
            var checkLoc = {};
            switch (direction) {
                case "up":
                    checkLoc.x = loc.x;
                    checkLoc.y = loc.y - 1;
                    break;
                case "right":
                    checkLoc.x = loc.x + 1;
                    checkLoc.y = loc.y;
                    break;
                case "down":
                    checkLoc.x = loc.x;
                    checkLoc.y = loc.y + 1;
                    break;
                case "left":
                    checkLoc.x = loc.x - 1;
                    checkLoc.y = loc.y;
                    break;
            }
            // 前方是否可通行 或 是怪物
            var cls = core.getBlockCls(checkLoc.x, checkLoc.y);
            var noPass = core.noPass(checkLoc.x, checkLoc.y);
            var id = core.getBlockId(checkLoc.x, checkLoc.y) || '';
            var bgId = core.getBlockByNumber(core.getBgNumber(checkLoc.x, checkLoc.y)).event.id || '';
            // 可以通行
            if (!noPass || cls == "items" || (id.startsWith('X') && !ignoreInJump.event.includes(id)) ||
                (bgId.startsWith('X') && !ignoreInJump.bg.includes(bgId)))
                return core.drawTip("当前无法使用技能");
            // 不是怪物且不可以通行
            if (noPass && !(cls == "enemys" || cls == "enemy48")) {
                var toLoc = checkNoPass(direction, checkLoc.x, checkLoc.y, true);
                if (!toLoc) return;
                core.status.hero.hp -= 200 * flags.hard;
                core.updateStatusBar();
                flags['jump_' + core.status.floorId]++;
                if (core.status.hero.hp <= 0) {
                    core.status.hero.hp = 0;
                    core.updateStatusBar();
                    core.events.lose('你跳死了');
                }
                core.playSound("015-Jump01.ogg");
                core.insertAction([
                    { "type": "jumpHero", "loc": [toLoc.x, toLoc.y], "time": 500 },
                ]);
            }
            // 是怪物
            if (cls == "enemys" || cls == "enemy48") {
                var firstNoPass = checkNoPass(direction, checkLoc.x, checkLoc.y, false);
                if (!firstNoPass) return;
                core.status.hero.hp -= 200 * flags.hard;
                core.updateStatusBar();
                flags['jump_' + core.status.floorId]++;
                if (core.status.hero.hp <= 0) {
                    core.status.hero.hp = 0;
                    core.updateStatusBar();
                    core.events.lose('你跳死了');
                }
                core.playSound("015-Jump01.ogg");
                core.insertAction([{
                    "type": "jump",
                    "from": [checkLoc.x, checkLoc.y],
                    "to": [firstNoPass.x, firstNoPass.y],
                    "time": 500,
                    "keep": true
                },]);
            }
            // 检查一条线上的不可通过
            function checkNoPass (direction, x, y, startNo) {
                if (!startNo) startNo = false;
                switch (direction) {
                    case "up":
                        y--;
                        break;
                    case "right":
                        x++;
                        break;
                    case "down":
                        y++;
                        break;
                    case "left":
                        x--;
                        break;
                }
                if (x > core.status.thisMap.width - 1 || y >
                    core.status.thisMap.height - 1 || x < 0 || y < 0) return core.drawTip("当前无法使用技能");
                var id = core.getBlockId(x, y) || '';
                if (core.getBgNumber(x, y))
                    var bgId = core.getBlockByNumber(core.getBgNumber(x, y)).event.id || '';
                else var bgId = '';
                if (core.noPass(x, y) || core.getBlockCls(x, y) == "items" || (id.startsWith('X') && !ignoreInJump.event.includes(id)) ||
                    (bgId.startsWith('X') && !ignoreInJump.bg.includes(bgId)) || core.getBlockCls(x, y) == "animates")
                    return checkNoPass(direction, x, y, true);
                if (!startNo) return checkNoPass(direction, x, y, false);
                return { 'x': x, 'y': y };
            }
        };
    },
    "changeFly": function () {

        // 该插件可自定义空间很大，自定义内容请看注释

        // ------------------------- 安装说明 ------------------------- //
        // 先安装基于canvas的sprite化插件
        // 再将以下代码复制进插件中

        // ------------------------- 使用说明 ------------------------- //
        /* 
         * 直接复制进插件中即可使用，不需额外设置
         * 重点：该插件可以自动修正那些在物理位置上不正确的地图位置，但对性能消耗较高
         * 但这也说明你不必拘谨地图的物理位置，该插件可以自动调整为最优状态（古祠：能用就用，为了搞这个脑子快废掉了）
         * 如果可以保证自己的地图的物理位置不会重叠，请将变量（flag）：__map_needFix__设为false
         * 改变了默认为false，如果有需要，请设置为true
         */

        // ------------------------- 插件说明 ------------------------- //
        /* 
         * 该插件注释极其详细，可以帮助那些想要提升代码力，但实力有不足的作者
         * 注意！！！该插件难度极大，没有代码底力的不建议研究
         * 该插件涉及部分较为高级的算法，如bfs 二分
         */

        // 录像验证直接干掉这个插件
        if (main.replayChecking) return;

        // ----- 杂七杂八的变量
        this.mapCache = {}; // 地图缓存
        this.drawCache = {}; // 绘制信息缓存
        var mapCache = this.mapCache; // 供函数调用
        var status = 'none'; // 当前的绘制状态
        var sprites = {}; // 当前所有的sprite
        /** @type {{[x: string]: Sprite}} */
        var canDrag = {}; // 可以拖拽的sprite
        var clicking = false; // 是否正在点击，用于拖拽判定
        var drawingMap = ''; // 正在绘制的中心楼层
        var nowScale = 0; // 当前绘制的放缩比例
        var lastTouch = {}; // 上一次的单点点击信息
        var lastLength = 0; // 手机端缩放时上一次的两指间距离
        var is3D = false; // 当前绘制是否是3D绘制
        var nowDepth = 0; // 当前的遍历深度

        // ---- 可自定义，默认的切换地图的图块id
        var defaultChange = {
            left: 'leftPortal', // 左箭头
            up: 'upPortal', // 上箭头
            right: 'rightPortal', // 右箭头
            down: 'downPortal', // 下箭头
            upFloor: 'upFloor', // 上楼
            downFloor: 'downFloor' // 下楼
        };
        // ---- 可自定义，默认数值
        var defaultValue = {
            font: 'Verdana', // 默认字体
            scale: 3, // 默认地图缩放比例
            depth: 5, // 默认的遍历深度
            interval3D: 50 // 3D绘图时不同高度的楼层间的间距
        };

        // ---- 不可自定义，计算数据
        var dirData = {
            up: [1, 0],
            down: [-1, 0],
            left: [0, 1],
            right: [0, -1]
        }

        var allChangeEntries = Object.entries(defaultChange);

        /** 
         * 获取绘制信息
         * @param {string?} center 中心地图id
         * @param {number?} depth 搜索深度
         * @param {boolean?} noCache 是否不使用缓存
         * @returns {{
         * locs: {[x: number]: {[x: string]: [number, number, number, number, boolean]}}
         * lines: {[x: number]: {[x: string]: [number, number, number, number][]}}
         * floorLoc: {[x: number]: [number, number]}
         * width: {[x: number]: number}
         * height: {[x: number]: number}
         * }}
         */
        this.getMapDrawInfo = function (center, depth, noCache) {
            center = center || core.status.floorId;
            var id = center + '_' + depth;
            depth = depth || defaultValue.depth;
            // 检查缓存
            if (this.drawCache[id] && !noCache) return this.drawCache[id];
            var map = bfsSearch(center, depth, noCache);
            this.mapCache[id] = map;
            var res = getDrawInfo(map.res, center, map.order);
            this.drawCache[id] = res;
            return res;
        }

        /** 
         * 绘制大地图，可拖动、滚轮缩放、点击对应位置可以楼传、进入特殊传送点等
         * @param {string} floorId 中心地图的id
         * @param {number} depth 遍历深度
         * @param {boolean} noCache 是否不使用缓存
         * @param {number} scale 绘制的缩放比例
         * @param {boolean} use3D 是否使用3D绘图
         */
        this.drawFlyMap = function (floorId, depth, noCache, scale, use3D) {
            is3D = use3D || false;
            var info = this.getMapDrawInfo(floorId, depth, noCache);
            drawBack();
            if (!use3D)
                drawMap({
                    locs: info.locs[0],
                    lines: info.lines[0],
                    width: info.width[0],
                    height: info.height[0]
                }, scale);
            status = 'flyMap';
            drawingMap = floorId || core.status.floorId;
            nowDepth = depth || defaultValue.depth;
        }


        /** 
         * 广度优先搜索搜索地图路径
         * @param {string} center 中心地图的id
         * @param {number} depth 搜索深度
         * @param {boolean} noCache 是否不使用缓存
         * @returns {{res: [x: string]: string, order: string[]}} 格式：floorId_x_y_dir: floorId_x_y
         */
        function bfsSearch (center, depth, noCache) {
            // 检查缓存
            var id = center + '_' + depth;
            if (mapCache[id] && !noCache) return mapCache[id];
            var used = {}; // 搜索过的楼层
            var stack = [center]; // 当前栈
            var nowDepth = 0;
            var mapOder = [center]; // 遍历顺序，方便之后的位置修正

            var res = {}; // 输出结果，格式：floorId_x_y_dir: floorId_x_y

            // 开始循环搜索
            while (nowDepth++ < depth && stack.length > 0) {
                var now = stack.pop(); // 当前id
                core.extractBlocks(now); // 解析图块
                var blocks = core.getMapBlocksObj(now); // 获取当前地图的每点的事件
                var newNums = 0; // 新搜索出的楼层数，用于正确计算深度
                // 遍历，获取可以传送的点，只检测绿点事件，因此可用红点事件进行传送来实现分区功能
                for (var i in blocks) {
                    var block = blocks[i];
                    // 检测触发器是否为切换楼层，不是则直接跳过
                    if (block.event.trigger !== 'changeFloor') continue;
                    newNums++;
                    // 获取切换楼层的方向，如果不是默认的六种方向，视为其它传送门，在地图上点击后传送至以该地图为中心的小地图
                    var dirEntries = allChangeEntries.find(function (v) { return v[1] === block.event.id; });
                    var data = block.event.data;
                    if (!dirEntries) {
                        // 视为其它传送门
                        var route = data.floorId + '_' + data.loc.join('_');
                        res[now + '_' + i + '_other'] = route;
                        continue;
                    }
                    // 正规传送门
                    var dir = dirEntries[0];
                    var route = now + '_' + i.replace(',', '_') + '_' + dir;
                    var target = data.floorId + '_' + data.loc.join('_');
                    if (!used[data.floorId]) {
                        stack.push(data.floorId); // 没有搜索过，则加入栈中
                        mapOder.push(data.floorId);
                        used[data.floorId] = true;
                    }
                    res[route] = target;
                }
                nowDepth -= newNums - 1;
            }
            return { res: res, order: mapOder };
        }


        /**
         * 提供地图的绘制信息，会修正物理位置错位，保证不重叠，折线尽可能少
         * @param {{[x: string]: string}} map 要绘制的地图，格式：floorId_x_y_dir: floorId_x_y
         * @param {string} center 中心地图的id
         * @param {string[]} order 遍历顺序
         * @returns {{
         * locs: {[x: number]: {[x: string]: [number, number, number, number, boolean]}}
         * lines: {[x: number]: {[x: string]: [number, number, number, number][]}}
         * floorLoc: {[x: number]: [number, number]}
         * width: {[x: number]: number}
         * height: {[x: number]: number}
         * line3D?: {[x: number]: [number, number, number, number][]}
         * }} 地图的绘制信息
         */
        function getDrawInfo (map, center, order) {
            // 先根据地图id分类，从而确定每个地图连接哪些地图，同时方便处理
            var links = {};
            for (var i in map) {
                var splitted = i.split('_');
                var id = splitted[0]
                if (!links[id]) links[id] = {};
                links[id][i] = map[i];
            }
            // 分类完毕，然后根据连接点先计算出各个地图的坐标，然后再进行判断
            var centerFloor = core.status.maps[center];
            var visitedCenter = core.hasVisitedFloor(center);
            var locs = { // 格式：[中心x, 中心y, 宽, 高, 是否到达过]
                0: {
                    [center]: [0, 0, centerFloor.width, centerFloor.height, visitedCenter]
                }
            };
            var lines = {}; // 地图间的连线
            var map3D = {}; // 3D信息
            // 计算相连的地图的位置
            var l = order.length;
            var layers = {
                [center]: 0
            };
            var tempFloor = {}; // 在3D绘图下的临时存储地，防止出现位置不正确的问题
            for (var i = 0; i < l; i++) {
                var id = order[i];
                var now = links[id];
                // 遍历每一个地图的连接情况
                for (var from in now) {
                    var to = now[from];
                    // 先根据from to计算物理位置
                    var fromData = from.split('_'),
                        toData = to.split('_');
                    var dir = fromData[3];
                    if (!defaultChange[dir]) continue;
                    var v = dirData[dir][1], // 竖直数值
                        h = dirData[dir][0], // 水平数值
                        ha = Math.abs(h),
                        va = Math.abs(v);
                    var fx = parseInt(fromData[1]), // fromX
                        fy = parseInt(fromData[2]), // fromY
                        tx = parseInt(toData[1]), // toX
                        ty = parseInt(toData[2]), // toY
                        ff = id, // fromFloorId
                        tf = toData[0]; // toFloorId
                    var fromFloor = core.status.maps[ff],
                        toFloor = core.status.maps[tf];
                    var fhw = Math.floor(fromFloor.width / 2), // fromFloorHalfWidth
                        fhh = Math.floor(fromFloor.height / 2),
                        thw = Math.floor(toFloor.width / 2),
                        thh = Math.floor(toFloor.height / 2);
                    var fLoc = locs[layers[id]][id];
                    if (dir === 'upFloor' || dir === 'downFloor') {
                        // 如果是上下楼的话，存入3D信息
                        if (dir === 'upFloor') layers[tf] = layers[ff] + 1;
                        else layers[tf] = layers[ff] - 1;
                        var isFirst = false; // 是否是第一个被遍历到的不同高度的楼层
                        if (!locs[layers[tf]]) {
                            locs[layers[tf]] = {};
                            isFirst = true;
                        }
                        if (!locs[layers[tf][tf]]) {
                            if (isFirst) {
                                // 第一个被遍历的是中心楼层
                                locs[layers[tf]][tf] = [fx + fLoc[0], fy + fLoc[1], toFloor.width, toFloor.height, core.hasVisitedFloor(tf)];
                            } else {
                                if (!tempFloor[layers[tf]]) tempFloor[layers[tf]] = {};
                                if (!tempFloor[layers[tf]][tf])
                                    tempFloor[layers[tf]][tf] = [fx + fLoc[0], fy + fLoc[1], toFloor.width, toFloor.height, core.hasVisitedFloor(tf)];
                            }
                        }
                        map3D[ff + '_' + dir + '_' + tf] = {
                            from: [fx, fy, fromFloor.width, fromFloor.height, layers[ff]],
                            to: [tx, ty, toFloor.width, toFloor.height, layers[tf]]
                        };
                        continue;
                    }
                    layers[tf] = layers[ff];
                    var x, y;
                    if (locs[layers[tf]] && locs[layers[tf]][tf]) {
                        x = locs[layers[tf]][tf][0];
                        y = locs[layers[tf]][tf][1];
                    } else {
                        // 计算坐标，公式可以通过画图推断出
                        x = fLoc[0] - ha * (fhw - fx) - ha * (tx - thw) - v * (fhw + thw + 5);
                        y = fLoc[1] - va * (fhh - fy) - va * (ty - thh) - h * (fhh + thh + 5);
                    }
                    // 添加入坐标对象中
                    if (!locs[layers[tf]])
                        locs[layers[tf]] = {};
                    if (!locs[layers[tf]][tf])
                        locs[layers[tf]][tf] = [x, y, fromFloor.width, fromFloor.height, core.hasVisitedFloor(tf)];
                    // 添加连线
                    if (!lines[layers[tf]]) lines[layers[tf]] = {};
                    lines[layers[tf]][from + '_' + to] = [[
                        fx - fhw + locs[layers[ff]][ff][0],
                        fy - fhh + locs[layers[ff]][ff][1],
                        x + tx - thw, y + ty - thh
                    ]];
                }
            }
            // 修正地图错位，如果可以保证自己的地图物理位置完全对齐，可以将flag:__map_needFix__设为false
            if (core.hasFlag('__map_needFix__')) fixDislocation(locs, lines, center, order, links);
            // 获取地图绘制需要的长宽
            var left = 0,
                right = 0,
                up = 0,
                down = 0;
            var width = {},
                height = {};
            for (var layer in locs) {
                if (!is3D && layer !== '0') continue;
                var loc = locs[layer];
                for (var id in loc) {
                    var x = loc[id][0],
                        y = loc[id][1],
                        w = loc[id][2],
                        h = loc[id][3];
                    left = Math.min(left, x - w - 1);
                    right = Math.max(right, x + w + 1);
                    up = Math.min(up, y - h - 1);
                    down = Math.max(down, y + h + 1);
                }
                width[layer] = right - left;
                height[layer] = down - up;
                // 所有地图和连线向右下移动，避免绘制出现问题
                for (var id in locs[layer]) {
                    locs[layer][id][0] -= left;
                    locs[layer][id][1] -= up;
                }
                for (var route in lines[layer]) {
                    var line = lines[layer][route];
                    var l = line.length;
                    for (var i = 0; i < l; i++) {
                        var node = line[i];
                        node[0] -= left;
                        node[1] -= up;
                        node[2] -= left;
                        node[3] -= up;
                    }
                }
            }
            // 3D绘图下每个地图的中心位置
            var floorLoc = {
                0: [0, 0]
            };
            if (is3D) return extract3D(locs, map3D, layers, floorLoc);

            return { locs: locs, lines: lines, floorLoc: floorLoc, width: width, height: height };
        }

        /** 
         * 解析3D地图绘制信息
         * @param {{[x: number]: {[x: string]: [number, number, number, number, boolean]}}} locs 要解析的地图
         * @param {{[x: string]: {
         * from: [number, number, number, number, number]
         * to: [number, number, number, number, number]
         * }}} map3D 地图的3D信息
         * @param {{[x: string]: number}} layers 楼层的高度信息
         * @param {{[x: number]: [number, number]}} floorLoc 每一高度楼层的中心位置
         */
        function extract3D (locs, map3D, layers, floorLoc) {
            // 根据map3D获取不同高度楼层间的连线

        }

        // 修正前：             修正后：
        // ┌-┬-┐    ┌-┬-┐      ┌-┬-┐    ┌-┬-┐
        // ├-┼-┤----├-┼-┤      ├-┼-┤----├-┼-┤
        // └-┴-┘    └-┴-┘      └-┴-┘    └-┴-┘
        //    |      |            | ┌----┘
        //   ┌-┬-┐               ┌-┬-┐
        //   ├-┼-┤               ├-┼-┤
        //   └-┴-┘               └-┴-┘
        /**
         * 修正地图错位，原则是尽可能减少折线数量，需要根据连线将地图位置修正至最合理
         * 
         * 修正示例如上图
         * @param {{[x: string]: [number, number, number, number, boolean]}} locs 要修正的地图
         * @param {number[][]} lines 地图间的连线，既然修正地图位置了，连线位置也需要修正
         * @param {string} center 中心地图，不会被遍历检测，尽可能减少计算量
         * @param {string[]} order 遍历顺序
         * @param {{[x: string]: {[x: string]: string}}} links 分类后的连接信息
         */
        function fixDislocation (locs, lines, center, order, links) {
            return;
            // 难度最高的函数...
            // 这里的参数都是引用，所以直接修改即可，不需要返回等操作

            /*
             * 算法说明：
             * 1.遍历楼层，尝试调整为水平或竖直，有重叠则微调
             * 2.对于已为水平或竖直的，尽可能保证之后的调整中连线仍为水平或竖直
             */

            var fixed = {}; // 已经定位完毕的地图，尽可能保证连线为水平或竖直

            // 根据order来遍历，因为这样可以保证地图是从内向外的
            var l = order.length;
            for (var i = 0; i < l; i++) {
                var id = order[i];
                var link = links[id];
                // 直接遍历检测，并调整为水平或竖直
                for (var from in link) {
                    var to = link[from];
                    var line = lines[from + '_' + to];
                    var fromData = from.split('_'),
                        toData = to.split('_');
                    var ff = fromData[0],
                        tf = toData[0];
                    var fromFloor = core.status.maps[ff],
                        toFloor = core.status.maps[tf];
                    if (!fixed[to] && !(line[0][0] === line[0][2] || line[0][1] === line[0][3])) {
                        // 不是水平或竖直的尝试调整为水平或竖直
                        var dx = line[0][0] - line[0][2],
                            dy = line[0][1] - line[0][3];
                        var adx = Math.abs(dx),
                            ady = Math.abs(dy);
                        var v = 0,
                            h = 0;
                        // 夹角小于15度者调整，否则不调整
                        var divided = adx / ady; // 商，用于判定夹角
                        if (divided < 0.2679491924311227 || divided > 3.7320508075688776) {
                            if (adx > ady) v = 1;
                            else h = 1;
                            locs[tf][0] += dx * h;
                            locs[tf][1] += dy * v;
                        }
                    }
                    // 检查重叠，进行微调
                    var ol = hasOverLappingWith(locs, tf);
                    if (ol.length === 0) continue;
                    // 先计算与from之间的坐标差
                    var ftdx = locs[ff][0] - locs[tf][0],
                        ftdy = locs[ff][1] - locs[tf][1];
                }
            }
        }

        /** 
         * 判断某一楼层与那些楼层有重叠，重叠长宽为多少
         * @param {{[x: string]: [number, number, number, number, boolean]}} locs 要修正的地图
         * @param {string} floor 要检测的楼层
         * @returns {[string, number, number, number, number][]} 与哪些楼层重叠，及重叠长宽、坐标差
         */
        function hasOverLappingWith (locs, floor) {
            var res = [];
            for (var id in locs) {
                var lapping = checkOverLapping(locs, id, floor);
                lapping.unshift(id);
                if (lapping[0] !== 0 && lapping[1] !== 0) res.push(lapping);
            }
            return res;
        }

        /** 
         * 检查两个楼层是否重叠，重叠长宽为多少
         * @param {{[x: string]: [number, number, number, number, boolean]}} locs 要修正的地图
         * @param {string} f1 第一张地图
         * @param {string} f2 第二张地图
         * @returns {[number, number, number, number]} 重叠长宽，及第一张地图与第二张地图的坐标差
         */
        function checkOverLapping (locs, f1, f2) {
            // 开始检测重叠
            var loc1 = locs[f1],
                loc2 = locs[f2];
            var dx = loc1[0] - loc2[0],
                dy = loc1[1] - loc2[1];
            var adx = Math.abs(loc1[0] - loc2[0]),
                ady = Math.abs(loc1[1] - loc2[1]);
            var tw = loc1[2] + loc2[2],
                th = loc1[3] + loc2[3];
            var ox = Math.abs(Math.max(adx - tw - 5), 0), // 重叠长宽
                oy = Math.abs(Math.max(ady - th - 5), 0);
            return [ox, oy, dx, dy];
        }

        /** 绘制背景 */
        function drawBack () {
            if (status !== 'none') return;
            var back = new Sprite(0, 0, core.__PIXELS__, core.__PIXELS__, 175, 'game', '__map_back__');
            back.setCss(
                'transition: all 0.6s linear;'
            );
            setTimeout(function () { back.setCss('background-color: rgba(0, 0, 0, 0.9);'); }, 50);
            var listen = new Sprite(0, 0, core.__PIXELS__, core.__PIXELS__, 1000, 'game', '__map_listen__');
            addDrag(listen);
        }

        /** 
         * 绘制大地图
         * @param {{
         * locs: {[x: string]: [number, number, number, number, boolean]}
         * lines: {[x: string]: [number, number, number, number][]}
         * width: number
         * height: number
         * }} info 地图绘制信息
         * @param {number} scale 地图的绘制比例
         * @param {number} layer 绘制的层，用于3D绘图
         * @param {number} interval3D 3D绘图时不同高度楼层间的间距
         * @param {number} x 3D绘图时的中心坐标
         * @param {number} y
         */
        function drawMap (info, scale, layer, interval3D, x, y) {
            if (status === 'flyMap') return;
            scale = scale || defaultValue.scale;
            nowScale = scale;
            layer = layer || 0; // 为3D绘图做准备
            interval3D = interval3D || defaultValue.interval3D;
            var size = core.__PIXELS__;
            var w = info.width * scale,
                h = info.height * scale;
            var id = '__flyMap_' + layer + '__';
            var cx = x === void 0 ? size / 2 - w / 2 : x,
                cy = y === void 0 ? size / 2 - h / 2 : y
            var map = new Sprite(cx, cy, w, h, 500 + layer * 2, 'game', '__flyMap_' + layer + '__');
            var rate = core.__PIXELS__ / interval3D / 2;
            if (is3D) map.setCss(
                'transform: scaleY(0.7071067811865476)skewX(-45deg);' +
                'opacity: ' + (1 - Math.abs(layer) / rate) + ';'
            );
            canDrag[id] = map;
            map.canvas.className = 'fly-map';
            var ctx = map.context;
            core.clearMap(ctx);
            var drawed = {}; // 绘制过的线
            // 先绘制连线
            var lines = info.lines;
            for (var route in lines) {
                var line = lines[route];
                var l = line.length;
                for (var i = 0; i < l; i++) {
                    var node = line[i];
                    var from = node[0] + ',' + node[1],
                        to = node[2] + ',' + node[3];
                    if (drawed[from + '-' + to] || drawed[to + '-' + from]) continue;
                    drawed[from + '-' + to] = true;
                    core.drawLine(ctx, node[0] * scale, node[1] * scale, node[2] * scale, node[3] * scale, '#fff', scale / 2);
                }
            }
            // 再绘制楼层
            var locs = info.locs;
            for (var id in locs) {
                var loc = locs[id];
                var color = '#000';
                if (!loc[4]) color = '#f0f';
                var x = loc[0] * scale,
                    y = loc[1] * scale,
                    w = loc[2] * scale,
                    h = loc[3] * scale;
                if (scale < 4 || !core.hasVisitedFloor(id)) {
                    core.fillRect(ctx, x - w / 2, y - h / 2, w, h, color);
                } else {
                    // 绘制缩略图
                    var size = w > h ? w : h
                    core.drawThumbnail(id, void 0, {
                        damage: true, ctx: ctx, x: x - w / 2, y: y - h / 2, all: true, size: size
                    });
                }
                core.strokeRect(ctx, x - w / 2, y - h / 2, w, h, '#fff', scale / 2);
            }
        }

        /** 
         * 拖拽事件
         * @param {MouseEvent} e
         */
        function drag (e) {
            if (!clicking) return;
            var scale = core.domStyle.scale
            moveEle(e.movementX / scale, e.movementY / scale);
        }

        /**
         * 手机端点击拖动事件
         * @param {TouchEvent} e
         * @this {HTMLCanvasElement}
         */
        function touchDrag (e) {
            var scale = core.domStyle.scale;
            if (e.touches.length === 1) { // 拖拽
                var info = e.touches[0];
                if (!lastTouch[this.id]) {
                    lastTouch[this.id] = [info.clientX, info.clientY];
                    return;
                }
                var x = info.clientX,
                    y = info.clientY;
                var dx = x - lastTouch[this.id][0],
                    dy = y - lastTouch[this.id][1];
                moveEle(dx / scale, dy / scale);
                lastTouch[this.id] = [info.clientX, info.clientY];
            } else if (e.touches.length === 2) { // 双指放缩
                var first = e.touches[0],
                    second = e.touches[1];
                var dx = first.clientX - second.clientX,
                    dy = first.clientY - second.clientY;
                if (lastLength === 0) {
                    lastLength = Math.sqrt(dx * dx + dy * dy);
                    return;
                }
                var cx = (first.clientX + second.clientX) / 2,
                    cy = (first.clientY + second.clientY) / 2;
                var loc = core.actions._getClickLoc(cx, cy);
                cx = loc.x / scale;
                cy = loc.y / scale;
                var length = Math.sqrt(dx * dx + dy * dy);
                var delta = length / lastLength;
                var info = {};
                for (var id in canDrag) {
                    var sprite = canDrag[id];
                    var sx = sprite.x + sprite.width / 2,
                        sy = sprite.y + sprite.height / 2;
                    var dx = sx - mx,
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
        function wheel (e) {
            var delta = 1 - Math.sign(e.deltaY) / 10;
            var loc = core.actions._getClickLoc(e.clientX, e.clientY);
            var scale = core.domStyle.scale
            var mx = loc.x / scale,
                my = loc.y / scale;
            var info = {};
            for (var id in canDrag) {
                var sprite = canDrag[id];
                var cx = sprite.x + sprite.width / 2,
                    cy = sprite.y + sprite.height / 2;
                var dx = cx - mx,
                    dy = cy - my;
                info[id] = [mx + dx * delta, my + dy * delta];
            }
            scaleMap(delta * nowScale, info);
        }

        /** 
         * 拖拽时移动需要元素
         * @param {string} dx
         * @param {string} dy
         */
        function moveEle (dx, dy) {
            for (var id in canDrag) {
                var sprite = canDrag[id];
                var ctx = sprite.context;
                sprite.x += dx;
                sprite.y += dy;
                core.relocateCanvas(ctx, dx, dy, true);
            }
        }

        /** 
         * 缩放绘制地图
         * @param {number} target 目标缩放比例
         * @param {number} info 缩放后的sprite位置数据
         */
        function scaleMap (target, info) {
            status = 'scale';
            core.drawFlyMap(drawingMap, nowDepth, false, target);
            status = 'flyMap';
            // 更正sprite位置
            for (var id in canDrag) {
                var sprite = canDrag[id];
                var ctx = sprite.context;
                sprite.x = info[id][0] - sprite.width / 2;
                sprite.y = info[id][1] - sprite.height / 2;
                core.relocateCanvas(ctx, info[id][0] - sprite.width / 2, info[id][1] - sprite.height / 2);
            }
        }

        /**
         * 给需要的元素添加拖拽等事件
         * @param {HTMLCanvasElement} ele
         */
        function addDrag (ele) {
            ele.addEventListener('wheel', wheel);
            ele.addEventListener('mousemove', drag);
            ele.addEventListener('touchmove', touchDrag);
            ele.addEventListener('mousedown', function () { clicking = true; });
            ele.addEventListener('mouseup', function () { clicking = false; });
            ele.addEventListener('touchend', function () { lastTouch = {}; lastLength = 0; });
        }
    },
    "loopMap": function () {
        // 循环式地图相关
        // 防止重开游戏出问题
        ////// 加载某个楼层（从剧本或存档中） //////
        maps.prototype.loadFloor = function (floorId, map, fromReset) {
            var floor = fromReset ? main.floors[floorId] : core.floors[floorId];
            if (!map) map = floor.map;
            if (map instanceof Array) {
                map = { "map": map };
            }
            if (!map.map) map.map = core.clone(floor.map);
            var content = {};
            var notCopy = this._loadFloor_doNotCopy();
            for (var name in floor) {
                if (notCopy.indexOf(name) == -1 && floor[name] != null)
                    content[name] = core.clone(floor[name]);
            }
            for (var name in map) {
                if (notCopy.indexOf(name) == -1 && map[name] != null)
                    content[name] = core.clone(map[name]);
            }
            content.map = map.map;
            if (main.mode == 'editor') {
                this.extractBlocks(content);
            }
            return content;
        };
        ////// 自动存档 //////
        control.prototype.autosave = function (removeLast) {
            if (core.hasFlag('__forbidSave__') || core.status.floorId == 'tower6') return;
            var x = null;
            if (removeLast) {
                x = core.status.route.pop();
                core.status.route.push("turn:" + core.getHeroLoc('direction'));
            }
            if (core.status.event.id == 'action') // 事件中的自动存档
                core.setFlag("__events__", core.clone(core.status.event.data));
            if (core.saves.autosave.data == null) {
                core.saves.autosave.data = [];
            }
            core.saves.autosave.data.splice(core.saves.autosave.now, 0, core.saveData());
            core.saves.autosave.now += 1;
            if (core.saves.autosave.data.length > core.saves.autosave.max) {
                if (core.saves.autosave.now < core.saves.autosave.max / 2)
                    core.saves.autosave.data.pop();
                else {
                    core.saves.autosave.data.shift();
                    core.saves.autosave.now = core.saves.autosave.now - 1;
                }
            }
            core.saves.autosave.updated = true;
            core.saves.ids[0] = true;
            core.removeFlag("__events__");
            if (removeLast) {
                core.status.route.pop();
                if (x) core.status.route.push(x);
            }
        };
        ////// 重置地图 //////
        maps.prototype.resetMap = function (floorId) {
            floorId = floorId || core.status.floorId;
            if (!floorId) return;
            if (typeof floorId == 'string') floorId = [floorId];
            var needRefresh = false;
            floorId.forEach(function (t) {
                core.status.maps[t] = core.maps.loadFloor(t, null, true);
                // 重置本层的全部独立事件
                Object.keys(core.status.hero.flags).forEach(function (one) {
                    if (one.startsWith(floorId + '@')) delete core.status.hero.flags[one];
                });
                // 重置本层的图块删除信息
                delete (flags.__disabled__ || {})[t];
                delete (core.status.mapBlockObjs || {})[t];
                if (t == core.status.floorId) needRefresh = true;
                ['bg', 'bg2', 'fg', 'fg2'].forEach(function (layer) {
                    core.floors[floorId] = main.floors[floorId];
                })
            });
            if (needRefresh) this.drawMap();
            core.drawTip("地图重置成功");
        };
        // 勇士不动图层动
        control.prototype._moveAction_moving = function (callback) {
            core.setHeroMoveInterval(function () {
                if (core.status.floorId != "tower6") {
                    core.setHeroLoc('x', core.nextX(), true);
                } else {
                    if (core.status.hero.loc.direction != "down" && core.status.hero.loc.direction != "up") {
                        core.setHeroLoc('x', 12, true);
                        var block = core.getMapBlocksObj(core.status.floorId)[core.nextX() + "," + core.nextY];
                        if (block) var trigger = block.event.trigger;
                        else var trigger = "";
                        if (trigger != "battle") {
                            core.changeEventsBgFg(core.status.hero.loc.direction,
                                "tower6", ["tower1", "tower2", "tower4", "tower5"]);
                        }
                        core.drawMap();
                    }
                }
                core.setHeroLoc('y', core.nextY(), true);
                var direction = core.getHeroLoc('direction');
                core.control._moveAction_popAutomaticRoute();
                core.status.route.push(direction);
                core.moveOneStep();
                core.checkRouteFolding();
                if (callback) callback();
            });
        };
        ////// 设置行走的效果动画 //////
        control.prototype.setHeroMoveInterval = function (callback) {
            if (core.status.heroMoving > 0) return;
            if (core.status.replay.speed == 24) {
                if (callback) callback();
                return;
            }
            core.status.heroMoving = 1;
            var toAdd = 1;
            if (core.status.replay.speed > 3) toAdd = 2;
            if (core.status.replay.speed > 6) toAdd = 4;
            if (core.status.replay.speed > 12) toAdd = 8;
            core.interval.heroMoveInterval = window.setInterval(function () {
                core.status.heroMoving += toAdd;
                if (core.status.floorId == "tower6")
                    core.backgroundImage("tower6.jpeg");
                if (core.status.heroMoving >= 8) {
                    clearInterval(core.interval.heroMoveInterval);
                    core.status.heroMoving = 0;
                    if (callback) callback();
                }
            }, core.values.moveSpeed / 8 * toAdd / core.status.replay.speed);
        };
        // 事件层前景层背景层平移
        this.changeEventsBgFg = function (direction, floorId, fromIds) {
            if (direction == "up" || direction == "down") return;
            var floor = core.floors[floorId];
            // 原始层楼层转换平移
            fromIds.forEach(function (id) {
                var toChanges = {};
                for (var one in core.floors[id].changeFloor) {
                    var data = core.floors[id].changeFloor[one];
                    var x = data.loc[0],
                        y = data.loc[1];
                    var blocks = core.getMapBlocksObj(id);
                    var toFloor = data.floorId;
                    if (blocks[one] && !blocks[one].event.id.startsWith("A")) {
                        toChanges[one] = { floorId: toFloor, loc: [x, y] };
                        continue;
                    } else {
                        if (direction == "left") x = x >= floor.width - 1 ? 0 : x + 1;
                        else x = x <= 0 ? floor.width - 1 : x - 1;
                        toChanges[one] = { floorId: toFloor, loc: [x, y] };
                    }
                }
                // 转换
                delete core.floors[id].changeFloor;
                core.floors[id].changeFloor = toChanges;
                delete core.status.maps[id].blocks;
                core.extractBlocks(id);
                core.getMapBlocksObj(id, true);
            });
            var list = ['events', 'changeFloor'];
            list.forEach(function (name) {
                var toEvents = {};
                // 获得事件并删除原事件
                for (var one in floor[name]) {
                    var loc = one.split(",");
                    var x = parseInt(loc[0]),
                        y = parseInt(loc[1]);
                    if (direction == "left") {
                        var toX = x == floor.width - 1 ? 0 : x + 1;
                        toEvents[toX + "," + y] = floor[name][one];
                    } else {
                        var toX = x == 0 ? floor.width - 1 : x - 1;
                        toEvents[toX + "," + y] = floor[name][one];
                    }
                    delete core.floors[floorId][name][one];
                }
                // 转换
                core.floors[floorId][name] = toEvents;
            });
            // 前景事件背景层图块平移
            list = ['bgmap', 'bg2map', 'map', 'fgmap', 'fg2map'];
            list.forEach(function (one) {
                if (one == 'map') {
                    var toBlocks = core.clone(core.status.maps[floorId].map);
                } else {
                    var toBlocks = core.clone(floor[one]);
                }
                if (toBlocks.length == 0) return;
                for (var y = 0; y < toBlocks.length; y++) {
                    for (var x = 0; x < toBlocks[y].length; x++) {
                        if (direction == "left") {
                            if (one != "map")
                                floor[one][y][x] = toBlocks[y][x == 0 ? floor.width - 1 : x - 1];
                            else core.status.maps[floorId].map[y][x] = toBlocks[y][x == 0 ? floor.width - 1 : x - 1];
                        } else {
                            if (one != "map")
                                floor[one][y][x] = toBlocks[y][x == floor.width - 1 ? 0 : x + 1];
                            else core.status.maps[floorId].map[y][x] = toBlocks[y][x == floor.width - 1 ? 0 : x + 1];
                        }
                    }
                }
            });
            delete core.status.maps[floorId].blocks;
            core.setMapBlockDisabled(floorId, core.nextX(), core.nextY(), false);
            core.extractBlocks(floorId);
            core.getMapBlocksObj(floorId, true);
        };
        // 背景图
        this.backgroundImage = function (image) {
            if (typeof image == 'string') {
                image = core.getMappedName(image);
                image = core.material.images.images[image];
                if (!image) return;
            }
            var h = image.height,
                w = image.width;
            // 裁剪
            var sx = w / 2 - 240,
                sy = core.bigmap.offsetY / (core.status.thisMap.height * 32 - 480) * (h - 480);
            // 背景层遮挡
            core.createCanvas("bImage", 0, 0, 480, 480, 25);
            // 事件层遮挡
            core.createCanvas("eImage", 0, 0, 480, 480, 70);
            core.clearMap("bImage");
            // 左半边
            core.drawImage("bImage", image, sx, sy, 96, 480, 0, 0, 96, 480);
            core.drawImage("eImage", image, sx, sy, 64, 480, 0, 0, 64, 480);
            // 右半边
            sx = w / 2 + 144;
            core.drawImage("bImage", image, sx, sy, 96, 480, 384, 0, 96, 480);
            core.drawImage("eImage", image, sx + 32, sy, 64, 480, 416, 0, 64, 480);
        };
        // 到达地图重定位
        this.relocateLoopMap = function (floorId, heroLoc, fromIds) {
            var floor = core.floors[floorId];
            var nowX = heroLoc.x;
            var toX = Math.floor(floor.width / 2);
            if (nowX == toX) return;
            // 设置勇士位置
            core.setHeroLoc("x", 12);
            // 计算偏移量
            var dx = toX - nowX;
            // 转换
            // 原始层楼层转换平移
            if (floorId == 'tower6') fromIds = ["tower1", "tower2", "tower4", "tower5"];
            fromIds.forEach(function (id) {
                var toChanges = {};
                for (var one in core.floors[id].changeFloor) {
                    var data = core.floors[id].changeFloor[one];
                    var x = data.loc[0],
                        y = data.loc[1];
                    var blocks = core.getMapBlocksObj(id);
                    var toFloor = data.floorId;
                    if (blocks[one] && !blocks[one].event.id.startsWith("A")) {
                        toChanges[one] = { floorId: toFloor, loc: [x, y] };
                        continue;
                    }
                    if (dx > 0) x = x + dx > floor.width - 1 ? dx + x - floor.width : dx + x;
                    else x = x + dx < 0 ? dx + x + floor.width : dx + x;
                    toChanges[one] = { floorId: toFloor, loc: [x, y] };
                }
                // 转换
                delete core.floors[id].changeFloor;
                core.floors[id].changeFloor = toChanges;
                delete core.status.maps[id].blocks;
                core.extractBlocks(id);
                core.getMapBlocksObj(id, true);
            });
            var list = ['events', 'changeFloor'];
            list.forEach(function (name) {
                var toEvents = {};
                // 获得事件并删除原事件
                for (var one in floor[name]) {
                    var loc = one.split(",");
                    var x = parseInt(loc[0]),
                        y = parseInt(loc[1]);
                    if (x + dx > floor.width - 1) {
                        x = dx + x - floor.width;
                    } else if (x + dx < 0) {
                        x = x + dx + floor.width;
                    } else {
                        x += dx;
                    }
                    toEvents[x + "," + y] = floor[name][one];
                    delete core.floors[floorId][name][one];
                }
                // 转换
                core.floors[floorId][name] = toEvents;
            });
            dx = -dx;
            // 前景事件背景层图块平移
            list = ['bgmap', 'bg2map', 'map', 'fgmap', 'fg2map'];
            list.forEach(function (one) {
                if (one == 'map') {
                    var toBlocks = core.clone(core.status.maps[floorId].map);
                } else {
                    var toBlocks = core.clone(floor[one]);
                }
                if (toBlocks.length == 0) return;
                for (var y = 0; y < toBlocks.length; y++) {
                    for (var x = 0; x < toBlocks[y].length; x++) {
                        if (dx > 0) {
                            if (one != "map")
                                floor[one][y][x] = toBlocks[y][x + dx > floor.width - 1 ? dx + x - floor.width : dx + x];
                            else core.status.maps[floorId].map[y][x] = toBlocks[y][x + dx > floor.width - 1 ? dx + x - floor.width : dx + x];
                        } else {
                            if (one != "map")
                                floor[one][y][x] = toBlocks[y][x + dx < 0 ? dx + x + floor.width : dx + x];
                            else core.status.maps[floorId].map[y][x] = toBlocks[y][x + dx < 0 ? dx + x + floor.width : dx + x];
                        }
                    }
                }
            });
            delete core.status.maps[floorId].blocks;
            core.extractBlocks(floorId);
            core.getMapBlocksObj(floorId, true);
        };
        ////// 将当前地图重新变成数字，以便于存档 //////
        maps.prototype.saveMap = function (floorId) {
            if (floorId == 'tower6') return;
            var maps = core.status.maps;
            if (!floorId) {
                var map = {};
                for (var id in maps) {
                    if (id == "tower6") continue;
                    var obj = this.saveMap(id);
                    if (Object.keys(obj).length > 0) map[id] = obj;
                }
                return map;
            }
            // 砍层状态：直接返回
            if ((flags.__removed__ || []).indexOf(floorId) >= 0) {
                return {};
            }

            var map = maps[floorId];
            var thisFloor = this._compressFloorData(map, core.floors[floorId]);
            var mapArr = this.compressMap(map.blocks ? this._getMapArrayFromBlocks(map.blocks, map.width, map.height, true) : map.map, floorId);
            if (mapArr != null) thisFloor.map = mapArr;
            return thisFloor;
        };
        // 存档问题
        this.saveLoopMap = function (floorId, fromIds) {
            // 当前层
            var data = {};
            ['bg2map', 'bgmap', 'changeFloor', 'fgmap', 'fg2map'].forEach(function (one) {
                data[one] = core.floors[floorId][one];
            });
            // 可以到达该层的楼层转换
            data.map = core.status.maps[floorId].map;
            data.changes = {}
            fromIds.forEach(function (id) {
                data.changes[id] = core.floors[id].changeFloor;
            });
            return data;
        };
        // 读档
        this.loadLoopMap = function (data, floorId) {
            if (!data) return;
            for (var one in data) {
                // 非楼层转换
                if (one != 'changes') {
                    core.floors[floorId][one] = data[one];
                } else {
                    // 楼层转换
                    for (var id in data.changes) {
                        core.floors[id].changeFloor = data.changes[id];
                    }
                }
            }
            // 解析图块
            if (data.changes)
                for (var id in data.changes) {
                    core.extractBlocks(id);
                }
        };
    },
    "warning": function () {
        // warning
        // 初始化
        if (main.replayChecking) return;
        // 默认音效名
        var defaultSound = 'warning.mp3';
        // 默认字体名
        var defaultFont = 'normal';

        var timeout;
        /** warning提示
         * @param {number} x 横坐标
         * @param {number} y 纵坐标
         * @param {string} text 显示的文字
         */
        this.drawWarning = function (x, y, text) {
            if (timeout) return;
            x = x || 6;
            y = y || 6;
            text = text || 'boss';
            text += '</br>';
            for (var i = 0; i < 10; i++) text += '&nbsp;';
            text += 'danger';
            // 生成文字
            var elements = document.querySelectorAll('.gameCanvas');
            var t = document.createElement('p');
            t.innerHTML = text;
            t.style.position = 'absolute';
            t.style.fontSize = '4em';
            t.style.left = -(300 * core.domStyle.scale) + 'px';
            t.style.top = (parseInt(elements[0].style.height) / 2 - 100) + 'px';
            t.style.zIndex = '300';
            t.style.color = '#f11';
            t.style.fontFamily = defaultFont;
            t.style.overflow = 'none';
            t.style.width = '100%';
            t.classList.add('warning');
            core.dom.gameDraw.appendChild(t);
            setTimeout(function () { t.style.left = (416 * core.domStyle.scale) + 'px' }, 50);
            // 计算偏移量
            var px = (6 - x) / 12 * 50;
            var py = (6 - y) / 12 * 50;
            // 修改画布的scale和transform
            elements.forEach(function (v) {
                if (v instanceof HTMLCanvasElement) {
                    v.style.transform = 'scale(2)translate(' + px + '%, ' + py + '%)';
                }
            });
            core.playSound(defaultSound);
            // 拉回镜头
            timeout = setTimeout(function () {
                timeout = setTimeout(function () {
                    timeout = void 0;
                    core.dom.gameDraw.removeChild(t);
                }, 1500);
                elements.forEach(function (v) {
                    if (v instanceof HTMLCanvasElement) {
                        v.style.transform = 'none';
                    }
                });
            }, 1600);
        }
    },
    "towerBoss": function () {
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
            core.insertAction([
                { "type": "sleep", "time": 1000, "noSkip": true },
            ]);
            setTimeout(core.bossCore, 1000);
        };
        // 录像自动修正
        this.autoFixRouteBoss = function (isStart) {
            var route = core.status.route;
            if (isStart) { // 开始修正 记录当前录像长度
                flags.startFix = route.length - 1;
                return;
            }
            // 结束修正 删除录像 并追加跳过步骤
            route.splice(flags.startFix);
            route.push("choices:0");
            delete flags.startFix;
        };
        // 血条
        this.healthBar = function (now, total) {
            // 关闭小地图 
            flags.__useMinimap__ = false;
            core.drawMinimap();
            var nowLength = now / total * 476; // 当前血量下绘制长度
            var color = [255 * 2 - now / total * 2 * 255, now / total * 2 * 255, 0, 1]; // 根据当前血量计算颜色
            // 建画布
            if (!core.dymCanvas.healthBar)
                core.createCanvas("healthBar", 0, 0, 480, 16, 140);
            else core.clearMap('healthBar');
            // 底
            core.fillRect("healthBar", 0, 0, 480, 16, "#bbbbbb");
            // css特效
            var style = document.getElementById("healthBar").getContext("2d");
            style.shadowColor = "rgba(0, 0, 0, 0.8)";
            style.shadowBlur = 5;
            style.shadowOffsetX = 10;
            style.shadowOffsetY = 5;
            style.filter = "blur(1px)";
            // 绘制
            core.fillRect("healthBar", 2, 2, nowLength, 12, color);
            // css特效
            style.shadowColor = "rgba(0, 0, 0, 0.5)";
            style.shadowOffsetX = 0;
            style.shadowOffsetY = 0;
            // 绘制边框
            core.strokeRect("healthBar", 1, 1, 478, 14, "#ffffff", 2);
            // 绘制文字
            style.shadowColor = "rgba(0, 0, 0, 1)";
            style.shadowBlur = 3;
            style.shadowOffsetX = 2;
            style.shadowOffsetY = 1;
            style.filter = "none";
            core.fillText("healthBar", now + "/" + total, 5, 13.5, "#ffffff", "16px normal");
        };
        // 血量变化
        this.dynamicChangeHp = function (from, to, total) {
            var frame = 0,
                speed = (to - from) / 50,
                now = from;
            var interval = window.setInterval(function () {
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
                core.createCanvas("words", x, y, 480, 24, 135);
            else core.clearMap("words");
            if (flags.wordsTimeOut) clearTimeout(flags.wordsTimeOut);
            core.dynamicCurtain(y, y + 24, time / 3);
            // css
            var style = document.getElementById("words").getContext("2d");
            style.shadowColor = "rgba(0, 0, 0, 1)";
            style.shadowBlur = 3;
            style.shadowOffsetX = 2;
            style.shadowOffsetY = 1;
            // 一个一个绘制
            skip1(0);
            // 跳字
            function skip1 (now) {
                if (parseInt(now) >= words.length) {
                    flags.wordsTimeOut = setTimeout(function () {
                        core.deleteCanvas("words");
                        core.deleteCanvas("wordsBg");
                    }, time);
                    return;
                }
                var frame = 0,
                    blur = 2,
                    nx = 4 + now * 24;
                var skip2 = window.setInterval(function () {
                    blur -= 0.4;
                    frame++;
                    core.clearMap("words", nx, 0, 24, 24);
                    style.filter = "blur(" + blur + "px)";
                    core.fillText("words", words[now], nx, 20, "#ffffff", "22px normal");
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
                core.createCanvas("wordsBg", 0, from, width, 24, 130);
            else core.clearMap("wordsBg");
            time /= 1000;
            var ny = from,
                frame = 0,
                a = 2 * (to - from) / Math.pow(time * 50, 2),
                speed = a * time * 50;
            var style = document.getElementById("wordsBg").getContext("2d");
            style.shadowColor = "rgba(0, 0, 0, 0.8)";
            var wordsInterval = window.setInterval(function () {
                frame++;
                speed -= a;
                ny += speed;
                core.clearMap("wordsBg");
                style.shadowBlur = 8;
                style.shadowOffsetY = 2;
                core.fillRect("wordsBg", 0, 0, width, ny - from, [180, 180, 180, 0.7]);
                style.shadowBlur = 3;
                style.shadowOffsetY = 0;
                core.strokeRect("wordsBg", 1, 1, width - 2, ny - from - 2, [255, 255, 255, 0.7], 2);
                if (frame >= time * 50) {
                    clearInterval(wordsInterval);
                    core.clearMap("wordsBg");
                    style.shadowBlur = 8;
                    style.shadowOffsetY = 2;
                    core.fillRect("wordsBg", 0, 0, width, to - from, [180, 180, 180, 0.7]);
                    style.shadowBlur = 3;
                    style.shadowOffsetY = 0;
                    core.strokeRect("wordsBg", 1, 1, width - 2, ny - from - 2, [255, 255, 255, 0.7], 2);
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
                core.createCanvas("attackBoss", 0, 0, 480, 480, 35);
            else core.clearMap("attackBoss");
            var style = document.getElementById("attackBoss").getContext("2d");
            var frame1 = 0,
                blur = 3,
                scale = 2,
                speed = 0.04,
                a = 0.0008;
            var atkAnimate = window.setInterval(function () {
                core.clearMap("attackBoss");
                frame1++;
                speed -= a;
                scale -= speed;
                blur -= 0.06;
                style.filter = "blur(" + blur + "px)";
                core.strokeCircle("attackBoss", nx * 32 + 16, ny * 32 + 16, 16 * scale, [255, 150, 150, 0.7], 4);
                core.fillCircle("attackBoss", nx * 32 + 16, ny * 32 + 16, 3 * scale, [255, 150, 150, 0.7]);
                if (frame1 == 50) {
                    clearInterval(atkAnimate);
                    core.clearMap("attactkBoss");
                    style.filter = "none";
                    core.strokeCircle("attackBoss", nx * 32 + 16, ny * 32 + 16, 16, [255, 150, 150, 0.7], 4);
                    core.fillCircle("attackBoss", nx * 32 + 16, ny * 32 + 16, 3, [255, 150, 150, 0.7]);
                }
            }, 20);
            // 实时检测勇士位置
            var frame2 = 0;
            var atkBoss = window.setInterval(function () {
                frame2++;
                var x = core.status.hero.loc.x,
                    y = core.status.hero.loc.y;
                // 2秒超时
                if (frame2 > 100) {
                    setTimeout(function () {
                        delete flags.canAttack;
                    }, 4000);
                    clearInterval(atkBoss);
                    core.deleteCanvas("attackBoss");
                    return;
                }
                if (nx == x && ny == y) {
                    setTimeout(function () {
                        delete flags.canAttack;
                    }, 4000);
                    core.dynamicChangeHp(hp, hp - 500, 10000);
                    hp -= 500;
                    clearInterval(atkBoss);
                    core.deleteCanvas("attackBoss");
                    if (hp > 3500) core.drawAnimate("hand", 7, 1);
                    else if (hp > 2000) core.drawAnimate("hand", 7, 2);
                    else if (hp > 1000) core.drawAnimate("hand", 7, 3);
                    else core.drawAnimate("hand", 7, 4);
                    return;
                }
            }, 20);
        };
        // 核心函数
        this.bossCore = function () {
            var interval = window.setInterval(function () {
                if (stage == 1) {
                    if (seconds == 8) core.skipWord("智慧之神：你和之前来的人不一样");
                    if (seconds == 12) core.skipWord("智慧之神：他们只会一股脑地向前冲");
                    if (seconds == 16) core.skipWord("智慧之神：而你却会躲避这些攻击");
                    if (seconds == 20) core.skipWord("提示：踩在红圈上可以对智慧之神造成伤害");
                    if (seconds > 10) core.attackBoss();
                    if (seconds % 10 == 0) core.intelligentArrow();
                    if (seconds % 7 == 0 && seconds != 0) core.intelligentDoor();
                    if (seconds > 20 && seconds % 13 == 0) core.icyMomentem();
                }
                if (stage == 1 && hp <= 7000) {
                    stage++;
                    seconds = 0;
                    core.skipWord("智慧之神：不错小伙子");
                    core.pauseBgm();
                }
                if (stage == 2) {
                    if (seconds == 4) core.skipWord("智慧之神：你很有潜力");
                    if (seconds == 8) core.skipWord("智慧之神：看来你很可能成为改变历史的人");
                    if (seconds == 12) core.skipWord("智慧之神：不过，这场战斗才刚刚开始");
                    if (seconds == 25) core.skipWord("提示：方形区域均为危险区域");
                    if (seconds == 15) setTimeout(function () { core.playSound("thunder.mp3"); }, 500);
                    if (seconds == 16) core.startStage2();
                    if (seconds > 20) core.attackBoss();
                    if (seconds % 4 == 0 && seconds > 20) core.randomThunder();
                    if (seconds > 30 && seconds % 12 == 0) core.ballThunder();
                }
                if (hp <= 3500 && stage == 2) {
                    stage++;
                    seconds = 0;
                    core.skipWord("智慧之神：不得不说小伙子");
                    core.pauseBgm();
                }
                if (stage >= 3) {
                    if (seconds == 4) core.skipWord("智慧之神：我越来越欣赏你了");
                    if (seconds == 8) core.skipWord("智慧之神：不过，你还得再过我一关！");
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
                        core.skipWord("智慧之神：还没有结束！");
                        core.startStage4();
                        setTimeout(function () {
                            flags.booming = true;
                            core.randomBoom();
                        }, 5000);
                    }
                    if (hp == 1000 && stage == 4) {
                        stage++;
                        flags.booming = false;
                        core.skipWord("智慧之神：还没有结束！！！！！！");
                        core.startStage5();
                        setTimeout(function () {
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
                        "\t[智慧之神,E557]\b[down,7,4]不错不错，你确实可以成为改变历史的人",
                        "\t[智慧之神,E557]\b[down,7,4]我的职责就到此结束了",
                        "\t[智慧之神,E557]\b[down,7,4]之后还是要看你自己了，千万不要让我失望！",
                        "\t[智慧之神,E557]\b[down,7,4]东边的机关门我已经替你打开了",
                        { "type": "openDoor", "loc": [13, 6], "floorId": "MT19" },
                        "\t[智慧之神,E557]\b[down,7,4]我这就把你传送出去",
                        { "type": "setValue", "name": "flag:boss1", "value": "true" },
                        { "type": "changeFloor", "floorId": "MT20", "loc": [7, 9] },
                        { "type": "function", "function": "function(){\ncore.deleteAllCanvas();\n}" },
                        { "type": "forbidSave" },
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
            var direction = Math.random() > 0.5 ? "horizon" : "vertical";
            // 执行次数
            if (!fromSelf) {
                var times = Math.ceil(Math.random() * 8) + 4;
                var nowTime = 1;
                var times1 = window.setInterval(function () {
                    core.intelligentArrow(true);
                    nowTime++;
                    if (nowTime >= times) {
                        clearInterval(times1);
                    }
                }, 200);
            }
            // 防重复
            if (core.dymCanvas["inteArrow" + loc + direction]) return core.intelligentArrow(true);
            // 危险区域
            if (!core.dymCanvas.danger1)
                core.createCanvas("danger1", 0, 0, 480, 480, 35);
            if (direction == "horizon") {
                for (var nx = 1; nx < 14; nx++) {
                    core.fillRect("danger1", nx * 32 + 2, loc * 32 + 2, 28, 28, [255, 0, 0, 0.6]);
                }
            } else {
                for (var ny = 1; ny < 14; ny++) {
                    core.fillRect("danger1", loc * 32 + 2, ny * 32 + 2, 28, 28, [255, 0, 0, 0.6]);
                }
            }
            // 箭
            if (!core.dymCanvas["inteArrow" + loc + direction])
                core.createCanvas("inteArrow" + loc + direction, 0, 0, 544, 544, 65);
            core.clearMap("inteArrow" + loc + direction);
            if (direction == "horizon")
                core.drawImage("inteArrow" + loc + direction, "arrow.png", 448, loc * 32, 102, 32);
            else
                core.drawImage("inteArrow" + loc + direction, "arrow.png", 0, 0, 259, 75, loc * 32 - 32, 480, 102, 32, Math.PI / 2);
            // 动画与伤害函数
            setTimeout(function () {
                core.playSound("arrow.mp3");
                core.deleteCanvas("danger1");
                // 动画效果
                var nloc = 0,
                    speed = 0;
                var damaged = {}
                var skill1 = window.setInterval(function () {
                    speed -= 1;
                    nloc += speed;
                    if (direction == "horizon")
                        core.relocateCanvas("inteArrow" + loc + direction, nloc, 0);
                    else
                        core.relocateCanvas("inteArrow" + loc + direction, 0, nloc);
                    if (nloc < -480) {
                        core.deleteCanvas("inteArrow" + loc + direction);
                        clearInterval(skill1);
                    }
                    // 伤害判定
                    if (!damaged[loc + direction]) {
                        var x = core.status.hero.loc.x,
                            y = core.status.hero.loc.y;
                        if (direction == "horizon") {
                            if (y == loc && Math.floor((480 + nloc) / 32) == x) {
                                damaged[loc + direction] = true;
                                core.drawHeroAnimate("hand");
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
                            if (x == loc && Math.floor((480 + nloc) / 32) == y) {
                                damaged[loc + direction] = true;
                                core.drawHeroAnimate("hand");
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
            core.drawHeroAnimate("magicAtk");
            // 在目标位置绘制动画
            if (!core.dymCanvas["door" + toX + "_" + toY])
                core.createCanvas("door" + toX + "_" + toY, 0, 0, 480, 480, 35);
            else core.clearMap("door" + toX + "_" + toY);
            var style = document.getElementById("door" + toX + "_" + toY).getContext("2d");
            var frame = 0,
                width = 0,
                a = 0.0128,
                speed = 0.64;
            // 动画
            var skill2 = window.setInterval(function () {
                frame++
                if (frame < 40) return;
                if (frame == 100) {
                    clearInterval(skill2);
                    // 执行传送
                    core.insertAction([
                        { "type": "changePos", "loc": [toX, toY] },
                    ]);
                    // 删除传送门
                    setTimeout(function () {
                        core.deleteCanvas("door" + toX + "_" + toY);
                    }, 2000);
                    return;
                }
                width += speed * 2;
                speed -= a;
                core.clearMap("door" + toX + "_" + toY);
                style.shadowColor = "rgba(255, 255, 255, 1)";
                style.shadowBlur = 7;
                style.filter = "blur(5px)";
                core.fillRect("door" + toX + "_" + toY, toX * 32, toY * 32 - 24, width, 48, [255, 255, 255, 0.7]);
                style.shadowColor = "rgba(0, 0, 0, 0.5)";
                style.filter = "blur(3px)";
                core.strokeRect("door" + toX + "_" + toY, toX * 32, toY * 32 - 24, width, 48, [255, 255, 255, 0.7], 3);
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
                core.createCanvas("icyMomentem", 0, 0, 480, 480, 35);
            else core.clearMap("icyMomentem");
            var skill3 = window.setInterval(function () {
                var nx = Math.floor(Math.random() * 13) + 1,
                    ny = Math.floor(Math.random() * 13) + 1;
                if (!locs.includes([nx, ny])) {
                    locs.push([nx, ny]);
                    core.fillRect("icyMomentem", locs[now][0] * 32 + 2, locs[now][1] * 32 + 2, 28, 28, [150, 150, 255, 0.6]);
                }
                if (now == times) {
                    clearInterval(skill3);
                    skill3Effect();
                }
                now++;
            }, 20);
            // 动画和伤害函数
            function skill3Effect () {
                // 防卡 setInterval
                var index = 0;
                var effect = window.setInterval(function () {
                    var x = core.status.hero.loc.x,
                        y = core.status.hero.loc.y;
                    core.clearMap("icyMomentem", locs[index][0] * 32, locs[index][1] * 32, 32, 32);
                    core.setBgFgBlock("bg", 167, locs[index][0], locs[index][1]);
                    core.drawAnimate("ice", locs[index][0], locs[index][1]);
                    if (x == locs[index][0] && y == locs[index][1]) {
                        core.drawHeroAnimate("hand");
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
                        setTimeout(function () {
                            deleteIce(locs);
                        }, 5000);
                    }
                    index++;
                }, 50);
            }
            // 删除函数
            function deleteIce (locs) {
                // 照样 setInterval
                var index = 0;
                var deleteIce = window.setInterval(function () {
                    core.setBgFgBlock("bg", 0, locs[index][0], locs[index][1]);
                    index++;
                    if (index >= locs.length) {
                        clearInterval(deleteIce);
                        core.deleteCanvas("icyMomentem");
                        setTimeout(function () {
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
            core.createCanvas("flash", 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(function () {
                core.clearMap("flash");
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect("flash", 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas("flash");
                }
                if (frame == 8) {
                    changeWeather();
                }
            });
            // 切换天气
            function changeWeather () {
                core.setWeather();
                core.setWeather("rain", 10);
                core.setWeather("fog", 8);
                // 色调也得换
                core.setCurtain([0, 0, 0, 0.3]);
                // bgm
                core.playBgm("towerBoss2.mp3");
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
                core.createCanvas("thunderDanger", 0, 0, 480, 480, 35);
            else core.clearMap("thunderDanger");
            // 3*3范围
            for (var nx = x - 1; nx <= x + 1; nx++) {
                for (var ny = y - 1; ny <= y + 1; ny++) {
                    core.fillRect("thunderDanger", nx * 32 + 2, ny * 32 + 2, 28, 28, [255, 255, 255, 0.6]);
                }
            }
            core.deleteCanvas("flash");
            setTimeout(function () {
                core.playSound("thunder.mp3");
            }, 500);
            setTimeout(function () {
                core.deleteCanvas("thunderDanger");
                core.drawThunder(x, y, power);
            }, 1000);
        };
        // 绘制
        this.drawThunder = function (x, y, power) {
            var route = core.getThunderRoute(x * 32 + 16, y * 32 + 16, power);
            // 开始绘制
            if (!core.dymCanvas.thunder)
                core.createCanvas("thunder", 0, 0, 480, 480, 65);
            else core.clearMap("thunder");
            var style = core.dymCanvas.thunder;
            style.shadowColor = "rgba(220, 220, 255, 1)";
            style.shadowBlur = power;
            style.filter = "blur(2.5px)";
            for (var num in route) {
                // 一个个绘制
                for (var i = 0; i < route[num].length - 1; i++) {
                    var now = route[num][i],
                        next = route[num][i + 1];
                    core.drawLine("thunder", now[0], now[1], next[0], next[1], "#ffffff", 2.5);
                }
            }
            // 伤害
            core.getThunderDamage(x, y, power);
            // 闪一下
            var frame1 = 0,
                alpha = 0.5;
            if (!core.dymCanvas.flash)
                core.createCanvas("flash", 0, 0, 480, 480, 160);
            else core.clearMap("flash");
            var thunderFlash = window.setInterval(function () {
                alpha -= 0.05;
                frame1++;
                core.clearMap("flash");
                core.fillRect("flash", 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (frame1 >= 10) {
                    clearInterval(thunderFlash);
                    core.deleteCanvas("flash");
                    // 删除闪电
                    setTimeout(function () {
                        core.deleteCanvas("thunder");
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
            var ballThunder = window.setInterval(function () {
                // 画布
                if (!core.dymCanvas["ballThunder" + now])
                    core.createCanvas("ballThunder" + now, 0, 0, 480, 480, 35);
                else core.clearMap("ballThunder" + now);
                var nx = Math.floor(Math.random() * 13) + 1,
                    ny = Math.floor(Math.random() * 13) + 1;
                // 添加位置 绘制危险区域
                if (!locs.includes([nx, ny])) {
                    locs.push([nx, ny]);
                    // 横竖都要画
                    for (var mx = 1; mx < 14; mx++) {
                        core.fillRect("ballThunder" + now, mx * 32 + 2, ny * 32 + 2, 28, 28, [190, 190, 255, 0.6]);
                    }
                    for (var my = 1; my < 14; my++) {
                        core.fillRect("ballThunder" + now, nx * 32 + 2, my * 32 + 2, 28, 28, [190, 190, 255, 0.6]);
                    }
                }
                now++;
                if (now >= times) {
                    clearInterval(ballThunder);
                    setTimeout(function () {
                        thunderAnimate(locs);
                    }, 1000);
                }
            }, 200);
            // 动画 伤害
            function thunderAnimate (locs) {
                var frame = 0;
                // 画布
                if (!core.dymCanvas.ballAnimate)
                    core.createCanvas("ballAnimate", 0, 0, 480, 480, 65);
                else core.clearMap("ballAnimate");
                var style = core.dymCanvas.ballAnimate;
                style.shadowColor = "rgba(255, 255, 255, 1)";
                var damaged = [];
                var animate = window.setInterval(function () {
                    core.clearMap("ballAnimate");
                    for (var i = 0; i < locs.length; i++) {
                        style.shadowBlur = 16 * Math.random();
                        // 错开执行动画
                        if (frame - 10 * i > 0) {
                            var now = frame - 10 * i;
                            if (now == 1) core.playSound("electron.mp3");
                            // 动画
                            var nx = locs[i][0] * 32 + 16,
                                ny = locs[i][1] * 32 + 16;
                            if (now <= 2) {
                                core.fillCircle("ballAnimate", nx, ny, 16 + 3 * now, [255, 255, 255, 0.9]);
                            } else {
                                // 上
                                core.fillCircle("ballAnimate", nx, ny - 4 * now, 7 + 2 * Math.random(), [255, 255, 255, 0.7]);
                                // 下
                                core.fillCircle("ballAnimate", nx, ny + 4 * now, 7 + 2 * Math.random(), [255, 255, 255, 0.7]);
                                // 左
                                core.fillCircle("ballAnimate", nx - 4 * now, ny, 7 + 2 * Math.random(), [255, 255, 255, 0.7]);
                                // 右
                                core.fillCircle("ballAnimate", nx + 4 * now, ny, 7 + 2 * Math.random(), [255, 255, 255, 0.7]);
                            }
                            // 清除危险区域
                            core.clearMap("ballThunder" + i, nx - 16, ny - 16 - 4 * now, 32, 32);
                            core.clearMap("ballThunder" + i, nx - 16, ny - 16 + 4 * now, 32, 32);
                            core.clearMap("ballThunder" + i, nx - 16 - 4 * now, ny - 16, 32, 32);
                            core.clearMap("ballThunder" + i, nx - 16 + 4 * now, ny - 16, 32, 32);
                            // 伤害
                            if (!damaged[i]) {
                                var x = core.status.hero.loc.x,
                                    y = core.status.hero.loc.y;
                                if (((Math.floor((nx - 16 - 4 * now) / 32) == x ||
                                    Math.floor((nx - 16 + 4 * now) / 32) == x) && locs[i][1] == y) ||
                                    ((Math.floor((ny - 16 - 4 * now) / 32) == y ||
                                        Math.floor((ny - 16 + 4 * now) / 32) == y) && locs[i][0] == x)) {
                                    damaged[i] = true
                                    core.status.hero.hp -= 3000;
                                    core.popupDamage(3000, x, y, false);
                                    core.updateStatusBar();
                                    core.playSound("electron.mp3");
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
            };
        };
        // ------ 第三阶段 3500~0 ------ //
        this.startStage3 = function () {
            // 闪烁
            core.createCanvas("flash", 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(function () {
                core.clearMap("flash");
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect("flash", 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas("flash");
                }
                if (frame == 8) {
                    core.playSound("thunder.mp3");
                    changeTerra();
                    core.insertAction([
                        { "type": "changePos", "loc": [7, 7] },
                    ]);
                }
            });
            // 改变地形
            function changeTerra () {
                for (var nx = 0; nx < 15; nx++) {
                    for (var ny = 0; ny < 15; ny++) {
                        if (nx == 0 || nx == 14 || ny == 0 || ny == 14) {
                            core.removeBlock(nx, ny);
                        }
                        if ((nx == 1 || nx == 13 || ny == 1 || ny == 13) &&
                            nx != 0 && nx != 14 && ny != 0 && ny != 14) {
                            core.setBlock(527, nx, ny);
                        }
                    }
                }
                core.createCanvas("tower7", 0, 0, 480, 480, 15);
                // 画贴图
                core.drawImage("tower7", "tower7.jpeg", 360, 0, 32, 480, 0, 0, 32, 480);
                core.drawImage("tower7", "tower7.jpeg", 840, 0, 32, 480, 448, 0, 32, 480);
                core.drawImage("tower7", "tower7.jpeg", 392, 0, 416, 32, 32, 0, 416, 32);
                core.drawImage("tower7", "tower7.jpeg", 392, 448, 416, 32, 32, 448, 416, 32);
                core.setBlock("E557", 7, 2);
                core.playBgm("towerBoss3.mp3");
            }
        };
        // 进入第四阶段
        this.startStage4 = function () {
            // 闪烁
            core.createCanvas("flash", 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(function () {
                core.clearMap("flash");
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect("flash", 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas("flash");
                }
                if (frame == 8) {
                    core.playSound("thunder.mp3");
                    changeTerra();
                    core.insertAction([
                        { "type": "changePos", "loc": [7, 7] },
                    ]);
                }
            });
            // 改变地形
            function changeTerra () {
                for (var nx = 1; nx < 14; nx++) {
                    for (var ny = 1; ny < 14; ny++) {
                        if (nx == 1 || nx == 13 || ny == 1 || ny == 13) {
                            core.removeBlock(nx, ny);
                        }
                        if ((nx == 2 || nx == 12 || ny == 2 || ny == 12) &&
                            nx != 1 && nx != 13 && ny != 1 && ny != 13) {
                            core.setBlock(527, nx, ny);
                        }
                    }
                }
                core.createCanvas("tower7", 0, 0, 480, 480, 15);
                // 画贴图
                core.drawImage("tower7", "tower7.jpeg", 360, 0, 64, 480, 0, 0, 64, 480);
                core.drawImage("tower7", "tower7.jpeg", 776, 0, 64, 480, 416, 0, 64, 480);
                core.drawImage("tower7", "tower7.jpeg", 424, 0, 352, 64, 64, 0, 352, 64);
                core.drawImage("tower7", "tower7.jpeg", 424, 416, 352, 64, 64, 416, 352, 64);
                core.setBlock("E557", 7, 3);
            }
        };
        // 进入第五阶段
        this.startStage5 = function () {
            // 闪烁
            core.createCanvas("flash", 0, 0, 480, 480, 160);
            var alpha = 0;
            var frame = 0;
            var start1 = window.setInterval(function () {
                core.clearMap("flash");
                frame++;
                if (frame <= 8) alpha += 0.125;
                else alpha -= 0.01;
                core.fillRect("flash", 0, 0, 480, 480, [255, 255, 255, alpha]);
                if (alpha == 0) {
                    clearInterval(start1);
                    core.deleteCanvas("flash");
                }
                if (frame == 8) {
                    core.playSound("thunder.mp3");
                    changeTerra();
                    core.insertAction([
                        { "type": "changePos", "loc": [7, 7] },
                    ]);
                }
            });
            // 改变地形
            function changeTerra () {
                for (var nx = 2; nx < 13; nx++) {
                    for (var ny = 2; ny < 13; ny++) {
                        if (nx == 2 || nx == 12 || ny == 2 || ny == 12) {
                            core.removeBlock(nx, ny);
                        }
                        if ((nx == 3 || nx == 11 || ny == 3 || ny == 11) &&
                            nx != 2 && nx != 12 && ny != 2 && ny != 12) {
                            core.setBlock(527, nx, ny);
                        }
                    }
                }
                core.createCanvas("tower7", 0, 0, 480, 480, 15);
                // 画贴图
                core.drawImage("tower7", "tower7.jpeg", 360, 0, 96, 480, 0, 0, 96, 480);
                core.drawImage("tower7", "tower7.jpeg", 744, 0, 96, 480, 384, 0, 96, 480);
                core.drawImage("tower7", "tower7.jpeg", 456, 0, 288, 96, 96, 0, 288, 96);
                core.drawImage("tower7", "tower7.jpeg", 456, 384, 288, 96, 96, 384, 288, 96);
                core.setBlock("E557", 7, 4);
            }
        };
        // 链状闪电 随机连接 碰到勇士则受伤
        this.chainThunder = function () {
            // 随机次数
            var times = Math.ceil(Math.random() * 6) + 3;
            // 画布
            if (!core.dymCanvas.chainDanger)
                core.createCanvas("chainDanger", 0, 0, 480, 480, 35);
            else core.clearMap("chainDanger");
            // setInterval执行
            var locs = [],
                now = 0;
            var chain = window.setInterval(function () {
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
                    core.drawLine("chainDanger", locs[now - 1][0] * 32 + 16, locs[now - 1][1] * 32 + 16,
                        nx * 32 + 16, ny * 32 + 16, [220, 100, 255, 0.6], 3);
                }
                if (now >= times) {
                    clearInterval(chain);
                    setTimeout(function () {
                        core.getChainRoute(locs);
                        core.deleteCanvas("chainDanger");
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
                core.createCanvas("chain", 0, 0, 480, 480, 65);
            else core.clearMap("chain");
            var style = core.dymCanvas.chain;
            style.shadowBlur = 3;
            style.shadowColor = "rgba(255, 255, 255, 1)";
            style.filter = "blur(2px)";
            // 当然还是setInterval
            var frame = 0,
                now = 0;
            var animate = window.setInterval(function () {
                if (now >= route.length - 1) {
                    clearInterval(animate);
                    setTimeout(function () { core.deleteCanvas("chain"); }, 1000);
                    return;
                }
                frame++;
                if (frame % 2 != 0) return;
                core.drawLine("chain", route[now][0], route[now][1], route[now + 1][0], route[now + 1][1], "#ffffff", 3);
                // 节点
                if (now == 0) {
                    core.fillCircle("chain", route[0][0], route[0][1], 7, "#ffffff");
                }
                if ((route[now + 1][0] - 16) % 32 == 0 && (route[now + 1][1] - 16) % 32 == 0) {
                    core.fillCircle("chain", route[now + 1][0], route[now + 1][1], 7, "#ffffff");
                }
                // 判断伤害
                core.lineDamage(route[now][0], route[now][1], route[now + 1][0], route[now + 1][1], 4000);
                now++;
            }, 20);
        };
        // 链状闪电 获得闪电路径
        this.getChainRoute = function (locs) {
            // 照样用setInterval
            var now = 0,
                routes = [];
            var route = window.setInterval(function () {
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
                    if (Math.sqrt(Math.pow(ny - ty, 2) + Math.pow(nx - tx, 2)) <= 100) {
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
            flags.boom = window.setInterval(function () {
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
                core.createCanvas("boom", 0, 0, 480, 480, 65);
            else core.clearMap("boom");
            var boomAnimate = window.setInterval(function () {
                if (boomLocs.length == 0) return;
                if (!flags.booming && boomLocs.length == 0) {
                    clearInterval(boomAnimate);
                    return;
                }
                core.clearMap("boom");
                boomLocs.forEach(function (loc, index) {
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
                    var angle = loc[2] * Math.PI / 50;
                    // 开始绘制
                    core.fillCircle("boom", x, y, 3, [255, 50, 50, alpha]);
                    core.strokeCircle("boom", x, y, radius, [255, 50, 50, alpha], 2);
                    // 旋转的线
                    core.drawLine("boom", x + radius * Math.cos(angle), y + radius * Math.sin(angle),
                        x + (radius + 15) * Math.cos(angle), y + (radius + 15) * Math.sin(angle), [255, 50, 50, alpha], 1);
                    angle += Math.PI;
                    core.drawLine("boom", x + radius * Math.cos(angle), y + radius * Math.sin(angle),
                        x + (radius + 15) * Math.cos(angle), y + (radius + 15) * Math.sin(angle), [255, 50, 50, alpha], 1);
                    // 炸弹 下落
                    if (loc[2] > 70) {
                        var h = y - (20 * (85 - loc[2]) + 2.8 * Math.pow(85 - loc[2], 2));
                        core.drawImage("boom", "boom.png", x - 18, h - 80, 36, 80);
                    }
                    if (loc[2] == 85) {
                        core.drawAnimate("explosion1", (x - 16) / 32, (y - 16) / 32);
                        boomLocs.splice(index, 1);
                        if (boomLocs.length == 0) core.deleteCanvas("boom");
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
            if ((x1 < x * 32 - 12 && x2 < x * 32 - 12) || (x1 > x * 32 + 12 && x2 > x * 32 + 12) ||
                (y1 < y * 32 - 16 && y2 < y * 32 - 16) || (y1 > y * 32 + 16 && y2 > y * 32 + 16)) return;
            // 对角线的端点是否在直线异侧 勇士视为24 * 32
            for (var time = 1; time <= 2; time++) {
                // 左下右上
                if (time == 1) {
                    var loc1 = [x * 32 - 12, y * 32 + 16],
                        loc2 = [x * 32 + 12, y * 32 - 16];
                    // 直线方程 y == (y2 - y1) / (x2 - x1) * (x - x1) + y1
                    var n1 = (y2 - y1) / (x2 - x1) * (loc1[0] - x1) + y1 - loc1[1],
                        n2 = (y2 - y1) / (x2 - x1) * (loc2[0] - x1) + y1 - loc2[1];
                    if (n1 * n2 <= 0) {
                        core.status.hero.hp -= damage;
                        core.popupDamage(damage, x, y, false);
                        core.updateStatusBar();
                        core.playSound("electron.mp3");
                        if (core.status.hero.hp < 0) {
                            core.status.hero.hp = 0;
                            core.updateStatusBar();
                            core.events.lose();
                            return;
                        }
                        return;
                    }
                } else { // 左上右下
                    var loc1 = [x * 32 - 12, y * 32 - 16],
                        loc2 = [x * 32 + 12, y * 32 + 16];
                    // 直线方程 y == (y2 - y1) / (x2 - x1) * (x - x1) + y1
                    var n1 = (y2 - y1) / (x2 - x1) * (loc1[0] - x1) + y1 - loc1[1],
                        n2 = (y2 - y1) / (x2 - x1) * (loc2[0] - x1) + y1 - loc2[1];
                    if (n1 * n2 <= 0) {
                        core.status.hero.hp -= damage;
                        core.popupDamage(damage, x, y, false);
                        core.updateStatusBar();
                        core.playSound("electron.mp3");
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
    "weatherSuperimpose": function () {
        // 天气叠加功能
        ////// 更改天气效果 //////
        control.prototype.setWeather = function (type, level) {
            // 非雨雪
            if (type == null) {
                Object.keys(core.control.weathers).forEach(function (one) {
                    core.deleteCanvas('weather' + one);
                });
                core.animateFrame.weather.type = [];
                core.animateFrame.weather.nodes = {};
                core.animateFrame.weather.level = {};
                core.animateFrame.weather.time = {};
                return;
            }
            if (!core.animateFrame.weather.level || level == null)
                core.animateFrame.weather.level = {};
            if (!core.animateFrame.weather.type) core.animateFrame.weather.type = [];
            level = core.clamp(parseInt(level) || 5, 1, 10);
            // 当前天气：则忽略
            if (core.animateFrame.weather.type.includes(type) && level == core.animateFrame.weather.level[type]) return;
            if (core.animateFrame.weather.nodes[type]) return;
            // 计算当前的宽高
            core.createCanvas('weather' + type, 0, 0, core.__PIXELS__, core.__PIXELS__, 80);
            core.animateFrame.weather.type.push(type);
            core.animateFrame.weather.level[type] = level;
            this._setWeather_createNodes(type, level);
        };
        control.prototype._setWeather_createNodes = function (type, level) {
            var number = level * parseInt(20 * core.bigmap.width * core.bigmap.height / (core.__SIZE__ * core.__SIZE__));
            if (!core.animateFrame.weather.nodes[type]) core.animateFrame.weather.nodes[type] = [];
            switch (type) {
                case 'rain':
                    for (var a = 0; a < number; a++) {
                        core.animateFrame.weather.nodes.rain.push({
                            'x': Math.random() * core.bigmap.width * 32,
                            'y': Math.random() * core.bigmap.height * 32,
                            'l': Math.random() * 2.5,
                            'xs': -4 + Math.random() * 4 + 2,
                            'ys': Math.random() * 10 + 10
                        })
                    }
                    break;
                case 'snow':
                    for (var a = 0; a < number; a++) {
                        core.animateFrame.weather.nodes.snow.push({
                            'x': Math.random() * core.bigmap.width * 32,
                            'y': Math.random() * core.bigmap.height * 32,
                            'r': Math.random() * 5 + 1,
                            'd': Math.random() * Math.min(level, 200),
                        })
                    }
                    break;
                case 'fog':
                    if (core.animateFrame.weather.fog) {
                        core.animateFrame.weather.nodes[type] = [{
                            'level': number,
                            'x': 0,
                            'y': -core.__PIXELS__ / 2,
                            'dx': -Math.random() * 1.5,
                            'dy': Math.random(),
                            'delta': 0.001,
                        }];
                    }
                    break;
                case 'cloud':
                    if (core.animateFrame.weather.cloud) {
                        core.animateFrame.weather.nodes[type] = [{
                            'level': number,
                            'x': 0,
                            'y': -core.__PIXELS__ / 2,
                            'dx': -Math.random() * 1.5,
                            'dy': Math.random(),
                            'delta': 0.001,
                        }];
                    }
                    break;
                case 'sun':
                    if (core.animateFrame.weather.sun) {
                        // 直接绘制
                        core.clearMap('weather' + type);
                        core.setAlpha('weather' + type, level / 10);
                        core.drawImage('weather' + type, core.animateFrame.weather.sun, 0, 0,
                            core.animateFrame.weather.sun.width, core.animateFrame.weather.sun.height, 0, 0, core.__PIXELS__, core.__PIXELS__);
                        core.setAlpha('weather' + type, 1);
                    }
                    break;
            }
        };
        core.registerAnimationFrame("weather", true, function (timestamp) {
            var weather = core.animateFrame.weather;
            if (!weather.type) return;
            weather.type.forEach(function (one) {
                if (timestamp - weather.time[one] <= 30 || !core.dymCanvas["weather" + one]) return;
                core.control["_animationFrame_weather_" + one]();
                weather.time[one] = timestamp;
            });
        });
        // 雨
        control.prototype._animationFrame_weather_rain = function () {
            var ctx = core.dymCanvas.weatherrain,
                ox = core.bigmap.offsetX,
                oy = core.bigmap.offsetY;
            core.clearMap('weatherrain');
            ctx.strokeStyle = 'rgba(174,194,224,0.8)';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            core.animateFrame.weather.nodes.rain.forEach(function (p) {
                ctx.beginPath();
                ctx.moveTo(p.x - ox, p.y - oy);
                ctx.lineTo(p.x + p.l * p.xs - ox, p.y + p.l * p.ys - oy);
                ctx.stroke();
                p.x += p.xs;
                p.y += p.ys;
                if (p.x > core.bigmap.width * 32 || p.y > core.bigmap.height * 32) {
                    p.x = Math.random() * core.bigmap.width * 32;
                    p.y = -10;
                }
            });
            ctx.fill();
        };
        // 雪
        control.prototype._animationFrame_weather_snow = function () {
            var ctx = core.dymCanvas.weathersnow,
                ox = core.bigmap.offsetX,
                oy = core.bigmap.offsetY;
            core.clearMap('weathersnow');
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            if (!core.animateFrame.weather.data) core.animateFrame.weather.data = {};
            core.animateFrame.weather.data.snow = core.animateFrame.weather.data.snow || 0;
            core.animateFrame.weather.data.snow += 0.01;
            var angle = core.animateFrame.weather.data.snow;
            core.animateFrame.weather.nodes.snow.forEach(function (p) {
                ctx.moveTo(p.x - ox, p.y - oy);
                ctx.arc(p.x - ox, p.y - oy, p.r, 0, Math.PI * 2, true);
                // update
                p.x += Math.sin(angle) * core.animateFrame.weather.level.snow;
                p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
                if (p.x > core.bigmap.width * 32 + 5 || p.x < -5 || p.y > core.bigmap.height * 32) {
                    if (Math.random() > 1 / 3) {
                        p.x = Math.random() * core.bigmap.width * 32;
                        p.y = -10;
                    } else {
                        if (Math.sin(angle) > 0)
                            p.x = -5;
                        else
                            p.x = core.bigmap.width * 32 + 5;
                        p.y = Math.random() * core.bigmap.height * 32;
                    }
                }
            });
            ctx.fill();
        };
        // 图片天气
        control.prototype.__animateFrame_weather_image = function (image, type) {
            if (!image) return;
            var node = core.animateFrame.weather.nodes[type][0];
            core.setAlpha('weather' + type, node.level / 500);
            var wind = 1.5;
            var width = image.width,
                height = image.height;
            node.x += node.dx * wind;
            node.y += (2 * node.dy - 1) * wind;
            if (node.x + 3 * width <= core.__PIXELS__) {
                node.x += 4 * width;
                while (node.x > 0) node.x -= width;
            }
            node.dy += node.delta;
            if (node.dy >= 1) {
                node.delta = -0.001;
            } else if (node.dy <= 0) {
                node.delta = 0.001;
            }
            if (node.y + 3 * height <= core.__PIXELS__) {
                node.y += 4 * height;
                while (node.y > 0) node.y -= height;
            } else if (node.y >= 0) {
                node.y -= height;
            }
            for (var i = 0; i < 3; ++i) {
                for (var j = 0; j < 3; ++j) {
                    if (node.x + (i + 1) * width <= 0 || node.x + i * width >= core.__PIXELS__ ||
                        node.y + (j + 1) * height <= 0 || node.y + j * height >= core.__PIXELS__)
                        continue;
                    core.drawImage('weather' + type, image, node.x + i * width, node.y + j * height);
                }
            }
            core.setAlpha('weather' + type, 1);
        };
        // 雾
        control.prototype._animationFrame_weather_fog = function () {
            core.clearMap('weatherfog');
            this.__animateFrame_weather_image(core.animateFrame.weather.fog, 'fog');
        };
        // 云
        control.prototype._animationFrame_weather_cloud = function () {
            core.clearMap('weathercloud');
            this.__animateFrame_weather_image(core.animateFrame.weather.cloud, 'cloud');
        }
    },
    "popupDamage": function () {
        // 伤害弹出
        // 复写阻激夹域检测
        control.prototype.checkBlock = function () {
            var x = core.getHeroLoc('x'),
                y = core.getHeroLoc('y'),
                loc = x + "," + y;
            var damage = core.status.checkBlock.damage[loc];
            if (damage) {
                core.addPop(x * 32 + 12, y * 32 + 20, damage, '#f00', '#000');
                core.status.hero.hp -= damage;
                var text = (Object.keys(core.status.checkBlock.type[loc] || {}).join("，")) || "伤害";
                core.drawTip("受到" + text + damage + "点");
                core.drawHeroAnimate("zone");
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

        /** 血量弹出 */
        function pop () {
            var ctx = core.getContextByName('pop');
            if (!ctx) ctx = core.createCanvas('pop', 0, 0, 416, 416, 90);
            core.clearMap(ctx);
            var list = core.status.pop || [];
            var count = 0;
            list.forEach(function (one) {
                // 由frame计算出dy
                var dy = 6 - one.frame * 0.2;
                var dx = 1;
                one.py -= dy;
                one.px += dx;
                one.frame++;
                // 绘制
                if (one.frame >= 60) core.setAlpha(ctx, 3 - one.frame / 30);
                else core.setAlpha(ctx, 1);
                core.fillBoldText(ctx, one.value, one.px, one.py, one.color || 'red', one.boldColor || 'black', '20px normal');
                if (one.frame >= 90) count++;
            });
            if (count > 0) list.splice(0, count);
        }
        if (!main.replayChecking) core.registerAnimationFrame('pop', true, pop);

        /** 添加弹出内容 */
        this.addPop = function (px, py, value, color, boldColor) {
            var data = { px: px, py: py, value: value, color: color, boldColor: boldColor, frame: 0 };
            if (!core.status.pop) core.status.pop = [data];
            else core.status.pop.push(data);
        }
    },
    "bgms": function () {
        // bgm查看界面
        ////// 播放背景音乐 //////
        control.prototype.playBgm = function (bgm, startTime) {
            core.listenBgm(bgm);
            bgm = core.getMappedName(bgm);
            if (main.mode != 'play' || !core.material.bgms[bgm]) return;
            // 如果不允许播放
            if (!core.musicStatus.bgmStatus) {
                try {
                    core.musicStatus.playingBgm = bgm;
                    core.musicStatus.lastBgm = bgm;
                    core.material.bgms[bgm].pause();
                } catch (e) {
                    main.log(e);
                }
                return;
            }
            this.setMusicBtn();
            try {
                this._playBgm_play(bgm, startTime);
            } catch (e) {
                console.log("无法播放BGM " + bgm);
                main.log(e);
                core.musicStatus.playingBgm = null;
            }
        };
        // 索引 名称 中文名 是否听过
        var bgms = [
            [0, "title.mp3", "标题界面", true],
            [1, "cave.mp3", "山洞", false],
            [2, "grass.mp3", "草原", false],
            [3, "mount.mp3", "山路", false],
            [4, "escape.mp3", "逃脱", false],
            [5, "plot1.mp3", "勇气之路", false],
            [6, "tower.mp3", "智慧之塔", false],
            [7, "beforeBoss.mp3", "战前独白", false],
            [8, "towerBoss.mp3", "Boss战一", false],
            [9, "towerBoss2.mp3", "Boss战二", false],
            [10, "towerBoss3.mp3", "Boss战三", false],
        ];
        var selector = 0; // 光标
        // 获得听歌信息
        this.getListenedBgm = function () {
            var listened = core.getLocalStorage("listening", []);
            listened.forEach(function (bgm, index) {
                if (bgm) {
                    bgms[index][3] = true;
                } else {
                    bgms[index][3] = false;
                }
            });
            return bgms;
        };
        // 听bgm
        this.listenBgm = function (bgm) {
            for (var i in bgms) {
                if (bgms[i][1] == bgm) {
                    var listened = core.getLocalStorage("listening", []);
                    listened[i] = true;
                    core.setLocalStorage("listening", listened);
                    return;
                }
            }
        };
        // 获得每一项bgm的文字描述
        this.getBgmContent = function (index) {
            switch (index) {
                case 0:
                    return ["川井憲次 —— 破裂足音", "出自    永远的七日之都",
                        "人类不断地超越自己，突破极限",
                        "他们无穷的智慧推动着社会的发展和科技的进步",
                        "而这一次，我们要上演的是  人类：开天辟地"
                    ];
                case 1:
                    return ["Faodial —— Wren",
                        "为躲避危险，人们进入了山洞，便成就了今日我们的主角 —— 山顶洞人",
                        "作为初始山洞的bgm，该bgm既有略微紧张的氛围，也有山顶洞人踏出山洞的勇气"
                    ];
                case 2:
                    return ["李伟伟 —— 大树与鹿",
                        "草原嘛，就要欢快一点，这个bgm完美地表现出了草原的自然情景",
                        "而作为人类踏出山洞的第一步，这个bgm也展示出了人们的踏出山洞的积极"
                    ];
                case 3:
                    return ["Epistra —— Dream Of A Dream",
                        "三段完全重复的旋律，演绎出了人们在挫折中一次次跌倒，又一次次爬起的坚强的毅力，他们绝对不会失败，因为，他们有探索未知的勇气"
                    ];
                case 4:
                    return ["Gareth Coker —— Escaping a Foul Presence", "出自    Ori and the Will of the Wisps (奥日与萤火意志)",
                        "作为奥日2里面的“横向银之树”追逐战，这个bgm充分展示了对方的强大和自身的弱小，放在这里也再合适不过"
                    ];
                case 5:
                    return ["英雄联盟等 —— Rags To Rings", "出自    英雄联盟全球总决赛BP音乐",
                        "作为总决赛的BP音乐，该音乐绝佳地体现出了选手禁用/选择英雄时的紧张与勇气，而用在这里，充分地体现出了人们探索未知的勇气"
                    ];
                case 6:
                    return ["Falcom Sound Team jdk —— A Light Illuminating The Depths", "出自    英雄传说：零之轨迹",
                        "一个紧张刺激的音乐，作为boss战前一个区域的bgm，可以极大程度地激励玩家的斗志，也体现出了将要面对的敌人的强大"
                    ];
                case 7:
                    return ["Evan LE NY —— Some Calm", "出自    SpaceChem (太空化学)",
                        "作为战前boss的独白bgm，充分体现出了未来的人们的穷奢极恶造成的结局的悲惨，同时又展现出智慧之神忠于责任，改变历史的决心"
                    ];
                case 8:
                    return ["Evan LE NY —— Opening", "出自    SpaceChem (太空化学)",
                        "boss战第一阶段，战斗还不是很激烈，用这个不太振奋，同时又能展现出boss的强大的bgm，再合适不过"
                    ];
                case 9:
                    return ["Laura Shigihara —— Brainiac Maniac", "出自    Plants Vs Zombies (植物大战僵尸)",
                        "植物大战僵尸的僵王bgm，作为boss战的第二阶段，充分体现出了智慧之神改变历史的决心"
                    ];
                case 10:
                    return ["Epic Score —— MechaDragon",
                        "智慧，可以抵御恐惧，可以引向光明，智慧之神为改变历史付出一切，借助科技之力磨练人才，为拯救人类做出历史性贡献，更为人类开天辟地画上绝佳一笔"
                    ];
            }
        };
        // 绘制
        this.drawBgms = function () {
            this.getListenedBgm();
            if (!core.dymCanvas.bgms)
                core.createCanvas("bgms", 0, 0, 480, 480, 150);
            else core.clearMap("bgms");
            core.playBgm(bgms[selector][1]);
            var style = core.dymCanvas.bgms;
            style.shadowBlur = 0;
            // 背景
            core.fillRect("bgms", 0, 0, 480, 480, [0, 0, 0, 0.9]);
            core.drawLine("bgms", 128, 0, 128, 480, "#ffffff", 1);
            core.drawLine("bgms", 128, 458, 480, 458, "#ffffff", 1);
            core.drawLine("bgms", 0, 420, 128, 420, "#ffffff", 1);
            core.drawLine("bgms", 0, 450, 128, 450, "#ffffff", 1);
            // 绘制bgm
            core.setTextAlign("bgms", "center");
            style.shadowColor = "rgba(200, 200, 50, 1)";
            style.shadowBlur = 5;
            var text;
            bgms.forEach(function (bgm, index) {
                if (!bgm[3]) text = "?????";
                else text = bgm[2];
                // 绘制
                core.fillText("bgms", text, 64, 32 * index + 28, "#ffffff", "24px normal");
            });
            // 绘制光标
            core.drawUIEventSelector(1, "winskin.png", 0, 32 * selector + 4, 128, 30, 160);
            // 绘制说明文字
            core.fillText("bgms", bgms[selector][2], 304, 32, "#ffffff", "28px normal");
            core.fillText("bgms", "点击右侧任意位置退出", 304, 475, "#ffffff", "18px normal");
            core.fillText("bgms", "设为BGM", 64, 444, "#ffffff", "24px normal");
            core.fillText("bgms", "还原BGM", 64, 474, "#ffffff", "24px normal");
            style.shadowBlur = 2;
            var content = this.getBgmContent(selector).join("\n");
            core.drawTextContent("bgms", content, { top: 350, left: 132, maxWidth: 344, fontSize: 16, align: "center" });
            // 图片
            style.shadowColor = "rgba(255, 255, 255, 1)";
            style.shadowBlur = 10;
            core.drawImage("bgms", bgms[selector][1].split(".")[0] + ".jpg", 138, 42, 332, 305);
        };
        // 键盘操作
        this.keyBoardBgms = function (keycode, loop, origin) {
            if (!origin) origin = selector;
            loop = loop || false;
            switch (keycode) {
                case 40:
                    if (loop && selector == bgms.length - 1) {
                        selector = origin;
                        return;
                    }
                    if (selector < bgms.length - 1) {
                        selector++;
                        if (!bgms[selector][3]) return this.keyBoardBgms(keycode, true, origin);
                        core.playSound("光标移动");
                    }
                    return;
                case 38:
                    if (loop && selector == bgms.length - 1) {
                        selector = origin;
                        return;
                    }
                    if (selector > 0) {
                        selector--;
                        if (!bgms[selector][3]) return this.keyBoardBgms(keycode, true, origin);
                        core.playSound("光标移动");
                    }
                    return;
            }
            core.playSound("取消");
            core.insertAction({ "type": "break" });
            return;
        };
        // 点击操作
        this.clickBgms = function (px, py) {
            if (px >= 128) {
                core.playSound("取消");
                core.insertAction({ "type": "break" });
                return;
            }
            if (py > 420 && py <= 450) {
                core.playSound("光标移动");
                core.drawTip("成功设置为默认bgm，还原后将会恢复地图bgm");
                flags.__bgm__ = bgms[selector][1];
                return;
            }
            if (py > 450) {
                core.playSound("光标移动");
                core.drawTip("成功恢复地图bgm");
                delete flags.__bgm__;
                return;
            }
            // 获得点击索引
            if (py <= 420) {
                if (bgms[Math.floor(py / 32)] && bgms[Math.floor(py / 32)][3]) {
                    selector = Math.floor(py / 32);
                    core.playSound("光标移动");
                }
                return;
            }
        };
        // 操作
        this.actionInBgms = function () {
            if (flags.type == 0) return this.keyBoardBgms(flags.keycode);
            else return this.clickBgms(flags.px, flags.py);
        };
        // 开启
        this.openBgms = function () {
            // 插入事件
            core.playSound("打开界面");
            core.insertAction([{
                "type": "while",
                "condition": "true",
                "data": [
                    { "type": "function", "function": "function () { core.plugin.drawBgms(); }" },
                    { "type": "wait" },
                    { "type": "function", "function": "function() { core.plugin.actionInBgms(); }" }
                ]
            },
            {
                "type": "function",
                "function": "function () { core.playBgm(flags.__bgm__ || core.status.maps[core.status.floorId].bgm || '');core.deleteCanvas('bgms');core.ui.clearUIEventSelector();}"
            }
            ]);
        };
    },
    "drawSkills": function () {
        // 技能查看界面 0索引 1名称 2快捷键 3拥有情况 4简介
        var skills = [
            [0, "断灭之刃", "1", false, "开启后会在战斗时会额外增加一定量的攻击， 但同时减少一定量的防御，具体属性请在技能树界面查看"],
            [1, "跳跃", "2", false, "消耗200点生命值，困难消耗400点，每个地图最多使用3次\n1.人物前方一格是怪物，那么将怪物踢至面前第一个不能通行的图块后\n2.前方是不可通行的图块，那么将会跳至面前第一个可以通行的图块\n3.跳跃时物品视为不可通行，但使用技能时不能对着物品使用"]
        ];
        // 获得拥有的技能
        this.getHadSkills = function () {
            skills[0][3] = flags.bladeOn || false;
            skills[1][3] = flags.skill2 || false;
        };
        // 绘制
        this.drawSkills = function () {
            this.getHadSkills();
            if (!core.dymCanvas.skills)
                core.createCanvas("skills", 0, 0, 480, 480, 150);
            else core.clearMap("skills");
            var style = core.dymCanvas.skills;
            style.shadowBlur = 0;
            // 分栏绘制
            core.fillRect("skills", 0, 0, 480, 480, [0, 0, 0, 0.9]);
            core.drawLine("skills", 0, 80, 480, 80, "#ffffff", 1);
            core.drawLine("skills", 0, 260, 480, 260, "#ffffff", 1);
            core.drawLine("skills", 80, 0, 80, 480, [255, 255, 255, 0.5], 1);
            core.drawLine("skills", 400, 0, 400, 480, [255, 255, 255, 0.5], 1);
            // 绘制技能
            style.shadowColor = "rgba(200, 200, 50, 1)";
            core.setTextAlign("skills", "center");
            style.shadowBlur = 5;
            if (skills[0][3])
                core.fillText("skills", skills[0][1], 40, 50, "#ffffff", "20px normal");
            if (skills[1][3])
                core.fillText("skills", skills[1][1], 40, 180, "#ffffff", "20px normal");
            if (skills[0][3])
                core.fillText("skills", "快捷键" + skills[0][2], 440, 50, "#ffffff", "20px normal");
            if (skills[1][3])
                core.fillText("skills", "快捷键" + skills[1][2], 440, 180, "#ffffff", "20px normal");
            style.shadowBlur = 2;
            if (skills[0][3])
                core.drawTextContent("skills", skills[0][4], { left: 90, maxWidth: 300, fontSize: 16, top: 10 });
            if (skills[1][3])
                core.drawTextContent("skills", skills[1][4], { left: 90, maxWidth: 300, fontSize: 16, top: 90 });
        };
        // 操作 都是直接退出
        this.actionInSkills = function () {
            core.insertAction({ "type": "break" });
        };
        // 开启
        this.openSkills = function () {
            // 插入事件
            core.playSound("打开界面");
            core.insertAction([{
                "type": "while",
                "condition": "true",
                "data": [
                    { "type": "function", "function": "function () { core.plugin.drawSkills(); }" },
                    { "type": "wait" },
                    { "type": "function", "function": "function() { core.plugin.actionInSkills(); }" }
                ]
            },
            {
                "type": "function",
                "function": "function () { core.deleteCanvas('skills');}"
            }
            ]);
        };
    },
    "equipBox": function () {
        // 注：///// *** 裹起来的区域： 该区域内参数可以随意更改调整ui绘制 不会影响总体布局
        // 请尽量修改该区域而不是其他区域 修改的时候最好可以对照现有ui修改

        ///// *** 道具类型
        // cls对应name
        var itemClsName = {
            "constants": "永久道具",
            "tools": "消耗道具",
        }
        // 一页最大放的道具数量 将把整个道具左栏分成num份 每份是一个道具项
        var itemNum = 12;
        ///// ***

        // 背景设置
        this.drawBoxBackground = function (ctx) {
            core.setTextAlign(ctx, "left");
            core.clearMap(ctx);
            core.deleteCanvas("_selector");
            var info = core.status.thisUIEventInfo || {};

            ///// *** 背景设置
            var max = core.__PIXELS__;
            var x = 2,
                y = x,
                w = max - x * 2,
                h = w;
            var borderWidth = 2,
                borderRadius = 5, // radius:圆角矩形的圆角半径
                borderStyle = "#fff";
            var backgroundColor = "gray";
            // 设置背景不透明度(0.85)
            var backgroundAlpha = 0.85;
            ///// ***

            var start_x = x + borderWidth / 2,
                start_y = y + borderWidth / 2,
                width = max - start_x * 2,
                height = max - start_y * 2;

            // 渐变色背景的一个例子(黑色渐变白色)：
            // 有关渐变色的具体知识请网上搜索canvas createGradient了解

            var grd = ctx.createLinearGradient(x, y, x + w, y);
            grd.addColorStop(0, "#555555");
            grd.addColorStop(1, "#cccccc");
            backgroundColor = grd;

            // 使用图片背景要注释掉下面的strokeRect和fillRoundRect
            // 图片背景的一个例子：
            /*
               core.drawImage(ctx, "xxx.png", x, y, w, h);
               core.strokeRect(ctx, x, y, w, h, borderStyle, borderWidth);
            */
            core.setAlpha(ctx, backgroundAlpha);
            core.strokeRoundRect(ctx, x, y, w, h, borderRadius, borderStyle, borderWidth);
            core.fillRoundRect(ctx, start_x, start_y, width, height, borderRadius, backgroundColor);
            core.setAlpha(ctx, 1);

            ///// *** 左栏配置
            var leftbar_height = height;
            // 左边栏宽度(width*0.6) 本身仅为坐标使用 需要与底下的rightbar_width(width*0.4)同时更改
            var leftbar_width = width * 0.6;
            ///// ***

            // xxx_right参数 代表最右侧坐标
            var leftbar_right = start_x + leftbar_width - borderWidth / 2;
            var leftbar_bottom = start_y + leftbar_height;
            var leftbar_x = start_x;
            var leftbar_y = start_y;

            ///// *** 道具栏配置
            var boxName_color = "#fff";
            var boxName_fontSize = 15;
            var boxName_font = core.ui._buildFont(boxName_fontSize, true);
            var arrow_x = 10 + start_x;
            var arrow_y = 10 + start_y;
            var arrow_width = 20;
            var arrow_style = "white";
            // 暂时只能是1 否则不太行 等待新样板(2.7.3)之后对drawArrow做优化
            var arrow_lineWidth = 1;
            // 右箭头
            var rightArrow_right = leftbar_right - 10;
            // 道具内栏顶部坐标 本质是通过该项 控制(道具栏顶部文字和箭头)与道具内栏顶部的间隔
            var itembar_top = arrow_y + 15;
            ///// ***

            var itembar_right = rightArrow_right;
            var boxName = core.status.event.id == "toolbox" ? "\r[yellow]道具栏\r | 装备栏" : "道具栏 | \r[yellow]装备栏\r";
            core.drawArrow(ctx, arrow_x + arrow_width, arrow_y, arrow_x, arrow_y, arrow_style, arrow_lineWidth);
            core.drawArrow(ctx, rightArrow_right - arrow_width, arrow_y, rightArrow_right, arrow_y, arrow_style, arrow_lineWidth);
            core.setTextAlign(ctx, "center");
            core.setTextBaseline(ctx, "middle");
            var changeBox = function () {
                var id = core.status.event.id;
                core.closePanel();
                if (id == "toolbox") core.openEquipbox();
                else core.openToolbox();
            }
            core.fillText(ctx, boxName, (leftbar_right + leftbar_x) / 2, arrow_y + 2, boxName_color, boxName_font);

            ///// *** 底栏按钮
            var pageBtn_radius = 8;
            // xxx_left 最左侧坐标
            var pageBtn_left = leftbar_x + 3;
            var pageBtn_right = leftbar_right - 3;
            // xxx_bottom 最底部坐标
            var pageBtn_bottom = leftbar_bottom - 2;
            var pageBtn_borderStyle = "#fff";
            var pageBtn_borderWidth = 2;
            var pageText_color = "#fff";
            // 底部按钮与上面的道具内栏的间隔大小
            var bottomSpace = 8;
            ///// ***

            core.drawItemListbox_setPageBtn(ctx, pageBtn_left, pageBtn_right, pageBtn_bottom, pageBtn_radius, pageBtn_borderStyle, pageBtn_borderWidth);
            var page = info.page || 1;
            var pageFontSize = pageBtn_radius * 2 - 4;
            var pageFont = core.ui._buildFont(pageFontSize);
            core.setPageItems(page);
            var num = itemNum;
            if (core.status.event.id == "equipbox") num -= 5;
            var maxPage = info.maxPage;
            var pageText = page + " / " + maxPage;
            core.setTextAlign(ctx, "center");
            core.setTextBaseline(ctx, "bottom");
            core.fillText(ctx, pageText, (leftbar_x + leftbar_right) / 2, pageBtn_bottom, pageText_color, pageFont);
            core.addUIEventListener(start_x, start_y, leftbar_right - start_x, arrow_y - start_y + 13, changeBox);
            var itembar_height = Math.ceil(pageBtn_bottom - pageBtn_radius * 2 - pageBtn_borderWidth / 2 - bottomSpace - itembar_top);
            var oneItemHeight = (itembar_height - 4) / itemNum;
            return {
                x: start_x,
                y: start_y,
                width: width,
                height: height,
                leftbar_right: leftbar_right,
                obj: {
                    x: arrow_x,
                    y: itembar_top,
                    width: itembar_right - arrow_x,
                    height: itembar_height,
                    oneItemHeight: oneItemHeight
                }
            }
        }

        this.drawItemListbox = function (ctx, obj) {
            ctx = ctx || core.canvas.ui;
            var itembar_x = obj.x,
                itembar_y = obj.y,
                itembar_width = obj.width,
                itembar_height = obj.height,
                itemNum = obj.itemNum,
                oneItemHeight = obj.oneItemHeight;
            var itembar_right = itembar_x + itembar_width;
            var info = core.status.thisUIEventInfo || {};
            var obj = {};
            var page = info.page || 1,
                index = info.index,
                select = info.select || {};

            ///// *** 道具栏内栏配置
            var itembar_style = "black";
            var itembar_alpha = 0.7;
            // 一个竖屏下减少道具显示的例子:
            // if (core.domStyle.isVertical) itemNum = 10;
            // 每个道具项的上下空隙占总高度的比例
            var itembar_marginHeightRatio = 0.2;
            // 左右间隔空隙
            var item_marginLeft = 2;
            var item_x = itembar_x + 2,
                item_y = itembar_y + 2,
                item_right = itembar_right - 2,
                itemName_color = "#fff";
            // 修改此项以更换闪烁光标
            var item_selector = "winskin.png";
            ///// ***

            core.setAlpha(ctx, itembar_alpha);
            core.fillRect(ctx, itembar_x, itembar_y, itembar_width, itembar_height, itembar_style);
            core.setAlpha(ctx, 1);
            var pageItems = core.setPageItems(page);
            var marginHeight = itembar_marginHeightRatio * oneItemHeight;
            core.setTextBaseline(ctx, "middle");
            var originColor = itemName_color;
            for (var i = 0; i < pageItems.length; i++) {
                itemName_color = originColor;
                var item = pageItems[i];
                // 设置某个的字体颜色的一个例子
                // if (item.id == "xxx") itemName_color = "green";
                core.drawItemListbox_drawItem(ctx, item_x, item_right, item_y, oneItemHeight, item_marginLeft, marginHeight, itemName_color, pageItems[i]);
                if (index == i + 1) core.ui._drawWindowSelector(item_selector, item_x + 1, item_y - 1, item_right - item_x - 2, oneItemHeight - 2);
                item_y += oneItemHeight;
            }
        }

        this.drawToolboxRightbar = function (ctx, obj) {
            ctx = ctx || core.canvas.ui;
            var info = core.status.thisUIEventInfo || {};
            var page = info.page || 1,
                index = info.index || 1,
                select = info.select || {};
            var start_x = obj.x,
                start_y = obj.y,
                width = obj.width,
                height = obj.height;
            var toolboxRight = start_x + width,
                toolboxBottom = start_y + height;


            ///// *** 侧边栏(rightbar)背景设置(物品介绍)
            var rightbar_width = width * 0.4;
            var rightbar_height = height;
            var rightbar_lineWidth = 2;
            var rightbar_lineStyle = "#fff";
            ///// ***

            var rightbar_x = toolboxRight - rightbar_width - rightbar_lineWidth / 2;
            var rightbar_y = start_y;
            core.drawLine(ctx, rightbar_x, rightbar_y, rightbar_x, rightbar_y + rightbar_height, rightbar_lineStyle, rightbar_lineWidth);

            // 获取道具id(有可能为null)
            var itemId = select.id;
            var item = core.material.items[itemId];

            ///// *** 侧边栏物品Icon信息
            var iconRect_y = rightbar_y + 10;
            // space：间距
            // 这里布局设定iconRect与侧边栏左边框 itemName与工具栏右边框 itemRect与itemName的间距均为space
            var space = 15;
            var iconRect_x = rightbar_x + space;
            var iconRect_radius = 2,
                iconRect_width = 32,
                iconRect_height = 32,
                iconRect_style = "#fff",
                iconRect_lineWidth = 2;
            ///// ***

            var iconRect_bottom = iconRect_y + iconRect_height,
                iconRect_right = iconRect_x + iconRect_width;

            ///// *** 侧边栏各项信息
            var itemTextFontSize = 15,
                itemText_x = iconRect_x - 4,
                itemText_y = Math.floor(start_y + rightbar_height * 0.25), // 坐标取整防止模糊
                itemClsFontSize = 15,
                itemClsFont = core.ui._buildFont(itemClsFontSize),
                itemClsColor = "#fff",
                itemCls_x = itemText_x - itemClsFontSize / 2,
                itemCls_middle = (iconRect_bottom + itemText_y) / 2, //_middle代表文字的中心y坐标
                itemNameFontSize = 18,
                itemNameColor = "#fff",
                itemNameFont = core.ui._buildFont(itemNameFontSize, true);
            var itemName_x = iconRect_right + space;
            var itemName_middle = iconRect_y + iconRect_height / 2 + iconRect_lineWidth;
            // 修改这里可以编辑未选中道具时的默认值
            var defaultItem = {
                cls: "constants",
                name: "未知道具",
                text: "没有道具最永久"
            }
            var defaultEquip = {
                cls: "equips",
                name: "未知装备",
                text: "一无所有，又何尝不是一种装备",
                equip: {
                    type: "装备"
                }
            }
            ///// ***

            var originItem = item;
            if (core.status.event.id == "equipbox") item = item || defaultEquip;
            item = item || defaultItem;
            var itemCls = item.cls,
                itemName = item.name,
                itemText = item.text;
            /* 一个根据道具id修改道具名字(右栏)的例子
             * if (item.id == "xxx") itemNameColor = "red";
             */
            var itemClsName = core.getItemClsName(item);
            var itemNameMaxWidth = rightbar_width - iconRect_width - iconRect_lineWidth * 2 - space * 2;
            core.strokeRoundRect(ctx, iconRect_x, iconRect_y, iconRect_width, iconRect_height, iconRect_radius, iconRect_style, iconRect_lineWidth);
            if (item.id)
                core.drawIcon(ctx, item.id, iconRect_x + iconRect_lineWidth / 2, iconRect_y + iconRect_lineWidth / 2, iconRect_width - iconRect_lineWidth, iconRect_height - iconRect_lineWidth);
            core.setTextAlign(ctx, "left");
            core.setTextBaseline(ctx, "middle");
            core.fillText(ctx, itemName, itemName_x, itemName_middle, itemNameColor, itemNameFont, itemNameMaxWidth);
            core.fillText(ctx, "【" + itemClsName + "】", itemCls_x, itemCls_middle, itemClsColor, itemClsFont);
            var statusText = "";
            if (core.status.event.id == "equipbox") {
                var type = item.equip.type;
                if (typeof type == "string") type = core.getEquipTypeByName(type);
                var compare = core.compareEquipment(item.id, core.getEquip(type));
                if (info.select.action == "unload") compare = core.compareEquipment(null, item.id);
                // --- 变化值...
                for (var name in core.status.hero) {
                    if (typeof core.status.hero[name] != 'number') continue;
                    var nowValue = core.getRealStatus(name);
                    // 查询新值
                    var newValue = Math.floor((core.getStatus(name) + (compare.value[name] || 0)) *
                        (core.getBuff(name) * 100 + (compare.percentage[name] || 0)) / 100);
                    if (nowValue == newValue) continue;
                    var color = newValue > nowValue ? '#00FF00' : '#FF0000';
                    nowValue = core.formatBigNumber(nowValue);
                    newValue = core.formatBigNumber(newValue);
                    statusText += core.getStatusLabel(name) + " " + nowValue + "->\r[" + color + "]" + newValue + "\r\n";
                }
            }
            itemText = statusText + itemText;
            core.drawTextContent(ctx, itemText, {
                left: itemText_x,
                top: itemText_y,
                bold: false,
                color: "white",
                align: "left",
                fontSize: itemTextFontSize,
                maxWidth: rightbar_width - (itemText_x - rightbar_x) * 2 + itemTextFontSize / 2
            });

            ///// *** 退出按钮设置
            var btnRadius = 10;
            var btnBorderWidth = 2;
            var btnRight = toolboxRight - 2;
            var btnBottom = toolboxBottom - 2;
            var btnBorderStyle = "#fff";
            ///// ***

            // 获取圆心位置
            var btn_x = btnRight - btnRadius - btnBorderWidth / 2;
            btn_y = btnBottom - btnRadius - btnBorderWidth / 2;
            core.drawToolbox_setExitBtn(ctx, btn_x, btn_y, btnRadius, btnBorderStyle, btnBorderWidth);

            ///// *** 使用按钮设置
            var useBtnHeight = btnRadius * 2;
            // 这里不设置useBtnWidth而是根据各项数据自动得出width
            var useBtnRadius = useBtnHeight / 2;
            var useBtn_x = rightbar_x + 4,
                useBtn_y = btnBottom - useBtnHeight;
            var useBtnBorderStyle = "#fff";
            var useBtnBorderWidth = btnBorderWidth;
            ///// ***

            core.drawToolbox_setUseBtn(ctx, useBtn_x, useBtn_y, useBtnRadius, useBtnHeight, useBtnBorderStyle, useBtnBorderWidth);
        }

        this.drawEquipbox_drawOthers = function (ctx, obj) {
            var info = core.status.thisUIEventInfo;

            ///// *** 装备格设置
            var equipList_lineWidth = 2;
            var equipList_boxSize = 32;
            var equipList_borderWidth = 2;
            var equipList_borderStyle = "#fff";
            var equipList_nameColor = "#fff";
            ///// ***

            var equipList_x = obj.x + 4,
                equipList_bottom = obj.obj.y - equipList_lineWidth,
                equipList_y = equipList_bottom - obj.obj.oneItemHeight * reduceItem - 2,
                equipList_height = equipList_bottom - equipList_y;
            var equipList_right = obj.leftbar_right,
                equipList_width = equipList_right - equipList_x;
            core.drawLine(ctx, obj.x, equipList_bottom + equipList_lineWidth / 2, equipList_right, equipList_bottom + equipList_lineWidth / 2, equipList_borderStyle, equipList_lineWidth);
            var toDrawList = core.status.globalAttribute.equipName,
                len = toDrawList.length;

            ///// *** 装备格设置
            var maxItem = 4;
            var box_width = 32,
                box_height = 32,
                box_borderStyle = "#fff",
                box_selectBorderStyle = "gold", // 选中的装备格的颜色
                box_borderWidth = 2;
            var boxName_fontSize = 14,
                boxName_space = 2,
                boxName_color = "#fff"; // 装备格名称与上面的装备格框的距离
            var maxLine = Math.ceil(len / maxItem);
            ///// ***
            var l = Math.sqrt(len)
            if (Math.pow(l) == len && len != 4) {
                if (l <= maxItem) maxItem = l;
            }
            maxItem = Math.min(toDrawList.length, maxItem);
            info.equips = maxItem;

            var boxName_font = core.ui._buildFont(boxName_fontSize);
            // 总宽高减去所有装备格宽高得到空隙大小
            var oneBoxWidth = box_width + box_borderWidth * 2;
            var oneBoxHeight = box_height + boxName_fontSize + boxName_space + 2 * box_borderWidth;
            var space_y = (equipList_height - maxLine * oneBoxHeight) / (1 + maxLine),
                space_x = (equipList_width - maxItem * oneBoxWidth) / (1 + maxItem);
            var box_x = equipList_x + space_x,
                box_y = equipList_y + space_y;
            for (var i = 0; i < len; i++) {
                var id = core.getEquip(i),
                    name = toDrawList[i];
                var selectBorder = false;
                if (core.status.thisUIEventInfo.select.type == i) selectBorder = true;
                var borderStyle = selectBorder ? box_selectBorderStyle : box_borderStyle;
                core.drawEquipbox_drawOne(ctx, name, id, box_x, box_y, box_width, box_height, boxName_space, boxName_font, boxName_color, borderStyle, box_borderWidth);
                var todo = new Function("core.clickOneEquipbox('" + id + "'," + i + ")");
                core.addUIEventListener(box_x - box_borderWidth / 2, box_y - box_borderWidth / 2, oneBoxWidth, oneBoxHeight, todo);
                box_x += space_x + oneBoxWidth;
                if ((i + 1) % maxItem == 0) {
                    box_x = equipList_x + space_x;
                    box_y += space_y + oneBoxHeight;
                }
            }
        }

        this.drawToolbox = function (ctx) {
            ctx = ctx || core.canvas.ui;
            core.status.thisEventClickArea = [];

            var info = core.drawBoxBackground(ctx);
            info.itemNum = itemNum;
            core.drawItemListbox(ctx, info.obj);
            core.drawToolboxRightbar(ctx, info);
            core.setTextBaseline(ctx, "alphabetic");
            core.setTextAlign("left");
        }

        var reduceItem = 4;
        this.drawEquipbox = function (ctx) {
            ctx = ctx || core.canvas.ui;
            core.status.thisEventClickArea = [];
            var info = core.drawBoxBackground(ctx);
            info.itemNum = itemNum - reduceItem;
            info.obj.y += info.obj.oneItemHeight * reduceItem;
            info.obj.height -= info.obj.oneItemHeight * reduceItem;
            core.drawItemListbox(ctx, info.obj);
            core.drawEquipbox_drawOthers(ctx, info);
            core.drawToolboxRightbar(ctx, info);
            core.setTextBaseline(ctx, "alphabetic");
            core.setTextAlign("left");
        }

        this.drawEquipbox_drawOne = function (ctx, name, id, x, y, width, height, space, font, color, style, lineWidth) {
            if (id) core.drawIcon(ctx, id, x + lineWidth / 2, y + lineWidth / 2, width, height);
            core.strokeRect(ctx, x, y, width + lineWidth, height + lineWidth, style, lineWidth);
            core.setTextAlign(ctx, "center");
            core.setTextBaseline(ctx, "top");
            var tx = (x + x + lineWidth / 2 + width) / 2,
                ty = y + height + lineWidth / 2 * 3 + space;
            core.fillText(ctx, name, tx, ty, color, font);
            core.setTextBaseline(ctx, "alphabetic");
            core.setTextAlign("left");
        }

        this.drawItemListbox_drawItem = function (ctx, left, right, top, height, marginLeft, marginHeight, style, id) {
            var info = core.status.thisUIEventInfo;
            var nowClick = info.index;
            var item = core.material.items[id] || {};
            var name = item.name || "???";
            var num = core.itemCount(id) || 0;
            var fontSize = Math.floor(height - marginHeight * 2);
            core.setTextAlign(ctx, "right");
            var numText = "x" + num;
            core.fillText(ctx, numText, right - marginLeft, top + height / 2, style, core.ui._buildFont(fontSize));
            if (name != "???") core.drawIcon(ctx, id, left + marginLeft, top + marginHeight, fontSize, fontSize);
            var text_x = left + marginLeft + fontSize + 2;
            var maxWidth = right - core.calWidth(ctx, numText) - text_x;
            core.setTextAlign(ctx, "left");
            core.fillText(ctx, name, text_x, top + height / 2, style, core.ui._buildFont(fontSize), maxWidth);
            var todo = new Function("var id = '" + id + "';\ncore.clickItemFunc(id)");
            core.addUIEventListener(left, top, right - left, height, todo);
        }

        this.setPageItems = function (page) {
            var num = itemNum;
            if (core.status.event.id == "equipbox") num -= reduceItem;
            var info = core.status.thisUIEventInfo;
            if (!info) return;
            page = page || info.page;
            var items = core.getToolboxItems(core.status.event.id == "toolbox" ? "all" : "equips");
            info.allItems = items;
            var maxPage = Math.ceil(items.length / num);
            info.maxPage = maxPage;
            var pageItems = items.slice((page - 1) * num, page * num);
            info.pageItems = pageItems;
            info.maxItem = pageItems.length;
            if (items.length == 0 && pageItems.length == 0) info.index = null;
            if (pageItems.length == 0 && info.page > 1) {
                info.page = Math.max(1, info.page - 1);
                return core.setPageItems(info.page);
            }
            return pageItems;
        }

        this.drawToolbox_setExitBtn = function (ctx, x, y, r, style, lineWidth) {
            core.strokeCircle(ctx, x, y, r, style, lineWidth);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var textSize = Math.sqrt(2) * r;
            core.fillText(ctx, "x", x, y, style, core.ui._buildFont(textSize), textSize);
            core.setTextAlign(ctx, "start");
            core.setTextBaseline(ctx, "top");

            var todo = function () {
                core.closePanel();
            }
            core.addUIEventListener(x - r, y - r, r * 2, r * 2, todo);
        }

        this.drawToolbox_setUseBtn = function (ctx, x, y, r, h, style, lineWidth) {
            core.setTextAlign(ctx, "left");
            core.setTextBaseline(ctx, "top");
            var fontSize = h - 4;
            var font = core.ui._buildFont(fontSize);
            var text = core.status.event.id == "toolbox" ? "使用" : "装备";
            if (core.status.thisUIEventInfo.select.action == "unload") text = "卸下";
            var w = core.calWidth(ctx, text, font) + 2 * r + lineWidth / 2;

            core.strokeRoundRect(ctx, x, y, w, h, r, style, lineWidth);
            core.fillText(ctx, text, x + r, y + lineWidth / 2 + 2, style, font);

            var todo = function () {
                core.useSelectItemInBox();
            }
            core.addUIEventListener(x, y, w, h, todo);
        }

        this.drawItemListbox_setPageBtn = function (ctx, left, right, bottom, r, style, lineWidth) {
            var offset = lineWidth / 2 + r;

            var x = left + offset;
            var y = bottom - offset;
            var pos = Math.sqrt(2) / 2 * (r - lineWidth / 2);
            core.fillPolygon(ctx, [
                [x - pos, y],
                [x + pos - 2, y - pos],
                [x + pos - 2, y + pos]
            ], style);
            core.strokeCircle(ctx, x, y, r, style, lineWidth);
            var todo = function () {
                core.addItemListboxPage(-1);
            }
            core.addUIEventListener(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4, todo);

            x = right - offset;
            core.fillPolygon(ctx, [
                [x + pos, y],
                [x - pos + 2, y - pos],
                [x - pos + 2, y + pos]
            ], style);
            core.strokeCircle(ctx, x, y, r, style, lineWidth);
            var todo = function () {
                core.addItemListboxPage(1);
            }
            core.addUIEventListener(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4, todo);
        }

        this.clickItemFunc = function (id) {
            var info = core.status.thisUIEventInfo;
            if (!info) return;
            if (info.select.id == id) return core.useSelectItemInBox();
            info.select = {};
            info.select.id = id;
            core.setIndexAndSelect('index');
            core.refreshBox();
        }

        this.clickOneEquipbox = function (id, type) {
            var info = core.status.thisUIEventInfo;
            if (!info) return;
            if (info.select.id == id && info.select.type == type) core.useSelectItemInBox();
            else core.status.thisUIEventInfo.select = {
                id: id,
                type: type,
                action: "unload"
            }
            return core.refreshBox();
        }

        core.ui.getToolboxItems = function (cls) {
            var list = Object.keys(core.status.hero.items[cls] || {});
            if (cls == "all") {
                for (var name in core.status.hero.items) {
                    if (name == "equips") continue;
                    list = list.concat(Object.keys(core.status.hero.items[name]));
                }
                return list.filter(function (id) {
                    return !core.material.items[id].hideInToolbox;
                }).sort();
            }

            if (this.uidata.getToolboxItems) {
                return this.uidata.getToolboxItems(cls);
            }
            return list.filter(function (id) {
                return !core.material.items[id].hideInToolbox;
            }).sort();
        }

        this.useSelectItemInBox = function () {
            var info = core.status.thisUIEventInfo;
            if (!info) return;
            if (!info.select.id) return;
            var id = info.select.id;
            if (core.status.event.id == "toolbox") {
                core.events.tryUseItem(id);
                // core.closePanel();
            } else if (core.status.event.id == "equipbox") {
                var action = info.select.action || "load";
                info.index = 1;
                if (action == "load") {
                    var type = core.getEquipTypeById(id);
                    core.loadEquip(id, function () {
                        core.status.route.push("equip:" + id);
                        info.select.type = type;
                        core.setIndexAndSelect("select");
                        core.drawEquipbox();
                    });
                } else {
                    var type = info.select.type;
                    core.unloadEquip(type, function () {
                        core.status.route.push("unEquip:" + type);
                        core.setIndexAndSelect("select");
                        core.drawEquipbox();
                    });
                }
            }
        }

        this.setIndexAndSelect = function (toChange) {
            var info = core.status.thisUIEventInfo;
            if (!info) return;
            core.setPageItems(info.page);
            var index = info.index || 1;
            var items = info.pageItems;
            if (info.select.type) {
                var type = info.select.type;
                id = core.getEquip(type);
                info.index = null;
                info.select = {
                    id: id,
                    action: "unload",
                    type: type
                };
                return;
            } else {
                info.select.type = null;
            }
            if (toChange == "index") info.index = items.indexOf(info.select.id) + 1;
            else {
                var id = info.pageItems[index - 1];
                info.select.id = id;
            }
        }

        this.addItemListboxPage = function (num) {
            var info = core.status.thisUIEventInfo;
            if (!info) return;
            var maxPage = info.maxPage || 1;
            info.page = info.page || 1;
            info.page += num;
            if (info.page <= 0) info.page = maxPage;
            if (info.page > maxPage) info.page = 1;
            info.index = 1;
            core.setPageItems(info.page);
            core.setIndexAndSelect("select");
            core.refreshBox();
        }

        this.addItemListboxIndex = function (num) {
            var info = core.status.thisUIEventInfo;
            if (!info) return;
            var maxItem = info.maxItem || 0;
            info.index = info.index || 0;
            info.index += num;
            if (info.index <= 0) info.index = 1;
            if (info.index > maxItem) info.index = maxItem;
            core.setIndexAndSelect("select");
            core.refreshBox();
        }

        this.addEquipboxType = function (num) {
            var info = core.status.thisUIEventInfo;
            var type = info.select.type;
            if (type == null && num > 0) info.select.type = 0;
            else info.select.type = type + num;
            var max = core.status.globalAttribute.equipName.length;
            if (info.select.type >= max) {
                info.select = {};
                return core.addItemListboxPage(0);
            } else {
                var m = Math.abs(info.select.type);
                if (info.select.type < 0) info.select.type = max - m;
                core.refreshBox();
                return;
            }
        }

        core.actions._keyDownToolbox = function (keycode) {
            if (!core.status.thisEventClickArea) return;
            if (keycode == 37) { // left
                core.addItemListboxPage(-1);
                return;
            }
            if (keycode == 38) { // up
                core.addItemListboxIndex(-1);
                return;
            }
            if (keycode == 39) { // right
                core.addItemListboxPage(1);
                return;
            }
            if (keycode == 40) { // down
                core.addItemListboxIndex(1);
                return;
            }
        }

        ////// 工具栏界面时，放开某个键的操作 //////
        core.actions._keyUpToolbox = function (keycode) {
            if (keycode == 81) {
                core.ui.closePanel();
                if (core.isReplaying())
                    core.control._replay_equipbox();
                else
                    core.openEquipbox();
                return;
            }
            if (keycode == 84 || keycode == 27 || keycode == 88) {
                core.closePanel();
                return;
            }
            if (keycode == 13 || keycode == 32 || keycode == 67) {
                var info = core.status.thisUIEventInfo;
                if (info.select) {
                    core.useSelectItemInBox();
                }
                return;
            }
        }

        core.actions._keyDownEquipbox = function (keycode) {
            if (!core.status.thisEventClickArea) return;
            if (keycode == 37) { // left
                var info = core.status.thisUIEventInfo;
                if (info.index != null) return core.addItemListboxPage(-1);
                return core.addEquipboxType(-1);
            }
            if (keycode == 38) { // up
                var info = core.status.thisUIEventInfo;
                if (info.index == 1) {
                    info.select.type = core.status.globalAttribute.equipName.length - 1;
                    core.setIndexAndSelect();
                    return core.refreshBox();
                }
                if (info.index) return core.addItemListboxIndex(-1);
                return core.addEquipboxType(-1 * info.equips);
            }
            if (keycode == 39) { // right
                var info = core.status.thisUIEventInfo;
                if (info.index != null) return core.addItemListboxPage(1);
                return core.addEquipboxType(1);
            }
            if (keycode == 40) { // down
                var info = core.status.thisUIEventInfo;
                if (info.index) return core.addItemListboxIndex(1);
                return core.addEquipboxType(info.equips);
            }
        }

        core.actions._keyUpEquipbox = function (keycode, altKey) {
            if (altKey && keycode >= 48 && keycode <= 57) {
                core.items.quickSaveEquip(keycode - 48);
                return;
            }
            if (keycode == 84) {
                core.ui.closePanel();
                if (core.isReplaying())
                    core.control._replay_toolbox();
                else
                    core.openToolbox();
                return;
            }
            if (keycode == 81 || keycode == 27 || keycode == 88) {
                core.closePanel();
                return;
            }
            if (keycode == 13 || keycode == 32 || keycode == 67) {
                var info = core.status.thisUIEventInfo;
                if (info.select) core.useSelectItemInBox();
                return;
            }
        }

        core.registerAction("ondown", "inEventClickAction", function (x, y, px, py) {
            if (!core.status.thisEventClickArea) return false;
            // console.log(px + "," + py);
            var info = core.status.thisEventClickArea;
            for (var i = 0; i < info.length; i++) {
                var obj = info[i];
                if (px >= obj.x && px <= obj.x + obj.width && py > obj.y && py < obj.y + obj.height) {
                    if (obj.todo) obj.todo();
                    break;
                }
            }
            return true;
        }, 51);
        core.registerAction("onclick", "stopClick", function () {
            if (core.status.thisEventClickArea) return true;
        }, 51);

        this.addUIEventListener = function (x, y, width, height, todo) {
            if (!core.status.thisEventClickArea) return;
            var obj = {
                x: x,
                y: y,
                width: width,
                height: height,
                todo: todo
            }
            core.status.thisEventClickArea.push(obj);
        }

        this.initThisEventInfo = function () {
            core.status.thisUIEventInfo = {
                page: 1,
                select: {}
            };
            core.status.thisEventClickArea = [];
        }

        this.refreshBox = function () {
            if (!core.status.event.id) return;
            if (core.status.event.id == "toolbox") core.drawToolbox();
            else core.drawEquipbox();
        }

        core.ui.closePanel = function () {
            if (core.status.hero && core.status.hero.flags) {
                // 清除全部临时变量
                Object.keys(core.status.hero.flags).forEach(function (name) {
                    if (name.startsWith("@temp@") || /^arg\d+$/.test(name)) {
                        delete core.status.hero.flags[name];
                    }
                });
            }
            this.clearUI();
            core.maps.generateGroundPattern();
            core.updateStatusBar(true);
            core.unlockControl();
            core.status.event.data = null;
            core.status.event.id = null;
            core.status.event.selection = null;
            core.status.event.ui = null;
            core.status.event.interval = null;
            core.status.thisUIEventInfo = null;
            core.status.thisEventClickArea = null
        }

        this.getItemClsName = function (item) {
            if (item == null) return itemClsName;
            if (item.cls == "equips") {
                if (typeof item.equip.type == "string") return item.equip.type;
                var type = core.getEquipTypeById(item.id);
                return core.status.globalAttribute.equipName[type];
            } else return itemClsName[item.cls] || item.cls;
        }

        core.events.openToolbox = function (fromUserAction) {
            if (core.isReplaying()) return;
            if (!this._checkStatus('toolbox', fromUserAction)) return;
            core.initThisEventInfo();
            core.drawToolbox();
        }

        core.events.openEquipbox = function (fromUserAction) {
            if (core.isReplaying()) return;
            if (!this._checkStatus('equipbox', fromUserAction)) return;
            core.initThisEventInfo();
            core.drawEquipbox();
        }

        core.control._replay_toolbox = function () {
            if (!core.isPlaying() || !core.isReplaying()) return;
            if (!core.status.replay.pausing) return core.drawTip("请先暂停录像");
            if (core.isMoving() || core.status.replay.animate || core.status.event.id)
                return core.drawTip("请等待当前事件的处理结束");

            core.lockControl();
            core.status.event.id = 'toolbox';
            core.drawToolbox();
        }

        core.control._replay_equipbox = function () {
            if (!core.isPlaying() || !core.isReplaying()) return;
            if (!core.status.replay.pausing) return core.drawTip("请先暂停录像");
            if (core.isMoving() || core.status.replay.animate || core.status.event.id)
                return core.drawTip("请等待当前事件的处理结束");

            core.lockControl();
            core.status.event.id = 'equipbox';
            core.drawEquipbox();
        }

        core.control._replayAction_item = function (action) {
            if (action.indexOf("item:") != 0) return false;
            var itemId = action.substring(5);
            if (!core.canUseItem(itemId)) return false;
            if (core.material.items[itemId].hideInReplay || core.status.replay.speed == 24) {
                core.useItem(itemId, false, core.replay);
                return true;
            }
            core.status.event.id = "toolbox";
            core.initThisEventInfo();
            var info = core.status.thisUIEventInfo;
            var items = core.getToolboxItems("all");
            core.setPageItems(1);
            var index = items.indexOf(itemId) + 1;
            info.page = Math.ceil(index / info.maxItem);
            info.index = index % info.maxItem || info.maxItem;
            core.setIndexAndSelect("select");
            core.setPageItems(info.page);
            core.drawToolbox();
            setTimeout(function () {
                core.ui.closePanel();
                core.useItem(itemId, false, core.replay);
            }, core.control.__replay_getTimeout());
            return true;
        }

        core.control._replayAction_equip = function (action) {
            if (action.indexOf("equip:") != 0) return false;
            var itemId = action.substring(6);
            var items = core.getToolboxItems('equips');
            var index = items.indexOf(itemId) + 1;
            if (index < 1) return false;
            core.status.route.push(action);
            if (core.material.items[itemId].hideInReplay || core.status.replay.speed == 24) {
                core.loadEquip(itemId, core.replay);
                return true;
            }
            core.status.event.id = "equipbox";
            core.initThisEventInfo();
            var info = core.status.thisUIEventInfo;
            core.setPageItems(1);
            info.page = Math.ceil(index / info.maxItem);
            info.index = index % info.maxItem || info.maxItem;
            core.setIndexAndSelect("select");
            core.setPageItems(info.page);
            core.drawEquipbox();
            setTimeout(function () {
                core.ui.closePanel();
                core.loadEquip(itemId, core.replay);
            }, core.control.__replay_getTimeout());
            return true;
        }

        core.control._replayAction_unEquip = function (action) {
            if (action.indexOf("unEquip:") != 0) return false;
            var equipType = parseInt(action.substring(8));
            if (!core.isset(equipType)) return false;
            core.status.route.push(action);
            if (core.status.replay.speed == 24) {
                core.unloadEquip(equipType, core.replay);
                return true;
            }
            core.status.event.id = "equipbox";
            core.initThisEventInfo();
            var info = core.status.thisUIEventInfo;
            core.setPageItems(1);
            info.select.type = equipType;
            core.setIndexAndSelect();
            core.drawEquipbox();
            setTimeout(function () {
                core.ui.closePanel();
                core.unloadEquip(equipType, core.replay);
            }, core.control.__replay_getTimeout());
            return true;
        }
        core.registerReplayAction("item", core.control._replayAction_item);
        core.registerReplayAction("equip", core.control._replayAction_equip);
        core.registerReplayAction("unEquip", core.control._replayAction_unEquip);
    },
    "chase": function () {
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
            [0, 0, 4600],
        ];
        // 效果函数
        var funcs = [
            [0, wolfRun],
            [550, shake1],
            [10000000]
        ];
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
                var floorId = "MT" + i;
                // 不可瞬移
                core.status.maps[floorId].cannotMoveDirectly = true;
                core.extractBlocks(floorId);
                for (var j = 0; j < core.status.maps[floorId].blocks.length; j++) {
                    var block = core.status.maps[floorId].blocks[j];
                    var cls = block.event.cls,
                        id = block.event.id;
                    if ((cls == "animates" || cls == "items") && !id.endsWith("Portal")) {
                        core.removeBlock(block.x, block.y, floorId);
                        j--;
                    }
                }
            }
        };
        // 函数们
        function wolfRun () {
            core.moveBlock(23, 17, ['down', 'down', 'down', 'down', 'down', 'down'], 80);
            setTimeout(function () {
                core.setBlock(508, 23, 23);
                core.moveBlock(23, 23, ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left',
                    'left', 'left', 'left', 'left', 'left', 'left', 'left',
                ], 80, true);
            }, 500);
        }
        // MT15函数1
        function shake1 () {
            core.vibrate("vertical", 1000, 25, 2);
            for (var tx = 53; tx < 58; tx++) {
                for (var ty = 3; ty < 8; ty++) {
                    core.setBlock(336, tx, ty);
                }
            }
            core.drawAnimate("explosion3", 55, 5);
            core.drawAnimate("stone", 55, 5);
            setTimeout(function () {
                core.setBlock(336, 58, 9);
                core.setBlock(336, 59, 9);
                core.drawAnimate("explosion1", 58, 9);
                core.drawAnimate("explosion1", 59, 9);
            }, 250);
            setTimeout(function () {
                core.setBlock(336, 53, 8);
                core.setBlock(336, 52, 8);
                core.drawAnimate("explosion1", 53, 8);
                core.drawAnimate("explosion1", 52, 8);
            }, 360);
            setTimeout(function () {
                core.setBlock(336, 51, 7);
                core.drawAnimate("explosion1", 51, 7);
            }, 750);
            setTimeout(function () {
                core.vibrate("vertical", 6000, 25, 1);
                core.setBlock(336, 47, 7);
                core.setBlock(336, 49, 9);
                core.drawAnimate("explosion1", 49, 9);
                core.drawAnimate("explosion1", 47, 7);
            }, 1000);
        }
        // 并行1
        function para1 () {
            if (core.status.floorId != "MT15") return;
            if (x == 45 && y == 8 && !flags.p11) {
                core.setBlock(336, 45, 9);
                core.drawAnimate("explosion1", 45, 9);
                flags.p11 = true;
            }
            if (x == 45 && y == 6 && !flags.p12) {
                core.setBlock(336, 44, 6);
                core.drawAnimate("explosion1", 44, 6);
                flags.p12 = true;
            }
            if (x == 45 && y == 4 && !flags.p13) {
                core.setBlock(336, 44, 4);
                core.drawAnimate("explosion1", 44, 4);
                core.drawAnimate("explosion1", 48, 6);
                core.removeBlock(48, 6);
                flags.p13 = true;
            }
            if (x == 41 && y == 3 && !flags.p14) {
                core.setBlock(336, 41, 4);
                core.setBlock(336, 32, 6);
                core.drawAnimate("explosion1", 41, 4);
                core.drawAnimate("explosion1", 32, 6);
                flags.p14 = true;
            }
            if (x == 35 && y == 3 && !flags.p15) {
                core.drawAnimate("explosion3", 37, 7);
                core.vibrate("vertical", 1000, 25, 10);
                for (var tx = 36; tx < 42; tx++) {
                    for (var ty = 4; ty < 11; ty++) {
                        core.setBlock(336, tx, ty);
                    }
                }
                flags.p15 = true;
            }
            if (x == 31 && y == 5 && !flags.p16) {
                core.vibrate("vertical", 10000, 25, 1);
                core.removeBlock(34, 8);
                core.removeBlock(33, 8);
                core.drawAnimate("explosion1", 34, 8);
                core.drawAnimate("explosion1", 33, 8);
                flags.p16 = true;
            }
            if (x == 33 && y == 7 && !flags.p17) {
                core.setBlock(336, 32, 9);
                core.drawAnimate("explosion1", 32, 9);
                flags.p17 = true;
            }
            if ((x == 33 || x == 34 || x == 35) && y == 9 && !flags.p18) {
                core.removeBlock(32, 9);
                core.drawAnimate("explosion1", 32, 9);
                flags.p18 = true;
            }
            if (x > 18 && x < 31 && y == 11 && !flags["p19" + x]) {
                core.setBlock(336, x + 1, 11);
                core.drawAnimate("explosion1", x + 1, 11);
                flags["p19" + x] = true;
            }
        }
        // 并行2
        function para2 () {
            if (core.status.floorId != "MT14") return;
            if (x == 126 && y == 7 && !flags.p21) {
                core.setBlock(336, 126, 6);
                core.setBlock(336, 124, 6);
                core.setBlock(336, 124, 9);
                core.setBlock(336, 126, 9);
                core.drawAnimate("explosion1", 126, 6);
                core.drawAnimate("explosion1", 124, 6);
                core.drawAnimate("explosion1", 124, 9);
                core.drawAnimate("explosion1", 126, 9);
                flags.p21 = true;
            }
            if (x == 123 && y == 7 && !flags.p22) {
                core.setBlock(508, 127, 7);
                core.jumpBlock(127, 7, 112, 7, 500, true);
                setTimeout(function () { core.setBlock(509, 112, 7); }, 520);
                core.drawHeroAnimate("amazed");
                core.setBlock(336, 121, 6);
                core.setBlock(336, 122, 6);
                core.setBlock(336, 120, 8);
                core.setBlock(336, 121, 8);
                core.setBlock(336, 122, 8);
                core.drawAnimate("explosion1", 121, 6);
                core.drawAnimate("explosion1", 122, 6);
                core.drawAnimate("explosion1", 120, 8);
                core.drawAnimate("explosion1", 121, 8);
                core.drawAnimate("explosion1", 122, 8);
                flags.p22 = true;
            }
            if (x == 110 && y == 10 && !flags.p23) {
                core.setBlock(336, 109, 11);
                core.removeBlock(112, 8);
                core.drawAnimate("explosion1", 109, 11);
                core.drawAnimate("explosion1", 112, 8);
                core.insertAction([
                    { "type": "moveHero", "time": 400, "steps": ["backward:1"] },
                ]);
                flags.p23 = true;
            }
            if (x == 112 && y == 8 && !flags.p24 && flags.p23) {
                core.jumpBlock(112, 7, 110, 4, 500, true);
                core.drawHeroAnimate("amazed");
                setTimeout(function () { core.setBlock(506, 110, 4); }, 540);
                flags.p24 = true;
            }
            if (x == 118 && y == 7 && !flags.p25) {
                core.setBlock(336, 117, 6);
                core.setBlock(336, 116, 6);
                core.setBlock(336, 115, 6);
                core.setBlock(336, 114, 6);
                core.setBlock(336, 117, 8);
                core.setBlock(336, 116, 8);
                core.drawAnimate("explosion1", 117, 6);
                core.drawAnimate("explosion1", 116, 6);
                core.drawAnimate("explosion1", 115, 6);
                core.drawAnimate("explosion1", 114, 6);
                core.drawAnimate("explosion1", 116, 8);
                core.drawAnimate("explosion1", 117, 8);
                flags.p25 = true;
            }
            if (x == 112 && y == 7 && !flags.p26) {
                core.setBlock(336, 112, 8);
                core.setBlock(336, 113, 7);
                core.drawAnimate("explosion1", 112, 8);
                core.drawAnimate("explosion1", 113, 7);
                flags.p26 = true;
            }
            if (x == 115 && y == 7 && !flags.p39) {
                for (var tx = 111; tx <= 115; tx++) {
                    core.setBlock(336, tx, 10);
                    core.drawAnimate("explosion1", tx, 10);
                }
                core.setBlock(336, 112, 8);
                core.drawAnimate("explosion1", 112, 8);
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
                core.vibrate("vertical", 3000, 25, 10);
                core.drawAnimate("explosion2", 119, 7);
                core.insertAction(
                    [{ "type": "autoText", "text": "\t[原始人]\b[down,hero]卧槽！！吓死我了！！", "time": 600 },]);
                core.removeBlock(105, 7);
                core.drawAnimate("explosion1", 105, 7);
                flags.p27 = true;
            }
            if (x == 97 && y == 3 && !flags.p28) {
                core.setBlock(336, 95, 3);
                core.setBlock(336, 93, 6);
                core.drawAnimate("explosion1", 95, 3);
                core.drawAnimate("explosion1", 93, 6);
                flags.p28 = true;
            }
            if (x == 88 && y == 6 && !flags.p29) {
                core.setBlock(336, 87, 4);
                core.setBlock(336, 88, 5);
                core.drawAnimate("explosion1", 87, 4);
                core.drawAnimate("explosion1", 88, 5);
                flags.p29 = true;
            }
            if (x == 86 && y == 6 && !flags.p30) {
                core.setBlock(336, 84, 6);
                core.setBlock(336, 85, 5);
                core.setBlock(336, 86, 8);
                core.drawAnimate("explosion1", 84, 6);
                core.drawAnimate("explosion1", 85, 5);
                core.drawAnimate("explosion1", 86, 8);
                flags.p30 = true;
            }
            if (x == 81 && y == 9 && !flags.p31) {
                core.setBlock(336, 81, 8);
                core.setBlock(336, 82, 11);
                core.drawAnimate("explosion1", 81, 8);
                core.drawAnimate("explosion1", 82, 11);
                flags.p31 = true;
            }
            if (x == 72 && y == 11 && !flags.p32) {
                core.setBlock(336, 73, 8);
                core.setBlock(336, 72, 4);
                core.drawAnimate("explosion1", 73, 8);
                core.drawAnimate("explosion1", 72, 4);
                flags.p32 = true;
            }
            if (x == 72 && y == 7 && !flags.p33) {
                for (var tx = 74; tx < 86; tx++) {
                    for (var ty = 3; ty < 12; ty++) {
                        core.setBlock(336, tx, ty);
                    }
                }
                core.drawAnimate("explosion2", 79, 7);
                core.vibrate("vertical", 4000, 25, 15);
                setTimeout(function () { core.vibrate(10000, null, 4) });
                flags.p33 = true;
            }
            if (x == 68 && y == 5 && !flags.p34) {
                core.setBlock(336, 68, 4);
                core.setBlock(336, 67, 6);
                core.drawAnimate("explosion1", 68, 4);
                core.drawAnimate("explosion1", 67, 6);
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
                core.drawAnimate("explosion3", 69, 5);
                core.vibrate("vertical", 2000, 25, 7);
                flags.p35 = true;
            }
            if (x == 64 && y == 11 && !flags.p36) {
                core.setBlock(336, 63, 9);
                core.setBlock(336, 60, 8);
                core.setBlock(336, 56, 11);
                core.drawAnimate("explosion1", 63, 9);
                core.drawAnimate("explosion1", 60, 8);
                core.drawAnimate("explosion1", 56, 11);
                flags.p36 = true;
            }
            if (x == 57 && y == 9 && !flags.p37) {
                for (tx = 58; tx <= 64; tx++) {
                    for (var ty = 3; ty <= 11; ty++) {
                        core.setBlock(336, tx, ty);
                    }
                }
                core.drawAnimate("explosion2", 61, 7);
                core.vibrate("vertical", 3000, 25, 12);
                setTimeout(function () { core.vibrate(20000, null, 4); }, 3000);
                flags.p37 = true;
            }
            if (x <= 48 && !flags["p38" + x] && x >= 21) {
                for (var ty = 3; ty <= 11; ty++) {
                    core.setBlock(336, x + 4, ty);
                    core.drawAnimate("explosion1", x + 4, ty);
                }
                flags["p38" + x] = true;
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
            core.loadOneSound("quake.mp3");
            core.drawHero();
            core.pauseBgm();
            core.playBgm("escape.mp3", 43.5);

        };
        // 视野变化 useAcc:是否匀变速
        this.changeChaseView = function (useAcc) {
            if (flags.haveLost) return;
            var floorId = core.status.floorId;
            if (frame >= 3600) useAcc = false;
            // 刚进MT15时
            if (floorId === "MT15" && !inBlack) {
                frame = 500;
                index = 3;
                fIndex = 1;
                speed = 0;
                acc = 0;
                currX = 32 * 49;
                inBlack = true;
                core.setGameCanvasTranslate("hero", 224, 0);
                flags.startShake = true;
                core.playSound("地震");
                core.insertAction([
                    { "type": "sleep", "time": 500, "noSkip": true },
                ]);
                var interval = setInterval(function () {
                    core.playSound("地震");
                    if (index >= route.length - 1) clearInterval(interval);
                }, 15000);
                core.vibrate("vertical", 1000, 25);
                setTimeout(function () {
                    core.blackEdge();
                    core.insertAction(
                        [{ "type": "autoText", "text": "\t[原始人]\b[down,hero]糟糕，还地震了！", "time": 1500 },
                        { "type": "autoText", "text": "\t[原始人]\b[down,hero]快跑！", "time": 1000 },
                        ]);
                    flags.startShake = false;
                }, 500);
            }
            // 超范围失败
            if (x * 32 > currX + 480 + 64) {
                flags.haveLost = true;
                core.lose("逃跑失败");
                return;
            }
            // 刚进MT14
            if (floorId == "MT14" && !flags.first14) {
                frame = 2500;
                index = 17;
                fIndex = 2;
                speed = 0;
                acc = 0;
                currX = 117 * 32;
                core.vibrate("vertical", 10000, 25, 2);
                core.setGameCanvasTranslate("hero", 224, 0);
                flags.first14 = true;
            }
            // 停止运行
            if (index >= route.length) return;
            // 切换索引
            if (frame > route[index][2]) {
                index++;
                if (index == 3 && floorId == "MT16") {
                    core.lose("逃跑失败");
                }
                if (index >= route.length) {
                    return;
                }
                core.changeChaseIndex(useAcc);
            }
            // 碰到狼就死
            if (floorId == "MT16") {
                if (x >= 6) {
                    if (x > 25 - (frame - 29) / 5) {
                        flags.haveLost = true;
                        core.lose("逃跑失败");
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
            if (floorId == "MT16") core.setViewport(currX, 320);
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
            core.createCanvas("edge", 0, 0, 480, 480, 100);
            var f = 0;
            var h = 0,
                s = 2.56;
            // 初始动画
            function start () {
                core.clearMap("edge");
                core.fillRect("edge", 0, 0, 480, h);
                core.fillRect("edge", 0, 480, 480, -h);
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
            var interval = setInterval(function () {
                core.clearMap("edge");
                core.fillRect("edge", 0, 0, 480, h);
                core.fillRect("edge", 0, 480, 480, -h);
                f++;
                s += 0.0512;
                h -= s;
                if (f == 50) {
                    clearInterval(interval);
                    core.deleteCanvas("edge");
                    flags.finishChase = true;
                }
            });
        }
    }
}