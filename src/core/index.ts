import { BgmController, bgm } from './audio/bgm';
import { SoundController, SoundEffect, sound } from './audio/sound';
import { readyAllResource } from './loader/load';
import {
    Resource,
    ResourceStore,
    ZippedResource,
    resource,
    zipResource
} from './loader/resource';
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
import { KeyCode } from '@/plugin/keyCodes';
import { status } from '@/plugin/ui/statusBar';
import './plugin';
import './package';
import { AudioPlayer } from './audio/audio';
import { CustomToolbar } from './main/custom/toolbar';
import { Hotkey } from './main/custom/hotkey';
import { Keyboard } from './main/custom/keyboard';

function ready() {
    readyAllResource();
}

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
Mota.register('class', 'Resource', Resource);
Mota.register('class', 'ResourceStore', ResourceStore);
Mota.register('class', 'SettingDisplayer', SettingDisplayer);
Mota.register('class', 'SoundController', SoundController);
Mota.register('class', 'SoundEffect', SoundEffect);
Mota.register('class', 'UiController', UiController);
Mota.register('class', 'ZippedResource', ZippedResource);
// ----- 函数注册

// ----- 变量注册
Mota.register('var', 'mainUi', mainUi);
Mota.register('var', 'fixedUi', fixedUi);
Mota.register('var', 'bgm', bgm);
Mota.register('var', 'sound', sound);
Mota.register('var', 'gameKey', gameKey);
Mota.register('var', 'mainSetting', mainSetting);
Mota.register('var', 'KeyCode', KeyCode);
Mota.register('var', 'resource', resource);
Mota.register('var', 'zipResource', zipResource);
Mota.register('var', 'settingStorage', settingStorage);
Mota.register('var', 'status', status);

// ----- 模块注册

ready();
