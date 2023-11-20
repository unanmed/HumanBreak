<template>
    <div id="toolbox">
        <div id="tools">
            <span class="button-text tools" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
            <span class="button-text tools" @click="toEquip"
                >装备栏 <right-outlined
            /></span>
        </div>
        <div id="toolbox-main">
            <div v-for="cls of toShow" class="item-main">
                <div class="item-info">
                    <div class="item-type" v-if="!isMobile">
                        {{ getClsName(cls) }}
                    </div>
                    <div v-else id="item-type-mobile">
                        <span
                            class="button-text"
                            @click="mode = 'tools'"
                            :selected="mode === 'tools'"
                            >消耗道具</span
                        >
                        <a-divider
                            dashed
                            style="border-color: #ddd4; height: 100%"
                            type="vertical"
                        ></a-divider>
                        <span
                            class="button-text"
                            @click="mode = 'constants'"
                            :selected="mode === 'constants'"
                            >永久道具</span
                        >
                    </div>
                    <a-divider
                        dashed
                        style="margin: 1vh 0 1vh 0; border-color: #ddd4"
                    ></a-divider>
                    <Scroll class="item-list">
                        <div
                            class="item selectable"
                            v-for="[id, num] of items[cls]"
                            :selected="selected === id"
                            @click="
                                mode = cls;
                                select(id);
                            "
                        >
                            <div class="item-icon">
                                <BoxAnimate
                                    :id="id"
                                    :width="32"
                                    :height="32"
                                    :noborder="true"
                                ></BoxAnimate>
                                <span class="item-name">{{
                                    all[id].name
                                }}</span>
                            </div>
                            <span>×&nbsp;{{ num }}</span>
                        </div>
                    </Scroll>
                </div>
                <a-divider
                    dashed
                    :type="isMobile ? 'horizontal' : 'vertical'"
                    class="divider"
                    style="border-color: #ddd4; margin: 1%"
                ></a-divider>
            </div>
            <div id="detail">
                <div id="info">
                    <BoxAnimate
                        :id="selected"
                        :width="32"
                        :height="32"
                    ></BoxAnimate>
                    <div id="basic-info">
                        <span style="border-bottom: 1px solid #ddd4">{{
                            selected === 'none'
                                ? '没有道具'
                                : all[selected].name
                        }}</span>
                        <span>{{
                            selected === 'none'
                                ? '永久道具'
                                : getClsName(all[selected].cls as ItemMode) ??
                                  '永久道具'
                        }}</span>
                    </div>
                </div>
                <span style="margin-top: 2vh">点击该物品以使用</span>
                <a-divider dashed style="border-color: #ddd4"></a-divider>
                <div id="desc">
                    <span>道具描述</span>
                    <Scroll id="desc-text">
                        <div v-if="!descText.value!.startsWith('!!html')">
                            {{ descText.value }}
                        </div>
                        <div v-else v-html="descText.value!.slice(6)"></div>
                    </Scroll>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Scroll from '../components/scroll.vue';
import BoxAnimate from '../components/boxAnimate.vue';
import { getClsName, getItems } from '../plugin/ui/toolbox';
import { isMobile } from '../plugin/use';
import { type, keycode, has } from '../plugin/utils';
import { hyper, sleep } from 'mutate-animate';
import { message } from 'ant-design-vue';
import { KeyCode } from '../plugin/keyCodes';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/init/hotkey';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

type ItemMode = 'tools' | 'constants';
type ShowItemIds = ItemIdOf<'constants' | 'tools'> | 'none';

const mode = ref<ItemMode>('tools');

const items = getItems('all');

const toShow = computed<ItemMode[]>(() => {
    return isMobile ? [mode.value] : ['tools', 'constants'];
});

const all = core.material.items;

const selected = ref<ShowItemIds>(items[toShow.value[0]][0]?.[0] ?? 'none');
const index = ref(0);

watch(index, n => {
    select(items[mode.value][n][0], true);
});

watch(mode, n => {
    if (!has(items[n][index.value])) {
        selected.value = 'none';
        return;
    }
    select(items[n][index.value][0], true);
});

