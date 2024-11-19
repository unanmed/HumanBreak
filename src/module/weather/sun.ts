import { Shader, ShaderProgram } from '@/core/render/shader';
import { IWeather, WeatherController } from './weather';

export class SunWeather implements IWeather {
    static id: string = 'sun';

    activate(): void {}

    frame(): void {}

    deactivate(): void {}
}

WeatherController.register(SunWeather);

class SunShader extends Shader {
    protected override postDraw(gl: WebGL2RenderingContext): void {}
}
