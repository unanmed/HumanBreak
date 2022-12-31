<!-- 怪物详细信息 -->
<template>
    <div id="detail">
        <div id="info" :style="{ top: `${top}px` }">
            <EnemyOne :enemy="enemy"></EnemyOne>
            <a-divider
                dashed
                style="margin: 2vh 0 2vh 0; border-color: #ddd4; width: 100%"
            ></a-divider>
        </div>
        <Transition name="detail">
            <EnemySpecial v-if="panel === 'special'"></EnemySpecial>
            <EnemyCritical v-else-if="panel === 'critical'"></EnemyCritical>
            <EnemyTarget v-else-if="panel === 'target'"></EnemyTarget>
        </Transition>
        <div id="detail-more">
            <Transition name="detail">
                <div
                    id="special-more"
                    class="detial-more"
                    v-if="panel === 'special'"
                >
                    <span
                        id="enemy-target"
                        class="button-text more"
                        @click="changePanel($event, 'target')"
                        ><LeftOutlined /> 怪物更多信息</span
                    >
                    <span
                        id="critical-more"
                        class="button-text more"
                        @click="changePanel($event, 'critical')"
                        >详细临界信息 <right-outlined
                    /></span>
                </div>
                <div
                    id="special-more"
                    class="detial-more"
                    v-else-if="panel === 'critical'"
                >
                    <span
                        id="enemy-pos"
                        class="button-text more"
                        @click="changePanel($event, 'special')"
                        ><left-outlined /> 怪物特殊属性</span
                    >
                </div>
                <div
                    id="special-more"
                    class="detial-more"
                    v-else-if="panel === 'target'"
                >
                    <span></span>
                    <span
                        id="enemy-pos"
                        class="button-text more"
                        @click="changePanel($event, 'special')"
                        >怪物特殊属性 <RightOutlined
                    /></span>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import EnemyOne from '../components/enemyOne.vue';
import { useDrag } from '../plugin/use';
import EnemySpecial from '../panel/enemySpecial.vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import EnemyCritical from '../panel/enemyCritical.vue';
import { KeyCode } from '../plugin/keyCodes';
import { keycode } from '../plugin/utils';
import { sleep } from 'mutate-animate';
import EnemyTarget from '../panel/enemyTarget.vue';

const enemy = core.plugin.bookDetailEnemy;
const top = ref(core.plugin.bookDetailPos);
const panel = ref('special');

let detail: HTMLDivElement;

const emits = defineEmits<{
    (e: 'close'): void;
}>();

function changePanel(e: MouseEvent, to: string) {
    e.stopPropagation();
    panel.value = to;
}

function close() {
    top.value = core.plugin.bookDetailPos;
    detail.style.opacity = '0';
    emits('close');
}

function key(e: KeyboardEvent) {
    if (keycode(e.keyCode) === KeyCode.Enter) {
        close();
    }
}

onMounted(async () => {
    top.value = 0;
    detail = document.getElementById('detail') as HTMLDivElement;
    detail.style.opacity = '1';

    const style = getComputedStyle(detail);

    let moved = false;
    let pos = [0, 0];

    await sleep(600);

    useDrag(
        detail,
        (x, y) => {
            if ((x - pos[0]) ** 2 + (y - pos[1]) ** 2 >= 100) moved = true;
        },
        (x, y) => {
            pos = [x, y];
            if (y > (parseFloat(style.height) * 4) / 5) moved = true;
        },
        () => {
            if (moved === false && panel.value === 'special') {
                close();
            }
            moved = false;
        }
    );

    document.addEventListener('keyup', key);
});

onUnmounted(() => {
    document.removeEventListener('keyup', key);
});
</script>

<style lang="less" scoped>
#info {
    width: 100%;
    position: relative;
    transition: all 0.6s ease;
    height: 20vh;
    padding: 0 1% 0 1%;
    display: flex;
    flex-direction: column;
}

#detail {
    opacity: 0;
    position: absolute;
    left: 14%;
    font-family: 'normal';
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 72%;
    height: 90%;
    transition: all 0.6s ease;
    user-select: none;
}

#detail-more {
    position: absolute;
    margin-top: 3%;
    width: 100%;
    font-size: 3vh;
    bottom: 0;
}

.detial-more {
    position: absolute;
    width: 100%;
    bottom: 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.more {
    user-select: none;
}

.detail-enter-active,
.detail-leave-active {
    transition: all 0.6s ease;
}

.detail-enter-from,
.detail-leave-to {
    opacity: 0;
}

@media screen and (max-width: 600px) {
    #detail {
        width: 100%;
        height: 100%;
        padding: 5%;
        left: 0%;
    }

    #detail-more {
        font-size: 4vw;
        bottom: 5%;
        left: 5vw;
        width: 90vw;
    }
}
</style>
