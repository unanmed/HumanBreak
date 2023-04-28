import { ref, watch } from 'vue';

// todo 优化，可以考虑改成reactive

/** 打开和关闭ui时是否展示动画 */
export const transition = ref(false);

/** 道具详细信息 */
export const itemDetail = ref(true);

/** 自动切换技能 */
export const autoSkill = ref(true);

/** 自动放缩 */
export const autoScale = ref(true);

/** 是否在地图上展示范围光环 */
export const showHalo = ref(true);

/** 是否展示已学习的技能 */
export const showStudied = ref(true);

/** 是否使用定点查看功能 */
export const useFixed = ref(true);

/** 是否使用勇士自动定位功能 */
export const autoLocate = ref(true);

/** 是否开启抗锯齿 */
export const antiAliasing = ref(true);

/** 是否开启全屏 */
export const fullscreen = ref(false);

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

watch(useFixed, n => {
    core.setLocalStorage('useFixed', n);
});

watch(autoLocate, n => {
    flags.autoLocate = n;
    core.updateStatusBar();
    core.status.route.push(`set:autoLocate:${n}`);
});

watch(antiAliasing, n => {
    core.setLocalStorage('antiAliasing', n);
    for (const canvas of core.dom.gameCanvas) {
        if (core.domStyle.hdCanvas.includes(canvas.id)) continue;
        if (n) {
            canvas.classList.remove('no-anti-aliasing');
        } else {
            canvas.classList.add('no-anti-aliasing');
        }
    }
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
    antiAliasing.value = core.getLocalStorage('antiAliasing', false);
    fullscreen.value = !!document.fullscreenElement;
}

function resetFlag() {
    flags.autoSkill ??= true;
    flags.itemDetail ??= true;
    flags.autoLocate ??= true;

    itemDetail.value = !!flags.itemDetail;
    autoSkill.value = !!flags.autoSkill;
    autoLocate.value = !!flags.autoLocate;
}

export async function triggerFullscreen() {
    const { maxGameScale } = core.plugin.utils;
    if (document.fullscreenElement) {
        await document.exitFullscreen();
        requestAnimationFrame(() => {
            maxGameScale(1);
        });
        fullscreen.value = false;
    } else {
        await document.body.requestFullscreen();
        requestAnimationFrame(() => {
            maxGameScale();
        });
        fullscreen.value = true;
    }
}

export default function init() {
    return { resetSettings: reset, resetFlagSettings: resetFlag };
}
