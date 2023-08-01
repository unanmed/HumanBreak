<template>
    <Colomn @close="exit" :width="60" :height="80" :left="30" :right="70"
        ><template #left>
            <div id="bgm-list">
                <span
                    v-for="(bgm, i) of list"
                    class="selectable"
                    :selected="selected === i"
                    @click="select(i)"
                >
                    {{ bgm!.area }}
                </span>
            </div></template
        >
        <template #right
            ><div>
                <div id="bgm-name">
                    <img id="bgm-image" :src="list[selected]!.img" />
                    <span>{{ name }}</span>
                    <span v-if="list[selected]!.from"
                        >出自&nbsp;&nbsp;&nbsp;&nbsp;{{
                            list[selected]!.from
                        }}</span
                    >
                </div>
                <span v-html="content"></span></div></template
    ></Colomn>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import Colomn from '../components/colomn.vue';
import bgm from '../data/bgm.json';
import { splitText } from '../plugin/utils';

interface Bgm {
    img: string;
    area: string;
    name: string;
    desc: string[];
    from?: string;
}

const list = bgm as Partial<Record<BgmIds, Bgm>>;

const selected = ref<BgmIds>('title.mp3');

const content = computed(() => {
    return eval('`' + splitText(list[selected.value]!.desc) + '`');
});
const name = computed(() => list[selected.value]!.name);

function exit() {
    ancTe.plugin.ui.bgmOpened.value = false;
}

function select(id: BgmIds) {
    selected.value = id;
}
</script>

<style lang="less" scoped>
#bgm-list {
    display: flex;
    flex-direction: column;
}

#bgm-name {
    display: flex;
    flex-direction: column;
    align-items: center;
}

#bgm-image {
    margin-top: 5%;
    border: 1px solid #fff;
    width: 33vw;
}

@media screen and (max-width: 600px) {
    #bgm-image {
        width: 70vw;
    }
}
</style>
