<template>
    <div id="status-bar"></div>
</template>

<script lang="ts" setup>
import { ref, shallowReactive, watch } from 'vue';
import { isMobile } from '../plugin/use';
import { status } from '../plugin/ui/statusBar';

const width = ref(isMobile ? window.innerWidth : 300);
const height = ref(isMobile ? 300 : window.innerHeight - 100);
const left = ref(isMobile ? 0 : 50);
const top = ref(50);
const hero = shallowReactive<Partial<HeroStatus>>({});
const floor = ref<string>();
/**
 * 要展示的勇士属性
 */
const toShow: (keyof NumbericHeroStatus)[] = [
    'hp', // 生命
    'atk', // 攻击
    'def', // 防御
    'mdef', // 智力
    'hpmax', // 生命回复
    'mana', // 额外攻击
    'money', // 金币
    'exp' // 经验
];

watch(status, update);

/**
 * 更新显示内容
 */
function update() {
    toShow.forEach(v => {
        hero[v] = core.getRealStatus(v);
    });
    floor.value = core.status.thisMap?.title;
}
</script>

<style lang="less" scoped>
#status-bar {
    width: 100%;
    height: 100%;
    position: fixed;
}
</style>
