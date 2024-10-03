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
            <div v-for="(e, i) of toShow" class="enemy">
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
    <BookDetail
        v-if="detail"
        :from-book="true"
        @close="closeDetail()"
    ></BookDetail>
</template>

<script setup lang="tsx">
import { sleep } from 'mutate-animate';
import { onMounted, onUnmounted, ref } from 'vue';
import EnemyOne from '../components/enemyOne.vue';
import Scroll from '../components/scroll.vue';
import { getDamageColor, has, keycode } from '../plugin/utils';
import BookDetail from './bookDetail.vue';
import { LeftOutlined } from '@ant-design/icons-vue';
import { ToShowEnemy, detailInfo } from '../plugin/ui/book';
import { getDetailedEnemy } from '../plugin/ui/fixed';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/custom/hotkey';
import { mainUi } from '@/core/main/init/ui';
import { mainSetting } from '@/core/main/setting';
import { isMobile } from '@/plugin/use';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

const floorId =
    // @ts-ignore
    core.floorIds[core.status.event?.ui?.index] ?? core.status.floorId;

const enemy = core.getCurrentEnemys(floorId);
const toShow: ToShowEnemy[] = enemy.map(v =>
    getDetailedEnemy(v.enemy, floorId)
);

const scroll = ref(0);
const drag = ref(false);
const detail = ref(false);
const selected = ref(0);

const settingScale = mainSetting.getValue('ui.bookScale', 100) / 100;
const scale = isMobile
    ? Math.max(settingScale * 15, 20)
    : Math.max(
          (window.innerWidth / window.innerHeight) * 15 * settingScale,
          20
      );

/**
 * 选择怪物，展示详细信息
 * @param enemy 选择的怪物
 * @param index 选择的怪物索引
 */
function select(enemy: ToShowEnemy, index: number) {
    if (drag.value) return;
    const h = window.innerHeight;
    const y = index * h * 0.2 - scroll.value;
    detailInfo.enemy = enemy;
    detailInfo.pos = y;
    detail.value = true;
    hide();
}

/**
 * 隐藏怪物手册
 */
async function hide() {
    const div = document.getElementById('book') as HTMLDivElement;
    div.style.display = 'none';
}

/**
 * 关闭详细信息
 */
async function closeDetail() {
    show();
    detail.value = false;
}

/**
 * 显示怪物手册
 */
async function show() {
    const div = document.getElementById('book') as HTMLDivElement;
    div.style.display = 'flex';
}

/**
 * 退出怪物手册
 */
async function exit() {
    const hold = mainUi.holdOn();
    mainUi.close(props.num);
    if (core.events.recoverEvents(core.status.event.interval)) {
        hold.end(true);
        return;
    } else if (has(core.status.event.ui)) {
        core.status.boxAnimateObjs = [];
        // @ts-ignore
        core.ui._drawViewMaps(core.status.event.ui);
        hold.end(true);
    } else hold.end();
}

function checkScroll() {
    const h = window.innerHeight;
    const y = (selected.value * h * scale) / 100 - scroll.value;
    if (y < 0) {
        scroll.value += y - 20;
    }
    if (y > h * 0.655) {
        scroll.value += y - h * 0.655 + 20;
    }
}

// 按键控制
setTimeout(() => {
    gameKey.use(props.ui.symbol);
    gameKey
        .realize(
            '@book_up',
            () => {
                if (selected.value > 0) {
                    selected.value--;
                }
                checkScroll();
            },
            { type: 'down-repeat' }
        )
        .realize(
            '@book_down',
            () => {
                if (selected.value < enemy.length - 1) {
                    selected.value++;
                }
                checkScroll();
            },
            { type: 'down-repeat' }
        )
        .realize(
            '@book_pageDown',
            () => {
                if (selected.value >= enemy.length - 5) {
                    selected.value = enemy.length - 1;
                } else {
                    selected.value += 5;
                }
                checkScroll();
            },
            { type: 'down-repeat' }
        )
        .realize(
            '@book_pageUp',
            () => {
                if (selected.value <= 4) {
                    selected.value = 0;
                } else {
                    selected.value -= 5;
                }
                checkScroll();
            },
            { type: 'down-repeat' }
        )
        .realize('exit', () => {
            exit();
        })
        .realize('confirm', () => {
            select(toShow[selected.value], selected.value);
        });
}, 0);

onUnmounted(() => {
    gameKey.dispose(props.ui.symbol);
});
</script>

<style lang="less" scoped>
#book {
    user-select: none;
    width: 80%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

#tools {
    height: 6%;
    font-size: 3.2vh;
}

#none {
    width: 100%;
    height: 100%;
    font-size: 6vw;
    display: flex;
    justify-content: center;
    align-items: center;
}

.enemy {
    display: flex;
    flex-direction: column;
    height: v-bind('scale + "vh"');
    width: 100%;
    padding: 0 1% 0 1%;
}

@media screen and (max-width: 600px) {
    #tools {
        transform: translateY(-50%);
    }

    #book {
        width: 100%;
        padding: 5%;
    }

    .enemy {
        height: v-bind('scale * 2 / 3 + "vh"');
    }
}
</style>
