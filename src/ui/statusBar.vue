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
                    <div
                        v-if="items.includes('enableFloor')"
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img :src="icons.floor.src" />
                        </span>
                        <span class="status-value">{{ floor }}</span>
                    </div>
                    <div
                        v-if="items.includes('enableName')"
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img v-if="icons.name" :src="icons.icons.src" />
                        </span>
                        <span class="status-value">{{ hero.name }}</span>
                    </div>
                    <div v-if="items.includes('enableLv')" class="status-item">
                        <span class="status-icon">
                            <img :src="icons.lv.src" />
                        </span>
                        <span class="status-value">{{ lvName }}</span>
                    </div>
                    <div
                        v-if="items.includes('enableHPMax')"
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img :src="icons.hpmax.src" />
                        </span>
                        <span class="status-value">{{
                            format(hero.hpmax ?? 0)
                        }}</span>
                    </div>
                    <div v-if="items.includes('enableHP')" class="status-item">
                        <span class="status-icon">
                            <img :src="icons.hp.src" />
                        </span>
                        <span class="status-value">{{
                            format(hero.hp ?? 0)
                        }}</span>
                    </div>
                    <div
                        v-if="items.includes('enableMana')"
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img :src="icons.mana.src" />
                        </span>
                        <span class="status-value"
                            >{{ format(hero.mana ?? 0) }} /
                            {{ format(hero.manamax ?? 0) }}</span
                        >
                    </div>
                    <div v-if="items.includes('enableAtk')" class="status-item">
                        <span class="status-icon">
                            <img :src="icons.atk.src" />
                        </span>
                        <span class="status-value">{{
                            format(hero.atk ?? 0)
                        }}</span>
                    </div>
                    <div v-if="items.includes('enableDef')" class="status-item">
                        <span class="status-icon">
                            <img :src="icons.def.src" />
                        </span>
                        <span class="status-value">{{
                            format(hero.def ?? 0)
                        }}</span>
                    </div>
                    <div
                        v-if="items.includes('enableMDef')"
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img :src="icons.mdef.src" />
                        </span>
                        <span class="status-value">{{
                            format(hero.mdef ?? 0)
                        }}</span>
                    </div>
                    <div
                        v-if="items.includes('enableMoney')"
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img :src="icons.money.src" />
                        </span>
                        <span class="status-value">{{
                            format(hero.money ?? 0)
                        }}</span>
                    </div>
                    <div
                        v-if="
                            items.includes('enableExp') &&
                            !items.includes('enableLevelUp')
                        "
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img :src="icons.exp.src" />
                        </span>
                        <span class="status-value">{{
                            format(hero.exp ?? 0)
                        }}</span>
                    </div>
                    <div
                        v-if="
                            items.includes('enableExp') &&
                            items.includes('enableLevelUp')
                        "
                        class="status-item"
                    >
                        <span class="status-icon">
                            <img :src="icons.up.src" />
                        </span>
                        <span class="status-value">{{ format(up ?? 0) }}</span>
                    </div>
                    <div
                        v-if="items.includes('enableKeys')"
                        class="status-item"
                        id="status-key"
                    >
                        <span
                            class="status-value status-key"
                            v-for="(color, i) of keyColor"
                            :color="color"
                            >{{
                                keys[i]?.toString().padStart(2, '0') ?? '00'
                            }}</span
                        >
                    </div>
                    <div
                        v-if="items.includes('enablePZF')"
                        class="status-item status-pzf"
                    >
                        <span
                            class="status-value status-pzf-value"
                            :index="i"
                            v-for="(name, i) of pzfName"
                        >
                            {{ name }} {{ pzf[i] ?? 0 }}
                        </span>
                    </div>
                    <div
                        v-if="items.includes('enableDebuff')"
                        class="status-item status-debuff"
                    >
                        <template v-for="(name, i) of debuffName">
                            <span
                                :index="i"
                                class="status-value status-debuff-value"
                                v-if="debuff[i]"
                            >
                                {{ name }}
                            </span>
                        </template>
                    </div>
                </div>
            </Scroll>
        </Box>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowReactive, watch } from 'vue';
import Box from '../components/box.vue';
import Scroll from '../components/scroll.vue';
import { status } from '../plugin/ui/statusBar';
import { isMobile } from '../plugin/use';
import { fontSize } from '../plugin/ui/statusBar';

