<template>
    <div id="fly">
        <div id="tools">
            <span class="button-text" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
        </div>
        <div id="fly-settings">
            <div id="fly-border">
                <span>无边框模式</span>
                <a-switch
                    class="fly-settings"
                    v-model:checked="noBorder"
                    checked-children="ON"
                    un-checked-children="OFF"
                ></a-switch>
            </div>
            <div v-if="!isMobile" id="fly-tradition">
                <span>传统按键模式</span>
                <a-switch
                    class="fly-settings"
                    v-model:checked="tradition"
                    checked-children="ON"
                    un-checked-children="OFF"
                ></a-switch>
            </div>
            <span
                v-if="!isMobile"
                class="button-text"
                id="fly-download"
                @click="download"
                >下载地图图片</span
            >
        </div>
        <div id="fly-main">
            <div id="fly-left">
                <Scroll id="fly-area"
                    ><div id="area-list">
                        <span
                            v-for="(v, k) in area"
                            :selected="nowArea === k"
                            class="selectable"
                            @click="nowArea = k"
                            >{{ k }}</span
                        >
                    </div></Scroll
                >
                <a-divider type="vertical" dashed id="divider-left"></a-divider>
                <div id="fly-map-div">
                    <canvas id="fly-map" @click="click"></canvas>
                </div>
            </div>
            <a-divider
                id="divider-right"
                dashed
                :type="isMobile ? 'horizontal' : 'vertical'"
            ></a-divider>
            <div id="fly-right">
                <canvas id="fly-thumbnail" @click="fly" @wheel="wheel"></canvas>
                <div id="fly-tools">
                    <double-left-outlined
                        @click="changeFloorByDelta(-10)"
                        class="button-text fly-button"
                    />
                    <left-outlined
                        @click="changeFloorByDelta(-1)"
                        class="button-text fly-button"
                    />
                    <span
                        class="changable"
                        id="fly-now"
                        :change="titleChange"
                        >{{ title }}</span
                    >
                    <right-outlined
                        @click="changeFloorByDelta(1)"
                        class="button-text fly-button"
                    />
                    <double-right-outlined
                        @click="changeFloorByDelta(10)"
                        class="button-text fly-button"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Scroll from '../components/scroll.vue';
import { getArea, getMapData, MinimapDrawer } from '../plugin/ui/fly';
import { cancelGlobalDrag, isMobile, useDrag, useWheel } from '../plugin/use';
import {
    LeftOutlined,
    DoubleLeftOutlined,
    RightOutlined,
    DoubleRightOutlined
} from '@ant-design/icons-vue';
import { debounce } from 'lodash-es';
import { tip } from '../plugin/utils';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/init/hotkey';
import { createChangable } from '@/plugin/ui/common';
import { mainUi } from '@/core/main/init/ui';
import { mainSetting } from '@/core/main/setting';
import { GameStorage } from '@/core/main/storage';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

type Loc2 = [number, number, number, number];

const area = getArea();
const nowArea = ref(
    Object.keys(area).find(v => area[v].includes(core.status.floorId)) ?? ''
);
const nowFloor = ref(core.status.floorId);
const noBorder = ref(true);
const tradition = ref(false);
const settingScale = mainSetting.getValue('ui.mapScale', 100) / 100;
let scale = (isMobile ? 1.5 : 3) * settingScale;

const storage = GameStorage.for(GameStorage.fromAuthor('AncTe', 'flyConfig'));

noBorder.value = storage.getValue('noBorder', true);
tradition.value = storage.getValue('flyTradition', false);

const floor = computed(() => {
    return core.status.maps[nowFloor.value];
});

watch(nowFloor, n => {
    drawer.nowFloor = n;
    draw();
});
watch(nowArea, n => {
    scale = 3 * settingScale;
    lastScale = 3 * settingScale;
    drawer.nowArea = n;
    drawer.scale = 3 * settingScale;
    drawer.ox = 0;
    drawer.oy = 0;
    if (area[n] && !area[n].includes(nowFloor.value))
        nowFloor.value =
            area[n].find(v => v === core.status.floorId) ?? area[n][0];
});
watch(noBorder, n => {
    storage.setValue('noBorder', n);
    drawer.noBorder = n;
    drawer.drawedThumbnail = {};
    drawer.drawMap();
});
watch(tradition, n => {
    storage.setValue('flyTradition', n);
});

let map: HTMLCanvasElement;
let thumb: HTMLCanvasElement;
let thumbCtx: CanvasRenderingContext2D;

function exit() {
    mainUi.close(props.num);
}

const title = computed(() => {
    return core.status.maps[nowFloor.value].title;
});
const titleChange = createChangable(title).change;

let drawer: MinimapDrawer;

function drawRight() {
    let w = thumb.width;
    let h = thumb.height;
    let x = 0;
    let y = 0;
    const ratio = floor.value.width / floor.value.height;
    if (ratio > 1) {
        h = w / ratio;
        y = thumb.height / 2 - h / 2;
    }
    if (ratio < 1) {
        w = h * ratio;
        x = thumb.width / 2 - w / 2;
    }
    thumbCtx.fillStyle = '#000';
    thumbCtx.fillRect(0, 0, thumb.width, thumb.height);
    core.drawThumbnail(nowFloor.value, void 0, {
        ctx: thumbCtx,
        all: true,
        damage: true,
        inFlyMap: true,
        x,
        y,
        w,
        h
    });
}

