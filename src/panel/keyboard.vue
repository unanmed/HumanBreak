<template>
    <div class="keyboard-container">
        <div
            v-for="(key, i) of keyboard.keys"
            class="keyboard-item"
            @click="keyboard.emitKey(key, i)"
            :active="checkAssist(assist, key.key)"
            :style="{
                left: `${key.x * scale}px`,
                top: `${key.y * scale}px`,
                width: `${key.width * scale}px`,
                height: `${key.height * scale}px`
            }"
        >
            <span
                class="keyboard-key button-text"
                v-html="key.text ?? KeyCodeUtils.toString(key.key)"
            ></span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { checkAssist } from '@/core/main/custom/hotkey';
import { Keyboard } from '@/core/main/custom/keyboard';
import { KeyboardEmits } from '@/core/main/custom/keyboard';
import { mainSetting } from '@/core/main/setting';
import { KeyCodeUtils } from '@/plugin/keyCodes';
import { nextTick, onUnmounted, ref } from 'vue';

const props = defineProps<{
    keyboard: Keyboard;
}>();

const scale = mainSetting.getValue('screen.keyScale', 100) / 100;

const assist = ref(props.keyboard.assist);
const fontSize = `${props.keyboard.fontSize * scale}px`;

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

function onAssist() {
    nextTick(() => {
        assist.value = props.keyboard.assist;
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
    font-family: Arial;
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
    color: white;
}

.keyboard-item:hover,
.keyboard-item[active='true'] {
    background-color: #555;
}

.keyboard-item[active='true']::v-deep(> *) {
    color: gold;
    font-weight: 700;
}

.keyboard-key {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    text-overflow: clip;
    text-wrap: nowrap;
    overflow: hidden;
}
</style>
