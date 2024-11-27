import { logger } from '@/core/common/logger';
import { ERenderItemEvent, RenderItem, RenderItemPosition } from '../item';
import { ElementNamespace, VNodeProps } from 'vue';
import { Container } from '../container';
import { MotaRenderer } from '../render';
import { Sprite } from '../sprite';
import { Comment, Icon, Image, Text } from '../preset/misc';
import { Shader } from '../shader';
import { Animate, Damage, EDamageEvent, Layer, LayerGroup } from '../preset';
import {
    BezierCurve,
    Circle,
    Ellipse,
    Line,
    Path,
    QuadraticCurve,
    Rect
} from '../preset/graphics';
import { BaseProps } from './props';

type OnItemCreate<
    E extends ERenderItemEvent = ERenderItemEvent,
    T extends RenderItem<E> = RenderItem<E>
> = (
    namespace?: ElementNamespace,
    isCustomizedBuiltIn?: string,
    vnodeProps?: (VNodeProps & { [key: string]: any }) | null
) => T;

class RenderTagMap {
    private map: Map<string, OnItemCreate> = new Map();

    /**
     * 注册一个标签，每个标签对应一类元素，重复注册会覆盖之前的
     * @param tag 标签名称
     * @param ele 对应的元素类或其构造器
     */
    register<E extends ERenderItemEvent, T extends RenderItem<E>>(
        tag: string,
        onCreate: OnItemCreate<E, T>
    ) {
        if (this.map.has(tag)) {
            logger.warn(34, tag);
        }
        this.map.set(tag, onCreate);
    }

    /**
     * 获取一个标签对应的元素构造器
     * @param tag 标签名
     */
    get<E extends ERenderItemEvent, T extends RenderItem<E>>(
        tag: string
    ): OnItemCreate<E, T> | undefined {
        return this.map.get(tag) as OnItemCreate<E, T>;
    }
}

export const tagMap = new RenderTagMap();

const standardElement = (
    Item: new (
        type: RenderItemPosition,
        cache?: boolean,
        fall?: boolean
    ) => RenderItem
) => {
    return (_0: any, _1: any, props?: any) => {
        if (!props) return new Item('static');
        else {
            const {
                type = 'static',
                enableCache = true,
                fallthrough = false
            } = props;
            return new Item(type, enableCache, fallthrough);
        }
    };
};

// Default elements
tagMap.register('container', standardElement(Container));
tagMap.register('mota-renderer', (_0, _1, props) => {
    return new MotaRenderer(props?.id);
});
tagMap.register('sprite', standardElement(Sprite));
tagMap.register('text', (_0, _1, props) => {
    if (!props) return new Text();
    else {
        const { type = 'static', text = '' } = props;
        return new Text(text, type);
    }
});
tagMap.register('image', (_0, _1, props) => {
    if (!props) return new Image(core.material.images.images['bg.jpg']);
    else {
        const {
            image = core.material.images.images['bg.jpg'],
            type = 'static'
        } = props;
        return new Image(image, type);
    }
});
tagMap.register('comment', (_0, _1, props) => {
    if (!props) return new Comment();
    else {
        const { text = '' } = props;
        return new Comment(text);
    }
});
tagMap.register('shader', (_0, _1, props) => {
    if (!props) return new Shader();
    else {
        const { type = 'static' } = props;
        return new Shader(type);
    }
});
tagMap.register('custom', (_0, _1, props) => {
    if (!props) {
        logger.error(22);
        throw new Error('Cannot create custom element.');
    } else {
        const item = props._item;
        if (!item) {
            logger.error(22);
            throw new Error('Cannot create custom element.');
        }
        return item(props);
    }
});
tagMap.register('layer', (_0, _1, props) => {
    if (!props) return new Layer();
    else {
        const { ex } = props;
        const l = new Layer();

        if (ex) {
            (ex as any[]).forEach(v => {
                l.extends(v);
            });
        }

        return l;
    }
});
tagMap.register('layer-group', (_0, _1, props) => {
    if (!props) return new LayerGroup();
    else {
        const { ex, layers } = props;
        const l = new LayerGroup();

        if (ex) {
            (ex as any[]).forEach(v => {
                l.extends(v);
            });
        }
        if (layers) {
            (layers as any[]).forEach(v => {
                l.addLayer(v);
            });
        }

        return l;
    }
});
tagMap.register<EDamageEvent, Damage>('damage', (_0, _1, props) => {
    return new Damage();
});
tagMap.register('animation', (_0, _1, props) => {
    return new Animate();
});
tagMap.register('g-rect', standardElement(Rect));
tagMap.register('g-circle', standardElement(Circle));
tagMap.register('g-ellipse', standardElement(Ellipse));
tagMap.register('g-line', standardElement(Line));
tagMap.register('g-bezier', standardElement(BezierCurve));
tagMap.register('g-quad', standardElement(QuadraticCurve));
tagMap.register('g-path', standardElement(Path));
tagMap.register('icon', standardElement(Icon));
