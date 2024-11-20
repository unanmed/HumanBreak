import * as fly from './ui/fly';
import * as chase from './chase';
import * as completion from './completion';
import * as pop from './pop';
import * as use from './use';
import * as gameCanvas from './fx/gameCanvas';
import * as animateController from './animateController';
import * as achievement from './ui/achievement';
import * as boss from './boss';
import * as utils from './utils';
import './loopMap';

Mota.Plugin.register('fly_r', fly);
Mota.Plugin.register('chase_r', chase);
Mota.Plugin.register('completion_r', completion, completion.init);
Mota.Plugin.register('pop_r', pop, pop.init);
Mota.Plugin.register('use_r', use);
Mota.Plugin.register('gameCanvas_r', gameCanvas);
Mota.Plugin.register(
    'animateController_r',
    animateController,
    animateController.default
);
Mota.Plugin.register('chase_r', chase);
Mota.Plugin.register('achievement_r', achievement);
Mota.Plugin.register('boss_r', boss);
Mota.Plugin.register('utils_r', utils);
