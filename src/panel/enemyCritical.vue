<template>
    <div id="critical-main">
        <div id="critical">
            <div class="des">加攻伤害</div>
            <canvas ref="critical" class="chart"></canvas>
            <div class="slider-div">
                <span>加攻数值&nbsp;&nbsp;&nbsp;&nbsp;{{ addAtk }}</span>
                <a-slider
                    class="slider"
                    v-model:value="addAtk"
                    :max="(originCri.at(-1)?.[0] ?? 2) - 1"
                ></a-slider>
                <span
                    >最大值&nbsp;&nbsp;&nbsp;&nbsp;{{
                        (originCri.at(-1)?.[0] ?? 2) - 1
                    }}</span
                >
            </div>
        </div>
        <a-divider
            dashed
            style="width: 100%; border-color: #ddd4; margin: 1vh 0 1vh 0"
        ></a-divider>
        <div id="def">
            <div class="des">加防伤害</div>
            <canvas ref="def" class="chart"></canvas>
            <div class="slider-div">
                <span>加防数值&nbsp;&nbsp;&nbsp;&nbsp;{{ addDef }}</span>
                <a-slider
                    class="slider"
                    v-model:value="addDef"
                    :max="(originDef.at(-1)?.[0] ?? 2) - 1"
                ></a-slider>
                <span
                    >最大值&nbsp;&nbsp;&nbsp;&nbsp;{{
                        (originDef.at(-1)?.[0] ?? 2) - 1
                    }}</span
                >
            </div>
        </div>
        <div id="now-damage">
            <span
                >当前加攻&nbsp;&nbsp;&nbsp;&nbsp;{{
                    format(addAtk * ratio)
                }}</span
            >
            <span
                >当前加防&nbsp;&nbsp;&nbsp;&nbsp;{{
                    format(addDef * ratio)
                }}</span
            >
            <span
                >当前减伤&nbsp;&nbsp;&nbsp;&nbsp;{{
                    format(nowDamage[0], false, nowDamage[0] < 0)
                }}</span
            >
            <span
                >当前伤害&nbsp;&nbsp;&nbsp;&nbsp;{{
                    format(nowDamage[1])
                }}</span
            >
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { getCriticalDamage, getDefDamage } from '../plugin/book';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { has, setCanvasSize } from '../plugin/utils';

const critical = ref<HTMLCanvasElement>();
const def = ref<HTMLCanvasElement>();

const enemy = core.plugin.bookDetailEnemy;

const originCri = getCriticalDamage(enemy);
const originDef = getDefDamage(enemy);

// 当前数据
const allCri = ref(originCri);
const allDef = ref(originDef);

// 加攻加防数量
const addAtk = ref(0);
const addDef = ref(0);

const originDamage = core.getDamageInfo(enemy);

// 转发core上的内容至当前作用域
const format = core.formatBigNumber;
const ratio = core.status.thisMap.ratio;

const nowDamage = computed(() => {
    const dam = core.getDamageInfo(enemy, {
        atk: core.status.hero.atk + addAtk.value,
        def: core.status.hero.def + addDef.value
    });
    if (!has(dam)) return ['???', '???'];
    if (!has(originDamage)) return [-dam.damage, dam.damage];
    return [originDamage.damage - dam.damage, dam.damage];
});

function generateChart(ele: HTMLCanvasElement, data: [number, number][]) {
    const config: ChartConfiguration = {
        type: 'line',
        data: generateData(data)
    };
    return new Chart(ele, config);
}

function generateData(data: [number, number][]) {
    return {
        datasets: [
            {
                label: '怪物伤害',
                data: data.map(v => v[1])
            }
        ],
        labels: data.map(v => v[0])
    };
}

function update(atk: Chart, def: Chart) {
    allCri.value = getCriticalDamage(enemy, addAtk.value, addDef.value);
    allDef.value = getDefDamage(enemy, addDef.value, addAtk.value);

    atk.data = generateData(allCri.value);
    def.data = generateData(allDef.value);
    atk.update('resize');
    def.update('resize');
}

onMounted(() => {
    const div = document.getElementById('critical-main') as HTMLDivElement;
    const style = getComputedStyle(div);

    const width = parseFloat(style.width);
    const height = window.innerHeight / 5;
    const c = critical.value!;
    const d = def.value!;

    setCanvasSize(c, width, height);
    setCanvasSize(d, width, height);

    const criChart = generateChart(c, allCri.value);
    const defChart = generateChart(d, allDef.value);

    watch(addAtk, n => {
        update(criChart, defChart);
    });

    watch(addDef, n => {
        update(criChart, defChart);
    });
});
</script>

<style lang="less" scoped>
#critical-main {
    width: 100%;
    height: 50vh;
    user-select: none;
}

.des {
    width: 100%;
    text-align: center;
    font-size: 2.5vh;
}

.slider-div {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
        font-size: 1.1vw;
        line-height: 1;
    }
}

.slider {
    width: 80%;
}

#now-damage {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    font-size: 3vh;
}
</style>
