///<reference path="./src/types/core.d.ts"/>
////////// 回合制总览 ///////////////

function screenFlash(color, time, times, moveMode) {
    return new Promise(res => {
        core.screenFlash(color, time, times, moveMode, res);
    });
} // 闪烁事件转解析脚本

function sleep(time) {
    return new Promise(res => {
        setTimeout(res, time);
    });
} // 等待事件转解析脚本

function setCurtain(color, time, moveMode) {
    return new Promise(res => {
        core.setCurtain(color, time, moveMode, res);
    });
} // 改变画面色调事件转解析脚本

function showImage(code, image, sloc, loc, opacityVal, time) {
    return new Promise(res => {
        core.showImage(code, image, sloc, loc, opacityVal, time, res);
    });
} //图片移动事件转解析脚本

function hideImage(code, time) {
    return new Promise(res => {
        core.hideImage(code, time, res);
    });
} // 隐藏图片事件转解析脚本

function choices_libs(content, choices, width, ctx) {
    return new Promise(res => {
        core.drawChoices(content, choices, width, ctx, res);
    });
} // 选项框事件转解析脚本

// 固定回合制内容获取 step 1
this._turnBattle = function (enemyId, mon_mdef, insertAction) {
    // 获得楼层应需图片
    var BgImage = null;
    let floorId = core.status.floorId;
    switch (floorId) {
        case 'AT1':
            BgImage = 'turnBg1.jpg';
            break;
    }
    // 获得主角基础图片
    var heroBg = [];
    // 获得主角形象
    let heroId = core.getFlag('heroId');
    if (heroId == 0) heroBg.push('heroTurnImage_lx.png');
    if (heroId == 1) heroBg.push('heroTurnImage_peixi.png');

    let name = heroBg[0].replace('.png', '');
    if (core.material.images.images[name + 1 + '.png'])
        heroBg.push(name + 1 + '.png'); // 如果存在主角战损图片，则加入新图片
    if (core.material.images.images[name + 2 + '.png'])
        heroBg.push(name + 2 + '.png');
    if (core.material.images.images[name + 3 + '.png'])
        heroBg.push(name + 3 + '.png');

    // 怪物合集
    // 获得怪物基础图片和音乐
    let monName = null; // 怪物名称
    let monHpCaseNum = 1; // 怪物血条倍率
    let monImage = null; // 怪物图像
    let bgm = null; // 背景音乐

    switch (enemyId) {
        case 'E418':
            monName = '森林黄莱姆';
            monHpCaseNum = 2;
            monImage = 'slime1.png';
            bgm = 'turnBgm1.mp3';
            break;
    }

    // 如果怪物图像存在分歧
    var monBgList = [monImage];
    let name2 = monImage.replace('.png', '');
    if (core.material.images.images[name2 + 1 + '.png'])
        monBgList.push(name2 + 1 + '.png'); // 如果存在怪物战损图片，则加入新图片
    if (core.material.images.images[name2 + 2 + '.png'])
        monBgList.push(name2 + 2 + '.png');
    if (core.material.images.images[name2 + 3 + '.png'])
        monBgList.push(name2 + 3 + '.png');

    // 获得主角基础属性
    // 基础属性
    let heroHp =
        core.getFlag('turnHeroHp') ||
        Math.min(
            core.status.hero.hp,
            Math.max(core.status.hero.mdef * 10, core.status.hero.lv * 100)
        ); // 回合制中，若没有特殊情况，主角所持有的最高生命值不超过魔防的10倍,如果魔防太低，那么将会取魔防 + 自身等级 * 100 作为自己的生命值
    const enemyInfo = core.enemys.getEnemyInfo('greenSlime');
    let heroHpMax =
        core.getFlag('turnHeroHpMax') ||
        Math.min(
            core.status.hero.hp,
            Math.max(core.status.hero.mdef * 10, core.status.hero.lv * 100)
        );
    let heroAtk = core.getFlag('turnHeroAtk') || core.status.hero.atk;
    let heroDef = core.getFlag('turnHeroDef') || core.status.hero.def;
    let heroMdef = core.getFlag('turnHeroMdef') || core.status.hero.mdef;
    let heroGodAtk = enemyInfo.god_per_damage || 0; // 神圣攻击
    let physics_resist = enemyInfo.physics_resist || 0; // 物伤抵抗
    let pray_drink = enemyInfo.pray_drink || 0; // 神圣祷吸

    // 获得怪物基础属性
    // 如果属性不是初始值*在回合战中出现过变动，那么将使用变动量）
    let Nx = core.nextX();
    let Ny = core.nextY();
    let thisMonHp =
        core.getFlag('turnMonHp') || core.getEnemyInfo(enemyId).hp || 0;
    let thisMonAtk =
        core.getFlag('turnMonAtk') || core.getEnemyInfo(enemyId).atk || 0;
    let thisMonDef =
        core.getFlag('turnMonDef') || core.getEnemyInfo(enemyId).def || 0;
    let thisMonHpMax =
        core.getFlag('turnMonHpMax') || core.getEnemyInfo(enemyId).hp;
    let thisMonMdef = mon_mdef || 0;

    // 获得主角特技文本和效果
    // name 名称 text 文本 flag 变量开关名称 freezeTurn 冷却时间（可受增益影响，若不填则可随意使用） sp ：耗费蓝量（可不填）action：行为  value:行为的数值，特殊情况下不填。effect 对敌人造成的特殊影响，若填此项，则 time 也需要填，animate 技能动画,order,动画次数
    let heroSpecailList = [];
    // 所有特技
    let moreList = [];
    moreList.push(
        {
            name: '普通攻击',
            text: '一次普通的攻击',
            flag: 'attack_skill',
            action: 'atk',
            value: heroAtk - thisMonDef || 0,
            animate: 'hand',
            pray_drink: pray_drink > 0 ? thisMonAtk * pray_drink * 2 : null // 类似于普通攻击或者多连击可以触发神圣祷吸
        },
        {
            name:
                '二连击' +
                (core.getFlag('doubleAttack_skill_freeze') > 0
                    ? '(冷却 ' +
                      core.getFlag('doubleAttack_skill_freeze') +
                      ' 回合）'
                    : ''),
            text: '对敌人进行连续两次普通攻击。冷却时间3回合',
            flag: 'doubleAttack_skill',
            freezeTurn:
                3 - core.getFlag('doubleAttack_skill_reduceFreeze') || 3,
            action: 'atk',
            value: (heroAtk - thisMonDef) * 2 || 0,
            animate: 'hand',
            order: 2,
            pray_drink: pray_drink > 0 ? thisMonAtk * pray_drink * 2 : null // 类似于普通攻击或者多连击可以触发神圣祷吸
        },
        {
            name:
                '闪烁' +
                (core.getFlag('flicker_skill_freeze') > 0
                    ? '(冷却 ' +
                      core.getFlag('flicker_skill_freeze') +
                      ' 回合）'
                    : ''),
            text: '发出耀光，对敌人造成1000%神圣伤害，并使怪物此回合和下回合眩晕。冷却时间4回合',
            flag: 'flicker_skill',
            freezeTurn: 4 - core.getFlag('flicker_skill_reduceFreeze') || 4,
            action: 'atk',
            value: heroGodAtk * 10 || 0,
            effect: 'swim',
            time: 2,
            animate: 'light1'
        }
    );
    // 获得主角已持有的特级，没学习的不算在内(需区分不同的角色)
    for (let i = 0; i < moreList.length; i++) {
        if (core.getFlag('heroId') == core.getFlag(moreList[i].flag)) {
            heroSpecailList.push(moreList[i]);
        }
    }
    // 获得怪物特技文本和效果
    let monSpecailList = [];
    // 1.怪物id 2.特技种类(可以有多个，按顺序使用并循环 例如atk:直接伤害类) name:技能名称，action:行为，value:行为的数值，特殊情况下不填，animate：行为动画，
    // 3.turnEnd 回合后状态变动(turnEndOccur:变动效果，例如cutDef为降低它自己的防御力，turnEndValue：变动数值,effect：变动回合时长，若填max则持续无限)，
    // 4.rival 对手（主角）受到的影响特效,feedback 反馈效果 se：音效
    monSpecailList.push({
        enemyId: 'E418', // 森林黄莱姆 剧情战斗1层
        special: [
            {
                name: '普通攻击',
                action: 'atk',
                value: thisMonAtk,
                animate: 'hand'
            }, // 普通攻击
            {
                name: '重击',
                action: 'atk',
                value: thisMonAtk * 1.5,
                animate: 'hand'
            }, // 重击1.5倍攻击伤害
            {
                name: '蓄力',
                action: 'addAtk',
                value: thisMonAtk,
                animate: 'hand'
            }, // 蓄力，使攻击提升至2倍
            {
                name: '粘液重创',
                action: 'Matk',
                value: thisMonAtk,
                animate: 'hand'
            }, // 无视防御的粘液重创,之后防御力降低100%，持续两回合
            { name: '发呆', action: 'sleep' }, // 发呆，什么也不做
            { name: '发呆', action: 'sleep' } // 发呆，什么也不做
        ],
        turnEnd: [
            null,
            null,
            null,
            {
                name: '怪物的防御力降低50%!',
                turnEndOccur: 'monDefReduce',
                value: 0.5,
                effect: 2
            },
            null,
            null
        ],
        rival: [
            { feedback: 'hit' },
            { feedback: 'hit' },
            null,
            { feedback: 'bigHit' },
            null,
            null
        ]
    });
    ////////// 回合制开始后的开场舞台 //////////////
    if (insertAction) {
        // 检查是否为执行内容而非调用内容，如果是调用内容，跳过该步骤
        /*let cc = async function firstBattle() {
				const toWait_1 = [ // 需要不等待执行完毕的内容第一组
					screenFlash([255, 255, 255, 1], 300, 1),
					sleep(50),
					setCurtain([0, 0, 0, 1], 800, "easeIn"),
					core.drawWarning(Nx, Ny, '')
				]
				core.lockControl();
				core.pauseBgm();
				core.playBgm("turnBgm1.mp3");
				core.playSound("Battle1.ogg");
				await Promise.all(toWait_1);
				await showImage(31, monImage, [0, 0, null, null], [240, 0, null, null], 1, 0);
				await showImage(32, heroBg[0], [0, 0, null, null], [-25, 155, 180, 268], 1, 0);
				await showImage(30, BgImage, [0, 0, null, null], [0, 0, null, null], 1, 0);
				await showImage(100, "hei.png", [0, 0], null, 1, 0);
				await sleep(500);
				await setCurtain(null, 1);
				core.drawUIEventSelector(10, "winskin.png", 0, 152, 155, 268);
				await hideImage(100, 700);
				let UI = "turnBattleUI";
				core.createCanvas(UI, 0, 0, 416, 416, 151);
				core.fillBoldText(UI, "HP", 170, 378, [255, 99, 99, 1], [36, 31, 5, 1], "bold 18px gameFont");
				core.fillBoldText(UI, "MP", 172, 390, [140, 176, 255, 1], [36, 31, 5, 1], "bold 14px gameFont");
				core.fillBoldText(UI, "Atk", 160, 408, [255, 255, 255, 1], null, "bold 16px gameFont");
				core.fillBoldText(UI, "Def", 240, 408, [255, 255, 255, 1], null, "bold 16px gameFont");
				core.fillBoldText(UI, "Shd", 320, 408, [255, 255, 255, 1], null, "bold 16px gameFont");
				core.fillBoldText(UI, "Atk", 5, 70, [255, 255, 255, 1], null, "bold 16px gameFont");
				core.fillBoldText(UI, "Def", 85, 70, [255, 255, 255, 1], null, "bold 16px gameFont");
				core.fillBoldText(UI, "Shd", 165, 70, [255, 255, 255, 1], null, "bold 16px gameFont");
				core.strokeRect(UI, 200, 360, 200, 30, [123, 176, 193, 1], 2);
				core.drawLine(UI, 200, 380, 400, 380, [123, 176, 193, 1], 2);
				core.drawLine(UI, 200, 390, 400, 390, [94, 143, 159, 1], 2);
				core.drawLine(UI, 200, 360, 400, 360, [94, 143, 159, 1], 2);
				core.strokeRect(UI, 10, 30, 240, 20, [123, 176, 193, 1], 2);
				core.drawLine(UI, 10, 50, 250, 50, [94, 143, 159, 1], 2);
				core.drawLine(UI, 10, 30, 250, 30, [193, 226, 236, 1], 2);
				core.plugin._turnBattleDrawNum(enemyId);*/

        core.insertAction([
            { type: 'pauseBgm' },
            { type: 'playBgm', name: 'turnBgm1.mp3' },
            { type: 'playSound', name: 'Battle1.ogg' },
            {
                type: 'screenFlash',
                color: [255, 255, 255, 1],
                time: 300,
                times: 1,
                async: true
            },
            { type: 'sleep', time: 50 },
            {
                type: 'setCurtain',
                color: [0, 0, 0, 1],
                time: 800,
                moveMode: 'easeIn',
                keep: true,
                async: true
            },
            {
                type: 'function',
                function:
                    'function(){\ncore.drawWarning(' +
                    Nx +
                    ',' +
                    Ny +
                    ", '');\n}"
            },
            { type: 'waitAsync' },
            {
                type: 'showImage',
                code: 26,
                image: monImage,
                sloc: [0, 0, ,],
                loc: [240, 30, ,],
                opacity: 1,
                time: 0
            },
            {
                type: 'showImage',
                code: 27,
                image: heroBg[0],
                sloc: [0, 0, ,],
                loc: [-25, 155, 180, 268],
                opacity: 1,
                time: 0
            },
            {
                type: 'showImage',
                code: 25,
                image: BgImage,
                sloc: [0, 0, ,],
                loc: [0, 0, ,],
                opacity: 1,
                time: 0
            },
            {
                type: 'showImage',
                code: 100,
                image: 'hei.png',
                loc: [0, 0],
                opacity: 1,
                time: 0
            },
            { type: 'sleep', time: 500 },
            { type: 'setCurtain', time: 1 },
            {
                type: 'drawSelector',
                image: 'winskin.png',
                code: 31,
                x: 0,
                y: 152,
                width: 155,
                height: 268
            },
            { type: 'hideImage', code: 100, time: 700 },
            {
                type: 'previewUI',
                action: [
                    { type: 'setAttribute', alpha: 1, z: 130 },
                    {
                        type: 'fillBoldText',
                        x: 170,
                        y: 378,
                        style: [255, 99, 99, 1],
                        strokeStyle: [36, 31, 5, 1],
                        font: 'bold 18px gameFont',
                        text: 'HP'
                    },
                    {
                        type: 'fillBoldText',
                        x: 172,
                        y: 390,
                        style: [140, 176, 255, 1],
                        strokeStyle: [36, 31, 5, 1],
                        font: 'bold 14px gameFont',
                        text: 'MP'
                    },
                    {
                        type: 'fillBoldText',
                        x: 160,
                        y: 408,
                        style: [255, 255, 255, 1],
                        font: 'bold 16px gameFont',
                        text: 'Atk:'
                    },
                    {
                        type: 'fillBoldText',
                        x: 240,
                        y: 408,
                        style: [255, 255, 255, 1],
                        font: 'bold 16px gameFont',
                        text: 'Def:'
                    },
                    {
                        type: 'fillBoldText',
                        x: 320,
                        y: 408,
                        style: [255, 255, 255, 1],
                        font: 'bold 16px gameFont',
                        text: 'Shd:'
                    },
                    {
                        type: 'fillBoldText',
                        x: 5,
                        y: 70,
                        style: [255, 255, 255, 1],
                        font: 'bold 16px gameFont',
                        text: 'Atk:'
                    },
                    {
                        type: 'fillBoldText',
                        x: 85,
                        y: 70,
                        style: [255, 255, 255, 1],
                        font: 'bold 16px gameFont',
                        text: 'Def:'
                    },
                    {
                        type: 'fillBoldText',
                        x: 165,
                        y: 70,
                        style: [255, 255, 255, 1],
                        font: 'bold 16px gameFont',
                        text: 'Shd:'
                    },
                    {
                        type: 'strokeRect',
                        x: 200,
                        y: 360,
                        width: 200,
                        height: 30,
                        style: [123, 176, 193, 1],
                        lineWidth: 2
                    },
                    {
                        type: 'drawLine',
                        x1: 200,
                        y1: 380,
                        x2: 400,
                        y2: 380,
                        style: [123, 176, 193, 1],
                        lineWidth: 2
                    },
                    {
                        type: 'drawLine',
                        x1: 200,
                        y1: 390,
                        x2: 400,
                        y2: 390,
                        style: [94, 143, 159, 1],
                        lineWidth: 2
                    },
                    {
                        type: 'drawLine',
                        x1: 200,
                        y1: 360,
                        x2: 400,
                        y2: 360,
                        style: [193, 226, 236, 1],
                        lineWidth: 2
                    },
                    {
                        type: 'strokeRect',
                        x: 10,
                        y: 30,
                        width: 240,
                        height: 20,
                        style: [123, 176, 193, 1],
                        lineWidth: 2
                    },
                    {
                        type: 'drawLine',
                        x1: 10,
                        y1: 50,
                        x2: 250,
                        y2: 50,
                        style: [94, 143, 159, 1]
                    },
                    {
                        type: 'drawLine',
                        x1: 10,
                        y1: 30,
                        x2: 250,
                        y2: 30,
                        style: [193, 226, 236, 1],
                        lineWidth: 2
                    }
                ]
            },
            {
                type: 'function',
                function:
                    "function(){\ncore.plugin._turnBattleDrawNum('" +
                    enemyId +
                    "');\n}"
            }
        ]);
    }
    return {
        BgImage: BgImage,
        heroId: heroId,
        heroBg: heroBg,
        monName: monName,
        monImage: monImage,
        monBgList: monBgList,
        monHpCaseNum: monHpCaseNum,
        heroHp: heroHp,
        heroheroHpMax: heroHpMax,
        heroAtk: heroAtk,
        heroDef: heroDef,
        heroMdef: heroMdef,
        thisMonHp: thisMonHp,
        thisMonHpMax: thisMonHpMax,
        thisMonAtk: thisMonAtk,
        thisMonDef: thisMonDef,
        thisMonMdef: thisMonMdef,
        heroSpecailList: heroSpecailList,
        monSpecailList: monSpecailList
    };
};
/////// 循环绘制内容预备（需要不断变动的绘制内容） /////////

