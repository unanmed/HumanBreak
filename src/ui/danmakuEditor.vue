<template>
    <div id="danmaku-editor" @click.capture="clickInter">
        <div id="danmaku-input">
            <span
                class="danmaku-tool"
                :open="cssOpened"
                @click="openTool('css')"
                >CSS</span
            >
            <span
                class="danmaku-tool"
                :open="fillOpened"
                @click="openTool('fillColor')"
            >
                <font-colors-outlined />
            </span>
            <span
                class="danmaku-tool"
                :open="strokeOpened"
                @click="openTool('strokeColor')"
            >
                <highlight-outlined />
            </span>
            <span
                class="danmaku-tool"
                :open="iconOpened"
                @click="openTool('icon')"
            >
                <meh-outlined />
            </span>
            <div id="danmaku-input-div">
                <a-input
                    id="danmaku-input-input"
                    :max-length="200"
                    v-model:value="inputValue"
                    placeholder="请在此输入弹幕，显示中括号请使用\[或\]"
                    autocomplete="off"
                    @change="input(inputValue)"
                    @pressEnter="inputEnter()"
                />
            </div>
            <span
                class="danmaku-tool danmaku-post"
                :posting="posting"
                @click="send()"
            >
                <send-outlined />
            </span>
        </div>
        <Transition name="danmaku">
            <div v-if="cssOpened" id="danmaku-css">
                <span id="danmaku-css-hint">编辑弹幕的 CSS 样式</span>
                <a-input
                    id="danmaku-css-input"
                    :max-length="300"
                    v-model:value="cssInfo"
                    placeholder="请在此输入样式"
                    autocomplete="off"
                    @blur="inputCSS(cssInfo)"
                    @pressEnter="inputCSS(cssInfo)"
                />
                <span v-if="cssError" id="danmaku-css-error">{{
                    cssError
                }}</span>
            </div>
            <div v-else-if="iconOpened" id="danmaku-icon">
                <span id="danmaku-icon-hint">常用图标</span>
                <Scroll
                    class="danmaku-icon-scroll"
                    :no-scroll="true"
                    type="horizontal"
                >
                    <div id="danmaku-icon-div">
                        <span
                            class="danmaku-icon-one"
                            v-for="icon of frequentlyIcon"
                            @click="addIcon(icon as AllIds)"
                        >
                            <BoxAnimate
                                :id="(icon as AllIds)"
                                :noborder="true"
                                :no-animate="true"
                                :height="getIconHeight(icon as AllIds)"
                            ></BoxAnimate>
                        </span>
                    </div>
                </Scroll>
                <span
                    id="danmaku-icon-all"
                    class="button-text"
                    :active="iconAll"
                    @click="iconAll = !iconAll"
                >
                    所有图标 <up-outlined />
                </span>
            </div>
            <div v-else-if="fillOpened || strokeOpened" id="danmaku-color">
                <span id="danmaku-color-hint"
                    >设置{{ fillOpened ? '填充' : '描边' }}颜色</span
                >
                <Scroll
                    class="danmaku-color-scroll"
                    :no-scroll="true"
                    type="horizontal"
                >
                    <div id="danmaku-color-container">
                        <span
                            v-for="color of frequentlyColor"
                            :style="{ backgroundColor: color }"
                            :selected="color === nowColor"
                            @click="inputColor(color)"
                            class="danmaku-color-one"
                        ></span>
                    </div>
                </Scroll>
                <a-input
                    id="danmaku-color-input"
                    :max-length="100"
                    v-model:value="nowColor"
                    placeholder="输入颜色"
                    autocomplete="off"
                    @blur="inputColor(nowColor)"
                    @pressEnter="inputColor(nowColor)"
                ></a-input>
            </div>
        </Transition>
        <Transition name="danmaku-icon">
            <div v-if="iconAll" id="danmaku-icon-all-div">
                <span
                    >本列表不包含额外素材，如果需要额外素材请手动填写素材id</span
                >
                <Scroll class="danmaku-all-scroll">
                    <div id="danmaku-all-container">
                        <span
                            v-for="icon of getAllIcons()"
                            @click="addIcon(icon)"
                        >
                            <BoxAnimate
                                :id="icon"
                                :height="getIconHeight(icon)"
                                :no-animate="true"
                                :noborder="true"
                            ></BoxAnimate>
                        </span>
                    </div>
                </Scroll>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import { Ref, onMounted, onUnmounted, ref } from 'vue';
