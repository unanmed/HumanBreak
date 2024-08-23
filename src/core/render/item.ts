import { isNil } from 'lodash-es';
import { EventEmitter } from 'eventemitter3';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Ticker, TickerFn } from 'mutate-animate';
import { Transform } from './transform';

export type RenderFunction = (
    canvas: MotaOffscreenCanvas2D,
    transform: Transform
) => void;

export type RenderItemPosition = 'absolute' | 'static';

export interface IRenderUpdater {
    /**
     * 更新这个渲染元素
     * @param item 触发更新事件的元素，可以是自身触发。如果不填表示手动触发，而非渲染内容发生变化而引起的触发
     */
    update(item?: RenderItem): void;
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
    appendChild(...child: RenderItem<any>[]): void;

    /**
     * 移除这个元素中的某个子元素
     * @param child 要移除的元素
     */
    removeChild(...child: RenderItem<any>[]): void;

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

export interface ERenderItemEvent {
    beforeUpdate: [item?: RenderItem];
    afterUpdate: [item?: RenderItem];
    beforeRender: [transform: Transform];
    afterRender: [transform: Transform];
}

interface TickerDelegation {
    fn: TickerFn;
    endFn?: () => void;
}

const beforeFrame: (() => void)[] = [];
const afterFrame: (() => void)[] = [];
const renderFrame: (() => void)[] = [];

export abstract class RenderItem<E extends ERenderItemEvent = ERenderItemEvent>
    extends EventEmitter<ERenderItemEvent | E>
    implements
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

    /** 元素纵深，表示了遮挡关系 */
    zIndex: number = 0;

    width: number = 200;
    height: number = 200;

    // 渲染锚点，(0,0)表示左上角，(1,1)表示右下角
    anchorX: number = 0;
    anchorY: number = 0;

    /** 渲染模式，absolute表示绝对位置，static表示跟随摄像机移动 */
    type: 'absolute' | 'static' = 'static';
    /** 是否是高清画布 */
    highResolution: boolean = true;
    /** 是否抗锯齿 */
    antiAliasing: boolean = true;
    /** 是否被隐藏 */
    hidden: boolean = false;

    /** 当前元素的父元素 */
    parent?: RenderItem & IRenderChildable;

    protected needUpdate: boolean = false;

    /** 该渲染元素的模型变换矩阵 */
    transform: Transform = new Transform();

    /** 渲染缓存信息 */
    private cache: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();
    /** 是否需要更新缓存 */
    private cacheDirty: boolean = true;
    /** 是否启用缓存机制 */
    readonly enableCache: boolean = true;

    constructor(type: RenderItemPosition, enableCache: boolean = true) {
        super();

        this.enableCache = enableCache;
        this.type = type;
        this.cache.withGameScale(true);
    }

    /**
     * 渲染函数
     * @param canvas 渲染至的画布
     * @param transform 当前变换矩阵的，渲染时已经进行变换处理，不需要对画布再次进行变换处理
     *                  此参数可用于自己对元素进行变换处理，也会用于对子元素的处理。
     *                  例如对于`absolute`类型的元素，同时有对视角改变的需求，就可以通过此参数进行变换。
     *                  样板内置的`Layer`及`Damage`元素就是通过此方式实现的
     */
    protected abstract render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void;

    /**
     * 修改这个对象的大小
     */
    size(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.cache.size(width, height);
        this.cacheDirty = true;
        this.update(this);
    }

    /**
     * 渲染当前对象
     * @param canvas 渲染至的画布
     * @param transform 父元素的变换矩阵
     */
    renderContent(canvas: MotaOffscreenCanvas2D, transform: Transform) {
        if (this.hidden) return;
        this.emit('beforeRender', transform);
        this.needUpdate = false;
        const tran = this.transform;

        const ax = -this.anchorX * this.width;
        const ay = -this.anchorY * this.height;

        canvas.ctx.save();
        canvas.setAntiAliasing(this.antiAliasing);
        if (this.type === 'static') transformCanvas(canvas, tran);
        if (this.enableCache) {
            const { width, height, ctx } = this.cache;
            if (this.cacheDirty) {
                const { canvas } = this.cache;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                this.render(this.cache, tran);
                ctx.restore();
                this.cacheDirty = false;
            }

            canvas.ctx.drawImage(this.cache.canvas, ax, ay, width, height);
        } else {
            canvas.ctx.translate(ax, ay);
            this.render(canvas, tran);
        }
        canvas.ctx.restore();
        this.emit('afterRender', transform);
    }

    /**
     * 设置这个元素的位置，等效于`transform.setTranslate(x, y)`
     * @param x 横坐标
     * @param y 纵坐标
     */
    pos(x: number, y: number) {
        this.transform.setTranslate(x, y);
    }

    setAnchor(x: number, y: number): void {
        this.anchorX = x;
        this.anchorY = y;
    }

    update(item?: RenderItem<any>): void {
        if (this.needUpdate) return;
        this.needUpdate = true;
        this.cacheDirty = true;
        this.parent?.update(item);
    }

    setHD(hd: boolean): void {
        this.highResolution = hd;
        this.cache.setHD(hd);
        this.update(this);
    }

    setAntiAliasing(anti: boolean): void {
        this.antiAliasing = anti;
        this.cache.setAntiAliasing(anti);
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

export interface IAnimateFrame {
    updateFrameAnimate(frame: number, time: number): void;
}

interface RenderEvent {
    animateFrame: [frame: number, time: number];
}

class RenderEmits extends EventEmitter<RenderEvent> {
    private framer: Set<IAnimateFrame> = new Set();

    /**
     * 添加一个可更新帧动画的对象
     */
    addFramer(framer: IAnimateFrame) {
        this.framer.add(framer);
    }

    /**
     * 移除一个可更新帧动画的对象
     */
    removeFramer(framer: IAnimateFrame) {
        this.framer.delete(framer);
    }

    /**
     * 更新所有帧动画
     * @param frame 帧数
     * @param time 帧动画时刻
     */
    emitAnimateFrame(frame: number, time: number) {
        this.framer.forEach(v => v.updateFrameAnimate(frame, time));
        this.emit('animateFrame', frame, time);
    }
}

export const renderEmits = new RenderEmits();

Mota.require('var', 'hook').once('reset', () => {
    let lastTime = 0;
    RenderItem.ticker.add(time => {
        if (!core.isPlaying()) return;
        if (time - lastTime > core.values.animateSpeed) {
            RenderItem.animatedFrame++;
            lastTime = time;
            renderEmits.emitAnimateFrame(RenderItem.animatedFrame, time);
        }
    });
});

export function transformCanvas(
    canvas: MotaOffscreenCanvas2D,
    transform: Transform
) {
    const { ctx } = canvas;
    const mat = transform.mat;
    const [a, b, , c, d, , e, f] = mat;
    ctx.transform(a, b, c, d, e, f);
}
