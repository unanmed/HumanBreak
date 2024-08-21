<template>
    <div id="start">
        <div id="start-div">
            <img id="background" :src="bg.src" />
            <div id="start-main">
                <div id="title">人类：开天辟地</div>
                <div id="settings">
                    <div
                        id="sound"
                        class="setting-buttons"
                        :checked="soundChecked"
                        @click="bgm"
                    >
                        <sound-outlined />
                        <span v-if="!soundChecked" id="sound-del"></span>
                    </div>
                    <fullscreen-outlined
                        v-if="!fullscreen"
                        class="button-text setting-buttons2"
                        @click="setFullscreen"
                    />
                    <fullscreen-exit-outlined
                        v-else
                        class="button-text setting-buttons2"
                        @click="setFullscreen"
                    />
                </div>
                <div id="background-gradient"></div>
                <div id="buttons">
                    <right-outlined id="cursor" />
                    <TransitionGroup name="start">
                        <span
                            class="start-button"
                            v-for="(v, i) of toshow"
                            :id="v"
                            :key="v"
                            :selected="selected === v"
                            :showed="showed"
                            :index="i"
                            :length="text[i].length"
                            @click="clickStartButton(v)"
                            @mouseenter="
                                movein(
                                    $event.target as HTMLElement,
                                    toshow.length - i - 1
                                )
                            "
                            >{{ text[i] }}</span
                        >
                    </TransitionGroup>
                </div>
            </div>
            <div id="listen" @mousemove="onmove"></div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import {
    RightOutlined,
    SoundOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons-vue';
import { sleep } from 'mutate-animate';
import { Matrix4 } from '../plugin/webgl/matrix';
import { doByInterval, keycode } from '../plugin/utils';
import { triggerFullscreen } from '../plugin/utils';
import { isMobile } from '../plugin/use';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/custom/hotkey';
import { mainUi } from '@/core/main/init/ui';
import { CustomToolbar } from '@/core/main/custom/toolbar';
import { mainSetting } from '@/core/main/setting';
import { bgm as mainBgm } from '@/core/audio/bgm';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

const bg = core.material.images.images['bg.jpg'];

let startdiv: HTMLDivElement;
let start: HTMLDivElement;
let main: HTMLDivElement;
let cursor: HTMLElement;
let background: HTMLImageElement;

let buttons: HTMLSpanElement[] = [];

let played: boolean;
const soundChecked = ref(false);
const fullscreen = ref(!!document.fullscreenElement);

const showed = ref(false);

const text1 = ['开始游戏', '读取存档', '录像回放', '查看成就'].reverse();
const text2 = ['轮回', '分支', '观测', '回忆'].reverse();

const ids = ['start-game', 'load-game', 'replay', 'achievement'].reverse();
const hardIds = ['easy', 'hard-hard', 'back'].reverse();
const hard = ['简单', '困难', '返回'].reverse();
const text = ref(text1);
const toshow = reactive<string[]>([]);

const selected = ref('start-game');

function resize() {
    if (!window.core) return;
    const scale = core.domStyle.scale;
    const h = core._PY_;
    const height = h * scale;
    const width = height * 1.5;
    if (!isMobile) {
        startdiv.style.width = `${width}px`;
        startdiv.style.height = `${height}px`;
        main.style.fontSize = `${scale * 16}px`;
    } else {
        startdiv.style.width = `${window.innerWidth}px`;
        startdiv.style.height = `${(window.innerHeight * 2) / 3}px`;
        main.style.fontSize = `${scale * 8}px`;
    }
}

function showCursor() {
    cursor.style.opacity = '1';
    setCursor(buttons[0], 0);
}

/**
 * 设置光标位置
 */
function setCursor(ele: HTMLSpanElement, i: number) {
    if (!ele) return;
    const style = getComputedStyle(ele);
    cursor.style.top = `${
        parseFloat(style.height) * (i + 0.5) -
        parseFloat(style.marginBottom) * (1 - i)
    }px`;
    cursor.style.left = `${
        parseFloat(style.left) - 20 * core.domStyle.scale
    }px`;
}

async function clickStartButton(id: string) {
    if (id === 'start-game') showHard();
    if (id === 'back') setButtonAnimate();
    if (id === 'easy' || id === 'hard-hard') {
        start.style.opacity = '0';
        await sleep(600);
        core.startGame(id === 'easy' ? 'easy' : 'hard');
    }
    if (id === 'load-game') {
        core.dom.gameGroup.style.display = 'block';
        start.style.top = '200vh';
        core.load();
    }
    if (id === 'replay') core.chooseReplayFile();
    if (id === 'achievement') {
        mainUi.open('achievement');
    }
}

function onmove(e: MouseEvent) {
    if (!window.core) return;
    const { offsetX, offsetY } = e;
    const ele = e.target as HTMLDivElement;
    const style = getComputedStyle(ele);
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);
    const cx = width / 2;
    const cy = height / 2;
    const dx = (offsetX - cx) / cx;
    const dy = (offsetY - cy) / cy;

    const matrix = new Matrix4();

    matrix.scale(1.2, 1.2, 1);
    matrix.rotate((dy * 10 * Math.PI) / 180, -(dx * 10 * Math.PI) / 180);
    const end = Array.from(matrix.transpose()).flat().join(',');
    background.style.transform = `perspective(${
        1000 * core.domStyle.scale
    }px)matrix3d(${end})`;
}

