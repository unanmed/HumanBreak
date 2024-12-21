import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import {
    defineComponent,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    SlotsType,
    VNode,
    watch
} from 'vue';
import { Transform } from '../transform';
import { isSetEqual } from '../utils';
import { logger } from '@/core/common/logger';
import { Sprite } from '../sprite';
import { onTick } from '../renderer';
import { isNil } from 'lodash-es';
import { SetupComponentOptions } from './types';

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

let testCanvas: MotaOffscreenCanvas2D;
Mota.require('var', 'loading').once('coreInit', () => {
    testCanvas = new MotaOffscreenCanvas2D(false);
    testCanvas.withGameScale(false);
    testCanvas.setHD(false);
    testCanvas.size(32, 32);
    testCanvas.freeze();
});

export interface TextContentProps {
    text: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    /** 字体 */
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
}

export type TextContentEmits = {
    typeEnd: () => void;
    typeStart: () => void;
};

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

interface TextContentRenderable {
    x: number;
    y: number;
    /** 行高，为0时表示两行间为默认行距 */
    height: number;
    /** 这一行文字的高度，即 measureText 算出的高度 */
    textHeight: number;
    /** 这一行的文字 */
    text: string;
    /** 当前渲染到了本行的哪个文字 */
    pointer: number;
    /** 本行文字在全部文字中的起点 */
    from: number;
    /** 本行文字在全部文字中的终点 */
    to: number;
}

const textContentOptions = {
    props: [
        'breakChars',
        'font',
        'height',
        'ignoreLineEnd',
        'ignoreLineStart',
        'interval',
        'keepLast',
        'lineHeight',
        'text',
        'textAlign',
        'width',
        'wordBreak',
        'x',
        'y'
    ],
    emits: ['typeEnd', 'typeStart']
} satisfies SetupComponentOptions<TextContentProps, TextContentEmits>;

