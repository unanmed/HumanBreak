<template>
    <div id="non-ui">
        <StatusBar v-if="showStatusBar"></StatusBar>
        <MarkedEnemy v-if="showMarkedEnemy"></MarkedEnemy>
        <Chapter v-if="chapterShowed" :chapter="chapterContent"></Chapter>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import StatusBar from './ui/statusBar.vue';
import { showStatusBar } from './plugin/uiController';
import MarkedEnemy from './ui/markedEnemy.vue';
import Chapter from './ui/chapter.vue';
import { chapterContent, chapterShowed } from './plugin/ui/chapter';
import { showMarkedEnemy } from './plugin/mark';
</script>

<style lang="less" scoped>
#non-ui {
    width: 0;
    height: 0;
    overflow: visible;
}
</style>
