/// <reference path="./action.d.ts" />
/// <reference path="./control.d.ts" />
/// <reference path="./enemy.d.ts" />
/// <reference path="./event.d.ts" />
/// <reference path="./icon.d.ts" />
/// <reference path="./item.d.ts" />
/// <reference path="./loader.d.ts" />
/// <reference path="./map.d.ts" />
/// <reference path="./plugin.d.ts" />
/// <reference path="./status.d.ts" />
/// <reference path="./ui.d.ts" />
/// <reference path="./util.d.ts" />
/// <reference path="./data.d.ts" />
/// <reference path="./eventDec.d.ts" />
/// <reference path="./eventStatus.d.ts" />
/// <reference path="./source.d.ts" />
/// <reference path="./function.d.ts" />
/// <reference path="../source/cls.d.ts" />
/// <reference path="../source/data.d.ts" />
/// <reference path="../source/events.d.ts" />
/// <reference path="../source/items.d.ts" />
/// <reference path="../source/maps.d.ts" />

type MaterialIcon = {
    [C in Exclude<Cls, 'tilesets'>]: {
        [P in AllIdsOf<C>]: number;
    };
} & {
    /**
     * 勇士的图标信息
     */
    hero: {
        /**
         * 各个方向的图标信息
         */
        [D in Dir2]: {
            /**
             * 行数
             */
            loc: number;

            /**
             * 第一列
             */
            stop: number;

            /**
             * 第二列
             */
            leftFoot: number;

            /**
             * 第三列
             */
            midFoot: number;

            /**
             * 第四列
             */
            rightFoot: number;
        };
    } & {
        /**
         * 勇士的宽度
         */
        width: number;

        /**
         * 勇士的高度
         */
        height: number;
    };
};

type MaterialImages = {
    /**
     * 各个类型的图块的图片
     */
    [C in Exclude<Cls, 'tilesets'>]: HTMLImageElement;
} & {
    /**
     * 空气墙
     */
    airwall: HTMLImageElement;

    /**
     * 自动元件
     */
    autotile: Record<AllIdsOf<'autotile'>, HTMLImageElement>;

    /**
     * 全塔属性注册的图片
     */
    images: Record<ImageIds, HTMLImageElement>;

    /**
     * 额外素材
     */
    tilesets: Record<string, HTMLImageElement>;

    hero: HTMLImageElement;
};

interface Material {
    /**
     * 动画信息
     */
    readonly animates: Record<AnimationIds, Animate>;

    /**
     * 素材的图片信息
     */
    readonly images: MaterialImages;

    /**
     * 音乐信息
     */
    readonly bgms: Record<BgmIds, HTMLAudioElement>;

    /**
     * 音效信息
     */
    readonly sounds: Record<SoundIds, AudioBuffer>;

    /**
     * 怪物信息
     * @example core.material.enemys.greenSlime // 获得绿色史莱姆的属性数据
     */
    readonly enemys: {
        [P in EnemyIds]: Enemy<P>;
    };

    /**
     * 道具信息
     */
    readonly items: {
        [P in AllIdsOf<'items'>]: Item<P>;
    };

    /**
     * 图标信息
     */
    readonly icons: DeepReadonly<MaterialIcon>;

    /**
     * @deprecated
     * core定义了，但在代码中完全没有找到这个东西？用处未知
     */
    readonly ground: CanvasRenderingContext2D;

    /**
     * 楼层背景的画布context
     */
    readonly groundCanvas: CanvasRenderingContext2D;

    /**
     * 楼层背景的canvas样式
     */
    readonly groundPattern: CanvasPattern;

    /**
     * 自动元件的父子关系
     */
    readonly autotileEdges: Record<
        AllNumbersOf<'autotile'>,
        AllNumbersOf<'autotile'>[]
    >;
}

interface Timeout {
    /**
     * 单击勇士时的计时器，用于判断双击
     */
    turnHeroTimeout?: number;

    /**
     * 按住500ms后进行长按判定的计时器
     */
    onDownTimeout?: number;

    /**
     * 长按跳过等待事件的计时器
     */
    sleepTimeout?: number;
}

interface Interval {
    /**
     * 勇士移动的定时器
     */
    heroMoveInterval?: number;

