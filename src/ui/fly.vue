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
                <canvas id="fly-thumbnail" @click="fly"></canvas>
                <div id="fly-tools">
                    <double-left-outlined
                        @click="changeFloorByDelta(-10)"
                        class="button-text"
                    />
                    <left-outlined
                        @click="changeFloorByDelta(-1)"
                        class="button-text"
                    />
                    <span id="fly-now">{{ title }}</span>
                    <right-outlined
                        @click="changeFloorByDelta(1)"
                        class="button-text"
                    />
                    <double-right-outlined
                        @click="changeFloorByDelta(10)"
                        class="button-text"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Scroll from '../components/scroll.vue';
import { getArea, getMapDrawData, getMapData } from '../plugin/ui/fly';
import { cancelGlobalDrag, isMobile, useDrag, useWheel } from '../plugin/use';
import {
    LeftOutlined,
    DoubleLeftOutlined,
    RightOutlined,
    DoubleRightOutlined
} from '@ant-design/icons-vue';
import { debounce } from 'lodash';
import { keycode, tip } from '../plugin/utils';
import { sleep } from 'mutate-animate';
import { KeyCode } from '../plugin/keyCodes';

type Loc2 = [number, number, number, number];

const area = getArea();
const nowArea = ref(
    Object.keys(area).find(v => area[v].includes(core.status.floorId))!
);
const nowFloor = ref(core.status.floorId);
const noBorder = ref(true);
const tradition = ref(false);
let scale = isMobile ? 1.5 : 3;
let ox = 0;
let oy = 0;
let drawedThumbnail: Partial<Record<FloorIds, boolean>> = {};
let thumbnailLoc: Partial<Record<FloorIds, Loc2>> = {};

noBorder.value = core.getLocalStorage('noBorder', true);
tradition.value = core.getLocalStorage('flyTradition', false);

const floor = computed(() => {
    return core.status.maps[nowFloor.value];
});

watch(nowFloor, draw);
watch(nowArea, n => {
    ox = 0;
    oy = 0;
    scale = 3;
    lastScale = 3;
    if (area[n] && !area[n].includes(nowFloor.value))
        nowFloor.value =
            area[n].find(v => v === core.status.floorId) ?? area[n][0];
});
watch(noBorder, n => {
    core.setLocalStorage('noBorder', n);
    drawedThumbnail = {};
    drawMap();
});
watch(tradition, n => {
    core.setLocalStorage('flyTradition', n);
});

const temp = document.createElement('canvas');
const tempCtx = temp.getContext('2d')!;
let map: HTMLCanvasElement;
let mapCtx: CanvasRenderingContext2D;
let thumb: HTMLCanvasElement;
let thumbCtx: CanvasRenderingContext2D;

function exit() {
    core.plugin.flyOpened.value = false;
}

const title = computed(() => {
    return core.status.maps[nowFloor.value].title;
});

/**
 * 绘制小地图
 * @param noCache 是否不使用缓存
 */