// 绘制变动数据（如果为战斗刚刚开始，则跳过执行双方变动数据,绘制固定数据）
this._turnBattleDrawNum = function (enemyId) {
    // 回合数据
    let turnInfo = core.plugin._turnBattle(enemyId, null, null);
    let BgImage = turnInfo.BgImage; // 场景图像
    let monName = turnInfo.monName; // 怪物名称
    let monImage = turnInfo.monImage; // 怪物图像
    let monBgList = turnInfo.monBgList; // 怪物图像合集（如果存在多张将替代monImage）
    if (monBgList > 1) {
    }
    let heroImageList = turnInfo.heroBg; // 主角图像合集

    // 主角血条量（战斗初始为满条，在下面条件分歧中进行改变）
    let heroHpCase = 1;
    // 主角蓝条量（战斗初始为满条，在下面条件分歧中进行改变）
    let heroSpCase = 1;
    // 怪物血条量（战斗初始为满条，在下面条件分歧中进行改变）
    let monHpCase = 1;
    // 属性获取
    let heroHp = core.getFlag('turnHeroHp') || turnInfo.heroHp || 0,
        heroHpMax = core.getFlag('turnHeroHpmax') || heroHp || 0,
        heroAtk = core.getFlag('turnHeroAtk') || turnInfo.heroAtk || 0,
        heroDef = core.getFlag('turnHeroDef') || turnInfo.heroDef || 0,
        heroMdef = core.getFlag('turnHeroMdef') || turnInfo.heroMdef || 0;
    let heroSp = turnInfo.sp || 0;
    let heroSpMax = turnInfo.spmax || 0;
    let monHp = core.getFlag('turnMonHp') || turnInfo.thisMonHp || 0,
        monHpMax = core.getFlag('turnMonHpmax') || turnInfo.thisMonHpMax || 0,
        monAtk = core.getFlag('turnMonAtk') || turnInfo.thisMonAtk || 0,
        monDef = core.getFlag('turnMondef') || turnInfo.thisMonDef || 0,
        monMdef = core.getFlag('turnMonMdef') || turnInfo.thisMonMdef || 0;
    // 如果不是初始回合，则需要调用flag的数据
    let turn = core.getFlag('thisTurn') || 1;
    if (core.getFlag('thisTurn') > 1) {
        if (core.getFlag('turnHeroHp'))
            heroHpCase = core.getFlag('turnHeroHp') / turnInfo.heroHp; // 如果主角血条发生过变化，则变动百分比
        if (core.getFlag('turnHeroSp'))
            heroSpCase = core.getFlag('turnMonSp') / turnInfo.heroSp;
        if (core.getFlag('turnMonHp'))
            monHpCase = core.getFlag('turnMonHp') / turnInfo.thisMonHp; // 如果怪物血条发生过变化，则变动百分比
    } else {
        // 如果只是初始回合，则直接搬运首发函数的回调
        heroHp = turnInfo.heroHp;
        heroHpMax = heroHp;
        heroAtk = turnInfo.heroAtk;
        heroDef = turnInfo.heroDef;
        heroMdef = turnInfo.heroMdef;
        heroSp = turnInfo.sp || 0;
        heroSpMax = turnInfo.spmax || 0;
        monHp = turnInfo.thisMonHp;
        monHpMax = turnInfo.thisMonHpMax;
        monAtk = turnInfo.thisMonAtk;
        monDef = turnInfo.thisMonDef;
        monMdef = turnInfo.thisMonMdef;

        core.insertAction([
            {
                type: 'fillBoldText',
                x: 10,
                y: 20,
                style: [255, 255, 255, 1],
                font: 'bold 20px gameFont',
                text: monName
            },
            {
                type: 'fillBoldText',
                x: 40,
                y: 70,
                style: [255, 255, 255, 1],
                strokeStyle: [255, 2, 2, 1],
                font: 'bold 12px gameFont',
                text: monAtk
            },
            {
                type: 'fillBoldText',
                x: 120,
                y: 70,
                style: [255, 255, 255, 1],
                strokeStyle: [38, 48, 255, 1],
                font: 'bold 12px gameFont',
                text: monDef
            },
            {
                type: 'fillBoldText',
                x: 200,
                y: 70,
                style: [255, 255, 255, 1],
                strokeStyle: [30, 255, 24, 1],
                font: 'bold 12px gameFont',
                text: monMdef
            },
            {
                type: 'fillBoldText',
                x: 195,
                y: 408,
                style: [255, 255, 255, 1],
                strokeStyle: [255, 2, 2, 1],
                font: 'bold 12px gameFont',
                text: heroAtk
            },
            {
                type: 'fillBoldText',
                x: 275,
                y: 408,
                style: [255, 255, 255, 1],
                strokeStyle: [38, 48, 255, 1],
                font: 'bold 12px gameFont',
                text: heroDef
            },
            {
                type: 'fillBoldText',
                x: 355,
                y: 408,
                style: [255, 255, 255, 1],
                strokeStyle: [30, 255, 24, 1],
                font: 'bold 12px gameFont',
                text: heroMdef || 0
            },
            {
                type: 'fillRect',
                x: 12,
                y: 32,
                width: 236 * monHpCase,
                height: 16,
                radius: 4,
                style: [255, 70, 70, 1]
            },
            {
                type: 'fillRect',
                x: 12,
                y: 32,
                width: 234 * monHpCase,
                height: 2,
                radius: 4,
                style: [255, 147, 147, 1]
            },
            {
                type: 'fillRect',
                x: 202,
                y: 362,
                width: 196 * heroHpCase,
                height: 16,
                radius: 4,
                style: [255, 70, 70, 1]
            },
            {
                type: 'fillRect',
                x: 202,
                y: 362,
                width: 194 * heroHpCase,
                height: 2,
                radius: 4,
                style: [255, 147, 147, 1]
            },
            {
                type: 'if',
                condition: "'" + heroSp > 0 + "'",
                true: [
                    {
                        type: 'fillRect',
                        x: 202,
                        y: 382,
                        width: 196 * heroSpCase,
                        height: 6,
                        style: [175, 182, 255, 1]
                    }
                ]
            },
            {
                type: 'fillBoldText',
                x: 14,
                y: 45,
                style: [255, 255, 255, 1],
                strokeStyle: [0, 0, 0, 1],
                font: 'bold 14px gameFont',
                text: monHp + ' / ' + monHpMax
            },
            {
                type: 'fillBoldText',
                x: 204,
                y: 375,
                style: [255, 255, 255, 1],
                strokeStyle: [0, 0, 0, 1],
                font: 'bold 14px gameFont',
                text: heroHp + ' / ' + heroHpMax
            },
            {
                type: 'fillBoldText',
                x: 204,
                y: 390,
                style: [255, 255, 255, 1],
                strokeStyle: [0, 0, 0, 1],
                font: 'bold 12px gameFont',
                text: heroSp || 0 + ' / ' + heroSpMax || 0
            },
            {
                type: 'function',
                function: 'function(){\ncore.displayChapter()\n}'
            },
            { type: 'sleep', time: 2800 },
            {
                type: 'function',
                function: 'function(){\ncore.displayChapter_1(1)\n}'
            },
            { type: 'sleep', time: 2800 },
            {
                type: 'function',
                function:
                    "function(){\ncore.plugin._turnBattleNowAction('" +
                    enemyId +
                    "')\n}"
            }
        ]);
    }
};

