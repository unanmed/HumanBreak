/**
 * 怪物buff缓存
 */
interface EnemyBuffCache {
    /**
     * 生命值提升量
     */
    hp_buff: number;

    /**
     * 攻击提升量
     */
    atk_buff: number;

    /**
     * 防御提升量
     */
    def_buff: number;

    /**
     * 支援信息
     */
    guards: [number, number, string][];
}

interface CheckBlockStatus {
    /**
     * 捕捉信息
     */
    ambush: Record<LocString, [number, number, string, Dir]>;

    /**
     * 阻击信息
     */
    repulse: Record<LocString, [number, number, string, Dir]>;

    /**
     * 每点的伤害，小于等于0会不显示
     */
    damage: Record<LocString, number>;

    /**
     * 是否需要重算
     */
    needCache: boolean;

    /**
     * 每点的伤害类型
     */
    type: Record<LocString, Record<string, number>>;

    /**
     * 缓存信息，是每个怪物受到的光环加成
     */
    cache: Record<string, DeepReadonly<EnemyBuffCache>>;

    /**
     * 光环信息
     */
    halo: Record<LocString, string[]>;
}

interface DamageStatus {
    /**
     * v2优化下当前的偏移横坐标，单位格子
     */
    posX: number;

    /**
     * v2优化下当前的偏移纵坐标，单位格子
     */
    posY: number;

    /**
     * 显示的伤害信息
     */
    data: DamageStatusData[];

    /**
     * 地图伤害或其它在地图上显示的文字
     */
    extraData: DamageStatusExtraData[];
}

interface DamageStatusData {
    /**
     * 显示的文字
     */
    text: string;

    /**
     * 显示横坐标，单位像素
     */
    px: number;

    /**
     * 显示纵坐标，单位像素
     */
    py: number;

    /**
     * 文字的颜色
     */
    color: Color;
}

interface DamageStatusExtraData extends DamageStatusData {
    /**
     * 文字的不透明度
     */
    alpha: number;
}

interface AutomaticRouteStatus {
    /**
     * 勇士是否正在移动
     */
    autoHeroMove: boolean;

    /**
     * 不太清楚用处
     */
    autoStep: number;

    /**
     * 自动寻路中已经走过的步数
     */
    movedStep: number;

    /**
     * 自动寻路的总步数
     */
    destStep: number;

    /**
     * 自动寻路的目标横坐标
     */
    destX: number;

    /**
     * 自动寻路的目标纵坐标
     */
    destY: number;

    /**
     * 自动寻路绘图时的偏移横坐标，单位像素
     */
    offsetX: number;

    /**
     * 自动寻路绘图时的偏移纵坐标，单位像素
     */
    offsetY: number;

    /**
     * 自动寻路的路线
     */
    autoStepRoutes: AutoStep[];

    /**
     * 剩下的自动寻路路线
     */
    moveStepBeforeStop: AutoStep[];

    /**
     * 上一步的勇士方向
     */
    lastDirection: Dir;

    /**
     * 光标界面(按下E时的界面)的光标横坐标
     */
    cursorX: number;

    /**
     * 光标界面(按下E时的界面)的光标纵坐标
     */
    cursorY: number;

    /**
     * 是否瞬间移动
     */
    moveDirectly: boolean;
}

interface AutoStep {
    /**
     * 当前步的步数
     */
    step: number;

    /**
     * 当前步走向的方向
     */
    direction: Dir;
}

interface ReplaySaveBase {
    /**
     * 录像播放时，剩下的要播放的录像内容
     */
    toReplay: string[];

    /**
     * 录像播放时，录像的完整信息
     */
    totalList: string[];

    /**
     * 不太清楚用处，应该是与录像回退有关的
     */
    steps: number;
}

interface ReplayStatus extends ReplaySaveBase {
    /**
     * 当前是否正在播放录像，同core.isReplaying()
     */
    replaying: boolean;

    /**
     * 当前录像有没有暂停
     */
    pausing: boolean;

    /**
     * 当前是否正在某段动画中
     */
    animate: boolean;

