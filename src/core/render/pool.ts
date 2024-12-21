import { logger } from '../common/logger';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';

export class CanvasPool {
    private pool: MotaOffscreenCanvas2D[] = [];
    private requested: Set<MotaOffscreenCanvas2D> = new Set();

    /**
     * 申请画布
     * @param num 要申请多少画布
     */
    requestCanvas(num: number): MotaOffscreenCanvas2D[] {
        if (this.pool.length < num) {
            const diff = num - this.pool.length;
            for (let i = 0; i < diff; i++) {
                this.pool.push(new MotaOffscreenCanvas2D(false));
            }
        }
        const toProvide = this.pool.splice(0, num);
        toProvide.forEach(v => this.requested.add(v));
        return toProvide;
    }

    /**
     * 退回画布
     * @param canvas 要退回多少画布
     */
    returnCanvas(canvas: MotaOffscreenCanvas2D[]) {
        canvas.forEach(v => {
            if (!this.requested.has(v)) {
                logger.warn(40);
                return;
            }
            this.requested.delete(v);
            this.pool.push(v);
            v.clear();
        });
    }

    destroy() {
        this.pool.forEach(v => v.delete());
        this.requested.forEach(v => v.delete());
    }
}
