import pop from '@/plugin/pop';
import ui from '@/plugin/uiController';
import use from '@/plugin/use';
import animate from '@/plugin/animateController';
import utils from '@/plugin/utils';
import status from '@/plugin/ui/statusBar';
import mark from '@/plugin/mark';
import chapter from '@/plugin/ui/chapter';
import fly from '@/plugin/ui/fly';
import chase from '@/plugin/chase/chase';
import webglUtils from '@/plugin/webgl/utils';
import shadow from '@/plugin/shadow/shadow';
import gameShadow from '@/plugin/shadow/gameShadow';
import achievement from '@/plugin/ui/achievement';
import completion, { floors } from '@/plugin/completion';
import path from '@/plugin/fx/path';
import gameCanvas from '@/plugin/fx/gameCanvas';
import noise from '@/plugin/fx/noise';
import smooth from '@/plugin/fx/smoothView';
import frag from '@/plugin/fx/frag';
import { Mota } from '.';

export function resolvePlugin() {
    const toForward: [keyof Mota['plugin'], any][] = [
        ['pop', pop()],
        ['ui', ui()],
        ['use', use()],
        ['animate', animate()],
        ['utils', utils()],
        ['status', status()],
        ['mark', mark()],
        ['chapter', chapter()],
        ['fly', fly()],
        ['chase', chase()],
        ['webglUtils', webglUtils()],
        ['shadow', shadow()],
        ['gameShadow', gameShadow()],
        ['achievement', achievement()],
        ['completion', completion()],
        ['path', path()],
        ['gameCanvas', gameCanvas()],
        ['noise', noise()],
        ['smooth', smooth()],
        ['frag', frag()]
    ];

    for (const [key, obj] of toForward) {
        mota.plugin[key] = obj;
    }

    // 完成度相关
    Object.values(floors).forEach((v, i) => {
        const from = core.floorIds.indexOf(v[0]);
        const to = core.floorIds.indexOf(v[1]);
        const all = core.floorIds.slice(from, to + 1);
        floors[i + 1] = all;
    });
}
