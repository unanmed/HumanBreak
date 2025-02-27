import { logger } from '@/core/common/logger';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import {
    AutotileRenderable,
    onTick,
    RenderableData,
    texture
} from '@/core/render';
import EventEmitter from 'eventemitter3';
import { isNil } from 'lodash-es';

export const enum WordBreak {
    /** 不换行 */
    None,
    /** 仅空格和连字符等可换行，CJK 字符可任意换行，默认值 */
    Space,
    /** 所有字符都可以换行 */
    All
}

export const enum TextAlign {
    Left,
    Center,
    End
}

export interface ITextContentConfig {
    /** 字体类型 */
    fontFamily: string;
    /** 字体大小 */
    fontSize: number;
    /** 字体线宽 */
    fontWeight: number;
    /** 是否斜体 */
    fontItalic: boolean;
    /** 是否持续上一次的文本，开启后，如果修改后的文本以修改前的文本为开头，那么会继续播放而不会从头播放 */
    keepLast: boolean;
    /** 打字机时间间隔，即两个字出现之间相隔多长时间 */
    interval: number;
    /** 行高 */
    lineHeight: number;
    /** 分词规则 */
    wordBreak: WordBreak;
    /** 文字对齐方式 */
    textAlign: TextAlign;
    /** 行首忽略字符，即不会出现在行首的字符 */
    ignoreLineStart: Iterable<string>;
    /** 行尾忽略字符，即不会出现在行尾的字符 */
    ignoreLineEnd: Iterable<string>;
    /** 会被分词规则识别的分词字符 */
    breakChars: Iterable<string>;
    /** 填充样式 */
    fillStyle: CanvasStyle;
    /** 描边样式 */
    strokeStyle: CanvasStyle;
    /** 线宽 */
    strokeWidth: number;
    /** 文字宽度，到达这么宽之后换行 */
    width: number;
}

export interface ITextContentRenderData {
    text: string;
    title?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    /** 是否填充 */
    fill?: boolean;
    /** 是否描边 */
    stroke?: boolean;
    /** 是否无视打字机，强制全部显示 */
    showAll?: boolean;
}

interface ParserStatus {
    fillStyle: CanvasStyle;
    fontFamily: string;
    fontSize: number;
    fontItalic: boolean;
    fontWeight: number;
}

export const enum TextContentType {
    Text,
    Wait,
    Icon
}

export interface ITextContentRenderable {
    type: TextContentType;
    text: string;
    font: string;
    fillStyle: CanvasStyle;
    /** 字体大小，用于分行中猜测长度 */
    fontSize: number;
    /** 这段文字的分行信息，每一项表示在对应索引后分词 */
    splitLines: number[];
    /** 这段文字的分词信息，每一项表示在对于索引后分行 */
    wordBreak: number[];
    /** 最后一行的宽度 */
    lastLineWidth?: number;
    /** 等待时长 */
    wait?: number;
    /** 显示的图标 */
    icon?: AllNumbers;
}

export interface ITextContentRenderObject {
    /** 每一行的高度 */
    lineHeights: number[];
    /** 渲染数据 */
    data: ITextContentRenderable[];
}

export interface TyperTextRenderable {
    type: TextContentType.Text;
    x: number;
    y: number;
    text: string;
    font: string;
    fillStyle: CanvasStyle;
    strokeStyle: CanvasStyle;
    /** 文字画到哪个索引 */
    pointer: number;
    /** 这段文字的总高度 */
    height: number;
}

export interface TyperIconRenderable {
    type: TextContentType.Icon;
    x: number;
    y: number;
    width: number;
    height: number;
    renderable: RenderableData | AutotileRenderable;
}

export interface TyperWaitRenderable {
    type: TextContentType.Wait;
    wait: number;
    waited: number;
}

export type TyperRenderable =
    | TyperTextRenderable
    | TyperIconRenderable
    | TyperWaitRenderable;

interface TextContentTyperEvent {
    typeStart: [];
    typeEnd: [];
}

type TyperFunction = (data: TyperRenderable[], typing: boolean) => void;

export class TextContentTyper extends EventEmitter<TextContentTyperEvent> {
    /** 文字配置信息 */
    readonly config: Required<ITextContentConfig>;
    /** 文字解析器 */
    readonly parser: TextContentParser;

    private _text: string = '';
    /** 显示的文字 */
    get text(): string {
        return this._text;
    }
    set text(v: string) {
        this._text = v;
    }