// 当前回合循序渐进执行事件流导入函数
this._turnBattleNowAction = function (enemyId) {
    // 检查回合数，如果没检查到回合数，则默认第一回合，并跳过第二步骤
    if (core.getFlag('thisTurn') > 1) {
        // 执行步骤二
        core.plugin._turnBattleHeroInfo(enemyId);
    } else core.plugin._turnBattleManage(enemyId); // 直接进入主角行动选择阶段
    // 执行一次回合预览后，立即输出
};

// 下一回合数
this._turnBattlePrepareInfo = function () {
    let turn = core.getFlag('thisTurn') || 1;
    core.setFlag('thisTurn', turn++);
    return turn++;
};

// step 2 检测当前回合末主角属性是否受到影响，会替换下一回合主角的属性
this._turnBattleHeroInfo = function (enemyId, click) {
    // 怪物id，主角
    // 当前回合
    let turn = core.getFlag('thisTurn') || 1;
    // 回合数据
    let turnInfo = core.plugin._turnBattle(enemyId, null, null);
    // 设置各属性变化变量(百分比)
    let HpReg = 1,
        HpMaxReg = 1,
        AtkReg = 1,
        DefReg = 1,
        MdefReg = 1;
    //////// 检测该回合是否有影响主角属性的各类效果
    //// 检测当前怪物特技的回合末影响 step 2-1
    let TEspe = null; // 对应回合数的技能
    let TEend = null; // 对应技能的影响效果
    let TEeff = null; // 对应技能的影响回合时长
    let TEvalue = null; // 对应技能影响效果的数值
    // 逻辑：怪物会根据技能列表的释放顺序依次使用技能，当技能列表项目全部使用完毕后，将会重新开始循环使用，该函数只涉及回合末buff影响
    for (let i = 0; i < turnInfo.monSpecailList.length; i++) {
        if (turnInfo.monSpecailList[i].enemyId == enemyId) {
            // 检测哪个是战斗怪物的数据
            // 根据怪物特技数组元素求余，找到相对应的使用技能
            let length1 = turnInfo.monSpecailList[i].turnEnd.length; // 判断有多少个技能需要释放
            let realTurn = (turn % length1) - 1; // 应当释放的技能 -1代表数组需要额外-1
            TEspe = turnInfo.monSpecailList[i].turnEnd[realTurn];
            TEend = TEspe.turnEndOccur;
            TEeff = TEspe.effect;
            TEvalue = TEspe.value;
        }
    }
    // 如果是新触发的怪物影响主角buff，且技能如果存在效果一些buff效果，则新建一个flag, 值为持续效果THeff，就算原先存在buff也会直接覆盖（不论这个效果高低，低的也会覆盖高的）
    if (TEeff) {
        core.setFlag(TEend + '_time', TEeff + 1);
    }

    // 怪物导致主角属性变化
    switch (TEend) {
        case 'heroAtkReduce': // 主角攻击减弱
            if (core.getFlag(TEend + '_time') > 0) {
                AtkReg -= TEend.value;
                core.addFlag(TEend + '_time', -1); // 减少回合持续效果1点
            }
            break;
        case 'heroDefReduce': // 主角防御减弱
            if (core.getFlag(TEend + '_time') > 0) {
                DefReg -= TEend.value;
                core.addFlag(TEend + '_time', -1); // 减少回合持续效果1点
            }
            break;
        case 'heroHpMaxReduce': // 主角生命值上限降低
            if (core.getFlag(TEend + '_time') > 0) {
                HpMaxReg -= TEend.value;
                core.addFlag(TEend + '_time', -1); // 减少回合持续效果1点
            }
            break;
    }

    //// 检测当前主角自身特技给自己带来的回合末影响  step 2-2
    let THend = null; // 回合末效果
    let THeff = null; // 效果持续时间
    let THflag = null; // 技能启用条件

    // 检查使用的是哪一个技能（玩家点击技能类选项框的选择项）
    for (var i = 0; i < turnInfo.heroSpecailList.length; i++) {
        if (
            turnInfo.heroSpecailList[i].flag &&
            click == turnInfo.heroSpecailList[i].name
        ) {
            // 如果技能开启过且玩家点击特技的名称是库里的名称，则导入
            THend = turnInfo.heroSpecailList[i].effect || null;
            THeff = turnInfo.heroSpecailList[i].time;
            THflag = turnInfo.heroSpecailList[i].flag;
        }
    }

    // 如果是新触发的主角自身buff，且技能如果存在效果一些buff效果，则新建一个flag, 值为持续效果THeff，就算原先存在buff也会直接覆盖（不论这个效果高低，低的也会覆盖高的）
    if (THflag && THeff) {
        core.setFlag(THend + '_time', THeff + 1);
    }

    // 主角导致自己属性变化
    switch (THend) {
        case 'heroAtkAdd': // 主角攻击增强
            if (core.getFlag('heroAtkAdd' + '_time') > 0) {
                AtkReg += THend.value;
                core.addFlag('heroAtkAdd' + '_time', -1); // 减少回合持续效果1点
            }
            break;
        case 'heroDefAdd': // 主角防御增强
            if (core.getFlag('heroDefAdd' + '_time') > 0) {
                DefReg += THend.value;
                core.addFlag('heroDefAdd' + '_time', -1); // 减少回合持续效果1点
            }
            break;
        case 'heroHpMaxAdd': // 主角生命值上限增加
            if (core.getFlag('heroHpMaxAdd' + '_time') > 0) {
                HpMaxReg += THend.value;
                core.addFlag('heroHpMaxAdd' + '_time', -1); // 减少回合持续效果1点
            }
            break;
    }
    // 设置全局属性的变化比例
    core.setFlag('hero_atkReg', AtkReg); // 攻击比例
    core.setFlag('hero_defReg', DefReg); // 防御比例
    core.setFlag('hero_hpMaxReg', HpMaxReg); // 防御比例
};

