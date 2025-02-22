import { RenderFunction, RenderItem, RenderItemPosition } from '../item';
import { Transform } from '../transform';
import {
    FloorLayer,
    ILayerGroupRenderExtends,
    ILayerRenderExtends
} from '../preset/layer';
import type { EnemyCollection } from '@/game/enemy/damage';
import { ILineProperty } from '../preset/graphics';
import { ElementAnchor, ElementLocator } from '../utils';
import { CustomContainerRenderFn } from '../container';

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
    /** 是否启用缓存，用处较少，主要用于一些默认不启用缓存的元素的特殊优化 */
    cache?: boolean;
    /** 是否不启用缓存，优先级大于 cache，用处较少，主要用于一些特殊优化 */
    nocache?: boolean;
    fall?: boolean;
    id?: string;
    alpha?: number;
    composite?: GlobalCompositeOperation;
    cursor?: string;
    /**
     * 定位属性，可以填 `[横坐标，纵坐标，宽度，高度，x锚点，y锚点]`，
     * 对于横坐标与纵坐标、宽度与高度、x锚点与y锚点，两两一组要么都填，要么都不填
     * 是 x, y, width, height, anchorX, anchorY 的简写属性
     */
    loc?: ElementLocator;
    /** 锚点属性，可以填 `[x锚点，y锚点]`，是 anchorX, anchorY 的简写属性 */
    anc?: ElementAnchor;
}

export interface SpriteProps extends BaseProps {
    render?: RenderFunction;
}

export interface ContainerProps extends BaseProps {}

export interface ConatinerCustomProps extends ContainerProps {
    render?: CustomContainerRenderFn;
}

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

export interface GraphicPropsBase extends BaseProps, Partial<ILineProperty> {
    /** 是否填充，若填写 {@link stroke}，那么表现为先填充后描边 */
    fill?: boolean;
    /** 是否描边，若填写 {@link fill}，那么表现为先填充后描边 */
    stroke?: boolean;
    /** 是否先描边后填充，优先级最高，若设置，则 {@link fill} 与 {@link stroke} 无效。 */
    strokeAndFill?: boolean;
    /** 填充原则，比如 `nonzero` 表示非零环绕原则，默认为奇偶环绕原则 `evenodd` */
    fillRule?: CanvasFillRule;
    /** 填充样式 */
    fillStyle?: CanvasStyle;
    /** 描边样式 */
    strokeStyle?: CanvasStyle;
}

export interface RectProps extends GraphicPropsBase {}

export interface CirclesProps extends GraphicPropsBase {
    radius?: number;
    start?: number;
    end?: number;
}

export interface EllipseProps extends GraphicPropsBase {
    radiusX?: number;
    radiusY?: number;
    start?: number;
    end?: number;
}

export interface LineProps extends GraphicPropsBase {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

export interface BezierProps extends GraphicPropsBase {
    sx?: number;
    sy?: number;
    cp1x?: number;
    cp1y?: number;
    cp2x?: number;
    cp2y?: number;
    ex?: number;
    ey?: number;
}

export interface QuadraticProps extends GraphicPropsBase {
    sx?: number;
    sy?: number;
    cpx?: number;
    cpy?: number;
    ex?: number;
    ey?: number;
}

export interface PathProps extends GraphicPropsBase {
    path?: Path2D;
}

export interface RectRProps extends GraphicPropsBase {
    /** 圆角半径，此参数传入时，radiusX 和 radiusY 应保持一致 */
    radius: number;
    /** 圆角横向半径 */
    radiusX?: number;
    /** 圆角纵向半径 */
    radiusY?: number;
    /** 圆角为线模式 */
    line?: boolean;
    /** 圆角为椭圆模式，默认值 */
    ellipse?: boolean;
    /** 圆角为二次贝塞尔曲线模式 */
    quad?: boolean;
    /** 圆角为三次贝塞尔曲线模式 */
    cubic?: boolean;
    /** 控制点，此参数传入时，cpx 和 cpy 应保持一致 */
    cp?: number;
    /** 横向控制点 */
    cpx?: number;
    /** 纵向控制点 */
    cpy?: number;
}

export interface IconProps extends BaseProps {
    icon: AllNumbers;
    frame?: number;
    animate?: boolean;
}

export interface WinskinProps extends BaseProps {
    image: ImageIds;
    borderSize?: number;
}
