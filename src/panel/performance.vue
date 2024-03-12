<template>
    <div :id="`performance-${id}`" class="performance-main">
        <div class="frame">
            <div class="frame-title">
                <span>帧率监控</span>
            </div>
            <div :id="`frameDiv-${id}`" class="frame-canvas">
                <canvas :id="`frameCanvas-${id}`"></canvas>
            </div>
            <div class="frame-buttons">
                <a-button @click="toggleFrameMonitor" type="primary">
                    {{ paused ? '继续' : '暂停' }}监控
                </a-button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { mainSetting } from '@/core/main/setting';
import {
    getFrameList,
    isPaused,
    pauseFrame,
    resumeFrame
} from '@/plugin/frame';
import { pColor } from '@/plugin/utils';
import { onMounted, onUnmounted, ref } from 'vue';

const id = (1e8 * Math.random()).toFixed(0);

const list = getFrameList();

let frameDiv: HTMLDivElement;
let frameCanvas: HTMLCanvasElement;
let main: HTMLDivElement;

let mainObserver: ResizeObserver;
let interval = 0;

interface PeriodInfo {
    start: number;
    end: number;
    duration: number;
}

const paused = ref(isPaused());

function toggleFrameMonitor() {
    if (!isPaused()) pauseFrame();
    else resumeFrame();
    paused.value = isPaused();
    drawFrame();
}

function drawFrame() {
    if (!frameCanvas) return;
    const ctx = frameCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
    const length = list.length;
    const per = (frameCanvas.width - 50) / (length - 1);
    const max = Math.max(...list.map(v => v.frame));
    const scaler = [15, 30, 60, 90, 120, 144, 240, 300, 360];
    const prescaler = [3, 3, 6, 6, 6, 6, 5, 5, 6];
    // find sclaer
    let min = 0;
    for (let i = 0; i < scaler.length; i++) {
        if (Math.abs(scaler[i] - max) < Math.abs(scaler[i] - scaler[min])) {
            min = i;
        }
    }
    // draw scaler
    const scalerStep = Math.round(scaler[min] / prescaler[min]);
    const scalerHeight = (frameCanvas.height * 2) / 3 / prescaler[min];
    const bottom = frameCanvas.height - frameCanvas.height / 6;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    ctx.fillStyle = pColor('#ddd8') as string;
    ctx.strokeStyle = pColor('#ddd4') as string;

    for (let i = 0; i < prescaler[min]; i++) {
        ctx.beginPath();
        const y = bottom - scalerHeight * i;
        ctx.fillText((scalerStep * i).toFixed(0), 45, y);
        ctx.moveTo(50, y);
        ctx.lineTo(frameCanvas.width, y);
        ctx.stroke();
    }
    // drawFrame
    const frameHeight = (frameCanvas.height * 2) / 3;
    ctx.strokeStyle = 'rgb(54,162,235)';
    const periodInfo: PeriodInfo[] = [];

    const element = list[0];
    const y = bottom - (element.frame / scaler[min]) * frameHeight;
    const x = 50;
    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 0; i < list.length; i++) {
        const element = list[i];
        const y = bottom - (element.frame / scaler[min]) * frameHeight;
        const x = 50 + i * per;
        ctx.lineTo(x, y);
        if (element.mark === 'low_frame_start') {
            periodInfo.push({
                start: i - 1,
                end: 0,
                duration: 0
            });
        } else if (element.mark === 'low_frame_end') {
            const info = periodInfo.at(-1);
            if (info) {
                info.duration = element.period!;
                info.end = i - 9;
            }
        }
    }
    ctx.stroke();
    // draw period
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.beginPath();
    for (const info of periodInfo) {
        if (info.end === 0) continue;
        const x = 50 + info.start * per;
        const width = (info.end - info.start) * per;
        ctx.fillStyle = pColor('#d446') as string;
        ctx.fillRect(x, 0, width, frameCanvas.height);
        ctx.fillStyle = pColor('#ddda') as string;
        ctx.fillText(
            `${info.duration.toFixed(1)}ms`,
            x + ((info.end - info.start) / 2) * per,
            frameHeight / 3 - 2
        );
    }
}

function resize() {
    const ratio = devicePixelRatio;
    // frame
    frameCanvas.width = frameDiv.clientWidth * ratio;
    frameCanvas.height = frameDiv.clientHeight * ratio;
    frameCanvas.style.width = `${frameDiv.clientWidth}px`;
    frameCanvas.style.height = `${frameDiv.clientHeight}py`;
    drawFrame();
}

function createObserver() {
    const observer = new ResizeObserver(entries => {
        resize();
    });
    observer.observe(main);

    mainObserver = observer;
}

onMounted(() => {
    main = document.getElementById(`performance-${id}`) as HTMLDivElement;
    frameDiv = document.getElementById(`frameDiv-${id}`) as HTMLDivElement;
    frameCanvas = document.getElementById(
        `frameCanvas-${id}`
    ) as HTMLCanvasElement;

    mainSetting.setValue('debug.frame', true);

    createObserver();
    resize();

    interval = window.setInterval(drawFrame, 500);
});

onUnmounted(() => {
    mainObserver.disconnect();
    clearInterval(interval);
});
</script>

<style lang="less" scoped>
.performance-main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    font-size: 100%;
}

.frame {
    width: 100%;
    height: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.frame-title {
    font-size: 150%;
    flex-basis: 10%;
    text-align: center;
}

.frame-canvas {
    flex-basis: 90%;
    width: 100%;
}
</style>
