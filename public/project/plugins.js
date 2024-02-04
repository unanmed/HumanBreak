var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
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
    },
    uiRewrite: function () {
        Mota.Plugin.register('ui_g', { init }, init);

        function init() {
            const { mainUi, fixedUi } = Mota.requireAll('var');

            ui.prototype.drawBook = function () {
                if (!core.isReplaying()) return mainUi.open('book');
            };

            ui.prototype._drawToolbox = function () {
                if (!core.isReplaying()) return mainUi.open('toolbox');
            };

            ui.prototype._drawEquipbox = function () {
                if (!core.isReplaying()) return mainUi.open('equipbox');
            };

            ui.prototype.drawFly = function () {
                if (!core.isReplaying()) return mainUi.open('fly');
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
                Mota.require('var', 'hook').emit('statusBarUpdate');
            };

            // todo: 多个状态栏分离与控制
            control.prototype.showStatusBar = function () {
                if (main.mode == 'editor') return;
                core.removeFlag('hideStatusBar');
                if (!fixedUi.hasName('statusBar')) {
                    fixedUi.open('statusBar');
                }
                core.dom.tools.hard.style.display = 'block';
                core.dom.toolBar.style.display = 'block';
            };

            control.prototype.hideStatusBar = function (showToolbox) {
                if (main.mode == 'editor') return;

                // 如果原本就是隐藏的，则先显示
                if (!core.domStyle.showStatusBar) this.showStatusBar();
                if (core.isReplaying()) showToolbox = true;
                fixedUi.closeByName('statusBar');

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
        }

        function updateVueStatusBar() {
            Mota.r(() => {
                const status = Mota.require('var', 'status');
                status.value = !status.value;
            });
        }
    },
    battle: function () {
        // 这个插件负责战斗相关内容

        // --------------- 战斗伤害

        const Damage = Mota.require('module', 'Damage');
        // 这个数组常量控制着在战斗时哪些属性计算真实属性，也就是经过buff加成的属性
        // 如果有属性不会经过buff加成等，请将其去除，可以提高性能表现
        Damage.realStatus = ['atk', 'def', 'mdef', 'hpmax'];

        // 复写系统的伤害计算函数即可，全量复写
        // 函数接受两个参数，分别是怪物信息和勇士信息，返回一个数字作为伤害
        // 返回null表示不能战斗，返回Infinity也可以
        Mota.rewrite(Damage, 'calDamageWith', 'full', (info, hero) => {
            // 获取勇士属性，这几个属性直接从core.status.hero获取
            const { hp, mana } = core.status.hero;
            // 获取勇士属性，这几个属性从勇士真实属性获取
            // 分开获取是因为获取勇士真实属性会对性能造成一定影响
            let { atk, def, mdef, hpmax } = hero;
            // 获取怪物信息，是在某点的信息
            let { hp: monHp, atk: monAtk, def: monDef, special, enemy } = info;

            /** 总伤害 */
            let damage = 0;
            /** 勇士单回合伤害 */
            let heroPerDamage;

            if (special.includes(3)) {
                // 由于坚固的特性，只能放到这来计算了
                if (atk > enemy.def) heroPerDamage = 1;
                else return null;
            } else {
                heroPerDamage = atk - monDef;
                if (heroPerDamage <= 0) return null;
            }

            /** 怪物单回合伤害 */
            let enemyPerDamage;

            // 魔攻
            if (special.includes(2) || special.includes(13)) {
                enemyPerDamage = monAtk;
            } else {
                enemyPerDamage = monAtk - def;
                if (enemyPerDamage < 0) enemyPerDamage = 0;
            }

            // 先攻
            if (special.includes(17)) {
                damage += enemyPerDamage;
            }

            // 连击
            if (special.includes(4)) enemyPerDamage *= 2;
            if (special.includes(5)) enemyPerDamage *= 3;
            if (special.includes(6)) enemyPerDamage *= enemy.n;

            /** 战斗回合 */
            let turn = Math.ceil(monHp / heroPerDamage);

            damage += (turn - 1) * enemyPerDamage;
            damage -= mdef;
            if (!core.flags.enableNegativeDamage) damage = Math.max(0, damage);

            return damage;
        });

        // --------------- 地图伤害
        // 全量复写地图伤害的计算函数，注意此处不能使用箭头函数，因为这是在原型上的函数，其this指向实例，也即怪物(DamageEnemy实例)
        // 函数接收两个参数，damage和hero，前者表示要将结果存入的对象，后者是勇士真实属性
        // 直接将damage返回即可，返回其他值有可能会引起出错
        // 计算出伤害后直接调用this.setMapDamage即可将伤害传到对象中
        Mota.rewrite(
            Mota.require('class', 'DamageEnemy').prototype,
            'calMapDamage',
            'full',
            function (damage = {}, hero = getHeroStatusOn(Damage.realStatus)) {
                // 功能函数，计算曼哈顿距离，和判断一个值是否存在
                const { manhattan, has } = Mota.Plugin.require('utils_g');
                // 判断这个怪物是不是在地图上
                if (!has(this.x) || !has(this.y) || !has(this.floorId))
                    return damage;
                const enemy = this.enemy;
                const floor = core.status.maps[this.floorId];
                const w = floor.width;
                const h = floor.height;

                // 突刺
                if (this.info.special.includes(15)) {
                    const range = enemy.range ?? 1;
                    const startX = Math.max(0, this.x - range);
                    const startY = Math.max(0, this.y - range);
                    const endX = Math.min(floor.width - 1, this.x + range);
                    const endY = Math.min(floor.height - 1, this.y + range);
                    const dam = Math.max((enemy.value ?? 0) - hero.def, 0);

                    for (let x = startX; x <= endX; x++) {
                        for (let y = startY; y <= endY; y++) {
                            if (
                                !enemy.zoneSquare &&
                                manhattan(x, y, this.x, this.y) > range
                            ) {
                                continue;
                            }
                            const loc = `${x},${y}`;
                            this.setMapDamage(damage, loc, dam, '突刺');
                        }
                    }
                }

                // 射击
                if (this.info.special.includes(24)) {
                    const dirs = ['left', 'down', 'up', 'right'];
                    const dam = Math.max((enemy.atk ?? 0) - hero.def, 0);
                    const objs = core.getMapBlocksObj(this.floorId);

                    for (const dir of dirs) {
                        let x = this.x;
                        let y = this.y;
                        const { x: dx, y: dy } = core.utils.scan[dir];
                        while (x >= 0 && y >= 0 && x < w && y < h) {
                            x += dx;
                            y += dy;
                            const loc = `${x},${y}`;
                            const block = objs[loc];
                            if (
                                block &&
                                block.event.noPass &&
                                block.event.cls !== 'enemys' &&
                                block.event.cls !== 'enemy48' &&
                                block.id !== 141 &&
                                block.id !== 151
                            ) {
                                break;
                            }
                            this.setMapDamage(damage, loc, dam, '射击');
                        }
                    }
                }

                return damage;
            }
        );

        // --------------- 光环处理
    }
};
