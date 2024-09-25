import { ILayerRenderExtends, Layer, LayerMovingRenderable } from './layer';
import { SizedCanvasImageSource } from './misc';
import { RenderAdapter } from '../adapter';
import { logger } from '@/core/common/logger';
import EventEmitter from 'eventemitter3';
import { texture } from '../cache';
import { TimingFn } from 'mutate-animate';
import { isNil } from 'lodash-es';

// type HeroMovingStatus = 'stop' | 'moving' | 'moving-as';
// export const enum HeroMovingStatus {}

interface HeroRenderEvent {
    stepEnd: [];
    moveTick: [x: number, y: number];
    append: [renderable: LayerMovingRenderable[]];
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

    /** 当前移动帧数 */
    movingFrame: number = 0;
    /** 是否正在移动 */
    moving: boolean = false;
    /** 是否正在播放动画，与移动分开以实现原地踏步 */
    animate: boolean = false;

    /** 勇士移动速度 */
    speed: number = 100;

    /** 当前的移动方向 */
    moveDir: Dir2 = 'down';
    /** 当前移动的勇士显示方向 */
    showDir: Dir = 'down';
    /** 帧动画是否反向播放，例如后退时就应该设为true */
    animateReverse: boolean = false;

    /** 勇士移动定时器id */
    private moveId: number = -1;
    /** 上一次帧数切换的时间 */
    private lastFrameTime: number = 0;
    /** 上一步走到格子上的时间 */
    private lastStepTime: number = 0;
    /** 执行当前步移动的Promise */
    private moveDetached?: Promise<void>;
    /** endMove的Promise */
    private moveEnding?: Promise<void>;
    /**
     * 这一步的移动方向，与{@link moveDir}不同的是，在这一步走完之前，它都不会变，
     * 当这一步走完之后，才会将其设置为{@link moveDir}的值
     */
    stepDir: Dir2 = 'down';
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