    /** 渲染信息 */
    private renderObject: ITextContentRenderObject = {
        lineHeights: [],
        data: []
    };
    /** 渲染信息 */
    private renderData: TyperRenderable[] = [];
    /** 现在是第几行，0表示第一行 */
    private nowLine: number = 0;
    /** 当前的 renderable 是第几行 */
    private dataLine: number = 0;
    /** 当前需要绘制的横坐标 */
    private x: number = 0;
    /** 当前需要绘制的纵坐标 */
    private y: number = 0;
    /** 当前显示到了哪个 renderable */
    private pointer: number = 0;
    /** 上一个字显示出的时间 */
    private lastTypeTime: number = 0;
    /** 是否正在打字 */
    private typing: boolean = false;
    /** 现在正在打字的 renderable 对象 */
    private processingData?: TyperRenderable;

    /** 渲染函数 */
    render?: TyperFunction;

    constructor(config: Partial<ITextContentConfig>) {
        super();

        this.config = {
            fontFamily: config.fontFamily ?? 'Verdana',
            fontSize: config.fontSize ?? 16,
            fontWeight: config.fontWeight ?? 500,
            fontItalic: config.fontItalic ?? false,
            keepLast: config.keepLast ?? false,
            interval: config.interval ?? 0,
            lineHeight: config.lineHeight ?? 0,
            wordBreak: config.wordBreak ?? WordBreak.Space,
            textAlign: config.textAlign ?? TextAlign.Left,
            ignoreLineStart: config.ignoreLineStart ?? '',
            ignoreLineEnd: config.ignoreLineEnd ?? '',
            breakChars: config.breakChars ?? '',
            fillStyle: config.fillStyle ?? '#fff',
            strokeStyle: config.strokeStyle ?? '#000',
            strokeWidth: config.strokeWidth ?? 2,
            width: config.width ?? 200
        };

        this.parser = new TextContentParser(
            {
                fillStyle: this.config.fillStyle,
                fontFamily: this.config.fontFamily,
                fontSize: this.config.fontSize,
                fontItalic: this.config.fontItalic,
                fontWeight: this.config.fontWeight
            },
            this.config
        );

        onTick(() => this.tick());
    }

    /**
     * 获取这段文字的总高度
     */
    getHeight() {
        const heights = this.renderObject.lineHeights;
        const lines = heights.reduce((prev, curr) => prev + curr, 0);
        return lines + this.config.lineHeight * heights.length;
    }

    /**
     * 设置打字机的配置属性
     * @param config 配置信息
     */
    setConfig(config: Partial<ITextContentConfig>) {
        for (const [key, value] of Object.entries(config)) {
            if (!isNil(value)) {
                // @ts-expect-error 无法推导
                this.config[key] = value;
            }
        }
        this.parser.setStatus({
            fillStyle: this.config.fillStyle,
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize,
            fontItalic: this.config.fontItalic,
            fontWeight: this.config.fontWeight
        });
    }

    /**
     * 重设打字机状态
     * @param _lastText 上一次的文字
     */
    private resetTypeStatus(_lastText: string) {
        // todo: 接续打字
        this.renderData = [];
        this.nowLine = 0;
        this.pointer = 0;
        this.processingData = void 0;
        this.typing = false;
        this.dataLine = 0;
        this.x = 0;
        this.y = 0;
    }

    /**
     * 设置显示文本
     */
    setText(text: string) {
        const lastText = this._text;
        this._text = text;
        this.resetTypeStatus(lastText);
        this.renderObject = this.parser.parse(text, this.config.width);
    }

