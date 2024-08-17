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

    /** 是否启用缓存机制，对于特殊场景，内部已经包含了缓存机制，这时就不需要启用了 */
    private readonly enableCache: boolean;

    /**
     * 创建一个容器，容器中可以包含其他渲染对象
     * @param type 渲染模式，absolute表示绝对位置，static表示跟随摄像机移动，只对顶层元素有效
     * @param cache 是否启用缓存机制
     */
    constructor(type: RenderItemPosition = 'static', cache: boolean = true) {
        super();
        this.canvas = new MotaOffscreenCanvas2D();
        this.type = type;
        this.canvas.withGameScale(true);
        this.enableCache = cache;
    }

    private renderTo(canvas: MotaOffscreenCanvas2D, camera: Camera) {
        const { ctx } = canvas;
        this.sortedChildren.forEach(v => {
            if (v.hidden) return;
            ctx.save();
            if (!v.antiAliasing) {
                ctx.imageSmoothingEnabled = false;
            } else {
                ctx.imageSmoothingEnabled = true;
            }
            v.render(canvas, camera);
            ctx.restore();
        });
    }

    render(canvas: MotaOffscreenCanvas2D, camera: Camera): void {
        this.emit('beforeRender');
        if (this.needUpdate) {
            this.cache(this.using);
            this.needUpdate = false;
        }
        if (this.enableCache) {
            withCacheRender(this, canvas.canvas, canvas.ctx, camera, c => {
                this.renderTo(c, camera);
            });
        } else {
            this.renderTo(canvas, camera);
        }
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
