import { EventEmitter } from 'eventemitter3';
import { logger } from '../common/logger';

interface OffscreenCanvasEvent {
    /** 当被动触发resize时（例如core.domStyle.scale变化、窗口大小变化）时触发，使用size函数并不会触发 */
    resize: [];
}

export class MotaOffscreenCanvas2D extends EventEmitter<OffscreenCanvasEvent> {
    static list: Set<MotaOffscreenCanvas2D> = new Set();

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    width: number;
    height: number;

    /** 是否自动跟随样板的core.domStyle.scale进行缩放 */
    autoScale: boolean = false;
    /** 是否是高清画布 */
    highResolution: boolean = true;
    /** 是否启用抗锯齿 */
    antiAliasing: boolean = true;

    scale: number = 1;

    /** 更新标识符，如果发生变化则说明画布被动清空 */
    symbol: number = 0;

    private _freezed: boolean = false;
    /** 当前画布是否被冻结 */
    get freezed() {
        return this._freezed;
    }

    /**
     * 创建一个新的离屏画布
     * @param alpha 是否启用透明度通道
     * @param canvas 指定画布，不指定时会自动创建一个新画布
     */
    constructor(alpha: boolean = true, canvas?: HTMLCanvasElement) {
        super();
        // console.trace();

        this.canvas = canvas ?? document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha })!;
        this.width = this.canvas.width / devicePixelRatio;
        this.height = this.canvas.height / devicePixelRatio;

        MotaOffscreenCanvas2D.list.add(this);
    }

    /**
     * 设置画布的大小
     */
    size(width: number, height: number) {
        if (this._freezed) {
            logger.warn(33);
            return;
        }
        let ratio = this.highResolution ? devicePixelRatio : 1;
        const scale = core.domStyle.scale;
        if (this.autoScale) {
            ratio *= scale;
        }
        this.scale = ratio;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.width = width;
        this.height = height;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(ratio, ratio);
        this.ctx.imageSmoothingEnabled = this.antiAliasing;
        if (this.canvas.isConnected) {
            this.canvas.style.width = `${width * scale}px`;
            this.canvas.style.height = `${height * scale}px`;
        }
    }

    /**
     * 设置当前画布是否跟随样板的 core.domStyle.scale 一同进行缩放
     */
    withGameScale(auto: boolean) {
        if (this._freezed) {
            logger.warn(33);
            return;
        }
        this.autoScale = auto;
        this.size(this.width, this.height);
    }

    /**
     * 设置当前画布是否为高清画布
     */
    setHD(hd: boolean) {
        if (this._freezed) {
            logger.warn(33);
            return;
        }
        this.highResolution = hd;
        this.size(this.width, this.height);
    }

    /**
     * 设置当前画布的抗锯齿设置
     */
    setAntiAliasing(anti: boolean) {
        if (this._freezed) {
            logger.warn(33);
            return;
        }
        this.antiAliasing = anti;
        this.ctx.imageSmoothingEnabled = anti;
    }

    /**
     * 清空画布
     */
    clear() {
        if (this._freezed) {
            logger.warn(33);
            return;
        }
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /**
     * 删除这个画布
     */
    delete() {
        this.canvas.remove();
        this.ctx.reset();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        MotaOffscreenCanvas2D.list.delete(this);
    }

    freeze() {
        this._freezed = true;
        MotaOffscreenCanvas2D.list.delete(this);
    }

    /**
     * 复制一个离屏Canvas2D对象，一般用于缓存等操作
     * @param canvas 被复制的MotaOffscreenCanvas2D对象
     * @returns 复制结果，注意复制结果是被冻结的，无法进行大小等的修改，但是可以继续绘制
     */
    static clone(canvas: MotaOffscreenCanvas2D): MotaOffscreenCanvas2D {
        const newCanvas = new MotaOffscreenCanvas2D();
        newCanvas.setHD(canvas.highResolution);
        newCanvas.withGameScale(canvas.autoScale);
        newCanvas.size(canvas.width, canvas.height);
        newCanvas.ctx.drawImage(
            canvas.canvas,
            0,
            0,
            canvas.width,
            canvas.height
        );
        newCanvas.freeze();
        return newCanvas;
    }

    static refreshAll(force: boolean = false) {
        this.list.forEach(v => {
            if (force || v.autoScale) {
                v.size(v.width, v.height);
                v.symbol++;
                v.emit('resize');
            }
        });
    }
}

window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
        MotaOffscreenCanvas2D.refreshAll();
    });
});
