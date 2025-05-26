import { isNil } from 'lodash-es';
import { EventEmitter } from 'eventemitter3';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { Ticker, TickerFn } from 'mutate-animate';
import { ITransformUpdatable, Transform } from './transform';
import { logger } from '@motajs/common';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { transformCanvas } from './utils';
import {
    ActionEventMap,
    ActionType,
    ERenderItemActionEvent,
    eventNameMap,
    EventProgress,
    IActionEvent,
    MouseType
} from './event';
import { vec3 } from 'gl-matrix';

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

export interface IRenderAnchor {
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

export interface IRenderConfig {
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

export interface IRenderFrame {
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

export interface IRenderTickerSupport {
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

export interface IRenderEvent {
    /**
     * 当触发缩放事件时，此函数执行的内容
     * @param scale 缩放至的缩放比
     */
    onResize(scale: number): void;
}

export interface IRenderVueSupport {
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

export interface IRenderTreeRoot {
    readonly isRoot: true;

    /**
     * 将一个渲染元素连接到此根元素
     * @param item 要连接到此根元素的渲染元素
     */
    connect(item: RenderItem): void;

    /**
     * 将已连接的渲染元素从此根元素中去掉
     * @param item 要取消连接的渲染元素
     */
    disconnect(item: RenderItem): void;

    /**
     * 修改已连接的元素的 id
     * @param item 修改了 id 的元素
     * @param previous 先前的元素 id
     * @param current 现在的元素 id
     */
    modifyId(item: RenderItem, previous: string, current: string): void;

    /**
     * 获取渲染至的目标画布，即显示在画面上的画布
     */
    getCanvas(): HTMLCanvasElement;

