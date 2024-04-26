<template>
    <div id="fixed">
        <Box
            v-model:height="height"
            v-model:left="left"
            v-model:top="top"
            v-model:width="width"
        >
            <div id="enemy-fixed">
                <span id="enemy-name">{{ enemy.enemy.name }}</span>
                <div id="enemy-special">
                    <span
                        v-for="(text, i) of special"
                        :style="{ color: text[1] }"
                        >{{ text[0] }}</span
                    >
                </div>
                <div class="enemy-attr" v-for="(a, i) of detail">
                    <span class="attr-name" :style="{ color: a[2] }">{{
                        a[1]
                    }}</span>
                    <span class="attr-value" :style="{ color: a[2] }">{{
                        format(a[0])
                    }}</span>
                </div>
            </div>
        </Box>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, ref, watch } from 'vue';
import Box from '../components/box.vue';
import { GameUi } from '@/core/main/custom/ui';
import type { DamageEnemy, EnemyInfo } from '@/game/enemy/damage';
import { nextFrame } from '@/plugin/utils';

const props = defineProps<{
    num: number;
    ui: GameUi;
    enemy: DamageEnemy;
    close: Ref<boolean>;
    loc: [x: number, y: number];
}>();
const emits = defineEmits<{
    (e: 'close'): void;
}>();

watch(props.close, n => {
    if (n) {
        fixed.style.opacity = '0';
    }
});

let main: HTMLDivElement;
let fixed: HTMLDivElement;

const format = core.formatBigNumber;
const enemy = props.enemy;
const detail = ((): [number, string, string][] => {
    const info = enemy.info;
    const data = enemy.calCritical()[0];
    const ratio = core.status.thisMap?.ratio ?? 1;
    return [
        [info.hp, '生命', 'lightgreen'],
        [info.atk, '攻击', 'lightcoral'],
        [info.def, '防御', 'lightblue'],
        [enemy.enemy.money, '金币', 'lightyellow'],
        [enemy.enemy.exp, '经验', 'lawgreen'],
        [data?.atkDelta ?? 0, '临界', 'lightsalmon'],
        [data?.delta ?? 0, '临界减伤', 'lightpink'],
        [enemy.calDefDamage(ratio).delta, `${ratio}防`, 'cyan']
    ];
})();
const special = (() => {
    const s = enemy.info.special;

    const fromFunc = (
        func: string | ((enemy: EnemyInfo) => string),
        enemy: EnemyInfo
    ) => {
        return typeof func === 'string' ? func : func(enemy);
    };

    const show = s.slice(0, 2).map(v => {
        const s = Mota.require('var', 'enemySpecials')[v];
        return [fromFunc(s.name, enemy.info), s.color];
    });
    if (s.length > 2) show.push(['...', 'white']);
    return show;
})();

const left = ref(0);
const top = ref(0);
const width = ref(300);
const height = ref(400);
let vh = window.innerHeight;
let vw = window.innerWidth;

async function calHeight() {
    vh = window.innerHeight;
    vw = window.innerWidth;
    width.value = vh * 0.28;
    await new Promise(res => requestAnimationFrame(res));
    updateMain();
    if (!main) return;
    const style = getComputedStyle(main);
    const h = parseFloat(style.height);
    const [cx, cy] = props.loc;
    if (cy + h + 10 > vh - 10) top.value = vh - h - 10;
    else top.value = cy + 10;
    if (cx + width.value + 10 > vw - 10) left.value = vw - width.value - 10;
    else left.value = cx + 10;
    height.value = h;
}

function updateMain() {
    main = document.getElementById('enemy-fixed') as HTMLDivElement;
    fixed = document.getElementById('fixed') as HTMLDivElement;
    if (main) {
        main.addEventListener('mouseleave', () => emits('close'));
    }
    nextFrame(() => {
        fixed.style.opacity = '1';
    });
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
    opacity: 0;
    transition: opacity 0.2s linear;
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
