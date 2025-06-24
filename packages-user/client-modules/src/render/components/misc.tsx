import {
    DefaultProps,
    ElementLocator,
    onTick,
    PathProps,
    Sprite
} from '@motajs/render';
import { computed, defineComponent, ref, SetupContext, watch } from 'vue';
import { MotaOffscreenCanvas2D } from '@motajs/render';
import { TextContent, TextContentProps } from './textbox';
import { Scroll, ScrollExpose, ScrollProps } from './scroll';
import { transitioned } from '../use';
import { hyper } from 'mutate-animate';
import { logger } from '@motajs/common';
import { GameUI, IUIMountable, SetupComponentOptions } from '@motajs/system-ui';
import { clamp } from 'lodash-es';

interface ProgressProps extends DefaultProps {
    /** 进度条的位置 */
    loc: ElementLocator;
    /** 进度条的进度，1表示完成，0表示未完成 */
    progress: number;
    /** 已完成部分的样式，默认为绿色（green） */
    success?: CanvasStyle;
    /** 未完成部分的样式，默认为灰色（gray） */
    background?: CanvasStyle;
    /** 线宽度 */
    lineWidth?: number;
}

const progressProps = {
    props: ['loc', 'progress', 'success', 'background']
} satisfies SetupComponentOptions<ProgressProps>;

/**
 * 进度条组件，参数参考 {@link ProgressProps}，用例如下：
 * ```tsx
 * // 定义进度
 * const progress = ref(0);
 *
 * // 显示进度条
 * <Progress loc={[12, 12, 120, 8]} progress={progress.value} />
 * ```
 */
export const Progress = defineComponent<ProgressProps>(props => {
    const element = ref<Sprite>();

    const render = (canvas: MotaOffscreenCanvas2D) => {
        const { ctx } = canvas;
        const width = props.loc[2] ?? 200;
        const height = props.loc[3] ?? 200;
        ctx.lineCap = 'round';
        const lineWidth = props.lineWidth ?? 2;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = props.background ?? 'gray';
        ctx.beginPath();
        ctx.moveTo(lineWidth, height / 2);
        ctx.lineTo(width - lineWidth, height / 2);
        ctx.stroke();
        const progress = clamp(props.progress, 0, 1);
        if (!isNaN(progress)) {
            ctx.strokeStyle = props.success ?? 'green';
            const p = lineWidth + (width - lineWidth * 2) * progress;
            ctx.beginPath();
            ctx.moveTo(lineWidth, height / 2);
            ctx.lineTo(p, height / 2);
            ctx.stroke();
        }
    };

    watch(props, () => {
        element.value?.update();
    });

    return () => {
        return <sprite ref={element} loc={props.loc} render={render}></sprite>;
    };
}, progressProps);

export interface ArrowProps extends PathProps {
    /** 箭头的起始和终点坐标，前两个是起始坐标，后两个是终点坐标 */
    arrow: [number, number, number, number];
    /** 箭头的头部大小 */
    head?: number;
    /** 箭头的颜色 */
    color?: CanvasStyle;
}

const arrowProps = {
    props: ['arrow', 'head', 'color']
} satisfies SetupComponentOptions<ArrowProps>;

/**
 * 箭头组件，显示一个箭头，参数参考 {@link ArrowProps}，用例如下：
 * ```tsx
 * // 从 (12, 12) 到 (48, 48) 的箭头
 * <Arrow arrow={[12, 12, 48, 48]} />
 * ```
 */
