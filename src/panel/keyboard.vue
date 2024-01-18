<template>
    <div class="keyboard-container"></div>
</template>

<script lang="ts" setup>
import { Keyboard } from '@/core/main/custom/keyboard';
import { KeyboardEmits } from '@/core/main/custom/keyboard';
import { ref } from 'vue';

const props = defineProps<{
    keyboard: Keyboard;
}>();

const [width, height] = (() => {
    const key = props.keyboard;
    const mw = Math.max(...key.keys.map(v => v.x));
    const mh = Math.max(...key.keys.map(v => v.y));

    return [mw, mh];
})();

const emits = defineEmits<{
    (e: 'keyup', data: KeyboardEmits): void;
}>();
</script>

<style lang="less" scoped>
.keyboard-container {
    width: v-bind(width);
    height: v-bind(height);
}
</style>
