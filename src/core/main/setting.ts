import { FunctionalComponent, reactive } from 'vue';
import { EventEmitter } from '../common/eventEmitter';
import { GameStorage } from './storage';
import { has, triggerFullscreen } from '@/plugin/utils';
import { createSettingComponents } from './init/settings';
import { bgm } from '../audio/bgm';
import { SoundEffect } from '../audio/sound';
import settingsText from '@/data/settings.json';
import { isMobile } from '@/plugin/use';
import { fontSize } from '@/plugin/ui/statusBar';
import { CustomToolbar } from './custom/toolbar';
import { fixedUi } from './init/ui';

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

const COM = createSettingComponents();

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
        com: SettingComponent = COM.Default,
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
        if (!has(setting) && !has(defaultValue)) return void 0;
        if (setting instanceof MotaSetting) {
            if (has(setting)) return defaultValue;
            return void 0;
        } else {
            return has(setting) ? (setting.value as T) : (defaultValue as T);
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

export const mainSetting = new MotaSetting();
// 添加不参与全局存储的设置
MotaSetting.noStorage.push('action.autoSkill', 'screen.fullscreen');

const storage = new GameStorage(GameStorage.fromAuthor('AncTe', 'setting'));

export { storage as settingStorage };

// ----- 监听设置修改
mainSetting.on('valueChange', (key, n, o) => {
    if (!MotaSetting.noStorage.includes(key)) {
        storage.setValue(key, n);
    }

    const [root, setting] = key.split('.');

    if (root === 'screen') {
        handleScreenSetting(setting, n, o);
    } else if (root === 'action') {
        handleActionSetting(setting, n, o);
    } else if (root === 'audio') {
        handleAudioSetting(setting, n, o);
    } else if (root === 'ui') {
        handleUiSetting(setting, n, o);
    }
});

const root = document.getElementById('root') as HTMLDivElement;

function handleScreenSetting<T extends number | boolean>(
    key: string,
    n: T,
    o: T
) {
    if (key === 'fullscreen') {
        // 全屏
        triggerFullscreen(n as boolean);
    } else if (key === 'heroDetail') {
        // 勇士显伤
        core.drawHero();
    } else if (key === 'antiAlias') {
        // 抗锯齿
        for (const canvas of core.dom.gameCanvas) {
            if (core.domStyle.hdCanvas.includes(canvas.id)) continue;
            if (n) {
                canvas.classList.remove('no-anti-aliasing');
            } else {
                canvas.classList.add('no-anti-aliasing');
            }
        }
    } else if (key === 'fontSize') {
        // 字体大小
        root.style.fontSize = `${n}px`;
        const absoluteSize = (n as number) * devicePixelRatio;
        storage.setValue('@@absoluteFontSize', absoluteSize);
        storage.write();
    } else if (key === 'fontSizeStatus') {
        fontSize.value = n as number;
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
}

function handleAudioSetting<T extends number | boolean>(
    key: string,
    n: T,
    o: T
) {
    if (key === 'bgmEnabled') {
        bgm.disable = !n;
        if (core.isPlaying()) core.checkBgm();
    } else if (key === 'bgmVolume') {
        bgm.volume = (n as number) / 100;
    } else if (key === 'soundEnabled') {
        SoundEffect.disable = !n;
    } else if (key === 'soundVolume') {
        SoundEffect.volume = (n as number) / 100;
    }
}

function handleUiSetting<T extends number | boolean>(key: string, n: T, o: T) {
    if (key === 'toolbarScale') {
        const scale = (n as number) / (o as number);
        CustomToolbar.list.forEach(v => {
            v.setSize(v.width * scale, v.height * scale);
        });
        CustomToolbar.refreshAll(true);
    } else if (key === 'danmaku') {
        if (n) {
            fixedUi.open('danmaku');
        } else {
            fixedUi.closeByName('danmaku');
        }
    }
}

// ----- 游戏的所有设置项
// todo: 虚拟键盘缩放，小地图楼传缩放
mainSetting
    .register(
        'screen',
        '显示设置',
        new MotaSetting()
            .register('fullscreen', '全屏游戏', false, COM.Boolean)
            .register('halo', '光环显示', true, COM.Boolean)
            .register('itemDetail', '宝石血瓶显伤', true, COM.Boolean)
            .register('heroDetail', '勇士显伤', false, COM.Boolean)
            .register('transition', '界面动画', false, COM.Boolean)
            .register('antiAlias', '抗锯齿', false, COM.Boolean)
            .register('fontSize', '字体大小', 16, COM.Number, [2, 48, 1])
            .register('fontSizeStatus', '状态栏字体', 16, COM.Number, [2, 48, 1])
            .register('smoothView', '平滑镜头', true, COM.Boolean)
            .register('criticalGem', '临界显示方式', false, COM.Boolean)
            .setDisplayFunc('criticalGem', value => (value ? '宝石数' : '攻击'))
            .register('keyScale', '虚拟键盘缩放', 100, COM.Number, [25, 5, 500])
            .register('blur', '背景虚化', !isMobile, COM.Boolean)
    )
    .register(
        'action',
        '操作设置',
        new MotaSetting()
            .register('autoSkill', '自动切换技能', true, COM.Boolean)
            .register('fixed', '定点查看', true, COM.Boolean)
            .register('hotkey', '快捷键', false, COM.HotkeySetting)
            .setDisplayFunc('hotkey', () => '')
            .register('toolbar', '自定义工具栏', false, COM.ToolbarEditor)
            .setDisplayFunc('toolbar', () => '')
    )
    .register(
        'audio',
        '音频设置',
        new MotaSetting()
            .register('bgmEnabled', '开启音乐', true, COM.Boolean)
            .register('bgmVolume', '音乐音量', 80, COM.Number, [0, 100, 5])
            .register('soundEnabled', '开启音效', true, COM.Boolean)
            .register('soundVolume', '音效音量', 80, COM.Number, [0, 100, 5])
    )
    .register(
        'utils',
        '系统设置',
        new MotaSetting()
            .register('betterLoad', '优化加载', true, COM.Boolean)
            .register('autoScale', '自动放缩', true, COM.Boolean)
    )
    .register(
        'fx',
        '特效设置',
        new MotaSetting()
            .register('paraLight', '野外阴影', true, COM.Boolean)
            .register('frag', '打怪特效', true, COM.Boolean)
            .register('portalParticle', '传送门特效', true, COM.Boolean)
    )
    .register(
        'ui',
        'ui设置',
        new MotaSetting()
            .register('mapScale', '小地图缩放', 100, COM.Number, [50, 1000, 50])
            .setDisplayFunc('mapScale', value => `${value}%`)
            .register('mapLazy', '小地图懒更新', false, COM.Boolean)
            .register('toolbarScale', '工具栏缩放', 100, COM.Number, [10, 500, 10])
            .setDisplayFunc('toolbarScale', value => `${value}%`)
            .register('bookScale', '怪物手册缩放', 100, COM.Number, [10, 500, 10])
            .setDisplayFunc('bookScale', value => `${value}%`)
            .register('danmaku', '显示弹幕', true, COM.Boolean)
            .register('danmakuSpeed', '弹幕速度', 60, COM.Number, [10, 1000, 5])
    );

const loading = Mota.require('var', 'loading');
loading.once('coreInit', () => {
    mainSetting.reset({
        'screen.fullscreen': !!document.fullscreenElement,
        'screen.halo': !!storage.getValue('screen.showHalo', true),
        'screen.itemDetail': !!storage.getValue('screen.itemDetail', true),
        'screen.heroDetail': !!storage.getValue('screen.heroDetail', false),
        'screen.transition': !!storage.getValue('screen.transition', false),
        'screen.antiAlias': !!storage.getValue('screen.antiAlias', false),
        'screen.fontSize': storage.getValue('screen.fontSize', isMobile ? 9 : 16),
        'screen.smoothView': !!storage.getValue('screen.smoothView', true),
        'screen.criticalGem': !!storage.getValue('screen.criticalGem', false),
        'screen.fontSizeStatus': storage.getValue('screen.fontSizeStatus', 100),
        'action.fixed': !!storage.getValue('action.fixed', true),
        'audio.bgmEnabled': !!storage.getValue('audio.bgmEnabled', true),
        'audio.bgmVolume': storage.getValue('audio.bgmVolume', 80),
        'audio.soundEnabled': !!storage.getValue('audio.soundEnabled', true),
        'audio.soundVolume': storage.getValue('audio.soundVolume', 80),
        'utils.betterLoad': !!storage.getValue('utils.betterLoad', true),
        'utils.autoScale': !!storage.getValue('utils.autoScale', true),
        'fx.paraLight': !!storage.getValue('fx.paraLight', true),
        'fx.frag': !!storage.getValue('fx.frag', true),
        'fx.portalParticle': !!storage.getValue('fx.portalParticle', true),
        'ui.mapScale': storage.getValue(
            'ui.mapScale',
            isMobile ? 300 : Math.floor(window.innerWidth / 600) * 50
        ),
        'ui.mapLazy': storage.getValue('ui.mapLazy', false),
        'ui.toolbarScale': storage.getValue(
            'ui.toolbarScale',
            isMobile ? 50 : Math.floor((window.innerWidth / 1700) * 10) * 10
        ),
        'ui.bookScale': storage.getValue('ui.bookScale', isMobile ? 100 : 80),
        'ui.danmaku': storage.getValue('ui.danmaku', true),
        'ui.danmakuSpeed': storage.getValue(
            'ui.danmakuSpeed', 
            Math.floor(window.innerWidth / 30) * 5
        ),
    });
});

const { hook } = Mota.requireAll('var');
hook.on('reset', () => {
    mainSetting.reset({
        'action.autoSkill': flags.autoSkill ?? true
    });
});

interface SettingTextData {
    [x: string]: string[] | SettingTextData;
}

function getSettingText(obj: SettingTextData, key?: string) {
    for (const [k, value] of Object.entries(obj)) {
        const setKey = key ? key + '.' + k : k;
        if (value instanceof Array) {
            mainSetting.setDescription(setKey, value.join('\n'));
        } else {
            getSettingText(value, setKey);
        }
    }
}
getSettingText(settingsText);

mainSetting
    .setDescription('audio.bgmEnabled', `是否开启背景音乐`)
    .setDescription('audio.bgmVolume', `背景音乐的音量`)
    .setDescription('audio.soundEnabled', `是否开启音效`)
    .setDescription('audio.soundVolume', `音效的音量`)
    .setDescription('ui.mapScale', `楼传小地图的缩放，百分比格式`)
    .setDescription('ui.mapLazy', `是否启用小地图懒更新模式，此模式下剩余怪物数量不会实时更新而变成切换地图后更新，打开小地图时出现卡顿可以尝试开启此设置`)
    .setDescription('ui.toolbarScale', `自定义工具栏的缩放比例`)
    .setDescription('ui.bookScale', `怪物手册界面中每个怪物框体的高度缩放，最小值限定为 20% 屏幕高度`)
    .setDescription('ui.danmaku', '是否显示弹幕')
    .setDescription('ui.danmakuSpeed', '弹幕速度，刷新或开关弹幕显示后起效')
    .setDescription('screen.fontSizeStatus', `修改状态栏的字体大小`)
    .setDescription('screen.blur', '打开任意ui界面时是否有背景虚化效果，移动端打开后可能会有掉帧或者发热现象。关闭ui后生效')
    .setDescription('fx.portalParticle', '是否启用苍蓝之殿的传送门粒子特效，启用后可能对性能及设备发热有所影响');

function setFontSize() {
    const absoluteSize = storage.getValue(
        '@@absoluteFontSize',
        16 * devicePixelRatio
    );
    const size = Math.round(absoluteSize / devicePixelRatio);
    mainSetting.setValue('screen.fontSize', size);
}
setFontSize();

window.addEventListener('resize', () => {
    setFontSize();
});