import type { SettingComponent, SettingComponentProps } from '../setting';
import { Button, InputNumber } from 'ant-design-vue';
import { mainUi } from './ui';

interface Components {
    DefaultSetting: SettingComponent;
    BooleanSetting: SettingComponent;
    NumberSetting: SettingComponent;
    HotkeySetting: SettingComponent;
    ToolbarSetting: SettingComponent;
}

export function createSettingComponents() {
    const com: Components = {
        DefaultSetting,
        BooleanSetting,
        NumberSetting,
        HotkeySetting,
        ToolbarSetting
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
        <div>
            <span>当前 {item.value ? '开启' : '关闭'}</span>
            <Button type="primary" size="large" onClick={changeValue}>
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
        <div>
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

function showSpecialSetting(id: string) {
    const ui = mainUi.get(id);
    mainUi.showEnd();
    ui.once('close', () => {
        mainUi.showAll();
    });
    mainUi.open(id);
}

function HotkeySetting(props: SettingComponentProps) {
    // todo: hotkey.vue
    return (
        <div>
            <Button
                type="primary"
                size="large"
                onClick={() => showSpecialSetting('hotkey')}
            >
                快捷键设置
            </Button>
        </div>
    );
}

function ToolbarSetting(props: SettingComponentProps) {
    // todo: toolSetting.vue
    return (
        <div>
            <Button
                type="primary"
                size="large"
                onClick={() => showSpecialSetting('toolSetting')}
            >
                自定义工具栏
            </Button>
        </div>
    );
}
