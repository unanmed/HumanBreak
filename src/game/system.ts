import type { AudioPlayer } from '@/core/audio/audio';
import type { BgmController } from '@/core/audio/bgm';
import type { SoundController, SoundEffect } from '@/core/audio/sound';
import type { Disposable } from '@/core/common/disposable';
import type {
    EventEmitter,
    IndexedEventEmitter
} from '@/core/common/eventEmitter';
import type { loading } from './game';
import type {
    Hotkey,
    unwarpBinary,
    checkAssist,
    isAssist
} from '@/core/main/custom/hotkey';
import type {
    Keyboard,
    generateKeyboardEvent
} from '@/core/main/custom/keyboard';
import type { CustomToolbar } from '@/core/main/custom/toolbar';
import type { Focus, GameUi, UiController } from '@/core/main/custom/ui';
import type { gameListener, hook } from './game';
import type { MotaSetting, SettingDisplayer } from '@/core/main/setting';
import type { GameStorage } from '@/core/main/storage';
import type { DamageEnemy, EnemyCollection } from './enemy/damage';
import type { specials } from './enemy/special';
import type { Range } from '@/plugin/game/range';
import type { KeyCode, ScanCode } from '@/plugin/keyCodes';
import type { Ref } from 'vue';
import type { MComponent, m, icon } from '@/core/main/layout';
import type { addAnimate, removeAnimate } from '@/plugin/animateController';
import type { createSettingComponents } from '@/core/main/init/settings';
import type {
    createToolbarComponents,
    createToolbarEditorComponents
} from '@/core/main/init/toolbar';
import type * as use from '@/plugin/use';
import type * as mark from '@/plugin/mark';
import type * as keyCodes from '@/plugin/keyCodes';
import type * as bookTools from '@/plugin/ui/book';
import type * as commonTools from '@/plugin/ui/common';
import type * as equipboxTools from '@/plugin/ui/equipbox';
import type * as fixedTools from '@/plugin/ui/fixed';
import type * as flyTools from '@/plugin/ui/fly';
import type * as statusBarTools from '@/plugin/ui/statusBar';
import type * as toolboxTools from '@/plugin/ui/toolbox';
import type * as battle from './enemy/battle';
import type * as hero from './hero';
import type { Damage } from './enemy/damage';

interface ClassInterface {
    // 渲染进程与游戏进程通用
    EventEmitter: typeof EventEmitter;
    IndexedEventEmitter: typeof IndexedEventEmitter;
    Disposable: typeof Disposable;
    // 定义于渲染进程，录像验证使用会报错
    GameStorage: typeof GameStorage;
    MotaSetting: typeof MotaSetting;
    SettingDisplayer: typeof SettingDisplayer;
    Focus: typeof Focus;
    GameUi: typeof GameUi;
    UiController: typeof UiController;
    Hotkey: typeof Hotkey;
    Keyboard: typeof Keyboard;
    CustomToolbar: typeof CustomToolbar;
    AudioPlayer: typeof AudioPlayer;
    SoundEffect: typeof SoundEffect;
    SoundController: typeof SoundController;
    BgmController: typeof BgmController;
    MComponent: typeof MComponent;
    // 定义于游戏进程，渲染进程依然可用
    Range: typeof Range;
    EnemyCollection: typeof EnemyCollection;
    DamageEnemy: typeof DamageEnemy;
}

type _IBattle = typeof battle;
type _IHero = typeof hero;

interface FunctionInterface extends _IBattle, _IHero {
    // 定义于渲染进程，录像验证中会出错
    m: typeof m;
    icon: typeof icon;
    unwrapBinary: typeof unwarpBinary;
    checkAssist: typeof checkAssist;
    isAssist: typeof isAssist;
    generateKeyboardEvent: typeof generateKeyboardEvent;
    addAnimate: typeof addAnimate;
    removeAnimate: typeof removeAnimate;
}

