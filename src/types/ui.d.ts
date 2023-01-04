/**
 * 可以设置成的画布填充描边样式
 */
type CanvasStyle = string | CanvasGradient | CanvasPattern;

type ImageSource =
    | CanvasImageSource
    | ImageIds
    | `${ImageIds}${ImageReverse}`
    | NameMapIn<ImageIds>
    | `${NameMapIn<ImageIds>}${ImageReverse}`;

interface BackgroundPosInfo {
    /**
     * 横坐标
     */
    px: number;

    /**
     * 纵坐标
     */
    py: number;

    /**
     * 是否没有位置
     */
    noPeak: boolean;

    /**
     * 横坐标偏移值
     */
    xoffset: number;

    /**
     * 纵坐标偏移值
     */
    yoffset: number;

    /**
     * 画布，默认是ui
     */
    ctx: CtxRefer;

    /**
     * 箭头指向是朝上还是朝下
     */
    position: 'up' | 'bottom';
}

interface TextContentConfig {
    left: number;
    top: number;

    /**
     * 最大宽度
     */
    maxWidth: number;

    /**
     * 颜色，不影响\r
     */
    color: Color;

    /**
     * 对齐方式
     */
    align: 'left' | 'center' | 'right';

    /**
     * 字体大小
     */
    fontSize: number;

    /**
     * 行高
     */
    lineHeight: number;

    /**
     * 打字机间隔
     */
    time: number;

    /**
     * 字体名
     */
    font: string;

    /**
     * 字符间距
     */
    letterSpacing: number;

    /**
     * 是否加粗
     */
    bold: boolean;

    /**
     * 是否斜体
     */
    italic: boolean;
}

interface TextContentBlock {
    left: number;
    top: number;
    width: number;
    height: number;
    line: number;
    marginLeft: number;
    marginTop: number;
}

interface ReturnedTextContentConfig extends TextContentConfig {
    right: number;

    /**
     * 默认字体
     */
    defaultFont: string;

    /**
     * 当前绘制的文字索引
     */
    index: number;

    /**
     * 当前颜色
     */
    currcolor: Color;

    /**
     * 当前字体
     */
    currfont: string;

    /**
     * 每一行的间距
     */
    lineMargin: number;

    /**
     * 每一行间距的一半
     */
    topMargin: number;

    /**
     * 横坐标偏移量
     */
    offsetX: number;

    /**
     * 纵坐标偏移量
     */
    offsetY: number;

    /**
     * 当前行数
     */
    line: number;

    /**
     * 所有的文字
     */
    blocks: TextContentBlock[];

    /**
     * 是否是高清画布
     */
    isHD: boolean;

    /**
     * 这一行的最大高度
     */
    lineMaxHeight: number;

    /**
     * 是否是强制换行
     */
    forceChangeLine: boolean;
}

interface TextBoxConfig {
    /**
     * 画布
     */
    ctx: CtxRefer;

    /**
     * 对话框位置
     */
    pos: TextBoxPos;

    /**
     * 是否一次性全部显示
     */
    showAll: boolean;

    /**
     * 是否异步显示
     */
    async: boolean;
}

/**
 * UI窗口的绘制，如对话框、怪物手册、楼传器、存读档界面等
 */
interface Ui {
    /**
     * ui数据
     */
    uidata: UiData;

    /**
     * 根据画布名找到一个画布的context；支持系统画布和自定义画布。如果不存在画布返回null。
     * 也可以传画布的context自身，则返回自己。
     */
    getContextByName(canvas: CtxRefer): CanvasRenderingContext2D | null;

    /**
     * 清空某个画布图层
     * name为画布名，可以是系统画布之一，也可以是任意自定义动态创建的画布名；还可以直接传画布的context本身。（下同）
     * 如果name也可以是'all'，若为all则为清空所有系统画布。
     */
    clearMap(
        name: CtxRefer,
        x?: number,
        y?: number,
        w?: number,
        h?: number
    ): void;

    /**
     * 在某个画布上绘制一段文字
     * @param text 要绘制的文本
     * @param style 绘制的样式
     * @param font 绘制的字体
     * @param maxWidth 文字整体的最大宽度，如果超过会自动缩小文字使其宽度小于这个值
     */
    fillText(
        name: CtxRefer,
        text: string,
        x: number,
        y: number,
        style?: CanvasStyle,
        font?: string,
        maxWidth?: number
    ): void;