    /**
     * 长按计时器
     */
    onDownInterval?: number;
}

interface AnimateFrame {
    /**
     * 游戏总时间
     */
    readonly totalTime: number;

    /**
     * 本次游戏开始的时间
     */
    readonly totalTimeStart: number;

    /**
     * @deprecated
     * 样板没有出现过
     */
    globalAnimate: boolean;

    /**
     * 当前raf的时间戳，即从游戏加载完毕到现在经过的时间
     */
    readonly globalTime: number;

    /**
     * @deprecated
     * 样板没有出现过
     */
    selectorTime: number;

    /**
     * @deprecated
     * 样板没有出现过
     */
    selectorUp: boolean;

    /**
     * 上一次全局动画的时间（怪物、npc等抖动一下的时间）
     */
    readonly animateTime: number;

    /**
     * 勇士移动的时候上一次的换腿时间
     */
    moveTime: number;

    /**
     * @deprecated
     * 样板没有出现过
     */
    lastLegTime: number;

    /**
     * 当前是否在左腿上，使用了四帧插件时无效
     */
    leftLeg: boolean;

    /**
     * 当前天气信息
     */
    readonly weather: Weather;

    /**
     * 左上角提示
     */
    readonly tip?: Readonly<Tip>;

    /**
     * 异步信息，想不到吧，这玩意是一个以number为索引的回调函数列表
     */
    readonly asyncId: Record<number, () => void>;

    /**
     * 上一个异步事件的id
     */
    readonly lastAsyncId: number;
}

interface Weather {
    /**
     * 当前的raf时间戳，同globalTime，但只有部分天气有用
     */
    time: number;

    /**
     * 当前天气类型
     */
    type: string;

    /**
     * 谁会去用这个玩意？？？
     */
    nodes: any[];

    /**
     * 谁会去用这个玩意？？？
     */
    data: any;

    /**
     * 当前的天气等级
     */
    readonly level: number;

    /**
     * 雾的图片信息
     */
    readonly fog: HTMLImageElement;

    /**
     * 多云的图片信息
     */
    readonly cloud: HTMLImageElement;

    /**
     * 晴天的图片信息
     */
    readonly sun: HTMLImageElement;
}

interface Tip {
    /**
     * 显示的文字
     */
    text: string;

    /**
     * 文字的左边像素位置
     */
    textX: 21 | 45;

    /**
     * 提示的宽度
     */
    width: number;

    /**
     * 当前的不透明度，会在显示提示时不断变化
     */
    opacity: number;

    /**
     * 在显示阶段还是常亮阶段还是消失阶段
     */
    stage: number;

    /**
     * 图标的帧数，即显示图标的第几帧
     */
    frame: number;

    /**
     * 当前的raf时间戳
     */
    time: number;

    /**
     * 在提示进入常亮阶段后经过了多长时间
     */
    displayTime: number;
}

interface MusicStatus {
    /**
     * AudioContext信息，注意如果浏览器不支持的话会是null
     */
    audioContext: AudioContext;

    /**
     * 是否允许播放BGM
     */
    bgmStatus: boolean;

    /**
     * 是否允许播放SE
     */
    soundStatus: boolean;

    /**
     * 正在播放的BGM
     */
    playingBgm: string;

    /**
     * 上次播放的bgm
     */
    lastBgm: string;

    /**
     * 音量控制节点，只对音效有效，但为什么样板只有一个呢
     */
    gainNode: GainNode;

    /**
     * 正在播放的SE，这个__name是音效名
     */
    playingSounds: Record<number, AudioBufferSourceNode & { __name: string }>;

    /**
     * 用户音量
     */
    userVolume: number;

    /**
     * 设计音量，好吧其实不能设计，只有淡入淡出的时候有用
     */
    designVolume: number;

    /**
     * 音乐播放速度
     */
    bgmSpeed: number;

    /**
     * 修改音乐播放速度时是否修改音调
     */
    bgmUsePitch: boolean;

    /**
     * 缓存过BGM内容
     */
    cachedBgms: string[];

    /**
     * 缓存的bgm数量
     */
    cachedBgmCount: 8;
}

interface CorePlatform {
    /**
     * 是否http
     */
    isOnline: boolean;

