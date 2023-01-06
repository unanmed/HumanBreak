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
                    <span id="enemy-name">{{ enemy.name }}</span>
                    <div id="enemy-special">
                        <span
                            v-for="(text, i) of enemy.toShowSpecial"
                            :style="{color: (enemy.toShowColor[i] as string)} "
                            >{{ text }}</span
                        >
                    </div>
                    <div class="enemy-attr" v-for="(a, i) of toShowAttrs">
                        <span
                            class="attr-name"
                            :style="{ color: attrColor[i] }"
                            >{{ getLabel(a) }}</span
                        >
                        <span
                            class="attr-value"
                            :style="{ color: attrColor[i] }"
                            >{{ enemy[a] }}</span
                        >
                    </div>
                </div>
            </Box>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, ref, watch } from 'vue';
import Box from '../components/box.vue';
import { showFixed } from '../plugin/ui/fixed';

watch(showFixed, calHeight);

let main: HTMLDivElement;

const toShowAttrs: (keyof DetailedEnemy)[] = [
    'hp',
    'atk',
    'def',
    'money',
    'exp',
    'critical',
    'criticalDamage',
    'defDamage'
];
const attrColor = [
    'lightgreen',
    'lightcoral',
    'lightblue',
    'lightyellow',
    'lawngreen',
    'lightsalmon',
    'lightpink',
    'cyan'
];

const enemy = ref(core.plugin.bookDetailEnemy);

const left = ref(0);
const top = ref(0);
const width = ref(300);
const height = ref(400);
let vh = window.innerHeight;
let vw = window.innerWidth;

async function calHeight() {
    enemy.value = core.plugin.bookDetailEnemy;
    vh = window.innerHeight;
    vw = window.innerWidth;
    width.value = vh * 0.28;
    await new Promise(res => requestAnimationFrame(res));
    if (!main) return;
    main = document.getElementById('enemy-fixed') as HTMLDivElement;
    const style = getComputedStyle(main);
    const h = parseFloat(style.height);
    const [cx, cy] = flags.clientLoc;
    if (cy + h + 10 > vh - 10) top.value = vh - h - 10;
    else top.value = cy + 10;
    if (cx + width.value + 10 > vw - 10) left.value = vw - width.value - 10;
    else left.value = cx + 10;
    height.value = h;
}

function getLabel(attr: keyof DetailedEnemy) {
    if (attr === 'critical') return '临界';
    if (attr === 'criticalDamage') return '临界减伤';
    if (attr === 'defDamage') return `${core.status.thisMap.ratio}防`;
    return core.getStatusLabel(attr);
}

onUpdated(calHeight);

onMounted(() => {
    main = document.getElementById('enemy-fixed') as HTMLDivElement;
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
