import {
    RenderAdapter,
    transformCanvas,
    ERenderItemEvent,
    RenderItem,
    Transform,
    MotaOffscreenCanvas2D
} from '@motajs/render-core';
import { HeroRenderer } from './hero';
import { ILayerGroupRenderExtends, LayerGroup } from './layer';

export class LayerGroupAnimate implements ILayerGroupRenderExtends {
    static animateList: Set<LayerGroupAnimate> = new Set();
    id: string = 'animate';

    group!: LayerGroup;
    hero?: HeroRenderer;
    animate!: Animate;

    private animation: Set<AnimateData> = new Set();

    /**
     * 绘制一个跟随勇士的动画
     * @param name 动画id
     */
    async drawHeroAnimate(name: AnimationIds) {
        const animate = this.animate.animate(name, 0, 0);
        this.updatePosition(animate);
        await this.animate.draw(animate);
        this.animation.delete(animate);
    }

    private updatePosition(animate: AnimateData) {
        if (!this.checkHero()) return;
        if (!this.hero?.renderable) return;
        const { x, y } = this.hero.renderable;
        const cell = this.group.cellSize;
        const half = cell / 2;
        animate.centerX = x * cell + half;
        animate.centerY = y * cell + half;
    }

    private onMoveTick = (x: number, y: number) => {
        const cell = this.group.cellSize;
        const half = cell / 2;
        const ax = x * cell + half;
        const ay = y * cell + half;
        this.animation.forEach(v => {
            v.centerX = ax;
            v.centerY = ay;
        });
    };

    private listen() {
        if (this.checkHero()) {
            this.hero!.on('moveTick', this.onMoveTick);
        }
    }

    private checkHero() {
        if (this.hero) return true;
        const ex = this.group.getLayer('event')?.getExtends('floor-hero');
        if (ex instanceof HeroRenderer) {
            this.hero = ex;
            return true;
        }
        return false;
    }

    awake(group: LayerGroup): void {
        this.group = group;
        this.animate = new Animate();
        this.animate.size(group.width, group.height);
        this.animate.setHD(true);
        this.animate.setZIndex(100);
        group.appendChild(this.animate);
        LayerGroupAnimate.animateList.add(this);
        this.listen();
    }

    onDestroy(_group: LayerGroup): void {
        if (this.checkHero()) {
            this.hero!.off('moveTick', this.onMoveTick);
            LayerGroupAnimate.animateList.delete(this);
        }
    }
}

interface AnimateData {
    obj: globalThis.Animate;
    /** 第一帧是全局第几帧 */
    readonly start: number;
    /** 当前是第几帧 */
    index: number;
    /** 是否需要播放音频 */
    sound: boolean;
    centerX: number;
    centerY: number;
    onEnd?: () => void;
    readonly absolute: boolean;
}

export interface EAnimateEvent extends ERenderItemEvent {}

export class Animate extends RenderItem<EAnimateEvent> {
    /** 绝对位置的动画 */
    private absoluteAnimates: Set<AnimateData> = new Set();
    /** 静态位置的动画 */
    private staticAnimates: Set<AnimateData> = new Set();

    private delegation: number;
    private frame: number = 0;
    private lastTime: number = 0;

    constructor() {
        super('absolute', false, true);

        this.delegation = this.delegateTicker(time => {
            if (time - this.lastTime < 50) return;
            this.lastTime = time;
            this.frame++;
            if (
                this.absoluteAnimates.size > 0 ||
                this.staticAnimates.size > 0
            ) {
                this.update(this);
            }
        });

        adapter.add(this);
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        if (
            this.absoluteAnimates.size === 0 &&
            this.staticAnimates.size === 0
        ) {
            return;
        }
        this.drawAnimates(this.absoluteAnimates, canvas);
        transformCanvas(canvas, transform);
        this.drawAnimates(this.staticAnimates, canvas);
    }

    private drawAnimates(
        data: Set<AnimateData>,
        canvas: MotaOffscreenCanvas2D
    ) {
        if (data.size === 0) return;
        const { ctx } = canvas;
        const toDelete = new Set<AnimateData>();
        data.forEach(v => {
            const obj = v.obj;
            const index = v.index;
            const frame = obj.frames[index];
            const ratio = obj.ratio;
            if (!v.sound) {
                const se = (index % obj.frame) + 1;
                core.playSound(v.obj.se[se], v.obj.pitch[se]);
                v.sound = true;
            }
            const centerX = v.centerX;
            const centerY = v.centerY;

            frame.forEach(v => {
                const img = obj.images[v.index];
                if (!img) return;

                const realWidth = (img.width * ratio * v.zoom) / 100;
                const realHeight = (img.height * ratio * v.zoom) / 100;
                ctx.globalAlpha = v.opacity / 255;

                const cx = centerX + v.x;
                const cy = centerY + v.y;

                const ix = -realWidth / 2;
                const iy = -realHeight / 2;
                const angle = v.angle ? (-v.angle * Math.PI) / 180 : 0;

                ctx.save();
                ctx.translate(cx, cy);
                if (v.mirror) {
                    ctx.scale(-1, 1);
                }
                ctx.rotate(angle);
                ctx.drawImage(img, ix, iy, realWidth, realHeight);
                ctx.restore();
            });
            const now = this.frame - v.start;
            if (now !== v.index) v.sound = true;
            v.index = now;
            if (v.index === v.obj.frame) {
                toDelete.add(v);
            }
        });
        toDelete.forEach(v => {
            data.delete(v);
            v.onEnd?.();
        });
    }

    /**
     * 创建一个可以被执行的动画
     * @param name 动画名称
     * @param absolute 是否是绝对定位，绝对定位不会受到transform的影响
     */
    animate(
        name: AnimationIds,
        x: number,
        y: number,
        absolute: boolean = false
    ) {
        const animate = core.material.animates[name];
        const data: AnimateData = {
            index: 0,
            start: this.frame,
            obj: animate,
            centerX: x,
            centerY: y,
            absolute,
            sound: false
        };
        return data;
    }

    /**
     * 绘制动画，动画结束时兑现返回的Promise
     * @param animate 动画信息
     * @returns
     */
    draw(animate: AnimateData): Promise<void> {
        return new Promise(res => {
            if (animate.absolute) {
                this.absoluteAnimates.add(animate);
            } else {
                this.staticAnimates.add(animate);
            }
            animate.onEnd = () => {
                res();
            };
        });
    }

    /**
     * 根据动画名称、坐标、定位绘制动画
     * @param name 动画名称
     * @param absolute 是否是绝对定位
     */
    drawAnimate(
        name: AnimationIds,
        x: number,
        y: number,
        absolute: boolean = false
    ) {
        return this.draw(this.animate(name, x, y, absolute));
    }

    destroy(): void {
        super.destroy();
        this.removeTicker(this.delegation);
        adapter.remove(this);
    }
}

const adapter = new RenderAdapter<Animate>('animate');
adapter.receive('drawAnimate', (item, name, x, y, absolute) => {
    return item.drawAnimate(name, x, y, absolute);
});
adapter.receiveGlobal('drawHeroAnimate', name => {
    const execute: Promise<void>[] = [];
    LayerGroupAnimate.animateList.forEach(v => {
        execute.push(v.drawHeroAnimate(name));
    });
    return Promise.all(execute);
});
