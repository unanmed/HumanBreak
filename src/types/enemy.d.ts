type PartialNumbericEnemyProperty =
    | 'value'
    | 'zone'
    | 'repulse'
    | 'laser'
    | 'breakArmor'
    | 'counterAttack'
    | 'vampire'
    | 'hpBuff'
    | 'atkBuff'
    | 'defBuff'
    | 'range'
    | 'haloRange'
    | 'n'
    | 'purify'
    | 'atkValue'
    | 'defValue'
    | 'damage';

type BooleanEnemyProperty =
    | 'zoneSquare'
    | 'haloSquare'
    | 'notBomb'
    | 'add'
    | 'haloAdd'
    | 'specialAdd';

type DetailedEnemy<I extends EnemyIds = EnemyIds> = {
    specialText: string[];
    toShowSpecial: string[];
    toShowColor: Color[];
    specialColor: Color[];
    damageColor: Color;
    criticalDamage: number;
    critical: number;
    defDamage: number;
} & Enemy<I>;

type Enemy<I extends EnemyIds = EnemyIds> = {
    /**
     * 怪物id
     */
    id: I;

    /**
     * 怪物名称
     */
    name: string;

    /**
     * 怪物说明
     */
    description: string;

    /**
     * 在怪物手册中映射到的怪物ID。如果此项不为null，则在怪物手册中，将用目标ID来替换该怪物原本的ID。
     * 常被运用在同一个怪物的多朝向上
     */
    displayIdInBook: EnemyIds;

    /**
     * 行走图朝向。在勇士撞上图块时，或图块在移动时，会自动选择最合适的朝向图块（如果存在定义）来进行绘制。
     */
    faceIds: Record<Dir, EnemyIds>;

    /**
     * 战前事件
     */
    beforeBattle: MotaEvent;

    /**
     * 战后事件
     */
    afterBattle: MotaEvent;
} & {
    [P in PartialNumbericEnemyProperty]?: number;
} & {
    [P in BooleanEnemyProperty]: boolean;
} & EnemyInfoBase;

/**
 * 怪物的特殊属性定义
 */
type EnemySpecialDeclaration = [
    id: number,
    name: string | ((enemy: EnemySpecialBase) => string),
    desc: string | ((enemy: EnemySpecialBase) => string),
    color: Color,
    extra?: number
];

interface DamageString {
    /**
     * 伤害字符串
     */
    damage: string;

    /**
     * 伤害颜色
     */
    color: Color;
}

interface EnemySpecialBase {
    /**
     * 怪物特殊属性
     */
    special: number[];

    /**
     * 特殊属性光环
     */
    specialHalo?: number[];
}

interface EnemyInfoBase extends EnemySpecialBase {
    /**
     * 生命值
     */
    hp: number;

    /**
     * 攻击力
     */
    atk: number;

    /**
     * 防御力
     */
    def: number;

    /**
     * 金币
     */
    money: number;

    /**
     * 经验
     */
    exp: number;

    /**
     * 加点量
     */
    point: number;
}

interface EnemyInfo extends EnemyInfoBase {
    /**
     * 支援信息
     */
    guards: [x: number, y: number, id: EnemyIds];
}

interface DamageInfo {
    /**
     * 怪物生命值
     */
    mon_hp: number;

    /**
     * 怪物攻击力
     */
    mon_atk: number;

    /**
     * 怪物防御力
     */
    mon_def: number;

    /**
     * 先攻伤害
     */
    init_damage: number;

    /**
     * 怪物的每回合伤害
     */
    per_damage: number;

    /**
     * 勇士的每回合伤害
     */
    hero_per_damage: number;

    /**
     * 战斗的回合数
     */
    turn: number;

    /**
     * 勇士损失的生命值
     */
    damage: number;
}

interface BookEnemyInfo extends Enemy, EnemyInfo {
    /**
     * 怪物的坐标列表
     */
    locs?: [x: number, y: number][];

    /**
     * 怪物的中文名
     */
    name: string;

    /**
     * 特殊属性名称列表
     */
    specialText: string[];

    /**
     * 特殊属性的颜色列表
     */
    specialColor: Color[];

    /**
     * 怪物的伤害
     */
    damage: number;

    /**
     * 第一个临界的加攻的值
     */
    critical: number;

    /**
     * 临界的减伤值
     */
    criticalDamage: number;

    /**
     * ratio防减伤
     */
    defDamage: number;
}

/**
 * 怪物模块
 */
interface Enemys {
    /**
     * 所有的怪物信息
     */
    readonly enemys: {
        [P in EnemyIds]: Enemy<P>;
    };

    /**
     * 获得所有怪物原始数据的一个副本
     */
    getEnemys(): {
        [P in EnemyIds]: Enemy<P>;
    };

    /**
     * 判定主角当前能否打败某只敌人
     * @example core.canBattle('greenSlime',0,0,'MT0') // 能否打败主塔0层左上角的绿头怪（假设有）
     * @param enemy 敌人id或敌人对象
     * @param x 敌人的横坐标
     * @param y 敌人的纵坐标
     * @param floorId 敌人所在的地图
     * @returns true表示可以打败，false表示无法打败
     */
    canBattle(
        x: number,
        y: number,
        floorId?: FloorIds,
        dir?: Dir | 'none' | (Dir | 'none')[]
    ): boolean;
}

declare const enemys: new () => Enemys;
