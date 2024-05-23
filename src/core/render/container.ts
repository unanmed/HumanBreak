import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Camera } from './camera';
import {
    ICanvasCachedRenderItem,
    IRenderChildable,
    RenderItem,
    RenderItemPosition,
    withCacheRender
} from './item';

export class Container
    extends RenderItem
    implements ICanvasCachedRenderItem, IRenderChildable
{
    children: RenderItem[] = [];
    sortedChildren: RenderItem[] = [];

    canvas: MotaOffscreenCanvas2D;

    constructor(type: RenderItemPosition = 'static') {
        super();
        this.canvas = new MotaOffscreenCanvas2D();
        this.type = type;
        this.canvas.withGameScale(true);
    }

    render(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        camera: Camera
    ): void {
        this.emit('beforeRender');
        if (this.needUpdate) {
            this.cache(this.using);
            this.needUpdate = false;
        }
        withCacheRender(this, canvas, ctx, camera, c => {
            this.sortedChildren.forEach(v => {
                if (v.hidden) return;
                ctx.save();
                if (!v.antiAliasing) {
                    ctx.imageSmoothingEnabled = false;
                } else {
                    ctx.imageSmoothingEnabled = true;
                }
                v.render(c.canvas, c.ctx, camera);
                ctx.restore();
            });
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

    /**
     * 添加子元素到这个容器上，然后在下一个tick执行更新
     * @param children 要添加的子元素
     */
    appendChild(...children: RenderItem[]) {
        children.forEach(v => (v.parent = this));
        this.children.push(...children);
        this.sortChildren();
        this.update(this);
    }

    removeChild(...child: RenderItem[]): void {
        child.forEach(v => {
            const index = this.children.indexOf(v);
            if (index === -1) return;
            this.children.splice(index, 1);
        });
        this.sortChildren();
        this.update(this);
    }

    sortChildren() {
        this.sortedChildren = this.children
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex);
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

    destroy(): void {
        super.destroy();
        this.children.forEach(v => {
            v.destroy();
        });
    }
}
