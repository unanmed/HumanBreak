<template>
    <div id="equipbox">
        <div id="tools">
            <span class="button-text tools" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
            <span class="button-text tools" @click="toTool"
                >道具栏 <right-outlined
            /></span>
        </div>
        <div id="equipbox-main">
            <div id="equip-list">
                <div id="filter">
                    <a-select v-model:value="norm" class="select">
                        <a-select-option v-for="t of normList" :value="t">{{
                            t === 'none' ? '所有' : getStatusLabel(t)
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
                <Scroll id="equip-scroll"
                    ><div
                        class="equip selectable"
                        v-for="([id, num], i) of toShow"
                        :selected="selected === i && !isCol"
                        @mousedown="select(i)"
                        @touchstart="select(i)"
                        @click="clickList(i)"
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
                            :style="{
                                height: isMobile ? '10vh' : '30vh'
                            }"
                        >
                            <div id="equip-now-div">
                                <div
                                    v-for="(name, i) of equipCol"
                                    class="equip-now-one draginable selectable"
                                    :draged="draged"
                                    :access="canDragin(i)"
                                    :selected="isCol && selected === i"
                                    @mouseenter="dragin($event, i)"
                                    @mouseleave="dragout"
                                    @click="select(i, true)"
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
                    <BoxAnimate
                        :id="
                            isCol
                                ? equiped[selected] ?? 'none'
                                : toShow[selected]?.[0] ?? 'none'
                        "
                    ></BoxAnimate>
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
                    <span id="title">增减属性</span>
                    <Scroll style="width: 100%; height: 100%">
                        <component :is="addStatus"></component>
                    </Scroll>
                </div>
                <a-divider
                    dashed
                    style="border-color: #ddd4; margin: 1vh 0 1vh 0"
                ></a-divider>
                <div id="equip-desc-text">
                    <span id="title">装备介绍</span>
                    <Scroll id="desc-text" style="height: 100%; width: 100%">
                        <div v-if="!descText.value!.startsWith('!!html')">
                            {{ descText.value }}
                        </div>
                        <div v-else v-html="descText.value!.slice(6)"></div>
                    </Scroll>
                </div>
            </div>
        </div>
    </div>
    <div id="icon-drag">
        <BoxAnimate
            class="drag-icon"
            v-if="draged"
            :id="toShow[selected]?.[0] ?? 'none'"
            :width="48"
            :height="48"
            noborder
        ></BoxAnimate>
    </div>
</template>

<script lang="ts" setup>
import {
    LeftOutlined,
    RightOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined
} from '@ant-design/icons-vue';
import {
    computed,
    nextTick,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    watch
} from 'vue';
import Scroll from '../components/scroll.vue';
import { getAddStatus, getEquips, getNowStatus } from '../plugin/ui/equipbox';
import BoxAnimate from '../components/boxAnimate.vue';
import { has, tip, type } from '../plugin/utils';
import { cancelGlobalDrag, isMobile, useDrag } from '../plugin/use';
import { hyper } from 'mutate-animate';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/custom/hotkey';
import { getStatusLabel } from '../plugin/utils';
import { mainUi } from '@/core/main/init/ui';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

const equips = ref(getEquips());
const col = ref('all');
const all = core.material.items;
const selected = ref(0);
const isCol = ref(false); // 是否是选中的已装备的装备
const equipCol = core.status.globalAttribute.equipName;
const equiped = ref(core.status.hero.equipment);
const listClicked = ref(false);

const draged = ref(false);
const toEquipType = ref(-1); // 要穿至的装备孔，-1表示不穿

/** 排序方式，down表示下面大上面小 */
const sort = ref<'up' | 'down'>('down');
const norm = ref<keyof SelectType<HeroStatus, number> | 'none'>('none');
const sType = ref<'value' | 'percentage'>('value');

// 攻击 防御 回血 额外攻击
const normList = ['none', 'atk', 'def', 'hpmax', 'mana'];

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
    const none = {
        name: '没有选择装备',
        cls: 'equip',
        text: '没有选择装备',
        equip: { type: '无', value: {}, percentage: {}, animate: '' }
    };
    if (isCol.value) {
        const id = equiped.value[selected.value];
        const e = core.material.items[id];
        if (!has(e)) return none;
        return e;
    }
    if (!has(index)) return none;
    return all[index[0]];
});

const addStatus = computed(() => {
    // @ts-ignore
    return getAddStatus(equip.value.equip!, isCol.value);
});

const descText = computed(() => {
    if (equip.value.text!.startsWith('!!html')) return ref(equip.value.text);
    return type(equip.value.text!, 25, hyper('sin', 'out'), true);
});

