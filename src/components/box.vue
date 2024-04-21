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
            <drag-outlined
                :id="`box-drag-${id}`"
                class="box-drag"
                style="right: 0; bottom: 0; position: absolute"
            />
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
import { DragOutlined } from '@ant-design/icons-vue';
import { isMobile, useDrag, cancelGlobalDrag } from '../plugin/use';
import { has, requireUniqueSymbol } from '../plugin/utils';
import { sleep } from 'mutate-animate';

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

const width = ref(
    isMobile ? window.innerWidth - 100 : window.innerWidth * 0.175
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

function dragFn(x: number, y: number) {
    const style = getComputedStyle(main);
    const ox = parseFloat(style.left);
    const oy = parseFloat(style.top);
    left.value = ox + x - lastX;
    top.value = oy + y - lastY;
    main.style.left = `${left.value}px`;
    main.style.top = `${top.value}px`;

    moveSelected.value = true;
    clearTimeout(moveTimeout);
    lastX = x;
    lastY = y;
}

let right = left.value + width.value;
function leftDrag(x: number, y: number) {
    main.style.left = `${x}px`;
    width.value = right - x;
    left.value = x;
    main.style.width = `${width.value}px`;
}

let bottom = top.value + height.value;
function topDrag(x: number, y: number) {
    main.style.top = `${y}px`;
    height.value = bottom - y;
    top.value = y;
    main.style.height = `${height.value}px`;
}

function rightDrag(x: number, y: number) {
    const style = getComputedStyle(main);
    width.value = x - parseFloat(style.left);
    main.style.width = `${width.value}px`;
}

function bottomDrag(x: number, y: number) {
    const style = getComputedStyle(main);
    height.value = y - parseFloat(style.top);
    main.style.height = `${height.value}px`;
}

function resize() {
    main = document.getElementById(`box-${id}`) as HTMLDivElement;
    leftB = document.getElementById(`border-left-${id}`) as HTMLDivElement;
    topB = document.getElementById(`border-top-${id}`) as HTMLDivElement;
    rightB = document.getElementById(`border-right-${id}`) as HTMLDivElement;
    bottomB = document.getElementById(`border-bottom-${id}`) as HTMLDivElement;
    drag = document.getElementById(`box-drag-${id}`) as HTMLElement;

    if (!main) return;

    if (has(props.left)) left.value = props.left;
    if (has(props.top)) top.value = props.top;
    if (has(props.width)) width.value = props.width;
    if (has(props.height)) height.value = props.height;

    main.style.left = `${left.value}px`;
    main.style.top = `${top.value}px`;
    main.style.width = `${width.value}px`;
    main.style.height = `${height.value}px`;
}

onUpdated(resize);

onMounted(async () => {
    await sleep(50);
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
    }
});

onUnmounted(() => {
    if (props.dragable) cancelGlobalDrag(dragFn);
    if (props.resizable) {
        cancelGlobalDrag(leftDrag);
        cancelGlobalDrag(topDrag);
        cancelGlobalDrag(rightDrag);
        cancelGlobalDrag(bottomDrag);
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

.box-drag {
    cursor: all-scroll;
    user-select: none;
}

.box-move[selected='false'] {
    font-size: 8px;
}

.box-move[selected='true'] {
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
