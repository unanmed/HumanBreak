import { ref, watch } from 'vue';

/**
 * 打开和关闭ui时是否展示动画
 */
export const transition = ref(true);

watch(transition, n => {
    core.plugin.transition.value = n;
    core.setLocalStorage('transition', n);
});

window.addEventListener('load', () => {
    transition.value = core.getLocalStorage('transition');
});
