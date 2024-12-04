import { isNil } from 'lodash-es';
import { EventEmitter } from 'eventemitter3';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Ticker, TickerFn } from 'mutate-animate';
import { Transform } from './transform';
import { logger } from '../common/logger';
import { ElementNamespace, ComponentInternalInstance } from 'vue';

export type RenderFunction = (
    canvas: MotaOffscreenCanvas2D,
    transform: Transform
) => void;

export type RenderItemPosition = 'absolute' | 'static';

export interface IRenderUpdater {
    /**
     * 更新这个渲染元素
     * @param item 触发更新事件的元素，不填默认为元素自身触发
     */
    update(item?: RenderItem): void;
}

interface IRenderAnchor {
    /** 锚点横坐标，0表示最左端，1表示最右端 */
    anchorX: number;
    /** 锚点纵坐标，0表示最上端，1表示最下端 */
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
    /** 当前元素的子元素 */
    children: Set<RenderItem>;

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
     * 在下一个tick的渲染前对子元素进行排序
     */
    requestSort(): void;
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
     * @param callEnd 是否调用结束函数，即{@link IRenderTickerSupport.delegateTicker}的end参数，默认调用
     * @returns 是否删除成功，比如对应ticker不存在，就是删除失败
     */
    removeTicker(id: number, callEnd?: boolean): boolean;

    /**
     * 检查是否包含一个委托函数
     * @param id 函数id
     */
    hasTicker(id: number): boolean;
}

interface IRenderVueSupport {
    /**
     * 在 jsx, vue 中当属性改变后触发此函数，用于处理响应式等情况
     * @param key 属性键名
     * @param prevValue 该属性先前的数值
     * @param nextValue 该属性当前的数值
     * @param namespace 元素命名空间
     * @param parentComponent 元素的父组件
     */
    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void;
}

export interface ERenderItemEvent {
    beforeUpdate: [item?: RenderItem];
    afterUpdate: [item?: RenderItem];
    beforeRender: [transform: Transform];
    afterRender: [transform: Transform];
    destroy: [];
    /** 当这个元素被点击时触发 */
    clickCapture: [x: number, y: number, type: number, ev: MouseEvent];
}

