// todo: 这个引入不加会报错，应该是循环引用导致的
import '@/plugin/utils';
import { Focus, GameUi, UiController } from './main/custom/ui';
import { GameStorage } from './main/storage';
import './main/init/';
import './main/custom/toolbar';
import { fixedUi, mainUi } from './main/init/ui';
import {
    MotaSetting,
    SettingDisplayer,
    mainSetting,
    settingStorage
} from './main/setting';
import { KeyCode } from '@motajs/client';
import '@/plugin';
import './package';
import { CustomToolbar } from './main/custom/toolbar';
import {
    Hotkey,
    checkAssist,
    isAssist,
    unwarpBinary,
    gameKey
} from './main/custom/hotkey';
import { Keyboard, generateKeyboardEvent } from './main/custom/keyboard';
import './main/layout';
import { createSettingComponents } from './main/init/settings';
import {
    createToolbarComponents,
    createToolbarEditorComponents
} from './main/init/toolbar';
import { VirtualKey } from './main/init/misc';
import { UI } from '@motajs/legacy-ui';
import Box from '@/components/box.vue';
import BoxAnimate from '@/components/boxAnimate.vue';
import Colomn from '@/components/colomn.vue';
import EnemyOne from '@/components/enemyOne.vue';
import Scroll from '@/components/scroll.vue';
import EnemyCritical from '@/panel/enemyCritical.vue';
import EnemySpecial from '@/panel/enemySpecial.vue';
import EnemyTarget from '@/panel/enemyTarget.vue';
import KeyboardPanel from '@/panel/keyboard.vue';
import { logger } from '@motajs/common';
import { Danmaku } from './main/custom/danmaku';
import * as Shadow from './fx/shadow';
import { Render } from '@motajs/client';
import { HeroKeyMover } from './main/action/move';
import * as Animation from 'mutate-animate';
import '@/module';

// ----- 类注册
Mota.register('class', 'CustomToolbar', CustomToolbar);
Mota.register('class', 'Focus', Focus);
Mota.register('class', 'GameStorage', GameStorage);
Mota.register('class', 'GameUi', GameUi);
Mota.register('class', 'Hotkey', Hotkey);
Mota.register('class', 'Keyboard', Keyboard);
Mota.register('class', 'MotaSetting', MotaSetting);
Mota.register('class', 'SettingDisplayer', SettingDisplayer);
Mota.register('class', 'UiController', UiController);
Mota.register('class', 'Danmaku', Danmaku);
// ----- 函数注册
Mota.register('fn', 'unwrapBinary', unwarpBinary);
Mota.register('fn', 'checkAssist', checkAssist);
Mota.register('fn', 'isAssist', isAssist);
Mota.register('fn', 'generateKeyboardEvent', generateKeyboardEvent);
// ----- 变量注册
Mota.register('var', 'mainUi', mainUi);
Mota.register('var', 'fixedUi', fixedUi);
Mota.register('var', 'gameKey', gameKey);
Mota.register('var', 'mainSetting', mainSetting);
Mota.register('var', 'KeyCode', KeyCode);
Mota.register('var', 'settingStorage', settingStorage);
Mota.register('var', 'status', status);
Mota.register('var', 'logger', logger);
// ----- 模块注册
Mota.register('module', 'CustomComponents', {
    createSettingComponents,
    createToolbarComponents,
    createToolbarEditorComponents
});
Mota.register('module', 'MiscComponents', {
    VirtualKey
});
Mota.register('module', 'RenderUtils', utils);
Mota.register('module', 'UI', UI);
Mota.register('module', 'UIComponents', {
    Box,
    BoxAnimate,
    Colomn,
    EnemyOne,
    Scroll,
    EnemyCritical,
    EnemySpecial,
    EnemyTarget,
    Keyboard: KeyboardPanel
});
Mota.register('module', 'Shadow', Shadow);
Mota.register('module', 'Effect', {});
Mota.register('module', 'Render', Render);
Mota.register('module', 'Action', {
    HeroKeyMover
});
Mota.register('module', 'Animation', Animation);

main.renderLoaded = true;
Mota.require('var', 'hook').emit('renderLoaded');
