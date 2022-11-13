type core = {
    /** 地图的格子宽度 */
    readonly _WIDTH_: number;
    /** 地图的格子高度 */
    readonly _HEIGHT_: number;
    /** 地图的像素宽度 */
    readonly _PX_: number;
    /** 地图的像素高度 */
    readonly _PY_: number;
    /** 地图宽度的一半 */
    readonly _HALF_WIDTH_: number;
    /** 地图高度的一半 */
    readonly _HALF_HEIGHT_: number;
    /** @deprecated 地图可视部分大小 */
    readonly __SIZE__: number;
    /** @deprecated 地图像素 */
    readonly __PIXELS__: number;
    /** @deprecated 地图像素的一半 */
    readonly __HALF_SIZE__: number;
    /** 游戏素材 */
    readonly material: {
        readonly animates: { [key: string]: Animate };
        readonly images: {
            airwall: HTMLImageElement;
            animates: HTMLImageElement;
            enemys: HTMLImageElement;
            enemy48: HTMLImageElement;
            items: HTMLImageElement;
            npcs: HTMLImageElement;
            npc48: HTMLImageElement;
            terrains: HTMLImageElement;
            autotile: { [x: string]: HTMLImageElement };
            images: { [x: string]: HTMLImageElement };
            tilesets: { [x: string]: HTMLImageElement };
        };
        readonly bgms: { [key: string]: HTMLAudioElement };
        readonly sounds: { [key: string]: HTMLAudioElement };
        readonly ground: CanvasRenderingContext2D;
        /**
         * 怪物信息
         * @example core.material.enemys.greenSlime // 获得绿色史莱姆的属性数据
         */
        readonly enemys: { [key: string]: Enemy };
        /** 道具信息 */
        readonly items: { [key: string]: Item };
        readonly icons: { [key: string]: { [key: string]: number } };
    };
    readonly timeout: {
        turnHeroTimeout: any;
        onDownTimeout: any;
        sleepTimeout: any;
    };
    readonly interval: {
        heroMoveInterval: any;
        onDownInterval: any;
    };
    readonly animateFrame: {
        totalTime: number;
        totalTimeStart: number;
        globalAnimate: boolean;
        globalTime: number;
        selectorTime: number;
        selectorUp: boolean;
        animateTime: number;
        moveTime: number;
        lastLegTime: number;
        leftLeg: boolean;
        readonly weather: {
            time: number;
            type: any;
            nodes: [];
            data: any;
            fog: any;
            cloud: any;
        };
        readonly tips: {
            time: number;
            offset: number;
            list: [];
            lastSize: number;
        };
        readonly asyncId: {};
    };
    readonly musicStatus: {
        audioContext: AudioContext;
        /** 是否播放BGM */ bgmStatus: boolean;
        /** 是否播放SE */ soundStatus: boolean;
        /** 正在播放的BGM */ playingBgm: string;
        /** 上次播放的bgm */ lastBgm: string;
        gainNode: GainNode;
        /** 正在播放的SE */ playingSounds: {};
        /** 音量 */ volume: number;
        /** 缓存BGM内容 */ cachedBgms: string[];
        /** 缓存的bgm数量 */ cachedBgmCount: number;
    };
    readonly platform: {
        /** 是否http */ isOnline: boolean;
        /** 是否是PC */ isPC: boolean;
        /** 是否是Android */ isAndroid: boolean;
        /** 是否是iOS */ isIOS: boolean;
        string: string;
        /** 是否是微信 */ isWeChat: boolean;
        /** 是否是QQ */ isQQ: boolean;
        /** 是否是Chrome */ isChrome: boolean;
        /** 是否支持复制到剪切板 */ supportCopy: boolean;

        fileInput: null;
        /** 是否支持FileReader */ fileReader: null;
        /** 读取成功 */ successCallback: null;
        /** 读取失败 */ errorCallback: null;
    };
    readonly dom: { [key: string]: HTMLElement };
    /** dom样式 */
    readonly domStyle: {
        scale: number;
        isVertical: boolean;
        showStatusBar: boolean;
        toolbarBtn: boolean;
    };
    readonly bigmap: {
        canvas: string[];
        offsetX: number; // in pixel
        offsetY: number;
        posX: number;
        posY: number;
        width: number; // map width and height
        height: number;
        v2: boolean;
        threshold: number;
        extend: number;
        scale: number;
        tempCanvas: CanvasRenderingContext2D; // A temp canvas for drawing
        cacheCanvas: CanvasRenderingContext2D;
    };
    readonly saves: {
        saveIndex: number;
        readonly ids: { [key: number]: boolean };
        autosave: {
            data: Save[];
            max: number;
            storage: true;
            time: number;
            updated: boolean;
        };
        favorite: [];
        readonly favoriteName: {};
    };
    readonly initStatus: gameStatus;
    readonly dymCanvas: { [key: string]: CanvasRenderingContext2D };
    /** 游戏状态 */
    readonly status: gameStatus;

    /**
     * 获得所有楼层的信息
     * @example core.floors[core.status.floorId].events // 获得本楼层的所有自定义事件
     */
    readonly floors: { [key: string]: ResolvedMap };
    readonly floorIds: string[];

    readonly statusBar: {
        readonly icons: { [x: string]: HTMLImageElement };
    };

    readonly materials: string[];

    readonly control: control;
    readonly loader: loader;
    readonly events: events;
    readonly enemys: enemys;
    readonly items: items;
    readonly maps: maps;
    readonly ui: ui;
    readonly utils: utils;
    readonly icons: icons;
    readonly actions: actions;
    readonly plugin: PluginDeclaration;
} & control &
    events &
    loader &
    enemys &
    items &
    maps &
    ui &
    utils &
    icons &
    actions &
    Forward<PluginDeclaration>;

