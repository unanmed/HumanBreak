///<reference path="../../src/types/declaration/core.d.ts" />

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
            core.status.hero.buff ??= {};
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
            core.extractBlocks(floorId);
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
            if (main.mode === 'play' && !main.replayChecking) {
                Mota.require('@motajs/legacy-ui').splitArea();
                Mota.require('@user/data-base').hook.emit('reset');
            } else {
                flags.autoSkill ??= true;
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

            // 游戏获胜事件
            core.ui.closePanel();
            var replaying = core.isReplaying();
            if (replaying) core.stopReplay();
            core.waitHeroToStop(function () {
                reason = core.replaceText(reason);
                core.insertAction(
                    {
                        type: 'text',
                        text: '你的分数是' + core.status.hero.hp,
                        title: reason ?? '恭喜通关'
                    },
                    void 0,
                    void 0,
                    () => {
                        core.events.gameOver(reason ?? '', replaying, norank);
                        if (!noexit) core.status.gameOver = true;
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
                core.insertAction(
                    {
                        type: 'text',
                        text: '你死了。\n如题。',
                        title: reason ?? '结局1'
                    },
                    void 0,
                    void 0,
                    () => {
                        core.events.gameOver(null, replaying);
                        core.status.gameOver = true;
                    }
                );
            });
        },
        changingFloor: function (floorId, heroLoc) {
            // 正在切换楼层过程中执行的操作；此函数的执行时间是“屏幕完全变黑“的那一刻
            // floorId为要切换到的楼层ID；heroLoc表示勇士切换到的位置

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
            Mota.require('@user/legacy-plugin-data')?.autoRemoveMaps?.(floorId);

            // ---------- 重绘新地图；这一步将会设置core.status.floorId ---------- //
            core.drawMap(floorId);

            // 设置勇士的位置
            heroLoc.direction = core.turnDirection(heroLoc.direction);
            core.setHeroLoc('x', heroLoc.x);
            core.setHeroLoc('y', heroLoc.y);
            core.setHeroLoc('direction', heroLoc.direction);

            // 切换楼层BGM
            if (core.status.maps[floorId].bgm) {
                var bgm = core.status.maps[floorId].bgm;
                if (bgm instanceof Array) bgm = bgm[0];
                if (!core.hasFlag('__bgm__')) core.playBgm(bgm);
            }
            // 更改天气
            var weather = core.getFlag('__weather__', null);
            if (!weather && core.status.maps[floorId].weather)
                weather = core.status.maps[floorId].weather;
            if (weather) core.setWeather(weather[0], weather[1]);
            else core.setWeather();

            core.updateDamage();

            // 检查重生怪并重置
            if (!fromLoad) {
                core.extractBlocks(floorId);
                const obj = core.getMapBlocksObj(floorId);
                const floor = core.status.maps[floorId];
                const col = floor.enemy;
                col.list.forEach(v => {
                    const info = v.getRealInfo();
                    if (info.special.has(23)) {
                        const block = obj[`${v.x},${v.y}`];
                        if (block.disable) {
                            block.disable = false;
                            core.setMapBlockDisabled(floorId, v.x, v.y, false);
                            core.maps._updateMapArray(floorId, v.x, v.y);
                        }
                    }
                });
            }

            // ...可以新增一些其他内容，比如创建个画布在右上角显示什么内容等等
        },
        afterChangeFloor: function (floorId) {
            // 转换楼层结束的事件；此函数会在整个楼层切换完全结束后再执行
            // floorId是切换到的楼层

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
            Mota.require('@user/data-base').hook.emit(
                'afterChangeFloor',
                floorId
            );
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

            // 记录录像
            core.status.route.push('fly:' + toId);
            // 传送
            core.ui.closePanel();
            core.changeFloor(toId, stair, loc, null, callback);

            return true;
        }
    },
    control: {
        saveData: function (fromAutosave) {
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
                hero: core.status.hero,
                hard: core.status.hard,
                maps: core.maps.saveMap(),
                route: core.encodeRoute(core.status.route, !fromAutosave),
                values: values,
                version: core.firstData.version,
                guid: core.getGuid(),
                time: new Date().getTime()
            };

            return structuredClone(data);
        },
        loadData: function (data, callback) {
            // 读档操作；从存储中读取了内容后的行为
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

            // 切换到对应的楼层
            core.changeFloor(data.floorId, null, data.hero.loc, 0, function () {
                if (core.hasFlag('__bgm__')) {
                    // 持续播放
                    core.playBgm(core.getFlag('__bgm__'));
                }

                core.removeFlag('__fromLoad__');
                if (callback) callback();
            });

            Mota.require('@user/data-base').hook.emit('loadData');
        },
        updateStatusBar: function () {
            // 检查等级
            core.events.checkLvUp();
            // 更新全地图显伤
            core.updateDamage();
        },
        moveOneStep: function (callback) {
            // 注意，此函数在 2.C 将会被弃用，并移动至 packages-user/data-state/src/state/move.ts 的 HeroMover 中
            // 一些样板内置内容已经移动至上述函数，包括中毒行为等

            // 勇士每走一步后执行的操作。callback为行走完毕后的回调
            // 这个函数执行在“刚走完”的时候，即还没有检查该点的事件和领域伤害等。
            // 请注意：瞬间移动不会执行该函数。如果要控制能否瞬间移动有三种方法：
            // 1. 将全塔属性中的cannotMoveDirectly这个开关勾上，即可在全塔中全程禁止使用瞬移。
            // 2, 将楼层属性中的cannotMoveDirectly这个开关勾上，即禁止在该层楼使用瞬移。
            // 3. 将flag:cannotMoveDirectly置为true，即可使用flag控制在某段剧情范围内禁止瞬移。

            // 增加步数
            core.status.hero.steps++;
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

            // 如需强行终止行走可以在这里条件判定：
            // core.stopAutomaticRoute();
            Mota.require('@user/data-base').hook.emit(
                'moveOneStep',
                nowx,
                nowy,
                core.status.floorId
            );
        },
        moveDirectly: function (x, y, ignoreSteps) {
            // 瞬间移动；x,y为要瞬间移动的点；ignoreSteps为减少的步数，可能之前已经被计算过
            // 返回true代表成功瞬移，false代表没有成功瞬移

            // 判定能否瞬移到该点
            if (ignoreSteps == null) ignoreSteps = core.canMoveDirectly(x, y);
            if (ignoreSteps >= 0) {
                // 中毒也允许瞬移
                if (core.hasFlag('poison')) {
                    const damage = ignoreSteps * core.values.poisonDamage;
                    if (damage >= core.status.hero.hp) return false;
                    core.status.hero.statistics.poisonDamage += damage;
                    core.status.hero.hp -= damage;
                }
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
        }
    }
};