interface VariableInterface {
    // 定义于渲染进程，录像中会进行polyfill
    loading: typeof loading;
    hook: typeof hook;
    gameListener: typeof gameListener;
    mainSetting: MotaSetting;
    gameKey: Hotkey;
    mainUi: UiController;
    fixedUi: UiController;
    KeyCode: typeof KeyCode;
    ScanCode: typeof ScanCode;
    bgm: BgmController;
    sound: SoundController;
    settingStorage: GameStorage;
    status: Ref<boolean>;
    // 定义于游戏进程，渲染进程依然可用
    haloSpecials: number[];
    enemySpecials: typeof specials;
}

interface ModuleInterface {
    CustomComponents: {
        createSettingComponents: typeof createSettingComponents;
        createToolbarComponents: typeof createToolbarComponents;
        createToolbarEditorComponents: typeof createToolbarEditorComponents;
    };
    Use: typeof use;
    Mark: typeof mark;
    KeyCodes: typeof keyCodes;
    UITools: typeof bookTools &
        typeof commonTools &
        typeof equipboxTools &
        typeof fixedTools &
        typeof flyTools &
        typeof statusBarTools &
        typeof toolboxTools;
    Damage: typeof Damage;
}

interface SystemInterfaceMap {
    class: ClassInterface;
    fn: FunctionInterface;
    var: VariableInterface;
    module: ModuleInterface;
}

type InterfaceType = keyof SystemInterfaceMap;

interface PluginInterface {
    // 渲染进程定义的插件
    pop_r: typeof import('../plugin/pop');
    use_r: typeof import('../plugin/use');
    // animate: typeof import('../plugin/animateController');
    // utils: typeof import('../plugin/utils');
    // status: typeof import('../plugin/ui/statusBar');
    fly_r: typeof import('../plugin/ui/fly');
    chase_r: typeof import('../plugin/chase/chase');
    // webglUtils: typeof import('../plugin/webgl/utils');
    shadow_r: typeof import('../plugin/shadow/shadow');
    gameShadow_r: typeof import('../plugin/shadow/gameShadow');
    // achievement: typeof import('../plugin/ui/achievement');
    completion_r: typeof import('../plugin/completion');
    // path: typeof import('../plugin/fx/path');
    gameCanvas_r: typeof import('../plugin/fx/gameCanvas');
    // noise: typeof import('../plugin/fx/noise');
    smooth_r: typeof import('../plugin/fx/smoothView');
    frag_r: typeof import('../plugin/fx/frag');
    // 游戏进程定义的插件
    utils_g: typeof import('../plugin/game/utils');
    shop_g: typeof import('../plugin/game/shop');
    replay_g: typeof import('../plugin/game/replay');
    removeMap_g: typeof import('../plugin/game/removeMap');
    remainEnemy_g: typeof import('../plugin/game/enemy/remainEnemy');
    heroFourFrames_g: typeof import('../plugin/game/fx/heroFourFrames');
    rewrite_g: typeof import('../plugin/game/fx/rewrite');
    itemDetail_g: typeof import('../plugin/game/fx/itemDetail');
    checkBlock_g: typeof import('../plugin/game/enemy/checkblock');
}

interface PackageInterface {
    axios: typeof import('axios');
    'chart.js': typeof import('chart.js');
    jszip: typeof import('jszip');
    lodash: typeof import('lodash-es');
    'lz-string': typeof import('lz-string');
    'mutate-animate': typeof import('mutate-animate');
    vue: typeof import('vue');
}

export interface IMota {
    rewrite: typeof rewrite;
    r: typeof r;
    rf: typeof rf;

    /** 样板插件接口 */
    Plugin: IPlugin;
    /**
     * 样板使用的第三方库接口，可以直接获取到库的原有接口。
     * 接口在渲染进程中引入，在游戏进程中不会polyfill，因此在游戏进程中使用时，
     * 应先使用main.replayChecking进行检查，保证该值不存在时才进行使用，否则会引起录像出错
     */
    Package: IPackage;

