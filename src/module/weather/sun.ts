import { Shader, ShaderProgram } from '@/core/render/shader';
import { IWeather, WeatherController } from './weather';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { GL2Program } from '@/core/render/gl2';
import { Transform } from '@/core/render/transform';

export class SunWeather implements IWeather {
    static id: string = 'sun';

    activate(): void {}

    frame(): void {}

    deactivate(): void {}
}

WeatherController.register(SunWeather);

class SunShader extends Shader {
    protected preDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): boolean {
        return true;
    }

    protected postDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): void {}
}
