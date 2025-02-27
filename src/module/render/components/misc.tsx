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