// step 3 获得主角当前属性
this._turnBattleHeroThisPower = function () {
    // 变动属性 （如果被影响过数据内容）
    let newHeroHpMax = core.getFlag('turnHeroHpMax') || null;
    let newHeroAtk = core.getFlag('turnHeroAtk') || null;
    let newHeroDef = core.getFlag('turnHeroDef') || null;
    let newHeroMdef = core.getFlag('turnHeroMdef') || null;

    // 获得主角基础属性
    let heroHp = Math.min(
        core.status.hero.hp,
        Math.max(core.status.hero.mdef * 3, core.status.hero.lv * 100)
    ); // 回合制中，若没有特殊情况，主角所持有的最高生命值不超过魔防的3倍,如果魔防太低，那么将会取魔防 + 自身等级 * 100 作为自己的生命值
    const enemyInfo = core.enemys.getEnemyInfo('greenSlime');
    let heroHpMax = core.getFlag('turnHeroHpMax') || heroHp;
    let heroAtk = core.status.hero.atk;
    let heroDef = core.status.hero.def;
    let heroMdef = core.status.hero.Mdef;
    let heroGodAtk = enemyInfo.god_per_damage || 0; // 神圣攻击

    // 获得主角携带buff的影响效果
    let HpReg = core.getFlag('hero_hpReg') || 1,
        HpMaxReg = core.getFlag('hero_hpMaxReg') || 1,
        AtkReg = core.getFlag('hero_atkReg') || 1,
        DefReg = core.getFlag('hero_defReg') || 1,
        MdefReg = core.getFlag('hero_mdefReg') || 1;

    // 如果属性不是初始值（在回合战中出现过变动，那么将使用变动量）
    heroHpMax *= HpReg;
    heroAtk *= AtkReg;
    heroDef *= DefReg;
    heroMdef *= MdefReg;

    // 记录所有属性
    core.setFlag('turnHeroHpmax', heroHpMax); // 实际最大生命
    core.setFlag('turnHeroAtk', heroAtk); // 实际攻击
    core.setFlag('turnHeroDef', heroDef); // 实际防御
    core.setFlag('turnHeroMdef', heroMdef); // 实际护盾
};

