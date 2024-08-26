import { KeyCode } from '@/plugin/keyCodes';
import { deleteWith, generateBinary, keycode, spliceBy } from '@/plugin/utils';
import { EventEmitter } from 'eventemitter3';
import { isNil } from 'lodash-es';

// todo: 按下加速节流触发

interface HotkeyEvent {
    set: [id: string, key: KeyCode, assist: number];
    emit: [key: KeyCode, assist: number, type: KeyEmitType];
    press: [key: KeyCode];
    release: [key: KeyCode];
}

type KeyEmitType =
    | 'up'
    | 'down'
    | 'down-repeat'
    | 'down-throttle'
    // todo: | 'down-accelerate'
    | 'down-timeout';

type KeyEventType = 'up' | 'down';

interface AssistHoykey {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
}

interface RegisterHotkeyData extends Partial<AssistHoykey> {
    id: string;
    name: string;
    defaults: KeyCode;
}

interface HotkeyData extends Required<RegisterHotkeyData> {
    key: KeyCode;
    emits: Map<symbol, HotkeyEmitData>;
    group?: string;
}

/**
 * @param id 此处的id包含数字后缀
 * @returns 返回 `@void` 时，表示此次触发没有包含副作用，不会致使 `preventDefault` 被执行
 */
type HotkeyFunc = (
    id: string,
    code: KeyCode,
    ev: KeyboardEvent
) => void | '@void';

interface HotkeyEmitData {
    func: HotkeyFunc;
    onUp?: HotkeyFunc;
    config?: HotkeyEmitConfig;
}

export interface HotkeyJSON {
    key: KeyCode;
    assist: number;
}

export interface HotkeyEmitConfig {
    type: KeyEmitType;
    throttle?: number;
    accelerate?: number;
    timeout?: number;
}

export class Hotkey extends EventEmitter<HotkeyEvent> {
    static list: Hotkey[];

    id: string;
    name: string;
    data: Record<string, HotkeyData> = {};
    keyMap: Map<KeyCode, HotkeyData[]> = new Map();
    /** id to name */
    groupName: Record<string, string> = {
        none: '未分类按键'
    };
    /** id to keys */
    groups: Record<string, string[]> = {
        none: []
    };
    enabled: boolean = false;
    conditionMap: Map<symbol, () => boolean> = new Map();

    /** 当前作用域 */
    scope: symbol = Symbol();
    private scopeStack: symbol[] = [];
    private grouping: string = 'none';

    /** 当前正在按下的按键 */
    private pressed: Set<KeyCode> = new Set();
    /** 按键按下时的时间 */
    private pressTime: Map<KeyCode, number> = new Map();
    /** 按键节流时间 */
    private throttleMap: Map<KeyCode, number> = new Map();

    constructor(id: string, name: string) {
        super();
        this.id = id;
        this.name = name;
    }

    /**
     * 注册一个按键，id可以包含数字后缀，可以显示为同一个按键操作拥有多个按键可以触发
     * @param data 要注册的按键信息
     */
    register(data: RegisterHotkeyData) {
        const d: HotkeyData = {
            ...data,
            ctrl: !!data.ctrl,
            shift: !!data.shift,
            alt: !!data.alt,
            key: data.defaults,
            emits: new Map(),
            group: this.grouping
        };
        this.ensureMap(d.key);
        if (d.id in this.data) {
            console.warn(`已存在id为${d.id}的按键，已将其覆盖`);
        }
        this.data[d.id] = d;
        const arr = this.keyMap.get(d.key)!;
        arr.push(d);
        this.groups[this.grouping].push(d.id);
        return this;
    }

    /**
     * 实现一个按键按下时的操作
     * @param id 要实现的按键id，可以不包含数字后缀
     * @param func 按键按下时执行的函数
     * @param config 按键的配置信息
     */
    realize(id: string, func: HotkeyFunc, config?: HotkeyEmitConfig) {
        const toSet = Object.values(this.data).filter(v => {
            const split = v.id.split('_');
            const last = !isNaN(Number(split.at(-1)));
            return v.id === id || (last && split.slice(0, -1).join('_') === id);
        });
        if (toSet.length === 0) {
            throw new Error(`Realize nonexistent key '${id}'.`);
        }
        for (const key of toSet) {
            const data = key.emits.get(this.scope);
            if (!data) {
                key.emits.set(this.scope, { func, config });
            } else {
                // 同时注册抬起和按下
                const dataType = data.config?.type ?? 'up';
                const configType = config?.type ?? 'up';
                if (dataType === 'up' && configType !== 'up') {
                    data.onUp = func;
                    data.config ??= { type: configType };
                    data.config.type = configType;
                } else if (dataType !== 'up' && configType === 'up') {
                    data.onUp = func;
                } else {
                    data.config = config;
                    data.func = func;
                }
            }
        }
        return this;
    }

