import { RenderFunction, RenderItem, RenderItemPosition } from '../item';
import { Transform } from '../transform';
import {
    FloorLayer,
    ILayerGroupRenderExtends,
    ILayerRenderExtends
} from '../preset/layer';
import type { EnemyCollection } from '@/game/enemy/damage';
import {
    ILineProperty,
    RectRCircleParams,
    RectREllipseParams
} from '../preset/graphics';
import { ElementAnchor, ElementLocator, ElementScale } from '../utils';
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
    /** 放缩属性，可以填 `[x比例，y比例]`，是 transform 的简写属性之一 */
    scale?: ElementScale;
    /** 旋转属性，单位弧度，是 transform 的简写属性之一 */
    rotate?: number;
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

export type CircleParams = [radius?: number, start?: number, end?: number];
export type EllipseParams = [
    radiusX?: number,
    radiusY?: number,
    start?: number,
    end?: number
];
export type LineParams = [x1: number, y1: number, x2: number, y2: number];
export type BezierParams = [
    sx: number,
    sy: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    ex: number,
    ey: number
];
export type QuadParams = [
    sx: number,
    sy: number,
    cpx: number,
    cpy: number,
    ex: number,
    ey: number
];

export interface RectProps extends GraphicPropsBase {}

export interface CirclesProps extends GraphicPropsBase {
    radius?: number;
    start?: number;
    end?: number;
    /**
     * 圆属性参数，可以填 `[半径，起始角度，终止角度]`，是 radius, start, end 的简写，
     * 其中半径可选，后两项要么都填，要么都不填
     */
    circle?: CircleParams;
}

export interface EllipseProps extends GraphicPropsBase {
    radiusX?: number;
    radiusY?: number;
    start?: number;
    end?: number;
    /**
     * 椭圆属性参数，可以填 `[x半径，y半径，起始角度，终止角度]`，是 radiusX, radiusY, start, end 的简写，
     * 其中前两项和后两项要么都填，要么都不填
     */
    ellipse?: EllipseParams;
}

export interface LineProps extends GraphicPropsBase {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    /** 直线属性参数，可以填 `[x1, y1, x2, y2]`，都是必填 */
    line?: LineParams;
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
    /** 三次贝塞尔曲线参数，可以填 `[sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey]`，都是必填 */
    curve?: BezierParams;
}

export interface QuadraticProps extends GraphicPropsBase {
    sx?: number;
    sy?: number;
    cpx?: number;
    cpy?: number;
    ex?: number;
    ey?: number;
    /** 二次贝塞尔曲线参数，可以填 `[sx, sy, cpx, cpy, ex, ey]`，都是必填 */
    curve?: QuadParams;
}

export interface PathProps extends GraphicPropsBase {
    path?: Path2D;
}

export interface RectRProps extends GraphicPropsBase {
    /**
     * 圆形圆角参数，可以填 `[r1, r2, r3, r4]`，后三项可选。填写不同数量下的表现：
     * - 1个：每个角都是 `r1` 半径的圆
     * - 2个：左上和右下是 `r1` 半径的圆，右上和左下是 `r2` 半径的圆
     * - 3个：左上是 `r1` 半径的圆，右上和左下是 `r2` 半径的圆，右下是 `r3` 半径的圆
     * - 4个：左上、右上、左下、右下 分别是 `r1, r2, r3, r4` 半径的圆
     */
    circle?: RectRCircleParams;
    /**
     * 圆形圆角参数，可以填 `[rx1, ry1, rx2, ry2, rx3, ry3, rx4, ry4]`，
     * 两两一组，后三组可选，填写不同数量下的表现：
     * - 1组：每个角都是 `[rx1, ry1]` 半径的椭圆
     * - 2组：左上和右下是 `[rx1, ry1]` 半径的椭圆，右上和左下是 `[rx2, ry2]` 半径的椭圆
     * - 3组：左上是 `[rx1, ry1]` 半径的椭圆，右上和左下是 `[rx2, ey2]` 半径的椭圆，右下是 `[rx3, ry3]` 半径的椭圆
     * - 4组：左上、右上、左下、右下 分别是 `[rx1, ry1], [rx2, ry2], [rx3, ry3], [rx4, ry4]` 半径的椭圆
     */
    ellipse?: RectREllipseParams;
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
