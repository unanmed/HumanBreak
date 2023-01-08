<template>
    <div id="marked-enemy">
        <div v-for="v of all">
            <Box
                :key="v"
                v-if="!getBoxPos(v).hidden"
                v-model:left="getBoxPos(v).left"
                v-model:top="getBoxPos(v).top"
                v-model:width="getBoxPos(v).width"
                v-model:height="getBoxPos(v).height"
                :resizable="true"
                :dragable="true"
            >
                <Scroll class="box-scroll" :no-scroll="true">
                    <div class="marked-main">
                        <div class="marked-info">
                            <BoxAnimate
                                :id="v"
                                :width="24"
                                :height="24"
                            ></BoxAnimate>
                            <span class="marked-name marked-item">{{
                                getName(v)
                            }}</span>
                        </div>
                        <span class="marked-damage marked-item"
                            >伤害：{{ getDamage(v) }}</span
                        >
                        <span class="marked-critical marked-item"
                            >临界：{{ getCritical(v)[0] }}</span
                        >
                        <span class="marked-critical-damage marked-item"
                            >减伤：{{ getCritical(v)[1] }}</span
                        >
                        <span class="marked-def marked-item"
                            >{{ ratio }}防：{{ getDefDamage(v) }}</span
                        >
                        <div class="marked-button">
                            <span
                                class="marked-hide button-text"
                                @click.stop="getBoxPos(v).hidden = true"
                                >隐藏盒子</span
                            >
                            <span
                                class="marked-cancel button-text"
                                @click.stop="unmarkEnemy(v)"
                                >取消标记</span
                            >
                        </div>
                    </div></Scroll
                >
            </Box>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { checkMarkedStatus, getMarkedEnemy, unmarkEnemy } from '../plugin/mark';
import { has } from '../plugin/utils';
import Box from '../components/box.vue';
import Scroll from '../components/scroll.vue';
import BoxAnimate from '../components/boxAnimate.vue';

interface BoxPos {
    left: number;
    top: number;
    width: number;
    height: number;
    hidden: boolean;
}

const ratio = core.status.thisMap?.ratio ?? 1;

let all = getMarkedEnemy();

watch(checkMarkedStatus, update);

const boxPos = reactive<Partial<Record<EnemyIds, BoxPos>>>({});

function update() {
    all.push(...all.splice(0, all.length));
    for (const id in boxPos) {
        if (!all.includes(id as EnemyIds)) delete boxPos[id as EnemyIds];
    }
}

function getBoxPos(id: EnemyIds) {
    if (has(boxPos[id])) return boxPos[id]!;
    boxPos[id] = {
        left: window.innerWidth - 300,
        top: 100,
        width: 200,
        height: 150,
        hidden: false
    };
    return boxPos[id]!;
}

function getName(id: EnemyIds) {
    return core.material.enemys[id].name;
}

function getDamage(id: EnemyIds) {
    return (
        core.formatBigNumber(
            core.getDamageInfo(id, void 0, void 0, void 0, 'empty')?.damage
        ) ?? '???'
    );
}

function getCritical(id: EnemyIds) {
    return (
        core
            .nextCriticals(id, 1, void 0, void 0, 'empty')[0]
            ?.map(v => core.formatBigNumber(v)) ?? [0, 0]
    );
}

function getDefDamage(id: EnemyIds) {
    return core.formatBigNumber(
        core.getDefDamage(id, ratio, void 0, void 0, 'empty')
    );
}
</script>

<style lang="less" scoped>
#marked-enemy {
    width: 100%;
    height: 100%;
}

.box-scroll {
    height: 100%;
    width: 100%;
}

.marked-main {
    padding: 1vh 0 1vh 0;
    background-color: #0009;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.marked-info {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.marked-item {
    margin-left: 10%;
}

.marked-button {
    align-self: center;
    width: 80%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
}
</style>
