import { MotaOffscreenCanvas2D, MotaOffscreenCanvasGL2 } from '../fx/canvas2d';
import { RenderItem } from './item';
import { Transform } from './transform';

type GL2RenderFunc = (
    canvas: MotaOffscreenCanvasGL2,
    transform: Transform
) => void;

export class GL2 extends RenderItem {
    canvas: MotaOffscreenCanvasGL2 = new MotaOffscreenCanvasGL2();

    /** 渲染函数 */
    private renderFn: GL2RenderFunc = () => {};

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const gl = this.canvas.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.renderFn(this.canvas, transform);
        canvas.ctx.drawImage(this.canvas.canvas, 0, 0, this.width, this.height);
    }

    /**
     * 设置这个gl2元素的渲染函数
     * @param fn 渲染函数
     */
    setRenderFn(fn: GL2RenderFunc) {
        this.renderFn = fn;
    }
}
