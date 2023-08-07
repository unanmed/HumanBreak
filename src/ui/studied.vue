<template>
    <div id="studied">
        <Box
            :resizable="true"
            :dragable="true"
            v-model:width="width"
            v-model:height="height"
            v-model:left="left"
            v-model:top="top"
        >
            <Scroll :no-scroll="true" style="height: 100%">
                <div id="studied-main">
                    <div
                        v-for="(num, i) of studied"
                        :key="i"
                    ></div></div></Scroll
        ></Box>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUpdated, reactive, ref, watch } from 'vue';
import Box from '../components/box.vue';
import { status } from '../plugin/ui/statusBar';
import { RightOutlined } from '@ant-design/icons-vue';
import Scroll from '../components/scroll.vue';

watch(status, n => {});

let main: HTMLDivElement;

const width = ref(200);
const height = ref(0);
const left = ref(window.innerWidth - 300);
const top = ref(window.innerHeight - 300);

const folded = reactive<boolean[]>([]);

const studied = computed(() => {
    status.value;
    return core.status.hero.special?.num ?? [];
});

const last = computed(() => {
    status.value;
    return core.status.hero.special?.last ?? [];
});

async function calHeight() {
    await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
            const style = getComputedStyle(main);
            height.value = parseFloat(style.height);
            resolve();
        });
    });
}

onUpdated(() => {
    calHeight();
});

onMounted(() => {
    main = document.getElementById('studied-main') as HTMLDivElement;
    calHeight();
});
</script>

<style lang="less" scoped>
#studied {
    font-family: 'normal';
    font-size: 1vw;
}

#studied-fold {
    transition: transform 0.2s ease-out;
}

#studied-fold.folded {
    transform: rotate(90deg);
}
</style>
