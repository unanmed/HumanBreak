import { logger } from '@motajs/common';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { Container } from './container';
import {
    ActionType,
    IActionEvent,
    IActionEventBase,
    IWheelEvent,
    MouseType,
    WheelType
} from './event';
import { IRenderTreeRoot, RenderItem } from './item';
import { Transform } from './transform';

interface TouchInfo {
    /** 这次触摸在渲染系统的标识符 */
    identifier: number;
    /** 浏览器的 clientX，用于判断这个触点有没有移动 */
    clientX: number;
    /** 浏览器的 clientY，用于判断这个触点有没有移动 */
    clientY: number;
    /** 是否覆盖在了当前元素上 */
    hovered: boolean;
}

interface MouseInfo {
    /** 这个鼠标按键的标识符 */
    identifier: number;
}

export interface MotaRendererConfig {
    /** 要挂载到哪个画布上，可以填 css 选择器或画布元素本身 */
    canvas: string | HTMLCanvasElement;
    /** 画布的宽度，所有渲染操作会自行适配缩放 */
    width: number;
    /** 画布的高度，所有渲染操作会自行适配缩放 */
    height: number;
    /** 是否启用不透明度通道，默认启用 */
    alpha?: boolean;
}

export class MotaRenderer extends Container implements IRenderTreeRoot {
    static list: Map<string, MotaRenderer> = new Map();

    /** 所有连接到此根元素的渲染元素的 id 到元素自身的映射 */
    protected idMap: Map<string, RenderItem> = new Map();

    /** 最后一次按下的鼠标按键，用于处理鼠标移动 */
    private lastMouse: MouseType = MouseType.None;
    /** 每个触点的信息 */
    private touchInfo: Map<number, TouchInfo> = new Map();
    /** 触点列表 */
    private touchList: Map<number, Touch> = new Map();
    /** 每个鼠标按键的信息 */
    private mouseInfo: Map<MouseType, MouseInfo> = new Map();
    /** 操作的标识符 */
    private actionIdentifier: number = 0;

    /** 用于终止 document 上的监听 */
    private abort?: AbortController;
    /** 根据捕获行为判断光标样式 */
    private targetCursor: string = 'auto';
    /** 当前鼠标覆盖的元素 */
    private hoveredElement: Set<RenderItem> = new Set();
    /** 本次交互前鼠标覆盖的元素 */
    private beforeHovered: Set<RenderItem> = new Set();

    target!: MotaOffscreenCanvas2D;

    readonly isRoot = true;

    constructor(config: MotaRendererConfig) {
        super('static', false);

        const canvas = this.getMountCanvas(config.canvas);
        if (!canvas) {
            logger.error(19);
            return;
        }
        this.target = new MotaOffscreenCanvas2D(config.alpha ?? true, canvas);
        this.size(config.width, config.height);
        this.target.setAntiAliasing(false);

        this.setAnchor(0.5, 0.5);

        MotaRenderer.list.set(canvas.id, this);

        const update = () => {
            this.requestRenderFrame(() => {
                this.refresh();
                update();
            });
        };

        update();
        this.listen();

        this.setScale(1);
    }

    /**
     * 设置这个渲染器的缩放比
     * @param scale 缩放比
     */
    setScale(scale: number) {
        this.onResize(scale);
    }

    onResize(scale: number): void {
        this.target.setScale(scale);
        const width = this.target.width * scale;
        const height = this.target.height * scale;
        this.target.canvas.style.width = `${width}px`;
        this.target.canvas.style.height = `${height}px`;
        super.onResize(scale);
    }

    private getMountCanvas(canvas: string | HTMLCanvasElement) {
        if (typeof canvas === 'string') {
            return document.querySelector(canvas) as HTMLCanvasElement;
        } else {
            return canvas;
        }
    }

    size(width: number, height: number): void {
        super.size(width, height);
        this.target.size(width, height);
        this.transform.setTranslate(width / 2, height / 2);
    }

