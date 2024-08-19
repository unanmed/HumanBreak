import { ILayerRenderExtends, Layer, LayerMovingRenderable } from './layer';
import { SizedCanvasImageSource } from './misc';
import { RenderAdapter } from '../adapter';
import { logger } from '@/core/common/logger';
import EventEmitter from 'eventemitter3';
import { texture } from '../cache';

type HeroMovingStatus = 'stop' | 'moving';

interface HeroRenderEvent {
    stepEnd: [];
}

export class HeroRenderer
    extends EventEmitter<HeroRenderEvent>
    implements ILayerRenderExtends
{
    id: string = 'floor-hero';

    /** 勇士的图片资源 */
    image?: SizedCanvasImageSource;
    cellWidth?: number;
    cellHeight?: number;

    /** 勇士的渲染信息 */
    renderable?: LayerMovingRenderable;
    layer!: Layer;

    // hero?: Hero;

    /** 勇士移动状态 */
    status: HeroMovingStatus = 'stop';
    /** 当前移动帧数 */
    movingFrame: number = 0;

    /** 勇士移动速度 */
    speed: number = 100;

    /** 勇士移动定时器id */
    private moveId: number = -1;
    /** 上一次帧数切换的时间 */
    private lastFrameTime: number = 0;
    /** 当前的移动方向 */
    private moveDir: Dir = 'down';
    /** 上一步走到格子上的时间 */
    private lastStepTime: number = 0;
    /** 是否已经执行了当前步移动 */
    private moveDetached?: Promise<void>;
    /**
     * 这一步的移动方向，与{@link moveDir}不同的是，在这一步走完之前，它都不会变，
     * 当这一步走完之后，才会将其设置为{@link moveDir}的值
     */
    private stepDir: Dir = 'down';
    /** 每步的格子增量 */
    private stepDelta: Loc = { x: 0, y: 1 };

    /**
     * 设置勇士所用的图片资源
     * @param image 图片资源
     */
    setImage(image: SizedCanvasImageSource) {
        this.image = image;
        this.split();
        this.layer.update(this.layer);
    }

    setMoveSpeed(speed: number) {
        this.speed = speed;
    }

    /**
     * 分割勇士图像，生成renderable信息
     */
    split() {
        this.cellWidth = this.image!.width / 4;
        this.cellHeight = this.image!.height / 4;
        this.generateRenderable();
    }

    /**
     * 生成渲染信息
     */
    generateRenderable() {
        if (!this.image) return;
        this.renderable = {
            image: this.image,
            frame: 4,
            x: core.status.hero.loc.x,
            y: core.status.hero.loc.y,
            zIndex: core.status.hero.loc.y,
            autotile: false,
            bigImage: true,
            render: this.getRenderFromDir(this.moveDir),
            animate: 0
        };
    }

    /**
     * 根据方向获取勇士的裁切信息
     * @param dir 方向
     */
    getRenderFromDir(dir: Dir): [number, number, number, number][] {
        if (!this.cellWidth || !this.cellHeight) return [];
        const index = texture.characterDirection[dir];
        const y = index * this.cellHeight;
        return [0, 1, 2, 3].map(v => {
            return [v * this.cellWidth!, y, this.cellWidth!, this.cellHeight!];
        });
    }

    /**
     * 设置当前勇士
     * @param hero 绑定的勇士
     */
    // setHero(hero: Hero) {
    //     this.hero = hero;
    // }

    /**
     * 准备开始移动
     */
    readyMove() {
        if (this.status !== 'stop') return;
        this.status = 'moving';
        this.lastFrameTime = Date.now();
    }

    /**
     * 勇士移动定时器
     */
    private moveTick(time: number) {
        if (this.status !== 'moving') return;
        if (!this.renderable) return;

        if (time - this.lastFrameTime > this.speed) {
            this.lastFrameTime = time;
            this.movingFrame++;
            this.movingFrame %= 4;
        }

        const progress = (time - this.lastStepTime) / this.speed;
        const { x: dx, y: dy } = this.stepDelta;
        const { x, y } = core.status.hero.loc;
        if (progress >= 1) {
            this.renderable.x = x + dx;
            this.renderable.y = y + dy;
            this.emit('stepEnd');
        } else {
            const rx = dx * progress + x;
            const ry = dy * progress + y;
            this.renderable.x = rx;
            this.renderable.y = ry;
        }
        this.renderable.animate = this.movingFrame;
        this.layer.update(this.layer);
    }

    /**
     * 进行下一步的移动准备，设置移动信息
     */
    private step() {
        this.stepDir = this.moveDir;
        this.lastStepTime = Date.now();
        this.stepDelta = core.utils.scan[this.stepDir];
        this.turn(this.stepDir);
    }

    /**
     * 移动勇士
     */
    move(dir: Dir): Promise<void> {
        if (this.status !== 'moving') {
            logger.error(
                12,
                `Cannot move while status is not 'moving'. Call 'readyMove' first.`
            );
            return Promise.reject();
        }

        this.moveDir = dir;

        if (this.moveDetached) return this.moveDetached;
        else {
            this.step();
            return (this.moveDetached = new Promise<void>(resolve => {
                this.moveDetached = void 0;
                this.once('stepEnd', resolve);
            }));
        }
    }

    /**
     * 结束勇士的移动过程
     */
    endMove(): Promise<void> {
        if (this.status !== 'moving') return Promise.reject();
        return new Promise<void>(resolve => {
            this.once('stepEnd', () => {
                this.status = 'stop';
                this.movingFrame = 0;
                this.layer.removeTicker(this.moveId);
                this.render();
                resolve();
            });
        });
    }

    /**
     * 勇士转向，不填表示顺时针转一个方向
     * @param dir 移动方向
     */
    turn(dir?: Dir): void {
        if (!dir) {
            const index = texture.characterTurn.indexOf(this.moveDir) + 1;
            const length = texture.characterTurn.length;
            const next = texture.characterTurn[index % length];
            return this.turn(next);
        }
        this.moveDir = dir;
        if (!this.renderable) return;
        this.renderable.render = this.getRenderFromDir(this.moveDir);
        this.layer.update(this.layer);
    }

    /**
     * 渲染勇士
     */
    render() {
        if (!this.renderable) return;
        if (this.status === 'stop') {
            this.renderable.animate = -1;
        } else {
            this.renderable.animate = this.movingFrame;
        }
        this.layer.update(this.layer);
    }

    awake(layer: Layer): void {
        this.layer = layer;
        adapter.add(this);
        this.moveId = layer.delegateTicker(() => {
            this.moveTick(Date.now());
        });
    }

    onDestroy(layer: Layer): void {
        adapter.remove(this);
        layer.removeTicker(this.moveId);
    }

    onMovingUpdate(layer: Layer, renderable: LayerMovingRenderable[]): void {
        if (this.renderable) renderable.push(this.renderable);
    }
}

const adapter = new RenderAdapter<HeroRenderer>('hero-adapter');
adapter.recieve('readyMove', item => {
    item.readyMove();
    return Promise.resolve();
});
adapter.recieve('move', (item, dir: Dir) => {
    return item.move(dir);
});
adapter.recieve('endMove', item => {
    return item.endMove();
});
