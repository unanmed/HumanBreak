import { MotaOffscreenCanvas2D } from './canvas2d';
import { ActionType, EventProgress, ActionEventMap } from './event';
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
    sortedChildren: RenderItem[] = [];

    private needSort: boolean = false;

    /**
     * 创建一个容器，容器中可以包含其他渲染对象
     * @param type 渲染模式，absolute表示绝对位置，static表示跟随摄像机移动
     * @param cache 是否启用缓存机制
     */
    constructor(
        type: RenderItemPosition = 'static',
        cache: boolean = true,
        fall: boolean = false
    ) {
        super(type, cache, fall);
        this.type = type;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        this.sortedChildren.forEach(v => {
            if (v.hidden) return;
            v.renderContent(canvas, transform);
        });
    }

    onResize(scale: number): void {
        this.children.forEach(v => v.onResize(scale));
        super.onResize(scale);
    }

    requestSort() {
        if (!this.needSort) {
            this.needSort = true;
            this.requestBeforeFrame(() => {
                this.needSort = false;
                this.sortChildren();
            });
        }
    }

    /**
     * 添加子元素到这个容器上，然后在下一个tick执行更新
     * @param children 要添加的子元素
     */
    appendChild(...children: RenderItem<any>[]) {
        children.forEach(v => {
            v.appendTo(this);
        });
        this.requestSort();
        this.update(this);
    }

    removeChild(...child: RenderItem<any>[]): void {
        let changed = false;
        child.forEach(v => {
            if (v.parent !== this) return;
            const success = v.remove();
            if (success) {
                changed = true;
            }
        });
        if (changed) this.requestSort();
        this.update(this);
    }

    appendTo(parent: RenderItem): void {
        super.appendTo(parent);
        if (this.root) {
            const root = this.root;
            this.forEachChild(ele => {
                ele.setRoot(root);
            });
        }
    }

    /**
     * 遍历这个元素中的每个子元素，并执行传入的函数
     * @param fn 对每个元素执行的函数
     */
    forEachChild(fn: (ele: RenderItem) => void) {
        const stack: RenderItem[] = [this];
        while (stack.length > 0) {
            const ele = stack.pop()!;
            stack.push(...ele.children);
            fn(ele);
        }
    }

    private sortChildren() {
        this.sortedChildren = [...this.children]
            .filter(v => !v.isComment)
            .sort((a, b) => a.zIndex - b.zIndex);
        this.update();
    }

    protected propagateEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): void {
        const len = this.sortedChildren.length;
        if (progress === EventProgress.Capture) {
            let success = false;
            for (let i = len - 1; i >= 0; i--) {
                const child = this.sortedChildren[i];
                if (child.hidden) continue;
                if (child.captureEvent(type, event)) {
                    success = true;
                    break;
                }
            }
            // 如果没有子元素能够触发，那么自身触发冒泡
            if (!success) {
                this.bubbleEvent(type, event);
            }
        } else {
            this.parent?.bubbleEvent(type, event);
        }
    }

    destroy(): void {
        super.destroy();
        this.children.forEach(v => {
            v.remove();
        });
    }
}

export type CustomContainerRenderFn = (
    canvas: MotaOffscreenCanvas2D,
    children: RenderItem[],
    transform: Transform
) => void;

export class ContainerCustom extends Container {
    private renderFn?: CustomContainerRenderFn;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        if (!this.renderFn) {
            super.render(canvas, transform);
        } else {
            this.renderFn(canvas, this.sortedChildren, transform);
        }
    }

    /**
     * 设置这个自定义容器的渲染函数
     * @param render 渲染函数
     */
    setRenderFn(render?: CustomContainerRenderFn) {
        this.renderFn = render;
    }

    protected handleProps(
        key: string,
        prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'render': {
                if (!this.assertType(nextValue, 'function', key)) return false;
                this.setRenderFn(nextValue);
                return true;
            }
        }
        return super.handleProps(key, prevValue, nextValue);
    }
}