    private listen() {
        // 画布监听
        const canvas = this.target.canvas;
        canvas.addEventListener('mousedown', ev => {
            ev.preventDefault();
            const mouse = this.getMouseType(ev);
            this.lastMouse = mouse;
            this.captureEvent(
                ActionType.Down,
                this.createMouseAction(ev, ActionType.Down, mouse)
            );
        });
        canvas.addEventListener('mouseup', ev => {
            ev.preventDefault();
            const event = this.createMouseAction(ev, ActionType.Up);
            this.captureEvent(ActionType.Up, event);
            this.captureEvent(ActionType.Click, event);
        });
        canvas.addEventListener('mousemove', ev => {
            ev.preventDefault();
            const event = this.createMouseAction(
                ev,
                ActionType.Move,
                this.lastMouse
            );
            this.targetCursor = 'auto';
            const temp = this.beforeHovered;
            temp.clear();
            this.beforeHovered = this.hoveredElement;
            this.hoveredElement = temp;
            this.captureEvent(ActionType.Move, event);
            if (this.targetCursor !== this.target.canvas.style.cursor) {
                this.target.canvas.style.cursor = this.targetCursor;
            }
            this.checkMouseEnterLeave(
                ev,
                this.beforeHovered,
                this.hoveredElement
            );
        });
        canvas.addEventListener('mouseleave', ev => {
            ev.preventDefault();
            this.hoveredElement.forEach(v => {
                v.emit('leave', this.createMouseActionBase(ev, v));
            });
            this.hoveredElement.clear();
            this.beforeHovered.clear();
        });
        document.addEventListener('touchstart', ev => {
            ev.preventDefault();
            this.createTouchAction(ev, ActionType.Down).forEach(v => {
                this.captureEvent(ActionType.Down, v);
            });
        });
        document.addEventListener('touchend', ev => {
            ev.preventDefault();
            this.createTouchAction(ev, ActionType.Up).forEach(v => {
                this.captureEvent(ActionType.Up, v);
                this.captureEvent(ActionType.Click, v);
                this.touchInfo.delete(v.identifier);
            });
        });
        document.addEventListener('touchcancel', ev => {
            ev.preventDefault();
            this.createTouchAction(ev, ActionType.Up).forEach(v => {
                this.captureEvent(ActionType.Up, v);
                this.touchInfo.delete(v.identifier);
            });
        });
        document.addEventListener('touchmove', ev => {
            ev.preventDefault();
            this.createTouchAction(ev, ActionType.Move).forEach(v => {
                const touch = this.touchInfo.get(v.identifier);
                if (!touch) return;
                const temp = this.beforeHovered;
                temp.clear();
                this.beforeHovered = this.hoveredElement;
                this.hoveredElement = temp;
                this.captureEvent(ActionType.Move, v);
                this.checkTouchEnterLeave(
                    ev,
                    this.beforeHovered,
                    this.hoveredElement
                );
            });
        });
        canvas.addEventListener('wheel', ev => {
            ev.preventDefault();
            this.captureEvent(
                ActionType.Wheel,
                this.createWheelAction(ev, ActionType.Wheel)
            );
        });
        // 文档监听
        const abort = new AbortController();
        const signal = abort.signal;
        this.abort = abort;
        const clear = (ev: MouseEvent) => {
            const mouse = this.getMouseButtons(ev);
            for (const button of this.mouseInfo.keys()) {
                if (!(mouse & button)) {
                    this.mouseInfo.delete(button);
                }
            }
        };
        document.addEventListener('click', clear, { signal });
        document.addEventListener('mouseenter', clear, { signal });
        document.addEventListener('mouseleave', clear, { signal });
    }

    private isTouchInCanvas(clientX: number, clientY: number) {
        const rect = this.target.canvas.getBoundingClientRect();
        const { left, right, top, bottom } = rect;
        const x = clientX;
        const y = clientY;
        return x >= left && x <= right && y >= top && y <= bottom;
    }

    private getMouseType(ev: MouseEvent): MouseType {
        switch (ev.button) {
            case 0:
                return MouseType.Left;
            case 1:
                return MouseType.Middle;
            case 2:
                return MouseType.Right;
            case 3:
                return MouseType.Back;
            case 4:
                return MouseType.Forward;
        }
        return MouseType.None;
    }

    private getActiveMouseIdentifier(mouse: MouseType) {
        if (this.lastMouse === MouseType.None) {
            return -1;
        } else {
            const info = this.mouseInfo.get(mouse);
            if (!info) return -1;
            else return info.identifier;
        }
    }

    private getMouseIdentifier(type: ActionType, mouse: MouseType): number {
        switch (type) {
            case ActionType.Down: {
                const id = this.actionIdentifier++;
                this.mouseInfo.set(mouse, { identifier: id });
                return id;
            }
            case ActionType.Move:
            case ActionType.Enter:
            case ActionType.Leave:
            case ActionType.Wheel: {
                return this.getActiveMouseIdentifier(mouse);
            }
            case ActionType.Up:
            case ActionType.Click: {
                const id = this.getActiveMouseIdentifier(mouse);
                this.mouseInfo.delete(mouse);
                return id;
            }
        }
    }

