<template>
    <div class="colomn">
        <div class="tools">
            <span class="button-text" @click="emits('close')"
                ><left-outlined /> 返回</span
            >
        </div>
        <div class="column-main" :id="`column-${id}`">
            <Scroll class="column-left" :id="`column-left-${id}`">
                <slot name="left"></slot>
            </Scroll>
            <a-divider
                class="divider"
                dashed
                style="border-color: #ddd4"
                :type="isMobile ? 'horizontal' : 'vertical'"
            ></a-divider>
            <Scroll class="column-right" :id="`column-right-${id}`"
                ><slot name="right"></slot
            ></Scroll>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, onUpdated, ref } from 'vue';
import { LeftOutlined } from '@ant-design/icons-vue';
import Scroll from './scroll.vue';
import { isMobile } from '../plugin/use';
import { has } from '../plugin/utils';

const emits = defineEmits<{
    (e: 'close'): void;
}>();

const props = defineProps<{
    width?: number;
    height?: number;
    left?: number;
    right?: number;
}>();

const id = (1e8 * Math.random()).toFixed(0);

let main: HTMLDivElement;
let left: HTMLDivElement;
let right: HTMLDivElement;

function resize() {
    main = document.getElementById(`column-${id}`) as HTMLDivElement;
    left = document.getElementById(`column-left-${id}`) as HTMLDivElement;
    right = document.getElementById(`column-right-${id}`) as HTMLDivElement;

    if (has(props.width) && !isMobile) main.style.width = `${props.width}%`;
    if (has(props.height)) main.style.height = `${props.height}%`;
    if (has(props.left)) left.style.flexBasis = `${props.left}%`;
    if (has(props.right)) right.style.flexBasis = `${props.right}%`;
}

onMounted(async () => {
    resize();
});
onUpdated(resize);
</script>

<style lang="less" scoped>
.colomn {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 150%;
    user-select: none;
}
.column-main {
    width: 70%;
    height: 70%;
    display: flex;
    flex-direction: row;
}

.column-list {
    display: flex;
    flex-direction: column;
}

.column-item {
    width: 100%;
    padding: 1% 3% 1% 3%;
}

.column-item[selectable='false'] {
    color: gray;
}

.column-left {
    flex-basis: 40%;
    height: 100%;
}

.column-right {
    flex-basis: 60%;
    height: 100%;
}

.divider {
    height: 100%;
}

.tools {
    width: 100%;
    font-size: 3.2vh;
    height: 5vh;
    position: fixed;
    left: 10vw;
    top: 5vh;
}

@media screen and (max-width: 600px) {
    .column-main {
        flex-direction: column;
        width: 90%;
        height: 75%;
        font-size: 80%;
    }

    .divider {
        height: auto;
        width: 100%;
        margin: 5% 0 5% 0;
    }

    .column-left {
        height: 40%;
    }

    .column-right {
        height: 50%;
    }
}
</style>