/**
 * 绘制所有内容
 */
function draw() {
    drawer.clearCache();
    drawer.drawMap();
    drawRight();
}

function download() {
    drawer.download();
    draw();
}

function fly() {
    if (core.flyTo(nowFloor.value)) exit();
    else tip('error', `无法飞往${floor.value.title}`);
}

let lastScale = scale;
const changeScale = debounce((s: number) => {
    map.style.transform = '';
    drawer.drawedThumbnail = {};
    drawer.scale = s;
    drawer.drawMap();
    lastScale = s;
}, 200);

function resize(delta: number) {
    drawer.ox *= delta;
    drawer.oy *= delta;
    scale = delta * scale;
    changeScale(scale);
    map.style.transform = `scale(${scale / lastScale})`;
    drawer.thumbnailLoc = {};
}

let lastX = 0;
let lastY = 0;

let moved = false;
let startX = 0;
let startY = 0;

// -------------------- 点击事件

function drag(x: number, y: number) {
    if (touchScale) return;
    const dx = x - lastX;
    const dy = y - lastY;
    drawer.ox += dx;
    drawer.oy += dy;
    lastX = x;
    lastY = y;
    drawer.checkMoveThumbnail();
    drawer.drawToTarget();
    if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) moved = true;
}

function click(e: MouseEvent) {
    if (moved) return;

    const x = e.offsetX * devicePixelRatio;
    const y = e.offsetY * devicePixelRatio;
    for (const [id, [left, top, right, bottom]] of Object.entries(
        drawer.thumbnailLoc
    ) as [FloorIds, Loc2][]) {
        if (x >= left && x <= right && y >= top && y <= bottom) {
            if (id === nowFloor.value) {
                fly();
            } else {
                nowFloor.value = id;
            }
        }
    }
}

function wheel(ev: WheelEvent) {
    changeFloorByDelta(-Math.sign(ev.deltaY));
}

function changeAreaByFloor(id: FloorIds) {
    nowArea.value = Object.keys(area).find(v => area[v].includes(id))!;
}

function changeFloorByDelta(delta: number) {
    const now = core.floorIds.indexOf(nowFloor.value);
    let to = now + delta;
    if (to < 0) to = 0;
    if (to >= core.floorIds.length) to = core.floorIds.length - 1;
    const floor = core.status.maps[core.floorIds[to]];
    if (floor.deleted || floor.forceDelete) {
        while (to !== now) {
            to += Math.sign(delta);
            const floor = core.status.maps[core.floorIds[to]];
            if (floor.cannotViewMap) continue;
            if (!floor.deleted && !floor.forceDelete) break;
            if (to < 0 || to >= core.floorIds.length) break;
        }
    }
    nowFloor.value = core.floorIds[to];
    changeAreaByFloor(nowFloor.value);
    drawer.locateMap(nowFloor.value);
}

function changeFloorByDir(dir: Dir) {
    const data = getMapData(nowFloor.value);

    for (const [from, to] of Object.entries(data.link)) {
        if (!from.startsWith(nowFloor.value)) continue;
        const d = from.split(',')[3] as Dir;

        if (d === dir) {
            const target = to.split(',')[0] as FloorIds;
            drawer.locateMap(target);
            nowFloor.value = target;
            return;
        }
    }
}

// -------------------- 键盘事件

gameKey.use(props.ui.symbol);
gameKey
    .realize('@fly_left', () => {
        if (!tradition.value) changeFloorByDir('left');
    })
    .realize('@fly_right', () => {
        if (!tradition.value) changeFloorByDir('right');
    })
    .realize('@fly_up', () => {
        if (!tradition.value) changeFloorByDir('up');
    })
    .realize('@fly_down', () => {
        if (!tradition.value) changeFloorByDir('down');
    })
    .realize('@fly_last', () => {
        if (!tradition.value) changeFloorByDelta(-1);
    })
    .realize('@fly_next', () => {
        if (!tradition.value) changeFloorByDelta(1);
    })
    .realize('@fly_down_t', () => {
        if (tradition.value) changeFloorByDelta(-1);
    })
    .realize('@fly_up_t', () => {
        if (tradition.value) changeFloorByDelta(1);
    })
    .realize('@fly_left_t', () => {
        if (tradition.value) changeFloorByDelta(-10);
    })
    .realize('@fly_right_t', () => {
        if (tradition.value) changeFloorByDelta(10);
    })
    .realize('exit', () => {
        exit();
    })
    .realize('confirm', () => {
        fly();
    })
    .realize('fly', () => {
        exit();
    });

// -------------------- 触摸事件

