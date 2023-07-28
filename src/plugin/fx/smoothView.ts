import { debounce } from 'lodash-es';
import { Transition, hyper } from 'mutate-animate';

const tran = new Transition();
tran.value.x = 0;
tran.value.y = 0;

let needSmooth = false;

export default function init() {
    tran.ticker.add(() => {
        if (core.isPlaying() && needSmooth) {
            core.setViewport(tran.value.x, tran.value.y);
        }
    });

    const func = debounce(() => {
        needSmooth = false;
    }, 700);

    control.prototype._drawHero_updateViewport = function (
        x: number,
        y: number,
        offset: Loc
    ) {
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

        if (tran.easeTime > 0) {
            needSmooth = true;
            func();
        } else {
            core.setViewport(tran.value.x, tran.value.y);
        }
    };

    let time2 = Date.now();
    const origin1 = control.prototype._moveAction_moving;
    control.prototype._moveAction_moving = function (...params: any[]) {
        if (Date.now() - time2 > 20)
            tran.mode(hyper('sin', 'out')).time(200).absolute();
        return origin1.call(this, ...params);
    };

    const origin2 = control.prototype.moveDirectly;
    control.prototype.moveDirectly = function (...params: any[]) {
        time2 = Date.now();
        tran.mode(hyper('sin', 'out')).time(600).absolute();
        return origin2.call(this, ...params);
    };

    const origin3 = events.prototype._changeFloor_beforeChange;
    events.prototype._changeFloor_beforeChange = function (...params: any[]) {
        tran.time(1).absolute();
        return origin3.call(this, ...params);
    };
}
