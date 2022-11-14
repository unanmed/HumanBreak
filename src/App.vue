<template>
    <div id="ui">
        <template v-for="com of uiStack">
            <component :is="com"></component>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { uiStack } from './plugin/uiController';
</script>

<style lang="less" scoped>
#ui {
    width: 90%;
    height: 90%;
    display: flex;
    justify-content: center;
    overflow: hidden;
}
</style>
