<template>
    <div id="marked-enemy">
        <Box
            v-model:left="boxPos.left"
            v-model:top="boxPos.top"
            v-model:width="boxPos.width"
            v-model:height="boxPos.height"
            :resizable="true"
            :dragable="true"
        >
            <Scroll class="box-scroll" :no-scroll="true">
                <div class="marked-main">
                    <div class="marked-info">
                        <BoxAnimate
                            :id="enemy.id"
                            :width="24"
                            :height="24"
                        ></BoxAnimate>
                        <span class="marked-name marked-item">{{
                            getName()
                        }}</span>
                    </div>
                    <span class="marked-damage marked-item"
                        >伤害：{{ format(info.damage) }}</span
                    >
                    <span class="marked-critical marked-item"
                        >临界：{{ format(info.critical) }}</span
                    >
                    <span class="marked-critical-damage marked-item"
                        >减伤：{{ format(info.criticalDam) }}</span
                    >
                    <span class="marked-def marked-item"
                        >{{ ratio }}防：{{ format(info.defDamage) }}</span
                    >
                    <div class="marked-button">
                        <span
                            class="marked-hide button-text"
                            @click.stop="hidden = true"
                            >隐藏盒子</span
                        >
                        <span
                            class="marked-cancel button-text"
                            @click.stop="unmarkEnemy(enemy.id)"
                            >取消标记</span
                        >
                    </div>
                </div></Scroll
            >
        </Box>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { MarkInfo, unmarkEnemy } from '../plugin/mark';
import Box from '../components/box.vue';
import Scroll from '../components/scroll.vue';
import BoxAnimate from '../components/boxAnimate.vue';
import { GameUi } from '@/core/main/custom/ui';
import { fixedUi } from '@/core/main/init/ui';

const props = defineProps<{
    num: number;
    ui: GameUi;
    enemy: MarkInfo<EnemyIds>;
}>();

interface BoxPos {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface MarkedEnemy {
    damage: number;
    critical: number;
    criticalDam: number;
    defDamage: number;
}

const enemy = props.enemy;
const ratio = core.status.thisMap?.ratio ?? 1;

const format = core.formatBigNumber;

const boxPos = reactive<BoxPos>({
    left: window.innerWidth - 300,
    top: 100,
    width: 200,
    height: 150
});
const info = reactive<MarkedEnemy>({
    damage: 0,
    critical: 0,
    criticalDam: 0,
    defDamage: 0
});

const hidden = ref(false);

watch(hidden, n => {
    if (n) fixedUi.close(props.num);
});
watch(enemy.update, update);

function update() {
    info.damage = enemy.enemy.calDamage().damage;
    const critical = enemy.enemy.calCritical()[0];
    info.critical = critical?.atkDelta ?? 0;
    info.criticalDam = critical.delta ?? 0;
    info.defDamage = enemy.enemy.calDefDamage(ratio).delta;
}

function getName() {
    return enemy.enemy.enemy.name;
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
    padding: 1vh 0;
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
