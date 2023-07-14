const haloColor: Record<number, string[]> = {
    21: ['cyan'],
    26: ['blue'],
    27: ['red']
};

export function drawHalo(
    ctx: CanvasRenderingContext2D,
    onMap: boolean,
    floorId: FloorIds
) {
    if (main.replayChecking) return;
    if (!core.getLocalStorage('showHalo', true)) return;
    const list = core.status.maps[floorId].enemy.haloList;
    ctx.save();
    for (const halo of list) {
        if (halo.type === 'square') {
            const { x, y, d } = halo.data;
            const [color, border] = haloColor[halo.special];
            const r = Math.floor(d / 2);
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
            ctx.fillRect(left * 32, top * 32, d * 32, d * 32);
            ctx.globalAlpha = 0.6;
            ctx.strokeRect(left * 32, top * 32, d * 32, d * 32);
        }
    }

    ctx.restore();
}
