<template>
    <Box
        class="toolbar-container"
        :dragable="true"
        :resizable="true"
        v-model:left="box.x"
        v-model:top="box.y"
        v-model:height="box.height"
        v-model:width="box.width"
    >
        <div class="toolbar">
            <div
                class="toolbar-item"
                v-for="item of bar.items"
                @click.stop="click"
            >
                <component
                    :is="(item.com as any)"
                    :item="item"
                    :toolbar="bar"
                ></component>
            </div>
        </div>
    </Box>
</template>

<script lang="ts" setup>
import Box from '@/components/box.vue';
import { CustomToolbar } from '@/core/main/custom/toolbar';
import { GameUi } from '@/core/main/custom/ui';
import { reactive, watch } from 'vue';

interface BoxData {
    x: number;
    y: number;
    width: number;
    height: number;
}

const props = defineProps<{
    num: number;
    ui: GameUi;
    bar: CustomToolbar;
}>();

const bar = props.bar;
const box = reactive<BoxData>({
    x: bar.x,
    y: bar.y,
    width: bar.width,
    height: bar.height
});

watch(box, ({ x, y, width, height }) => {
    bar.x = x;
    bar.y = y;
    bar.width = width;
    bar.height = height;
});

function click() {
    // pass
}
</script>

<style lang="less" scoped>
.toolbar-container {
    background-color: #0009;
    padding: 5px;
}

.toolbar {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    font-size: 150%;
}

.toolbar-item {
    display: flex;
    margin: 5px;
    min-width: 50px;
    height: 50px;
    cursor: pointer;
    background-color: #222;
    border: 1.5px solid #ddd8;
    justify-content: center;
    align-items: center;
    transition: all 0.1s linear;
}

.toolbar-item::v-deep(> *) {
    height: 100%;
    min-width: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    text-overflow: clip;
    text-wrap: nowrap;
    overflow: hidden;
}

.toolbar-item::v-deep(.button-text)[active='true'] {
    color: gold;
    background-color: #555;
}

.toolbar-item:hover {
    background-color: #444;
}

.toolbar-item:active {
    background-color: #333;
}
</style>
