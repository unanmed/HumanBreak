<template>
    <div id="shop">
        <div id="tools">
            <span class="button-text" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
        </div>
        <span id="item-name">{{ info.name }}</span>
        <a-divider dashed style="border-color: #ddd4" id="divider"></a-divider>
        <div id="item-info">
            <Scroll id="item-desc" :no-scroll="true">
                <span v-html="desc"></span>
            </Scroll>
        </div>
        <a-divider
            dashed
            style="border-color: #ddd4"
            id="divider-split"
        ></a-divider>
        <div id="shop-bottom">
            <div id="item-list">
                <Scroll style="width: 100%; height: 100%">
                    <div
                        class="selectable item-one"
                        v-for="(i, index) of choices"
                        :selected="index === selected"
                        @click="selected = index"
                    >
                        <div class="item-icon">
                            <BoxAnimate
                                :id="i.id"
                                :noborder="true"
                            ></BoxAnimate>
                            <span>{{ all[i.id].name }}</span>
                        </div>
                        <span
                            >×&nbsp;{{
                                (mode === 'buy'
                                    ? i.number - (f.itemShop[id]?.[i.id] ?? 0)
                                    : cnt(i.id)) + (update ? 0 : 0)
                            }}</span
                        >
                    </div>
                </Scroll>
            </div>
            <a-divider
                dashed
                style="border-color: #ddd4"
                type="vertical"
                id="divider-vertical"
            ></a-divider>
            <div id="item-sell-info">
                <div id="shop-mode">
                    <span
                        class="button-text mode-button"
                        :active="mode === 'buy'"
                        @click="mode = 'buy'"
                        >购买</span
                    >
                    <a-divider
                        dashed
                        type="vertical"
                        id="divider-vertical"
                        style="border-color: #ddd4"
                    ></a-divider>
                    <span
                        class="button-text mode-button"
                        :active="mode === 'sell'"
                        danger="true"
                        @click="mode = 'sell'"
                        >售出</span
                    >
                </div>
                <a-divider
                    dashed
                    style="border-color: #ddd4"
                    id="divider-mode"
                ></a-divider>
                <div
                    class="item-sell-info"
                    :style="{
                        color:
                            mode === 'buy'
                                ? nowMoney >= parseInt(item.money)
                                    ? 'lightgreen'
                                    : 'lightcoral'
                                : 'white'
                    }"
                >
                    <span>买价</span>
                    <span>{{ item.money }}</span>
                </div>
                <div
                    class="item-sell-info"
                    :style="{ color: mode === 'sell' ? 'lightcoral' : 'white' }"
                >
                    <span>卖价</span>
                    <span>{{ item.sell }}</span>
                </div>
                <div class="item-sell-info">
                    <span>存货</span>
                    <span>{{ remain }}</span>
                </div>
                <div class="item-sell-info">
                    <span>拥有</span>
                    <span>{{ cnt(item.id) }}</span>
                </div>
                <a-divider
                    dashed
                    style="border-color: #ddd4"
                    id="divider-mode"
                ></a-divider>
                <div id="sell-count">
                    <span>{{ mode === 'buy' ? '购买' : '售出' }}数量</span>
                    <div id="sell-count-select">
                        <double-left-outlined
                            class="button-text"
                            @click="count -= 10"
                        />
                        <left-outlined class="button-text" @click="count--" />
                        <span id="fly-now">{{ count }}</span>
                        <right-outlined class="button-text" @click="count++" />
                        <double-right-outlined
                            class="button-text"
                            @click="count += 10"
                        />
                    </div>
                </div>
                <a-divider
                    dashed
                    style="border-color: #ddd4; margin: 2vh 0 2vh 0"
                ></a-divider>
                <div id="sell-confirm">
                    <span
                        id="sell-total"
                        :style="{
                            color:
                                mode === 'buy'
                                    ? nowMoney > cost
                                        ? 'lightgreen'
                                        : 'lightcoral'
                                    : 'lightcoral'
                        }"
                        >总价：{{
                            count *
                            parseInt(mode === 'buy' ? item.money : item.sell)
                        }}</span
                    >
                    <span
                        id="sell-button"
                        class="button-text"
                        :danger="mode === 'sell'"
                        danger-display="true"
                        active="true"
                        @click="confirm"
                        >确认{{ mode === 'buy' ? '购买' : '售出' }}</span
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
    LeftOutlined,
    DoubleLeftOutlined,
    RightOutlined,
    DoubleRightOutlined
} from '@ant-design/icons-vue';
import { splitText, tip } from '../plugin/utils';
import Scroll from '../components/scroll.vue';
import BoxAnimate from '../components/boxAnimate.vue';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/init/hotkey';
import { mainUi } from '@/core/main/init/ui';

const props = defineProps<{
    num: number;
    ui: GameUi;
    shopId: string;
}>();

const id = props.shopId;
const shop = core.status.shops[id] as ItemShopEvent;
if (!shop.item) {
    throw new TypeError(
        `Wrong global shop type delivered in opening item shop.`
    );
}

flags.itemShop ??= {};