    /**
     * 获取一个样板接口
     * @param type 要获取的接口类型
     * @param key 接口名称
     */
    require<T extends InterfaceType, K extends keyof SystemInterfaceMap[T]>(
        type: T,
        key: K
    ): SystemInterfaceMap[T][K];
    /**
     * 获取一个样板接口
     * @param type 要获取的接口类型
     * @param key 接口名称
     */
    require(type: InterfaceType, key: string): any;

    /**
     * 获取一种接口的所有内容
     * @param type 要获取的接口类型
     */
    requireAll<T extends InterfaceType>(type: T): SystemInterfaceMap[T];

    /**
     * 注册一个样板接口
     * @param type 要注册的接口类型
     * @param key 接口名称
     * @param data 接口内容
     */
    register<T extends InterfaceType, K extends keyof SystemInterfaceMap[T]>(
        type: T,
        key: K,
        data: SystemInterfaceMap[T][K]
    ): void;
    /**
     * 注册一个样板接口
     * @param type 要注册的接口类型
     * @param key 接口名称
     * @param data 接口内容
     */
    register(type: InterfaceType, key: string, data: any): void;
}

export interface IPlugin {
    inited: boolean;

    /**
     * 初始化所有插件
     */
    init(): void;

    /**
     * 获取到一个插件的内容
     * @param plugin 要获取的插件
     */
    require<K extends keyof PluginInterface>(plugin: K): PluginInterface[K];
    /**
     * 获取到一个插件的内容
     * @param plugin 要获取的插件
     */
    require(plugin: string): any;

    /**
     * 获取所有插件
     */
    requireAll(): PluginInterface & { [x: string]: any };

    /**
     * 注册一个插件
     * @param plugin 要注册的插件名
     * @param data 插件内容
     * @param init 插件的初始化函数，可选，初始化函数接受两个参数，分别是plugin和data，表示插件名称和内容
     */
    register<K extends keyof PluginInterface>(
        plugin: K,
        data: PluginInterface[K],
        init?: (plugin: K, data: PluginInterface[K]) => void
    ): void;
    /**
     * 注册一个插件
     * @param plugin 要注册的插件名
     * @param init 插件的初始化函数，初始化函数接受一个参数，表示插件名称，要求返回插件内容
     */
    register<K extends keyof PluginInterface>(
        plugin: K,
        init: (plugin: K) => PluginInterface[K]
    ): void;
    /**
     * 注册一个插件
     * @param plugin 要注册的插件名
     * @param data 插件内容
     * @param init 插件的初始化函数，可选，初始化函数接受两个参数，分别是plugin和data，表示插件名称和内容
     */
    register<K extends string, D>(
        plugin: K,
        data: D,
        init?: (plugin: K, data: D) => void
    ): void;
    /**
     * 注册一个插件
     * @param plugin 要注册的插件名
     * @param init 插件的初始化函数，初始化函数接受一个参数，表示插件名称，要求返回插件内容
     */
    register<K extends string>(plugin: K, init: (plugin: K) => any): void;
}

export interface IPackage {
    /**
     * 获取样板使用的第三方库
     * @param name 要获取的第三方库
     */
    require<K extends keyof PackageInterface>(name: K): PackageInterface[K];

    /**
     * 获取样板使用的所有第三方库
     */
    requireAll(): PackageInterface;

    register<K extends keyof PackageInterface>(
        name: K,
        data: PackageInterface[K]
    ): void;
}

interface IPluginData {
    /** 插件类型，content表示直接注册了内容，function表示注册了初始化函数，内容从其返回值获取 */
    type: 'content' | 'function';
    data: any;
    init?: (plugin: string, data?: any) => any;
}

class MPlugin {
    private static plugins: Record<string, IPluginData> = {};
    private static pluginData: Record<string, any> = {};
    static inited = false;

    constructor() {
        throw new Error(`System plugin class cannot be constructed.`);
    }

    static init() {
        for (const [key, data] of Object.entries(this.plugins)) {
            if (data.type === 'content') {
                data.init?.(key, data.data);
            } else {
                data.data = data.init!(key);
            }
            this.pluginData[key] = data.data;
        }
        this.inited = true;
    }

