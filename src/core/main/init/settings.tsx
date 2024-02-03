import type { SettingComponent, SettingComponentProps } from '../setting';
import { Button, InputNumber, Radio } from 'ant-design-vue';
import { mainUi } from './ui';
import { gameKey } from './hotkey';

// todo: 数字类型改为一个输入框，一个加按钮一个减按钮；新增单选框

interface Components {
    Default: SettingComponent;
    Boolean: SettingComponent;
    Number: SettingComponent;
    HotkeySetting: SettingComponent;
    ToolbarEditor: SettingComponent;
    RadioSetting: (items: string[]) => SettingComponent;
}

export function createSettingComponents() {
    const com: Components = {
        Default: DefaultSetting,
        Boolean: BooleanSetting,
        Number: NumberSetting,
        HotkeySetting,
        ToolbarEditor,
        RadioSetting
    };
    return com;
}

function DefaultSetting(props: SettingComponentProps) {
    return (
        <div>
            <span> 未知的设置类型 </span>
        </div>
    );
}

function BooleanSetting(props: SettingComponentProps) {
    const { setting, displayer, item } = props;
    const changeValue = () => {
        setting.setValue(displayer.selectStack.join('.'), !item.value);
        displayer.update();
    };

    return (
        <div class="editor-boolean">
            <span>当前 {item.value ? '开启' : '关闭'}</span>
            <Button
                class="boolean-button"
                type="primary"
                size="large"
                onClick={changeValue}
            >
                {item.value ? '关闭' : '开启'}设置
            </Button>
        </div>
    );
}

function NumberSetting(props: SettingComponentProps) {
    const { setting, displayer, item } = props;
    const changeValue = (value: number) => {
        if (typeof value !== 'number') return;
        setting.setValue(displayer.selectStack.join('.'), value);
        displayer.update();
    };

    return (
        <div class="editor-number">
            <div class="editor-number-input">
                <span> 修改设置： </span>
                <InputNumber
                    class="number-input"
                    size="large"
                    // keyboard={true}
                    min={item.step?.[0] ?? 0}
                    max={item.step?.[1] ?? 100}
                    step={item.step?.[2] ?? 1}
                    value={item.value as number}
                    onChange={value => changeValue(value as number)}
                ></InputNumber>
            </div>
            <div class="editor-number-button">
                <Button
                    class="number-button"
                    type="primary"
                    onClick={() =>
                        changeValue(
                            (item.value as number) - (item.step?.[2] ?? 1)
                        )
                    }
                >
                    减少
                </Button>
                <Button
                    class="number-button"
                    type="primary"
                    onClick={() =>
                        changeValue(
                            (item.value as number) + (item.step?.[2] ?? 1)
                        )
                    }
                >
                    增加
                </Button>
            </div>
        </div>
    );
}

function RadioSetting(items: string[]) {
    return (props: SettingComponentProps) => {
        const { setting, displayer, item } = props;

        const changeValue = (value: number) => {
            if (isNaN(value)) return;
            setting.setValue(displayer.selectStack.join('.'), value);
            displayer.update();
        };

        return (
            <div>
                {items.map((v, i) => {
                    return (
                        <Radio
                            value={i}
                            checked={i === item.value}
                            onClick={() => changeValue(i)}
                        >
                            {v}
                        </Radio>
                    );
                })}
            </div>
        );
    };
}

function showSpecialSetting(id: string, vBind?: any) {
    const ui = mainUi.get(id);
    mainUi.showEnd();
    ui.once('close', () => {
        mainUi.showAll();
    });
    mainUi.open(id, vBind);
}

function HotkeySetting(props: SettingComponentProps) {
    return (
        <div style="display: flex; justify-content: center">
            <Button
                style="font-size: 75%"
                type="primary"
                size="large"
                onClick={() =>
                    showSpecialSetting('hotkey', {
                        hotkey: gameKey
                    })
                }
            >
                快捷键设置
            </Button>
        </div>
    );
}

function ToolbarEditor(props: SettingComponentProps) {
    return (
        <div style="display: flex; justify-content: center">
            <Button
                style="font-size: 75%"
                type="primary"
                size="large"
                onClick={() => showSpecialSetting('toolEditor')}
            >
                自定义工具栏
            </Button>
        </div>
    );
}