// choices事件流处理flag
this.turnHeroSpecialFlag = function (enemyId, value) {
    // 被选中的特技
    let special = core.plugin._turnBattle(enemyId, null, null).heroSpecailList[
        value
    ];
    core.setFlag('heroSpecialClick', special);
    // 如果特技存在冷却时间且冷却时间已结束，需要额外创建一个flag代表冷却时间，以便后面回合不显示该项目
    let freeze = '' + special.flag + '_freeze';
    if (special.freezeTurn) {
        if (core.getFlag(freeze, 0) < 1)
            core.setFlag(freeze, special.freezeTurn);
    }
    console.log(special.flag, special.freezeTurn);
};

// step 4 执行主角当前操作
this._turnBattleManage = function (enemyId) {
    // 获取技能列表
    // 当前回合
    let turn = core.getFlag('thisTurn') || 1;
    // 回合数据
    let turnInfo = core.plugin._turnBattle(enemyId, null, null);
    // 主角技能列表
    let heroSpecial = turnInfo.heroSpecailList;
    let heroSpecialNum = heroSpecial.length; // 技能数
    // 设置主角全局特技存储
    core.setFlag('heroSpecialNum', heroSpecialNum);

    // 所选择的技能
    let n = null;

    // 技能文本说明
    let SpText = function () {
        let spe = [];
        for (let i = 0; i < heroSpecialNum; i++) {
            spe.push(heroSpecial[i].name + ': ' + heroSpecial[i].text + '\n\n');
        }
        return spe;
    };

    // 开始执行
    core.insertAction([
        { type: 'setText', background: 'winskin2.png' },
        {
            type: 'choices',
            text: '选择行动',
            choices: [
                {
                    text: '发动技能',
                    color: [255, 162, 162, 1],
                    action: [
                        {
                            type: 'while',
                            condition: '1',
                            data: [
                                {
                                    type: 'choices',
                                    text: '选择技能',
                                    choices: [
                                        {
                                            text:
                                                '' + heroSpecial[0]?.name + '',
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=1',
                                            need:
                                                "!core.getFlag('" +
                                                heroSpecial[0]?.flag +
                                                "_freeze') || core.getFlag('" +
                                                heroSpecial[0]?.flag +
                                                "_freeze') < 1 ",
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 0)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "', f);}"
                                                },
                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text:
                                                '' + heroSpecial[1]?.name + '',
                                            need:
                                                "!core.getFlag('" +
                                                heroSpecial[1]?.flag +
                                                "_freeze') || core.getFlag('" +
                                                heroSpecial[1]?.flag +
                                                "_freeze') < 1 ",
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=2',
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 1)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "',  f);}"
                                                },
                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text:
                                                '' + heroSpecial[2]?.name + '',
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=3',
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 2)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "',  f);}"
                                                },
                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text:
                                                '' + heroSpecial[3]?.name + '',
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=4',
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 3)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "',  f);}"
                                                },
                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text:
                                                '' + heroSpecial[4]?.name + '',
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=5',
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 4)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "',  f);}"
                                                },
                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text:
                                                '' + heroSpecial[5]?.name + '',
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=6',
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 5)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "',  f);}"
                                                },
                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text:
                                                "'" + heroSpecial[6]?.name + '',
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=7',
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 6)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "',  f);}"
                                                },
                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text:
                                                '' + heroSpecial[7]?.name + '',
                                            condition:
                                                'core.getFlag("heroSpecialNum")>=8',
                                            action: [
                                                {
                                                    type: 'function',
                                                    function:
                                                        "function(){\ncore.plugin.turnHeroSpecialFlag('" +
                                                        enemyId +
                                                        '\', 7)\nlet f = core.getFlag("heroSpecialClick")\ncore.plugin.turnBattleHeroAct(\'' +
                                                        enemyId +
                                                        "',  f);}"
                                                },

                                                { type: 'break', n: 1 }
                                            ]
                                        },
                                        {
                                            text: '当前持有技能效果一览',
                                            color: [255, 255, 0, 1],
                                            action: ['' + SpText() + '']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    text: '进行防御',
                    action: [
                        {
                            type: 'choices',
                            text: '选择行动',
                            choices: [
                                {
                                    text: '防御(该回合遭受的伤害降低50%)',
                                    action: [
                                        {
                                            type: 'setValue',
                                            name: 'flag:hero_defend_skill',
                                            value: '1'
                                        }
                                    ]
                                },
                                {
                                    text: '发呆（摆烂）',
                                    action: []
                                }
                            ]
                        }
                    ]
                },
                {
                    text: '使用道具',
                    action: []
                }
            ]
        }
    ]);
};
// 检测玩家使用主角项目后，对怪物数据进行处理，并绘制跳字内容
this.turnBattleHeroToMon = function (enemyId, special) {
    // 设置需要插入的主事件
    let slotAction = [];
    // 设置需要插入的多重打击事件
    let slotAction1 = [];
    // 获取怪物属性
    let turnInfo = core.plugin._turnBattle(enemyId, null, null);
    // 处理特殊属性导致的伤害变动(暂无)
    // ....
    // 获得扣除后的生命值
    let realMonHp = turnInfo.thisMonHp - special.value;
    // 获得血条长度比例
    let monHpCase = realMonHp / turnInfo.thisMonHpMax;
    // 存在多重打击下，需要将打击伤害分成多份插入
    if (special.order && special.order > 1) {
        for (let i = 1; i <= special.order; i++) {
            slotAction1.push([
                {
                    type: 'showTextImage',
                    code: 34 + i,
                    text: '- ' + special.value / special.order,
                    loc: [240, 120],
                    lineHeight: 1.4,
                    opacity: 1,
                    time: 0
                },
                { type: 'sleep', time: 30 },
                {
                    type: 'moveImage',
                    code: 34 + i,
                    to: [265, 0],
                    moveMode: 'easeOut',
                    opacity: 0,
                    time: 2500,
                    async: true
                }
            ]);
            if (special.order - i > 0)
                slotAction1.at(-1).push({ type: 'sleep', time: 50 });
        }
    } else {
        slotAction1.push([
            {
                type: 'showTextImage',
                code: 34,
                text: '- ' + special.value,
                loc: [240, 120],
                lineHeight: 1.4,
                opacity: 1,
                time: 0
            },
            { type: 'sleep', time: 30 },
            {
                type: 'moveImage',
                code: 34,
                to: [265, 0],
                moveMode: 'easeOut',
                opacity: 0,
                time: 2500,
                async: true
            }
        ]);
    }
    // 重绘怪物血条部分
    slotAction.push([
        { type: 'clearMap', x: 12, y: 32, width: 236, height: 16 }, //擦除血条部分
        {
            type: 'fillRect',
            x: 12,
            y: 32,
            width: 236 * monHpCase,
            height: 16,
            radius: 4,
            style: [255, 70, 70, 1]
        },
        {
            type: 'fillRect',
            x: 12,
            y: 32,
            width: 234 * monHpCase,
            height: 2,
            radius: 4,
            style: [255, 147, 147, 1]
        }
    ]);
    // 插入伤害弹出事件
    // slotAction.push(...slotAction1);
    // 设置全局当前怪物血量
    core.setFlag('turnMonHp', realMonHp);
    console.log(slotAction, slotAction1);
    return {
        slotAction: slotAction,
        slotAction1: slotAction1.length > 0 ? slotAction1 : null
    };
};

