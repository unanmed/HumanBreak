<template>
    <div id="fixed-detail">
        <BookDetail
            :from-book="false"
            :default-panel="panel"
            @close="close"
        ></BookDetail>
    </div>
</template>

<script lang="ts" setup>
import { getDetailedEnemy, getLocFromMouseLoc } from '../plugin/ui/fixed';
import BookDetail from './bookDetail.vue';
import { detailInfo } from '../plugin/ui/book';

const panel = core.plugin.fixedDetailPanel ?? 'special';

detailInfo.pos = 0;

const [x, y] = flags.mouseLoc;
const [mx, my] = getLocFromMouseLoc(x, y);
const enemy = core.status.thisMap.enemy.list.find(v => {
    return v.x === mx && v.y === my;
});
if (enemy) {
    const detail = getDetailedEnemy(enemy);
    detailInfo.enemy = detail;
} else {
    close();
}

function close() {
    mota.plugin.ui.fixedDetailOpened.value = false;
}
</script>

<style lang="less" scoped>
#fixed-detail {
    width: 80%;
    height: 100%;
}
</style>
