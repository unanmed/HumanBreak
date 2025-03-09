import {
    ComponentOptionsMixin,
    defineComponent,
    DefineComponent,
    h,
    ReservedProps,
    VNodeProps
} from 'vue';
import EventEmitter from 'eventemitter3';
import {
    AnimateProps,
    BaseProps,
    BezierProps,
    CirclesProps,
    CommentProps,
    ConatinerCustomProps,
    ContainerProps,
    CustomProps,
    DamageProps,
    EllipseProps,
    IconProps,
    ImageProps,
    LayerGroupProps,
    LayerProps,
    LineProps,
    PathProps,
    QuadraticProps,
    RectProps,
    RectRProps,
    ShaderProps,
    SpriteProps,
    TextProps,
    WinskinProps
} from './props';
import {
    ERenderItemEvent,
    RenderItem,
    ESpriteEvent,
    EContainerEvent,
    EShaderEvent
} from '@motajs/render-core';
import {
    EIconEvent,
    EImageEvent,
    ETextEvent,
    EWinskinEvent,
    ELayerEvent,
    ELayerGroupEvent,
    EAnimateEvent,
    EGraphicItemEvent
} from '@motajs/render-elements';

export type WrapEventEmitterEvents<T extends EventEmitter.ValidEventTypes> =
    T extends string | symbol
        ? T
        : {
              [P in keyof T]: T[P] extends any[]
                  ? (...args: T[P]) => void
                  : (...args: any[]) => void;
          };

type MappingEvent<E extends ERenderItemEvent> = {
    [P in keyof WrapEventEmitterEvents<E> as P extends string
        ? `on${Capitalize<P>}`
        : never]?: WrapEventEmitterEvents<E>[P];
};

type _Define<P extends BaseProps, E extends ERenderItemEvent> = DefineComponent<
    P,
    {},
    {},
    {},
    {},
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    WrapEventEmitterEvents<E>,
    Exclude<keyof WrapEventEmitterEvents<E>, number | symbol>,
    VNodeProps,
    Readonly<P & MappingEvent<E>>
>;

export type TagDefine<T extends object, E extends ERenderItemEvent> = T &
    MappingEvent<E> &
    ReservedProps;

declare module 'vue/jsx-runtime' {
    namespace JSX {
        export interface IntrinsicElements {
            sprite: TagDefine<SpriteProps, ESpriteEvent>;
            container: TagDefine<ContainerProps, EContainerEvent>;
            'container-custom': TagDefine<
                ConatinerCustomProps,
                EContainerEvent
            >;
            shader: TagDefine<ShaderProps, EShaderEvent>;
            text: TagDefine<TextProps, ETextEvent>;
            image: TagDefine<ImageProps, EImageEvent>;
            comment: TagDefine<CommentProps, ERenderItemEvent>;
            custom: TagDefine<CustomProps, ERenderItemEvent>;
            layer: TagDefine<LayerProps, ELayerEvent>;
            'layer-group': TagDefine<LayerGroupProps, ELayerGroupEvent>;
            damage: TagDefine<DamageProps, ERenderItemEvent>;
            animation: TagDefine<AnimateProps, EAnimateEvent>;
            'g-rect': TagDefine<RectProps, EGraphicItemEvent>;
            'g-circle': TagDefine<CirclesProps, EGraphicItemEvent>;
            'g-ellipse': TagDefine<EllipseProps, EGraphicItemEvent>;
            'g-line': TagDefine<LineProps, EGraphicItemEvent>;
            'g-bezier': TagDefine<BezierProps, EGraphicItemEvent>;
            'g-quad': TagDefine<QuadraticProps, EGraphicItemEvent>;
            'g-path': TagDefine<PathProps, EGraphicItemEvent>;
            'g-rectr': TagDefine<RectRProps, EGraphicItemEvent>;
            icon: TagDefine<IconProps, EIconEvent>;
            winskin: TagDefine<WinskinProps, EWinskinEvent>;
        }
    }
}

export interface InstancedElementProp {
    item: RenderItem;
}

export function wrapInstancedComponent<
    P extends BaseProps = BaseProps,
    E extends ERenderItemEvent = ERenderItemEvent,
    C extends RenderItem = RenderItem
>(onCreate: (props: P) => C): _Define<P, E> {
    const Com = defineComponent((props, ctx) => {
        return () => {
            const p = {
                ...props,
                ...ctx.attrs,
                _item: onCreate
            };
            return h('custom', p, ctx.slots);
        };
    });
    return Com as _Define<P, E>;
}
