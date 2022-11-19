/** @file enemys.js 定义了一系列和敌人相关的API函数。 */
declare class enemys {
    /**
     * 判定某种特殊属性的有无
     * @example core.hasSpecial('greenSlime', 1) // 判定绿头怪有无先攻属性
     * @param special 敌人id或敌人对象或正整数数组或自然数
     * @param test 待检查的属性编号
     * @returns 若special为数组或数且含有test或相等、或special为敌人id或对象且具有此属性，则返回true
     */
    hasSpecial(
        special: number | number[] | string | Enemy,
        test: number
    ): boolean;

    /**
     * 获得某种敌人的全部特殊属性名称
     * @example core.getSpecialText('greenSlime') // ['先攻', '3连击', '破甲', '反击']
     * @param enemy 敌人id或敌人对象，如core.material.enemys.greenSlime
     * @returns 字符串数组
     */
    getSpecialText(enemy: string | Enemy): string[];

    /**
     * 获得某种敌人的某种特殊属性的介绍
     * @example core.getSpecialHint('bat', 1) // '先攻：怪物首先攻击'
     * @param enemy 敌人id或敌人对象，用于确定属性的具体数值，否则可选
     * @param special 属性编号，可以是该敌人没有的属性
     * @returns 属性的介绍，以属性名加中文冒号开头
     */
    getSpecialHint(enemy: string | Enemy, special: number): string;

    /** 获得某个敌人的某项属性值 */
    getEnemyValue(
        enemy: string | Enemy,
        name: string,
        x?: number,
        y?: number,
        floorId?: string
    ): any;

    /**
     * 判定主角当前能否打败某只敌人
     * @example core.canBattle('greenSlime',0,0,'MT0') // 能否打败主塔0层左上角的绿头怪（假设有）
     * @param enemy 敌人id或敌人对象
     * @param x 敌人的横坐标，可选
     * @param y 敌人的纵坐标，可选
     * @param floorId 敌人所在的地图，可选
     * @returns true表示可以打败，false表示无法打败
     */
    canBattle(
        enemy: string | Enemy,
        x?: number,
        y?: number,
        floorId?: string
    ): boolean;

    /**
     * 获得某只敌人对主角的总伤害
     * @example core.getDamage('greenSlime',0,0,'MT0') // 绿头怪的总伤害
     * @param enemy 敌人id或敌人对象
     * @param x 敌人的横坐标，可选
     * @param y 敌人的纵坐标，可选
     * @param floorId 敌人所在的地图，可选
     * @returns 总伤害，如果因为没有破防或无敌怪等其他原因无法战斗，则返回null
     */
    getDamage(
        enemy: string | Enemy,
        x?: number,
        y?: number,
        floorId?: string
    ): number;

    /**
     * 获得某只敌人的地图显伤，包括颜色
     * @example core.getDamageString('greenSlime', 0, 0, 'MT0') // 绿头怪的地图显伤
     * @param enemy 敌人id或敌人对象
     * @param x 敌人的横坐标，可选
     * @param y 敌人的纵坐标，可选
     * @param floorId 敌人所在的地图，可选
     * @returns damage: 表示伤害值或为'???'，color: 形如'#RrGgBb'
     */
    getDamageString(
        enemy: string | Enemy,
        x?: number,
        y?: number,
        floorId?: string
    ): {
        damage: string;
        color: string;
    };

    /**
     * 获得某只敌人接下来的若干个临界及其减伤，算法基于useLoop开关选择回合法或二分法
     * @example core.nextCriticals('greenSlime', 9, 0, 0, 'MT0') // 绿头怪接下来的9个临界
     * @param enemy 敌人id或敌人对象
     * @param number 要计算的临界数量，可选，默认为1
     * @param x 敌人的横坐标，可选
     * @param y 敌人的纵坐标，可选
     * @param floorId 敌人所在的地图，可选
     * @returns 两列的二维数组，每行表示一个临界及其减伤
     */
    nextCriticals(
        enemy: string | Enemy,
        number?: number,
        x?: number,
        y?: number,
        floorId?: string
    ): [atk: number, dam: number][];

    /**
     * 计算再加若干点防御能使某只敌人对主角的总伤害降低多少
     * @example core.nextCriticals('greenSlime', 10, 0, 0, 'MT0') // 再加10点防御能使绿头怪的伤害降低多少
     * @param enemy 敌人id或敌人对象
     * @param k 假设主角增加的防御力，可选，默认为1
     * @param x 敌人的横坐标，可选
     * @param y 敌人的纵坐标，可选
     * @param floorId 敌人所在的地图，可选
     * @returns 总伤害的减少量
     */
    getDefDamage(
        enemy: string | Enemy,
        k?: number,
        x?: number,
        y?: number,
        floorId?: string
    ): number;

    /**
     * 获得某张地图的敌人集合，用于手册绘制
     * @example core.getCurrentEnemys('MT0') // 主塔0层的敌人集合
     * @param floorId 地图id，可选
     * @returns 敌人集合，按伤害升序排列，支持多朝向怪合并
     */
    getCurrentEnemys(floorId?: string): (Enemy & DetailedEnemy)[];

    /**
     * 检查某些楼层是否还有漏打的（某种）敌人
     * @example core.hasEnemyLeft('greenSlime', ['sample0', 'sample1']) // 样板0层和1层是否有漏打的绿头怪
     * @param enemyId 敌人id，可选，默认为任意敌人
     * @param floorId 地图id或其数组，可选，默认为当前地图
     * @returns true表示有敌人被漏打，false表示敌人已死光
     */
    hasEnemyLeft(enemyId?: string, floorId?: string | string[]): boolean;

    /** 获得所有怪物原始数据的一个副本 */
    getEnemys(): any;

    /** 获得所有特殊属性定义 */
    getSpecials(): [
        number,
        string | ((enemy: Enemy) => string),
        string | ((enemy: Enemy) => string),
        string | [number, number, number, number?],
        number?
    ][];

    /** 获得所有特殊属性的颜色 */
    getSpecialColor(
        enemy: string | Enemy
    ): Array<string | [number, number, number, number?]>;

    /** 获得所有特殊属性的额外标记 */
    getSpecialFlag(enemy: string | Enemy): Array<number>;

    /** 获得怪物真实属性 */
    getEnemyInfo(
        enemy: string | Enemy,
        hero?: any,
        x?: number,
        y?: number,
        floorId?: string
    ): {
        hp: number;
        def: number;
        atk: number;
        money: number;
        exp: number;
        point: number;
        special: number | number[];
        guards: Array<[number, number, string]>;
        [x: string]: any;
    };

    /** 获得战斗伤害信息（实际伤害计算函数） */
    getDamageInfo(
        enemy: string | Enemy,
        hero?: any,
        x?: number,
        y?: number,
        floorId?: string
    ): {
        mon_hp: number;
        mon_atk: number;
        mon_def: number;
        init_damage: number;
        per_damage: number;
        hero_per_damage: number;
        turn: number;
        damage: number;
        [x: string]: any;
    } | null;
}
