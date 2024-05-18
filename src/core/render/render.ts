import { Animation, hyper, sleep } from 'mutate-animate';
import { MotaCanvas2D, MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Camera } from './camera';
import { Container } from './container';
import { IRenderDestroyable, RenderItem, withCacheRender } from './item';
import { Layer } from './preset/layer';

export class MotaRenderer extends Container implements IRenderDestroyable {
    static list: Set<MotaRenderer> = new Set();

    canvas: MotaOffscreenCanvas2D;
    camera: Camera;

    /** 摄像机缓存，如果是需要快速切换摄像机的场景，使用缓存可以大幅提升性能表现 */
    cameraCache: Map<Camera, MotaOffscreenCanvas2D> = new Map();
    target: MotaCanvas2D;
    /** 这个渲染对象的id */
    id: string;

    protected needUpdate: boolean = false;

    constructor(id: string = 'render-main') {
        super();

        this.id = id;

        this.canvas = new MotaOffscreenCanvas2D();
        this.camera = new Camera();
        this.target = new MotaCanvas2D(id);
        this.width = core._PX_;
        this.height = core._PY_;
        this.target.withGameScale(true);
        this.target.size(core._PX_, core._PY_);
        this.canvas.withGameScale(true);
        this.canvas.size(core._PX_, core._PY_);
        this.target.css(`z-index: 100`);

        MotaRenderer.list.add(this);
    }

    /**
     * 使用某个摄像机
     * @param camera 要使用的摄像机
     * @param noCache 是否不使用缓存，当切换至的目标摄像机相比切走时发生了例如位置的变化时，一般需要设置为true，
     *                否则会使用上一次被切换走时的缓存
     */
    useCamera(camera: Camera, noCache: boolean = false) {
        const cache = MotaOffscreenCanvas2D.clone(this.canvas);
        this.cameraCache.set(this.camera, cache);
        this.camera = camera;
        const nowCache = this.cameraCache.get(camera);
        if (!nowCache || !noCache) this.render();
        else this.renderCache(nowCache);
    }

    /**
     * 删除某个摄像机的画面缓存
     * @param camera 要删除的缓存对应的摄像机
     */
    freeCameraCache(camera: Camera) {
        this.cameraCache.delete(camera);
    }

    /**
     * 渲染游戏画面
     */
    render() {
        const { canvas, ctx } = this.target;
        const camera = this.camera;
        this.emit('beforeRender');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        withCacheRender(this, canvas, ctx, camera, canvas => {
            const { canvas: ca, ctx: ct, scale } = canvas;
            const mat = camera.mat;
            const a = mat[0] * scale;
            const b = mat[1] * scale;
            const c = mat[3] * scale;
            const d = mat[4] * scale;
            const e = mat[6] * scale;
            const f = mat[7] * scale;
            this.sortedChildren.forEach(v => {
                if (v.type === 'absolute') {
                    ct.setTransform(scale, 0, 0, scale, 0, 0);
                } else {
                    ct.setTransform(1, 0, 0, 1, 0, 0);
                    ct.translate(ca.width / 2, ca.height / 2);
                    ct.transform(a, b, c, d, e, f);
                }
                if (!v.antiAliasing) {
                    ctx.imageSmoothingEnabled = false;
                } else {
                    ctx.imageSmoothingEnabled = true;
                }
                v.render(ca, ct, camera);
            });
        });
        this.emit('afterRender');
    }

    /**
     * 更新渲染，在下一个tick更新
     */
    update(item?: RenderItem) {
        if (this.needUpdate) return;
        this.needUpdate = true;
        requestAnimationFrame(() => {
            this.cache(this.writing);
            this.needUpdate = false;
            this.refresh(item);
        });
    }

    protected refresh(item?: RenderItem): void {
        this.emit('beforeUpdate', item);
        this.render();
        this.emit('afterUpdate', item);
    }

    /**
     * 将缓存内容渲染至画面
     * @param cache 渲染缓存，是一个离屏Canvas2D对象
     */
    renderCache(cache: MotaOffscreenCanvas2D) {
        const { canvas, ctx } = this.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.width);
        ctx.drawImage(cache.canvas, 0, 0);
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
    const layer = new Layer();
    const bgLayer = new Layer();
    const camera = render.camera;
    render.mount();

    layer.setZIndex(2);
    bgLayer.setZIndex(1);
    render.appendChild([layer, bgLayer]);
    layer.bindThis('event');
    bgLayer.bindThis('bg');
    bgLayer.setBackground(650);

    const ani = new Animation();

    ani.ticker.add(() => {
        camera.reset();
        camera.rotate((ani.angle / 180) * Math.PI);
        camera.move(ani.x, ani.y);
        camera.scale(ani.size);
        render.update(render);
    });

    camera.rotate(Math.PI * 1.23);
    camera.move(230, 380);
    camera.scale(0.7);
    render.update();

    // sleep(2000).then(() => {
    //     render.update();
    // });

    sleep(1000).then(() => {
        ani.mode(hyper('sin', 'out'))
            .time(100)
            .absolute()
            .rotate(30)
            .move(240, 240);
        sleep(100).then(() => {
            ani.time(3000).rotate(0);
        });
        sleep(3100).then(() => {
            ani.time(5000)
                .mode(hyper('sin', 'in-out'))
                .rotate(360)
                .move(200, 480)
                .scale(0.5);
        });
        // ani.mode(shake2(5, hyper('sin', 'in-out')), true)
        //     .time(5000)
        //     .shake(1, 0);
    });

    console.log(layer);
});
