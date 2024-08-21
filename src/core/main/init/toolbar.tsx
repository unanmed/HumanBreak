import { KeyCode, KeyCodeUtils } from '@/plugin/keyCodes';
import { CustomToolbar } from '../custom/toolbar';
import BoxAnimate from '@/components/boxAnimate.vue';
import { checkAssist, unwarpBinary } from '../custom/hotkey';
import {
    flipBinary,
    getVitualKeyOnce,
    openDanmakuPoster
} from '@/plugin/utils';
import { cloneDeep } from 'lodash-es';
import {
    Button,
    InputNumber,
    Select,
    SelectOption,
    Switch
} from 'ant-design-vue';
import { MotaSettingItem, mainSetting } from '../setting';
import Minimap from '@/components/minimap.vue';
import { gameKey } from '../custom/hotkey';
import { FunctionalComponent, StyleValue, h } from 'vue';
import { mainUi } from './ui';
import { isMobile } from '@/plugin/use';
import {
    BackwardOutlined,
    EllipsisOutlined,
    FolderOpenOutlined,
    LayoutOutlined,
    MessageOutlined,
    RetweetOutlined,
    RollbackOutlined,
    SwapOutlined
} from '@ant-design/icons-vue';
import { generateKeyboardEvent } from '../custom/keyboard';

// todo: 新增更改设置的ToolItem

