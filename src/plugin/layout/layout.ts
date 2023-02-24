import { has } from '../utils';

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

    image(layout: Layout | CanvasImageSource | Path2D, type: number): this;
    image(
        layout: Layout | CanvasImageSource | Path2D,
        type: number,
        x: number,
        y: number
    ): this;
    image(
        layout: Layout | CanvasImageSource | Path2D,
        type: number,
        x: number,
        y: number,
        w: number,
        h: number
    ): this;
    image(
        layout: Layout | CanvasImageSource | Path2D,
        type: number,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): this;
    image(
        layout: Layout | CanvasImageSource | Path2D,
        type: number,
        sx: number = 0,
        sy: number = 0,
        sw?: number,
        sh?: number,
        dx?: number,
        dy?: number,
        dw?: number,
        dh?: number
    ) {
        const img = layout instanceof Layout ? layout.canvas : layout;
        const fill = () => {
            if (img instanceof Path2D) {
                this.ctx.fill(img);
            } else {
                if (!has(sw)) {
                    this.ctx.drawImage(img, sx, sy);
                } else if (!has(dx)) {
                    this.ctx.drawImage(img, sx, sy, sw, sh!);
                } else {
                    this.ctx.drawImage(img, sx, sy, sw, sh!, dx, dy!, dw!, dh!);
                }
            }
        };
        if (type & Layout.IMAGE) {
            // 绘制图片
            fill();
        }
        if (type & Layout.CLEAR) {
            // 按照图片清除一个区域
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'destination-out';
            fill();
            this.ctx.restore();
        }
        if (type & Layout.MASK) {
            // 蒙版，只显示蒙版内的东西
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'destination-in';
            fill();
            this.ctx.restore();
        }
        return this;
    }

    /**
     * 擦除一个矩形
     */
    clear(x: number, y: number, w: number, h: number): this {
        this.ctx.clearRect(x, y, w, h);
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
    ): this {
        if (type & Layout.FILL) this.ctx.fillText(str, x, y, maxWidth);
        if (type & Layout.STROKE) this.ctx.strokeText(str, x, y, maxWidth);
        return this;
    }

    /**
     * 根据路径进行绘制
     * @param path 路径
     * @param type 绘制类型
     */
    path(path: Path2D, type: number, rule?: CanvasFillRule): this {
        if (type & Layout.FILL) this.ctx.fill(path, rule);
        if (type & Layout.STROKE) this.ctx.stroke(path);
        return this;
    }

    /**
     * 保存画布状态
     */
    save(): this {
        this.ctx.save();
        return this;
    }

    /**
     * 回退画布状态
     */
    restore(): this {
        this.ctx.restore();
        return this;
    }

    /**
     * 设置填充样式
     * @param style 样式
     */
    fillStyle(style: CanvasStyle): this {
        this.ctx.fillStyle = style;
        return this;
    }

    /**
     * 设置描边样式
     * @param style 样式
     */
    strokeStyle(style: CanvasStyle): this {
        this.ctx.strokeStyle = style;
        return this;
    }

    /**
     * 设置文本对齐
     * @param align 文本左右对齐方式
     */
    textAlign(align: CanvasTextAlign): this {
        this.ctx.textAlign = align;
        return this;
    }

    /**
     * 设置文本基线
     * @param align 文本基线，即文本上下对齐方式
     */
    textBaseline(align: CanvasTextBaseline): this {
        this.ctx.textBaseline = align;
        return this;
    }

    /**
     * 设置滤镜
     * @param filter 滤镜
     */
    filter(filter: string): this {
        this.ctx.filter = filter;
        return this;
    }

    /**
     * 设置阴影信息
     * @param shadow 阴影信息
     */
    shadow(shadow: Partial<CanvasShadowStyles>): this {
        for (const [p, v] of Object.entries(shadow)) {
            // @ts-ignore
            this.ctx[p] = v;
        }
        return this;
    }

    /**
     * 设置线宽（描边宽度，包括字体描边）
     * @param width 宽度
     */
    lineWidth(width: number): this {
        this.ctx.lineWidth = width;
        return this;
    }

    /**
     * 设置线尾样式
     * @param cap 线尾样式
     */
    lineCap(cap: CanvasLineCap): this {
        this.ctx.lineCap = cap;
        return this;
    }

    /**
     * 设置线段连接方式样式
     * @param join 线段连接方式
     */
    lineJoin(join: CanvasLineJoin): this {
        this.ctx.lineJoin = join;
        return this;
    }

    /**
     * 设置画布的字体
     * @param font 字体
     */
    font(font: string): this {
        this.ctx.font = font;
        return this;
    }

    /**
     * 设置画布之后绘制的不透明度
     * @param alpha 不透明度
     */
    alpha(alpha: number): this {
        this.ctx.globalAlpha = alpha;
        return this;
    }

    /**
     * 设置虚线样式
     * @param dash 虚线样式
     */
    lineDash(dash: number[]): this {
        this.ctx.setLineDash(dash);
        return this;
    }

    /**
     * 放缩画布
     * @param x 横向放缩量
     * @param y 纵向放缩量
     */
    scale(x: number, y: number): this {
        this.ctx.scale(x, y);
        return this;
    }

    /**
     * 旋转画布
     * @param rad 顺时针旋转的弧度数
     */
    rotate(rad: number): this {
        this.ctx.rotate(rad);
        return this;
    }

    /**
     * 平移画布
     * @param x 水平平移量
     * @param y 竖直平移量
     */
    translate(x: number, y: number): this {
        this.ctx.translate(x, y);
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
        if (!has(a)) this.ctx.resetTransform();
        else this.ctx.transform(a, b!, c!, d!, e!, f!);
        return this;
    }

    /**
     * 设置混合方式，像image的蒙版功能与擦除功能本质上也是通过设置混合方式实现的
     * @param value 混合方式
     */
    composite(value: GlobalCompositeOperation): this {
        this.ctx.globalCompositeOperation = value;
        return this;
    }

    /**
     * 删除这个布局
     */
    destroy() {
        this.canvas.remove();
    }
}
