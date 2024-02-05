///<reference path="../../src/types/core.d.ts"/>
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
    special: function () {
        // 这个插件负责定义怪物属性
        const specials = Mota.require('var', 'enemySpecials');
        /**
         * @param {string | ((enemy: Enemy) => string)} func
         * @param {Enemy} enemy
         */
        const fromFunc = (func, enemy) => {
            return typeof func === 'string' ? func : func(enemy);
        };
        // 怪物特殊属性包含四个信息
        // code: 索引，必须与该属性在数组内的索引一致，实际判断的时候也是根据索引判断，不会根据code判断
        // name: 特殊属性名称，可以是一个函数，接受 enemy 作为参数，返回字符串
        // desc: 特殊属性说明，也可以是一个函数，接受 enemy 作为参数，返回字符串
        // color: 特殊属性颜色，会在怪物手册中显示出来
        specials.push(
            {
                code: 0,
                name: '空',
                desc: '空',
                color: '#fff'
            },
            {
                code: 1,
                name: '先攻',
                desc: `怪物首先攻击`,
                color: '#fc3'
            },
            {
                code: 2,
                name: '魔攻',
                desc: '怪物攻击无视勇士的防御',
                color: '#bbb0ff'
            },
            {
                code: 3,
                name: '坚固',
                desc: '怪物防御不小于勇士攻击-1',
                color: '#c0b088'
            },
            {
                code: 4,
                name: '2连击',
                desc: '怪物每回合攻击2次',
                color: '#fe7'
            },
            {
                code: 5,
                name: '3连击',
                desc: '怪物每回合攻击3次',
                color: '#fe7'
            },
            {
                code: 6,
                name: enemy => `${enemy.n ?? 4}连击`,
                desc: enemy => `怪物每回合攻击${enemy.n}次`,
                color: '#fe7'
            },
            {
                code: 7,
                name: '破甲',
                desc: enemy =>
                    `战斗前，怪物附加角色防御的${Math.floor(
                        100 * (enemy.breakArmor || core.values.breakArmor)
                    )}%作为伤害"`,
                color: '#b67'
            },
            {
                code: 8,
                name: '反击',
                desc: enemy =>
                    `战斗时，怪物每回合附加角色攻击的${Math.floor(
                        100 * (enemy.counterAttack || core.values.counterAttack)
                    )}%作为伤害，无视角色防御`,
                color: '#fa4'
            },
            {
                code: 9,
                name: '净化',
                desc: enemy =>
                    `战斗前，怪物附加角色护盾的${
                        enemy.purify || core.values.purify
                    }倍作为伤害`,
                color: '#80eed6'
            },
            {
                code: 10,
                name: '模仿',
                desc: `怪物的攻防和角色攻防相等`,
                color: '#b0c0dd'
            },
            {
                code: 11,
                name: '吸血',
                desc: enemy => {
                    const vampire = enemy.vampire || 0;
                    const hp = Mota.require('fn', 'getHeroStatusOn')('hp');
                    return (
                        `战斗前，怪物首先吸取角色的${Math.floor(
                            100 * vampire
                        )}%生命（约${Math.floor(hp * vampire)}点）作为伤害` +
                        (enemy.add ? '，并把伤害数值加到自身生命上' : '')
                    );
                },
                color: '#ff00d2'
            },
            {
                code: 12,
                name: '中毒',
                desc: `战斗后，角色陷入中毒状态，每一步损失生命${core.data.values.poisonDamage}点`,
                color: '#9e8'
            },
            {
                code: 13,
                name: '衰弱',
                desc:
                    `战斗后，角色陷入衰弱状态，攻防暂时下降` +
                    (core.data.values.weakValue >= 1
                        ? core.data.values.weakValue + '点'
                        : parseInt(core.data.values.weakValue * 100) + '%'),
                color: '#bbb0ff'
            },
            {
                code: 14,
                name: '诅咒',
                desc: '战斗后，角色陷入诅咒状态，战斗无法获得金币和经验',
                color: '#bbeef0'
            },
            {
                code: 15,
                name: '领域',
                desc: enemy =>
                    '经过怪物周围' +
                    (enemy.zoneSquare ? '九宫格' : '十字') +
                    '范围内' +
                    (enemy.range || 1) +
                    '格时自动减生命' +
                    (enemy.zone || 0) +
                    '点',
                color: '#c677dd'
            },
            {
                code: 16,
                name: '夹击',
                desc: '经过两只相同的怪物中间，角色生命值变成一半',
                color: '#fff'
            },
            {
                code: 17,
                name: '仇恨',
                desc: `战斗前，怪物附加之前积累的仇恨值作为伤害；战斗后，释放一半的仇恨值。（每杀死一个怪物获得${
                    core.data.values.hatred || 0
                }点仇恨值）`,
                color: '#b0b666'
            },
            {
                code: 18,
                name: '阻击',
                desc: enemy =>
                    '经过怪物周围' +
                    (enemy.zoneSquare ? '九宫格' : '十字') +
                    '时自动减生命' +
                    (enemy.repulse || 0) +
                    '点，同时怪物后退一格',
                color: '#8888e6'
            },
            {
                code: 19,
                name: '自爆',
                desc: '战斗后角色的生命值变成1',
                color: '#f66'
            },
            {
                code: 20,
                name: '无敌',
                desc: `角色无法打败怪物，除非拥有十字架`,
                color: '#aaa'
            },
            {
                code: 21,
                name: '退化',
                desc: enemy =>
                    '战斗后角色永久下降' +
                    enemy.atkValue +
                    '点攻击和' +
                    enemy.defValue +
                    '点防御',
                color: 'cyan'
            },
            {
                code: 22,
                name: '固伤',
                desc: enemy =>
                    '战斗前，怪物对角色造成' +
                    enemy.damage +
                    '点固定伤害，未开启负伤时无视角色护盾。',
                color: '#d8a'
            },
            {
                code: 23,
                name: '重生',
                desc: '怪物被击败后，角色转换楼层则怪物将再次出现',
                color: '#ffd'
            },
            {
                code: 24,
                name: '激光',
                desc: enemy =>
                    '经过怪物同行或同列时自动减生命' + enemy.laser + '点',
                color: '#dda0dd'
            },
            {
                code: 25,
                name: '光环',
                desc: enemy =>
                    (enemy.range != null
                        ? (enemy.haloSquare ? '该怪物九宫格' : '该怪物十字') +
                          enemy.haloRange +
                          '格范围内'
                        : '同楼层所有') +
                    '怪物生命提升' +
                    (enemy.hpBuff || 0) +
                    '%，攻击提升' +
                    (enemy.atkBuff || 0) +
                    '%，防御提升' +
                    (enemy.defBuff || 0) +
                    '%，' +
                    (enemy.haloAdd ? '可叠加' : '不可叠加'),
                color: '#e6e099'
            },
            {
                code: 26,
                name: '支援',
                desc: '当周围一圈的怪物受到攻击时将上前支援，并组成小队战斗。',
                color: '#77c0b6'
            },
            {
                code: 27,
                name: '捕捉',
                desc: enemy =>
                    '当走到怪物周围' +
                    (enemy.zoneSquare ? '九宫格' : '十字') +
                    '时会强制进行战斗。',
                color: '#c0ddbb'
            },
            {
                code: 28,
                name: '特殊光环',
                desc: enemy => {
                    let content = '';
                    enemy.specialHalo?.forEach((v, i) => {
                        content +=
                            '&nbsp;'.repeat(8) +
                            `${i + 1}. <span style="color: ${
                                specials[v].color
                            }">${fromFunc(
                                specials[v].name,
                                enemy
                            )}</span>: ${fromFunc(
                                specials[v].desc,
                                enemy
                            )}<br />`;
                    });
                    return (
                        `怪物周围${enemy.haloSquare ? '九宫格' : '十字'}${
                            enemy.haloRange
                        }格范围内所有怪物获得以下特殊属性，` +
                        `特殊属性数值间为${
                            enemy.specialMultiply ? '相乘' : '相加'
                        }关系:<br />` +
                        content
                    );
                },
                color: '#ff0'
            }
        );
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

        // --------------- 秒杀伤害计算
        // 用于计算一些特殊属性怪物在一回合内秒杀所需的攻击，依此计算临界的上界
        // 函数没有参数，返回一个数字，表示临界上界，Infinity表示没有上界，不计算临界
        // 不能返回数字型外的量
        Mota.rewrite(
            Mota.require('class', 'DamageEnemy').prototype,
            'getSeckillAtk',
            'full',
            function () {
                // 获取怪物的属性
                const info = this.getRealInfo();
                // 对于一般的怪物，应该是怪物防御加上怪物血量
                const add = info.def + info.hp;

                // 坚固，不可能通过攻击秒杀
                if (info.special.includes(3)) {
                    return Infinity;
                }

                return add;
            }
        );

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
        // 光环分为两类，一类是会增强光环或者给怪物加光环的光环，另一类就是普通光环，这两种光环处理方式不同
        // 对于前者，光环将会优先递归计算，同时每个光环将会确保只计算一次，直到没有光环需要计算
        // 对于后者，不进行递归计算，只进行单次遍历计算。
        // 光环使用 provideHalo 和 injectHalo 作为api，表示提供光环和接受光环

        // 光环属性列表，是一个集合Set，你可以在这里配置会被视为光环的属性
        const haloSpecials = Mota.require('module', 'Damage').haloSpecials;
        haloSpecials.add(8).add(11);

        // ----- 计算第二类光环，即普通光环，这类光环更常见，因此放到前面了
        Mota.rewrite(
            Mota.require('class', 'DamageEnemy').prototype,
            'provideHalo',
            'full',
            function () {
                // 这部分用于判断当前是否应该计算光环，即计算光环的函数是否在不应该被调用的时刻调用了
                // 一般不需要改动
                if (this.progress !== 2) return;
                this.progress = 3;
                if (!this.floorId) return;
                const { has } = Mota.Plugin.require('utils_g');
                if (!has(this.x) || !has(this.y)) return;
                const col = this.col ?? core.status.maps[this.floorId].enemy;
                if (!col) return;
                // 获取所有还没有计算的光环，注意这里不能直接获取haloSpecial
                const special = this.getHaloSpecials();

                const square7 = [];
                const square5 = [];

                // e 是被加成怪的属性，enemy 是施加光环的怪

                for (const halo of special) {
                    switch (halo) {
                        case 8:
                            square5.push((e, enemy) => {
                                if (
                                    e.special.includes(8) &&
                                    (e.x !== this.x || this.y !== e.y)
                                ) {
                                    e.atkBuff += enemy.together ?? 0;
                                    e.defBuff += enemy.together ?? 0;
                                }
                            });
                            this.providedHalo.add(8);
                            break;
                        case 21:
                            square7.push(e => {
                                // e.damageDecline += this.enemy.iceHalo ?? 0;
                            });
                            col.haloList.push({
                                type: 'square',
                                data: { x: this.x, y: this.y, d: 7 },
                                special: 21,
                                from: this
                            });
                            this.providedHalo.add(21);
                            break;
                        case 26:
                            square5.push(e => {
                                e.defBuff += this.enemy.iceCore ?? 0;
                            });
                            col.haloList.push({
                                type: 'square',
                                data: { x: this.x, y: this.y, d: 5 },
                                special: 26,
                                from: this
                            });
                            this.providedHalo.add(26);
                            break;
                        case 27:
                            square5.push(e => {
                                e.atkBuff += this.enemy.fireCore ?? 0;
                            });
                            col.haloList.push({
                                type: 'square',
                                data: { x: this.x, y: this.y, d: 5 },
                                special: 27,
                                from: this
                            });
                            this.providedHalo.add(27);
                            break;
                    }
                }

                col.applyHalo(
                    'square',
                    { x: this.x, y: this.y, d: 7 },
                    square7
                );
                col.applyHalo(
                    'square',
                    { x: this.x, y: this.y, d: 5 },
                    square5
                );
            }
        );

        // ----- 计算第一类光环
        Mota.rewrite(
            Mota.require('class', 'DamageEnemy').prototype,
            'preProvideHalo',
            'full',
            function () {
                if (this.progress !== 0) return;
                this.progress = 1;
                const special = this.getHaloSpecials();

                for (const halo of special) {
                    switch (halo) {
                        default:
                            break;
                    }
                }
            }
        );

        // ----- 接受光环处理
        Mota.rewrite(
            Mota.require('class', 'DamageEnemy').prototype,
            'injectHalo',
            'full',
            function (halo, enemy) {
                // 这里的 halo 是光环函数，enemy 是施加光环的怪物，this.info 是当前怪物信息
                halo(this.info, enemy);
            }
        );
    }
};