    private createTyperData(index: number, line: number) {
        const renderable = this.renderObject.data[index];
        if (!renderable) return false;
        switch (renderable.type) {
            case TextContentType.Text: {
                if (line < 0 || line > renderable.splitLines.length) {
                    return false;
                }
                const start = renderable.splitLines[line - 1] ?? 0;
                const end =
                    renderable.splitLines[line] ?? renderable.text.length;
                const lineHeight = this.renderObject.lineHeights[this.nowLine];

                const data: TyperTextRenderable = {
                    type: TextContentType.Text,
                    x: this.x,
                    y: this.y,
                    text: renderable.text.slice(start, end),
                    font: renderable.font,
                    fillStyle: renderable.fillStyle,
                    strokeStyle: this.config.strokeStyle,
                    pointer: 0,
                    height: lineHeight + this.config.lineHeight
                };
                this.processingData = data;
                this.renderData.push(data);
                return true;
            }
            case TextContentType.Icon: {
                const tex = texture.getRenderable(renderable.icon!);
                if (!tex) return false;
                const { render } = tex;
                const [, , width, height] = render[0];
                const aspect = width / height;
                let iconWidth = 0;
                if (aspect < 1) {
                    // 这时候应该把高度限定在当前字体大小
                    iconWidth = width * (renderable.fontSize / height);
                } else {
                    iconWidth = renderable.fontSize;
                }
                const data: TyperIconRenderable = {
                    type: TextContentType.Icon,
                    x: this.x,
                    y: this.y,
                    width: iconWidth,
                    height: iconWidth / aspect,
                    renderable: tex
                };
                this.processingData = data;
                this.renderData.push(data);
                return true;
            }
            case TextContentType.Wait: {
                const data: TyperWaitRenderable = {
                    type: TextContentType.Wait,
                    wait: renderable.wait!,
                    waited: 0
                };
                this.processingData = data;
                this.renderData.push(data);
                return true;
            }
        }
    }

    /**
     * 执行打字
     * @param num 打出多少字
     * @returns 打字是否结束
     */
    private typeChars(num: number): boolean {
        let rest = num;
        while (rest > 0) {
            if (!this.processingData) {
                const success = this.createTyperData(
                    this.pointer,
                    this.dataLine
                );
                if (!success) return true;
            }
            const now = this.processingData;
            if (!now) return true;
            const renderable = this.renderObject.data[this.pointer];
            if (!renderable) {
                return true;
            }
            const lineHeight = this.renderObject.lineHeights[this.nowLine];
            switch (now.type) {
                case TextContentType.Text: {
                    const restChars = now.text.length - now.pointer;
                    if (restChars <= rest) {
                        // 当前这段 renderable 打字完成后，刚好结束或还有内容
                        rest -= restChars;
                        now.pointer = now.text.length;
                        if (this.dataLine === renderable.splitLines.length) {
                            // 如果是最后一行
                            if (isNil(renderable.lastLineWidth)) {
                                const ctx = this.parser.testCanvas.ctx;
                                ctx.font = now.font;
                                const metrics = ctx.measureText(now.text);
                                renderable.lastLineWidth = metrics.width;
                            }
                            this.x += renderable.lastLineWidth;
                            this.dataLine = 0;
                            this.pointer++;
                        } else {
                            // 不是最后一行，那么换行
                            this.x = 0;
                            this.y += lineHeight + this.config.lineHeight;
                            this.dataLine++;
                            this.nowLine++;
                        }
                    } else {
                        now.pointer += rest;
                        return false;
                    }
                    break;
                }
                case TextContentType.Icon: {
                    rest--;
                    this.pointer++;
                    if (renderable.splitLines[0] === 0) {
                        // 如果图标换行
                        this.x = 0;
                        this.y += lineHeight + this.config.lineHeight;
                        this.nowLine++;
                        this.dataLine = 0;
                        now.x = 0;
                        now.y = this.y;
                    } else {
                        this.x += now.width;
                    }
                    break;
                }
                case TextContentType.Wait: {
                    now.waited += num;
                    if (now.waited > now.wait) {
                        // 等待结束
                        this.pointer++;
                    }
                    break;
                }
            }
            const success = this.createTyperData(this.pointer, this.dataLine);
            if (!success) return true;
        }
        return false;
    }

    /**
     * 每帧执行的函数
     */
    private tick() {
        if (!this.typing) return;
        const now = Date.now();
        const needType = Math.round(
            (now - this.lastTypeTime) / this.config.interval
        );
        if (needType === 0) return;
        this.lastTypeTime = now;
        const end = this.typeChars(needType);
        this.render?.(this.renderData, !end);
        if (end) {
            this.typing = false;
            this.emit('typeEnd');
        }
    }

    /**
     * 开始打字
     */
    type() {
        if (this.typing) return;
        if (this.config.interval === 0) {
            this.emit('typeStart');
            this.typeChars(Infinity);
            this.render?.(this.renderData, false);
            this.emit('typeEnd');
            return;
        }
        this.emit('typeStart');
        this.lastTypeTime = Date.now();
        this.typing = true;
    }

    /**
     * 立即显示所有文字
     */
    typeAll() {
        if (!this.typing) return;
        this.typeChars(Infinity);
        this.render?.(this.renderData, false);
    }

    /**
     * 设置渲染函数，该函数会被打字机对象在需要执行的时候自动执行
     * @param render 会被执行的渲染函数
     */
    setRender(render: TyperFunction) {
        this.render = render;
    }
}