interface TickerDelegation {
    fn: TickerFn;
    timeout?: number;
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
        IRenderTickerSupport,
        IRenderChildable,
        IRenderVueSupport
{
    /** 渲染的全局ticker */
    static ticker: Ticker = new Ticker();
    /** 包括但不限于怪物、npc、自动元件的动画帧数 */
    static animatedFrame: number = 0;
    /** ticker委托映射 */
    static tickerMap: Map<number, TickerDelegation> = new Map();
    /** ticker委托id */
    static tickerId: number = 0;

    /** id到渲染元素的映射 */
    static itemMap: Map<string, RenderItem> = new Map();

    private _id: string = '';

    get id(): string {
        return this._id;
    }
    set id(v: string) {
        if (this.isRoot || this.findRoot()) {
            if (RenderItem.itemMap.has(this._id)) {
                logger.warn(23, this._id);
                RenderItem.itemMap.delete(this._id);
            }
            RenderItem.itemMap.set(v, this);
        }
        this._id = v;
    }

    /** 元素纵深，表示了遮挡关系 */
    zIndex: number = 0;

    width: number = 200;
    height: number = 200;

    // 渲染锚点，(0,0)表示左上角，(1,1)表示右下角
    anchorX: number = 0;
    anchorY: number = 0;

    /** 渲染模式，absolute表示绝对位置，static表示跟随摄像机移动 */
    type: RenderItemPosition = 'static';
    /** 是否是高清画布 */
    highResolution: boolean = true;
    /** 是否抗锯齿 */
    antiAliasing: boolean = true;
    /** 是否被隐藏 */
    hidden: boolean = false;
    /** 滤镜 */
    filter: string = 'none';
    /** 混合方式 */
    composite: GlobalCompositeOperation = 'source-over';
    /** 不透明度 */
    alpha: number = 1;

    private _parent?: RenderItem;
    /** 当前元素的父元素 */
    get parent() {
        return this._parent;
    }
    /** 当前元素是否为根元素 */
    readonly isRoot: boolean = false;

    protected needUpdate: boolean = false;

    /** 该元素的变换矩阵 */
    transform: Transform = new Transform();

    /** 该渲染元素的子元素 */
    children: Set<RenderItem<ERenderItemEvent>> = new Set();

    get x() {
        return this.transform.x;
    }
    get y() {
        return this.transform.y;
    }

    /** 渲染缓存信息 */
    protected cache: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();
    /** 是否需要更新缓存 */
    protected cacheDirty: boolean = true;
    /** 是否启用缓存机制 */
    readonly enableCache: boolean = true;
    /** 是否启用transform下穿机制，即画布的变换是否会继续作用到下一层画布 */
    readonly transformFallThrough: boolean = false;

    constructor(
        type: RenderItemPosition,
        enableCache: boolean = true,
        transformFallThrough: boolean = false
    ) {
        super();

        this.enableCache = enableCache;
        this.transformFallThrough = transformFallThrough;
        this.type = type;

        this.transform.bind(this);
        this.cache.withGameScale(true);
    }

    private findRoot() {
        let ele: RenderItem = this;
        while (!ele.isRoot) {
            if (!ele.parent) {
                return null;
            } else {
                ele = ele.parent;
            }
        }
        return ele;
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
        const tran = this.transformFallThrough ? transform : this.transform;

        const ax = -this.anchorX * this.width;
        const ay = -this.anchorY * this.height;

        const ctx = canvas.ctx;
        ctx.save();
        canvas.setAntiAliasing(this.antiAliasing);
        if (this.enableCache) canvas.ctx.filter = this.filter;
        if (this.type === 'static') transformCanvas(canvas, tran);
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = this.composite;
        if (this.enableCache) {
            const { width, height, ctx } = this.cache;
            if (this.cacheDirty) {
                const { canvas } = this.cache;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.render(this.cache, tran);
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
        this.update();
    }

    /**
     * 设置本元素的滤镜
     * @param filter 滤镜
     */
    setFilter(filter: string) {
        this.filter = filter;
        this.update(this);
    }

    /**
     * 设置本元素渲染时的混合方式
     * @param composite 混合方式
     */
    setComposite(composite: GlobalCompositeOperation) {
        this.composite = composite;
        this.update();
    }

    /**
     * 设置本元素的不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number) {
        this.alpha = alpha;
        this.update();
    }

    /**
     * 获取当前元素的绝对位置（不建议使用，因为应当很少会有获取绝对位置的需求）
     */
    getAbsolutePosition(): LocArr {
        const { x, y } = this.transform;
        if (!this.parent) return [x, y];
        else {
            const [px, py] = this.parent.getAbsolutePosition();
            return [x + px, y + py];
        }
    }

    setAnchor(x: number, y: number): void {
        this.anchorX = x;
        this.anchorY = y;
    }

    update(item: RenderItem<any> = this): void {
        if (this.needUpdate || this.hidden) return;
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
        this.parent?.requestSort();
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
            delegation.timeout = window.setTimeout(() => {
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
        window.clearTimeout(delegation.timeout);
        if (callEnd) delegation.endFn?.();
        RenderItem.tickerMap.delete(id);
        return true;
    }

    hasTicker(id: number): boolean {
        return RenderItem.tickerMap.has(id);
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
    append(parent: RenderItem) {
        this.remove();
        parent.children.add(this);
        this._parent = parent;
        parent.requestSort();
        this.needUpdate = false;
        this.update();
        if (this._id !== '') {
            const root = this.findRoot();
            if (!root) return;
            RenderItem.itemMap.set(this._id, this);
        }
    }

    /**
     * 从渲染树中移除这个节点
     */
    remove(): boolean {
        if (!this.parent) return false;
        const parent = this.parent;
        const success = parent.children.delete(this);
        this._parent = void 0;
        parent.requestSort();
        parent.update();
        if (!success) return false;
        RenderItem.itemMap.delete(this._id);
        return true;
    }

    /**
     * 添加子元素，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     * @param child 子元素
     */
    appendChild(...child: RenderItem<any>[]): void {
        logger.warn(35);
    }

    /**
     * 移除子元素，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     * @param child 子元素
     */
    removeChild(...child: RenderItem<any>[]): void {
        logger.warn(36);
    }

    /**
     * 申请对元素进行排序，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     */
    requestSort(): void {
        logger.warn(37);
    }

    /**
     * 判断一个prop是否是期望类型
     * @param value 实际值
     * @param expected 期望类型
     * @param key 键名
     */
    protected assertType(
        value: any,
        expected: string | (new (...params: any[]) => any),
        key: string
    ) {
        if (typeof expected === 'string') {
            const type = typeof value;
            if (type !== expected) {
                logger.warn(21, key, expected, type);
                return false;
            } else {
                return true;
            }
        } else {
            if (value instanceof expected) {
                return true;
            } else {
                logger.warn(
                    21,
                    key,
                    expected.name,
                    value?.constructor?.name ?? typeof value
                );
                return false;
            }
        }
    }

    /**
     * 解析事件key
     * @param key 键名
     * @returns 返回字符串表示解析后的键名，返回布尔值表示不是事件
     */
    protected parseEvent(key: string): string | false {
        if (key.startsWith('on')) {
            const code = key.charCodeAt(2);
            if (code >= 65 && code <= 90) {
                return key[2].toLowerCase() + key.slice(3);
            }
        }
        return false;
    }

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
            case 'x': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.pos(nextValue, this.transform.y);
                return;
            }
            case 'y': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.pos(this.transform.x, nextValue);
                return;
            }
            case 'anchorX': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAnchor(nextValue, this.anchorY);
                return;
            }
            case 'anchorY': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAnchor(this.anchorX, nextValue);
                return;
            }
            case 'zIndex': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setZIndex(nextValue);
                return;
            }
            case 'width': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.size(nextValue, this.height);
                return;
            }
            case 'height': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.size(this.width, nextValue);
                return;
            }
            case 'filter': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setFilter(this.filter);
                return;
            }
            case 'hd': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.setHD(nextValue);
                return;
            }
            case 'antiAliasing': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.setAntiAliasing(nextValue);
                return;
            }
            case 'hidden': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                if (nextValue) this.hide();
                else this.show();
                return;
            }
            case 'transform': {
                if (!this.assertType(nextValue, Transform, key)) return;
                this.transform = nextValue;
                this.update();
                return;
            }
            case 'type': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.type = nextValue;
                this.update();
                return;
            }
            case 'id': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.id = nextValue;
                return;
            }
            case 'alpha': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.setAlpha(nextValue);
                return;
            }
            case 'composite': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.setComposite(nextValue);
                return;
            }
        }
        const ev = this.parseEvent(key);
        if (ev) {
            if (prevValue) {
                this.off(ev as keyof ERenderItemEvent, prevValue);
            }
            this.on(ev as keyof ERenderItemEvent, nextValue);
        }
    }

    /**
     * 摧毁这个渲染元素，摧毁后不应继续使用
     */
    destroy(): void {
        this.remove();
        this.emit('destroy');
        this.removeAllListeners();
        this.cache.delete();
        RenderItem.itemMap.delete(this._id);
    }
}

RenderItem.ticker.add(() => {
    // slice 是为了让函数里面的 request 进入下一帧执行
    if (beforeFrame.length > 0) {
        const arr = beforeFrame.slice();
        beforeFrame.splice(0);
        arr.forEach(v => v());
    }
    if (renderFrame.length > 0) {
        const arr = renderFrame.slice();
        renderFrame.splice(0);
        arr.forEach(v => v());
    }
    if (afterFrame.length > 0) {
        const arr = afterFrame.slice();
        afterFrame.splice(0);
        arr.forEach(v => v());
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