function drawMap(noCache: boolean = false) {
    const border = noBorder.value ? 0.5 : 1;
    const data = getMapDrawData(
        nowFloor.value,
        noBorder.value ? 0 : 5,
        border,
        noCache
    );
    const ctx = tempCtx;
    const s = scale * devicePixelRatio;
    temp.width = data.width * s;
    temp.height = data.height * s;
    ctx.lineWidth = (border * devicePixelRatio) / 2;
    ctx.strokeStyle = '#fff';
    ctx.scale(s, s);
    ctx.translate(5, 5);

    if (!noBorder.value) {
        // 绘制连线
        data.line.forEach(([x1, y1, x2, y2]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
    }

    // 绘制地图及缩略图
    for (const [id, [x, y]] of Object.entries(data.locs) as [
        FloorIds,
        LocArr
    ][]) {
        if (!noBorder.value) drawBorder(id, x, y);
        drawThumbnail(id, x, y);
    }
    drawToTarget();
}

function drawBorder(id: FloorIds, x: number, y: number) {
    const border = noBorder.value ? 0.5 : 1;
    const ctx = tempCtx;
    ctx.lineWidth = border * devicePixelRatio;
    const map = core.status.maps[id];

    if (!core.hasVisitedFloor(id)) {
        ctx.fillStyle = '#d0d';
    } else {
        ctx.fillStyle = '#000';
    }
    if (id === nowFloor.value) {
        ctx.strokeStyle = 'gold';
    } else {
        ctx.strokeStyle = '#fff';
    }

    ctx.strokeRect(
        x - map.width / 2,
        y - map.height / 2,
        map.width,
        map.height
    );

    ctx.fillRect(x - map.width / 2, y - map.height / 2, map.width, map.height);
    if (id === nowFloor.value) {
        ctx.fillStyle = '#ff04';
        ctx.fillRect(
            x - map.width / 2,
            y - map.height / 2,
            map.width,
            map.height
        );
    }
}

/**
 * 绘制小地图至目标画布
 */
function drawToTarget(s: number = 1) {
    mapCtx.clearRect(0, 0, map.width, map.height);
    mapCtx.drawImage(
        temp,
        0,
        0,
        temp.width,
        temp.height,
        ox * devicePixelRatio + (map.width - temp.width) / 2,
        oy * devicePixelRatio + (map.height - temp.height) / 2,
        temp.width,
        temp.height
    );
}

/**
 * 检查是否应该绘制缩略图
 */
function checkThumbnail(floorId: FloorIds, x: number, y: number) {
    const floor = core.status.maps[floorId];
    const s = scale * devicePixelRatio;
    const px = ox * devicePixelRatio + (map.width - temp.width) / 2 + 5 * s;
    const py = oy * devicePixelRatio + (map.height - temp.height) / 2 + 5 * s;
    const left = px + (x - floor.width / 2) * s;
    const top = py + (y - floor.height / 2) * s;
    const right = left + floor.width * s;
    const bottom = top + floor.height * s;

    thumbnailLoc[floorId] = [left, top, right, bottom];

    if (
        drawedThumbnail[floorId] ||
        (!noBorder.value && scale <= 4) ||
        right < 0 ||
        bottom < 0 ||
        left > map.width ||
        top > map.height
    )
        return false;

    return true;
}

/**
 * 绘制缩略图
 */
function drawThumbnail(
    floorId: FloorIds,
    x: number,
    y: number,
    noCheck: boolean = false
) {
    if (!noCheck && !checkThumbnail(floorId, x, y)) return;
    const floor = core.status.maps[floorId];
    drawedThumbnail[floorId] = true;

    // 绘制缩略图
    const ctx = tempCtx;
    core.drawThumbnail(floorId, void 0, {
        all: true,
        inFlyMap: true,
        x: x - floor.width / 2,
        y: y - floor.height / 2,
        w: floor.width,
        h: floor.height,
        ctx,
        damage: scale > 7
    });
    if (!core.hasVisitedFloor(floorId)) {
        ctx.fillStyle = '#d0d6';
        ctx.fillRect(
            x - floor.width / 2,
            y - floor.height / 2,
            floor.width,
            floor.height
        );
        ctx.fillStyle = '#000';
    }
    if (nowFloor.value === floorId) {
        ctx.fillStyle = '#ff04';
        ctx.fillRect(
            x - floor.width / 2,
            y - floor.height / 2,
            floor.width,
            floor.height
        );
        ctx.fillStyle = '#000';
    }
}

/**
 * 当移动时检查是否应该绘制缩略图
 */
function checkMoveThumbnail() {
    const border = noBorder.value ? 0.5 : 1;
    const data = getMapDrawData(nowFloor.value, noBorder.value ? 0 : 5, border);
    for (const [id, [x, y]] of Object.entries(data.locs) as [
        FloorIds,
        LocArr
    ][]) {
        if (checkThumbnail(id, x, y)) drawThumbnail(id, x, y, true);
    }
}

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
    drawedThumbnail = {};
    thumbnailLoc = {};
    drawMap();
    drawRight();
}

function fly() {
    if (core.flyTo(nowFloor.value)) exit();
    else tip('error', `无法飞往${floor.value.title}`);
}

let lastScale = scale;
const changeScale = debounce((s: number) => {
    map.style.transform = '';
    drawedThumbnail = {};
    drawMap();
    lastScale = s;
}, 200);

function resize(delta: number) {
    ox *= delta;
    oy *= delta;
    scale = delta * scale;
    changeScale(scale);
    map.style.transform = `scale(${scale / lastScale})`;
    thumbnailLoc = {};
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
    ox += dx;
    oy += dy;
    lastX = x;
    lastY = y;
    checkMoveThumbnail();
    drawToTarget();
    if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) moved = true;
}

