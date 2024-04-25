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
    ele: HTMLDivElement;
    danmaku: Danmaku;
    hover: boolean;
    top: number;
    style: CSSStyleDeclaration;
}

const map = Danmaku.showMap;
const eleMap: Map<number, ElementMap> = new Map();
const liked = reactive<Record<number, boolean>>({});

const speed = mainSetting.getValue('ui.danmakuSpeed', 60);

const likeFn = (l: boolean, d: Danmaku) => {
    liked[d.id] = l;
};

watch(Danmaku.showList, list => {
    list.forEach(v => {
        if (!eleMap.has(v.id)) {
            nextTick(() => {
                liked[v.id] = v.liked;
                v.on('like', likeFn);
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

    const ele: ElementMap = {
        danmaku,
        ele: div as HTMLDivElement,
        hover: false,
        top: -1,
        style: getComputedStyle(div)
    };

    div.style.setProperty('--end', `${-div.scrollWidth}px`);
    div.style.setProperty(
        '--duration',
        `${Math.floor((window.innerWidth + div.scrollWidth) / speed)}s`
    );
    div.style.setProperty('left', ele.style.left);
    div.addEventListener('animationend', () => {
        danmaku.showEnd();
        eleMap.delete(id);
    });

    eleMap.set(id, ele);
    calTop(id);
}

function mousein(id: number) {
    const danmaku = eleMap.get(id)!;
    danmaku.hover = true;
    danmaku.ele.classList.add('danmaku-paused');
}

function mouseleave(id: number) {
    const danmaku = eleMap.get(id)!;
    danmaku.hover = false;
    danmaku.ele.classList.remove('danmaku-paused');
}

const touchDebounce = debounce(mouseleave, 3000);
function touchStart(id: number) {
    mousein(id);
    touchDebounce(id);
}

function calTop(id: number) {
    const danmaku = eleMap.get(id)!;
    const fontSize = mainSetting.getValue('screen.fontSize', 16) * 1.25 + 15;

    const used: Set<number> = new Set();
    eleMap.forEach(v => {
        const { ele, style } = v;
        const pos = parseInt(style.transform.slice(19, -4));
        const width = ele.scrollWidth;
        if (
            pos <= window.innerWidth + 200 &&
            pos + width >= window.innerWidth
        ) {
            used.add(v.top);
        }
    });
    let i = -1;
    danmaku.top = 0;
    danmaku.ele.style.top = `20px`;
    while (++i < 20) {
        if (!used.has(i)) {
            danmaku.top = i;
            danmaku.ele.style.top = `${fontSize * i + 20}px`;
            break;
        }
    }
}

onUnmounted(() => {});
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
    --end: 0;
    --duration: 5s;
    position: fixed;
    left: 0;
    transform: translateX(100vw);
    width: max-content;
    white-space: nowrap;
    text-wrap: nowrap;
    padding: 0 5px;
    display: flex;
    align-items: center;
    animation: danmaku-roll linear var(--duration) forwards;
    animation-play-state: running;
}

.danmaku-one:hover {
    background-color: #0006;
    border-radius: 5px;
    animation-play-state: paused;
}

.danmaku-one .danmaku-paused {
    animation-play-state: paused;
}

@keyframes danmaku-roll {
    0% {
        transform: translateX(100vw);
    }
    100% {
        transform: translateX(var(--end));
    }
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
