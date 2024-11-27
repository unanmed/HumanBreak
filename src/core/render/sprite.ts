import {
    ERenderItemEvent,
    RenderFunction,
    RenderItem,
    RenderItemPosition
} from './item';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { Transform } from './transform';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { logger } from '../common/logger';

export interface ESpriteEvent extends ERenderItemEvent {}

export class Sprite<
    E extends ESpriteEvent = ESpriteEvent
> extends RenderItem<E> {
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
        this.renderFn(canvas, transform);
    }

    setRenderFn(fn: RenderFunction) {
        this.renderFn = fn;
        this.update(this);
    }

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
        const type = typeof nextValue;
        switch (key) {
            case 'render':
                if (type !== 'function') {
                    logger.error(21, key, 'function', type);
                    return;
                }
                this.setRenderFn(nextValue);
                break;
        }
    }
}
