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
import { splitText } from '../plugin/utils';
import Colomn from '../components/colomn.vue';
import { GameUi } from '@/core/main/custom/ui';
import { gameKey } from '@/core/main/init/hotkey';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

type DescKey = keyof typeof desc;

const selected = ref(Object.keys(desc)[0] as DescKey);

function exit() {
    mota.ui.main.close(props.num);
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

gameKey.use(props.ui.symbol);
gameKey
    .realize('exit', () => {
        exit();
    })
    .realize('desc', () => {
        exit();
    });
</script>

<style lang="less" scoped>
#desc-list {
    display: flex;
    flex-direction: column;
}

.desc-item[show='false'] {
    margin: 0;
    padding: 0;
}
</style>