let main: HTMLDivElement;

const items = core.flags.statusBarItems;
const icons = core.statusBar.icons;

const width = ref(
    isMobile ? window.innerWidth - 60 : window.innerWidth * 0.175
);
const height = ref(isMobile ? 250 : window.innerHeight - 100);
const updateStatus = ref(false);
const format = core.formatBigNumber;

watch(width, n => (updateStatus.value = !updateStatus.value));
watch(height, n => (updateStatus.value = !updateStatus.value));
watch(fontSize, n => (main.style.fontSize = `${isMobile ? n * 1.5 : n}%`));

const hero = shallowReactive<Partial<HeroStatus>>({});
const keys = shallowReactive<number[]>([]);
const pzf = shallowReactive<number[]>([]);
const debuff = shallowReactive<boolean[]>([]);
const floor = ref<string>();
const lvName = ref<string>();
const up = ref(0);
const keyColor = ['yellow', 'blue', 'red'];
const pzfName = ['破', '炸', '飞'];
const debuffName = ['毒', '衰', '咒'];
if (items.includes('enableGreenKey')) keyColor.push('green');
/**
 * 要展示的勇士属性
 */
const toShow: (keyof NumbericHeroStatus)[] = [
    'atk',
    'def',
    'mdef',
    'hpmax',
    'mana',
    'money',
    'exp',
    'lv',
    'manamax'
];

watch(status, update);

/**
 * 更新显示内容
 */
function update() {
    toShow.forEach(v => {
        hero[v] = Mota.requireAll('fn').getHeroStatusOn(v);
    });
    hero.name = core.status.hero.name;
    hero.hp = core.status.hero.hp;
    keys[0] = core.itemCount('yellowKey');
    keys[1] = core.itemCount('blueKey');
    keys[2] = core.itemCount('redKey');
    keys[3] = core.itemCount('greenKey');
    debuff[0] = core.getFlag('poison');
    debuff[1] = core.getFlag('weak');
    debuff[2] = core.getFlag('curse');
    pzf[0] = core.itemCount('pickaxe');
    pzf[1] = core.itemCount('bomb');
    pzf[2] = core.itemCount('centerFly');
    floor.value = core.status.thisMap?.title;
    lvName.value = core.getLvName(hero.lv);
    up.value = core.getNextLvUpNeed() ?? 0;
}

function resize() {
    requestAnimationFrame(() => {
        main.style.fontSize = `${
            isMobile ? fontSize.value * 1.5 : fontSize.value
        }%`;
    });
}

onMounted(() => {
    update();
    main = document.getElementById('status-main') as HTMLDivElement;

    window.addEventListener('resize', resize);
});

onUnmounted(() => {
    window.removeEventListener('resize', resize);
});
</script>

<style lang="less" scoped>
#status-main {
    background-color: #0009;
    width: 100%;
    height: 100%;
    padding: 1vh 0;
    font-size: v-bind(fontSize);
}

.status-item {
    display: flex;
    flex-direction: row;
    max-width: 17.5vw;
    font-size: 200%;
    width: 100%;
    margin-bottom: 14px;
    text-shadow: 3px 2px 3px #000, 0px 0px 3px #111;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.status-item-bold {
    font-weight: bold;
}

.status-icon {
    margin-right: 10%;
    margin-left: 10%;
}

.status-value {
    transform: translateY(2px);
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

#status-key,
.status-pzf,
.status-debuff {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
}

.status-key[color='yellow'] {
    color: #fca;
}
.status-key[color='blue'] {
    color: #aad;
}
.status-key[color='red'] {
    color: #f88;
}
.status-key[color='green'] {
    color: #8f8;
}

.status-pzf-value[index='0'] {
    color: #bc6e27;
}
.status-pzf-value[index='1'] {
    color: #fa14b9;
}
.status-pzf-value[index='2'] {
    color: #8db600;
}

.status-debuff-value[index='0'] {
    color: #affca8;
}
.status-debuff-value[index='1'] {
    color: #feccd0;
}
.status-debuff-value[index='2'] {
    color: #c2f4e7;
}

@media screen and (max-width: 600px) {
    .status-item {
        font-size: v-bind(fontSize);
        max-width: 28vw;
    }
}
</style>