    /**
     * 当鼠标覆盖在某个元素上时执行
     * @param element 鼠标覆盖的元素
     */
    hoverElement(element: RenderItem): void;
}

interface RenderItemCanvasData {
    autoScale: boolean;
}

export interface ERenderItemEvent extends ERenderItemActionEvent {
    beforeRender: [transform: Transform];
    afterRender: [transform: Transform];
    destroy: [];
    transform: [item: RenderItem, transform: Transform];
}

interface TickerDelegation {
    fn: TickerFn;
    timeout?: number;
    endFn?: () => void;
}

const beforeFrame: (() => void)[] = [];
const afterFrame: (() => void)[] = [];
const renderFrame: (() => void)[] = [];

let count = 0;
export abstract class RenderItem<E extends ERenderItemEvent = ERenderItemEvent>
    extends EventEmitter<ERenderItemEvent | E>
    implements
        IRenderUpdater,
        IRenderAnchor,
        IRenderConfig,
        IRenderFrame,
        IRenderTickerSupport,
        IRenderChildable,
        IRenderVueSupport,
        ITransformUpdatable,
        IRenderEvent
{
    /** 渲染的全局ticker */
    static ticker: Ticker = new Ticker();
    /** 包括但不限于怪物、npc、自动元件的动画帧数 */
    static animatedFrame: number = 0;
    /** ticker委托映射 */
    static tickerMap: Map<number, TickerDelegation> = new Map();
    /** ticker委托id */
    static tickerId: number = 0;

    readonly uid: number = count++;

    //#region 元素属性

    /** 是否是注释元素 */
    readonly isComment: boolean = false;

    private _id: string = '';
    /**
     * 元素的 id，原则上不可重复
     */
    get id(): string {
        return this._id;
    }
    set id(v: string) {
        this.checkRoot();
        const prev = this._id;
        this._id = v;
        this._root?.modifyId(this, prev, v);
    }

    /** 元素纵深，表示了遮挡关系 */
    zIndex: number = 0;

    width: number = 200;
    height: number = 200;

    /** 渲染锚点，(0,0)表示左上角，(1,1)表示右下角 */
    anchorX: number = 0;
    /** 渲染锚点，(0,0)表示左上角，(1,1)表示右下角 */
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
    /** 缩放比 */
    protected scale: number = 1;

    /** 鼠标覆盖在此元素上时的光标样式 */
    cursor: string = 'inherit';
    /** 该元素是否忽略交互事件 */
    noEvent: boolean = false;

    get x() {
        return this._transform.x;
    }
    get y() {
        return this._transform.y;
    }

    /** 该元素的变换矩阵 */
    private _transform: Transform = new Transform();
    set transform(value: Transform) {
        this._transform.bind();
        this._transform = value;
        value.bind(this);
    }
    get transform() {
        return this._transform;
    }

    //#endregion

    //#region 父子关系

    private _parent?: RenderItem;
    /** 当前元素的父元素 */
    get parent() {
        return this._parent;
    }
    /** 当前元素是否为根元素，如果是根元素，那么必须实现 `IRenderTreeRoot` 接口 */
    readonly isRoot: boolean = false;

    private _root?: RenderItem & IRenderTreeRoot;
    get root() {
        return this._root;
    }

    /** 当前元素是否已经连接至任意根元素 */
    get connected() {
        return !!this._root;
    }

    /** 该渲染元素的子元素 */
    children: Set<RenderItem<ERenderItemEvent>> = new Set();

    //#endregion

    //#region 渲染配置与缓存
    /** 渲染缓存信息 */
    protected cache: MotaOffscreenCanvas2D;
    /** 是否需要更新缓存 */
    protected cacheDirty: boolean = false;
    /** 是否启用缓存机制 */
    readonly enableCache: boolean = true;
    /** 是否启用transform下穿机制，即画布的变换是否会继续作用到下一层画布 */
    readonly transformFallThrough: boolean = false;
    /** 这个渲染元素使用到的所有画布 */
    protected readonly canvases: Set<MotaOffscreenCanvas2D> = new Set();
    /** 这个渲染元素每个画布的配置信息 */
    private readonly canvasMap: Map<
        MotaOffscreenCanvas2D,
        RenderItemCanvasData
    > = new Map();
    //#endregion

    //#region 交互事件

    /** 是否调用了 `ev.stopPropagation` */
    protected propagationStoped: Map<ActionType, boolean> = new Map();
    /** 捕获阶段缓存的事件对象 */
    private cachedEvent: Map<ActionType, IActionEvent> = new Map();
    /** 下穿模式下当前下穿过来的变换矩阵 */
    private fallTransform?: Transform;
    /** 是否在元素内 */
    private inElement: boolean = false;
    /** 鼠标标识符映射，键为按下的鼠标按键类型，值表示本次操作的唯一标识符，在按下、移动、抬起过程中保持一致 */
    protected mouseId: Map<MouseType, number> = new Map();
    /** 当前所有的触摸标识符 */
    readonly touchId: Set<number> = new Set();

    //#endregion

    //#region debug

    /** 是否需要禁用更新，如果出现更新，那么发出警告并停止更新操作 */
    private forbidUpdate: boolean = false;

    //#endregion

    constructor(
        type: RenderItemPosition,
        enableCache: boolean = true,
        transformFallThrough: boolean = false
    ) {
        super();

        this.enableCache = enableCache;
        this.transformFallThrough = transformFallThrough;
        this.type = type;

        this._transform.bind(this);
        this.cache = this.requireCanvas();
        if (!enableCache) {
            this.cache.size(1, 1);
            this.deleteCanvas(this.cache);
        }
    }

    /**
     * 渲染函数
     * @param canvas 渲染至的画布
     * @param transform 当前变换矩阵的，渲染时已经进行变换处理，不需要对画布再次进行变换处理。
     *                  此参数可用于自己对元素进行变换处理，也会用于对子元素的处理。
     *                  例如对于`absolute`类型的元素，同时有对视角改变的需求，就可以通过此参数进行变换。
     *                  样板内置的`Layer`及`Damage`元素就是通过此方式实现的
     */
    protected abstract render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void;

    /**
     * 渲染当前对象
     * @param canvas 渲染至的画布
     * @param transform 由父元素传递过来的变换矩阵
     */
    renderContent(canvas: MotaOffscreenCanvas2D, transform: Transform) {
        if (this.hidden) return;
        this.forbidUpdate = true;
        this.emit('beforeRender', transform);
        if (this.transformFallThrough) {
            this.fallTransform = transform;
        }
        const tran = this.transformFallThrough ? transform : this._transform;

        const ax = -this.anchorX * this.width;
        const ay = -this.anchorY * this.height;

        const ctx = canvas.ctx;
        ctx.save();
        canvas.setAntiAliasing(this.antiAliasing);
        if (this.type === 'static') transformCanvas(canvas, tran);
        ctx.filter = this.filter;
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
            this.cacheDirty = false;
            canvas.ctx.translate(ax, ay);
            this.render(canvas, tran);
        }
        ctx.restore();
        this.emit('afterRender', transform);
        this.forbidUpdate = false;
    }