    /**
     * 录像播放是否失败
     */
    failed: boolean;

    /**
     * 当前的录像播放速度
     */
    speed: number;

    /**
     * 录像的回退信息
     */
    save: ReplaySave[];
}

interface ReplaySave {
    /**
     * 回退的存档信息
     */
    data: Save;

    /**
     * 回退的录像信息
     */
    replay: ReplaySaveBase;
}

interface TextAttribute {
    /**
     * 文本框的位置
     */
    position: TextPosition;

    /**
     * 文本的左右对齐方式
     */
    align: 'left' | 'center' | 'right';

    /**
     * 偏移像素
     */
    offset: number;

    /**
     * 标题颜色
     */
    title: RGBArray;

    /**
     * 背景颜色
     */
    background: RGBArray | ImageIds;

    /**
     * 文字颜色
     */
    text: RGBArray;

    /**
     * 标题字体大小
     */
    titlefont: number;

    /**
     * 正文字体大小
     */
    textfont: number;

    /**
     * 是否加粗
     */
    bold: boolean;

    /**
     * 打字机时间，每隔多少毫秒显示一个字
     */
    time: number;

    /**
     * 字符间距
     */
    letterSpacing: number;

    /**
     * 淡入淡出时间
     */
    animateTime: number;

    /**
     * 行距
     */
    lineHeight: number;
}

interface StatusStyle {
    /**
     * 左侧状态栏背景，css的background属性
     */
    statusLeftBackground: string;

    /**
     * 上部状态栏背景，css的background属性
     */
    statusTopBackground: string;

    /**
     * 竖屏下的工具栏背景，css的background属性
     */
    toolsBackground: string;

    /**
     * 游戏的边框颜色
     */
    borderColor: Color;

    /**
     * 状态栏文字的颜色
     */
    statusBarColor: Color;

    /**
     * 楼层切换样式，css字符串
     */
    floorChangingStyle: string;

    /**
     * 全局字体
     */
    font: string;
}

interface GlobalAttribute extends StatusStyle {
    /**
     * 装备栏名称
     */
    equipName: string[];
}

interface FloorAnimate {
    /**
     * 图片的目标画布
     */
    canvas: 'bg' | 'fg';

    /**
     * 图片的名称
     */
    name: ImageIds;

    /**
     * 绘制横坐标
     */
    x: number;

    /**
     * 绘制纵坐标
     */
    y: number;

    /**
     * 裁剪横坐标
     */
    sx?: number;

    /**
     * 裁剪纵坐标
     */
    sy?: number;

    /**
     * 裁剪宽度
     */
    w?: number;

    /**
     * 裁剪高度
     */
    h?: number;

    /**
     * 绘制帧数
     */
    frame?: number;

    /**
     * 图片翻转
     */
    reverse?: ':x' | ':y' | ':o';

    /**
     * 是否禁用
     */
    disable?: boolean;
}

interface BoxAnimate {
    /**
     * 动画的帧数
     */
    animate: number;

    /**
     * 背景的高度
     */
    bgHeight: number;

    /**
     * 背景的宽度
     */
    bgWidth: number;

    /**
     * 背景的左上角横坐标
     */
    bgx: number;

    /**
     * 背景的左上角纵坐标
     */
    bgy: number;

    /**
     * 动画图片的高度
     */
    height: 32 | 48;

    /**
     * 图片信息
     */
    img: HTMLImageElement;

    /**
     * 这个图块的图片在其素材图片的纵坐标
     */
    pos: number;

    /**
     * 图块的横坐标
     */
    x: number;

    /**
     * 图块的纵坐标
     */
    y: number;
}

interface BigImageBoxAnimate {
    /**
     * 大图片的贴图信息
     */
    bigImage: HTMLImageElement;

    /**
     * 贴图的朝向
     */
    face: Dir;

    /**
     * 中心横坐标
     */
    centerX: number;

    /**
     * 中心纵坐标
     */
    centerY: number;

    /**
     * 最大宽度
     */
    max_width: number;

