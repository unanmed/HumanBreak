import type { SettingComponent, SettingComponentProps } from '../setting';
import { Button, InputNumber } from 'ant-design-vue';
import { mainUi } from './ui';
import { gameKey } from './hotkey';

interface Components {
    DefaultSetting: SettingComponent;
    BooleanSetting: SettingComponent;
    NumberSetting: SettingComponent;
    HotkeySetting: SettingComponent;
    ToolbarEditor: SettingComponent;
}

export function createSettingComponents() {
    const com: Components = {
        DefaultSetting,
        BooleanSetting,
        NumberSetting,
        HotkeySetting,
        ToolbarEditor
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
                {item.value ? '开启' : '关闭'}设置
            </Button>
        </div>
    );
}

function NumberSetting(props: SettingComponentProps) {
    const { setting, displayer, item } = props;
    const changeValue = () => {
        setting.setValue(displayer.selectStack.join('.'), !item.value);
        displayer.update();
    };

    return (
        <div class="editor-number">
            <span> 修改设置： </span>
            <InputNumber
                class="number-input"
                size="large"
                keyboard={true}
                min={item.step?.[0] ?? 0}
                max={item.step?.[1] ?? 100}
                step={item.step?.[2] ?? 1}
                value={item.value as number}
                onChange={changeValue}
            ></InputNumber>
        </div>
    );
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
