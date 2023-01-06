<template>
    <Colomn @close="exit" :width="80" :height="80" :left="30" :right="70"
        ><template #left
            ><div id="desc-list">
                <div
                    v-for="(data, k) in desc"
                    class="selectable desc-item"
                    :selected="selected === k"
                    :show="show(data.condition)"
                    @click="click(k)"
                >
                    <span v-if="show(data.condition)">{{ data.text }}</span>
                </div>
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
    return eval('`' + splitText(desc[selected.value].desc) + '`');
});

function click(key: DescKey) {
    if (!eval(desc[key].condition)) return;
    selected.value = key;
}

function show(condition: string) {
    return eval(condition);
}
</script>

<style lang="less" scoped>
#desc-left {
    flex-basis: 30%;
}

#desc-list {
    display: flex;
    flex-direction: column;
}

.desc-item[show='false'] {
    margin: 0;
    padding: 0;
}
</style>
