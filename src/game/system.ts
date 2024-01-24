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

export interface IMota {
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

/**
 * 样板接口系统，通过 Mota 获取到样板的核心功能，不可实例化
 */
class Mota {
    private static classes: Record<string, any> = {};
    private static functions: Record<string, any> = {};
    private static variables: Record<string, any> = {};

    constructor() {
        throw new Error(`System interface class cannot be constructed.`);
    }

    /**
     * 获取一个样板接口
     * @param type 要获取的接口类型
     * @param key 接口名称
     */
    static require<
        T extends InterfaceType,
        K extends keyof SystemInterfaceMap[T]
    >(type: T, key: K): SystemInterfaceMap[T][K];
    /**
     * 获取一个样板接口
     * @param type 要获取的接口类型
     * @param key 接口名称
     */
    static require(type: InterfaceType, key: string): any;
    static require(type: InterfaceType, key: string): any {
        const data = this.getByType(type)[key];
        if (!!data) return data;
        else {
            throw new Error(
                `Cannot resolve require: type='${type}',key='${key}'`
            );
        }
    }

    /**
     * 获取一种接口的所有内容
     * @param type 要获取的接口类型
     */
    static requireAll<T extends InterfaceType>(type: T): SystemInterfaceMap[T] {
        return this.getByType(type) as SystemInterfaceMap[T];
    }

    /**
     * 注册一个样板接口
     * @param type 要注册的接口类型
     * @param key 接口名称
     * @param data 接口内容
     */
    static register<
        T extends InterfaceType,
        K extends keyof SystemInterfaceMap[T]
    >(type: T, key: K, data: SystemInterfaceMap[T][K]): void;
    /**
     * 注册一个样板接口
     * @param type 要注册的接口类型
     * @param key 接口名称
     * @param data 接口内容
     */
    static register(type: InterfaceType, key: string, data: any): void;
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

declare global {
    interface Window {
        Mota: IMota;
    }
}

window.Mota = Mota;