    static require(key: string) {
        if (!this.inited) {
            throw new Error(`Cannot access plugin '${key}' before initialize.`);
        }
        if (!(key in this.plugins)) {
            throw new Error(`Cannot resolve plugin require: key='${key}'`);
        }
        return this.plugins[key].data;
    }

    static requireAll(): PluginInterface {
        return this.pluginData as PluginInterface;
    }

    static register(key: string, data: any, init?: any) {
        if (typeof data === 'function') {
            this.plugins[key] = {
                type: 'function',
                init: data,
                data: void 0
            };
        } else {
            this.plugins[key] = {
                type: 'content',
                data,
                init
            };
        }
    }
}

class MPackage {
    // @ts-ignore
    private static packages: PackageInterface = {};

    constructor() {
        throw new Error(`System package class cannot be constructed.`);
    }

    static require<K extends keyof PackageInterface>(
        name: K
    ): PackageInterface[K] {
        return this.packages[name];
    }

    static requireAll() {
        return this.packages;
    }

    static register<K extends keyof PackageInterface>(
        name: K,
        data: PackageInterface[K]
    ) {
        this.packages[name] = data;
    }
}

/**
 * 样板接口系统，通过 Mota 获取到样板的核心功能，不可实例化
 */
class Mota {
    private static classes: Record<string, any> = {};
    private static functions: Record<string, any> = {};
    private static variables: Record<string, any> = {};
    private static modules: Record<string, any> = {};

    static rewrite = rewrite;
    static r = r;
    static rf = rf;
    static Plugin = MPlugin;
    static Package = MPackage;

    constructor() {
        throw new Error(`System interface class cannot be constructed.`);
    }

    static require(type: InterfaceType, key: string): any {
        const data = this.getByType(type)[key];
        if (!!data) return data;
        else {
            throw new Error(
                `Cannot resolve require: type='${type}',key='${key}'`
            );
        }
    }

    static requireAll<T extends InterfaceType>(type: T): SystemInterfaceMap[T] {
        return this.getByType(type) as SystemInterfaceMap[T];
    }

    static register(type: InterfaceType, key: string, data: any) {
        const obj = this.getByType(type);
        if (key in obj) {
            console.warn(
                `重复的样板接口注册: type='${type}', key='${key}'，已将其覆盖`
            );
        }
        obj[key] = data;
    }

    private static getByType(type: InterfaceType) {
        return type === 'class'
            ? this.classes
            : type === 'fn'
            ? this.functions
            : type === 'var'
            ? this.variables
            : this.modules;
    }
}

type RewriteType = 'full' | 'front' | 'add';
type _F<F> = F extends (...params: infer P) => infer R ? [P, R] : never;
type _Func = (...params: any) => any;

/**
 * 全量复写或在函数前添加内容
 * @param base 函数所在对象
 * @param key 函数名称，即函数在base中叫什么
 * @param type 复写类型，full表示全量复写，front表示在原函数之前添加内容
 * @param re 复写函数，类型为full时表示将原函数完全覆盖，为front时表示将该函数添加到原函数之前
 * @param bind 原函数的调用对象，默认为base
 * @param rebind 复写函数的调用对象，默认为base
 */
function rewrite<
    O,
    K extends SelectKey<O, _Func>,
    R extends 'full' | 'front',
    T = O
>(
    base: O,
    key: K,
    type: R,
    re: (
        this: T,
        ...params: [..._F<O[K]>[0], ...any[]]
    ) => R extends 'full' ? _F<O[K]>[1] : void,
    bind?: any,
    rebind?: T
): (this: T, ...params: [..._F<O[K]>[0], ...any[]]) => _F<O[K]>[1];
/**
 * 在函数后追加内容
 * @param base 函数所在对象
 * @param key 函数名称，即函数在base中叫什么
 * @param type 复写类型，add表示在函数后追加
 * @param re 复写函数，类型为add时表示在原函数后面追加复写函数，会在第一个参数中传入原函数的返回值，
 *           并要求复写函数必须有返回值，作为复写的最终返回值。
 * @param bind 原函数的调用对象，默认为`base`
 * @param rebind 复写函数的调用对象，默认为`base`
 */