    /**
     * 使用一个symbol作为当前作用域，之后调用{@link realize}所实现的按键功能将会添加至此作用域
     * @param symbol 当前作用域的symbol
     */
    use(symbol: symbol) {
        spliceBy(this.scopeStack, symbol);
        this.scopeStack.push(symbol);
        this.scope = symbol;
        this.conditionMap.set(symbol, () => true);
    }

    /**
     * 释放一个作用域，释放后作用域将退回至删除的作用域的上一级
     * @param symbol 要释放的作用域的symbol
     */
    dispose(symbol: symbol = this.scopeStack.at(-1) ?? Symbol()) {
        for (const key of Object.values(this.data)) {
            key.emits.delete(symbol);
        }
        spliceBy(this.scopeStack, symbol);
        this.scope = this.scopeStack.at(-1) ?? Symbol();
    }

    /**
     * 设置一个按键信息
     * @param id 要设置的按键的id
     * @param key 要设置成的按键
     * @param assist 辅助按键，三位二进制数据，从低到高依次为`ctrl` `shift` `alt`
     * @param emit 是否触发set事件，当且仅当从fromJSON方法调用时为false
     */
    set(id: string, key: KeyCode, assist: number, emit: boolean = true) {
        const { ctrl, shift, alt } = unwarpBinary(assist);
        const data = this.data[id];
        const before = this.keyMap.get(data.key)!;
        deleteWith(before, data);
        this.ensureMap(key);
        const after = this.keyMap.get(key)!;
        after.push(data);
        data.key = key;
        data.ctrl = ctrl;
        data.shift = shift;
        data.alt = alt;
        if (emit) this.emit('set', id, key, assist);
    }

    /**
     * 触发一个按键
     * @param key 要触发的按键
     * @param assist 辅助按键，三位二进制数据，从低到高依次为`ctrl` `shift` `alt`
     * @returns 是否有按键被触发
     */
    emitKey(
        key: KeyCode,
        assist: number,
        type: KeyEventType,
        ev: KeyboardEvent
    ): boolean {
        // 检查全局启用情况
        if (!this.enabled) return false;
        const when = this.conditionMap.get(this.scope)!;
        if (type === 'down') this.checkPress(key);
        else this.checkPressEnd(key);
        if (!when()) return false;
        const toEmit = this.keyMap.get(key);
        if (!toEmit) return false;

        // 进行按键初始处理
        const { ctrl, shift, alt } = unwarpBinary(assist);

        // 真正开始触发按键
        let emitted = false;

        toEmit.forEach(v => {
            if (ctrl === v.ctrl && shift === v.shift && alt === v.alt) {
                const data = v.emits.get(this.scope);
                if (!data) return;

                if (type === 'up' && data.onUp) {
                    data.onUp(v.id, key, ev);
                    emitted = true;
                    return;
                }
                if (!this.canEmit(v.id, key, type, data)) return;
                const res = data.func(v.id, key, ev);
                if (res !== '@void') emitted = true;
            }
        });
        this.emit('emit', key, assist, type);

        return emitted;
    }

    /**
     * 检查按键按下情况，如果没有按下则添加
     * @param keyCode 按下的按键
     */
    private checkPress(keyCode: KeyCode) {
        if (this.pressed.has(keyCode)) return;
        this.pressed.add(keyCode);
        this.pressTime.set(keyCode, Date.now());
        this.emit('press', keyCode);
    }

    /**
     * 当按键松开时，移除相应的按下配置
     * @param keyCode 松开的按键
     */
    private checkPressEnd(keyCode: KeyCode) {
        if (!this.pressed.has(keyCode)) return;
        this.pressed.delete(keyCode);
        this.pressTime.delete(keyCode);
        this.emit('release', keyCode);
    }

    /**
     * 检查一个按键是否可以被触发
     * @param id 触发的按键id
     * @param keyCode 按键码
     */
    private canEmit(
        _id: string,
        keyCode: KeyCode,
        type: KeyEventType,
        data: HotkeyEmitData
    ) {
        const config = data?.config;
        // 这时默认为抬起触发，始终可触发
        if (type === 'up') {
            if (!config || config.type === 'up') return true;
            else return false;
        }
        if (!config) return false;
        // 按下单次触发
        if (config.type === 'down') return !this.pressed.has(keyCode);
        // 按下重复触发
        if (config.type === 'down-repeat') return true;
        if (config.type === 'down-timeout') {
            const time = this.pressTime.get(keyCode);
            if (isNil(time) || isNil(config.timeout)) return false;
            return Date.now() - time >= config.timeout;
        }
        if (config.type === 'down-throttle') {
            const thorttleTime = this.throttleMap.get(keyCode);
            if (isNil(config.throttle)) return false;
            if (isNil(thorttleTime)) {
                this.throttleMap.set(keyCode, Date.now());
                return true;
            }
            if (Date.now() - thorttleTime >= config.throttle) {
                this.throttleMap.set(keyCode, Date.now());
                return true;
            }
            return false;
        }
    }

