<!-- 怪物手册ui -->
<template>
    <div id="book">
        <div v-if="enemy.length === 0" id="none">
            <div>本层无怪物</div>
        </div>
        <Scroll
            v-else
            style="width: 100%; height: 100%; font-family: normal"
            v-model:now="scroll"
            v-model:drag="drag"
        >
            <div v-for="(e, i) of enemy" class="enemy">
                <EnemyOne :enemy="e" @select="select(e, i)"></EnemyOne>
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
import { onMounted, ref } from 'vue';
import EnemyOne from '../components/enemyOne.vue';
import Scroll from '../components/scroll.vue';
import { getDamageColor } from '../plugin/utils';
import BookDetail from './bookDetail.vue';

const floorId = core.floorIds[core.status.event?.ui] ?? core.status.floorId;
const enemy = core.getCurrentEnemys(floorId);

const scroll = ref(0);
const drag = ref(false);
const detail = ref(false);

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
    v.damageColor = getDamageColor(v.damage);
});

onMounted(() => {
    const div = document.getElementById('book') as HTMLDivElement;
    div.style.opacity = '1';
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

async function hide() {
    const div = document.getElementById('book') as HTMLDivElement;
    div.style.opacity = '0';
    await sleep(600);
    div.style.display = 'none';
}

async function closeDetail() {
    show();
    await sleep(600);
    detail.value = false;
}

async function show() {
    const div = document.getElementById('book') as HTMLDivElement;
    div.style.display = 'block';
    await sleep(50);
    div.style.opacity = '1';
}
</script>

<style lang="less" scoped>
#book {
    opacity: 0;
    user-select: none;
    width: 80%;
    height: 100%;
    font-family: 'normal';
    overflow: hidden;
    transition: opacity 0.6s linear;
}

@media screen and (max-width: 600px) {
    #book {
        width: 100%;
        padding: 5% 0 5% 5%;
    }
}

#none {
    width: 100%;
    height: 100%;
    font-size: 10vw;
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
</style>
