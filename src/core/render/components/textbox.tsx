import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { defineComponent } from 'vue';

export const enum WordBreak {
    /** 不换行 */
    None,
    /** 仅空格和连字符等可换行，CJK 字符可任意换行，默认值 */
    Space,
    /** 所有字符都可以换行 */
    All
}

export interface TextContentProps {
    text: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    font?: string;
    /** 打字机时间间隔，即两个字出现之间相隔多长时间 */
    interval?: number;
    /** 行高 */
    lineHeight?: number;
    /** 分词规则 */
    wordBreak?: WordBreak;
    /** 行首忽略字符，即不会出现在行首的字符 */
    ignoreLineStart?: Iterable<string>;
    /** 行尾忽略字符，即不会出现在行尾的字符 */
    ignoreLineEnd?: Iterable<string>;
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
    /** 会被分词规则识别的文字 */
    breakChars: Set<string>;
}

export const TextContent = defineComponent((props, ctx) => {
    return () => {};
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

/**
 * 对文字进行分行操作
 * @param data 文字信息
 */
function splitLines(data: TextContentData) {
    const words = breakWords(data);
    if (words.length === 1) return [words[0]];

    // 对文字二分，然后计算长度
    const text = data.text;
    let start = 0;
    let end = words.length;
    let resolved = 0;
    let mid = 0;

    const res: number[] = [];

    const ctx = testCanvas.ctx;
    ctx.font = data.font;

    console.time();
    while (1) {
        const diff = end - start;

        if (diff === 1) {
            const data1 = ctx.measureText(
                text.slice(words[resolved], words[end])
            );
            if (data1.width <= data.width) {
                res.push(words[end - 1]);
            } else {
                res.push(words[start]);
            }
            if (end === words.length) break;
            resolved = start;
            end = words.length;
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
const breakSet = new Set(defaultsBreak);

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

    console.time();
    const res: number[] = [0];
    const text = data.text;
    const { ignoreLineStart, ignoreLineEnd } = data;
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
    console.timeEnd();
    return res;
}