    /**
     * 是否是PC
     */
    isPC: boolean;

    /**
     * 是否是Android
     */
    isAndroid: boolean;

    /**
     * 是否是iOS
     */
    isIOS: boolean;

    /**
     * 平台信息
     */
    string: 'PC' | 'Android' | 'IOS' | '';

    /**
     * 是否是微信
     */
    isWeChat: boolean;

    /**
     * 是否是QQ
     */
    isQQ: boolean;

    /**
     * 是否是Chrome
     */
    isChrome: boolean;

    /**
     * 是否是safari浏览器
     */
    isSafari: boolean;

    /**
     * 是否支持复制到剪切板
     */
    supportCopy: boolean;

    /**
     * 读取文件时的input元素（我也不知道干啥的
     */
    fileInput: HTMLInputElement;

    /**
     * FileReader示例
     */
    fileReader: FileReader;

    /**
     * 读取成功
     */
    successCallback?: (obj: any) => void;

    /**
     * 读取失败
     */
    errorCallback?: () => void;
}

/**
 * dom信息，没有全部标注，只标注了一部分特例
 */
type MainDom = {
    /**
     * 所有的状态信息
     */
    status: HTMLCollectionOf<HTMLDivElement>;

    /**
     * 所有的工具栏图片
     */
    tools: HTMLCollectionOf<HTMLImageElement>;

    /**
     * 所有的游戏画布
     */
    gameCanvas: HTMLCollectionOf<HTMLCanvasElement>;

    /**
     * 所有的状态显示信息，有的是<p>有的是<span>就挺离谱
     */
    statusLabels: HTMLCollectionOf<HTMLSpanElement | HTMLParagraphElement>;

    /**
     * <p>标签的状态显示文字
     */
    statusText: HTMLCollectionOf<HTMLParagraphElement>;

    /**
     * 自绘状态栏画布的context
     */
    statusCanvasCtx: CanvasRenderingContext2D;
} & {
    [key: string]: HTMLElement;
};

interface DomStyle {
    /**
     * 当前缩放大小
     */
    scale: number;

    /**
     * 就是window.devicePixelRatio
     */
    ratio: number;

    /**
     * 高清画布列表
     */
    hdCanvas: string[];

    /**
     * 可以缩放到的缩放比例，是 [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5] 的子数组
     */
    availableScale: number[];

    /**
     * 是否是竖屏
     */
    isVertical: boolean;

    /**
     * 是否显示状态栏
     */
    showStatusBar: boolean;

    /**
     * 当前道具栏是否是数字键
     */
    toolbarBtn: boolean;
}

interface CoreBigmap {
    /**
     * 大地图中会跟随勇士移动的画布
     */
    canvas: string[];

    /**
     * 大地图的横向偏移量，单位像素
     */
    offsetX: number;

    /**
     * 大地图的纵向偏移量，单位像素
     */
    offsetY: number;

    /**
     * v2优化下的横向偏移格子数
     */
    posX: number;

    /**
     * v2优化下的纵向偏移格子数
     */
    posY: number;

    /**
     * 地图宽度，单位格子
     */
    width: number;

    /**
     * 地图高度，单位格子
     */
    height: number;

    /**
     * 是否使用v2优化
     */
    v2: boolean;

    /**
     * 判定为超大的图的地图面积临界，使用了显示宝石血瓶详细信息插件的话是256
     */
    threshold: 1024;

    /**
     * v2优化下，显示超出的格子数，例如样板是10，那么13\*13的样板就是33\*33，还用于判断是否进行更新等
     */
    extend: 10;

    /**
     * @deprecated
     * 又出现了！样板中没有的东西
     */
    scale: 1;

    /**
     * 绘制缩略图时的临时画布
     */
    tempCanvas: CanvasRenderingContext2D;

    /**
     * 绘制地图时的双缓冲层
     */
    cacheCanvas: CanvasRenderingContext2D;
}

interface CoreSave {
    /**
     * 当前存档页面显示的页码数
     */
    saveIndex: number;

    /**
     * 当前存在存档的存档位
     */
    ids: Record<number, boolean>;

    /**
     * 自动存档信息
     */
    autosave: Readonly<Autosave>;

