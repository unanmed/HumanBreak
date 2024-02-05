import { BgmController, bgm } from './audio/bgm';
import { SoundController, SoundEffect, sound } from './audio/sound';
import { Focus, GameUi, UiController } from './main/custom/ui';
import { GameStorage } from './main/storage';
import './main/init/';
import './main/custom/toolbar';
import { fixedUi, mainUi } from './main/init/ui';
import { gameKey } from './main/init/hotkey';
import {
    MotaSetting,
    SettingDisplayer,
    mainSetting,
    settingStorage
} from './main/setting';
import { KeyCode, ScanCode } from '@/plugin/keyCodes';
import { status } from '@/plugin/ui/statusBar';
import './plugin';
import './package';
import { AudioPlayer } from './audio/audio';
import { CustomToolbar } from './main/custom/toolbar';
import {
    Hotkey,
    checkAssist,
    isAssist,
    unwarpBinary
} from './main/custom/hotkey';
import { Keyboard, generateKeyboardEvent } from './main/custom/keyboard';
import './main/layout';
import { MComponent, icon, m } from './main/layout';
import { createSettingComponents } from './main/init/settings';
import {
    createToolbarComponents,
    createToolbarEditorComponents
} from './main/init/toolbar';
import { VirtualKey } from './main/init/misc';
import * as utils from '@/plugin/utils';
import * as use from '@/plugin/use';
import * as mark from '@/plugin/mark';
import * as keyCodes from '@/plugin/keyCodes';
import { addAnimate, removeAnimate } from '@/plugin/animateController';
import * as bookTools from '@/plugin/ui/book';
import * as commonTools from '@/plugin/ui/common';
import * as equipboxTools from '@/plugin/ui/equipbox';
import * as fixedTools from '@/plugin/ui/fixed';
import * as flyTools from '@/plugin/ui/fly';
import * as statusBarTools from '@/plugin/ui/statusBar';
import * as toolboxTools from '@/plugin/ui/toolbox';

// ----- 类注册
Mota.register('class', 'AudioPlayer', AudioPlayer);
Mota.register('class', 'BgmController', BgmController);
Mota.register('class', 'CustomToolbar', CustomToolbar);
Mota.register('class', 'Focus', Focus);
Mota.register('class', 'GameStorage', GameStorage);
Mota.register('class', 'GameUi', GameUi);
Mota.register('class', 'Hotkey', Hotkey);
Mota.register('class', 'Keyboard', Keyboard);
Mota.register('class', 'MotaSetting', MotaSetting);
Mota.register('class', 'SettingDisplayer', SettingDisplayer);
Mota.register('class', 'SoundController', SoundController);
Mota.register('class', 'SoundEffect', SoundEffect);
Mota.register('class', 'UiController', UiController);
Mota.register('class', 'MComponent', MComponent);
// ----- 函数注册
Mota.register('fn', 'm', m);
Mota.register('fn', 'icon', icon);
Mota.register('fn', 'unwrapBinary', unwarpBinary);
Mota.register('fn', 'checkAssist', checkAssist);
Mota.register('fn', 'isAssist', isAssist);
Mota.register('fn', 'generateKeyboardEvent', generateKeyboardEvent);
Mota.register('fn', 'addAnimate', addAnimate);
Mota.register('fn', 'removeAnimate', removeAnimate);
// ----- 变量注册
Mota.register('var', 'mainUi', mainUi);
Mota.register('var', 'fixedUi', fixedUi);
Mota.register('var', 'bgm', bgm);
Mota.register('var', 'sound', sound);
Mota.register('var', 'gameKey', gameKey);
Mota.register('var', 'mainSetting', mainSetting);
Mota.register('var', 'KeyCode', KeyCode);
Mota.register('var', 'ScanCode', ScanCode);
Mota.register('var', 'settingStorage', settingStorage);
Mota.register('var', 'status', status);

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
Mota.register('module', 'Use', use);
Mota.register('module', 'Mark', mark);
Mota.register('module', 'KeyCodes', keyCodes);
Mota.register('module', 'UITools', {
    book: bookTools,
    common: commonTools,
    equipbox: equipboxTools,
    fixed: fixedTools,
    fly: flyTools,
    statusBar: statusBarTools,
    toolbox: toolboxTools
});

main.renderLoaded = true;
Mota.require('var', 'hook').emit('renderLoaded');
