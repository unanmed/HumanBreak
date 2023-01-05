<template>
    <div id="chapter">
        <canvas id="chapter-back"></canvas>
        <span id="chapter-text">{{ chapter }}</span>
    </div>
</template>

<script lang="ts" setup>
import { Animation, hyper, power, sleep } from 'mutate-animate';
import { onMounted, ref } from 'vue';
import { has } from '../plugin/utils';
import { chapterShowed } from '../plugin/ui/chapter';

const props = defineProps<{
    chapter: string;
}>();

let can: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let text: HTMLSpanElement;

onMounted(async () => {
    can = document.getElementById('chapter-back') as HTMLCanvasElement;
    ctx = can.getContext('2d')!;
    text = document.getElementById('chapter-text') as HTMLSpanElement;

    const ani = new Animation();
    const w = window.innerWidth * devicePixelRatio;
    const h = window.innerHeight * devicePixelRatio;
    ctx.font = '5vh scroll';
    const textWidth = ctx.measureText(props.chapter).width;
    const line = h * 0.05;
    ani.register('rect', 0);
    ani.register('line', -10);
    ani.register('lineOpacity', 1);
    ani.register('rect2', h / 2);
    ani.register('text', window.innerWidth + 10 + textWidth);

    can.width = w;
    can.height = h;
    can.style.width = `${window.innerWidth}px`;
    can.style.height = `${window.innerHeight}px`;
    text.style.left = `${w + 10}px`;
    text.style.top = `${window.innerHeight / 2 - h * 0.025}px`;
    text.style.height = `${h * 0.05}px`;
    text.style.width = `${textWidth}px`;

    let soundPlayed = false;
    let started = false;

    ani.ticker.add(time => {
        if (!has(time) || isNaN(time)) return;
        if (!started) {
            started = true;
            return;
        }

        if (time >= 4050) {
            chapterShowed.value = false;
            ani.ticker.destroy();
        }

        if (!soundPlayed && time >= 1500) {
            soundPlayed = true;
            core.playSound('chapter.mp3');
        }
        ctx.restore();
        ctx.save();
        text.style.left = `${ani.value.text}px`;
        ctx.fillStyle = '#000';
        ctx.clearRect(0, 0, w, h);
        if (time <= 2000) {
            ctx.fillRect(0, h / 2, w, -ani.value.rect);
            ctx.fillRect(0, h / 2, w, ani.value.rect);
        } else if (time >= 2000 && time <= 3050) {
            ctx.fillRect(0, 0, w, ani.value.rect2);
            ctx.fillRect(0, h, w, -ani.value.rect2);
        }
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = ani.value.lineOpacity;
        ctx.beginPath();
        ctx.moveTo(0, h / 2 - line);
        ctx.lineTo(ani.value.line, h / 2 - line);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w, h / 2 + line);
        ctx.lineTo(w - ani.value.line, h / 2 + line);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.filter = 'blur(5px)';
        ctx.beginPath();
        ctx.arc(ani.value.line, h / 2 - line, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w - ani.value.line, h / 2 + line, 10, 0, Math.PI * 2);
        ctx.fill();
    });

    ani.mode(hyper('tan', 'center'))
        .time(3000)
        .absolute()
        .apply('line', w + 10)
        .mode(hyper('sin', 'out'))
        .time(1000)
        .apply('rect', h / 2)
        .mode(hyper('tan', 'center'))
        .time(3000)
        .apply('text', -textWidth * 2 - 10);

    await sleep(2000);
    ani.mode(hyper('sin', 'in')).time(1000).apply('rect2', 0);
    await sleep(1000);
    ani.mode(hyper('sin', 'out')).time(1000).apply('lineOpacity', 0);
});
</script>

<style lang="less" scoped>
#chapter {
    width: 100vw;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    user-select: none;
}

#chapter-back {
    width: 100%;
    height: 100%;
}

#chapter-text {
    position: fixed;
    font-family: 'scroll';
    font-size: 5vh;
    text-shadow: 0px 0px 5px #fff;
}
</style>
