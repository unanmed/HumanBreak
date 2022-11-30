<template>
    <div id="equipbox">
        <div id="tools">
            <span class="button-text tools" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
            <span class="button-text tools">道具栏 <right-outlined /></span>
        </div>
        <div id="equipbox-main">
            <div id="equip-list">
                <div id="filter">
                    <a-select v-model:value="norm" class="select">
                        <a-select-option v-for="t of normList" :value="t">{{
                            t === 'none' ? '所有' : label(t)
                        }}</a-select-option>
                    </a-select>
                    <a-divider type="vertical" class="divider"></a-divider>
                    <a-select v-model:value="sType" class="select">
                        <a-select-option value="value">数值</a-select-option>
                        <a-select-option value="percentage"
                            >百分比</a-select-option
                        >
                    </a-select>
                    <a-divider type="vertical" class="divider"></a-divider>
                    <span
                        @click="changeSort()"
                        class="button-text"
                        id="sort-type"
                    >
                        <span v-if="sort === 'down'">
                            <sort-ascending-outlined />
                        </span>
                        <span v-else><sort-descending-outlined /></span>
                    </span>
                </div>
                <a-divider
                    dashed
                    style="border-color: #ddd4; margin: 1vh 0 1vh 0"
                ></a-divider>
                <Scroll :width="10" id="equip-scroll"
                    ><div
                        class="equip selectable"
                        v-for="([id, num], i) of toShow"
                        :selected="selected === i"
                        @mousedown="selected = i"
                        @touchstart="selected = i"
                    >
                        <div class="equip-icon">
                            <BoxAnimate
                                :id="id ?? 'none'"
                                :width="32"
                                :height="32"
                                :noborder="true"
                            ></BoxAnimate>
                            <span class="equip-name">{{ all[id].name }}</span>
                        </div>
                        <span>×&nbsp;{{ num }}</span>
                    </div></Scroll
                >
            </div>
            <div id="equip-status">
                <a-divider
                    class="divider"
                    :type="isMobile ? 'horizontal' : 'vertical'"
                    dashed
                    style="border-color: #ddd4"
                ></a-divider>
                <div id="equip-status-main">
                    <div id="equip-now">
                        <Scroll
                            style="width: 100%; height: 30vh"
                            :type="isMobile ? 'horizontal' : 'vertical'"
                        >
                            <div id="equip-now-div">
                                <div
                                    v-for="(name, i) of equipCol"
                                    class="equip-now-one"
                                >
                                    <BoxAnimate
                                        :id="equiped[i] ?? 'none'"
                                    ></BoxAnimate>
                                    <span>{{ name }}</span>
                                </div>
                            </div>
                        </Scroll>
                    </div>
                    <a-divider
                        dashed
                        style="border-color: #ddd4; margin: 1vh 0 1vh 0"
                    ></a-divider>
                    <div id="equip-hero" v-if="!isMobile">
                        <div id="hero-icon">
                            <BoxAnimate
                                id="hero"
                                :width="48"
                                :height="64"
                                noborder
                            ></BoxAnimate>
                        </div>
                        <div id="hero-status">
                            <component :is="nowStatus"></component>
                        </div>
                    </div>
                </div>
                <a-divider
                    v-if="!isMobile"
                    class="divider"
                    type="vertical"
                    dashed
                    style="border-color: #ddd4"
                ></a-divider>
            </div>
            <div id="equip-desc">
                <div id="equip-icon">
                    <BoxAnimate :id="toShow[selected]?.[0]"></BoxAnimate>
                    <span>{{ equip.name }}</span>
                </div>
                <div id="equip-type">
                    <span>装备孔：{{ equip.equip?.type }}</span>
                </div>
                <a-divider
                    dashed
                    style="border-color: #ddd4; margin: 1vh 0 1vh 0"
                ></a-divider>
                <div id="equip-add">
                    <span style="font-size: 3vh" id="title">增减属性</span>
                    <Scroll style="width: 100%; height: 100%">
                        <component :is="addStatus"></component>
                    </Scroll>
                </div>
                <a-divider
                    dashed
                    style="border-color: #ddd4; margin: 1vh 0 1vh 0"
                ></a-divider>
                <div id="equip-desc-text">
                    <span style="font-size: 3vh" id="title">装备介绍</span>
                    <Scroll id="desc-text" style="height: 100%; width: 100%">
                        <div v-if="!descText.value.startsWith('!!html')">
                            {{ descText.value }}
                        </div>
                        <div v-else v-html="descText.value.slice(6)"></div>
                    </Scroll>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    LeftOutlined,
    RightOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined
} from '@ant-design/icons-vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Scroll from '../components/scroll.vue';
import { getAddStatus, getEquips, getNowStatus } from '../plugin/ui/equipbox';
import BoxAnimate from '../components/boxAnimate.vue';
import { has, type } from '../plugin/utils';
import { cancelGlobalDrag, isMobile, useDrag } from '../plugin/use';
import { hyper } from 'mutate-animate';

const equips = getEquips();
const col = ref('all');
const all = core.material.items;
const selected = ref(0);
const equipCol = core.status.globalAttribute.equipName;
const equiped = core.status.hero.equipment;

const draged = ref(false);

/** 排序方式，down表示下面大上面小 */
const sort = ref<'up' | 'down'>('down');
const norm = ref('none');
const sType = ref<'value' | 'percentage'>('value');

// 攻击 防御 回血 额外攻击
const normList = ['none', 'atk', 'def', 'hpmax', 'mana'];

const label = core.getStatusLabel;

watch(sort, n => {
    selected.value = toShow.value.length - selected.value - 1;
});

watch(norm, n => {
    selected.value = 0;
});

watch(sType, n => {
    selected.value = 0;
});

