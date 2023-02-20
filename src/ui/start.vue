<template>
    <div id="start">
        <div id="start-div">
            <img id="background" src="/project/images/bg.jpg" />
            <div id="start-main">
                <div id="title">人类：开天辟地</div>
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
                            @click="clickStartButton(v)"
                            >{{ text[i] }}</span
                        >
                    </TransitionGroup>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import { RightOutlined } from '@ant-design/icons-vue';
import { sleep } from 'mutate-animate';

let startdiv: HTMLDivElement;
let start: HTMLDivElement;
let main: HTMLDivElement;
let cursor: HTMLElement;

let buttons: HTMLSpanElement[] = [];

let played: boolean;

const showed = ref(false);

const text1 = ['开始游戏', '读取存档', '录像回放', '查看成就'].reverse();
const text2 = ['轮回', '分支', '观测', '回忆'].reverse();

const ids = ['start-game', 'load-game', 'replay', 'achievement'].reverse();
const hardIds = ['easy', 'hard-hard', 'back'].reverse();
const text = ref(text1);
const hard = ['简单', '困难', '返回'].reverse();
const toshow = reactive<string[]>([]);

const selected = ref('start-game');

function resize() {
    const scale = core.domStyle.scale;
    const h = core._PY_;
    const height = h * scale;
    const width = height * 1.5;
    startdiv.style.width = `${width}px`;
    startdiv.style.height = `${height}px`;
    main.style.fontSize = `${scale * 16}px`;
}

function showCursor() {
    cursor.style.opacity = '1';
    setCursor(buttons[0], 0);
}

/**
 * 设置光标位置
 */
function setCursor(ele: HTMLSpanElement, i: number) {
    const style = getComputedStyle(ele);
    cursor.style.top = `${
        parseFloat(style.height) * (i + 0.5) -
        parseFloat(style.marginBottom) * (1 - i)
    }px`;
    cursor.style.left = `${parseFloat(style.left) - 30}px`;
}

function clickStartButton(id: string) {
    core.checkBgm();
    if (id === 'start-game') showHard();
    if (id === 'back') setButtonAnimate();
    if (id === 'easy' || id === 'hard-hard') {
        core.startGame(id);
    }
    if (id === 'load-game') {
        core.dom.gameGroup.style.display = 'block';
        start.style.top = '100vh';
        core.load();
    }
    if (id === 'replay') core.chooseReplayFile();
}

/**
 * 初始 -> 难度
 */
async function showHard() {
    cursor.style.transition =
        'left 0.4s ease-out, top 0.4s ease-out, opacity 0.4s linear';
    cursor.style.opacity = '0';
    buttons.forEach(v => (v.style.transition = ''));
    ids.unshift(toshow.pop()!);
    await sleep(150);
    ids.unshift(toshow.pop()!);
    await sleep(150);
    ids.unshift(toshow.pop()!);
    await sleep(150);
    ids.unshift(toshow.pop()!);
    await sleep(400);
    text.value = hard;
    toshow.push(hardIds.shift()!);
    await sleep(150);
    toshow.push(hardIds.shift()!);
    await sleep(150);
    toshow.push(hardIds.shift()!);
    selected.value = 'easy';
    nextTick(() => {
        buttons = toshow
            .map(v => document.getElementById(v) as HTMLSpanElement)
            .reverse();
        cursor.style.opacity = '1';
        setCursor(buttons[0], 0);
        buttons.forEach((v, i) => {
            v.addEventListener('mouseenter', e => {
                setCursor(v, i);
                selected.value = v.id;
            });
        });
    });
    await sleep(600);
    buttons.forEach(v => (v.style.transition = 'color 0.3s ease-out'));
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
        hardIds.unshift(toshow.pop()!);
        await sleep(150);
        hardIds.unshift(toshow.pop()!);
        await sleep(150);
        hardIds.unshift(toshow.pop()!);
    }
    text.value = text1;
    if (played) {
        text.value = text2;
    }
    await sleep(400);
    toshow.push(ids.shift()!);
    await sleep(150);
    toshow.push(ids.shift()!);
    await sleep(150);
    toshow.push(ids.shift()!);
    await sleep(150);
    toshow.push(ids.shift()!);
    selected.value = 'start-game';
    nextTick(() => {
        buttons = toshow
            .map(v => document.getElementById(v) as HTMLSpanElement)
            .reverse();
        cursor.style.opacity = '1';
        setCursor(buttons[0], 0);
        buttons.forEach((v, i) => {
            v.addEventListener('mouseenter', e => {
                setCursor(v, i);
                selected.value = v.id;
            });
        });
    });
    if (!showed.value) await sleep(1200);
    else await sleep(600);

    buttons.forEach(v => (v.style.transition = 'color 0.3s ease-out'));
}

onMounted(async () => {
    cursor = document.getElementById('cursor')!;
    played = core.getLocalStorage('oneweek1', false);
    startdiv = document.getElementById('start-div') as HTMLDivElement;
    main = document.getElementById('start-main') as HTMLDivElement;
    start = document.getElementById('start') as HTMLDivElement;
    core.registerResize('start', resize);
    resize();
    await sleep(50);
    start.style.opacity = '1';
    if (played) {
        text.value = text2;
    }
    setButtonAnimate().then(() => (showed.value = true));
    await sleep(1000);
    showCursor();
    await sleep(1200);
    core.dom.startPanel.style.display = 'none';
});

onUnmounted(() => {
    core.unregisterResize('start');
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
    transition: opacity 1.2s ease-out;
    background-color: black;
}

#start-div {
    position: relative;
}

#background {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    filter: sepia(30%) contrast(115%);
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
        color: transparent;
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
    }

    #buttons {
        display: flex;
        flex-direction: column-reverse;
        justify-content: center;
        position: absolute;
        left: 18%;
        bottom: 10%;
        filter: brightness(120%) contrast(110%);

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

        #start-game {
            left: 22.5%;
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(0, 255, 255)
            );
            margin-bottom: 8%;
        }

        #load-game {
            left: 15%;
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
            left: 7.5%;
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
            left: 30%;
            background-image: linear-gradient(
                to bottom,
                rgb(255, 255, 255),
                rgb(87, 255, 72)
            );
            margin-bottom: 16%;
        }

        #hard-hard {
            left: 15%;
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
}

.start-button {
    cursor: pointer;
}

.start-button[selected='true'] {
    color: transparent;
}

@keyframes cursor {
    from {
        transform: rotateX(0deg) scaleY(0.7);
    }
    to {
        transform: rotateX(360deg) scaleY(0.7);
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
</style>
