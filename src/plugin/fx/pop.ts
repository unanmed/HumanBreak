import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { wrapInstancedComponent } from '@/core/render';
import { RenderItem, RenderItemPosition } from '@/core/render/item';
import { Transform } from '@/core/render/transform';
import { TimingFn } from 'mutate-animate';

interface PopData {
    cx: number;
    cy: number;
    path: TimingFn<2>;
    text: string;
    time: number;
    start: number;
    color: CanvasStyle;
}

function parabola(input: number): [number, number] {
    const x = input * 100;
    return [x, x ** 2 / 20 - 3 * x];
}

export class Pop extends RenderItem {
    private popList: Set<PopData> = new Set();

    private delegation: number = 0;

    constructor(type: RenderItemPosition) {
        super(type, false);
        this.delegation = this.delegateTicker(() => {
            if (this.popList.size > 0) this.update();
        });
    }

    /**
     * 添加一个弹出文字
     * @param text 要显示的文字
     * @param time 持续时长
     * @param cx 中心点，也就是从哪弹出的
     * @param cy 中心点，也就是从哪弹出的
     * @param path 自定义路径，不填表示默认的抛物线路径
     */
    addPop(
        text: string,
        time: number,
        cx: number,
        cy: number,
        color: CanvasStyle,
        path?: TimingFn<2>
    ) {
        this.popList.add({
            text,
            time,
            cx,
            cy,
            color,
            path: path ?? parabola,
            start: Date.now()
        });
        this.update();
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        const toDelete = new Set<PopData>();
        const now = Date.now();
        ctx.strokeStyle = '#000';
        ctx.font = '22px Verdana';
        ctx.lineWidth = 3;
        this.popList.forEach(v => {
            const { cx, cy, path, text, color, time, start } = v;
            const dt = now - start;
            const progress = dt / time;
            if (progress >= 1) {
                toDelete.add(v);
                return;
            }
            const [x, y] = path(progress);
            const dx = cx + x;
            const dy = cy + y;
            ctx.globalAlpha = Math.min(1, 2 - progress * 2);
            ctx.fillStyle = color;
            ctx.strokeText(text, dx, dy);
            ctx.fillText(text, dx, dy);
        });
        toDelete.forEach(v => {
            this.popList.delete(v);
        });
    }

    destroy(): void {
        super.destroy();
        this.removeTicker(this.delegation);
    }
}

export const PopText = wrapInstancedComponent(() => new Pop('static'));
