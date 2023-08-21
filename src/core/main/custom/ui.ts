import { Component, h, shallowReactive } from 'vue';
import { EmitableEvent, EventEmitter } from '../../common/eventEmitter';
import { KeyCode } from '../../../plugin/keyCodes';
import { Hotkey } from './hotkey';

interface FocusEvent<T> extends EmitableEvent {
    focus: (before: T | null, after: T) => void;
    unfocus: (before: T | null) => void;
    add: (item: T) => void;
    pop: (item: T | null) => void;
    register: (item: T[]) => void;
    unregister: (item: T[]) => void;
    splice: (spliced: T[]) => void;
}

export class Focus<T = any> extends EventEmitter<FocusEvent<T>> {
    targets: Set<T> = new Set();
    /** 显示列表 */
    stack: T[];
    focused: T | null = null;

    /** ui是否平等，在平等时，关闭ui不再会将其之后的ui全部删除，而是保留 */
    readonly equal: boolean;

    constructor(react: boolean = false, equal: boolean = false) {
        super();
        this.stack = react ? shallowReactive([]) : [];
        this.equal = equal;
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
            console.warn(
                `向显示列表里面添加了不在物品集合里面的物品`,
                `添加的物品：${item}`
            );
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
        const last = this.stack.at(-1) ?? null;
        if (!last) this.unfocus();
        else this.focus(last);
        this.emit('pop', item);
        return item;
    }

    /**
     * 从一个位置开始删除显示列表，如果ui平等，则只会删除一个，否则会将其之后的所有ui全部删除
     * @param item 从哪开始删除，包括此项
     */
    splice(item: T) {
        const index = this.stack.indexOf(item);
        if (index === -1) {
            this.emit('splice', []);
            return;
        }
        const last = this.stack.at(-1) ?? null;
        if (!last) this.unfocus();
        else this.focus(last);
        this.emit(
            'splice',
            this.stack.splice(index, this.equal ? 1 : Infinity)
        );
    }

    /**
     * 注册物品
     * @param item 要注册的物品
     */
    register(...item: T[]) {
        item.forEach(v => {
            this.targets.add(v);
        });
        this.emit('register', item);
        return this;
    }

    /**
     * 取消注册物品
     * @param item 要取消注册的物品
     */
    unregister(...item: T[]) {
        item.forEach(v => {
            this.targets.delete(v);
        });
        this.emit('unregister', item);
        return this;
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
    id: string;

    vBind: any = {};
    vOn: Record<string, (...params: any[]) => any> = {};

    constructor(id: string, component: Component, hotkey?: Hotkey) {
        super();
        this.component = component;
        this.hotkey = hotkey;
        this.id = id;
        GameUi.uiList.push(this);
    }

    /**
     * 双向数据绑定，即 vue 内的 v-bind
     * @param data 要绑定的数据
     */
    vbind(data: any) {
        this.vBind = data;
    }

    /**
     * 监听这个ui组件所触发的某种事件
     * @param event 要监听的事件
     * @param fn 事件触发时执行的函数
     */
    von(event: string, fn: (...params: any[]) => any) {
        this.vOn[event] = fn;
    }

    /**
     * 取消监听这个ui组件所触发的某种事件
     * @param event 要取消监听的事件
     */
    voff(event: string) {
        delete this.vOn[event];
    }
}

export class UiController extends Focus<GameUi> {
    static list: UiController[] = [];

    constructor(equal?: boolean) {
        super(true, equal);
        UiController.list.push(this);
        this.on('splice', spliced => {
            spliced.forEach(v => {
                v.emit('close');
                if (this.stack.length === 0) {
                    this.emit('end');
                }
            });
        });
        this.on('add', item => {
            if (this.stack.length === 1) {
                this.emit('start');
            }
            item.emit('open');
        });
    }

    /**
     * 执行按键操作
     * @param key 按键的KeyCode
     * @param e 按键操作事件
     */
    emitKey(key: KeyCode, e: KeyboardEvent) {
        this.focused?.hotkey?.emitKey(key, e);
    }

    /**
     * 根据id获取到ui
     * @param id ui的id
     */
    get(id: string) {
        return [...this.targets.values()].find(v => v.id === id);
    }

    /**
     * 关闭一个ui，注意如果不是平等模式，在其之后的ui都会同时关闭掉
     * @param id 要关闭的ui的id
     */
    close(id: string) {
        const ui = this.stack.find(v => v.id === id);
        if (!ui) return;
        this.splice(ui);
    }
}
