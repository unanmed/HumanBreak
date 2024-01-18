<template>
    <div class="keyboard-container">
        <div
            v-for="(key, i) of keyboard.keys"
            class="keyboard-item"
            @click="keyboard.emitKey(key, i)"
            :active="checkAssist(assist, key.key)"
            :style="{
                left: `${key.x}px`,
                top: `${key.y}px`,
                width: `${key.width}px`,
                height: `${key.height}px`
            }"
        >
            <span class="keyboard-key button-text">{{
                key.text ?? KeyCodeUtils.toString(key.key)
            }}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { checkAssist } from '@/core/main/custom/hotkey';
import { Keyboard } from '@/core/main/custom/keyboard';
import { KeyboardEmits } from '@/core/main/custom/keyboard';
import { KeyCodeUtils } from '@/plugin/keyCodes';
import { onUnmounted, ref } from 'vue';

const props = defineProps<{
    keyboard: Keyboard;
}>();

const assist = ref(props.keyboard.assist);
const fontSize = `${props.keyboard.fontSize}px`;

const [width, height] = (() => {
    const key = props.keyboard;
    let mw = 0;
    let mh = 0;
    for (const k of key.keys) {
        if (k.x + k.width > mw) mw = k.x + k.width;
        if (k.y + k.height > mh) mh = k.y + k.height;
    }

    return [`${mw}px`, `${mh}px`];
})();

function onAssist(_: any, ass: number) {
    new Promise<void>(res => {
        assist.value = ass;
        res();
    });
}
props.keyboard.on('emit', onAssist);

const emits = defineEmits<{
    (e: 'keyup', data: KeyboardEmits): void;
}>();

onUnmounted(() => {
    props.keyboard.off('emit', onAssist);
});
</script>

<style lang="less" scoped>
.keyboard-container {
    width: v-bind(width);
    height: v-bind(height);
    display: block;
    font-size: v-bind(fontSize);
    position: relative;
}

.keyboard-item {
    position: absolute;
    background-color: #222;
    border: 1.5px solid #ddd8;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.1s linear;
    cursor: pointer;
}

.keyboard-item:hover,
.keyboard-item[active='true'] {
    background-color: #555;
}

.keyboard-key[active='true'] {
    color: gold;
}

.keyboard-key {
    height: 100%;
    min-width: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    text-overflow: clip;
    text-wrap: nowrap;
    overflow: hidden;
}
</style>