let touchScale = false;
let lastDis = 0;
function touchdown(e: TouchEvent) {
    if (e.touches.length >= 2) {
        touchScale = true;
        lastDis = Math.sqrt(
            (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
                (e.touches[0].clientY - e.touches[1].clientY) ** 2
        );
    }
}

function touchup(e: TouchEvent) {
    if (e.touches.length < 2) touchScale = false;
}

function touchmove(e: TouchEvent) {
    if (!touchScale) return;
    const dis = Math.sqrt(
        (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
            (e.touches[0].clientY - e.touches[1].clientY) ** 2
    );
    resize(dis / lastDis);
    lastDis = dis;
}

onMounted(async () => {
    map = document.getElementById('fly-map') as HTMLCanvasElement;
    thumb = document.getElementById('fly-thumbnail') as HTMLCanvasElement;
    thumbCtx = thumb.getContext('2d')!;

    drawer = new MinimapDrawer(map);
    drawer.scale = scale;
    drawer.noBorder = noBorder.value;
    drawer.showInfo = true;

    const mapStyle = getComputedStyle(map);
    const thumbStyle = getComputedStyle(thumb);
    map.width = parseFloat(mapStyle.width) * devicePixelRatio;
    map.height = parseFloat(mapStyle.height) * devicePixelRatio;
    thumb.width = parseFloat(thumbStyle.width) * devicePixelRatio;
    thumb.height = parseFloat(thumbStyle.width) * devicePixelRatio;

    Array.from(document.getElementsByClassName('fly-settings')).forEach(v => {
        v.addEventListener('click', e => (v as HTMLElement).blur());
    });

    drawer.locateMap(nowFloor.value);
    draw();

    useDrag(
        map,
        drag,
        (x, y) => {
            lastX = x;
            lastY = y;
            startX = x;
            startY = y;
        },
        () => {
            setTimeout(() => {
                moved = false;
            }, 50);
        },
        true
    );

    useWheel(map, (x, y) => {
        const delta = -Math.sign(y) * 0.1 + 1;
        resize(delta);
    });

    map.addEventListener('touchstart', touchdown);
    map.addEventListener('touchend', touchup);
    map.addEventListener('touchmove', touchmove);
});

onUnmounted(() => {
    cancelGlobalDrag(drag);
    gameKey.dispose(props.ui.symbol);
});
</script>

<style lang="less" scoped>
#fly {
    width: 100%;
    height: 100%;
    font-size: 150%;
    font-family: 'normal';
    display: flex;
    align-items: center;
    user-select: none;
}

#tools {
    width: 100%;
    font-family: 'normal';
    font-size: 3.2vh;
    height: 5vh;
    position: fixed;
    left: 5vw;
    top: 5vh;
}

#fly-main {
    display: flex;
    height: 80%;
    width: 100%;
    flex-direction: row;
}

#fly-left {
    width: 50vw;
    display: flex;
    flex-direction: row;
    align-items: center;
}

#fly-area {
    height: 100%;
    width: 15vw;
}

#area-list {
    height: 100%;
    display: flex;
    flex-direction: column;
}

#divider-left {
    margin: 0;
    height: 100%;
    border-color: #ddd4;
}

#fly-map-div,
#fly-map {
    width: 35vw;
    height: 72vh;
    overflow: hidden;
}

#divider-right {
    height: 100%;
    border-color: #ddd4;
    margin: 0;
}

#fly-right {
    width: 40vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    position: relative;
}

#fly-tools {
    margin: 0;
    width: 80%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    position: absolute;
    bottom: 0;
    width: 100%;
    background-color: #0004;
}

#fly-thumbnail {
    width: 35vw;
    height: 35vw;
    max-height: 75vh;
    max-width: 75vh;
    border: 0.1vw solid #ddd4;
}

#fly-settings {
    position: fixed;
    bottom: 5vh;
    left: 10vw;
    width: 80vw;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;

    div {
        display: flex;
        align-items: center;

        span {
            margin-right: 5vw;
        }
    }
}

.fly-settings[aria-checked='false'] {
    background-color: #ddd4;
}

.fly-button {
    padding: 3%;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.301);
    border: 1px dashed #ddda;
    filter: drop-shadow(0px 0px 16px black);
}

#fly-now {
    text-wrap: nowrap;
    white-space: nowrap;
    max-width: 50%;
    text-overflow: ellipsis;
    overflow: hidden;
    text-shadow: 1px 1px 1px black, 1px -1px 1px black, -1px 1px 1px black,
        -1px -1px 1px black;
}

@media screen and (max-width: 600px) {
    #fly {
        font-size: 225%;
    }

    #fly-main {
        flex-direction: column;
        height: 90%;
    }

    #fly-map-div,
    #fly-map {
        width: 60vw;
        height: 30vh;
    }

    #fly-area {
        width: 30vw;
        height: 30vh;
    }

    #fly-left {
        width: 90vw;
    }

    #divider-right {
        height: 0;
    }

    #fly-right {
        width: 90vw;
        height: 60vh;
    }

    #fly-thumbnail {
        width: 80vw;
        height: 80vw;
    }

    #tools {
        top: 2vh;
    }

    #fly-settings {
        bottom: 2%;
    }
}
</style>
