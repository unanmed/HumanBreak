import { getHeroStatusOn } from '@/game/state/hero';
import { EnemyInfo } from './damage';

export interface SpecialDeclaration {
    code: number;
    name: string | ((enemy: EnemyInfo) => string);
    desc: string | ((enemy: EnemyInfo) => string);
    color: string;
}

const fromFunc = (
    func: string | ((enemy: EnemyInfo) => string),
    enemy: EnemyInfo
) => {
    return typeof func === 'string' ? func : func(enemy);
};

export const specials: SpecialDeclaration[] = [
    {
        code: 0,
        name: '空',
        desc: '空',
        color: '#fff'
    },
    {
        code: 1,
        name: '致命一击',
        desc: enemy => `怪物每5回合触发一次强力攻击，造成${enemy.crit}%的伤害`,
        color: '#fc3'
    },
    {
        code: 2,
        name: '恶毒',
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
        name: '饥渴',
        desc: enemy =>
            `战斗前，怪物降低勇士${enemy.hungry}%的攻击，并加在自己身上`,
        color: '#b67'
    },
    {
        code: 8,
        name: '抱团',
        desc: enemy =>
            `怪物周围5×5范围内每有一个拥有该属性的怪物（不包括自身），则对方攻防就增加${enemy.together}%（线性叠加）` +
            `，受加成怪物会在右上角显示当前周围有多少个怪物`,
        color: '#fa4'
    },
    {
        code: 9,
        name: '绝对防御',
        desc: '怪物的奇特护甲可以让勇士的额外攻击失效，攻击变为基础攻击+额外攻击',
        color: '#80eed6'
    },
    {
        code: 10,
        name: '勇气之刃',
        desc: enemy => `怪物第一回合造成${enemy.courage}%的伤害`,
        color: '#b0c0dd'
    },
    {
        code: 11,
        name: '勇气冲锋',
        desc: enemy =>
            `怪物首先攻击，造成${enemy.charge}%的伤害，并眩晕勇士5回合`,
        color: '#ff00d2'
    },
    {
        code: 12,
        name: '追猎',
        desc: '当勇士移动到该怪物的水平或竖直方向上时，怪物向勇士移动一格',
        color: '#9e8'
    },
    {
        code: 13,
        name: '魔攻',
        desc: '怪物攻击无视勇士的防御',
        color: '#bbb0ff'
    },
    {
        code: 14,
        name: '智慧之源',
        desc: '困难难度下（简单难度没有效果），战斗后，怪物会吸取勇士30%的智慧（勇士智慧向下取整至整十）加在本层的拥有该属性的怪物攻击上',
        color: '#bbeef0'
    },
    {
        code: 15,
        name: '突刺',
        desc: enemy =>
            `勇士走到怪物怪物周围四格时，怪物对勇士造成${core.formatBigNumber(
                Math.max((enemy.value || 0) - getHeroStatusOn('def'))
            )}点伤害`,
        color: '#c677dd'
    },
    {
        code: 16,
        name: '空',
        desc: '空',
        color: '#fff'
    },
    {
        code: 17,
        name: '先攻',
        desc: '战斗时，怪物首先攻击',
        color: '#b0b666'
    },
    {
        code: 18,
        name: '阻击',
        desc: enemy =>
            `经过怪物十字范围内时怪物后退一格，同时对勇士造成${enemy.value}点伤害`,
        color: '#8888e6'
    },
    {
        code: 19,
        name: '电摇嘲讽',
        desc:
            '当勇士移动到怪物同行或同列时，勇士会直接冲向怪物，撞碎路上的所有地形和门，拾取路上的道具，与路上的怪物战斗' +
            '，最后与该怪物战斗',
        color: '#ff6666'
    },
    {
        code: 20,
        name: '霜冻',
        desc: enemy =>
            `怪物寒冷的攻击使勇士动作变慢，勇士每回合对怪物造成的伤害减少${enemy.ice}%。装备杰克的衣服后可以免疫。`,
        color: 'cyan'
    },
    {
        code: 21,
        name: '冰封光环',
        desc: enemy =>
            `寒气逼人，使勇士对该怪物周围7*7范围内的怪物伤害减少${enemy.iceHalo}%（线性叠加）`,
        color: 'cyan'
    },
    {
        code: 22,
        name: '永夜',
        desc: enemy =>
            `战斗后，减少勇士${enemy.night}点攻防，增加本层所有怪物${enemy.night}点攻防，仅在本层有效`,
        color: '#d8a'
    },
    {
        code: 23,
        name: '极昼',
        desc: enemy =>
            `战斗后，减少本层所有怪物${enemy.day}点攻防，增加勇士${enemy.day}点攻防，仅在本层有效`,
        color: '#ffd'
    },
    {
        code: 24,
        name: '射击',
        desc: function () {
            return '经过怪物同行或同列的可视范围内时受到一次普通攻击的伤害';
        },
        color: '#dda0dd'
    },
    {
        code: 25,
        name: '融化',
        desc: enemy =>
            `战斗后该怪物会融化，在怪物位置产生一个3*3的范围光环，光环内怪物的攻防增加${enemy.melt}%`,
        color: '#e6e099'
    },
    {
        code: 26,
        name: '冰封之核',
        desc: enemy =>
            `怪物拥有逼人的寒气，使周围5*5范围内的怪物防御增加${enemy.iceCore}%`,
        color: '#70ffd1'
    },
    {
        code: 27,
        name: '火焰之核',
        desc: enemy =>
            `怪物拥有灼热的火焰，使周围5*5范围内的怪物攻击增加${enemy.fireCore}%`,
        color: '#ff6f0a'
    },
    {
        code: 28,
        name: '苍蓝刻',
        desc: enemy =>
            `怪物使用苍蓝之灵的力量，使自身受到的伤害减少${enemy.paleShield}%`,
        color: '#ff6f0a'
    },
    {
        code: 29,
        name: '杀戮光环',
        desc: enemy => {
            let content = '';
            enemy.specialHalo?.forEach((v, i) => {
                content +=
                    '&nbsp;'.repeat(8) +
                    `${i + 1}. <span style="color: ${
                        specials[v].color
                    }">${fromFunc(specials[v].name, enemy)}</span>: ${fromFunc(
                        specials[v].desc,
                        enemy
                    )}<br />`;
            });
            return (
                `怪物周围方形${enemy.haloRange}格范围内所有怪物获得以下特殊属性（包括自身），` +
                `特殊属性数值间为${
                    enemy.specialMultiply ? '相乘' : '相加'
                }关系:<br />` +
                content
            );
        },
        color: '#F721F7'
    },
    {
        code: 30,
        name: '乾坤挪移',
        desc: enemy => {
            const [dx, dy] = enemy.translation!;
            return `此怪物在场时，所有光环向${
                dx < 0 ? '左' : '右'
            }平移${Math.abs(dx)}格，向${dy < 0 ? '上' : '下'}平移${Math.abs(
                dy
            )}格。不同怪物间为加算叠加`;
        },
        color: '#FDCD0B'
    },
    {
        code: 31,
        name: '再生光环',
        desc: enemy =>
            `怪物周围7*7范围内的所有怪物（包括自身）生命值提高${enemy.hpHalo}%`,
        color: '#85FF99'
    },
    {
        code: 32,
        name: '同化',
        desc: enemy =>
            `怪物会获得自身周围方形${enemy.assimilateRange}格范围内怪物的特殊属性（光环类属性除外），` +
            `特殊属性数值间为${enemy.specialMultiply ? '乘算' : '加算'}关系`,
        color: '#ffd366'
    },
    {
        code: 33,
        name: '战争号角',
        desc: enemy => {
            const [hp, atk, def] = enemy.horn ?? [];
            let str = '地图上每存在一个怪物（包括自身），自身';
            if (hp) str += `生命值增加${hp}%，`;
            if (atk) str += `攻击增加${atk}%，`;
            if (def) str += `防御增加${def}%，`;
            str += '线性叠加';
            return str;
        },
        color: '#fff866'
    }
];
