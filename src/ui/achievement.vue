<template>
    <div id="achievement">
        <div id="tools">
            <span id="back" class="button-text tools" @click="exit"
                ><left-outlined />返回游戏</span
            >
        </div>
        <div id="column">
            <div class="achievement-column" v-for="c of column">
                <span
                    class="column-text button-text"
                    :active="selectedColumn === c"
                    @click="selectedColumn = c"
                    >{{ columnName[c] }}</span
                >
            </div>
        </div>
        <a-divider dashed id="divider"></a-divider>
        <div id="list">
            <div id="achievement-list" :style="{ left: `-${offset}%` }">
                <div v-for="t of column" class="achievement-one">
                    <Scroll class="list-scroll" :width="isMobile ? 10 : 20">
                        <div class="list-div">
                            <div
                                v-for="a of getAllAchievements(t)"
                                class="list-one"
                            >
                                <div
                                    class="list-content"
                                    :complete="a.complete"
                                >
                                    <span class="list-name">{{ a.name }}</span>
                                    <span
                                        class="list-text"
                                        v-html="a.text"
                                    ></span>
                                    <div class="list-end">
                                        <div class="end-info">
                                            <span
                                                class="complete"
                                                :complete="a.complete"
                                                >完成情况:
                                                {{
                                                    a.complete
                                                        ? '已完成'
                                                        : '未完成'
                                                }}</span
                                            >
                                            <span class="point"
                                                >成就点数: {{ a.point }}</span
                                            >
                                        </div>
                                        <div
                                            v-if="a.progress"
                                            class="list-progress"
                                        >
                                            <a-progress
                                                :percent="a.percent"
                                                :strokeColor="{
                                                    '0%': '#108ee9',
                                                    '100%': '#87d068'
                                                }"
                                                :strokeWidth="height / 150"
                                                :format="
                                                    () =>
                                                        a.usePercent
                                                            ? `${a.percent}%`
                                                            : a.progress
                                                "
                                            ></a-progress>
                                        </div>
                                    </div>
                                </div>
                                <a-divider id="divider" dashed></a-divider>
                            </div>
                        </div>
                    </Scroll>
                </div>
            </div>
        </div>
        <div id="total-progress">
            <a-progress
                id="point-progress"
                :percent="(nowPoint / totalPoint) * 100"
                :strokeColor="{
                    '0%': '#108ee9',
                    '100%': '#87d068'
                }"
                :strokeWidth="height / 150"
                :showInfo="false"
            ></a-progress>
            <span id="point-number"
                >成就点: {{ nowPoint }} / {{ totalPoint }}</span
            >
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { LeftOutlined } from '@ant-design/icons-vue';
import list from '../data/achievement.json';
import {
    Achievement,
    getNowPoint,
    hasCompletedAchievement
} from '../plugin/ui/achievement';
import Scroll from '../components/scroll.vue';
import { isMobile } from '../plugin/use';

const props = defineProps<{
    num: number;
}>();

type AchievementList = typeof list;
type AchievementType = keyof AchievementList;

interface ResolvedAchievement {
    name: string;
    text: string;
    complete: boolean;
    point: number;
    /** number / number */
    progress?: string;
    percent?: number;
    usePercent?: boolean;
}

const column: AchievementType[] = ['normal', 'challenge', 'explore'];
const columnName = {
    normal: '普通成就',
    challenge: '挑战成就',
    explore: '探索成就'
};

const selectedColumn = ref<AchievementType>('normal');

const offset = computed(() => {
    return column.indexOf(selectedColumn.value) * 100;
});

const height = window.innerHeight;
const width = window.innerWidth;

const totalPoint = Object.values(list)
    .map((v: Achievement[]) =>
        v.reduce((prev, curr) => {
            return curr.point + prev;
        }, 0)
    )
    .reduce((prev, curr) => prev + curr);
const nowPoint = getNowPoint();

/**
 * 获取一个类型的所有成就
 * @param type 成就类型
 */
function getAllAchievements(type: AchievementType): ResolvedAchievement[] {
    return list[type].map<ResolvedAchievement>((v: Achievement, i) => {
        const complete = hasCompletedAchievement(type, i);
        const text = v.hide && !complete ? v.hide : v.text.join('');
        const res: ResolvedAchievement = {
            text,
            name: v.name,
            point: v.point,
            complete
        };
        if (v.progress) {
            const p = eval('`' + v.progress + '`') as string;
            res.progress = p;
            res.percent = Math.floor(eval(p) * 100);
            if (v.percent) res.usePercent = true;
        }
        return res;
    });
}

function exit() {
    Mota.require('var', 'mainUi').close(props.num);
}
</script>

<style lang="less" scoped>
#achievement {
    width: 90vh;
    height: 90vh;
    font-family: 'normal';
    font-size: 150%;
    display: flex;
    flex-direction: column;
    user-select: none;
}

#divider {
    margin: 1% 0;
    border-color: #ddd4;
}

#tools {
    height: 5vh;
    font-size: 3.2vh;
}

#column {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    margin-top: 3%;
    font-size: 130%;
}

.list-scroll {
    width: 100%;
    height: 100%;
}

#list {
    overflow: hidden;
    width: 100%;
    height: max-content;
}

#achievement-list {
    position: relative;
    width: 300%;
    height: 100%;
    display: flex;
    flex-direction: row;
    transition: left 0.4s ease;
}

.achievement-one {
    width: 90vh;
}

.list-div {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.list-one {
    width: 70%;

    .list-content {
        height: 18vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 2px double rgba(132, 132, 132, 0.17);
        border-radius: 10px;
        margin: 2% 0 2.5% 0;
        background-color: rgba(59, 59, 59, 0.281);
    }

    .list-content[complete='true'] {
        background-color: rgba(239, 255, 63, 0.205);
    }

    .list-name {
        border-bottom: 1px solid #ddd4;
    }

    .list-text {
        font-size: 100%;
        padding: 0 20px;
    }

    .list-end {
        width: 90%;
        height: 95%;
        display: flex;
        flex-direction: column-reverse;
        font-size: 90%;

        .end-info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: end;
        }

        .complete {
            color: lightcoral;
        }

        .complete[complete='true'] {
            color: lightgreen;
        }
    }

    .list-progress {
        display: flex;
        flex-direction: row;
        align-items: center;

        .progress {
            width: 100%;
        }
    }
}

#total-progress {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;

    #point-progress {
        width: 100%;
    }

    #point-number {
        font-size: 70%;
        margin-left: 2%;
        white-space: nowrap;
    }
}

@media screen and (max-width: 600px) {
    #achievement {
        width: 90vw;
        height: 90vh;
    }

    .list-one {
        width: 90%;

        .list-content {
            height: 15vh;
        }

        .list-end {
            margin-bottom: 0.8vh;
        }
    }
}
</style>
