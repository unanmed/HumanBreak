import * as fly from './ui/fly';
import * as chase from './chase';
import * as completion from './completion';
import * as pop from './pop';
import * as frag from './fx/frag';
import * as use from './use';
import * as gameCanvas from './fx/gameCanvas';
import * as animateController from './animateController';

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
Mota.Plugin.register('chase_r', chase);
