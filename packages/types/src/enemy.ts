import EventEmitter from 'eventemitter3';

export interface EnemyInfo extends Partial<Omit<Enemy, 'special'>> {
    atk: number;
    def: number;
    hp: number;
    special: Set<number>;
    atkBuff_: number;
    defBuff_: number;
    hpBuff_: number;
    enemy: Enemy;
    guard: EnemyInfo[];
    x?: number;
    y?: number;
    floorId?: FloorIds;
}

export interface MapDamage {
    damage: number;
    type: Set<string>;
    repulse?: LocArr[];
    ambush?: LocArr[];
}

export interface DamageDelta {
    /** 跟最小伤害值的减伤 */
    delta: number;
    damage: number;
    info: DamageInfo;
}

export interface CriticalDamageDelta extends Omit<DamageDelta, 'info'> {
    /** 勇士的攻击增量 */
    atkDelta: number;
}

export interface DamageInfo {
    damage: number;
}

export interface HaloType {
    square: {
        x: number;
        y: number;
        d: number;
    };
    manhattan: {
        x: number;
        y: number;
        d: number;
    };
}

export interface HaloData<T extends keyof HaloType = keyof HaloType> {
    type: T;
    data: HaloType[T];
    special: number;
    from?: IDamageEnemy;
}

export type HaloFn = (info: EnemyInfo, enemy: EnemyInfo) => void;

export interface IDamageEnemy {
    /** 怪物 id */
    readonly id: EnemyIds;
    /** 怪物横坐标，不在地图上的话就是 undefined */
    readonly x?: number;
    /** 怪物纵坐标，不在地图上的话就是 undefined */
    readonly y?: number;
    /** 怪物所在地图，不在地图上的话就是 undefined */
    readonly floorId?: FloorIds;
    /** 怪物原始属性 */
    readonly enemy: Enemy;
    /** 怪物属性计算进度 */
    readonly progress: number;
    /** 该怪物伤害信息所属的怪物集 */
    readonly col?: IEnemyCollection;

    /**
     * 怪物属性。
     * 属性计算流程：预平衡光环(即计算加光环的光环怪的光环) -> 计算怪物在没有光环下的属性
     * -> provide inject 光环 -> 计算怪物的光环加成 -> 计算完毕
     */
    info: EnemyInfo;

    /**
     * 重置怪物属性至初始状态
     */
    reset(): void;

    /**
     * 获取怪物的真实属性信息
     */
    getRealInfo(): EnemyInfo;

    /**
     * 计算怪物伤害
     */
    calDamage(hero?: Partial<HeroStatus>): DamageInfo;

    /**
     * 计算地图伤害
     * @param damage 存入的对象
     */
    calMapDamage(
        damage?: Record<string, MapDamage>,
        hero?: Partial<HeroStatus>
    ): Record<string, MapDamage>;

    /**
     * 计算怪物临界
     * @param num 要计算多少个临界
     * @param hero 勇士属性，最终结果将会与由此属性计算出的伤害相减计算减伤
     */
    calCritical(
        num?: number,
        hero?: Partial<HeroStatus>
    ): CriticalDamageDelta[];

    /**
     * 计算n防减伤
     * @param num 要加多少防御
     * @param hero 勇士属性，最终结果将会与由此属性计算出的伤害相减计算减伤
     */
    calDefDamage(num?: number, hero?: Partial<HeroStatus>): DamageDelta;

    /**
     * 获取怪物秒杀时所需的攻击
     */
    getSeckillAtk(): number;
}

export interface IEnemyCollectionEvent {
    calculated: [];
    extract: [];
}

export interface IEnemyCollection extends EventEmitter<IEnemyCollectionEvent> {
    /** 这个怪物集的地图 id */
    readonly floorId: FloorIds;
    /** 地图宽度 */
    readonly width: number;
    /** 地图高度 */
    readonly height: number;
    /** 每个点的怪物，键是 (x + y * width)，值是怪物伤害实例 */
    readonly list: Map<number, IDamageEnemy>;
    /** 地图伤害 */
    readonly mapDamage: Record<string, MapDamage>;

    /**
     * 获取一点的怪物伤害信息
     * @param x 怪物横坐标
     * @param y 怪物纵坐标
     */
    get(x: number, y: number): IDamageEnemy | null;

    /**
     * 解析当前地图的所有怪物信息
     */
    extract(): void;

    /**
     * 计算所有怪物在其位置时对应的真实属性
     */
    calRealAttribute(): void;

    /**
     * 计算地图伤害
     */
    calMapDamage(): void;

    /**
     * 向怪物施加光环
     * @param type 光环的范围类型
     * @param data 光环范围信息
     * @param halo 光环效果函数
     * @param recursion 是否递归施加，只有在光环预平衡阶段会使用到
     */
    applyHalo<K extends keyof HaloType>(
        type: K,
        data: HaloType[K],
        enemy: IDamageEnemy,
        halo: HaloFn | HaloFn[],
        recursion?: boolean
    ): void;

    /**
     * 预平衡光环
     */
    preBalanceHalo(): void;
}
