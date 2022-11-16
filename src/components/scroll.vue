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
import { onMounted, onUnmounted, onUpdated } from 'vue';
import { useDrag, useWheel } from '../plugin/use';

const props = defineProps<{
    type?: 'vertical' | 'horizontal';
}>();

let now = 0;
let total = 0;

const id = (1e8 * Math.random()).toFixed(0);
const scale = window.devicePixelRatio;

const cssTarget = props.type === 'horizontal' ? 'left' : 'top';
const canvasAttr = props.type === 'horizontal' ? 'width' : 'height';

let ctx: CanvasRenderingContext2D;
let content: HTMLDivElement;

const resize = () => {
    calHeight();
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
    const length =
        Math.min(ctx.canvas[canvasAttr] / total / scale, 1) *
        ctx.canvas[canvasAttr];
    const py = (now / total) * ctx.canvas[canvasAttr];

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    if (props.type === 'horizontal') {
        ctx.moveTo(Math.max(py + 5, 5), 20 * scale);
        ctx.lineTo(Math.min(py + length - 5, ctx.canvas.width - 5), 20 * scale);
    } else {
        ctx.moveTo(20 * scale, Math.max(py + 5, 5));
        ctx.lineTo(
            20 * scale,
            Math.min(py + length - 5, ctx.canvas.height - 5)
        );
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}

/**
 * 计算元素总长度
 */
function calHeight() {
    const style = getComputedStyle(content);
    total = parseFloat(style[canvasAttr]);
}

function scroll() {
    draw();
    content.style[cssTarget] = `${-now}px`;
}

onUpdated(() => {
    calHeight();
    draw();
});

onMounted(() => {
    const div = document.getElementById(`scroll-div-${id}`) as HTMLDivElement;
    const canvas = document.getElementById(`scroll-${id}`) as HTMLCanvasElement;
    const d = document.getElementById(`content-${id}`) as HTMLDivElement;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    content = d;
    calHeight();

    content.addEventListener('resize', resize);

    const style = getComputedStyle(canvas);
    canvas.width = 40 * scale;
    canvas.height = parseFloat(style.height) * scale;

    if (props.type === 'horizontal') {
        div.style.flexDirection = 'column';
        canvas.style.height = '40px';
        canvas.style.width = '98%';
        canvas.style.margin = '0 1% 0 1%';
        canvas.width = parseFloat(style.width) * scale;
        canvas.height = 40 * scale;
    }

    draw();

    let last: number;
    let contentLast: number;

    // 绑定滚动条拖拽事件
    useDrag(
        canvas,
        (x, y) => {
            const d = props.type === 'horizontal' ? x : y;
            const dy = d - last;
            last = d;
            if (canvas[canvasAttr] < total * scale)
                now += ((dy * total) / canvas[canvasAttr]) * scale;
            content.style.transition = '';
            scroll();
        },
        (x, y) => {
            last = props.type === 'horizontal' ? x : y;
        },
        true
    );

    // 绑定文本拖拽事件
    useDrag(
        content,
        (x, y) => {
            const d = props.type === 'horizontal' ? x : y;
            const dy = d - contentLast;
            contentLast = d;
            if (canvas[canvasAttr] < total * scale) now -= dy;
            content.style.transition = '';
            scroll();
        },
        (x, y) => {
            contentLast = props.type === 'horizontal' ? x : y;
        },
        true
    );

    useWheel(content, (x, y) => {
        const d = x !== 0 ? x : y;
        if (!core.domStyle.isVertical) {
            if (Math.abs(d) > 50) {
                content.style.transition = `${cssTarget} 0.2s ease-out`;
            }
        } else {
            content.style.transition = '';
        }

        now += d;
        scroll();
    });
});

onUnmounted(() => {
    content.removeEventListener('resize', resize);
});
</script>

<style lang="less" scoped>
.scroll {
    opacity: 0.2;
    width: 40px;
    height: 98%;
    margin-top: 1%;
    margin-bottom: 1%;
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
