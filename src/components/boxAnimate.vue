<template>
    <canvas
        ref="canvas"
        :width="width ?? 32"
        :height="height ?? 32"
        id="canvas"
    ></canvas>
</template>

<script lang="tsx" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { addAnimate, removeAnimate } from '../plugin/animateController';

const props = defineProps<{
    id: string;
    width?: number;
    height?: number;
}>();

const canvas = ref<HTMLCanvasElement>();

onMounted(() => {
    const c = canvas.value!;
    const ctx = c.getContext('2d')!;
    const cls = core.getClsFromId(props.id);
    const frames = core.getAnimateFrames(cls);

    const scale = window.devicePixelRatio;

    c.style.width = `${c.width}px`;
    c.style.height = `${c.height}px`;
    c.width *= scale;
    c.height *= scale;
    ctx.scale(scale, scale);

    const fn = () => {
        core.clearMap(ctx);
        const frame = core.status.globalAnimateStatus % frames;
        core.drawIcon(ctx, props.id, 0, 0, props.width, props.height, frame);
    };

    fn();
    addAnimate(fn);

    onUnmounted(() => {
        removeAnimate(fn);
    });
});
</script>

<style lang="less" scoped>
#canvas {
    border: 1.5px solid #ddd;
    background-color: #222;
}
</style>
