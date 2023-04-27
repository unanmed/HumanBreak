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
                <span>{{ format(addAtk * ratio) }}</span>
            </div>
            <div>
                <span
                    >当前加防{{
                        isMobile ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'
                    }}</span
                >
                <span>{{ format(addDef * ratio) }}</span>
            </div>
            <div>
                <span
                    >当前减伤{{
                        isMobile ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;'
                    }}</span
                >
                <span
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
                <span>{{ format(nowDamage[1]) }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { getCriticalDamage, getDefDamage } from '../plugin/ui/book';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { has, setCanvasSize } from '../plugin/utils';
import { debounce } from 'lodash';
import { isMobile } from '../plugin/use';

const props = defineProps<{
    fromBook?: boolean;
}>();

const critical = ref<HTMLCanvasElement>();
const def = ref<HTMLCanvasElement>();

const enemy = core.plugin.bookDetailEnemy;
const ceil = Math.ceil;

const x = ref(props.fromBook ? void 0 : flags.mouseLoc[0]);
const y = ref(props.fromBook ? void 0 : flags.mouseLoc[1]);
x.value = has(x.value)
    ? Math.round(x.value + core.bigmap.offsetX / 32)
    : void 0;
y.value = has(y.value)
    ? Math.round(y.value + core.bigmap.offsetY / 32)
    : void 0;

let originCri = getCriticalDamage(enemy, 0, 0, x.value, y.value);
let originDef = getDefDamage(enemy, 0, 0, x.value, y.value);

// 当前数据
const allCri = ref(originCri);
const allDef = ref(originDef);

// 加攻加防数量
const addAtk = ref(0);
const addDef = ref(0);

const originDamage = core.getDamageInfo(enemy.id, void 0, x.value, y.value);

// 转发core上的内容至当前作用域
const format = core.formatBigNumber;
const ratio = core.status.thisMap.ratio;

const nowDamage = computed(() => {
    const dam = core.getDamageInfo(
        enemy.id,
        {
            atk: core.getStatus('atk') + addAtk.value * ratio,
            def: core.getStatus('def') + addDef.value * ratio
        },
        x.value,
        y.value
    );
    if (!has(dam)) return ['???', '???'];
    if (!has(originDamage)) return [-dam.damage, dam.damage];
    return [originDamage.damage - dam.damage, dam.damage];
});

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
        addDef.value * ratio,
        x.value,
        y.value
    );
    allDef.value = getDefDamage(
        enemy,
        addDef.value * ratio,
        addAtk.value * ratio,
        x.value,
        y.value
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
    position: absolute;
    top: 20vh;
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

@media screen and (max-width: 600px) {
    #now-damage {
        font-size: 3vw;

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
        font-size: 1.5vh;
    }
}
</style>
