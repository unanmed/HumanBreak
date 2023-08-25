import Book from '../../../ui/book.vue';
import Toolbox from '../../../ui/toolbox.vue';
import Equipbox from '../../../ui/equipbox.vue';
import Settings from '../../../ui/settings.vue';
import Desc from '../../../ui/desc.vue';
import Skill from '../../../ui/skill.vue';
import SkillTree from '../../../ui/skillTree.vue';
import Fly from '../../../ui/fly.vue';
import FixedDetail from '../../../ui/fixedDetail.vue';
import Shop from '../../../ui/shop.vue';
import Achievement from '../../../ui/achievement.vue';
import Bgm from '../../../ui/bgmList.vue';
import StatusBar from '../../../ui/statusBar.vue';
import Mark from '../../../ui/markedEnemy.vue';
import Fixed from '../../../ui/fixed.vue';
import Chapter from '../../../ui/chapter.vue';
import CompleteAchi from '../../../ui/completeAchievement.vue';
import Start from '../../../ui/start.vue';
import { GameUi, UiController } from '../custom/ui';
import { Hotkey } from '../custom/hotkey';
import { KeyCode } from '../../../plugin/keyCodes';

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
    new GameUi('book', Book, exitKey),
    new GameUi('toolbox', Toolbox, exitKey),
    new GameUi('equipbox', Equipbox, exitKey),
    new GameUi('settings', Settings, exitKey),
    new GameUi('desc', Desc, exitKey),
    new GameUi('skill', Skill, exitKey),
    new GameUi('skillTree', SkillTree, exitKey),
    new GameUi('fly', Fly, exitKey),
    new GameUi('fixedDetail', FixedDetail, exitKey),
    new GameUi('shop', Shop, exitKey),
    new GameUi('achievement', Achievement, exitKey),
    new GameUi('bgm', Bgm, exitKey),
    new GameUi('start', Start)
    // todo: 把游戏主 div 加入到 mainUi 里面
);

export const fixedUi = new UiController(true);
fixedUi.register(
    new GameUi('statusBar', StatusBar),
    new GameUi('markedEnemy', Mark),
    new GameUi('fixed', Fixed),
    new GameUi('chapter', Chapter),
    new GameUi('completeAchi', CompleteAchi)
);

mainUi.focus(mainUi.get('start'), true);
