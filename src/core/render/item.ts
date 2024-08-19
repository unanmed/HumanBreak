import { isNil } from 'lodash-es';
import { EventEmitter } from '../common/eventEmitter';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Camera } from './camera';
import { Ticker, TickerFn } from 'mutate-animate';

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

interface IRenderFrame {
    /**
     * 在下一帧渲染之前执行函数，常用于渲染前数据更新，理论上不应当用于渲染，不保证运行顺序
     * @param fn 执行的函数
     */
    requestBeforeFrame(fn: () => void): void;

    /**
     * 在下一帧渲染之后执行函数，理论上不应当用于渲染，不保证运行顺序
     * @param fn 执行的函数
     */
    requestAfterFrame(fn: () => void): void;

    /**
     * 在下一帧渲染时执行函数，理论上应当只用于渲染（即{@link RenderItem.update}方法），且不保证运行顺序
     * @param fn 执行的函数
     */
    requestRenderFrame(fn: () => void): void;
}

interface IRenderTickerSupport {
    /**
     * 委托ticker，让其在指定时间范围内每帧执行对应函数，超过时间后自动删除
     * @param fn 每帧执行的函数
     * @param time 函数持续时间，不填代表不会自动删除，需要手动删除
     * @param end 持续时间结束后执行的函数
     * @returns 委托id，可用于删除
     */
    delegateTicker(fn: TickerFn, time?: number, end?: () => void): number;

    /**
     * 移除ticker函数
     * @param id 函数id，也就是{@link IRenderTickerSupport.delegateTicker}的返回值
     * @param callEnd 是否调用结束函数，即{@link IRenderTickerSupport.delegateTicker}的end参数
     * @returns 是否删除成功，比如对应ticker不存在，就是删除失败
     */
    removeTicker(id: number, callEnd?: boolean): boolean;
}

interface RenderItemEvent {
    beforeUpdate: (item?: RenderItem) => void;
    afterUpdate: (item?: RenderItem) => void;
    beforeRender: () => void;
    afterRender: () => void;
}

interface TickerDelegation {
    fn: TickerFn;
    endFn?: () => void;
}

const beforeFrame: (() => void)[] = [];
const afterFrame: (() => void)[] = [];
const renderFrame: (() => void)[] = [];

// todo: 添加模型变换
export abstract class RenderItem
    extends EventEmitter<RenderItemEvent>
    implements
        IRenderCache,
        IRenderUpdater,
        IRenderAnchor,
        IRenderConfig,
        IRenderFrame,
        IRenderTickerSupport
{
    /** 渲染的全局ticker */
    static ticker: Ticker = new Ticker();
    /** 包括但不限于怪物、npc、自动元件的动画帧数 */
    static animatedFrame: number = 0;
    /** ticker委托映射 */
    static tickerMap: Map<number, TickerDelegation> = new Map();
    /** ticker委托id */
    static tickerId: number = 0;

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
     * @param camera 渲染时使用的摄像机
     */
    abstract render(canvas: MotaOffscreenCanvas2D, camera: Camera): void;

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

    requestBeforeFrame(fn: () => void): void {
        beforeFrame.push(fn);
    }

    requestAfterFrame(fn: () => void): void {
        afterFrame.push(fn);
    }

    requestRenderFrame(fn: () => void): void {
        renderFrame.push(fn);
    }

    delegateTicker(fn: TickerFn, time?: number, end?: () => void): number {
        const id = RenderItem.tickerId++;
        if (typeof time === 'number' && time === 0) return id;
        const delegation: TickerDelegation = {
            fn,
            endFn: end
        };
        RenderItem.tickerMap.set(id, delegation);
        RenderItem.ticker.add(fn);
        if (typeof time === 'number' && time < 2147438647 && time > 0) {
            setTimeout(() => {
                RenderItem.ticker.remove(fn);
                end?.();
            }, time);
        }
        return id;
    }

    removeTicker(id: number, callEnd: boolean = true): boolean {
        const delegation = RenderItem.tickerMap.get(id);
        if (!delegation) return false;
        RenderItem.ticker.remove(delegation.fn);
        if (callEnd) delegation.endFn?.();
        return true;
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
     * 将这个渲染元素添加到其他父元素上
     * @param parent 父元素
     */
    append(parent: IRenderChildable) {
        parent.appendChild(this);
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

RenderItem.ticker.add(() => {
    if (beforeFrame.length > 0) {
        const toEmit = beforeFrame.slice();
        beforeFrame.splice(0);
        toEmit.forEach(v => v());
    }
    if (renderFrame.length > 0) {
        const toEmit = renderFrame.slice();
        renderFrame.splice(0);
        toEmit.forEach(v => v());
    }
    if (afterFrame.length > 0) {
        const toEmit = afterFrame.slice();
        afterFrame.splice(0);
        toEmit.forEach(v => v());
    }
});

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
