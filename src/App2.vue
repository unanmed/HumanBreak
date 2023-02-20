<template>
    <div id="non-ui">
        <Start v-if="startOpened"></Start>
        <StatusBar v-if="showStatusBar"></StatusBar>
        <MarkedEnemy v-if="showMarkedEnemy && showStatusBar"></MarkedEnemy>
        <Studied
            v-if="showStudiedSkill && showStatusBar && showStudied"
        ></Studied>
        <Fixed v-if="showStatusBar && useFixed"></Fixed>
        <Chapter v-if="chapterShowed" :chapter="chapterContent"></Chapter>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
    showStatusBar,
    showStudiedSkill,
    startOpened
} from './plugin/uiController';
import { chapterContent, chapterShowed } from './plugin/ui/chapter';
import { showMarkedEnemy } from './plugin/mark';
import { showStudied, useFixed } from './plugin/settings';
import MarkedEnemy from './ui/markedEnemy.vue';
import StatusBar from './ui/statusBar.vue';
import Chapter from './ui/chapter.vue';
import Studied from './ui/studied.vue';
import Fixed from './ui/fixed.vue';
import Start from './ui/start.vue';
</script>

<style lang="less" scoped>
#non-ui {
    width: 0;
    height: 0;
    overflow: visible;
}
</style>
