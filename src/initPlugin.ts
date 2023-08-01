import pop from './plugin/pop';
import ui from './plugin/uiController';
import use from './plugin/use';
import animate from './plugin/animateController';
import utils from './plugin/utils';
import status from './plugin/ui/statusBar';
import mark from './plugin/mark';
import setting from './plugin/settings';
import chapter from './plugin/ui/chapter';
import fly from './plugin/ui/fly';
import chase from './plugin/chase/chase';
import fixed from './plugin/ui/fixed';
import webglUtils from './plugin/webgl/utils';
import shadow from './plugin/shadow/shadow';
import gameShadow from './plugin/shadow/gameShadow';
import achievement from './plugin/ui/achievement';
import completion, { floors } from './plugin/completion';
import path from './plugin/fx/path';
import * as ani from 'mutate-animate';
import frag from './plugin/fx/frag';

function forward() {
    const toForward: any[] = [
        pop(),
        ui(),
        use(),
        animate(),
        utils(),
        status(),
        mark(),
        setting(),
        chapter(),
        fly(),
        chase(),
        fixed(),
        webglUtils(),
        shadow(),
        gameShadow(),
        achievement(),
        completion(),
        path(),
        frag(),
    ];

    // 初始化所有插件，并转发到core上
    (async function () {
        for (const data of toForward) {
            for (const name in data) {
                const d = data[name as keyof typeof data];
                if (!(name in core.plugin)) {
                    // @ts-ignore
                    core.plugin[name as keyof PluginDeclaration] = d;
                }
                if (!(d instanceof Function)) continue;
                if (name in core) continue;
                if (name.startsWith('_')) continue;
                // @ts-ignore
                core[name as ForwardKeys<PluginDeclaration>] = d;
            }
        }

        console.log('插件转发完成！');
    })();

    Object.values(floors).forEach((v, i) => {
        const from = core.floorIds.indexOf(v[0]);
        const to = core.floorIds.indexOf(v[1]);
        const all = core.floorIds.slice(from, to + 1);
        floors[i + 1] = all;
    });

    // @ts-ignore
    core.plugin.ani = ani;
    // @ts-ignore
    core.plugin.shadow = toForward[13];
}

main.forward = forward;
main.init('play');
main.listen();
