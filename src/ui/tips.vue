<template>
    <span ref="span" class="tip">{{ nowTip }}</span>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import tips from '@/data/tips.json';

const span = ref<HTMLSpanElement>();
const nowTip = ref<string>();

function changeTip() {
    const tip = tips[Math.floor(Math.random() * tips.length)];
    if (!tip) return;
    nowTip.value = '小贴士：' + tip;
}

const interval = window.setInterval(changeTip, 30_000);

function resize() {
    const game = core.dom.gameDraw;
    const right = window.innerWidth - (game.offsetLeft + game.offsetWidth);
    const bottom = window.innerHeight - game.offsetTop;
    if (!span.value) return;
    span.value.style.right = `${right}px`;
    span.value.style.bottom = `${bottom + 6}px`;
}

onMounted(() => {
    window.addEventListener('resize', resize);
    resize();
    changeTip();
});

onUnmounted(() => {
    window.removeEventListener('resize', resize);
    window.clearInterval(interval);
});
</script>

<style lang="less" scoped>
.tip {
    position: fixed;
    font: 150% 'normal';
}
</style>
