import {
    RenderFunction,
    RenderItem,
    RenderItemPosition,
    Transform,
    ElementAnchor,
    ElementLocator,
    ElementScale,
    CustomContainerRenderFn
} from '@motajs/render-core';
import {
    BezierParams,
    CanvasStyle,
    CircleParams,
    EllipseParams,
    ILineProperty,
    LineParams,
    QuadParams,
    RectRCircleParams,
    RectREllipseParams
} from '@motajs/render-elements';
import { Font } from '@motajs/render-style';

export interface CustomProps {
    _item: (props: BaseProps) => RenderItem;
}

export interface BaseProps {
    /** 元素的横坐标 */
    x?: number;
    /** 元素的纵坐标 */
    y?: number;
    /** 元素的横向锚点位置 */
    anchorX?: number;
    /** 元素的纵向锚点位置 */
    anchorY?: number;
    /** 元素的纵深，值越大越靠上 */
    zIndex?: number;
    /** 元素的宽度 */
    width?: number;
    /** 元素的高度 */
    height?: number;
    /** 元素的滤镜 */
    filter?: string;
    /** 是否启用高清画布 */
    hd?: boolean;
    /** 是否启用抗锯齿 */
    anti?: boolean;
    /** 是否不启用抗锯齿，优先级大于 anti，主要用于像素图片渲染 */
    noanti?: boolean;
    /** 元素是否隐藏，可以用于一些画面效果，也可以用于调试 */
    hidden?: boolean;
    /** 元素的变换矩阵 */
    transform?: Transform;
    /** 元素的定位模式，static 表示常规定位，absolute 定位模式下元素位置始终处于左上角 */
    type?: RenderItemPosition;
    /** 是否启用缓存，用处较少，主要用于一些默认不启用缓存的元素的特殊优化 */
    cache?: boolean;
    /** 是否不启用缓存，优先级大于 cache，用处较少，主要用于一些特殊优化 */
    nocache?: boolean;
    /** 是否启用变换矩阵下穿，下穿模式下，当前元素会使用由父元素传递过来的变换矩阵，而非元素自身的 */
    fall?: boolean;
    /** 这个元素的唯一标识符，不可重复 */
    id?: string;
    /** 这个元素的不透明度 */
    alpha?: number;
    /** 这个元素与已渲染内容的混合模式，默认为 source-over */
    composite?: GlobalCompositeOperation;
    /** 鼠标放在这个元素上时的光标样式 */
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
    /** 这个元素是否不会触发任何交互事件（cursor 属性也会无效），当执行到此元素时，会下穿至下一个元素 */
    noevent?: boolean;
}

export interface SpriteProps extends BaseProps {
    /** 自定义的渲染函数 */
    render?: RenderFunction;
}

export interface ContainerProps extends BaseProps {}

export interface ConatinerCustomProps extends ContainerProps {
    /** 自定义容器渲染函数 */
    render?: CustomContainerRenderFn;
}

export interface GL2Props extends BaseProps {}

export interface ShaderProps extends BaseProps {}

export interface TextProps extends BaseProps {
    /** 要渲染的文字 */
    text?: string;
    /** 文字的填充样式 */
    fillStyle?: CanvasStyle;
    /** 文字的描边样式 */
    strokeStyle?: CanvasStyle;
    /** 文字的字体 */
    font?: Font;
    /** 文字的描边粗细 */
    strokeWidth?: number;
}

export interface ImageProps extends BaseProps {
    /** 图片对象 */
    image: CanvasImageSource;
}

export interface CommentProps extends BaseProps {
    text?: string;
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
    /** 在交互时，是否只检查交互位置只在描边上，对 fill, stroke, strokeAndFill 均有效 */
    actionStroke?: boolean;
}

export interface RectProps extends GraphicPropsBase {}

export interface CirclesProps extends GraphicPropsBase {
    radius?: number;
    start?: number;
    end?: number;
    /**
     * 圆属性参数，可以填 `[圆心 x 坐标，圆心 y 坐标，半径，起始角度，终止角度]`，是 x, y, radius, start, end 的简写，
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
     * 椭圆属性参数，可以填 `[圆心 x 坐标，圆心 y 坐标，x半径，y半径，起始角度，终止角度]`，是 x, y, radiusX, radiusY, start, end 的简写，
     * 其中每两项要么都填，要么都不填
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
     * 椭圆圆角参数，可以填 `[rx1, ry1, rx2, ry2, rx3, ry3, rx4, ry4]`，
     * 两两一组，后三组可选，填写不同数量下的表现：
     * - 1组：每个角都是 `[rx1, ry1]` 半径的椭圆
     * - 2组：左上和右下是 `[rx1, ry1]` 半径的椭圆，右上和左下是 `[rx2, ry2]` 半径的椭圆
     * - 3组：左上是 `[rx1, ry1]` 半径的椭圆，右上和左下是 `[rx2, ey2]` 半径的椭圆，右下是 `[rx3, ry3]` 半径的椭圆
     * - 4组：左上、右上、左下、右下 分别是 `[rx1, ry1], [rx2, ry2], [rx3, ry3], [rx4, ry4]` 半径的椭圆
     */
    ellipse?: RectREllipseParams;
}
