<template>
    <canvas :id="`minimap-${id}`"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { requireUniqueSymbol } from '../plugin/utils';
import { MinimapDrawer, getArea } from '../plugin/ui/fly';
import { hook } from '@/game/game';
import { useDrag, useWheel } from '@/plugin/use';
import { debounce } from 'lodash-es';
import { mainSetting } from '@/core/main/setting';

const props = defineProps<{
    action?: boolean;
    scale?: number;
    noBorder?: boolean;
    showInfo?: boolean;
    autoLocate?: boolean;
    width?: number;
    height?: number;
}>();

const area = getArea();
const id = requireUniqueSymbol().toFixed(0);
const setting = mainSetting.getSetting('ui.mapLazy')!;

let canvas: HTMLCanvasElement;
let drawer: MinimapDrawer;

function onChange(floor: FloorIds) {
    drawer.nowFloor = floor;
    drawer.nowArea =
        Object.keys(area).find(v => area[v].includes(core.status.floorId)) ??
        '';
    drawer.drawedThumbnail = {};
    if (props.autoLocate) {
        drawer.locateMap(drawer.nowFloor);
    }
    drawer.drawMap();
}

let scale = props.scale ?? 3;

let lastX = 0;
let lastY = 0;

let moved = false;
let startX = 0;
let startY = 0;

let touchScale = false;
let lastDis = 0;

let lastScale = scale;
const changeScale = debounce((s: number) => {
    canvas.style.transform = '';
    drawer.drawedThumbnail = {};
    drawer.scale = s;
    drawer.drawMap();
    lastScale = s;
}, 200);

function resize(delta: number) {
    drawer.ox *= delta;
    drawer.oy *= delta;
    scale = delta * scale;
    changeScale(scale);
    canvas.style.transform = `scale(${scale / lastScale})`;
    drawer.thumbnailLoc = {};
}

function drag(x: number, y: number) {
    if (touchScale) return;
    const dx = x - lastX;
    const dy = y - lastY;
    drawer.ox += dx;
    drawer.oy += dy;
    lastX = x;
    lastY = y;
    drawer.checkMoveThumbnail();
    drawer.drawToTarget();
    if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) moved = true;
}

function touchdown(e: TouchEvent) {
    if (e.touches.length >= 2) {
        touchScale = true;
        lastDis = Math.sqrt(
            (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
                (e.touches[0].clientY - e.touches[1].clientY) ** 2
        );
    }
}

function touchup(e: TouchEvent) {
    if (e.touches.length < 2) touchScale = false;
}

function touchmove(e: TouchEvent) {
    if (!touchScale) return;
    const dis = Math.sqrt(
        (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
            (e.touches[0].clientY - e.touches[1].clientY) ** 2
    );
    resize(dis / lastDis);
    lastDis = dis;
}

function afterBattle() {
    if (!setting.value) {
        requestAnimationFrame(() => {
            drawer.drawedThumbnail = {};
            drawer.drawMap();
        });
    }
}

onMounted(() => {
    const width = props.width ?? 300;
    const height = props.height ?? 300;
    canvas = document.getElementById(`minimap-${id}`) as HTMLCanvasElement;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    drawer = new MinimapDrawer(canvas);

    drawer.scale = props.scale ?? 3;
    drawer.noBorder = props.noBorder ?? false;
    drawer.showInfo = props.showInfo ?? false;

    if (props.autoLocate) {
        drawer.locateMap(drawer.nowFloor);
    }
    drawer.drawMap();

    hook.on('afterChangeFloor', onChange);
    hook.on('afterBattle', afterBattle);

    if (props.action) {
        useDrag(
            canvas,
            drag,
            (x, y) => {
                lastX = x;
                lastY = y;
                startX = x;
                startY = y;
            },
            () => {
                setTimeout(() => {
                    moved = false;
                }, 50);
            },
            true
        );

        useWheel(canvas, (x, y) => {
            const delta = -Math.sign(y) * 0.1 + 1;
            resize(delta);
        });

        canvas.addEventListener('touchstart', touchdown);
        canvas.addEventListener('touchend', touchup);
        canvas.addEventListener('touchmove', touchmove);
    }
});

onUnmounted(() => {
    hook.off('afterChangeFloor', onChange);
    hook.off('afterBattle', afterBattle);
});
</script>

<style lang="less" scoped></style>
