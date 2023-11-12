<template>
    <div class="setting-main">
        <div id="tools">
            <span class="button-text" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
        </div>
        <div class="setting-container">
            <div class="setting-select">
                <TransitionGroup name="list">
                    <div
                        v-for="(info, i) of display"
                        :key="i"
                        class="setting-display"
                    >
                        <Scroll class="setting-scroll">
                            <div class="setting-list">
                                <div
                                    v-for="item of info.list"
                                    class="setting-item selectable"
                                    :selected="item === info.item"
                                    @click="click(item.key, i, item)"
                                >
                                    <span class="setting-name">{{
                                        item.name
                                    }}</span>
                                    <span
                                        :selected="item === info.item"
                                        class="setting-cascade"
                                        v-if="isCascade(item)"
                                    >
                                        <RightOutlined />
                                    </span>
                                    <span v-else class="setting-value">
                                        {{ getItemValue(item) }}
                                    </span>
                                </div>
                            </div>
                        </Scroll>
                        <a-divider
                            class="display-divider"
                            :type="isMobile ? 'horizontal' : 'vertical'"
                            dashed
                        ></a-divider>
                    </div>
                </TransitionGroup>
            </div>
            <div class="setting-info">
                <div
                    class="info-text"
                    v-html="splitText(display.at(-1)?.text ?? ['请选择设置'])"
                ></div>
                <a-divider class="info-divider" dashed></a-divider>
                <div class="info-editor" v-if="!!selectedItem">
                    <div class="editor-custom" v-if="!!selectedItem.controller">
                        <component :is="selectedItem.controller"></component>
                    </div>
                    <div v-else-if="!!selectedItem.special"></div>
                    <div
                        class="editor-number"
                        v-else-if="typeof selectedItem.value === 'number'"
                    >
                        <span>修改设置：</span>
                        <a-input-number
                            class="number-input"
                            size="large"
                            :min="selectedItem.step?.[0] ?? 0"
                            :max="selectedItem.step?.[1] ?? 100"
                            :step="selectedItem.step?.[2] ?? 1"
                            :keyboard="true"
                            :value="selectedItem.value"
                            @change="changeValue"
                        ></a-input-number>
                    </div>
                    <div
                        class="editor-boolean"
                        v-else-if="typeof selectedItem.value === 'boolean'"
                    >
                        <span
                            >当前{{
                                selectedItem.value ? '开启' : '关闭'
                            }}</span
                        >
                        <a-button
                            class="boolean-button"
                            type="primary"
                            size="large"
                            @click="changeValue(!selectedItem.value)"
                        >
                            {{ selectedItem.value ? '关闭' : '开启' }}设置
                        </a-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, shallowRef } from 'vue';
import {
    mainSetting,
    MotaSetting,
    MotaSettingItem,
    SettingDisplayer,
    SettingDisplayInfo,
    SettingText
} from '../core/main/setting';
import settingText from '../data/settings.json';
import { RightOutlined, LeftOutlined } from '@ant-design/icons-vue';
import { keycode, splitText } from '../plugin/utils';
import Scroll from '../components/scroll.vue';
import { isMobile } from '../plugin/use';
import { sleep } from 'mutate-animate';
import { KeyCode } from '../plugin/keyCodes';

const props = defineProps<{
    info?: MotaSetting;
    text?: SettingText;
    num: number;
}>();

const setting = props.info ?? mainSetting;
const text = props.text ?? (settingText as SettingText);
const display = shallowRef<SettingDisplayInfo[]>([]);
const selectedItem = computed(() => display.value.at(-1)?.item);

const displayer = new SettingDisplayer(setting, text);
displayer.on('update', (stack, dis) => {
    display.value = dis;
});
display.value = displayer.displayInfo;

function getItemValue(item: MotaSettingItem) {
    if (item.value instanceof MotaSetting) {
        return '';
    } else {
        if (item.display) {
            return item.display(item.value);
        } else {
            if (typeof item.value === 'number') {
                return item.value.toString();
            } else {
                return item.value ? 'ON' : 'OFF';
            }
        }
    }
}