    /**
     * 申请一个 `MotaOffscreenCanvas2D`，即申请一个画布
     * @param alpha 是否启用画布的 alpha 通道
     * @param autoScale 是否自动跟随缩放
     */
    requireCanvas(alpha: boolean = true, autoScale: boolean = true) {
        const canvas = new MotaOffscreenCanvas2D(alpha);
        canvas.setScale(this.scale);
        this.canvases.add(canvas);
        this.canvasMap.set(canvas, { autoScale });
        return canvas;
    }

    /**
     * 删除由 `requireCanvas` 申请的画布，当画布不再使用时，可以用该方法删除画布
     * @param canvas 要删除的画布
     */
    deleteCanvas(canvas: MotaOffscreenCanvas2D) {
        this.canvases.delete(canvas);
        this.canvasMap.delete(canvas);
    }

    //#region 事件处理

    onResize(scale: number): void {
        this.scale = scale;
        this.canvases.forEach(v => {
            if (this.canvasMap.get(v)?.autoScale) {
                v.setScale(scale);
            }
        });
        this.update();
    }

    /**
     * 获取当前元素的缩放比，它与根元素应当保持一致
     */
    getScale() {
        return this.scale;
    }

    //#region 修改元素属性

    /**
     * 修改这个对象的大小
     */
    size(width: number, height: number): void {
        this.width = width;
        this.height = height;
        if (this.enableCache) {
            this.cache.size(width, height);
        }
        this.update(this);
    }

    /**
     * 设置这个元素的位置，等效于`transform.setTranslate(x, y)`
     * @param x 横坐标
     * @param y 纵坐标
     */
    pos(x: number, y: number) {
        // 这个函数会调用 update，因此不再手动调用 update
        this._transform.setTranslate(x, y);
    }

    /**
     * 设置本元素的滤镜
     * @param filter 滤镜
     */
    setFilter(filter: string) {
        this.filter = filter;
        // 设置滤镜时，不需要更新自身的缓存，直接调用父元素的更新即可
        this._parent?.update();
    }

    /**
     * 设置本元素渲染时的混合方式
     * @param composite 混合方式
     */
    setComposite(composite: GlobalCompositeOperation) {
        this.composite = composite;
        // 设置混合模式时，不需要更新自身的缓存，直接调用父元素的更新即可
        this._parent?.update();
    }

