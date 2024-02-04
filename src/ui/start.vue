<template>
    <div id="start">
        <div id="start-div">
            <img id="background" src="/project/images/bg.jpg" />
            <div id="start-main">
                <div id="title">{{ name }}</div>
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
                <div id="buttons-container">
                    <div id="buttons">
                        <template v-if="!inHard">
                            <span
                                class="start-button"
                                id="start-game"
                                @click="clickStartButton('start-game')"
                                >开始游戏</span
                            >
                            <span
                                class="start-button"
                                id="load-game"
                                @click="clickStartButton('load-game')"
                                >读取存档</span
                            >
                            <span
                                class="start-button"
                                id="replay"
                                @click="clickStartButton('replay')"
                                >录像回放</span
                            >
                        </template>
                        <template v-else>
                            <span
                                class="start-button hard-button"
                                v-for="hard of hards"
                                @click="clickHard(hard.name)"
                                >{{ hard.title }}</span
                            >
                            <span
                                class="start-button"
                                id="back"
                                @click="inHard = false"
                                >返回</span
                            >
                        </template>
                    </div>
                </div>
            </div>
            <div id="listen" @mousemove="onmove"></div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import {
    SoundOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons-vue';
import { sleep } from 'mutate-animate';
import { Matrix4 } from '../plugin/webgl/matrix';
import { nextFrame, triggerFullscreen } from '../plugin/utils';
import { isMobile } from '../plugin/use';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/init/hotkey';
import { CustomToolbar } from '@/core/main/custom/toolbar';
import { mainSetting } from '@/core/main/setting';
import { bgm as mainBgm } from '@/core/audio/bgm';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

const name = core.firstData.title;
const hards = main.levelChoose;

const inHard = ref(false);

let startdiv: HTMLDivElement;
let start: HTMLDivElement;
let mainDiv: HTMLDivElement;
let background: HTMLImageElement;

const soundChecked = ref(false);
const fullscreen = ref(!!document.fullscreenElement);

function resize() {
    if (!window.core) return;

    nextFrame(() => {
        const scale = core.domStyle.scale;
        const h = core._PY_;
        const height = h * scale;
        const width = height * 1.5;
        if (!isMobile) {
            startdiv.style.width = `${width}px`;
            startdiv.style.height = `${height}px`;
            mainDiv.style.fontSize = `${scale * 16}px`;
        } else {
            startdiv.style.width = `${window.innerWidth}px`;
            startdiv.style.height = `${(window.innerHeight * 2) / 3}px`;
            mainDiv.style.fontSize = `${scale * 8}px`;
        }
    });
}

async function clickStartButton(id: string) {
    if (id === 'start-game') {
        inHard.value = true;
    }
    if (id === 'load-game') {
        core.dom.gameGroup.style.display = 'block';
        start.style.top = '200vh';
        core.load();
    }
    if (id === 'replay') core.chooseReplayFile();
}

async function clickHard(hard: string) {
    start.style.opacity = '0';
    await sleep(600);
    core.startGame(hard);
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

function bgm() {
    core.triggerBgm();
    soundChecked.value = !soundChecked.value;
    mainSetting.setValue('audio.bgmEnabled', soundChecked.value);
}

async function setFullscreen() {
    await triggerFullscreen(!fullscreen.value);
    requestAnimationFrame(() => {
        fullscreen.value = !!document.fullscreenElement;
    });
}

onMounted(async () => {
    startdiv = document.getElementById('start-div') as HTMLDivElement;
    mainDiv = document.getElementById('start-main') as HTMLDivElement;
    start = document.getElementById('start') as HTMLDivElement;
    background = document.getElementById('background') as HTMLImageElement;

    window.addEventListener('resize', resize);
    resize();

    soundChecked.value = mainSetting.getValue('audio.bgmEnabled', true);
    mainBgm.changeTo(main.startBgm);

    nextFrame(() => {
        start.style.opacity = '1';
    });

    CustomToolbar.closeAll();
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
        color: transparent;
    }

    #buttons-container {
        display: flex;
        width: 100%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        bottom: 10%;
        position: absolute;
        height: auto;
        font-size: 120%;
    }

    #buttons {
        border: 2px solid white;
        border-radius: 10px;
        padding: 1% 0;
        backdrop-filter: blur(5px);
        background-image: linear-gradient(
            to bottom,
            rgba(76, 73, 255, 0.6),
            rgba(106, 40, 145, 0.6)
        );
        display: flex;
        align-items: center;
        position: absolute;
        bottom: 10%;
        filter: brightness(120%) contrast(110%);
        z-index: 1;
        flex-direction: column;
        transition: height 0.2s ease;
        width: 25%;

        .start-button {
            position: relative;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4),
                0px 0px 1px rgba(255, 255, 255, 0.3);
            background-clip: text;
            -webkit-background-clip: text;
            font-weight: bold;
            color: transparent;
            transition: all 0.2s linear;
            box-shadow: 0px 0px 8px #0008;
            border-radius: 6px;
            padding: 1% 5%;
            width: 70%;
            text-wrap: nowrap;
            text-align: center;
        }

        .start-button:hover {
            transform: scale(120%);
        }

        .hard-button {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(255, 0, 0)
            );
        }

        #start-game {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(0, 255, 255)
            );
            margin-bottom: 2%;
        }

        #load-game {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(0, 255, 55)
            );
            margin-bottom: 2%;
        }

        #replay {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(255, 251, 0)
            );
        }

        #back {
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(132, 132, 132)
            );
        }
    }

    #settings {
        position: absolute;
        display: flex;
        align-items: center;
        flex-direction: row-reverse;
        justify-content: space-around;
        right: 5%;
        bottom: 10%;
        font-size: 1.3em;
        z-index: 1;
        width: 12%;
        background-color: #0008;
        border-radius: 10px;

        .setting-buttons {
            color: white;
            transition: color 0.2s linear;
            cursor: pointer;
        }

        .setting-buttons2 {
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
</style>