    /**
     * 绘制到的画布
     */
    ctx: CtxRefer;
}

interface AnimateObj {
    /**
     * 动画名称
     */
    name: AnimationIds;

    /**
     * 动画的唯一标识符
     */
    id: number;

    /**
     * 动画信息
     */
    animate: Animate;

    /**
     * 中心横坐标
     */
    centerX: number;

    /**
     * 中心纵坐标
     */
    centerY: number;

    /**
     * 当前帧数
     */
    index: number;

    /**
     * 回调函数
     */
    callback: () => void;
}

interface ActionsPreview {
    /**
     * 大地图中当前是否正在拖拽
     */
    dragging: boolean;

    /**
     * 大地图中是否允许拖拽
     */
    enabled: boolean;

    /**
     * 大地图中当前是否已经按下了鼠标
     */
    prepareDragging: boolean;

    /**
     * 当前鼠标的横坐标
     */
    px: number;

    /**
     * 当前鼠标的纵坐标
     */
    py: number;
}

interface RouteFolding {
    /**
     * 录像折叠信息中的勇士信息
     */
    hero: Omit<SelectType<HeroStatus, number>, 'steps'>;

    /**
     * 折叠的长度
     */
    length: number;
}

/**
 * 初始游戏状态
 */
interface InitGameStatus {
    /**
     * 是否开始了游戏
     */
    played: boolean;

    /**
     * 游戏是否结束
     */
    gameOver: boolean;

    /**
     * 所有楼层的地图信息
     */
    maps: {
        [P in FloorIds]: Floor<P>;
    };

    /**
     * 背景图块
     */
    bgmaps: Record<FloorIds, number[][]>;

    /**
     * 前景图块
     */
    fgmaps: Record<FloorIds, number[][]>;

    /**
     * 以坐标列举的图块
     */
    mapBlockObjs: Record<FloorIds, Record<LocString, Block>>;

    /**
     * 伤害显示信息
     */
    damage: DeepReadonly<DamageStatus>;

    /**
     * 是否锁定了用户控制
     */
    lockControl: boolean;

    /**
     * 勇士移动状态，每个数字干啥的自己去libs翻，这东西太复杂了，不过应该不会有人用这个东西吧（
     */
    heroMoving: number;

    /**
     * 勇士是否停下了
     */
    heroStop: boolean;

    /**
     * 自动寻路状态
     */
    automaticRoute: DeepReadonly<AutomaticRouteStatus>;

    /**
     * 按键按下的时间，用于判定双击
     */
    downTime: number;

    /**
     * ctrl键是否倍按下
     */
    ctrlDown: boolean;

    /**
     * 当前录像信息
     */
    route: string[];

    /**
     * 当前的回放状态
     */
    replay: DeepReadonly<ReplayStatus>;

    /**
     * 当前的所有全局商店
     */
    shops: Record<string, ShopEventOf<keyof ShopEventMap>>;

    /**
     * 当前的事件状态，样板最大的败笔之一，离谱到逆天
     */
    event: EventStatusOf;

    /**
     * 当前的所有自动事件
     */
    autoEvents: DeepReadonly<AutoEvent[]>;

    /**
     * 当前的全局剧情文本设置
     */
    textAttribute: TextAttribute;

    /**
     * 部分全局属性，会跟随存档
     */
    globalAttribute: GlobalAttribute;

    /**
     * 色调的颜色
     */
    curtainColor: Color;

    /**
     * 全局动画对象
     */
    globalAnimateObjs: Block<
        IdToNumber[AllIdsOf<Exclude<AnimatableCls, 'autotile'>>]
    >[];

    /**
     * 楼层贴图
     */
    floorAnimateObjs: FloorAnimate[];

    /**
     * 所有的BoxAnimate信息
     */
    boxAnimateObjs: (BoxAnimate | BigImageBoxAnimate)[];

    /**
     * 所有的自动元件动画
     */
    autotileAnimateObjs: Block<IdToNumber[AllIdsOf<'autotile'>]>[];

