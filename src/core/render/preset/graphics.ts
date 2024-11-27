import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { RenderItem } from '../item';
import { Transform } from '../transform';

type DrawType = 'fill' | 'stroke';

interface IGraphicProperty {
    /** 渲染方式，是描边还是填充 */
    mode: DrawType;
}

export class Graphics extends RenderItem {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}

export class Rect extends RenderItem implements IGraphicProperty {
    mode: DrawType = 'fill';

    rectX: number = 0;
    rectY: number = 0;
    rectWidth: number = 100;
    rectHeight: number = 100;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;
        ctx.rect(this.rectX, this.rectY, this.rectWidth, this.rectHeight);
    }

    setPos(x: number, y: number) {
        this.rectX = x;
        this.rectY = y;
        this.update();
    }

    setSize(w: number, h: number) {
        this.rectWidth = w;
        this.rectHeight = h;
        this.update();
    }
}

export class Circle extends RenderItem implements IGraphicProperty {
    mode: DrawType = 'fill';

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}

export class Ellipse extends RenderItem implements IGraphicProperty {
    mode: DrawType = 'fill';

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}

export class Line extends RenderItem implements IGraphicProperty {
    mode: DrawType = 'fill';

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}

export class Path extends RenderItem implements IGraphicProperty {
    mode: DrawType = 'fill';

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}
