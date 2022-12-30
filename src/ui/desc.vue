<template>
    <Colomn @close="exit" :width="80" :height="80" :left="30" :right="70"
        ><template #left
            ><div id="desc-list">
                <span
                    v-for="(data, k) in desc"
                    class="selectable desc-item"
                    :selected="selected === k"
                    @click="selected = k"
                    >{{ data.text }}</span
                >
            </div></template
        >
        <template #right><span v-html="content"></span></template
    ></Colomn>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import desc from '../data/desc.json';
import { has, splitText } from '../plugin/utils';
import Colomn from '../components/colomn.vue';

type DescKey = keyof typeof desc;

const selected = ref(Object.keys(desc)[0] as DescKey);

function exit() {
    core.plugin.descOpened.value = false;
}

const content = computed(() => {
    return splitText(desc[selected.value].desc);
});
</script>

<style lang="less" scoped>
#desc-left {
    flex-basis: 30%;
}

#desc-list {
    display: flex;
    flex-direction: column;
}

.desc-item {
    padding: 1% 3% 1% 3%;
}
</style>
