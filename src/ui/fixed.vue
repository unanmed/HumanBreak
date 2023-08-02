<template>
    <div id="fixed">
        <Transition>
            <Box
                v-if="showFixed"
                v-model:height="height"
                v-model:left="left"
                v-model:top="top"
                v-model:width="width"
            >
                <div id="enemy-fixed">
                    <span id="enemy-name">{{ enemy.enemy.enemy.name }}</span>
                    <div id="enemy-special">
                        <span
                            v-for="(text, i) of enemy.showSpecial"
                            :style="{ color: text[2] }"
                            >{{ text[0] }}</span
                        >
                    </div>
                    <div class="enemy-attr" v-for="(a, i) of toShowAttrs">
                        <span class="attr-name" :style="{ color: a[2] }">{{
                            a[1]
                        }}</span>
                        <span class="attr-value" :style="{ color: a[2] }">{{
                            format(a[0])
                        }}</span>
                    </div>
                </div>
            </Box>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import { ComputedRef, computed, onMounted, onUpdated, ref, watch } from 'vue';
import Box from '../components/box.vue';
import { showFixed } from '../plugin/ui/fixed';
import { ToShowEnemy, detailInfo } from '../plugin/ui/book';

watch(showFixed, n => {
    if (n) calHeight();
});

let main: HTMLDivElement;

const format = core.formatBigNumber;
const enemy = ref(detailInfo.enemy!);

const toShowAttrs: ComputedRef<[number | string, string, string][]> = computed(
    () => [
        [enemy.value.enemy.info.hp, '生命', 'lightgreen'],
        [enemy.value.enemy.info.atk, '攻击', 'lightcoral'],
        [enemy.value.enemy.info.def, '防御', 'lightblue'],
        [enemy.value.enemy.enemy.money, '金币', 'lightyellow'],
        [enemy.value.enemy.enemy.exp, '经验', 'lawgreen'],
        [enemy.value.critical, '临界', 'lightsalmon'],
        [enemy.value.criticalDam, '减伤', 'lightpink'],
        [enemy.value.defDam, `${core.status.thisMap?.ratio ?? 1}防`, 'cyan']
    ]
);

const left = ref(0);
const top = ref(0);
const width = ref(300);
const height = ref(400);
let vh = window.innerHeight;
let vw = window.innerWidth;

async function calHeight() {
    enemy.value = detailInfo.enemy!;
    vh = window.innerHeight;
    vw = window.innerWidth;
    width.value = vh * 0.28;
    await new Promise(res => requestAnimationFrame(res));
    if (ancTe.plugin.ui.fixedDetailOpened.value) {
        showFixed.value = false;
    }
    updateMain();
    if (!main) return;
    const style = getComputedStyle(main);
    const h = parseFloat(style.height);
    const [cx, cy] = flags.clientLoc;
    if (cy + h + 10 > vh - 10) top.value = vh - h - 10;
    else top.value = cy + 10;
    if (cx + width.value + 10 > vw - 10) left.value = vw - width.value - 10;
    else left.value = cx + 10;
    height.value = h;
}

function updateMain() {
    main = document.getElementById('enemy-fixed') as HTMLDivElement;
    if (main) {
        main.addEventListener('mouseleave', () => {
            showFixed.value = false;
        });
    }
}

onUpdated(calHeight);

onMounted(() => {
    updateMain();
    calHeight();
});
</script>

<style lang="less" scoped>
#fixed {
    font-family: 'normal';
    font-size: 2.5vh;
}

.v-enter-active,
.v-leave-active {
    transition: opacity 0.2s linear;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}

#enemy-fixed {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #000c;
    padding: 1vh;
}

#enemy-special {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
}

.enemy-attr {
    display: flex;
    flex-direction: row;
    width: 100%;
}

.attr-name {
    flex-basis: 50%;
    width: 100%;
    text-align: right;
    padding-right: 5%;
}

.attr-value {
    flex-basis: 50%;
    padding-left: 5%;
}
</style>