const enum ExpStringType {
    Quote,
    DoubleQuote,
    Backquote
}

const defaultsBreak = ' -,.)]}?!;:%&*#@/\\=+~，。）】？！；：';
const defaultsIgnoreStart =
    '）)】》＞﹞>)]»›〕〉}］」｝〗』，。？！：；·…,.?!:;、……~&@#～＆＠＃';
const defaultsIgnoreEnd = '（(【《＜﹝<([«‹〔〈{［「｛〖『';
const breakSet = new Set(defaultsBreak);
const ignoreStart = new Set(defaultsIgnoreStart);
const ignoreEnd = new Set(defaultsIgnoreEnd);

export class TextContentParser {
    /** 解析时的状态 */
    private status: ParserStatus;
    /** 正在解析的文字 */
    private text: string = '';
    /** 填充颜色栈 */
    private fillStyleStack: CanvasStyle[] = [];
    /** 字体大小栈 */
    private fontSizeStack: number[] = [];
    /** 字体类型栈 */
    private fontFamilyStack: string[] = [];
    /** 解析出的渲染信息 */
    private renderable: ITextContentRenderable[] = [];
    /** 当前的字体 */
    private font: string = '';
    /** 当前解析出的文字 */
    private resolved: string = '';
    /** 当前的分词信息 */
    private wordBreak: number[] = [];

    // 在分行中，会出现上一个渲染数据的最后并不能组成一个完整的行，这时候需要把最后一个不完整的行的宽度记录下来
    // 然后把当前渲染数据的宽度计算上再进行分行。

    /** 上一个渲染数据的最后一个分行对应的分词索引 */
    private lastBreakIndex: number = -1;
    /** 当前渲染数据索引 */
    private nowRenderable: number = -1;
    /** 当前行的高度 */
    private lineHeight: number = 0;
    /** 每一行的行高 */
    private lineHeights: number[] = [];
    /** 当前这一行已经有多长 */
    private lineWidth: number = 0;
    /** 这一行未计算部分的起始位置索引 */
    private lineStart: number = 0;
    /**
     * 长度猜测增益，可以减少文字宽度的测量次数，原理为如果测量长度小于剩余宽度，那么将它乘以一个值，
     * 使得猜测长度变大，从而过滤掉一些潜在的无用测量
     */
    private guessGain: number = 1;
    /** 二分的起始索引 */
    private bsStart: number = 0;
    /** 二分的结束索引 */
    private bsEnd: number = 0;

    /** 分词原则 */
    wordBreakRule: WordBreak = WordBreak.Space;
    /** 测试画布，用于测量文字 */
    readonly testCanvas: MotaOffscreenCanvas2D;

    /**
     * @param initStatus 解析器的初始状态
     * @param config 解析器的配置信息
     */
    constructor(
        public readonly initStatus: ParserStatus,
        public readonly config: Required<ITextContentConfig>
    ) {
        this.status = { ...initStatus };

        this.testCanvas = new MotaOffscreenCanvas2D(false);
        this.testCanvas.withGameScale(false);
        this.testCanvas.setHD(false);
        this.testCanvas.size(1, 1);
        this.testCanvas.freeze();
    }

    /**
     * 设置解析器的初始状态
     * @param st 要设置为的状态，不填的表示不变
     */
    setStatus(st: Partial<ParserStatus>) {
        if (!isNil(st.fillStyle)) this.status.fillStyle = st.fillStyle;
        if (!isNil(st.fontSize)) this.status.fontSize = st.fontSize;
        if (!isNil(st.fontFamily)) this.status.fontFamily = st.fontFamily;
        if (!isNil(st.fontItalic)) this.status.fontItalic = st.fontItalic;
        if (!isNil(st.fontWeight)) this.status.fontWeight = st.fontWeight;
    }

    /**
     * 给定参数开始的索引，获取参数结束时的索引
     * @param start 开始检索的索引
     */
    private indexParam(start: number) {
        if (this.text[start] !== '[') return -1;
        else return this.text.indexOf(']', start);
    }

    /**
     * 处理包含起始和结束标记的标签的参数
     * @param start 开始检索的索引
     */
    private getChildableTagParam(start: number): [string, number] {
        const end = this.indexParam(start);
        if (end === -1) {
            // 标签结束
            return ['', start - 1];
        } else {
            // 标签开始
            return [this.text.slice(start + 1, end), end];
        }
    }

