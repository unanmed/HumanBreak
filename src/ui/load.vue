<template>
    <div id="load">
        <a-progress
            class="task-progress"
            type="circle"
            :percent="(loading / totalTask) * 100"
            :success="{ percent: (loaded / totalTask) * 100 }"
        >
            <template #format>
                <span>{{ loaded }} / {{ totalTask }}</span>
            </template>
        </a-progress>
        <div class="byte-div">
            <span class="byte-progress-tip"
                >{{ formatSize(loadedByte) }} /
                {{ formatSize(totalByte) }}</span
            >
            <a-progress
                class="byte-progress"
                type="line"
                :percent="loadedPercent"
            ></a-progress>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import {
    loadCompressedResource,
    loadDefaultResource,
    LoadTask
} from '@/core/common/resource';
import { GameUi } from '@/core/main/custom/ui';
import { formatSize } from '@/plugin/utils';
import { logger } from '@/core/common/logger';
import { fixedUi } from '@/core/main/init/ui';
import { sleep } from 'mutate-animate';

const props = defineProps<{
    ui: GameUi;
    num: number;
    callback?: () => void;
}>();

const loading = ref(0);
const loaded = ref(0);
const loadedByte = ref(0);
const loadedPercent = ref(0);
const totalByte = ref(0);
const totalTask = ref(0);

let loadDiv: HTMLDivElement;

onMounted(async () => {
    if (import.meta.env.DEV) loadDefaultResource();
    else await loadCompressedResource();

    LoadTask.onProgress(() => {
        const loadingNum = [...LoadTask.taskList].filter(v => v.loading).length;

        loadedByte.value = LoadTask.loadedByte;
        loadedPercent.value = parseFloat(
            ((LoadTask.loadedByte / LoadTask.totalByte) * 100).toFixed(2)
        );
        loading.value = loadingNum;
        loaded.value = LoadTask.loadedTask;
        totalByte.value = LoadTask.totalByte;
        totalTask.value = LoadTask.totalTask;
    });

    LoadTask.load().then(async () => {
        core.loader._loadMaterials_afterLoad();
        core._afterLoadResources(props.callback);
        logger.log(`Resource load end.`);
        loadDiv.style.opacity = '0';
        Mota.require('var', 'loading').emit('loaded');
        await sleep(1000);
        fixedUi.close(props.num);
        fixedUi.open('start');
    });
    loadDiv = document.getElementById('load') as HTMLDivElement;
});
</script>

<style lang="less" scoped>
#load {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-family: 'Arial';
    transition: opacity 1s linear;
    position: fixed;
    left: 0;
    top: 0;
    background-color: black;
}

.byte-div {
    width: 50%;
    margin-top: 10vh;
}

.byte-progress {
    width: 100%;
}
</style>
