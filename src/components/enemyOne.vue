<template>
    <div
        class="enemy-container"
        @click="select"
        @mouseenter="enter"
        :selected="selected"
    >
        <div class="info">
            <div class="leftbar">
                <span class="name">{{ enemy.name }}</span>
                <BoxAnimate
                    :id="enemy.id"
                    :width="isMobile ? 32 : 50"
                    :height="isMobile ? 32 : 50"
                    style="margin: 5%"
                ></BoxAnimate>
                <div
                    class="special-text"
                    v-if="has(enemy.special) && enemy.special.length > 0"
                >
                    <span
                        v-for="(text, i) in enemy.toShowSpecial"
                        :style="{ color: enemy.toShowColor![i] }"
                        >&nbsp;{{ text }}&nbsp;</span
                    >
                </div>
                <div class="special-text" v-else>无属性</div>
            </div>
            <a-divider
                type="vertical"
                dashed
                style="height: 100%; margin: 0 3% 0 1%; border-color: #ddd4"
            ></a-divider>
            <div class="rightbar">
                <div class="detail">
                    <div class="detail-info">
                        <span style="color: lightgreen"
                            >生命&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.hp)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightcoral"
                            >攻击&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.atk)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightblue"
                            >防御&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.def)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightyellow"
                            >金币&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.money)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lawngreen"
                            >经验&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.money)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: cyan"
                            >{{
                                core.formatBigNumber(core.status.thisMap.ratio)
                            }}防&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.defDamage)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightsalmon"
                            >临界&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.critical)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightpink"
                            >减伤&nbsp;&nbsp;&nbsp;&nbsp;<span
                                :style="{
                                    color:
                                        enemy.criticalDamage < 0
                                            ? 'gold'
                                            : 'lightpink'
                                }"
                                >{{
                                    core.formatBigNumber(
                                        enemy.criticalDamage,
                                        false,
                                        enemy.criticalDamage < 0
                                    )
                                }}</span
                            ></span
                        >
                    </div>
                    <div class="detail-info">
                        <span :style="{color: enemy.damageColor!}"
                            >伤害&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.damage)
                            }}</span
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { has } from '../plugin/utils';
import BoxAnimate from '../components/boxAnimate.vue';
import { isMobile } from '../plugin/use';

const props = defineProps<{
    enemy: Enemy & DetailedEnemy;
    selected?: boolean;
}>();

const emits = defineEmits<{
    (e: 'select'): void;
    (e: 'hover'): void;
}>();

const core = window.core;

/**
 * 选择这个怪物时
 */
function select(e: MouseEvent) {
    emits('select');
}

function enter() {
    emits('hover');
}
</script>

<style lang="less" scoped>
.enemy-container {
    border: 1.5px solid transparent;
    border-radius: 20px;
    transition: all 0.2s linear;
    height: 100%;

    .info {
        flex-basis: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: stretch;
        height: 100%;
    }
}

.enemy-container:hover,
.enemy-container[selected='true'] {
    border: 1.5px solid gold;
    border-radius: 20px;
}

.leftbar {
    width: 15%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 2vh;
    padding-left: 1%;
}

.name {
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
}

.special-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-items: space-between;
}

.rightbar {
    font-size: 2.5vh;
    width: 100%;
    height: 100%;
    padding: 1.5vh 0 1.5vh 0;

    .detail {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        height: 100%;

        .detail-info {
            flex-basis: 33.3%;
            line-height: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
    }
}

@media screen and (max-width: 600px) {
    .rightbar {
        font-size: 4vw;
    }

    .leftbar {
        font-size: 2vw;
    }
}
</style>
