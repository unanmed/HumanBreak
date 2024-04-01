import { EmitableEvent, EventEmitter } from '@/core/common/eventEmitter';
import { KeyCode } from '@/plugin/keyCodes';
import { deleteWith, flipBinary, has } from '@/plugin/utils';
import {
    FunctionalComponent,
    markRaw,
    nextTick,
    reactive,
    shallowReactive
} from 'vue';
import {
    createToolbarComponents,
    createToolbarEditorComponents
} from '../init/toolbar';
import { gameKey } from '../init/hotkey';
import { unwarpBinary } from './hotkey';
import { fixedUi } from '../init/ui';
import { GameStorage } from '../storage';

interface CustomToolbarEvent extends EmitableEvent {
    add: (item: ValueOf<ToolbarItemMap>) => void;
    delete: (item: ValueOf<ToolbarItemMap>) => void;
    set: (id: string, data: Partial<SettableItemData>) => void;
    emit: (id: string, item: ValueOf<ToolbarItemMap>) => void;
    posChange: (bar: CustomToolbar) => void;
}

interface ToolbarItemBase<T extends ToolbarItemType> {
    type: T;
    id: string;
}

// 快捷键
interface HotkeyToolbarItem extends ToolbarItemBase<'hotkey'> {
    key: KeyCode;
    assist: number;
}

// 使用道具
interface ItemToolbarItem extends ToolbarItemBase<'item'> {
    item: ItemIdOf<'tools' | 'constants'>;
}

// 切换辅助按键 ctrl alt shift
interface AssistKeyToolbarItem extends ToolbarItemBase<'assistKey'> {
    assist: KeyCode.Ctrl | KeyCode.Shift | KeyCode.Alt;
}

interface ToolbarItemMap {
    hotkey: HotkeyToolbarItem;
    item: ItemToolbarItem;
    assistKey: AssistKeyToolbarItem;
}

interface ToolbarSaveData {
    x: number;
    y: number;
    w: number;
    h: number;
    items: ValueOf<ToolbarItemMap>[];
}

export type ToolbarItemType = keyof ToolbarItemMap;

export type SettableItemData<T extends ToolbarItemType = ToolbarItemType> =
    Omit<ToolbarItemMap[T], 'id' | 'type'>;

export interface CustomToolbarProps<
    T extends ToolbarItemType = ToolbarItemType
> {
    item: ToolbarItemMap[T];
    toolbar: CustomToolbar;
}
export type CustomToolbarComponent<
    T extends ToolbarItemType = ToolbarItemType
> = FunctionalComponent<CustomToolbarProps<T>>;

type ToolItemEmitFn<T extends ToolbarItemType> = (
    this: CustomToolbar,
    id: string,
    item: ToolbarItemMap[T]
) => boolean;

interface RegisteredCustomToolInfo {
    name: string;
    onEmit: ToolItemEmitFn<ToolbarItemType>;
    show: CustomToolbarComponent;
    editor: CustomToolbarComponent;
    onCreate: (item: any) => ToolbarItemBase<ToolbarItemType>;
}

const COM = createToolbarComponents();
const EDITOR = createToolbarEditorComponents();

const toolbarStorage = new GameStorage<Record<string, ToolbarSaveData>>(
    GameStorage.fromAuthor('AncTe', 'toolbar')
);

export class CustomToolbar extends EventEmitter<CustomToolbarEvent> {
    static num: number = 0;
    static list: CustomToolbar[] = shallowReactive([]);
    static info: Record<string, RegisteredCustomToolInfo> = {};

    items: ValueOf<ToolbarItemMap>[] = reactive([]);
    num: number = CustomToolbar.num++;
    id: string;
    // ----- size
    x: number = 300;
    y: number = 300;
    width: number = 300;
    height: number = 70;
    // ----- other
    assistKey: number = 0;
    showIds: number[] = [];

    constructor(id: string) {
        super();
        this.id = id;
        this.show();
        CustomToolbar.list.push(this);
    }

    /**
     * 添加一个自定义项
     * @param item 要添加的自定义工具栏项
     */
    add<K extends ToolbarItemType>(item: ToolbarItemMap[K]) {
        const index = this.items.findIndex(v => v.id === item.id);
        if (index !== -1) {
            console.warn(`添加了id重复的自定义工具，已将其覆盖`);
            this.items[index] = item;
        } else {
            this.items.push(item);
        }
        this.emit('add', item);
        return this;
    }

    /**
     * 删除一个自定义项
     * @param id 要删除的项的id
     */
    delete(id: string) {
        const index = this.items.findIndex(v => v.id === id);
        if (index === -1) return;
        const item = this.items[index];
        this.items.splice(index, 1);
        this.emit('delete', item);
        return this;
    }

    /**
     * 设置一个项
     * @param id 要设置的项的id
     * @param item 要设置的属性内容
     */
    set<T extends ToolbarItemType>(
        id: string,
        item: Partial<SettableItemData<T>>
    ) {
        const toSet = this.items.find(v => v.id === id);
        if (!toSet) return;
        Object.assign(toSet, item);
        this.emit('set', id, item);
        return this;
    }

    /**
     * 触发一个自定义工具
     * @param id 要触发的自定义工具的id
     */
    emitTool(id: string) {
        const item = this.items.find(v => v.id === id);
        if (!item) return this;
        this.emit('emit', id, item);
        const info = CustomToolbar.info[item.type];
        if (!info) {
            console.warn(`触发了未知的自定义工具类型：'${item.type}'`);
            return this;
        }
        const success = info.onEmit.call(this, id, item);
        if (!success) {
            console.warn(`触发自定义工具失败，id:'${id}',type:${item.type}`);
        }
        return this;
    }

