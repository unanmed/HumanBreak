import { Component, reactive } from 'vue';
import { EmitableEvent, EventEmitter } from '../../common/eventEmitter';
import { KeyCode } from '../../../plugin/keyCodes';
import { Hotkey } from './hotkey';

interface FocusEvent<T> extends EmitableEvent {
    focus: (before: T | null, after: T) => void;
    unfocus: (before: T | null) => void;
    add: (item: T) => void;
    pop: (item: T | null) => void;
    register: (item: T[]) => void;
    splice: (spliced: T[]) => void;
}

export class Focus<T = any> extends EventEmitter<FocusEvent<T>> {
    targets: Set<T> = new Set();
    /** 显示列表 */
    stack: T[];
    focused: T | null = null;

    constructor(react?: boolean) {
        super();
        this.stack = react ? reactive([]) : [];
    }

    /**
     * 聚焦于一个目标
     * @param target 聚焦目标
     * @param add 如果聚焦目标不在显示列表里面，是否自动追加
     */
    focus(target: T, add: boolean = false) {
        if (target === this.focused) return;
        const before = this.focused;
        if (!this.stack.includes(target)) {
            if (add) {
                this.add(target);
                this.focused = target;
            } else {
                console.warn(
                    `聚焦于一个不存在的目标，同时没有传入自动追加的参数`,
                    `聚焦目标：${target}`
                );
                return;
            }
        } else {
            this.focused = target;
        }
        this.emit('focus', before, this.focused);
    }

    /**
     * 取消聚焦
     */
    unfocus() {
        const before = this.focused;
        this.focused = null;
        this.emit('unfocus', before);
    }

    /**
     * 向显示列表中添加物品
     * @param item 添加的物品
     */
    add(item: T) {
        if (!this.targets.has(item)) {
            console.warn(`向显示列表里面添加了不在物品集合里面的物品`);
            return;
        }
        this.stack.push(item);
        this.emit('add', item);
    }

    /**
     * 弹出显示列表中的最后一个物品
     */
    pop() {
        const item = this.stack.pop() ?? null;
        this.emit('pop', item);
        return item;
    }

    /**
     * 从一个位置开始删除显示列表
     * @param item 从哪开始删除，包括此项
     */
    splice(item: T) {
        const index = this.stack.indexOf(item);
        if (index === -1) {
            this.emit('splice', []);
            return;
        }
        this.emit('splice', this.stack.splice(index));
    }

    /**
     * 注册一个物品
     * @param item 要注册的物品
     */
    register(...item: T[]) {
        item.forEach(v => {
            this.targets.add(v);
        });
        this.emit('register', item);
    }
}

interface GameUiEvent extends EmitableEvent {
    close: () => void;
    open: () => void;
}

export class GameUi extends EventEmitter<GameUiEvent> {
    static uiList: GameUi[] = [];

    component: Component;
    hotkey?: Hotkey;

    constructor(component: Component, hotkey?: Hotkey) {
        super();
        this.component = component;
        this.hotkey = hotkey;
        GameUi.uiList.push(this);
    }
}

export class UiController extends Focus<GameUi> {
    constructor() {
        super(true);
        this.on('splice', spliced => {
            spliced.forEach(v => {
                v.emit('close');
            });
        });
        this.on('add', item => item.emit('open'));
    }

    /**
     * 执行按键操作
     * @param key 按键的KeyCode
     * @param e 按键操作事件
     */
    emitKey(key: KeyCode, e: KeyboardEvent) {
        this.focused?.hotkey?.emitKey(key, e);
    }
}
