import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { defineComponent, onUpdated, shallowRef, watch } from 'vue';
import { Transform } from '../transform';
import { isSetEqual } from '../utils';

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

export interface TextContentProps {
    text: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    font?: string;
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
    breakChars: Iterable<string>;
}

interface TextContentData {
    text: string;
    width: number;
    font: string;
    /** 分词规则 */
    wordBreak: WordBreak;
    /** 行首忽略字符，即不会出现在行首的字符 */
    ignoreLineStart: Set<string>;
    /** 行尾忽略字符，即不会出现在行尾的字符 */
    ignoreLineEnd: Set<string>;
    /** 会被分词规则识别的分词字符 */
    breakChars: Set<string>;
}

class TextContentCachePool {
    private pool: MotaOffscreenCanvas2D[] = [];

    /**
     * 申请画布
     * @param num 要申请多少画布
     */
    requestCanvas(num: number): MotaOffscreenCanvas2D[] {
        if (this.pool.length < num) {
            const diff = num - this.pool.length;
            for (let i = 0; i < diff; i++) {
                this.pool.push(new MotaOffscreenCanvas2D(false));
            }
        }
        return this.pool.splice(0, num);
    }

    /**
     * 退回画布
     * @param canvas 要退回多少画布
     */
    returnCanvas(canvas: MotaOffscreenCanvas2D[]) {
        this.pool.push(...canvas);
    }
}

const pool = new TextContentCachePool();

export const TextContent = defineComponent<TextContentProps>((props, ctx) => {
    const ensureProps = () => {
        props.x ??= 0;
        props.y ??= 0;
        props.width ??= 200;
        props.height ??= 200;
        props.font ??= core.status.globalAttribute.font;
        props.ignoreLineEnd ??= new Set();
        props.ignoreLineStart ??= new Set();
        props.keepLast ??= false;
        props.interval ??= 0;
        props.lineHeight ??= 0;
        props.wordBreak ??= WordBreak.Space;
        props.breakChars ??= new Set();
    };

    const makeSplitData = (): TextContentData => {
        ensureProps();
        return {
            text: props.text,
            width: props.width!,
            font: props.font!,
            wordBreak: props.wordBreak!,
            ignoreLineStart: new Set(props.ignoreLineStart),
            ignoreLineEnd: new Set(props.ignoreLineEnd),
            breakChars: new Set(props.breakChars)
        };
    };

    /**
     * 判断是否需要重新分行
     */
    const needResplit = (value: TextContentData, old: TextContentData) => {
        return (
            value.text !== old.text ||
            value.font !== old.font ||
            value.width !== old.width ||
            value.wordBreak !== old.wordBreak ||
            !isSetEqual(value.breakChars, old.breakChars) ||
            !isSetEqual(value.ignoreLineEnd, old.ignoreLineEnd) ||
            !isSetEqual(value.ignoreLineStart, old.ignoreLineStart)
        );
    };

    const render = (canvas: MotaOffscreenCanvas2D, transform: Transform) => {};

    const data = shallowRef<TextContentData>(makeSplitData());

    onUpdated(() => {
        data.value = makeSplitData();
    });

    let shouldKeep = false;
    const lineData = shallowRef([0]);
    watch(data, (value, old) => {
        if (needResplit(value, old)) {
            lineData.value = splitLines(value);
        }

        if (props.keepLast && value.text.startsWith(old.text)) {
            shouldKeep = true;
        }
    });

    watch(lineData, (value, old) => {
        if (shouldKeep) {
            shouldKeep = false;
            const isSub = value.every((v, i) => v === old[i]);
            if (isSub) {
            }
        }
    });

    return () => {
        return (
            <sprite
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                render={render}
            ></sprite>
        );
    };
});

export const Textbox = defineComponent((props, ctx) => {
    return () => {};
});

let testCanvas: MotaOffscreenCanvas2D;
Mota.require('var', 'loading').once('coreInit', () => {
    testCanvas = new MotaOffscreenCanvas2D(false);
    testCanvas.withGameScale(false);
    testCanvas.setHD(false);
    testCanvas.size(32, 32);
    testCanvas.freeze();
});

