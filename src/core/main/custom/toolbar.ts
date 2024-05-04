import { EmitableEvent, EventEmitter } from '@/core/common/eventEmitter';
import { deleteWith, has } from '@/plugin/utils';
import { Component, nextTick, reactive, shallowReactive } from 'vue';
import { fixedUi } from '../init/ui';
import { GameStorage } from '../storage';
import type {
    CustomToolbarComponent,
    MiscToolbar,
    SettableItemData,
    ToolbarItemBase,
    ToolbarItemMap,
    ToolbarItemType
} from '../init/toolbar';
import { isMobile } from '@/plugin/use';

interface CustomToolbarEvent extends EmitableEvent {
    add: (item: ValueOf<ToolbarItemMap>) => void;
    delete: (item: ValueOf<ToolbarItemMap>) => void;
    set: (id: string, data: Partial<SettableItemData>) => void;
    emit: (id: string, item: ValueOf<ToolbarItemMap>) => void;
    posChange: (bar: CustomToolbar) => void;
}

interface ToolbarSaveData {
    x: number;
    y: number;
    w: number;
    h: number;
    items: ValueOf<ToolbarItemMap>[];
}

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

type MiscEmitFn = (
    id: string,
    toolbar: CustomToolbar,
    item: MiscToolbar
) => void;
type ActivedFn = (info: MiscInfo) => boolean;

interface MiscInfo {
    id: string;
    name: string;
    emit: MiscEmitFn;
    display: Component;
    activable?: boolean;
    actived?: ActivedFn;
}

interface Misc {
    info: Record<string, MiscInfo>;

    /**
     * 注册一个杂项工具
     * @param id 杂项工具的id
     * @param name 这个工具的名称
     * @param emit 触发这个杂项工具时执行的函数
     * @param display 这个工具的显示组件
     * @param activable 是否是可以被激活的工具，例如打开小地图后显示为激活状态
     */
    register(
        this: Misc,
        id: string,
        name: string,
        emit: MiscEmitFn,
        display: Component
    ): void;

    bindActivable(id: string, activable: boolean, actived?: ActivedFn): void;

    /**
     * 刷新所有或指定的包含杂项工具的工具栏
     * @param id 指定包含这个杂项工具的工具栏刷新，例如填drag，则只会刷新包含drag杂项工具的工具栏
     */
    requestRefresh(id?: string): void;
}

const toolbarStorage = new GameStorage<Record<string, ToolbarSaveData>>(
    GameStorage.fromAuthor('AncTe', 'toolbar')
);

const misc: Misc = {
    info: {},
    register(id, name, emit, display) {
        this.info[id] = { id, name, emit, display };
    },
    bindActivable(id, activable, actived) {
        this.info[id].activable = activable;
        this.info[id].actived = actived;
    },
    requestRefresh(id) {
        if (id) {
            CustomToolbar.list.forEach(v => {
                if (
                    v.items.some(v => {
                        return v.type === 'misc' && v.items?.includes(id);
                    })
                ) {
                    v.refresh();
                }
            });
        } else {
            CustomToolbar.list.forEach(v => {
                if (v.items.some(v => v.type === 'misc')) {
                    v.refresh();
                }
            });
        }
    }
};

export class CustomToolbar extends EventEmitter<CustomToolbarEvent> {
    static num: number = 0;
    static list: CustomToolbar[] = shallowReactive([]);
    static info: Record<string, RegisteredCustomToolInfo> = {};

    static misc: Misc = misc;

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

    constructor(id: string, noshow: boolean = false) {
        super();
        this.id = id;
        // 按比例设置初始大小
        const setting = Mota.require('var', 'mainSetting');
        const scale = setting.getValue('ui.toolbarScale', 100) / 100;
        this.width *= scale;
        this.height *= scale;
        this.x *= scale;
        this.y *= scale;

        if (!noshow) this.show();
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
    refresh(reopen: boolean = false) {
        if (reopen && this.showIds.length > 0) {
            this.closeAll();
            nextTick(() => {
                this.show();
            });
        } else {
            const items = this.items.splice(0);
            nextTick(() => {
                this.items.push(...items);
            });
        }
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
     * @param multi 是否允许显示多个，不填时，如果已经存在这个工具栏，那么将不会显示
     */
    show(multi: boolean = false) {
        if (
            !multi &&
            this.showIds.some(v => fixedUi.stack.some(vv => vv.num === v))
        ) {
            return -1;
        }
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
        const setting = Mota.require('var', 'mainSetting');
        const scale = setting.getValue('ui.toolbarScale', 100) / 100;
        this.list.forEach(v => {
            const toSave: ToolbarSaveData = {
                x: v.x,
                y: v.y,
                w: v.width / scale,
                h: v.height / scale,
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

    static refreshAll(reopen: boolean = false): void {
        CustomToolbar.list.forEach(v => v.refresh(reopen));
    }

    static showAll(): number[] {
        return CustomToolbar.list.map(v => v.show());
    }

    static closeAll() {
        this.list.forEach(v => v.closeAll());
    }
}

Mota.require('var', 'loading').once('coreInit', () => {
    CustomToolbar.load();
    CustomToolbar.closeAll();

    window.addEventListener('beforeunload', e => {
        CustomToolbar.save();
    });
    window.addEventListener('blur', () => {
        CustomToolbar.save();
    });
});
Mota.require('var', 'hook').on('reset', () => {
    CustomToolbar.showAll();
});

Mota.require('var', 'hook').once('reset', () => {
    const mainStorage = GameStorage.for(GameStorage.fromGame('main'));
    mainStorage.read();
    if (mainStorage.getValue('played', false)) {
        mainStorage.setValue('played', true);
        const defaultsTool =
            CustomToolbar.list.find(v => v.id === '@defaults') ??
            new CustomToolbar('@defaults', true);
        defaultsTool.closeAll();
        defaultsTool.items = reactive([]);
        defaultsTool.add({
            id: '@defaults_misc',
            type: 'misc',
            folded: false,
            noDefaultAction: true,
            items: [
                'book',
                'fly',
                'save',
                'load',
                'undo',
                'redo',
                'danmaku',
                'minimap',
                'toolbox',
                'equipbox',
                'shop',
                'virtualKey',
                'setting'
            ]
        });
        // 计算位置
        if (isMobile) {
            // 手机端显示在最下方
            defaultsTool.setPos(25, window.innerHeight - 100);
            defaultsTool.setSize(window.innerWidth - 50, 100);
        } else {
            // 电脑显示在屏幕右方
            const x = window.innerWidth / 2 + core.domStyle.scale * 240 + 75;
            defaultsTool.setPos(x, window.innerHeight / 2 + 100);
            defaultsTool.setSize(window.innerWidth - x - 75, 200);
        }

        defaultsTool.show();
        CustomToolbar.save();
    }
});
