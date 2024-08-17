import { Camera } from './camera';
import {
    ICanvasCachedRenderItem,
    RenderFunction,
    RenderItem,
    RenderItemPosition,
    withCacheRender
} from './item';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';

export class Sprite extends RenderItem implements ICanvasCachedRenderItem {
    renderFn: RenderFunction;

    canvas: MotaOffscreenCanvas2D;

    private readonly enableCache: boolean;

    /**
     * 创建一个精灵，可以自由在上面渲染内容
     * @param type 渲染模式，absolute表示绝对位置，static表示跟随摄像机移动，只对顶层元素有效
     * @param cache 是否启用缓存机制
     */
    constructor(type: RenderItemPosition = 'static', cache: boolean = true) {
        super();
        this.type = type;
        this.enableCache = cache;
        this.renderFn = () => {};
        this.canvas = new MotaOffscreenCanvas2D();
        this.canvas.withGameScale(true);
    }

    render(canvas: MotaOffscreenCanvas2D, camera: Camera): void {
        this.emit('beforeRender');
        if (this.needUpdate) {
            this.cache(this.using);
            this.needUpdate = false;
        }
        if (this.enableCache) {
            withCacheRender(this, canvas.canvas, canvas.ctx, camera, canvas => {
                this.renderFn(canvas, camera);
            });
        } else {
            this.renderFn(canvas, camera);
        }
        this.writing = void 0;
        this.emit('afterRender');
    }

    size(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.canvas.size(width, height);
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