const descText = computed(() => {
    const s = selected.value;
    if (s === 'none') return ref('没有选择道具');
    return type(all[s].text!, 25, hyper('sin', 'out'), true);
});

/**
 * 选择一个道具时
 * @param id 道具id
 */
async function select(id: ShowItemIds, nouse: boolean = false) {
    if (selected.value === id && !nouse) {
        use(id);
    }
    index.value = items[mode.value].findIndex(v => v[0] === id);
    selected.value = id;
}

function exit() {
    mota.ui.main.close(props.num);
}

function use(id: ShowItemIds) {
    if (id === 'none') return;
    if (core.canUseItem(id)) {
        const hold = mota.ui.main.holdOn();
        exit();
        core.useItem(id, false, () => {
            if (mota.ui.main.stack.length === 0) {
                hold.end();
            }
        });
    } else {
        message.warn({
            content: '当前无法使用该道具！',
            class: 'antdv-message'
        });
    }
}

async function toEquip() {
    mota.ui.main.holdOn();
    exit();
    mota.ui.main.open('equipbox');
}

gameKey.use(props.ui.symbol);
gameKey
    .realize('@toolbox_right', () => {
        const constants = items.constants.length;
        if (mode.value === 'tools') {
            if (index.value >= constants) {
                index.value = constants - 1;
            }
            mode.value = 'constants';
        }
    })
    .realize('@toolbox_left', () => {
        const constants = items.tools.length;
        if (mode.value === 'constants') {
            if (index.value >= constants) {
                index.value = constants - 1;
            }
            mode.value = 'tools';
        }
    })
    .realize('@toolbox_up', () => {
        if (index.value > 0) {
            index.value--;
        }
    })
    .realize('@toolbox_down', () => {
        const total = items[mode.value].length;
        if (index.value < total - 1) {
            index.value++;
        }
    })
    .realize('exit', () => {
        exit();
    })
    .realize('confirm', () => {
        use(selected.value);
    })
    .realize('toolbox', () => {
        exit();
    });

onUnmounted(() => {
    gameKey.dispose(props.ui.symbol);
});
</script>

<style lang="less" scoped>
#toolbox {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}

#toolbox-main {
    width: 100%;
    height: 85vh;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-family: 'normal';
    font-size: 150%;
    user-select: none;
}

#tools {
    width: 100%;
    display: flex;
    flex-direction: row;
    font-family: 'normal';
    font-size: 3.2vh;
    height: 5vh;
    justify-content: space-between;

    .tools {
        white-space: nowrap;
    }
}

.item-main {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;

    .item-info {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
}

.item-list {
    width: 100%;
    height: 88vh;
}

.item-type {
    width: 100%;
    text-align: center;
}

#item-type-mobile {
    width: 80%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
}

.button-text[selected='true'] {
    color: aqua;
}

.item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 1vh 0 0 0;
    padding: 0.5vh 0.5vw;
    border: #0000 0.5px solid;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    .item-icon {
        display: flex;
        flex-direction: row;
        align-items: center;

        .item-name {
            margin-left: 5%;
        }
    }
}

.divider {
    height: 100%;
}

#detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;

    #info {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        white-space: nowrap;
        text-overflow: ellipsis;

        #basic-info {
            display: flex;
            flex-direction: column;
            border-left: 1px solid #ddd4;
            padding-left: 5%;
            margin-left: 10%;
        }
    }

    #desc {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 100%;

        #desc-text {
            margin-top: 2vh;
            margin-left: 0.5vw;
            width: 100%;
            height: 100%;
        }
    }
}

@media screen and (max-width: 600px) {
    #toolbox {
        padding: 5%;
    }

    #tools {
        span {
            margin: 0;
        }
    }

    #toolbox-main {
        flex-direction: column-reverse;
        height: 100%;
        font-size: 100%;
    }

    .item-list {
        width: 100%;
        height: 40vh;
    }

    .divider {
        height: auto;
        width: 100%;
    }

    .item-main {
        display: flex;
        flex-direction: column-reverse;
    }
}
</style>
