import { RenderFunction, RenderItem, RenderItemPosition } from '../item';
import { Transform } from '../transform';
import {
    FloorLayer,
    ILayerGroupRenderExtends,
    ILayerRenderExtends
} from '../preset/layer';
import type { EnemyCollection } from '@/game/enemy/damage';

export interface CustomProps {
    _item: (props: BaseProps) => RenderItem;
}

export interface BaseProps {
    x?: number;
    y?: number;
    anchorX?: number;
    anchorY?: number;
    zIndex?: number;
    width?: number;
    height?: number;
    filter?: string;
    hd?: boolean;
    antiAliasing?: boolean;
    hidden?: boolean;
    transform?: Transform;
    type?: RenderItemPosition;
    enableCache?: boolean;
    fallthrough?: boolean;
    id?: string;
    alpha?: number;
    composite?: GlobalCompositeOperation;
}

export interface SpriteProps extends BaseProps {
    render?: RenderFunction;
}

export interface ContainerProps extends BaseProps {}

export interface GL2Props extends BaseProps {}

export interface ShaderProps extends BaseProps {}

export interface TextProps extends BaseProps {
    text?: string;
    fillStyle?: CanvasStyle;
    strokeStyle?: CanvasStyle;
    font?: string;
    strokeWidth?: number;
}

export interface ImageProps extends BaseProps {
    image: CanvasImageSource;
}

export interface CommentProps extends BaseProps {
    text?: string;
}

export interface LayerGroupProps extends BaseProps {
    cellSize?: number;
    blockSize?: number;
    floorId?: FloorIds;
    bindThisFloor?: boolean;
    camera?: Transform;
    ex?: readonly ILayerGroupRenderExtends[];
    layers?: readonly FloorLayer[];
}

export interface LayerProps extends BaseProps {
    layer?: FloorLayer;
    mapWidth?: number;
    mapHeight?: number;
    cellSize?: number;
    background?: AllNumbers;
    floorImage?: FloorAnimate[];
    ex?: readonly ILayerRenderExtends[];
}

export interface AnimateProps extends BaseProps {}

export interface DamageProps extends BaseProps {
    mapWidth?: number;
    mapHeight?: number;
    cellSize?: number;
    enemy?: EnemyCollection;
    font?: string;
    strokeStyle?: CanvasStyle;
    strokeWidth?: number;
}

export interface RectProps extends BaseProps {}

export interface CirclesProps extends BaseProps {}

export interface EllipseProps extends BaseProps {}

export interface LineProps extends BaseProps {}

export interface BezierProps extends BaseProps {}

export interface QuadraticProps extends BaseProps {}

export interface PathProps extends BaseProps {}

export interface IconProps extends BaseProps {}