function movein(button: HTMLElement, i: number) {
    setCursor(button, i);
    selected.value = button.id;
}

gameKey.use(props.ui.symbol);
gameKey
    .realize('@start_up', () => {
        const i = toshow.indexOf(selected.value);
        const next = toshow[i + 1];
        if (!next) return;
        selected.value = next;
        setCursor(buttons[toshow.length - i - 2], toshow.length - i - 2);
    })
    .realize('@start_down', () => {
        const i = toshow.indexOf(selected.value);
        const next = toshow[i - 1];
        if (!next) return;
        selected.value = next;
        setCursor(buttons[toshow.length - i], toshow.length - i);
    })
    .realize('confirm', () => {
        clickStartButton(selected.value);
    });

function bgm() {
    // core.triggerBgm();
    soundChecked.value = !soundChecked.value;
    mainSetting.setValue('audio.bgmEnabled', soundChecked.value);
}

async function setFullscreen() {
    const index = toshow.length - toshow.indexOf(selected.value) - 1;
    await triggerFullscreen(!fullscreen.value);
    requestAnimationFrame(() => {
        fullscreen.value = !!document.fullscreenElement;
        setCursor(buttons[index], index);
    });
}

/**
 * 初始 -> 难度
 */
async function showHard() {
    cursor.style.transition =
        'left 0.4s ease-out, top 0.4s ease-out, opacity 0.4s linear';
    cursor.style.opacity = '0';
    buttons.forEach(v => (v.style.transition = ''));

    await doByInterval(
        Array(4).fill(() => ids.unshift(toshow.pop()!)),
        150
    );
    await sleep(250);
    text.value = hard;

    await doByInterval(
        Array(3).fill(() => toshow.push(hardIds.shift()!)),
        150
    );
    selected.value = 'easy';
    nextTick(() => {
        buttons = toshow
            .map(v => document.getElementById(v) as HTMLSpanElement)
            .reverse();
        cursor.style.opacity = '1';
        setCursor(buttons[0], 0);
    });
    await sleep(600);
    buttons.forEach(
        v =>
            (v.style.transition =
                'transform 0.3s ease-out, color 0.3s ease-out')
    );
}

/**
 * 难度 | 无 -> 初始
 */
async function setButtonAnimate() {
    if (toshow.length > 0) {
        cursor.style.transition =
            'left 0.4s ease-out, top 0.4s ease-out, opacity 0.4s linear';
        cursor.style.opacity = '0';
        buttons.forEach(v => (v.style.transition = ''));
        await doByInterval(
            Array(3).fill(() => hardIds.unshift(toshow.pop()!)),
            150
        );
    }
    text.value = text1;
    if (played) {
        text.value = text2;
    }
    await sleep(250);

    await doByInterval(
        Array(4).fill(() => toshow.push(ids.shift()!)),
        150
    );

    selected.value = 'start-game';
    nextTick(() => {
        buttons = toshow
            .map(v => document.getElementById(v) as HTMLSpanElement)
            .reverse();
        cursor.style.opacity = '1';
        setCursor(buttons[0], 0);
        buttons.forEach((v, i) => {});
    });
    if (!showed.value) await sleep(1200);
    else await sleep(600);

    buttons.forEach(
        v =>
            v &&
            (v.style.transition =
                'transform 0.3s ease-out, color 0.3s ease-out')
    );
}

onMounted(async () => {
    cursor = document.getElementById('cursor')!;
    startdiv = document.getElementById('start-div') as HTMLDivElement;
    main = document.getElementById('start-main') as HTMLDivElement;
    start = document.getElementById('start') as HTMLDivElement;
    background = document.getElementById('background') as HTMLImageElement;
    CustomToolbar.closeAll();

    window.addEventListener('resize', resize);
    resize();

    soundChecked.value = mainSetting.getValue('audio.bgmEnabled', true);
    mainBgm.changeTo('title.mp3');

    start.style.opacity = '1';
    if (played) {
        text.value = text2;
        hard.splice(1, 0, '挑战');
    }
    setButtonAnimate().then(() => (showed.value = true));
    await sleep(1000);
    showCursor();
    await sleep(1200);
});

onUnmounted(() => {
    window.removeEventListener('resize', resize);
    gameKey.dispose(props.ui.symbol);
});
</script>

<style lang="less" scoped>
#start {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.6s ease-out;
    background-color: black;
    object-fit: contain;
}

#start-div {
    position: relative;
    overflow: hidden;
    object-fit: contain;
    width: 100%;
    height: 100%;
}

#background {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    filter: sepia(30%) contrast(115%);
    transform: scale(120%);
}