    /**
     * 收藏的存档
     */
    favorite: number[];

    /**
     * 保存的存档名称
     */
    favoriteName: Record<number, string>;
}

interface Autosave {
    /**
     * 当前自动存档位
     */
    now: number;

    /**
     * 当前存档信息
     */
    data?: Save[];

    /**
     * 自动存档位的最大值
     */
    max: 20;

    /**
     * 是否将自动存档写入本地文件
     */
    storage: true;

    /**
     * @deprecated
     * 每5秒钟会被设置一次的raf时间戳，不知道干什么的。。。
     */
    time: number;

    /**
     * @deprecated
     * 样板在不停设置这个东西，但不知道什么用处，因为没有调用它的地方
     */
    updated: boolean;

    /**
     * 不太清楚干什么的，看起来好像与存档无关，是与本地存储有关的
     */
    cache: Record<string, string>;
}

interface CoreValues {
    /**
     * 血网伤害
     */
    lavaDamage: number;

    /**
     * 中毒伤害
     */
    poisonDamage: number;

    /**
     * 衰弱状态下攻防减少的数值。如果此项不小于1，则作为实际下降的数值（比如10就是攻防各下降10
     * 如果在0到1之间则为下降的比例（比如0.3就是下降30%的攻防）
     */
    weakValue: number;

    /**
     * 红宝石加攻数值
     */
    redGem: number;

    /**
     * 蓝宝石加防数值
     */
    blueGem: number;

    /**
     * 绿宝石加魔防数值
     */
    greenGem: number;

    /**
     * 红血瓶加血数值
     */
    redPotion: number;

    /**
     * 蓝血瓶加血数值
     */
    bluePotion: number;

    /**
     * 黄血瓶加血数值
     */
    yellowPotion: number;

    /**
     * 绿血瓶加血数值
     */
    greenPotion: number;

    /**
     * 默认的破甲比例
     */
    breakArmor: number;

    /**
     * 默认的反击比例
     */
    counterAttack: number;

    /**
     * 默认的净化比例
     */
    purify: number;

    /**
     * 仇恨属性中，每杀一个怪增加的仇恨值
     */
    hatred: number;

    /**
     * 全局动画速度
     */
    animateSpeed: number;

    /**
     * 勇士移动速度
     */
    moveSpeed: number;

    /**
     * 竖屏下状态栏显示行数
     */
    statusCanvasRowsOnMobile: 1 | 2 | 3 | 4 | 5;

    /**
     * 楼层切换时间
     */
    floorChangeTime: number;
}

type CoreStatusBarElements = {
    /**
     * 状态栏图标信息
     */
    readonly icons: Record<string, HTMLImageElement>;

    /**
     * 状态栏的图标元素
     */
    readonly image: Record<string, HTMLImageElement>;
} & {
    readonly [key: string]: HTMLElement;
};

type Materials = [
    'animates',
    'enemys',
    'items',
    'npcs',
    'terrains',
    'enemy48',
    'npc48',
    'icons'
];

type CoreFlagProperties =
    | 'autoScale'
    | 'betweenAttackMax'
    | 'blurFg'
    | 'canGoDeadZone'
    | 'disableShopOnDamage'
    | 'displayCritical'
    | 'displayEnemyDamage'
    | 'displayExtraDamage'
    | 'enableAddPoint'
    | 'enableEnemyPoint'
    | 'enableGentleClick'
    | 'enableHDCanvas'
    | 'enableMoveDirectly'
    | 'enableNegativeDamage'
    | 'enableRouteFolding'
    | 'equipboxButton'
    | 'extendToolbar'
    | 'flyNearStair'
    | 'flyRecordPosition'
    | 'ignoreChangeFloor'
    | 'itemFirstText'
    | 'leftHandPrefer'
    | 'startUsingCanvas'
    | 'statusCanvas';

type CoreFlags = {
    [P in CoreFlagProperties]: boolean;
} & {
    /**
     * 地图伤害的显示模式
     */
    extraDamageType: number;

    /**
     * 当前的状态栏显示项
     */
    statusBarItems: string[];
};

