import { KeyCode } from '@/plugin/keyCodes';
import { getLocFromMouseLoc } from '@/plugin/ui/fixed';
import { deleteWith, generateBinary, has, spliceBy, tip } from '@/plugin/utils';
import { EmitableEvent, EventEmitter } from '../../common/eventEmitter';
import { GameStorage } from '../storage';

interface HotkeyEvent extends EmitableEvent {}

interface AssistHoykey {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
}

interface RegisterHotkeyData extends Partial<AssistHoykey> {
    id: string;
    name: string;
    defaults: KeyCode;
}

interface HotkeyData extends Required<RegisterHotkeyData> {
    key: KeyCode;
    func: Map<symbol, HotkeyFunc>;
}

type HotkeyFunc = (code: KeyCode, ev: KeyboardEvent) => void;

export class Hotkey extends EventEmitter<HotkeyEvent> {
    static list: Hotkey[];

    id: string;
    name: string;
    data: Record<string, HotkeyData> = {};
    keyMap: Map<KeyCode, HotkeyData[]> = new Map();

    private scope: symbol = Symbol();
    private scopeStack: symbol[] = [];

    constructor(id: string, name: string) {
        super();
        this.id = id;
        this.name = name;
    }

    /**
     * 注册一个按键
     * @param data 要注册的按键信息
     */
    register(data: RegisterHotkeyData) {
        const d: HotkeyData = {
            ...data,
            ctrl: !!data.ctrl,
            shift: !!data.shift,
            alt: !!data.alt,
            key: data.defaults,
            func: new Map()
        };
        this.ensureMap(d.key);
        this.data[d.id] = d;
        const arr = this.keyMap.get(d.key)!;
        arr.push(d);
    }

    /**
     * 实现一个按键按下时的操作
     * @param id 要实现的按键id
     * @param func 按键按下时执行的函数
     */
    realize(id: string, func: HotkeyFunc) {
        const key = this.data[id];
        if (!key.func.has(this.scope)) {
            throw new Error(
                `Cannot access using scope. Call use before calling realize.`
            );
        }
        key.func.set(this.scope, func);
    }

    /**
     * 使用一个symbol作为当前作用域，之后调用{@link realize}所实现的按键功能将会添加至此作用域
     * @param symbol 当前作用域的symbol
     */
    use(symbol: symbol) {
        spliceBy(this.scopeStack, symbol);
        this.scopeStack.push(symbol);
        this.scope = symbol;
        for (const key of Object.values(this.data)) {
            key.func.set(symbol, () => {});
        }
    }

    /**
     * 释放一个作用域，释放后作用域将退回至删除的作用域的上一级
     * @param symbol 要释放的作用域的symbol
     */
    dispose(symbol: symbol) {
        for (const key of Object.values(this.data)) {
            key.func.delete(symbol);
        }
        spliceBy(this.scopeStack, symbol);
        this.scope = this.scopeStack.pop() ?? Symbol();
    }

    /**
     * 设置一个按键信息
     * @param id 要设置的按键的id
     * @param key 要设置成的按键
     * @param assist 辅助按键，三位二进制数据，从低到高依次为`ctrl` `shift` `alt`
     */
    set(id: string, key: KeyCode, assist: number) {
        const { ctrl, shift, alt } = this.unwarpBinary(assist);
        const data = this.data[id];
        const before = this.keyMap.get(data.key)!;
        deleteWith(before, data);
        this.ensureMap(key);
        const after = this.keyMap.get(key)!;
        after.push(data);
        data.key = key;
        data.ctrl = ctrl;
        data.shift = shift;
        data.alt = alt;
    }

    /**
     * 触发一个按键
     * @param key 要触发的按键
     * @param assist 辅助按键，三位二进制数据，从低到高依次为`ctrl` `shift` `alt`
     */
    emitKey(key: KeyCode, assist: number, ev: KeyboardEvent) {
        const toEmit = this.keyMap.get(key);
        if (!toEmit) return;
        const { ctrl, shift, alt } = this.unwarpBinary(assist);
        toEmit.forEach(v => {
            if (ctrl === v.ctrl && shift === v.shift && alt === v.alt) {
                const func = v.func.get(this.scope);
                if (!func) {
                    throw new Error(`Emit unknown scope keys.`);
                }
                func(key, ev);
            }
        });
    }

    private unwarpBinary(bin: number): AssistHoykey {
        return {
            ctrl: !!(bin & (1 << 0)),
            shift: !!(bin & (1 << 1)),
            alt: !!(bin & (1 << 2))
        };
    }

    private ensureMap(key: KeyCode) {
        if (!this.keyMap.has(key)) {
            this.keyMap.set(key, []);
        }
    }

    /**
     * 根据id获取hotkey实例
     * @param id 要获取的hotkey实例的id
     */
    static get(id: string) {
        return this.list.find(v => v.id === id);
    }
}

// export const hotkey = new Hotkey('gameKey');

