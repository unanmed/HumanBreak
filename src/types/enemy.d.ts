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
    | 'haloAdd';

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
interface Enemys extends EnemyData {
    /**
     * 所有的怪物信息
     */
    readonly enemys: {
        [P in EnemyIds]: Enemy<P>;
    };

    /**
     * 脚本编辑的怪物相关
     */
    readonly enemydata: EnemyData;

    /**
     * 获得所有怪物原始数据的一个副本
     */
    getEnemys(): {
        [P in EnemyIds]: Enemy<P>;
    };

    /**
     * 获得某种敌人的全部特殊属性名称
     * @example core.getSpecialText('greenSlime') // ['先攻', '3连击', '破甲', '反击']
     * @param enemy 敌人id或敌人对象，如core.material.enemys.greenSlime
     * @returns 字符串数组
     */
    getSpecialText(enemy: EnemyIds | Enemy): string[];

    /**
     * 获得所有特殊属性的颜色
     * @param enemy 敌人id或敌人对象，如core.material.enemys.greenSlime
     */
    getSpecialColor(enemy: EnemyIds | Enemy): Color[];

    /**
     * 获得所有特殊属性的额外标记
     * @param enemy 敌人id或敌人对象，如core.material.enemys.greenSlime
     */
    getSpecialFlag(enemy: EnemyIds | Enemy): number[];

    /**
     * 获得某种敌人的某种特殊属性的介绍
     * @example core.getSpecialHint('bat', 1) // '先攻：怪物首先攻击'
     * @param enemy 敌人id或敌人对象，用于确定属性的具体数值
     * @param special 属性编号，可以是该敌人没有的属性
     * @returns 属性的介绍，以属性名加中文冒号开头
     */
    getSpecialHint(enemy: EnemyIds | Enemy, special: number): string;

    /**
     * 获得某个敌人的某项属性值
     * @param enemy 敌人id或敌人对象
     * @param name 获取的敌人属性
     * @param x 敌人的横坐标
     * @param y 敌人的纵坐标
     * @param floorId 敌人所在楼层
     */
    getEnemyValue<K extends keyof Enemy>(
        enemy: EnemyIds | Enemy,
        name: K,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): Enemy[K];

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
        enemy: EnemyIds | Enemy,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): boolean;

    /**
     * 获得某只敌人的地图显伤，包括颜色
     * @example core.getDamageString('greenSlime', 0, 0, 'MT0') // 绿头怪的地图显伤
     * @param enemy 敌人id或敌人对象
     * @param x 敌人的横坐标
     * @param y 敌人的纵坐标
     * @param floorId 敌人所在的地图
     */
    getDamageString(
        enemy: EnemyIds | Enemy,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): DamageString;

    /**
     * 获得某只敌人接下来的若干个临界及其减伤，算法基于useLoop开关选择回合法或二分法
     * @example core.nextCriticals('greenSlime', 9, 0, 0, 'MT0') // 绿头怪接下来的9个临界
     * @param enemy 敌人id或敌人对象
     * @param number 要计算的临界数量，默认为1
     * @param x 敌人的横坐标
     * @param y 敌人的纵坐标
     * @param floorId 敌人所在的地图
     * @returns 两列的二维数组，每行表示一个临界及其减伤
     */
    nextCriticals(
        enemy: EnemyIds | Enemy,
        number?: number,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): [critical: number, damage: number][];

    /**
     * 计算再加若干点防御能使某只敌人对主角的总伤害降低多少
     * @example core.nextCriticals('greenSlime', 10, 0, 0, 'MT0') // 再加10点防御能使绿头怪的伤害降低多少
     * @param enemy 敌人id或敌人对象
     * @param k 假设主角增加的防御力，默认为1
     * @param x 敌人的横坐标
     * @param y 敌人的纵坐标
     * @param floorId 敌人所在的地图
     * @returns 总伤害的减少量
     */
    getDefDamage(
        enemy: EnemyIds | Enemy,
        k?: number,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): number;

    /**
     * 获得某只敌人对主角的总伤害
     * @example core.getDamage('greenSlime',0,0,'MT0') // 绿头怪的总伤害
     * @param enemy 敌人id或敌人对象
     * @param x 敌人的横坐标
     * @param y 敌人的纵坐标
     * @param floorId 敌人所在的地图
     * @returns 总伤害，如果因为没有破防或无敌怪等其他原因无法战斗，则返回null
     */
    getDamage(
        enemy: EnemyIds | Enemy,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): number;

    /**
     * 获得某张地图的敌人集合，用于手册绘制
     * @example core.getCurrentEnemys('MT0') // 主塔0层的敌人集合
     * @param floorId 地图id
     * @returns 敌人集合，按伤害升序排列，支持多朝向怪合并
     */
    getCurrentEnemys(floorId?: FloorIds): DetailedEnemy[];

    /**
     * 检查某些楼层是否还有漏打的（某种）敌人
     * @example core.hasEnemyLeft('greenSlime', ['sample0', 'sample1']) // 样板0层和1层是否有漏打的绿头怪
     * @param enemyId 敌人id，可选，默认为任意敌人
     * @param floorId 地图id或其数组，可选，默认为当前地图
     * @returns true表示有敌人被漏打，false表示敌人已死光
     */
    hasEnemyLeft(
        enemyId?: EnemyIds | EnemyIds[],
        floorId?: FloorIds | FloorIds[]
    ): boolean;
}

declare const enemys: new () => Enemys;
