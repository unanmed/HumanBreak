import { KeyCode } from '../../../plugin/keyCodes';
import { deleteWith } from '../../../plugin/utils';
import { EmitableEvent, EventEmitter } from '../../common/eventEmitter';
import { GameStorage } from '../storage';

interface HotkeyEvent extends EmitableEvent {
    emit: (key: KeyCode, e: KeyboardEvent) => void;
    keyChange: (data: HotkeyData, before: KeyCode, after: KeyCode) => void;
}

interface HotkeyData {
    id: string;
    name: string;
    defaults: KeyCode;
    key: KeyCode;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    func: (code: KeyCode, e: KeyboardEvent) => any;
}

export class Hotkey extends EventEmitter<HotkeyEvent> {
    keyMap: Map<KeyCode, HotkeyData[]> = new Map();
    list: Record<string, HotkeyData> = {};
    storage: GameStorage<Record<string, KeyCode>>;

    constructor(id: string) {
        super();
        this.storage = new GameStorage(GameStorage.fromAncTe(id));
    }

    /**
     * 注册一个按键操作
     * @param data 按键信息
     */
    register(id: string, data: Omit<HotkeyData, 'id' | 'key'>) {
        const key = {
            id,
            key: this.storage.getValue(id, data.defaults),
            ...data
        };
        this.ensureKey(key.key).push(key);
        this.list[id] = key;
        return this;
    }

    /**
     * 设置一个操作的按键
     * @param data 要设置的操作
     * @param key 按键
     */
    setKey(data: string | HotkeyData, key: KeyCode): void {
        if (typeof data === 'string') {
            data = this.list[data];
        }
        const map = this.keyMap.get(data.key)!;
        deleteWith(map, data);
        this.ensureKey(key).push(data);
        const before = data.key;
        data.key = key;
        this.emit('keyChange', data, before, key);
    }

    /**
     * 获取一个按键可以触发的所有按键操作
     * @param key 要获取的按键
     */
    getData(key: KeyCode): HotkeyData[] {
        return this.keyMap.get(key) ?? [];
    }

    /**
     * 执行一个按键操作
     * @param key 按下的按键
     */
    emitKey(key: KeyCode, e: KeyboardEvent): any[] {
        this.emit('emit', key, e);
        return this.getData(key).map(v => v.func(key, e));
    }

    private ensureKey(key: KeyCode) {
        if (!this.keyMap.has(key)) {
            this.keyMap.set(key, []);
        }
        return this.keyMap.get(key)!;
    }
}

export const hotkey = new Hotkey('gameKey');

hotkey
    .register('book', {
        name: '怪物手册',
        defaults: KeyCode.KeyX,
        func: () => {}
    })
    .register('save', {
        name: '存档界面',
        defaults: KeyCode.KeyS,
        func: () => {}
    })
    .register('load', {
        name: '读档界面',
        defaults: KeyCode.KeyD,
        func: () => {}
    })
    .register('undo1', {
        name: '撤回',
        defaults: KeyCode.KeyA,
        func: () => {}
    })
    .register('undo2', {
        name: '撤回',
        defaults: KeyCode.Digit5,
        func: () => {}
    })
    .register('redo1', {
        name: '重做',
        defaults: KeyCode.KeyW,
        func: () => {}
    })
    .register('redo2', {
        name: '重做',
        defaults: KeyCode.Digit6,
        func: () => {}
    })
    .register('toolbox', {
        name: '道具栏',
        defaults: KeyCode.KeyT,
        func: () => {}
    })
    .register('equipbox', {
        name: '装备栏',
        defaults: KeyCode.KeyQ,
        func: () => {}
    })
    .register('fly', {
        name: '楼层传送',
        defaults: KeyCode.KeyG,
        func: () => {}
    })
    .register('turn', {
        name: '勇士转向',
        defaults: KeyCode.KeyZ,
        func: () => {}
    })
    .register('getNext1', {
        name: '轻按',
        defaults: KeyCode.Space,
        func: () => {}
    })
    .register('getNext2', {
        name: '轻按',
        defaults: KeyCode.Digit7,
        func: () => {}
    })
    .register('menu', {
        name: '菜单',
        defaults: KeyCode.Escape,
        func: () => {}
    })
    .register('replay', {
        name: '录像回放',
        defaults: KeyCode.KeyR,
        func: () => {}
    })
    .register('restart', {
        name: '开始菜单',
        defaults: KeyCode.KeyN,
        func: () => {}
    })
    .register('shop', {
        name: '快捷商店',
        defaults: KeyCode.KeyV,
        func: () => {}
    })
    .register('statistics', {
        name: '数据统计',
        defaults: KeyCode.KeyB,
        func: () => {}
    })
    .register('viewMap1', {
        name: '浏览地图',
        defaults: KeyCode.PageUp,
        func: () => {}
    })
    .register('viewMap2', {
        name: '浏览地图',
        defaults: KeyCode.PageDown,
        func: () => {}
    })
    .register('comment', {
        name: '评论区',
        defaults: KeyCode.KeyP,
        func: () => {}
    })
    .register('mark', {
        name: '标记怪物',
        defaults: KeyCode.KeyM,
        func: () => {}
    })
    .register('skillTree', {
        name: '技能树',
        defaults: KeyCode.KeyJ,
        func: () => {}
    })
    .register('desc', {
        name: '百科全书',
        defaults: KeyCode.KeyH,
        func: () => {}
    })
    .register('special', {
        name: '鼠标位置怪物属性',
        defaults: KeyCode.KeyE,
        func: () => {}
    })
    .register('critical', {
        name: '鼠标位置怪物临界',
        defaults: KeyCode.KeyC,
        func: () => {}
    });
