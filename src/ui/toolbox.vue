<template>
    <span id="back" class="item-type-mobile" @click="exit"
        ><left-outlined />返回游戏</span
    >
    <div id="toolbox">
        <div v-for="cls of toShow" class="item-main">
            <div class="item-info">
                <div class="item-type" v-if="!isMobile">
                    {{ getClsName(cls) }}
                </div>
                <div v-else id="item-type-mobile">
                    <span
                        class="item-type-mobile"
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
                        class="item-type-mobile"
                        @click="mode = 'constants'"
                        :selected="mode === 'constants'"
                        >永久道具</span
                    >
                </div>
                <a-divider
                    dashed
                    style="margin: 1vh 0 1vh 0; border-color: #ddd4"
                ></a-divider>
                <Scroll class="item-list" :width="10">
                    <div
                        class="item"
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
                            <span class="item-name">{{ all[id].name }}</span>
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
                        all[selected]?.name ?? '没有道具'
                    }}</span>
                    <span>{{
                        getClsName(all[selected]?.cls as ItemMode) ?? '永久道具'
                    }}</span>
                </div>
            </div>
            <span style="margin-top: 2vh">点击该物品以使用</span>
            <a-divider dashed style="border-color: #ddd4"></a-divider>
            <div id="desc">
                <span style="border-bottom: 1px solid #ddd4">道具描述</span>
                <Scroll id="desc-text">
                    <div v-if="!descText.value.startsWith('!!html')">
                        {{ descText.value }}
                    </div>
                    <div v-else v-html="descText.value.slice(6)"></div>
                </Scroll>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { LeftOutlined } from '@ant-design/icons-vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Scroll from '../components/scroll.vue';
import BoxAnimate from '../components/boxAnimate.vue';
import { getClsName, getItems } from '../plugin/ui/toolbox';
import { isMobile } from '../plugin/use';
import { type, keycode, has } from '../plugin/utils';
import { hyper, sleep } from 'mutate-animate';
import { message } from 'ant-design-vue';
import { KeyCode } from '../plugin/keyCodes';

type ItemMode = 'tools' | 'constants';

const mode = ref<ItemMode>('tools');

const items = getItems('all');

const toShow = computed<ItemMode[]>(() => {
    return isMobile ? [mode.value] : ['tools', 'constants'];
});

const all = core.material.items;

const selected = ref(items[toShow.value[0]][0]?.[0] ?? 'none');
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
    if (all[s].text.startsWith('!!html')) return ref(all[s].text);
    return type(all[s].text, 600, hyper('sin', 'out'));
});

/**
 * 选择一个道具时
 * @param id 道具id
 */
async function select(id: string, nouse: boolean = false) {
    if (selected.value === id && !nouse) {
        use(id);
    }
    index.value = items[mode.value].findIndex(v => v[0] === id);
    selected.value = id;
}

function exit() {
    core.plugin.toolOpened.value = false;
}

async function use(id: string) {
    if (core.canUseItem(id)) {
        // 应该暂时把动画去掉
        core.plugin.transition.value = false;
        exit();
        await sleep(50);
        core.useItem(id);
        core.plugin.transition.value = true;
    } else {
        message.warn({
            content: '当前无法使用该道具！',
            class: 'antdv-message'
        });
    }
}

function keyup(e: KeyboardEvent) {
    const c = keycode(e.keyCode);
    if (c === KeyCode.Escape || c === KeyCode.KeyX) {
        exit();
    }
    if (c === KeyCode.Enter || c === KeyCode.KeyC) {
        use(selected.value);
    }
}

function keydown(e: KeyboardEvent) {
    const c = keycode(e.keyCode);
    const total = items[mode.value].length;
    if (c === KeyCode.DownArrow) {
        if (index.value < total - 1) {
            index.value++;
        }
    }
    if (c === KeyCode.UpArrow) {
        if (index.value > 0) {
            index.value--;
        }
    }
    if (c === KeyCode.RightArrow) {
        const constants = items.constants.length;
        if (mode.value === 'tools') {
            if (index.value >= constants) {
                index.value = constants - 1;
            }
            mode.value = 'constants';
        }
    }
    if (c === KeyCode.LeftArrow) {
        const constants = items.tools.length;
        if (mode.value === 'constants') {
            if (index.value >= constants) {
                index.value = constants - 1;
            }
            mode.value = 'tools';
        }
    }
}

onMounted(async () => {
    await sleep(600);
    document.addEventListener('keyup', keyup);
    document.addEventListener('keydown', keydown);
});

onUnmounted(() => {
    document.removeEventListener('keyup', keyup);
    document.removeEventListener('keydown', keydown);
});
</script>

<style lang="less" scoped>
#toolbox {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-family: 'normal';
    font-size: 2.5vh;
    user-select: none;
}

#back {
    position: absolute;
    left: 2%;
    font-size: 2em;
    font-family: 'normal';
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

.item-type-mobile {
    cursor: pointer;
    transition: color 0.2s linear;
}

.item-type-mobile:hover,
.item-type-mobile[selected='true'] {
    color: aqua;
}

.item-type-mobile:active {
    color: aquamarine;
}

.item {
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

    .item-icon {
        display: flex;
        flex-direction: row;
        align-items: center;

        .item-name {
            margin-left: 5%;
        }
    }
}

.item[selected='true'] {
    animation: selected alternate 5s infinite ease-in-out;
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

@keyframes selected {
    0% {
        border: #0ff7 0.5px solid;
        background-color: rgba(39, 251, 209, 0.143);
    }
    50% {
        border: #0ffa 0.5px solid;
        background-color: rgba(39, 251, 209, 0.284);
    }
    100% {
        border: #0ff7 0.5px solid;
        background-color: rgba(39, 251, 209, 0.143);
    }
}

@media screen and (max-width: 600px) {
    #toolbox {
        flex-direction: column-reverse;
        padding: 5%;
    }

    .item-list {
        width: 100%;
        height: 100%;
    }

    .divider {
        height: auto;
        width: 100%;
    }

    .item-main {
        display: flex;
        flex-direction: column-reverse;
    }

    #back {
        font-size: 1.5em;
    }
}
</style>