    /**
     * 设置移动的移动速度
     * @param speed 移动速度
     */
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
            render: this.getRenderFromDir(this.showDir),
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
        const res: [number, number, number, number][] = [0, 1, 2, 3].map(v => {
            return [v * this.cellWidth!, y, this.cellWidth!, this.cellHeight!];
        });
        if (this.animateReverse) return res.reverse();
        else return res;
    }

    /**
     * 开始勇士帧动画
     */
    startAnimate() {
        this.animate = true;
        this.lastFrameTime = Date.now();
    }

    /**
     * 结束勇士帧动画
     */
    endAnimate() {
        this.animate = false;
        this.resetRenderable(false);
    }

    /**
     * 设置帧动画是否反向播放
     * @param reverse 帧动画是否反向播放
     */
    setAnimateReversed(reverse: boolean) {
        this.animateReverse = reverse;
        this.resetRenderable(true);
    }

    /**
     * 设置勇士的动画显示朝向
     * @param dir 显示朝向
     */
    setAnimateDir(dir: Dir) {
        if (dir !== this.showDir) {
            this.showDir = dir;
            this.resetRenderable(true);
        }
    }

    /**
     * 重置renderable状态，恢复至第一帧状态
     * @param getInfo 是否重新获取渲染信息
     */
    resetRenderable(getInfo: boolean) {
        this.movingFrame = 0;

        if (this.renderable) {
            this.renderable.animate = 0;
            if (getInfo) {
                this.renderable.render = this.getRenderFromDir(this.showDir);
            }
        }
        this.layer.update(this.layer);
    }

    /**
     * 勇士帧动画定时器
     */
    private animateTick(time: number) {
        if (!this.animate) return;
        if (time - this.lastFrameTime > this.speed) {
            this.lastFrameTime = time;
            this.movingFrame++;
            this.movingFrame %= 4;
            if (this.renderable) this.renderable.animate = this.movingFrame;
        }
        this.layer.update(this.layer);
    }

    /**
     * 勇士移动定时器
     */
    private moveTick(time: number) {
        if (!this.moving) return;
        if (!this.renderable) return;

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
        this.emit('moveTick', this.renderable.x, this.renderable.y);
        this.layer.update(this.layer);
    }

    /**
     * 进行下一步的移动准备，设置移动信息
     */
    private step() {
        this.lastStepTime = Date.now();
        this.stepDelta = core.utils.scan2[this.stepDir];
        this.turn(this.stepDir);
    }

    /**
     * 准备开始移动
     */
    readyMove() {
        this.moving = true;
    }

    /**
     * 移动勇士
     */
    move(dir: Dir2): Promise<void> {
        if (!this.moving) {
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
            this.moveDetached = new Promise(res => {
                this.once('stepEnd', () => {
                    this.moveDetached = void 0;
                    res();
                });
            });
            return this.moveDetached;
        }
    }

    /**
     * 结束勇士的移动过程
     */
    endMove(): Promise<void> {
        if (!this.moving) return Promise.reject();
        if (this.moveEnding) return this.moveEnding;
        else {
            const promise = new Promise<void>(resolve => {
                this.once('stepEnd', () => {
                    this.moveEnding = void 0;
                    this.moving = false;
                    const { x, y } = core.status.hero.loc;
                    this.setHeroLoc(x, y);
                    this.render();
                    resolve();
                });
            });
            return (this.moveEnding = promise);
        }
    }

    /**
     * 勇士转向，不填表示顺时针转一个方向
     * @param dir 移动方向
     */
    turn(dir?: Dir2): void {
        if (!dir) {
            const index = texture.characterTurn2.indexOf(this.stepDir);
            if (index === -1) {
                const length = texture.characterTurn.length;
                const index = texture.characterTurn.indexOf(
                    this.stepDir as Dir
                );
                const next = texture.characterTurn[index % length];
                return this.turn(next);
            } else {
                return this.turn(texture.characterTurn[index]);
            }
        }
        this.moveDir = dir;
        this.stepDir = dir;

        if (!this.renderable) return;
        this.renderable.render = this.getRenderFromDir(this.showDir);
        this.layer.update(this.layer);
    }

    /**
     * 设置勇士的坐标
     * @param x 横坐标
     * @param y 纵坐标
     */
    setHeroLoc(x?: number, y?: number) {
        if (!this.renderable) return;
        if (!isNil(x)) {
            this.renderable.x = x;
        }
        if (!isNil(y)) {
            this.renderable.y = y;
        }
        this.emit('moveTick', this.renderable.x, this.renderable.y);
        this.layer.update(this.layer);
    }

    /**
     * 按照指定函数移动勇士
     * @param x 目标横坐标
     * @param y 目标纵坐标
     * @param time 移动时间
     * @param fn 移动函数，传入一个完成度（范围0-1），返回一个三元素数组，表示横纵格子坐标，可以是小数。
     *           第三个元素表示图块纵深，一般图块的纵深就是其纵坐标，当地图上有大怪物时，此举可以辅助渲染，
     *           否则可能会导致移动过程中与大怪物的层级关系不正确，比如全在大怪物身后。注意不建议频繁改动这个值，
     *           因为此举会导致层级的重新排序，降低渲染性能。
     */
    moveAs(x: number, y: number, time: number, fn: TimingFn<3>): Promise<void> {
        if (!this.moving) return Promise.reject();
        if (!this.renderable) return Promise.reject();
        let nowZIndex = fn(0)[2];
        let startTime = Date.now();
        return new Promise(res => {
            this.layer.delegateTicker(
                () => {
                    if (!this.renderable) return;
                    const now = Date.now();
                    const progress = (now - startTime) / time;
                    const [nx, ny, nz] = fn(progress);
                    this.renderable.x = nx;
                    this.renderable.y = ny;
                    this.renderable.zIndex = nz;
                    if (nz !== nowZIndex) {
                        this.layer.sortMovingRenderable();
                    }
                    this.emit('moveTick', this.renderable.x, this.renderable.y);
                    this.layer.update(this.layer);
                },
                time,
                () => {
                    this.moving = false;
                    if (!this.renderable) return res();
                    this.renderable.x = x;
                    this.renderable.y = y;
                    this.emit('moveTick', this.renderable.x, this.renderable.y);
                    this.layer.update(this.layer);
                    res();
                }
            );
        });
    }

    /**
     * 渲染勇士
     */
    render() {
        if (!this.renderable) return;
        if (!this.animate) {
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
            const time = Date.now();
            this.animateTick(time);
            this.moveTick(time);
        });
    }

    onDestroy(layer: Layer): void {
        adapter.remove(this);
        layer.removeTicker(this.moveId);
    }

    onMovingUpdate(layer: Layer, renderable: LayerMovingRenderable[]): void {
        if (this.renderable) {
            renderable.push(this.renderable);
            this.emit('append', renderable);
        }
    }
}

const adapter = new RenderAdapter<HeroRenderer>('hero-adapter');
adapter.receive('readyMove', item => {
    item.readyMove();
    return Promise.resolve();
});
adapter.receive('move', (item, dir: Dir) => {
    return item.move(dir);
});
adapter.receive('endMove', item => {
    return item.endMove();
});
adapter.receive(
    'moveAs',
    (item, x: number, y: number, time: number, fn: TimingFn<3>) => {
        return item.moveAs(x, y, time, fn);
    }
);
adapter.receive('setHeroLoc', (item, x?: number, y?: number) => {
    item.setHeroLoc(x, y);
    return Promise.resolve();
});
adapter.receive('turn', (item, dir: Dir2) => {
    item.turn(dir);
    return Promise.resolve();
});

// 同步适配函数，这些函数用于同步设置信息等
adapter.receiveSync('setImage', (item, image: SizedCanvasImageSource) => {
    item.setImage(image);
});
adapter.receiveSync('setMoveSpeed', (item, speed: number) => {
    item.setMoveSpeed(speed);
});
adapter.receiveSync('setAnimateReversed', (item, reverse: boolean) => {
    item.setAnimateReversed(reverse);
});
adapter.receiveSync('startAnimate', item => {
    item.startAnimate();
});
adapter.receiveSync('endAnimate', item => {
    item.endAnimate();
});
adapter.receiveSync('setAnimateDir', (item, dir: Dir) => {
    item.setAnimateDir(dir);
});

// 不分同步fallback，用于适配现在的样板，之后会删除
adapter.receiveSync('setHeroLoc', (item, x?: number, y?: number) => {
    item.setHeroLoc(x, y);
});
adapter.receiveSync('turn', (item, dir: Dir2) => {
    item.turn(dir);
});