    private getMouseButtons(event: MouseEvent): number {
        if (event.buttons === 0) return MouseType.None;
        let buttons = 0;
        if (event.buttons & 0b1) buttons |= MouseType.Left;
        if (event.buttons & 0b10) buttons |= MouseType.Right;
        if (event.buttons & 0b100) buttons |= MouseType.Middle;
        if (event.buttons & 0b1000) buttons |= MouseType.Back;
        if (event.buttons & 0b10000) buttons |= MouseType.Forward;
        return buttons;
    }

    private createMouseActionBase(
        event: MouseEvent,
        target: RenderItem = this,
        mouse: MouseType = this.getMouseType(event)
    ): IActionEventBase {
        return {
            target: target,
            touch: false,
            type: mouse,
            buttons: this.getMouseButtons(event),
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey
        };
    }

    private createTouchActionBase(
        event: TouchEvent,
        target: RenderItem
    ): IActionEventBase {
        return {
            target: target,
            touch: false,
            type: MouseType.Left,
            buttons: MouseType.Left,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey
        };
    }

    private createMouseAction(
        event: MouseEvent,
        type: ActionType,
        mouse: MouseType = this.getMouseType(event)
    ): IActionEvent {
        const id = this.getMouseIdentifier(type, mouse);
        const x = event.offsetX / this.scale;
        const y = event.offsetY / this.scale;

        return {
            target: this,
            identifier: id,
            touch: false,
            offsetX: x,
            offsetY: y,
            absoluteX: x,
            absoluteY: y,
            type: mouse,
            buttons: this.getMouseButtons(event),
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            stopPropagation: () => {
                this.propagationStoped.set(type, true);
            }
        };
    }

    private createWheelAction(
        event: WheelEvent,
        type: ActionType,
        mouse: MouseType = this.getMouseType(event)
    ): IWheelEvent {
        const ev = this.createMouseAction(event, type, mouse) as IWheelEvent;
        ev.wheelX = event.deltaX;
        ev.wheelY = event.deltaY;
        ev.wheelZ = event.deltaZ;
        switch (event.deltaMode) {
            case 0x00:
                ev.wheelType = WheelType.Pixel;
                break;
            case 0x01:
                ev.wheelType = WheelType.Line;
                break;
            case 0x02:
                ev.wheelType = WheelType.Page;
                break;
            default:
                ev.wheelType = WheelType.None;
                break;
        }
        return ev;
    }

    private getTouchIdentifier(touch: Touch, type: ActionType) {
        if (type === ActionType.Down) {
            const id = this.actionIdentifier++;
            this.touchInfo.set(touch.identifier, {
                identifier: id,
                clientX: touch.clientX,
                clientY: touch.clientY,
                hovered: this.isTouchInCanvas(touch.clientX, touch.clientY)
            });
            return id;
        }
        const info = this.touchInfo.get(touch.identifier);
        if (!info) return -1;
        return info.identifier;
    }

    private createTouch(
        touch: Touch,
        type: ActionType,
        event: TouchEvent,
        rect: DOMRect
    ): IActionEvent {
        const x = (touch.clientX - rect.left) / this.scale;
        const y = (touch.clientY - rect.top) / this.scale;
        return {
            target: this,
            identifier: this.getTouchIdentifier(touch, type),
            touch: true,
            offsetX: x,
            offsetY: y,
            absoluteX: x,
            absoluteY: y,
            type: MouseType.Left,
            buttons: MouseType.Left,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            stopPropagation: () => {
                this.propagationStoped.set(type, true);
            }
        };
    }

    private createTouchAction(
        event: TouchEvent,
        type: ActionType
    ): IActionEvent[] {
        const list: IActionEvent[] = [];
        const rect = this.target.canvas.getBoundingClientRect();
        if (type === ActionType.Up) {
            // 抬起是一个需要特殊处理的东西，因为 touches 不会包含这个内容，所以需要特殊处理
            const touches = Array.from(event.touches).map(v => v.identifier);
            for (const [id, touch] of this.touchList) {
                if (!touches.includes(id)) {
                    // 如果不包含，才需要触发
                    if (this.isTouchInCanvas(touch.clientX, touch.clientY)) {
                        const ev = this.createTouch(touch, type, event, rect);
                        list.push(ev);
                    }
                }
            }
        } else {
            Array.from(event.touches).forEach(v => {
                const ev = this.createTouch(v, type, event, rect);
                if (type === ActionType.Move) {
                    const touch = this.touchInfo.get(v.identifier);
                    if (!touch) return;
                    const moveX = touch.clientX - v.clientX;
                    const moveY = touch.clientY - v.clientY;
                    if (moveX !== 0 || moveY !== 0) {
                        list.push(ev);
                    }
                } else if (type === ActionType.Down) {
                    this.touchList.set(v.identifier, v);
                    if (this.isTouchInCanvas(v.clientX, v.clientY)) {
                        list.push(ev);
                    }
                }
            });
        }
        return list;
    }