import {
    FontColorsOutlined,
    HighlightOutlined,
    MehOutlined,
    SendOutlined,
    UpOutlined
} from '@ant-design/icons-vue';
import { Danmaku } from '@/core/main/custom/danmaku';
import { GameUi } from '@/core/main/custom/ui';
import { sleep } from 'mutate-animate';
import { fixedUi } from '@/core/main/init/ui';
import { calStringSize, tip } from '@/plugin/utils';
import { gameKey } from '@/core/main/custom/hotkey';
import { isNil } from 'lodash-es';
import { stringifyCSS, parseCss, getIconHeight } from '@/plugin/utils';
import { logger, LogLevel } from '@/core/common/logger';
import Scroll from '@/components/scroll.vue';
import BoxAnimate from '@/components/boxAnimate.vue';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

const frequentlyIcon: (AllIds | 'hero' | `X${number}`)[] = [
    'hero',
    'yellowKey',
    'blueKey',
    'redKey',
    'A492',
    'A494',
    'A497',
    'redPotion',
    'redGem',
    'blueGem',
    'I559',
    'X10194',
    'downPortal',
    'leftPortal',
    'upPortal',
    'rightPortal',
    'upFloor',
    'downFloor',
    'greenSlime',
    'yellowKnight',
    'bat',
    'slimelord'
];
const frequentlyColor: string[] = [
    '#ffffff',
    '#000000',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#00ffff',
    '#ff00ff',
    '#c0c0c0',
    '#808080',
    '#800000',
    '#800080',
    '#008000',
    '#808000',
    '#000080',
    '#008080'
];

let mainDiv: HTMLDivElement;

let danmaku = Danmaku.lastEditoredDanmaku ?? new Danmaku();

const cssOpened = ref(false);
const iconOpened = ref(false);
const fillOpened = ref(false);
const strokeOpened = ref(false);
const posting = ref(false);
const iconAll = ref(false);
const nowColor = ref('#ffffff');

const inputValue = ref(danmaku.text);
const cssInfo = ref(stringifyCSS(danmaku.style));
const cssError = ref('');

const map: Record<string, Ref<boolean>> = {
    css: cssOpened,
    icon: iconOpened,
    fillColor: fillOpened,
    strokeColor: strokeOpened
};

function openTool(tool: string) {
    iconAll.value = false;
    for (const [key, value] of Object.entries(map)) {
        if (key === tool) {
            value.value = !value.value;
        } else {
            value.value = false;
        }
    }
    if (tool === 'fillColor') {
        nowColor.value = danmaku.textColor;
    } else if (tool === 'strokeColor') {
        nowColor.value = danmaku.strokeColor;
    }
}

function send() {
    if (posting.value) return;
    if (danmaku.text === '') {
        tip('warning', '请填写弹幕！');
        return;
    }
    if (!core.isPlaying()) {
        tip('warning', '请进入游戏后再发送弹幕');
        return;
    }
    if (calStringSize(danmaku.text) > 200) {
        tip('warning', '弹幕长度超限！');
        return;
    }
    const { x, y } = core.status.hero.loc;
    const floor = core.status.floorId;
    if (isNil(x) || isNil(y) || isNil(floor)) {
        tip('warning', '当前无法发送弹幕');
        return;
    }

    danmaku.x = x;
    danmaku.y = y;
    danmaku.floor = floor;

    danmaku
        .post()
        .then(value => {
            if (value.data.code === 0) {
                danmaku.show();
                danmaku = new Danmaku();
                inputValue.value = '';
                cssInfo.value = '';
            }
        })
        .finally(() => {
            posting.value = false;
        });
}

