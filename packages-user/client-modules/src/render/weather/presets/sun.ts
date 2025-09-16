import { MotaOffscreenCanvas2D, Sprite } from '@motajs/render-core';
import { Weather } from '../weather';
import { clamp } from 'lodash-es';

export class SunWeather extends Weather<Sprite> {
    /** 阳光图片 */
    private image: HTMLImageElement | null = null;
    /** 阳光图片的不透明度 */
    private alpha: number = 0;
    /** 阳光的最大不透明度 */
    private maxAlpha: number = 0;
    /** 阳光的最小不透明度 */
    private minAlpha: number = 0;
    /** 不透明度变化率 */
    private va: number = 0;
    /** 上一帧的时刻 */
    private lastTick: number = 0;

    drawSun(canvas: MotaOffscreenCanvas2D) {
        if (!this.image) return;
        const ctx = canvas.ctx;
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    }

    tick(timestamp: number): void {
        this.element?.update();
        const dt = timestamp - this.lastTick;
        this.lastTick = timestamp;
        if (dt > 100) return;
        const aa = (Math.random() - 0.5) * this.level;
        this.va += (aa * dt) / 1000;
        this.va = clamp(this.va, 0.1);
        this.alpha += (this.va * dt) / 1000;
        if (this.alpha < this.minAlpha) {
            this.va = Math.abs(this.va);
            this.alpha = this.minAlpha;
        } else if (this.alpha > this.maxAlpha) {
            this.va = -Math.abs(this.va);
            this.alpha = this.maxAlpha;
        }
    }

    createElement(level: number): Sprite {
        const element = new Sprite('static', true);
        element.setRenderFn(canvas => this.drawSun(canvas));
        this.maxAlpha = level / 10;
        this.minAlpha = level / 20;
        this.alpha = (this.maxAlpha + this.minAlpha) / 2;
        this.image = core.material.images.images['sun.png'];
        return element;
    }

    onDestroy(): void {}
}
