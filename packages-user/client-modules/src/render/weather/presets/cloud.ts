import { CloudLike } from './cloudLike';
import { SizedCanvasImageSource } from '@motajs/render-assets';

export class CloudWeather extends CloudLike {
    getImage(): SizedCanvasImageSource | null {
        return core.material.images.images['cloud.png'] ?? null;
    }

    onDestroy(): void {}
}
