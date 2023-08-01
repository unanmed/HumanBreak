<template>
    <Column @close="exit" :width="70" :height="70"
        ><template #left
            ><div id="skill-list">
                <span
                    v-for="(v, k) in skills"
                    class="selectable skill-item"
                    :selected="k === selected"
                    :selectable="skillOpened(k)"
                    @click="select(k)"
                    >{{ v.text }}</span
                >
            </div></template
        >
        <template #right><span v-html="content"></span></template
    ></Column>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import skills from '../data/skill.json';
import { has } from '../plugin/utils';
import Column from '../components/colomn.vue';

type Skills = keyof typeof skills;

const selected = ref<Skills>('none');

function skillOpened(skill: Skills) {
    return eval(skills[skill].opened) as boolean;
}

function select(skill: Skills) {
    if (!skillOpened(skill)) return;
    selected.value = skill;
}

const content = computed(() => {
    return eval(
        '`' +
            skills[selected.value].desc
                .map((v, i, a) => {
                    if (/^\d+\./.test(v)) return `${'&nbsp;'.repeat(12)}${v}`;
                    else if (
                        (has(a[i - 1]) &&
                            v !== '<br>' &&
                            a[i - 1] === '<br>') ||
                        i === 0
                    ) {
                        return `${'&nbsp;'.repeat(8)}${v}`;
                    } else return v;
                })
                .join('')
                .replace(
                    /level:(\d+)/g,
                    'core.plugin.skillTree.getSkillLevel($1)'
                ) +
            '`'
    );
});

function exit() {
    ancTe.plugin.ui.skillOpened.value = false;
}
</script>

<style lang="less" scoped>
#skill-list {
    display: flex;
    flex-direction: column;
}

.skill-item[selectable='false'] {
    color: gray;
}
</style>
