///<reference path="../../../src/types/core.d.ts" />

/**
 * @type {number[]}
 */
let levels = [];

/**
 * @type {Record<Chapter, Skill[]>}
 */
const skills = {
    chapter1: [
        {
            index: 0,
            title: '力量',
            desc: ['力量就是根本！可以通过智慧增加力量，每级增加2点攻击。'],
            consume: '10 * level + 10',
            front: [],
            loc: [1, 2],
            max: 10,
            effect: ['攻击 + ${level * 2}']
        },
        {
            index: 1,
            title: '致命一击',
            desc: ['爆发出全部力量攻击敌人，每级增加5点额外攻击。'],
            consume: '30 * level + 30',
            front: [[0, 5]],
            loc: [2, 1],
            max: 10,
            effect: ['额外攻击 + ${level * 5}']
        },
        {
            index: 2,
            title: '断灭之刃',
            desc: [
                '<span style="color: gold">主动技能，快捷键1</span>，',
                '开启后会在战斗时会额外增加一定量的攻击，但同时减少一定量的防御。'
            ],
            consume: '200 * level + 400',
            front: [[1, 5]],
            loc: [4, 1],
            max: 5,
            effect: ['增加${level * 10}%攻击，减少${level * 10}%防御']
        },
        {
            index: 3,
            title: '坚韧',
            desc: ['由智慧转化出坚韧！每级增加2点防御'],
            consume: '10 * level + 10',
            front: [],
            loc: [1, 4],
            max: 10,
            effect: ['防御 + ${level * 2}']
        },
        {
            index: 4,
            title: '回春',
            desc: ['让智慧化为治愈之泉水！每级增加1点生命回复'],
            consume: '20 * level + 20',
            front: [[3, 5]],
            loc: [2, 5],
            max: 25,
            effect: ['生命回复 + ${level}']
        },
        {
            index: 5,
            title: '治愈之泉',
            desc: [
                '让生命变得更多一些吧！每吃50瓶血瓶就增加当前生命回复10%的生命回复'
            ],
            consume: '1500',
            front: [[4, 25]],
            loc: [4, 5],
            max: 1,
            effect: ['50瓶血10%生命回复']
        },
        {
            index: 6,
            title: '坚固之盾',
            desc: ['让护甲更加坚硬一些吧！每级增加10点防御'],
            consume: '50 + level * 50',
            front: [[3, 5]],
            loc: [2, 3],
            max: 10,
            effect: ['防御 + ${level * 10}']
        },
        {
            index: 7,
            title: '无上之盾',
            desc: [
                '<span style="color: #dd4">第一章终极技能</span>，战斗时智慧会充当等量护盾'
            ],
            consume: '2500',
            front: [
                [6, 10],
                [5, 1],
                [2, 2]
            ],
            loc: [5, 3],
            max: 1,
            effect: ['战斗时智慧会充当护盾']
        }
    ],
    chapter2: [
        {
            index: 8,
            title: '锋利',
            desc: ['让剑变得更加锋利！每级使攻击增加1%（buff式增加）'],
            consume: 'level > 5 ? 50 * level ** 2 : 250 * level + 250',
            front: [],
            loc: [1, 2],
            max: 15,
            effect: ['攻击增加${level}%']
        },
        {
            index: 9,
            title: '坚硬',
            desc: ['让盾牌变得更加坚固！每级使防御增加1%（buff式增加）'],
            consume: 'level > 5 ? 50 * level ** 2 : 250 * level + 250',
            front: [],
            loc: [1, 4],
            max: 15,
            effect: ['防御增加${level}%']
        },
        {
            index: 10,
            title: '铸剑为盾',
            desc: [
                '<span style="color: gold">主动技能，快捷键3</span>，',
                '减少一定的攻击，增加一定的防御'
            ],
            consume: '500 * level + 1000',
            front: [[9, 5]],
            loc: [2, 5],
            max: 5,
            effect: ['增加${level * 10}%的防御，减少${level * 10}%的攻击']
        },
        {
            index: 11,
            title: '学习',
            desc: [
                '<span style="color: gold">主动技能</span>，可以消耗500智慧学习一个怪物的技能，',
                '持续5场战斗，每学习一次消耗的智慧点增加250，每次升级使持续的战斗次数增加3次。更多信息可在学习后在百科全书查看。'
            ],
            consume: '2500 * level ** 2 + 2500',
            front: [
                [8, 10],
                [12, 5]
            ],
            loc: [4, 1],
            max: 6,
            effect: ['学习怪物技能，持续${level * 3 + 2}场战斗']
        },
        {
            index: 12,
            title: '聪慧',
            desc: ['使主角变得更加聪明，每级使绿宝石增加的智慧点上升5%'],
            consume: 'level > 5 ? 100 * level ** 2 : 250 * level + 1250',
            front: [
                [8, 10],
                [9, 10]
            ],
            loc: [3, 3],
            max: 20,
            effect: ['增加${level * 5}%绿宝石效果']
        },
        {
            index: 13,
            title: '治愈',
            desc: ['使主角能够更好地回复生命，每级使血瓶的加血量增加2%'],
            consume: 'level > 5 ? 100 * level ** 2 : 250 * level + 1250',
            front: [[10, 3]],
            loc: [4, 5],
            max: 20,
            effect: ['增加${level * 2}%的血瓶回血量']
        },
        {
            index: 14,
            title: '胜利之号',
            desc: [
                '<span style="color: #dd4">第二章终极技能</span>，',
                '每打一个怪物，勇士在本楼层对怪物造成的伤害便增加1%'
            ],
            consume: '15000',
            front: [
                [13, 10],
                [12, 10],
                [11, 3]
            ],
            loc: [5, 3],
            max: 1,
            effect: ['每打一个怪，勇士造成的伤害增加1%']
        }
    ]
};

