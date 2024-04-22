<template>
    <div id="danmaku-div">
        <div
            :id="`danmaku-${one.id}`"
            class="danmaku-one"
            v-for="one of Danmaku.showList"
            :key="one.id"
            @mouseenter="mousein(one.id)"
            @mouseleave="mouseleave(one.id)"
            @touchstart="touchStart(one.id)"
        >
            <span class="danmaku-info">
                <like-filled
                    class="danmaku-like-icon"
                    :liked="one.liked"
                    @click="one.triggerLike()"
                />
                <span class="danmaku-like-num">{{ one.likedNum }}</span>
            </span>
            <component :is="one.getVNode()"></component>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { nextTick, onUnmounted, reactive, watch } from 'vue';
import { Danmaku } from '../core/main/custom/danmaku';
import { LikeFilled } from '@ant-design/icons-vue';
import { Ticker } from 'mutate-animate';
import { mainSetting } from '@/core/main/setting';
import { debounce } from 'lodash-es';

interface ElementMap {
    pos: number;
    ele: HTMLDivElement;
    danmaku: Danmaku;
    style: CSSStyleDeclaration;
    width: number;
    hover: boolean;
    top: number;
}

const map = Danmaku.showMap;
const eleMap: Map<number, ElementMap> = new Map();
const liked = reactive<Record<number, boolean>>({});
const ticker = new Ticker();

const speed = mainSetting.getValue('ui.danmakuSpeed', 60);

const likeFn = (l: boolean, d: Danmaku) => {
    liked[d.id] = l;
};

watch(Danmaku.showList, list => {
    list.forEach(v => {
        liked[v.id] = v.liked;
        v.on('like', likeFn);
        if (!eleMap.has(v.id)) {
            nextTick(() => {
                requestAnimationFrame(() => {
                    addElement(v.id);
                });
            });
        }
    });
});

function addElement(id: number) {
    const danmaku = map.get(id);
    if (!danmaku) return;
    const div = document.getElementById(`danmaku-${id}`);
    if (!div) return;

    const style = getComputedStyle(div);

    const ele: ElementMap = {
        danmaku,
        pos: window.innerWidth + 100,
        ele: div as HTMLDivElement,
        style,
        width: parseInt(style.width),
        hover: false,
        top: -1
    };

    eleMap.set(id, ele);
    calTop(id);
}

let lastTime = 0;
ticker.add(time => {
    const dt = (time - lastTime) / 1000;
    const toDelete: number[] = [];

    eleMap.forEach((value, id) => {
        const { danmaku, ele, style, width, hover } = value;
        if (!hover) {
            const dx = dt * speed;
            value.pos -= dx;
            ele.style.left = `${value.pos.toFixed(2)}px`;
        }

        if (value.pos + width < 0) {
            toDelete.push(id);
        }
    });
    lastTime = time;

    toDelete.forEach(v => {
        eleMap.delete(v);
        const danmaku = map.get(v);
        if (danmaku) {
            danmaku.showEnd();
        }
        map.delete(v);
    });
});

function mousein(id: number) {
    const danmaku = eleMap.get(id)!;
    danmaku.hover = true;
}

function mouseleave(id: number) {
    const danmaku = eleMap.get(id)!;
    danmaku.hover = false;
}

const touchDebounce = debounce(mouseleave, 3000);
function touchStart(id: number) {
    mousein(id);
    touchDebounce(id);
}

function calTop(id: number) {
    const danmaku = eleMap.get(id)!;
    const fontSize = mainSetting.getValue('screen.fontSize', 16) * 1.25 + 10;

    const used: Set<number> = new Set();
    eleMap.forEach(v => {
        const { pos, width } = v;
        if (
            pos <= window.innerWidth + 125 &&
            pos + width >= window.innerWidth + 75
        ) {
            used.add(v.top);
        }
    });
    let i = -1;
    while (++i < 20) {
        if (!used.has(i)) {
            danmaku.top = i;
            danmaku.ele.style.top = `${fontSize * i + 20}px`;
            break;
        }
    }
}

onUnmounted(() => {
    ticker.destroy();
});
</script>

<style lang="less" scoped>
#danmaku-div {
    position: fixed;
    width: 0;
    height: 0;
    left: 0;
    top: 0;
    overflow: visible;
    font-size: 150%;
    display: flex;
    align-items: center;
    z-index: 100;
}

.danmaku-one {
    position: fixed;
    left: 100vw;
    width: max-content;
    white-space: nowrap;
    text-wrap: nowrap;
    padding: 0 5px;
    display: flex;
}

.danmaku-one:hover {
    background-color: #0006;
    border-radius: 5px;
}

.danmaku-info {
    text-shadow: 1px 1px 1px black, 1px -1px 1px black, -1px 1px 1px black,
        -1px -1px 1px black;
}

.danmaku-like-num {
    font-size: 75%;
}

.danmaku-like-icon {
    transition: color 0.1s linear;
}

.danmaku-like-icon[liked='true'],
.danmaku-like-icon:hover {
    color: aqua;
}
</style>