    /**
     * 根据最大宽度自动缩小字体
     * @param name 画布
     * @param text 文字
     * @param maxWidth 最大和宽度
     * @param font 字体
     */
    setFontForMaxWidth(
        name: CtxRefer,
        text: string,
        maxWidth: number,
        font?: string
    ): void;

    /**
     * 在某个画布上绘制一个描边文字
     * @param text 要绘制的文本
     * @param style 绘制的样式
     * @param strokeStyle 绘制的描边颜色
     * @param font 绘制的字体
     * @param lineWidth 描边的线宽
     */
    fillBoldText(
        name: CtxRefer,
        text: string,
        x: number,
        y: number,
        style?: CanvasStyle,
        strokeStyle?: CanvasStyle,
        font?: string,
        maxWidth?: number,
        lineWidth?: number
    ): void;

    /**
     * 绘制一个矩形
     * @param style 绘制的样式
     * @param angle 旋转角度，弧度制
     */
    fillRect(
        name: CtxRefer,
        x: number,
        y: number,
        width: number,
        height: number,
        style?: CanvasStyle,
        angle?: number
    ): void;

    /**
     * 绘制一个矩形的边框
     * @param style 绘制的样式
     * @param angle 旋转角度，单位弧度
     */
    strokeRect(
        name: CtxRefer,
        x: number,
        y: number,
        width: number,
        height: number,
        style?: CanvasStyle,
        lineWidth?: number,
        angle?: number
    ): void;

    /**
     * 在某个canvas上绘制一个圆角矩形
     */
    fillRoundRect(
        name: CtxRefer,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        style?: CanvasStyle,
        angle?: number
    ): void;

    /**
     * 在某个canvas上绘制一个圆角矩形的边框
     */
    strokeRoundRect(
        name: CtxRefer,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        style?: CanvasStyle,
        lineWidth?: number,
        angle?: number
    ): void;

    /**
     * 在某个canvas上绘制一个多边形
     */
    fillPolygon(
        name: CtxRefer,
        nodes?: [x: number, y: number][],
        style?: CanvasStyle
    ): void;

    /**
     * 在某个canvas上绘制一个多边形的边框
     */
    strokePolygon(
        name: CtxRefer,
        nodes?: [x: number, y: number][],
        style?: CanvasStyle,
        lineWidth?: number
    ): void;

    /**
     * 在某个canvas上绘制一个椭圆
     * @param a 横轴长度的一半
     * @param b 纵轴长度的一半
     * @param angle 旋转角度
     */
    fillEllipse(
        name: CtxRefer,
        x: number,
        y: number,
        a: number,
        b: number,
        angle?: number,
        style?: CanvasStyle
    ): void;

    /**
     * 在某个canvas上绘制一个圆
     */
    fillCircle(
        name: CtxRefer,
        x: number,
        y: number,
        r: number,
        style?: CanvasStyle
    ): void;

    /**
     * 在某个canvas上绘制一个椭圆的边框
     * @param a 横轴长度的一半
     * @param b 纵轴长度的一半
     * @param angle 旋转角度
     */
    strokeEllipse(
        name: CtxRefer,
        x: number,
        y: number,
        a: number,
        b: number,
        angle?: number,
        style?: CanvasStyle,
        lineWidth?: number
    ): void;

    /**
     * 在某个canvas上绘制一个圆的边框
     */
    strokeCircle(
        name: CtxRefer,
        x: number,
        y: number,
        r: any,
        style?: CanvasStyle,
        lineWidth?: number
    ): void;

    /**
     * 在某个canvas上绘制一个扇形
     */
    fillArc(
        name: CtxRefer,
        x: number,
        y: number,
        r: number,
        start: number,
        end: number,
        style?: CanvasStyle
    ): void;

    /**
     * 在某个canvas上绘制一段弧
     */
    strokeArc(
        name: CtxRefer,
        x: number,
        y: number,
        r: number,
        start: number,
        end: number,
        style?: CanvasStyle,
        lineWidth?: number
    ): void;

