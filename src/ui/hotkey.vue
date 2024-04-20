<template>
    <Column @close="close" :left="30">
        <template #left>
            <div id="hotkey-group">
                <span
                    class="hotkey-group-one selectable"
                    v-for="(name, group) of groupName"
                    :selected="selectedGroup === group"
                    @click="selectedGroup = group"
                >
                    {{ name }}
                </span>
            </div>
        </template>
        <template #right>
            <div id="hotkey-data">
                <div class="hotkey-one" v-for="(data, id) of show">
                    <span class="hotkey-one-name"> {{ data.name }} </span>
                    <div class="hotkey-one-set">
                        <span
                            v-for="key of data.keys"
                            class="hotkey-one-set-item"
                            :selected="
                                data.id === selectedKey.id &&
                                key.index === selectedKey.index
                            "
                            @click="select(data.id, key.index)"
                        >
                            {{ getKeyShow(key.key, key.assist) }}
                        </span>
                    </div>
                </div>
            </div>
        </template>
    </Column>
</template>

<script lang="ts" setup>
import { Hotkey } from '@/core/main/custom/hotkey';
import { GameUi } from '@/core/main/custom/ui';
import Column from '@/components/colomn.vue';
import { mainUi } from '@/core/main/init/ui';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { KeyCode, KeyCodeUtils } from '@/plugin/keyCodes';
import { generateBinary, keycode } from '@/plugin/utils';
import { cloneDeep } from 'lodash-es';
import { gameKey } from '@/core/main/init/hotkey';

interface HotkeyKeys {
    index: number;
    key: KeyCode;
    /** 从低到高依次为 `ctrl` `shift` `alt` */
    assist: number;
}

interface HotkeySetting {
    id: string;
    name: string;
    keys: HotkeyKeys[];
}

interface SelectedKey {
    id: string;
    index: number;
}

const props = defineProps<{
    num: number;
    ui: GameUi;
    hotkey: Hotkey;
}>();

const hotkey = props.hotkey;

function close() {
    mainUi.close(props.num);
}

const selectedGroup = ref('ui');
const keyData = generateData();
const show = computed(() => {
    return keyData[selectedGroup.value];
});
const groupName = cloneDeep(hotkey.groupName);
delete groupName.none;

const selectedKey: SelectedKey = reactive({
    id: 'none',
    index: -1
});

function generateData() {
    const res: Record<string, Record<string, HotkeySetting>> = {};

    for (const [group, data] of Object.entries(hotkey.groups)) {
        if (group === 'none') continue;
        res[group] = {};
        const d = res[group];
        data.forEach(v => {
            const split = v.split('_');
            const isMulti = /^\d+$/.test(split.at(-1)!);
            const id = isMulti ? split.slice(0, -1).join('_') : v;
            const index = isMulti ? parseInt(split.at(-1)!) : -1;

            const key = hotkey.data[v];
            d[id] ??= {
                id,
                name: isMulti
                    ? key.name.split('_').slice(0, -1).join('_')
                    : key.name,
                keys: reactive([])
            };
            d[id].keys.push({
                index,
                key: key.key,
                assist: generateBinary([key.ctrl, key.shift, key.alt])
            });
        });
    }

    return res;
}

function unwarpAssist(assist: number) {
    let res = '';
    if (assist & (1 << 0)) {
        res += 'Ctrl + ';
    }
    if (assist & (1 << 1)) {
        res += 'Shift + ';
    }
    if (assist & (1 << 2)) {
        res += 'Alt + ';
    }
    return res;
}

function getKeyShow(key: KeyCode, assist: number) {
    return (
        unwarpAssist(assist) +
        (key === KeyCode.Unknown ? '' : KeyCodeUtils.toString(key))
    );
}

function select(id: string, index: number) {
    selectedKey.id = id;
    selectedKey.index = index;
}

function keyup(e: KeyboardEvent) {
    if (selectedKey.id === 'none') return;
    e.preventDefault();
    const code = keycode(e.keyCode);

    const assist = generateBinary([e.ctrlKey, e.shiftKey, e.altKey]);
    const id =
        selectedKey.index === -1
            ? selectedKey.id
            : `${selectedKey.id}_${selectedKey.index}`;

    const key = keyData[selectedGroup.value][selectedKey.id].keys.find(
        v => v.index === selectedKey.index
    );

    if (key) {
        if (
            code === KeyCode.Ctrl ||
            code === KeyCode.Shift ||
            code === KeyCode.Alt ||
            code === KeyCode.Unknown
        ) {
            const data = hotkey.data[id];
            key.assist = generateBinary([data.ctrl, data.shift, data.alt]);
            key.key = data.key;
        } else {
            key.key = code;
            key.assist = assist;
            hotkey.set(id, code, assist);
        }
    }

    selectedKey.id = 'none';
    selectedKey.index = -1;
}

function keydown(e: KeyboardEvent) {
    if (selectedKey.id === 'none') return;
    e.preventDefault();
    const code = keycode(e.keyCode);
    const assist = generateBinary([e.ctrlKey, e.shiftKey, e.altKey]);
    const key = keyData[selectedGroup.value][selectedKey.id].keys.find(
        v => v.index === selectedKey.index
    );
    if (!key) return;
    key.assist = assist;
    key.key = KeyCode.Unknown;

    if (
        code !== KeyCode.Ctrl &&
        code !== KeyCode.Shift &&
        code !== KeyCode.Alt
    ) {
        key.key = code;
    }
}

// ban other keys
gameKey.disable();

onMounted(() => {
    document.addEventListener('keyup', keyup);
    document.addEventListener('keydown', keydown);
});

onUnmounted(() => {
    gameKey.enable();
    document.removeEventListener('keyup', keyup);
    document.removeEventListener('keydown', keydown);
});
</script>

<style lang="less" scoped>
#hotkey-group {
    display: flex;
    flex-direction: column;
}

.hotkey-group-one {
    margin: 0 0 4px 0;
}

.hotkey-one {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 0 3% 2% 3%;
    white-space: nowrap;
}

.hotkey-one-set {
    display: flex;
    flex-direction: column;
    width: 50%;
    text-overflow: clip;
    align-items: flex-end;
    text-align: end;

    .hotkey-one-set-item {
        background-color: #4446;
        padding: 0 5%;
        margin: 1% 0;
        width: 100%;
        border: 1px solid transparent;
    }

    .hotkey-one-set-item[selected='true'] {
        color: gold;
        border: 1px solid gold;
    }
}
</style>
