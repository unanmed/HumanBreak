import { MotaOffscreenCanvas2D } from '@motajs/render-core';
import { CloudLike } from './cloudLike';
import { SizedCanvasImageSource } from '@motajs/render-assets';

export class FogWeather extends CloudLike {
    /** 雾天气的图像比较小，因此将四个进行合并 */
    private static mergedFog: MotaOffscreenCanvas2D | null = null;

    getImage(): SizedCanvasImageSource | null {
        if (FogWeather.mergedFog) {
            return FogWeather.mergedFog.canvas;
        } else {
            return FogWeather.mergeFog();
        }
    }

    onDestroy(): void {}

    /**
     * 将雾天气的图片 2x2 合并
     */
    static mergeFog() {
        const image = core.material.images.images['fog.png'];
        if (!image) return null;
        const { width, height } = image;
        this.mergedFog = new MotaOffscreenCanvas2D();
        this.mergedFog.size(width * 2, height * 2);
        const ctx = this.mergedFog.ctx;
        ctx.drawImage(image, 0, 0, width, width);
        ctx.drawImage(image, width, 0, width, width);
        ctx.drawImage(image, 0, height, width, width);
        ctx.drawImage(image, width, height, width, width);
        return this.mergedFog.canvas;
    }
}
