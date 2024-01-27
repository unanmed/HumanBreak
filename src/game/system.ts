import type { AudioPlayer } from '@/core/audio/audio';
import type { BgmController } from '@/core/audio/bgm';
import type { SoundController, SoundEffect } from '@/core/audio/sound';
import type { Disposable } from '@/core/common/disposable';
import type {
    EventEmitter,
    IndexedEventEmitter
} from '@/core/common/eventEmitter';
import type { loading } from '@/core/loader/load';
import type {
    Resource,
    ResourceStore,
    ResourceType,
    ZippedResource
} from '@/core/loader/resource';
import type { Hotkey } from '@/core/main/custom/hotkey';
import type { Keyboard } from '@/core/main/custom/keyboard';
import type { CustomToolbar } from '@/core/main/custom/toolbar';
import type { Focus, GameUi, UiController } from '@/core/main/custom/ui';
import type { gameListener, hook } from '@/core/main/game';
import type {
    MotaSetting,
    SettingDisplayer,
    SettingStorage
} from '@/core/main/setting';
import type { GameStorage } from '@/core/main/storage';
import type { DamageEnemy, EnemyCollection } from '@/plugin/game/enemy/damage';
import type { enemySpecials } from '@/plugin/game/enemy/special';
import type { Range } from '@/plugin/game/range';
import type { KeyCode } from '@/plugin/keyCodes';

interface ClassInterface {
    // 渲染进程与游戏进程通用
    EventEmitter: typeof EventEmitter;
    IndexedEventEmitter: typeof IndexedEventEmitter;
    Disposable: typeof Disposable;
    // 定义于渲染进程，录像中会进行polyfill，但是不执行任何内容
    GameStorage: typeof GameStorage;
    MotaSetting: typeof MotaSetting;
    SettingDisplayer: typeof SettingDisplayer;
    Resource: typeof Resource;
    ZippedResource: typeof ZippedResource;
    ResourceStore: typeof ResourceStore;
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
    // todo: 放到插件 ShaderEffect: typeof ShaderEffect;
    // 定义于游戏进程，渲染进程依然可用
    Range: typeof Range;
    EnemyCollection: typeof EnemyCollection;
    DamageEnemy: typeof DamageEnemy;
}

interface FunctionInterface {
    // 定义于渲染进程，录像中会进行polyfill，但是不执行任何内容
    readyAllResource(): void;
    // 定义于游戏进程，渲染进程依然可用

    // todo
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
    // isMobile: boolean;
    bgm: BgmController;
    sound: SoundController;
    resource: ResourceStore<Exclude<ResourceType, 'zip'>>;
    zipResource: ResourceStore<'zip'>;
    settingStorage: GameStorage<SettingStorage>;
    // 定义于游戏进程，渲染进程依然可用
    haloSpecials: number[];
    enemySpecials: typeof enemySpecials;
}

interface SystemInterfaceMap {
    class: ClassInterface;
    fn: FunctionInterface;
    var: VariableInterface;
}

type InterfaceType = keyof SystemInterfaceMap;

interface PluginInterface {}

export interface IMota {
    rewrite: typeof rewrite;
    rewriteSys: typeof rewriteSys;

    Plugin: IPlugin;

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
    /**
     * 初始化所有插件
     */
    init(): void;
    /**
     * 初始化指定插件
     * @param plugin 要初始化的插件
     */
    init(plugin: string): void;

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
    requireAll(): PluginInterface;

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

interface IPluginData {
    /** 插件类型，content表示直接注册了内容，function表示注册了初始化函数，内容从其返回值获取 */
    type: 'content' | 'function';
    data: any;
    init?: (plugin: string, data?: any) => any;
}

class MPlugin {
    private static plugins: Record<string, IPluginData> = {};
    private static inited = false;
    private static pluginData: Record<string, any> = {};

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

    static requireAll() {
        return this.pluginData;
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

/**
 * 样板接口系统，通过 Mota 获取到样板的核心功能，不可实例化
 */
class Mota {
    private static classes: Record<string, any> = {};
    private static functions: Record<string, any> = {};
    private static variables: Record<string, any> = {};

    static rewrite = rewrite;
    static rewriteSys = rewriteSys;
    static Plugin = MPlugin;

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
            : this.variables;
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
function rewrite<O, K extends SelectKey<O, _Func>, T = O>(
    base: O,
    key: K,
    type: 'full' | 'front',
    re: (this: T, ...params: [..._F<O[K]>[0], ...any[]]) => _F<O[K]>[1],
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
 * @param bind 原函数的调用对象，默认为base
 * @param rebind 复写函数的调用对象，默认为base
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
            re.call(rebind ?? base, v, ...params);
            const ret = (origin as _Func).call(bind ?? base, ...params);
            return ret;
        }
        // @ts-ignore
        return (base[key] = res);
    }
}

type _FI<K extends keyof FunctionInterface> = FunctionInterface[K];

/**
 * 全量复写系统函数或在系统函数函数前添加内容
 * @param key 系统函数名称
 * @param type 复写类型，full表示全量复写，front表示在原函数之前添加内容
 * @param re 复写函数，类型为full时表示将原函数完全覆盖，为front时表示将该函数添加到原函数之前
 * @param bind 原函数的调用对象，默认为base
 * @param rebind 复写函数的调用对象，默认为base
 */
function rewriteSys<K extends keyof FunctionInterface, T>(
    key: K,
    type: 'full' | 'front',
    re: (this: T, ...params: [..._F<_FI<K>>[0], ...any[]]) => _F<_FI<K>>[1],
    bind?: any,
    rebind?: T
): (this: T, ...params: [..._F<_FI<K>>[0], ...any[]]) => _F<_FI<K>>[1];
/**
 * 在系统函数后追加内容
 * @param key 系统函数名称
 * @param type 复写类型，add表示在函数后追加
 * @param re 复写函数，类型为add时表示在原函数后面追加复写函数，会在第一个参数中传入原函数的返回值，
 *           并要求复写函数必须有返回值，作为复写的最终返回值。
 * @param bind 原函数的调用对象，默认为base
 * @param rebind 复写函数的调用对象，默认为base
 */
function rewriteSys<K extends keyof FunctionInterface, T>(
    key: K,
    type: 'add',
    re: (
        this: T,
        ...params: [_F<_FI<K>>[1], ..._F<_FI<K>>[0], ...any[]]
    ) => _F<_FI<K>>[1],
    bind?: any,
    rebind?: T
): (this: T, ...params: [..._F<_FI<K>>[0], ...any[]]) => _F<_FI<K>>[1];
function rewriteSys<K extends keyof FunctionInterface, T>(
    key: K,
    type: RewriteType,
    re: (this: T, ...params: [..._F<_FI<K>>[0], ...any[]]) => _F<_FI<K>>[1],
    bind?: any,
    rebind?: T
): (this: T, ...params: [..._F<_FI<K>>[0], ...any[]]) => _F<_FI<K>>[1] {
    // @ts-ignore
    return rewrite(Mota.requireAll('fn'), key, type, re, bind, rebind);
}

declare global {
    interface Window {
        Mota: IMota;
    }
}

window.Mota = Mota;