export const Arrow = defineComponent<ArrowProps>(props => {
    const loc = computed<ElementLocator>(() => {
        const [x1, y1, x2, y2] = props.arrow;
        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const top = Math.min(y1, y2);
        const bottom = Math.max(y1, y2);
        return [left, top, right - left, bottom - top];
    });
    const path = computed(() => {
        const path = new Path2D();
        const head = props.head ?? 8;
        const [x = 0, y = 0] = loc.value;
        const [x1, y1, x2, y2] = props.arrow;
        path.moveTo(x1 - x, y1 - y);
        path.lineTo(x2 - x, y2 - y);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        path.moveTo(
            x2 - head * Math.cos(angle - Math.PI / 6),
            y2 - head * Math.sin(angle - Math.PI / 6)
        );
        path.lineTo(x2 - x, y2 - y);
        path.lineTo(
            x2 - head * Math.cos(angle + Math.PI / 6),
            y2 - head * Math.sin(angle + Math.PI / 6)
        );
        return path;
    });

    return () => (
        <g-path
            loc={loc.value}
            path={path.value}
            stroke
            strokeStyle={props.color}
            lineCap="round"
            lineJoin="round"
        />
    );
}, arrowProps);

export interface ScrollTextProps extends TextContentProps, ScrollProps {
    /** 自动滚动的速度，每秒多少像素 */
    speed: number;
    /** 文字的最大宽度 */
    width: number;
    /** 自动滚动组件的定位 */
    loc: ElementLocator;
    /** 文字滚动入元素之前要先滚动多少像素，默认16像素 */
    pad?: number;
}

export type ScrollTextEmits = {
    /**
     * 当滚动完毕时触发
     */
    scrollEnd: () => void;
};

export interface ScrollTextExpose {
    /**
     * 暂停滚动
     */
    pause(): void;

    /**
     * 继续滚动
     */
    resume(): void;

    /**
     * 设置滚动速度
     */
    setSpeed(speed: number): void;

    /**
     * 立刻重新滚动
     */
    rescroll(): void;
}

const scrollProps = {
    props: ['speed', 'loc', 'pad', 'width'],
    emits: ['scrollEnd']
} satisfies SetupComponentOptions<
    ScrollTextProps,
    ScrollTextEmits,
    keyof ScrollTextEmits
>;

/**
 * 滚动文字，可以用于展示长剧情或者 staff 表，参数参考 {@link ScrollTextProps}，
 * 事件参考 {@link ScrollTextEmits}，函数接口参考 {@link ScrollTextExpose}，用例如下：
 * ```tsx
 * // 用于接受函数接口
 * const scroll = ref<ScrollTextExpose>();
 * // 显示的文字
 * const text = '滚动文字'.repeat(100);
 *
 * onMounted(() => {
 *   // 设置为每秒滚动 100 像素
 *   scroll.value?.setSpeed(100);
 *   // 暂停滚动
 *   scroll.value?.pause();
 * });
 *
 * // 显示滚动文字，每秒滚动 50 像素
 * <ScrollText ref={scroll} text={text} speed={50} loc={[0, 0, 180, 100]} width={180} />
 * ```
 */
export const ScrollText = defineComponent<
    ScrollTextProps,
    ScrollTextEmits,
    keyof ScrollTextEmits
>((props, { emit, expose, attrs }) => {
    const scroll = ref<ScrollExpose>();
    const speed = ref(props.speed);

    const eleHeight = computed(() => props.loc[3] ?? props.width);
    const pad = computed(() => props.pad ?? 16);

    let lastFixedTime = Date.now();
    let lastFixedPos = 0;
    let paused = false;
    let nowScroll = 0;

    onTick(() => {
        if (paused || !scroll.value) return;
        const now = Date.now();
        const dt = now - lastFixedTime;
        nowScroll = (dt / 1000) * speed.value + lastFixedPos;
        scroll.value.scrollTo(nowScroll, 0);
        if (nowScroll >= scroll.value.getScrollLength()) {
            emit('scrollEnd');
            paused = true;
        }
        lastFixedTime = now;
    });

    const pause = () => {
        paused = true;
    };

    const resume = () => {
        paused = false;
        lastFixedPos = nowScroll;
        lastFixedTime = Date.now();
    };

    const setSpeed = (value: number) => {
        lastFixedPos = nowScroll;
        lastFixedTime = Date.now();
        speed.value = value;
    };

    const rescroll = () => {
        nowScroll = 0;
        lastFixedTime = Date.now();
        lastFixedPos = 0;
    };

    expose<ScrollTextExpose>({ pause, resume, setSpeed, rescroll });

    return () => (
        <Scroll
            ref={scroll}
            loc={props.loc}
            padEnd={eleHeight.value + pad.value}
            noscroll
        >
            <TextContent
                {...attrs}
                width={props.width - 16}
                loc={[8, eleHeight.value + pad.value]}
                autoHeight
            />
        </Scroll>
    );
}, scrollProps);

