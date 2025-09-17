import { MotaOffscreenCanvas2D, Sprite } from '@motajs/render-core';
import { Weather } from '../weather';
import { SizedCanvasImageSource } from '@motajs/render-core';

export abstract class CloudLike extends Weather<Sprite> {
    /** 不透明度 */
    private alpha: number = 0;
    /** 水平速度 */
    private vx: number = 0;
    /** 竖直速度 */
    private vy: number = 0;
    /** 水平位置 */
    private cx: number = 0;
    /** 竖直位置 */
    private cy: number = 0;
    /** 移动的最大速度 */
    private maxSpeed: number = 1;
    /** 上一次执行速度变换的时刻 */
    private lastTick = 0;
    /** 绘制天气使用的图片 */
    private image: SizedCanvasImageSource | null = null;

    /**
     * 获取类多云天气所使用的图片
     */
    abstract getImage(): SizedCanvasImageSource | null;

    private drawImage(canvas: MotaOffscreenCanvas2D) {
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
        const dt = time - this.lastTick;
        this.lastTick = time;
        if (dt > 100) return;
        const dvx = (Math.random() - 0.5) * this.level * 10;
        const dvy = (Math.random() - 0.5) * this.level * 10;
        const addx = (dvx * dt) / 1000;
        const addy = (dvy * dt) / 1000;
        if (Math.sign(addx) === Math.sign(this.vx)) {
            const ratio = Math.sqrt(
                (this.maxSpeed - Math.abs(this.vx)) / this.maxSpeed
            );
            const value = Math.abs(addx) * ratio;
            this.vx += value * Math.sign(addx);
        } else {
            this.vx += addx;
        }
        if (Math.sign(addy) === Math.sign(this.vy)) {
            const ratio = Math.sqrt(
                (this.maxSpeed - Math.abs(this.vy)) / this.maxSpeed
            );
            const value = Math.abs(addy) * ratio;
            this.vy += value * Math.sign(addy);
        } else {
            this.vy += addy;
        }
        this.cx += (this.vx * dt) / 1000;
        this.cy += (this.vy * dt) / 1000;
        this.cx %= this.image.width;
        this.cy %= this.image.height;
    }

    createElement(level: number): Sprite {
        const element = new Sprite('static', true);
        element.setRenderFn(canvas => this.drawImage(canvas));
        this.maxSpeed = Math.sqrt(level) * 100;
        this.vx = ((Math.random() - 0.5) * this.maxSpeed) / 2;
        this.vy = ((Math.random() - 0.5) * this.maxSpeed) / 2;
        this.alpha = Math.sqrt(level) / 10;
        this.image = this.getImage();
        return element;
    }
}