    /**
     * 强制刷新这个自定义工具栏的所有显示
     */
    refresh() {
        const items = this.items.splice(0);
        nextTick(() => {
            this.items.push(...items);
        });
        return this;
    }

    setPos(x?: number, y?: number) {
        has(x) && (this.x = x);
        has(y) && (this.y = y);
        this.emit('posChange', this);
    }

    setSize(width?: number, height?: number) {
        has(width) && (this.width = width);
        has(height) && (this.height = height);
        this.emit('posChange', this);
    }

    /**
     * 显示这个自定义工具栏，可以显示多个，且内容互通
     */
    show() {
        const id = fixedUi.open('toolbar', { bar: this });
        this.showIds.push(id);
        return id;
    }

    /**
     * 关闭一个以此实例为基础显示的自定义工具栏
     * @param id 要关闭的id
     */
    close(id: number) {
        fixedUi.close(id);
        deleteWith(this.showIds, id);
    }

    /**
     * 关闭这个自定义工具栏的所有显示
     */
    closeAll() {
        this.showIds.forEach(v => fixedUi.close(v));
        this.showIds = [];
    }

    static get(id: string) {
        return this.list.find(v => v.id === id);
    }

    /**
     * 注册一类自定义工具
     * @param type 要注册的自定义工具类型
     * @param name 该类型的中文名
     * @param onEmit 当触发这个自定义工具的时候执行的函数
     * @param show 这个自定义工具在自定义工具栏的显示组件
     * @param editor 这个自定义工具在编辑时编辑组件
     * @param onCreate 当这个自定义工具在编辑器中被添加时，执行的初始化脚本
     */
    static register<K extends ToolbarItemType>(
        type: K,
        name: string,
        onEmit: ToolItemEmitFn<K>,
        show: CustomToolbarComponent<K>,
        editor: CustomToolbarComponent<K>,
        onCreate: (item: any) => ToolbarItemMap[K]
    ) {
        if (type in this.info) {
            console.warn(`已存在名为'${type}'的自定义工具类型，已将其覆盖！`);
        }
        const info: RegisteredCustomToolInfo = {
            name,
            onEmit: onEmit as ToolItemEmitFn<ToolbarItemType>,
            show: show as CustomToolbarComponent,
            editor: editor as CustomToolbarComponent,
            // @ts-ignore
            onCreate
        };
        this.info[type] = info;
    }

    static save() {
        toolbarStorage.clear();
        this.list.forEach(v => {
            const toSave: ToolbarSaveData = {
                x: v.x,
                y: v.y,
                w: v.width,
                h: v.height,
                items: []
            };
            v.items.forEach(v => {
                toSave.items.push(v);
            });
            toolbarStorage.setValue(v.id, toSave);
        });
        toolbarStorage.write();
    }

    static load() {
        toolbarStorage.read();
        for (const [key, value] of Object.entries(toolbarStorage.data)) {
            const bar = this.get(key) ?? new CustomToolbar(key);
            bar.x = value.x;
            bar.y = value.y;
            bar.width = value.w;
            bar.height = value.h;
            for (const item of value.items) {
                bar.add(item);
            }
        }
    }

    static refreshAll(): void {
        CustomToolbar.list.forEach(v => v.refresh());
    }

    static showAll(): number[] {
        return CustomToolbar.list.map(v => v.show());
    }

    static closeAll() {
        this.list.forEach(v => v.closeAll());
    }
}

CustomToolbar.register(
    'hotkey',
    '快捷键',
    function (id, item) {
        // 按键
        const assist = item.assist | this.assistKey;
        const { ctrl, shift, alt } = unwarpBinary(assist);
        const ev = new KeyboardEvent('keyup', {
            ctrlKey: ctrl,
            shiftKey: shift,
            altKey: alt
        });

        // todo: Advanced KeyboardEvent simulate
        gameKey.emitKey(item.key, assist, 'up', ev);
        return true;
    },
    COM.KeyTool,
    EDITOR.KeyTool,
    item => {
        return {
            key: KeyCode.Unknown,
            assist: 0,
            ...item
        };
    }
);
CustomToolbar.register(
    'item',
    '使用道具',
    function (id, item) {
        // 道具
        core.tryUseItem(item.item);
        return true;
    },
    COM.ItemTool,
    EDITOR.ItemTool,
    item => {
        return {
            item: 'book',
            ...item
        };
    }
);
CustomToolbar.register(
    'assistKey',
    '辅助按键',
    function (id, item) {
        // 辅助按键
        if (item.assist === KeyCode.Ctrl) {
            this.assistKey = flipBinary(this.assistKey, 0);
        } else if (item.assist === KeyCode.Shift) {
            this.assistKey = flipBinary(this.assistKey, 1);
        } else if (item.assist === KeyCode.Alt) {
            this.assistKey = flipBinary(this.assistKey, 2);
        }
        return true;
    },
    COM.AssistKeyTool,
    EDITOR.AssistKeyTool,
    item => {
        return {
            assist: KeyCode.Ctrl,
            ...item
        };
    }
);

window.addEventListener('beforeunload', () => {
    CustomToolbar.save();
});
window.addEventListener('blur', () => {
    CustomToolbar.save();
});

Mota.require('var', 'loading').once('coreInit', () => {
    CustomToolbar.load();
    CustomToolbar.closeAll();
});
Mota.require('var', 'hook').on('reset', () => {
    CustomToolbar.showAll();
});
