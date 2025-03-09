import { GameUi, UiController } from '../controller';
import * as UI from '../ui';
import { VirtualKey } from '@motajs/legacy-system';

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
    // new GameUi('achievement', UI.Achievement),
    new GameUi('hotkey', UI.Hotkey),
    new GameUi('virtualKey', VirtualKey)
);
mainUi.showAll();

export const fixedUi = new UiController(true);
fixedUi.register(
    new GameUi('fixed', UI.Fixed),
    new GameUi('chapter', UI.Chapter),
    new GameUi('start', UI.Start),
    new GameUi('load', UI.Load),
    new GameUi('danmaku', UI.Danmaku),
    new GameUi('danmakuEditor', UI.DanmakuEditor),
    new GameUi('tips', UI.Tips)
);
fixedUi.showAll();