function close() {
    mainDiv.classList.remove('danmaku-startup');
    mainDiv.classList.add('danmaku-close');
    sleep(200).then(() => {
        fixedUi.close(props.num);
    });
}

function input(value: string) {
    const size = calStringSize(value);
    if (size > 200) {
        tip('warning', '弹幕长度超限！');
    }

    const before = danmaku.text;
    const { info, ret } = logger.catch(() => {
        danmaku.text = value;
        return danmaku.parse();
    });
    if (info.length > 0) {
        if (info[0].code === 4) {
            tip('error', '请检查中括号匹配');
            danmaku.text = before;
        } else {
            danmaku.vNode = ret;
        }
    }
}

function inputEnter() {
    input(inputValue.value);
    inputCSS(cssInfo.value);
    send();
}

function inputCSS(text: string) {
    const { info, ret } = logger.catch(() => {
        return parseCss(text);
    });

    if (info.some(v => v.level > LogLevel.LOG)) {
        cssError.value = '语法错误';
        return;
    }

    const allow = Danmaku.checkCSSAllow(ret);
    if (allow.length > 0) {
        cssError.value = allow[0];
        return;
    } else {
        cssError.value = '';
    }

    danmaku.css(ret);
}

function inputColor(color: string) {
    nowColor.value = color;
    if (fillOpened.value) {
        danmaku.textColor = color;
    } else {
        danmaku.strokeColor = color;
    }
}

function addIcon(icon: AllIds | 'hero') {
    const iconText = `[i:${icon}]`;
    if (iconText.length + danmaku.text.length > 200) {
        tip('warn', '弹幕长度超限！');
        return;
    }
    danmaku.text += iconText;
    inputValue.value = danmaku.text;
}

function getAllIcons() {
    return [
        ...new Set(
            Object.values(core.maps.blocksInfo)
                .filter(v => v.cls !== 'tileset')
                .map(v => {
                    return v.id;
                })
        )
    ];
}

let clickIn = false;
let closed = false;
function clickOuter() {
    requestAnimationFrame(() => {
        if (!clickIn) {
            if (!iconAll.value) {
                if (!closed) {
                    closed = true;
                    close();
                }
            } else iconAll.value = false;
        }
        clickIn = false;
    });
}

function clickInter() {
    clickIn = true;
}

let lockedBefore = false;
onMounted(() => {
    mainDiv = document.getElementById('danmaku-editor') as HTMLDivElement;
    mainDiv.classList.add('danmaku-startup');
    gameKey.disable();

    core.lockControl();
    mainDiv.addEventListener('focus', () => {
        lockedBefore = core.status.lockControl;
        core.lockControl();
        gameKey.disable();
    });
    mainDiv.addEventListener('blur', () => {
        gameKey.enable();
        if (!lockedBefore) core.unlockControl();
    });

    document.addEventListener('click', clickOuter, { capture: true });
    document.addEventListener('touchend', clickOuter, { capture: true });
});

onUnmounted(() => {
    if (danmaku.text !== '' || Object.keys(danmaku.style).length > 0) {
        Danmaku.lastEditoredDanmaku = danmaku;
    } else {
        delete Danmaku.lastEditoredDanmaku;
    }
    if (!lockedBefore) core.unlockControl();
    gameKey.enable();
    document.removeEventListener('click', clickOuter);
    document.removeEventListener('touchend', clickOuter);
});
</script>

<style lang="less" scoped>
#danmaku-editor {
    position: fixed;
    width: 100%;
    bottom: 10px;
    display: flex;
    align-items: center;
    flex-direction: column-reverse;
    justify-content: end;
    font-size: 200%;
    background-color: #000b;
}

