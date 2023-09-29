import { Component, shallowReactive } from 'vue';
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
    /** 显示列表 */
    stack: T[];
    focused: T | null = null;

    /** 聚焦目标是否平等，在平等时，关闭聚焦目标不再会将其之后的目标全部删除，而是保留 */
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
     * 从一个位置开始删除显示列表，如果平等，则只会删除一个，否则会将其之后的所有的目标全部删除
     * @param item 从哪开始删除，包括此项
     */
    splice(item: T) {
        const index = this.stack.indexOf(item);
        this.spliceIndex(index);
    }

    /**
     * 根据索引在显示列表中删除一项
     * @param index 要删除的项的索引
     */
    spliceIndex(index: number) {
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
}

interface GameUiEvent extends EmitableEvent {
    close: () => void;
    open: () => void;
}

interface ShowableGameUi {
    ui: GameUi;
    vOn?: UiVOn;
    vBind?: UiVBind;
}

type UiVOn = Record<string, (param?: any) => void>;
type UiVBind = Record<string, any>;

export class GameUi extends EventEmitter<GameUiEvent> {
    static uiList: GameUi[] = [];

    component: Component;
    hotkey?: Hotkey;
    id: string;

    constructor(id: string, component: Component, hotkey?: Hotkey) {
        super();
        this.component = component;
        this.hotkey = hotkey;
        this.id = id;
        GameUi.uiList.push(this);
    }

    /**
     * 根据 v-on 和 v-bind 创建可以显示的 ui 组件
     * @param vOn 监听的事件
     * @param vBind 绑定的数据
     */
    with(vOn?: UiVOn, vBind?: UiVBind): ShowableGameUi {
        return { ui: this, vOn, vBind };
    }
}

interface IndexedGameUi extends ShowableGameUi {
    num: number;
}

export class UiController extends Focus<IndexedGameUi> {
    static list: UiController[] = [];
    list: Record<string, GameUi> = {};
    num: number = 0;

    constructor(equal?: boolean) {
        super(true, equal);
        UiController.list.push(this);
        this.on('splice', spliced => {
            spliced.forEach(v => {
                v.ui.emit('close');
                if (this.stack.length === 0) {
                    this.emit('end');
                }
            });
        });
        this.on('add', item => {
            if (this.stack.length === 1) {
                this.emit('start');
            }
            item.ui.emit('open');
        });
    }

    /**
     * 执行按键操作
     * @param key 按键的KeyCode
     * @param e 按键操作事件
     */
    emitKey(key: KeyCode, e: KeyboardEvent) {
        this.focused?.ui.hotkey?.emitKey(key, e, this.focused);
    }

    /**
     * 根据id获取到ui
     * @param id ui的id
     */
    get(id: string) {
        return this.list[id];
    }

    /**
     * 关闭一个ui，注意如果不是平等模式，在其之后的ui都会同时关闭掉
     * @param num 要关闭的ui的唯一标识符
     */
    close(num: number) {
        const ui = this.stack.findIndex(v => v.num === num);
        this.spliceIndex(ui);
    }

    /**
     * 打开一个新的ui
     * @param id 要打开的ui的id
     * @param vOn 监听的事件
     * @param vBind 绑定的数据
     * @returns ui的唯一标识符
     */
    open(id: string, vOn?: UiVOn, vBind?: UiVBind) {
        const ui = this.get(id);
        if (!ui) return -1;
        const num = this.num++;
        this.add({ num, ...ui.with(vOn, vBind) });
        return num;
    }

    /**
     * 注册一个ui
     * @param id ui的id
     * @param ui 对应的GameUi实例
     */
    register(...ui: GameUi[]) {
        ui.forEach(v => {
            const id = v.id;
            if (id in this.list) {
                console.warn(`已存在id为'${id}'的ui，已将其覆盖`);
            }
            this.list[id] = v;
        });
    }

    /**
     * 取消注册一个ui
     * @param id 要取消注册的ui的id
     */
    unregister(...id: string[]) {
        id.forEach(v => {
            delete this.list[v];
        });
        return this;
    }

    /**
     * 根据ui的唯一标识符进行聚焦
     * @param num 要聚焦于的ui的唯一标识符
     */
    focusByNum(num: number) {
        const ui = this.getByNum(num);
        if (!ui) return;
        this.focus(ui);
    }

    /**
     * 根据唯一标识符获取对应的ui
     * @param num ui的唯一标识符
     */
    getByNum(num: number) {
        return this.stack.find(v => v.num === num);
    }
}
