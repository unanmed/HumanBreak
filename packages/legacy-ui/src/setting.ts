import { FunctionalComponent, reactive } from 'vue';
import { EventEmitter } from '@motajs/legacy-common';
import { isNil } from 'lodash-es';

export interface SettingComponentProps {
    item: MotaSettingItem;
    setting: MotaSetting;
    displayer: SettingDisplayer;
}

export type SettingComponent = FunctionalComponent<SettingComponentProps>;
type MotaSettingType = boolean | number | MotaSetting;

export interface MotaSettingItem<T extends MotaSettingType = MotaSettingType> {
    name: string;
    key: string;
    value: T;
    controller: SettingComponent;
    description?: string;
    defaults?: boolean | number;
    step?: [number, number, number];
    display?: (value: T) => string;
}

interface SettingEvent {
    valueChange: <T extends boolean | number>(
        key: string,
        newValue: T,
        oldValue: T
    ) => void;
}

export type SettingText = {
    [key: string]: string[] | SettingText;
};

export interface SettingDisplayInfo {
    item: MotaSettingItem | null;
    list: Record<string, MotaSettingItem>;
    text: string[];
}

export class MotaSetting extends EventEmitter<SettingEvent> {
    static noStorage: string[] = [];

    readonly list: Record<string, MotaSettingItem> = {};

    /**
     * 重设设置
     * @param setting 设置信息
     */
    reset(setting: Record<string, boolean | number>) {
        for (const [key, value] of Object.entries(setting)) {
            this.setValue(key, value);
        }
    }

    /**
     * 注册一个数字型设置
     * @param key 设置的键名
     * @param value 设置的值
     */
    register(
        key: string,
        name: string,
        value: number,
        com?: SettingComponent,
        step?: [number, number, number]
    ): this;
    /**
     * 注册一个非数字型设置
     * @param key 设置的键名
     * @param value 设置的值
     */
    register(
        key: string,
        name: string,
        value: boolean | MotaSetting,
        com?: SettingComponent
    ): this;
    register(
        key: string,
        name: string,
        value: MotaSettingType,
        com: SettingComponent,
        step: [number, number, number] = [0, 100, 1]
    ) {
        const setting: MotaSettingItem = {
            name,
            value,
            key,
            controller: com
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

        this.emit('valueChange', key, value, old);
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
     * 获取一个设置的值，如果获取到的是一个MotaSetting实例，那么返回undefined
     * @param key 要获取的设置
     */
    getValue(key: string): boolean | number | undefined;
    /**
     * 获取一个设置的值，如果获取到的是一个MotaSetting实例，那么返回defaultValue
     * @param key 要获取的设置
     * @param defaultValue 设置的默认值
     */
    getValue<T extends boolean | number>(key: string, defaultValue: T): T;
    getValue<T extends boolean | number>(
        key: string,
        defaultValue?: T
    ): T | undefined {
        const setting = this.getSetting(key);
        if (isNil(setting) && isNil(defaultValue)) return void 0;
        if (setting instanceof MotaSetting) {
            if (!isNil(setting)) return defaultValue;
            return void 0;
        } else {
            return !isNil(setting) ? (setting.value as T) : (defaultValue as T);
        }
    }

    /**
     * 设置一个设置的值显示函数
     * @param key 要设置的设置的键
     * @param func 显示函数
     */
    setDisplayFunc(key: string, func: (value: MotaSettingType) => string) {
        const setting = this.getSettingBy(key.split('.'));
        setting.display = func;
        return this;
    }

    /**
     * 设置一个设置的修改部分组件
     * @param key 要设置的设置的键
     * @param com 设置修改部分的组件
     */
    setValueController(key: string, com: SettingComponent) {
        const setting = this.getSettingBy(key.split('.'));
        setting.controller = com;
        return this;
    }

    /**
     * 设置一个设置的说明
     * @param key 要设置的设置的id
     * @param desc 设置的说明
     */
    setDescription(key: string, desc: string) {
        const setting = this.getSettingBy(key.split('.'));
        setting.description = desc;
        return this;
    }

    private getSettingBy(list: string[]) {
        let now: MotaSetting = this;

        for (let i = 0; i < list.length - 1; i++) {
            const item = now.list[list[i]].value;
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

interface SettingDisplayerEvent {
    update: (stack: string[], display: SettingDisplayInfo[]) => void;
}

export class SettingDisplayer extends EventEmitter<SettingDisplayerEvent> {
    setting: MotaSetting;
    /** 选项选中栈 */
    selectStack: string[] = [];
    displayInfo: SettingDisplayInfo[] = reactive([]);

    constructor(setting: MotaSetting) {
        super();
        this.setting = setting;
        this.update();
    }

    /**
     * 添加选择项
     * @param key 下一个选择项
     */
    add(key: string) {
        this.selectStack.push(...key.split('.'));
        this.update();
    }

    /**
     * 剪切后面的选择项
     * @param index 从哪开始剪切
     */
    cut(index: number, noUpdate: boolean = false) {
        this.selectStack.splice(index, Infinity);
        if (!noUpdate) this.update();
    }

    update() {
        const list = this.selectStack;
        let now = this.setting;
        this.displayInfo = [];

        for (let i = 0; i < list.length - 1; i++) {
            const item = now.list[list[i]].value;
            if (!(item instanceof MotaSetting)) {
                throw new Error(
                    `Cannot get setting. The parent isn't a MotaSetting instance.` +
                        `Key: '${list.join('.')}'. Reading: '${list[i + 1]}'`
                );
            }

            this.displayInfo.push({
                item: now.list[list[i]],
                text: [],
                list: now.list
            });

            now = item;
        }

        const last = now.list[list.at(-1)!];
        if (last) {
            const desc = last.description;
            const text = desc ? desc.split('\n') : ['请选择设置'];

            this.displayInfo.push({
                item: last,
                text,
                list: now.list
            });
            if (last.value instanceof MotaSetting) {
                this.displayInfo.push({
                    item: null,
                    text: ['请选择设置'],
                    list: (last.value as MotaSetting).list
                });
            }
        } else {
            this.displayInfo.push({
                item: null,
                text: ['请选择设置'],
                list: this.setting.list
            });
        }
        this.emit('update', this.selectStack, this.displayInfo);
    }
}
