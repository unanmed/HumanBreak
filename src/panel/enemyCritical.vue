<template>
    <div id="critical-main">
        <div id="critical">
            <div class="des">加攻伤害</div>
            <canvas ref="critical" class="chart"></canvas>
            <div class="slider-div">
                <span>加攻次数&nbsp;&nbsp;&nbsp;&nbsp;{{ addAtk }}</span>
                <a-slider
                    class="slider"
                    v-model:value="addAtk"
                    :max="ceil((originCri.at(-1)?.[0] ?? 2) / ratio) - 1"
                ></a-slider>
                <span
                    >最大值&nbsp;&nbsp;&nbsp;&nbsp;{{
                        ceil((originCri.at(-1)?.[0] ?? 2) / ratio) - 1
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
                <span>加防次数&nbsp;&nbsp;&nbsp;&nbsp;{{ addDef }}</span>
                <a-slider
                    class="slider"
                    v-model:value="addDef"
                    :max="ceil((originDef.at(-1)?.[0] ?? 2) / ratio) - 1"
                ></a-slider>
                <span
                    >最大值&nbsp;&nbsp;&nbsp;&nbsp;{{
                        ceil((originDef.at(-1)?.[0] ?? 2) / ratio) - 1
                    }}</span
                >
            </div>
        </div>
        <div id="now-damage">
            <div>
                <span
                    >当前加攻{{
                        isMobile ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'
                    }}</span
                >
                <span class="changable" :change="addAtkChangable">{{
                    format(addAtk * ratio)
                }}</span>
            </div>
            <div>
                <span
                    >当前加防{{
                        isMobile ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'
                    }}</span
                >
                <span class="changable" :change="addDefChangable">{{
                    format(addDef * ratio)
                }}</span>
            </div>
            <div>
                <span
                    >当前减伤{{
                        isMobile ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'
                    }}</span
                >
                <span class="changable" :change="nowDamageChangable"
                    ><span style="font-family: 'Fira Code'">{{
                        (nowDamage[0] as number) < 0 && !has(enemy.damage)
                            ? '=>'
                            : ''
                    }}</span
                    >{{
                        (nowDamage[0] as number) < 0 && !has(enemy.damage)
                            ? format(-nowDamage[0])
                            : format(nowDamage[0])
                    }}</span
                >
            </div>
            <div>
                <span
                    >当前伤害{{
                        isMobile ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'
                    }}</span
                >
                <span class="changable" :change="nowDamageChangable">{{
                    format(nowDamage[1])
                }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { detailInfo, getCriticalDamage, getDefDamage } from '../plugin/ui/book';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { has, setCanvasSize } from '../plugin/utils';
import { debounce } from 'lodash-es';
import { isMobile } from '../plugin/use';
import { createChangable } from '@/plugin/ui/common';

const props = defineProps<{
    fromBook?: boolean;
}>();

const critical = ref<HTMLCanvasElement>();
const def = ref<HTMLCanvasElement>();

const enemy = detailInfo.enemy!;
const ceil = Math.ceil;

let originCri = getCriticalDamage(enemy, 0, 0);
let originDef = getDefDamage(enemy, 0, 0);

// 当前数据
const allCri = ref(originCri);
const allDef = ref(originDef);

// 加攻加防数量
const addAtk = ref(0);
const addDef = ref(0);
const addAtkChangable = createChangable(addAtk).change;
const addDefChangable = createChangable(addDef).change;

const originDamage = enemy.enemy.calDamage(core.status.hero).damage;

// 转发core上的内容至当前作用域
const format = core.formatBigNumber;
const ratio = core.status.thisMap.ratio;

const nowDamage = computed(() => {
    const dam = enemy.enemy.calDamage({
        atk: core.status.hero.atk + addAtk.value * ratio,
        def: core.status.hero.def + addDef.value * ratio
    }).damage;
    if (!isFinite(dam)) return ['???', '???'];
    if (!isFinite(originDamage)) return [-dam, dam];
    return [originDamage - dam, dam];
});
const nowDamageChangable = createChangable(nowDamage, 1).change;

function generateChart(ele: HTMLCanvasElement, data: [number, number][]) {
    Chart.defaults.color = '#aaa';
    const config: ChartConfiguration = {
        type: 'line',
        data: generateData(data),
        options: {
            elements: {
                point: {
                    radius: 5,
                    hoverRadius: 7
                },
                line: {
                    borderJoinStyle: 'round'
                }
            },
            scales: {
                y: {
                    grid: {
                        color: '#ddd3'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };
    return new Chart(ele, config);
}

/**
 * 生成图表数据
 * @param data 数据
 */
function generateData(data: [number, number][]): ChartConfiguration['data'] {
    return {
        datasets: [
            {
                data: data.map(v => v[1]),
                label: '怪物伤害'
            }
        ],
        labels: data.map(v => Math.round(v[0] / ratio))
    };
}

const update = debounce((atk: Chart, def: Chart) => {
    allCri.value = getCriticalDamage(
        enemy,
        addAtk.value * ratio,
        addDef.value * ratio
    );
    allDef.value = getDefDamage(
        enemy,
        addDef.value * ratio,
        addAtk.value * ratio
    );
    if (allCri.value.length > originCri.length) originCri = allCri.value;
    if (allDef.value.length > originDef.length) originDef = allDef.value;

    atk.data = generateData(allCri.value);
    def.data = generateData(allDef.value);
    atk.update('resize');
    def.update('resize');
}, 200);

onMounted(() => {
    const div = document.getElementById('critical-main') as HTMLDivElement;
    const style = getComputedStyle(div);

    const width = parseFloat(style.width);
    const height = isMobile ? window.innerHeight / 7 : window.innerHeight / 5;
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
    position: absolute;
    top: 20vh;
}

.des {
    width: 100%;
    text-align: center;
    font-size: 140%;
}

.slider-div {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
        font-size: 120%;
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
    font-size: 160%;
}

@media screen and (max-width: 600px) {
    #now-damage {
        font-size: 100%;

        div {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    }

    .slider {
        width: 60%;
    }

    #critical-main {
        position: absolute;
        top: 25vh;
        width: 90vw;
    }

    .slider-div span {
        font-size: 70%;
    }
}
</style>
