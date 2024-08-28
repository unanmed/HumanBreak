/* @__PURE__ */ import './dev/hotReload'; // 仅开发会用到
import * as fiveLayer from './fiveLayer';
import * as itemDetail from './fx/itemDetail';
import * as replay from './replay';
import * as ui from './ui';
import * as rewrite from './fx/rewrite';
import * as loopMap from './loopMap';
import * as removeMap from './removeMap';
import * as shop from './shop';
import * as skill from './skill';
import * as skillTree from './skillTree';
import * as towerBoss from './towerBoss';
import * as utils from './utils';
import * as chase from './chase';
import * as remainEnemy from './enemy/remainEnemy';
import * as checkBlock from './enemy/checkblock';
import * as fallback from './fallback';
import './hook';

Mota.Plugin.register('utils_g', utils);
Mota.Plugin.register('loopMap_g', loopMap, loopMap.init);
Mota.Plugin.register('shop_g', shop);
Mota.Plugin.register('replay_g', replay, replay.init);
Mota.Plugin.register('skillTree_g', skillTree);
Mota.Plugin.register('removeMap_g', removeMap);
Mota.Plugin.register('chase_g', chase);
Mota.Plugin.register('skill_g', skill);
Mota.Plugin.register('towerBoss_g', towerBoss);
Mota.Plugin.register('fiveLayer_g', fiveLayer, fiveLayer.init);
Mota.Plugin.register('rewrite_g', rewrite, rewrite.init);
Mota.Plugin.register('itemDetail_g', itemDetail, itemDetail.init);
// Mota.Plugin.register('study_g', study);
Mota.Plugin.register('remainEnemy_g', remainEnemy);
Mota.Plugin.register('checkBlock_g', checkBlock, checkBlock.init);
// todo: 这几个不应该放到插件
Mota.Plugin.register('ui_g', ui, ui.init);
// 用于暂时向后兼容的插件，若干个版本后会删除
Mota.Plugin.register('fallback_g', fallback, fallback.init);

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
