import {
    DefaultProps,
    ElementLocator,
    onTick,
    PathProps,
    Sprite
} from '@/core/render';
import { computed, defineComponent, ref, watch } from 'vue';
import { SetupComponentOptions } from './types';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { TextboxProps, TextContent } from './textbox';
import { Scroll, ScrollExpose, ScrollProps } from './scroll';
import { transitioned } from '../use';
import { hyper } from 'mutate-animate';

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
        if (!isNaN(props.progress)) {
            ctx.strokeStyle = props.success ?? 'green';
            const p = lineWidth + (width - lineWidth * 2) * props.progress;
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
    /** 箭头的四个坐标 */
    arrow: [number, number, number, number];
    /** 箭头的头部大小 */
    head?: number;
    /** 箭头的颜色 */
    color?: CanvasStyle;
}

const arrowProps = {
    props: ['arrow', 'head', 'color']
} satisfies SetupComponentOptions<ArrowProps>;

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

export interface ScrollTextProps extends TextboxProps, ScrollProps {
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

export const ScrollText = defineComponent<
    ScrollTextProps,
    ScrollTextEmits,
    keyof ScrollTextEmits
>((props, { emit, expose, attrs }) => {
    const scroll = ref<ScrollExpose>();
    const speed = ref(props.speed);

    const eleHeight = computed(() => props.loc[3] ?? props.height ?? 200);
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
                width={props.width}
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

export const Selection = defineComponent<SelectionProps>(props => {
    const minAlpha = computed(() => props.alphaRange?.[0] ?? 0.25);
    const maxAlpha = computed(() => props.alphaRange?.[1] ?? 0.55);
    const alpha = transitioned(minAlpha.value, 2000, hyper('sin', 'in-out'))!;

    const isWinskin = computed(() => !!props.winskin);
    const winskinImage = computed(() =>
        isWinskin.value ? core.material.images.images[props.winskin!] : null
    );
    const fixedLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, width = 200, height = 200] = props.loc;
        return [x + 1, y + 1, width - 2, height - 2];
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