const nowStatus = computed(() => {
    // @ts-ignore
    return getNowStatus(equip.value.equip, isCol.value);
});

/**
 * 需要展示的装备，已进行排序等操作
 */
const toShow = computed(() => {
    const sortType = sort.value;
    const sortNorm = norm.value;
    const sortBy = sType.value;

    const res = equips.value.filter(v => {
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
    mainUi.close(props.num);
}

function clickList(i: number) {
    if (i === selected.value && listClicked.value) {
        const id = toShow.value[selected.value]?.[0];
        if (!core.canEquip(id)) {
            tip('warn', '无法装备！');
            return;
        }
        core.loadEquip(id);
        update();
        listClicked.value = false;
    }
    listClicked.value = true;
}

/**
 * 选择某个装备
 */
function select(i: number, col: boolean = false) {
    if (i !== selected.value && !col) {
        listClicked.value = false;
    }
    if (col) listClicked.value = false;
    if (col && isCol.value === col && selected.value === i) {
        core.unloadEquip(i);
        update();
    }
    isCol.value = col;
    selected.value = i;
}

/**
 * 是否可以将当前装备拖入该栏
 * @param type 装备栏
 */
function canDragin(type: number) {
    if (type < 0) return false;
    const et = equip.value.equip?.type;
    if (!core.canEquip(toShow.value[selected.value]?.[0])) return false;
    if (!has(et)) return false;
    if (typeof et === 'number') return type === et;
    return equipCol[type] === et;
}

/**
 * 穿上某个装备
 */
function loadEquip() {
    const num = toEquipType.value;
    if (num < 0) return;
    if (!canDragin(num)) {
        tip('warn', '无法装备！');
        return;
    }
    const now = equiped.value[num];
    const to = toShow.value[selected.value]?.[0];
    core.items._realLoadEquip(num, to, now);
    update();
}

function update() {
    equiped.value = core.status.hero.equipment;
    equips.value = getEquips();
    requestAnimationFrame(() => {
        bind();
    });
}

// ----- 绑定函数
function bind() {
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
        () => {
            if (draged.value) {
                draged.value = false;
                loadEquip();
            }
        },
        true
    );
}

// ----- 交互函数
let [fx, fy] = [0, 0];
function dragEquip(x: number, y: number, e: TouchEvent | MouseEvent) {
    if ((x - fx) ** 2 + (y - fy) ** 2 > 10 ** 2 && !draged.value) {
        draged.value = true;
    }
    if (draged.value) {
        const target = document.getElementById('icon-drag') as HTMLDivElement;
        target.style.left = `${x - 24}px`;
        target.style.top = `${y - 24}px`;
    }
}

function dragin(e: Event, type: number) {
    e.stopPropagation();
    toEquipType.value = type;
}

function dragout(e: Event) {
    e.stopPropagation();
    toEquipType.value = -1;
}

function toTool() {
    mainUi.holdOn();
    exit();
    nextTick(() => {
        mainUi.open('toolbox');
    });
}

gameKey.use(props.ui.symbol);
gameKey
    .realize('exit', () => {
        exit();
    })
    .realize('equipbox', () => {
        exit();
    })
    .realize('quickEquip', id => {
        const num = parseInt(id.split('_').at(-1)!);
        core.quickSaveEquip(num);
        tip('success', `已保存至${num}号套装`);
    });

watch(toShow, n => {
    bind();
});

onMounted(async () => {
    bind();
});

onUnmounted(() => {
    cancelGlobalDrag(dragEquip);
    gameKey.dispose(props.ui.symbol);
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
    font-size: 3.2vh;
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
    font-size: 150%;
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
            font-size: 75%;
        }

        #sort-type {
            font-size: 75%;
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
            flex-basis: 30%;
            display: flex;
            flex-direction: row;
            align-items: center;
            margin: 3% 3.3% 3% 0;
            padding-left: 0.5%;

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
        font-size: 110%;
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
    padding: 0.5vh 0.5vw;
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

#icon-drag {
    position: fixed;
    width: 32px;
    height: 32px;
    margin: 0;
    padding: 0;
    pointer-events: none;
}

@media screen and (max-width: 600px) {
    #equipbox-main {
        flex-direction: column-reverse;
        font-size: 225%;
    }

    #equip-now-div {
        flex-wrap: nowrap;
    }

    #equip-status {
        flex-direction: column;
        flex-basis: auto;
    }

    #equip-list {
        flex-basis: 45%;

        #filter #sort-type {
            font-size: 150%;
        }
    }

    .divider {
        margin: 1% 0 1% 0;
    }
}
</style>
