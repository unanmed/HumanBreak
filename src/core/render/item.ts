import { isNil } from 'lodash-es';
import { EventEmitter } from '../common/eventEmitter';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Camera } from './camera';
import { Ticker } from 'mutate-animate';

export type RenderFunction = (
    canvas: MotaOffscreenCanvas2D,
    camera: Camera
) => void;

export type RenderItemPosition = 'absolute' | 'static';

interface IRenderCache {
    /** 缓存列表 */
    cacheList: Map<string, MotaOffscreenCanvas2D>;
    /** 当前正在使用的缓存 */
    using?: string;
    /** 下次绘制需要写入的缓存 */
    writing?: string;

    /**
     * 在之后的绘制中使用缓存，如果缓存不存在，那么就不使用缓存，并在下一次绘制结束后写入
     * @param index 缓存的索引，不填时表示不使用缓存
     */
    useCache(index?: string): void;

    /**
     * 将下次绘制写入缓存并使用
     * @param index 缓存的索引，不填时表示不进行缓存
     */
    cache(index?: string): void;

    /**
     * 清除指定或所有缓存
     * @param index 要清除的缓存，不填代表清除所有
     */
    clearCache(index?: string): void;
}

export interface IRenderUpdater {
    /**
     * 更新这个渲染元素
     * @param item 触发更新事件的元素，可以是自身触发。如果不填表示手动触发，而非渲染内容发生变化而引起的触发
     */
    update(item?: RenderItem): void;
}

export interface ICanvasCachedRenderItem {
    /** 离屏画布，首先渲染到它上面，然后由Renderer渲染到最终画布上 */
    canvas: MotaOffscreenCanvas2D;
}

interface IRenderAnchor {
    anchorX: number;
    anchorY: number;

    /**
     * 设置渲染元素的位置锚点
     * @param x 锚点的横坐标，小数，0表示最左边，1表示最右边
     * @param y 锚点的纵坐标，小数，0表示最上边，1表示最下边
     */
    setAnchor(x: number, y: number): void;
}

interface IRenderConfig {
    /** 是否是高清画布 */
    highResolution: boolean;
    /** 是否启用抗锯齿 */
    antiAliasing: boolean;

    /**
     * 设置当前渲染元素是否使用高清画布
     * @param hd 是否高清
     */
    setHD(hd: boolean): void;

    /**
     * 设置当前渲染元素是否启用抗锯齿
     * @param anti 是否抗锯齿
     */
    setAntiAliasing(anti: boolean): void;
}

export interface IRenderChildable {
    children: RenderItem[];

    /**
     * 向这个元素添加子元素
     * @param child 添加的元素
     */
    appendChild(...child: RenderItem[]): void;

    /**
     * 移除这个元素中的某个子元素
     * @param child 要移除的元素
     */
    removeChild(...child: RenderItem[]): void;

    /**
     * 对子元素进行排序
     */
    sortChildren(): void;
}

interface RenderItemEvent {
    beforeUpdate: (item?: RenderItem) => void;
    afterUpdate: (item?: RenderItem) => void;
    beforeRender: () => void;
    afterRender: () => void;
}

