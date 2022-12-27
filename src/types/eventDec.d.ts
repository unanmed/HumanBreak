type MotaAction = any;
type MotaEvent = any[];

/**
 * 某种类型的商店
 */
type ShopEventOf<T extends keyof ShopEventMap> = ShopEventMap[T];

interface ShopEventMap {
    /**
     * 普通商店
     */
    common: CommonShopEvent;

    /**
     * 道具商店
     */
    item: ItemShopEvent;

    /**
     * 公共事件商店
     */
    event: CommonEventShopEvent;
}

interface ShopEventBase {
    /**
     * 商店的id
     */
    id: string;

    /**
     * 商店快捷名称
     */
    textInList: string;

    /**
     * 是否在未开启状态下快捷商店不显示该商店
     */
    mustEnable: boolean;

    /**
     * 是否不可预览
     */
    disablePreview: boolean;
}

/**
 * 普通商店的一个商店选项
 */
interface CommonShopChoice {
    /**
     * 选项文字
     */
    text: string;

    /**
     * 选项需求，需要是一个表达式
     */
    need: string;

    /**
     * 图标
     */
    icon: AllIds;

    /**
     * 文字的颜色
     */
    color: Color;

    /**
     * 该选项被选中时执行的事件
     */
    action: MotaEvent;
}

/**
 * 普通商店
 */
interface CommonShopEvent extends ShopEventBase {
    /**
     * 商店中显示的文字
     */
    text: string;

    /**
     * 普通商店的选项
     */
    choices: CommonShopChoice[];
}

/**
 * 道具商店的一个选项
 */
interface ItemShopChoice {
    /**
     * 该选项的道具id
     */
    id: AllIdsOf<'items'>;

    /**
     * 道具存量
     */
    number: number;

    /**
     * 购买时消耗的资源数量，是字符串大概是因为这玩意可以用${}
     */
    money: string;

    /**
     * 卖出时获得的资源数量
     */
    sell: string;

    /**
     * 出现条件
     */
    condition: string;
}

/**
 * 道具商店
 */
interface ItemShopEvent extends ShopEventBase {
    /**
     * 道具商店标识
     */
    item: true;

    /**
     * 购买消耗什么东西，金币还是经验
     */
    use: 'money' | 'exp';

    /**
     * 每个选项
     */
    choices: ItemShopChoice[];
}

interface CommonEventShopEvent {
    /**
     * 使用的公共事件
     */
    commonEvent: EventDeclaration;
}

interface AutoEventBase {
    /**
     * 自动事件的触发条件
     */
    condition: string;

    /**
     * 是否只在当前层检测
     */
    currentFloor: boolean;

    /**
     * 优先级，优先级越高越优先执行
     */
    priority: number;

    /**
     * 是否在事件流中延迟执行
     */
    delayExecute: boolean;

    /**
     * 是否允许多次执行
     */
    multiExecute: boolean;

    /**
     * 当条件满足时执行的事件
     */
    data: MotaEvent;
}

interface AutoEvent extends AutoEventBase {
    /**
     * 当前的楼层id
     */
    floorId: FloorIds;

    /**
     * 自动事件的索引
     */
    index: string;

    /**
     * 事件所在的横坐标
     */
    x: number;

    /**
     * 事件所在的纵坐标
     */
    y: number;

    /**
     * 事件的唯一标识符
     */
    symbol: string;
}

interface LevelChooseEvent {
    /**
     * 难度名称
     */
    title: string;

    /**
     * 难度简称
     */
    name: string;

    /**
     * 难度的hard值
     */
    hard: number;

    /**
     * 难度的颜色
     */
    color: RGBArray;

    /**
     * 选择该难度时执行的事件
     */
    action: MotaEvent;
}

interface LevelUpEvent {
    /**
     * 升级所需经验
     */
    need: number;

    /**
     * 这个等级的等级名
     */
    title: string;

    /**
     * 升级时执行的事件
     */
    action: MotaEvent;
}

/**
 * 门信息
 */
interface DoorInfo {
    /**
     * 开门时间
     */
    time: number;

    /**
     * 开门音效
     */
    openSound: SoundIds;

    /**
     * 关门音效
     */
    closeSound: SoundIds;

    /**
     * 需要的钥匙
     */
    keys: Partial<Record<ItemIdOf<'tools'> | `${ItemIdOf<'tools'>}:o`, number>>;

    /**
     * 开门后事件
     */
    afterOpenDoor?: MotaEvent;
}

interface ChangeFloorEvent {
    /**
     * 到达的楼层
     */
    floorId: ':before' | ':after' | ':now' | FloorIds;

    /**
     * 到达的坐标，填了的话stair就无效了
     */
    loc?: LocArr;

    /**
     * 到达的坐标
     */
    stair?: FloorChangeStair;

    /**
     * 勇士朝向
     */
    direction?: HeroTurnDir;

    /**
     * 楼层转换时间
     */
    time?: number;

    /**
     * 是否不可穿透
     */
    ignoreChangeFloor?: boolean;
}
