<!-- 怪物手册ui -->

<template>
    <Scroll>
        <div v-for="i of 100" class="test">test{{ i }}</div>
    </Scroll>
</template>

<script setup lang="tsx">
import Scroll from '../components/scroll.vue';

const floorId = core.floorIds[core.status.event?.ui] ?? core.status.floorId;
const enemy = core.getCurrentEnemys(floorId);
</script>

<style lang="less" scoped>
.test {
    color: white;
}
</style>