export interface ToolbarItemBase<T extends ToolbarItemType> {
    type: T;
    id: string;
    noDefaultAction?: boolean;
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

// 小地图
interface MinimapToolbar extends ToolbarItemBase<'minimap'> {
    action: boolean;
    scale: number;
    noBorder: boolean;
    showInfo: boolean;
    autoLocate: boolean;
    width: number;
    height: number;
}

// 杂项工具栏
export interface MiscToolbar extends ToolbarItemBase<'misc'> {
    folded: boolean;
    items: string[];
}

export interface ToolbarItemMap {
    hotkey: HotkeyToolbarItem;
    item: ItemToolbarItem;
    assistKey: AssistKeyToolbarItem;
    minimap: MinimapToolbar;
    misc: MiscToolbar;
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

interface Components {
    DefaultTool: CustomToolbarComponent;
    KeyTool: CustomToolbarComponent<'hotkey'>;
    ItemTool: CustomToolbarComponent<'item'>;
    AssistKeyTool: CustomToolbarComponent<'assistKey'>;
    MinimapTool: CustomToolbarComponent<'minimap'>;
}

export function createToolbarComponents() {
    const com: Components = {
        DefaultTool,
        KeyTool,
        ItemTool,
        AssistKeyTool,
        MinimapTool
    };
    return com;
}

export function createToolbarEditorComponents() {
    const com: Components = {
        DefaultTool: DefaultToolEditor,
        KeyTool: KeyToolEdtior,
        ItemTool: ItemToolEditor,
        AssistKeyTool: AssistKeyToolEditor,
        MinimapTool: MinimapToolEditor
    };
    return com;
}

function DefaultTool(props: CustomToolbarProps) {
    return <span>未知工具</span>;
}

function KeyTool(props: CustomToolbarProps<'hotkey'>) {
    const { item, toolbar } = props;

    const unwarpAssist = (assist: number) => {
        let res = '';
        if (assist & (1 << 0)) {
            res += 'Ctrl + ';
        }
        if (assist & (1 << 1)) {
            res += 'Shift + ';
        }
        if (assist & (1 << 2)) {
            res += 'Alt + ';
        }
        return res;
    };

    const getKeyShow = (key: KeyCode, assist: number) => {
        return unwarpAssist(assist) + KeyCodeUtils.toString(key);
    };

    return (
        <span
            class="button-text"
            style="padding: 0 5px"
            onClick={() => toolbar.emitTool(item.id)}
        >
            {getKeyShow(item.key, item.assist)}
        </span>
    );
}

function ItemTool(props: CustomToolbarProps<'item'>) {
    const { item, toolbar } = props;
    const scale = mainSetting.getValue('ui.toolbarScale', 100) / 100;
    return (
        <div
            style={`display: flex; justify-content: center; width: ${
                50 * scale
            }px`}
            onClick={() => toolbar.emitTool(item.id)}
        >
            <BoxAnimate
                noborder={true}
                width={50 * scale}
                height={50 * scale}
                id={item.item}
            ></BoxAnimate>
        </div>
    );
}

function AssistKeyTool(props: CustomToolbarProps<'assistKey'>) {
    const { item, toolbar } = props;
    const pressed = checkAssist(toolbar.assistKey, item.assist);

    return (
        <span
            class="button-text"
            // @ts-ignore
            active={pressed}
            onClick={() => toolbar.emitTool(item.id).refresh()}
        >
            {KeyCodeUtils.toString(item.assist)}
        </span>
    );
}

function MinimapTool(props: CustomToolbarProps<'minimap'>) {
    const { item, toolbar } = props;

    return (
        <div style={{ width: `${item.width}px`, height: `${item.height}px` }}>
            <Minimap
                action={item.action}
                scale={item.scale}
                noBorder={item.noBorder}
                showInfo={item.showInfo}
                autoLocate={item.autoLocate}
                width={item.width}
                height={item.height}
            ></Minimap>
        </div>
    );
}

function MiscTool(props: CustomToolbarProps<'misc'>) {
    const { item, toolbar } = props;
    const scale = mainSetting.getValue('ui.toolbarScale', 100) / 100;

    const triggerFold = () => {
        item.folded = !item.folded;
        toolbar.refresh();
    };

    const unfoldStyle = `
        min-width: ${50 * scale}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${18 * scale}px;
    `;
    const toolStyle = `
        display: flex;
        align-items: center;
        min-width: ${40 * scale}px;
        height: ${40 * scale}px;
        border: 1px solid #ddd;
        margin: ${5 * scale}px ${5 * scale}px ${5 * scale}px 0;
        justify-content: center;
    `;
    const toolActivedStyle = `
        display: flex;
        align-items: center;
        min-width: ${40 * scale}px;
        height: ${40 * scale}px;
        border: 1px solid #ddd;
        margin: ${5 * scale}px ${5 * scale}px ${5 * scale}px 0;
        justify-content: center;
        color: aqua;
    `;
    const containerStyle = `
        display: flex;
        align-items: center;
        padding: 0 ${5 * scale}px;
        flex-wrap: wrap;
    `;

    return (
        <div style="display: flex; align-items: center; justify-content: left">
            {item.folded ? (
                <div
                    class="button-text"
                    onClick={triggerFold}
                    style={unfoldStyle}
                >
                    <EllipsisOutlined />
                </div>
            ) : (
                <div style={containerStyle}>
                    <span
                        class="button-text"
                        onClick={triggerFold}
                        style={toolStyle}
                    >
                        <FolderOpenOutlined></FolderOpenOutlined>
                    </span>
                    {item.items.map(v => {
                        const info = CustomToolbar.misc.info[v];
                        const { actived } = info;
                        const style = actived?.(info)
                            ? toolActivedStyle
                            : toolStyle;
                        if (!info) return <span></span>;
                        else
                            return (
                                <div
                                    class="button-text"
                                    style={style}
                                    onClick={() => info.emit(v, toolbar, item)}
                                >
                                    {info.display}
                                </div>
                            );
                    })}
                </div>
            )}
        </div>
    );
}

function DefaultToolEditor(props: CustomToolbarProps) {
    return <span></span>;
}

function KeyToolEdtior(props: CustomToolbarProps<'hotkey'>) {
    const { item, toolbar } = props;

    const getKey = async () => {
        const { key, assist } = await getVitualKeyOnce(false, item.assist);
        toolbar.set<'hotkey'>(item.id, {
            key,
            assist
        });
    };

    const unwarpAssist = (assist: number) => {
        let res = '';
        if (assist & (1 << 0)) {
            res += 'Ctrl + ';
        }
        if (assist & (1 << 1)) {
            res += 'Shift + ';
        }
        if (assist & (1 << 2)) {
            res += 'Alt + ';
        }
        return res;
    };

    const getKeyShow = (key: KeyCode, assist: number) => {
        return unwarpAssist(assist) + KeyCodeUtils.toString(key);
    };

    return (
        <div
            style="
                display: flex; flex-direction: row; justify-content: space-between;
                align-items: center; padding: 0 5%; margin: 1%
            "
        >
            <span>触发按键</span>
            <span
                style="background-color: #000; width: 50%; text-align: end; padding: 0 5%"
                onClick={getKey}
            >
                {getKeyShow(item.key, item.assist)}
            </span>
        </div>
    );
}

function ItemToolEditor(props: CustomToolbarProps<'item'>) {
    const { item, toolbar } = props;

    const items = cloneDeep(core.status.hero.items.constants);
    Object.assign(items, core.status.hero.items.tools);

    return (
        <div
            style="
                display: flex; flex-direction: row; justify-content: space-between;
                align-items: center; padding: 0 5%; margin: 1%
            "
        >
            <span>使用道具</span>
            <Select
                style="width: 180px; font-size: 80%; height: 100%; background-color: #000"
                value={item.item}
                onChange={value =>
                    toolbar.set<'item'>(item.id, {
                        item: value as ItemIdOf<'tools' | 'constants'>
                    })
                }
            >
                {Object.entries(items).map(v => {
                    return (
                        <SelectOption value={v[0]}>
                            {
                                core.material.items[v[0] as AllIdsOf<'items'>]
                                    .name
                            }
                        </SelectOption>
                    );
                })}
            </Select>
        </div>
    );
}

function AssistKeyToolEditor(props: CustomToolbarProps<'assistKey'>) {
    const { item, toolbar } = props;

    return (
        <div
            style="
               display: flex; flex-direction: row; justify-content: space-between;
               align-items: center; padding: 0 5%; margin: 1%
            "
        >
            <span>辅助按键</span>
            <Select
                style="width: 180px; font-size: 80%; height: 100%; background-color: #000"
                value={item.assist}
                onChange={value =>
                    toolbar.set<'assistKey'>(item.id, {
                        assist: value as KeyCode.Ctrl
                    })
                }
            >
                <SelectOption value={KeyCode.Ctrl}>Ctrl</SelectOption>
                <SelectOption value={KeyCode.Shift}>Shift</SelectOption>
                <SelectOption value={KeyCode.Alt}>Alt</SelectOption>
            </Select>
        </div>
    );
}

function MinimapToolEditor(props: CustomToolbarProps<'minimap'>) {
    const { item, toolbar } = props;

    type K = keyof typeof item;
    const setConfig: <T extends K>(key: T, value: (typeof item)[T]) => void = (
        key,
        value
    ) => {
        let v = value;
        if (key === 'height' || key === 'height') {
            if ((v as number) > 1000) (v as number) = 1000;
            if ((v as number) < 50) (v as number) = 50;
        } else if (key === 'scale') {
            if ((v as number) > 20) (v as number) = 20;
            if ((v as number) < 1) (v as number) = 1;
        }
        toolbar.set(item.id, { [key]: v });
        toolbar.refresh();
    };

    return (
        <div
            style="
                display: flex; flex-direction: column;
                align-items: center; padding: 0 5%; margin: 1%
            "
        >
            <div class="toolbar-editor-item">
                <span>宽度</span>
                <div style="width: 70%; display: flex; justify-content: end">
                    <InputNumber
                        class="number-input"
                        size="large"
                        // keyboard={true}
                        min={50}
                        max={1000}
                        step={50}
                        value={item.width}
                        onChange={value => setConfig('width', value as number)}
                    ></InputNumber>
                    <Button
                        style="margin-left: 5%"
                        class="number-button"
                        type="primary"
                        onClick={() => setConfig('width', item.width - 50)}
                    >
                        减少
                    </Button>
                    <Button
                        style="margin-left: 5%"
                        class="number-button"
                        type="primary"
                        onClick={() => setConfig('width', item.width + 50)}
                    >
                        增加
                    </Button>
                </div>
            </div>
            <div class="toolbar-editor-item">
                <span>高度</span>
                <div style="width: 70%; display: flex; justify-content: end">
                    <InputNumber
                        class="number-input"
                        size="large"
                        // keyboard={true}
                        min={50}
                        max={1000}
                        step={50}
                        value={item.height}
                        onChange={value => setConfig('height', value as number)}
                    ></InputNumber>
                    <Button
                        style="margin-left: 5%"
                        class="number-button"
                        type="primary"
                        onClick={() => setConfig('height', item.height - 50)}
                    >
                        减少
                    </Button>
                    <Button
                        style="margin-left: 5%"
                        class="number-button"
                        type="primary"
                        onClick={() => setConfig('height', item.height + 50)}
                    >
                        增加
                    </Button>
                </div>
            </div>
            <div class="toolbar-editor-item">
                <span>放缩比例</span>
                <div style="width: 70%; display: flex; justify-content: end">
                    <InputNumber
                        class="number-input"
                        size="large"
                        // keyboard={true}
                        min={1}
                        max={20}
                        step={1}
                        value={item.scale}
                        onChange={value => setConfig('scale', value as number)}
                    ></InputNumber>
                    <Button
                        style="margin-left: 5%"
                        class="number-button"
                        type="primary"
                        onClick={() => setConfig('scale', item.scale - 1)}
                    >
                        减少
                    </Button>
                    <Button
                        style="margin-left: 5%"
                        class="number-button"
                        type="primary"
                        onClick={() => setConfig('scale', item.scale + 1)}
                    >
                        增加
                    </Button>
                </div>
            </div>
            <div class="toolbar-editor-item">
                <span>无边框模式</span>
                <Switch
                    checked={item.noBorder}
                    onClick={() => setConfig('noBorder', !item.noBorder)}
                ></Switch>
            </div>
            <div class="toolbar-editor-item">
                <span>显示漏怪</span>
                <Switch
                    checked={item.showInfo}
                    onClick={() => setConfig('showInfo', !item.showInfo)}
                ></Switch>
            </div>
            <div class="toolbar-editor-item">
                <span>自动居中</span>
                <Switch
                    checked={item.autoLocate}
                    onClick={() => setConfig('autoLocate', !item.autoLocate)}
                ></Switch>
            </div>
            <div class="toolbar-editor-item">
                <span>允许交互</span>
                <Switch
                    checked={item.action}
                    onClick={() => setConfig('action', !item.action)}
                ></Switch>
            </div>
        </div>
    );
}

function MiscToolEditor(props: CustomToolbarProps<'misc'>) {
    const { item, toolbar } = props;

    const misc = CustomToolbar.misc.info;
    const values = Object.values(misc);

    const divStyle = `
        display: flex; 
        flex-direction: row; 
        justify-content: space-between;
        align-items: center; 
        padding: 5px 5%; 
        margin: 1%;
        width: 100%;
        border-bottom: 1px solid #888;
    `;
    const addStyle = `
        display: flex; 
        flex-direction: row; 
        justify-content: center;
        align-items: center; 
        padding: 0 5%; 
        margin: 1%;
        width: 100%;
    `;
    const containerStyle = `
        display: flex;
        flex-direction: column;
    `;

    return (
        <div style={containerStyle}>
            {item.items.map((v, i) => {
                return (
                    <div style={divStyle}>
                        <span>第{i + 1}个工具</span>
                        <Select
                            style="width: 180px; font-size: 80%; height: 100%; background-color: #000"
                            value={v}
                            onChange={value =>
                                (item.items[i] = value as string)
                            }
                        >
                            {values.map(v => {
                                return (
                                    <SelectOption value={v.id}>
                                        {v.name}
                                    </SelectOption>
                                );
                            })}
                        </Select>
                    </div>
                );
            })}
            <div style={addStyle}>
                <Button
                    type="primary"
                    onClick={() => item.items.push('danmaku')}
                >
                    新增杂项工具
                </Button>
            </div>
        </div>
    );
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
    KeyTool,
    KeyToolEdtior,
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
    ItemTool,
    ItemToolEditor,
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
    AssistKeyTool,
    AssistKeyToolEditor,
    item => {
        return {
            assist: KeyCode.Ctrl,
            ...item
        };
    }
);
CustomToolbar.register(
    'minimap',
    '小地图',
    function (id, item) {
        return true;
    },
    MinimapTool,
    MinimapToolEditor,
    item => {
        return {
            action: false,
            scale: 5,
            width: 300,
            height: 300,
            noBorder: false,
            showInfo: false,
            autoLocate: true,
            ...item,
            noDefaultAction: true
        };
    }
);
CustomToolbar.register(
    'misc',
    '杂项',
    function (id, item) {
        return true;
    },
    MiscTool,
    MiscToolEditor,
    item => {
        return {
            items: [],
            folded: true,
            ...item,
            noDefaultAction: true
        };
    }
);

// 杂项注册
Mota.require('var', 'hook').once('reset', () => {
    // 小地图是否显示
    let minimapTool = CustomToolbar.list.some(v => v.id === '@misc/minimap');
    mainUi.on('close', () => {
        let before = minimapTool;
        minimapTool = CustomToolbar.list.some(v => v.id === '@misc/minimap');
        if (before !== minimapTool) {
            CustomToolbar.misc.requestRefresh('minimap');
        }
    });
    const scale = mainSetting.getSetting('ui.toolbarScale') as Readonly<
        MotaSettingItem<number>
    >;

    CustomToolbar.misc.register(
        'danmaku',
        '发弹幕',
        openDanmakuPoster,
        h(MessageOutlined)
    );
    CustomToolbar.misc.register(
        'book',
        '怪物手册',
        () => {
            core.useItem('book', true);
        },
        <img
            src={core.statusBar.icons.book.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'fly',
        '楼层飞行器',
        () => {
            core.useItem('fly', true);
        },
        <img
            src={core.statusBar.icons.fly.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'toolbox',
        '道具栏',
        () => {
            mainUi.open('toolbox');
        },
        <img
            src={core.statusBar.icons.toolbox.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'equipbox',
        '装备栏',
        () => {
            mainUi.open('equipbox');
        },
        <img
            src={core.statusBar.icons.equipbox.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'virtualKey',
        '虚拟键盘',
        () => {
            getVitualKeyOnce().then(value => {
                gameKey.emitKey(
                    value.key,
                    value.assist,
                    'up',
                    generateKeyboardEvent(value.key, value.assist)
                );
            });
        },
        <img
            src={core.statusBar.icons.keyboard.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'shop',
        '快捷商店',
        () => {
            core.openQuickShop(true);
        },
        <img
            src={core.statusBar.icons.shop.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'save',
        '存档',
        () => {
            core.save(true);
        },
        <img
            src={core.statusBar.icons.save.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'load',
        '读档',
        () => {
            core.load(true);
        },
        <img
            src={core.statusBar.icons.load.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'undo',
        '回退（自动存档）',
        () => {
            core.doSL('autoSave', 'load');
        },
        h(RollbackOutlined)
    );
    CustomToolbar.misc.register(
        'redo',
        '恢复（撤销自动存档）',
        () => {
            core.doSL('autoSave', 'reload');
        },
        h(RetweetOutlined)
    );
    CustomToolbar.misc.register(
        'setting',
        '系统设置',
        () => {
            core.openSettings(true);
        },
        <img
            src={core.statusBar.icons.settings.src}
            style={{
                'object-fit': 'contain',
                width: `${(scale.value / 100) * 32}px`
            }}
        ></img>
    );
    CustomToolbar.misc.register(
        'minimap',
        '小地图',
        (id, tool) => {
            const index = CustomToolbar.list.findIndex(
                v => v.id === '@misc/minimap'
            );
            minimapTool = index !== -1;
            if (minimapTool) {
                const tool = CustomToolbar.list[index];
                tool.closeAll();
                CustomToolbar.list.splice(index, 1);
                minimapTool = false;
            } else {
                const tool = new CustomToolbar('@misc/minimap', true);
                const info = CustomToolbar.info['minimap'].onCreate({
                    id: `minimap`,
                    type: 'minimap'
                }) as MinimapToolbar;
                info.noBorder = true;
                info.action = true;
                info.showInfo = true;
                if (!isMobile) {
                    tool.x = window.innerWidth - 420;
                    tool.y = 100;
                    tool.width = 320;
                    tool.height = 320;
                } else {
                    info.width = 150;
                    info.height = 150;
                    tool.x = window.innerWidth - 220;
                    tool.y = 50;
                    tool.width = 170;
                    tool.height = 170;
                }

                tool.add(info);
                tool.show();
                minimapTool = true;
            }
            tool.refresh();
        },
        h(LayoutOutlined)
    );
    // CustomToolbar.misc.register(
    //     'drag',
    //     '地图拖动',
    //     () => {
    //         // todo
    //     },
    //     h('span', '拖动地图')
    // );

    CustomToolbar.misc.bindActivable('minimap', true, () => minimapTool);
});