#background-gradient {
    z-index: 2;
    position: absolute;
    width: 200%;
    height: 100%;
    left: -100%;
    background-image: linear-gradient(
        45deg,
        transparent 0%,
        transparent 30%,
        #000 60%,
        #000 100%
    );
    animation: gradient 4s ease-out 0.5s 1 normal forwards;
    pointer-events: none;
}

#listen {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: auto;
}

#start-main {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    font-size: 16px;

    #title {
        margin-top: 7%;
        text-align: center;
        font: 4em 'normal';
        font-weight: 200;
        background-image: linear-gradient(
            to right,
            rgb(0, 0, 0),
            rgb(44, 44, 44),
            rgb(136, 0, 214),
            rgb(0, 2, 97),
            rgb(0, 2, 97)
        );
        background-clip: text;
        -webkit-background-clip: text;
        text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5),
            -1px -1px 3px rgba(255, 255, 255, 0.3),
            5px 5px 5px rgba(0, 0, 0, 0.4);
        filter: brightness(1.8);
        user-select: none;
        animation: opacity 3s ease-out 0.5s 1 normal forwards;
    }

    #buttons {
        display: flex;
        flex-direction: column-reverse;
        justify-content: center;
        position: absolute;
        left: 18%;
        bottom: 10%;
        filter: brightness(120%) contrast(110%);
        z-index: 1;

        #cursor {
            text-shadow: 2px 2px 3px black;
            position: absolute;
            opacity: 0;
            animation: cursor 2.5s linear 0s infinite normal running;
            transition: left 0.4s ease-out, top 0.4s ease-out,
                opacity 1.5s ease-out;
        }

        .start-button {
            position: relative;
            font: bold 1.5em 'normal';
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4),
                0px 0px 1px rgba(255, 255, 255, 0.3);
            background-clip: text;
            -webkit-background-clip: text;
        }

        .start-button[index='1'][length='4'] {
            left: 7.5%;
        }

        .start-button[index='2'][length='4'] {
            left: 15%;
        }

        .start-button[index='3'][length='4'] {
            left: 22.5%;
        }

        .start-button[index='1'][length='2'] {
            left: 15%;
        }

        .start-button[index='2'][length='2'] {
            left: 30%;
        }

        .start-button[index='3'][length='2'] {
            left: 45%;
        }

        #start-game {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(0, 255, 255)
            );
            margin-bottom: 8%;
        }

        #load-game {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(0, 255, 55)
            );
            margin-bottom: 8%;
        }

        #replay {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(255, 251, 0)
            );
            margin-bottom: 8%;
        }

        #achievement {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(0, 208, 255)
            );
            margin-bottom: 8%;
        }

        #easy {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(87, 255, 72)
            );
            margin-bottom: 16%;
        }

        #hard-hard {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(255, 0, 0)
            );
            margin-bottom: 16%;
        }

        #back {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(132, 132, 132)
            );
            margin-bottom: 16%;
        }
    }

    #settings {
        position: absolute;
        display: flex;
        align-items: center;
        flex-direction: row-reverse;
        justify-content: flex-start;
        right: 5%;
        bottom: 10%;
        font-size: 1.3em;
        z-index: 1;
        width: 50%;

        .setting-buttons {
            margin-left: 4%;
            color: white;
            transition: color 0.2s linear;
            cursor: pointer;
        }

        .setting-buttons2 {
            margin-left: 4%;
            position: relative;
            top: 1px;
        }

        #sound {
            position: relative;
        }

        #sound[checked='false'] {
            color: rgb(255, 43, 43);
        }

        #sound:hover {
            color: aqua;
        }

        #sound[checked='false']:hover {
            color: rgb(253, 139, 139);
        }

        #sound-del {
            left: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            border-bottom: 2px solid #aaa;
            transform: translate(-85%, -50%) rotate(-45deg) scale(1.5);
        }
    }
}

.start-button {
    cursor: pointer;
}

.start-button[selected='true'] {
    color: transparent;
    transform: scale(115%) translate(7.5%);
}

@keyframes cursor {
    from {
        transform: rotateX(0deg) scaleY(0.7);
    }
    to {
        transform: rotateX(360deg) scaleY(0.7);
    }
}

@keyframes gradient {
    from {
        left: -100%;
    }
    to {
        left: 100%;
    }
}

@keyframes opacity {
    from {
        color: #bbb;
    }
    to {
        color: transparent;
    }
}

.start-enter-active {
    transition: all 1.2s ease-out;
}
.start-enter-active[showed='true'] {
    transition: all 0.6s ease-out;
}
.start-enter-from {
    opacity: 0;
    transform: translateX(20px);
}
.start-leave-active {
    transition: all 0.4s ease-out;
}
.start-leave-to {
    transform: translateX(-20px);
    opacity: 0;
}

@media screen and (max-width: 600px) {
    #buttons {
        font-size: 250%;
    }

    #start-main {
        #title {
            font-size: 700%;
        }
        #settings {
            font-size: 400%;
        }
    }
}
</style>
