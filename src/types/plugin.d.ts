// 这里包含所有插件导出的函数及变量声明，声明的函数会在类型标注中标注到core上

type Ref<T> = {
    value: T;
};

type DragFn = (x: number, y: number, e: MouseEvent | TouchEvent) => void;

type CanParseCss = keyof {
    [P in keyof CSSStyleDeclaration as CSSStyleDeclaration[P] extends string
        ? P extends string
            ? P
            : never
        : never]: CSSStyleDeclaration[P];
};

interface PluginDeclaration
    extends PluginUtils,
        PluginUis,
        PluginUse,
        MiniMap,
        PluginAchievement {
    /**
     *
     */
    utils: GamePluginUtils;
    loopMap: GamePluginLoopMap;
    skillTree: GamePluginSkillTree;
    study: GamePluginStudy;
    hero: GamePluginHeroRealStatus;
    replay: PluginReplay;
    chase: PluginChase;

    skills: Record<Chapter, Skill[]>;
    skillEffects: SkillEffects;

    /**
     * 添加函数  例：添加弹出文字，像这个就可以使用core.addPop或core.plugin.addPop调用
     * @param px 弹出的横坐标
     * @param py 弹出的纵坐标
     * @param value 弹出的文字
     */
    addPop(px: number, py: number, value: string): void;

    /** 添加变量  例：所有的正在弹出的文字，像这个就可以使用core.plugin.pop获取 */
    pop: any[];

    /** 状态栏信息，取反后刷新状态栏 */
    readonly statusBarStatus: Ref<boolean>;

    /** 检查标记的怪物，取反后更新显示信息 */
    readonly checkMarkedStatus: Ref<boolean>;

    /**
     * 添加一个动画
     * @param fn 要添加的函数
     */
    addAnimate(fn: (time: number) => void);

    /**
     * 移除一个动画
     * @param fn 要移除的函数
     */
    removeAnimate(fn: (time: number) => void);

    /**
     * 检查被标记怪物的状态
     */
    checkMarkedEnemy(): void;

    /**
     * 标记怪物
     * @param id 怪物id
     */
    markEnemy(id: EnemyIds): void;

    /**
     * 是否标记过某个怪物
     */
    hasMarkedEnemy(id: EnemyIds): void;

    /**
     * 取消标记过某个怪物
     */
    unmarkEnemy(id: EnemyIds): void;

    /**
     * 重置设置信息
     */
    resetSettings(): void;

    /**
     * 重置变量的设置信息
     */
    resetFlagSettings(): void;

    /**
     * 判定一个值是否不是undefined或null
     * @param value 要判断的值
     */
    has<T>(value: T): value is NonNullable<T>;
}

interface GamePluginUtils {
    /**
     * 判定一个值是否不是undefined或null
     * @param value 要判断的值
     */
    has<T>(value: T): value is NonNullable<T>;

    /**
     * 滑动数组
     * @param arr 数组
     * @param delta 偏移量，正数表示向右滑动，负数表示向左滑动
     */
    slide<T>(arr: T[], delta: number): T[];

    /**
     * 获取方向的反方向
     * @param dir 方向
     */
    backDir(dir: Dir): Dir;

    /**
     * 最大化游戏缩放
     * @param n 最大缩放再少多少个缩放
     */
    maxGameScale(n?: number): void;
}

interface GamePluginLoopMap {
    checkLoopMap(): void;
}

interface PluginUtils {
    /**
     * 判定一个值是否不是undefined或null
     * @param value 要判断的值
     */
    has<T>(value: T): value is NonNullable<T>;

    /**
     * 根据伤害大小获取颜色
     * @param damage 伤害大小
     */
    getDamageColor(damage: number): string;

    /**
     * 解析css字符串为CSSStyleDeclaration对象
     * @param css 要解析的css字符串
     */
    parseCss(css: string): Partial<Record<CanParseCss, string>>;

