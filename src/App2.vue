<template>
    <div id="non-ui">
        <StatusBar v-if="showStatusBar"></StatusBar>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import StatusBar from './ui/statusBar.vue';
import { showStatusBar } from './plugin/uiController';
</script>

<style lang="less" scoped>
#non-ui {
    width: 0;
    height: 0;
    overflow: visible;
}
</style>
