<template>
    <div :id="`scroll-div-${id}`" class="scroll-main">
        <div class="main-div">
            <div :id="`content-${id}`" class="content">
                <slot></slot>
            </div>
        </div>
        <canvas :id="`scroll-${id}`" class="scroll"></canvas>
    </div>
</template>

<script lang="ts" setup>
import { sleep } from 'mutate-animate';
import { onMounted, onUnmounted, onUpdated } from 'vue';
import { cancelGlobalDrag, useDrag, useWheel } from '../plugin/use';
import { requireUniqueSymbol } from '@/plugin/utils';

let main: HTMLDivElement;

const props = defineProps<{
    now?: number;
    type?: 'vertical' | 'horizontal';
    drag?: boolean;
    width?: number;
    update?: boolean;
    noScroll?: boolean;
}>();

const emits = defineEmits<{
    (e: 'update:now', value: number): void;
    (e: 'update:drag', value: boolean): void;
    (e: 'update:update'): void;
}>();

let now = 0;
let total = 0;

const id = requireUniqueSymbol().toFixed(0);
const scale = window.devicePixelRatio;
const width = props.width ?? 20;

const cssTarget = props.type === 'horizontal' ? 'left' : 'top';
const canvasAttr = props.type === 'horizontal' ? 'width' : 'height';

let ctx: CanvasRenderingContext2D;
let content: HTMLDivElement;
let fromSelf = false;

const resize = async () => {
    await calHeight(false);
    draw();
};

/** 绘制 */
function draw() {
    if (total === 0) return;
    if (total < ctx.canvas[canvasAttr] / scale) {
        now = 0;
    } else if (now > total - ctx.canvas[canvasAttr] / scale) {
        now = total - ctx.canvas[canvasAttr] / scale;
    } else if (now < 0) {
        now = 0;
    }
    if (props.noScroll) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    emits('update:now', now);
    const length =
        Math.min(ctx.canvas[canvasAttr] / total / scale, 1) *
        ctx.canvas[canvasAttr];
    const py = (now / total) * ctx.canvas[canvasAttr];

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    if (props.type === 'horizontal') {
        ctx.moveTo(Math.max(py + 5, 5), h / 2);
        ctx.lineTo(Math.min(py + length - 5, ctx.canvas.width - 5), h / 2);
    } else {
        ctx.moveTo(w / 2, Math.max(py + 5, 5));
        ctx.lineTo(w / 2, Math.min(py + length - 5, ctx.canvas.height - 5));
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}

/**
 * 计算元素总长度
 */
async function calHeight(first: boolean = false) {
    if (!first) {
        await sleep(20);
    }
    const canvas = ctx.canvas;
    const style2 = getComputedStyle(canvas);
    canvas.style.width = `${width}px`;
    canvas.width = width * scale;
    canvas.height = parseFloat(style2.height) * scale;
    if (props.noScroll) canvas.style.width = `0px`;

    if (props.type === 'horizontal') {
        main.style.flexDirection = 'column';
        canvas.style.height = `${width}px`;
        canvas.style.width = '98%';
        canvas.style.margin = '0 1% 0 1%';
        canvas.width = parseFloat(style2.width) * scale;
        canvas.height = width * scale;
        if (props.noScroll) canvas.style.height = `0px`;
    }
    await new Promise(res => {
        requestAnimationFrame(() => {
            const style = getComputedStyle(content);
            total = parseFloat(style[canvasAttr]);
            res('');
        });
    });
}

function scroll() {
    draw();
    content.style[cssTarget] = `${-now}px`;
}

onUpdated(async () => {
    if (fromSelf) return;
    now = props.now ?? now;
    content.style.transition = `${cssTarget} 0.2s ease-out`;
    await calHeight(false);
    scroll();
});

let last: number;
let contentLast: number;

function canvasDrag(x: number, y: number) {
    emits('update:drag', true);
    const d = props.type === 'horizontal' ? x : y;
    const dy = d - last;
    last = d;
    if (ctx.canvas[canvasAttr] < total * scale)
        now += ((dy * total) / ctx.canvas[canvasAttr]) * scale;
    scroll();
}

function contentDrag(x: number, y: number) {
    emits('update:drag', true);
    const d = props.type === 'horizontal' ? x : y;
    const dy = d - contentLast;
    contentLast = d;
    if (ctx.canvas[canvasAttr] < total * scale) now -= dy;
    scroll();
}

onMounted(async () => {
    main = document.getElementById(`scroll-div-${id}`) as HTMLDivElement;
    const d = document.getElementById(`content-${id}`) as HTMLDivElement;
    content = d;
    const canvas = document.getElementById(`scroll-${id}`) as HTMLCanvasElement;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    if (!props.noScroll) {
        // 绑定滚动条拖拽事件
        useDrag(
            canvas,
            canvasDrag,
            (x, y) => {
                fromSelf = true;
                last = props.type === 'horizontal' ? x : y;
                content.style.transition = '';
            },
            () => {
                setTimeout(() => emits('update:drag', false));
                fromSelf = false;
            },
            true
        );
    }

    // 绑定文本拖拽事件
    useDrag(
        content,
        contentDrag,
        (x, y) => {
            fromSelf = true;
            contentLast = props.type === 'horizontal' ? x : y;
            content.style.transition = '';
        },
        () => {
            setTimeout(() => emits('update:drag', false));
            fromSelf = false;
        },
        true
    );

    useWheel(content, (x, y) => {
        fromSelf = true;
        const d = x !== 0 ? x : y;
        if (Math.abs(d) > 30) {
            content.style.transition = `${cssTarget} 0.2s ease-out`;
        } else {
            content.style.transition = '';
        }
        now += d;
        scroll();
        fromSelf = false;
    });

    window.addEventListener('resize', resize);
    await calHeight(true);
    await calHeight();
    draw();
});

onUnmounted(() => {
    window.removeEventListener('resize', resize);
    cancelGlobalDrag(canvasDrag);
    cancelGlobalDrag(contentDrag);
});
</script>

<style lang="less" scoped>
.scroll {
    opacity: 0.2;
    transition: opacity 0.2s linear;
}

.scroll:hover {
    opacity: 0.4;
}

.scroll:active {
    opacity: 0.6;
}

.scroll-main {
    display: flex;
    flex-direction: row;
    max-width: 100%;
    max-height: 100%;
    justify-content: stretch;
}

.content {
    width: 100%;
    position: relative;
}

.main-div {
    flex-basis: 100%;
    overflow: hidden;
}
</style>
