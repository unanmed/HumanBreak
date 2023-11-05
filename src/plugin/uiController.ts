import { ref } from 'vue';

// todo: 优化开启控制器

export const showStatusBar = ref(false);
export const showStudiedSkill = ref(false);
export const startOpened = ref(true);

export const transition = ref(true);
export const noClosePanel = ref(false);

export const startAnimationEnded = ref(false);

export default function init() {
    return {
        transition,
        showStatusBar,
        showStudiedSkill,
        startAnimationEnded
    };
}
