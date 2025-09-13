import { EShaderEvent, Shader } from '@motajs/render-core';
import { Weather } from '../weather';

export class SnowWeather extends Weather<Shader> {
    tick(timestamp: number): void {
        throw new Error('Method not implemented.');
    }

    createElement(level: number): Shader<EShaderEvent> {
        throw new Error('Method not implemented.');
    }

    onDestroy(): void {
        throw new Error('Method not implemented.');
    }
}
