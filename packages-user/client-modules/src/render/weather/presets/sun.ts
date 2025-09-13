import { Sprite } from '@motajs/render-core';
import { Weather } from '../weather';

export class SunWeather extends Weather<Sprite> {
    tick(timestamp: number): void {
        throw new Error('Method not implemented.');
    }

    createElement(level: number): Sprite {
        throw new Error('Method not implemented.');
    }

    onDestroy(): void {
        throw new Error('Method not implemented.');
    }
}
