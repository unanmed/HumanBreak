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
import { has, requireUniqueSymbol } from '../plugin/utils';

const id = requireUniqueSymbol().toFixed(0);

const props = defineProps<{
    id: AllIds | 'hero' | 'none';
    noborder?: boolean;
    width?: number;
    height?: number;
    noAnimate?: boolean;
}>();

let c: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let drawFn: () => void;

function draw() {
    if (has(drawFn)) removeAnimate(drawFn);

    const cls = core.getClsFromId(props.id as AllIds);
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
    ctx.imageSmoothingEnabled = false;

    if (props.id === 'none') return;

    if (props.id === 'hero') {
        const img = core.material.images.hero;
        ctx.drawImage(img, 0, 0, img.width / 4, img.height / 4, 0, 0, w, h);
    } else if (frames === 1) {
        core.drawIcon(ctx, props.id, 0, 0, props.width, props.height);
    } else {
        drawFn = () => {
            core.clearMap(ctx);
            const frame = props.noAnimate
                ? 0
                : core.status.globalAnimateStatus % frames;
            core.drawIcon(ctx, props.id as AllIds, 0, 0, w, h, frame);
        };

        drawFn();
        if (!props.noAnimate) {
            addAnimate(drawFn);
        }
    }
}

onUnmounted(() => {
    removeAnimate(drawFn);
});

onMounted(() => {
    c = document.getElementById(`box-animate-${id}`) as HTMLCanvasElement;
    ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    draw();
});

onUpdated(() => {
    draw();
});
</script>

<style lang="less" scoped></style>
