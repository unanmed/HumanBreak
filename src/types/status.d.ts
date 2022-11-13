type gameStatus = {
    played: boolean;
    gameOver: boolean;

    /** 当前勇士状态信息。例如core.status.hero.atk就是当前勇士的攻击力数值 */
    hero: HeroStatus;

    /** 当前层的floorId */
    floorId: string;
    /** 获得所有楼层的地图信息 */
    maps: { [key: string]: ResolvedMap };
    /** 获得当前楼层信息，等价于core.status.maps[core.status.floorId] */
    thisMap: ResolvedMap;
    bgmaps: { [key: string]: number[][] };
    fgmaps: { [key: string]: number[][] };
    mapBlockObjs: { [key: string]: any };
    /** 显伤伤害 */
    checkBlock: {
        ambush: { [x: string]: [number, number, string, direction] };
        repulse: { [x: string]: [number, number, string, direction] };
        damage: { [x: string]: number };
        needCache: boolean;
        type: { [x: string]: { [x: string]: boolean } };
        cache: {
            [s: string]: {
                hp_buff: number;
                atk_buff: number;
                def_buff: number;
                guards: Array<[number, number, string]>;
            };
        };
    };
    damage: {
        posX: number;
        posY: number;
        data: Array<{
            [x: string]: {
                text: string;
                px: number;
                py: number;
                color: string | Array<number>;
            };
        }>;
        extraData: Array<{
            [x: string]: {
                text: string;
                px: number;
                py: number;
                color: string | Array<number>;
                alpha: number;
            };
        }>;
    };

    lockControl: boolean;

    /** 勇士移动状态 */
    heroMoving: number;
    heroStop: boolean;

    // 自动寻路相关
    automaticRoute: {
        autoHeroMove: boolean;
        autoStep: number;
        movedStep: number;
        destStep: number;
        destX: any;
        destY: any;
        offsetX: any;
        offsetY: any;
        autoStepRoutes: [];
        moveStepBeforeStop: [];
        lastDirection: any;
        cursorX: any;
        cursorY: any;
        moveDirectly: boolean;
    };

    // 按下键的时间：为了判定双击
    downTime: number;
    ctrlDown: boolean;

    // 路线&回放
    route: string[];
    replay: {
        replaying: boolean;
        pausing: boolean;
        /** 正在某段动画中 */ animate: boolean;
        toReplay: string[];
        totalList: string[];
        speed: number;
        steps: number;
        save: [];
    };

    // event事件
    shops: {};
    event: {
        id: string;
        data: any;
        selection: any;
        ui: any;
        interval: number;
    };
    autoEvents: Events;
    textAttribute: {
        position: string;
        offset: number;
        title: rgbarray;
        background: rgbarray;
        text: rgbarray;
        titlefont: number;
        textfont: number;
        bold: boolean;
        time: number;
        letterSpacing: number;
        animateTime: number;
    };
    globalAttribute: {
        equipName: string[];
        statusLeftBackground: string;
        statusTopBackground: string;
        toolsBackground: string;
        borderColor: string;
        statusBarColor: string;
        floorChangingStyle: string;
        font: string;
    };
    curtainColor: null;

    // 动画
    globalAnimateObjs: [];
    floorAnimateObjs: [];
    boxAnimateObjs: [];
    autotileAnimateObjs: [];
    globalAnimateStatus: number;
    animateObjs: [];
};

type HeroStatus = {
    equipment: [];
    lv: number;
    name: string;
    hp: number;
    hpmax: number;
    mana: number;
    manamax: number;
    atk: number;
    def: number;
    mdef: number;
    money: number;
    exp: number;
    loc: {
        direction: direction;
        x: number;
        y: number;
    };
    items: {
        keys: { [key: string]: number };
        constants: { [key: string]: number };
        tools: { [key: string]: number };
        equips: { [key: string]: number };
    };
    flags: { [key: string]: any };
    steps: number;
    statistics: {
        battle: number;
        battleDamage: number;
        currTime: number;
        exp: number;
        extraDamage: number;
        hp: number;
        ignoreSteps: number;
        money: number;
        moveDirectly: number;
        poisonDamage: number;
        start: number;
        totalTime: number;
    };
    [key: string]: any;
};
