import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { ERenderItemEvent, RenderItem } from '../item';
import { Transform } from '../transform';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { isNil } from 'lodash-es';

/*
 * Expected usage (this comment needs to be deleted after implementing correctly):
 * <rect x={10} y={30} width={50} height={30} fill stroke /> <!-- 表现为先填充，后描边 -->
 * <circle x={10} y={50} radius={10} start={Math.PI / 2} end={Math.PI} stroke /> <!-- 表现为仅描边 -->
 * <ellipse x={100} y={50} radiusX={10} radiusY={50} strokeAndFill /> <!-- 表现为先描边后填充 -->
 * <rect x={100} y={50} width={50} height={30} fill /> <!-- 表现为仅填充 -->
 * <rect x={100} y={50} width={50} height={30} /> <!-- 表现为仅填充 -->
 * Line BezierCurve QuadraticCurve 无法设置填充属性，如设置则无效
 */

export interface ILineProperty {
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

export interface IGraphicProperty extends ILineProperty {
    /** 渲染模式，参考 {@link GraphicMode} */
    mode: GraphicMode;
    /** 填充样式 */
    fill: CanvasStyle;
    /** 描边样式 */
    stroke: CanvasStyle;
    /** 填充算法 */
    fillRule: CanvasFillRule;
}

export const enum GraphicMode {
    /** 仅填充 */
    Fill,
    /** 仅描边 */
    Stroke,
    /** 先填充，然后描边 */
    FillAndStroke,
    /** 先描边，然后填充 */
    StrokeAndFill
}

export interface EGraphicItemEvent extends ERenderItemEvent {}

export abstract class GraphicItemBase
    extends RenderItem<EGraphicItemEvent>
    implements Required<ILineProperty>
{
    mode: number = GraphicMode.Fill;
    fill: CanvasStyle = '#fff';
    stroke: CanvasStyle = '#fff';
    lineWidth: number = 2;
    lineDash: number[] = [];
    lineDashOffset: number = 0;
    lineJoin: CanvasLineJoin = 'bevel';
    lineCap: CanvasLineCap = 'butt';
    miterLimit: number = 10;
    fillRule: CanvasFillRule = 'nonzero';

    /**
     * 设置描边绘制的信息
     * @param options 线的信息
     */
    setLineOption(options: Partial<ILineProperty>) {
        if (!isNil(options.lineWidth)) this.lineWidth = options.lineWidth;
        if (!isNil(options.lineDash)) this.lineDash = options.lineDash;
        if (!isNil(options.lineDashOffset)) this.lineDashOffset = options.lineDashOffset;
        if (!isNil(options.lineJoin)) this.lineJoin = options.lineJoin;
        if (!isNil(options.lineCap)) this.lineCap = options.lineCap;
        if (!isNil(options.miterLimit)) this.miterLimit = options.miterLimit;
    }

    /**
     * 设置填充样式
     * @param style 绘制样式
     */
    setFillStyle(style: CanvasStyle) {
        this.fill = style;
        this.update();
    }

    /**
     * 设置描边样式
     * @param style 绘制样式
     */
    setStrokeStyle(style: CanvasStyle) {
        this.stroke = style;
        this.update();
    }

    /**
     * 设置填充原则
     * @param rule 填充原则
     */
    setFillRule(rule: CanvasFillRule) {
        this.fillRule = rule;
        this.update();
    }

    /**
     * 设置绘制模式，是描边还是填充
     * @param mode 绘制模式
     */
    setMode(mode: GraphicMode) {
        this.mode = mode;
        this.update();
    }

    /**
     * 设置画布的渲染状态，在实际渲染前调用
     * @param canvas 要设置的画布
     */
    protected setCanvasState(canvas: MotaOffscreenCanvas2D) {
        const ctx = canvas.ctx;
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.lineWidth;
        ctx.setLineDash(this.lineDash)
        ctx.lineDashOffset = this.lineDashOffset;
        ctx.lineJoin = this.lineJoin;
        ctx.lineCap = this.lineCap;
        ctx.miterLimit = this.miterLimit;
        ctx.fill(this.fillRule);
        this.update();
    }

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
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);

        switch (this.mode) {
            case GraphicMode.Fill:
                ctx.fill(this.fillRule);
                break;
            case GraphicMode.Stroke:
                ctx.stroke();
                break;
            case GraphicMode.FillAndStroke:
                ctx.fill(this.fillRule);
                ctx.stroke();
                break;
            case GraphicMode.StrokeAndFill:
                ctx.stroke();
                ctx.fill(this.fillRule);
                break;
        }
    }
}