export interface SelectionProps extends DefaultProps {
    loc: ElementLocator;
    color?: CanvasStyle;
    border?: CanvasStyle;
    winskin?: ImageIds;
    /** 选择图标的不透明度范围 */
    alphaRange?: [number, number];
}

const selectionProps = {
    props: ['loc', 'color', 'border', 'winskin', 'alphaRange']
} satisfies SetupComponentOptions<SelectionProps>;

/**
 * 显示一个选择光标，与 2.x 的 drawUIEventSelector 效果一致，参数参考 {@link SelectionProps}，用例如下：
 * ```tsx
 * // 使用 winskin.png 作为选择光标，光标动画的不透明度范围是 [0.3, 0.8]
 * <Selection loc={[24, 24, 80, 16]} winskin="winskin.png" alphaRange={[0.3, 0.8]} />
 * // 使用指定的填充和边框颜色作为选择光标
 * <Selection loc={[24, 24, 80, 16]} color="#ddd" border="gold" />
 * ```
 */
export const Selection = defineComponent<SelectionProps>(props => {
    const minAlpha = computed(() => props.alphaRange?.[0] ?? 0.25);
    const maxAlpha = computed(() => props.alphaRange?.[1] ?? 0.55);
    const alpha = transitioned(minAlpha.value, 2000, hyper('sin', 'in-out'))!;

    const isWinskin = computed(() => !!props.winskin);
    const winskinImage = computed(() =>
        isWinskin.value ? core.material.images.images[props.winskin!] : null
    );
    const fixedLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, width = 200, height = 200, ax, ay] = props.loc;
        return [x + 1, y + 1, width - 2, height - 2, ax, ay];
    });

    const renderWinskin = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        const image = winskinImage.value;
        if (!image) return;
        const [, , width = 200, height = 200] = props.loc;
        // 背景
        ctx.drawImage(image, 130, 66, 28, 28, 2, 2, width - 4, height - 4);
        // 四个角
        ctx.drawImage(image, 128, 64, 2, 2, 0, 0, 2, 2);
        ctx.drawImage(image, 158, 64, 2, 2, width - 2, 0, 2, 2);
        ctx.drawImage(image, 128, 94, 2, 2, 0, height - 2, 2, 2);
        ctx.drawImage(image, 158, 94, 2, 2, width - 2, height - 2, 2, 2);
        // 四条边
        ctx.drawImage(image, 130, 64, 28, 2, 2, 0, width - 4, 2);
        ctx.drawImage(image, 130, 94, 28, 2, 2, height - 2, width - 4, 2);
        ctx.drawImage(image, 128, 66, 2, 28, 0, 2, 2, height - 4);
        ctx.drawImage(image, 158, 66, 2, 28, width - 2, 2, 2, height - 4);
    };

    onTick(() => {
        if (alpha.value === maxAlpha.value) {
            alpha.set(minAlpha.value);
        }
        if (alpha.value === minAlpha.value) {
            alpha.set(maxAlpha.value);
        }
    });

    return () =>
        isWinskin.value ? (
            <sprite
                loc={props.loc}
                render={renderWinskin}
                alpha={alpha.ref.value}
                noanti
            />
        ) : (
            <g-rectr
                loc={fixedLoc.value}
                circle={[4]}
                alpha={alpha.ref.value}
                fill
                stroke
                fillStyle={props.color}
                strokeStyle={props.border}
                lineWidth={1}
            />
        );
}, selectionProps);