    /**
     * 按键分组，执行后 register 的按键将会加入此分组
     * @param id 组的id
     * @param name 组的名称
     */
    group(id: string, name: string, keys?: RegisterHotkeyData[]) {
        this.grouping = id;
        this.groupName[id] = name;
        this.groups[id] ??= [];
        keys?.forEach(v => this.register(v));
        return this;
    }

    /**
     * 启用这个按键控制器
     */
    enable() {
        this.enabled = true;
    }

    /**
     * 禁用这个按键控制器
     */
    disable() {
        this.enabled = false;
    }

    /**
     * 在当前作用域下，满足什么条件时触发按键
     * @param fn 条件函数
     */
    when(fn: () => boolean) {
        this.conditionMap.set(this.scope, fn);
        return this;
    }

    toJSON() {
        const res: Record<string, HotkeyJSON> = {};
        for (const [key, data] of Object.entries(this.data)) {
            res[key] = {
                key: data.key,
                assist: generateBinary([data.ctrl, data.shift, data.alt])
            };
        }
        return JSON.stringify(res);
    }

    fromJSON(data: string) {
        const json: Record<string, HotkeyJSON> = JSON.parse(data);
        for (const [key, data] of Object.entries(json)) {
            this.set(key, data.key, data.assist, false);
        }
    }

    private ensureMap(key: KeyCode) {
        if (!this.keyMap.has(key)) {
            this.keyMap.set(key, []);
        }
    }

    /**
     * 根据id获取hotkey实例
     * @param id 要获取的hotkey实例的id
     */
    static get(id: string) {
        return this.list.find(v => v.id === id);
    }
}

export function unwarpBinary(bin: number): AssistHoykey {
    return {
        ctrl: !!(bin & (1 << 0)),
        shift: !!(bin & (1 << 1)),
        alt: !!(bin & (1 << 2))
    };
}

export function checkAssist(bin: number, key: KeyCode) {
    return (
        isAssist(key) &&
        !!(
            (1 << (key === KeyCode.Ctrl ? 0 : key === KeyCode.Shift ? 1 : 2)) &
            bin
        )
    );
}

export function isAssist(key: KeyCode) {
    return key === KeyCode.Ctrl || key === KeyCode.Shift || key === KeyCode.Alt;
}

export const gameKey = new Hotkey('gameKey', '游戏按键');

// ----- Listening
document.addEventListener('keyup', e => {
    const assist = generateBinary([e.ctrlKey, e.shiftKey, e.altKey]);
    const code = keycode(e.keyCode);
    if (gameKey.emitKey(code, assist, 'up', e)) {
        e.preventDefault();
        if (core.status.holdingKeys) {
            deleteWith(core.status.holdingKeys, e.keyCode);
        }
    } else {
        // polyfill样板
        if (
            main.dom.startPanel.style.display == 'block' &&
            (main.dom.startButtons.style.display == 'block' ||
                main.dom.levelChooseButtons.style.display == 'block')
        ) {
            if (e.keyCode == 38 || e.keyCode == 33)
                // up/pgup
                main.selectButton((main.selectedButton || 0) - 1);
            else if (e.keyCode == 40 || e.keyCode == 34)
                // down/pgdn
                main.selectButton((main.selectedButton || 0) + 1);
            else if (e.keyCode == 67 || e.keyCode == 13 || e.keyCode == 32)
                // C/Enter/Space
                main.selectButton(main.selectedButton);
            else if (
                e.keyCode == 27 &&
                main.dom.levelChooseButtons.style.display == 'block'
            ) {
                // ESC
                core.showStartAnimate(true);
                e.preventDefault();
            }
            e.stopPropagation();
            return;
        }
        if (main.dom.inputDiv.style.display == 'block') {
            if (e.keyCode == 13) {
                setTimeout(function () {
                    main.dom.inputYes.click();
                }, 50);
            } else if (e.keyCode == 27) {
                setTimeout(function () {
                    main.dom.inputNo.click();
                }, 50);
            }
            return;
        }
        if (
            core &&
            core.isPlaying &&
            core.status &&
            (core.isPlaying() || core.status.lockControl)
        )
            core.onkeyUp(e);
    }
});
document.addEventListener('keydown', e => {
    const assist = generateBinary([e.ctrlKey, e.shiftKey, e.altKey]);
    const code = keycode(e.keyCode);
    if (gameKey.emitKey(code, assist, 'down', e)) {
        e.preventDefault();
    }
});
