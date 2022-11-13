/** @file ui.js 主要用来进行UI窗口的绘制，如对话框、怪物手册、楼传器、存读档界面等等。*/
declare class ui {
    /**
     * 根据画布名找到一个画布的context；支持系统画布和自定义画布。如果不存在画布返回null。
     * 也可以传画布的context自身，则返回自己。
     */
    getContextByName(canvas: CtxRefer): CanvasRenderingContext2D;

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
     */
    fillText(
        name: CtxRefer,
        text: string,
        x: number,
        y: number,
        style?: string,
        font?: string,
        maxWidth?: number
    ): void;

    /**
     * 在某个画布上绘制一个描黑边的文字
     * @param text 要绘制的文本
     * @param style 绘制的样式
     * @param strokeStyle 绘制的描边颜色
     * @param font 绘制的字体
     */
    fillBoldText(
        name: CtxRefer,
        text: string,
        x: number,
        y: number,
        style?: string,
        strokeStyle?: string,
        font?: string,
        maxWidth?: number,
        lineWidth?: number
    ): void;

    /**
     * 绘制一个矩形。style可选为绘制样式
     * @param style 绘制的样式
     * @param angle 旋转角度，弧度制
     */
    fillRect(
        name: CtxRefer,
        x: number,
        y: number,
        width: number,
        height: number,
        style?: string,
        angle?: number
    ): void;

    /**
     * 绘制一个矩形的边框
     * @param style 绘制的样式
     */
    strokeRect(
        name: CtxRefer,
        x: number,
        y: number,
        width: number,
        height: number,
        style: string,
        lineWidth?: number,
        angle?: number
    ): void;

    /**
     * 动态创建一个画布。name为要创建的画布名，如果已存在则会直接取用当前存在的。
     * x,y为创建的画布相对窗口左上角的像素坐标，width,height为创建的长宽。
     * zIndex为创建的纵向高度（关系到画布之间的覆盖），z值高的将覆盖z值低的；系统画布的z值可在个性化中查看。
     * 返回创建的画布的context，也可以通过core.dymCanvas[name]调用
     */
    createCanvas(
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        zIndex: number
    ): CanvasRenderingContext2D;

    /** 重新定位一个自定义画布 */
    relocateCanvas(name: string, x: number, y: number, useDelta: boolean): void;

    /**
     * 重新设置一个自定义画布的大小
     * @param styleOnly 是否只修改style，而不修改元素上的长宽，如果是true，会出现模糊现象
     * @param isTempCanvas 是否是临时画布，如果填true，会将临时画布修改为高清画布
     */
    resizeCanvas(
        name: string,
        x?: number,
        y?: number,
        styleOnly?: boolean,
        isTempCanvas?: boolean
    ): void;

    /** 设置一个自定义画布的旋转角度 */
    rotateCanvas(
        name: CtxRefer,
        angle: number,
        centerX?: number,
        centerY?: number
    ): void;

    /** 删除一个自定义画布 */
    deleteCanvas(name: string | ((name: string) => boolean)): void;

    /** 清空所有的自定义画布 */
    deleteAllCanvas(): void;

    /**
     *  在一个画布上绘制图片
     *  后面的8个坐标参数与canvas的drawImage的八个参数完全相同。
     *  请查看 http://www.w3school.com.cn/html5/canvas_drawimage.asp 了解更多。
     * @param name 可以是系统画布之一，也可以是任意自定义动态创建的画布名 画布名称或者画布的context
     * @param image 要绘制的图片，可以是一个全塔属性中定义的图片名（会从images中去获取），图片本身，或者一个画布。
     */
    drawImage(
        name: CtxRefer,
        image: CanvasImageSource | string,
        dx: number,
        dy: number
    ): void;
    drawImage(
        name: CtxRefer,
        image: CanvasImageSource | string,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): void;
    drawImage(
        name: CtxRefer,
        image: CanvasImageSource | string,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number
    ): void;

