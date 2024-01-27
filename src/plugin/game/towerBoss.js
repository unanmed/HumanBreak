///<reference path="../../../src/types/core.d.ts" />
import { clip } from './replay.js';

// 1000多行，改不动了，原来什么样就什么样吧

// 智慧boss
// 变量们
var stage = 1,
    hp = 10000,
    seconds = 0,
    boomLocs = [], // 随机轰炸
    heroHp;
// 初始化
function initTowerBoss() {
    stage = 1;
    hp = 10000;
    seconds = 0;
    heroHp = core.status.hero.hp;
    dynamicChangeHp(0, 10000, 10000);
    core.insertAction([{ type: 'sleep', time: 1000, noSkip: true }]);
    setTimeout(bossCore, 1000);
}

// 血条
function healthBar(now, total) {
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
}
// 血量变化
function dynamicChangeHp(from, to, total) {
    var frame = 0,
        speed = (to - from) / 50,
        now = from;
    var interval = window.setInterval(() => {
        frame++;
        if (frame == 50) {
            clearInterval(interval);
            healthBar(to, total);
        }
        now += speed;
        healthBar(now, total);
    }, 20);
}
// boss说话跳字
function skipWord(words, x, y, time) {
    x = x || 0;
    y = y || 16;
    time = time || 3000;
    // 创建画布
    if (!core.dymCanvas.words) core.createCanvas('words', x, y, 480, 24, 135);
    else core.clearMap('words');
    if (flags.wordsTimeOut) clearTimeout(flags.wordsTimeOut);
    dynamicCurtain(y, y + 24, time / 3);
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
}
// 匀变速下降背景
function dynamicCurtain(from, to, time, width) {
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
        core.fillRect('wordsBg', 0, 0, width, ny - from, [180, 180, 180, 0.7]);
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
}
// 攻击boss
function attackBoss() {
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
            dynamicChangeHp(hp, hp - 500, 10000);
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
}
// 核心函数
function bossCore() {
    var interval = window.setInterval(() => {
        if (stage == 1) {
            if (seconds == 8) skipWord('智慧之神：果然，你和别人不一样。');
            if (seconds == 12) skipWord('智慧之神：你知道去躲避那些攻击。');
            if (seconds == 16)
                skipWord(
                    '智慧之神：之前的那些人总会一头撞上我的攻击，悲剧收场。'
                );
            if (seconds == 20)
                skipWord('提示：踩在红圈上可以对智慧之神造成伤害');
            if (seconds > 10) attackBoss();
            if (seconds % 10 == 0) intelligentArrow();
            if (seconds % 7 == 0 && seconds != 0) intelligentDoor();
            if (seconds > 20 && seconds % 13 == 0) icyMomentem();
        }
        if (stage == 1 && hp <= 7000) {
            stage++;
            seconds = 0;
            skipWord('智慧之神：不错小伙子');
            core.pauseBgm();
        }
        if (stage == 2) {
            if (seconds == 4) skipWord('智慧之神：你的确拥有智慧。');
            if (seconds == 8) skipWord('智慧之神：或许你就是那个未来的救星。');
            if (seconds == 12) skipWord('智慧之神：不过，这场战斗才刚刚开始');
            if (seconds == 25) skipWord('提示：方形区域均为危险区域');
            if (seconds == 15)
                setTimeout(() => {
                    core.playSound('thunder.mp3');
                }, 500);
            if (seconds == 16) startStage2();
            if (seconds > 20) attackBoss();
            if (seconds % 4 == 0 && seconds > 20) randomThunder();
            if (seconds > 30 && seconds % 12 == 0) ballThunder();
        }
        if (hp <= 3500 && stage == 2) {
            stage++;
            seconds = 0;
            skipWord('智慧之神：不得不说小伙子');
            core.pauseBgm();
        }
        if (stage >= 3) {
            if (seconds == 4) skipWord('智慧之神：拥有智慧就是不一样。');
            if (seconds == 8) skipWord('智慧之神：不过，你还得再过我一关！');
            if (seconds == 12) startStage3();
            if (seconds == 15) {
                flags.booming = true;
                randomBoom();
            }
            if (seconds > 20) attackBoss();
            if (seconds > 20 && seconds % 10 == 0) chainThunder();
            if (hp == 2000 && stage == 3) {
                stage++;
                flags.booming = false;
                skipWord('智慧之神：还没有结束！');
                startStage4();
                setTimeout(() => {
                    flags.booming = true;
                    randomBoom();
                }, 5000);
            }
            if (hp == 1000 && stage == 4) {
                stage++;
                flags.booming = false;
                skipWord('智慧之神：还没有结束！！！！！！');
                startStage5();
                setTimeout(() => {
                    flags.booming = true;
                    randomBoom();
                }, 5000);
            }
        }
        if (hp == 0) {
            clearInterval(interval);
            clearInterval(flags.boom);
            core.status.hero.hp = heroHp;
            clip('choices:0');
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
}
// ------ 第一阶段 10000~7000血 ------ //
// 技能1 智慧之箭 1000伤害
function intelligentArrow(fromSelf) {
    // 坐标
    var loc = Math.floor(Math.random() * 13 + 1);
    var direction = Math.random() > 0.5 ? 'horizon' : 'vertical';
    // 执行次数
    if (!fromSelf) {
        var times = Math.ceil(Math.random() * 8) + 4;
        var nowTime = 1;
        var times1 = window.setInterval(() => {
            intelligentArrow(true);
            nowTime++;
            if (nowTime >= times) {
                clearInterval(times1);
            }
        }, 200);
    }
    // 防重复
    if (core.dymCanvas['inteArrow' + loc + direction])
        return intelligentArrow(true);
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
        core.createCanvas('inteArrow' + loc + direction, 0, 0, 544, 544, 65);
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
                core.relocateCanvas('inteArrow' + loc + direction, nloc, 0);
            else core.relocateCanvas('inteArrow' + loc + direction, 0, nloc);
            if (nloc < -480) {
                core.deleteCanvas('inteArrow' + loc + direction);
                clearInterval(skill1);
            }
            // 伤害判定
            if (!damaged[loc + direction]) {
                var x = core.status.hero.loc.x,
                    y = core.status.hero.loc.y;
                if (direction == 'horizon') {
                    if (y == loc && Math.floor((480 + nloc) / 32) == x) {
                        damaged[loc + direction] = true;
                        core.drawHeroAnimate('hand');
                        core.status.hero.hp -= 1000;
                        Mota.Plugin.require('pop').addPop(
                            x * 32 + 16,
                            y * 32 + 16,
                            -1000
                        );
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
                        core.drawHeroAnimate('hand');
                        core.status.hero.hp -= 1000;
                        Mota.Plugin.require('pop').addPop(
                            x * 32 + 16,
                            y * 32 + 16,
                            -1000
                        );
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
}
// 技能2 智慧之门 随机传送
function intelligentDoor() {
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
}
// 技能3 万冰之势 全屏随机转换滑冰 如果转换时在滑冰上造成5000点伤害
function icyMomentem() {
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
            core.setBgFgBlock('bg', 167, locs[index][0], locs[index][1]);
            core.drawAnimate('ice', locs[index][0], locs[index][1]);
            if (x == locs[index][0] && y == locs[index][1]) {
                core.drawHeroAnimate('hand');
                core.status.hero.hp -= 5000;
                Mota.Plugin.require('pop').addPop(
                    x * 32 + 16,
                    y * 32 + 16,
                    -5000
                );
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
}
// ------ 第二阶段 7000~3500 ------ //
// 开始第二阶段
function startStage2() {
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
}
// ----- 打雷相关 ----- //
// 随机打雷
function randomThunder() {
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
        drawThunder(x, y, power);
    }, 1000);
}
// 绘制
function drawThunder(x, y, power) {
    var route = getThunderRoute(x * 32 + 16, y * 32 + 16, power);
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
    getThunderRoute(x, y, power);
    // 闪一下
    var frame1 = 0,
        alpha = 0.5;
    if (!core.dymCanvas.flash) core.createCanvas('flash', 0, 0, 480, 480, 160);
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
}
// 获得雷电路径
function getThunderRoute(x, y, power) {
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
}
// 打雷伤害判定
function getThunderDamage(x, y, power) {
    var hx = core.status.hero.loc.x,
        hy = core.status.hero.loc.y;
    if (Math.abs(hx - x) <= 1 && Math.abs(hy - y) <= 1) {
        core.status.hero.hp -= 3000 * power;
        Mota.Plugin.require('pop').addPop(
            x * 32 + 16,
            y * 32 + 16,
            -3000 * power
        );
        core.updateStatusBar();
        if (core.status.hero.hp < 0) {
            core.status.hero.hp = 0;
            core.updateStatusBar();
            core.events.lose();
            return;
        }
    }
}
// ----- 打雷 END ----- //
// 球形闪电 横竖
function ballThunder() {
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
                            ((Math.floor((nx - 16 - 4 * now) / 32) == x ||
                                Math.floor((nx - 16 + 4 * now) / 32) == x) &&
                                locs[i][1] == y) ||
                            ((Math.floor((ny - 16 - 4 * now) / 32) == y ||
                                Math.floor((ny - 16 + 4 * now) / 32) == y) &&
                                locs[i][0] == x)
                        ) {
                            damaged[i] = true;
                            core.status.hero.hp -= 3000;
                            Mota.Plugin.require('pop').addPop(
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
}
// ------ 第三阶段 3500~0 ------ //
function startStage3() {
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
        core.drawImage('tower7', 'tower7.jpeg', 360, 0, 32, 480, 0, 0, 32, 480);
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
}
// 进入第四阶段
function startStage4() {
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
        core.drawImage('tower7', 'tower7.jpeg', 360, 0, 64, 480, 0, 0, 64, 480);
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
}
// 进入第五阶段
function startStage5() {
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
        core.drawImage('tower7', 'tower7.jpeg', 360, 0, 96, 480, 0, 0, 96, 480);
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
}
// 链状闪电 随机连接 碰到勇士则受伤
function chainThunder() {
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
                getChainRoute(locs);
                core.deleteCanvas('chainDanger');
            }, 1000);
        }
        now++;
    }, 100);
}
// 链状闪电 动画
function chainAnimate(route) {
    if (!route) return chainThunder();
    // 画布
    if (!core.dymCanvas.chain) core.createCanvas('chain', 0, 0, 480, 480, 65);
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
            core.fillCircle('chain', route[0][0], route[0][1], 7, '#ffffff');
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
        lineDamage(
            route[now][0],
            route[now][1],
            route[now + 1][0],
            route[now + 1][1],
            4000
        );
        now++;
    }, 20);
}
// 链状闪电 获得闪电路径
function getChainRoute(locs) {
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
            chainAnimate(routes);
        }
    }, 2);
}
// 随机轰炸
function randomBoom() {
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
    boomingAnimate();
}
// 随机轰炸 动画
function boomingAnimate() {
    // 直接setInterval
    if (!core.dymCanvas.boom) core.createCanvas('boom', 0, 0, 480, 480, 65);
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
            core.strokeCircle('boom', x, y, radius, [255, 50, 50, alpha], 2);
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
                    y - (20 * (85 - loc[2]) + 2.8 * Math.pow(85 - loc[2], 2));
                core.drawImage('boom', 'boom.png', x - 18, h - 80, 36, 80);
            }
            if (loc[2] == 85) {
                core.drawAnimate('explosion1', (x - 16) / 32, (y - 16) / 32);
                boomLocs.splice(index, 1);
                if (boomLocs.length == 0) core.deleteCanvas('boom');
                // 伤害判定
                var hx = core.status.hero.loc.x,
                    hy = core.status.hero.loc.y;
                if (loc[0] == hx && loc[1] == hy) {
                    core.status.hero.hp -= 3000;
                    Mota.Plugin.require('pop').addPop(
                        x * 32 + 16,
                        y * 32 + 16,
                        -3000
                    );
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
}
// 直线型伤害判定
function lineDamage(x1, y1, x2, y2, damage) {
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
            var n1 = ((y2 - y1) / (x2 - x1)) * (loc1[0] - x1) + y1 - loc1[1],
                n2 = ((y2 - y1) / (x2 - x1)) * (loc2[0] - x1) + y1 - loc2[1];
            if (n1 * n2 <= 0) {
                core.status.hero.hp -= damage;
                Mota.Plugin.require('pop').addPop(
                    x * 32 + 16,
                    y * 32 + 16,
                    -damage
                );
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
            var n1 = ((y2 - y1) / (x2 - x1)) * (loc1[0] - x1) + y1 - loc1[1],
                n2 = ((y2 - y1) / (x2 - x1)) * (loc2[0] - x1) + y1 - loc2[1];
            if (n1 * n2 <= 0) {
                core.status.hero.hp -= damage;
                Mota.Plugin.require('pop').addPop(
                    x * 32 + 16,
                    y * 32 + 16,
                    -damage
                );
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
}

core.plugin.towerBoss = {
    initTowerBoss
};

export {};