    /**
     * 在某个canvas上绘制一条线
     */
    drawLine(
        name: CtxRefer,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        style?: CanvasStyle,
        lineWidth?: number
    ): void;

    /**
     * 在某个canvas上绘制一个箭头
     */
    drawArrow(
        name: CtxRefer,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        style?: CanvasStyle,
        lineWidth?: number
    ): void;

    /**
     * 设置某个canvas的文字字体
     */
    setFont(name: CtxRefer, font: string): void;

    /**
     * 设置某个canvas的线宽度
     */
    setLineWidth(name: CtxRefer, lineWidth: number): void;

    /**
     * 保存某个canvas状态
     */
    saveCanvas(name: CtxRefer): void;

    /**
     * 回退某个canvas状态
     */
    loadCanvas(name: CtxRefer): void;

    /**
     * 设置某个canvas的绘制不透明度
     * @returns 之前画布的不透明度
     */
    setAlpha(name: CtxRefer, alpha: number): number;

    /**
     * 设置画布元素的不透明度
     */
    setOpacity(name: CtxRefer, opacity: number): void;

    /**
     * 设置某个canvas的滤镜
     */
    setFilter(name: CtxRefer, filter?: string): void;

    /**
     * 设置某个canvas的填充样式
     */
    setFillStyle(name: CtxRefer, style: CanvasStyle): void;

    /**
     * 设置某个canvas描边样式
     */
    setStrokeStyle(name: CtxRefer, style: CanvasStyle): void;

    /**
     * 设置某个canvas的文字左右对齐方式
     */
    setTextAlign(name: CtxRefer, align: CanvasTextAlign): void;

    /**
     * 设置某个canvas的文字上下对齐方式
     */
    setTextBaseline(name: CtxRefer, baseline: CanvasTextBaseline): void;

    /**
     * 计算某段文字的宽度，注意该函数会设置画布的字体
     */
    calWidth(name: CtxRefer, text: string, font?: string): number;

    /**
     * 字符串自动换行的分割
     */
    splitLines(
        name: CtxRefer,
        text: string,
        maxWidth?: number,
        font?: string
    ): string[];

    /**
     * 绘制图片
     * @param dx 绘制的横坐标
     * @param dy 绘制的纵坐标
     */
    drawImage(name: CtxRefer, image: ImageSource, dx: number, dy: number): void;
    /**
     * 绘制图片
     * @param dx 绘制的横坐标
     * @param dy 绘制的纵坐标
     * @param dw 绘制的宽度
     * @param dh 绘制的高度
     */
    drawImage(
        name: CtxRefer,
        image: ImageSource,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): void;
    /**
     * 绘制图片
     * @param sx 裁剪的横坐标
     * @param sy 裁剪的纵坐标
     * @param sw 裁剪的宽度
     * @param sh 裁剪的高度
     * @param dx 绘制的横坐标
     * @param dy 绘制的纵坐标
     * @param dw 绘制的宽度
     * @param dh 绘制的高度
     */
    drawImage(
        name: CtxRefer,
        image: ImageSource,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): void;

    /**
     * 在某个canvas上绘制一个图标
     * @param frame 图标的第几帧
     */
    drawIcon(
        name: CtxRefer,
        id: AllIds | 'hero',
        x: number,
        y: number,
        w?: number,
        h?: number,
        frame?: number
    ): void;

    /**
     * 结束一切事件和绘制，关闭UI窗口，返回游戏进程
     */
    closePanel(): void;

    /**
     * 清空UI层内容
     */
    clearUI(): void;

    /**
     * 左上角绘制一段提示
     * @param text 要提示的文字内容
     * @param id 要绘制的图标ID
     * @param frame 要绘制图标的第几帧
     */
    drawTip(text: string, id?: AllIds, frame?: number): void;

    /**
     * 地图中间绘制一段文字
     */
    drawText(contents: string, callback?: () => void): void;

    /**
     * 自绘选择光标
     */
    drawUIEventSelector(
        code: number,
        background: RGBArray | ImageIds,
        x: number,
        y: number,
        w: number,
        h: number,
        z?: number
    ): void;

