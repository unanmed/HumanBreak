<template>
    <!-- <div id="non-ui">
        <Start v-if="startOpened"></Start>
        <StatusBar v-if="showStatusBar"></StatusBar>
        <MarkedEnemy v-if="showMarkedEnemy && showStatusBar"></MarkedEnemy>
        <Studied
            v-if="showStudiedSkill && showStatusBar && showStudied"
        ></Studied> 
        <Fixed v-if="showStatusBar && useFixed"></Fixed>
        <Chapter v-if="chapterShowed" :chapter="chapterContent"></Chapter>
        <CompleteAchievement
            v-if="showComplete"
            :complete="completeAchi"
        ></CompleteAchievement>
    </div> -->
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { showStatusBar, startOpened } from './plugin/uiController';
import { chapterContent, chapterShowed } from './plugin/ui/chapter';
import { showMarkedEnemy } from './plugin/mark';
import { showComplete, completeAchi } from './plugin/ui/achievement';
import MarkedEnemy from './ui/markedEnemy.vue';
import StatusBar from './ui/statusBar.vue';
import Chapter from './ui/chapter.vue';
import Fixed from './ui/fixed.vue';
import Start from './ui/start.vue';
import CompleteAchievement from './ui/completeAchievement.vue';
import { mainSetting } from './core/main/setting';

const useFixed = ref(true);

mainSetting.on('valueChange', (key, n, o) => {
    if (key === 'action.fixed') useFixed.value = n as boolean;
});
</script>

<style lang="less" scoped>
#non-ui {
    width: 0;
    height: 0;
    overflow: visible;
    left: 0;
    top: 0;
}
</style>