    /**
     * 设置本元素的不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number) {
        this.alpha = alpha;
        // 设置不透明度时，不需要更新自身的缓存，直接调用父元素的更新即可
        this._parent?.update();
    }

    setHD(hd: boolean): void {
        this.highResolution = hd;
        if (this.enableCache) {
            this.cache.setHD(hd);
        }
        this.update(this);
    }

    setAntiAliasing(anti: boolean): void {
        this.antiAliasing = anti;
        if (this.enableCache) {
            this.cache.setAntiAliasing(anti);
        }
        this.update(this);
    }

    setZIndex(zIndex: number) {
        this.zIndex = zIndex;
        this.parent?.requestSort();
    }

    setAnchor(x: number, y: number): void {
        this.anchorX = x;
        this.anchorY = y;
        // 设置锚点时，不需要更新自身的缓存，直接调用父元素的更新即可
        this._parent?.update();
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
        this.refreshAllChildren();
    }

    //#endregion

    //#region 功能方法

    /**
     * 获取当前元素的绝对位置（不建议使用，因为应当很少会有获取绝对位置的需求）
     */
    getAbsolutePosition(x: number = 0, y: number = 0): [number, number] {
        if (this.type === 'absolute') {
            if (this.parent) return this.parent.getAbsolutePosition(0, 0);
            else return [0, 0];
        }
        const [px, py] = this._transform.transformed(x, y);
        if (!this.parent) return [px, py];
        else {
            const [px, py] = this.parent.getAbsolutePosition();
            return [x + px, y + py];
        }
    }

    /**
     * 获取到可以包围这个元素的最小矩形，相对于父元素
     */
    getBoundingRect(): DOMRectReadOnly {
        if (this.type === 'absolute') {
            return new DOMRectReadOnly(0, 0, this.width, this.height);
        }
        const tran = this.transformFallThrough
            ? this.fallTransform
            : this._transform;
        if (!tran) return new DOMRectReadOnly(0, 0, this.width, this.height);
        const [x1, y1] = tran.transformed(
            -this.anchorX * this.width,
            -this.anchorY * this.height
        );
        const [x2, y2] = tran.transformed(
            this.width * (1 - this.anchorX),
            -this.anchorY * this.height
        );
        const [x3, y3] = tran.transformed(
            -this.anchorX * this.width,
            this.height * (1 - this.anchorY)
        );
        const [x4, y4] = tran.transformed(
            this.width * (1 - this.anchorX),
            this.height * (1 - this.anchorY)
        );
        const left = Math.min(x1, x2, x3, x4);
        const right = Math.max(x1, x2, x3, x4);
        const top = Math.min(y1, y2, y3, y4);
        const bottom = Math.max(y1, y2, y3, y4);
        return new DOMRectReadOnly(left, top, right - left, bottom - top);
    }

    update(item: RenderItem<any> = this): void {
        if (import.meta.env.DEV) {
            if (this.forbidUpdate) {
                logger.warn(61, this.constructor.name, this.uid.toString());
            }
        }
        if (this._parent) {
            if (this.cacheDirty && this._parent.cacheDirty) return;
            this.cacheDirty = true;
            if (this.hidden) return;
            this._parent.update(item);
        } else {
            if (this.cacheDirty) return;
            this.cacheDirty = true;
        }
    }

    updateTransform() {
        // 更新变换矩阵时，不需要更新自身的缓存，直接调用父元素的更新即可
        this._parent?.update();
        this.emit('transform', this, this._transform);
    }

    //#endregion

