<template>
    <div id="settings">
        <div id="tools">
            <span class="button-text tools" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
        </div>
        <div id="settings-main">
            <Scroll id="setting-left">
                <div id="setting-list">
                    <span
                        class="selectable setting-item"
                        :selected="selected === 'transition'"
                        @click="transition = !transition"
                        >界面动画:&nbsp;&nbsp;&nbsp;{{
                            transition ? 'ON' : 'OFF'
                        }}</span
                    >
                </div>
            </Scroll>
            <a-divider id="divider" type="vertical"></a-divider>
            <div id="setting-right">
                <Scroll style="height: 100%">
                    <span
                        v-if="descText.value.startsWith('!!html')"
                        v-html="descText.value"
                    ></span>
                    <span v-else>{{ descText.value }}</span>
                </Scroll>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { transition } from '../plugin/settings';
import settingInfo from '../data/settings.json';
import { type } from '../plugin/utils';
import Scroll from '../components/scroll.vue';
import { LeftOutlined } from '@ant-design/icons-vue';

type Settings = typeof settingInfo;

const selected = ref<keyof Settings>('transition');

const descText = computed(() => {
    return type(settingInfo[selected.value].desc);
});

function exit() {
    core.plugin.settingsOpened.value = false;
}
</script>

<style lang="less" scoped>
#settings {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'normal';
    font-size: 24px;
    user-select: none;
}

#settings-main {
    width: 60%;
    height: 60%;
    display: flex;
    flex-direction: row;
}

#setting-list {
    display: flex;
    flex-direction: column;
}

.setting-item {
    width: 100%;
    padding: 1% 3% 1% 3%;
}

#setting-left {
    flex-basis: 40%;
}

#setting-right {
    flex-basis: 60%;
}

#divider {
    height: 100%;
}

#tools {
    width: 100%;
    font-family: 'normal';
    font-size: 1.7em;
    height: 5vh;
    position: fixed;
    left: 10vw;
    top: 10vh;
}
</style>
