<template>
    <div id="fixed-detail">
        <BookDetail :from-book="false" @close="close"></BookDetail>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getDetailedEnemy } from '../plugin/ui/fixed';
import BookDetail from './bookDetail.vue';

core.plugin.bookDetailPos = 0;

const [x, y] = flags.mouseLoc;
const mx = Math.round(x + core.bigmap.offsetX / 32);
const my = Math.round(y + core.bigmap.offsetY / 32);
const e = core.getBlockId(mx, my);
if (e && core.getClsFromId(e)?.startsWith('enemy')) {
    const enemy = core.material.enemys[e as EnemyIds];
    const detail = getDetailedEnemy(enemy, mx, my);
    core.plugin.bookDetailEnemy = detail;
} else {
    close();
}

function close() {
    core.plugin.fixedDetailOpened.value = false;
}
</script>

<style lang="less" scoped>
#fixed-detail {
    width: 80%;
    height: 100%;
}
</style>
