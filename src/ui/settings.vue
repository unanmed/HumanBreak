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
                        @click="click('transition')"
                        >界面动画:&nbsp;&nbsp;&nbsp;{{
                            transition ? 'ON' : 'OFF'
                        }}</span
                    >
                    <span
                        class="selectable setting-item"
                        :selected="selected === 'itemDetail'"
                        @click="click('itemDetail')"
                        >宝石血瓶显伤:&nbsp;&nbsp;&nbsp;{{
                            itemDetail ? 'ON' : 'OFF'
                        }}</span
                    >
                    <span
                        class="selectable setting-item"
                        :selected="selected === 'autoSkill'"
                        @click="click('autoSkill')"
                        >自动切换技能:&nbsp;&nbsp;&nbsp;{{
                            autoSkill ? 'ON' : 'OFF'
                        }}</span
                    >
                </div>
            </Scroll>
            <a-divider
                id="divider"
                :type="isMobile ? 'horizontal' : 'vertical'"
            ></a-divider>
            <div id="setting-right">
                <Scroll style="height: 100%">
                    <span v-html="descText"></span>
                </Scroll>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { transition, itemDetail, autoSkill } from '../plugin/settings';
import settingInfo from '../data/settings.json';
import { has } from '../plugin/utils';
import Scroll from '../components/scroll.vue';
import { LeftOutlined } from '@ant-design/icons-vue';
import { isMobile } from '../plugin/use';

type Settings = typeof settingInfo;

const selected = ref<keyof Settings>('transition');

const descText = computed(() => {
    return settingInfo[selected.value].desc
        .map((v, i, a) => {
            if (/^\d+\./.test(v)) return `${'&nbsp;'.repeat(12)}${v}`;
            else if (
                (has(a[i - 1]) && v !== '<br>' && a[i - 1] === '<br>') ||
                i === 0
            ) {
                return `${'&nbsp;'.repeat(8)}${v}`;
            } else return v;
        })
        .join('');
});

function exit() {
    core.plugin.settingsOpened.value = false;
}

function click(id: keyof Settings) {
    if (selected.value !== id) {
        selected.value = id;
        return;
    }
    if (id === 'transition') {
        transition.value = !transition.value;
    } else if (id === 'itemDetail') {
        itemDetail.value = !itemDetail.value;
    } else if (id === 'autoSkill') {
        autoSkill.value = !autoSkill.value;
    }
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
    font-size: 2.7vh;
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
    height: 100%;
}

#setting-right {
    flex-basis: 60%;
    height: 100%;
}

#divider {
    height: 100%;
}

#tools {
    width: 100%;
    font-family: 'normal';
    font-size: 3.2vh;
    height: 5vh;
    position: fixed;
    left: 10vw;
    top: 5vh;
}

@media screen and (max-width: 600px) {
    #settings-main {
        flex-direction: column;
        width: 90%;
        height: 75%;
    }

    #divider {
        height: auto;
        width: 100%;
        margin: 5% 0 5% 0;
    }

    #setting-left {
        height: 40%;
    }

    #setting-right {
        height: 50%;
    }
}
</style>
