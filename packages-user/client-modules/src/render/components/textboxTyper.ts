import { logger } from '@motajs/common';
import { Font, onTick, MotaOffscreenCanvas2D } from '@motajs/render';
import EventEmitter from 'eventemitter3';
import { isNil } from 'lodash-es';
import { RenderableData, AutotileRenderable, texture } from '../elements';

/** 文字的安全填充，会填充在文字的上侧和下侧，防止削顶和削底 */
const SAFE_PAD = 1;

export const enum WordBreak {
    /** 不换行 */
    None,
    /** 仅空格和连字符等可换行，CJK 字符可任意换行，默认值 */
    Space,
    /** 所有字符都可以换行 */
    All
}

export const enum TextAlign {
    /** 左对齐 */
    Left,
    /** 居中对齐 */
    Center,
    /** 右对齐 */
    Right
}

const enum TextGuessStatus {
    /** 长度小于猜测长度 */
    LowLength,
    /** 宽度大于目标宽度，需要分行 */
    NeedSplit,
    /** 长度大于等于猜测长度，但是宽度小于目标宽度 */
    LowWidth
}

export interface ITextContentConfig {
    /** 字体 */
    font: Font;
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

interface TyperConfig extends ITextContentConfig {
    /** 字体类型 */
    fontFamily: string;
    /** 字体大小 */
    fontSize: number;
    /** 字体线宽 */
    fontWeight: number;
    /** 是否斜体 */
    fontItalic: boolean;
}

interface ParserStatus {
    /** 画布填充描边样式 */
    fillStyle: CanvasStyle;
    /** 描边样式 */
    fontFamily: string;
    /** 字体大小 */
    fontSize: number;
    /** 是否斜体 */
    fontItalic: boolean;
    /** 字体粗细 */
    fontWeight: number;
}

interface NormalizedMetrics {
    /** 文字宽度 */
    readonly width: number;
    /** 文字高度 */
    readonly height: number;
}

export const enum TextContentType {
    Text,
    Wait,
    Icon
}

interface ITextContentNodeBase {
    /** 节点类型 */
    readonly type: TextContentType;
    /** 这个节点对应的原始文本 */
    readonly raw: string;
}

export interface ITextContentTextNode extends ITextContentNodeBase {
    readonly type: TextContentType.Text;
    /** 文字内容 */
    readonly text: string;
    /** 这一段文字使用的字体 */
    readonly font: string;
    /** 字体大小，用于长度猜测 */
    readonly fontSize: number;
    /** 这一段文字使用的填充样式 */
    readonly fillStyle: CanvasStyle;
    /** 这个文字节点之后是否换行 */
    readonly newLine: boolean;
}

export interface ITextContentIconNode extends ITextContentNodeBase {
    readonly type: TextContentType.Icon;
    /** 图标节点所在位置的字体大小，用于限制图标显示大小 */
    readonly fontSize: number;
    /** 图标节点的图标数字 */
    readonly icon: AllNumbers;
}

export interface ITextContentWaitNode extends ITextContentNodeBase {
    readonly type: TextContentType.Wait;
    /** 等待的字符数，单位为字数，最终等待时长 = 字数 × 打字机间隔 */
    readonly wait: number;
}

interface ITextContentBlockBase {
    /** block 类型 */
    readonly type: TextContentType;
    /** 这段渲染块对应的原始文本 */
    readonly raw: string;
}

interface ISizedTextContentBlock {
    /** block 宽度 */
    readonly width: number;
    /** block 高度 */
    readonly height: number;
}

export interface ITextContentTextBlock
    extends ITextContentBlockBase,
        ISizedTextContentBlock {
    readonly type: TextContentType.Text;
    /** 文本 block 的文字内容 */
    readonly text: string;
    /** 这一段文字使用的字体 */
    readonly font: string;
    /** 这一段文字使用的填充样式 */
    readonly fillStyle: CanvasStyle;
    /** 这一段文字使用的描边样式 */
    readonly strokeStyle: CanvasStyle;
}

export interface ITextContentIconBlock
    extends ITextContentBlockBase,
        ISizedTextContentBlock {
    readonly type: TextContentType.Icon;
    /** 图标 block 显示的图标 */
    readonly icon: AllNumbers;
    /** 图标的渲染信息 */
    readonly renderable: RenderableData | AutotileRenderable;
}

export interface ITextContentWaitBlock extends ITextContentBlockBase {
    readonly type: TextContentType.Wait;
    /** 等待 block 的等待时长，单位为字数，最终等待时长 = 字数 × 打字机间隔 */
    readonly wait: number;
}

export interface ITextContentLine {
    /** 这一行的宽度 */
    readonly width: number;
    /** 这一行的高度 */
    readonly height: number;
    /** 这一行所有的 block */
    readonly blocks: readonly TextContentBlock[];
}

export interface ITextContentRenderObject {
    /** 每一行的渲染内容 */
    readonly data: readonly ITextContentLine[];
}

export interface ITyperRenderableBase {
    /** 是否在此停止渲染，之后的内容还没执行被打字机执行到 */
    cut: boolean;
}

export interface ITyperTextRenderable
    extends ITextContentTextBlock,
        ITyperRenderableBase {
    /** 文本左上角的横坐标 */
    readonly x: number;
    /** 文本左上角的纵坐标 */
    readonly y: number;
    /** 文字画到哪个索引 */
    pointer: number;
}

export interface ITyperIconRenderable
    extends ITextContentIconBlock,
        ITyperRenderableBase {
    /** 图标左上角的横坐标 */
    readonly x: number;
    /** 图标左上角的纵坐标 */
    readonly y: number;
}

export interface ITyperWaitRenderable
    extends ITextContentWaitBlock,
        ITyperRenderableBase {
    /** 当然是否已经等待了多少个字符 */
    waited: number;
}

export type TextContentNode =
    | ITextContentTextNode
    | ITextContentIconNode
    | ITextContentWaitNode;

export type TextContentBlock =
    | ITextContentTextBlock
    | ITextContentIconBlock
    | ITextContentWaitBlock;

export type TyperRenderable =
    | ITyperTextRenderable
    | ITyperIconRenderable
    | ITyperWaitRenderable;

interface TextContentTyperEvent {
    typeStart: [];
    typeEnd: [];
}

type TyperFunction = (data: TyperRenderable[], typing: boolean) => void;

export class TextContentTyper extends EventEmitter<TextContentTyperEvent> {
    /** 文字配置信息 */
    readonly config: Required<TyperConfig>;
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
        data: []
    };
    /** 渲染信息 */
    private renderData: TyperRenderable[] = [];
    /** 上一个字显示出的时间 */
    private lastTypeTime: number = 0;
    /** 是否正在打字 */
    private typing: boolean = false;
    /** 现在正在打字的 renderable 对象索引 */
    private processing: number = -1;

