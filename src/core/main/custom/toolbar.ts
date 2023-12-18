import { EmitableEvent, EventEmitter } from '@/core/common/eventEmitter';
import { KeyCode } from '@/plugin/keyCodes';
import { flipBinary, has } from '@/plugin/utils';
import { FunctionalComponent, nextTick, reactive } from 'vue';
import { createToolbarComponents } from '../init/toolbar';
import { gameKey } from '../init/hotkey';
import { unwarpBinary } from './hotkey';
import { fixedUi } from '../init/ui';
import { hook } from '../game';

interface CustomToolbarEvent extends EmitableEvent {
    add: (item: ValueOf<ToolbarItemMap>) => void;
    delete: (item: ValueOf<ToolbarItemMap>) => void;
    set: (id: string, data: Partial<SettableItemData>) => void;
    emit: (id: string) => void;
}

interface ToolbarItemBase<T extends ToolbarItemType> {
    type: T;
    id: string;
    com: CustomToolbarComponent<T>;
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

type ToolbarItemType = keyof ToolbarItemMap;

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

const COM = createToolbarComponents();

const comMap: {
    [P in ToolbarItemType]: CustomToolbarComponent<P>;
} = {
    hotkey: COM.KeyTool,
    item: COM.ItemTool,
    assistKey: COM.AssistKeyTool
};

export class CustomToolbar extends EventEmitter<CustomToolbarEvent> {
    static num: number = 0;
    static list: CustomToolbar[] = [];

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
    add<K extends ToolbarItemType>(item: Omit<ToolbarItemMap[K], 'com'>) {
        // @ts-ignore
        const data: ToolbarItemMap[K] = {
            com: comMap[item.type],
            ...item
        } as ToolbarItemMap[K];
        this.items.push(data);
        this.emit('add', data);
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
        this.emit(id);
        if (item.type === 'hotkey') {
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
        } else if (item.type === 'item') {
            // 道具
            core.tryUseItem(item.item);
        } else if (item.type === 'assistKey') {
            // 辅助按键
            if (item.assist === KeyCode.Ctrl) {
                this.assistKey = flipBinary(this.assistKey, 0);
            } else if (item.assist === KeyCode.Shift) {
                this.assistKey = flipBinary(this.assistKey, 1);
            } else if (item.assist === KeyCode.Alt) {
                this.assistKey = flipBinary(this.assistKey, 2);
            }
        }
        return this;
    }

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
    }

    setSize(width?: number, height?: number) {
        has(width) && (this.width = width);
        has(height) && (this.height = height);
    }

    show() {
        fixedUi.open('toolbar', { bar: this });
    }

    static get(id: string) {
        return this.list.find(v => v.id === id);
    }
}

hook.once('reset', () => {
    const toolbar = new CustomToolbar('test');
    toolbar
        .add<'hotkey'>({
            id: 'test1',
            type: 'hotkey',
            assist: 0,
            key: KeyCode.KeyX
        })
        .add<'assistKey'>({
            id: 'test2',
            type: 'assistKey',
            assist: KeyCode.Ctrl
        })
        .add<'item'>({
            id: 'test3',
            type: 'item',
            item: 'book'
        });
});