// step 5 开始主角行动的舞台演出以及属性计算
this.turnBattleHeroAct = function (enemyId, special) {
    // 获取动画
    let animate = '' + special.animate;
    // 临时调整动画层高度
    core.canvas.animate.canvas.style.zIndex = 139;
    // 获取固定数据
    let turnInfo = core.plugin._turnBattle(enemyId, null, null);
    // 检查回合伤害类型
    let damageCode = special.action;
    // 主角名称
    let heroName = core.status.hero.name;
    // 主行动
    let pushOrder = [];
    // 如果存在多重动画次行动
    let pushOrder1 = [];
    if (damageCode == 'atk') {
        // 攻击类型
        // 处理buff情况或特殊属性情况
        let pray_drink_action = []; // 神圣祷吸
        if (special.pray_drink) {
            core.setFlag('battleTurn_pray_drink', special.pray_drink);
            pray_drink_action = [
                { type: 'sleep', time: 200 },
                {
                    type: 'animate',
                    name: 'praydrink',
                    loc: [2, 7],
                    alignWindow: true
                }
            ];
        }
        // 记录伤害量
        pushOrder = [
            {
                type: 'function',
                function:
                    "function(){\ncore.plugin.turnBattleHeroToMon('" +
                    enemyId +
                    "', " +
                    JSON.stringify(special) +
                    ').slotAction \n}'
            },
            {
                type: 'animate',
                name: animate,
                loc: [10, 2],
                alignWindow: true,
                async: true
            },
            {
                type: 'moveImage',
                code: 26,
                to: [265, 30],
                moveMode: 'easeIn',
                time: 50,
                async: true
            },
            {
                type: 'rotateImage',
                code: 26,
                angle: 8,
                moveMode: 'easeIn',
                time: 50
            },
            { type: 'waitAsync' },
            { type: 'sleep', time: 50 },
            {
                type: 'moveImage',
                code: 26,
                to: [240, 30],
                moveMode: 'easeOut',
                time: 50,
                async: true
            },
            {
                type: 'rotateImage',
                code: 26,
                angle: -8,
                moveMode: 'easeIn',
                time: 50
            },
            { type: 'waitAsync' }
        ];
        pushOrder1 = [
            {
                type: 'animate',
                name: animate,
                loc: [10, 2],
                alignWindow: true,
                async: true
            },
            {
                type: 'moveImage',
                code: 26,
                to: [265, 30],
                moveMode: 'easeOut',
                time: 50,
                async: true
            },
            {
                type: 'rotateImage',
                code: 26,
                angle: 8,
                moveMode: 'easeIn',
                time: 50
            },
            { type: 'waitAsync' },
            { type: 'sleep', time: 50 },
            {
                type: 'moveImage',
                code: 26,
                to: [240, 30],
                moveMode: 'easeOut',
                time: 50,
                async: true
            },
            {
                type: 'rotateImage',
                code: 26,
                angle: -8,
                moveMode: 'easeIn',
                time: 50
            },
            { type: 'waitAsync' }
        ];
        if (special.order && special.order > 1) {
            // 是否拥有多重打击，如果有，则叠加打击事件
            for (let i = 1; i < special.order; i++) {
                pushOrder.push({
                    type: 'function',
                    function:
                        "function(){\ncore.plugin.turnBattleHeroToMon('" +
                        enemyId +
                        "', " +
                        JSON.stringify(special) +
                        ').slotAction1' +
                        [i - 1] +
                        ' \n}'
                });
                pushOrder.push(...pushOrder1);
            }
        }
        if (special.pray_drink) pushOrder.push(...pray_drink_action);
    }
    core.insertAction([
        { type: 'tip', text: heroName + ' 使用了 ' + special.name + '!' },
        ...pushOrder
    ]);
    core.insertAction([
        { type: ' hideImage', code: 35, time: 0 },
        { type: ' hideImage', code: 36, time: 0 },
        { type: ' hideImage', code: 37, time: 0 }
    ]);
};

