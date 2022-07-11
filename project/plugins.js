var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    "init": function () {

        console.log("插件编写测试");

        // 可以写一些直接执行的代码
        // 在这里写的代码将会在【资源加载前】被执行，此时图片等资源尚未被加载。
        // 请勿在这里对包括bgm，图片等资源进行操作。


        this._afterLoadResources = function () {
            // 本函数将在所有资源加载完毕后，游戏开启前被执行
            // 可以在这个函数里面对资源进行一些操作，比如切分图片等。

            // 这是一个将assets.png拆分成若干个32x32像素的小图片并保存的样例。
            // var arr = core.splitImage("assets.png", 32, 32);
            // for (var i = 0; i < arr.length; i++) {
            //     core.material.images.images["asset"+i+".png"] = arr[i];
            // }

        }

        // 可以在任何地方（如afterXXX或自定义脚本事件）调用函数，方法为 core.plugin.xxx();
        // 从V2.6开始，插件中用this.XXX方式定义的函数也会被转发到core中，详见文档-脚本-函数的转发。
    },
    "drawLight": function () {

        // 绘制灯光/漆黑层效果。调用方式 core.plugin.drawLight(...)
        // 【参数说明】
        // name：必填，要绘制到的画布名；可以是一个系统画布，或者是个自定义画布；如果不存在则创建
        // color：可选，只能是一个0~1之间的数，为不透明度的值。不填则默认为0.9。
        // lights：可选，一个数组，定义了每个独立的灯光。
        //        其中每一项是三元组 [x,y,r] x和y分别为该灯光的横纵坐标，r为该灯光的半径。
        // lightDec：可选，0到1之间，光从多少百分比才开始衰减（在此范围内保持全亮），不设置默认为0。
        //        比如lightDec为0.5代表，每个灯光部分内圈50%的范围全亮，50%以后才开始快速衰减。
        // 【调用样例】
        // core.plugin.drawLight('curtain'); // 在curtain层绘制全图不透明度0.9，等价于更改画面色调为[0,0,0,0.9]。
        // core.plugin.drawLight('ui', 0.95, [[25,11,46]]); // 在ui层绘制全图不透明度0.95，其中在(25,11)点存在一个半径为46的灯光效果。
        // core.plugin.drawLight('test', 0.2, [[25,11,46,0.1]]); // 创建一个test图层，不透明度0.2，其中在(25,11)点存在一个半径为46的灯光效果，灯光中心不透明度0.1。
        // core.plugin.drawLight('test2', 0.9, [[25,11,46],[105,121,88],[301,221,106]]); // 创建test2图层，且存在三个灯光效果，分别是中心(25,11)半径46，中心(105,121)半径88，中心(301,221)半径106。
        // core.plugin.drawLight('xxx', 0.3, [[25,11,46],[105,121,88,0.2]], 0.4); // 存在两个灯光效果，它们在内圈40%范围内保持全亮，40%后才开始衰减。
        this.drawLight = function (name, color, lights, lightDec) {

            // 清空色调层；也可以修改成其它层比如animate/weather层，或者用自己创建的canvas
            var ctx = core.getContextByName(name);
            if (ctx == null) {
                if (typeof name == 'string')
                    ctx = core.createCanvas(name, 0, 0, core.__PIXELS__, core.__PIXELS__, 98);
                else return;
            }

            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            core.clearMap(name);
            // 绘制色调层，默认不透明度
            if (color == null) color = 0.9;
            ctx.fillStyle = "rgba(0,0,0," + color + ")";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            lightDec = core.clamp(lightDec, 0, 1);

            // 绘制每个灯光效果
            ctx.globalCompositeOperation = 'destination-out';
            lights.forEach(function (light) {
                // 坐标，半径，中心不透明度
                var x = light[0],
                    y = light[1],
                    r = light[2];
                // 计算衰减距离
                var decDistance = parseInt(r * lightDec);
                // 正方形区域的直径和左上角坐标
                var grd = ctx.createRadialGradient(x, y, decDistance, x, y, r);
                grd.addColorStop(0, "rgba(0,0,0,1)");
                grd.addColorStop(1, "rgba(0,0,0,0)");
                ctx.beginPath();
                ctx.fillStyle = grd;
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';
            // 可以在任何地方（如afterXXX或自定义脚本事件）调用函数，方法为  core.plugin.xxx();
        }
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
    "dynamicHp": function () {
        // 此插件允许人物血量动态进行变化
        // 原作：Fux2（老黄鸡）

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        var speed = 0.05; // 动态血量变化速度，越大越快。

        var _currentHp = null;
        var _lastStatus = null;
        var _check = function () {
            if (_lastStatus != core.status.hero) {
                _lastStatus = core.status.hero;
                _currentHp = core.status.hero.hp;
            }
        }

        core.registerAnimationFrame('dynamicHp', true, function () {
            _check();
            if (core.status.hero.hp != _currentHp) {
                var dis = (_currentHp - core.status.hero.hp) * speed;
                if (Math.abs(dis) < 2) {
                    _currentHp = core.status.hero.hp;
                } else {
                    _currentHp -= dis;
                }
                core.setStatusBarInnerHTML('hp', _currentHp);
            }
        });
    },
    "multiHeros": function () {
        // 多角色插件
        // Step 1: 启用本插件
        // Step 2: 定义每个新的角色各项初始数据（参见下方注释）
        // Step 3: 在游戏中的任何地方都可以调用 `core.changeHero()` 进行切换；也可以 `core.changeHero(1)` 来切换到某个具体的角色上

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        // 在这里定义全部的新角色属性
        // 请注意，在这里定义的内容不会多角色共用，在切换时会进行恢复。
        // 你也可以自行新增或删除，比如不共用金币则可以加上"money"的初始化，不共用道具则可以加上"items"的初始化，
        // 多角色共用hp的话则删除hp，等等。总之，不共用的属性都在这里进行定义就好。
        var hero1 = {
            "floorId": "MT0", // 该角色初始楼层ID；如果共用楼层可以注释此项
            "image": "brave.png", // 角色的行走图名称；此项必填不然会报错
            "name": "1号角色",
            "lv": 1,
            "hp": 10000, // 如果HP共用可注释此项
            "atk": 1000,
            "def": 1000,
            "mdef": 0,
            // "money": 0, // 如果要不共用金币则取消此项注释
            // "exp": 0, // 如果要不共用经验则取消此项注释
            "loc": { "x": 0, "y": 0, "direction": "up" }, // 该角色初始位置；如果共用位置可注释此项
            "items": {
                "tools": {}, // 如果共用消耗道具（含钥匙）则可注释此项
                // "constants": {}, // 如果不共用永久道具（如手册）可取消注释此项
                "equips": {}, // 如果共用在背包的装备可注释此项
            },
            "equipment": [], // 如果共用装备可注释此项；此项和上面的「共用在背包的装备」需要拥有相同状态，不然可能出现问题
        };
        // 也可以类似新增其他角色
        // 新增的角色，各项属性共用与不共用的选择必须和上面完全相同，否则可能出现问题。
        // var hero2 = { ...

        var heroCount = 2; // 包含默认角色在内总共多少个角色，该值需手动修改。

        this.initHeros = function () {
            core.setFlag("hero1", core.clone(hero1)); // 将属性值存到变量中
            // core.setFlag("hero2", core.clone(hero2)); // 更多的角色也存入变量中；每个定义的角色都需要新增一行

            // 检测是否存在装备
            if (hero1.equipment) {
                if (!hero1.items || !hero1.items.equips) {
                    alert('多角色插件的equipment和道具中的equips必须拥有相同状态！');
                }
                // 存99号套装为全空
                var saveEquips = core.getFlag("saveEquips", []);
                saveEquips[99] = [];
                core.setFlag("saveEquips", saveEquips);
            } else {
                if (hero1.items && hero1.items.equips) {
                    alert('多角色插件的equipment和道具中的equips必须拥有相同状态！');
                }
            }
        }

        // 在游戏开始注入initHeros
        var _startGame_setHard = core.events._startGame_setHard;
        core.events._startGame_setHard = function () {
            _startGame_setHard.call(core.events);
            core.initHeros();
        }

        // 切换角色
        // 可以使用 core.changeHero() 来切换到下一个角色
        // 也可以 core.changeHero(1) 来切换到某个角色（默认角色为0）
        this.changeHero = function (toHeroId) {
            var currHeroId = core.getFlag("heroId", 0); // 获得当前角色ID
            if (toHeroId == null) {
                toHeroId = (currHeroId + 1) % heroCount;
            }
            if (currHeroId == toHeroId) return;

            var saveList = Object.keys(hero1);

            // 保存当前内容
            var toSave = {};
            // 暂时干掉 drawTip 和 音效，避免切装时的提示
            var _drawTip = core.ui.drawTip;
            core.ui.drawTip = function () { };
            var _playSound = core.control.playSound;
            core.control.playSound = function () { }
            // 记录当前录像，因为可能存在换装问题
            core.clearRouteFolding();
            var routeLength = core.status.route.length;
            // 优先判定装备
            if (hero1.equipment) {
                core.items.quickSaveEquip(100 + currHeroId);
                core.items.quickLoadEquip(99);
            }

            saveList.forEach(function (name) {
                if (name == 'floorId') toSave[name] = core.status.floorId; // 楼层单独设置
                else if (name == 'items') {
                    toSave.items = core.clone(core.status.hero.items);
                    Object.keys(toSave.items).forEach(function (one) {
                        if (!hero1.items[one]) delete toSave.items[one];
                    });
                } else toSave[name] = core.clone(core.status.hero[name]); // 使用core.clone()来创建新对象
            });

            core.setFlag("hero" + currHeroId, toSave); // 将当前角色信息进行保存
            var data = core.getFlag("hero" + toHeroId); // 获得要切换的角色保存内容

            // 设置角色的属性值
            saveList.forEach(function (name) {
                if (name == "floorId");
                else if (name == "items") {
                    Object.keys(core.status.hero.items).forEach(function (one) {
                        if (data.items[one]) core.status.hero.items[one] = core.clone(data.items[one]);
                    });
                } else {
                    core.status.hero[name] = core.clone(data[name]);
                }
            });
            // 最后装上装备
            if (hero1.equipment) {
                core.items.quickLoadEquip(100 + toHeroId);
            }

            core.ui.drawTip = _drawTip;
            core.control.playSound = _playSound;
            core.status.route = core.status.route.slice(0, routeLength);

            // 插入事件：改变角色行走图并进行楼层切换
            var toFloorId = data.floorId || core.status.floorId;
            var toLoc = data.loc || core.status.hero.loc;
            core.insertAction([
                { "type": "setHeroIcon", "name": data.image || "hero.png" }, // 改变行走图
                // 同层则用changePos，不同层则用changeFloor；这是为了避免共用楼层造成触发eachArrive
                toFloorId != core.status.floorId ? {
                    "type": "changeFloor",
                    "floorId": toFloorId,
                    "loc": [toLoc.x, toLoc.y],
                    "direction": toLoc.direction,
                    "time": 0 // 可以在这里设置切换时间
                } : { "type": "changePos", "loc": [toLoc.x, toLoc.y], "direction": toLoc.direction }
                // 你还可以在这里执行其他事件，比如增加或取消跟随效果
            ]);
            core.setFlag("heroId", toHeroId); // 保存切换到的角色ID
        }
    },
    "flyHideFloors": function () {
        // 此插件可以让用户在楼传页面手动隐藏某些楼层	
        // 原作：一桶天下

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        var _drawFly = core.ui.drawFly;
        core.ui.drawFly = function (page) {
            _drawFly.call(core.ui, page);
            // 绘制「显示本层」和「显示全部」
            var __hideFloors__ = core.getFlag('__hideFloors__', {});
            var __showAllFloor__ = core.getFlag('__showAllFloor__', false);
            var floorId = core.floorIds[page];
            core.fillText('ui', '显示该层', this.HPIXEL - 120, 60, __hideFloors__[floorId] ? '#FFFFFF' : 'yellow', this._buildFont(20, false));
            core.fillText('ui', '显示全部', this.HPIXEL + 120, 60, !__showAllFloor__ ? '#FFFFFF' : 'yellow', this._buildFont(20, false));
        }

        var _clickFly = core.actions._clickFly;
        core.actions._clickFly = function (x, y) {
            _clickFly.call(core.actions, x, y);

            var __hideFloors__ = core.getFlag('__hideFloors__', {})
            var __showAllFloor__ = core.getFlag('__showAllFloor__', false)
            var _floorId = core.floorIds[core.status.event.data]

            if (y == 1 && x >= this.HSIZE - 5 && x <= this.HSIZE - 2) {
                __hideFloors__[_floorId] = !__hideFloors__[_floorId]
                core.setFlag('__hideFloors__', __hideFloors__)
                core.ui.drawFly(this._getNextFlyFloor(0))
            }
            if (y == 1 && x >= this.HSIZE + 2 && x <= this.HSIZE + 5) {
                core.setFlag('__showAllFloor__', !__showAllFloor__)
                core.ui.drawFly(this._getNextFlyFloor(0))
            }
        }

        var _keyUpFly = core.actions._keyUpFly;
        core.actions._keyUpFly = function (keycode) {
            _keyUpFly.call(core.actions, keycode);

            var __hideFloors__ = core.getFlag('__hideFloors__', {})
            var __showAllFloor__ = core.getFlag('__showAllFloor__', false)
            var _floorId = core.floorIds[core.status.event.data]

            // Q
            if (keycode == 81) {
                __hideFloors__[_floorId] = !__hideFloors__[_floorId]
                core.setFlag('__hideFloors__', __hideFloors__)
                core.ui.drawFly(this._getNextFlyFloor(0));
            } else if (keycode == 69) {
                // E			
                core.setFlag('__showAllFloor__', !__showAllFloor__)
                core.ui.drawFly(this._getNextFlyFloor(0))
            }
        }

        core.actions._getNextFlyFloor = function (delta, index) {
            var __hideFloors__ = core.getFlag('__hideFloors__', {})
            var __showAllFloor__ = core.getFlag('__showAllFloor__', false)
            if (index == null) index = core.status.event.data;
            if (delta == 0) return index;
            var sign = Math.sign(delta);
            delta = Math.abs(delta);
            var ans = index;
            while (true) {
                index += sign;
                if (index < 0 || index >= core.floorIds.length) break;
                var floorId = core.floorIds[index];
                if (core.status.maps[floorId].canFlyTo && core.hasVisitedFloor(floorId) && (__showAllFloor__ || !__hideFloors__[floorId])) {
                    delta--;
                    ans = index;
                }
                if (delta == 0) break;
            }
            return ans;
        }


    },
    "itemCategory": function () {
        // 物品分类插件。此插件允许你对消耗道具和永久道具进行分类，比如标记「宝物类」「剧情道具」「药品」等等。
        // 使用方法：
        // 1. 启用本插件
        // 2. 在下方数组中定义全部的物品分类类型
        // 3. 点击道具的【配置表格】，找到“【道具】相关的表格配置”，然后在【道具描述】之后仿照增加道具的分类：
        /*
         "category": {
              "_leaf": true,
              "_type": "textarea",
              "_string": true,
              "_data": "道具分类"
         },
         */
        // （你也可以选择使用下拉框的方式定义每个道具的分类，写法参见上面的cls）
        // 然后刷新编辑器，就可以对每个物品进行分类了

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        // 在这里定义所有的道具分类类型，一行一个
        var categories = [
            "宝物类",
            "辅助类",
            "技能类",
            "剧情道具",
            "增益道具",
        ];
        // 当前选中的道具类别
        var currentCategory = null;

        // 重写 core.ui._drawToolbox 以绘制分类类别
        var _drawToolbox = core.ui._drawToolbox;
        core.ui._drawToolbox = function (index) {
            _drawToolbox.call(this, index);
            core.setTextAlign('ui', 'left');
            core.fillText('ui', '类别[E]：' + (currentCategory || "全部"), 15, this.PIXEL - 13);
        }

        // 获得所有应该在道具栏显示的某个类型道具
        core.ui.getToolboxItems = function (cls) {
            // 检查类别
            return Object.keys(core.status.hero.items[cls])
                .filter(function (id) {
                    return !core.material.items[id].hideInToolbox &&
                        (currentCategory == null || core.material.items[id].category == currentCategory);
                }).sort();
        }

        // 注入道具栏的点击事件（点击类别）
        var _clickToolbox = core.actions._clickToolbox;
        core.actions._clickToolbox = function (x, y) {
            if (x >= 0 && x <= this.HSIZE - 4 && y == this.LAST) {
                drawToolboxCategory();
                return;
            }
            return _clickToolbox.call(core.actions, x, y);
        }

        // 注入道具栏的按键事件（E键）
        var _keyUpToolbox = core.actions._keyUpToolbox;
        core.actions._keyUpToolbox = function (keyCode) {
            if (keyCode == 69) {
                // 按E键则打开分类类别选择
                drawToolboxCategory();
                return;
            }
            return _keyUpToolbox.call(core.actions, keyCode);
        }

        // ------ 以下为选择道具分类的相关代码 ------ //

        // 关闭窗口时清除分类选择项
        var _closePanel = core.ui.closePanel;
        core.ui.closePanel = function () {
            currentCategory = null;
            _closePanel.call(core.ui);
        }

        // 弹出菜单以选择具体哪个分类
        // 直接使用 core.drawChoices 进行绘制
        var drawToolboxCategory = function () {
            if (core.status.event.id != 'toolbox') return;
            var selection = categories.indexOf(currentCategory) + 1;
            core.ui.closePanel();
            core.status.event.id = 'toolbox-category';
            core.status.event.selection = selection;
            core.lockControl();
            // 给第一项插入「全部」
            core.drawChoices('请选择道具类别', ["全部"].concat(categories));
        }

        // 选择某一项
        var _selectCategory = function (index) {
            core.ui.closePanel();
            if (index <= 0 || index > categories.length) currentCategory = null;
            else currentCategory = categories[index - 1];
            core.openToolbox();
        }

        var _clickToolBoxCategory = function (x, y) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;

            if (x < core.actions.CHOICES_LEFT || x > core.actions.CHOICES_RIGHT) return false;
            var choices = core.status.event.ui.choices;
            var topIndex = core.actions.HSIZE - parseInt((choices.length - 1) / 2) + (core.status.event.ui.offset || 0);
            if (y >= topIndex && y < topIndex + choices.length) {
                _selectCategory(y - topIndex);
            }
            return true;
        }

        // 注入点击事件
        core.registerAction('onclick', 'toolbox-category', _clickToolBoxCategory, 100);

        // 注入光标跟随事件
        core.registerAction('onmove', 'toolbox-category', function (x, y) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
            core.actions._onMoveChoices(x, y);
            return true;
        }, 100);

        // 注入键盘光标事件
        core.registerAction('keyDown', 'toolbox-category', function (keyCode) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
            core.actions._keyDownChoices(keyCode);
            return true;
        }, 100);

        // 注入键盘按键事件
        core.registerAction('keyUp', 'toolbox-category', function (keyCode) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
            core.actions._selectChoices(core.status.event.ui.choices.length, keyCode, _clickToolBoxCategory);
            return true;
        }, 100);

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
        // 重绘怪物属性界面
        ui.prototype._drawBookDetail = function (index) {
            var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
            var enemys = core.enemys.getCurrentEnemys(floorId);
            index = core.clamp(index, 0, enemys.length - 1);
            var enemy = enemys[index];
            var info = this._drawBookDetail_getInfo(enemy);
            if (!enemy) return;
            var content = info[1].join("\n");
            core.status.event.id = 'book-detail';
            core.animateFrame.tip = null;
            core.clearMap('data');

            var left = 10,
                width = this.PIXEL - 2 * left,
                right = left + width;
            var content_left = left + 25,
                validWidth = right - content_left - 13;
            var height = Math.max(this.getTextContentHeight(content, { fontSize: 16, lineHeight: 24, maxWidth: validWidth }) + 58, 80),
                top = (this.PIXEL - height) / 2,
                bottom = top + height;

            core.drawWindowSkin("winskin.png", 'data', 0, 0, core.__PIXELS__, core.__PIXELS__);
            core.drawLine('data', 10, 100, core.__PIXELS__ - 10, 100, [255, 255, 255, 0.8], 1);
            core.drawLine('data', 3, 170, core.__PIXELS__ - 3, 170, [255, 255, 255, 0.8], 1);
            core.setTextAlign('data', 'center');
            core.drawIcon('data', enemy.id, core.__PIXELS__ / 2 - 16, 46);
            core.fillText('data', enemy.name, core.__PIXELS__ / 2, 35, core.status.globalAttribute.selectColor, this._buildFont(22));
            if (enemy.special && enemy.special.length != 0) core.fillRect("data", 3, 170, core.__PIXELS__ - 6, core.__PIXELS__ - 173, [0, 0, 0, 0.6]);
            core.setTextAlign('data', 'left');
            // 特殊属性
            core.playSound('确定');
            this._drawBookDetail_drawContent(enemy, content, { top: top, content_left: content_left, bottom: bottom, validWidth: validWidth });
            // 临界表和回合数
            var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
            var critical = this._drawBookDetail_turnAndCriticals(enemy, floorId, []);
            critical = critical.join("\n");
            this.drawTextContent('data', critical, {
                left: 10,
                top: 77,
                maxWidth: core.__PIXELS__ - 20,
                fontSize: 17,
                lineHeight: 24
            });
            // 生命、功防、1防
            this._drawBookDetail_basicAttributes(enemy);
        };
        // 获取怪物属性
        ui.prototype._drawBookDetail_getInfo = function (enemy, x, y) {
            var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
            var enemys = core.enemys.getCurrentEnemys(floorId);
            if (enemys.length == 0) return [];
            var texts = [];
            if (x != null && y != null) {
                var special = enemy.special;
                if (typeof special == "number") special = [special];
                if (special.length != 0) {
                    for (var i = 0; i < special.length; i++) {
                        texts.push(core.enemys.getSpecialHint(enemy.id, special[i]));
                    }
                }
            } else {
                var texts = core.enemys.getSpecialHint(enemy.id);
            }
            if (texts != "") texts.push("");
            this._drawBookDetail_getTexts(enemy, floorId, texts, x, y);
            return [0, texts];
        };
        // 怪物名称
        ui.prototype._drawBook_drawName = function (index, enemy, top, left, width) {
            // 绘制第零列（名称和特殊属性）
            // 如果需要添加自己的比如怪物的称号等，也可以在这里绘制
            core.setTextAlign('ui', 'center');
            if (enemy.specialText.length == 0) {
                core.fillText('ui', enemy.name, left + width / 2,
                    top + 35, '#ffffff', this._buildFont(19, false), width);
            } else {
                core.fillText('ui', enemy.name, left + width / 2,
                    top + 28, '#ffffff', this._buildFont(19, false), width);
                switch (enemy.specialText.length) {
                    case 1:
                        core.fillText('ui', enemy.specialText[0], left + width / 2,
                            top + 50, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'),
                            this._buildFont(15, false), width);
                        break;
                    case 2:
                        // Step 1: 计算字体
                        var text = enemy.specialText[0] + "  " + enemy.specialText[1];
                        core.setFontForMaxWidth('ui', text, width, this._buildFont(15, false));
                        // Step 2: 计算总宽度
                        var totalWidth = core.calWidth('ui', text);
                        var leftWidth = core.calWidth('ui', enemy.specialText[0]);
                        var rightWidth = core.calWidth('ui', enemy.specialText[1]);
                        // Step 3: 绘制
                        core.fillText('ui', enemy.specialText[0], left + (width + leftWidth - totalWidth) / 2,
                            top + 50, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'));
                        core.fillText('ui', enemy.specialText[1], left + (width + totalWidth - rightWidth) / 2,
                            top + 50, core.arrayToRGBA((enemy.specialColor || [])[1] || '#FF6A6A'));
                        break;
                    default:
                        core.fillText('ui', '多属性...', left + width / 2,
                            top + 50, '#FF6A6A', this._buildFont(15, false), width);
                }
            }
        };
        ////// 获得每个特殊属性的说明 //////
        enemys.prototype.getSpecialHint = function (enemy, special) {
            var specials = this.getSpecials();
            if (special == null) {
                if (specials == null) return [];
                var hints = [];
                for (var i = 0; i < specials.length; i++) {
                    if (this.hasSpecial(enemy, specials[i][0]))
                        hints.push("\r[" + core.arrayToRGBA(specials[i][3] || "#FF6A6A") + "]\\d" +
                            this._calSpecialContent(enemy, specials[i][1]) + "：\\d\r[]" + this._calSpecialContent(enemy, specials[i][2]));
                }
                return hints;
            }
            if (specials == null) return "";
            for (var i = 0; i < specials.length; i++) {
                if (special == specials[i][0])
                    return "\r[" + core.arrayToRGBA(specials[i][3] || "#FF6A6A") + "]\\d" +
                        this._calSpecialContent(enemy, specials[i][1]) + "：\\d\r[]" + this._calSpecialContent(enemy, specials[i][2]);
            }
            return "";
        };
        // 额外项
        ui.prototype._drawBookDetail_getTexts = function (enemy, floorId, texts, x, y) {
            // --- 仇恨伤害
            this._drawBookDetail_hatred(enemy, texts);
        };
        // 伤害字符串
        enemys.prototype.getDamageString = function (enemy, x, y, floorId) {
            if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
            var damage = this.getDamage(enemy, x, y, floorId);
            var color = '#000000';
            if (damage == null) {
                damage = "???";
                color = '#FF2222';
            } else {
                if (damage <= 0) color = '#66FF66';
                else if (damage < core.status.hero.hp / 3) color = '#FFFFFF';
                else if (damage < core.status.hero.hp * 2 / 3) color = '#FFFF00';
                else if (damage < core.status.hero.hp) color = '#FF9933';
                else color = '#FF2222';
                damage = core.formatBigNumber(damage, true);
            }
            return {
                "damage": damage,
                "color": color
            };
        };
        ui.prototype._drawBook_drawDamage = function (index, enemy, offset, position) {
            core.setTextAlign('ui', 'center');
            var damage = enemy.damage,
                color = '#FFFF00';
            if (damage == null) {
                damage = '无法战斗';
                color = '#FF2222';
            } else {
                if (damage >= core.status.hero.hp) color = '#FF2222';
                else if (damage >= core.status.hero.hp * 2 / 3) color = '#FF9933';
                else if (damage <= 0) color = '#11FF11';
                damage = core.formatBigNumber(damage);
            }
            if (enemy.notBomb) damage += "[b]";
            core.fillText('ui', damage, offset, position, color, this._buildFont(13, true));
        };
        // 文字
        ui.prototype._drawBookDetail_drawContent = function (enemy, content, pos) {
            core.setTextAlign('data', 'left');
            for (var i = 0; i < 18; i++) {
                // 自适配文字大小
                if (core.getTextContentHeight(content, {
                    left: 7,
                    top: 170,
                    maxWidth: core.__PIXELS__ - 14,
                    fontSize: 18 - i,
                    lineHeight: 24 - i * 4 / 3,
                    interval: 0
                }) <= 400) {
                    this.drawTextContent('data', content, {
                        left: 7,
                        top: 170,
                        maxWidth: core.__PIXELS__ - 14,
                        fontSize: 18 - i,
                        lineHeight: 24 - i * 4 / 3,
                        interval: 0
                    });
                    break;
                }
            }
        };
        // 回合数和临界
        ui.prototype._drawBookDetail_turnAndCriticals = function (enemy, floorId, texts, x, y) {
            var damageInfo = core.getDamageInfo(enemy.id, null, x, y, floorId);
            texts.push("\r[#FF6A6A]\\d战斗回合数：\\d\r[]" + ((damageInfo || {}).turn || 0));
            // 临界表
            var criticals = core.enemys.nextCriticals(enemy.id, 12, x, y, floorId).map(function (v, i) {
                return core.formatBigNumber(v[0]) + ":" + (i == 0 && v[1] < 0 ? "\r[#ffd700]" : "") +
                    core.formatBigNumber(v[1], false, i == 0 && v[1] < 0) + (i == 0 && v[1] < 0 ? "\r[]" : "");
            });
            while (criticals[0] == '0:0') criticals.shift();
            if (JSON.stringify(criticals) != "[]") texts.push(JSON.stringify(criticals));
            var prevInfo = core.getDamageInfo(enemy.id, { atk: core.status.hero.atk - 1 }, null, null, floorId);
            if (prevInfo != null && damageInfo != null) {
                if (damageInfo.damage != null) damageInfo = damageInfo.damage;
                if (prevInfo.damage != null) prevInfo = prevInfo.damage;
                if (prevInfo > damageInfo) {
                    texts[0] += "（当前攻击力正位于临界点上）";
                }
            }
            // --- 原始数值
            this._drawBookDetail_origin(enemy, texts, x, y);
            return texts;
        };
        ui.prototype._drawBookDetail_basicAttributes = function (enemy, floorId, x, y) {
            core.fillText("data", "生命: " + core.formatBigNumber(enemy.hp), 10, 25, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
            core.fillText("data", "攻击: " + core.formatBigNumber(enemy.atk), 10, 49, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
            core.fillText("data", "防御: " + core.formatBigNumber(enemy.def), 10, 73, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
            core.fillText("data", "金经: " + core.formatBigNumber(enemy.money || 0) + "/" + core.formatBigNumber(enemy.exp || 0),
                core.__PIXELS__ - 150, 25, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
            core.fillText("data", core.formatBigNumber(core.status.thisMap.ratio) + "防: " + core.formatBigNumber(enemy.defDamage || 0),
                core.__PIXELS__ - 150, 49, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
            core.fillText("data", "伤害: " + ((enemy.damage > 0 || enemy.damage == null) ? "\r[#ff8888]" : "\r[#55BB55]") +
                core.formatBigNumber(enemy.damage == null ? "???" : enemy.damage), core.__PIXELS__ - 150, 74, [255, 255, 255, 1], "16px " + core.status.globalAttribute.font);
        };
        ui.prototype._drawBook_drawRow1 = function (index, enemy, top, left, width, position) {
            // 绘制第一行
            core.setTextAlign('ui', 'left');
            var b13 = this._buildFont(15, false),
                f13 = this._buildFont(15, false);
            var col1 = left,
                col2 = left + width * 9 / 25,
                col3 = left + width * 17 / 25;
            core.setTextAlign('ui', 'right');
            core.fillText('ui', core.getStatusLabel('hp'), col1 + 25, position, '#ffffff', f13);
            core.fillText('ui', core.getStatusLabel('atk'), col2 + 25, position, null, f13);
            core.fillText('ui', core.getStatusLabel('def'), col3 + 25, position, null, f13);
            core.setTextAlign('ui', 'left');
            core.fillText('ui', core.formatBigNumber(enemy.hp || 0), col1 + 30, position, null, b13);
            core.fillText('ui', core.formatBigNumber(enemy.atk || 0), col2 + 30, position, null, b13);
            core.fillText('ui', core.formatBigNumber(enemy.def || 0), col3 + 30, position, null, b13);
        };
        ui.prototype._drawBook_drawRow2 = function (index, enemy, top, left, width, position) {
            // 绘制第二行
            core.setTextAlign('ui', 'left');
            var b13 = this._buildFont(15, false),
                f13 = this._buildFont(15, false);
            var col1 = left,
                col2 = left + width * 9 / 25,
                col3 = left + width * 17 / 25;
            core.setTextAlign('ui', 'right');
            core.fillText('ui', core.getStatusLabel('money'), col1 + 25, position, '#ffffff', f13);
            core.fillText('ui', core.getStatusLabel('exp'), col2 + 25, position, '#ffffff', f13);
            core.setTextAlign('ui', 'left');
            core.fillText('ui', core.formatBigNumber(enemy.money || 0), col1 + 30, position, null, b13);
            core.fillText('ui', core.formatBigNumber(enemy.exp || 0), col2 + 30, position, null, b13);
            // 忽略第三列，直接绘制伤害
            var damage_offset = col3 + (this.PIXEL - col3) / 2 - 12;
            this._drawBook_drawDamage(index, enemy, damage_offset, position);
        };
        // 手册n防
        ui.prototype._drawBook_drawRow3 = function (index, enemy, top, left, width, position) {
            // 绘制第三行
            core.setTextAlign('ui', 'left');
            var b13 = this._buildFont(15, false),
                f13 = this._buildFont(15, false);
            var col1 = left,
                col2 = left + width * 9 / 25,
                col3 = left + width * 17 / 25;
            var damage = core.getDamageInfo(enemy);
            core.setTextAlign('ui', 'right');
            core.fillText('ui', '临界', col1 + 25, position, '#ffffff', f13);
            core.fillText('ui', '减伤', col2 + 25, position, damage == null && enemy.critical ? "#ffd700" : "#ffffff", f13);
            core.fillText('ui', core.formatBigNumber(core.status.thisMap.ratio) + '防', col3 + 25, position, "#ffffff", f13);
            core.setTextAlign('ui', 'left');
            core.fillText('ui', core.formatBigNumber(enemy.criticalDamage || 0,
                false, damage == null && enemy.critical), col2 + 30, position, null, b13);
            core.fillText('ui', core.formatBigNumber(enemy.critical || 0), col1 + 30, position, null, b13);
            core.fillText('ui', core.formatBigNumber(enemy.defDamage || 0), col3 + 30, position, null, b13);
        };
        // 绘制伤害
        ui.prototype._drawBook_drawDamage = function (index, enemy, offset, position) {
            core.setTextAlign('ui', 'center');
            var damage = enemy.damage,
                color = '#FFFF00';
            if (damage == null) {
                damage = '无法战斗';
                color = '#FF2222';
            } else {
                if (damage >= core.status.hero.hp) color = '#FF2222';
                else if (damage >= core.status.hero.hp * 2 / 3) color = '#FF9933';
                else if (damage <= 0) color = '#11FF11';
                damage = core.formatBigNumber(damage);
            }
            if (enemy.notBomb) damage += "[b]";
            core.fillText('ui', damage, offset, position, color, this._buildFont(15, false));
        };
        ui.prototype._drawBookDetail_origin = function (enemy, texts) {
            // 怪物数值和原始值不一样时，在详细信息页显示原始数值
            var originEnemy = core.enemys._getCurrentEnemys_getEnemy(enemy.id);
            var content = [];
            if (enemy.x != null && enemy.y != null && flags.useLocEnemy) {
                texts.push("\r[#FF6A6A]\\d怪物坐标：\\d\r[][" + enemy.x + ", " + enemy.y + ']');
            }
            ["hp", "atk", "def", "point", "money", "exp"].forEach(function (one) {
                if (enemy[one] == null || originEnemy[one] == null) return;
                if (enemy[one] != originEnemy[one]) {
                    content.push(core.getStatusLabel(one) + " " + originEnemy[one]);
                }
            });
            if (content.length > 0) {
                if (flags.useLocEnemy)
                    texts[texts.length - 1] += "  \r[#FF6A6A]\\d原始数值：\\d\r[]" + content.join("；");
                else
                    texts.push("\r[#FF6A6A]\\d原始数值：\\d\r[]" + content.join("；"));
            }
        };
        ////// 接下来N个临界值和临界减伤计算 //////
        enemys.prototype.nextCriticals = function (enemy, number, x, y, floorId) {
            if (typeof enemy == 'string') enemy = core.material.enemys[enemy];
            number = number || 1;
            var info = this.getDamageInfo(enemy, null, x, y, floorId);
            // 防杀
            if (info && info.per_damage <= 0 && info.hero_per_damage > 0) return [
                [0, 0]
            ];
            if (this.hasSpecial(enemy.special, 9) && core.status.hero.atk + core.status.hero.mana <=
                core.getEnemyInfo(enemy, null, x, y, floorId).def) {
                info = this.getEnemyInfo(enemy, null, x, y, floorId);
                return [
                    [info.def + 1 - core.status.hero.atk - core.status.hero.mana, '?']
                ];
            }
            if (info == null) { // 如果未破防...
                var enemyInfo = this.getEnemyInfo(enemy, null, x, y, floorId);
                if (enemyInfo.def == null || enemyInfo.def < core.status.hero.atk) return [];
                // 再次尝试获得破防后伤害
                info = this.getDamageInfo(enemy, { atk: enemyInfo.def + 1 }, x, y, floorId);
                if (info == null || info.mon_def != enemyInfo.def) return [];
                info.__over__ = true;
                info.__overAtk__ = info.mon_def + 1 - core.status.hero.atk;
            }
            // getDamageInfo直接返回数字；0伤且无负伤
            if (typeof info == 'number' || (info.damage <= 0 && !core.flags.enableNegativeDamage)) {
                return [
                    [0, 0]
                ];
            }
            if (core.flags.useLoop) {
                var LOOP_MAX_VALUE = 1;
                if (core.status.hero.atk <= LOOP_MAX_VALUE) {
                    return this._nextCriticals_useLoop(enemy, info, number, x, y, floorId);
                } else {
                    return this._nextCriticals_useBinarySearch(enemy, info, number, x, y, floorId);
                }
            } else {
                return this._nextCriticals_useTurn(enemy, info, number, x, y, floorId);
            }
        };
        // 绘制详细信息
        this.drawFixedDetail = function (index, x, y, Enemy) {
            var enemy = Enemy;
            if (enemy == null) return;
            var enemyInfo = core.enemys.getEnemyInfo(enemy, null, x, y, floorId);
            var specialText = core.enemys.getSpecialText(enemy);
            var specialColor = core.enemys.getSpecialColor(enemy);
            var e = {};
            for (var i in enemyInfo) {
                e[i] = enemyInfo[i];
            }
            e.specialText = specialText;
            e.specialColor = specialColor;
            e.damage = core.enemys.getDamage(enemy, x, y, floorId);
            e.defDamage = core.enemys.getDefDamage(enemy, 1 * core.status.thisMap.ratio, x, y, floorId);
            e.id = enemy;
            e.name = core.material.enemys[enemy].name;
            enemy = e;
            if (enemy.special == 0) enemy.special = null;
            if (typeof enemy.special == "number") {
                enemy.special = [enemy.special];
            }
            var info = core.ui._drawBookDetail_getInfo(enemy);
            if (!enemy) return;
            var content = info[1].join("\n");
            core.status.event.id = 'fixed-detail';
            core.animateFrame.tip = null;
            core.clearMap('data');
            var left = 10,
                width = this.PIXEL - 2 * left,
                right = left + width;
            var content_left = left + 25,
                validWidth = right - content_left - 13;
            var height = Math.max(core.getTextContentHeight(content, { fontSize: 16, lineHeight: 24, maxWidth: validWidth }) + 58, 80),
                top = (this.PIXEL - height) / 2,
                bottom = top + height;
            // 背景
            core.drawWindowSkin("winskin.png", 'data', 0, 0, core.__PIXELS__, core.__PIXELS__);
            core.drawLine('data', 10, 100, core.__PIXELS__ - 10, 100, [255, 255, 255, 0.8], 1);
            core.drawLine('data', 3, 170, core.__PIXELS__ - 3, 170, [255, 255, 255, 0.8], 1);
            core.setTextAlign('data', 'center');
            core.drawIcon('data', enemy.id, core.__PIXELS__ / 2 - 16, 46);
            core.fillText('data', enemy.name, core.__PIXELS__ / 2, 35, core.status.globalAttribute.selectColor, core.ui._buildFont(22));
            if (enemy.special && enemy.special.length != 0) core.fillRect("data", 3, 170, core.__PIXELS__ - 6, core.__PIXELS__ - 173, [0, 0, 0, 0.6]);
            core.setTextAlign('data', 'left');
            // 特殊属性
            core.ui._drawBookDetail_drawContent(enemy, content, { top: top, content_left: content_left, bottom: bottom, validWidth: validWidth });
            // 临界表和回合数
            var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
            var critical = core.ui._drawBookDetail_turnAndCriticals(enemy, floorId, [], x, y);
            critical = critical.join("\n");
            core.drawTextContent('data', critical, {
                left: 10,
                top: 77,
                maxWidth: core.__PIXELS__ - 20,
                fontSize: 17,
                lineHeight: 24
            });
            core.playSound('确定');
            // 生命、功防、1防
            core.ui._drawBookDetail_basicAttributes(enemy, floorId, x, y);
        };
        // 定点查看怪物属性
        this.fixedEnemy = function (x, y, floorId) {
            floorId = floorId || core.status.floorId;
            if (core.getBlockCls(x, y, floorId) == "enemys" || core.getBlockCls(x, y, floorId) == "enemy48") {
                core.drawFixedDetail(null, x, y, core.getBlockId(x, y, floorId));
            } else {
                core.drawTip("您选择的图块没有敌人！");
            }
        };
        // 定点查看界面
        var enemyIndex = 0;
        // 打开
        this.openFixed = function () {
            if (core.isReplaying()) {
                core.startFixed();
                return;
            }
            core.playSound("打开界面");
            enemyIndex = 0;
            core.insertAction([
                { "type": "function", "function": "function(){\ncore.plugin.fixedStart((core.status.event.ui || {}).floorId || core.status.floorId);\n}" },
                { "type": "sleep", "time": 150 },
                { "type": "function", "function": "function(){core.plugin.startFixed();}" },
            ]);
        };
        this.startFixed = function () {
            if (core.status.route[core.status.route.length - 1] != "item:wand")
                core.status.route.pop();
            core.insertAction([{
                "type": "while",
                "condition": "true",
                "data": [
                    { "type": "update" },
                    { "type": "function", "function": "function(){\ncore.plugin.drawFixedEnemy((core.status.event.ui || {}).floorId || core.status.floorId);\n}" },
                    { "type": "wait" },
                    { "type": "function", "function": "function(){\ncore.plugin.fixedAction();\n}" },
                ],
            },
            { "type": "function", "function": "function(){\ncore.deleteCanvas('fixedEnemy');\n}" },
            ]);
        };
        // 初始动画
        this.fixedStart = function (floorId) {
            core.createCanvas("fixedEnemy", 0, 0, 480, 480, 140);
            var i = 0;
            var interval = setInterval(function () {
                core.clearMap("fixedEnemy");
                core.fillRect("fixedEnemy", 0, 0, 480, 480, [0, 0, 0, 0.01 * i]);
                i++;
                if (i == 30) {
                    clearInterval(interval);
                    core.plugin.drawFixedEnemy(floorId);
                }
            }, 5);
        };
        // 绘制
        this.drawFixedEnemy = function (floorId) {
            core.clearMap("fixedEnemy");
            core.fillRect("fixedEnemy", 0, 0, 480, 480, [0, 0, 0, 0.3]);
            var enemyLoc = core.getEnemyLoc(floorId);
            var ox = Math.floor(core.bigmap.offsetX / 32);
            var oy = Math.floor(core.bigmap.offsetY / 32);
            if (enemyLoc.length != 0) {
                for (var i in enemyLoc) {
                    core.fillRect("fixedEnemy", 32 * enemyLoc[i][0] + 2 - ox * 32, 32 * enemyLoc[i][1] + 2 - oy * 32, 28, 28, [175, 175, 175, 0.5]);
                }
                core.strokeRect("fixedEnemy", 32 * enemyLoc[enemyIndex][0] + 1 - ox * 32, 32 * enemyLoc[enemyIndex][1] + 1 - oy * 32, 30, 30, [255, 255, 50, 1], 2);
            }
            // 关闭
            core.fillText("fixedEnemy", "关 闭", 5, 25, [255, 255, 255, 1], "24px " + core.status.globalAttribute.font);
        };
        // 操作
        this.registeredClick = function (px, py) {
            if (core.status.event.id == "fixed-detail") {
                core.clearMap('data');
                core.status.event.id = "fixed";
                core.startFixed();
                core.playSound("取消");
                return true;
            }
        };
        this.clickFixed = function (px, py) {
            if (px < 64 && py < 32) {
                core.unregisterAction("keyUp", "fixed_keyUp");
                core.unregisterAction("onclick", "fixed_click");
                core.playSound("取消");
                core.insertAction([
                    { "type": "break" },
                ]);
                return;
            }
            var floorId = core.status.floorId;
            var x = Math.floor((px + core.bigmap.offsetX) / 32);
            var y = Math.floor((py + core.bigmap.offsetY) / 32);
            setTimeout(function () {
                var enemyLoc = core.getEnemyLoc(floorId);
                for (var i in enemyLoc) {
                    if (x == enemyLoc[i][0] && y == enemyLoc[i][1]) {
                        enemyIndex = i;
                    }
                }
                core.fixedEnemy(x, y, floorId);
            }, 1);
            return true;
        };
        this.registeredKeyboard = function (keyCode) {
            if (core.status.event.id == "fixed-detail") {
                core.clearMap('data');
                core.status.event.id = "fixed";
                core.startFixed();
                core.playSound("取消");
                return true;
            }
        };
        this.keyBoardFixed = function (keyCode) {
            var floorId = (core.status.event.ui || {}).floorId || core.status.floorId;
            var enemyLoc = core.getEnemyLoc(floorId);
            switch (keyCode) {
                case 88:
                case 27:
                    core.unregisterAction("keyUp", "fixed_keyUp");
                    core.unregisterAction("onclick", "fixed_click");
                    core.playSound("取消");
                    core.insertAction([
                        { "type": "break" },
                    ]);
                    break;
            }
            switch (keyCode) {
                case 13:
                case 32:
                    if (enemyLoc.length != 0) {
                        var x = enemyLoc[enemyIndex][0];
                        var y = enemyLoc[enemyIndex][1];
                        core.fixedEnemy(x, y, floorId);
                    }
                    break;
                case 37:
                case 38:
                    if (enemyIndex > 0) {
                        core.playSound("光标移动");
                        enemyIndex--;
                    }
                    break;
                case 39:
                case 40:
                    if (enemyIndex < enemyLoc.length - 1) {
                        core.playSound("光标移动");
                        enemyIndex++;
                    }
                    break;
            }
        }
        this.fixedAction = function () {
            if (flags.type == 0) return this.keyBoardFixed(flags.keycode);
            else return this.clickFixed(flags.px, flags.py);
        };
        // 获得指定楼层怪物坐标数组
        this.getEnemyLoc = function (floorId) {
            // 是否在范围内
            function inRange (loc, ox, oy) {
                if (loc[0] < ox || loc[0] > (ox + core.__SIZE__ - 1) ||
                    loc[1] < oy || loc[1] > (oy + core.__SIZE__ - 1)) return false;
                return true;
            }
            var ox = Math.floor(core.bigmap.offsetX / 32);
            var oy = Math.floor(core.bigmap.offsetY / 32);
            core.registerAction("keyUp", "fixed_keyUp", this.registeredKeyboard, 100);
            core.registerAction("onclick", "fixed_click", this.registeredClick, 100);
            floorId = floorId || core.status.floorId;
            var loc = [];
            core.status.maps[floorId].blocks.forEach(function (block) {
                var id = block.event.id,
                    enemy = core.material.enemys[id];
                if (enemy) {
                    loc.push([block.x, block.y]);
                }
            });
            for (var i = 0; i < loc.length; i++) {
                if (!inRange(loc[i], ox, oy)) {
                    loc.splice(i, 1);
                    i--;
                }
            }
            return loc;
        };
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
            if (!noPass || cls == "items" || (id.startsWith('X') &&
                id != 'X20007' && id != 'X20001' && id != 'X20006' && id != 'X20014' &&
                id != 'X20010' && id != 'X20007') || (bgId.startsWith('X') && bgId != 'X20037' &&
                    bgId != 'X20038' && bgId != 'X20039' && bgId != 'X20045' && bgId != 'X20047' &&
                    bgId != 'X20053' && bgId != 'X20054' && bgId != 'X20055' && bgId != 'X20067' &&
                    bgId != 'X20068' && bgId != 'X20075' && bgId != 'X20076'))
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
                if (core.noPass(x, y) || core.getBlockCls(x, y) == "items" || (id.startsWith('X') &&
                    id != 'X20007' && id != 'X20001' && id != 'X20006' && id != 'X20014' &&
                    id != 'X20010' && id != 'X20007') || (bgId.startsWith('X') && bgId != 'X20037' &&
                        bgId != 'X20038' && bgId != 'X20039' && bgId != 'X20045' && bgId != 'X20047' &&
                        bgId != 'X20053' && bgId != 'X20054' && bgId != 'X20055' && bgId != 'X20067' &&
                        bgId != 'X20068' && bgId != 'X20075' && bgId != 'X20076') || core.getBlockCls(x, y) == "animates")
                    return checkNoPass(direction, x, y, true);
                if (!startNo) return checkNoPass(direction, x, y, false);
                return { 'x': x, 'y': y };
            }
        };
    },
    "changeFly": function () {
        // 录像验证直接干掉这个插件
        if (main.replayChecking) return;
        // *** --- 以下数据为用户可修改数据 修改后不影响该插件的基本功能 --- *** //
        // 检测楼层转换的图块id
        var leftPortal = "leftPortal", // 左
            rightPortal = "rightPortal", // 右
            upPortal = "upPortal", // 上
            downPortal = "downPortal", // 下
            upFloor = "upFloor", // 上楼
            downFloor = "downFloor"; // 下楼
        // 一些常用默认值
        var defaultScale = 1, // 默认缩放比率
            defaultLoop = 5, // 绘制地图时的循环检测地图路线次数，loop为5说明最远的地图可以用6步到达
            defaultOpacity = 0.6, // 默认不透明度
            defaultMinorAlpha = defaultOpacity / 2; // 3D绘图时，不与当前层处于同一高度层的默认初始不透明度，不透明度会随着层数的增加或减少而减少
        // *** --- 用户修改区 END --- *** //
        //  其余可自定义内容均用 //***--- 包裹着

        ////// 绘制楼层传送器 //////
        var originDrawFly = core.ui.drawFly;
        ui.prototype.drawFly = function (page) {
            if (!flags.usePlatFly || core.isReplaying()) return originDrawFly.call(core.ui, page);
            core.status.event.data = page;
            var floorId = core.floorIds[page];
            core.clearMap('ui');
            core.setAlpha('ui', 0.85);
            core.fillRect('ui', 0, 0, this.PIXEL, this.PIXEL, '#000000');
            core.setAlpha('ui', 1);
            var size = this.PIXEL;
            //***--- 楼传绘制 可根据自己的需求更改 更改之后注意更改点击操作的函数
            // 背景
            core.drawThumbnail(floorId, null, { ctx: 'ui', x: 0, y: 0, size: size, damage: true, fromFly: true });
            core.fillRect("ui", 0, 65, 32, size - 130, [0, 0, 0, 0.7]);
            core.fillRect("ui", size, 65, -32, size - 130, [0, 0, 0, 0.7]);
            core.fillRect("ui", 65, 0, size / 2 - 114, 32, [0, 0, 0, 0.7]);
            core.fillRect("ui", 65, size, size / 2 - 114, -32, [0, 0, 0, 0.7]);
            core.fillRect("ui", size / 2 + 49, 0, size / 2 - 114, 32, [0, 0, 0, 0.7]);
            core.fillRect("ui", size / 2 + 49, size, size / 2 - 114, -32, [0, 0, 0, 0.7]);
            core.fillRect("ui", size / 2 - 47, 0, 94, 32, [0, 0, 0, 0.7]);
            core.fillRect("ui", size / 2 - 47, size, 94, -32, [0, 0, 0, 0.7]);
            core.fillRect("ui", 0, 0, 63, 32, [0, 0, 0, 0.7]);
            core.fillRect("ui", size, 0, -63, 32, [0, 0, 0, 0.7]);
            core.fillRect("ui", 0, 32, 32, 31, [0, 0, 0, 0.7]);
            core.fillRect("ui", 0, size - 32, 32, -31, [0, 0, 0, 0.7]);
            core.fillRect("ui", 0, size, 63, -32, [0, 0, 0, 0.7]);
            core.fillRect("ui", size, size, -63, -32, [0, 0, 0, 0.7]);
            core.fillRect("ui", size, size - 32, -32, -31, [0, 0, 0, 0.7]);
            core.fillRect("ui", size, 32, -32, 31, [0, 0, 0, 0.7]);
            core.setTextAlign("ui", "center");
            // 文字
            if (core.getFloorByDirection("left", floorId))
                core.fillText("ui", "←", 16, size / 2 + 10, core.hasVisitedFloor(core.getFloorByDirection("left",
                    floorId)) ? "#ffffff" : "#ff22ff", "26px Verdana");
            if (core.getFloorByDirection("right", floorId))
                core.fillText("ui", "→", size - 16, size / 2 + 10, core.hasVisitedFloor(core.getFloorByDirection("right",
                    floorId)) ? "#ffffff" : "#ff22ff", "26px Verdana");
            if (core.getFloorByDirection("up", floorId))
                core.fillText("ui", "↑", size / 2, 28, core.hasVisitedFloor(core.getFloorByDirection("up",
                    floorId)) ? "#ffffff" : "#ff22ff", "26px Verdana");
            if (core.getFloorByDirection("down", floorId))
                core.fillText("ui", "↓", size / 2, size - 4, core.hasVisitedFloor(core.getFloorByDirection("down",
                    floorId)) ? "#ffffff" : "#ff22ff", "26px Verdana");
            if (core.getFloorByDirection("top", floorId))
                core.fillText("ui", "上楼", size / 4 + 8, 24, core.hasVisitedFloor(core.getFloorByDirection("top",
                    floorId)) ? "#ffffff" : "#ff22ff", "22px " + core.status.globalAttribute.font);
            if (core.getFloorByDirection("bottom", floorId))
                core.fillText("ui", "下楼", size / 4 * 3 - 8, 24, core.hasVisitedFloor(core.getFloorByDirection("bottom",
                    floorId)) ? "#ffffff" : "#ff22ff", "22px " + core.status.globalAttribute.font);
            core.fillText("ui", "退10层", size / 4 + 8, size - 8, core.actions._getNextFlyFloor(-1) == page ? "#ff22ff" : "#ffffff",
                "22px " + core.status.globalAttribute.font);
            core.fillText("ui", "进10层", size / 4 * 3 - 8, size - 8, core.actions._getNextFlyFloor(1) == page ? "#ff22ff" : "#ffffff",
                "22px " + core.status.globalAttribute.font);
            core.fillText("ui", "退出", 32, 24, "#ffffff", "22px " + core.status.globalAttribute.font);
            core.fillText("ui", "楼层名", 32, size - 8, "#ffffff", "22px " + core.status.globalAttribute.font);
            core.fillText("ui", "（B）", 16, size - 40, "#ffffff", "22px " + core.status.globalAttribute.font);
            core.createCanvas("mapOnUi", -240, -240, size + 480, size + 480, 150);
            core.drawFlyMap("mapOnUi", 240, 240, size, size, floorId, { fromUser: true, oriFloor: floorId, use3D: flags.use3D });
            if (core.can3D(floorId) && !flags.in3D)
                core.fillText("ui", "3D模式", size - 32, 24, "#ffffff", "20px " + core.status.globalAttribute.font);
            if (flags.in3D)
                core.fillText("ui", "2D模式", size - 32, 24, "#ffffff", "20px " + core.status.globalAttribute.font);
            if (core.can3D(floorId)) core.fillText("ui", "（Z）", size - 16, 56, "#ffffff", "20px " + core.status.globalAttribute.font);
            if (flags.flyTitle) {
                var style = document.getElementById("ui").getContext("2d");
                style.shadowColor = "rgba(0, 0, 0, 1)";
                style.shadowBlur = 5;
                core.fillRect("ui", size / 4, size / 4, size / 2, size / 8, [180, 180, 180, 0.7]);
                core.strokeRect("ui", size / 4, size / 4, size / 2, size / 8, [255, 255, 255, 0.7], 3);
                style.shadowOffsetX = 4;
                style.shadowOffsetY = 2;
                core.fillText("ui", (core.status.maps[floorId] || {}).title, size / 2, size / 16 * 5 + 11, "#ffffff",
                    "32px " + core.status.globalAttribute.font);
                style.shadowColor = "none";
                style.shadowBlur = 0;
                style.shadowOffsetX = 0;
                style.shadowOffsetY = 0;
            }
            //***--- 楼传绘制
        };
        ////// 楼层传送器界面时的点击操作 //////
        var originClickFly = core.actions._clickFly;
        actions.prototype._clickFly = function (x, y) {
            if (!flags.usePlatFly || core.isReplaying()) return originClickFly.call(core.actions, x, y);
            var page = core.status.event.data;
            var floorId = core.floorIds[page];
            //***--- 点击操作 可以修改的地方只有x,y坐标 其余不可修改
            if (x <= 2 && y <= 1) {
                core.playSound('取消');
                core.deleteCanvas("mapOnUi")
                core.ui.closePanel();
                return;
            }
            // 3D模式
            if (x >= core.__SIZE__ - 2 && y <= 1) {
                if (core.can3D(floorId) && !flags.in3D)
                    flags.use3D = true;
                if (flags.in3D) flags.use3D = false;
                core.playSound('光标移动');
                core.ui.drawFly(page);
                return;
            }
            // 显示名称
            if (x <= 1 && y >= core.__SIZE__ - 2) {
                if (flags.flyTitle) flags.flyTitle = false;
                else flags.flyTitle = true;
                core.playSound('光标移动');
                core.ui.drawFly(page);
                return;
            }
            // 飞过去
            if (x > 1 && x < core.__SIZE__ - 1 && y > 1 && y < core.__SIZE__ - 1) {
                if (core.status.maps[core.status.floorId].canFlyFrom &&
                    core.status.maps[core.floorIds[core.status.event.data]].canFlyTo &&
                    core.hasVisitedFloor(core.floorIds[core.status.event.data])) {
                    core.deleteCanvas("mapOnUi");
                }
                core.flyTo(core.floorIds[core.status.event.data]);
            }
            // 前进10层 后退10层
            if (y > core.__SIZE__ - 2 && core.actions._getNextFlyFloor(-1) != page &&
                x >= 2 && x <= Math.floor(core.__SIZE__ / 2) - 2) {
                core.ui.drawFly(this._getNextFlyFloor(-10));
                core.playSound("光标移动");
            }
            if (y > core.__SIZE__ - 2 && core.actions._getNextFlyFloor(1) != page &&
                x >= Math.ceil(core.__SIZE__ / 2) + 1 && x <= core.__SIZE__ - 3) {
                core.ui.drawFly(this._getNextFlyFloor(10));
                core.playSound("光标移动");
            }
            // 获取索引
            function getId (direction) {
                var id = core.getFloorByDirection(direction, floorId);
                for (var i in core.floorIds) {
                    if (core.floorIds[i] == id) return parseInt(i);
                }
            }
            // 上下左右和上下楼
            if (x < 1 && core.getFloorByDirection("left", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("left", floorId)) && y >= 2 && y < core.__SIZE__ - 2) {
                core.playSound("光标移动");
                core.drawFly(getId("left"));
            }
            if (x > core.__SIZE__ - 2 && core.getFloorByDirection("right", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("right", floorId)) && y >= 2 && y < core.__SIZE__ - 2) {
                core.playSound("光标移动");
                core.drawFly(getId("right"));
            }
            if (y < 1 && core.getFloorByDirection("up", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("up", floorId)) &&
                x >= Math.floor(core.__SIZE__ / 2) - 1 && x <= Math.ceil(core.__SIZE__ / 2)) {
                core.playSound("光标移动");
                core.drawFly(getId("up"));
            }
            if (y > core.__SIZE__ - 2 && core.getFloorByDirection("down", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("down", floorId)) &&
                x >= Math.floor(core.__SIZE__ / 2) - 1 && x <= Math.ceil(core.__SIZE__ / 2)) {
                core.playSound("光标移动");
                core.drawFly(getId("down"));
            }
            if (y < 1 && x >= 2 && x <= Math.floor(core.__SIZE__ / 2) - 2 &&
                core.getFloorByDirection("top", floorId) && core.hasVisitedFloor(core.getFloorByDirection("top", floorId))) {
                core.playSound("光标移动");
                core.drawFly(getId("top"));
            }
            if (y < 1 && x >= Math.ceil(core.__SIZE__ / 2) + 1 && x <= core.__SIZE__ - 3 &&
                core.getFloorByDirection("bottom", floorId) && core.hasVisitedFloor(core.getFloorByDirection("bottom", floorId))) {
                core.playSound("光标移动");
                core.drawFly(getId("bottom"));
            }
            return;
            //***--- 点击操作
        };
        ////// 楼层传送器界面时，按下某个键的操作 //////
        var originKeyDownFly = core.actions._keyDownFly;
        actions.prototype._keyDownFly = function (keycode) {
            if (!flags.usePlatFly || core.isReplaying()) return originKeyDownFly.call(core.actions, keycode);
            var page = core.status.event.data;
            var floorId = core.floorIds[page];
            // 获取索引
            function getId (direction) {
                var id = core.getFloorByDirection(direction, floorId);
                for (var i in core.floorIds) {
                    if (core.floorIds[i] == id) return parseInt(i);
                }
            }
            //***--- 按键操作 只可以修改按键的keycode
            if (keycode == 37 && core.getFloorByDirection("left", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("left", floorId))) {
                core.playSound('光标移动');
                core.ui.drawFly(getId("left"));
            } else if (keycode == 38 && core.getFloorByDirection("up", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("up", floorId))) {
                core.playSound('光标移动');
                core.ui.drawFly(getId("up"));
            } else if (keycode == 39 && core.getFloorByDirection("right", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("right", floorId))) {
                core.playSound('光标移动');
                core.ui.drawFly(getId("right"));
            } else if (keycode == 40 && core.getFloorByDirection("down", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("down", floorId))) {
                core.playSound('光标移动');
                core.ui.drawFly(getId("down"));
            } else if (keycode == 33 && core.getFloorByDirection("top", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("top", floorId))) {
                core.playSound('光标移动');
                core.ui.drawFly(getId("top"));
            } else if (keycode == 34 && core.getFloorByDirection("bottom", floorId) &&
                core.hasVisitedFloor(core.getFloorByDirection("bottom", floorId))) {
                core.playSound('光标移动');
                core.ui.drawFly(getId("bottom"));
            } else if (keycode == 90) {
                if (core.can3D(floorId) && !flags.in3D)
                    flags.use3D = true;
                if (flags.in3D) flags.use3D = false;
                core.playSound('光标移动');
                core.ui.drawFly(page);
            } else if (keycode == 66) { // 地图名
                if (flags.flyTitle) flags.flyTitle = false;
                else flags.flyTitle = true;
                core.playSound('光标移动');
                core.ui.drawFly(page);
            } else if (keycode == 188 && core.actions._getNextFlyFloor(-1) != page) { // 退10层
                core.ui.drawFly(this._getNextFlyFloor(-10));
                core.playSound("光标移动");
            } else if (keycode == 190 && core.actions._getNextFlyFloor(1) != page) { // 进10层
                core.ui.drawFly(this._getNextFlyFloor(10));
                core.playSound("光标移动");
            }
            return;
            //***--- 按键操作
        };
        ////// 楼层传送器界面时，放开某个键的操作 //////
        var originKeyUpFly = core.actions._keyUpFly;
        actions.prototype._keyUpFly = function (keycode) {
            if (!flags.usePlatFly || core.isReplaying()) return originKeyUpFly.call(core.actions, keycode);
            if (keycode == 71 || keycode == 27 || keycode == 88) {
                core.playSound('取消');
                core.deleteCanvas("mapOnUi");
                core.ui.closePanel();
            }
            if (keycode == 13 || keycode == 32 || keycode == 67)
                this._clickFly(this.HSIZE - 1, this.HSIZE - 1);
            return;
        };
        // 获取区域平面地图
        this.getFlyMap = function (floorId, fromUser, oriFloor, loop, clearCache) {
            floorId = floorId || core.status.floorId;
            if (floorId == oriFloor && !fromUser) return;
            oriFloor = oriFloor || core.status.floorId;
            if (!floorId) return;
            // 判断是否需要缓存
            function needCache (fromUser) {
                if (fromUser && !core.status.flyMap[floorId]) return true;
                if (!fromUser && !core.status.flyMap.cache[floorId]) return true;
                return false;
            }
            // 缓存，加快运行速率
            if (!core.status.flyMap) core.status.flyMap = {};
            if (!core.status.flyMap.cache) core.status.flyMap.cache = {};
            if (!core.status.layer) core.status.layer = {};
            if (!core.status.layer[floorId]) core.status.layer[floorId] = {};
            if (core.status.flyMap.cache[floorId] && fromUser) delete core.status.flyMap.cache[floorId]
            if (core.status.flyMap[floorId] && !fromUser) delete core.status.flyMap[floorId]
            if (needCache(fromUser) || clearCache) {
                // 初始化
                core.status.flyMap[floorId] = {};
                core.status.flyMap[floorId].thisMap = {};
                core.extractBlocks(floorId);
                core.status.maps[floorId].blocks.forEach(function (block) {
                    var id = block.event.id;
                    var x = block.x,
                        y = block.y;
                    var trigger = block.event.trigger;
                    if (trigger != "changeFloor" && trigger != "upFloor" && trigger != "downFloor") return;
                    // 是箭头且可以切换地图
                    var toFloor = block.event.data.floorId;
                    // 加入相应位置
                    // 箭头
                    if (id == leftPortal) {
                        core.status.flyMap[floorId].thisMap["left_" + x + "_" + y] = toFloor;
                    }
                    if (id == upPortal) {
                        core.status.flyMap[floorId].thisMap["up_" + x + "_" + y] = toFloor;
                    }
                    if (id == rightPortal) {
                        core.status.flyMap[floorId].thisMap["right_" + x + "_" + y] = toFloor;
                    }
                    if (id == downPortal) {
                        core.status.flyMap[floorId].thisMap["down_" + x + "_" + y] = toFloor;
                    }
                    // 上下楼
                    if (id == upFloor) {
                        core.status.flyMap[floorId].thisMap["top_" + x + "_" + y] = toFloor;
                        core.status.layer[floorId].top = true;
                    }
                    if (id == downFloor) {
                        core.status.flyMap[floorId].thisMap["bottom_" + x + "_" + y] = toFloor;
                        core.status.layer[floorId].bottom = true;
                    }
                });
                // 把下几层接着检测出来
                if (fromUser) {
                    var usedId = {};
                    for (var c = 1; c <= loop; c++) {
                        for (var i in core.status.flyMap[floorId].thisMap) {
                            var link = core.status.flyMap[floorId].thisMap;
                            if (!core.hasVisitedFloor(link[i]) || link[i] instanceof Object || usedId[link[i]]) continue;
                            usedId[link[i]] = true;
                            var next = core.getFlyMap(link[i], false, oriFloor);
                            for (var to in next) {
                                if (!core.status.layer[next[to]]) core.status.layer[next[to]] = {};
                                core.status.flyMap[floorId].thisMap[i + ',' + to] = next[to];
                            }
                        }
                    }
                }
                // 把先上再下之类的去掉
                if (fromUser) {
                    for (var i in core.status.flyMap[floorId].thisMap) {
                        var route = i.split(",");
                        for (var one = 0; one <= route.length - 2; one++) {
                            var step = route[one],
                                next = route[one + 1];
                            if ((step.startsWith("up") && next.startsWith("down")) ||
                                (step.startsWith("down") && next.startsWith("up")) ||
                                (step.startsWith("left") && next.startsWith("right")) ||
                                (step.startsWith("right") && next.startsWith("left")) ||
                                (step.startsWith("top") && next.startsWith("bottom")) ||
                                (step.startsWith("bottom") && next.startsWith("top"))) {
                                delete core.status.flyMap[floorId].thisMap[i];
                            }
                        }
                    }
                }
                // 非当前层不能存此类缓存
                if (!fromUser) {
                    core.status.flyMap.cache = {};
                    core.status.flyMap.cache[floorId] = {};
                    core.status.flyMap.cache[floorId].thisMap = core.status.flyMap[floorId].thisMap;
                    delete core.status.flyMap[floorId];
                }
                return fromUser ? core.status.flyMap[floorId].thisMap : core.status.flyMap.cache[floorId].thisMap;
            } else { // 直接使用缓存
                return fromUser ? core.status.flyMap[floorId].thisMap : core.status.flyMap.cache[floorId].thisMap;
            }
        };
        this.can3D = function (floorId) {
            var map = core.getFlyMap(floorId, true, floorId);
            for (var route in map) {
                if (route.indexOf("top") >= 0 || route.indexOf("bottom") >= 0)
                    return true;
            }
            return false;
        };
        // 绘制地图
        this.drawFlyMap = function (ctx, x, y, width, height, floorId, config) {
            if (flags.chase || flags.plot) return;
            // 初始化配置项
            //***--- 初始化 可以修改 || 后的默认值 参数说明在开头的高深区域中
            var fromUser = config.fromUser || false,
                oriFloor = config.oriFloor || core.status.floorId,
                scale = config.scale || null,
                interval = config.interval || (width / 24),
                noErase = config.noErase || false,
                fromMini = config.fromMini || false,
                loop = config.loop || defaultLoop,
                opacity = config.opacity || defaultOpacity,
                layer = config.layer || 0,
                use3D = config.use3D || false,
                clearCache = config.clearCache || false,
                map = config.map || null;
            //***--- 初始化
            map = map || core.getFlyMap(floorId, fromUser, oriFloor, loop, clearCache);
            floorId = floorId || core.status.floorId;
            if (!floorId) return;
            // 检测是否需要3D绘图
            if (!fromMini && use3D) {
                for (var route in map) {
                    if (route.indexOf("top") >= 0 || route.indexOf("bottom") >= 0) {
                        config.map = map;
                        return core.draw3DFlyMap(ctx, x, y, width, height, floorId, config);
                    }
                }
            }
            if (layer != 0 && !use3D) {
                var canLayer = false
                for (var route in map) {
                    if (route.indexOf("top") >= 0 || route.indexOf("bottom") >= 0) {
                        canLayer = true;
                        break;
                    }
                }
                if (!canLayer) layer = 0;
            }
            flags.in3D = false;
            // 初始化
            var userScale = true;
            var newCreate = false;
            if (!scale) {
                userScale = false;
                scale = scale || defaultScale;
            }
            if (!core.dymCanvas[ctx]) {
                core.createCanvas(ctx, x, y, width, height, 140);
                newCreate = true;
            }
            x = x || 0;
            y = y || 0;
            // 获得canvas属性
            width = width || document.getElementById(ctx).width;
            height = height || document.getElementById(ctx).height;
            var oLeft = document.getElementById(ctx).offsetLeft / core.domStyle.scale,
                oTop = document.getElementById(ctx).offsetTop / core.domStyle.scale;
            // 重置大地图和楼传地图的canvas位置
            if (ctx == "mapOnUi") core.relocateCanvas("mapOnUi", -240, -240);
            if (!noErase)
                core.clearMap(ctx);
            var horCenter = Math.floor(width / 2),
                uprCenter = Math.floor(height / 2);
            if (!newCreate) {
                horCenter += x;
                uprCenter += y;
            }
            var centerX = horCenter,
                centerY = uprCenter;
            var left = centerX,
                right = centerX,
                up = centerY,
                down = centerY;
            var used = {};
            var haveLayer = {};
            var nx = horCenter,
                ny = uprCenter;
            // 先把所在楼层绘制了
            if (layer == 0) {
                var nw = core.status.maps[floorId].width * 2 * scale,
                    nh = core.status.maps[floorId].height * 2 * scale;
                core.setAlpha(ctx, 1);
                core.fillRect(ctx, centerX - nw / 2, centerY - nh / 2, nw, nh, "#000000");
                core.strokeRect(ctx, centerX - nw / 2, centerY - nh / 2, nw, nh, "#ffff22", 3 * scale);
                // 当前层上下楼显示
                if (!haveLayer[floorId]) {
                    core.setAlpha(ctx, 1);
                    var needLayer = core.status.layer[floorId];
                    if (needLayer.top && needLayer.bottom) {
                        core.drawIcon(ctx, "upFloor", centerX - core.__SIZE__ * scale,
                            centerY - core.__SIZE__ * scale, core.__SIZE__ * scale, core.__SIZE__ * scale);
                        core.drawIcon(ctx, "downFloor", centerX - nw / 2 + core.__SIZE__ * scale,
                            centerY - nh / 2 + core.__SIZE__ * scale, core.__SIZE__ * scale, core.__SIZE__ * scale);
                    }
                    if (needLayer.top && !needLayer.bottom) {
                        core.drawIcon(ctx, "upFloor", centerX - Math.min(nw, nh) / 2, centerY - Math.min(nw, nh) / 2,
                            Math.min(nw, nh), Math.min(nw, nh));
                    }
                    if (!needLayer.top && needLayer.bottom) {
                        core.drawIcon(ctx, "downFloor", centerX - Math.min(nw, nh) / 2, centerY - Math.min(nw, nh) / 2,
                            Math.min(nw, nh), Math.min(nw, nh));
                    }
                    haveLayer[floorId] = true;
                }
                // 四侧最远位置
                if (left > centerX - nw / 2) left = centerX - nw / 2;
                if (right < centerX + nw / 2) right = centerX + nw / 2;
                if (down < centerY + nh / 2) down = centerY + nh / 2;
                if (up > centerY - nh / 2) up = centerY - nh / 2;
            }
            core.setAlpha(ctx, opacity);
            for (var route in map) { // 绘制楼层和线条
                var rouArr = route.split(",");
                // 检索路线及画线
                // 初始化
                centerX = nx;
                centerY = ny;
                var nowFloor = floorId || core.status.floorId;
                var nowLayer = 0;
                for (var one in rouArr) { // 一个一个检测
                    var step = rouArr[one].split("_");
                    var cx = step[1],
                        cy = step[2];
                    // 获得当前图块
                    core.getMapBlocksObj(nowFloor, true);
                    var nowBlock = core.status.mapBlockObjs[nowFloor][cx + ',' + cy];
                    if (!nowBlock) continue;
                    var toLoc = nowBlock.event.data.loc,
                        toFloor = nowBlock.event.data.floorId;
                    var needLayer = core.status.layer[toFloor];
                    // 当前层宽度和高度
                    var nw = core.status.maps[nowFloor].width * 2 * scale,
                        nh = core.status.maps[nowFloor].height * 2 * scale;
                    // 目标层宽度和高度
                    var tw = core.status.maps[toFloor].width * 2 * scale,
                        th = core.status.maps[toFloor].height * 2 * scale;
                    // 将当前层变为toFloor
                    nowFloor = toFloor;
                    // 超范围不画
                    if ((centerX > oLeft + x + width || centerX < oLeft + x || centerY > oTop + y + height ||
                        centerY < oTop + y) && userScale && !fromMini && ctx != "mapOnUi") continue;
                    // 绘制toFloor层
                    core.setAlpha(ctx, opacity);
                    // 确定center 根据箭头自适配 同时绘制线条 我已经看不懂了
                    if (!use3D && (step[0] == "top" || step[0] == "bottom") && layer == 0) break;
                    if (step[0] == "top") nowLayer++;
                    if (step[0] == "bottom") nowLayer--;
                    if (step[0] == 'left') {
                        var shouldTo = th / 2,
                            realTo = toLoc[1] * 2 * scale;
                        var shouldFrom = nh / 2,
                            realFrom = step[2] * 2 * scale;
                        if (nowLayer == layer) {
                            core.drawLine(ctx, centerX - nw / 2, centerY + realFrom - shouldFrom,
                                centerX - nw / 2 - interval, centerY + realFrom - shouldFrom, "#ffffff", 5 * scale);
                            core.drawLine(ctx, centerX - nw / 2, centerY + realFrom - shouldFrom,
                                centerX - nw / 2 - interval, centerY + realFrom - shouldFrom, "#000000", 2 * scale);
                        }
                        centerX -= nw / 2 + tw / 2 + interval;
                        centerY += shouldTo - realTo + realFrom - shouldFrom;
                    }
                    if (step[0] == 'right') {
                        var shouldTo = th / 2,
                            realTo = toLoc[1] * 2 * scale;
                        var shouldFrom = nh / 2,
                            realFrom = step[2] * 2 * scale;
                        if (nowLayer == layer) {
                            core.drawLine(ctx, centerX + nw / 2, centerY + realFrom - shouldFrom,
                                centerX + nw / 2 + interval, centerY + realFrom - shouldFrom, "#ffffff", 5 * scale);
                            core.drawLine(ctx, centerX + nw / 2, centerY + realFrom - shouldFrom,
                                centerX + nw / 2 + interval, centerY + realFrom - shouldFrom, "#000000", 2 * scale);
                        }
                        centerX += nw / 2 + tw / 2 + interval;
                        centerY += shouldTo - realTo + realFrom - shouldFrom;
                    }
                    if (step[0] == 'up') {
                        var shouldTo = tw / 2,
                            realTo = toLoc[0] * 2 * scale;
                        var shouldFrom = nw / 2,
                            realFrom = step[1] * 2 * scale;
                        if (nowLayer == layer) {
                            core.drawLine(ctx, centerX + realFrom - shouldFrom, centerY - nh / 2,
                                centerX + realFrom - shouldFrom, centerY - nh / 2 - interval, "#ffffff", 5 * scale);
                            core.drawLine(ctx, centerX + realFrom - shouldFrom, centerY - nh / 2,
                                centerX + realFrom - shouldFrom, centerY - nh / 2 - interval, "#000000", 2 * scale);
                        }
                        centerY -= nh / 2 + th / 2 + interval;
                        centerX += shouldTo - realTo + realFrom - shouldFrom;
                    }
                    if (step[0] == 'down') {
                        var shouldTo = tw / 2,
                            realTo = toLoc[0] * 2 * scale;
                        var shouldFrom = nw / 2,
                            realFrom = step[1] * 2 * scale;
                        if (nowLayer == layer) {
                            core.drawLine(ctx, centerX + realFrom - shouldFrom, centerY + nh / 2,
                                centerX + realFrom - shouldFrom, centerY + nh / 2 + interval, "#ffffff", 5 * scale);
                            core.drawLine(ctx, centerX + realFrom - shouldFrom, centerY + nh / 2,
                                centerX + realFrom - shouldFrom, centerY + nh / 2 + interval, "#000000", 2 * scale);
                        }
                        centerY += nh / 2 + th / 2 + interval;
                        centerX += shouldTo - realTo + realFrom - shouldFrom;
                    }
                    // 只有和目标层高度相同时才绘制
                    if (nowLayer != layer) continue;
                    // 超范围的不画
                    if ((centerX > oLeft + x + width || centerX < oLeft + x || centerY > oTop + y + height ||
                        centerY < oTop + y) && userScale && !fromMini && ctx != "mapOnUi") continue;
                    // 四侧最远位置
                    if (left > centerX - tw / 2) left = centerX - tw / 2;
                    if (right < centerX + tw / 2) right = centerX + tw / 2;
                    if (down < centerY + th / 2) down = centerY + th / 2;
                    if (up > centerY - th / 2) up = centerY - th / 2;
                    // 画过了不画
                    if (used[toFloor]) continue;
                    used[toFloor] = true;
                    // 画地图格
                    if (core.hasVisitedFloor(toFloor)) {
                        core.fillRect(ctx, centerX - tw / 2, centerY - th / 2, tw, th, "#000000");
                        core.strokeRect(ctx, centerX - tw / 2, centerY - th / 2, tw, th, "#ffffff", 3 * scale);
                    } else {
                        core.fillRect(ctx, centerX - tw / 2, centerY - th / 2, tw, th, "#ff22ff");
                        core.strokeRect(ctx, centerX - tw / 2, centerY - th / 2, tw, th, "#ffffff", 3 * scale);
                        break;
                    }
                    // 上下楼显示
                    if (haveLayer[toFloor]) continue;
                    core.setAlpha(ctx, opacity);
                    if (needLayer.top && needLayer.bottom) {
                        core.drawIcon(ctx, "upFloor", centerX - core.__SIZE__ * scale,
                            centerY - core.__SIZE__ * scale, core.__SIZE__ * scale, core.__SIZE__ * scale);
                        core.drawIcon(ctx, "downFloor", centerX - tw / 2 + core.__SIZE__ * scale,
                            centerY - th / 2 + core.__SIZE__ * scale, core.__SIZE__ * scale, core.__SIZE__ * scale);
                    }
                    if (needLayer.top && !needLayer.bottom) {
                        core.drawIcon(ctx, "upFloor", centerX - Math.min(tw, th) / 2, centerY - Math.min(tw, th) / 2,
                            Math.min(tw, th), Math.min(tw, th));
                    }
                    if (!needLayer.top && needLayer.bottom) {
                        core.drawIcon(ctx, "downFloor", centerX - Math.min(tw, th) / 2, centerY - Math.min(tw, th) / 2,
                            Math.min(tw, th), Math.min(tw, th));
                    }
                    haveLayer[toFloor] = true;
                }
            }
            // 自动缩放
            if ((right - left > core.__PIXELS__ - 64 || down - up > core.__PIXELS__ - 64) && !userScale && !fromMini) {
                scale = 1 / (Math.max(right - left, down - up) / (core.__PIXELS__ - 64));
                var con = { fromUser: fromUser, oriFloor: oriFloor, scale: scale, interval: interval * scale, layer: layer, opacity: opacity, loop: loop };
                return core.drawFlyMap(ctx, x, y, width, height, floorId, con);
            }
            // 大地图和楼层地图自适配定位
            if (ctx == "mapOnUi" && !fromMini && (left - nx < -128 || right - nx > 128 ||
                up - ny < -128 || down - ny > 128)) {
                core.relocateCanvas("mapOnUi", -240 + (-left - right + 2 * nx) / 2, -240 + (-up - down + 2 * ny) / 2);
            }
        };
        // 3D绘图
        this.draw3DFlyMap = function (ctx, x, y, width, height, floorId, config) {
            // 初始化配置项
            //***--- 初始化 同上一个初始化
            var fromUser = config.fromUser || false,
                oriFloor = config.oriFloor || core.status.floorId,
                scale = config.scale || null,
                interval = config.interval || (width / 24),
                deltaH = config.deltaH || (height / 8),
                noErase = config.noErase || false,
                fromMini = config.fromMini || false,
                loop = config.loop || defaultLoop,
                opacity = config.opacity || defaultOpacity,
                minorAlpha = config.minorAlpha || defaultMinorAlpha,
                reLeft = config.reLeft || -240,
                reTop = config.reTop || -240,
                clearCache = config.clearCache || false,
                map = config.map || null;
            //***--- 初始化
            map = map || core.getFlyMap(floorId, fromUser, oriFloor, loop, clearCache);
            // 当前层是否一个人在一层
            var alone = true;
            for (var route in map) {
                if (route.startsWith("left") || route.startsWith("right") ||
                    route.startsWith("up") || route.startsWith("down")) {
                    alone = false;
                    break;
                }
            }
            // 是则增加一个先上再下的路径
            if (alone) {
                for (var route in map) {
                    if (route.startsWith("top")) {
                        var first = route.split(",")[0].split("_");
                        break;
                    }
                }
                var success = false;
                core.getMapBlocksObj(nowFloor, true);
                var nowBlock = core.status.mapBlockObjs[floorId][first[1] + "," + first[2]];
                var toFloor = nowBlock.event.data.floorId;
                core.extractBlocks(toFloor);
                core.status.maps[toFloor].blocks.forEach(function (block) {
                    var id = block.event.id;
                    var x = block.x,
                        y = block.y;
                    var trigger = block.event.trigger;
                    if (trigger != "changeFloor") return;
                    if (id == "downFloor") {
                        map["top_" + first[1] + "_" + first[2] + "," + "bottom_" + x + "_" + y] = floorId;
                        success = true;
                        return;
                    }
                });
                // 添加先上再下失败 尝试先下再上
                if (!success) {
                    for (var route in map) {
                        if (route.startsWith("bottom")) {
                            var first = route.split(",")[0].split("_");
                            break;
                        }
                    }
                    var nowBlock = core.status.mapBlockObjs[floorId][first[1] + "," + first[2]];
                    var toFloor = nowBlock.event.data.floorId;
                    core.extractBlocks(toFloor);
                    core.status.maps[toFloor].blocks.forEach(function (block) {
                        var id = block.event.id;
                        var x = block.x,
                            y = block.y;
                        var trigger = block.event.trigger;
                        if (trigger != "changeFloor") return;
                        if (id == "upFloor") {
                            map["bottom_" + first[1] + "_" + first[2] + "," + "top_" + x + "_" + y] = floorId;
                            success = true;
                            return;
                        }
                    });
                }
            }
            floorId = floorId || core.status.floorId;
            if (!floorId) return;
            flags.in3D = true;
            // 初始化
            // 获得排序过的楼层路径
            map = core.sortFloor(map);
            map = map.map;
            var userScale = true;
            var newCreate = false;
            if (!scale) {
                userScale = false;
                scale = scale || defaultScale;
            }
            if (!core.dymCanvas[ctx]) {
                core.createCanvas(ctx, x, y, width, height, 140);
                newCreate = true;
            }
            x = x || 0;
            y = y || 0;
            // 获得canvas属性
            width = width || document.getElementById(ctx).width;
            height = height || document.getElementById(ctx).height;
            // 重置canvas位置
            core.relocateCanvas(ctx, reLeft, reTop);
            if (!noErase)
                core.clearMap(ctx);
            var horCenter = Math.floor(width / 2),
                uprCenter = Math.floor(height / 2);
            if (!newCreate) {
                horCenter += x;
                uprCenter += y;
            }
            // 单元格的中心点 即水平线中点处
            var centerX = horCenter,
                centerY = uprCenter;
            var left = centerX,
                right = centerX,
                up = centerY,
                down = centerY;
            var used = {};
            var nx = horCenter,
                ny = uprCenter;
            // 开始绘制
            for (var i = 0; i < map.length; i++) {
                var route = map[i][0];
                var nowLayer = map[i][1];
                var everyLayer = 0;
                route = route.split(",");
                // 每条路线初始化
                centerX = horCenter;
                centerY = uprCenter;
                centerX += core.status.maps[floorId].height * scale * Math.SQRT2 / 4;
                if (flags.viewingLayer) {
                    centerY += deltaH * flags.viewingLayer;
                }
                var nowFloor = floorId || core.status.floorId;
                for (var one = 0; one < route.length; one++) {
                    var step = route[one].split("_");
                    var cx = step[1],
                        cy = step[2];
                    // 检测高度，是否与nowLayer一致 不一致在处理完center以后不绘制
                    if (step[0] == "top") everyLayer++;
                    if (step[0] == "bottom") everyLayer--;
                    // 获得当前图块
                    core.getMapBlocksObj(nowFloor, true);
                    var nowBlock = core.status.mapBlockObjs[nowFloor][cx + ',' + cy];
                    if (!nowBlock) continue;
                    var toLoc = nowBlock.event.data.loc,
                        toFloor = nowBlock.event.data.floorId;
                    // 当前层宽度和高度
                    // 斜二测画法
                    var nw = core.status.maps[nowFloor].width * 2 * scale,
                        nh = core.status.maps[nowFloor].height * scale * Math.SQRT2 / 2;
                    // 目标层宽度和高度
                    var tw = core.status.maps[toFloor].width * 2 * scale,
                        th = core.status.maps[toFloor].height * scale * Math.SQRT2 / 2;
                    if (!(toLoc instanceof Array)) {
                        toLoc = [Math.floor(tw / 4 / scale), Math.floor(th / 4 / scale)];
                    }
                    // 绘制当前层
                    if (nowLayer == 0 && !used[floorId]) {
                        core.setAlpha(ctx, 1);
                        used[floorId] = true;
                        var nowW = core.status.maps[floorId].width * 2 * scale;
                        var nowH = core.status.maps[floorId].height * scale * Math.SQRT2 / 2;
                        var nodes = [
                            [centerX - nowW / 2 - nowH / 2, centerY + nowH / 2],
                            [centerX + nowW / 2 - nowH / 2, centerY + nowH / 2],
                            [centerX + nowW / 2 + nowH / 2, centerY - nowH / 2],
                            [centerX - nowW / 2 + nowH / 2, centerY - nowH / 2]
                        ];
                        core.fillPolygon(ctx, nodes, "#000000");
                        core.strokePolygon(ctx, nodes, "#ffff22", 1.5 * scale);
                        // 四侧最远位置
                        if (left > centerX - nw / 2 - nh / 2 && nowLayer == (flags.viewingLayer || 0)) left = centerX - nw / 2 - nh / 2;
                        if (right < centerX + nw / 2 + nh / 2 && nowLayer == (flags.viewingLayer || 0)) right = centerX + nw / 2 + nh / 2;
                    }
                    // 将当前层变为toFloor
                    var fromFloor = nowFloor;
                    nowFloor = toFloor;
                    // 计算center 画同层间的线 我已经看不懂了
                    // 设置不透明度
                    if (nowLayer == (flags.viewingLayer || 0)) {
                        core.setAlpha(ctx, opacity);
                    } else {
                        core.setAlpha(ctx, minorAlpha * Math.max(0, 1 - 0.34 * Math.abs(nowLayer - (flags.viewingLayer || 0))));
                    }
                    if (step[0] == "left") {
                        var shouldFrom = nh / 2,
                            realFrom = cy * scale * Math.SQRT2 / 2;
                        var shouldTo = th / 2,
                            realTo = toLoc[1] * scale * Math.SQRT2 / 2;
                        if (everyLayer == nowLayer && !used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy])
                            core.drawLine(ctx, centerX - nw / 2 + nh / 2 - realFrom, centerY + realFrom - shouldFrom,
                                centerX - nw / 2 - interval + nh / 2 - realFrom, centerY + realFrom - shouldFrom, "#ffffff", 2 * scale);
                        centerX -= nw / 2 + tw / 2 + interval + shouldTo - realTo + realFrom - shouldFrom;
                        centerY += shouldTo - realTo + realFrom - shouldFrom;
                    }
                    if (step[0] == "right") {
                        var shouldFrom = nh / 2,
                            realFrom = cy * scale * Math.SQRT2 / 2;
                        var shouldTo = th / 2,
                            realTo = toLoc[1] * scale * Math.SQRT2 / 2;
                        if (nowLayer == everyLayer && !used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy])
                            core.drawLine(ctx, centerX + nw / 2 + nh / 2 - realFrom, centerY + realFrom - shouldFrom,
                                centerX + nw / 2 + interval + nh / 2 - realFrom, centerY + realFrom - shouldFrom, "#ffffff", 2 * scale);
                        centerX += nw / 2 + tw / 2 + interval - (shouldTo - realTo + realFrom - shouldFrom);
                        centerY += shouldTo - realTo + realFrom - shouldFrom;
                    }
                    if (step[0] == "up") {
                        var shouldTo = tw / 2,
                            realTo = toLoc[0] * scale * 2;
                        var shouldFrom = nw / 2,
                            realFrom = cx * scale * 2;
                        if (nowLayer == everyLayer && !used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy])
                            core.drawLine(ctx, centerX + realFrom - shouldFrom + nh / 2, centerY - nh / 2, centerX + realFrom -
                                shouldFrom + interval * Math.SQRT2 / 4 + nh / 2, centerY - nh / 2 - interval * Math.SQRT2 / 4, "#ffffff", 2 * scale);
                        centerY -= nh / 2 + th / 2 + interval * Math.SQRT2 / 4;
                        centerX += shouldTo - realTo + realFrom - shouldFrom + (nh / 2 + th / 2 + interval * Math.SQRT2 / 4);
                    }
                    if (step[0] == "down") {
                        var shouldTo = tw / 2,
                            realTo = toLoc[0] * scale * 2;
                        var shouldFrom = nw / 2,
                            realFrom = cx * scale * 2;
                        if (nowLayer == everyLayer && !used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy])
                            core.drawLine(ctx, centerX + realFrom - shouldFrom - nh / 2, centerY + nh / 2, centerX + realFrom -
                                shouldFrom - interval * Math.SQRT2 / 4 - nh / 2, centerY + nh / 2 + interval * Math.SQRT2 / 4, "#ffffff", 2 * scale);
                        centerY += nh / 2 + th / 2 + interval * Math.SQRT2 / 4;
                        centerX += shouldTo - realTo + realFrom - shouldFrom - (nh / 2 + th / 2 + interval * Math.SQRT2 / 4);
                    }
                    if (step[0] == "top") {
                        centerY -= deltaH;
                    }
                    if (step[0] == "bottom") {
                        centerY += deltaH;
                    }
                    if (everyLayer == nowLayer && step[0] != "top" && step[0] != "bottom") {
                        used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy] = true;
                        used[toFloor + "_" + fromFloor + "_" + toLoc[0] + "_" + toLoc[1]] = true;
                    }
                    if (everyLayer != nowLayer) continue;
                    // 四侧最远位置
                    if (!flags.viewingLayer) {
                        if (left > centerX - tw / 2 - th / 2 && nowLayer == (flags.viewingLayer || 0)) left = centerX - tw / 2 - th / 2;
                        if (right < centerX + tw / 2 + th / 2 && nowLayer == (flags.viewingLayer || 0)) right = centerX + tw / 2 + th / 2;
                        if (down < centerY + th / 2 && nowLayer == (flags.viewingLayer || 0)) down = centerY + th / 2;
                        if (up > centerY - th / 2 && nowLayer == (flags.viewingLayer || 0)) up = centerY - th / 2;
                    }
                    // 不同高度层之间的连线
                    if (!used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy]) {
                        core.setAlpha(ctx, opacity * Math.max(0, 1 - 0.34 * Math.abs(nowLayer - (flags.viewingLayer || 0))));
                        if (step[0] == "top") {
                            core.drawLine(ctx, centerX, centerY + deltaH, centerX, centerY, "#ffffff", 5 * scale);
                            core.drawLine(ctx, centerX, centerY + deltaH, centerX, centerY, "#000000", 2 * scale);
                            used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy] = true;
                            used[toFloor + "_" + fromFloor + "_" + toLoc[0] + "_" + toLoc[1]] = true;
                        }
                    }
                    if (!used[toFloor]) {
                        used[toFloor] = true;
                        // 设置不透明度
                        if (nowLayer == (flags.viewingLayer || 0)) {
                            core.setAlpha(ctx, opacity);
                        } else {
                            core.setAlpha(ctx, minorAlpha * Math.max(0, 1 - 0.34 * Math.abs(nowLayer - (flags.viewingLayer || 0))));
                        }
                        // 画地图
                        var nodes = [
                            [centerX - tw / 2 - th / 2, centerY + th / 2], // 左下
                            [centerX + tw / 2 - th / 2, centerY + th / 2], // 右下
                            [centerX + tw / 2 + th / 2, centerY - th / 2], // 右上
                            [centerX - tw / 2 + th / 2, centerY - th / 2] // 左上
                        ];
                        if (core.hasVisitedFloor(toFloor)) {
                            core.fillPolygon(ctx, nodes, "#000000");
                        } else {
                            core.fillPolygon(ctx, nodes, "#ff22ff");
                        }
                        core.strokePolygon(ctx, nodes, "#ffffff", 1.5 * scale);
                    }
                    // 不同高度层之间的连线
                    if (!used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy]) {
                        if (step[0] == "bottom") {
                            core.drawLine(ctx, centerX, centerY, centerX, centerY - deltaH, "#ffffff", 5 * scale);
                            core.drawLine(ctx, centerX, centerY, centerX, centerY - deltaH, "#000000", 2 * scale);
                            used[fromFloor + "_" + toFloor + "_" + cx + "_" + cy] = true;
                            used[toFloor + "_" + fromFloor + "_" + toLoc[0] + "_" + toLoc[1]] = true;
                        }
                    }
                }
            }
            // 自动缩放
            if ((right - left > core.__PIXELS__ - 64 || down - up > core.__PIXELS__ - 64) && !userScale && !fromMini) {
                scale = 1 / (Math.max(right - left, down - up) / (core.__PIXELS__ - 64));
                var con = { fromUser: fromUser, oriFloor: oriFloor, scale: scale, interval: interval * scale, opacity: opacity, loop: loop, use3D: true };
                return core.draw3DFlyMap(ctx, x, y, width, height, floorId, con);
            }
            // 大地图和楼层地图自适配定位
            if (ctx == "mapOnUi")
                core.relocateCanvas("mapOnUi", -240 + (-left - right + 2 * nx) / 2, -240 + (-up - down + 2 * ny) / 2);
        };
        // 不同高度楼层排序
        this.sortFloor = function (map) {
            map = map || core.getFlyMap(null, true);
            var totalLayer = 1,
                topLayer = 0,
                bottomLayer = 0,
                nowLayer = 0;
            // 拆分map
            for (var i in map) {
                var route = i.split(",");
                nowLayer = 0;
                for (var one in route) {
                    var step = route[one].split("_");
                    // 层数处理 并记录每一层的层数
                    if (step[0] == "top") {
                        nowLayer++;
                        map[i] = nowLayer + "_" + map[i];
                        if (nowLayer > topLayer) topLayer = nowLayer;
                    }
                    if (step[0] == "bottom") {
                        nowLayer--;
                        map[i] = nowLayer + "_" + map[i];
                        if (nowLayer < bottomLayer) bottomLayer = nowLayer;
                    }
                }
            }
            // 总层数
            totalLayer = topLayer - bottomLayer + 1;
            // 按楼层高度由低到高排序
            // 先变成数组
            var mapArr = [];
            for (var one in map) {
                mapArr.push([one, parseInt(map[one]) || 0]);
            }
            // 再sort
            mapArr.sort(function (a, b) { return a[1] - b[1]; });
            return { map: mapArr, totalLayer: totalLayer, top: topLayer, bottom: bottomLayer };
        };
        // 由方向获得楼层坐标
        this.getFloorByDirection = function (direction, floorId) {
            floorId = floorId || core.status.floorId;
            var route = core.getFlyMap(floorId);
            for (var step in route) {
                if (step.indexOf(direction) >= 0) {
                    return route[step];
                }
            }
            return null;
        };
        ////// 转换楼层结束的事件 检查小地图 //////
        var originAfterChangeFloor = core.events.afterChangeFloor;
        events.prototype.afterChangeFloor = function (floorId) {
            if (!flags.__useMinimap__ || core.isReplaying() || flags.chase || flags.plot) {
                core.deleteCanvas("minimap");
                core.deleteCanvas("mapArrow");
                core.unregisterAction("ondown", "closeMinimap");
                core.unregisterAction("ondown", "openMinimap");
                return originAfterChangeFloor.call(core.events, floorId);
            }
            if (main.mode != 'play') return;
            this.eventdata.afterChangeFloor(floorId);
            // 防止小地图出问题
            core.unregisterAction("ondown", "closeMinimap");
            core.unregisterAction("ondown", "openMinimap");
            // 切换小地图
            core.checkMinimap(true, true);
            return;
        };
        ////// 瞬间移动 检查小地图 //////
        var originMoveDirectly = core.control.moveDirectly;
        control.prototype.moveDirectly = function (destX, destY, ignoreSteps) {
            if (!flags.__useMinimap__ || core.isReplaying() || flags.chase || flags.plot)
                return originMoveDirectly.call(core.control, destX, destY, ignoreSteps);
            var canMoveDirectly = this.controldata.moveDirectly(destX, destY, ignoreSteps);
            if (canMoveDirectly) core.checkMinimap();
            return canMoveDirectly;
        };
        ////// 每移动一格后执行的事件 检查小地图 //////
        var originMoveOneStep = core.control.moveOneStep;
        control.prototype.moveOneStep = function (callback) {
            if (!flags.__useMinimap__ || core.isReplaying() || flags.chase || flags.plot)
                return originMoveOneStep.call(core.control, callback);
            this.controldata.moveOneStep(callback);
            core.checkMinimap();
        };
        // 检查小地图开闭情况 改变小地图位置
        this.checkMinimap = function (fromUser, reDraw) {
            if (!flags.__useMinimap__ || core.isReplaying()) {
                core.unregisterAction("ondown", "closeMinimap");
                core.unregisterAction("ondown", "openMinimap");
                core.deleteCanvas("mapArrow");
                core.deleteCanvas("minimap");
                return;
            }
            reDraw = reDraw || false;
            // 是否重绘
            if (reDraw) {
                if (flags.minimap) core.drawMinimap(flags.__onLeft__);
                else core.drawClosedMap(flags.__onLeft__);
            }
            var hx = core.status.hero.loc.x;
            var opened = flags.minimap;
            var onLeft = hx >= Math.ceil(core.__SIZE__ / 3 * 2);
            fromUser = fromUser || false; // 开关小地图相关
            if (!flags.__onLeft__) flags.__onLeft__ = false;
            // 如果地图上没有小地图 画到右边
            if (!core.dymCanvas.mapArrow && !core.dymCanvas.minimap && !reDraw) {
                if (flags.minimap) core.drawMinimap();
                else core.drawClosedMap();
                flags.__onLeft__ = false;
            }
            // 人物在中间 不执行
            if (hx >= Math.ceil(core.__SIZE__ / 3 + core.bigmap.offsetX / 32) &&
                hx <= Math.floor(core.__SIZE__ / 3 * 2 + core.bigmap.offsetX / 32)) return;
            // 重定位画布 和 翻转
            // 挪到右边
            if (!onLeft && (flags.__onLeft__ || fromUser)) {
                flags.__onLeft__ = false;
                if (opened) {
                    core.relocateCanvas("minimap", core.__PIXELS__ - 120, 0);
                    core.relocateCanvas("mapArrow", core.__PIXELS__ - 140, 0);
                    document.getElementById('mapArrow').style.transform = 'none';
                } else {
                    core.relocateCanvas("minimap", core.__PIXELS__, 0);
                    core.relocateCanvas("mapArrow", core.__PIXELS__ - 20, 0);
                    document.getElementById('mapArrow').style.transform = 'none';
                }
            }
            // 挪到左边
            if (onLeft && (!flags.__onLeft__ || fromUser)) {
                flags.__onLeft__ = true;
                if (opened) {
                    core.relocateCanvas("minimap", 0, 0);
                    core.relocateCanvas("mapArrow", 120, 0);
                    document.getElementById('mapArrow').style.transform = 'rotateY(180deg)';
                } else {
                    core.relocateCanvas("minimap", -120, 0);
                    core.relocateCanvas("mapArrow", 0, 0);
                    document.getElementById('mapArrow').style.transform = 'rotateY(180deg)';
                }
            }
        };
        // 点击小地图的action
        this.registerMinimapAction = function (open) {
            if (!open) {
                core.registerAction("ondown", "closeMinimap", function (x, y, px, py) {
                    if (!flags.__onLeft__) {
                        if (px >= core.__PIXELS__ - 140 && px <= core.__PIXELS__ - 120 &&
                            py >= 0 && py <= 120) {
                            core.closeMinimap();
                            core.unregisterAction("ondown", "closeMinimap");
                            return true;
                        }
                        if (px >= core.__PIXELS__ - 120 && py <= 120) {
                            core.playSound("打开界面");
                            core.drawTotalMap();
                            return true;
                        }
                    } else {
                        if (px >= 120 && px <= 140 && py >= 0 && py <= 120) {
                            core.closeMinimap();
                            core.unregisterAction("ondown", "closeMinimap");
                            return true;
                        }
                        if (px <= 120 && py <= 120) {
                            core.playSound("打开界面");
                            core.drawTotalMap();
                            return true;
                        }
                    }
                }, 10);
            } else {
                core.registerAction("ondown", "openMinimap", function (x, y, px, py) {
                    if (!flags.__onLeft__) {
                        if (px >= core.__PIXELS__ - 20 && py <= 120) {
                            core.openMinimap();
                            core.unregisterAction("ondown", "openMinimap");
                            return true;
                        }
                    } else {
                        if (px <= 20 && py <= 120) {
                            core.openMinimap();
                            core.unregisterAction("ondown", "openMinimap");
                            return true;
                        }
                    }
                }, 10);
            }
        };
        // 地图上的小地图
        this.drawMinimap = function (toLeft) {
            if (!flags.__useMinimap__) {
                core.deleteCanvas("mapArrow");
                core.deleteCanvas("minimap");
                return;
            }
            var scale = 1.3 / core.status.thisMap.width * 15 * (flags.userScale || 1);
            if (1.3 / core.status.thisMap.height * 15 * (flags.userScale || 1) < scale)
                scale = 1.3 / core.status.thisMap.height * 15 * (flags.userScale || 1);
            // 绘制
            core.createCanvas("minimap", core.__PIXELS__ - 120, 0, 120, 120, 100);
            core.createCanvas("mapArrow", core.__PIXELS__ - 140, 0, 20, 120, 100);
            if (toLeft) {
                core.relocateCanvas("minimap", 0, 0);
                core.relocateCanvas("mapArrow", 120, 0);
                document.getElementById('mapArrow').style.transform = 'rotateY(180deg)';
            }
            core.clearMap("minimap");
            core.clearMap("mapArrow");
            // 黑色底
            core.fillRect("minimap", 0, 0, 120, 120, [0, 0, 0, 0.6]);
            var config = { fromUser: true, oriFloor: core.status.floorId, scale: scale, interval: 10, noErase: true, fromMini: true };
            core.drawFlyMap("minimap", 0, 0, 120, 120, core.status.floorId, config);
            // 向右箭头
            core.fillRect("mapArrow", 0, 0, 20, 120, [230, 230, 230, 0.9]);
            core.drawLine("mapArrow", 0, 20, 20, 20, [100, 100, 100, 0.9], 2);
            core.drawLine("mapArrow", 0, 100, 20, 100, [100, 100, 100, 0.9], 2);
            core.setTextAlign("mapArrow", "center");
            core.fillText("mapArrow", "▶", 10, 67, [100, 100, 100, 0.9], "20px Verdana");
            core.registerMinimapAction(false);
        };
        // 关闭小地图
        this.closeMinimap = function () {
            if (!flags.__useMinimap__) {
                core.deleteCanvas("mapArrow");
                core.deleteCanvas("minimap");
                return;
            }
            var onLeft = flags.__onLeft__;
            var frame = 0;
            var x = core.__PIXELS__,
                a = 0.096,
                speed = 4.8;
            if (onLeft) {
                x = 260;
                a = -a;
                speed = -speed;
            }
            var interval = setInterval(function () {
                core.relocateCanvas("mapArrow", x - 140, 0);
                if (!onLeft)
                    core.relocateCanvas("minimap", x - 120, 0);
                else core.relocateCanvas("minimap", x - 260, 0);
                speed -= a;
                x += speed;
                if (frame == 50) {
                    flags.minimap = false;
                    clearInterval(interval);
                    core.drawClosedMap(onLeft);
                    core.checkMinimap(true);
                }
                frame++;
            }, 20);
        };
        // 合上的小地图
        this.drawClosedMap = function (toLeft) {
            if (!flags.__useMinimap__) {
                core.deleteCanvas("mapArrow");
                core.deleteCanvas("minimap");
                return;
            }
            var scale = 1.3 / core.status.thisMap.width * 15 * (flags.userScale || 1);
            if (1.3 / core.status.thisMap.height * 15 * (flags.userScale || 1) < scale)
                scale = 1.3 / core.status.thisMap.height * 15 * (flags.userScale || 1);
            // 绘制
            core.createCanvas("minimap", core.__PIXELS__, 0, 120, 120, 100);
            core.createCanvas("mapArrow", core.__PIXELS__ - 20, 0, 20, 120, 100);
            core.clearMap("minimap");
            core.clearMap("mapArrow");
            if (toLeft) {
                core.relocateCanvas("minimap", -120, 0);
                core.relocateCanvas("mapArrow", 0, 0);
                document.getElementById('mapArrow').style.transform = 'rotateY(180deg)';
            }
            // 黑色底
            core.fillRect("minimap", 0, 0, 120, 120, [0, 0, 0, 0.6]);
            var config = { fromUser: true, oriFloor: core.status.floorId, scale: scale, interval: 10, noErase: true, fromMini: true };
            core.drawFlyMap("minimap", 0, 0, 120, 120, core.status.floorId, config);
            // 向左箭头
            core.fillRect("mapArrow", 0, 0, 20, 120, [230, 230, 230, 0.9]);
            core.drawLine("mapArrow", 0, 20, 20, 20, [100, 100, 100, 0.9], 2);
            core.drawLine("mapArrow", 0, 100, 20, 100, [100, 100, 100, 0.9], 2);
            core.setTextAlign("mapArrow", "center");
            core.fillText("mapArrow", "◀", 10, 67, [100, 100, 100, 0.9], "20px Verdana");
            core.registerMinimapAction(true);
        };
        // 打开小地图
        this.openMinimap = function () {
            if (!flags.__useMinimap__) {
                core.deleteCanvas("mapArrow");
                core.deleteCanvas("minimap");
                return;
            }
            var onLeft = flags.__onLeft__;
            var frame = 0;
            var x = 120 + core.__PIXELS__,
                a = 0.096,
                speed = 4.8;
            if (onLeft) {
                x = 140;
                a = -a;
                speed = -speed;
            }
            var interval = setInterval(function () {
                core.relocateCanvas("mapArrow", x - 140, 0);
                if (!flags.__onLeft__)
                    core.relocateCanvas("minimap", x - 120, 0);
                else core.relocateCanvas("minimap", x - 260, 0);
                speed -= a;
                x -= speed;
                if (frame == 50) {
                    flags.minimap = true;
                    clearInterval(interval);
                    core.drawMinimap(onLeft);
                    core.checkMinimap(true);
                }
                frame++;
            }, 20);
        };
        // 大地图
        this.drawTotalMap = function (floorId) {
            floorId = floorId || core.status.floorId;
            core.status.event.id = "totalMap";
            core.lockControl();
            if (!flags.viewingLayer) flags.viewingLayer = 0;
            var loop = 5;
            if (flags.worldMap) loop = core.floorIds.length;
            // 大地图时点击和键盘操作
            core.registerAction("ondown", "onDownTmap", function (x, y) {
                if (core.status.event.id == "totalMap") {
                    if (y < 1 && x <= Math.floor(core.__SIZE__ / 2) - 2) { // 上移一层
                        if (flags.viewingLayer < core.sortFloor().top) {
                            flags.viewingLayer++;
                            core.playSound('光标移动');
                            core.drawTotalMap();
                        }
                        return true;
                    }
                    if (y < 1 && x >= Math.ceil(core.__SIZE__ / 2) + 1) { // 下移一层
                        if (flags.viewingLayer > core.sortFloor().bottom) {
                            flags.viewingLayer--;
                            core.playSound('光标移动');
                            core.drawTotalMap();
                        }
                        return true;
                    }
                    if (y < 1 && x < Math.ceil(core.__SIZE__ / 2) + 1 && x > Math.floor(core.__SIZE__ / 2) - 2) {
                        // 区域地图
                        if (flags.worldMap) {
                            flags.worldMap = false;
                            flags.viewingLayer = 0;
                        } else flags.worldMap = true;
                        core.playSound('光标移动');
                        core.drawTotalMap();
                        return true;
                    }
                    if (y >= core.__SIZE__ - 1 && x <= Math.floor(core.__SIZE__ / 2)) { // 3D
                        if (core.can3D(floorId) && !flags.in3D) flags.use3D = true;
                        if (flags.in3D) flags.use3D = false;
                        flags.mapHint = false;
                        core.playSound('光标移动');
                        core.drawTotalMap();
                        return true;
                    }
                    if (y >= core.__SIZE__ - 1 && x >= Math.ceil(core.__SIZE__ / 2)) { // hint
                        if (flags.in3D) {
                            if (!flags.mapHint) flags.mapHint = true;
                            else flags.mapHint = false;
                            core.playSound('光标移动');
                            core.drawTotalMap();
                        }
                        return true;
                    }
                    flags.viewingLayer = 0;
                    core.playSound("取消")
                    core.deleteCanvas("mapOnUi");
                    core.deleteCanvas("back");
                    core.deleteCanvas("tips");
                    core.closePanel();
                    core.unregisterAction("ondown", "onDownTmap");
                    return true;
                }
            }, 110);
            core.registerAction("keyUp", "keyUpTmap", function (keycode) {
                if (core.status.event.id == "totalMap") {
                    if (keycode == 33) { // PgUp
                        if (flags.viewingLayer < core.sortFloor().top) {
                            flags.viewingLayer++;
                            core.playSound('光标移动');
                            core.drawTotalMap();
                        }
                        return true;
                    }
                    if (keycode == 34) { // PgDn
                        if (flags.viewingLayer > core.sortFloor().bottom) {
                            flags.viewingLayer--;
                            core.playSound('光标移动');
                            core.drawTotalMap();
                        }
                        return true;
                    }
                    if (keycode == 90) { // Z
                        if (core.can3D(floorId) && !flags.in3D) flags.use3D = true;
                        if (flags.in3D) flags.use3D = false;
                        flags.mapHint = false;
                        core.playSound('光标移动');
                        core.drawTotalMap();
                        return true;
                    }
                    if (keycode == 84) { // T
                        if (flags.in3D) {
                            if (!flags.mapHint) flags.mapHint = true;
                            else flags.mapHint = false;
                            core.playSound('光标移动');
                            core.drawTotalMap();
                        }
                        return true;
                    }
                    if (keycode == 87) { // W
                        if (flags.worldMap) {
                            flags.worldMap = false;
                            flags.viewingLayer = 0;
                        } else flags.worldMap = true;
                        core.playSound('光标移动');
                        core.drawTotalMap();
                        return true;
                    }
                    flags.viewingLayer = 0;
                    core.playSound("取消")
                    core.deleteCanvas("mapOnUi");
                    core.deleteCanvas("back");
                    core.deleteCanvas("tips");
                    core.closePanel();
                    core.unregisterAction("keyUp", "keyUpTmap");
                    return true;
                }
            }, 110);
            // 开始画
            core.createCanvas("mapOnUi", -240, -240, core.__PIXELS__ + 480, core.__PIXELS__ + 480, 150);
            core.createCanvas("back", -240, -240, core.__PIXELS__ + 480, core.__PIXELS__ + 480, 140);
            core.createCanvas("tips", 0, 0, core.__PIXELS__, core.__PIXELS__, 160);
            var ctx = document.getElementById("tips").getContext("2d");
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 5;
            ctx.shadowColor = "rgba(100, 100, 255, 1)";
            core.fillRect("back", -240, -240, core.__PIXELS__ + 480, core.__PIXELS__ + 480, [0, 0, 0, 0.9]);
            core.fillRect("tips", 0, 0, core.__PIXELS__ / 2 - 50, 32, [200, 200, 200, 0.8]);
            core.fillRect("tips", core.__PIXELS__ / 2 + 50, 0, core.__PIXELS__ / 2 - 50, 32, [200, 200, 200, 0.8]);
            core.fillRect("tips", core.__PIXELS__ / 2 - 46, 0, 92, 32, [200, 200, 200, 0.8]);
            core.drawLine("tips", 0, 32, core.__PIXELS__ / 2 - 50, 32, [50, 50, 50, 0.8], 3);
            core.drawLine("tips", core.__PIXELS__ / 2 + 50, 32, core.__PIXELS__, 32, [50, 50, 50, 0.8], 3);
            core.drawLine("tips", core.__PIXELS__ / 2 - 46, 32, core.__PIXELS__ / 2 + 46, 32, [50, 50, 50, 0.8], 3);
            core.fillRect("tips", 0, core.__PIXELS__, core.__PIXELS__ / 2 - 5, -32, [200, 200, 200, 0.8]);
            core.fillRect("tips", core.__PIXELS__ / 2 + 5, core.__PIXELS__, core.__PIXELS__ / 2 - 5, -32, [200, 200, 200, 0.8]);
            core.drawLine("tips", 0, core.__PIXELS__ - 32, core.__PIXELS__ / 2 - 5, core.__PIXELS__ - 32, [50, 50, 50, 0.8], 3);
            core.drawLine("tips", core.__PIXELS__ / 2 + 5, core.__PIXELS__ - 32, core.__PIXELS__, core.__PIXELS__ - 32, [50, 50, 50, 0.8], 3);
            core.setTextAlign("tips", "center");
            core.fillText("tips", "上移一层", core.__PIXELS__ / 4 - 23, 24, [255, 255, 255, 0.8], "24px " + core.status.globalAttribute.font);
            core.fillText("tips", "下移一层", core.__PIXELS__ / 4 * 3 + 23, 24, [255, 255, 255, 0.8], "24px " + core.status.globalAttribute.font);
            core.fillText("tips", flags.worldMap ? "小地图" : "区域地图", core.__PIXELS__ / 2, 24, [255, 255, 255, 0.8], "24px " + core.status.globalAttribute.font);
            core.drawFlyMap("mapOnUi", 240, 240, core.__PIXELS__, core.__PIXELS__,
                floorId, { fromUser: true, opacity: 1, oriFloor: floorId, noErase: true, use3D: flags.use3D, layer: flags.viewingLayer, loop: loop, clearCache: true });
            if (flags.in3D)
                core.fillText("tips", "参考线（T）", core.__PIXELS__ / 4 * 3, core.__PIXELS__ - 8, [255, 255, 255, 0.8], "24px " + core.status.globalAttribute.font);
            if (core.can3D(floorId) && !flags.in3D)
                core.fillText("tips", "3D模式（Z）", core.__PIXELS__ / 4, core.__PIXELS__ - 8, [255, 255, 255, 0.8], "24px " + core.status.globalAttribute.font);
            if (flags.in3D)
                core.fillText("tips", "2D模式（Z）", core.__PIXELS__ / 4, core.__PIXELS__ - 8, [255, 255, 255, 0.8], "24px " + core.status.globalAttribute.font);
            if (flags.mapHint) {
                core.drawLine("back", 240, 240 + core.__PIXELS__, 240 + core.__PIXELS__, 240, [100, 100, 240, 0.4], 2);
                core.drawLine("back", 240 + core.__PIXELS__ / 2, 240, 240 + core.__PIXELS__ / 2, 240 + core.__PIXELS__, [100, 100, 240, 0.4], 2);
                core.drawLine("back", 240, 240 + core.__PIXELS__ / 2, 240 + core.__PIXELS__, 240 + core.__PIXELS__ / 2, [100, 100, 240, 0.4], 2);
            }
        };
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
        this.startWarning = function (x, y, boss) {
            if (core.isReplaying()) return;
            x = x || 0;
            y = y || 0;
            // danger显示层
            core.createCanvas("danger", 32 * x + 240, 32 * y - 32, 480, 200, 100);
            var ctx = document.getElementById("danger").getContext("2d");
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(255, 50, 50, 1)";
            core.fillText("danger", "danger", 4, 32, "#ffffff", "40px normal");
            if (boss) core.fillText("danger", boss, 60, 80, "#ffffff", "30px normal")
            ctx.shadowOffsetX = 10;
            ctx.shadowOffsetY = 5;
            ctx.shadowColor = "rgba(255, 50, 50, 1)";
            core.fillText("danger", "danger", 4, 32, "#ffffff", "40px normal");
            if (boss) core.fillText("danger", boss, 60, 80, "#ffffff", "30px normal")
            ctx.shadowColor = "rgba(0, 0, 0, 1)";
            core.fillText("danger", "danger", 4, 32, "#ffffff", "40px normal");
            if (boss) core.fillText("danger", boss, 60, 80, "#ffffff", "30px normal")
            core.playSound("danger.mp3");
            core.updateWarning(x, y);
        };
        // 更新每一帧
        this.updateWarning = function (x, y) {
            var frame = 0,
                nx = 7 * 32 + 240,
                ny = 32 * 7 - 32,
                dx = 0,
                dy = 0,
                scale = 1;
            var interval = window.setInterval(function () {
                // 速度 双曲余弦
                var speed = core.hyperbolicCosine(frame / 20 - 3.25);
                nx -= speed;
                frame++;
                // danger定位
                core.relocateCanvas("danger", nx, ny);
                // 画布缩放
                for (var one in core.dom.gameCanvas) {
                    var ctx = core.dom.gameCanvas[one].style;
                    if (!ctx) continue;
                    if (one >= 6 && one <= 9) continue;
                    scale += frame > 75 ? (-core.hyperbolicCosine(frame / 1000 - 0.075) + 1) * 1.5 :
                        (core.hyperbolicCosine(frame / 1000 - 0.075) - 1) * 1.5;
                    ctx.transform = "scale(" + scale + ")";
                    dx += frame > 75 ? (-core.hyperbolicCosine(frame / 1000 - 0.075) + 1) * 48 * (7 - x) :
                        (core.hyperbolicCosine(frame / 1000 - 0.075) - 1) * 48 * (7 - x);
                    dy += frame > 75 ? (-core.hyperbolicCosine(frame / 1000 - 0.075) + 1) * 48 * (7 - y) :
                        (core.hyperbolicCosine(frame / 1000 - 0.075) - 1) * 48 * (7 - y);
                    ctx.transform += "translate(" + dx + "px, " + dy + "px)";
                }
                if (frame == 150) {
                    clearInterval(interval);
                    core.deleteCanvas("danger");
                }
            }, 20);
        };
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
                ['snow', 'rain', 'sun', 'cloud', 'fog'].forEach(function (one) {
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
                core.plugin.popupDamage(damage, x, y, false);
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
        // 弹出函数
        this.popupDamage = function (damage, x, y, isPixel) {
            if (core.isReplaying()) return;
            isPixel = isPixel || false;
            var frame = 0,
                cx = 32 * x + 12,
                cy = 32 * y + 20,
                speed = 7,
                alpha = 1;
            if (isPixel) {
                cx = x;
                cy = y;
            }
            cx -= core.bigmap.offsetX;
            cy -= core.bigmap.offsetY;
            damage = core.formatBigNumber(damage);
            // 反复执行函数
            core.createCanvas("popupDamage_" + x + "_" + y, 0, 0, 480, 480, 130);
            var interval = setInterval(function () {
                core.clearMap("popupDamage_" + x + "_" + y);
                if (frame == 50) {
                    clearInterval(interval);
                    core.deleteCanvas("popupDamage_" + x + "_" + y);
                    return;
                }
                frame++;
                speed -= 0.5;
                cx += 2;
                cy -= speed;
                if (frame >= 25) alpha -= 0.05;
                core.fillBoldText("popupDamage_" + x + "_" + y, "-" + damage, cx, cy, [255, 0, 0, alpha], [0, 0, 0, alpha], "24px " + core.status.globalAttribute.font);
            }, 20);
        }
    },
    "socket": function () {
        // webSocket
        this.connect = function () {
            var socket = new WebSocket("ws://localhost:3000");

            socket.addEventListener("open", function () {
                console.log("成功连接服务器");
                socket.send("啦啦啦");
            });
            socket.addEventListener("message", function (data) {
                console.log(data.data);
            });
        };
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
        control.prototype._drawHero_updateViewport = function () {
            if (!flags.chase) {
                core.control.updateViewport();
                core.setGameCanvasTranslate('hero', 0, 0);
            }
        };
        control.prototype._drawHero_getDrawObjs = function (direction, x, y, status, offset) {
            var heroIconArr = core.material.icons.hero,
                drawObjs = [],
                index = 0;
            flags.offset = offset;
            if (!flags.chase)
                drawObjs.push({
                    "img": core.material.images.hero,
                    "width": core.material.icons.hero.width || 32,
                    "height": core.material.icons.hero.height,
                    "heroIcon": heroIconArr[direction],
                    "posx": x * 32 - core.bigmap.offsetX + core.utils.scan2[direction].x * offset,
                    "posy": y * 32 - core.bigmap.offsetY + core.utils.scan2[direction].y * offset,
                    "status": status,
                    "index": index++,
                });
            else
                drawObjs.push({
                    "img": core.material.images.hero,
                    "width": core.material.icons.hero.width || 32,
                    "height": core.material.icons.hero.height,
                    "heroIcon": heroIconArr[direction],
                    "posx": 7 * 32 + core.utils.scan2[direction].x * offset,
                    "posy": y * 32 - core.bigmap.offsetY + core.utils.scan2[direction].y * offset,
                    "status": status,
                    "index": index++,
                });
            core.status.hero.followers.forEach(function (t) {
                drawObjs.push({
                    "img": core.material.images.images[t.name],
                    "width": core.material.images.images[t.name].width / 4,
                    "height": core.material.images.images[t.name].height / 4,
                    "heroIcon": heroIconArr[t.direction],
                    "posx": 32 * t.x - core.bigmap.offsetX + (t.stop ? 0 : core.utils.scan2[t.direction].x * Math.abs(offset)),
                    "posy": 32 * t.y - core.bigmap.offsetY + (t.stop ? 0 : core.utils.scan2[t.direction].y * Math.abs(offset)),
                    "status": t.stop ? "stop" : status,
                    "index": index++
                });
            });
            return drawObjs.sort(function (a, b) {
                return a.posy == b.posy ? b.index - a.index : a.posy - b.posy;
            });
        };
        ////// 设置视野范围 //////
        control.prototype.setViewport = function (px, py) {
            core.bigmap.offsetX = core.clamp(px, 0, 32 * core.bigmap.width - core.__PIXELS__);
            core.bigmap.offsetY = core.clamp(py, 0, 32 * core.bigmap.height - core.__PIXELS__);
            if (flags.shaking)
                core.bigmap.offsetX += flags.shaking;
            this.updateViewport();
            // ------ hero层也需要！
            if (!flags.chase) {
                var hero_x = core.clamp((core.getHeroLoc('x') - core.__HALF_SIZE__) * 32, 0, 32 * core.bigmap.width - core.__PIXELS__);
                var hero_y = core.clamp((core.getHeroLoc('y') - core.__HALF_SIZE__) * 32, 0, 32 * core.bigmap.height - core.__PIXELS__);
            } else {
                var hero_x = (core.getHeroLoc('x') - core.__HALF_SIZE__) * 32;
                var hero_y = core.clamp((core.getHeroLoc('y') - core.__HALF_SIZE__) * 32, 0, 32 * core.bigmap.height - core.__PIXELS__);
            }
            core.control.setGameCanvasTranslate('hero', hero_x - core.bigmap.offsetX, hero_y - core.bigmap.offsetY);
        };
        // 绘制勇士
        control.prototype.drawHero = function (status, offset, frame) {
            if (!core.isPlaying() || !core.status.floorId || core.status.gameOver) return;
            var x = core.getHeroLoc('x'),
                y = core.getHeroLoc('y'),
                direction = core.getHeroLoc('direction');
            status = status || 'stop';
            offset = offset || 0;
            var way = core.utils.scan2[direction];
            var dx = way.x,
                dy = way.y,
                offsetX = dx * offset,
                offsetY = dy * offset;
            if (!flags.chase) {
                core.bigmap.offsetX = core.clamp((x - core.__HALF_SIZE__) * 32 + offsetX, 0, 32 * core.bigmap.width - core.__PIXELS__);
                core.bigmap.offsetY = core.clamp((y - core.__HALF_SIZE__) * 32 + offsetY, 0, 32 * core.bigmap.height - core.__PIXELS__);
            }
            core.clearAutomaticRouteNode(x + dx, y + dy);
            core.clearMap('hero');
            core.status.heroCenter.px = 32 * x + offsetX + 16;
            core.status.heroCenter.py = 32 * y + offsetY + 32 - core.material.icons.hero.height / 2;

            if (!core.hasFlag('hideHero')) {
                this._drawHero_draw(direction, x, y, status, offset, frame);
            }
            this._drawHero_updateViewport();
        };
        ////// 画面震动 //////
        var originVibrate = core.events.vibrate;
        events.prototype.vibrate = function (direction, time, speed, power, callback) {
            if (!flags.chase) return originVibrate.call(core.events, direction, time, speed, power, callback);
            if (core.isReplaying()) {
                if (callback) callback();
                return;
            }
            if (!time) time = 1000;
            speed = speed || 10;
            power = power || 10;
            var ntime = 0;
            var shakeInfo = { duration: parseInt(time / 10), speed: speed, power: power, direction: 1, shake: 0 };
            var animate = setInterval(function () {
                shakeInfo.shake = shakeInfo.power;
                var shaking = shakeInfo.shake * (Math.random() - 0.5) * 2;
                if (!flags.shaking) flags.shaking = 0;
                if (!flags.totalShake) flags.totalShake = 0;
                flags.shaking = shaking;
                switch (direction) {
                    case 'vertical':
                        core.addGameCanvasTranslate(0, shakeInfo.shake);
                        break;
                    case 'diagonal1':
                        core.addGameCanvasTranslate(shakeInfo.shake, shakeInfo.shake);
                        break;
                    case 'diagonal2':
                        core.addGameCanvasTranslate(-shakeInfo.shake, shakeInfo.shake);
                        break;
                    default:
                        core.addGameCanvasTranslate(shakeInfo.shake, 0);
                }
                if (ntime > time) {
                    delete core.animateFrame.asyncId[animate];
                    clearInterval(animate);
                    if (callback) callback();
                    flags.shaking = 0;
                    flags.firstZ = true;
                }
                ntime += 50 / 3;
            }, 10);
            core.animateFrame.asyncId[animate] = true;
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