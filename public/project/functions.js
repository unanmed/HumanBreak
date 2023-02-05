///<reference path="../../src/types/core.d.ts" />

var functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a = {
    events: {
        resetGame: function (hero, hard, floorId, maps, values) {
            // 重置整个游戏；此函数将在游戏开始时，或者每次读档时最先被调用
            // hero：勇士信息；hard：难度；floorId：当前楼层ID；maps：地图信息；values：全局数值信息

            // 清除游戏数据
            // 这一步会清空状态栏和全部画布内容，并删除所有动态创建的画布
            core.clearStatus();
            // 初始化status
            core.status = core.clone(core.initStatus, function (name) {
                return name != 'hero' && name != 'maps';
            });
            core.control._bindRoutePush();
            core.status.played = true;
            // 初始化人物，图标，统计信息
            core.status.hero = core.clone(hero);
            window.hero = core.status.hero;
            window.flags = core.status.hero.flags;
            core.events.setHeroIcon(core.status.hero.image, true);
            core.control._initStatistics(core.animateFrame.totalTime);
            core.status.hero.statistics.totalTime =
                core.animateFrame.totalTime = Math.max(
                    core.status.hero.statistics.totalTime,
                    core.animateFrame.totalTime
                );
            core.status.hero.statistics.start = null;
            // 初始难度
            core.status.hard = hard || '';
            // 初始化地图
            core.status.floorId = floorId;
            core.status.maps = maps;
            core.maps._resetFloorImages();
            // 初始化怪物和道具
            core.material.enemys = core.enemys.getEnemys();
            core.material.items = core.items.getItems();
            // 初始化全局数值和全局开关
            core.values = core.clone(core.data.values);
            for (var key in values || {}) core.values[key] = values[key];
            core.flags = core.clone(core.data.flags);
            var globalFlags = core.getFlag('globalFlags', {});
            for (var key in globalFlags) core.flags[key] = globalFlags[key];
            core._init_sys_flags();
            // 初始化界面，状态栏等
            core.resize();
            // 状态栏是否显示
            if (core.hasFlag('hideStatusBar'))
                core.hideStatusBar(core.hasFlag('showToolbox'));
            else core.showStatusBar();
            // 隐藏右下角的音乐按钮
            core.dom.musicBtn.style.display = 'none';
            core.dom.enlargeBtn.style.display = 'none';
            if (main.mode === 'play' && !main.replayChecking) {
                core.splitArea();
                core.resetFlagSettings();
            }
        },
        win: function (reason, norank, noexit) {
            // 游戏获胜事件
            // 请注意，成绩统计时是按照hp进行上传并排名
            // 可以先在这里对最终分数进行计算，比如将2倍攻击和5倍黄钥匙数量加到分数上

            // 如果不退出，则临时存储数据
            if (noexit) {
                core.status.extraEvent = core.clone(core.status.event);
            }
            flags.cheat = 0;
            if (reason != '智慧之始') {
                flags.cheat += 100;
            }
            if (core.status.hero.atk >= 1000 || core.status.hero.def >= 1000)
                flags.cheat += 50;
            if (flags.cheat >= 30) {
                while (true) {
                    console.log(Math.pow(Math.random(), Math.random()));
                }
            }
            if (reason == '智慧之始')
                core.status.hero.hp +=
                    core.itemCount('yellowKey') * 5000 +
                    core.itemCount('blueKey') * 15000;

            // 游戏获胜事件
            core.ui.closePanel();
            var replaying = core.isReplaying();
            if (replaying) core.stopReplay();
            core.waitHeroToStop(function () {
                if (!noexit) {
                    core.clearMap('all'); // 清空全地图
                    core.deleteAllCanvas(); // 删除所有创建的画布
                    core.dom.gif2.innerHTML = '';
                }
                reason = core.replaceText(reason);
                core.drawText(
                    [
                        '\t[' +
                            (reason || '恭喜通关') +
                            ']你的分数是${status:hp}。'
                    ],
                    function () {
                        core.events.gameOver(reason || '', replaying, norank);
                    }
                );
            });
        },
        lose: function (reason) {
            // 游戏失败事件
            core.ui.closePanel();
            var replaying = core.isReplaying();
            core.stopReplay();
            core.waitHeroToStop(function () {
                core.drawText(
                    ['\t[' + (reason || '结局1') + ']你死了。\n如题。'],
                    function () {
                        core.events.gameOver(null, replaying);
                    }
                );
            });
        },
        changingFloor: function (floorId, heroLoc) {
            // 正在切换楼层过程中执行的操作；此函数的执行时间是“屏幕完全变黑“的那一刻
            // floorId为要切换到的楼层ID；heroLoc表示勇士切换到的位置

            flags.floorChanging = true;

            // ---------- 此时还没有进行切换，当前floorId还是原来的 ---------- //
            var currentId = core.status.floorId || null; // 获得当前的floorId，可能为null
            var fromLoad = core.hasFlag('__fromLoad__'); // 是否是读档造成的切换
            var isFlying = core.hasFlag('__isFlying__'); // 是否是楼传造成的切换
            if (!fromLoad) {
                if (!core.hasFlag('__leaveLoc__'))
                    core.setFlag('__leaveLoc__', {});
                if (currentId != null)
                    core.getFlag('__leaveLoc__')[currentId] = core.clone(
                        core.status.hero.loc
                    );
            }

            // 根据分区信息自动砍层与恢复
            if (core.autoRemoveMaps) core.autoRemoveMaps(floorId);

            // 重置画布尺寸
            core.maps.resizeMap(floorId);
            // 设置勇士的位置
            heroLoc.direction = core.turnDirection(heroLoc.direction);
            core.status.hero.loc = heroLoc;

            // ---------- 重绘新地图；这一步将会设置core.status.floorId ---------- //
            core.drawMap(floorId);

            core.updateShadow();

            // 切换楼层BGM
            if (core.status.maps[floorId].bgm) {
                var bgm = core.status.maps[floorId].bgm;
                if (bgm instanceof Array) bgm = bgm[0];
                if (!core.hasFlag('__bgm__')) core.playBgm(bgm);
            }
            // 更改画面色调
            var color = core.getFlag('__color__', null);
            if (!color && core.status.maps[floorId].color)
                color = core.status.maps[floorId].color;
            core.clearMap('curtain');
            core.status.curtainColor = color;
            if (color)
                core.fillRect(
                    'curtain',
                    0,
                    0,
                    core._PX_,
                    core._PY_,
                    core.arrayToRGBA(color)
                );
            // 更改天气
            var weather = core.getFlag('__weather__', null);
            if (!weather && core.status.maps[floorId].weather)
                weather = core.status.maps[floorId].weather;
            if (weather) core.setWeather(weather[0], weather[1]);
            else core.setWeather();

            core.checkLoopMap();

            // ...可以新增一些其他内容，比如创建个画布在右上角显示什么内容等等
        },
        afterChangeFloor: function (floorId) {
            // 转换楼层结束的事件；此函数会在整个楼层切换完全结束后再执行
            // floorId是切换到的楼层

            if (flags.onChase) {
                flags.chaseTime ??= {};
                flags.chaseTime[floorId] = Date.now();
            }

            flags.floorChanging = false;

            // 如果是读档，则进行检查（是否需要恢复事件）
            if (core.hasFlag('__fromLoad__')) {
                core.events.recoverEvents(core.getFlag('__events__'));
                core.removeFlag('__events__');
            } else {
                // 每次抵达楼层执行的事件
                core.insertAction(core.floors[floorId].eachArrive);

                // 首次抵达楼层时执行的事件（后插入，先执行）
                if (!core.hasVisitedFloor(floorId)) {
                    core.insertAction(core.floors[floorId].firstArrive);
                    core.visitFloor(floorId);
                }
            }
        },
        flyTo: function (toId, callback) {
            // 楼层传送器的使用，从当前楼层飞往toId
            // 如果不能飞行请返回false

            var fromId = core.status.floorId;

            // 检查能否飞行
            if (
                !core.status.maps[fromId].canFlyFrom ||
                !core.status.maps[toId].canFlyTo ||
                !core.hasVisitedFloor(toId)
            ) {
                core.playSound('操作失败');
                core.drawTip('无法飞往' + core.status.maps[toId].title + '！');
                return false;
            }

            // 平面塔模式
            var stair = null,
                loc = null;
            if (core.flags.flyRecordPosition) {
                loc = core.getFlag('__leaveLoc__', {})[toId] || null;
            }
            if (
                core.status.maps[toId].flyPoint != null &&
                core.status.maps[toId].flyPoint.length == 2
            ) {
                loc = {
                    x: core.status.maps[toId].flyPoint[0],
                    y: core.status.maps[toId].flyPoint[1]
                };
            }
            if (loc == null) {
                // 获得两个楼层的索引，以决定是上楼梯还是下楼梯
                var fromIndex = core.floorIds.indexOf(fromId),
                    toIndex = core.floorIds.indexOf(toId);
                var stair = fromIndex <= toIndex ? 'downFloor' : 'upFloor';
                // 地下层：同层传送至上楼梯
                if (
                    fromIndex == toIndex &&
                    core.status.maps[fromId].underGround
                )
                    stair = 'upFloor';
            }

            // 记录录像
            core.status.route.push('fly:' + toId);
            // 传送
            core.ui.closePanel();
            core.changeFloor(toId, stair, loc, null, callback);

            return true;
        },
        beforeBattle: function (enemyId, x, y) {
            // 战斗前触发的事件，可以加上一些战前特效（详见下面支援的例子）
            // 此函数在“检测能否战斗和自动存档”【之后】执行。如果需要更早的战前事件，请在插件中覆重写 core.events.doSystemEvent 函数。
            // 返回true则将继续战斗，返回false将不再战斗。

            // ------ 支援技能 ------ //
            if (x != null && y != null) {
                var index = x + ',' + y,
                    cache = core.status.checkBlock.cache[index] || {},
                    guards = cache.guards || [];
                // 如果存在支援怪
                if (guards.length > 0) {
                    // 记录flag，当前要参与支援的怪物
                    core.setFlag('__guards__' + x + '_' + y, guards);
                    var actions = [{ type: 'playSound', name: 'jump.mp3' }];
                    // 增加支援的特效动画（图块跳跃）
                    guards.forEach(function (g) {
                        core.push(actions, {
                            type: 'jump',
                            from: [g[0], g[1]],
                            to: [x, y],
                            time: 300,
                            keep: false,
                            async: true
                        });
                    });
                    core.push(actions, [
                        { type: 'waitAsync' }, // 等待所有异步事件执行完毕
                        { type: 'trigger', loc: [x, y] } // 重要！重新触发本点事件（即重新触发战斗）
                    ]);
                    core.insertAction(actions);
                    return false;
                }
            }

            return true;
        },
        afterBattle: function (enemyId, x, y) {
            // 战斗结束后触发的事件
            const floorId = core.status.floorId;

            var enemy = core.material.enemys[enemyId];
            var special = enemy.special;

            // 播放战斗音效和动画
            // 默认播放的动画；你也可以使用
            var animate = 'hand'; // 默认动画
            // 检查当前装备是否存在攻击动画
            var equipId = core.getEquip(0);
            if (equipId && (core.material.items[equipId].equip || {}).animate)
                animate = core.material.items[equipId].equip.animate;

            // 检查该动画是否存在SE，如果不存在则使用默认音效
            if (!(core.material.animates[animate] || {}).se)
                core.playSound('attack.mp3');

            // 播放动画；如果不存在坐标（强制战斗）则播放到勇士自身
            if (x != null && y != null) core.drawAnimate(animate, x, y);
            else core.drawHeroAnimate(animate);

            // 获得战斗伤害信息
            // 注意这里勇士坐标要传入当前勇士坐标，不然会默认取伤害最低的地方打怪
            const damageInfo =
                core.getDamageInfo(
                    enemyId,
                    { x: core.status.hero.loc.x, y: core.status.hero.loc.y },
                    x,
                    y
                ) ?? {};
            // 战斗伤害
            const damage = damageInfo.damage;
            // 判定是否致死
            if (damage == null || damage >= core.status.hero.hp) {
                core.status.hero.hp = 0;
                core.updateStatusBar(false, true);
                core.events.lose('战斗失败');
                return;
            }

            // 扣减体力值并记录统计数据
            core.status.hero.hp -= damage;
            core.status.hero.statistics.battleDamage += damage;
            core.status.hero.statistics.battle++;

            // 智慧之源
            if (core.hasSpecial(special, 14) && flags.hard === 2) {
                core.addFlag(
                    'inte_' + floorId,
                    Math.ceil((core.status.hero.mdef / 10) * 0.3) * 10
                );
                core.status.hero.mdef -=
                    Math.ceil((core.status.hero.mdef / 10) * 0.3) * 10;
            }

            // 极昼永夜
            if (core.hasSpecial(special, 22)) {
                flags[`night_${floorId}`] ??= 0;
                flags[`night_${floorId}`] -= enemy.night;
            }
            if (core.hasSpecial(special, 23)) {
                flags[`night_${floorId}`] ??= 0;
                flags[`night_${floorId}`] += enemy.day;
            }

            if (core.getSkillLevel(11) > 0) {
                core.declineStudiedSkill();
            }

            // 如果是融化怪，需要特殊标记一下
            if (core.hasSpecial(special, 25) && core.has(x) && core.has(y)) {
                flags[`melt_${floorId}`] ??= {};
                flags[`melt_${floorId}`][`${x},${y}`] = enemy.melt;
            }

            // 获得金币
            const money = enemy.money;
            core.status.hero.money += money;
            core.status.hero.statistics.money += money;

            // 获得经验
            const exp = enemy.exp;
            core.status.hero.exp += exp;
            core.status.hero.statistics.exp += exp;

            const hint =
                '打败 ' + enemy.name + '，金币+' + money + '，经验+' + exp;
            core.drawTip(hint, enemy.id);

            if (core.getFlag('bladeOn') && core.getFlag('blade')) {
                core.setFlag('blade', false);
            }
            if (core.getFlag('shieldOn') && core.getFlag('shield')) {
                core.setFlag('shield', false);
            }

            // 事件的处理
            var todo = [];

            // 战后事件
            if (core.status.floorId != null) {
                core.push(
                    todo,
                    core.floors[core.status.floorId].afterBattle[x + ',' + y]
                );
            }
            core.push(todo, enemy.afterBattle);

            // 如果事件不为空，将其插入
            if (todo.length > 0) core.insertAction(todo, x, y);

            // 因为removeBlock和hideBlock都会刷新状态栏，因此将删除部分移动到这里并保证刷新只执行一次，以提升效率
            if (core.getBlock(x, y) != null) {
                core.removeBlock(x, y);
            } else {
                core.updateStatusBar();
            }

            // 如果已有事件正在处理中
            if (core.status.event.id == null) core.continueAutomaticRoute();
            else core.clearContinueAutomaticRoute();
        },
        afterOpenDoor: function (doorId, x, y) {
            // 开一个门后触发的事件

            var todo = [];
            // 检查该点的获得开门后事件。
            if (core.status.floorId == null) return;
            var event =
                core.floors[core.status.floorId].afterOpenDoor[x + ',' + y];
            if (event) core.unshift(todo, event);

            if (todo.length > 0) core.insertAction(todo, x, y);

            if (core.status.event.id == null) core.continueAutomaticRoute();
            else core.clearContinueAutomaticRoute();
        },
        afterGetItem: function (itemId, x, y, isGentleClick) {
            // 获得一个道具后触发的事件
            // itemId：获得的道具ID；x和y是该道具所在的坐标
            // isGentleClick：是否是轻按触发的
            if (
                (itemId.endsWith('Potion') ||
                    itemId == 'I482' ||
                    itemId == 'I484' ||
                    itemId == 'I487' ||
                    itemId == 'I491') &&
                core.material.items[itemId].cls == 'items'
            )
                core.playSound('回血');
            else core.playSound('获得道具');

            var todo = [];
            // 检查该点的获得道具后事件。
            if (core.status.floorId == null) return;
            var event =
                core.floors[core.status.floorId].afterGetItem[x + ',' + y];
            if (
                event &&
                (event instanceof Array ||
                    !isGentleClick ||
                    !event.disableOnGentleClick)
            ) {
                core.unshift(todo, event);
            }
            if (core.hasFlag('spring')) {
                if (!core.hasFlag('springCount'))
                    core.setFlag('springCount', 0);
                if (
                    itemId.endsWith('Potion') ||
                    itemId == 'I482' ||
                    itemId == 'I484' ||
                    itemId == 'I487' ||
                    itemId == 'I491'
                ) {
                    core.addFlag('springCount', 1);
                }
                if (core.getFlag('springCount', 0) == 50) {
                    core.setFlag('springCount', 0);
                    core.status.hero.hpmax *= 1.1;
                }
                core.updateStatusBar();
            }

            if (todo.length > 0) core.insertAction(todo, x, y);
        },
        afterPushBox: function () {
            // 推箱子后的事件
            if (core.searchBlock('box').length == 0) {
                // 可以通过if语句来进行开门操作
                /*
                if (core.status.floorId=='xxx') { // 在某个楼层
                    core.insertAction([ // 插入一条事件
                        {"type": "openDoor", "loc": [x,y]} // 开门
                    ])
                }
                */
            }
        }
    },
    enemys: {
        getSpecials: function () {
            // 获得怪物的特殊属性，每一行定义一个特殊属性。
            // 分为五项，第一项为该特殊属性的数字，第二项为特殊属性的名字，第三项为特殊属性的描述
            // 第四项为该特殊属性的颜色，可以写十六进制 #RRGGBB 或者 [r,g,b,a] 四元数组
            // 第五项为该特殊属性的标记；目前 1 代表是地图类技能（需要进行遍历全图）
            // 名字和描述可以直接写字符串，也可以写个function将怪物传进去
            return [
                [
                    1,
                    '致命一击',
                    function (enemy) {
                        return (
                            '怪物每5回合触发一次强力攻击，造成' +
                            (enemy.crit || 100) +
                            '%的伤害'
                        );
                    },
                    '#fc3'
                ],
                [2, '恶毒', '怪物攻击无视勇士的防御', '#bbb0ff'],
                [3, '坚固', '怪物防御不小于勇士攻击-1', '#c0b088'],
                [4, '2连击', '怪物每回合攻击2次', '#ffee77'],
                [5, '3连击', '怪物每回合攻击3次', '#ffee77'],
                [
                    6,
                    function (enemy) {
                        return (enemy.n || '') + '连击';
                    },
                    function (enemy) {
                        return '怪物每回合攻击' + (enemy.n || 4) + '次';
                    },
                    '#ffee77'
                ],
                [
                    7,
                    '饥渴',
                    function (enemy) {
                        return (
                            '战斗前，怪物偷取勇士' +
                            (enemy.hungry || 0) +
                            '%加在自己身上（勇士攻击也会降低）'
                        );
                    },
                    '#b67'
                ],
                [
                    8,
                    '抱团',
                    function (enemy) {
                        return (
                            '怪物周围5×5范围内每有一个拥有该属性的怪物，该怪物攻防就增加' +
                            (enemy.together || 0) +
                            '%（线性叠加）'
                        );
                    },
                    '#ffaa44',
                    1
                ],
                [
                    9,
                    '绝对防御',
                    function () {
                        return '怪物的奇特护甲可以让勇士的额外攻击变为正常攻击（相当于勇士的攻击变为基础攻击+额外攻击）';
                    },
                    '#80eed6'
                ],
                [
                    10,
                    '勇气之刃',
                    function (enemy) {
                        return (
                            '第一回合造成' +
                            (enemy.courage || 100) +
                            '%的伤害，之后正常'
                        );
                    },
                    '#b0c0dd'
                ],
                [
                    11,
                    '勇气冲锋',
                    function (enemy) {
                        return (
                            '怪物首先发动冲锋，造成' +
                            (enemy.charge || 100) +
                            '%的伤害，并眩晕勇士5回合'
                        );
                    },
                    '#ff00d2'
                ],
                [
                    12,
                    '追猎',
                    '当勇士移动到该怪物的水平或竖直方向上时，怪物向勇士移动一格',
                    '#99ee88',
                    2
                ],
                [13, '魔攻', '怪物攻击无视勇士防御', '#bbb0ff'],
                [
                    14,
                    '智慧之源',
                    '困难难度下（简单难度没有效果），战斗后，怪物会吸取勇士30%的智慧（勇士智慧向下取整至整十）加在本层的拥有该属性的怪物攻击上',
                    '#bbeef0'
                ],
                [
                    15,
                    '突刺',
                    function (enemy) {
                        return (
                            '经过怪物周围' +
                            (enemy.zoneSquare ? '九宫格' : '十字') +
                            '范围内' +
                            (enemy.range || 1) +
                            '格时怪物会攻击勇士，造成' +
                            core.formatBigNumber(
                                Math.max(
                                    (enemy.value || 0) -
                                        core.getHeroStatusOn('def')
                                )
                            ) +
                            '点伤害'
                        );
                    },
                    '#c677dd'
                ],
                [
                    16,
                    '夹击',
                    '经过两只相同的怪物中间，勇士生命值变成一半',
                    '#bb99ee'
                ],
                [17, '先攻', '战斗时怪物首先攻击', '#b0b666'],
                [
                    18,
                    '阻击',
                    function (enemy) {
                        return (
                            '经过怪物的十字领域时自动减生命' +
                            (enemy.value || 0) +
                            '点，同时怪物后退一格'
                        );
                    },
                    '#8888e6'
                ],
                [
                    19,
                    '电摇嘲讽',
                    '当勇士移动到怪物同行或同列时，勇士会直接冲向怪物，撞碎路上的所有地形和门，拾取路上的道具，与路上的怪物战斗' +
                        '，最后与该怪物战斗',
                    '#ff6666'
                ],
                [
                    20,
                    '霜冻',
                    enemy =>
                        `怪物寒冷的攻击使勇士动作变慢，勇士每回合对怪物造成的伤害减少${enemy.ice}%。装备杰克的衣服后可以免疫。`,
                    'cyan'
                ],
                [
                    21,
                    '冰封光环',
                    enemy =>
                        `寒气逼人，使勇士对该怪物周围7*7范围内的怪物伤害减少${enemy.iceHalo}%（线性叠加）`,
                    'cyan',
                    1
                ],
                [
                    22,
                    '永夜',
                    enemy =>
                        `战斗后，减少勇士${enemy.night}点攻防，增加本层所有怪物${enemy.night}点攻防，仅在本层有效`,
                    '#d8a'
                ],
                [
                    23,
                    '极昼',
                    enemy =>
                        `战斗后，减少本层所有怪物${enemy.day}点攻防，增加勇士${enemy.day}点攻防，仅在本层有效`,
                    '#ffd'
                ],
                [
                    24,
                    '射击',
                    function () {
                        return '经过怪物同行或同列的可视范围内时受到一次普通攻击的伤害';
                    },
                    '#dda0dd'
                ],
                [
                    25,
                    '融化',
                    enemy =>
                        `战斗后该怪物会融化，在怪物位置产生一个3*3的范围光环，光环内怪物的攻防增加${enemy.melt}%`,
                    '#e6e099',
                    1
                ],
                [
                    26,
                    '冰封之核',
                    enemy =>
                        `怪物拥有逼人的寒气，使周围5*5范围内的怪物防御增加${enemy.iceCore}%`,
                    '#70ffd1',
                    1
                ],
                [
                    27,
                    '火焰之核',
                    enemy =>
                        `怪物拥有灼热的火焰，使周围5*5范围内的怪物攻击增加${enemy.fireCore}%`,
                    '#ff6f0a',
                    1
                ]
            ];
        },
        getEnemyInfo: function (enemy, hero, x, y, floorId) {
            // 获得某个怪物变化后的数据；该函数将被伤害计算和怪物手册使用
            // 例如：坚固、模仿、仿攻等等
            //
            // 参数说明：
            // enemy：该怪物信息
            // hero_hp,hero_atk,hero_def,hero_mdef：勇士的生命攻防护盾数据
            // x,y：该怪物的坐标（查看手册和强制战斗时为undefined）
            // floorId：该怪物所在的楼层
            // 后面三个参数主要是可以在光环等效果上可以适用（也可以按需制作部分范围光环效果）
            floorId = floorId || core.status.floorId;

            let {
                atk: hero_atk,
                def: hero_def,
                mdef: hero_mdef,
                hp: hero_hp
            } = core.getHeroStatusOf(
                hero,
                ['atk', 'def', 'mdef', 'hp'],
                hero?.x,
                hero?.y,
                floorId
            );

            var mon_hp = core.getEnemyValue(enemy, 'hp', x, y, floorId),
                mon_atk = core.getEnemyValue(enemy, 'atk', x, y, floorId),
                mon_def = core.getEnemyValue(enemy, 'def', x, y, floorId),
                mon_special = core.getEnemyValue(
                    enemy,
                    'special',
                    x,
                    y,
                    floorId
                );
            var mon_money = core.getEnemyValue(enemy, 'money', x, y, floorId),
                mon_exp = core.getEnemyValue(enemy, 'exp', x, y, floorId),
                mon_point = core.getEnemyValue(enemy, 'point', x, y, floorId);

            let iceDecline = 0;

            if (typeof enemy === 'number')
                core.getBlockByNumber(enemy).event.id;
            if (typeof enemy === 'string') enemy = core.material.enemys[enemy];

            // 饥渴
            if (core.hasSpecial(mon_special, 7)) {
                mon_atk += (hero_atk * (enemy.hungry || 0)) / 100;
            }

            // 智慧之源
            if (core.hasSpecial(mon_special, 14) && flags.hard === 2) {
                mon_atk += core.getFlag('inte_' + floorId, 0);
            }

            // 极昼永夜
            mon_atk -= flags[`night_${floorId}`] ?? 0;
            mon_def -= flags[`night_${floorId}`] ?? 0;

            // 坚固
            if (core.hasSpecial(mon_special, 3) && mon_def < hero_atk - 1) {
                mon_def = hero_atk - 1;
            }

            var guards = [];

            // 光环和支援检查
            core.status.checkBlock ??= {};

            if (
                core.status.checkBlock.needCache &&
                core.has(x) &&
                core.has(y)
            ) {
                // 从V2.5.4开始，对光环效果增加缓存，以解决多次重复计算的问题，从而大幅提升运行效率。
                var hp_buff = 0,
                    atk_buff = 0,
                    def_buff = 0;
                // 检查光环和支援的缓存
                var index = `${x},${y}`;
                core.status.checkBlock.cache ??= {};
                var cache = core.status.checkBlock.cache[index];
                if (!cache) {
                    // 没有该点的缓存，则遍历每个图块
                    core.extractBlocks(floorId);
                    core.status.maps[floorId].blocks.forEach(function (block) {
                        if (block.disable) return;
                        // 获得该图块的ID
                        var id = block.event.id,
                            e = core.material.enemys[id];
                        if (!e) return;
                        var dx = Math.abs(block.x - x),
                            dy = Math.abs(block.y - y);

                        // 抱团
                        if (
                            core.hasSpecial(mon_special, 8) &&
                            core.hasSpecial(e.special, 8) &&
                            !(dx == 0 && dy == 0) &&
                            dx < 3 &&
                            dy < 3
                        ) {
                            atk_buff += enemy.together || 0;
                            def_buff += enemy.together || 0;
                        }

                        // 冰封光环
                        if (
                            core.hasSpecial(e.special, 21) &&
                            dx < 4 &&
                            dy < 4
                        ) {
                            iceDecline += e.iceHalo;
                        }

                        // 5*5光环
                        if (dx <= 2 && dy <= 2) {
                            // 冰封之核
                            if (core.hasSpecial(e.special, 26)) {
                                def_buff += e.iceCore;
                            }

                            // 火焰之核
                            if (core.hasSpecial(e.special, 27)) {
                                atk_buff += e.fireCore;
                            }
                        }
                    });

                    // 融化怪要在这里判断
                    if (
                        core.has(flags[`melt_${floorId}`]) &&
                        core.has(x) &&
                        core.has(y)
                    ) {
                        for (const [loc, per] of Object.entries(
                            flags[`melt_${floorId}`]
                        )) {
                            const [mx, my] = loc
                                .split(',')
                                .map(v => parseInt(v));
                            if (
                                Math.abs(mx - x) <= 1 &&
                                Math.abs(my - y) <= 1
                            ) {
                                atk_buff += per;
                                def_buff += per;
                            }
                        }
                    }

                    core.status.checkBlock.cache[index] = {
                        hp_buff: hp_buff,
                        atk_buff: atk_buff,
                        def_buff: def_buff,
                        guards: guards,
                        iceHalo: iceDecline
                    };
                } else {
                    // 直接使用缓存数据
                    hp_buff = cache.hp_buff;
                    atk_buff = cache.atk_buff;
                    def_buff = cache.def_buff;
                    guards = cache.guards;
                    iceDecline = cache.iceHalo;
                }

                // 增加比例；如果要增加数值可以直接在这里修改
                mon_hp *= 1 + hp_buff / 100;
                mon_atk *= 1 + atk_buff / 100;
                mon_def *= 1 + def_buff / 100;
            }

            return {
                hp: Math.floor(mon_hp),
                atk: Math.floor(mon_atk),
                def: Math.floor(mon_def),
                money: Math.floor(mon_money),
                exp: Math.floor(mon_exp),
                point: Math.floor(mon_point),
                special: mon_special,
                guards: guards, // 返回支援情况
                iceDecline
            };
        },
        getDamageInfo: function (enemy, hero, x, y, floorId) {
            // 获得战斗伤害信息（实际伤害计算函数）
            //
            // 参数说明：
            // enemy：该怪物信息
            // hero：勇士的当前数据；如果对应项不存在则会从core.status.hero中取
            // x,y：该怪物的坐标（查看手册和强制战斗时为undefined）
            // floorId：该怪物所在的楼层
            // 后面三个参数主要是可以在光环等效果上可以适用
            floorId = floorId || core.status.floorId;

            // 勇士位置应该在这里进行计算，四个位置依次遍历，去重
            let toMap = [];
            if (
                core.has(x) &&
                core.has(y) &&
                !(core.has(hero?.x) && core.has(hero?.y)) &&
                core.has(floorId) &&
                flags.autoLocate &&
                flags.chapter >= 2
            ) {
                const floor = core.status.maps[floorId];
                // 存在坐标，进行遍历
                for (const [dir, { x: dx, y: dy }] of Object.entries(
                    core.utils.scan
                )) {
                    // 只有攻击和防御和特殊光环需要注意，其他的都不会随楼层与坐标变化
                    const nx = x + dx;
                    const ny = y + dy;
                    if (
                        nx < 0 ||
                        nx >= floor.width ||
                        ny < 0 ||
                        ny >= floor.height
                    ) {
                        continue;
                    }
                    if (
                        core.noPass(nx, ny) ||
                        !core.canMoveHero(nx, ny, core.backDir(dir), floorId)
                    ) {
                        continue;
                    }
                    const toGet = ['atk', 'def'];
                    const status = core.getHeroStatusOf(
                        hero,
                        toGet,
                        nx,
                        ny,
                        floorId
                    );
                    if (
                        toMap.some(v =>
                            toGet.every(vv => v[1][vv] === status[vv])
                        )
                    ) {
                        continue;
                    }
                    toMap.push(dir);
                }
            } else {
                // 指定了勇士坐标或者没有怪物坐标时
                toMap = ['none'];
            }

            function getDamage(h) {
                const enemyInfo = core.getEnemyInfo(enemy, hero, x, y, floorId);

                let {
                    hp: mon_hp,
                    atk: mon_atk,
                    def: mon_def,
                    special: mon_special
                } = enemyInfo;
                let { atk: hero_atk, def: hero_def } = core.getHeroStatusOf(
                    hero,
                    ['atk', 'def'],
                    x,
                    y,
                    floorId
                );

                let hero_hp = core.getRealStatusOrDefault(hero, 'hp'),
                    hero_IQ = core.getRealStatusOrDefault(hero, 'mdef'),
                    hero_recovery = core.getRealStatusOrDefault(hero, 'hpmax'),
                    hero_extraAtk = core.getRealStatusOrDefault(hero, 'mana');

                let damage = 0;

                // 饥渴
                if (core.hasSpecial(mon_special, 7)) {
                    hero_atk *= 1 - (enemy.hungry || 0) / 100;
                }

                // 战前造成的额外伤害（可被护盾抵消）
                var init_damage = 0;

                // 每回合怪物对勇士造成的战斗伤害
                var per_damage = mon_atk - hero_def;

                // 魔攻：战斗伤害就是怪物攻击力
                if (
                    core.hasSpecial(mon_special, 2) ||
                    core.hasSpecial(mon_special, 13)
                ) {
                    per_damage = mon_atk;
                }

                // 战斗伤害不能为负值
                if (per_damage < 0) per_damage = 0;

                // 先攻
                if (core.hasSpecial(mon_special, 17)) damage += per_damage;

                // 2连击 & 3连击 & N连击
                if (core.hasSpecial(mon_special, 4)) per_damage *= 2;
                if (core.hasSpecial(mon_special, 5)) per_damage *= 3;
                if (core.hasSpecial(mon_special, 6)) per_damage *= enemy.n || 4;
                // 勇士每回合对怪物造成的伤害
                let hero_per_damage = Math.max(hero_atk - mon_def, 0);
                if (!core.hasSpecial(mon_special, 9)) {
                    hero_per_damage = Math.max(hero_atk - mon_def, 0);
                    if (hero_per_damage > 0) hero_per_damage += hero_extraAtk;
                } else {
                    hero_per_damage = Math.max(
                        hero_atk + hero_extraAtk - mon_def,
                        0
                    );
                }

                // 如果没有破防，则不可战斗
                if (hero_per_damage <= 0) return null;

                if (
                    core.hasSpecial(mon_special, 20) &&
                    !core.hasEquip('I589')
                ) {
                    hero_per_damage *= 1 - enemy.ice / 100;
                }

                hero_per_damage *= 1 - enemyInfo.iceDecline / 100;

                // 勇士的攻击回合数；为怪物生命除以每回合伤害向上取整
                let turn = Math.ceil(mon_hp / hero_per_damage);

                // 致命一击
                if (core.hasSpecial(mon_special, 1)) {
                    var times = Math.floor(turn / 5);
                    damage +=
                        ((times * ((enemy.crit || 100) - 100)) / 100) *
                        per_damage;
                }
                // 勇气之刃
                if (turn > 1 && core.hasSpecial(mon_special, 10)) {
                    damage += ((enemy.courage || 100) / 100 - 1) * per_damage;
                }
                // 勇气冲锋
                if (core.hasSpecial(mon_special, 11)) {
                    damage += ((enemy.charge || 100) / 100) * per_damage;
                    turn += 5;
                }

                // 最终伤害：初始伤害 + 怪物对勇士造成的伤害 + 反击伤害
                damage += init_damage + (turn - 1) * per_damage;
                // 无上之盾
                if (core.hasFlag('superSheild')) {
                    damage -= hero_IQ;
                }
                // 生命回复
                damage -= hero_recovery * turn;
                if (core.getFlag('hard') === 1) damage *= 0.9;

                return {
                    mon_hp: Math.floor(mon_hp),
                    mon_atk: Math.floor(mon_atk),
                    mon_def: Math.floor(mon_def),
                    init_damage: Math.floor(init_damage),
                    per_damage: Math.floor(per_damage),
                    hero_per_damage: Math.floor(hero_per_damage),
                    turn: Math.floor(turn),
                    damage: Math.floor(damage)
                };
            }

            const skills = [
                ['bladeOn', 'blade'],
                ['shieldOn', 'shield']
            ];

            function autoSkill(h) {
                damageInfo = getDamage(h);
                damage = damageInfo?.damage ?? Infinity;
                if (flags.autoSkill) {
                    for (const [unlock, condition] of skills) {
                        if (!flags[unlock]) continue;
                        flags[condition] = true;
                        const info = getDamage(h);
                        const d = info?.damage;
                        if (d !== null && d !== void 0) {
                            if (d < damage) {
                                damage = d;
                                damageInfo = info;
                            }
                        }
                        flags[condition] = false;
                    }
                } else {
                    damageInfo = getDamage(h);
                    if (damageInfo) damage = damageInfo.damage;
                }
            }

            let dirDamageInfo = null;
            let dirMinDamage = Infinity;
            let damageInfo = null;
            let damage = Infinity;

            if (!flags.autoLocate) {
                autoSkill(toMap[0][1]);
                return damageInfo;
            }

            const dirDamage = [];
            for (const dir of toMap) {
                damage = Infinity;
                damageInfo = null;
                autoSkill();
                dirDamage.push([dir, damage]);
                if (damage < dirMinDamage) {
                    dirMinDamage = damage;
                    dirDamageInfo = damageInfo;
                }
                if (dirDamageInfo) {
                    return Object.assign(dirDamageInfo, { dir: dirDamage });
                } else return null;
            }
        }
    },
    actions: {
        onKeyUp: function (keyCode, altKey) {
            // 键盘按键处理，可以在这里自定义快捷键列表
            // keyCode：当前按键的keyCode（每个键的keyCode自行百度）
            // altKey：Alt键是否被按下，为true代表同时按下了Alt键
            // 可以在这里任意增加或编辑每个按键的行为

            if (core.status.lockControl) return;

            // 如果处于正在行走状态，则不处理
            if (core.isMoving()) return;

            // Alt+0~9，快捷换上套装
            if (altKey && keyCode >= 48 && keyCode <= 57) {
                core.items.quickLoadEquip(keyCode - 48);
                return;
            }

            const [x, y] = flags.mouseLoc;
            const mx = Math.round(x + core.bigmap.offsetX / 32);
            const my = Math.round(y + core.bigmap.offsetY / 32);

            // 根据keyCode值来执行对应操作
            switch (keyCode) {
                case 74: // J:打开技能树
                    core.useItem('skill1');
                    break;
                case 27: // ESC：打开菜单栏
                    core.openSettings(true);
                    break;
                case 88: // X：使用怪物手册
                    core.openBook(true);
                    break;
                case 71: // G：使用楼传器
                    core.useFly(true);
                    break;
                case 65: // A：读取自动存档（回退）
                    core.doSL('autoSave', 'load');
                    break;
                case 87: // W：撤销回退
                    core.doSL('autoSave', 'reload');
                    break;
                case 83: // S：存档
                    core.save(true);
                    break;
                case 68: // D：读档
                    core.load(true);
                    break;
                case 84: // T：打开道具栏
                    core.openToolbox(true);
                    break;
                case 81: // Q：打开装备栏
                    core.openEquipbox(true);
                    break;
                case 90: // Z：转向
                    core.turnHero();
                    break;
                case 86: // V：打开快捷商店列表
                    core.openQuickShop(true);
                    break;
                case 32: // SPACE：轻按
                    core.getNextItem();
                    break;
                case 82: // R：回放录像
                    core.ui._drawReplay();
                    break;
                case 33:
                case 34: // PgUp/PgDn：浏览地图
                    core.ui._drawViewMaps();
                    break;
                case 66: // B：打开数据统计
                    core.ui._drawStatistics();
                    break;
                case 72: // H：打开帮助页面
                    core.useItem('I560', true);
                    break;
                case 67: // C：怪物临界
                    if (core.getBlockCls(mx, my)?.startsWith('enemy')) {
                        core.plugin.fixedDetailPanel = 'critical';
                        core.plugin.showFixed.value = false;
                        core.plugin.fixedDetailOpened.value = true;
                    }
                    break;
                case 69: // E：怪物属性
                    if (core.getBlockCls(mx, my)?.startsWith('enemy')) {
                        core.plugin.fixedDetailPanel = 'special';
                        core.plugin.showFixed.value = false;
                        core.plugin.fixedDetailOpened.value = true;
                    }
                    break;
                case 77: // M：快速标记
                    const blocks = core.getMapBlocksObj();
                    const block = blocks[`${mx},${my}`];
                    if (block.event.cls.startsWith('enemy')) {
                        const name = core.material.enemys[block.event.id].name;
                        if (core.hasMarkedEnemy(block.event.id)) {
                            core.tip('success', `已取消标记${name}！`);
                            core.unmarkEnemy(block.event.id);
                        } else {
                            core.tip('success', `已标记${name}！`);
                            core.markEnemy(block.event.id);
                        }
                    }
                    break;
                case 78: // N：重新开始
                    core.confirmRestart();
                    break;
                case 79: // O：查看工程
                    core.actions._clickGameInfo_openProject();
                    break;
                case 80: // P：游戏主页
                    core.actions._clickGameInfo_openComments();
                    break;
                case 49: // 1: 断灭之刃
                    if (!flags.bladeOn || flags.autoSkill) break;
                    core.status.route.push('key:49'); // 将按键记在录像中
                    core.playSound('光标移动');
                    if (flags.blade) flags.blade = false;
                    else flags.blade = true;
                    core.updateStatusBar();
                    break;
                case 50: // 快捷键2: 跳跃技能 || 破
                    if (
                        !flags.chase &&
                        !core.status.floorId.startsWith('tower') &&
                        flags.skill2
                    ) {
                        core.jumpSkill();
                        core.status.route.push('key:50'); // 将按键记在录像中
                    } else {
                        if (core.hasItem('pickaxe')) {
                            core.status.route.push('key:50'); // 将按键记在录像中
                            core.useItem('pickaxe', true); // 第二个参数true代表该次使用道具是被按键触发的，使用过程不计入录像
                        }
                    }
                    break;
                case 51: // 3: 铸剑为盾
                    if (!flags.shieldOn || flags.autoSkill) break;
                    console.log(1);
                    core.status.route.push('key:51'); // 将按键记在录像中
                    core.playSound('光标移动');
                    if (flags.shield) flags.shield = false;
                    else flags.shield = true;
                    core.updateStatusBar();
                    break;
                case 53: // 5：读取自动存档（回退），方便手机版操作
                    core.doSL('autoSave', 'load');
                    break;
                case 54: // 6：撤销回退，方便手机版操作
                    core.doSL('autoSave', 'reload');
                    break;
                case 55: // 快捷键7：绑定为轻按，方便手机版操作
                    core.getNextItem();
                    break;
                case 118: // F7：开启debug模式
                    core.debug();
                    break;
            }
        }
    },
    control: {
        saveData: function () {
            // 存档操作，此函数应该返回“具体要存档的内容”

            // 差异化存储values
            var values = {};
            for (var key in core.values) {
                if (!core.same(core.values[key], core.data.values[key]))
                    values[key] = core.clone(core.values[key]);
            }

            // 要存档的内容
            var data = {
                floorId: core.status.floorId,
                hero: core.clone(core.status.hero, name => name !== 'chase'),
                hard: core.status.hard,
                maps: core.clone(core.maps.saveMap()),
                route: core.encodeRoute(core.status.route),
                values: values,
                version: core.firstData.version,
                guid: core.getGuid(),
                time: new Date().getTime(),
                skills: core.saveSkillTree()
            };

            return data;
        },
        loadData: function (data, callback) {
            // 读档操作；从存储中读取了内容后的行为
            if (window.flags && flags.onChase) {
                flags.chase.end();
                flags.onChase = true;
            }
            // 重置游戏和路线
            core.resetGame(
                data.hero,
                data.hard,
                data.floorId,
                core.maps.loadMap(data.maps, null, data.hero.flags),
                data.values
            );
            core.status.route = core.decodeRoute(data.route);
            core.control._bindRoutePush();
            // 文字属性，全局属性
            core.status.textAttribute = core.getFlag(
                'textAttribute',
                core.status.textAttribute
            );
            var toAttribute = core.getFlag(
                'globalAttribute',
                core.status.globalAttribute
            );
            if (!core.same(toAttribute, core.status.globalAttribute)) {
                core.status.globalAttribute = toAttribute;
                core.resize();
            }
            // 重置音量
            core.events.setVolume(core.getFlag('__volume__', 1), 0);
            // 加载勇士图标
            var icon = core.status.hero.image;
            icon = core.getMappedName(icon);
            if (core.material.images.images[icon]) {
                core.material.images.hero = core.material.images.images[icon];
                core.material.icons.hero.width =
                    core.material.images.images[icon].width / 4;
                core.material.icons.hero.height =
                    core.material.images.images[icon].height / 4;
            }
            core.setFlag('__fromLoad__', true);

            // TODO：增加自己的一些读档处理
            core.loadSkillTree(data.skills);

            // 切换到对应的楼层
            core.changeFloor(data.floorId, null, data.hero.loc, 0, function () {
                // TODO：可以在这里设置读档后播放BGM
                if (core.hasFlag('__bgm__')) {
                    // 持续播放
                    core.playBgm(core.getFlag('__bgm__'));
                }

                core.removeFlag('__fromLoad__');
                if (callback) callback();

                if (flags.onChase) {
                    core.startChase(flags.chaseIndex);
                    if (flags.chaseIndex === 1) {
                        core.playBgm('escape.mp3', 43.5);
                    }
                }
            });
        },
        getStatusLabel: function (name) {
            // 返回某个状态英文名的对应中文标签，如atk -> 攻击，def -> 防御等。
            // 请注意此项仅影响 libs/ 下的内容（如绘制怪物手册、数据统计等）
            // 自行定义的（比如获得道具效果）中用到的“攻击+3”等需要自己去对应地方修改

            return (
                {
                    name: '名称',
                    lv: '等级',
                    hpmax: '生命回复',
                    hp: '生命',
                    manamax: '魔力上限',
                    mana: '额外攻击',
                    atk: '攻击',
                    def: '防御',
                    mdef: '智慧',
                    money: '金币',
                    exp: '经验',
                    point: '加点',
                    steps: '步数',
                    up: '升级',
                    none: '无'
                }[name] || name
            );
        },
        triggerDebuff: function (action, type) {
            // 毒衰咒效果的获得与解除
            // action：获得还是解除；'get'表示获得，'remove'表示解除
            // type：一个数组表示获得了哪些毒衰咒效果；poison, weak，curse
            if (!(type instanceof Array)) type = [type];
        },
        updateStatusBar: function () {
            // 更新状态栏

            // 检查等级
            core.events.checkLvUp();

            // 如果是自定义添加的状态栏，也需要在这里进行设置显示的数值

            // 难度
            if (core.statusBar.hard.innerText != core.status.hard) {
                core.statusBar.hard.innerText = core.status.hard;
            }
            var hardColor = core.getFlag('__hardColor__', 'red');
            if (core.statusBar.hard.getAttribute('_style') != hardColor) {
                core.statusBar.hard.style.color = hardColor;
                core.statusBar.hard.setAttribute('_style', hardColor);
            }

            // 更新阻激夹域的伤害值
            core.updateCheckBlock();
            // 更新全地图显伤
            core.updateDamage();

            // 已学习的技能
            if (
                core.getSkillLevel(11) > 0 &&
                (core.status.hero.special?.num ?? []).length > 0
            ) {
                core.plugin.showStudiedSkill.value = true;
            } else {
                core.plugin.showStudiedSkill.value = false;
            }
        },
        updateCheckBlock: function (floorId) {
            // 领域、夹击、阻击等的伤害值计算
            floorId = floorId || core.status.floorId;
            if (!floorId || !core.status.maps) return;

            const haloMap = {
                21: ['square:7:cyan'],
                26: ['square:5:blue'],
                27: ['square:5:red']
            };

            var width = core.floors[floorId].width,
                height = core.floors[floorId].height;
            var blocks = core.getMapBlocksObj(floorId);

            const damage = {}, // 每个点的伤害值
                type = {}, // 每个点的伤害类型
                repulse = {}, // 每个点的阻击怪信息
                mockery = {}, // 电摇嘲讽
                halo = {}; // 光环
            var needCache = false;
            var canGoDeadZone = core.flags.canGoDeadZone;
            var haveHunt = false;
            core.flags.canGoDeadZone = true;

            // 计算血网和领域、阻击、激光的伤害，计算捕捉信息
            for (var loc in blocks) {
                var block = blocks[loc],
                    x = block.x,
                    y = block.y,
                    id = block.event.id,
                    enemy = core.material.enemys[id];
                if (block.disable) continue;

                type[loc] = type[loc] || {};

                // 血网
                // 如需调用当前楼层的ratio可使用  core.status.maps[floorId].ratio
                if (id == 'lavaNet' && !core.hasItem('amulet')) {
                    damage[loc] = (damage[loc] || 0) + core.values.lavaDamage;
                    type[loc]['血网伤害'] = true;
                }

                // 领域
                // 如果要防止领域伤害，可以直接简单的将 flag:no_zone 设为true
                if (
                    enemy &&
                    core.hasSpecial(enemy.special, 15) &&
                    !core.hasFlag('no_zone')
                ) {
                    // 领域范围，默认为1
                    var range = enemy.range || 1;
                    // 是否是九宫格领域
                    var zoneSquare = false;
                    if (enemy.zoneSquare != null) zoneSquare = enemy.zoneSquare;
                    // 在范围内进行搜索，增加领域伤害值
                    for (var dx = -range; dx <= range; dx++) {
                        for (var dy = -range; dy <= range; dy++) {
                            if (dx == 0 && dy == 0) continue;
                            var nx = x + dx,
                                ny = y + dy,
                                currloc = nx + ',' + ny;
                            if (nx < 0 || nx >= width || ny < 0 || ny >= height)
                                continue;
                            // 如果是十字领域，则还需要满足 |dx|+|dy|<=range
                            if (
                                !zoneSquare &&
                                Math.abs(dx) + Math.abs(dy) > range
                            )
                                continue;
                            damage[currloc] = Math.max(
                                (damage[currloc] || 0) +
                                    (enemy.value || 0) -
                                    core.getRealStatusOrDefault(null, 'def'),
                                0
                            );
                            type[currloc] = type[currloc] || {};
                            type[currloc]['领域伤害'] = true;
                        }
                    }
                }

                // 阻击
                // 如果要防止阻击伤害，可以直接简单的将 flag:no_repulse 设为true
                if (
                    enemy &&
                    core.hasSpecial(enemy.special, 18) &&
                    !core.hasFlag('no_repulse')
                ) {
                    for (var dir in core.utils.scan) {
                        var nx = x + core.utils.scan[dir].x,
                            ny = y + core.utils.scan[dir].y,
                            currloc = nx + ',' + ny;
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height)
                            continue;
                        damage[currloc] =
                            (damage[currloc] || 0) + (enemy.value || 0);
                        type[currloc] = type[currloc] || {};
                        type[currloc]['阻击伤害'] = true;

                        var rdir = core.turnDirection(':back', dir);
                        // 检查下一个点是否存在事件（从而判定是否移动）
                        var rnx = x + core.utils.scan[rdir].x,
                            rny = y + core.utils.scan[rdir].y;
                        if (
                            core.canMoveHero(x, y, rdir, floorId) &&
                            core.getBlock(rnx, rny, floorId) == null
                        ) {
                            repulse[currloc] = (repulse[currloc] || []).concat([
                                [x, y, id, rdir]
                            ]);
                        }
                    }
                }
                // 射击
                if (enemy && core.hasSpecial(enemy.special, 24)) {
                    var beyondVisual = false;
                    for (var nx = 0; nx < width; nx++) {
                        var currloc = nx + ',' + y;
                        for (var mx = nx; mx != x; mx > x ? mx-- : mx++) {
                            if (
                                core.getBlockCls(mx, y, floorId) == 'enemys' ||
                                core.getBlockCls(mx, y, floorId) == 'enemy48'
                            )
                                continue;
                            if (
                                core.noPass(mx, y, floorId) &&
                                core.getBlockNumber(mx, y, floorId) != 141 &&
                                core.getBlockNumber(mx, y, floorId) != 151
                            ) {
                                beyondVisual = true;
                                break;
                            }
                        }
                        if (beyondVisual) {
                            beyondVisual = false;
                            continue;
                        }
                        if (
                            nx != x &&
                            !(
                                core.getBlockCls(nx, y, floorId) == 'enemys' ||
                                core.getBlockCls(nx, y, floorId) == 'enemy48'
                            )
                        ) {
                            damage[currloc] =
                                (damage[currloc] || 0) +
                                Math.max(
                                    (enemy.atk || 0) -
                                        core.getRealStatusOrDefault(
                                            null,
                                            'def'
                                        ),
                                    0
                                );
                            type[currloc] = type[currloc] || {};
                            type[currloc]['射击伤害'] = true;
                        }
                    }
                    for (var ny = 0; ny < height; ny++) {
                        var currloc = x + ',' + ny;
                        for (var my = ny; my != y; my > y ? my-- : my++) {
                            if (
                                core.getBlockCls(x, my, floorId) == 'enemys' ||
                                core.getBlockCls(x, my, floorId) == 'enemy48'
                            )
                                continue;
                            if (
                                core.noPass(x, my, floorId) &&
                                core.getBlockNumber(x, my, floorId) != 141 &&
                                core.getBlockNumber(x, my, floorId) != 151
                            ) {
                                beyondVisual = true;
                                break;
                            }
                        }
                        if (beyondVisual) {
                            beyondVisual = false;
                            continue;
                        }
                        if (
                            ny != y &&
                            !(
                                core.getBlockCls(x, ny, floorId) == 'enemys' ||
                                core.getBlockCls(x, ny, floorId) == 'enemy48'
                            )
                        ) {
                            damage[currloc] =
                                (damage[currloc] || 0) +
                                Math.max(
                                    (enemy.atk || 0) -
                                        core.getRealStatusOrDefault(
                                            null,
                                            'def'
                                        ),
                                    0
                                );
                            if (damage < 0) damage = 0;
                            type[currloc] = type[currloc] || {};
                            type[currloc]['射击伤害'] = true;
                        }
                    }
                }

                // 电摇嘲讽
                if (enemy && core.hasSpecial(enemy.special, 19)) {
                    for (let nx = 0; nx < width; nx++) {
                        if (!core.noPass(nx, y, floorId)) {
                            mockery[`${nx},${y}`] ??= [];
                            mockery[`${nx},${y}`].push([x, y]);
                        }
                    }
                    for (let ny = 0; ny < height; ny++) {
                        if (!core.noPass(x, ny, floorId)) {
                            mockery[`${x},${ny}`] ??= [];
                            mockery[`${x},${ny}`].push([x, y]);
                        }
                    }
                }

                // 检查地图范围类技能
                var specialFlag = core.getSpecialFlag(enemy);
                if (specialFlag & 1) needCache = true;
                if (core.status.event.id == 'viewMaps') needCache = true;
                if (
                    (core.status.event.id == 'book' ||
                        core.status.event.id == 'bool-detail') &&
                    core.status.event.ui
                )
                    needCache = true;
                if (specialFlag & 2) haveHunt = true;

                // 检查范围光环
                if (enemy) {
                    if (!(enemy.special instanceof Array)) continue;
                    for (const num of enemy.special) {
                        if (num in haloMap) {
                            halo[loc] ??= [];
                            halo[loc].push(...haloMap[num]);
                        }
                    }
                }
            }

            // 融化怪
            if (core.has(flags[`melt_${floorId}`])) {
                Object.keys(flags[`melt_${floorId}`]).forEach(v => {
                    needCache = true;
                    halo[v] ??= [];
                    halo[v].push('square:3:purple');
                });
            }

            core.flags.canGoDeadZone = canGoDeadZone;
            core.status.checkBlock = {
                damage: damage,
                type: type,
                repulse: repulse,
                mockery,
                needCache: needCache,
                cache: {}, // clear cache
                haveHunt: haveHunt,
                halo
            };
        },
        moveOneStep: function (callback) {
            // 勇士每走一步后执行的操作。callback为行走完毕后的回调
            // 这个函数执行在“刚走完”的时候，即还没有检查该点的事件和领域伤害等。
            // 请注意：瞬间移动不会执行该函数。如果要控制能否瞬间移动有三种方法：
            // 1. 将全塔属性中的cannotMoveDirectly这个开关勾上，即可在全塔中全程禁止使用瞬移。
            // 2, 将楼层属性中的cannotMoveDirectly这个开关勾上，即禁止在该层楼使用瞬移。
            // 3. 将flag:cannotMoveDirectly置为true，即可使用flag控制在某段剧情范围内禁止瞬移。

            // 增加步数
            core.status.hero.steps++;
            // 更新跟随者状态，并绘制
            core.updateFollowers();
            core.drawHero();

            // 从v2.7开始，每一步行走不会再刷新状态栏。
            // 如果有特殊要求（如每走一步都加buff之类），可手动取消注释下面这一句：
            // core.updateStatusBar(true);

            // 检查自动事件
            core.checkAutoEvents();

            // ------ 检查目标点事件 ------ //
            // 无事件的道具（如血瓶）需要优先于阻激夹域判定
            var nowx = core.getHeroLoc('x'),
                nowy = core.getHeroLoc('y');
            var block = core.getBlock(nowx, nowy);
            var hasTrigger = false;
            if (
                block != null &&
                block.event.trigger == 'getItem' &&
                !core.floors[core.status.floorId].afterGetItem[
                    nowx + ',' + nowy
                ]
            ) {
                hasTrigger = true;
                core.trigger(nowx, nowy, callback);
            }
            // 执行目标点的阻激夹域事件
            core.checkBlock();

            if (!hasTrigger) core.trigger(nowx, nowy, callback);

            // 检查该点是否是滑冰
            if (core.onSki()) {
                // 延迟到事件最后执行，因为这之前可能有阻激夹域动画
                core.insertAction(
                    { type: 'moveAction' },
                    null,
                    null,
                    null,
                    true
                );
            }

            core.checkLoopMap();

            // 追猎
            if (core.status.checkBlock.haveHunt) {
                var x = core.status.hero.loc.x,
                    y = core.status.hero.loc.y;
                core.status.maps[core.status.floorId].blocks.forEach(function (
                    block
                ) {
                    if (block.x != x && block.y != y) return;
                    var id = block.event.id,
                        enemy = core.material.enemys[id];
                    if (enemy && core.hasSpecial(enemy.special, 12)) {
                        var nx = block.x,
                            ny = block.y;
                        var dx = Math.abs(x - nx),
                            dy = Math.abs(y - ny);
                        if (x == block.x) {
                            if (
                                y > block.y &&
                                !core.noPass(block.x, block.y + 1) &&
                                core.getBlockCls(block.x, block.y + 1) !=
                                    'items'
                            ) {
                                dy--;
                                ny++;
                                core.insertAction([
                                    {
                                        type: 'move',
                                        loc: [block.x, block.y],
                                        time: 200,
                                        keep: true,
                                        steps: ['down:1']
                                    },
                                    {
                                        type: 'if',
                                        condition: dy + '<=1',
                                        true: [
                                            { type: 'battle', loc: [nx, ny] }
                                        ]
                                    }
                                ]);
                            }
                            if (
                                y < block.y &&
                                !core.noPass(block.x, block.y - 1) &&
                                core.getBlockCls(block.x, block.y - 1) !=
                                    'items'
                            ) {
                                dy--;
                                ny--;
                                core.insertAction([
                                    {
                                        type: 'move',
                                        loc: [block.x, block.y],
                                        time: 200,
                                        keep: true,
                                        steps: ['up:1']
                                    },
                                    {
                                        type: 'if',
                                        condition: dy + '<=1',
                                        true: [
                                            { type: 'battle', loc: [nx, ny] }
                                        ]
                                    }
                                ]);
                            }
                        } else {
                            if (
                                x > block.x &&
                                !core.noPass(block.x + 1, block.y) &&
                                core.getBlockCls(block.x + 1, block.y) !=
                                    'items'
                            ) {
                                dx--;
                                nx++;
                                core.insertAction([
                                    {
                                        type: 'move',
                                        loc: [block.x, block.y],
                                        time: 200,
                                        keep: true,
                                        steps: ['right:1']
                                    },
                                    {
                                        type: 'if',
                                        condition: dx + '<=1',
                                        true: [
                                            { type: 'battle', loc: [nx, ny] }
                                        ]
                                    }
                                ]);
                            }
                            if (
                                x < block.x &&
                                !core.noPass(block.x - 1, block.y) &&
                                core.getBlockCls(block.x - 1, block.y) !=
                                    'items'
                            ) {
                                dx--;
                                nx--;
                                core.insertAction([
                                    {
                                        type: 'move',
                                        loc: [block.x, block.y],
                                        time: 200,
                                        keep: true,
                                        steps: ['left:1']
                                    },
                                    {
                                        type: 'if',
                                        condition: dx + '<=1',
                                        true: [
                                            { type: 'battle', loc: [nx, ny] }
                                        ]
                                    }
                                ]);
                            }
                        }
                    }
                });
            }

            // 如需强行终止行走可以在这里条件判定：
            // core.stopAutomaticRoute();
        },
        moveDirectly: function (x, y, ignoreSteps) {
            // 瞬间移动；x,y为要瞬间移动的点；ignoreSteps为减少的步数，可能之前已经被计算过
            // 返回true代表成功瞬移，false代表没有成功瞬移

            // 判定能否瞬移到该点
            if (ignoreSteps == null) ignoreSteps = core.canMoveDirectly(x, y);
            if (core.status.checkBlock.haveHunt) return false;
            if (ignoreSteps >= 0) {
                core.clearMap('hero');
                // 获得勇士最后的朝向
                var lastDirection =
                    core.status.route[core.status.route.length - 1];
                if (['left', 'right', 'up', 'down'].indexOf(lastDirection) >= 0)
                    core.setHeroLoc('direction', lastDirection);
                // 设置坐标，并绘制
                core.setHeroLoc('x', x);
                core.setHeroLoc('y', y);
                core.drawHero();
                // 记录录像
                core.status.route.push('move:' + x + ':' + y);
                // 统计信息
                core.status.hero.statistics.moveDirectly++;
                core.status.hero.statistics.ignoreSteps += ignoreSteps;
                if (core.hasFlag('poison')) {
                    core.updateStatusBar(false, true);
                }
                core.checkRouteFolding();
                return true;
            }
            return false;
        },
        parallelDo: function (timestamp) {
            // 并行事件处理，可以在这里写任何需要并行处理的脚本或事件
            // 该函数将被系统反复执行，每次执行间隔视浏览器或设备性能而定，一般约为16.6ms一次
            // 参数timestamp为“从游戏资源加载完毕到当前函数执行时”的时间差，以毫秒为单位

            // 检查当前是否处于游戏开始状态
            if (!core.isPlaying()) return;

            // 执行当前楼层的并行事件处理
            if (core.status.floorId) {
                try {
                    eval(core.floors[core.status.floorId].parallelDo);
                } catch (e) {
                    main.log(e);
                }
            }
        }
    },
    ui: {
        drawStatistics: function () {
            // 浏览地图时参与的统计项目

            return [
                'yellowDoor',
                'blueDoor',
                'redDoor',
                'greenDoor',
                'steelDoor',
                'yellowKey',
                'blueKey',
                'redKey',
                'greenKey',
                'steelKey',
                'redGem',
                'blueGem',
                'greenGem',
                'yellowGem',
                'redPotion',
                'bluePotion',
                'greenPotion',
                'yellowPotion',
                'superPotion',
                'pickaxe',
                'bomb',
                'centerFly',
                'icePickaxe',
                'freezeBadge',
                'earthquake',
                'upFly',
                'downFly',
                'jumpShoes',
                'lifeWand',
                'poisonWine',
                'weakWine',
                'curseWine',
                'superWine',
                'sword1',
                'sword2',
                'sword3',
                'sword4',
                'sword5',
                'shield1',
                'shield2',
                'shield3',
                'shield4',
                'shield5'
                // 在这里可以增加新的ID来进行统计个数，只能增加道具ID
            ];
        }
    }
};
