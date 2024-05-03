import { debounce } from 'lodash-es';
import { Transition, hyper } from 'mutate-animate';

const tran = new Transition();
tran.value.x = 0;
tran.value.y = 0;

let needSmooth = false;

export function init() {
    const setting = Mota.require('var', 'mainSetting');

    tran.ticker.add(() => {
        if (core.isPlaying() && needSmooth && !core.isReplaying()) {
            core.setViewport(tran.value.x, tran.value.y);
        }
    });

    const func = debounce(() => {
        needSmooth = false;
    }, 700);

    Mota.rewrite(
        core.control,
        '_drawHero_updateViewport',
        'full',
        (x, y, offset) => {
            const ox = core.clamp(
                (x - core._HALF_WIDTH_) * 32 + offset.x,
                0,
                Math.max(32 * core.bigmap.width - core._PX_, 0)
            );
            const oy = core.clamp(
                (y - core._HALF_HEIGHT_) * 32 + offset.y,
                0,
                Math.max(32 * core.bigmap.height - core._PY_, 0)
            );

            tran.transition('x', ox).transition('y', oy);

            const t = setting.getValue('screen.smoothView', false);
            if (!t || core.isReplaying()) {
                core.bigmap.offsetX = ox;
                core.bigmap.offsetY = oy;
                core.control.updateViewport();
                return;
            }
            if (tran.easeTime > 0) {
                needSmooth = true;
                func();
            } else {
                core.setViewport(tran.value.x, tran.value.y);
            }
        }
    );

    const hso = hyper('sin', 'out');
    let time2 = Date.now();
    Mota.rewrite(core.control, '_moveAction_moving', 'front', () => {
        const t = setting.getValue('screen.smoothView', false) ? 200 : 0;
        if (Date.now() - time2 > 20) tran.mode(hso).time(t).absolute();
    });
    Mota.rewrite(core.control, 'moveDirectly', 'front', () => {
        const t = setting.getValue('screen.smoothView', false) ? 600 : 0;
        time2 = Date.now();
        tran.mode(hso).time(t).absolute();
    });
    Mota.rewrite(core.events, '_changeFloor_beforeChange', 'front', () => {
        tran.time(0).absolute();
    });
}
