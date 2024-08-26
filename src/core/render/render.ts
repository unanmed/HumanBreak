import { MotaCanvas2D } from '../fx/canvas2d';
import { Container } from './container';
import { RenderItem } from './item';
import { Transform } from './transform';

export class MotaRenderer extends Container {
    static list: Set<MotaRenderer> = new Set();

    target: MotaCanvas2D;
    /** 这个渲染对象的id */
    id: string;

    protected needUpdate: boolean = false;

    constructor(id: string = 'render-main') {
        super('static', false);

        this.id = id;

        this.target = new MotaCanvas2D(id);
        this.size(core._PX_, core._PY_);
        this.target.withGameScale(true);
        this.target.size(core._PX_, core._PY_);
        this.target.css(`z-index: 100`);

        this.setAnchor(0.5, 0.5);
        this.transform.move(240, 240);

        MotaRenderer.list.add(this);
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
     * 添加至游戏画面
     */
    mount() {
        this.target.mount();
    }

    destroy() {
        MotaRenderer.list.delete(this);
    }
}

window.addEventListener('resize', () => {
    MotaRenderer.list.forEach(v => v.update(v));
});
