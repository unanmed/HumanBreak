<template>
    <div
        class="enemy-container"
        @click="select"
        @mousemove="enter"
        :selected="selected"
        :style="style"
    >
        <div class="info">
            <div class="leftbar">
                <span class="name">{{ enemy.enemy.enemy.name }}</span>
                <BoxAnimate
                    :id="enemy.enemy.id"
                    :width="isMobile ? 32 : w"
                    :height="isMobile ? 32 : w"
                    style="margin: 5%"
                ></BoxAnimate>
                <div
                    class="special-text"
                    v-if="has(enemy.special) && enemy.special.length > 0"
                >
                    <template v-for="(text, i) in enemy.showSpecial">
                        <span
                            v-if="i < (isMobile ? 1 : 2)"
                            :style="{ color: text[2] }"
                            >&nbsp;{{ text[0] }}&nbsp;</span
                        >
                        <span v-if="i === (isMobile ? 1 : 2)">...</span>
                    </template>
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
                                core.formatBigNumber(enemy.enemy.info.hp)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightcoral"
                            >攻击&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.enemy.info.atk)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightblue"
                            >防御&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.enemy.info.def)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightyellow"
                            >金币&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.enemy.enemy.money)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lawngreen"
                            >经验&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.enemy.enemy.exp)
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span :style="{ color: enemy.damageColor }"
                            >伤害&nbsp;&nbsp;&nbsp;&nbsp;{{
                                enemy.damage
                            }}</span
                        >
                    </div>

                    <div class="detail-info">
                        <span style="color: lightsalmon"
                            >临界&nbsp;&nbsp;&nbsp;&nbsp;{{
                                enemy.critical
                            }}</span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: lightpink"
                            >减伤&nbsp;&nbsp;&nbsp;&nbsp;<span
                                :style="{
                                    color: 'lightpink'
                                }"
                                >{{ enemy.criticalDam }}</span
                            ></span
                        >
                    </div>
                    <div class="detail-info">
                        <span style="color: cyan"
                            >{{
                                core.formatBigNumber(core.status.thisMap.ratio)
                            }}防&nbsp;&nbsp;&nbsp;&nbsp;{{
                                core.formatBigNumber(enemy.defDam)
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
import { ToShowEnemy } from '../plugin/ui/book';
import border from '@/data/enemyBorder.json';

const props = defineProps<{
    enemy: ToShowEnemy;
    selected?: boolean;
}>();

const emits = defineEmits<{
    (e: 'select'): void;
    (e: 'hover'): void;
}>();

const core = window.core;

const w = window.innerWidth * 0.032;

const style = border[props.enemy.enemy.enemy.id as keyof typeof border] ?? {};

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
    border-radius: 15px;
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

.enemy-container[selected='true'] {
    border: 1.5px solid gold;
}

.leftbar {
    width: 15%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 120%;
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
    font-size: 140%;
    width: 85%;
    height: 100%;
    padding: 1.5vh 0 1.5vh 0;

    .detail {
        display: flex;
        flex-direction: row;
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
        width: 80%;
        font-size: 85%;
    }

    .leftbar {
        width: 20%;
        font-size: 80%;
    }

    .enemy-container {
        border-radius: 20px;
    }
}
</style>
