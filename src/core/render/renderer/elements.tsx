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
    CommentProps,
    ContainerProps,
    CustomProps,
    DamageProps,
    GL2Props,
    ImageProps,
    LayerGroupProps,
    LayerProps,
    ShaderProps,
    SpriteProps,
    TextProps
} from './props';
import { ERenderItemEvent, RenderItem } from '../item';
import { ESpriteEvent, Sprite } from '../sprite';
import { EContainerEvent } from '../container';
import { EGL2Event } from '../gl2';
import { EImageEvent, ETextEvent } from '../preset/misc';
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

export type RenderItemComponent = _Define<BaseProps, ERenderItemEvent>;
export type SpriteComponent = _Define<SpriteProps, ESpriteEvent>;
export type ContainerComponent = _Define<ContainerProps, EContainerEvent>;
export type GL2Component = _Define<GL2Props, EGL2Event>;
export type ShaderComponent = _Define<ShaderProps, EShaderEvent>;
export type TextComponent = _Define<TextProps, ETextEvent>;
export type ImageComponent = _Define<ImageProps, EImageEvent>;
export type CommentComponent = _Define<CommentProps, ERenderItemEvent>;
export type LayerGroupComponent = _Define<LayerGroupProps, ELayerGroupEvent>;
export type LayerComponent = _Define<LayerProps, ELayerEvent>;
export type AnimateComponent = _Define<AnimateProps, EAnimateEvent>;
export type DamageComponent = _Define<DamageProps, EDamageEvent>;

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
            animate: TagDefine<AnimateProps, EAnimateEvent>;
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
