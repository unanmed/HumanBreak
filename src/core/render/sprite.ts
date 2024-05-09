import { Camera } from './camera';
import { RenderFunction, RenderItem, withCacheRender } from './item';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';

export class Sprite extends RenderItem {
    renderFn: RenderFunction;

    canvas: MotaOffscreenCanvas2D;

    constructor() {
        super();
        this.renderFn = () => {};
        this.canvas = new MotaOffscreenCanvas2D();
        this.canvas.withGameScale(true);
    }

    render(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        camera: Camera
    ): void {
        this.emit('beforeUpdate', this);
        withCacheRender(this, canvas, ctx, camera, canvas => {
            this.renderFn(canvas, camera);
        });
        this.emit('afterUpdate', this);
    }

    size(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.canvas.size(width, height);
        this.writing = this.using;
        this.update(this);
    }

    pos(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}
