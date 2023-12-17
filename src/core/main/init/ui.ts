import * as UI from '@ui/.';
import { GameUi, UiController } from '../custom/ui';
import { hook } from '../game';

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
    new GameUi('hotkey', UI.Hotkey)
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

hook.once('mounted', () => {
    const ui = document.getElementById('ui-main')!;
    const fixed = document.getElementById('ui-fixed')!;

    mainUi.on('start', () => {
        ui.style.display = 'flex';
        core.lockControl();
    });
    mainUi.on('end', () => {
        ui.style.display = 'none';
        try {
            core.closePanel();
        } catch {}
    });
    fixedUi.on('start', () => {
        fixed.style.display = 'block';
    });
    fixedUi.on('end', () => {
        fixed.style.display = 'none';
    });

    // todo: 暂时先这么搞，之后重写加载界面，需要改成先显示加载界面，加载完毕后再打开这个界面
    fixedUi.open('start');
});
