<template>
    <div id="enemy-target">
        <div id="enemy-desc">
            <span>怪物描述</span>
            <Scroll id="enemy-desc-scroll">
                <span>&nbsp;&nbsp;&nbsp;&nbsp;{{ enemy.description }}</span>
            </Scroll>
        </div>
        <a-divider dashed style="border-color: #ddd4"></a-divider>
        <div>
            <div id="mark-target">
                <span
                    id="mark-info"
                    :style="{ color: marked ? 'lightgreen' : 'lightcoral' }"
                    >{{ marked ? '已标记该怪物' : '未标记该怪物' }}</span
                >
                <span class="button-text" @click.stop="mark">{{
                    marked ? '取消标记该怪物' : '标记该怪物为目标'
                }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Scroll from '../components/scroll.vue';
import { hasMarkedEnemy, markEnemy, unmarkEnemy } from '../plugin/mark';

const enemy = core.plugin.bookDetailEnemy;
const marked = ref(hasMarkedEnemy(enemy.id));

function mark() {
    if (marked.value) unmarkEnemy(enemy.id);
    if (!marked.value) markEnemy(enemy.id);
    marked.value = hasMarkedEnemy(enemy.id);
}
</script>

<style lang="less" scoped>
#enemy-target {
    width: 100%;
    font-size: 2.8vh;
}

#enemy-desc {
    width: 100%;
    height: 30vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

#enemy-desc-scroll {
    height: 100%;
    width: 100%;
}

#mark-target {
    margin-top: 10%;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    font-size: 3.3vh;
}

#mark-info {
    transition: color 0.2s linear;
}

@media screen and (max-width: 600px) {
    #enemy-target {
        font-size: 3.8vw;
    }

    #mark-target {
        font-size: 4vw;
    }
}
</style>