// hotkey
//     .register('book', '怪物手册', {
//         defaults: KeyCode.KeyX,
//         func: () => {
//             core.openBook(true);
//         }
//     })
//     .register('save', '存档界面', {
//         defaults: KeyCode.KeyS,
//         func: () => {
//             core.save(true);
//         }
//     })
//     .register('load', '读档界面', {
//         defaults: KeyCode.KeyD,
//         func: () => {
//             core.load(true);
//         }
//     })
//     .register('undo', '回退', {
//         defaults: KeyCode.KeyA,
//         func: () => {
//             core.doSL('autoSave', 'load');
//         }
//     })
//     .register('redo', '恢复', {
//         defaults: KeyCode.KeyW,
//         func: () => {
//             core.doSL('autoSave', 'reload');
//         }
//     })
//     .register('toolbox', '道具栏', {
//         defaults: KeyCode.KeyT,
//         func: () => {
//             core.openToolbox(true);
//         }
//     })
//     .register('equipbox', '装备栏', {
//         defaults: KeyCode.KeyQ,
//         func: () => {
//             core.openEquipbox(true);
//         }
//     })
//     .register('fly', '楼层传送', {
//         defaults: KeyCode.KeyG,
//         func: () => {
//             core.useFly(true);
//         }
//     })
//     .register('turn', '勇士转向', {
//         defaults: KeyCode.KeyZ,
//         func: () => {
//             core.turnHero();
//         }
//     })
//     .register('getNext', '轻按', {
//         defaults: KeyCode.Space,
//         func: () => {
//             core.getNextItem();
//         }
//     })
//     .register('menu', '菜单', {
//         defaults: KeyCode.Escape,
//         func: () => {
//             core.openSettings(true);
//         }
//     })
//     .register('replay', '录像回放', {
//         defaults: KeyCode.KeyR,
//         func: () => {
//             core.ui._drawReplay();
//         }
//     })
//     .register('restart', '开始菜单', {
//         defaults: KeyCode.KeyN,
//         func: () => {
//             core.confirmRestart();
//         }
//     })
//     .register('shop', '快捷商店', {
//         defaults: KeyCode.KeyV,
//         func: () => {
//             core.openQuickShop(true);
//         }
//     })
//     .register('statistics', '数据统计', {
//         defaults: KeyCode.KeyB,
//         func: () => {
//             core.ui._drawStatistics();
//         }
//     })
//     .register('viewMap1', '浏览地图', {
//         defaults: KeyCode.PageUp,
//         func: () => {
//             core.ui._drawViewMaps();
//         }
//     })
//     .register('viewMap2', '浏览地图', {
//         defaults: KeyCode.PageDown,
//         func: () => {
//             core.ui._drawViewMaps();
//         }
//     })
//     .register('comment', '评论区', {
//         defaults: KeyCode.KeyP,
//         func: () => {
//             core.actions._clickGameInfo_openComments();
//         }
//     })
//     .register('mark', '标记怪物', {
//         defaults: KeyCode.KeyM,
//         func: () => {
//             // todo: refactor
//             const [x, y] = flags.mouseLoc ?? [];
//             const [mx, my] = getLocFromMouseLoc(x, y);
//         }
//     })
//     .register('skillTree', '技能树', {
//         defaults: KeyCode.KeyJ,
//         func: () => {
//             core.useItem('skill1', true);
//         }
//     })
//     .register('desc', '百科全书', {
//         defaults: KeyCode.KeyH,
//         func: () => {
//             core.useItem('I560', true);
//         }
//     })
//     .register('special', '鼠标位置怪物属性', {
//         defaults: KeyCode.KeyE,
//         func: () => {
//             const [x, y] = flags.mouseLoc ?? [];
//             const [mx, my] = getLocFromMouseLoc(x, y);
//             if (core.getBlockCls(mx, my)?.startsWith('enemy')) {
//                 // mota.plugin.fixed.showFixed.value = false;
//                 mota.ui.main.open('fixedDetail', {
//                     panel: 'special'
//                 });
//             }
//         }
//     })
//     .register('critical', '鼠标位置怪物临界', {
//         defaults: KeyCode.KeyC,
//         func: () => {
//             const [x, y] = flags.mouseLoc ?? [];
//             const [mx, my] = getLocFromMouseLoc(x, y);
//             if (core.getBlockCls(mx, my)?.startsWith('enemy')) {
//                 // mota.plugin.fixed.showFixed.value = false;
//                 mota.ui.main.open('fixedDetail', {
//                     panel: 'critical'
//                 });
//             }
//         }
//     })
//     .group('action', '游戏操作', [
//         'save',
//         'load',
//         'undo',
//         'redo',
//         'turn',
//         'getNext',
//         'mark'
//     ])
//     .group('view', '快捷查看', [
//         'book',
//         'toolbox',
//         'equipbox',
//         'fly',
//         'menu',
//         'replay',
//         'shop',
//         'statistics',
//         'viewMap1',
//         'viewMap2',
//         'skillTree',
//         'desc',
//         'special',
//         'critical'
//     ])
//     .group('system', '系统按键', ['comment'])
//     .groupRest('unClassed', '未分类按键');
