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
import { getDetailedEnemy } from '../plugin/ui/fixed';
import BookDetail from './bookDetail.vue';
import { detailInfo } from '../plugin/ui/book';
import { hovered } from '@/core/main/init/fixed';
import { GameUi } from '@/core/main/custom/ui';
import { mainUi } from '@/core/main/init/ui';

const props = defineProps<{
    num: number;
    ui: GameUi;
    panel?: 'special' | 'critical' | 'target';
}>();

const panel = props.panel ?? 'special';

detailInfo.pos = 0;

if (hovered) {
    const { x, y } = hovered;
    const enemy = core.status.thisMap.enemy.get(x, y);
    if (enemy) {
        const detail = getDetailedEnemy(enemy);
        detailInfo.enemy = detail;
    } else {
        close();
    }
} else {
    close();
}

function close() {
    mainUi.close(props.num);
}
</script>

<style lang="less" scoped>
#fixed-detail {
    width: 80%;
    height: 100%;
}
</style>