    /**
     * 获取没有起始和结束标记的标签的参数
     * @param start 开始检索的索引
     */
    private getTagParam(start: number): [string, number] {
        const end = this.indexParam(start);
        if (end === -1) return ['', start];
        return [this.text.slice(start + 1, end), end];
    }

    private addTextRenderable() {
        const data: ITextContentRenderable = {
            type: TextContentType.Text,
            text: this.resolved,
            font: this.font,
            fontSize: this.status.fontSize,
            fillStyle: this.status.fillStyle,
            splitLines: [],
            wordBreak: []
        };
        this.renderable.push(data);
        this.resolved = '';
    }

    private addWaitRenderable(wait: number) {
        const data: ITextContentRenderable = {
            type: TextContentType.Wait,
            text: this.resolved,
            font: this.font,
            fontSize: this.status.fontSize,
            fillStyle: this.status.fillStyle,
            wait,
            splitLines: [],
            wordBreak: []
        };
        this.renderable.push(data);
        this.resolved = '';
    }

    private addIconRenderable(icon: AllNumbers) {
        const data: ITextContentRenderable = {
            type: TextContentType.Icon,
            text: this.resolved,
            font: this.font,
            fontSize: this.status.fontSize,
            fillStyle: this.status.fillStyle,
            icon,
            splitLines: [],
            wordBreak: []
        };
        this.renderable.push(data);
        this.resolved = '';
    }

    private buildFont() {
        return buildFont(
            this.status.fontFamily,
            this.status.fontSize,
            this.status.fontWeight,
            this.status.fontItalic
        );
    }

    private parseFillStyle(pointer: number) {
        const [param, end] = this.getChildableTagParam(pointer + 2);
        if (!param) {
            // 参数为空或没有参数，视为标签结束
            const color = this.fillStyleStack.pop();
            if (!color) {
                logger.warn(54, '\\r', pointer.toString());
                return end;
            }
            if (this.resolved.length > 0) this.addTextRenderable();
            this.status.fillStyle = color;
            return end;
        } else {
            // 标签开始
            this.fillStyleStack.push(this.status.fillStyle);
            if (this.resolved.length > 0) this.addTextRenderable();
            this.status.fillStyle = param;
            return end;
        }
    }

    private parseFontSize(pointer: number) {
        const [param, end] = this.getChildableTagParam(pointer + 2);
        if (!param) {
            // 参数为空或没有参数，视为标签结束
            const size = this.fontSizeStack.pop();
            if (!size) {
                logger.warn(54, '\\c', pointer.toString());
                return end;
            }
            if (this.resolved.length > 0) this.addTextRenderable();
            this.status.fontSize = size;
            this.font = this.buildFont();
            return end;
        } else {
            // 标签开始
            this.fontSizeStack.push(this.status.fontSize);
            if (this.resolved.length > 0) this.addTextRenderable();
            this.status.fontSize = parseFloat(param);
            this.font = this.buildFont();
            return end;
        }
    }

    private parseFontFamily(pointer: number) {
        const [param, end] = this.getChildableTagParam(pointer + 2);
        if (!param) {
            // 参数为空或没有参数，视为标签结束
            const font = this.fontFamilyStack.pop();
            if (!font) {
                logger.warn(54, '\\g', pointer.toString());
                return end;
            }
            if (this.resolved.length > 0) this.addTextRenderable();
            this.status.fontFamily = font;
            this.font = this.buildFont();
            return end;
        } else {
            // 标签开始
            this.fontFamilyStack.push(this.status.fontFamily);
            if (this.resolved.length > 0) this.addTextRenderable();
            this.status.fontFamily = param;
            this.font = this.buildFont();
            return end;
        }
    }

    private parseFontWeight() {
        if (this.resolved.length > 0) this.addTextRenderable();
        this.status.fontWeight = this.status.fontWeight > 500 ? 500 : 700;
        this.font = this.buildFont();
    }

    private parseFontItalic() {
        if (this.resolved.length > 0) this.addTextRenderable();
        this.status.fontItalic = !this.status.fontItalic;
        this.font = this.buildFont();
    }

    private parseWait(pointer: number) {
        if (this.resolved.length > 0) this.addTextRenderable();
        const [param, end] = this.getTagParam(pointer + 2);
        if (!param) {
            logger.warn(55, '\\z');
            return pointer;
        }
        const time = parseInt(param);
        this.addWaitRenderable(time);
        return end;
    }

