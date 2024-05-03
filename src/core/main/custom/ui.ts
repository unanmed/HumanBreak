import { Component, shallowReactive } from 'vue';
import { EmitableEvent, EventEmitter } from '../../common/eventEmitter';
import { KeyCode } from '@/plugin/keyCodes';
import { Hotkey } from './hotkey';
import { generateBinary } from '@/plugin/utils';

interface FocusEvent<T> extends EmitableEvent {
    focus: (before: T | null, after: T) => void;
    unfocus: (before: T | null) => void;
    add: (item: T) => void;
    pop: (item: T | null) => void;
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

interface MountedVBind {
    num: number;
    ui: GameUi;
    [x: string]: any;
}

export class GameUi extends EventEmitter<GameUiEvent> {
    static uiList: GameUi[] = [];

    component: Component;
    hotkey?: Hotkey;
    id: string;
    symbol: symbol = Symbol();

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
    with(vBind?: UiVBind, vOn?: UiVOn): ShowableGameUi {
        return { ui: this, vOn, vBind };
    }
}

interface IndexedGameUi extends ShowableGameUi {
    num: number;
    vBind?: MountedVBind;
}

interface HoldOnController {
    end(noClosePanel?: boolean): void;
}

export class UiController extends Focus<IndexedGameUi> {
    static list: UiController[] = [];
    list: Record<string, GameUi> = {};
    num: number = 0;
    show: 'end' | 'all' = 'all';

    private hold: boolean = false;

    constructor(equal?: boolean) {
        super(true, equal);
        UiController.list.push(this);
        this.on('splice', spliced => {
            spliced.forEach(v => {
                v.ui.emit('close');
            });
            if (this.stack.length === 0) {
                if (!this.hold) this.emit('end', false);
                this.hold = false;
            }
        });
        this.on('add', item => {
            if (this.stack.length === 1) {
                this.emit('start');
            }
            item.ui.emit('open');
        });
    }

    /**
     * 设置为仅显示最后一个ui
     */
    showEnd() {
        this.show = 'end';
    }

    /**
     * 设置为显示所有ui
     */
    showAll() {
        this.show = 'all';
    }

    /**
     * 根据id获取到ui
     * @param id ui的id
     */
    get(id: string) {
        return this.list[id];
    }

    /**
     * 暂时保持下一次删除ui不会导致ui整体被关闭，引起ui背景闪烁。
     * 例如可以用于道具栏，打开道具时就应当 holdOn，然后通过道具使用钩子来判断接下来是否要隐藏 app:
     * ```txt
     * hold on -> close -> use item -> hook -> stack.length === 0 ? end() : no action
     * ```
     */
    holdOn(): HoldOnController {
        this.hold = true;

        return {
            end: (noClosePanel: boolean = false) => {
                this.emit('end', noClosePanel);
            }
        };
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
     * 根据id关闭所有同id的ui，注意非平等模式下，会将第一个ui后的所有ui都关闭掉
     * @param id 要关闭的ui的id
     */
    closeByName(id: string) {
        if (!this.equal) {
            const ui = this.stack.findIndex(v => v.ui.id === id);
            this.spliceIndex(ui);
        } else {
            let ui;
            while ((ui = this.stack.findIndex(v => v.ui.id === id)) !== -1) {
                this.spliceIndex(ui);
            }
        }
    }

    /**
     * 打开一个新的ui
     * @param id 要打开的ui的id
     * @param vOn 监听的事件
     * @param vBind 绑定的数据
     * @returns ui的唯一标识符
     */
    open(id: string, vBind?: UiVBind, vOn?: UiVOn) {
        if (core.isReplaying() && !this.equal) return -1;
        const ui = this.get(id);
        if (!ui) {
            console.warn(`Unknown UI: '${id}'.`);
            return -1;
        }
        const num = this.num++;
        const bind = {
            num,
            ui,
            ...(vBind ?? {})
        };
        const sui = ui.with(bind, vOn);
        this.add({
            num,
            ...sui
        } as IndexedGameUi);
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

    /**
     * 根据ui的唯一标识符来判断当前是否存在某个ui
     * @param id ui的唯一标识符
     */
    hasName(id: string) {
        return this.stack.some(v => v.ui.id === id);
    }
}