.danmaku-startup {
    animation: editor-startup 0.2s ease-out 0s 1 normal forwards running;
}

.danmaku-close {
    animation: editor-close 0.2s ease-in 0s 1 normal forwards running;
}

@keyframes editor-startup {
    0% {
        transform: translateY(70px);
    }
    100% {
        transform: none;
    }
}

@keyframes editor-close {
    0% {
        transform: none;
    }
    100% {
        transform: translateY(110px);
    }
}

#danmaku-input {
    height: 40px;
    width: 60%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 10px;
    margin-top: 10px;
}

#danmaku-input-div {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;

    #danmaku-input-input {
        width: 100%;
        height: 100%;
        font-size: 80%;
    }
}

.danmaku-tool {
    cursor: pointer;
    color: white;
    transition: color 0.2s linear;
    margin-right: 7px;
    font-family: 'Fira Code', 'Arial';
}

.danmaku-tool[open='true'],
.danmaku-tool:hover {
    color: aqua;
}

.danmaku-post {
    margin-left: 7px;
}

.danmaku-post[posting='true'] {
    color: gray;
    cursor: wait;
}

#danmaku-css {
    width: 60%;
    font-size: 60%;
    display: flex;
    flex-direction: row;
    align-items: center;
    white-space: nowrap;
    font-family: 'Fira Code', 'Arial';

    #danmaku-css-input {
        width: 100%;
        height: 100%;
        font-size: 80%;
        margin: 0 10px;
    }

    #danmaku-css-error {
        color: lightcoral;
    }
}

#danmaku-icon {
    width: 60%;
    display: flex;
    align-items: center;
    font-size: 80%;
    white-space: nowrap;
    justify-content: space-between;
    font-family: 'Fira Code', 'Arial';

    .danmaku-icon-scroll {
        width: calc(90% - 200px);
    }

    #danmaku-icon-div {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .danmaku-icon-one {
        display: flex;
        align-items: center;
    }
}

#danmaku-icon-all-div {
    position: fixed;
    bottom: 110px;
    height: 50vh;
    background-color: #000b;
    border-radius: 20px;
    padding: 1%;
    font-size: 75%;
    width: 60%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #dddd;

    #danmaku-all-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
    }

    .danmaku-all-scroll {
        height: calc(100% - 70px);
    }
}

#danmaku-color {
    width: 60%;
    display: flex;
    align-items: center;
    white-space: nowrap;
    justify-content: space-between;
    font-family: 'Fira Code', 'Arial';
    font-size: 75%;

    #danmaku-color-container {
        display: flex;
        align-items: center;
        margin: 10px;
        width: 100%;
    }

    .danmaku-color-one {
        width: 30px;
        min-width: 30px;
        height: 20px;
        border-radius: 6px;
        margin-right: 7px;
        border: 2px solid transparent;
        transition: border 0.1s linear;
    }

    .danmaku-color-one[selected='true'],
    .danmaku-color-one:hover {
        border: 2px solid gold;
    }

    .danmaku-color-scroll {
        width: calc(100% - 400px);
    }

    #danmaku-color-input {
        width: 200px;
    }
}

.danmaku-enter-active,
.danmaku-leave-active {
    transition: all 0.4s ease-out;
    position: absolute;
    bottom: 50px;
}

.danmaku-enter-from,
.danmaku-leave-to {
    opacity: 0;
    transform: translateY(50px);
}

.danmaku-icon-enter-active,
.danmaku-icon-leave-active {
    transition: all 0.3s ease-out;
}

.danmaku-icon-enter-from,
.danmaku-icon-leave-to {
    opacity: 0;
    transform: translateY(50px);
}

@media screen and (max-width: 600px) {
    #danmaku-input {
        width: 90%;
    }

    #danmaku-css {
        width: 90%;
    }

    #danmaku-icon {
        width: 90%;
    }
}
</style>