    /** 渲染函数 */
    render?: TyperFunction;

    constructor(config: Partial<ITextContentConfig>) {
        super();
        const font = config.font ?? new Font();

        this.config = {
            font,
            fontFamily: font.family,
            fontSize: font.size,
            fontWeight: font.weight,
            fontItalic: font.italic,
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
        const data = this.renderObject.data;
        const lines = data.reduce((prev, curr) => prev + curr.height, 0);
        return lines + this.config.lineHeight * data.length + SAFE_PAD * 2;
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
        if (config.font) {
            this.config.fontFamily = config.font.family;
            this.config.fontSize = config.font.size;
            this.config.fontItalic = config.font.italic;
            this.config.fontWeight = config.font.weight;
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
        this.processing = -1;
        this.typing = false;
    }

    /**
     * 计算不同对齐条件下左侧坐标
     * @param line 这一行的分块对象
     */
    private getLineLeft(line: ITextContentLine) {
        const width = line.width;
        switch (this.config.textAlign) {
            case TextAlign.Left:
                return 0;
            case TextAlign.Center:
                return (this.config.width - width) / 2;
            case TextAlign.Right:
                return this.config.width - width;
        }
    }

    /**
     * 解析为可以直接渲染的内容
     */
    private toRenderable() {
        let y = SAFE_PAD;
        let x = 0;

        this.renderObject.data.forEach(line => {
            x = 0;
            const left = this.getLineLeft(line);
            line.blocks.forEach(block => {
                switch (block.type) {
                    case TextContentType.Text: {
                        const renderable: ITyperTextRenderable = {
                            ...block,
                            x: left + x,
                            y,
                            pointer: 0,
                            cut: true
                        };
                        this.renderData.push(renderable);
                        x += block.width;
                        break;
                    }
                    case TextContentType.Icon: {
                        const renderable: ITyperIconRenderable = {
                            ...block,
                            x: left + x,
                            y,
                            cut: true
                        };
                        this.renderData.push(renderable);
                        x += block.width;
                        break;
                    }
                    case TextContentType.Wait: {
                        const renderable: ITyperWaitRenderable = {
                            ...block,
                            waited: 0,
                            cut: true
                        };
                        this.renderData.push(renderable);
                        break;
                    }
                }
            });
            y += line.height + this.config.lineHeight;
        });
    }

    /**
     * 设置显示文本
     */
    setText(text: string) {
        const lastText = this._text;
        this._text = text;
        this.resetTypeStatus(lastText);
        this.renderObject = this.parser.parse(text, this.config.width);
        this.toRenderable();
    }

    /**
     * 执行打字
     * @param num 打出多少字
     * @returns 打字是否结束
     */
    private typeChars(num: number): boolean {
        if (!this.typing) return true;
        if (this.processing === -1) this.processing = 0;
        let rest = num;
        while (rest > 0) {
            const renderable = this.renderData[this.processing];
            if (!renderable) {
                return true;
            }
            switch (renderable.type) {
                case TextContentType.Text: {
                    renderable.cut = false;
                    const chars = renderable.text.length - renderable.pointer;
                    if (chars >= rest) {
                        renderable.pointer += rest;
                        return false;
                    } else {
                        renderable.pointer = renderable.text.length;
                        this.processing++;
                        rest -= chars;
                    }
                    break;
                }
                case TextContentType.Icon: {
                    renderable.cut = false;
                    this.processing++;
                    rest--;
                    break;
                }
                case TextContentType.Wait: {
                    const chars = renderable.wait - renderable.waited;
                    if (chars >= rest) {
                        renderable.waited += rest;
                        return false;
                    } else {
                        renderable.cut = false;
                        renderable.waited = renderable.wait;
                        this.processing++;
                        rest -= chars;
                    }
                    break;
                }
            }
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
        this.processing = 0;
        if (this.config.interval === 0) {
            this.emit('typeStart');
            this.renderData.forEach(data => {
                data.cut = false;
                switch (data.type) {
                    case TextContentType.Text:
                        data.pointer = data.text.length;
                        break;
                    case TextContentType.Wait:
                        data.waited = data.wait;
                        break;
                }
            });
            this.render?.(this.renderData, false);
            this.emit('typeEnd');
            return;
        }
        this.emit('typeStart');
        // 减去间隔是为了第一个字可以立刻打出来，不然看起来有延迟
        this.lastTypeTime = Date.now() - this.config.interval - 1;
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
    /** 解析出的文本节点 */
    private textNodes: TextContentNode[] = [];
    /** 当前的字体 */
    private font: string = '';
    /** 当前解析出的文字 */
    private resolved: string = '';
    /** 上一次分节点的索引 */
    private nodePointer: number = 0;
    /** 上一次分 block 的分词索引，对应到 wordBreak */
    private blockPointer: number = 0;
    /** 当前的分词信息，每一项表示在对应的字符索引前分词 */
    private wordBreak: number[] = [];
    /** 当前正在处理的文本节点 */
    private nowNode: number = -1;
    /** 当前行已有内容的宽度 */
    private lineWidth: number = 0;
    /** 二分的起始索引 */
    private bsStart: number = 0;
    /** 二分的结束索引 */
    private bsEnd: number = 0;
    /** 分词原则 */
    private wordBreakRule: WordBreak = WordBreak.Space;
    /** 猜测增益 */
    private guessGain: number = 0.9;

    /** 当前这一行的 block 内容 */
    private blocks: TextContentBlock[] = [];
    /** 当前已处理完成的行 */
    private data: ITextContentLine[] = [];

    /** 测试画布，用于测量文字 */
    private readonly testCanvas: MotaOffscreenCanvas2D;

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
        this.testCanvas.setHD(false);
        this.testCanvas.size(1, 1);
    }

    /**
     * 设置解析器的初始状态
     * @param st 要设置为的状态，不填的表示不变
     */
    setStatus(st: Partial<ParserStatus>) {
        if (!isNil(st.fillStyle)) this.initStatus.fillStyle = st.fillStyle;
        if (!isNil(st.fontSize)) this.initStatus.fontSize = st.fontSize;
        if (!isNil(st.fontFamily)) this.initStatus.fontFamily = st.fontFamily;
        if (!isNil(st.fontItalic)) this.initStatus.fontItalic = st.fontItalic;
        if (!isNil(st.fontWeight)) this.initStatus.fontWeight = st.fontWeight;
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

    /**
     * 获取截止结束指针参数位置的原始文本内容
     * @param pointer 结束指针
     */
    private getRaw(pointer: number) {
        const raw = this.text.slice(this.nodePointer, pointer);
        this.nodePointer = pointer;
        return raw;
    }

    private addTextNode(pointer: number, newLine: boolean) {
        const data: ITextContentTextNode = {
            type: TextContentType.Text,
            raw: this.getRaw(pointer),
            text: this.resolved,
            font: this.font,
            fontSize: this.status.fontSize,
            fillStyle: this.status.fillStyle,
            newLine
        };
        this.textNodes.push(data);
        this.resolved = '';
    }

    private addWaitRenderable(pointer: number, wait: number) {
        const data: ITextContentWaitNode = {
            type: TextContentType.Wait,
            raw: this.getRaw(pointer),
            wait: wait * this.config.interval
        };
        this.textNodes.push(data);
        this.resolved = '';
    }

    private addIconRenderable(pointer: number, icon: AllNumbers) {
        const data: ITextContentIconNode = {
            type: TextContentType.Icon,
            raw: this.getRaw(pointer),
            fontSize: this.status.fontSize,
            icon
        };
        this.textNodes.push(data);
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
            if (this.resolved.length > 0) this.addTextNode(pointer, false);
            if (!color) {
                logger.warn(54, '\\r', pointer.toString());
                return end;
            }
            this.status.fillStyle = color;
            return end;
        } else {
            // 标签开始
            this.fillStyleStack.push(this.status.fillStyle);
            if (this.resolved.length > 0) this.addTextNode(pointer, false);
            this.status.fillStyle = param;
            return end;
        }
    }

    private parseFontSize(pointer: number) {
        const [param, end] = this.getChildableTagParam(pointer + 2);
        if (!param) {
            // 参数为空或没有参数，视为标签结束
            const size = this.fontSizeStack.pop();
            if (this.resolved.length > 0) this.addTextNode(pointer, false);
            if (!size) {
                logger.warn(54, '\\c', pointer.toString());
                return end;
            }
            this.status.fontSize = size;
            this.font = this.buildFont();
            return end;
        } else {
            // 标签开始
            this.fontSizeStack.push(this.status.fontSize);
            if (this.resolved.length > 0) this.addTextNode(pointer, false);
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
            if (this.resolved.length > 0) this.addTextNode(pointer, false);
            if (!font) {
                logger.warn(54, '\\g', pointer.toString());
                return end;
            }
            this.status.fontFamily = font;
            this.font = this.buildFont();
            return end;
        } else {
            // 标签开始
            this.fontFamilyStack.push(this.status.fontFamily);
            if (this.resolved.length > 0) this.addTextNode(pointer, false);
            this.status.fontFamily = param;
            this.font = this.buildFont();
            return end;
        }
    }

    private parseFontWeight(pointer: number) {
        if (this.resolved.length > 0) this.addTextNode(pointer, false);
        this.status.fontWeight = this.status.fontWeight > 400 ? 400 : 700;
        this.font = this.buildFont();
    }

    private parseFontItalic(pointer: number) {
        if (this.resolved.length > 0) this.addTextNode(pointer, false);
        this.status.fontItalic = !this.status.fontItalic;
        this.font = this.buildFont();
    }

    private parseWait(pointer: number) {
        if (this.resolved.length > 0) this.addTextNode(pointer, false);
        const [param, end] = this.getTagParam(pointer + 2);
        if (!param) {
            logger.warn(55, '\\z');
            return pointer;
        }
        const time = parseInt(param);
        this.addWaitRenderable(end, time);
        return end;
    }

    private parseIcon(pointer: number) {
        if (this.resolved.length > 0) this.addTextNode(pointer, false);
        const [param, end] = this.getTagParam(pointer + 2);
        if (!param) {
            logger.warn(55, '\\i');
            return pointer;
        }
        if (/^\d+$/.test(param)) {
            const num = Number(param);
            this.addIconRenderable(end, num as AllNumbers);
        } else {
            if (/^X\d+$/.test(param)) {
                // 额外素材
                const num = Number(param.slice(1));
                this.addIconRenderable(end, num as AllNumbers);
            } else {
                const num = texture.idNumberMap[param as AllIds];
                if (num === void 0) {
                    logger.warn(59, param);
                    return end;
                }
                this.addIconRenderable(end, num);
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
        this.textNodes = [];
        this.font = this.buildFont();
        this.resolved = '';
        this.wordBreak = [0];
        this.wordBreakRule = this.config.wordBreak;
        this.nodePointer = 0;
        this.blockPointer = 0;
        this.nowNode = 0;
        this.lineWidth = 0;
        this.bsStart = 0;
        this.bsEnd = 0;
        this.blocks = [];
        this.data = [];
        this.guessGain = 0.9;

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
                        this.parseFontWeight(pointer);
                        pointer++;
                        break;
                    case 'e':
                        this.parseFontItalic(pointer);
                        pointer++;
                        break;
                    case 'z':
                        pointer = this.parseWait(pointer);
                        break;
                    case 'i':
                        pointer = this.parseIcon(pointer);
                        break;
                    case 'n':
                        // 在这里预先将换行处理为多个 node，会比在分行时再处理更方便
                        this.addTextNode(pointer + 1, true);
                        break;
                }
                continue;
            } else if (char === '\r') {
                pointer = this.parseFillStyle(pointer);
                continue;
            } else if (char === '$') {
                // 表达式
                const next = text[pointer + 1];
                if (next === '{') {
                    pointer++;
                    inExpression = true;
                    expStart = pointer + 1;
                    continue;
                }
            } else if (char === '\n') {
                // 在这里预先将换行处理为多个 node，会比在分行时再处理更方便
                this.addTextNode(pointer + 1, true);
                continue;
            }

            this.resolved += char;
        }

        this.addTextNode(text.length, false);
        return this.splitLines(width);
    }

    /**
     * 标准化输出文字测量信息，包含宽度和高度
     * @param metrics 文字测量信息
     */
    private metric(metrics: TextMetrics): NormalizedMetrics {
        const height =
            metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        return {
            width: metrics.width,
            height
        };
    }

    /**
     * 测量一个节点的一段文字的信息
     * @param node 文本节点
     * @param start 起始索引
     * @param end 结尾索引
     */
    private measure(node: ITextContentTextNode, start: number, end: number) {
        const text = node.text.slice(start, end);
        const ctx = this.testCanvas.ctx;
        ctx.font = node.font;
        return ctx.measureText(text);
    }

    /**
     * 换行
     */
    private newLine() {
        let width = 0;
        let height = 0;
        this.blocks.forEach(v => {
            if (v.type !== TextContentType.Wait) {
                width += v.width;
                if (v.height > height) height = v.height;
            }
        });
        const line: ITextContentLine = {
            width,
            height,
            blocks: this.blocks
        };
        this.data.push(line);
        this.blocks = [];
        this.lineWidth = 0;
    }

    /**
     * 从节点生成 block 数据
     * @param node 要处理的节点
     * @param pointer 文字裁剪末尾分词索引，包含
     * @returns
     */
    private generateBlock(
        node: TextContentNode,
        pointer: number
    ): TextContentBlock {
        switch (node.type) {
            case TextContentType.Text: {
                const start = this.wordBreak[this.blockPointer];
                const end = this.wordBreak[pointer];
                const text = node.text.slice(start, end);
                const metrics = this.measure(node, start, end);
                const { width, height } = this.metric(metrics);
                let raw: string;
                const prefix = node.raw.indexOf(node.text);
                if (this.blockPointer === 0) {
                    raw = node.raw.slice(0, prefix + end);
                } else if (pointer === this.wordBreak.length - 1) {
                    raw = node.raw.slice(prefix + start);
                } else {
                    raw = node.raw.slice(prefix + start, prefix + end);
                }
                const block: ITextContentTextBlock = {
                    type: TextContentType.Text,
                    raw,
                    text,
                    font: node.font,
                    fillStyle: node.fillStyle,
                    strokeStyle: this.config.strokeStyle,
                    width,
                    height
                };
                return block;
            }
            case TextContentType.Icon: {
                const renderable = texture.getRenderable(node.icon);
                if (!renderable) break;
                const [, , width, height] = renderable.render[0];
                const scale = node.fontSize / height;
                const block: ITextContentIconBlock = {
                    type: TextContentType.Icon,
                    raw: node.raw,
                    icon: node.icon,
                    renderable,
                    width: width * scale,
                    height: height * scale
                };
                return block;
            }
            case TextContentType.Wait: {
                const block: ITextContentWaitBlock = {
                    type: TextContentType.Wait,
                    raw: node.raw,
                    wait: node.wait
                };
                return block;
            }
        }
        return {
            type: TextContentType.Wait,
            raw: '\\z[0]',
            wait: 0
        };
    }

    /**
     * 将解析内容添加至 block 数组
     * @param block 要添加的 block 对象
     * @param pointer 文字裁剪分词末尾索引，包含
     */
    private pushBlock(block: TextContentBlock, pointer: number) {
        this.guessGain = 0.9;
        this.blockPointer = pointer;
        this.bsStart = pointer;
        this.blocks.push(block);
        if (block.type !== TextContentType.Wait) {
            this.lineWidth += block.width;
        }
    }

    /**
     * 猜测到达目标长度需要多少字符
     * @param width 目标宽度
     */
    private guessChars(width: number) {
        const node = this.textNodes[this.nowNode];
        if (node.type !== TextContentType.Text) return 0;
        const chars = (width / node.fontSize) * this.guessGain;
        // 系数可能需要调优
        this.guessGain *= 1.5;
        return chars;
    }

    /**
     * 二分法计算到达目标宽度的文字内容，以 `this.blockPointer` 作为文字裁剪起点
     * @param maxWidth 最大宽度
     * @returns 文字裁剪末尾分词索引，包含
     */
    private bsLineWidth(maxWidth: number) {
        let start = this.bsStart;
        let end = this.bsEnd;

        const data = this.textNodes[this.nowNode];
        if (data.type !== TextContentType.Text) return start;

        const wordBreak = this.wordBreak;
        const ctx = this.testCanvas.ctx;
        ctx.font = data.font;
        while (true) {
            const mid = Math.floor((start + end) / 2);
            if (mid === start) {
                return start;
            }
            const text = data.text.slice(
                wordBreak[this.blockPointer],
                wordBreak[mid]
            );
            const { width } = ctx.measureText(text);
            if (width > maxWidth) {
                end = mid;
            } else if (width === maxWidth) {
                return mid;
            } else {
                start = mid;
            }
        }
    }

    /**
     * 检查猜测字符数量与目标长度的状态关系
     * @param width 目标宽度
     * @param guess 猜测的字符数量
     * @param pointer 当前解析至的分词索引，包含
     */
    private checkGuess(width: number, guess: number) {
        const pointer = this.wordBreak.length - 1;
        const start = this.wordBreak[this.blockPointer];
        const end = this.wordBreak[pointer];
        const len = end - start;
        if (len < guess) {
            return TextGuessStatus.LowLength;
        }
        const node = this.textNodes[this.nowNode];
        if (node.type !== TextContentType.Text) {
            return TextGuessStatus.LowLength;
        }
        const metrics = this.measure(node, start, end);
        if (metrics.width > width) return TextGuessStatus.NeedSplit;
        else return TextGuessStatus.LowWidth;
    }

    /**
     * 对一个文本节点循环分行
     * @param node 文本节点
     * @param width 每行的宽度
     * @returns 分行后最后一个分行的索引
     */
    private splitTextLoop(node: ITextContentTextNode, width: number) {
        const end = this.wordBreak.length - 1;
        while (true) {
            const rest = width - this.lineWidth;
            const index = this.bsLineWidth(rest);
            const block = this.generateBlock(node, index);
            this.pushBlock(block, index);
            this.newLine();
            const nextStart = this.wordBreak[index];
            const nextEnd = this.wordBreak[end];
            if (index === this.bsStart) {
                this.bsStart = this.bsStart + 1;
            } else {
                this.bsStart = index;
            }
            this.bsEnd = end;
            const metrics = this.measure(node, nextStart, nextEnd);
            if (metrics.width < width) {
                return index;
            }
        }
    }

    /**
     * 对文字节点处理分行
     * @param node 节点对象
     * @param width 每行的宽度
     */
    private processTextNode(node: ITextContentTextNode, width: number) {
        let guess = this.guessChars(width - this.lineWidth);

        const text = node.text;
        const allBreak = this.wordBreakRule === WordBreak.All;

        const breakChars = new Set(this.config.breakChars).union(breakSet);
        const ignoreLineStart = new Set(this.config.ignoreLineStart).union(
            ignoreStart
        );
        const ignoreLineEnd = new Set(this.config.ignoreLineEnd).union(
            ignoreEnd
        );

        // 0 是因为第一个字之前也要有一个分词
        this.wordBreak = [0];
        // 上一个分块对应的分词索引，包含，这样的话所有地方就不需要 +1 或 -1 调整了，最简洁
        this.blockPointer = 0;

        // 如果全部分词
        if (allBreak) {
            this.wordBreak = Array.from({ length: text.length }, (_, i) => i);
            this.wordBreak.push(text.length);
            this.splitTextLoop(node, width);
            return;
        }

        for (let pointer = 0; pointer < text.length; pointer++) {
            const char = text[pointer];
            const next = text[pointer + 1];

            if (ignoreLineStart.has(next) || ignoreLineEnd.has(char)) {
                continue;
            }

            if (
                breakChars.has(char) ||
                isCJK(char.charCodeAt(0)) ||
                isCJK(next?.charCodeAt(0))
            ) {
                this.wordBreak.push(pointer + 1);
                const rest = width - this.lineWidth;

                const status = this.checkGuess(rest, guess);
                switch (status) {
                    case TextGuessStatus.LowLength: {
                        guess = this.guessChars(rest);
                        break;
                    }
                    case TextGuessStatus.LowWidth: {
                        this.bsStart = this.wordBreak.length - 1;
                        break;
                    }
                    case TextGuessStatus.NeedSplit: {
                        this.bsStart = this.blockPointer;
                        this.bsEnd = this.wordBreak.length;
                        this.splitTextLoop(node, width);
                        break;
                    }
                }
            }
        }

        // 这个节点结束后也要分词
        this.wordBreak.push(text.length);

        const restStart = this.wordBreak[this.blockPointer];
        const rest = text.slice(restStart);
        const ctx = this.testCanvas.ctx;
        ctx.font = node.font;
        const metrics = ctx.measureText(rest);
        if (metrics.width > width - this.lineWidth) {
            this.bsStart = this.blockPointer;
            this.bsEnd = this.wordBreak.length;
            this.splitTextLoop(node, width);
        }
        const block = this.generateBlock(node, this.wordBreak.length - 1);
        this.pushBlock(block, this.wordBreak.length - 1);

        if (node.newLine) {
            this.newLine();
        }
    }

    /**
     * 处理一个节点的分行
     * @param index 节点索引
     * @param width 每行的宽度
     */
    private splitNode(index: number, width: number) {
        this.nowNode = index;
        const node = this.textNodes[index];
        switch (node.type) {
            case TextContentType.Wait: {
                const block = this.generateBlock(node, 1);
                this.pushBlock(block, 1);
                break;
            }
            case TextContentType.Icon: {
                const block = this.generateBlock(node, 1);
                if (block.type !== TextContentType.Icon) {
                    logger.warn(64, String(node.type), String(block.type));
                    return;
                }
                if (this.lineWidth + block.width > width) {
                    this.newLine();
                }
                this.pushBlock(block, 1);
                break;
            }
            case TextContentType.Text: {
                this.processTextNode(node, width);
                break;
            }
        }
    }

    /**
     * 对解析出的文字分词并分行
     * @param width 文字的宽度，到达这么宽之后换行
     */
    private splitLines(width: number): ITextContentRenderObject {
        const nodes = this.textNodes;
        if (this.wordBreakRule === WordBreak.None) {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node.type === TextContentType.Text) {
                    this.wordBreak = [0, node.text.length];
                }
                const block = this.generateBlock(node, 1);
                this.pushBlock(block, 1);
            }
            this.newLine();
            return {
                data: this.data
            };
        }

        for (let i = 0; i < nodes.length; i++) {
            this.splitNode(i, width);
        }
        this.newLine();

        return {
            data: this.data
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
    weight: number = 400,
    italic: boolean = false
) {
    return `${italic ? 'italic ' : ''}${weight} ${size}px "${family}"`;
}
