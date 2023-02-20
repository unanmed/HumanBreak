import { Layout } from './layout';

export class LayoutGame extends Layout {
    /** 画布id */
    id: string;

    constructor(
        id: string,
        x: number,
        y: number,
        w: number,
        h: number,
        z: number
    ) {
        const ctx = core.createCanvas(id, x, y, w, h, z);
        super(ctx.canvas);
        this.id = id;
    }

    image2(
        layout: Layout | CanvasImageSource | Path2D | ImageIds,
        type: number
    ): LayoutGame;
    image2(
        layout: Layout | CanvasImageSource | Path2D | ImageIds,
        type: number,
        x: number,
        y: number
    ): LayoutGame;
    image2(
        layout: Layout | CanvasImageSource | Path2D | ImageIds,
        type: number,
        x: number,
        y: number,
        w: number,
        h: number
    ): LayoutGame;
    image2(
        layout: Layout | CanvasImageSource | Path2D | ImageIds,
        type: number,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): LayoutGame;
    image2(
        layout: Layout | CanvasImageSource | Path2D | ImageIds,
        type: number,
        sx?: number,
        sy?: number,
        sw?: number,
        sh?: number,
        dx?: number,
        dy?: number,
        dw?: number,
        dh?: number
    ): this {
        const img =
            typeof layout === 'string'
                ? core.material.images.images[layout]
                : layout;

        this.image(img, type, sx!, sy!, sw!, sh!, dx!, dy!, dw!, dh!);
        return this;
    }

    /**
     * 绘制一个图标
     * @param id 图标id
     * @param x 横坐标
     * @param y 纵坐标
     * @param w 宽度
     * @param h 高度
     * @param frame 绘制第几帧
     */
    icon(
        id: AllIds,
        x: number,
        y: number,
        w?: number,
        h?: number,
        frame?: number
    ): this {
        core.drawIcon(this.ctx, id, x, y, w, h, frame);
        return this;
    }

    /**
     * 绘制WindowSkin
     * @param direction 指向箭头的方向
     */
    winskin(
        background: any,
        x: number,
        y: number,
        w: number,
        h: number,
        direction?: 'up' | 'down',
        px?: number,
        py?: number
    ): this {
        core.drawWindowSkin(
            background,
            this.ctx,
            x,
            y,
            w,
            h,
            direction,
            px,
            py
        );
        return this;
    }

    /**
     * 绘制一个箭头
     * @param x1 起始点横坐标
     * @param y1 起始点纵坐标
     * @param x2 终止点横坐标
     * @param y2 终止点纵坐标
     */
    arrow(x1: number, y1: number, x2: number, y2: number): this {
        core.drawArrow(this.ctx, x1, y1, x2, y2);
        return this;
    }

    /**
     * 绘制线段
     */
    line(x1: number, y1: number, x2: number, y2: number): this {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        return this;
    }

    /**
     * 绘制圆弧或扇形
     * @param type 绘制类型
     * @param start 起始弧度
     * @param end 终止弧度
     * @param anticlockwise 是否逆时针
     */
    arc(
        type: number,
        x: number,
        y: number,
        r: number,
        start: number,
        end: number,
        anticlockwise: boolean = false
    ): this {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, start, end, anticlockwise);
        this.draw(type);
        return this;
    }

    /**
     * 绘制一个圆
     * @param type 绘制类型
     */
    circle(type: number, x: number, y: number, r: number): this {
        return this.arc(type, x, y, r, 0, Math.PI * 2);
    }

    /**
     * 绘制椭圆
     */
    ellipse(
        type: number,
        x: number,
        y: number,
        a: number,
        b: number,
        rotation: number = 0,
        start: number = 0,
        end: number = Math.PI * 2,
        anticlockwise: boolean = false
    ): this {
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, a, b, rotation, start, end, anticlockwise);
        this.draw(type);
        return this;
    }

    /**
     * 绘制多边形
     * @param type 绘制类型
     * @param nodes 多边形节点
     * @param close 是否闭合路径
     */
    polygon(type: number, nodes: LocArr[], close: boolean = true): this {
        this.ctx.beginPath();
        this.ctx.moveTo(nodes[0][0], nodes[0][1]);
        for (let i = 1; i < nodes.length; i++) {
            this.ctx.lineTo(nodes[i][0], nodes[i][1]);
        }
        if (close) this.ctx.closePath();
        this.draw(type);
        return this;
    }

    /**
     * 绘制矩形
     */
    rect(type: number, x: number, y: number, w: number, h: number): this {
        if (type & Layout.FILL) this.ctx.fillRect(x, y, w, h);
        if (type & Layout.STROKE) this.ctx.strokeRect(x, y, w, h);
        return this;
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(
        type: number,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
    ) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
        this.draw(type);
    }

    /**
     * 删除这个布局
     */
    destroy() {
        core.deleteCanvas(this.id);
    }

    private draw(type: number) {
        if (type & Layout.FILL) this.ctx.fill();
        if (type & Layout.STROKE) this.ctx.stroke();
    }
}
