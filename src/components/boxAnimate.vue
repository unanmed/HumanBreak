<template>
    <canvas
        :width="width ?? 32"
        :height="height ?? 32"
        :id="`box-animate-${id}`"
    ></canvas>
</template>

<script lang="tsx" setup>
import { onMounted, onUnmounted, onUpdated, ref } from 'vue';
import { addAnimate, removeAnimate } from '../plugin/animateController';
import { has } from '../plugin/utils';

const id = (Math.random() * 1e8).toFixed(0);

const props = defineProps<{
    id: string;
    noborder?: boolean;
    width?: number;
    height?: number;
}>();

let c: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let drawFn: () => void;

function draw() {
    if (has(drawFn)) removeAnimate(drawFn);

    const cls = core.getClsFromId(props.id);
    const frames = core.getAnimateFrames(cls);
    const w = props.width ?? 32;
    const h = props.height ?? 32;

    if (!props.noborder) {
        c.style.border = '1.5px solid #ddd';
        c.style.backgroundColor = '#222';
    }

    const scale = window.devicePixelRatio;

    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    c.width = scale * w;
    c.height = scale * h;
    ctx.scale(scale, scale);

    if (frames === 1) {
        core.drawIcon(ctx, props.id, 0, 0, props.width, props.height);
    } else {
        drawFn = () => {
            core.clearMap(ctx);
            const frame = core.status.globalAnimateStatus % frames;
            core.drawIcon(ctx, props.id, 0, 0, w, h, frame);
        };

        drawFn();
        addAnimate(drawFn);

        onUnmounted(() => {
            removeAnimate(drawFn);
        });
    }
}

onMounted(() => {
    c = document.getElementById(`box-animate-${id}`) as HTMLCanvasElement;
    ctx = c.getContext('2d')!;
    draw();
});

onUpdated(() => {
    draw();
});
</script>

<style lang="less" scoped></style>