function click(e: MouseEvent) {
    if (moved) return;

    const x = e.offsetX * devicePixelRatio;
    const y = e.offsetY * devicePixelRatio;
    for (const [id, [left, top, right, bottom]] of Object.entries(
        thumbnailLoc
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
            if (!floor.deleted && !floor.forceDelete) break;
            if (to < 0 || to >= core.floorIds.length) break;
        }
    }
    nowFloor.value = core.floorIds[to];
    changeAreaByFloor(nowFloor.value);
    locateMap(nowFloor.value);
}

function changeFloorByDir(dir: Dir) {
    const data = getMapData(nowFloor.value);

    for (const [from, to] of Object.entries(data.link)) {
        if (!from.startsWith(nowFloor.value)) continue;
        const d = from.split(',')[3] as Dir;

        if (d === dir) {
            const target = to.split(',')[0] as FloorIds;
            locateMap(target);
            nowFloor.value = target;
            return;
        }
    }
}

/**
 * 居中地图
 * @param id 楼层id
 */
function locateMap(id: FloorIds) {
    const data = getMapDrawData(
        id,
        noBorder.value ? 0 : 5, // 可恶的0和5，写反了找一个多小时
        noBorder.value ? 0.5 : 1
    );
    if (!data.locs[id]) return;

    const [x, y] = data.locs[id]!;
    ox = (-x + data.width / 2 - 5) * scale;
    oy = (-y + data.height / 2 - 5) * scale;
}

// -------------------- 键盘事件

function keyup(e: KeyboardEvent) {
    const c = keycode(e.keyCode);
    if (c === KeyCode.Enter || c === KeyCode.Space || c === KeyCode.KeyC) fly();
    if (c === KeyCode.Escape || c === KeyCode.KeyX || c === KeyCode.KeyG) {
        exit();
    }
    if (!tradition.value) {
        if (c === KeyCode.LeftArrow) changeFloorByDir('left');
        if (c === KeyCode.RightArrow) changeFloorByDir('right');
        if (c === KeyCode.UpArrow) changeFloorByDir('up');
        if (c === KeyCode.DownArrow) changeFloorByDir('down');
        if (c === KeyCode.PageUp) changeFloorByDelta(1);
        if (c === KeyCode.PageDown) changeFloorByDelta(-1);
    } else {
        if (c === KeyCode.UpArrow) changeFloorByDelta(1);
        if (c === KeyCode.DownArrow) changeFloorByDelta(-1);
        if (c === KeyCode.LeftArrow) changeFloorByDelta(-10);
        if (c === KeyCode.RightArrow) changeFloorByDelta(10);
        if (c === KeyCode.PageUp) changeFloorByDelta(10);
        if (c === KeyCode.PageDown) changeFloorByDelta(-10);
    }
}

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
    mapCtx = map.getContext('2d')!;
    thumb = document.getElementById('fly-thumbnail') as HTMLCanvasElement;
    thumbCtx = thumb.getContext('2d')!;

    const antiAliasing = core.getLocalStorage('antiAliasing', true);

    const mapStyle = getComputedStyle(map);
    const thumbStyle = getComputedStyle(thumb);
    map.width = parseFloat(mapStyle.width) * devicePixelRatio;
    map.height = parseFloat(mapStyle.height) * devicePixelRatio;
    thumb.width = parseFloat(thumbStyle.width) * devicePixelRatio;
    thumb.height = parseFloat(thumbStyle.width) * devicePixelRatio;

    if (!antiAliasing) {
        requestAnimationFrame(() => {
            thumb.classList.add('no-anti-aliasing');
            thumbCtx.imageSmoothingEnabled = false;
        });
    }

    Array.from(document.getElementsByClassName('fly-settings')).forEach(v => {
        v.addEventListener('click', e => (v as HTMLElement).blur());
    });

    locateMap(nowFloor.value);
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

    await sleep(50);
    if (core.plugin.transition.value) await sleep(600);

    document.addEventListener('keyup', keyup);
    map.addEventListener('touchstart', touchdown);
    map.addEventListener('touchend', touchup);
    map.addEventListener('touchend', touchmove);
});

onUnmounted(() => {
    cancelGlobalDrag(drag);
    document.removeEventListener('keyup', keyup);
});
</script>

<style lang="less" scoped>
#fly {
    width: 100%;
    height: 100%;
    font-size: 2.7vh;
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
}

#fly-tools {
    margin: 0;
    width: 80%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
}

#fly-thumbnail {
    width: 35vw;
    height: 35vw;
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

@media screen and (max-width: 600px) {
    #fly {
        padding: 5%;
        font-size: 3.8vw;
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
