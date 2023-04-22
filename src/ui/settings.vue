<template>
    <Column :width="60" :height="60" @close="exit"
        ><template #left
            ><div id="setting-list">
                <span
                    class="selectable"
                    :selected="selected === 'fullscreen'"
                    @click="click('fullscreen')"
                    >全屏游戏:&nbsp;&nbsp;&nbsp;{{
                        fullscreen ? 'ON' : 'OFF'
                    }}</span
                >
                <span
                    class="selectable"
                    :selected="selected === 'transition'"
                    @click="click('transition')"
                    >界面动画:&nbsp;&nbsp;&nbsp;{{
                        transition ? 'ON' : 'OFF'
                    }}</span
                >
                <span
                    class="selectable"
                    :selected="selected === 'itemDetail'"
                    @click="click('itemDetail')"
                    >宝石血瓶显伤:&nbsp;&nbsp;&nbsp;{{
                        itemDetail ? 'ON' : 'OFF'
                    }}</span
                >
                <span
                    class="selectable"
                    :selected="selected === 'autoSkill'"
                    @click="click('autoSkill')"
                    >自动切换技能:&nbsp;&nbsp;&nbsp;{{
                        autoSkill ? 'ON' : 'OFF'
                    }}</span
                >
                <span
                    class="selectable"
                    :selected="selected === 'autoScale'"
                    @click="click('autoScale')"
                    >自动放缩:&nbsp;&nbsp;&nbsp;{{
                        autoScale ? 'ON' : 'OFF'
                    }}</span
                >
                <span
                    class="selectable"
                    :selected="selected === 'showHalo'"
                    @click="click('showHalo')"
                    >展示范围光环:&nbsp;&nbsp;&nbsp;{{
                        showHalo ? 'ON' : 'OFF'
                    }}</span
                >
                <span
                    class="selectable"
                    :selected="selected === 'useFixed'"
                    @click="click('useFixed')"
                    >移动鼠标显示怪物信息:&nbsp;&nbsp;&nbsp;{{
                        useFixed ? 'ON' : 'OFF'
                    }}</span
                >
                <!-- <span
                    class="selectable"
                    :selected="selected === 'autoLocate'"
                    @click="click('autoLocate')"
                    >勇士自动定位:&nbsp;&nbsp;&nbsp;{{
                        autoLocate ? 'ON' : 'OFF'
                    }}</span
                > -->
                <span
                    class="selectable"
                    :selected="selected === 'antiAliasing'"
                    @click="click('antiAliasing')"
                    >抗锯齿:&nbsp;&nbsp;&nbsp;{{
                        antiAliasing ? 'ON' : 'OFF'
                    }}</span
                >
                <!-- <span
                    class="selectable"
                    :selected="selected === 'showStudied'"
                    v-if="core.plugin.skillTree.getSkillLevel(11) > 0"
                    @click="click('showStudied')"
                    >展示已学习技能:&nbsp;&nbsp;&nbsp;{{
                        showStudied ? 'ON' : 'OFF'
                    }}</span
                > -->
            </div></template
        >
        <template #right><span v-html="descText"></span></template
    ></Column>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import {
    transition,
    itemDetail,
    autoSkill,
    autoScale,
    showStudied,
    showHalo,
    useFixed,
    autoLocate,
    antiAliasing,
    fullscreen,
    triggerFullscreen
} from '../plugin/settings';
import settingInfo from '../data/settings.json';
import { has, splitText } from '../plugin/utils';
import Column from '../components/colomn.vue';

type Settings = typeof settingInfo;

const core = window.core;

const selected = ref<keyof Settings>('fullscreen');

fullscreen.value = !!document.fullscreenElement;

const descText = computed(() => {
    return splitText(settingInfo[selected.value].desc);
});

const settings: Record<keyof Settings, Ref<boolean>> = {
    transition,
    itemDetail,
    autoSkill,
    autoScale,
    showHalo,
    showStudied,
    useFixed,
    autoLocate,
    antiAliasing,
    fullscreen
};

const ignore: (keyof Settings)[] = ['fullscreen'];

function exit() {
    core.plugin.settingsOpened.value = false;
}

function click(id: keyof Settings) {
    if (selected.value !== id) {
        selected.value = id;
        return;
    }
    if (!ignore.includes(id)) {
        settings[id].value = !settings[id].value;
    } else {
        if (id === 'fullscreen') {
            triggerFullscreen();
        }
    }
}
</script>

<style lang="less" scoped>
#setting-list {
    display: flex;
    flex-direction: column;
}

.setting-item {
    width: 100%;
    padding: 1% 3% 1% 3%;
}
</style>
