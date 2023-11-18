import { KeyCode } from '@/plugin/keyCodes';
import { getLocFromMouseLoc } from '@/plugin/ui/fixed';
import { deleteWith, generateBinary, has, spliceBy, tip } from '@/plugin/utils';
import { EmitableEvent, EventEmitter } from '../../common/eventEmitter';
import { GameStorage } from '../storage';

interface HotkeyEvent extends EmitableEvent {}

type KeyEmitType = 'down' | 'up';

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

type HotkeyFunc = (code: KeyCode, ev: KeyboardEvent) => void;

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

    private scope: symbol = Symbol();
    private scopeStack: symbol[] = [];
    private grouping: string = 'none';

    constructor(id: string, name: string) {
        super();
        this.id = id;
        this.name = name;
    }

    /**
     * 注册一个按键
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
     * @param id 要实现的按键id
     * @param func 按键按下时执行的函数
     */
    realize(id: string, func: HotkeyFunc) {
        const key = this.data[id];
        if (!key.func.has(this.scope)) {
            throw new Error(
                `Cannot access using scope. Call use before calling realize.`
            );
        }
        key.func.set(this.scope, func);
    }

    /**
     * 使用一个symbol作为当前作用域，之后调用{@link realize}所实现的按键功能将会添加至此作用域
     * @param symbol 当前作用域的symbol
     */
    use(symbol: symbol) {
        spliceBy(this.scopeStack, symbol);
        this.scopeStack.push(symbol);
        this.scope = symbol;
        for (const key of Object.values(this.data)) {
            key.func.set(symbol, () => {});
        }
    }

    /**
     * 释放一个作用域，释放后作用域将退回至删除的作用域的上一级
     * @param symbol 要释放的作用域的symbol
     */
    dispose(symbol: symbol) {
        for (const key of Object.values(this.data)) {
            key.func.delete(symbol);
        }
        spliceBy(this.scopeStack, symbol);
        this.scope = this.scopeStack.pop() ?? Symbol();
    }

    /**
     * 设置一个按键信息
     * @param id 要设置的按键的id
     * @param key 要设置成的按键
     * @param assist 辅助按键，三位二进制数据，从低到高依次为`ctrl` `shift` `alt`
     */
    set(id: string, key: KeyCode, assist: number) {
        const { ctrl, shift, alt } = this.unwarpBinary(assist);
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
    }

    /**
     * 触发一个按键
     * @param key 要触发的按键
     * @param assist 辅助按键，三位二进制数据，从低到高依次为`ctrl` `shift` `alt`
     */
    emitKey(
        key: KeyCode,
        assist: number,
        type: KeyEmitType,
        ev: KeyboardEvent
    ) {
        if (!this.enabled) return;
        const toEmit = this.keyMap.get(key);
        if (!toEmit) return;
        const { ctrl, shift, alt } = this.unwarpBinary(assist);
        toEmit.forEach(v => {
            if (type !== v.type) return;
            if (ctrl === v.ctrl && shift === v.shift && alt === v.alt) {
                const func = v.func.get(this.scope);
                if (!func) {
                    throw new Error(`Emit unknown scope keys.`);
                }
                func(key, ev);
            }
        });
    }

    /**
     * 按键分组，执行后 register 的按键将会加入此分组
     * @param id 组的id
     * @param name 组的名称
     */
    group(id: string, name: string) {
        this.grouping = id;
        this.groupName[id] = name;
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

    private unwarpBinary(bin: number): AssistHoykey {
        return {
            ctrl: !!(bin & (1 << 0)),
            shift: !!(bin & (1 << 1)),
            alt: !!(bin & (1 << 2))
        };
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
