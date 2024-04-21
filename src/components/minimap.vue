<template>
    <canvas :id="`minimap-${id}`"></canvas>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { requireUniqueSymbol } from '../plugin/utils';
import { MinimapDrawer } from '../plugin/ui/fly';

const props = defineProps<{
    action?: boolean;
    scale?: number;
    noBorder?: boolean;
    showInfo?: boolean;
    autoLocate?: boolean;
}>();

const id = requireUniqueSymbol().toFixed(0);

let canvas: HTMLCanvasElement;
let drawer: MinimapDrawer;

onMounted(() => {
    canvas = document.getElementById(`minimap-${id}`) as HTMLCanvasElement;
    drawer = new MinimapDrawer(canvas);

    drawer.scale = props.scale ?? 3;
    drawer.noBorder = props.noBorder ?? false;
    drawer.showInfo = props.showInfo ?? false;
});
</script>

<style lang="less" scoped></style>