    /**
     * 全局动画状态，每经过一个全局动画时间便加一
     */
    globalAnimateStatus: number;

    /**
     * 所有绘制的动画
     */
    animateObjs: AnimateObj[];

    /**
     * 当前难度
     */
    hard: string;

    /**
     * 勇士的中心
     */
    heroCenter: Record<'px' | 'py', number>;

    /**
     * 当前按下的按键
     */
    holdingKeys: number[];

    /**
     * id转数字
     */
    id2number: IdToNumber;

    /**
     * 数字转图块
     */
    number2block: {
        [P in keyof NumberToId]: Block<P>;
    };

    /**
     * 大地图中的拖拽处理
     */
    preview: ActionsPreview;

    /**
     * 录像折叠信息
     */
    routeFolding: Record<`${LocString},${FirstCharOf<Dir>}`, RouteFolding>;
}

/**
 * 运行时的游戏状态
 */
interface GameStatus extends InitGameStatus {
    /**
     * 当前层的floorId
     */
    floorId: FloorIds;

    /**
     * 获得当前楼层信息，等价于core.status.maps[core.status.floorId]
     */
    thisMap: ResolvedFloor;

    /**
     * 地图伤害
     */
    checkBlock: Readonly<CheckBlockStatus>;

    /**
     * 当前勇士状态信息。例如core.status.hero.atk就是当前勇士的攻击力数值
     */
    hero: HeroStatus;
}

interface Follower {
    /**
     * 跟随者的图片id
     */
    name: ImageIds;
}

interface HeroStatistics {
    /**
     * 击败的怪物数量
     */
    battle: number;

    /**
     * 由于战斗损失的生命值
     */
    battleDamage: number;

    /**
     * 当前游戏时间
     */
    currentTime: number;

    /**
     * 获得的总经验值
     */
    exp: number;

    /**
     * 由于地图伤害损失的生命值
     */
    extraDamage: number;

    /**
     * 总共损失的生命值
     */
    hp: number;

    /**
     * 由于瞬移少走的步数
     */
    ignoreSteps: number;

    /**
     * 总共获得的金币数
     */
    money: number;

    /**
     * 瞬移次数
     */
    moveDirectly: number;

    /**
     * 中毒损失的生命值
     */
    poisonDamage: number;

    /**
     * 本次游戏的开始时间
     */
    startTime: number;

    /**
     * 游戏总时间
     */
    totalTime: number;
}

/**
 * 勇士状态
 */
interface HeroStatus {
    /**
     * 勇士停止时及对话框中是否启用帧动画
     */
    animate: boolean;

    /**
     * 勇士生命值
     */
    hp: number;

    /**
     * 勇士生命上限
     */
    hpmax: number;

    /**
     * 勇士的攻击
     */
    atk: number;

    /**
     * 勇士的防御
     */
    def: number;

    /**
     * 勇士的魔防
     */
    mdef: number;

    /**
     * 勇士的等级
     */
    lv: number;

    /**
     * 勇士的经验
     */
    exp: number;

    /**
     * 勇士的金币
     */
    money: number;

    /**
     * 勇士的魔法
     */
    mana: number;

    /**
     * 勇士的魔法上限
     */
    manamax: number;

    /**
     * 勇士的名称
     */
    name: string;

    /**
     * 勇士移动过的步数
     */
    steps: number;

    /**
     * 勇士的图片
     */
    image: ImageIds;

    /**
     * 当前勇士的装备
     */
    equipment: ItemIdOf<'equips'>[];

    /**
     * 勇士当前的位置
     */
    loc: Loc;

    /**
     * 当前的变量
     */
    flags: Flags;

    /**
     * 勇士的跟随者
     */
    followers: Follower[];

    /**
     * 勇士拥有的道具
     */
    items: {
        [P in Exclude<ItemCls, 'items'>]: Record<ItemIdOf<P>, number>;
    };

    /**
     * 勇士学习的特技
     */
    special: {
        num: [];
        last: [];
        [k: string]: any;
    };
}
