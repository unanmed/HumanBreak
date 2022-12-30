// 示例插件：文字弹出

let pop: any[] = [];

// 插件必须有默认导出，并返回所有外部会用到的函数，所有返回的函数会被转发到core上
// 并且在这里面完成所有的初始化，函数外部也可以进行初始化，但完全不能涉及到样板相关内容
export default function init() {
    if (!main.replayChecking)
        core.registerAnimationFrame('pop', true, popValue);
    // 返回值是所有外部可见内容
    return { addPop, pop };
}

/**
 * 弹出文字
 */
function popValue() {
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
        core.fillBoldText(ctx, one.value, one.px, one.py);
        if (one.frame >= 90) count++;
    });
    if (count > 0) pop.splice(0, count);
}

/**
 * 添加弹出文字
 * @param px 弹出的横坐标
 * @param py 弹出的纵坐标
 * @param value 弹出的文字
 */
function addPop(px: number, py: number, value: string) {
    var data = {
        px: px,
        py: py,
        value: value,
        frame: 0
    };
    pop.push(data);
}