core.plugin.skills = skills;

export function getSkillFromIndex(index) {
    for (const [, skill] of Object.entries(skills)) {
        const s = skill.find(v => v.index === index);
        if (s) return s;
    }
}

/**
 * 获取技能等级
 * @param {number} skill
 */
export function getSkillLevel(skill) {
    return (levels[skill] ??= 0);
}

export function getSkillConsume(skill) {
    return eval(
        this.getSkillFromIndex(skill).consume.replace(
            /level(:\d+)?/g,
            (str, $1) => {
                if ($1) return `core.plugin.skillTree.getSkillLevel(${$1})`;
                else return `core.plugin.skillTree.getSkillLevel(${skill})`;
            }
        )
    );
}

export function openTree() {
    if (main.replayChecking) return;
    core.plugin.skillTreeOpened.value = true;
}

/**
 * 能否升级某个技能
 * @param {number} skill
 */
export function canUpgrade(skill) {
    const consume = core.plugin.skillTree.getSkillConsume(skill);
    if (consume > core.status.hero.mdef) return false;
    const level = core.plugin.skillTree.getSkillLevel(skill);
    const s = getSkillFromIndex(skill);
    if (level === s.max) return false;
    const front = s.front;
    for (const [skill, level] of front) {
        if (core.plugin.skillTree.getSkillLevel(skill) < level) return false;
    }
    return true;
}

/**
 * 实际升级效果
 * @param {number} skill
 */
export function upgradeSkill(skill) {
    if (!canUpgrade(skill)) return false;
    switch (skill) {
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
        case 8: // 锋利 +1%攻击
            core.addBuff('atk', 0.01);
            break;
        case 9: // 锋利 +1%防御
            core.addBuff('def', 0.01);
            break;
        case 10: // 铸剑为盾
            core.setFlag('shieldOn', true);
            break;
        case 11: // 学习
            core.setItem('I565', 1);
            break;
    }
    const consume = getSkillConsume(skill);
    core.status.hero.mdef -= consume;
    levels[skill]++;
    core.updateStatusBar();
    return true;
}

export function saveSkillTree() {
    return levels.slice();
}

export function loadSkillTree(data) {
    levels = data ?? [];
}

core.plugin.skillTree = {
    getSkillConsume,
    getSkillFromIndex,
    getSkillLevel,
    saveSkillTree,
    loadSkillTree,
    upgradeSkill,
    openTree
};
