import { GameStorage } from '@motajs/legacy-system';
import { createSettingComponents } from './settings';
import { isMobile } from '../use';
import { MotaSetting } from '../setting';
import { triggerFullscreen } from '../utils';
import settingsText from '../data/settings.json';
import { fixedUi, mainUi } from './uiIns';
import { mainSetting } from './settingIns';

//#region legacy-ui

export function createUI() {
    const { hook } = Mota.require('@user/data-base');
    hook.once('mounted', () => {
        const ui = document.getElementById('ui-main')!;
        const fixed = document.getElementById('ui-fixed')!;

        const blur = mainSetting.getSetting('screen.blur');

        mainUi.on('start', () => {
            ui.style.display = 'flex';
            if (blur?.value) {
                ui.style.backdropFilter = 'blur(5px)';
                ui.style.backgroundColor = 'rgba(0,0,0,0.7333)';
            } else {
                ui.style.backdropFilter = 'none';
                ui.style.backgroundColor = 'rgba(0,0,0,0.85)';
            }
            core.lockControl();
        });
        mainUi.on('end', noClosePanel => {
            ui.style.display = 'none';
            if (!noClosePanel) {
                core.closePanel();
            }
        });
        fixedUi.on('start', () => {
            fixed.style.display = 'block';
        });
        fixedUi.on('end', () => {
            fixed.style.display = 'none';
        });
    });
}

//#endregion

//#region legacy-setting

const COM = createSettingComponents();

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
    _o: T
) {
    if (key === 'fullscreen') {
        // 全屏
        triggerFullscreen(n as boolean);
    } else if (key === 'fontSize') {
        // 字体大小
        root.style.fontSize = `${n}px`;
        const absoluteSize = (n as number) * devicePixelRatio;
        storage.setValue('@@absoluteFontSize', absoluteSize);
        storage.write();
    } else if (key === 'scale') {
        const { MAIN_HEIGHT, MAIN_WIDTH } = Mota.require(
            '@user/client-modules'
        );
        const max = Math.min(
            (window.innerHeight / MAIN_HEIGHT) * 100,
            (window.innerWidth / MAIN_WIDTH) * 100,
            n as number
        );
        const scale = Number((Math.floor((max / 100) * 4) / 4).toFixed(2));
        // @ts-expect-error 遗留问题
        core.domStyle.scale = scale;
        Mota.require('@user/client-modules').mainRenderer.setScale(scale);
    }
}

function handleAudioSetting<T extends number | boolean>(
    key: string,
    n: T,
    _o: T
) {
    const { bgmController, soundPlayer } = Mota.require('@user/client-modules');
    if (key === 'bgmEnabled') {
        bgmController.setEnabled(n as boolean);
        core.checkBgm();
    } else if (key === 'bgmVolume') {
        bgmController.setVolume((n as number) / 100);
    } else if (key === 'soundEnabled') {
        soundPlayer.setEnabled(n as boolean);
    } else if (key === 'soundVolume') {
        soundPlayer.setVolume((n as number) / 100);
    }
}

function handleUiSetting<T extends number | boolean>(key: string, n: T, _o: T) {
    if (key === 'danmaku') {
        if (n) {
            fixedUi.open('danmaku');
        } else {
            fixedUi.closeByName('danmaku');
        }
    } else if (key === 'tips') {
        if (n && core.isPlaying()) {
            fixedUi.open('tips');
        } else {
            fixedUi.closeByName('tips');
        }
    }
}

// ----- 游戏的所有设置项
mainSetting
    .register(
        'screen',
        '显示设置',
        new MotaSetting()
            .register('fullscreen', '全屏游戏', false, COM.Boolean)
            .register('scale', '画面缩放', 100, COM.Number, [50, 500, 25])
            .setDisplayFunc('scale', value => `${value}%`)
            .register('itemDetail', '宝石血瓶显伤', true, COM.Boolean)
            .register('transition', '界面动画', false, COM.Boolean)
            .register('fontSize', '字体大小', 16, COM.Number, [2, 48, 1])
            .register('criticalGem', '临界显示方式', false, COM.Boolean)
            .setDisplayFunc('criticalGem', value => (value ? '宝石数' : '攻击'))
            .register('keyScale', '虚拟键盘缩放', 100, COM.Number, [25, 5, 500])
            .register('blur', '背景虚化', !isMobile, COM.Boolean)
    )
    .register(
        'action',
        '操作设置',
        new MotaSetting()
            .register('hotkey', '快捷键', false, COM.HotkeySetting)
            .setDisplayFunc('hotkey', () => '')
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
        new MotaSetting().register('autoScale', '自动放缩', true, COM.Boolean)
    )
    .register(
        'ui',
        'ui设置',
        new MotaSetting()
            .register(
                'bookScale',
                '怪物手册缩放',
                100,
                COM.Number,
                [10, 500, 10]
            )
            .setDisplayFunc('bookScale', value => `${value}%`)
    );

interface SettingTextData {
    [x: string]: string[] | SettingTextData;
}

mainSetting
    .setDescription('audio.bgmEnabled', `是否开启背景音乐`)
    .setDescription('audio.bgmVolume', `背景音乐的音量`)
    .setDescription('audio.soundEnabled', `是否开启音效`)
    .setDescription('audio.soundVolume', `音效的音量`)
    .setDescription(
        'ui.bookScale',
        `怪物手册界面中每个怪物框体的高度缩放，最小值限定为 20% 屏幕高度`
    )
    .setDescription(
        'screen.blur',
        '打开任意ui界面时是否有背景虚化效果，移动端打开后可能会有掉帧或者发热现象。关闭ui后生效'
    );

function setFontSize() {
    const absoluteSize = storage.getValue(
        '@@absoluteFontSize',
        16 * devicePixelRatio
    );
    const size = Math.round(absoluteSize / devicePixelRatio);
    mainSetting.setValue('screen.fontSize', size);
}
setFontSize();

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

window.addEventListener('resize', () => {
    setFontSize();
});

export function createSetting() {
    const { loading } = Mota.require('@user/data-base');
    loading.once('coreInit', () => {
        mainSetting.reset({
            'screen.fullscreen': !!document.fullscreenElement,
            'screen.scale': storage.getValue('screen.scale', 100),
            'screen.itemDetail': !!storage.getValue('screen.itemDetail', true),
            'screen.transition': !!storage.getValue('screen.transition', false),
            'screen.fontSize': storage.getValue(
                'screen.fontSize',
                isMobile ? 9 : 16
            ),
            'screen.criticalGem': !!storage.getValue(
                'screen.criticalGem',
                false
            ),
            'audio.bgmEnabled': !!storage.getValue('audio.bgmEnabled', true),
            'audio.bgmVolume': storage.getValue('audio.bgmVolume', 80),
            'audio.soundEnabled': !!storage.getValue(
                'audio.soundEnabled',
                true
            ),
            'audio.soundVolume': storage.getValue('audio.soundVolume', 80),
            'utils.autoScale': !!storage.getValue('utils.autoScale', true),
            'ui.bookScale': storage.getValue(
                'ui.bookScale',
                isMobile ? 100 : 80
            )
        });
    });
}
