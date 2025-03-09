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
    _o: T
) {
    if (key === 'fullscreen') {
        // 全屏
        triggerFullscreen(n as boolean);
    } else if (key === 'heroDetail') {
        // 勇士显伤
        core.drawHero();
    } else if (key === 'fontSize') {
        // 字体大小
        root.style.fontSize = `${n}px`;
        const absoluteSize = (n as number) * devicePixelRatio;
        storage.setValue('@@absoluteFontSize', absoluteSize);
        storage.write();
    } else if (key === 'fontSizeStatus') {
        // fontSize.value = n as number;
    }
}

function handleActionSetting<T extends number | boolean>(
    key: string,
    n: T,
    _o: T
) {
    if (key === 'autoSkill') {
        // 自动切换技能
        const HeroSkill = Mota.require('@user/data-state').HeroSkill;
        HeroSkill.setAutoSkill(n as boolean);
        core.status.route.push(`set:autoSkill:${n}`);
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
            .register('halo', '光环显示', true, COM.Boolean)
            .register('itemDetail', '宝石血瓶显伤', true, COM.Boolean)
            .register('heroDetail', '勇士显伤', false, COM.Boolean)
            .register('transition', '界面动画', false, COM.Boolean)
            .register('fontSize', '字体大小', 16, COM.Number, [2, 48, 1])
            .register(
                'fontSizeStatus',
                '状态栏字体',
                16,
                COM.Number,
                [10, 300, 10]
            )
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
            .register(
                'bookScale',
                '怪物手册缩放',
                100,
                COM.Number,
                [10, 500, 10]
            )
            .setDisplayFunc('bookScale', value => `${value}%`)
            .register('danmaku', '显示弹幕', true, COM.Boolean)
            .register('danmakuSpeed', '弹幕速度', 60, COM.Number, [10, 1000, 5])
            .register('tips', '小贴士', true, COM.Boolean)
    );

const { loading } = Mota.require('@user/data-base');
loading.once('coreInit', () => {
    mainSetting.reset({
        'screen.fullscreen': !!document.fullscreenElement,
        'screen.halo': !!storage.getValue('screen.showHalo', true),
        'screen.itemDetail': !!storage.getValue('screen.itemDetail', true),
        'screen.heroDetail': !!storage.getValue('screen.heroDetail', false),
        'screen.transition': !!storage.getValue('screen.transition', false),
        'screen.fontSize': storage.getValue(
            'screen.fontSize',
            isMobile ? 9 : 16
        ),
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
        'ui.bookScale': storage.getValue('ui.bookScale', isMobile ? 100 : 80),
        'ui.danmaku': storage.getValue('ui.danmaku', true),
        'ui.danmakuSpeed': storage.getValue(
            'ui.danmakuSpeed',
            Math.floor(window.innerWidth / 30) * 5
        ),
        'ui.tips': storage.getValue('ui.tips', true)
    });
});

interface SettingTextData {
    [x: string]: string[] | SettingTextData;
}

mainSetting
    .setDescription('audio.bgmEnabled', `是否开启背景音乐`)
    .setDescription('audio.bgmVolume', `背景音乐的音量`)
    .setDescription('audio.soundEnabled', `是否开启音效`)
    .setDescription('audio.soundVolume', `音效的音量`)
    .setDescription('ui.mapScale', `楼传小地图的缩放，百分比格式`)
    .setDescription(
        'ui.mapLazy',
        `是否启用小地图懒更新模式，此模式下剩余怪物数量不会实时更新而变成切换地图后更新，打开小地图时出现卡顿可以尝试开启此设置`
    )
    .setDescription(
        'ui.bookScale',
        `怪物手册界面中每个怪物框体的高度缩放，最小值限定为 20% 屏幕高度`
    )
    .setDescription('ui.danmaku', '是否显示弹幕')
    .setDescription('ui.danmakuSpeed', '弹幕速度，刷新或开关弹幕显示后起效')
    .setDescription('ui.tips', `是否在游戏画面右上角常亮显示小贴士`)
    .setDescription('screen.fontSizeStatus', `修改状态栏的字体大小`)
    .setDescription(
        'screen.blur',
        '打开任意ui界面时是否有背景虚化效果，移动端打开后可能会有掉帧或者发热现象。关闭ui后生效'
    )
    .setDescription(
        'fx.portalParticle',
        '是否启用苍蓝之殿的传送门粒子特效，启用后可能对性能及设备发热有所影响'
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
