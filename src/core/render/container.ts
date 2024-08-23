import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import {
    ERenderItemEvent,
    IRenderChildable,
    RenderItem,
    RenderItemPosition
} from './item';
import { Transform } from './transform';

export interface EContainerEvent extends ERenderItemEvent {}

export class Container<E extends EContainerEvent = EContainerEvent>
    extends RenderItem<E | EContainerEvent>
    implements IRenderChildable
{
    children: RenderItem[] = [];
    sortedChildren: RenderItem[] = [];

    private needSort: boolean = false;

    /**
     * 创建一个容器，容器中可以包含其他渲染对象
     * @param type 渲染模式，absolute表示绝对位置，static表示跟随摄像机移动
     * @param cache 是否启用缓存机制
     */
    constructor(type: RenderItemPosition = 'static', cache: boolean = true) {
        super(type, cache);
        this.type = type;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const { ctx } = canvas;

        this.sortedChildren.forEach(v => {
            if (v.hidden) return;
            ctx.save();
            v.renderContent(canvas, transform);
            ctx.restore();
        });
    }

    /**
     * 添加子元素到这个容器上，然后在下一个tick执行更新
     * @param children 要添加的子元素
     */
    appendChild(...children: RenderItem<any>[]) {
        children.forEach(v => (v.parent = this));
        this.children.push(...children);
        if (!this.needSort) {
            this.needSort = true;
            this.requestBeforeFrame(() => {
                this.needSort = false;
                this.sortChildren();
            });
        }
        this.update(this);
    }

    removeChild(...child: RenderItem<any>[]): void {
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

    destroy(): void {
        super.destroy();
        this.children.forEach(v => {
            v.destroy();
        });
    }
}
