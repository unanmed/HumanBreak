import { Animation, hyper, linear, sleep } from 'mutate-animate';
import { MotaCanvas2D, MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Container } from './container';
import { RenderItem, transformCanvas } from './item';
import { FloorLayer, Layer, LayerGroup } from './preset/layer';
import { LayerGroupFloorBinder } from './preset/floor';
import { FloorDamageExtends } from './preset/damage';
import { HeroRenderer } from './preset/hero';
import { Transform } from './transform';
import { Text } from './preset/misc';

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

Mota.require('var', 'hook').once('reset', () => {
    const render = new MotaRenderer();
    const transform = render.transform;
    render.mount();

    const layer = new LayerGroup();

    ['bg', 'bg2', 'event', 'fg', 'fg2'].forEach(v => {
        layer.addLayer(v as FloorLayer);
    });

    const binder = new LayerGroupFloorBinder();
    const damage = new FloorDamageExtends();
    const hero = new HeroRenderer();
    layer.extends(binder);
    layer.extends(damage);
    layer.getLayer('event')?.extends(hero);
    binder.bindThis();
    render.appendChild(layer);

    layer.requestAfterFrame(() => {
        hero.setImage(core.material.images.images['hero2.png']);
    });

    console.log(render);
});
