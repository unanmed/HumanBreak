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
import { GameUi, UiController } from '../custom/ui';
import { Hotkey } from '../custom/hotkey';
import { KeyCode } from '../../../plugin/keyCodes';

export const mainUi = new UiController();
mainUi.register(
    new GameUi('book', Book),
    new GameUi('toolbox', Toolbox),
    new GameUi('equipbox', Equipbox),
    new GameUi('settings', Settings),
    new GameUi('desc', Desc),
    new GameUi('skill', Skill),
    new GameUi('skillTree', SkillTree),
    new GameUi('fly', Fly),
    new GameUi('fixedDetail', FixedDetail),
    new GameUi('shop', Shop),
    new GameUi('achievement', Achievement),
    new GameUi('bgm', Bgm)
);

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
