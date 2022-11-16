// 需要引入所有的插件
import pop from './plugin/pop';
import ui from './plugin/uiController';
import use from './plugin/use';
import animate from './plugin/animateController';
import utils from './plugin/utils';

window.addEventListener('load', () => {
    // 每个引入的插件都要在这里执行，否则不会被转发
    const toForward: any[] = [pop(), ui(), use(), animate(), utils()];

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
});
