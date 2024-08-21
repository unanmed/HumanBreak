import { KeyCode } from '@/plugin/keyCodes';
import { deleteWith, generateBinary, keycode, spliceBy } from '@/plugin/utils';
import { EventEmitter } from '../../common/eventEmitter';

// todo: 按下时触发，长按（单次/连续）触发，按下连续触发，按下节流触发，按下加速节流触发

interface HotkeyEvent {
    set: (id: string, key: KeyCode, assist: number) => void;
    emit: (key: KeyCode, assist: number, type: KeyEmitType) => void;
}

type KeyEmitType =
    | 'down'
    | 'up'
    | 'down-repeat'
    | 'down-throttle'
    | 'down-accelerate'
    | 'down-timeout';

interface AssistHoykey {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
}

interface RegisterHotkeyData extends Partial<AssistHoykey> {
    id: string;
    name: string;
    defaults: KeyCode;
    type?: KeyEmitType;
}

interface HotkeyData extends Required<RegisterHotkeyData> {
    key: KeyCode;
    func: Map<symbol, HotkeyFunc>;
    group?: string;
}

/**
 * @param id 此处的id包含数字后缀
 */
type HotkeyFunc = (
    id: string,
    code: KeyCode,
    ev: KeyboardEvent
) => void | '@void';

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
    /** 每个指令的配置信息 */
    configData: Map<string, HotkeyEmitConfig> = new Map();
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

    private scope: symbol = Symbol();
    private scopeStack: symbol[] = [];
    private grouping: string = 'none';

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
            func: new Map(),
            group: this.grouping,
            type: data.type ?? 'up'
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
     * @param config 按键触发配置，默认为按键抬起时触发
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
            if (!key.func.has(this.scope)) {
                throw new Error(
                    `Cannot access using scope. Call use before calling realize.`
                );
            }
            key.func.set(this.scope, func);
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
        for (const key of Object.values(this.data)) {
            key.func.set(symbol, () => '@void');
        }
    }

    /**
     * 释放一个作用域，释放后作用域将退回至删除的作用域的上一级
     * @param symbol 要释放的作用域的symbol
     */
    dispose(symbol: symbol = this.scopeStack.at(-1) ?? Symbol()) {
        for (const key of Object.values(this.data)) {
            key.func.delete(symbol);
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
        type: KeyEmitType,
        ev: KeyboardEvent
    ): boolean {
        if (!this.enabled) return false;
        const when = this.conditionMap.get(this.scope)!;
        if (!when()) return false;
        const toEmit = this.keyMap.get(key);
        if (!toEmit) return false;
        const { ctrl, shift, alt } = unwarpBinary(assist);
        let emitted = false;
        toEmit.forEach(v => {
            if (type !== v.type) return;
            if (ctrl === v.ctrl && shift === v.shift && alt === v.alt) {
                const func = v.func.get(this.scope);
                if (!func) {
                    throw new Error(`Emit unknown scope keys.`);
                }
                const res = func(v.id, key, ev);
                if (res !== '@void') emitted = true;
            }
        });
        this.emit('emit', key, assist, type);
        return emitted;
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

// todo
/**
 * 热键控制器，用于控制按下时触发等操作
 */
export class HotkeyController {
    /** 所有按下的按键 */
    private pressed: Set<KeyCode> = new Set();

    /** 当前控制器管理的热键实例 */
    hotkey: Hotkey;

    constructor(hotkey: Hotkey) {
        this.hotkey = hotkey;
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