    private parseIcon(pointer: number) {
        if (this.resolved.length > 0) this.addTextRenderable();
        const [param, end] = this.getTagParam(pointer + 2);
        if (!param) {
            logger.warn(55, '\\i');
            return pointer;
        }
        if (/^\d+$/.test(param)) {
            const num = Number(param);
            this.addIconRenderable(num as AllNumbers);
        } else {
            if (/^X\d+$/.test(param)) {
                // 额外素材
                const num = Number(param.slice(1));
                this.addIconRenderable(num as AllNumbers);
            } else {
                const num = texture.idNumberMap[param as AllIds];
                if (num === void 0) {
                    logger.warn(59, param);
                    return end;
                }
                this.addIconRenderable(num);
            }
        }
        return end;
    }

    /**
     * 将文字解析并分词、分行
     * @param text 要解析的文字
     * @param width 文字宽度，即文字到达这么宽之后换行
     */
    parse(text: string, width: number): ITextContentRenderObject {
        this.text = text;
        this.fontFamilyStack = [];
        this.fontSizeStack = [];
        this.fillStyleStack = [];
        this.status = { ...this.initStatus };
        this.renderable = [];
        this.font = this.buildFont();
        this.resolved = '';
        this.wordBreak = [];
        this.lastBreakIndex = -1;
        this.nowRenderable = -1;
        this.lineHeight = 0;
        this.lineHeights = [];
        this.lineWidth = 0;
        this.lineStart = 0;
        this.guessGain = 1;
        this.bsStart = 0;
        this.bsEnd = 0;

        let inExpression = false;
        let inExpString = false;
        let stringType: ExpStringType = ExpStringType.Quote;
        let expDepth = 0;
        let expStart = 0;

        for (let pointer = 0; pointer < text.length; pointer++) {
            const char = text[pointer];

            if (inExpression) {
                if (inExpString) {
                    if (
                        char === '"' &&
                        stringType === ExpStringType.DoubleQuote
                    ) {
                        inExpString = false;
                    } else if (
                        char === "'" &&
                        stringType === ExpStringType.Quote
                    ) {
                        inExpString = false;
                    } else if (
                        char === '`' &&
                        stringType === ExpStringType.Backquote
                    ) {
                        inExpString = false;
                    }
                } else {
                    if (char === '{') {
                        expDepth++;
                    } else if (char === '}') {
                        if (expDepth === 0) {
                            const exp = this.text.slice(expStart, pointer);
                            this.resolved += core.calValue(exp);
                            inExpression = false;
                        } else {
                            expDepth--;
                        }
                    } else if (char === '"') {
                        inExpString = true;
                        stringType = ExpStringType.DoubleQuote;
                    } else if (char === "'") {
                        inExpString = true;
                        stringType = ExpStringType.Quote;
                    } else if (char === '`') {
                        inExpString = true;
                        stringType = ExpStringType.Backquote;
                    }
                }
                continue;
            }

            if (char === '\\') {
                const next = text[pointer + 1];
                switch (next) {
                    case '\\':
                    case '$': {
                        this.resolved += next;
                        pointer++;
                        break;
                    }
                    case 'r':
                        pointer = this.parseFillStyle(pointer);
                        break;
                    case 'c':
                        pointer = this.parseFontSize(pointer);
                        break;
                    case 'g':
                        pointer = this.parseFontFamily(pointer);
                        break;
                    case 'd':
                        this.parseFontWeight();
                        pointer++;
                        break;
                    case 'e':
                        this.parseFontItalic();
                        pointer++;
                        break;
                    case 'z':
                        pointer = this.parseWait(pointer);
                        break;
                    case 'i':
                        pointer = this.parseIcon(pointer);
                        break;
                }
                continue;
            } else if (char === '\r') {
                pointer = this.parseFillStyle(pointer);
                continue;
            } else if (char === '$') {
                // 表达式
                pointer++;
                inExpression = true;
                expStart = pointer + 1;
                continue;
            }

            this.resolved += char;
        }

        this.addTextRenderable();

        return this.splitLines(width);
    }

    private getHeight(metrics: TextMetrics) {
        return (
            metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        );
    }