// 检测当前回合怪物的属性
this._turnBattleMonInfo = function (enemyId) {
    // 当前回合
    let turn = core.getFlag('thisTurn') || 1;
    // 回合数据
    let turnInfo = core.plugin._turnBattle(enemyId, null, null);
    // 怪物属性
    let MonHp = turnInfo.thisMonHp;
    let MonHpMax = turnInfo.heroHpMax;
    let MonAtk = turnInfo.heroAtk;
    let MonDef = turnInfo.heroDef;
    let MonMdef = turnInfo.heroMdef;
    //////// 检测该回合是否有影响怪物属性的各类效果
    //// 检测当前怪物特技的回合末影响
    let TEend = null;
    for (let i = 0; i < turnInfo.monSpecailList.length; i++) {
        if (turnInfo.monSpecailList[i].enemyId == enemyId) {
            TEend = turnInfo.monSpecailList[i].turnEnd.turnEndOccur || null;
        }
    }
    //// 检测当前主角自身特技给自己带来的回合末影响、
    let THend = null;
    for (let i = 0; i < turnInfo.heroSpecailList.length; i++) {
        if (turnInfo.heroSpecailList[i].flag) {
            THend = turnInfo.heroSpecailList[i].turnEnd.turnEndOccur || null;
        }
    }
    // 设置各属性变化变量(百分比)
    let HpReg = 1,
        HpMaxReg = 1,
        AtkReg = 1,
        DefReg = 1,
        MdefReg = 1;
    switch (TEend) {
        case 'monAtkReduce': // 怪物攻击减弱
            AtkReg -= TEend.value;
            break;
        case 'monDefReduce': // 怪物防御减弱
            DefReg -= TEend.value;
            break;
        case 'monHpMaxReduce': // 怪物生命值上限降低
            HpMaxReg -= TEend.value;
            break;
    }
    switch (THend) {
        case 'monAtkAdd': // 怪物攻击增强
            AtkReg += THend.value;
            break;
        case 'monDefAdd': // 怪物防御增强
            DefReg += THend.value;
            break;
        case 'monHpMaxAdd': // 怪物生命值上限增加
            HpMaxReg += THend.value;
            break;
    }
    MonHp = Math.round(MonHp * HpReg);
    MonHpMax = Math.round(MonHpMax * HpMaxReg);
    MonAtk = Math.round(MonAtk * AtkReg);
    MonDef = Math.round(MonDef * DefReg);
    MonMdef = Math.round(MonMdef * MdefReg);
};
