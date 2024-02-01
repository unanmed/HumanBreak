<template>
    <div id="status-bar">
        <Box
            :resizable="true"
            :dragable="true"
            v-model:width="width"
            v-model:height="height"
        >
            <Scroll
                id="status-main"
                v-model:update="updateStatus"
                :no-scroll="true"
            >
                <div id="status-div">
                    <span
                        id="status-floor"
                        @click.stop="viewMap"
                        class="button-text"
                        >{{ floor }}</span
                    >
                    <span id="status-lv">{{ lvName }}</span>
                    <div id="status-skill" class="status-item">
                        <img
                            src="/project/images/skill.png"
                            class="status-icon"
                        />
                        <span>{{ skill }}</span>
                        <span
                            v-if="has(spring)"
                            id="status-spring"
                            class="status-extra"
                            >剩余{{ spring }}</span
                        >
                    </div>
                    <div id="status-hp" class="status-item">
                        <img src="/project/images/hp.png" class="status-icon" />
                        <span class="status-item-bold">{{
                            format(hero.hp!)
                        }}</span>
                        <span
                            id="status-hpmax"
                            class="status-extra status-item-bold"
                            >+{{ format(hero.hpmax!) }}/t</span
                        >
                        <span
                            v-if="has(jumpCnt)"
                            id="status-jump"
                            class="status-extra"
                            >跳跃剩余{{ jumpCnt }}</span
                        >
                    </div>
                    <div id="status-atk" class="status-item">
                        <img
                            src="/project/images/atk.png"
                            class="status-icon"
                        />
                        <span class="status-item-bold">{{
                            format(hero.atk!)
                        }}</span>
                        <span
                            id="status-mana"
                            class="status-extra status-item-bold"
                            >+{{ format(hero.mana!) }}</span
                        >
                    </div>
                    <div id="status-def" class="status-item status-item-bold">
                        <img
                            src="/project/images/def.png"
                            class="status-icon"
                        />
                        <span>{{ format(hero.def!) }}</span>
                    </div>
                    <div id="status-mdef" class="status-item status-item-bold">
                        <img src="/project/images/IQ.png" class="status-icon" />
                        <span>{{ format(hero.mdef!) }}</span>
                    </div>
                    <div id="status-money" class="status-item status-item-bold">
                        <img
                            src="/project/images/money.png"
                            class="status-icon"
                        />
                        <span>{{ format(hero.money!) }}</span>
                    </div>
                    <div id="status-exp" class="status-item status-item-bold">
                        <img
                            src="/project/images/exp.png"
                            class="status-icon"
                        />
                        <span>{{ format(up) }}</span>
                    </div>
                    <div id="status-key" class="status-item status-item-bold">
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
                        <span
                            id="skill-tree"
                            class="button-text"
                            @click.stop="openSkillTree"
                            >技能树</span
                        >
                    </div>
                    <div v-if="skillOpened" class="status-item">
                        <span
                            id="status-skill"
                            class="button-text"
                            @click.stop="openSkill"
                            >查看技能</span
                        >
                    </div>
                    <div v-if="studyOpened" class="status-item">
                        <span
                            id="status-study"
                            class="button-text"
                            @click.stop="openStudy"
                            >学习</span
                        >
                    </div>
                </div>
            </Scroll>
        </Box>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowReactive, watch } from 'vue';
import Box from '../components/box.vue';
import Scroll from '../components/scroll.vue';
import { status } from '../plugin/ui/statusBar';
import { isMobile } from '../plugin/use';
import { has } from '../plugin/utils';

const skillTree = Mota.Plugin.require('skillTree_g');

const width = ref(
    isMobile ? window.innerWidth - 60 : window.innerWidth * 0.175
);
const height = ref(isMobile ? 250 : window.innerHeight - 100);
const updateStatus = ref(false);
const format = core.formatBigNumber;