export const TextContent = defineComponent<TextContentProps, TextContentEmits>(
    (props, { emit }) => {
        if (props.width && props.width <= 0) {
            logger.warn(41, String(props.width));
        }
        const renderData: Required<TextContentProps> = {
            text: props.text,
            textAlign: props.textAlign ?? TextAlign.Left,
            x: props.x ?? 0,
            y: props.y ?? 0,
            width: !props.width || props.width <= 0 ? 200 : props.width,
            height: props.height ?? 200,
            font:
                props.font ??
                core.status.globalAttribute?.font ??
                '16px Verdana',
            ignoreLineEnd: props.ignoreLineEnd ?? new Set(),
            ignoreLineStart: props.ignoreLineStart ?? new Set(),
            keepLast: props.keepLast ?? false,
            interval: props.interval ?? 0,
            lineHeight: props.lineHeight ?? 0,
            wordBreak: props.wordBreak ?? WordBreak.Space,
            breakChars: props.breakChars ?? new Set(),
            fillStyle: props.fillStyle ?? '#fff',
            strokeStyle: props.strokeStyle ?? 'transparent',
            fill: props.fill ?? true,
            stroke: props.stroke ?? false,
            strokeWidth: props.strokeWidth ?? 2
        };

        const ensureProps = () => {
            for (const [key, value] of Object.entries(props)) {
                if (key in renderData && !isNil(value)) {
                    if (key === 'width') {
                        if (value && value <= 0) {
                            logger.warn(41, String(props.width));
                            renderData.width = 200;
                        } else {
                            renderData.width = value;
                        }
                    } else {
                        // @ts-ignore
                        renderData[key] = value;
                    }
                }
            }
        };

        const makeSplitData = (): TextContentData => {
            ensureProps();
            return {
                text: renderData.text,
                width: renderData.width!,
                font: renderData.font!,
                wordBreak: renderData.wordBreak!,
                ignoreLineStart: new Set(renderData.ignoreLineStart),
                ignoreLineEnd: new Set(renderData.ignoreLineEnd),
                breakChars: new Set(renderData.breakChars)
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

        /** 每行的渲染信息 */
        const renderable: TextContentRenderable[] = [];
        /** 需要更新的行数 */
        const dirtyIndex: number[] = [];
        const spriteElement = ref<Sprite>();

        /** dirtyIndex 更新指针 */
        let linePointer = 0;
        let startTime = 0;
        /** 从哪个字符开始渲染 */
        let fromChar = 0;
        /** 是否需要更新渲染 */
        let needUpdate = false;
        const tick = () => {
            if (!needUpdate) return;
            spriteElement.value?.update();
            const time = Date.now();
            const char =
                Math.floor((time - startTime) / renderData.interval!) +
                fromChar;
            if (!isFinite(char)) {
                renderable.forEach(v => (v.pointer = v.text.length));
                needUpdate = false;
                return;
            }
            while (linePointer < dirtyIndex.length) {
                const line = dirtyIndex[linePointer];
                const data = renderable[line];
                const pointer = char - data.from;
                if (char >= data.to) {
                    data.pointer = data.text.length;
                    linePointer++;
                } else {
                    data.pointer = pointer;
                    break;
                }
            }
            if (linePointer >= dirtyIndex.length) {
                needUpdate = false;
                renderable.forEach(v => (v.pointer = v.text.length));
                emit('typeEnd');
            }
        };

        onTick(tick);
        onMounted(() => {
            data.value = makeSplitData();
            lineData.value = splitLines(data.value);
        });

        const renderContent = (
            canvas: MotaOffscreenCanvas2D,
            transform: Transform
        ) => {
            const ctx = canvas.ctx;
            ctx.font = renderData.font;
            ctx.fillStyle = renderData.fillStyle;
            ctx.strokeStyle = renderData.strokeStyle;
            ctx.lineWidth = renderData.strokeWidth;

            renderable.forEach(v => {
                if (v.pointer === 0) return;
                const text = v.text.slice(0, v.pointer);
                if (renderData.stroke) ctx.strokeText(text, v.x, v.y);
                if (renderData.fill) ctx.fillText(text, v.x, v.y);
            });
        };

        /**
         * 生成 renderable 对象
         * @param text 全部文本
         * @param lines 分行信息
         * @param index 从第几行开始生成
         * @param from 从第几个字符开始生成
         */
        const makeRenderable = (
            text: string,
            lines: number[],
            index: number,
            from: number
        ) => {
            renderable.splice(index);
            dirtyIndex.splice(0);
            dirtyIndex.push(index);
            // 初始化渲染
            linePointer = 0;
            startTime = Date.now();
            fromChar = from;
            needUpdate = true;

            let startY = renderable.reduce(
                (prev, curr) => prev + curr.textHeight + curr.height,
                0
            );
            // 第一个比较特殊，需要特判
            const start = lines[index - 1] ?? 0;
            const end = lines[index];
            const startPointer = from > start && from < end ? from - start : 0;
            const height = testHeight(text, renderData.font!);
            startY += height;
            renderable.push({
                text: text.slice(start, end),
                x: 0,
                y: startY,
                height: renderData.lineHeight!,
                textHeight: height,
                pointer: startPointer,
                from: start,
                to: end
            });

            for (let i = index + 1; i < lines.length; i++) {
                dirtyIndex.push(i);
                const start = lines[i - 1] ?? 0;
                const end = lines[i];
                const height = testHeight(text, renderData.font!);
                startY += height;

                renderable.push({
                    text: text.slice(start, end),
                    x: 0,
                    y: startY,
                    height: renderData.lineHeight!,
                    textHeight: height,
                    pointer: 0,
                    from: start,
                    to: end
                });
            }
            emit('typeStart');
        };

        /**
         * 从头开始渲染
         */
        const rawRender = (text: string, lines: number[]) => {
            console.trace();
            makeRenderable(text, lines, 0, 0);
            spriteElement.value?.update();
        };

        /**
         * 接续上一个继续渲染
         * @param from 从第几个字符接续渲染
         * @param lines 分行信息
         * @param index 从第几行接续渲染
         */
        const continueRender = (
            text: string,
            from: number,
            lines: number[],
            index: number
        ) => {
            makeRenderable(text, lines, index, from);
            spriteElement.value?.update();
        };

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

            if (renderData.keepLast && value.text.startsWith(old.text)) {
                shouldKeep = true;
            }
        });

        // 判断是否需要接续渲染
        watch(lineData, (value, old) => {
            if (shouldKeep) {
                shouldKeep = false;
                const isSub = old.slice(0, -1).every((v, i) => v === value[i]);

                // 有点地狱的条件分歧，大体就是分为两种情况，一种是两个末尾一致，如果一致那直接从下一行接着画就完事了
                // 但是如果不一致，那么从旧的最后一个开始往后画
                if (isSub) {
                    const last = value[old.length - 1];
                    const oldLast = value.at(-1);
                    if (!last) {
                        rawRender(data.value.text, value);
                        return;
                    }
                    if (last === oldLast) {
                        const index = old.length - 1;
                        continueRender(data.value.text, last, value, index);
                    } else {
                        if (!oldLast) {
                            rawRender(data.value.text, value);
                        } else {
                            const index = old.length - 1;
                            continueRender(
                                data.value.text,
                                oldLast,
                                value,
                                index
                            );
                        }
                    }
                } else {
                    rawRender(data.value.text, value);
                }
            } else {
                rawRender(data.value.text, value);
            }
        });

        return () => {
            return (
                <sprite
                    ref={spriteElement}
                    hd
                    antiAliasing={false}
                    x={renderData.x}
                    y={renderData.y}
                    width={renderData.width}
                    height={renderData.height}
                    render={renderContent}
                ></sprite>
            );
        };
    },
    textContentOptions
);

