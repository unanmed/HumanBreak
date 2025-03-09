<template>
    <div :id="`box-${id}`" class="box">
        <div :id="`box-main-${id}`" class="box-main" @click="click">
            <slot></slot>
        </div>
        <div
            v-if="dragable"
            :id="`box-move-${id}`"
            class="box-move"
            :selected="moveSelected"
        >
            <drag-outlined :id="`box-drag-${id}`" class="box-drag" />
        </div>
        <div
            v-if="resizable"
            :id="`box-size-${id}`"
            class="box-size"
            :selected="moveSelected"
        >
            <ArrowsAltOutlined :id="`box-resize-${id}`" class="box-resize" />
        </div>
        <div
            class="border border-vertical border-left"
            :id="`border-left-${id}`"
            :selected="moveSelected && resizable"
            :selectable="resizable"
        ></div>
        <div
            class="border border-horizontal border-top"
            :id="`border-top-${id}`"
            :selected="moveSelected && resizable"
            :selectable="resizable"
        ></div>
        <div
            class="border border-vertical border-right"
            :id="`border-right-${id}`"
            :selected="moveSelected && resizable"
            :selectable="resizable"
        ></div>
        <div
            class="border border-horizontal border-bottom"
            :id="`border-bottom-${id}`"
            :selected="moveSelected && resizable"
            :selectable="resizable"
        ></div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import { ArrowsAltOutlined, DragOutlined } from '@ant-design/icons-vue';
import {
    isMobile,
    useDrag,
    cancelGlobalDrag,
    requireUniqueSymbol
} from '../use';
import { isNil } from 'lodash-es';

// todo: 重写

const props = defineProps<{
    dragable?: boolean;
    resizable?: boolean;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
}>();

const emits = defineEmits<{
    (e: 'update:left', data: number): void;
    (e: 'update:top', data: number): void;
    (e: 'update:width', data: number): void;
    (e: 'update:height', data: number): void;
}>();

const id = requireUniqueSymbol().toFixed(0);

const moveSelected = ref(false);
let moveTimeout = 0;
let main: HTMLDivElement;
let leftB: HTMLDivElement;
let rightB: HTMLDivElement;
let topB: HTMLDivElement;
let bottomB: HTMLDivElement;
let drag: HTMLElement;
let size: HTMLElement;

const width = ref(
    isMobile ? window.innerWidth - 100 : window.innerHeight * 0.175
);
const height = ref(isMobile ? 250 : window.innerHeight - 100);
const left = ref(isMobile ? 30 : 50);
const top = ref(isMobile ? 30 : 50);

watch(left, n => emits('update:left', n));
watch(top, n => emits('update:top', n));
watch(width, n => emits('update:width', n));
watch(height, n => emits('update:height', n));

async function click() {
    moveSelected.value = true;
    moveTimeout = window.setTimeout(() => {
        moveSelected.value = false;
    }, 4000);
}

let lastX = 0;
let lastY = 0;

function clampX(x: number) {
    if (x < 16) x = 16;
    const mx = window.innerWidth - 16 - width.value;
    if (x > mx) x = mx;
    return x;
}

function clampY(y: number) {
    if (y < 16) y = 16;
    const my = window.innerHeight - 16 - height.value;
    if (y > my) y = my;
    return y;
}

function clampPos(x: number, y: number) {
    return { x: clampX(x), y: clampY(y) };
}

function clampWidth(w: number) {
    if (w < 16) w = 16;
    const mw = window.innerWidth - 16 - left.value;
    if (w > mw) w = mw;
    return w;
}

function clampHeight(h: number) {
    if (h < 16) h = 16;
    const mh = window.innerHeight - 16 - top.value;
    if (h > mh) h = mh;
    return h;
}

function clampSize(w: number, h: number) {
    return { w: clampWidth(w), h: clampHeight(h) };
}

function dragFn(x: number, y: number) {
    const { x: tx, y: ty } = clampPos(x + 8, y + 8);
    left.value = tx;
    top.value = ty;
    main.style.left = `${tx}px`;
    main.style.top = `${ty}px`;
    clearTimeout(moveTimeout);
    lastX = x;
    lastY = y;
}

let right = left.value + width.value;
function leftDrag(x: number, y: number) {
    const tx = clampX(x);
    main.style.left = `${tx}px`;
    width.value = right - tx;
    left.value = tx;
    main.style.width = `${width.value}px`;
}

let bottom = top.value + height.value;
function topDrag(x: number, y: number) {
    const ty = clampY(y);
    main.style.top = `${ty}px`;
    height.value = bottom - ty;
    top.value = ty;
    main.style.height = `${height.value}px`;
}

function rightDrag(x: number, y: number) {
    const w = clampWidth(x - main.offsetLeft);
    width.value = w;
    main.style.width = `${w}px`;
}

function bottomDrag(x: number, y: number) {
    const h = clampHeight(y - main.offsetTop);
    height.value = h;
    main.style.height = `${h}px`;
}