    private checkMouseEnterLeave(
        event: MouseEvent,
        before: Set<RenderItem>,
        now: Set<RenderItem>
    ) {
        // 先 leave，再 enter
        before.forEach(v => {
            if (!now.has(v)) {
                v.emit('leave', this.createMouseActionBase(event, v));
            }
        });
        now.forEach(v => {
            if (!before.has(v)) {
                v.emit('enter', this.createMouseActionBase(event, v));
            }
        });
    }

    private checkTouchEnterLeave(
        event: TouchEvent,
        before: Set<RenderItem>,
        now: Set<RenderItem>
    ) {
        // 先 leave，再 enter
        before.forEach(v => {
            if (!now.has(v)) {
                v.emit('leave', this.createTouchActionBase(event, v));
            }
        });
        now.forEach(v => {
            if (!before.has(v)) {
                v.emit('enter', this.createTouchActionBase(event, v));
            }
        });
    }

    update(_item: RenderItem = this) {
        this.cacheDirty = true;
    }

    protected refresh(): void {
        if (!this.cacheDirty) return;
        this.target.clear();
        this.renderContent(this.target, Transform.identity);
    }

    /**
     * 根据渲染元素的id获取一个渲染元素
     * @param id 要获取的渲染元素id
     * @returns
     */
    getElementById(id: string): RenderItem | null {
        if (id.length === 0) return null;
        const item = this.idMap.get(id);
        if (item) return item;
        else {
            const item = this.searchElement(this, id);
            if (item) {
                this.idMap.set(id, item);
            }
            return item;
        }
    }

    private searchElement(ele: RenderItem, id: string): RenderItem | null {
        for (const child of ele.children) {
            if (child.id === id) return child;
            else {
                const ele = this.searchElement(child, id);
                if (ele) return ele;
            }
        }
        return null;
    }

    connect(item: RenderItem): void {
        if (item.id.length === 0) return;
        const existed = this.idMap.get(item.id);
        if (existed) {
            if (existed === item) return;
            else logger.warn(23, item.id);
        } else {
            this.idMap.set(item.id, item);
        }
    }

    disconnect(item: RenderItem): void {
        this.idMap.delete(item.id);
    }

    modifyId(item: RenderItem, previous: string, current: string): void {
        this.idMap.delete(previous);
        if (current.length !== 0) {
            if (this.idMap.has(item.id)) {
                logger.warn(23, item.id);
            } else {
                this.idMap.set(item.id, item);
            }
        }
    }

    getCanvas(): HTMLCanvasElement {
        return this.target.canvas;
    }

    hoverElement(element: RenderItem): void {
        if (element.cursor !== 'inherit') {
            this.targetCursor = element.cursor;
        }
        this.hoveredElement.add(element);
    }

    destroy() {
        super.destroy();
        MotaRenderer.list.delete(this.id);
        this.abort?.abort();
    }

    private toTagString(item: RenderItem, space: number, deep: number): string {
        if (item.isComment) return '';
        const name = item.constructor.name;
        if (item.children.size === 0) {
            return `${' '.repeat(deep * space)}<${name} ${
                item.id ? `id="${item.id}" ` : ''
            }uid="${item.uid}"${item.hidden ? ' hidden' : ''} />\n`;
        } else {
            return (
                `${' '.repeat(deep * space)}<${name} ${
                    item.id ? `${item.id} ` : ''
                }uid="${item.uid}" ${item.hidden ? 'hidden' : ''}>\n` +
                `${[...item.children]
                    .filter(v => !v.isComment)
                    .map(v => this.toTagString(v, space, deep + 1))
                    .join('')}` +
                `${' '.repeat(deep * space)}</${name}>\n`
            );
        }
    }

    /**
     * 调试功能，将渲染树输出为 XML 标签形式，只包含渲染元素类名，以及元素 id 等基础属性，不包含属性值等
     * @param space 缩进空格数
     */
    toTagTree(space: number = 4) {
        if (!import.meta.env.DEV) return '';
        return this.toTagString(this, space, 0);
    }

    static get(id: string) {
        return this.list.get(id);
    }
}

window.addEventListener('resize', () => {
    MotaRenderer.list.forEach(v =>
        v.requestAfterFrame(() => v.refreshAllChildren())
    );
});

// @ts-expect-error debug
window.logTagTree = () => {
    console.log(MotaRenderer.get('render-main')?.toTagTree());
};
