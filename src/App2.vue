<template>
    <div id="non-ui">
        <StatusBar v-if="showStatusBar"></StatusBar>
        <MarkedEnemy v-if="showMarkedEnemy && showStatusBar"></MarkedEnemy>
        <Studied
            v-if="showStudiedSkill && showStatusBar && showStudied"
        ></Studied>
        <Chapter v-if="chapterShowed" :chapter="chapterContent"></Chapter>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import StatusBar from './ui/statusBar.vue';
import { showStatusBar, showStudiedSkill } from './plugin/uiController';
import MarkedEnemy from './ui/markedEnemy.vue';
import Chapter from './ui/chapter.vue';
import { chapterContent, chapterShowed } from './plugin/ui/chapter';
import { showMarkedEnemy } from './plugin/mark';
import Studied from './ui/studied.vue';
import { showStudied } from './plugin/settings';
</script>

<style lang="less" scoped>
#non-ui {
    width: 0;
    height: 0;
    overflow: visible;
}
</style>