    /**
     * 检查是否需要换行，如果需要则换行
     * @param width 最大宽度
     * @param guess 猜测到达这么多宽度需要多少字符
     * @param pointer 当前字符的索引
     * @param breakIndex 当前分词的索引
     */
    private checkLineWidth(width: number, guess: number, pointer: number) {
        const breakIndex = this.wordBreak.length - 1;
        if (breakIndex === -1) return true;
        const rest = width - this.lineWidth;
        const guessRest = guess * (rest / width) * this.guessGain;
        const length = pointer - this.lineStart + 1;
        if (length <= guessRest) {
            return false;
        }
        this.guessGain = 1;
        // 如果大于猜测，那么算长度
        const data = this.renderable[this.nowRenderable];
        const ctx = this.testCanvas.ctx;
        ctx.font = data.font;
        const metrics = ctx.measureText(
            data.text.slice(this.lineStart, pointer + 1)
        );
        const height = this.getHeight(metrics);
        if (height > this.lineHeight) {
            this.lineHeight = height;
        }
        if (metrics.width <= rest) {
            // 实际宽度小于剩余宽度时，将猜测增益乘以剩余总宽度与当前宽度的比值的若干倍
            this.guessGain *= (rest / metrics.width) * (1.1 + 1 / length);
            this.bsStart = breakIndex;
            return false;
        } else {
            this.bsEnd = breakIndex;
            let maxWidth = rest;
            // 循环二分，直到不能分行
            while (true) {
                const index = this.bsLineWidth(maxWidth, this.nowRenderable);
                data.splitLines.push(this.wordBreak[index]);
                this.lineHeights.push(this.lineHeight);
                this.bsStart = index;
                const text = data.text.slice(
                    this.wordBreak[index] + 1,
                    pointer + 1
                );
                if (text.length < guessRest / 4) {
                    // 如果剩余文字很少，几乎不可能会单独成一行时，直接结束循环
                    this.lastBreakIndex = index;
                    break;
                }
                maxWidth = width;
                const metrics = ctx.measureText(text);
                if (metrics.width < maxWidth) {
                    this.lastBreakIndex = index;
                    break;
                }
            }
            this.lineWidth = 0;
            this.lineStart = pointer;
            return true;
        }
    }

    private bsLineWidth(width: number, index: number) {
        let start = this.bsStart;
        let end = this.bsEnd;
        let height = 0;

        const data = this.renderable[index];
        const { wordBreak } = data;
        const ctx = this.testCanvas.ctx;
        ctx.font = data.font;
        while (true) {
            const mid = Math.floor((start + end) / 2);
            if (mid === start) {
                if (height > this.lineHeight) {
                    this.lineHeight = height;
                }
                return start;
            }
            const text = data.text.slice(
                wordBreak[this.bsStart] + 1,
                wordBreak[mid] + 1
            );
            const metrics = ctx.measureText(text);
            height = this.getHeight(metrics);
            if (metrics.width > width) {
                end = mid;
            } else if (metrics.width === width) {
                if (height > this.lineHeight) {
                    this.lineHeight = height;
                }
                return mid;
            } else {
                start = mid;
            }
        }
    }