watch(width, n => (updateStatus.value = !updateStatus.value));
watch(height, n => (updateStatus.value = !updateStatus.value));

const hero = shallowReactive<Partial<HeroStatus>>({});
const keys = shallowReactive<number[]>([]);
const floor = ref<string>();
const lvName = ref<string>();
const skill = ref<string>(flags.autoSkill ? '自动切换' : '无');
const up = ref(0);
const spring = ref<number>();
const skillOpened = ref(core.getFlag('chapter', 0) > 0);
const studyOpened = ref(skillTree.getSkillLevel(11) > 0);
const jumpCnt = ref<number>();
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
        hero[v] = Mota.Plugin.require('hero_g').getHeroStatusOn(v);
    });
    keys[0] = core.itemCount('yellowKey');
    keys[1] = core.itemCount('blueKey');
    keys[2] = core.itemCount('redKey');
    floor.value = core.status.thisMap?.title;
    lvName.value = core.getLvName(hero.lv);
    if (flags.autoSkill) {
        skill.value = '自动切换';
    } else {
        if (flags.blade && flags.bladeOn) {
            skill.value = '断灭之刃';
        } else if (flags.shield && flags.shieldOn) {
            skill.value = '铸剑为盾';
        } else {
            skill.value = '无';
        }
    }
    up.value = core.getNextLvUpNeed() ?? 0;
    if (core.hasFlag('spring')) {
        spring.value = 50 - (flags.springCount ?? 0);
    } else {
        spring.value = void 0;
    }
    skillOpened.value = core.getFlag('chapter', 0) > 0;
    studyOpened.value = skillTree.getSkillLevel(11) > 0;
    jumpCnt.value =
        flags.skill2 &&
        !Mota.Plugin.require('skill_g').jumpIgnoreFloor.includes(
            core.status.floorId
        )
            ? 3 - (flags[`jump_${core.status.floorId}`] ?? 0)
            : void 0;
}

function openSkillTree() {
    core.useItem('skill1');
}

function openSkill() {
    core.useItem('cross');
}

function viewMap() {
    core.ui._drawViewMaps();
}

function openStudy() {}

onMounted(() => {
    update();
});
</script>

<style lang="less" scoped>
#status-main {
    background-color: #0009;
    width: 100%;
    height: 100%;
    padding: 1vh 0;
}

.status-item {
    position: relative;
    max-width: 17.5vw;
    font-size: 200%;
    width: 100%;
    margin-bottom: 1vh;
    text-shadow: 3px 2px 3px #000, 0px 0px 3px #111;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.status-item-bold {
    font-weight: bold;
}

.status-icon {
    width: 2.8vw;
    height: 2.8vw;
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
    max-width: 17.5vw;
    font-size: 200%;
    width: 100%;
    text-align: center;
    text-shadow: 3px 2px 3px #000, 0px 0px 3px #111;
}

#status-lv {
    max-width: 17.5vw;
    font-size: 200%;
    width: 100%;
    text-align: center;
    text-shadow: 3px 2px 3px #000, 0px 0px 3px #111;
}

.status-extra {
    position: absolute;
    right: 10%;
    bottom: 0;
    font-size: 75%;
}

#status-mana {
    line-height: 0;
    color: rgb(255, 211, 211);
}

#status-hpmax {
    line-height: 0;
    color: rgb(167, 255, 167);
}

#status-spring {
    line-height: 0;
    color: rgb(167, 255, 167);
    top: 0;
    font-size: 75%;
}

#status-jump {
    line-height: 0;
    top: 0;
    font-size: 75%;
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
        max-width: 40vw;
        font-size: 120%;
    }

    #status-floor {
        max-width: 40vw;
        font-size: 120%;
        width: 100%;
    }

    #status-lv {
        max-width: 40vw;
        font-size: 120%;
        width: 100%;
    }

    .status-icon {
        width: 28px;
        height: 28px;
    }
}
</style>