function rewrite<O, K extends SelectKey<O, _Func>, T = O>(
    base: O,
    key: K,
    type: 'add',
    re: (
        this: T,
        ...params: [_F<O[K]>[1], ..._F<O[K]>[0], ...any[]]
    ) => _F<O[K]>[1],
    bind?: any,
    rebind?: T
): (this: T, ...params: [..._F<O[K]>[0], ...any[]]) => _F<O[K]>[1];
function rewrite<O, K extends SelectKey<O, _Func>, T = O>(
    base: O,
    key: K,
    type: RewriteType,
    re: (this: T, ...params: [..._F<O[K]>[0], ...any[]]) => _F<O[K]>[1],
    bind?: any,
    rebind?: T
): (this: T, ...params: [..._F<O[K]>[0], ...any[]]) => _F<O[K]>[1] {
    const func = base[key];
    if (typeof func !== 'function') {
        throw new Error(
            `Cannot rewrite variable with type of '${typeof func}'.`
        );
    }
    if (type === 'full') {
        // @ts-ignore
        return (base[key] = re.bind(rebind ?? base));
    } else if (type === 'add') {
        const origin = base[key];
        function res(this: T, ...params: [..._F<O[K]>[0], ...any[]]) {
            const v = (origin as _Func).call(bind ?? base, ...params);
            // @ts-ignore
            const ret = re.call(rebind ?? base, v, ...params);
            return ret;
        }
        // @ts-ignore
        return (base[key] = res);
    } else {
        const origin = base[key];
        function res(this: T, ...params: [..._F<O[K]>[0], ...any[]]) {
            // @ts-ignore
            re.call(rebind ?? base, ...params);
            const ret = (origin as _Func).call(bind ?? base, ...params);
            return ret;
        }
        // @ts-ignore
        return (base[key] = res);
    }
}

/**
 * 在渲染进程包裹下执行一段代码，该段代码不会在录像验证及编辑器中执行，因此里面的内容一定不会引起录像报错
 * 一般特效，或者是ui显示、内容显示、交互监听等内容应当在渲染进程包裹下执行。
 * 无法获取到执行内容的返回值，因为渲染进程中的值不应当直接出现在游戏进程中，否则很可能导致录像出错，
 * 如果需要其返回值，应当直接在函数后面新增内容，而不是在游戏进程中使用
 * @param fn 要执行的函数，传入一个参数，表示所有的第三方库，也就是`Mota.Package.requireAll()`的内容
 * @param thisArg 函数的执行上下文，即函数中`this`指向
 */
function r<T = undefined>(
    fn: (this: T, packages: PackageInterface) => void,
    thisArg?: T
) {
    if (!main.replayChecking && main.mode === 'play')
        fn.call(thisArg as T, MPackage.requireAll());
}

/**
 * 将一个函数包裹成渲染进程函数，执行这个函数时将直接在渲染进程下执行。该函数与 {@link r} 函数的关系，
 * 与`call`和`bind`的关系类似。
 * ```ts
 * const fn = rf((x) => x * x);
 * console.log(fn(2)); // 在正常游玩中会输出 4，但是录像验证中会输出undefined，因为录像验证中不会执行渲染进程函数
 * ```
 * @param fn 要执行的函数
 * @param thisArg 函数执行时的上下文，即this指向
 * @returns 经过渲染进程包裹的函数，直接调用即是在渲染进程下执行的
 */
function rf<F extends (...params: any) => any, T>(
    fn: F,
    thisArg?: T
): (this: T, ...params: Parameters<F>) => ReturnType<F> | undefined {
    // @ts-ignore
    if (main.replayChecking || main.mode === 'editor') return () => {};
    else {
        return (...params) => {
            return fn.call(thisArg, ...params);
        };
    }
}

declare global {
    interface Window {
        Mota: IMota;
    }
}

window.Mota = Mota;