function resizeBox(x: number, y: number) {
    const { w, h } = clampSize(x - main.offsetLeft - 8, y - main.offsetTop - 8);
    width.value = w;
    height.value = h;
    main.style.width = `${w}px`;
    main.style.height = `${h}px`;
}

function resize() {
    main = document.getElementById(`box-${id}`) as HTMLDivElement;
    leftB = document.getElementById(`border-left-${id}`) as HTMLDivElement;
    topB = document.getElementById(`border-top-${id}`) as HTMLDivElement;
    rightB = document.getElementById(`border-right-${id}`) as HTMLDivElement;
    bottomB = document.getElementById(`border-bottom-${id}`) as HTMLDivElement;
    drag = document.getElementById(`box-drag-${id}`) as HTMLElement;
    size = document.getElementById(`box-resize-${id}`) as HTMLElement;

    if (!main) return;

    if (!isNil(props.width)) width.value = props.width;
    if (!isNil(props.height)) height.value = props.height;
    if (!isNil(props.left)) left.value = props.left;
    if (!isNil(props.top)) top.value = props.top;

    const beforeWidth = width.value;
    const beforeHeight = height.value;
    width.value = 16;
    height.value = 16;

    left.value = clampX(left.value);
    top.value = clampY(top.value);
    main.style.left = `${left.value}px`;
    main.style.top = `${top.value}px`;

    width.value = clampWidth(beforeWidth);
    height.value = clampHeight(beforeHeight);
    main.style.width = `${width.value}px`;
    main.style.height = `${height.value}px`;
}

onUpdated(resize);

onMounted(async () => {
    resize();

    if (!main) return;

    if (props.dragable) {
        useDrag(
            drag,
            dragFn,
            (x, y) => {
                lastX = x;
                lastY = y;
            },
            () => {
                moveSelected.value = false;
            },
            true
        );
    }

    if (props.resizable) {
        useDrag(
            leftB,
            leftDrag,
            (x, y) => {
                right = left.value + width.value;
            },
            void 0,
            true
        );

        useDrag(
            topB,
            topDrag,
            (x, y) => {
                bottom = top.value + height.value;
            },
            void 0,
            true
        );

        useDrag(rightB, rightDrag, void 0, void 0, true);
        useDrag(bottomB, bottomDrag, void 0, void 0, true);
        useDrag(size, resizeBox, void 0, void 0, true);
    }
    window.addEventListener('resize', resize);
});

onUnmounted(() => {
    window.removeEventListener('resize', resize);
    if (props.dragable) cancelGlobalDrag(dragFn);
    if (props.resizable) {
        cancelGlobalDrag(leftDrag);
        cancelGlobalDrag(topDrag);
        cancelGlobalDrag(rightDrag);
        cancelGlobalDrag(bottomDrag);
        cancelGlobalDrag(resizeBox);
    }
});
</script>

<style lang="less" scoped>
.box {
    width: 300px;
    height: calc(100vh - 100px);
    position: fixed;
    left: 50px;
    top: 50px;
    display: flex;
    overflow: visible;
}

.box-main {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.box-move {
    transition: font-size 0.3s ease-out;
    position: absolute;
    left: -32px;
    top: -32px;
    width: 32px;
    height: 32px;
}

.box-size {
    transition: font-size 0.3s ease-out;
    position: absolute;
    left: 100%;
    top: 100%;
}

.box-drag {
    cursor: all-scroll;
    user-select: none;
    right: 0;
    bottom: 0;
    position: absolute;
}

.box-resize {
    left: 0;
    top: 0;
    position: absolute;
    transform: rotateX(180deg);
    user-select: none;
    cursor: nwse-resize;
}

.box-move[selected='false'],
.box-size[selected='false'] {
    font-size: 16px;
}

.box-move[selected='true'],
.box-size[selected='true'] {
    font-size: 32px;
}

.border {
    margin: 0;
    position: absolute;
    transition: transform 0.3s ease-out;
}

.border-horizontal {
    width: 100%;
    height: 0px;
    left: 0px;
}

.border-horizontal[selected='true'][selectable='true'] {
    transform: scaleY(300%);
    cursor: ns-resize;
}

.border-horizontal:hover[selectable='true'],
.border-horizontal:active[selectable='true'] {
    transform: scaleY(500%);
    cursor: ns-resize;
}

.border-vertical {
    width: 0px;
    height: 100%;
    top: 0px;
}

.border-vertical[selected='true'][selectable='true'] {
    transform: scaleX(300%);
    cursor: ew-resize;
}

.border-vertical:hover[selectable='true'],
.border-vertical:active[selectable='true'] {
    transform: scaleX(500%);
    cursor: ew-resize;
}

.border-left {
    left: 0;
    border-left: 2px solid #ddd9;
}

.border-right {
    right: 0;
    border-right: 2px solid #ddd9;
}

.border-top {
    top: 0;
    border-top: 2px solid #ddd9;
}

.border-bottom {
    bottom: 0;
    border-bottom: 2px solid #ddd9;
}

@media screen and (max-width: 600px) {
    .box {
        width: calc(100vw - 100px);
        height: 250px;
    }
}
</style>
