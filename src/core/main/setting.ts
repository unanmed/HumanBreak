import { reactive } from 'vue';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import { transition } from '../../plugin/uiController';
import { loading } from '../loader/load';
import { hook } from './game';
import { isMobile } from '../../plugin/use';

type MotaSettingType = boolean | number | MotaSetting;

export interface MotaSettingItem<T extends MotaSettingType = MotaSettingType> {
    name: string;
    key: string;
    value: T;
    defaults?: boolean | number;
    step?: [number, number, number];
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

export type SettingText = {
    [key: string]: string[] | SettingText;
};

export interface SettingDisplayInfo {
    item: MotaSettingItem | null;
    list: Record<string, MotaSettingItem>;
    text: string[];
}

export class MotaSetting extends EventEmitter<SettingEvent> {
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
    register(
        key: string,
        name: string,
        value: number,
        step?: [number, number, number]
    ): this;
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
        step: [number, number, number] = [0, 100, 1]
    ) {
        const setting: MotaSettingItem = {
            name,
            value,
            key
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
     * 设置一个设置的值显示函数
     * @param key 要设置的设置的键
     * @param func 显示函数
     */
    setDisplayFunc(key: string, func: (value: MotaSettingType) => string) {
        const setting = this.getSettingBy(key.split('.'));
        setting.display = func;
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

interface SettingDisplayerEvent extends EmitableEvent {
    update: (stack: string[], display: SettingDisplayInfo[]) => void;
}

export class SettingDisplayer extends EventEmitter<SettingDisplayerEvent> {
    setting: MotaSetting;
    textInfo: SettingText;
    /** 选项选中栈 */
    selectStack: string[] = [];
    displayInfo: SettingDisplayInfo[] = reactive([]);

    constructor(setting: MotaSetting, textInfo: SettingText) {
        super();
        this.setting = setting;
        this.textInfo = textInfo;
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
        let nowText: string[] | SettingText = this.textInfo;
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
            if (nowText && !(nowText instanceof Array))
                nowText = nowText[list[i]];
        }
        if (nowText && !(nowText instanceof Array))
            nowText = nowText[list.at(-1)!];

        const last = now.list[list.at(-1)!];
        if (last) {
            this.displayInfo.push({
                item: last,
                text: nowText instanceof Array ? nowText : ['请选择设置'],
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

export const mainSetting = new MotaSetting();

// ----- 监听设置修改
mainSetting.on('valueChange', (key, n, o) => {
    const [root, setting] = key.split('.');
    if (root === 'screen') {
        handleScreenSetting(setting, n, o);
    } else if (root === 'action') {
        handleActionSetting(setting, n, o);
    } else if (root === 'utils') {
        handleUtilsSetting(setting, n, o);
    }
});

export async function triggerFullscreen(full: boolean) {
    const { maxGameScale } = core.plugin.utils;
    if (!!document.fullscreenElement && !full) {
        await document.exitFullscreen();
        requestAnimationFrame(() => {
            maxGameScale(1);
        });
    }
    if (full && !document.fullscreenElement) {
        await document.body.requestFullscreen();
        requestAnimationFrame(() => {
            maxGameScale();
        });
    }
}

const root = document.getElementById('root') as HTMLDivElement;
const root2 = document.getElementById('root2') as HTMLDivElement;

function handleScreenSetting<T extends number | boolean>(
    key: string,
    n: T,
    o: T
) {
    if (key === 'fullscreen') {
        // 全屏
        triggerFullscreen(n as boolean);
    } else if (key === 'halo') {
        // 光环
        core.setLocalStorage('showHalo', n);
    } else if (key === 'frag') {
        // 打怪特效
        core.setLocalStorage('frag', n);
    } else if (key === 'itemDetail') {
        // 宝石血瓶显伤
        core.setLocalStorage('itemDetail', n);
    } else if (key === 'transition') {
        // 界面动画
        core.setLocalStorage('transition', n);
        transition.value = n as boolean;
    } else if (key === 'antiAlias') {
        // 抗锯齿
        core.setLocalStorage('antiAlias', n);
        for (const canvas of core.dom.gameCanvas) {
            if (core.domStyle.hdCanvas.includes(canvas.id)) continue;
            if (n) {
                canvas.classList.remove('no-anti-aliasing');
            } else {
                canvas.classList.add('no-anti-aliasing');
            }
        }
    } else if (key === 'autoScale') {
        // 自动放缩
        core.setLocalStorage('autoScale', n);
    } else if (key === 'fontSize') {
        // 字体大小
        core.setLocalStorage('fontSize', n);
        root.style.fontSize = root2.style.fontSize = `${n}px`;
    } else if (key === 'smoothView') {
        core.setLocalStorage('smoothView', n);
    }
}

function handleActionSetting<T extends number | boolean>(
    key: string,
    n: T,
    o: T
) {
    if (key === 'autoSkill') {
        // 自动切换技能
        flags.autoSkill = n;
    }

    if (key === 'fixed') {
        // 定点查看
        core.setLocalStorage('fixed', n);
    }
}

function handleUtilsSetting<T extends number | boolean>(
    key: string,
    n: T,
    o: T
) {
    if (key === 'betterLoad') {
        // 加载优化
        core.setLocalStorage('betterLoad', n);
    }
}

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
            .register('fontSize', '字体大小', 16, [8, 28, 1])
            .register('smoothView', '平滑镜头', true)
    )
    .register(
        'action',
        '操作设置',
        new MotaSetting()
            .register('autoSkill', '自动切换技能', true)
            .register('fixed', '定点查看', true)
            .register('hotkey', '快捷键', false)
            .markSpecial('hotkey', 'hotkey')
            .setDisplayFunc('hotkey', () => '')
    )
    .register(
        'utils',
        '功能设置',
        new MotaSetting().register('betterLoad', '优化加载', true)
    );

loading.once('coreInit', () => {
    mainSetting.reset({
        'screen.fullscreen': false,
        'screen.halo': !!core.getLocalStorage('showHalo', true),
        'screen.frag': !!core.getLocalStorage('frag', true),
        'screen.itemDetail': !!core.getLocalStorage('itemDetail', true),
        'screen.transition': !!core.getLocalStorage('transition', false),
        'screen.antiAlias': !!core.getLocalStorage('antiAlias', false),
        'screen.autoScale': !!core.getLocalStorage('autoScale', true),
        'screen.fontSize': core.getLocalStorage('fontSize', 16),
        'screen.smoothView': !!core.getLocalStorage('smoothView', true),
        'action.fixed': !!core.getLocalStorage('fixed', true),
        'utils.betterLoad': !!core.getLocalStorage('betterLoad', true)
    });
});

hook.once('reset', () => {
    mainSetting.reset({
        'action.autoSkill': flags.autoSkill ?? true
    });
});
