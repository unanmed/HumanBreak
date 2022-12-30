<template>
    <div id="desc">
        <div id="tools">
            <span class="button-text" @click="exit"
                ><left-outlined /> 返回游戏</span
            >
        </div>
        <div id="desc-main">
            <Scroll id="desc-left">
                <div id="desc-list">
                    <span
                        v-for="(data, k) in desc"
                        class="selectable desc-item"
                        :selected="selected === k"
                        @click="selected = k"
                        >{{ data.text }}</span
                    >
                </div>
            </Scroll>
            <a-divider
                id="divider"
                :type="isMobile ? 'horizontal' : 'vertical'"
            ></a-divider>
            <div id="desc-right">
                <Scroll><span v-html="content"></span></Scroll>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import desc from '../data/desc.json';
import { LeftOutlined } from '@ant-design/icons-vue';
import Scroll from '../components/scroll.vue';
import { has } from '../plugin/utils';
import { isMobile } from '../plugin/use';

type DescKey = keyof typeof desc;

const selected = ref(Object.keys(desc)[0] as DescKey);

function exit() {
    core.plugin.descOpened.value = false;
}

const content = computed(() => {
    return desc[selected.value].desc
        .map((v, i, a) => {
            if (/^\d+\./.test(v)) return `${'&nbsp;'.repeat(12)}${v}`;
            else if (
                (has(a[i - 1]) && v !== '<br>' && a[i - 1] === '<br>') ||
                i === 0
            ) {
                return `${'&nbsp;'.repeat(8)}${v}`;
            } else return v;
        })
        .join('');
});
</script>

<style lang="less" scoped>
#desc {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    font-size: 2.7vh;
    font-family: 'normal';
    user-select: none;
}

#desc-main {
    width: 80%;
    height: 80%;
    display: flex;
    justify-content: center;
}

#desc-left {
    flex-basis: 30%;
}

#desc-list {
    display: flex;
    flex-direction: column;
}

#desc-right {
    flex-basis: 70%;
}

#divider {
    height: 100%;
}

.desc-item {
    padding: 1% 3% 1% 3%;
}

#tools {
    width: 100%;
    font-family: 'normal';
    font-size: 3.2vh;
    height: 5vh;
    position: fixed;
    left: 10vw;
    top: 5vh;
}

@media screen and (max-width: 600px) {
    #desc-main {
        flex-direction: column;
        width: 90%;
        height: 75%;
    }

    #divider {
        height: auto;
        width: 100%;
        margin: 5% 0 5% 0;
    }

    #desc-left {
        height: 40%;
    }

    #desc-right {
        height: 50%;
    }
}
</style>