const fontSizeGuessScale = new Map<string, number>([
    ['px', 1],
    ['%', 0.2],
    ['', 0.2],
    ['cm', 37.8],
    ['mm', 3.78],
    ['Q', 3.78 / 4],
    ['in', 96],
    ['pc', 16],
    ['pt', 96 / 72],
    ['em', 16],
    ['vw', 0.2],
    ['vh', 0.2],
    ['rem', 16]
]);

/**
 * 对文字进行分行操作
 * @param data 文字信息
 * @returns 分行信息，每一项表示应该在这一项索引之后分行
 */
function splitLines(data: TextContentData) {
    const words = breakWords(data);
    if (words.length === 1) return [words[0]];

    // 对文字二分，然后计算长度
    const text = data.text;
    const res: number[] = [];
    const fontSize = data.font.match(/\s*[\d\.-]+[a-zA-Z%]*\s*/)?.[0].trim();
    const unit = fontSize?.match(/[a-zA-Z%]+/)?.[0];
    const guessScale = fontSizeGuessScale.get(unit ?? '') ?? 0.2;
    const guessSize = parseInt(fontSize ?? '0') * guessScale;
    const averageLength = text.length / words.length;
    const guess = data.width / guessSize / averageLength;
    const ctx = testCanvas.ctx;
    ctx.font = data.font;

    let start = 0;
    let end = Math.ceil(guess);
    let resolved = 0;
    let mid = 0;
    let guessCount = 1;
    let splitProgress = false;

    console.time();
    while (1) {
        if (!splitProgress) {
            const chars = text.slice(words[start], words[end]);
            const { width } = ctx.measureText(chars);
            if (width < data.width && end < words.length) {
                guessCount *= 2;
                end = Math.ceil(guessCount * guess + start);
                if (end > words.length) end = words.length;
            } else {
                splitProgress = true;
            }
            continue;
        }
        const diff = end - start;

        if (diff === 1) {
            res.push(words[start]);
            if (end === words.length) break;
            resolved = start;
            end = Math.ceil(start + guess);
            guessCount = 1;
            splitProgress = false;
        } else {
            mid = Math.floor((start + end) / 2);
            const chars = text.slice(words[resolved], words[mid]);
            const { width } = ctx.measureText(chars);
            if (width <= data.width) {
                start = mid;
                if (start === end) end++;
            } else {
                end = mid;
                if (start === end) end++;
            }
        }
    }
    console.timeEnd();

    return res;
}

const defaultsBreak = ' -,.)]}?!;:，。）】？！；：';
const defaultsIgnoreStart =
    '）)】》＞﹞>)]»›〕〉}］」｝〗』，。？！：；·…,.?!:;、……~&@#～＆＠＃';
const defaultsIgnoreEnd = '（(【《＜﹝<([«‹〔〈{［「｛〖『';
const breakSet = new Set(defaultsBreak);
const ignoreStart = new Set(defaultsIgnoreStart);
const ignoreEnd = new Set(defaultsIgnoreEnd);

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

/**
 * 对文字进行分词操作
 * @param data 文字信息
 * @returns 一个数字数组，每一项应当在这一项索引之后分词
 */
function breakWords(data: TextContentData) {
    let allBreak = false;
    const breakChars = breakSet.union(data.breakChars);
    switch (data.wordBreak) {
        case WordBreak.None: {
            return [data.text.length];
        }
        case WordBreak.Space: {
            allBreak = false;
            break;
        }
        case WordBreak.All: {
            allBreak = true;
            break;
        }
    }

    const res: number[] = [0];
    const text = data.text;
    const ignoreLineStart = data.ignoreLineStart.union(ignoreStart);
    const ignoreLineEnd = data.ignoreLineEnd.union(ignoreEnd);
    for (let pointer = 0; pointer < text.length; pointer++) {
        const char = text[pointer];
        const next = text[pointer + 1];

        if (!ignoreLineEnd.has(char) && ignoreLineEnd.has(next)) {
            res.push(pointer);
            continue;
        }

        if (ignoreLineStart.has(char) && !ignoreLineStart.has(next)) {
            res.push(pointer);
            continue;
        }

        if (
            breakChars.has(char) ||
            allBreak ||
            char === '\n' ||
            isCJK(char.charCodeAt(0))
        ) {
            res.push(pointer);
            continue;
        }
    }
    res.push(text.length);
    return res;
}
