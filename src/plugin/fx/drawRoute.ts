interface DrawRouteConfig {
    /** 颜色 */
    color: string;
    /** 绘制线宽 */
    width: number;
    /** 绘制线长 */
    length: number;
    /** 绘制起点与终点的正方形大小 */
    size: number;
}

/**
 * 绘制瞬移路径
 * @param loc 起点坐标
 * @param moveSteps 移动方向与步数
 * @param config 绘制选项
 * @returns 画布上下文
 */
export function drawRoute(
    loc: Loc,
    moveSteps: DiredLoc[],
    config: DrawRouteConfig[]
): CanvasRenderingContext2D {
    // 计算绘制区域的宽高，并尽可能小的创建route2层
    let sx = Math.min(core.bigmap.width * 32, loc.x * 32),
        sy = Math.min(core.bigmap.height * 32, loc.y * 32),
        dx = loc.x * 32,
        dy = loc.y * 32;
    moveSteps.forEach(function (t) {
        sx = Math.min(sx, t.x * 32);
        dx = Math.max(dx, t.x * 32);
        sy = Math.min(sy, t.y * 32);
        dy = Math.max(dy, t.y * 32);
    });
    core.deleteCanvas('route2');
    const ctx = core.createCanvas(
        'route2',
        sx - core.bigmap.offsetX,
        sy - core.bigmap.offsetY,
        dx - sx + 32,
        dy - sy + 32,
        15
    );
    // 单独画起点
    for (const p of config) {
        ctx.fillStyle = p.color;
        ctx.fillRect(
            loc.x * 32 + 16 - p.size / 2 - sx,
            loc.y * 32 + 16 - p.size / 2 - sy,
            p.size,
            p.size
        );
    }
    for (let m = 0; m < moveSteps.length; m++) {
        const currDir = moveSteps[m].direction;
        loc.x += core.utils.scan[currDir].x;
        loc.y += core.utils.scan[currDir].y;
        for (const p of config) {
            if (m === moveSteps.length - 1) {
                // 终点
                ctx.fillStyle = p.color;
                ctx.fillRect(
                    loc.x * 32 + 16 - p.size / 2 - sx,
                    loc.y * 32 + 16 - p.size / 2 - sy,
                    p.size,
                    p.size
                );
            } else {
                const nextDir = moveSteps[m + 1].direction;
                const cx = loc.x * 32 + 16 - sx,
                    cy = loc.y * 32 + 16 - sy;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.width;
                const position = (32 - p.length) / 2;
                ctx.beginPath();
                ctx.moveTo(
                    cx - core.utils.scan[currDir].x * position,
                    cy - core.utils.scan[currDir].y * position
                );
                ctx.lineTo(cx, cy);
                ctx.lineTo(
                    cx + core.utils.scan[nextDir].x * position,
                    cy + core.utils.scan[nextDir].y * position
                );
                ctx.stroke();
            }
        }
    }
    return ctx;
}
