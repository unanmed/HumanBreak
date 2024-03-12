<template>
    <div class="performance">
        <div class="tools">
            <span class="button-text" @click="exit"
                ><left-outlined />返回游戏</span
            >
        </div>
        <PerformancePanel></PerformancePanel>
    </div>
</template>

<script lang="ts" setup>
import { GameUi } from '@/core/main/custom/ui';
import { mainUi } from '@/core/main/init/ui';
import { LeftOutlined } from '@ant-design/icons-vue';
import PerformancePanel from '../panel/performance.vue';

const props = defineProps<{
    ui: GameUi;
    num: number;
}>();

function exit() {
    mainUi.close(props.num);
}
</script>

<style lang="less" scoped>
.performance {
    width: 100%;
    height: 100%;
}

.tools {
    height: 6%;
    font-size: 3.2vh;
}
</style>
