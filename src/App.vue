<!-- 这里是vue的入口，在这里可以修改你的ui -->

<!-- 示例：显示一个响应式文字 -->

<template>
    <div id="root">
        <span @click="add" id="cnt"
            >点我自增&nbsp;&nbsp;&nbsp;&nbsp;{{ cnt }}</span
        >
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const cnt = ref(0);

/**
 * 点击后自增1
 */
function add() {
    cnt.value++;
}
</script>

<style lang="less" scoped>
#root {
    width: 100%;
    display: flex;
    justify-content: center;
}

#cnt {
    font-size: 3em;
    text-align: center;
    cursor: pointer;
    color: white;
}
</style>
