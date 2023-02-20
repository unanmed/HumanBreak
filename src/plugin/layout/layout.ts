type CanvasStyle = string | CanvasPattern | CanvasGradient;

export class Layout {
    /** 画布 */
    canvas: HTMLCanvasElement;
    /** 绘制上下文 */
    ctx: CanvasRenderingContext2D;

    static readonly CLEAR: number = 1;
    static readonly MASK: number = 2;
    static readonly IMAGE: number = 4;

    static readonly FILL: number = 1;
    static readonly STROKE: number = 2;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    image(layout: Layout | HTMLCanvasElement | Path2D, type: number): Layout;
    image(
        layout: Layout | HTMLCanvasElement | Path2D,
        type: number,
        x: number,
        y: number
    ): Layout;
    image(
        layout: Layout | HTMLCanvasElement | Path2D,
        type: number,
        x: number,
        y: number,
        w: number,
        h: number
    ): Layout;
    image(
        layout: Layout | HTMLCanvasElement | Path2D,
        type: number,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): Layout;
    image(
        layout: Layout | HTMLCanvasElement | Path2D,
        type: number,
        sx?: number,
        sy?: number,
        sw?: number,
        sh?: number,
        dx?: number,
        dy?: number,
        dw?: number,
        dh?: number
    ) {
        return this;
    }

    /**
     * 绘制文字
     * @param str 文字
     * @param type 绘制类型，FILL表示填充，STROKE表示描边，FILL | STROKE 表示既填充又描边
     * @param x 横坐标
     * @param y 纵坐标
     * @param maxWidth 最大宽度
     */
    text(
        str: string,
        type: number,
        x: number,
        y: number,
        maxWidth?: number
    ): Layout {
        return this;
    }

    /**
     * 根据路径进行绘制
     * @param path 路径
     * @param type 绘制类型
     */
    path(path: Path2D, type: number): Layout {
        return this;
    }

    /**
     * 保存画布状态
     */
    save(): Layout {
        return this;
    }

    /**
     * 回退画布状态
     */
    restore(): Layout {
        return this;
    }

    /**
     * 设置填充样式
     * @param style 样式
     */
    fillStyle(style: CanvasStyle): Layout {
        return this;
    }

    /**
     * 设置描边样式
     * @param style 样式
     */
    strokeStyle(style: CanvasStyle): Layout {
        return this;
    }

    /**
     * 设置文本对齐
     * @param align 文本左右对齐方式
     */
    textAlign(align: CanvasTextAlign): Layout {
        return this;
    }

    /**
     * 设置文本基线
     * @param align 文本基线，即文本上下对齐方式
     */
    textBaseline(align: CanvasTextBaseline): Layout {
        return this;
    }

    /**
     * 设置滤镜
     * @param filter 滤镜
     */
    filter(filter: string): Layout {
        return this;
    }

    /**
     * 设置阴影信息
     * @param shadow 阴影信息
     */
    shadow(shadow: Partial<CanvasShadowStyles>): Layout {
        return this;
    }

    /**
     * 设置线宽（描边宽度，包括字体描边）
     * @param width 宽度
     */
    lineWidth(width: number): Layout {
        return this;
    }

    /**
     * 设置线尾样式
     * @param cap 线尾样式
     */
    lineCap(cap: CanvasLineCap): Layout {
        return this;
    }

    /**
     * 设置线段连接方式样式
     * @param join 线段连接方式
     */
    lineJoin(join: CanvasLineJoin): Layout {
        return this;
    }

    /**
     * 设置画布的字体
     * @param font 字体
     */
    font(font: string): Layout {
        return this;
    }

    /**
     * 设置画布之后绘制的不透明度
     * @param alpha 不透明度
     */
    alpha(alpha: number): Layout {
        return this;
    }

    /**
     * 设置虚线样式
     * @param dash 虚线样式
     */
    lineDash(dash: number[]): Layout {
        return this;
    }

    /**
     * 放缩画布
     * @param x 横向放缩量
     * @param y 纵向放缩量
     */
    scale(x: number, y: number): Layout {
        return this;
    }

    /**
     * 旋转画布
     * @param rad 顺时针旋转的弧度数
     */
    rotate(rad: number): Layout {
        return this;
    }

    /**
     * 平移画布
     * @param x 水平平移量
     * @param y 竖直平移量
     */
    translate(x: number, y: number): Layout {
        return this;
    }

    /**
     * 重设变换矩阵
     */
    transform(): Layout;
    /**
     * 叠加变换矩阵（当前画布的矩阵乘以传入的矩阵）
     * 矩阵说明：
     * [a c e]
     * [b d f]
     * [0 0 0]
     * @param a 水平缩放
     * @param b 垂直倾斜
     * @param c 水平倾斜
     * @param d 垂直缩放
     * @param e 水平移动
     * @param f 垂直移动
     */
    transform(
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number
    ): Layout;
    transform(
        a?: number,
        b?: number,
        c?: number,
        d?: number,
        e?: number,
        f?: number
    ) {
        return this;
    }

    /**
     * 设置混合方式，像image的蒙版功能与擦除功能本质上也是通过设置混合方式实现的
     * @param value 混合方式
     */
    composite(value: GlobalCompositeOperation): Layout {
        return this;
    }
}
