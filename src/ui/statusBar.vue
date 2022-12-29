<template>
    <div id="status-bar">
        <Box :resizable="true" v-model:width="width" v-model:height="height">
            <Scroll
                id="status-main"
                v-model:update="updateStatus"
                :no-scroll="true"
            >
                <div id="status-div">
                    <span id="status-floor">{{ floor }}</span>
                    <span id="status-lv">{{ lvName }}</span>
                    <div id="status-skill" class="status-item">
                        <img
                            src="/project/images/skill.png"
                            class="status-icon"
                        />
                        <span>{{ skill }}</span>
                    </div>
                    <div id="status-hp" class="status-item">
                        <img src="/project/images/hp.png" class="status-icon" />
                        <span>{{ format(hero.hp!) }}</span>
                        <span id="status-hpmax" class="status-extra"
                            >+{{ format(hero.hpmax!) }}/t</span
                        >
                        <span
                            v-if="has(spring)"
                            id="status-spring"
                            class="status-extra"
                            >剩余{{ spring }}</span
                        >
                    </div>
                    <div id="status-atk" class="status-item">
                        <img
                            src="/project/images/atk.png"
                            class="status-icon"
                        />
                        <span>{{ format(hero.atk!) }}</span>
                        <span id="status-mana" class="status-extra"
                            >+{{ format(hero.mana!) }}</span
                        >
                    </div>
                    <div id="status-def" class="status-item">
                        <img
                            src="/project/images/def.png"
                            class="status-icon"
                        />
                        <span>{{ format(hero.def!) }}</span>
                    </div>
                    <div id="status-mdef" class="status-item">
                        <img src="/project/images/IQ.png" class="status-icon" />
                        <span>{{ format(hero.mdef!) }}</span>
                    </div>
                    <div id="status-money" class="status-item">
                        <img
                            src="/project/images/money.png"
                            class="status-icon"
                        />
                        <span>{{ format(hero.money!) }}</span>
                    </div>
                    <div id="status-exp" class="status-item">
                        <img
                            src="/project/images/exp.png"
                            class="status-icon"
                        />
                        <span>{{ format(up) }}</span>
                    </div>
                    <div id="status-key" class="status-item">
                        <span style="color: #fca; padding-left: 10%">{{
                            keys[0]?.toString().padStart(2, '0')
                        }}</span>
                        <span style="color: #aad">{{
                            keys[1]?.toString().padStart(2, '0')
                        }}</span>
                        <span style="color: #f88; padding-right: 10%">{{
                            keys[2]?.toString().padStart(2, '0')
                        }}</span>
                    </div>
                    <div v-if="skillOpened" class="status-item">
                        <span id="skill-tree" class="button-text">技能树</span>
                    </div>
                    <div v-if="skillOpened" class="status-item">
                        <span id="status-skill" class="button-text"
                            >查看技能</span
                        >
                    </div>
                </div>
            </Scroll>
        </Box>
    </div>
</template>

<script lang="ts" setup>
import { ref, shallowReactive, watch } from 'vue';
import Box from '../components/box.vue';
import Scroll from '../components/scroll.vue';
import { status } from '../plugin/ui/statusBar';
import { isMobile } from '../plugin/use';
import { has } from '../plugin/utils';

const width = ref(isMobile ? window.innerWidth - 100 : 300);
const height = ref(isMobile ? 250 : window.innerHeight - 100);
const updateStatus = ref(false);
const format = core.formatBigNumber;

watch(width, n => (updateStatus.value = !updateStatus.value));
watch(height, n => (updateStatus.value = !updateStatus.value));

const hero = shallowReactive<Partial<HeroStatus>>({});
const keys = shallowReactive<number[]>([]);
const floor = ref<string>();
const lvName = ref<string>();
const skill = ref<string>('无');
const up = ref(0);
const spring = ref<number>();
const skillOpened = ref(core.getFlag('chapter', 0) > 0);
/**
 * 要展示的勇士属性
 */
const toShow: (keyof NumbericHeroStatus)[] = [
    'hp', // 生命
    'atk', // 攻击
    'def', // 防御
    'mdef', // 智力
    'hpmax', // 生命回复
    'mana', // 额外攻击
    'money', // 金币
    'exp', // 经验
    'lv' // 等级
];

watch(status, update);

/**
 * 更新显示内容
 */
function update() {
    toShow.forEach(v => {
        hero[v] = core.getRealStatus(v);
    });
    keys[0] = core.itemCount('yellowKey');
    keys[1] = core.itemCount('blueKey');
    keys[2] = core.itemCount('redKey');
    floor.value = core.status.thisMap?.title;
    lvName.value = core.getLvName(hero.lv);
    if (flags.blade && flags.bladeOn) {
        skill.value = '断灭之刃';
    }
    up.value = core.getNextLvUpNeed() ?? 0;
    if (core.hasFlag('spring')) {
        spring.value = 50 - flags.springCount;
    }
    skillOpened.value = core.getFlag('chapter', 0) > 0;
}
</script>

<style lang="less" scoped>
#status-main {
    background-color: #0009;
    width: 100%;
    height: 100%;
    padding: 1vh 0 1vh 0;
}

.status-item {
    position: relative;
    max-width: 300px;
    font-size: 32px;
    width: 100%;
    margin-bottom: 1vh;
    text-shadow: 3px 2px 3px #000, 0px 0px 3px #111;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.status-icon {
    width: 48px;
    height: 48px;
    margin-right: 10%;
    margin-left: 10%;
}

#status-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

#status-div {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    height: 100%;
}

#status-floor {
    max-width: 300px;
    font-size: 28px;
    width: 100%;
    text-align: center;
}

#status-lv {
    max-width: 300px;
    font-size: 28px;
    width: 100%;
    text-align: center;
}

.status-extra {
    position: absolute;
    right: 15%;
    bottom: 0;
    font-size: 24px;
}

#status-mana {
    line-height: 1;
    text-shadow: 1px 0 0 #c66, 0 1px 0 #c66, -1px 0 0 #c66, 0 -1px 0 #c66;
}

#status-hpmax {
    line-height: 1;
    text-shadow: 1px 0 0 #0c0, 0 1px 0 #0c0, -1px 0 0 #0c0, 0 -1px 0 #0c0;
}

#status-spring {
    line-height: 0;
    text-shadow: 1px 0 0 #0c0, 0 1px 0 #0c0, -1px 0 0 #0c0, 0 -1px 0 #0c0;
}

#status-key {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
}

#skill-tree,
#status-skill {
    text-align: center;
    width: 100%;
}

@media screen and (max-width: 600px) {
    .status-item {
        max-width: 150px;
        font-size: 18px;
    }

    #status-floor {
        max-width: 150px;
        font-size: 18px;
        width: 100%;
    }

    #status-lv {
        max-width: 150px;
        font-size: 18px;
        width: 100%;
    }

    .status-extra {
        font-size: 14px;
    }

    .status-icon {
        width: 28px;
        height: 28px;
    }
}
</style>
