// todo: 2.C

export interface IEnemyInfo {}

export interface IDamageInfo {}

export interface IDamageEnemy {
    /** 原始怪物信息 */
    readonly enemy: Enemy;
    /** 该怪物所属的怪物列表 */
    readonly collection: IEnemyCollection | null;
    /** 怪物横坐标 */
    readonly x: number | undefined;

    /**
     * 获取怪物属性信息
     */
    getEnemyInfo(): IEnemyInfo;

    /**
     * 获取这个怪物的伤害信息
     */
    getDamageInfo(): IDamageInfo;
}

export interface IMapDamage {
    /** 伤害类型 */
    readonly type: string;
    /** 伤害值 */
    readonly damage: number;
    /** 伤害优先级 */
    readonly priority: number;
}

export interface IMapDamageSummary {
    /** 该点的总伤害 */
    readonly totalDamage: number;
    /** 该点的伤害信息 */
    readonly damages: IMapDamage[];
}

export interface IEnemyCollection {
    /** 怪物列表，索引为 x + width * y，值表示该点对应的怪物 */
    readonly list: Map<number, IDamageEnemy>;

    /** 楼层 id */
    readonly floorId: FloorIds;
    /** 楼层宽度 */
    readonly width: number;
    /** 楼层高度 */
    readonly height: number;

    /** 地图伤害 */
    readonly mapDamage: Map<number, IMapDamageSummary>;

    /** 用于计算本怪物列表中怪物信息的勇士属性 */
    readonly hero: HeroStatus;

    /**
     * 获取一点的怪物信息，不存在时返回 null
     * @param x 怪物横坐标
     * @param y 怪物纵坐标
     */
    getEnemy(x: number, y: number): IDamageEnemy | null;

    /**
     * 获取一点的地图伤害信息，每一点都包含地图伤害对象，传入地图外坐标时返回 null
     * @param x 横坐标
     * @param y 纵坐标
     */
    getMapDamage(x: number, y: number): IMapDamageSummary | null;

    /**
     * 重置此地图的怪物信息，并重新计算
     */
    refresh(): void;

    /**
     * 复制这个怪物列表，同时将复制后的列表中勇士属性设为指定值
     * @param status 新的勇士属性
     */
    with(status: HeroStatus): IEnemyCollection;
}

export interface IDamageSystem {
    readonly collections: Map<FloorIds, IEnemyCollection>;
}