    /**
     * 弹出一段提示
     * @param text 提示信息
     */
    tip(
        type: 'warn' | 'info' | 'success' | 'error' | 'warning' | 'loading',
        text: string
    ): void;

    /**
     * 开始一个追逐战
     * @param index 追逐战索引
     */
    startChase(index: number): Promise<void>;
}

interface PluginUis {
    /** 怪物手册的怪物详细信息的初始位置 */
    bookDetailPos: number;

    /** 怪物手册详细信息展示的怪物 */
    bookDetailEnemy: DetailedEnemy;

    /** 定点查看的界面，特殊属性还是临界 */
    fixedDetailPanel: 'special' | 'critical';

    /** 打开的商店id */
    openedShopId: string;

    /** ui是否使用渐变 */
    readonly transition: Ref<boolean>;

    /** 手册是否打开 */
    readonly bookOpened: Ref<boolean>;

    /** 道具栏是否打开 */
    readonly toolOpened: Ref<boolean>;

    /** 装备栏是否打开 */
    readonly equipOpened: Ref<boolean>;

    /** 是否显示状态栏 */
    readonly showStatusBar: Ref<boolean>;

    /** 设置界面是否打开 */
    readonly settingsOpened: Ref<boolean>;

    /** 是否正在进行章节显示 */
    readonly chapterShowed: Ref<boolean>;

    /** 章节显示的内容 */
    readonly chapterContent: Ref<boolean>;

    /** 百科全书是否打开了 */
    readonly descOpened: Ref<boolean>;

    /** 技能查看界面是否打开 */
    readonly skillOpened: Ref<boolean>;

    /** 技能树界面是否打开 */
    readonly skillTreeOpened: Ref<boolean>;

    /** 楼传界面是否打开 */
    readonly flyOpened: Ref<boolean>;

    /** 是否展示标记的怪物 */
    readonly showMarkedEnemy: Ref<boolean>;

    /** 是否展示已学习的技能 */
    readonly showStudiedSkill: Ref<boolean>;

    /** 定点查看是否打开 */
    readonly fixedDetailOpened: Ref<boolean>;

    /** 是否展示移动鼠标显示怪物信息的盒子 */
    readonly showFixed: Ref<boolean>;

    /** 商店是否打开 */
    readonly shopOpened: Ref<boolean>;

    /** 开始界面是否打开 */
    readonly startOpened: Ref<boolean>;

    /** 成就界面是否打开 */
    readonly achievementOpened: Ref<boolean>;

    /** bgm界面是否打开 */
    readonly bgmOpened: Ref<boolean>;

    /** ui栈 */
    readonly uiStack: Ref<any[]>;

    /**
     * 显示章节
     * @param chapter 显示的文字
     */
    showChapter(chapter: string): void;

    /**
     * 打开技能查看界面
     */
    openSkill(): void;
}

interface PluginUse {
    /** 是否是移动设备 */
    readonly isMobile: boolean;

    /**
     * 向一个元素添加拖拽事件
     * @param ele 目标元素
     * @param fn 推拽时触发的函数，传入x y和鼠标事件或点击事件
     * @param ondown 鼠标按下时执行的函数
     * @param global 是否全局拖拽，即拖拽后鼠标或手指离开元素后是否依然视为正在拖拽
     */
    useDrag(
        ele: HTMLElement,
        fn: DragFn,
        ondown?: DragFn,
        onUp?: (e: MouseEvent | TouchEvent) => void,
        global?: boolean
    ): void;

    /**
     * 去除一个全局拖拽函数
     * @param fn 要去除的函数
     */
    cancelGlobalDrag(fn: DragFn): void;

    /**
     * 当触发滚轮时执行函数
     * @param ele 目标元素
     * @param fn 当滚轮触发时执行的函数
     */
    useWheel(
        ele: HTMLElement,
        fn: (x: number, y: number, z: number, e: WheelEvent) => void
    ): void;