    /** 根据最大宽度自动缩小字体 */
    setFontForMaxWidth(
        name: string | CanvasRenderingContext2D,
        text: string,
        maxWidth: number,
        font?: any
    ): string;

    /** 在某个canvas上绘制一个圆角矩形 */
    fillRoundRect(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        style?: string,
        angle?: number
    ): void;

    /** 在某个canvas上绘制一个圆角矩形的边框 */
    strokeRoundRect(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        style?: string,
        lineWidth?: number,
        angle?: number
    ): void;

    /** 在某个canvas上绘制一个多边形 */
    fillPolygon(
        name: string | CanvasRenderingContext2D,
        nodes?: any,
        style?: string
    ): void;

    /** 在某个canvas上绘制一个多边形的边框 */
    strokePolygon(
        name: string | CanvasRenderingContext2D,
        nodes?: any,
        style?: string,
        lineWidth?: number
    ): void;

    /** 在某个canvas上绘制一个椭圆 */
    fillEllipse(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        a: number,
        b: number,
        angle?: number,
        style?: any
    ): void;

    /** 在某个canvas上绘制一个圆 */
    fillCircle(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        r: number,
        style?: string
    ): void;

    /** 在某个canvas上绘制一个椭圆的边框 */
    strokeEllipse(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        a: number,
        b: number,
        angle?: number,
        style?: string,
        lineWidth?: number
    ): void;

    /** 在某个canvas上绘制一个圆的边框 */
    strokeCircle(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        r: any,
        style?: string,
        lineWidth?: number
    ): void;

    /** 在某个canvas上绘制一个扇形 */
    fillArc(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        r: number,
        start: number,
        end: number,
        style?: string
    ): void;

    /** 在某个canvas上绘制一段弧 */
    strokeArc(
        name: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        r: number,
        start: number,
        end: number,
        style?: string,
        lineWidth?: number
    ): void;

    /** 保存某个canvas状态 */
    saveCanvas(name: string | CanvasRenderingContext2D): void;

    /** 加载某个canvas状态 */
    loadCanvas(name: string | CanvasRenderingContext2D): void;

    /** 设置某个canvas的baseline */
    setTextBaseline(
        name: string | CanvasRenderingContext2D,
        baseline: any
    ): void;

    /** 字符串自动换行的分割 */
    splitLines(
        name: string | CanvasRenderingContext2D,
        text: string,
        maxWidth?: number,
        font?: string
    ): void;

    /** 在某个canvas上绘制一个图标 */
    drawIcon(
        name: string | CanvasRenderingContext2D,
        id: string,
        x: number,
        y: number,
        w?: number,
        h?: number,
        frame?: number
    ): void;

    /** 结束一切事件和绘制，关闭UI窗口，返回游戏进程 */
    closePanel(): void;

    /** 清空UI层内容 */
    clearUI(): void;

    /**
     * 左上角绘制一段提示
     * @param text 要提示的文字内容，支持 ${} 语法
     * @param id 要绘制的图标ID
     * @param frame 要绘制图标的第几帧
     */
    drawTip(text: string, id?: string, frame?: number): void;

    /** 地图中间绘制一段文字 */
    drawText(contents: string, callback?: () => any): void;

    /** 自绘选择光标 */
    drawUIEventSelector(
        code: number,
        background: string,
        x: number,
        y: number,
        w: number,
        h: number,
        z?: number
    ): void;

    /** 清除一个或多个选择光标 */
    clearUIEventSelector(code: number | number[]): void;

    /** 绘制一个确认框 */
    drawConfirmBox(
        text: string,
        yesCallback?: () => void,
        noCallback?: () => void
    ): void;

    /** 绘制WindowSkin */
    drawWindowSkin(
        background: any,
        ctx: string | CanvasRenderingContext2D,
        x: number,
        y: number,
        w: string,
        h: string,
        direction?: any,
        px?: any,
        py?: any
    ): void;

