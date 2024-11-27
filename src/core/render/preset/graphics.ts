import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { RenderItem } from '../item';
import { Transform } from '../transform';
import { ElementNamespace, ComponentInternalInstance } from 'vue';

interface ILineProperty {
    /** 线宽 */
    lineWidth: number;
    /** 线的虚线设置 */
    lineDash?: number[];
    /** 虚线偏移量 */
    lineDashOffset?: number;
    /** 线的连接样式 */
    lineJoin: CanvasLineJoin;
    /** 线的顶端样式 */
    lineCap: CanvasLineCap;
    /** 线的斜接限制，当连接为miter类型时可填，默认为10 */
    miterLimit: number;
}

interface IGraphicProperty extends ILineProperty {
    /** 渲染模式，可选 {@link GraphicMode.Fill}, {@link GraphicMode.Stroke}, {@link GraphicMode.All} */
    mode: GraphicMode;
    /** 填充样式 */
    fill: CanvasStyle;
    /** 描边样式 */
    stroke: CanvasStyle;
}

export const enum GraphicMode {
    /** 仅填充 */
    Fill = 1,
    /** 仅描边 */
    Stroke = 2,
    /** 填充+描边 */
    All = 3
}

export class Graphics extends RenderItem {
    /** 排序后的子元素 */
    sortedChildren: RenderItem[] = [];

    /** 是否需要重排 */
    private needSort: boolean = false;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.sortedChildren.forEach(v => {
            ctx.save();
            v.renderContent(canvas, transform);
            ctx.restore();
        });
    }

    /**
     * 为这个Graphics元素添加子元素，要求只能是Graphics元素或基于GraphicItemBase的元素
     * @param child 要添加的子元素
     */
    appendChild(...child: RenderItem<any>[]): void {
        child.forEach(v => {
            // 如果是Graphics或GraphicItemBase实例，则加入子元素列表，否则抛出警告并忽略本次添加
            if (v instanceof Graphics || v instanceof GraphicItemBase) {
            } else {
            }
        });
    }

    /**
     * 移除子元素
     */
    removeChild(...child: RenderItem<any>[]): void {}

    /**
     * 申请对子元素按照zIndex进行重排
     */
    requestSort(): void {
        // 在下一帧渲染前进行排序
        if (!this.needSort) {
            this.needSort = true;
            this.requestBeforeFrame(() => {});
        }
    }
}

export abstract class GraphicItemBase
    extends RenderItem
    implements IGraphicProperty
{
    mode: number = GraphicMode.Fill;
    fill: CanvasStyle = '#fff';
    stroke: CanvasStyle = '#fff';
    lineWidth: number = 2;
    lineDash?: number[] | undefined;
    lineDashOffset?: number | undefined;
    lineJoin: CanvasLineJoin = 'bevel';
    lineCap: CanvasLineCap = 'butt';
    miterLimit: number = 10;

    /**
     * 设置描边绘制的信息
     * @param options 线的信息
     */
    setLineOption(options: Partial<ILineProperty>) {}

    /**
     * 设置绘制样式
     * @param style 绘制样式
     */
    setStyle(style: CanvasStyle) {}

    /**
     * 设置绘制模式，是描边还是填充
     * @param mode 绘制模式
     */
    setMode(mode: GraphicMode) {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class Rect extends GraphicItemBase {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class Circle extends GraphicItemBase {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class Ellipse extends GraphicItemBase {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class Line extends GraphicItemBase {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class BezierCurve extends GraphicItemBase {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class QuadraticCurve extends GraphicItemBase {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class Path extends GraphicItemBase {
    /** 路径 */
    path: Path2D = new Path2D();

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}
