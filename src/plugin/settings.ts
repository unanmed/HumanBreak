import { ref, watch } from 'vue';

/**
 * 打开和关闭ui时是否展示动画
 */
export const transition = ref(false);

/**
 * 道具详细信息
 */
export const itemDetail = ref(true);

/**
 * 自动切换技能
 */
export const autoSkill = ref(true);

/**
 * 自动放缩
 */
export const autoScale = ref(true);

/**
 * 是否在地图上展示范围光环
 */
export const showHalo = ref(true);

/**
 * 是否展示已学习的技能
 */
export const showStudied = ref(true);

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

watch(autoScale, n => {
    core.setLocalStorage('autoScale', n);
});

watch(showStudied, n => {
    core.setLocalStorage('showStudied', n);
});

watch(showHalo, n => {
    core.setLocalStorage('showHalo', n);
});

/**
 * 重置设置信息，从localStorage读取即可
 */
function reset() {
    const t = core.getLocalStorage('transition', false);
    transition.value = t;
    core.plugin.transition.value = transition.value;
    autoScale.value = core.getLocalStorage('autoScale', true);
    showStudied.value = core.getLocalStorage('showStudied', true);
    showHalo.value = core.getLocalStorage('showHalo', true);
}

function resetFlag() {
    flags.autoSkill ??= true;
    flags.itemDetail ??= true;

    itemDetail.value = flags.itemDetail ? true : false;
    autoSkill.value = flags.autoSkill ? true : false;
}

export default function init() {
    return { resetSettings: reset, resetFlagSettings: resetFlag };
}
