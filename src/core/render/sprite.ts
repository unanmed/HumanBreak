import {
    ERenderItemEvent,
    RenderFunction,
    RenderItem,
    RenderItemPosition
} from './item';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Transform } from './transform';

export interface ESpriteEvent extends ERenderItemEvent {}

export class Sprite<E extends ESpriteEvent = ESpriteEvent> extends RenderItem<
    E | ESpriteEvent
> {
    renderFn: RenderFunction;

    /**
     * 创建一个精灵，可以自由在上面渲染内容
     * @param type 渲染模式，absolute表示绝对位置，不会跟随自身的Transform改变
     * @param cache 是否启用缓存机制
     */
    constructor(
        type: RenderItemPosition = 'static',
        cache: boolean = true,
        fall: boolean = false
    ) {
        super(type, cache, fall);
        this.type = type;
        this.renderFn = () => {};
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        canvas.ctx.save();
        this.renderFn(canvas, transform);
        canvas.ctx.restore();
    }

    setRenderFn(fn: RenderFunction) {
        this.renderFn = fn;
        this.update(this);
    }
}