export class Circle extends GraphicItemBase {
    radius: number = 10;
    start: number = 0;
    end: number = Math.PI * 2;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,this.start,this.end);

        switch (this.mode) {
            case GraphicMode.Fill:
                ctx.fill(this.fillRule);
                break;
            case GraphicMode.Stroke:
                ctx.stroke();
                break;
            case GraphicMode.FillAndStroke:
                ctx.fill(this.fillRule);
                ctx.stroke();
                break;
            case GraphicMode.StrokeAndFill:
                ctx.stroke();
                ctx.fill(this.fillRule);
                break;
        }
    }

    /**
     * 设置圆的半径
     * @param radius 半径
     */
    setRadius(radius: number) {
        this.radius = radius;
        this.size(radius*2,radius*2);
        this.update();
    }

    /**
     * 设置圆的起始与终止角度
     * @param start 起始角度
     * @param end 终止角度
     */
    setAngle(start: number, end: number) {
        this.start = start;
        this.end = end;
        this.update();
    }

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
    radiusX: number = 10;
    radiusY: number = 10;
    start: number = 0;
    end: number = Math.PI * 2;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.ellipse(this.x,this.y,this.radiusX,this.radiusY,0,this.start,this.end);

        switch (this.mode) {
            case GraphicMode.Fill:
                ctx.fill(this.fillRule);
                break;
            case GraphicMode.Stroke:
                ctx.stroke();
                break;
            case GraphicMode.FillAndStroke:
                ctx.fill(this.fillRule);
                ctx.stroke();
                break;
            case GraphicMode.StrokeAndFill:
                ctx.stroke();
                ctx.fill(this.fillRule);
                break;
        }
    }

    /**
     * 设置椭圆的横纵轴长度
     * @param x 横轴长度
     * @param y 纵轴长度
     */
    setRadius(x: number, y: number) {
        this.radiusX = x;
        this.radiusY = y;
        this.update();
    }


    /**
     * 设置椭圆的起始与终止角度
     * @param start 起始角度
     * @param end 终止角度
     */
    setAngle(start: number, end: number) {
        this.start = start;
        this.end = end;
        this.update();
    }

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
    x1: number = 0;
    y1: number = 0;
    x2: number = 0;
    y2: number = 0;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.moveTo(this.x1,this.y1)
        ctx.lineTo(this.x2,this.y2);
        ctx.stroke();
           
    }

    /**
     * 设置第一个点的横纵坐标
     */
    setPoint1(x: number, y: number) {
        this.x1 = x;
        this.y1 = y;
        this.update();
    }

    /**
     * 设置第二个点的横纵坐标
     */
    setPoint2(x: number, y: number) {
        this.x2 = x;
        this.y2 = y;
        this.update();
    }

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
    sx: number = 0;
    sy: number = 0;
    cp1x: number = 0;
    cp1y: number = 0;
    cp2x: number = 0;
    cp2y: number = 0;
    ex: number = 0;
    ey: number = 0;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.moveTo(this.sx,this.sy)
        ctx.bezierCurveTo(this.cp1x,this.cp1y,this.cp2x,this.cp2y,this.ex,this.ey);
        ctx.stroke();
    }

    /**
     * 设置起始点坐标
     */
    setStart(x: number, y: number) {
        this.sx = x;
        this.sy = y;
        this.update();
    }

    /**
     * 设置控制点1坐标
     */
    setControl1(x: number, y: number) {
        this.cp1x = x;
        this.cp1y = y;
        this.update();
    }

    /**
     * 设置控制点2坐标
     */
    setControl2(x: number, y: number) {
        this.cp2x = x;
        this.cp2y = y;
        this.update();
    }

    /**
     * 设置终点坐标
     */
    setEnd(x: number, y: number) {
        this.ex = x;
        this.ey = y;
        this.update();
    }

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
    sx: number = 0;
    sy: number = 0;
    cpx: number = 0;
    cpy: number = 0;
    ex: number = 0;
    ey: number = 0;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.moveTo(this.sx,this.sy)
        ctx.quadraticCurveTo(this.cpx,this.cpy,this.ex,this.ey);
        ctx.stroke();
    }

    /**
     * 设置起始点坐标
     */
    setStart(x: number, y: number) {
        this.sx = x;
        this.sy = y;
        this.update();
    }

    /**
     * 设置控制点坐标
     */
    setControl(x: number, y: number) {
        this.cpx = x;
        this.cpy = y;
        this.update();
    }

    /**
     * 设置终点坐标
     */
    setEnd(x: number, y: number) {
        this.ex = x;
        this.ey = y;
        this.update();
    }

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
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        switch (this.mode) {
            case GraphicMode.Fill:
                ctx.fill(this.path,this.fillRule);
                break;
            case GraphicMode.Stroke:
                ctx.stroke(this.path);
                break;
            case GraphicMode.FillAndStroke:
                ctx.fill(this.path,this.fillRule);
                ctx.stroke(this.path);
                break;
            case GraphicMode.StrokeAndFill:
                ctx.stroke(this.path);
                ctx.fill(this.path,this.fillRule);
                break;
        }
    }

    /**
     * 获取当前路径
     */
    getPath() {
        return this.path;
    }

    /**
     * 为路径添加路径
     * @param path 要添加的路径
     */
    addPath(path: Path2D) {
        this.path.addPath(path);
        this.update();
    }

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
