import { MotaCanvas2D } from '../fx/canvas2d';
import { Container } from './container';
import { RenderItem } from './item';
import { Transform } from './transform';

export class MotaRenderer extends Container {
    static list: Map<string, MotaRenderer> = new Map();

    target: MotaCanvas2D;

    protected needUpdate: boolean = false;

    constructor(id: string = 'render-main') {
        super('static', false);

        this.target = new MotaCanvas2D(id, true, false);
        this.size(core._PX_, core._PY_);
        this.target.withGameScale(true);
        this.target.size(core._PX_, core._PY_);
        this.target.css(`z-index: 100`);
        this.target.setAntiAliasing(false);

        this.setAnchor(0.5, 0.5);
        this.transform.translate(240, 240);

        MotaRenderer.list.set(id, this);
    }

    update(item?: RenderItem) {
        if (this.needUpdate) return;
        this.needUpdate = true;
        this.requestRenderFrame(() => {
            this.needUpdate = false;
            this.refresh(item);
        });
    }

    protected refresh(item?: RenderItem): void {
        this.emit('beforeUpdate', item);
        // console.time();
        this.target.clear();
        this.renderContent(this.target, Transform.identity);
        // console.timeEnd();
        this.emit('afterUpdate', item);
    }

    /**
     * 根据渲染元素的id获取一个渲染元素
     * @param id 要获取的渲染元素id
     * @returns
     */
    getElementById(id: string): RenderItem | undefined {
        const map = RenderItem.itemMap;
        const item = map.get(id);
        if (item) return item;
        else {
            const item = this.searchElement(this, id);
            if (item) {
                map.set(id, item);
                return item;
            }
        }
    }

    private searchElement(ele: Container, id: string): RenderItem | undefined {
        for (const child of ele.children) {
            if (child.id === id) return child;
            if (child instanceof Container) {
                return this.searchElement(child, id);
            }
        }
    }

    /**
     * 添加至游戏画面
     */
    mount() {
        this.target.mount();
    }

    destroy() {
        MotaRenderer.list.delete(this.id);
    }

    static get(id: string) {
        return this.list.get(id);
    }
}

window.addEventListener('resize', () => {
    MotaRenderer.list.forEach(v => v.update(v));
});
