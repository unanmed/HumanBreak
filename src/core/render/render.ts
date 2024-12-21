import { logger } from '../common/logger';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Container } from './container';
import { RenderItem } from './item';
import { Transform } from './transform';

export class MotaRenderer extends Container {
    static list: Map<string, MotaRenderer> = new Map();

    target!: MotaOffscreenCanvas2D;

    protected needUpdate: boolean = false;
    readonly isRoot: boolean = true;

    constructor(id: string = 'render-main') {
        super('static', false);

        const canvas = document.getElementById(id) as HTMLCanvasElement;
        if (!canvas) {
            logger.error(19);
            return;
        }
        this.target = new MotaOffscreenCanvas2D(true, canvas);
        this.size(core._PX_, core._PY_);
        this.target.withGameScale(true);
        this.target.size(core._PX_, core._PY_);
        this.target.setAntiAliasing(false);

        this.setAnchor(0.5, 0.5);
        this.transform.translate(240, 240);

        MotaRenderer.list.set(id, this);
    }

    update(item: RenderItem = this) {
        if (this.needUpdate || this.hidden) return;
        this.needUpdate = true;
        this.requestRenderFrame(() => {
            this.refresh(item);
        });
    }

    protected refresh(item: RenderItem = this): void {
        if (!this.needUpdate) return;
        this.needUpdate = false;
        this.emit('beforeUpdate', item);
        this.target.clear();
        this.renderContent(this.target, Transform.identity);
        this.emit('afterUpdate', item);
    }

    /**
     * 根据渲染元素的id获取一个渲染元素
     * @param id 要获取的渲染元素id
     * @returns
     */
    getElementById(id: string): RenderItem | null {
        const map = RenderItem.itemMap;
        const item = map.get(id);
        if (item) return item;
        else {
            const item = this.searchElement(this, id);
            if (item) {
                map.set(id, item);
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

    destroy() {
        super.destroy();
        MotaRenderer.list.delete(this.id);
        this.target.delete();
    }

    /**
     * 刷新所有元素
     */
    refreshAll() {
        const stack: RenderItem[] = [this];
        while (stack.length > 0) {
            const item = stack.pop();
            if (!item) break;
            if (item.children.size === 0) {
                item.update();
            } else {
                item.children.forEach(v => stack.push(v));
            }
        }
    }

    static get(id: string) {
        return this.list.get(id);
    }
}

window.addEventListener('resize', () => {
    MotaRenderer.list.forEach(v => v.requestAfterFrame(() => v.refreshAll()));
});
