<!-- 怪物手册ui -->
<template>
    <div id="book">
        <div id="tools">
            <span id="back" class="button-text tools" @click="exit"
                ><left-outlined />返回游戏</span
            >
        </div>
        <div v-if="enemy.length === 0" id="none">
            <div>本层无怪物</div>
        </div>
        <Scroll
            v-else
            style="width: 100%; height: 94%; font-family: normal"
            v-model:now="scroll"
            v-model:drag="drag"
        >
            <div v-for="(e, i) of enemy" class="enemy">
                <EnemyOne
                    :selected="i === selected"
                    :enemy="e"
                    :key="i"
                    @select="select(e, i)"
                    @hover="selected = i"
                ></EnemyOne>
                <a-divider
                    dashed
                    style="width: 100%; border-color: #ddd4"
                ></a-divider>
            </div>
        </Scroll>
    </div>
    <BookDetail v-if="detail" @close="closeDetail()"></BookDetail>
</template>

<script setup lang="tsx">
import { cloneDeep } from 'lodash';
import { sleep } from 'mutate-animate';
import { onMounted, onUnmounted, ref } from 'vue';
import EnemyOne from '../components/enemyOne.vue';
import Scroll from '../components/scroll.vue';
import { getDamageColor, has, keycode } from '../plugin/utils';
import BookDetail from './bookDetail.vue';
import { LeftOutlined } from '@ant-design/icons-vue';
import { KeyCode } from '../plugin/keyCodes';
import { noClosePanel } from '../plugin/uiController';

const floorId =
    // @ts-ignore
    core.floorIds[core.status.event?.ui?.index] ?? core.status.floorId;
// 清除浏览地图时的光环缓存
if (floorId !== core.status.floorId && core.status.checkBlock) {
    // @ts-ignore
    core.status.checkBlock.cache = {};
}

const enemy = core.getCurrentEnemys(floorId);

const scroll = ref(0);
const drag = ref(false);
const detail = ref(false);
const selected = ref(0);

// 解析
enemy.forEach(v => {
    const l = v.specialText.length;
    v.toShowSpecial = cloneDeep(v.specialText);
    v.toShowColor = cloneDeep(v.specialColor);
    if (l >= 3) {
        v.toShowSpecial = v.specialText.slice(0, 2).concat(['...']);
        v.toShowColor = v.specialColor.slice(0, 2).concat(['#fff']);
    }
    v.toShowColor = v.toShowColor.map(v => {
        if (typeof v === 'string') return v;
        else return core.arrayToRGBA(v);
    });
    v.damageColor = getDamageColor(v.damage!);
});

/**
 * 选择怪物，展示详细信息
 * @param enemy 选择的怪物
 * @param index 选择的怪物索引
 */
function select(enemy: Enemy & DetailedEnemy, index: number) {
    if (drag.value) return;
    const h = window.innerHeight;
    const y = index * h * 0.2 - scroll.value;
    core.plugin.bookDetailEnemy = enemy;
    core.plugin.bookDetailPos = y;
    detail.value = true;
    hide();
}

/**
 * 隐藏怪物手册
 */
async function hide() {
    const div = document.getElementById('book') as HTMLDivElement;
    div.style.opacity = '0';
    await sleep(600);
    div.style.display = 'none';
}

/**
 * 关闭详细信息
 */
async function closeDetail() {
    show();
    await sleep(600);
    detail.value = false;
}

/**
 * 显示怪物手册
 */
async function show() {
    const div = document.getElementById('book') as HTMLDivElement;
    div.style.display = 'flex';
    await sleep(50);
    div.style.opacity = '1';
}

/**
 * 退出怪物手册
 */
async function exit() {
    noClosePanel.value = true;
    core.plugin.bookOpened.value = false;
    if (core.plugin.transition.value) await sleep(650);
    else await sleep(100);
    if (core.events.recoverEvents(core.status.event.interval)) {
        return;
    } else if (has(core.status.event.ui)) {
        core.status.boxAnimateObjs = [];
        // @ts-ignore
        core.ui._drawViewMaps(core.status.event.ui);
    } else core.ui.closePanel();
}

function checkScroll() {
    const h = window.innerHeight;
    const y = selected.value * h * 0.2 - scroll.value;
    if (y < 0) {
        scroll.value += y - 20;
    }
    if (y > h * 0.655) {
        scroll.value += y - h * 0.655 + 20;
    }
}

/**
 * 键盘松开时
 */
function keyup(e: KeyboardEvent) {
    const c = keycode(e.keyCode);
    if (c === KeyCode.KeyX || c === KeyCode.Escape) {
        exit();
    }
    if (c === KeyCode.Enter && !detail.value) {
        select(enemy[selected.value], selected.value);
    }
}

/**
 * 键盘按下时
 */
function keydown(e: KeyboardEvent) {
    const c = keycode(e.keyCode);
    if (!detail.value) {
        if (c === KeyCode.DownArrow) {
            if (selected.value < enemy.length - 1) {
                selected.value++;
            }
            checkScroll();
        }
        if (c === KeyCode.UpArrow) {
            if (selected.value > 0) {
                selected.value--;
            }
            checkScroll();
        }
        // 一次移动5个怪物
        if (c === KeyCode.LeftArrow || c === KeyCode.PageUp) {
            if (selected.value <= 4) {
                selected.value = 0;
            } else {
                selected.value -= 5;
            }
            checkScroll();
        }
        if (c === KeyCode.RightArrow || c === KeyCode.PageDown) {
            if (selected.value >= enemy.length - 5) {
                selected.value = enemy.length - 1;
            } else {
                selected.value += 5;
            }
            checkScroll();
        }
    }
}

onMounted(async () => {
    const div = document.getElementById('book') as HTMLDivElement;
    if (core.plugin.transition.value) await sleep(600);
    else await sleep(50);
    document.addEventListener('keyup', keyup);
    document.addEventListener('keydown', keydown);
});

onUnmounted(async () => {
    document.removeEventListener('keyup', keyup);
    document.removeEventListener('keydown', keydown);
});
</script>

<style lang="less" scoped>
#book {
    user-select: none;
    width: 80%;
    height: 100%;
    font-family: 'normal';
    overflow: hidden;
    transition: opacity 0.6s linear;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

#tools {
    height: 6%;
    font-size: 3.2vh;
}

.tools {
    border-bottom: 1px solid #ddd4;
}

#none {
    width: 100%;
    height: 100%;
    font-size: 6vw;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'normal';
}

.enemy {
    display: flex;
    flex-direction: column;
    height: 20vh;
    width: 100%;
    padding: 0 1% 0 1%;
}

@media screen and (max-width: 600px) {
    #book {
        width: 100%;
        padding: 5% 0 5% 5%;
    }
}
</style>
