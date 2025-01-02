import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import EventEmitter from 'eventemitter3';

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

export interface ITextContentRenderData {
    text: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    /** 字体类型 */
    fontFamily?: string;
    /** 字体大小 */
    fontSize?: number;
    /** 字体线宽 */
    fontWeight?: number;
    /** 是否斜体 */
    fontItalic?: boolean;
    /** 是否持续上一次的文本，开启后，如果修改后的文本以修改前的文本为开头，那么会继续播放而不会从头播放 */
    keepLast?: boolean;
    /** 打字机时间间隔，即两个字出现之间相隔多长时间 */
    interval?: number;
    /** 行高 */
    lineHeight?: number;
    /** 分词规则 */
    wordBreak?: WordBreak;
    /** 文字对齐方式 */
    textAlign?: TextAlign;
    /** 行首忽略字符，即不会出现在行首的字符 */
    ignoreLineStart?: Iterable<string>;
    /** 行尾忽略字符，即不会出现在行尾的字符 */
    ignoreLineEnd?: Iterable<string>;
    /** 会被分词规则识别的分词字符 */
    breakChars?: Iterable<string>;
    /** 填充样式 */
    fillStyle?: CanvasStyle;
    /** 描边样式 */
    strokeStyle?: CanvasStyle;
    /** 线宽 */
    strokeWidth?: number;
    /** 是否填充 */
    fill?: boolean;
    /** 是否描边 */
    stroke?: boolean;
    /** 是否无视打字机，强制全部显示 */
    showAll?: boolean;
}

export const enum TextContentType {
    Text,
    Wait,
    Icon
}

export interface ITextContentRenderable {
    type: TextContentType;
    text: string;
    wait?: number;
    icon?: AllNumbers;
}

interface TextContentTyperEvent {
    typeStart: [];
    typeEnd: [];
}

export class TextContentTyper extends EventEmitter<TextContentTyperEvent> {
    testCanvas: MotaOffscreenCanvas2D;

    constructor(public readonly data: Required<ITextContentRenderData>) {
        super();

        this.testCanvas = new MotaOffscreenCanvas2D(false);
        this.testCanvas.withGameScale(false);
        this.testCanvas.setHD(false);
        this.testCanvas.size(32, 32);
        this.testCanvas.freeze();
    }

    /**
     * 设置显示文本
     */
    setText(text: string) {
        this.data.text = text;
    }

    private parse(text: string) {}
}

export function buildFont(
    family: string,
    size: number,
    weight: number = 500,
    italic: boolean = false
) {
    return `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
}