/**
 * 当前装备
 */
const equip = computed(() => {
    const index = toShow.value[selected.value];
    if (!has(index))
        return {
            name: '没有选择装备',
            cls: 'equip',
            text: '没有选择装备',
            equip: { type: '无', value: {}, percentage: {}, animate: '' }
        };
    return all[index[0]];
});

const addStatus = computed(() => {
    return getAddStatus(equip.value.equip!);
});

const descText = computed(() => {
    if (equip.value.text.startsWith('!!html')) return ref(equip.value.text);
    return type(equip.value.text, 25, hyper('sin', 'out'), true);
});

const nowStatus = computed(() => {
    return getNowStatus(equip.value.equip);
});

/**
 * 需要展示的装备，需要排序等操作
 */
const toShow = computed(() => {
    const sortType = sort.value;
    const sortNorm = norm.value;
    const sortBy = sType.value;

    const res = equips.filter(v => {
        const e = all[v[0]].equip!;
        const t = e.type;
        if (sortNorm !== 'none') {
            if (!has(e[sortBy][sortNorm])) return false;
        }
        if (col.value === 'all') return true;
        if (typeof t === 'string') return t === col.value;
        else return core.status.globalAttribute.equipName[t] === col.value;
    });
    if (sortNorm === 'none') return res;
    else {
        if (sortType === 'down') {
            return res.sort((a, b) => {
                const ea = all[a[0]].equip!;
                const eb = all[b[0]].equip!;
                return ea[sortBy][sortNorm] - eb[sortBy][sortNorm];
            });
        } else {
            return res.sort((a, b) => {
                const ea = all[a[0]].equip!;
                const eb = all[b[0]].equip!;
                return eb[sortBy][sortNorm] - ea[sortBy][sortNorm];
            });
        }
    }
});

function changeSort() {
    if (sort.value === 'down') {
        sort.value = 'up';
    } else {
        sort.value = 'down';
    }
}

function exit() {
    core.plugin.equipOpened.value = false;
}

// ----- 交互函数
let [fx, fy] = [0, 0];
function dragEquip(x: number, y: number) {
    if ((x - fx) ** 2 + (y - fy) ** 2 > 10 ** 2) {
        draged.value = true;
    }
}

onMounted(() => {
    const equips = Array.from(
        document.querySelectorAll('.equip')
    ) as HTMLDivElement[];

    // 绑定武器拖拽事件，使武器可以拖拽穿脱
    useDrag(
        equips,
        dragEquip,
        (x, y) => {
            fx = x;
            fy = y;
        },
        void 0,
        true
    );
});

onUnmounted(() => {
    cancelGlobalDrag(dragEquip);
});
</script>

<style lang="less" scoped>
#equipbox {
    width: 100%;
    height: 100%;
    user-select: none;
}

#tools {
    width: 100%;
    display: flex;
    flex-direction: row;
    font-size: 2em;
    height: 5vh;
    justify-content: space-between;
    font-family: 'normal';

    .tools {
        white-space: nowrap;
    }
}

#equipbox-main {
    height: 85vh;
    width: 100%;
    display: flex;
    flex-direction: row;
    font-family: 'normal';
    font-size: 2.5vh;
}

.divider {
    height: 100%;
}

#equip-list {
    display: flex;
    flex-direction: column;
    flex-basis: 25%;

    #filter {
        margin-top: 2vh;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;

        .select {
            width: 100%;
            font-family: 'normal';
            font-size: 1.9vh;
        }

        #sort-type {
            font-size: 1.9vh;
            white-space: nowrap;
        }
    }

    #equip-scroll {
        height: 100%;
    }
}

#equip-status {
    display: flex;
    flex-basis: 50%;
    flex-direction: row;
    justify-content: space-between;

    #equip-status-main {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 100%;
    }
}

#equip-desc {
    display: flex;
    flex-basis: 25%;
    flex-direction: column;
    padding-top: 2vh;
    align-items: center;

    #equip-icon {
        width: 80%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        border-bottom: 1px solid #ddd4;
        padding-bottom: 1%;

        span {
            margin-left: 5%;
        }
    }

    #equip-add {
        height: 50%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;

        #title {
            width: 100%;
            text-align: center;
        }

        .equip-add-detail {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
    }

    #equip-desc-text {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;

        #title {
            width: 100%;
            text-align: center;
        }
    }
}

#equip-now {
    width: 100%;

    #equip-now-div {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        padding-left: 5%;

        .equip-now-one {
            flex-basis: 33.3%;
            display: flex;
            flex-direction: row;
            align-items: center;
            margin: 3% 0 3% 0;

            span {
                margin-left: 10%;
            }
        }
    }
}

#equip-hero {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

#hero-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10% 0 10% 0;
}

#hero-status {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;

    .hero-status-one {
        display: flex;
        flex-direction: row;
        flex-basis: 50%;
        width: 100%;
        text-align: right;
        font-size: 2.9vh;
        white-space: nowrap;

        .hero-status-label {
            width: 100%;
            margin-right: 5%;
        }

        .hero-status-value {
            display: flex;
            flex-direction: row;
            width: 100%;
        }
    }
}

.equip {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 1vh 1vw 0 0.5vw;
    padding: 0.5vh 0.5vw 0.5vh 0.5vw;
    border: #0000 0.5px solid;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    .equip-icon {
        display: flex;
        flex-direction: row;
        align-items: center;

        .equip-name {
            margin-left: 5%;
        }
    }
}

@media screen and (max-width: 600px) {
    #equipbox {
        padding: 5%;
    }

    #equipbox-main {
        height: 100%;
        flex-direction: column-reverse;
    }

    #equip-now-div {
        flex-wrap: nowrap;
    }
}
</style>
