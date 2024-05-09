// 示例插件：文字弹出
// todo: 重写

let pop: any[] = [];

let time = 0;

export function init() {
    // core.registerAnimationFrame('pop', true, popValue);
}

/**
 * 弹出文字
 */
function popValue(t: number) {
    if (t - time < 15) return;
    let ctx = core.getContextByName('pop')!;
    if (!ctx) ctx = core.createCanvas('pop', 0, 0, core._PX_, core._PY_, 90);
    core.clearMap(ctx);
    let count = 0;
    pop.forEach(function (one) {
        // 由frame计算出dy
        const dy = 6 - one.frame * 0.2;
        const dx = 1;
        one.py -= dy;
        one.px += dx;
        one.frame++;
        // 绘制
        if (one.frame >= 60) core.setAlpha(ctx, 3 - one.frame / 30);
        else core.setAlpha(ctx, 1);
        core.fillBoldText(
            ctx,
            one.value,
            one.px,
            one.py,
            '#f22',
            '#000',
            '24px normal'
        );
        if (one.frame >= 90) count++;
    });
    if (count > 0) pop.splice(0, count);
    time = t;
}

/**
 * 添加弹出文字
 * @param px 弹出的横坐标
 * @param py 弹出的纵坐标
 * @param value 弹出的文字
 */
export function addPop(px: number, py: number, value: string) {
    var data = {
        px: px,
        py: py,
        value: value,
        frame: 0
    };
    pop.push(data);
}