    /**
     * 当鼠标或手指松开时执行函数
     * @param ele 目标元素
     * @param fn 当鼠标或手指松开时执行的函数
     */
    useUp(ele: HTMLElement, fn: DragFn): void;
}

interface GamePluginSkillTree {
    /**
     * 获取技能等级
     * @param skill 技能索引
     */
    getSkillLevel(skill: number): number;

    /**
     * 根据索引获取技能
     * @param index 索引
     */
    getSkillFromIndex(index: number): Skill;

    /**
     * 获取技能的消耗
     * @param skill 技能
     */
    getSkillConsume(skill: number): number;

    /**
     * 升级技能
     * @param skill 技能索引
     */
    upgradeSkill(skill: number): boolean;

    /**
     * 保存技能树等级
     */
    saveSkillTree(): number[];

    /**
     * 加载技能树等级
     * @param data 等级信息
     */
    loadSkillTree(data: number[]): void;
}

interface MiniMap {
    /**
     * 切分区域
     */
    splitArea(): void;
}

interface GamePluginStudy {
    /**
     * 学习一个怪物技能
     * @param enemy 被学习的怪物
     * @param num 技能的索引
     */
    studySkill(enemy: Enemy, num: number): void;
}

interface GamePluginHeroRealStatus {
    /**
     * 获取勇士在某一点的属性
     * @param name 要获取的勇士属性
     * @param x 勇士所在横坐标
     * @param y 勇士所在纵坐标
     * @param floorId 勇士所在楼层
     */
    getHeroStatusOn(
        name: 'all',
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): HeroStatus;
    getHeroStatusOn(
        name: (keyof HeroStatus)[],
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): Partial<HeroStatus>;
    getHeroStatusOn<K extends keyof HeroStatus>(
        name: K,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): HeroStatus[K];

    /**
     * 获取一定状态下的勇士在某一点的属性
     * @param status 勇士的状态
     * @param name 要获取的勇士属性
     * @param x 勇士所在横坐标
     * @param y 勇士所在纵坐标
     * @param floorId 勇士所在楼层
     */
    getHeroStatusOf(
        status: Partial<HeroStatus>,
        name: 'all',
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): HeroStatus;
    getHeroStatusOf(
        status: Partial<HeroStatus>,
        name: (keyof HeroStatus)[],
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): Partial<HeroStatus>;
    getHeroStatusOf<K extends keyof HeroStatus>(
        status: Partial<HeroStatus>,
        name: K,
        x?: number,
        y?: number,
        floorId?: FloorIds
    ): HeroStatus[K];
}

interface PluginAchievement {
    /**
     * 完成一个成就
     * @param type 成就类型
     * @param index 成就索引
     */
    completeAchievement(type: AchievementType, index: number): void;

    /**
     * 是否完成了某个成就
     * @param type 成就类型
     * @param index 成就索引
     */
    hasCompletedAchievement(type: AchievementType, index: number): boolean;

    /**
     * 获取当前成就点数
     */
    getNowPoint(): number;

    /**
     * 检查所有到达过的楼层，用于成就的计算
     */
    checkVisitedFloor(): void;
}

interface PluginReplay {
    ready(): void;
    readyClip(): number;
    clip(...replace: string[]): void;
}

interface PluginChase {
    chaseInit1(): void;
}

interface SkillEffects {
    jumpIgnoreFloor: FloorIds[];
}

type Chapter = 'chapter1' | 'chapter2';

interface Skill {
    index: number;
    title: string;
    desc: string[];
    consume: string;
    front: LocArr[];
    loc: LocArr;
    max: number;
    effect: string[];
}

interface DamageEnemy {}

type Forward<T> = {
    [K in keyof T as T[K] extends Function
        ? K extends `_${string}`
            ? never
            : K
        : never]: T[K];
};

type ForwardKeys<T> = keyof Forward<T>;
