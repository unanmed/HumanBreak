import { KeyCode, KeyCodeUtils } from '@/plugin/keyCodes';
import type {
    CustomToolbarComponent,
    CustomToolbarProps
} from '../custom/toolbar';
import BoxAnimate from '@/components/boxAnimate.vue';
import { checkAssist } from '../custom/hotkey';
import { getVitualKeyOnce } from '@/plugin/utils';
import { cloneDeep } from 'lodash-es';
import { Select, SelectOption } from 'ant-design-vue';
import { mainSetting } from '../setting';

// todo: 新增更改设置的ToolItem

interface Components {
    DefaultTool: CustomToolbarComponent;
    KeyTool: CustomToolbarComponent<'hotkey'>;
    ItemTool: CustomToolbarComponent<'item'>;
    AssistKeyTool: CustomToolbarComponent<'assistKey'>;
}

export function createToolbarComponents() {
    const com: Components = {
        DefaultTool,
        KeyTool,
        ItemTool,
        AssistKeyTool
    };
    return com;
}

export function createToolbarEditorComponents() {
    const com: Components = {
        DefaultTool: DefaultToolEditor,
        KeyTool: KeyToolEdtior,
        ItemTool: ItemToolEditor,
        AssistKeyTool: AssistKeyToolEditor
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
