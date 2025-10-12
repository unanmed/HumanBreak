import { getHeroStatusOn } from '../state/hero';
import { UserEnemyInfo } from './damage';

export interface SpecialDeclaration {
    code: number;
    name: string | ((enemy: UserEnemyInfo) => string);
    desc: string | ((enemy: UserEnemyInfo) => string);
    color: string;
}

export const specials: SpecialDeclaration[] = [
    {
        code: 0,
        name: '空',
        desc: '空',
        color: '#fff'
    },
    {
        code: 1,
        name: '先攻',
        desc: `怪物首先攻击。`,
        color: '#fc3'
    },
    {
        code: 2,
        name: '魔攻',
        desc: '怪物攻击无视勇士的防御。',
        color: '#bbb0ff'
    },
    {
        code: 3,
        name: '坚固',
        desc: '怪物防御不小于勇士攻击-1。',
        color: '#c0b088'
    },
    {
        code: 4,
        name: '2连击',
        desc: '怪物每回合攻击2次。',
        color: '#fe7'
    },
    {
        code: 5,
        name: '3连击',
        desc: '怪物每回合攻击3次。',
        color: '#fe7'
    },
    {
        code: 6,
        name: enemy => `${enemy.n ?? 4}连击`,
        desc: enemy => `怪物每回合攻击${enemy.n}次。`,
        color: '#fe7'
    },
    {
        code: 7,
        name: '破甲',
        desc: enemy =>
            `战斗前，附加角色防御的${enemy.breakArmor ?? core.values.breakArmor}%作为伤害。`,
        color: '#fe7'
    },
    {
        code: 8,
        name: '反击',
        desc: enemy =>
            `战斗时，怪物每回合附加角色攻击的${enemy.counterAttack ?? core.values.counterAttack}%作为伤害，无视角色防御。`,
        color: '#fa4'
    },
    {
        code: 9,
        name: '净化',
        desc: enemy =>
            `战斗前，怪物附加角色护盾的${enemy.purify ?? core.values.purify}倍作为伤害。`,
        color: '#80eed6'
    },
    {
        code: 10,
        name: '模仿',
        desc: `怪物的攻防与勇士相同。`,
        color: '#b0c0dd'
    },
    {
        code: 11,
        name: '吸血',
        desc: enemy => {
            const vampire = enemy.vampire ?? 10;
            return (
                `战斗前，怪物首先吸取角色的${vampire}%生命` +
                `（约${Math.floor((vampire / 100) * getHeroStatusOn('hp'))}点）作为伤害` +
                (enemy.add ? `，并把伤害数值加到自身生命上。` : `。`)
            );
        },
        color: '#ff00d2'
    },
    {
        code: 12,
        name: '中毒',
        desc: () =>
            `战斗后，角色陷入中毒状态，每一步损失生命${core.values.poisonDamage}点。`,
        color: '#9e8'
    },
    {
        code: 13,
        name: '衰弱',
        desc: '怪物攻击无视勇士的防御。',
        color: '#f0bbcc'
    },
    {
        code: 14,
        name: '诅咒',
        desc: '战斗后，角色陷入诅咒状态，战斗无法获得金币和经验。',
        color: '#bbeef0'
    },
    {
        code: 15,
        name: '领域',
        desc: enemy =>
            `经过怪物周围${enemy.zoneSquare ? '九宫格' : '十字'}范围内${enemy.range}格时自动减生命${enemy.zone}点。`,
        color: '#c677dd'
    },
    {
        code: 16,
        name: '夹击',
        desc: '经过两只相同的怪物中间，角色生命值变成一半。',
        color: '#b9e'
    },
    {
        code: 17,
        name: '仇恨',
        desc: `战斗前，怪物附加之前积累的仇恨值作为伤害；战斗后，释放一半的仇恨值。（每杀死一个怪物获得${core.values.hatred}点仇恨值）。`,
        color: '#b0b666'
    },
    {
        code: 18,
        name: '阻击',
        desc: enemy =>
            `经过怪物十字范围内时怪物后退一格，同时对勇士造成${enemy.repulse}点伤害。`,
        color: '#8888e6'
    },
    {
        code: 19,
        name: '自爆',
        desc: '战斗后角色的生命值变成1。',
        color: '#ff6666'
    },
    {
        code: 20,
        name: '无敌',
        desc: `角色无法打败怪物，除非拥有十字架。`,
        color: '#aaa'
    },
    {
        code: 21,
        name: '退化',
        desc: enemy =>
            `战斗后角色永久下降${enemy.atkValue ?? 0}点攻击和${enemy.defValue ?? 0}点防御。`,
        color: 'cyan'
    },
    {
        code: 22,
        name: '固伤',
        desc: enemy =>
            `战斗前，怪物对角色造成${enemy.damage ?? 0}点固定伤害，未开启负伤时无视角色护盾。`,
        color: '#f97'
    },
    {
        code: 23,
        name: '重生',
        desc: `怪物被击败后，角色转换楼层则怪物将再次出现。`,
        color: '#dda0dd'
    },
    {
        code: 24,
        name: '激光',
        desc: enemy => `经过怪物同行或同列时自动减生命${enemy.laser ?? 0}点。`,
        color: '#dda0dd'
    },
    {
        code: 25,
        name: '光环',
        desc: enemy => {
            let str = '';
            if (enemy.haloRange) {
                if (enemy.haloSquare) {
                    str += '对于该怪物九宫格';
                } else {
                    str += '对于该怪物十字';
                }
                str += `${enemy.haloRange ?? 1}格范围内所有怪物`;
            } else {
                str += `同楼层所有怪物`;
            }
            if (enemy.hpBuff) {
                str += `，生命提升${enemy.hpBuff}%`;
            }
            if (enemy.atkBuff) {
                str += `，攻击提升${enemy.hpBuff}%`;
            }
            if (enemy.defBuff) {
                str += `，防御提升${enemy.defBuff}%`;
            }
            if (enemy.haloAdd) {
                str += `，线性叠加。`;
            } else {
                str += `，不可叠加。`;
            }
            return str;
        },
        color: '#e6e099'
    },
    {
        code: 26,
        name: '支援',
        desc: `当周围一圈的怪物受到攻击时将上前支援，并组成小队战斗。`,
        color: '#77c0b6'
    },
    {
        code: 27,
        name: '捕捉',
        desc: `当走到怪物十字范围内时会进行强制战斗。`,
        color: '#ff6f0a'
    }
];