function isCascade(item: MotaSettingItem) {
    return item.value instanceof MotaSetting;
}

function click(key: string, index: number, item: MotaSettingItem) {
    if (item.value instanceof MotaSetting) {
        if (index === display.value.length - 1) {
            displayer.add(key);
        } else {
            if (displayer.selectStack.includes(key)) {
                displayer.cut(index);
            } else {
                displayer.cut(index, true);
                displayer.add(key);
            }
        }
    } else {
        displayer.cut(index, true);
        displayer.add(key);
    }
}

function changeValue(value: number | boolean) {
    setting.setValue(displayer.selectStack.join('.'), value);
    displayer.update();
}

function exit() {
    mota.ui.main.close(props.num);
}

function key(e: KeyboardEvent) {
    const c = keycode(e.keyCode);
    if (c === KeyCode.Escape || c === KeyCode.KeyX) exit();
}

onMounted(async () => {
    await sleep(50);
    // if (mota.plugin.ui.transition.value) await sleep(600);
    document.addEventListener('keyup', key);
});

onUnmounted(() => {
    document.removeEventListener('keyup', key);
});
</script>

<style lang="less" scoped>
#tools {
    width: 100%;
    font-family: 'normal';
    font-size: 3.2vh;
    height: 5vh;
    position: fixed;
    left: 10vw;
    top: 10vh;
}

.setting-main {
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-family: normal;
    font-size: 150%;

    .setting-container {
        height: 60%;
        display: flex;
        flex-direction: row;
    }
}

.setting-select {
    display: flex;
    flex-direction: row;
    transition: all 0.5s ease;
}

.list-move,
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(-50px);
}

.list-leave-active {
    position: absolute;
    pointer-events: none;
}

.setting-display {
    display: flex;
    flex-direction: row;
    height: 100%;

    .setting-list {
        display: flex;
        flex-direction: column;
    }

    .display-divider {
        border-color: #fff4;
        height: auto;
    }

    .setting-item {
        padding: 2%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        overflow: hidden;
    }

    .setting-cascade {
        font-size: 75%;
        margin-right: 40px;
        transition: all 0.5s ease;
    }

    .setting-cascade[selected='true'] {
        font-size: 90%;
        margin-right: 10px;
        color: cyan;
    }

    .setting-name {
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 70%;
        overflow: hidden;
    }

    .setting-value {
        margin-right: 10px;
        color: rgb(242, 255, 101);
        white-space: nowrap;
    }
}

.setting-scroll {
    width: 20vw;
    height: 100%;
}

.setting-info {
    width: 25vw;

    .info-divider {
        border-color: #fff4;
        margin: 2% 0;
    }

    .editor-boolean {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        padding: 0 10% 0 5%;

        .boolean-button {
            font-size: 75%;
        }
    }

    .info-text {
        font-size: 85%;
        min-height: 30%;
    }

    .editor-number {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        padding: 0 10% 0 5%;

        .number-input {
            font-size: 80%;
            width: 40%;
        }
    }
}

@media screen and (max-width: 600px) {
    #tools {
        top: 2vh;
    }

    .setting-main {
        font-size: 120%;

        .setting-container {
            flex-direction: column;
            height: auto;
        }

        .setting-select {
            flex-direction: column;
            width: 90vw;
        }
    }

    .list-enter-from,
    .list-leave-to {
        opacity: 0;
        transform: translateY(-50px);
    }

    .setting-scroll {
        width: 90vw;
        height: 20vh;
    }

    .setting-display {
        width: 90vw;
        flex-direction: column;
        height: 22vh;

        .display-divider {
            width: 100%;
            height: auto;
            margin: 1vh 0;
        }
    }

    .setting-info {
        width: 90vw;
        height: 30vh;
    }
}
</style>
