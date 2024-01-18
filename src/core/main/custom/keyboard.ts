import {
    EmitableEvent,
    EventEmitter,
    Listener
} from '@/core/common/eventEmitter';
import { KeyCode } from '@/plugin/keyCodes';
import { gameKey } from '../init/hotkey';
import { unwarpBinary } from './hotkey';
import { deleteWith, flipBinary } from '@/plugin/utils';
import { cloneDeep } from 'lodash-es';
import { shallowReactive } from 'vue';

export interface KeyboardEmits {
    key: KeyCode;
    assist: number;
}

interface KeyboardItem {
    key: KeyCode;
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface VirtualKeyEmit {
    preventDefault(): void;
}

type VirtualKeyEmitFn = (
    item: KeyboardItem,
    assist: number,
    index: number,
    ev: VirtualKeyEmit
) => void;

interface VirtualKeyboardEvent extends EmitableEvent {
    add: (item: KeyboardItem) => void;
    remove: (item: KeyboardItem) => void;
    extend: (extended: Keyboard) => void;
    emit: VirtualKeyEmitFn;
    scopeCreate: (scope: symbol) => void;
    scopeDispose: (scope: symbol) => void;
}

/**
 * 虚拟按键，同一个虚拟按键实例应当只能同时操作一个，但可以显示多个
 */
export class Keyboard extends EventEmitter<VirtualKeyboardEvent> {
    static list: Keyboard[] = [];

    id: string;
    keys: KeyboardItem[] = [];
    assist: number = 0;
    fontSize: number = 18;

    scope: symbol = Symbol();
    private scopeStack: symbol[] = [];
    private onEmitKey: Record<symbol, Listener<VirtualKeyEmitFn>[]> = {};
    private scopeAssist: Record<symbol, number> = {};

    constructor(id: string) {
        super();
        this.id = id;
        Keyboard.list.push(this);
    }

    /**
     * 给虚拟键盘添加一个按键
     * @param item 按键信息
     */
    add(item: KeyboardItem) {
        const i = shallowReactive(item);
        this.keys.push(i);
        this.emit('add', i);
        return this;
    }

    /**
     * 移除一个按键
     * @param item 按键信息
     */
    remove(item: KeyboardItem) {
        deleteWith(this.keys, item);
        this.emit('remove', item);
        return this;
    }

    /**
     * 创造一个在某些辅助按键已经按下的情况下的作用域，这些被按下的辅助按键还可以被玩家手动取消
     * @param assist 辅助按键
     */
    withAssist(assist: number) {
        this.assist = assist;
        const symbol = this.createScope();
        return symbol;
    }

    /**
     * 创造一个虚拟按键作用域，所有监听的事件与其他作用域不冲突
     * @returns 作用域的唯一标识符
     */
    createScope() {
        const last = this.scopeStack.at(-1);
        const symbol = Symbol();
        this.scope = symbol;
        this.scopeStack.push(symbol);
        const ev: Listener<VirtualKeyEmitFn>[] = [];
        this.onEmitKey[symbol] = ev;
        // @ts-ignore
        this.events = ev;
        this.emit('scopeCreate', symbol);
        if (!!last) {
            this.scopeAssist[symbol] = this.assist;
        }
        this.assist = 0;
        this.scopeAssist[symbol] = 0;
        return symbol;
    }

    /**
     * 释放一个作用域，同时删除其中的所有监听器
     */
    disposeScope() {
        if (this.scopeStack.length === 0) {
            throw new Error(
                `Cannot dispose virtual key scope since there's no scope to be disposed.`
            );
        }
        const now = this.scopeStack.pop()!;
        delete this.onEmitKey[now];
        delete this.scopeAssist[now];
        const symbol = this.scopeStack.at(-1);
        this.emit('scopeDispose', now);
        if (!symbol) return;
        this.scope = symbol;
        this.assist = this.scopeAssist[symbol];
        // @ts-ignore
        this.events = this.onEmitKey[symbol];
    }

    /**
     * 继承一个按键的按键信息
     * @param keyboard 要被继承的按键
     * @param offsetX 被继承的按键的横坐标偏移量
     * @param offsetY 被继承的按键的纵坐标偏移量
     */
    extend(keyboard: Keyboard, offsetX: number = 0, offsetY: number = 0) {
        const toClone = cloneDeep(keyboard.keys);
        toClone.forEach(v => {
            v.x += offsetX;
            v.y += offsetY;
        });

        this.keys.push(...toClone);
        this.emit('extend', keyboard);
    }

    /**
     * 触发按键
     * @param key 要触发的按键
     */
    emitKey(key: KeyboardItem, index: number) {
        let prevent = false;
        const preventDefault = () => (prevent = true);
        this.emit('emit', key, this.assist, index, { preventDefault });

        if (!prevent) {
            if (key.key === KeyCode.Ctrl) {
                this.assist = flipBinary(this.assist, 0);
            } else if (key.key === KeyCode.Shift) {
                this.assist = flipBinary(this.assist, 1);
            } else if (key.key === KeyCode.Alt) {
                this.assist = flipBinary(this.assist, 2);
            }
            const ev = generateKeyboardEvent(key.key, this.assist);
            gameKey.emitKey(key.key, this.assist, 'up', ev);
        }
    }

    static get(id: string) {
        return this.list.find(v => v.id === id);
    }
}

export function generateKeyboardEvent(key: KeyCode, assist: number) {
    const { ctrl, alt, shift } = unwarpBinary(assist);
    const ev = new KeyboardEvent('keyup', {
        ctrlKey: ctrl,
        shiftKey: shift,
        altKey: alt
    });

    return ev;
}

export function isAssist(key: KeyCode) {
    return key === KeyCode.Ctrl || key === KeyCode.Shift || key === KeyCode.Alt;
}