export abstract class RenderItem
    extends EventEmitter<RenderItemEvent>
    implements IRenderCache, IRenderUpdater, IRenderAnchor, IRenderConfig
{
    /** 渲染的全局ticker */
    static ticker: Ticker = new Ticker();
    /** 包括但不限于怪物、npc、自动元件的动画帧数 */
    static animatedFrame: number = 0;

    zIndex: number = 0;

    x: number = 0;
    y: number = 0;
    width: number = 200;
    height: number = 200;

    cacheList: Map<string, MotaOffscreenCanvas2D> = new Map();

    using?: string;
    writing?: string;

    anchorX: number = 0;
    anchorY: number = 0;

    /** 渲染模式，absolute表示绝对位置，static表示跟随摄像机移动，只对顶层元素有效 */
    type: 'absolute' | 'static' = 'static';
    /** 是否是高清画布 */
    highResolution: boolean = true;
    /** 是否抗锯齿 */
    antiAliasing: boolean = true;
    /** 是否被隐藏 */
    hidden: boolean = false;

    parent?: RenderItem & IRenderChildable;

    protected needUpdate: boolean = false;

    constructor() {
        super();

        // this.using = '@default';
    }

    /**
     * 渲染这个对象
     * @param canvas 渲染至的画布
     * @param ctx 渲染至的画布的渲染上下文
     * @param camera 渲染时使用的摄像机
     */
    abstract render(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        camera: Camera
    ): void;

    /**
     * 修改这个对象的大小
     */
    abstract size(width: number, height: number): void;

    /**
     * 修改这个对象的位置
     */
    abstract pos(x: number, y: number): void;

    useCache(index?: string): void {
        if (isNil(index)) {
            this.using = void 0;
            return;
        }
        if (!this.cacheList.has(index)) {
            this.writing = index;
        }
        this.using = index;
    }

    cache(index?: string): void {
        this.writing = index;
        this.using = index;
    }

    clearCache(index?: string): void {
        if (isNil(index)) {
            this.writing = void 0;
            this.using = void 0;
            this.cacheList.clear();
        } else {
            this.cacheList.delete(index);
        }
    }

    setAnchor(x: number, y: number): void {
        this.anchorX = x;
        this.anchorY = y;
    }

    update(item?: RenderItem): void {
        if (this.needUpdate) return;
        this.needUpdate = true;
        this.parent?.update(item);
    }

    setHD(hd: boolean): void {
        this.highResolution = hd;
        this.update(this);
    }

    setAntiAliasing(anti: boolean): void {
        this.antiAliasing = anti;
        this.update(this);
    }

    setZIndex(zIndex: number) {
        this.zIndex = zIndex;
        this.parent?.sortChildren?.();
    }

    /**
     * 隐藏这个元素
     */
    hide() {
        if (this.hidden) return;
        this.hidden = true;
        this.update(this);
    }

    /**
     * 显示这个元素
     */
    show() {
        if (!this.hidden) return;
        this.hidden = false;
        this.update(this);
    }

    /**
     * 从渲染树中移除这个节点
     */
    remove() {
        this.parent?.removeChild(this);
        this.parent = void 0;
    }

    /**
     * 摧毁这个渲染元素，摧毁后不应继续使用
     */
    destroy(): void {
        this.remove();
    }
}

interface RenderEvent {
    animateFrame: (frame: number, time: number) => void;
}

export const renderEmits = new EventEmitter<RenderEvent>();

Mota.require('var', 'hook').once('reset', () => {
    let lastTime = 0;
    RenderItem.ticker.add(time => {
        if (!core.isPlaying()) return;
        if (time - lastTime > core.values.animateSpeed) {
            RenderItem.animatedFrame++;
            lastTime = time;
            renderEmits.emit('animateFrame', RenderItem.animatedFrame, time);
        }
    });
});

export function withCacheRender(
    item: RenderItem & ICanvasCachedRenderItem,
    _canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    fn: RenderFunction
) {
    const { width, height } = item;
    const ax = width * item.anchorX;
    const ay = height * item.anchorY;
    let write = item.writing;
    if (!isNil(item.using) && isNil(item.writing)) {
        const cache = item.cacheList.get(item.using);
        if (cache) {
            ctx.drawImage(
                cache.canvas,
                item.x - ax,
                item.y - ay,
                item.width,
                item.height
            );
            return;
        }
        write = item.using;
    }
    const { canvas: c, ctx: ct } = item.canvas;
    ct.clearRect(0, 0, c.width, c.height);
    fn(item.canvas, camera);
    if (!isNil(write)) {
        const cache = item.cacheList.get(write);
        if (cache) {
            const { canvas, ctx } = cache;
            ctx.drawImage(c, 0, 0, canvas.width, canvas.height);
        } else {
            item.cacheList.set(write, MotaOffscreenCanvas2D.clone(item.canvas));
        }
    }

    ctx.drawImage(c, item.x - ax, item.y - ay, item.width, item.height);
}

export function transformCanvas(
    canvas: MotaOffscreenCanvas2D,
    camera: Camera,
    clear: boolean = false
) {
    const { canvas: ca, ctx, scale } = canvas;
    const mat = camera.mat;
    const a = mat[0] * scale;
    const b = mat[1] * scale;
    const c = mat[3] * scale;
    const d = mat[4] * scale;
    const e = mat[6] * scale;
    const f = mat[7] * scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (clear) {
        ctx.clearRect(0, 0, ca.width, ca.height);
    }
    ctx.translate(ca.width / 2, ca.height / 2);
    ctx.transform(a, b, c, d, e, f);
}
