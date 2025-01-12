import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from '../item';
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

const enum GraphicModeProp {
    Fill,
    Stroke,
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

    private propFill: boolean = true;
    private propStroke: boolean = false;
    private strokeAndFill: boolean = false;
    private propFillSet: boolean = false;

    /**
     * 设置描边绘制的信息
     * @param options 线的信息
     */
    setLineOption(options: Partial<ILineProperty>) {
        if (!isNil(options.lineWidth)) this.lineWidth = options.lineWidth;
        if (!isNil(options.lineDash)) this.lineDash = options.lineDash;
        if (!isNil(options.lineDashOffset))
            this.lineDashOffset = options.lineDashOffset;
        if (!isNil(options.lineJoin)) this.lineJoin = options.lineJoin;
        if (!isNil(options.lineCap)) this.lineCap = options.lineCap;
        if (!isNil(options.miterLimit)) this.miterLimit = options.miterLimit;
        this.update();
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
     * 检查渲染模式，参考 {@link GraphicPropsBase} 中的 fill stroke strokeAndFill 属性
     */
    private checkMode(mode: GraphicModeProp, value: boolean) {
        switch (mode) {
            case GraphicModeProp.Fill:
                this.propFill = value;
                this.propFillSet = true;
                break;
            case GraphicModeProp.Stroke:
                this.propStroke = value;
                break;
            case GraphicModeProp.StrokeAndFill:
                this.strokeAndFill = value;
                break;
        }
        if (this.strokeAndFill) {
            this.mode = GraphicMode.StrokeAndFill;
        } else {
            if (!this.propFillSet) {
                if (this.propStroke) {
                    this.mode = GraphicMode.Stroke;
                } else {
                    this.mode = GraphicMode.Fill;
                }
            } else {
                if (this.propFill && this.propStroke) {
                    this.mode = GraphicMode.FillAndStroke;
                } else if (this.propFill) {
                    this.mode = GraphicMode.Fill;
                } else if (this.propStroke) {
                    this.mode = GraphicMode.Stroke;
                } else {
                    this.mode = GraphicMode.Fill;
                }
            }
        }
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
        ctx.setLineDash(this.lineDash);
        ctx.lineDashOffset = this.lineDashOffset;
        ctx.lineJoin = this.lineJoin;
        ctx.lineCap = this.lineCap;
        ctx.miterLimit = this.miterLimit;
    }

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        if (isNil(prevValue) && isNil(nextValue)) return;
        switch (key) {
            case 'fill':
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.checkMode(GraphicModeProp.Fill, nextValue);
                break;
            case 'stroke':
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.checkMode(GraphicModeProp.Stroke, nextValue);
                break;
            case 'strokeAndFill':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.checkMode(GraphicModeProp.StrokeAndFill, nextValue);
                break;
            case 'fillRule':
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setFillRule(nextValue);
                break;
            case 'fillStyle':
                this.setFillStyle(nextValue);
                break;
            case 'strokeStyle':
                this.setStrokeStyle(nextValue);
                break;
            case 'lineWidth':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.lineWidth = nextValue;
                this.update();
                break;
            case 'lineDash':
                if (!this.assertType(nextValue, Array, key)) return;
                this.lineDash = nextValue;
                this.update();
                break;
            case 'lineDashOffset':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.lineDashOffset = nextValue;
                this.update();
                break;
            case 'lineJoin':
                if (!this.assertType(nextValue, 'string', key)) return;
                this.lineJoin = nextValue;
                this.update();
                break;
            case 'lineCap':
                if (!this.assertType(nextValue, 'string', key)) return;
                this.lineCap = nextValue;
                this.update();
                break;
            case 'miterLimit':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.miterLimit = nextValue;
                this.update();
                break;
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class Rect extends GraphicItemBase {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
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
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, this.start, this.end);

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
        this.size(radius * 2, radius * 2);
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
            case 'radius':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setRadius(nextValue);
                return;
            case 'start':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAngle(nextValue, this.end);
                return;
            case 'end':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAngle(this.start, nextValue);
                return;
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
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.ellipse(
            this.x,
            this.y,
            this.radiusX,
            this.radiusY,
            0,
            this.start,
            this.end
        );

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
            case 'radiusX':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setRadius(nextValue, this.radiusY);
                return;
            case 'radiusY':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setRadius(this.radiusY, nextValue);
                return;
            case 'start':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAngle(nextValue, this.end);
                return;
            case 'end':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAngle(this.start, nextValue);
                return;
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
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
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
            case 'x1':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setPoint1(nextValue, this.y1);
                return;
            case 'y1':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setPoint1(this.x1, nextValue);
                return;
            case 'x2':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setPoint2(nextValue, this.y2);
                return;
            case 'y2':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setPoint2(this.x2, nextValue);
                return;
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
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.moveTo(this.sx, this.sy);
        ctx.bezierCurveTo(
            this.cp1x,
            this.cp1y,
            this.cp2x,
            this.cp2y,
            this.ex,
            this.ey
        );
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
            case 'sx':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setStart(nextValue, this.sy);
                return;
            case 'sy':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setStart(this.sx, nextValue);
                return;
            case 'cp1x':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setControl1(nextValue, this.cp1y);
                return;
            case 'cp1y':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setControl1(this.cp1x, nextValue);
                return;
            case 'cp2x':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setControl2(nextValue, this.cp2y);
                return;
            case 'cp2y':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setControl2(this.cp2x, nextValue);
                return;
            case 'ex':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setEnd(nextValue, this.ey);
                return;
            case 'ey':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setEnd(this.ex, nextValue);
                return;
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
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        ctx.beginPath();
        ctx.moveTo(this.sx, this.sy);
        ctx.quadraticCurveTo(this.cpx, this.cpy, this.ex, this.ey);
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
            case 'sx':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setStart(nextValue, this.sy);
                return;
            case 'sy':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setStart(this.sx, nextValue);
                return;
            case 'cpx':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setControl(nextValue, this.cpy);
                return;
            case 'cpy':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setControl(this.cpx, nextValue);
                return;
            case 'ex':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setEnd(nextValue, this.ey);
                return;
            case 'ey':
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setEnd(this.ex, nextValue);
                return;
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

export class Path extends GraphicItemBase {
    /** 路径 */
    path: Path2D = new Path2D();

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        switch (this.mode) {
            case GraphicMode.Fill:
                ctx.fill(this.path, this.fillRule);
                break;
            case GraphicMode.Stroke:
                ctx.stroke(this.path);
                break;
            case GraphicMode.FillAndStroke:
                ctx.fill(this.path, this.fillRule);
                ctx.stroke(this.path);
                break;
            case GraphicMode.StrokeAndFill:
                ctx.stroke(this.path);
                ctx.fill(this.path, this.fillRule);
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
            case 'path':
                if (!this.assertType(nextValue, Path2D, key)) return;
                this.path = nextValue;
                this.update();
                return;
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

const enum RectRType {
    /** 圆角为椭圆 */
    Ellipse,
    /** 圆角为二次贝塞尔曲线 */
    Quad,
    /** 圆角为三次贝塞尔曲线。该模式下，包含两个控制点，一个控制点位于上下矩形边延长线，另一个控制点位于左右矩形边延长线 */
    Cubic,
    /** 圆角为直线连接 */
    Line
}

export class RectR extends GraphicItemBase {
    /** 矩形路径 */
    private path: Path2D;

    /** 圆角类型 */
    roundType: RectRType = RectRType.Ellipse;
    /** 横向圆角半径 */
    radiusX: number = 0;
    /** 纵向圆角半径 */
    radiusY: number = 0;
    /**
     * 二次贝塞尔曲线下，表示控制点的横向比例，控制点在上下矩形边与圆角的交界处为0，在左右矩形边与圆角的交界处延长线为1
     * 三次贝塞尔曲线下，表示在上下矩形边延长线上的控制点的比例
     */
    cpx: number = 0;
    /**
     * 二次贝塞尔曲线下，表示控制点的纵向比例，控制点在左右矩形边与圆角的交界处为0，在上下矩形边与圆角的交界处延长线为1
     * 三次贝塞尔曲线下，表示在左右矩形边延长线上的控制点的比例
     */
    cpy: number = 0;

    constructor(
        type: RenderItemPosition,
        cache: boolean = false,
        fall: boolean = false
    ) {
        super(type, cache, fall);

        const path = new Path2D();
        path.rect(this.x, this.y, this.width, this.height);
        this.path = path;
    }

    /**
     * 更新路径
     */
    private updatePath() {}

    /**
     * 设置圆角半径
     * @param x 横向半径
     * @param y 纵向半径
     */
    setRadius(x: number, y: number) {}

    /**
     * 设置贝塞尔曲线模式下的控制点
     * @param x cpx
     * @param y cpy
     */
    setControl(x: number, y: number) {}

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        const ctx = canvas.ctx;
        this.setCanvasState(canvas);
        switch (this.mode) {
            case GraphicMode.Fill:
                ctx.fill(this.path, this.fillRule);
                break;
            case GraphicMode.Stroke:
                ctx.stroke(this.path);
                break;
            case GraphicMode.FillAndStroke:
                ctx.fill(this.path, this.fillRule);
                ctx.stroke(this.path);
                break;
            case GraphicMode.StrokeAndFill:
                ctx.stroke(this.path);
                ctx.fill(this.path, this.fillRule);
                break;
        }
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
