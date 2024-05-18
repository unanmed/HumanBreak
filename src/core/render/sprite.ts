import { Camera } from './camera';
import {
    ICanvasCachedRenderItem,
    RenderFunction,
    RenderItem,
    withCacheRender
} from './item';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';

export class Sprite extends RenderItem implements ICanvasCachedRenderItem {
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
        this.emit('beforeRender');
        if (this.needUpdate) {
            this.cache(this.writing);
            this.needUpdate = false;
        }
        withCacheRender(this, canvas, ctx, camera, canvas => {
            this.renderFn(canvas, camera);
        });
        this.writing = void 0;
        this.emit('afterRender');
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

    setRenderFn(fn: RenderFunction) {
        this.renderFn = fn;
    }

    setHD(hd: boolean): void {
        this.highResolution = hd;
        this.canvas.setHD(hd);
        this.update(this);
    }

    setAntiAliasing(anti: boolean): void {
        this.antiAliasing = anti;
        this.canvas.setAntiAliasing(anti);
        this.update(this);
    }
}