    /** 绘制一个背景图，可绘制winskin或纯色背景；支持小箭头绘制 */
    drawBackground(
        left: string,
        top: string,
        right: string,
        bottom: string,
        posInfo?: any
    ): void;

    /**
     * 绘制一段文字到某个画布上面
     * @param ctx 要绘制到的画布
     * @param content 要绘制的内容；转义字符只允许保留 \n, \r[...], \i[...], \c[...], \d, \e
     * @param config 绘制配置项，目前暂时包含如下内容（均为可选）
     *                left, top：起始点位置；maxWidth：单行最大宽度；color：默认颜色；align：左中右
     *                fontSize：字体大小；lineHeight：行高；time：打字机间隔；font：默认字体名
     * @returns 绘制信息
     */
    drawTextContent(
        ctx: string | CanvasRenderingContext2D,
        content: string,
        config: TextContentConfig
    ): any;

    /** 获得某段文字的预计绘制高度；参见 drawTextContent */
    getTextContentHeight(content: string, config?: any): void;

    /** 绘制一个对话框 */
    drawTextBox(content: string, config?: any): void;

    /** 绘制滚动字幕 */
    drawScrollText(
        content: string,
        time: number,
        lineHeight?: number,
        callback?: () => any
    ): void;

    /** 文本图片化 */
    textImage(content: string, lineHeight?: number): any;

    /** 绘制一个选项界面 */
    drawChoices(content: string, choices: any): void;

    /** 绘制等待界面 */
    drawWaiting(text: string): void;

    /** 绘制分页 */
    drawPagination(page?: any, totalPage?: any, y?: number): void;

    /** 绘制怪物手册 */
    drawBook(index?: any): void;

    /** 绘制楼层传送器 */
    drawFly(page?: any): void;

    /** 获得所有应该在道具栏显示的某个类型道具 */
    getToolboxItems(cls: string): string[];

    /** 绘制状态栏 */
    drawStatusBar(): void;

    /** 绘制灯光效果 */
    drawLight(
        name: string | CanvasRenderingContext2D,
        color?: any,
        lights?: any,
        lightDec?: number
    ): void;

    /** 在某个canvas上绘制一条线 */
    drawLine(
        name: string | CanvasRenderingContext2D,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        style?: string,
        lineWidth?: number
    ): void;

    /** 在某个canvas上绘制一个箭头 */
    drawArrow(
        name: string | CanvasRenderingContext2D,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        style?: string,
        lineWidth?: number
    ): void;

    /** 设置某个canvas的文字字体 */
    setFont(name: string | CanvasRenderingContext2D, font: string): void;

    /** 设置某个canvas的线宽度 */
    setLineWidth(
        name: string | CanvasRenderingContext2D,
        lineWidth: number
    ): void;

    /** 设置某个canvas的alpha值；返回设置之前画布的不透明度。 */
    setAlpha(name: string | CanvasRenderingContext2D, alpha: number): number;

    /** 设置某个canvas的filter属性 */
    setFilter(name: string | CanvasRenderingContext2D, filter: any): void;

    /** 设置某个canvas的透明度；尽量不要使用本函数，而是全部换成setAlpha实现 */
    setOpacity(name: string | CanvasRenderingContext2D, opacity: number): void;

    /** 设置某个canvas的绘制属性（如颜色等） */
    setFillStyle(name: string | CanvasRenderingContext2D, style: string): void;

    /** 设置某个canvas边框属性 */
    setStrokeStyle(
        name: string | CanvasRenderingContext2D,
        style: string
    ): void;

    /** 设置某个canvas的对齐 */
    setTextAlign(name: string | CanvasRenderingContext2D, align: string): void;

    /** 计算某段文字的宽度 */
    calWidth(
        name: string | CanvasRenderingContext2D,
        text: string,
        font?: string
    ): number;
}