const f = flags;

const choices = shop.choices;
const selected = ref(0);
const mode = ref<'sell' | 'buy'>('buy');
const all = core.material.items;
const cnt = core.itemCount;
const count = ref(0);
const nowMoney = ref(core.status.hero.money);
const update = ref(false);

let bought = false;

watch(count, n => {
    if (n < 0) n = 0;
    if (mode.value === 'buy') {
        if (n > remain.value) n = remain.value;
    } else {
        const c = cnt(item.value.id);
        if (n > c) n = c;
    }
    count.value = n;
});

const item = computed(() => {
    return choices[selected.value];
});
const remain = computed(() => {
    update.value;
    return item.value.number - (flags.itemShop[id]?.[item.value.id] ?? 0);
});
const info = computed(() => {
    return core.material.items[item.value.id];
});
const desc = computed(() => {
    const text = info.value.text!;
    const res = splitText([text.startsWith('!!html') ? text.slice(6) : text]);
    return res;
});
const cost = computed(() => {
    return (
        count.value *
        parseInt(mode.value === 'buy' ? item.value.money : item.value.sell)
    );
});

watch(remain, n => {
    if (n < count.value) {
        count.value = n;
    }
});

function confirm() {
    if (count.value === 0) {
        return;
    }
    const money = core.status.hero.money;
    bought = true;
    if (mode.value === 'buy') {
        if (cost.value <= money) {
            core.getItem(item.value.id, count.value);
            core.status.hero.money -= cost.value;
            nowMoney.value -= cost.value;
            flags.itemShop[id] ??= {};
            flags.itemShop[id][item.value.id] ??= 0;
            flags.itemShop[id][item.value.id] += count.value;
            tip('success', `成功购买${count.value}个${info.value.name}！`);
            core.status.route.push(`buy:${item.value.id}:${count.value}`);
        } else {
            tip('error', '你的金币不够！');
        }
    } else {
        core.addItem(item.value.id, -count.value);
        core.status.hero.money += cost.value;
        nowMoney.value += cost.value;
        flags.itemShop[id] ??= {};
        flags.itemShop[id][item.value.id] ??= 0;
        flags.itemShop[id][item.value.id] -= count.value;
        tip('success', `成功卖出${count.value}个${info.value.name}！`);
        core.status.route.push(`sell:${item.value.id}:${count.value}`);
    }
    count.value = 0;
    update.value = !update.value;
}

gameKey.use(props.ui.symbol);
gameKey
    .realize('@shop_up', () => {
        if (selected.value >= 1) {
            selected.value--;
        }
    })
    .realize('@shop_down', () => {
        if (selected.value <= choices.length - 2) {
            selected.value++;
        }
    })
    .realize('@shop_add', () => {
        count.value--;
    })
    .realize('@shop_min', () => {
        count.value++;
    })
    .realize('exit', () => {
        exit();
    })
    .realize('confirm', () => {
        confirm();
    })
    .realize('shop', () => {
        exit();
    });

function exit() {
    if (bought) core.status.route.push('closeShop');
    mainUi.close(props.num);
}

onMounted(async () => {
    core.status.route.push(`openShop:${id}`);
});

onUnmounted(() => {
    gameKey.dispose(props.ui.symbol);
});
</script>

<style lang="less" scoped>
#shop {
    width: 90vh;
    height: 90vh;
    font-size: 150%;
    display: flex;
    flex-direction: column;
    user-select: none;
}

#tools {
    height: 5vh;
    font-size: 3.2vh;
}

#item-name {
    width: 100%;
    text-align: center;
    font-size: 140%;
    height: 5vh;
    line-height: 1;
}

#item-info {
    height: 24vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

#divider {
    width: 100%;
    margin: 1vh 0 1vh 0;
}

#divider-split {
    margin: 1vh 0 0 0;
}

#divider-vertical {
    height: 100%;
    margin: 0;
}

#shop-bottom {
    height: 53vh;
    width: 100%;
    display: flex;
    flex-direction: row;
}

#item-list {
    height: 53vh;
    width: 53vh;
    padding: 1vh 0 1vh 0;
}

#item-sell-info {
    width: 47vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.item-icon {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;

    span {
        margin-left: 5%;
    }
}

.item-one {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    margin-bottom: 1vh;
}

#shop-mode {
    width: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 5vh;
}

.mode-button {
    width: 100%;
    text-align: center;
}

#divider-mode {
    margin: 0;
}

.item-sell-info {
    width: 60%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 1vh 0;
    transition: color 0.2s linear;
}

#sell-count {
    width: 100%;
    padding-top: 1vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

#sell-count-select {
    margin-top: 1vh;
    width: 90%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
}

#sell-confirm {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
}

#sell-total {
    transition: color 0.2s linear;
}

@media screen and (max-width: 600px) {
    #shop {
        width: 90vw;
        padding-top: 5vh;
        font-size: 225%;
    }

    #item-list {
        width: 40vw;
    }

    #shop-bottom {
        width: 90vw;
    }

    #item-sell-info {
        width: 50vw;
    }
}
</style>
