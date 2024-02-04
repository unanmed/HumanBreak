var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    init: function () {
        // 对于一部分的常用插件，样板已经内置，同时配有开关，可以在设置里面开关
        // 以及那些只提供api的插件也是已经内置
        // 这里内置的插件只有不容易开关的插件
        this._afterLoadResources = function () {};
    },
    fiveLayer: function () {
        // 注册插件
        Mota.Plugin.register('fiveLayer_g', { init }, init);
        // 创建新图层
        function createCanvas(name, zIndex) {
            if (!name) return;
            var canvas = document.createElement('canvas');
            canvas.id = name;
            canvas.className = 'gameCanvas no-anti-aliasing';
            // 编辑器模式下设置zIndex会导致加入的图层覆盖优先级过高
            if (main.mode != 'editor') canvas.style.zIndex = zIndex || 0;
            // 将图层插入进游戏内容
            document.getElementById('gameDraw').appendChild(canvas);
            var ctx = canvas.getContext('2d');
            core.canvas[name] = ctx;

            return canvas;
        }

        function init() {
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

            maps.prototype._loadFloor_doNotCopy = function () {
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
                    'cannotMove',
                    'enemy'
                ];
            };
            ////// 绘制背景和前景层 //////
            maps.prototype._drawBg_draw = function (
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
            maps.prototype._drawFg_draw = function (
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
            maps.prototype._generateMovableArray_arrays = function (floorId) {
                return {
                    bgArray: this.getBgMapArray(floorId),
                    fgArray: this.getFgMapArray(floorId),
                    eventArray: this.getMapArray(floorId),
                    bg2Array: this._getBgFgMapArray('bg2', floorId),
                    fg2Array: this._getBgFgMapArray('fg2', floorId)
                };
            };
        }
    }
};
