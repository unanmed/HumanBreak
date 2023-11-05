import * as UI from '@ui/.';
import { GameUi, UiController } from '../custom/ui';
import { Hotkey } from '../custom/hotkey';
import { KeyCode } from '@/plugin/keyCodes';
import { hook } from '../game';

export const exitKey = new Hotkey('exitKey');
exitKey
    .register('exit1', '退出', {
        defaults: KeyCode.KeyX,
        func: () => {
            if (mainUi.focused) mainUi.splice(mainUi.focused);
        }
    })
    .register('exit2', '退出', {
        defaults: KeyCode.Escape,
        func: () => {
            if (mainUi.focused) mainUi.splice(mainUi.focused);
        }
    });

export const mainUi = new UiController();
mainUi.register(
    new GameUi('book', UI.Book, exitKey),
    new GameUi('toolbox', UI.Toolbox, exitKey),
    new GameUi('equipbox', UI.Equipbox, exitKey),
    new GameUi('settings', UI.Settings, exitKey),
    new GameUi('desc', UI.Desc, exitKey),
    new GameUi('skill', UI.Skill, exitKey),
    new GameUi('skillTree', UI.SkillTree, exitKey),
    new GameUi('fly', UI.Fly, exitKey),
    new GameUi('fixedDetail', UI.FixedDetail, exitKey),
    new GameUi('shop', UI.Shop, exitKey),
    new GameUi('achievement', UI.Achievement, exitKey),
    new GameUi('bgm', UI.BgmList, exitKey)
    // todo: 把游戏主 div 加入到 mainUi 里面
);

export const fixedUi = new UiController(true);
fixedUi.register(
    new GameUi('statusBar', UI.StatusBar),
    new GameUi('markedEnemy', UI.Marked),
    new GameUi('fixed', UI.Fixed),
    new GameUi('chapter', UI.Chapter),
    new GameUi('completeAchi', UI.CompleteAchi),
    new GameUi('start', UI.Start)
);

hook.once('mounted', () => {
    const ui = document.getElementById('ui-main')!;
    const fixed = document.getElementById('ui-fixed')!;

    mainUi.on('start', () => {
        ui.style.display = 'flex';
        core.lockControl();
    });
    mainUi.on('end', () => {
        ui.style.display = 'none';
        core.closePanel();
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
