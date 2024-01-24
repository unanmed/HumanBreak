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

// // todo: 将插件更改为注册形式，分为渲染进程和游戏进程两部分，同时分配优先级

// export function resolvePlugin() {
//     const toForward: [keyof Mota['plugin'], any][] = [
//         ['pop', pop()],
//         ['use', use()],
//         ['animate', animate()],
//         ['utils', utils()],
//         ['status', status()],
//         ['fly', fly()],
//         ['chase', chase()],
//         ['webglUtils', webglUtils()],
//         ['shadow', shadow()],
//         ['gameShadow', gameShadow()],
//         ['achievement', achievement()],
//         ['completion', completion()],
//         ['path', path()],
//         ['gameCanvas', gameCanvas()],
//         ['noise', noise()],
//         ['smooth', smooth()],
//         ['frag', frag()]
//     ];

//     for (const [key, obj] of toForward) {
//         mota.plugin[key] = obj;
//     }

//     // 完成度相关
//     Object.values(floors).forEach((v, i) => {
//         const from = core.floorIds.indexOf(v[0]);
//         const to = core.floorIds.indexOf(v[1]);
//         const all = core.floorIds.slice(from, to + 1);
//         floors[i + 1] = all;
//     });
// }
