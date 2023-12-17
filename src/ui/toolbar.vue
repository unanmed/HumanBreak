<template>
    <Box
        :dragable="true"
        :resizable="true"
        v-model:left="box.x"
        v-model:top="box.y"
        v-model:height="box.height"
        v-model:width="box.width"
    >
        <div class="toolbar">
            <div v-for="item of bar.items">
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
</script>

<style lang="less" scoped>
.toolbar {
    display: flex;
    flex-direction: row;
}
</style>
