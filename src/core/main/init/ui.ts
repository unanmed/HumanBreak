import * as UI from '@ui/.';
import * as MiscUI from './misc';
import { GameUi, UiController } from '../custom/ui';
import { mainSetting } from '../setting';

export const mainUi = new UiController();
mainUi.register(
    new GameUi('book', UI.Book),
    new GameUi('toolbox', UI.Toolbox),
    new GameUi('equipbox', UI.Equipbox),
    new GameUi('settings', UI.Settings),
    new GameUi('desc', UI.Desc),
    new GameUi('skill', UI.Skill),
    new GameUi('skillTree', UI.SkillTree),
    new GameUi('fly', UI.Fly),
    new GameUi('fixedDetail', UI.FixedDetail),
    new GameUi('shop', UI.Shop),
    new GameUi('achievement', UI.Achievement),
    new GameUi('bgm', UI.BgmList),
    new GameUi('hotkey', UI.Hotkey),
    new GameUi('toolEditor', UI.ToolEditor),
    new GameUi('virtualKey', MiscUI.VirtualKey)
    // todo: 把游戏主 div 加入到 mainUi 里面
);
mainUi.showAll();

export const fixedUi = new UiController(true);
fixedUi.register(
    new GameUi('statusBar', UI.StatusBar),
    new GameUi('markedEnemy', UI.Marked),
    new GameUi('fixed', UI.Fixed),
    new GameUi('chapter', UI.Chapter),
    new GameUi('completeAchi', UI.CompleteAchi),
    new GameUi('start', UI.Start),
    new GameUi('toolbar', UI.Toolbar)
);
fixedUi.showAll();

let loaded = false;
let mounted = false;

const hook = Mota.require('var', 'hook');
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
            try {
                core.closePanel();
            } catch {}
        }
    });
    fixedUi.on('start', () => {
        fixed.style.display = 'block';
    });
    fixedUi.on('end', () => {
        fixed.style.display = 'none';
    });

    if (loaded && !mounted) {
        fixedUi.open('start');
    }
    mounted = true;
});
hook.once('load', () => {
    if (mounted) {
        // todo: 暂时先这么搞，之后重写加载界面，需要改成先显示加载界面，加载完毕后再打开这个界面
        fixedUi.open('start');
    }
    loaded = true;
});
