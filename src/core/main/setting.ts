import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

type MotaSettingType = boolean | number | MotaSetting;

interface MotaSettingItem<T extends MotaSettingType = MotaSettingType> {
    name: string;
    value: T;
    defaults?: boolean | number;
    step?: number;
    display?: (value: T) => string;
    special?: string;
}

interface SettingEvent extends EmitableEvent {
    valueChange: <T extends boolean | number>(
        key: string,
        newValue: T,
        oldValue: T
    ) => void;
}

class MotaSetting extends EventEmitter<SettingEvent> {
    private list: Record<string, MotaSettingItem> = {};

    /**
     * 标记为特殊的设置项
     */
    markSpecial(key: string, sp: string) {
        const setting = this.getSettingBy(key.split('.'));
        setting.special = sp;
        return this;
    }

    /**
     * 注册一个数字型设置
     * @param key 设置的键名
     * @param value 设置的值
     */
    register(key: string, name: string, value: number, step?: number): this;
    /**
     * 注册一个非数字型设置
     * @param key 设置的键名
     * @param value 设置的值
     */
    register(key: string, name: string, value: boolean | MotaSetting): this;
    register(
        key: string,
        name: string,
        value: MotaSettingType,
        step: number = 1
    ) {
        const setting: MotaSettingItem = {
            name,
            value
        };
        if (!(value instanceof MotaSetting)) setting.defaults = value;
        if (typeof value === 'number') setting.step = step;
        this.list[key] = setting;
        return this;
    }

    /**
     * 获取一个设置信息
     * @param key 要获取的设置的键
     */
    getSetting(key: string): Readonly<MotaSettingItem | null> {
        const list = key.split('.');
        return this.getSettingBy(list);
    }

    /**
     * 设置一个设置的值
     * @param key 要设置的设置的键
     * @param value 要设置的值
     */
    setValue(key: string, value: boolean | number) {
        const setting = this.getSettingBy(key.split('.'));
        if (typeof setting.value !== typeof value) {
            throw new Error(
                `Setting type mismatch on setting '${key}'.` +
                    `Expected: ${typeof setting.value}. Recieve: ${typeof value}`
            );
        }
        const old = setting.value as boolean | number;
        setting.value = value;
        this.emit('valueChange', key, old, value);
    }

    /**
     * 增加一个设置的值
     * @param key 要改变的设置的值
     * @param value 值的增量
     */
    addValue(key: string, value: number) {
        const setting = this.getSettingBy(key.split('.'));
        if (typeof setting.value !== 'number') {
            throw new Error(
                `Cannot execute addValue method on a non-number setting.` +
                    `Type expected: number. See: ${typeof setting.value}`
            );
        }
        const old = setting.value as boolean | number;
        setting.value += value;
        this.emit('valueChange', key, old, value);
    }

    /**
     * 设置一个设置的值显示函数
     * @param key 要设置的设置的键
     * @param func 显示函数
     */
    setDisplayFunc(key: string, func: (value: MotaSettingType) => string) {
        const setting = this.getSettingBy(key.split('.'));
        setting.display = func;
    }

    private getSettingBy(list: string[]) {
        let now: MotaSetting = this;

        for (let i = 0; i < list.length - 1; i++) {
            const item = now.list[list[i]];
            if (!(item instanceof MotaSetting)) {
                throw new Error(
                    `Cannot get setting. The parent isn't a MotaSetting instance.` +
                        `Key: '${list.join('.')}'. Reading: '${list[i]}'`
                );
            }
            now = item;
        }

        return now.list[list.at(-1)!] ?? null;
    }
}

export const mainSetting = new MotaSetting();

// ----- 游戏的所有设置项
mainSetting
    .register(
        'screen',
        '显示设置',
        new MotaSetting()
            .register('fullscreen', '全屏游戏', false)
            .register('halo', '光环显示', true)
            .register('frag', '打怪特效', true)
            .register('itemDetail', '宝石血瓶显伤', true)
            .register('transition', '界面动画', false)
            .register('antiAlias', '抗锯齿', false)
            .register('autoScale', '自动放缩', true)
            .register('fontSize', '字体大小', 16, 1)
    )
    .register(
        'action',
        '操作设置',
        new MotaSetting()
            .register('autoSkill', '自动切换技能', true)
            .register('fixed', '定点查看', true)
            .register('hotkey', '快捷键', false)
            .markSpecial('hotkey', 'hotkey')
    )
    .register(
        'utils',
        '功能设置',
        new MotaSetting().register('betterLoad', '优化加载', true)
    );
