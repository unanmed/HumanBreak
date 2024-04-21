import { KeyCode, KeyCodeUtils } from '@/plugin/keyCodes';
import type {
    CustomToolbarComponent,
    CustomToolbarProps
} from '../custom/toolbar';
import BoxAnimate from '@/components/boxAnimate.vue';
import { checkAssist } from '../custom/hotkey';
import { getVitualKeyOnce } from '@/plugin/utils';
import { cloneDeep } from 'lodash-es';
import {
    Button,
    InputNumber,
    Select,
    SelectOption,
    Switch
} from 'ant-design-vue';
import { mainSetting } from '../setting';
import Minimap from '@/components/minimap.vue';

// todo: 新增更改设置的ToolItem

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
    return (
        <span class="button-text" onClick={() => toolbar.emitTool(item.id)}>
            {KeyCodeUtils.toString(item.key)}
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
