<template>
    <div id="scroll">
        <div>
            <div :id="`content-${id}`" class="content">
                <slot></slot>
            </div>
        </div>
        <canvas :id="`scroll-${id}`" class="scroll"></canvas>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated } from 'vue';
import { useDrag, useWheel } from '../plugin/use';

let now = 0;
let total = 0;

const id = (1e8 * Math.random()).toFixed(0);
const scale = window.devicePixelRatio;

let ctx: CanvasRenderingContext2D;
let content: HTMLDivElement;

/** 绘制 */
function draw() {
    if (total === 0) return;
    if (now > total - ctx.canvas.height / scale) {
        now = total - ctx.canvas.height / scale;
    } else if (now < 0) {
        now = 0;
    }
    const length =
        Math.min(ctx.canvas.height / total / scale, 1) * ctx.canvas.height;
    const py = (now / total) * ctx.canvas.height;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.moveTo(20, Math.max(py + 5, 5));
    ctx.lineTo(20, Math.min(py + length - 5, ctx.canvas.height - 5));
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}

/**
 * 计算元素总长度
 */
function calHeight() {
    const div = document.getElementById(`content-${id}`) as HTMLDivElement;
    content = div;
    const style = getComputedStyle(div);
    total = parseFloat(style.height);
}

function scroll() {
    draw();
    content.style.top = `${-now}px`;
}

onUpdated(() => {
    calHeight();
    draw();
});

onMounted(() => {
    calHeight();
    const canvas = document.getElementById(`scroll-${id}`) as HTMLCanvasElement;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const style = getComputedStyle(canvas);
    canvas.width = 40 * scale;
    canvas.height = parseFloat(style.height) * scale;

    draw();

    let lastY: number;
    let contentLast: number;

    // 绑定滚动条拖拽事件
    useDrag(
        canvas,
        (x, y) => {
            const dy = y - lastY;
            lastY = y;
            if (canvas.height < total * scale)
                now += ((dy * total) / canvas.height) * scale;
            content.style.transition = '';
            scroll();
        },
        (x, y) => {
            lastY = y;
        },
        true
    );

    // 绑定文本拖拽事件
    useDrag(
        content,
        (x, y) => {
            const dy = y - contentLast;
            contentLast = y;
            if (canvas.height < total * scale) now -= dy;
            content.style.transition = '';
            scroll();
        },
        (x, y) => {
            contentLast = y;
        },
        true
    );

    useWheel(content, (x, y) => {
        if (!core.domStyle.isVertical && Math.abs(y) > 50) {
            content.style.transition = 'top 0.2s ease-out';
        } else {
            content.style.transition = '';
        }
        now += y;
        scroll();
    });
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

#scroll {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex-basis: content;
}

.content {
    position: relative;
}
</style>
