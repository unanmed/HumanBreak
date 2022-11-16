<!-- 怪物手册ui -->
<template>
    <div id="book">
        <div v-if="enemy.length === 0" id="none">
            <div>本层无怪物</div>
        </div>
        <Scroll v-else style="width: 100%; height: 100%; font-family: normal">
            <div v-for="e of enemy" class="enemy">
                <EnemyOne :enemy="e"></EnemyOne>
                <a-divider
                    dashed
                    style="width: 100%; border-color: #ddd4"
                ></a-divider>
            </div>
        </Scroll>
    </div>
</template>

<script setup lang="tsx">
import { cloneDeep } from 'lodash';
import { onMounted } from 'vue';
import EnemyOne from '../components/enemyOne.vue';
import Scroll from '../components/scroll.vue';
import { getDamageColor } from '../plugin/utils';

const floorId = core.floorIds[core.status.event?.ui] ?? core.status.floorId;
const enemy = core.getCurrentEnemys(floorId);

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
</script>

<style lang="less" scoped>
#book {
    opacity: 0;
    background-color: #000d;
    transition: opacity 0.6s linear;
    user-select: none;
    width: 80%;
    height: 100%;
    font-family: 'normal';
    overflow: hidden;
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
