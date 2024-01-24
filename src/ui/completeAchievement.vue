<template>
    <Box id="complete-box">
        <div id="complete">
            <span>完成成就&nbsp;&nbsp;&nbsp;&nbsp;{{ achi.name }}</span>
            <a-progress
                id="progress"
                :percent="progress * 100"
                :strokeColor="{
                    '0%': '#108ee9',
                    '100%': '#87d068'
                }"
                :strokeWidth="height / 200"
                :showInfo="false"
            ></a-progress>
            <span id="point-number">成就点: {{ now }} / {{ totalPoint }}</span>
        </div>
    </Box>
</template>

<script lang="ts" setup>
import { sleep, Ticker } from 'mutate-animate';
import { computed, onMounted, ref } from 'vue';
import Box from '../components/box.vue';
import list from '../data/achievement.json';
import {
    AchievementType,
    getNowPoint,
    totalPoint
} from '../plugin/ui/achievement';
import { GameUi } from '@/core/main/custom/ui';
import { fixedUi } from '@/core/main/init/ui';

const height = window.innerHeight;

const props = defineProps<{
    num: number;
    ui: GameUi;
    complete: string;
}>();

const c = props.complete.split(',');
const type = c[0] as AchievementType;
const index = parseInt(c[1]);

const achi = list[type][index];
const point = achi.point;

const nowPoint = getNowPoint() - point;
const now = ref(nowPoint);
const progress = computed(() => now.value / totalPoint);

onMounted(async () => {
    await sleep(500);
    const ticker = new Ticker();
    const time = Date.now();
    ticker.add(() => {
        const nowTime = Date.now();
        if (nowTime - time > 1000) {
            now.value = nowPoint + point;
            ticker.destroy();
        }
        const ratio = (nowTime - time) / 1000;
        now.value = Math.floor(nowPoint + point * ratio);
    });
    await sleep(4600);
    fixedUi.close(props.num);
});
</script>

<style lang="less" scoped>
#complete-box {
    width: 30vw;
    height: 13vh;
    left: 35vw;
    position: fixed;
    background-color: #000d;
    animation: ani 5s ease 0s 1 forwards running;
    z-index: 10000;
}

#complete {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    font-family: 'normal';
    font-size: 2.2vh;
    align-items: center;
    justify-content: center;
}

#progress {
    width: 90%;
}

@keyframes ani {
    0% {
        top: -30vh;
    }
    20% {
        top: 4vh;
    }
    80% {
        top: 4vh;
    }
    100% {
        top: -30vh;
    }
}

@media screen and (max-width: 600px) {
    #complete-box {
        width: 90vw;
        left: 5%;
    }
}
</style>
