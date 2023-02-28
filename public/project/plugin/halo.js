'use strict';

(function () {
    /**
     * 绘制光环范围
     * @param {CanvasRenderingContext2D} ctx
     * @param {boolean} onMap
     */
    function drawHalo(ctx, onMap) {
        if (main.replayChecking) return;
        if (!core.getLocalStorage('showHalo', true)) return;
        const halo = core.status.checkBlock.halo;
        ctx.save();
        for (const [loc, range] of Object.entries(halo)) {
            const [x, y] = loc.split(',').map(v => parseInt(v));
            for (const r of range) {
                const [type, value, color, border] = r.split(':');
                if (type === 'square') {
                    // 正方形光环
                    const n = parseInt(value);
                    const r = Math.floor(n / 2);
                    let left = x - r,
                        right = x + r,
                        top = y - r,
                        bottom = y + r;
                    if (onMap && core.bigmap.v2) {
                        left -= core.bigmap.posX;
                        top -= core.bigmap.posY;
                        right -= core.bigmap.posX;
                        bottom -= core.bigmap.posY;
                        if (
                            right < -1 ||
                            left > core._PX_ / 32 + 1 ||
                            top < -1 ||
                            bottom > core._PY_ / 32 + 1
                        ) {
                            continue;
                        }
                    }
                    ctx.fillStyle = color;
                    ctx.strokeStyle = border ?? color;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 0.1;
                    ctx.fillRect(left * 32, top * 32, n * 32, n * 32);
                    ctx.globalAlpha = 0.6;
                    ctx.strokeRect(left * 32, top * 32, n * 32, n * 32);
                }
            }
        }
        ctx.restore();
    }

    core.plugin.halo = {
        drawHalo
    };
})();