type main = {
    /** 是否在录像验证中 */
    readonly replayChecking: boolean;
    readonly core: core;
    readonly dom: { [key: string]: HTMLElement };
    /** 游戏版本，发布后会被随机，请勿使用该属性 */
    readonly version: string;
    readonly useCompress: boolean;
    readonly savePages: number;
    readonly mode: 'play' | 'editor';
    readonly statusBar: {
        images: { [x: string]: HTMLElement };
        icons: { [x: string]: number | null | undefined };
        [x: string]: HTMLElement | object;
    };
    readonly __VERSION__: string;
    readonly __VERSION_CODE__: number;
    readonly images: string[];

    /** 输出内容（极不好用，建议换成console，我甚至不知道样板为什么会有这个东西）*/
    log(e: string | Error, error: boolean): void;
};

type SpriteMouseEvent = (px: number, py: number) => void;

type SpritKeyEvent = (
    key: string,
    keyCode: number,
    altKey: boolean,
    ctrlKey: boolean,
    shiftKey: boolean
) => void;

type SpriteWheelEvent = (
    deltaY: number,
    deltaX: number,
    deltaZ: number
) => void;

type SpriteTouchEvent = (...locs: [number, number][]) => void;

interface SpriteEvent {
    auxclick: SpriteMouseEvent;
    click: SpriteMouseEvent;
    contextmenu: SpriteMouseEvent;
    dblclick: SpriteMouseEvent;
    mousedown: SpriteMouseEvent;
    mouseup: SpriteMouseEvent;
    mouseenter: SpriteMouseEvent;
    mouseleave: SpriteMouseEvent;
    mousemove: SpriteMouseEvent;
    mouseout: SpriteMouseEvent;
    mouseover: SpriteMouseEvent;
    keydown: SpritKeyEvent;
    keyup: SpritKeyEvent;
    keypress: SpritKeyEvent;
    wheel: SpriteWheelEvent;
    touchstart: SpriteTouchEvent;
    touchend: SpriteTouchEvent;
    touchmove: SpriteTouchEvent;
    touchcancel: SpriteTouchEvent;
}

declare class Sprite {
    static count: number;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    reference: 'game' | 'window';
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    name: string;
    readonly count: number;

    /** 创建一个sprite画布
     * @param reference 参考系，游戏画面或者窗口
     * @param name 可选，sprite的名称，方便通过core.dymCanvas获取
     */
    constructor(
        x: number,
        y: number,
        w: number,
        h: number,
        z: number,
        reference?: 'game' | 'window',
        name?: string
    );

    /** 初始化 */
    init(): void;

    /** 设置css特效 */
    setCss(css: string): Sprite;

    /**
     * 移动sprite
     * @param isDelta 是否是相对位置，如果是，那么sprite会相对于原先的位置进行移动
     */
    move(x: number, y: number, isDelta?: boolean): Sprite;

    /**
     * 重新设置sprite的大小
     * @param {boolean} styleOnly 是否只修改css效果，如果是，那么将会不高清，如果不是，那么会清空画布
     */
    resize(w: number, h: number, styleOnly?: boolean): Sprite;

    /** 旋转画布 */
    rotate(angle: number, cx?: number, cy?: number): Sprite;

    /** 擦除画布 */
    clear(x: number, y: number, w?: number, h?: number): Sprite;

    /** 删除 */
    destroy(): void;

    /** 监听事件，与registerAction类似 */
    on<K extends keyof SpriteEvent>(type: K, handler: SpriteEvent[K]): void;

    /** 添加事件监听器 */
    addEventListener: HTMLCanvasElement['addEventListener'];

    /** 删除事件监听器 */
    removeEventListenr: HTMLCanvasElement['addEventListener'];
}

declare let main: main;
declare let core: core;
declare let flags: { [x: string]: any };
declare let hero: HeroStatus;
