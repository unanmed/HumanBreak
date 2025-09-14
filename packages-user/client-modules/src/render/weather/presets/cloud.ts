import { MotaOffscreenCanvas2D, Sprite } from '@motajs/render-core';
import { Weather } from '../weather';

export class CloudWeather extends Weather<Sprite> {
    /** 云层的不透明度 */
    private alpha: number = 0;
    /** 水平速度 */
    private vx: number = 0;
    /** 竖直速度 */
    private vy: number = 0;
    /** 水平位置 */
    private cx: number = 0;
    /** 竖直位置 */
    private cy: number = 0;
    /** 云层移动的最大速度 */
    private maxSpeed: number = 1;
    /** 云层图像 */
    private image: HTMLImageElement | null = null;
    /** 上一次执行速度变换的时刻 */
    private lastDvTime = 0;

    private drawCloud(canvas: MotaOffscreenCanvas2D) {
        const ctx = canvas.ctx;
        if (!this.image) return;
        ctx.globalAlpha = this.alpha;
        const { width, height } = this.image;
        for (let x = -1; x < 2; x++) {
            for (let y = -1; y < 2; y++) {
                const dx = x * width + this.cx;
                const dy = y * height + this.cy;
                if (dx > canvas.width || dy > canvas.height) continue;
                if (dx + width < 0 || dy + height < 0) continue;
                ctx.drawImage(this.image, dx, dy, width, height);
            }
        }
    }

    tick(time: number): void {
        if (!this.element || !this.image) return;
        this.element.update();
        if (time - this.lastDvTime > 50) {
            this.lastDvTime = time;
            const dvx = ((Math.random() - 0.5) * this.level) / 20;
            const dvy = ((Math.random() - 0.5) * this.level) / 20;
            if (Math.sign(dvx) === Math.sign(this.vx)) {
                const ratio = Math.sqrt(
                    (this.maxSpeed - Math.abs(this.vx)) / this.maxSpeed
                );
                const value = Math.abs(dvx) * ratio;
                this.vx += value * Math.sign(dvx);
            } else {
                this.vx += dvx;
            }
            if (Math.sign(dvy) === Math.sign(this.vy)) {
                const ratio = Math.sqrt(
                    (this.maxSpeed - Math.abs(this.vy)) / this.maxSpeed
                );
                const value = Math.abs(dvy) * ratio;
                this.vy += value * Math.sign(dvy);
            } else {
                this.vy += dvy;
            }
        }
        this.cx += this.vx;
        this.cy += this.vy;
        this.cx %= this.image.width;
        this.cy %= this.image.height;
    }

    createElement(level: number): Sprite {
        const element = new Sprite('static', true);
        element.setRenderFn(canvas => this.drawCloud(canvas));
        this.maxSpeed = Math.sqrt(level) * 5;
        this.vx = ((Math.random() - 0.5) * this.maxSpeed) / 2;
        this.vy = ((Math.random() - 0.5) * this.maxSpeed) / 2;
        this.alpha = Math.sqrt(level) / 10;
        this.image = core.material.images.images['cloud.png'];
        return element;
    }

    onDestroy(): void {}
}