type CoreDataFromMain =
    | 'dom'
    | 'statusBar'
    | 'canvas'
    | 'images'
    | 'tilesets'
    | 'materials'
    | 'animates'
    | 'bgms'
    | 'sounds'
    | 'floorIds'
    | 'floors'
    | 'floorPartitions';

/**
 * 样板的core的类型，不得不感叹样板的结构真的很神奇（简称粪），两个看似毫无关联的东西都会有着千丝万缕的联系
 */
interface Core extends Pick<Main, CoreDataFromMain> {
    /**
     * 地图的格子宽度
     */
    readonly _WIDTH_: number;

    /**
     * 地图的格子高度
     */
    readonly _HEIGHT_: number;

    /**
     * 地图的像素宽度
     */
    readonly _PX_: number;

    /**
     * 地图的像素高度
     */
    readonly _PY_: number;

    /**
     * 地图宽度的一半
     */
    readonly _HALF_WIDTH_: number;

    /**
     * 地图高度的一半
     */
    readonly _HALF_HEIGHT_: number;

    /**
     * @deprecated
     * 地图可视部分大小
     */
    readonly __SIZE__: number;

    /**
     * @deprecated
     * 地图像素
     */
    readonly __PIXELS__: number;

    /**
     * @deprecated
     * 地图像素的一半
     */
    readonly __HALF_SIZE__: number;

    /**
     * 游戏素材
     */
    readonly material: Material;

    /**
     * 计时器（样板的神秘操作
     */
    readonly timeout: Timeout;

    /**
     * 定时器
     */
    readonly interval: Interval;

    /**
     * 全局动画信息
     */
    readonly animateFrame: AnimateFrame;

    /**
     * 音乐状态
     */
    readonly musicStatus: Readonly<MusicStatus>;

    /**
     * 当前游戏平台
     */
    readonly platform: Readonly<CorePlatform>;

    /**
     * dom样式
     */
    readonly domStyle: Readonly<DomStyle>;

    /**
     * 大地图信息
     */
    readonly bigmap: CoreBigmap;

    /**
     * 存档信息
     */
    readonly saves: Readonly<CoreSave>;

    /**
     * 全局数值信息
     */
    readonly values: CoreValues;

    /**
     * 游戏的初始状态
     */
    readonly initStatus: DeepReadonly<InitGameStatus>;

    /**
     * 所有的自定义画布
     */
    readonly dymCanvas: Record<string, CanvasRenderingContext2D>;

    /**
     * 游戏状态
     */
    readonly status: GameStatus;

    /**
     * 设置信息
     */
    readonly flags: CoreFlags;

    readonly firstData: FirstData;

    /**
     * 获得所有楼层的信息
     * @example core.floors[core.status.floorId].events // 获得本楼层的所有自定义事件
     */
    readonly floors: DeepReadonly<{
        [P in FloorIds]: ResolvedFloor<P>;
    }>;

    /**
     * 游戏主要逻辑模块
     */
    readonly control: Control;

    /**
     * 游戏的全塔属性信息
     */
    readonly data: Omit<DataCore, 'main'>;

    /**
     * 游戏加载模块
     */
    readonly loader: Loader;

    /**
     * 游戏的事件模块
     */
    readonly events: Events;

    /**
     * 游戏的怪物模块
     */
    readonly enemys: Enemys;

    /**
     * 游戏的物品模块
     */
    readonly items: Items;

    /**
     * 游戏的地图模块
     */
    readonly maps: Maps;

    /**
     * 游戏的ui模块
     */
    readonly ui: Ui;

    /**
     * 游戏的工具模块
     */
    readonly utils: Utils;

    /**
     * 游戏的图标模块
     */
    readonly icons: Icons;

    /**
     * 游戏的交互模块
     */
    readonly actions: Actions;

    /**
     * 进行游戏初始化
     * @param coreData 初始化信息
     * @param callback 初始化完成后的回调函数
     */
    init(coreData: MainData, callback?: () => void): Promise<void>;

    /**
     * @deprecated
     * 在一个上下文下执行函数（真的有人会用这个东西吗？
     * @param func 要执行的函数
     * @param _this 执行函数的上下文
     * @param params 函数的参数
     */
    doFunc<F extends (...args: any) => any>(
        func: F,
        _this: any,
        ...params: Parameters<F>
    ): ReturnType<F>;
}

