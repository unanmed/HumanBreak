import { ref, watch } from 'vue';

/**
 * 打开和关闭ui时是否展示动画
 */
export const transition = ref(true);

/**
 * 道具详细信息
 */
export const itemDetail = ref(true);

/**
 * 自动切换技能
 */
export const autoSkill = ref(true);

watch(transition, n => {
    core.plugin.transition.value = n;
    core.setLocalStorage('transition', n);
});

watch(itemDetail, n => {
    flags.itemDetail = n;
    core.updateStatusBar();
});

watch(autoSkill, n => {
    flags.autoSkill = n;
    core.updateStatusBar();
    core.status.route.push(`set:autoSkill:${n}`);
});

/**
 * 重置设置信息，从localStorage读取即可
 */
function reset() {
    transition.value = core.getLocalStorage('transition');
}

function resetFlag() {
    itemDetail.value = flags.itemDetail;
    autoSkill.value = flags.autoSkill;
}

export default function init() {
    return { resetSettings: reset, resetFlagSettings: resetFlag };
}
