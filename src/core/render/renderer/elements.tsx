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
    ContainerProps,
    CustomProps,
    DamageProps,
    EllipseProps,
    GL2Props,
    IconProps,
    ImageProps,
    LayerGroupProps,
    LayerProps,
    LineProps,
    PathProps,
    QuadraticProps,
    RectProps,
    ShaderProps,
    SpriteProps,
    TextProps
} from './props';
import { ERenderItemEvent, RenderItem } from '../item';
import { ESpriteEvent, Sprite } from '../sprite';
import { EContainerEvent } from '../container';
import { EGL2Event } from '../gl2';
import { EIconEvent, EImageEvent, ETextEvent } from '../preset/misc';
import { ELayerEvent, ELayerGroupEvent } from '../preset/layer';
import { EAnimateEvent } from '../preset/animate';
import { EDamageEvent } from '../preset/damage';
import { EShaderEvent } from '../shader';

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

type TagDefine<T extends object, E extends ERenderItemEvent> = T &
    MappingEvent<E> &
    ReservedProps;

declare module 'vue/jsx-runtime' {
    namespace JSX {
        export interface IntrinsicElements {
            sprite: TagDefine<SpriteProps, ESpriteEvent>;
            container: TagDefine<ContainerProps, EContainerEvent>;
            shader: TagDefine<ShaderProps, EShaderEvent>;
            text: TagDefine<TextProps, ETextEvent>;
            image: TagDefine<ImageProps, EImageEvent>;
            comment: TagDefine<CommentProps, ERenderItemEvent>;
            custom: TagDefine<CustomProps, ERenderItemEvent>;
            layer: TagDefine<LayerProps, ELayerEvent>;
            'layer-group': TagDefine<LayerGroupProps, ELayerGroupEvent>;
            damage: TagDefine<DamageProps, EDamageEvent>;
            animation: TagDefine<AnimateProps, EAnimateEvent>;
            'g-rect': TagDefine<RectProps, ERenderItemEvent>;
            'g-circle': TagDefine<CirclesProps, ERenderItemEvent>;
            'g-ellipse': TagDefine<EllipseProps, ERenderItemEvent>;
            'g-line': TagDefine<LineProps, ERenderItemEvent>;
            'g-bezier': TagDefine<BezierProps, ERenderItemEvent>;
            'g-quad': TagDefine<QuadraticProps, ERenderItemEvent>;
            'g-path': TagDefine<PathProps, ERenderItemEvent>;
            icon: TagDefine<IconProps, EIconEvent>;
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
