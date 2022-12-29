import { ref, watch } from 'vue';

/**
 * 打开和关闭ui时是否展示动画
 */
export const transition = ref(true);

watch(transition, n => {
    core.plugin.transition.value = n;
    core.setLocalStorage('transition', n);
});

/**
 * 重置设置信息，从localStorage读取即可
 */
function reset() {
    transition.value = core.getLocalStorage('transition');
}

export default function init() {
    return { resetSettings: reset };
}
