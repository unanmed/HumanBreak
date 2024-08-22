import { Animation, hyper, sleep } from 'mutate-animate';
import { MotaCanvas2D, MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Container } from './container';
import { RenderItem, transformCanvas } from './item';
import { FloorLayer, Layer, LayerGroup } from './preset/layer';
import { LayerGroupFloorBinder } from './preset/floor';
import { FloorDamageExtends } from './preset/damage';
import { HeroRenderer } from './preset/hero';

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

        MotaRenderer.list.add(this);
    }

    /**
     * 使用某个摄像机
     * @param camera 要使用的摄像机
     * @param noCache 是否不使用缓存，当切换至的目标摄像机相比切走时发生了例如位置的变化时，一般需要设置为true，
     *                否则会使用上一次被切换走时的缓存
     */
    // useCamera(camera: Camera, noCache: boolean = false) {
    //     const cache = MotaOffscreenCanvas2D.clone(this.canvas);
    //     this.cameraCache.set(this.camera, cache);
    //     this.camera = camera;
    //     const nowCache = this.cameraCache.get(camera);
    //     if (!nowCache || !noCache) this.render();
    //     else this.renderCache(nowCache);
    // }

    /**
     * 删除某个摄像机的画面缓存
     * @param camera 要删除的缓存对应的摄像机
     */
    // freeCameraCache(camera: Camera) {
    //     this.cameraCache.delete(camera);
    // }

    /**
     * 渲染游戏画面
     */
    // protected render(canvas: MotaOffscreenCanvas2D, transform: Transform) {
    // console.time();
    // const { canvas, ctx } = this.target;
    // const camera = this.camera;
    // this.emit('beforeRender', camera);
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // withCacheRender(this, canvas, ctx, camera, canvas => {
    //     const { canvas: ca, ctx: ct, scale } = canvas;
    //     this.sortedChildren.forEach(v => {
    //         if (v.hidden) return;
    //         if (v.type === 'absolute') {
    //             ct.setTransform(scale, 0, 0, scale, 0, 0);
    //         } else {
    //             transformCanvas(canvas, camera, false);
    //         }
    //         ct.save();
    //         if (!v.antiAliasing) {
    //             ctx.imageSmoothingEnabled = false;
    //             ct.imageSmoothingEnabled = false;
    //         } else {
    //             ctx.imageSmoothingEnabled = true;
    //             ct.imageSmoothingEnabled = true;
    //         }
    //         v.renderContent(this.target, camera);
    //         ct.restore();
    //     });
    // });
    // this.emit('afterRender', camera);
    // console.timeEnd();
    // }

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
        this.render(this.target, this.transform);
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
    // hero.readyMove();
    // layer.delegateTicker(
    //     () => {
    //         hero.move('right');
    //     },
    //     10000,
    //     () => {
    //         hero.endMove();
    //     }
    // );

    transform.move(240, 240);
    render.update();

    console.log(render);
});
