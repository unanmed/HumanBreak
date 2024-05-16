import { parseCss } from '@/plugin/utils';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import { CSSObj } from '../interface';

interface OffscreenCanvasEvent extends EmitableEvent {
    /** 当被动触发resize时（例如core.domStyle.scale变化、窗口大小变化）时触发，使用size函数并不会触发 */
    resize: () => void;
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

    constructor() {
        super();

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
        this.width = this.canvas.width / devicePixelRatio;
        this.height = this.canvas.height / devicePixelRatio;

        this.canvas.style.position = 'absolute';

        MotaOffscreenCanvas2D.list.add(this);
    }

    /**
     * 设置画布的大小
     */
    size(width: number, height: number) {
        let ratio = this.highResolution ? devicePixelRatio : 1;
        if (this.autoScale && this.highResolution) {
            ratio *= core.domStyle.scale;
        }
        this.scale = ratio;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.width = width;
        this.height = height;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(ratio, ratio);
        this.ctx.imageSmoothingEnabled = this.antiAliasing;
    }

    /**
     * 设置当前画布是否跟随样板的 core.domStyle.scale 一同进行缩放
     */
    withGameScale(auto: boolean) {
        this.autoScale = auto;
        this.size(this.width, this.height);
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
     * 删除这个画布
     */
    delete() {
        MotaCanvas2D.list.delete(this);
    }

    /**
     * 复制一个离屏Canvas2D对象或Canvas2D对象，一般用于缓存等操作
     * @param canvas 被复制的MotaOffscreenCanvas2D对象
     * @returns 复制结果
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
        return newCanvas;
    }
}

export class MotaCanvas2D extends MotaOffscreenCanvas2D {
    static map: Map<string, MotaCanvas2D> = new Map();

    id: string = '';

    x: number = 0;
    y: number = 0;

    private mounted: boolean = false;
    private target!: HTMLElement;
    /** 是否自动跟随样板的core.domStyle.scale进行缩放 */
    autoScale: boolean = false;
    /** 是否是高清画布 */
    highResolution: boolean = true;

    constructor(id: string = '', setTarget: boolean = true) {
        super();

        this.id = id;
        if (setTarget) this.target = core.dom.gameDraw;
        this.canvas = document.createElement('canvas');
        this.canvas.id = id;
        this.ctx = this.canvas.getContext('2d')!;
        this.width = this.canvas.width / devicePixelRatio;
        this.height = this.canvas.height / devicePixelRatio;

        this.canvas.style.position = 'absolute';

        MotaCanvas2D.map.set(this.id, this);
    }

    /**
     * 修改画布的挂载目标，如果已经被挂载，那么会被重新挂载至新的目标元素
     * @param target 画布将被挂载的目标
     */
    setTarget(target: HTMLElement) {
        this.target = target;
        if (this.mounted) {
            this.unmount();
            this.mount();
        }
    }

    /**
     * 设置画布的大小
     */
    size(width: number, height: number) {
        let ratio = this.highResolution ? devicePixelRatio : 1;
        if (this.autoScale) {
            const scale = core.domStyle.scale;
            if (this.highResolution) ratio *= scale;
            this.canvas.style.width = `${width * scale}px`;
            this.canvas.style.height = `${height * scale}px`;
        } else {
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
        }
        this.scale = ratio;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.width = width;
        this.height = height;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(ratio, ratio);
    }

    /**
     * 设置画布的位置
     */
    pos(x: number, y: number) {
        this.canvas.style.left = `${x}px`;
        this.canvas.style.top = `${y}px`;
        this.x = x;
        this.y = y;
    }

    /**
     * 设置画布的css
     * @param css 要设置成的css
     */
    css(css: string | CSSObj) {
        const s = typeof css === 'string' ? parseCss(css) : css;
        for (const [key, value] of Object.entries(s)) {
            this.canvas.style[key as CanParseCss] = value;
        }
    }

    /**
     * 删除这个画布
     */
    delete() {
        super.delete();
        this.unmount();
        MotaCanvas2D.map.delete(this.id);
    }

    /**
     * 将这个画布添加至游戏画布
     */
    mount() {
        if (!this.mounted) {
            this.mounted = true;
            this.target.appendChild(this.canvas);
        }
    }

    /**
     * 将这个画布从页面上移除
     */
    unmount() {
        if (this.mounted) {
            this.mounted = false;
            this.canvas.remove();
        }
    }

    /**
     * 类似于 Symbol.for
     */
    static for(id: string, setTarget?: boolean) {
        const canvas = this.map.get(id);
        return canvas ?? new MotaCanvas2D(id, setTarget);
    }
}

window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
        MotaOffscreenCanvas2D.list.forEach(v => {
            if (v.autoScale) {
                v.size(v.width, v.height);
                v.emit('resize');
            }
        });
    });
});