    //#region 动画帧与 ticker

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
        if (typeof time === 'number' && time < 2147438647 && time > 0) {
            delegation.timeout = window.setTimeout(() => {
                RenderItem.tickerMap.delete(id);
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

    //#endregion

    //#region 父子关系

    setRoot(item: RenderItem & IRenderTreeRoot) {
        this._root?.disconnect(this);
        this._root = item;
        item.connect(item);
    }

    checkRoot(): RenderItem | null {
        if (this._root) return this._root;
        if (this.isRoot) return this;
        let ele: RenderItem = this;
        while (!ele.isRoot) {
            if (ele._root) {
                this._root = ele._root;
                return this._root;
            }
            if (!ele._parent) {
                return null;
            } else {
                ele = ele._parent;
            }
        }
        this._root = ele as RenderItem & IRenderTreeRoot;
        return ele;
    }

    /**
     * 刷新所有子元素
     */
    refreshAllChildren() {
        if (this.children.size > 0) {
            const stack: RenderItem[] = [this];
            while (stack.length > 0) {
                const item = stack.pop();
                if (!item) continue;
                item.cacheDirty = true;
                item.children.forEach(v => stack.push(v));
            }
        }
        this.update(this);
    }

    /**
     * 将这个渲染元素添加到其他父元素上
     * @param parent 父元素
     */
    appendTo(parent: RenderItem) {
        this.remove();
        parent.children.add(this);
        this._parent = parent;
        parent.requestSort();
        this.update();
        this.checkRoot();
        this._root?.connect(this);
        this._transform.bind(this);
        this.onResize(parent.scale);
    }

    /**
     * 从渲染树中移除这个节点
     * @returns 是否移除成功
     */
    remove(): boolean {
        if (!this.parent) return false;
        const parent = this.parent;
        const success = parent.children.delete(this);
        this._parent = void 0;
        parent.requestSort();
        parent.update();
        this._transform.bind();
        if (!success) return false;
        this._root?.disconnect(this);
        this._root = void 0;
        return true;
    }

    /**
     * 添加子元素，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     * @param child 子元素
     */
    appendChild(..._child: RenderItem<any>[]): void {
        logger.warn(35);
    }

    /**
     * 移除子元素，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     * @param child 子元素
     */
    removeChild(..._child: RenderItem<any>[]): void {
        logger.warn(36);
    }

    /**
     * 申请对元素进行排序，默认没有任何行为且会抛出警告，你需要在自己的RenderItem继承类中复写它，才可以使用
     */
    requestSort(): void {
        logger.warn(37);
    }

    //#endregion

    //#region 交互事件

    /**
     * 根据事件类型和事件阶段获取事件名称
     * @param type 事件类型
     * @param progress 事件阶段
     */
    getEventName(
        type: ActionType,
        progress: EventProgress
    ): keyof ERenderItemActionEvent {
        if (type === ActionType.Enter || type === ActionType.Leave) {
            return eventNameMap[type];
        } else if (progress === EventProgress.Capture) {
            return `${eventNameMap[type]}Capture` as keyof ERenderItemActionEvent;
        } else {
            return eventNameMap[type];
        }
    }

    /**
     * 传递事件，即将事件传递给父元素或子元素等，可以通过 override 来实现自己的事件传递，
     * 例如 Container 元素就需要在捕获阶段将事件传递给所有子元素，
     * 默认行为是，捕获阶段触发自身冒泡，冒泡阶段触发父元素冒泡，适用于大部分不包含子元素的元素
     * @param type 事件类型
     * @param progress 事件阶段，捕获阶段或冒泡阶段
     * @param event 正在处理的事件对象
     */
    protected propagateEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): void {
        if (progress === EventProgress.Capture) {
            this.bubbleEvent(type, event);
        } else {
            this.parent?.bubbleEvent(type, event);
        }
    }

    private handleEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ) {
        const ev = this.processEvent(type, progress, event);
        if (ev) {
            const name = this.getEventName(type, progress);
            this.emit(name, ev);
            if (!this.propagationStoped.get(type)) {
                this.propagateEvent(type, progress, ev);
            }
        }
        this.propagationStoped.set(type, false);
        return ev;
    }

    /**
     * 捕获事件
     * @param type 事件类型
     * @param event 由父元素传递来的事件
     */
    captureEvent<T extends ActionType>(type: T, event: ActionEventMap[T]) {
        return this.handleEvent(type, EventProgress.Capture, event);
    }

    /**
     * 冒泡事件
     * @param type 事件类型
     * @param event 由子元素传递来的事件
     */
    bubbleEvent<T extends ActionType>(type: T, event: ActionEventMap[T]) {
        return this.handleEvent(type, EventProgress.Bubble, event);
    }

    /**
     * 处理事件，用于根据上一级传递的事件内容生成新的事件内容，并执行一些事件的默认行为
     * @param type 事件类型
     * @param progress 事件阶段，捕获阶段还是冒泡阶段
     * @param event 由上一级（捕获阶段的父元素，冒泡阶段的子元素）传递来的事件内容
     */
    protected processEvent<T extends ActionType>(
        type: T,
        progress: EventProgress,
        event: ActionEventMap[T]
    ): ActionEventMap[T] | null {
        if (this.noEvent) return null;
        if (progress === EventProgress.Capture) {
            // 捕获阶段需要计算鼠标位置
            const tran = this.transformFallThrough
                ? this.fallTransform
                : this._transform;
            if (!tran) return null;
            const [nx, ny] = this.calActionPosition(event, tran);
            const inElement = this.isActionInElement(nx, ny);
            // 在元素范围内，执行事件
            const newEvent: ActionEventMap[T] = {
                ...event,
                offsetX: nx,
                offsetY: ny,
                target: this,
                stopPropagation: () => {
                    this.propagationStoped.set(type, true);
                }
            };
            this.inElement = inElement;
            if (!this.processCapture(type, newEvent, inElement)) return null;
            this.cachedEvent.set(type, newEvent);
            return newEvent;
        } else {
            const newEvent = this.cachedEvent.get(type) as ActionEventMap[T];
            this.processBubble(type, newEvent, this.inElement);
            this.cachedEvent.delete(type);
            return newEvent;
        }
    }

    /**
     * 处理捕获阶段的事件，可以通过 override 来添加新内容，注意调用 `super.processCapture` 来执行默认行为
     * @param type 事件类型
     * @param event 正在处理的事件对象
     * @param inElement 当前鼠标是否在元素内
     * @returns 是否继续传递事件
     */
    protected processCapture<T extends ActionType>(
        type: T,
        event: ActionEventMap[T],
        inElement: boolean
    ): boolean {
        switch (type) {
            case ActionType.Move: {
                if (inElement) {
                    this._root?.hoverElement(this);
                }
                break;
            }
            case ActionType.Down: {
                // 记录标识符，用于判定 click
                if (!inElement) return false;
                if (event.touch) {
                    this.touchId.add(event.identifier);
                } else {
                    this.mouseId.set(event.type, event.identifier);
                }
                break;
            }
            case ActionType.Click: {
                if (!inElement) return false;
                if (event.touch) {
                    if (!this.touchId.has(event.identifier)) {
                        return false;
                    }
                    this.touchId.delete(event.identifier);
                } else {
                    if (this.mouseId.get(event.type) !== event.identifier) {
                        this.mouseId.delete(event.type);
                        return false;
                    }
                    this.mouseId.delete(event.type);
                }
                break;
            }
        }

        return inElement;
    }

    /**
     * 处理冒泡阶段的事件，可以通过 override 来添加新内容，注意调用 `super.processBubble` 来执行默认行为
     * @param type 事件类型
     * @param event 正在处理的事件对象
     * @param inElement 当前鼠标是否在元素内
     * @returns 是否继续传递事件
     */
    protected processBubble<T extends ActionType>(
        type: T,
        _event: ActionEventMap[T],
        inElement: boolean
    ): boolean {
        switch (type) {
            case ActionType.Enter:
            case ActionType.Leave:
                return false;
        }
        return inElement;
    }

    /**
     * 计算一个点击事件在该元素上的位置
     * @param event 触发的事件
     * @param transform 当前的变换矩阵
     */
    protected calActionPosition(
        event: IActionEvent,
        transform: Transform
    ): vec3 {
        const ax = this.anchorX * this.width;
        const ay = this.anchorY * this.height;
        if (this.type === 'absolute') {
            return [event.offsetX + ax, event.offsetY + ay, 0];
        } else {
            const [tx, ty] = transform.untransformed(
                event.offsetX,
                event.offsetY
            );
            return [tx + ax, ty + ay, 0];
        }
    }

    /**
     * 判断一个点击事件是否在元素内，可以通过 override 来修改其行为
     * @param x 横坐标
     * @param y 纵坐标
     */
    protected isActionInElement(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    actionClick() {}

    actionDown() {}

    actionUp() {}

    actionMove() {}

    actionEnter() {}

    actionLeave() {}

    actionWheel() {}

    //#endregion

    //#region vue支持 props处理

    /**
     * 判断一个prop是否是期望类型
     * @param value 实际值
     * @param expected 期望类型
     * @param key 键名
     */
    protected assertType(value: any, expected: string, key: string): boolean;
    /**
     * 判断一个prop是否是期望类型
     * @param value 实际值
     * @param expected 期望类型
     * @param key 键名
     */
    protected assertType<T>(
        value: any,
        expected: new (...params: any[]) => T,
        key: string
    ): value is T;
    protected assertType(
        value: any,
        expected: string | (new (...params: any[]) => any),
        key: string
    ) {
        if (typeof expected === 'string') {
            const type = typeof value;
            if (type !== expected) {
                logger.error(21, key, expected, type);
                return false;
            } else {
                return true;
            }
        } else {
            if (value instanceof expected) {
                return true;
            } else {
                logger.error(
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

    /**
     * 自定义处理 props，自定义元素需要 override 此函数来处理 props
     * @param key 传入的 props 的键名
     * @param prevValue 这个 props 之前的值
     * @param nextValue 这个 props 传入的值
     * @returns 是否处理成功
     */
    protected handleProps(
        _key: string,
        _prevValue: any,
        _nextValue: any
    ): boolean {
        return false;
    }

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        _namespace?: ElementNamespace,
        _parentComponent?: ComponentInternalInstance | null
    ): void {
        if (isNil(prevValue) && isNil(nextValue)) return;
        if (this.handleProps(key, prevValue, nextValue)) return;
        switch (key) {
            case 'x': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.pos(nextValue, this._transform.y);
                return;
            }
            case 'y': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this.pos(this._transform.x, nextValue);
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
            case 'anti': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.setAntiAliasing(nextValue);
                return;
            }
            case 'noanti': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.setAntiAliasing(!nextValue);
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
            case 'loc': {
                if (!this.assertType(nextValue, Array, key)) return;
                if (!isNil(nextValue[0]) && !isNil(nextValue[1])) {
                    this.pos(nextValue[0] as number, nextValue[1] as number);
                }
                if (!isNil(nextValue[2]) && !isNil(nextValue[3])) {
                    this.size(nextValue[2] as number, nextValue[3] as number);
                }
                if (!isNil(nextValue[4]) && !isNil(nextValue[5])) {
                    this.setAnchor(
                        nextValue[4] as number,
                        nextValue[5] as number
                    );
                }
                return;
            }
            case 'anc': {
                if (!this.assertType(nextValue, Array, key)) return;
                this.setAnchor(nextValue[0] as number, nextValue[1] as number);
                return;
            }
            case 'cursor': {
                if (!this.assertType(nextValue, 'string', key)) return;
                this.cursor = nextValue;
                return;
            }
            case 'scale': {
                if (!this.assertType(nextValue, Array, key)) return;
                this._transform.setScale(
                    nextValue[0] as number,
                    nextValue[1] as number
                );
                return;
            }
            case 'rotate': {
                if (!this.assertType(nextValue, 'number', key)) return;
                this._transform.setRotate(nextValue);
                return;
            }
            case 'noevent': {
                if (!this.assertType(nextValue, 'boolean', key)) return;
                this.noEvent = nextValue;
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

    //#endregion

    /**
     * 摧毁这个渲染元素，摧毁后不应继续使用
     */
    destroy(): void {
        this.remove();
        this.emit('destroy');
        this.removeAllListeners();
        this.canvases.clear();
    }
}

RenderItem.ticker.add(time => {
    // slice 是为了让函数里面的 request 进入下一帧执行
    if (beforeFrame.length > 0) {
        const arr = beforeFrame.slice();
        beforeFrame.splice(0);
        arr.forEach(v => v());
    }
    RenderItem.tickerMap.forEach(v => {
        v.fn(time);
    });
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