    /**
     * 清除一个或多个选择光标
     * @param code 要清除的选择光标，不填表示清除所有
     */
    clearUIEventSelector(code?: number | number[]): void;

    /**
     * 绘制WindowSkin
     * @param direction 指向箭头的方向
     */
    drawWindowSkin(
        background: any,
        ctx: CtxRefer,
        x: number,
        y: number,
        w: number,
        h: number,
        direction?: 'up' | 'down',
        px?: number,
        py?: number
    ): void;

    /**
     * 绘制一个背景图，可绘制winskin或纯色背景；支持小箭头绘制
     */
    drawBackground(
        left: string,
        top: string,
        right: string,
        bottom: string,
        posInfo?: Partial<BackgroundPosInfo>
    ): void;

    /**
     * 绘制一段文字到某个画布上面
     * @param ctx 要绘制到的画布
     * @param content 要绘制的内容；转义字符只允许保留 \n, \r[...], \i[...], \c[...], \d, \e
     * @param config 绘制配置项
     * @returns 绘制信息
     */
    drawTextContent(
        ctx: CtxRefer,
        content: string,
        config: Partial<TextContentConfig>
    ): ReturnedTextContentConfig;

    /**
     * 获得某段文字的预计绘制高度
     */
    getTextContentHeight(
        content: string,
        config: Partial<TextContentConfig>
    ): number;

    /**
     * 绘制一个对话框
     */
    drawTextBox(content: string, config?: TextBoxConfig): void;

    /**
     * 绘制滚动字幕
     */
    drawScrollText(
        content: string,
        time?: number,
        lineHeight?: number,
        callback?: () => void
    ): void;

    /**
     * 文本图片化
     */
    textImage(content: string, lineHeight?: number): HTMLCanvasElement;

    /**
     * 绘制一个选项界面
     */
    drawChoices(
        content: string,
        choices: string[],
        width?: number,
        ctx?: CtxRefer
    ): void;

    /**
     * 绘制一个确认框
     */
    drawConfirmBox(
        text: string,
        yesCallback?: () => void,
        noCallback?: () => void,
        ctx?: CtxRefer
    ): void;

    /**
     * 绘制等待界面
     */
    drawWaiting(text: string): void;

    /**
     * 绘制分页
     */
    drawPagination(page: number, totalPage: number, y?: number): void;

    /**
     * 绘制怪物手册
     */
    drawBook(index: number): void;

    /**
     * 绘制楼层传送器
     */
    drawFly(page: number): void;

    /**
     * 获得所有应该在道具栏显示的某个类型道具
     */
    getToolboxItems<T extends Exclude<ItemCls, 'items'>>(cls: T): ItemIdOf<T>[];

    /**
     * 动态创建一个画布
     * @param name 画布名称，如果已存在则会直接取用当前存在的
     * @param x 横坐标
     * @param y 纵坐标
     * @param width 宽度
     * @param height 高度
     * @param zIndex 纵深
     * @param nonAntiAliasing 是否取消抗锯齿
     */
    createCanvas(
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        zIndex?: number,
        nonAntiAliasing?: boolean
    ): CanvasRenderingContext2D;

    /**
     * 重新定位一个自定义画布
     */
    relocateCanvas(
        name: CtxRefer,
        x: number,
        y: number,
        useDelta?: boolean
    ): void;

    /**
     * 设置一个自定义画布的旋转角度
     */
    rotateCanvas(
        name: CtxRefer,
        angle: number,
        centerX?: number,
        centerY?: number
    ): void;

    /**
     * 重新设置一个自定义画布的大小
     * @param styleOnly 是否只修改style，而不修改元素上的长宽，如果是true，会出现模糊现象
     * @param isTempCanvas 是否是临时画布，如果填true，会将临时画布修改为高清画布
     */
    resizeCanvas(
        name: CtxRefer,
        x?: number,
        y?: number,
        styleOnly?: boolean,
        isTempCanvas?: boolean
    ): void;

    /**
     * 删除一个自定义画布
     */
    deleteCanvas(name: string | ((name: string) => boolean)): void;

    /**
     * 清空所有的自定义画布
     */
    deleteAllCanvas(): void;

    /**
     * 绘制浏览地图
     */
    _drawViewMaps();
}

declare const ui: new () => Ui;
