/* @__PURE__ */ import './dev/hotReload.js'; // 仅开发会用到
import * as heroFourFrames from './fx/heroFourFrames';
import * as itemDetail from './fx/itemDetail';
import * as replay from './replay';
import * as ui from './ui';
import * as rewrite from './fx/rewrite';
import * as halo from './fx/halo';
import * as removeMap from './removeMap';
import * as shop from './shop';
import * as utils from './utils';
import * as remainEnemy from './enemy/remainEnemy';
import * as checkBlock from './enemy/checkblock';

Mota.Plugin.register('utils_g', utils);
Mota.Plugin.register('shop_g', shop);
Mota.Plugin.register('replay_g', replay, replay.init);
Mota.Plugin.register('removeMap_g', removeMap);
Mota.Plugin.register('heroFourFrames_g', heroFourFrames, heroFourFrames.init);
Mota.Plugin.register('rewrite_g', rewrite, rewrite.init);
Mota.Plugin.register('itemDetail_g', itemDetail, itemDetail.init);
Mota.Plugin.register('halo_g', halo);
Mota.Plugin.register('remainEnemy_g', remainEnemy);
Mota.Plugin.register('checkBlock_g', checkBlock, checkBlock.init);
// todo: 这几个不应该放到插件
Mota.Plugin.register('ui_g', ui, ui.init);

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
