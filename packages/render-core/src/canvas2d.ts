import { EventEmitter } from 'eventemitter3';

interface OffscreenCanvasEvent {
    /** 当被动触发resize时（例如窗口大小变化）时触发，使用size函数并不会触发 */
    resize: [];
}

export class MotaOffscreenCanvas2D extends EventEmitter<OffscreenCanvasEvent> {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    width: number;
    height: number;

    /** 是否是高清画布 */
    highResolution: boolean = true;
    /** 是否启用抗锯齿 */
    antiAliasing: boolean = true;

    scale: number = 1;

    /** 更新标识符，如果发生变化则说明画布被动清空 */
    symbol: number = 0;

    /**
     * 创建一个新的离屏画布\
     * **注意**：如果你在自定义渲染元素中使用，请避免使用此构造函数，而应该使用 `RenderItem.requireCanvas`
     * @param alpha 是否启用透明度通道
     * @param canvas 指定画布，不指定时会自动创建一个新画布
     */
    constructor(alpha: boolean = true, canvas?: HTMLCanvasElement) {
        super();
        this.canvas = canvas ?? document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha })!;
        this.width = this.canvas.width / devicePixelRatio;
        this.height = this.canvas.height / devicePixelRatio;
    }

    /**
     * 设置画布的缩放比
     * @param scale 缩放比
     */
    setScale(scale: number) {
        // if (scale === this.scale) {
        //     this.clear();
        //     return;
        // }
        this.scale = scale;
        let ratio = this.highResolution ? devicePixelRatio : 1;
        ratio *= this.scale;
        this.canvas.width = this.width * ratio;
        this.canvas.height = this.height * ratio;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(ratio, ratio);
        this.ctx.imageSmoothingEnabled = this.antiAliasing;
    }

    /**
     * 设置画布的大小
     */
    size(width: number, height: number) {
        const w = Math.max(width, 1);
        const h = Math.max(height, 1);
        let ratio = this.highResolution ? devicePixelRatio : 1;
        ratio *= this.scale;
        this.canvas.width = w * ratio;
        this.canvas.height = h * ratio;
        this.width = w;
        this.height = h;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(ratio, ratio);
        this.ctx.imageSmoothingEnabled = this.antiAliasing;
    }

    /**
     * 设置当前画布是否为高清画布
     */
    setHD(hd: boolean) {
        this.highResolution = hd;
        this.size(this.width, this.height);
    }

    /**
     * 设置当前画布的抗锯齿设置
     */
    setAntiAliasing(anti: boolean) {
        this.antiAliasing = anti;
        this.ctx.imageSmoothingEnabled = anti;
    }

    /**
     * 清空画布
     */
    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /**
     * 复制一个离屏Canvas2D对象，一般用于缓存等操作
     * @param canvas 被复制的MotaOffscreenCanvas2D对象
     * @returns 复制结果，注意复制结果是被冻结的，无法进行大小等的修改，但是可以继续绘制
     */
    static clone(canvas: MotaOffscreenCanvas2D): MotaOffscreenCanvas2D {
        const newCanvas = new MotaOffscreenCanvas2D();
        newCanvas.setHD(canvas.highResolution);
        newCanvas.size(canvas.width, canvas.height);
        newCanvas.ctx.drawImage(
            canvas.canvas,
            0,
            0,
            canvas.width,
            canvas.height
        );
        return newCanvas;
    }
}
