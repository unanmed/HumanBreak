import * as heroFourFrames from './fx/heroFourFrames';
import * as itemDetail from './fx/itemDetail';
import * as replay from './replay';
import * as rewrite from './fx/rewrite';
import * as removeMap from './removeMap';
import * as shop from './shop';
import * as utils from './utils';
import * as remainEnemy from './enemy/remainEnemy';

Mota.Plugin.register('utils_g', utils);
Mota.Plugin.register('shop_g', shop);
Mota.Plugin.register('replay_g', replay, replay.init);
Mota.Plugin.register('removeMap_g', removeMap);
Mota.Plugin.register('heroFourFrames_g', heroFourFrames, heroFourFrames.init);
Mota.Plugin.register('rewrite_g', rewrite, rewrite.init);
Mota.Plugin.register('itemDetail_g', itemDetail, itemDetail.init);
Mota.Plugin.register('remainEnemy_g', remainEnemy);

// export {
//     halo,
//     hero,
//     loopMap,
//     remainEnemy,
//     removeMap,
//     shop,
//     skill,
//     skillTree,
//     study,
//     towerBoss,
//     utils,
//     chase,
//     damage,
//     battle,
//     special
// };
