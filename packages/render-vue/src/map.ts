import { logger } from '@motajs/common';
import {
    ERenderItemEvent,
    RenderItem,
    RenderItemPosition,
    Container,
    ContainerCustom,
    MotaRenderer,
    Sprite,
    Shader
} from '@motajs/render-core';
import {
    Comment,
    ETextEvent,
    Image,
    Text,
    BezierCurve,
    Circle,
    Ellipse,
    Line,
    Path,
    QuadraticCurve,
    Rect,
    RectR
} from '@motajs/render-elements';
import { ElementNamespace, VNodeProps } from 'vue';

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

export const standardElement = (
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
                cache = true,
                fall = false,
                nocache = false
            } = props;
            return new Item(type, cache && !nocache, fall);
        }
    };
};

export const standardElementNoCache = (
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
                cache = false,
                fall = false,
                nocache = true
            } = props;
            return new Item(type, cache && !nocache, fall);
        }
    };
};

const enum ElementState {
    None = 0,
    Cache = 1,
    Fall = 2
}

/**
 * standardElementFor
 */
const _se = (
    Item: new (
        type: RenderItemPosition,
        cache?: boolean,
        fall?: boolean
    ) => RenderItem,
    position: RenderItemPosition,
    state: ElementState
) => {
    const defaultCache = !!(state & ElementState.Cache);
    const defautFall = !!(state & ElementState.Fall);

    return (_0: any, _1: any, props?: any) => {
        if (!props) return new Item('absolute');
        else {
            const {
                type = position,
                cache = defaultCache,
                fall = defautFall,
                nocache = !defaultCache
            } = props;
            return new Item(type, cache && !nocache, fall);
        }
    };
};

// Default elements
tagMap.register('container', standardElement(Container));
tagMap.register('container-custom', standardElement(ContainerCustom));
tagMap.register('template', standardElement(Container));
tagMap.register('mota-renderer', (_0, _1, props) => {
    return new MotaRenderer(props?.id);
});
tagMap.register('sprite', standardElement(Sprite));
tagMap.register<ETextEvent, Text>('text', (_0, _1, props) => {
    if (!props) return new Text();
    else {
        const { type = 'static', text = '' } = props;
        return new Text(text, type);
    }
});
const emptyImage = document.createElement('canvas');
emptyImage.width = 1;
emptyImage.height = 1;
tagMap.register('image', (_0, _1, props) => {
    if (!props) return new Image(emptyImage);
    else {
        const { image = emptyImage, type = 'static' } = props;
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
tagMap.register('g-rect', standardElementNoCache(Rect));
tagMap.register('g-circle', standardElementNoCache(Circle));
tagMap.register('g-ellipse', standardElementNoCache(Ellipse));
tagMap.register('g-line', standardElementNoCache(Line));
tagMap.register('g-bezier', standardElementNoCache(BezierCurve));
tagMap.register('g-quad', standardElementNoCache(QuadraticCurve));
tagMap.register('g-path', standardElementNoCache(Path));
tagMap.register('g-rectr', standardElementNoCache(RectR));