export interface BackgroundProps extends DefaultProps {
    loc: ElementLocator;
    winskin?: ImageIds;
    color?: CanvasStyle;
    border?: CanvasStyle;
}

const backgroundProps = {
    props: ['loc', 'winskin', 'color', 'border']
} satisfies SetupComponentOptions<BackgroundProps>;

/**
 * 背景组件，与 Selection 类似，不过绘制的是背景，而不是选择光标，参数参考 {@link BackgroundProps}，用例如下：
 * ```tsx
 * // 使用 winskin2.png 作为背景
 * <Background loc={[8, 8, 160, 160]} winskin="winskin2.png" />
 * // 使用指定填充和边框颜色作为背景
 * <Background loc={[8, 8, 160, 160]} color="#333" border="gold" />
 * ```
 */
export const Background = defineComponent<BackgroundProps>(props => {
    const isWinskin = computed(() => !!props.winskin);
    const fixedLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, width = 200, height = 200] = props.loc;
        return [x + 2, y + 2, width - 4, height - 4];
    });

    return () =>
        isWinskin.value ? (
            <winskin image={props.winskin!} loc={props.loc} noanti />
        ) : (
            <g-rectr
                loc={fixedLoc.value}
                fillStyle={props.color}
                strokeStyle={props.border}
                fill
                stroke
                lineWidth={2}
                circle={[4]}
            />
        );
}, backgroundProps);

export interface WaitBoxProps<T>
    extends Partial<BackgroundProps>,
        Partial<TextContentProps> {
    loc: ElementLocator;
    width: number;
    promise?: Promise<T>;
    text?: string;
    pad?: number;
}

export type WaitBoxEmits<T> = {
    resolve: (data: T) => void;
};

export interface WaitBoxExpose<T> {
    /**
     * 手动将此组件兑现，注意调用时如果传入的 Promise 还没有兑现，
     * 当 Promise 兑现后将不会再次触发 resolve 事件，即 resolve 事件只会被触发一次
     * @param data 兑现值
     */
    resolve(data: T): void;
}

const waitBoxProps = {
    props: ['promise', 'loc', 'winskin', 'color', 'border', 'width'],
    emits: ['resolve']
} satisfies SetupComponentOptions<
    WaitBoxProps<unknown>,
    WaitBoxEmits<unknown>,
    keyof WaitBoxEmits<unknown>
>;

/**
 * 等待框，可以等待某个异步操作 (Promise)，操作完毕后触发兑现事件，单次调用参考 {@link waitbox}。
 * 参数参考 {@link WaitBoxProps}，事件参考 {@link WaitBoxEmits}，函数接口参考 {@link WaitBoxExpose}。用例如下：
 * ```tsx
 * // 创建一个等待 1000ms 的 Promise，兑现值是等待完毕时的当前时间刻
 * const promise = new Promise(res => window.setTimeout(() => res(Date.now()), 1000));
 *
 * <WaitBox
 *   // 传入要等待的 Promise
 *   promise={promise}
 *   // 等待框的位置，宽度由 width 参数指定，高度由内部计算得来，不需要手动指定，即使手动指定也无效
 *   loc={[240, 240, void 0, void 0, 0.5, 0.5]}
 *   // 等待框的宽度
 *   width={240}
 *   // 完全继承 Background 的参数，因此可以直接指定背景样式
 *   winskin="winskin2.png"
 *   // 完全继承 TextContent 的参数，因此可以直接指定字体
 *   font={new Font('Verdana', 28)}
 *   // 当传入的 Promise 兑现时触发此事件，注意此事件只可能触发一次，触发后便不会再次触发
 *   onResolve={(time) => console.log(time)}
 * />
 * ```
 */