    /**
     * 检查剩余字符能否分行
     */
    private checkRestLine(width: number, guess: number, pointer: number) {
        if (this.wordBreak.length === 0) return true;
        if (pointer === -1) {
            return this.checkLineWidth(width, guess, 0);
        }
        const isLast = this.renderable.length - 1 === pointer;
        const data = this.renderable[pointer];
        const rest = width - this.lineWidth;
        if (data.type === TextContentType.Text) {
            const wordBreak = data.wordBreak;
            const lastLine = data.splitLines.at(-1);
            const lastIndex = isNil(lastLine) ? 0 : lastLine;
            const restText = data.text.slice(lastIndex + 1);
            const ctx = this.testCanvas.ctx;
            ctx.font = data.font;
            const metrics = ctx.measureText(restText);
            // 如果剩余内容不能构成完整的行
            if (metrics.width < rest) {
                this.lineWidth += metrics.width;
                data.lastLineWidth = metrics.width;
                const height = this.getHeight(metrics);
                if (height > this.lineHeight) {
                    this.lineHeight = height;
                }
                return false;
            } else {
                // 如果可以构成完整的行，那么循环二分
                const lastBreak = wordBreak.at(-1)!;
                this.bsStart = this.lastBreakIndex;
                this.bsEnd = lastBreak;
                let maxWidth = rest;
                while (true) {
                    const index = this.bsLineWidth(maxWidth, pointer);
                    data.splitLines.push(this.wordBreak[index]);
                    this.lineHeights.push(this.lineHeight);
                    this.bsStart = index;
                    const text = data.text.slice(this.wordBreak[index] + 1);
                    if (!isLast && text.length < guess / 4) {
                        // 如果剩余文字很少，几乎不可能会单独成一行时，直接结束循环
                        this.lastBreakIndex = index;
                        break;
                    }
                    const metrics = ctx.measureText(text);
                    maxWidth = width;
                    if (metrics.width < maxWidth) {
                        this.lastBreakIndex = index;
                        break;
                    }
                }
                this.lineWidth = 0;
                return true;
            }
        } else if (data.type === TextContentType.Icon) {
            const renderable = texture.getRenderable(data.icon!);
            if (!renderable) return false;
            const [, , width, height] = renderable.render[0];
            const aspect = width / height;
            let iconWidth = 0;
            if (aspect < 1) {
                // 这时候应该把高度限定在当前字体大小
                iconWidth = width * (this.status.fontSize / height);
            } else {
                iconWidth = this.status.fontSize;
            }
            this.lineWidth += iconWidth;
            const iconHeight = iconWidth / aspect;
            if (iconHeight > this.lineHeight) {
                this.lineHeight = iconHeight;
            }
            if (iconWidth > rest) {
                data.splitLines.push(0);
                this.lineHeights.push(this.lineHeight);
                this.lineWidth = 0;
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * 对解析出的文字分词并分行
     * @param width 文字的宽度，到达这么宽之后换行
     */
    private splitLines(width: number): ITextContentRenderObject {
        if (this.wordBreakRule === WordBreak.None) {
            return { lineHeights: [0], data: this.renderable };
        }
        this.nowRenderable = -1;

        const breakChars = new Set(this.config.breakChars).union(breakSet);
        const ignoreLineStart = new Set(this.config.ignoreLineStart).union(
            ignoreStart
        );
        const ignoreLineEnd = new Set(this.config.ignoreLineEnd).union(
            ignoreEnd
        );

        const allBreak = this.wordBreakRule === WordBreak.All;

        for (let i = 0; i < this.renderable.length; i++) {
            const data = this.renderable[i];
            const { wordBreak, fontSize } = data;
            const guess = (width / fontSize) * 1.1;
            this.nowRenderable = i;
            this.wordBreak = wordBreak;

            if (data.type === TextContentType.Icon) {
                this.checkRestLine(width, guess, i - 1);
                continue;
            } else if (data.type === TextContentType.Wait) {
                continue;
            }

            for (let pointer = 0; pointer < data.text.length; pointer++) {
                const char = data.text[pointer];

                if (allBreak) {
                    wordBreak.push(pointer);
                    this.checkLineWidth(width, guess, pointer);
                    continue;
                }

                const next = data.text[pointer + 1];

                if (char === '\n') {
                    const data = this.renderable[this.nowRenderable];
                    wordBreak.push(pointer);
                    data.splitLines.push(pointer);
                    continue;
                }

                if (char === '\\' && next === 'n') {
                    const data = this.renderable[this.nowRenderable];
                    wordBreak.push(pointer);
                    data.splitLines.push(pointer);
                    pointer++;
                    continue;
                }

                if (ignoreLineStart.has(next) || ignoreLineEnd.has(char)) {
                    continue;
                }

                if (breakChars.has(char) || isCJK(char.charCodeAt(0))) {
                    wordBreak.push(pointer);
                    this.checkLineWidth(width, guess, pointer);
                }
            }

            this.checkRestLine(width, guess, i);
        }

        this.lineHeights.push(this.lineHeight);

        return {
            lineHeights: this.lineHeights,
            data: this.renderable
        };
    }
}

/**
 * 判断一个文字是否是 CJK 文字
 * @param char 文字的编码
 */
function isCJK(char: number) {
    // 参考自 https://blog.csdn.net/brooksychen/article/details/2755395
    return (
        (char >= 0x4e00 && char <= 0x9fff) ||
        (char >= 0x3000 && char <= 0x30ff) ||
        (char >= 0xac00 && char <= 0xd7af) ||
        (char >= 0xf900 && char <= 0xfaff) ||
        (char >= 0x3400 && char <= 0x4dbf) ||
        (char >= 0x20000 && char <= 0x2ebef) ||
        (char >= 0x30000 && char <= 0x323af) ||
        (char >= 0x2e80 && char <= 0x2eff) ||
        (char >= 0x31c0 && char <= 0x31ef)
    );
}

export function buildFont(
    family: string,
    size: number,
    weight: number = 500,
    italic: boolean = false
) {
    return `${italic ? 'italic ' : ''}${weight} ${size}px "${family}"`;
}