export interface TextboxProps extends TextContentProps {
    /** 背景颜色 */
    backColor?: CanvasStyle;
    /** 背景 winskin */
    winskin?: string;
}

interface TextboxSlots extends SlotsType {
    default: () => VNode;
}

const textboxOptions = {
    props: (textContentOptions.props as (keyof TextboxProps)[]).concat([
        'backColor',
        'winskin'
    ])
} satisfies SetupComponentOptions<TextboxProps, {}, string, TextboxSlots>;

export const Textbox = defineComponent<TextboxProps, {}, string, TextboxSlots>(
    (props, { slots }) => {
        return () => {
            return (
                <container>
                    {slots.default ? (
                        slots.default()
                    ) : props.winskin ? (
                        // todo
                        <winskin></winskin>
                    ) : (
                        // todo
                        <g-rect
                            x={0}
                            y={0}
                            width={props.width ?? 200}
                            height={props.height ?? 200}
                            fill
                            fillStyle={props.backColor}
                        ></g-rect>
                    )}
                    <TextContent {...props}></TextContent>
                </container>
            );
        };
    },
    textboxOptions
);

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
    if (words.length === 0) return [];
    else if (words.length === 1) return [words[0]];

    // 对文字二分，然后计算长度
    const text = data.text;
    const res: number[] = [];
    const fontSize = data.font.match(/\s*[\d\.-]+[a-zA-Z%]*\s*/)?.[0].trim();
    const unit = fontSize?.match(/[a-zA-Z%]+/)?.[0];
    const guessScale = fontSizeGuessScale.get(unit ?? '') ?? 0.2;
    const guessSize = parseInt(fontSize ?? '1') * guessScale;
    const averageLength = text.length / words.length;
    const guess = Math.max(data.width / guessSize / averageLength, 1);
    const ctx = testCanvas.ctx;
    ctx.font = data.font;

    let start = 0;
    let end = Math.ceil(guess);
    let resolved = 0;
    let mid = 0;
    let guessCount = 1;
    let splitProgress = false;

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
            if (end >= words.length) break;
            resolved = start;
            end = Math.ceil(start + guess);
            if (end > words.length) end = words.length;
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
    if (data.text.length <= 1) return [data.text.length];
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
            res.push(pointer + 1);
            continue;
        }

        if (
            breakChars.has(char) ||
            allBreak ||
            char === '\n' ||
            isCJK(char.charCodeAt(0))
        ) {
            res.push(pointer + 1);
            continue;
        }
    }
    res.push(text.length);
    return res;
}

function testHeight(text: string, font: string) {
    const ctx = testCanvas.ctx;
    ctx.font = font;
    return ctx.measureText(text).fontBoundingBoxAscent;
}