type CoreMixin = Core &
    Forward<Control> &
    Forward<Events> &
    Forward<Loader> &
    Forward<Enemys> &
    Forward<Items> &
    Forward<Maps> &
    Forward<Ui> &
    Forward<Utils> &
    Forward<Icons> &
    Forward<Actions>;

interface MainStyle extends Readonly<StatusStyle> {
    /**
     * 初始界面的背景图
     */
    readonly startBackground: string;

    /**
     * 竖屏下初始界面的背景图
     */
    readonly startVerticalBackground: string;

    /**
     * 初始界面的文字样式
     */
    readonly startLogoStyle: string;

    /**
     * 初始界面的选项样式
     */
    readonly startButtonsStyle: string;
}

interface SplitImageData {
    /**
     * 要切分的图片id
     */
    readonly name: ImageIds;

    /**
     * 每个小图的宽度
     */
    readonly width: number;

    /**
     * 每个小图的高度
     */
    readonly height: number;

    /**
     * 切分成的小图的前缀名
     */
    readonly prefix: string;
}

interface Main extends MainData {
    /**
     * 是否在录像验证中
     */
    readonly replayChecking: boolean;

    /**
     * 渲染进程是否加载完毕
     */
    renderLoaded: boolean;

    /**
     * @deprecated
     * 就是core，应该没人会用main.core吧（
     */
    readonly core: CoreMixin;

    /**
     * 游戏的dom信息
     */
    readonly dom: Readonly<MainDom>;

    /**
     * 游戏版本，发布后会被随机为数字，请勿使用该属性
     */
    readonly version: string;

    /**
     * 是否使用压缩文件
     */
    readonly useCompress: boolean;

    /**
     * 存档页数
     */
    readonly savePages: number;

    /**
     * 循环临界的分界
     */
    readonly criticalUseLoop: number;

    /**
     * 当前游戏模式，是编辑器还是游玩界面
     */
    readonly mode: 'play' | 'editor';

    /**
     * 是否使用远程bgm
     */
    readonly bgmRemote: boolean;

    /**
     * 远程bgm目录
     */
    readonly bgmRemoteRoot: string;

    /**
     * 所有的系统画布
     */
    readonly canvas: Record<string, CanvasRenderingContext2D>;

    /**
     * 获得所有楼层的信息，等同于core.floors，但两者不是引用关系
     */
    readonly floors: DeepReadonly<{
        [P in FloorIds]: ResolvedFloor<P>;
    }>;

    /**
     * 所有的素材图片名称
     */
    readonly materials: [
        'animates',
        'enemys',
        'items',
        'npcs',
        'terrains',
        'enemy48',
        'npc48',
        'icons'
    ];

    /**
     * 要加载的project目录下的文件
     */
    readonly pureData: string[];

    /**
     * 要加载的libs目录下的文件
     */
    readonly loadList: string[];

    /**
     * 开始界面中当前选中的按钮
     */
    readonly selectedButton: number;

    /**
     * 当前启动服务是否支持高层塔优化
     */
    readonly supportBunch: boolean;

    /**
     * 状态栏的图标信息
     */
    readonly statusBar: CoreStatusBarElements;

    /**
     * 游戏版本
     */
    readonly __VERSION__: string;

    /**
     * 游戏版本代码
     */
    readonly __VERSION_CODE__: number;

    readonly RESOURCE_INDEX: Record<string, string>;
    readonly RESOURCE_URL: string;
    readonly RESOURCE_SYMBOL: string;
    readonly RESOURCE_TYPE: 'dev' | 'dist' | 'gh' | 'local';

    /**
     * 初始化游戏
     * @param mode 初始化游戏的模式，游玩还是编辑器
     * @param callback 初始化完成后的回调函数
     */
    init(mode: 'play' | 'editor', callback?: () => void): void;

    /**
     * 加载一个脚本
     * @param src 脚本路径
     */
    loadScript(src: string, module?: boolean): Promise<void>;

    /**
     * 动态加载js文件
     * @param dir 加载的js文件的目录
     * @param loadList 加载的js文件的文件名数组，不带后缀
     * @param callback 加载完毕后的回调函数
     */
    loadJs(dir: string, loadList: string[], callback: () => void): void;

