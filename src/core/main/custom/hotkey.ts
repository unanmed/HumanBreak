import { KeyCode } from '../../../plugin/keyCodes';
import { getLocFromMouseLoc } from '../../../plugin/ui/fixed';
import { deleteWith, generateBinary, has, tip } from '../../../plugin/utils';
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
    group?: string;
    func: (code: KeyCode, e: KeyboardEvent) => any;
}

interface GroupInfo {
    name: string;
    includes: string[];
}

type RegisterData = Omit<HotkeyData, 'id' | 'key' | 'name'>;

export class Hotkey extends EventEmitter<HotkeyEvent> {
    keyMap: Map<KeyCode, HotkeyData[]> = new Map();
    list: Record<string, HotkeyData> = {};
    storage: GameStorage<Record<string, KeyCode>>;
    groups: Record<string, GroupInfo> = {};

    constructor(id: string) {
        super();
        this.storage = new GameStorage(GameStorage.fromAncTe(id));
    }

    /**
     * 注册一个按键操作
     * @param data 按键信息
     */
    register(id: string, name: string, data: RegisterData) {
        const key = {
            id,
            name,
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
        return this.getData(key).map(v => {
            const assist = generateBinary([e.ctrlKey, e.altKey, e.shiftKey]);
            const need = generateBinary([!!v.ctrl, !!v.alt, !!v.shift]);
            if (assist & need) {
                v.func(key, e);
            }
        });
    }

    /**
     * 按键分组
     * @param id 组id
     * @param name 组名称
     * @param ids 组包含的内容
     */
    group(id: string, name: string, ids: string[]) {
        this.groups[id] = {
            name,
            includes: ids
        };
        ids.forEach(v => {
            const data = this.list[v];
            if (has(data.group)) {
                deleteWith(this.groups[data.group].includes, v);
            }
            data.group = id;
        });
        return this;
    }

    /**
     * 将剩余的按键组成一个组合
     * @param id 组合id
     * @param name 组合的名称
     */
    groupRest(id: string, name: string) {
        const rest = Object.values(this.list)
            .filter(v => !has(v.group))
            .map(v => v.id);

        this.group(id, name, rest);
        return this;
    }

    /**
     * 从一个按键控制器继承按键信息
     * @param hotkey 被继承的按键
     * @param cover 继承时是否覆盖同id的按键
     */
    extend(hotkey: Hotkey, cover: boolean = false) {
        Object.values(hotkey.list).forEach(v => {
            if (v.id in this.list && !cover) return;
            this.register(v.id, v.name, v);
        });
        return this;
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
    .register('book', '怪物手册', {
        defaults: KeyCode.KeyX,
        func: () => {
            core.openBook(true);
        }
    })
    .register('save', '存档界面', {
        defaults: KeyCode.KeyS,
        func: () => {
            core.save(true);
        }
    })
    .register('load', '读档界面', {
        defaults: KeyCode.KeyD,
        func: () => {
            core.load(true);
        }
    })
    .register('undo', '回退', {
        defaults: KeyCode.KeyA,
        func: () => {
            core.doSL('autoSave', 'load');
        }
    })
    .register('redo', '恢复', {
        defaults: KeyCode.KeyW,
        func: () => {
            core.doSL('autoSave', 'reload');
        }
    })
    .register('toolbox', '道具栏', {
        defaults: KeyCode.KeyT,
        func: () => {
            core.openToolbox(true);
        }
    })
    .register('equipbox', '装备栏', {
        defaults: KeyCode.KeyQ,
        func: () => {
            core.openEquipbox(true);
        }
    })
    .register('fly', '楼层传送', {
        defaults: KeyCode.KeyG,
        func: () => {
            core.useFly(true);
        }
    })
    .register('turn', '勇士转向', {
        defaults: KeyCode.KeyZ,
        func: () => {
            core.turnHero();
        }
    })
    .register('getNext', '轻按', {
        defaults: KeyCode.Space,
        func: () => {
            core.getNextItem();
        }
    })
    .register('menu', '菜单', {
        defaults: KeyCode.Escape,
        func: () => {
            core.openSettings(true);
        }
    })
    .register('replay', '录像回放', {
        defaults: KeyCode.KeyR,
        func: () => {
            core.ui._drawReplay();
        }
    })
    .register('restart', '开始菜单', {
        defaults: KeyCode.KeyN,
        func: () => {
            core.confirmRestart();
        }
    })
    .register('shop', '快捷商店', {
        defaults: KeyCode.KeyV,
        func: () => {
            core.openQuickShop(true);
        }
    })
    .register('statistics', '数据统计', {
        defaults: KeyCode.KeyB,
        func: () => {
            core.ui._drawStatistics();
        }
    })
    .register('viewMap1', '浏览地图', {
        defaults: KeyCode.PageUp,
        func: () => {
            core.ui._drawViewMaps();
        }
    })
    .register('viewMap2', '浏览地图', {
        defaults: KeyCode.PageDown,
        func: () => {
            core.ui._drawViewMaps();
        }
    })
    .register('comment', '评论区', {
        defaults: KeyCode.KeyP,
        func: () => {
            core.actions._clickGameInfo_openComments();
        }
    })
    .register('mark', '标记怪物', {
        defaults: KeyCode.KeyM,
        func: () => {
            const [x, y] = flags.mouseLoc ?? [];
            const [mx, my] = getLocFromMouseLoc(x, y);
            const blocks = core.getMapBlocksObj();
            const block = blocks[`${mx},${my}`];
            if (block.event.cls.startsWith('enemy')) {
                const id = block.event.id as EnemyIds;
                const name = core.material.enemys[id].name;
                if (ancTe.plugin.mark.hasMarkedEnemy(id)) {
                    tip('success', `已取消标记${name}！`);
                    ancTe.plugin.mark.unmarkEnemy(id);
                } else {
                    tip('success', `已标记${name}！`);
                    ancTe.plugin.mark.checkMarkedEnemy(false);
                }
            }
        }
    })
    .register('skillTree', '技能树', {
        defaults: KeyCode.KeyJ,
        func: () => {
            core.useItem('skill1', true);
        }
    })
    .register('desc', '百科全书', {
        defaults: KeyCode.KeyH,
        func: () => {
            core.useItem('I560', true);
        }
    })
    .register('special', '鼠标位置怪物属性', {
        defaults: KeyCode.KeyE,
        func: () => {
            const [x, y] = flags.mouseLoc ?? [];
            const [mx, my] = getLocFromMouseLoc(x, y);
            if (core.getBlockCls(mx, my)?.startsWith('enemy')) {
                core.plugin.fixedDetailPanel = 'special';
                ancTe.plugin.fixed.showFixed.value = false;
                ancTe.plugin.ui.fixedDetailOpened.value = true;
            }
        }
    })
    .register('critical', '鼠标位置怪物临界', {
        defaults: KeyCode.KeyC,
        func: () => {
            const [x, y] = flags.mouseLoc ?? [];
            const [mx, my] = getLocFromMouseLoc(x, y);
            if (core.getBlockCls(mx, my)?.startsWith('enemy')) {
                core.plugin.fixedDetailPanel = 'critical';
                ancTe.plugin.fixed.showFixed.value = false;
                ancTe.plugin.ui.fixedDetailOpened.value = true;
            }
        }
    })
    .group('action', '游戏操作', [
        'save',
        'load',
        'undo',
        'redo',
        'turn',
        'getNext',
        'mark'
    ])
    .group('view', '快捷查看', [
        'book',
        'toolbox',
        'equipbox',
        'fly',
        'menu',
        'replay',
        'shop',
        'statistics',
        'viewMap1',
        'viewMap2',
        'skillTree',
        'desc',
        'special',
        'critical'
    ])
    .group('system', '系统按键', ['comment'])
    .groupRest('unClassed', '未分类按键');
