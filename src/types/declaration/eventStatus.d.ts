interface EventStatusDataMap {
    /**
     * 执行事件中
     */
    action: ActionStatusData;

    /**
     * 怪物手册的信息，是当前选择了哪个怪物
     */
    book: number;

    /**
     * 楼层传送器中当前楼层索引
     */
    fly: number;

    /**
     * 浏览地图时的信息
     */
    viewMaps: ViewMapStatusData;

    /**
     * 装备栏的信息
     */
    equipbox: EquipboxStatusData;

    /**
     * 道具栏的信息
     */
    toolbox: ToolboxStatusData;

    /**
     * 存档界面的信息
     */
    save: SaveStatusData;
    load: SaveStatusData;
    replayLoad: SaveStatusData;
    replayRemain: SaveStatusData;
    replaySince: SaveStatusData;

    /**
     * 文本框界面的信息
     */
    text: TextStatusData;

    /**
     * 确认框界面的信息
     */
    confirmBox: ConfirmStatusData;

    /**
     * 关于界面，帮助界面，怪物手册详细信息界面，虚拟键盘界面，系统设置界面，系统选项栏界面，
     * 快捷商店界面，存档笔记界面，同步存档界面，光标界面，录像回放界面，游戏信息界面，没有东西
     */
    about: null;
    help: null;
    'book-detail': null;
    keyBoard: null;
    switchs: null;
    'switchs-sounds': null;
    'switchs-display': null;
    'switchs-action': null;
    settings: null;
    selectShop: null;
    notes: null;
    syncSave: null;
    syncSelect: null;
    localSaveSelect: null;
    storageRemove: null;
    cursor: null;
    replay: null;
    gameInfo: null;
}

interface _EventStatusSelectionMap {
    /**
     * 执行事件中，一般是选择框的当前选中项
     */
    action: number;

    /**
     * 装备栏中当前选中了哪个装备
     */
    equipbox: number;

    /**
     * 道具栏中当前选中了哪个道具
     */
    toolbox: number;

    /**
     * 当前是否是删除模式
     */
    save: boolean;
    load: boolean;

    /**
     * 当前选择了确认(0)还是取消(1)
     */
    confirmBox: 0 | 1;

    /**
     * 系统设置界面，存档笔记界面，同步存档界面，录像回放界面，游戏信息界面，当前的选择项
     */
    switchs: number;
    'switchs-sounds': number;
    'switchs-display': number;
    'switchs-action': number;
    settings: number;
    notes: number;
    syncSave: number;
    syncSelect: number;
    localSaveSelect: number;
    storageRemove: number;
    replay: number;
    gameInfo: number;
}

interface _EventStatusUiMap {
    /**
     * 执行事件中，一般是与选择框有关的
     */
    action: ActionStatusUi;

    /**
     * 如果是从浏览地图界面呼出的怪物手册，该项是当前正在浏览的地图的索引（注意不是id）
     */
    book: number;

    /**
     * 确认框中显示的文字
     */
    confirmBox: string;

    /**
     * 显示设置的选择信息
     */
    'switchs-display': SwitchsStatusData;

    /**
     * 系统选项栏的选择信息
     */
    settings: SwitchsStatusData;

    /**
     * 快捷商店界面，存档笔记界面，同步存档界面，录像回放界面，游戏信息界面的绘制信息
     */
    selectShop: SelectShopStatusUi;
    notes: SelectShopStatusUi;
    syncSave: SelectShopStatusUi;
    syncSelect: SelectShopStatusUi;
    localSaveSelect: SelectShopStatusUi;
    storageRemove: SelectShopStatusUi;
    gameInfo: SelectShopStatusUi;
}

interface _EventStatusIntervalMap {
    /**
     * 执行事件中，一般用于呼出某个界面时暂存当前事件信息(?
     */
    action: ActionStatusData;

    /**
     * 如果是从事件中呼出的，用于存储当前事件信息，当退出怪物手册时恢复事件
     */
    book: ActionStatusData;

    /**
     * 如果是从事件中呼出的，用于存储当前事件信息，当退出存档节目时恢复事件
     */
    save: ActionStatusData;
    load: ActionStatusData;
}

interface _EventStatusTimeoutMap {
    /**
     * 执行事件中，一般是等待用户操作事件等事件中的超时时间的判定
     */
    action: number;
}

interface _EventStatusAnimateUiMap {
    /**
     * 执行事件中，一般是对话框事件的动画定时器
     */
    action: number;
}

type EventStatus = keyof EventStatusDataMap;

type _FillEventStatus<T> = {
    [P in EventStatus]: P extends keyof T ? T[P] : null;
};