    /**
     * 动态加载一个js文件
     * @param dir 加载的js文件的目录
     * @param modName 加载的js文件的名称，不带后缀名，如果是使用压缩文件会自动加上.min
     * @param callback 加载完毕后的回调函数，传入的参数是modName
     */
    loadMod(
        dir: string,
        modName: string,
        callback: (name: string) => void
    ): void;

    /**
     * 动态加载所有楼层
     * @param callback 加载完成后的回调函数
     */
    loadFloors(callback: () => void): void;

    /**
     * 动态加载一个楼层
     * @param floorId 加载的楼层id
     * @param callback 加载完成后的回调函数，传入的参数是加载的楼层id
     */
    loadFloor<F extends FloorIds>(
        floorId: F,
        callback: (floorId: F) => void
    ): void;

    /**
     * 设置加载界面的加载提示文字
     */
    setMainTipsText(text: string): void;

    /**
     * @deprecated
     * 输出内容（极不好用，建议换成console，我甚至不知道样板为什么会有这个东西）
     * @param e 输出内容
     * @param error 输出内容是否是报错
     */
    log(e: string | Error, error?: boolean): void;

    /**
     * 生成选择光标的keyframes
     */
    createOnChoiceAnimation(): void;

    /**
     * 选中开始界面的一个按钮
     * @param index 要选中的按钮
     */
    selectButton(index: number): void;

    /**
     * 加载一系列字体
     * @param fonts 要加载的字体列表
     */
    importFonts(fonts: FontIds[]): void;

    /**
     * 执行样板的所有监听
     */
    listen(): void;

    /**
     * 执行ts的插件转发
     */
    forward(): void;
}

interface Flags {
    /**
     * 当前的难度代码
     */
    readonly hard: number;

    /**
     * 本次游戏的种子
     */
    readonly __seed__: number;

    /**
     * 当前的随机数
     */
    readonly __rand__: number;

    /**
     * 难度的颜色，css字符串
     */
    readonly __hardColor__: Color;

    /**
     * 平面楼传下，每个楼层的离开位置
     */
    readonly __leaveLoc__: Record<FloorIds, Loc>;

    /**
     * 剧情文本属性
     */
    readonly textAttribute: TextAttribute;

    /**
     * 楼层是否到达过
     */
    readonly __visited__: Record<FloorIds, boolean>;

    /**
     * 鼠标位置
     */
    mouseLoc: LocArr;

    /**
     * 鼠标的像素位置
     */
    clientLoc: LocArr;

    [key: string]: any;
}

interface MapDataOf<T extends keyof NumberToId> {
    /**
     * 图块的id
     */
    id: NumberToId[T];

    /**
     * 图块的类型
     */
    cls: ClsOf<NumberToId[T]>;
}

/**
 * 样板的主对象
 */
declare const main: Main;

/**
 * 样板的核心对象
 */
declare const core: CoreMixin;

/**
 * 所有的变量
 */
declare let flags: Flags;

/**
 * 勇士信息
 */
declare let hero: HeroStatus;

/**
 * 全塔属性
 */
declare const data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d: DataCore;

/**
 * 所有的怪物信息
 */
declare const enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80: {
    [P in EnemyIds]: Enemy<P>;
};

/**
 * 所有的公共事件
 */
declare const events_c12a15a8_c380_4b28_8144_256cba95f760: {
    commonEvent: Record<EventDeclaration, MotaEvent>;
};

/**
 * 脚本编辑
 */
declare const functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a: FunctionsData;

/**
 * 所有的图标信息
 */
declare const icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1: MaterialIcon;

/**
 * 所有的道具信息
 */
declare const items_296f5d02_12fd_4166_a7c1_b5e830c9ee3a: {
    [P in AllIdsOf<'items'>]: Item<P>;
};

/**
 * 所有的图块信息
 */
declare const maps_90f36752_8815_4be8_b32b_d7fad1d0542e: {
    [P in keyof NumberToId]: MapDataOf<P>;
};

/**
 * 插件信息
 */
declare const plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1: PluginDeclaration;

interface Window {
    core: CoreMixin;
    flags: Flags;
    hero: HeroStatus;
}
