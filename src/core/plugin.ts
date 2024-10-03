// import pop from '@/plugin/pop';
// import use from '@/plugin/use';
// import animate from '@/plugin/animateController';
// import utils from '@/plugin/utils';
// import status from '@/plugin/ui/statusBar';
// import fly from '@/plugin/ui/fly';
// import chase from '@/plugin/chase/chase';
// import webglUtils from '@/plugin/webgl/utils';
// import shadow from '@/plugin/shadow/shadow';
// import gameShadow from '@/plugin/shadow/gameShadow';
// import achievement from '@/plugin/ui/achievement';
// import completion, { floors } from '@/plugin/completion';
// import path from '@/plugin/fx/path';
// import gameCanvas from '@/plugin/fx/gameCanvas';
// import noise from '@/plugin/fx/noise';
// import smooth from '@/plugin/fx/smoothView';
// import frag from '@/plugin/fx/frag';
// import { Mota } from '.';

import * as fly from '@/plugin/ui/fly';
import * as chase from '@/plugin/chase/chase';
import * as completion from '@/plugin/completion';
import * as pop from '@/plugin/pop';
import * as frag from '@/plugin/fx/frag';
import * as use from '@/plugin/use';
import * as gameCanvas from '@/plugin/fx/gameCanvas';
import * as animateController from '@/plugin/animateController';

Mota.Plugin.register('fly_r', fly);
Mota.Plugin.register('chase_r', chase);
Mota.Plugin.register('completion_r', completion, completion.init);
Mota.Plugin.register('pop_r', pop, pop.init);
Mota.Plugin.register('frag_r', frag, frag.init);
Mota.Plugin.register('use_r', use);
Mota.Plugin.register('gameCanvas_r', gameCanvas);
Mota.Plugin.register(
    'animateController_r',
    animateController,
    animateController.default
);
