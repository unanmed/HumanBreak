// todo: 这个引入不加会报错，应该是循环引用导致的
import '@/plugin/utils';
import * as LegacyUI from '@motajs/legacy-ui';
import * as LegacySystem from '@motajs/legacy-system';
import './main/init/';
import './main/custom/toolbar';
import { KeyCode } from '@motajs/client-base';
import '@/plugin';
import * as System from '@motajs/system';
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
import * as Shadow from './fx/shadow';
import { Render } from '@motajs/client';
import { HeroKeyMover } from '../module/action/move';
import * as Animation from 'mutate-animate';
import '@/module';

// ----- 变量注册
Mota.register('var', 'KeyCode', KeyCode);
Mota.register('var', 'status', status);
Mota.register('var', 'logger', logger);
// ----- 模块注册
Mota.register('module', 'LegacyUI', LegacyUI);
Mota.register('module', 'System', System);
Mota.register('module', 'LegacySystem', LegacySystem);
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