export const WaitBox = defineComponent<
    WaitBoxProps<unknown>,
    WaitBoxEmits<unknown>,
    keyof WaitBoxEmits<unknown>
>(
    <T,>(
        props: WaitBoxProps<T>,
        { emit, expose, attrs }: SetupContext<WaitBoxEmits<T>>
    ) => {
        const contentHeight = ref(200);

        const text = computed(() => props.text ?? '请等待 ...');
        const pad = computed(() => props.pad ?? 24);
        const containerLoc = computed<ElementLocator>(() => {
            const [x = 0, y = 0, , , ax = 0, ay = 0] = props.loc;
            return [x, y, props.width, contentHeight.value, ax, ay];
        });
        const backLoc = computed<ElementLocator>(() => {
            return [1, 1, props.width - 2, contentHeight.value - 2];
        });
        const contentLoc = computed<ElementLocator>(() => {
            return [
                pad.value,
                pad.value,
                props.width - pad.value * 2,
                contentHeight.value - pad.value * 2
            ];
        });

        let resolved: boolean = false;

        props.promise?.then(
            value => {
                resolve(value);
            },
            reason => {
                logger.warn(63, reason);
            }
        );

        const resolve = (data: T) => {
            if (resolved) return;
            resolved = true;
            emit('resolve', data);
        };

        const onContentHeight = (height: number) => {
            contentHeight.value = height + pad.value * 2;
        };

        expose<WaitBoxExpose<T>>({ resolve });

        return () => (
            <container loc={containerLoc.value}>
                <Background
                    loc={backLoc.value}
                    zIndex={0}
                    winskin={props.winskin}
                    color={props.color}
                    border={props.border}
                />
                <TextContent
                    {...attrs}
                    autoHeight
                    text={text.value}
                    loc={contentLoc.value}
                    width={props.width - pad.value * 2}
                    zIndex={5}
                    onUpdateHeight={onContentHeight}
                />
            </container>
        );
    },
    waitBoxProps
);

/**
 * 打开一个等待框，等待传入的 Promise 兑现后，关闭等待框，并将兑现值返回。
 * 示例，等待 1000ms：
 * ```ts
 * // 创建一个等待 1000ms 的 Promise，兑现值是等待完毕时的当前时间刻
 * const promise = new Promise(res => window.setTimeout(() => res(Date.now()), 1000));
 * const value = await waitbox(
 *   // 在哪个 UI 控制器上打开，对于一般 UI 组件来说，直接填写 props.controller 即可
 *   props.controller,
 *   // 确认框的位置，宽度由下一个参数指定，高度参数由组件内部计算得出，指定无效
 *   [240, 240, void 0, void 0, 0.5, 0.5],
 *   // 确认框的宽度
 *   240,
 *   // 要等待的 Promise
 *   promise,
 *   // 额外的 props，例如填写等待文本，此项可选，参考 WaitBoxProps
 *   { text: '请等待 1000ms' }
 * );
 * console.log(value); // 输出时间刻
 * ```
 * @param controller UI 控制器
 * @param loc 等待框的位置
 * @param width 等待框的宽度
 * @param promise 要等待的 Promise
 * @param props 额外的 props，参考 {@link WaitBoxProps}
 */
export function waitbox<T>(
    controller: IUIMountable,
    loc: ElementLocator,
    width: number,
    promise: Promise<T>,
    props?: Partial<WaitBoxProps<T>>
): Promise<T> {
    return new Promise<T>(res => {
        const instance = controller.open(WaitBoxUI, {
            ...(props ?? {}),
            loc,
            width,
            promise,
            onResolve: data => {
                controller.close(instance);
                res(data as T);
            }
        });
    });
}

export const WaitBoxUI = new GameUI('wait-box', WaitBox);
export const BackgroundUI = new GameUI('background', Background);
