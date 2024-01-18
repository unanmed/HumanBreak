import { EmitableEvent, EventEmitter } from '@/core/common/eventEmitter';
import { KeyCode } from '@/plugin/keyCodes';
import { gameKey } from '../init/hotkey';
import { unwarpBinary } from './hotkey';
import { deleteWith } from '@/plugin/utils';
import { cloneDeep } from 'lodash-es';

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

interface AssistManager {
    end(): void;
}

interface VirtualKeyboardEvent extends EmitableEvent {
    add: (item: KeyboardItem) => void;
    remove: (item: KeyboardItem) => void;
    emit: (item: KeyboardItem, assist: number, index: number) => void;
}

/**
 * 虚拟按键，同一个虚拟按键实例应当只能同时操作一个，但可以显示多个
 */
export class Keyboard extends EventEmitter<VirtualKeyboardEvent> {
    static list: Keyboard[] = [];

    id: string;
    keys: KeyboardItem[] = [];
    assist: number = 0;

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
        this.keys.push(item);
        this.emit('add', item);
    }

    /**
     * 移除一个按键
     * @param item 按键信息
     */
    remove(item: KeyboardItem) {
        deleteWith(this.keys, item);
        this.emit('remove', item);
    }

    /**
     * 创造一个在某些辅助按键已经按下的情况下的作用域，这些被按下的辅助按键还可以被玩家手动取消
     * @param assist 辅助按键
     * @returns 作用域控制器，用于结束此作用域
     */
    withAssist(assist: number): AssistManager {
        const thisAssist = this.assist;
        this.assist = assist;

        return {
            end: () => {
                this.assist = thisAssist;
            }
        };
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
    }

    /**
     * 触发按键
     * @param key 要触发的按键
     */
    emitKey(key: KeyboardItem, index: number) {
        const ev = generateKeyboardEvent(key.key, this.assist);
        gameKey.emitKey(key.key, this.assist, 'up', ev);
        this.emit('emit', key, this.assist, index);
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
