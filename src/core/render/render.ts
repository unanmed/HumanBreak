import { isNil } from 'lodash-es';
import { MotaCanvas2D, MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Camera } from './camera';
import { Container } from './container';
import { RenderItem, withCacheRender } from './item';
import { Image, Text } from './preset/misc';
import { Animation, hyper } from 'mutate-animate';

export class MotaRenderer extends Container {
    canvas: MotaOffscreenCanvas2D;
    camera: Camera;

    /** 摄像机缓存，如果是需要快速切换摄像机的场景，使用缓存可以大幅提升性能表现 */
    cameraCache: Map<Camera, MotaOffscreenCanvas2D> = new Map();
    target: MotaCanvas2D;

    private needUpdate: boolean = false;

    constructor() {
        super();

        this.canvas = new MotaOffscreenCanvas2D();
        this.camera = new Camera();
        this.target = new MotaCanvas2D(`render-main`);
        this.width = 480;
        this.height = 480;
        this.target.withGameScale(true);
        this.target.size(480, 480);
        this.canvas.withGameScale(true);
        this.canvas.size(480, 480);
        this.target.css(`z-index: 100`);
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
                    ct.transform(scale, 0, 0, scale, 0, 0);
                } else {
                    ct.setTransform(1, 0, 0, 1, 0, 0);
                    ct.translate(ca.width / 2, ca.height / 2);
                    ct.transform(a, b, c, d, e, f);
                }
                v.render(ca, ct, camera);
            });
        });
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
            this.emit('beforeUpdate', item);
            this.render();
            this.emit('afterUpdate', item);
        });
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
}

Mota.require('var', 'hook').once('reset', () => {
    const render = new MotaRenderer();
    const con = new Container('static');
    const camera = render.camera;
    render.mount();

    const testText = new Text();
    testText.setText('测试测试');
    testText.pos(240, 240);
    testText.setFont('32px normal');
    testText.setStyle('#fff');
    con.size(480, 480);
    con.pos(-240, -240);
    const testImage = new Image(core.material.images.images['arrow.png']);
    testImage.pos(240, 240);

    con.appendChild([testText, testImage]);

    render.appendChild([con]);

    render.update(render);

    const ani = new Animation();
    ani.mode(hyper('sin', 'in-out'))
        .time(10000)
        .absolute()
        .rotate(360)
        .scale(0.7)
        .move(100, 100);
    ani.ticker.add(() => {
        render.cache('@default');
        camera.reset();
        camera.move(ani.x, ani.y);
        camera.scale(ani.size);
        camera.rotate((ani.angle / 180) * Math.PI);
        render.update(render);
    });
    setTimeout(() => ani.ticker.destroy(), 10000);
});