type EventStatusSelectionMap = _FillEventStatus<_EventStatusSelectionMap>;
type EventStatusUiMap = _FillEventStatus<_EventStatusUiMap>;
type EventStatusIntervalMap = _FillEventStatus<_EventStatusIntervalMap>;
type EventStatusTimeoutMap = _FillEventStatus<_EventStatusTimeoutMap>;
type EventStatusAnimateUiMap = _FillEventStatus<_EventStatusAnimateUiMap>;

/**
 * 某个事件状态下的信息
 */
interface EventStatusOf<T extends EventStatus = EventStatus> {
    /**
     * 当前事件状态的类型
     */
    id: T;

    /**
     * 当前事件状态的信息
     */
    data: EventStatusDataMap[T];

    /**
     * 当前事件状态的选择信息
     */
    selection: EventStatusSelectionMap[T];

    /**
     * 当前事件状态的ui信息
     */
    ui: EventStatusUiMap[T];

    /**
     * 当前事件状态的定时器信息
     */
    interval: EventStatusIntervalMap[T];

    /**
     * 当前事件状态的计时器信息
     */
    timeout: EventStatusTimeoutMap[T];

    /**
     * 当前事件状态的动画信息
     */
    animateUi: EventStatusAnimateUiMap[T];
}

interface ActionStatusEventList {
    /**
     * 要执行的事件列表
     */
    todo: MotaEvent;

    /**
     * 全部的事件列表
     */
    total: MotaEvent;

    /**
     * 执行条件
     */
    contidion: string;
}

interface ActionLocStackInfo {
    /**
     * 横坐标
     */
    x: number;

    /**
     * 纵坐标
     */
    y: number;

    /**
     * 楼层id
     */
    floorId: FloorIds;
}

/**
 * 执行事件中
 */
interface ActionStatusData {
    /**
     * 当前的事件列表
     */
    list: DeepReadonly<ActionStatusEventList>;

    /**
     * 事件执行的横坐标，或者对话框的横坐标
     */
    x?: number;

    /**
     * 事件执行的纵坐标，或者对话框的纵坐标
     */
    y?: number;

    /**
     * 事件执行完毕的回调函数
     */
    callback?: () => void;

    /**
     * 不太清楚用处，可能是与自动事件有关的
     */
    appendingEvents: MotaEvent[];

    /**
     * 事件的坐标栈
     */
    locStack: any[];

    /**
     * 当前的事件类型
     */
    type: string;

    /**
     * 当前事件
     */
    current: MotaAction;
}

interface ActionStatusUi {
    /**
     * 显示文字事件的文字，包括确认框等
     */
    text: string;

    /**
     * 确认框中确定时执行的事件
     */
    yes?: MotaEvent;

    /**
     * 确认框中取消时执行的事件
     */
    no?: MotaEvent;

    /**
     * 当前是选择事件时所有的选项
     */
    choices?: string[];

    /**
     * 当前是选择事件时选项框的宽度
     */
    width?: number;
}

interface ViewMapStatusData {
    /**
     * 当前浏览的楼层索引
     */
    index: number;

    /**
     * 是否显示伤害
     */
    damage: boolean;

    /**
     * 大地图是否显示全部地图
     */
    all: boolean;

    /**
     * 大地图不显示全部地图时当前的横坐标，单位格子
     */
    x: number;

    /**
     * 大地图不显示全部地图时当前的纵坐标，单位格子
     */
    y: number;
}

interface EquipboxStatusData {
    /**
     * 拥有装备的当前页数
     */
    page: number;

    /**
     * 当前选中的装备
     */
    selectId: ItemIdOf<'equips'>;
}

interface ToolboxStatusData {
    /**
     * 消耗道具的当前页码数
     */
    toolsPage: number;

    /**
     * 永久道具的当前页码数
     */
    constantsPage: number;

    /**
     * 当前选中的道具id
     */
    selectId: ItemIdOf<'constants' | 'tools'>;
}

interface SaveStatusData {
    /**
     * 当前存读档界面的页码数
     */
    page: number;

    /**
     * 选择的框的偏移量，在不同状态下意义不同
     */
    offset: number;

    /**
     * 当前存读档界面的模式，fav表示收藏，all表示所有存档
     */
    mode: 'fav' | 'all';
}

interface TextStatusData {
    /**
     * 文本框要显示的文字列表
     */
    list: string[];

    /**
     * 文字显示完毕后的回调函数
     */
    callback: () => void;
}

interface ConfirmStatusData {
    /**
     * 点击确认时
     */
    yes: () => void;

    /**
     * 点击取消时
     */
    no: () => void;
}

interface SwitchsStatusData {
    /**
     * 选择项
     */
    choices: string[];
}

interface SelectShopStatusUi {
    /**
     * 选择框的偏移量
     */
    offset: number;
}
