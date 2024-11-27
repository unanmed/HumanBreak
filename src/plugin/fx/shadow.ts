import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { GL2, GL2Program } from '@/core/render/gl2';
import { Transform } from '@/core/render/transform';

const MAX_COUNT = 5;

export class ShadowEffect extends GL2 {
    protected preDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): boolean {
        throw new Error('Method not implemented.');
    }

    protected postDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): void {
        throw new Error('Method not implemented.');
    }
}

class ShadowProgam extends GL2Program {}
