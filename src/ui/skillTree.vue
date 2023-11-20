<template>
    <div id="skill-tree">
        <div id="tools">
            <span id="back" class="button-text tools" @click="exit"
                ><left-outlined />返回游戏</span
            >
        </div>
        <span id="skill-title">{{ skill.title }}</span>
        <a-divider dashed style="border-color: #ddd4" id="divider"></a-divider>
        <div id="skill-info">
            <Scroll id="skill-desc" :no-scroll="true">
                <span v-html="desc"></span>
            </Scroll>
            <div id="skill-effect">
                <span v-if="level > 0" v-html="effect[0]"></span>
                <span v-if="level < skill.max" v-html="effect[1]"></span>
            </div>
        </div>
        <a-divider
            dashed
            style="border-color: #ddd4"
            id="divider-split"
        ></a-divider>
        <div id="skill-bottom">
            <canvas id="skill-canvas"></canvas>
            <a-divider
                dashed
                style="border-color: #ddd4"
                :type="isMobile ? 'horizontal' : 'vertical'"
                id="divider-vertical"
            ></a-divider>
            <div id="skill-upgrade-info">
                <span id="skill-level"
                    >当前等级：{{ level }} / {{ skill.max }}</span
                >
                <a-divider dashed class="upgrade-divider"></a-divider>
                <span
                    v-if="level < skill.max"
                    id="skill-consume"
                    :style="{ color: consume <= mdef ? '#fff' : '#f44' }"
                    >升级花费：{{ consume }}</span
                >
                <span v-else id="skill-consume" style="color: gold"
                    >已满级</span
                >
                <a-divider dashed class="upgrade-divider"></a-divider>
                <Scroll id="front-scroll" :no-scroll="true"
                    ><div id="skill-front">
                        <span>前置技能</span>
                        <span
                            v-for="str of front"
                            :style="{
                                color: str.startsWith('a') ? '#fff' : '#f44'
                            }"
                            >{{ str.slice(1) }}</span
                        >
                    </div></Scroll
                >
                <a-divider dashed class="upgrade-divider"></a-divider>
                <div id="skill-chapter">
                    <span class="button-text" @click="selectChapter(-1)"
                        ><LeftOutlined
                    /></span>
                    &nbsp;&nbsp;
                    <span>{{ chapterDict[chapter] }}</span>
                    &nbsp;&nbsp;
                    <span class="button-text" @click="selectChapter(1)"
                        ><RightOutlined
                    /></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import Scroll from '../components/scroll.vue';
import { has, splitText, tip } from '../plugin/utils';
import { isMobile } from '../plugin/use';
import { sleep } from 'mutate-animate';
import { gameKey } from '@/core/main/init/hotkey';
import { GameUi } from '@/core/main/custom/ui';

const props = defineProps<{
    num: number;
    ui: GameUi;
}>();

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const selected = ref(0);
const chapter = ref<Chapter>('chapter1');
const update = ref(false);

const chapterDict = {
    chapter1: '第一章',
    chapter2: '第二章'
};

flags.skillTree ??= 0;

const chapterList = Object.keys(core.plugin.skills) as Chapter[];

selected.value = core.plugin.skills[chapterList[flags.skillTree]][0].index;
chapter.value = chapterList[flags.skillTree];

watch(selected, draw);
watch(update, () => (mdef.value = core.status.hero.mdef));

const mdef = ref(core.status.hero.mdef);

const skill = computed(() => {
    update.value;
    return core.plugin.skillTree.getSkillFromIndex(selected.value);
});

const skills = computed(() => {
    return core.plugin.skills[chapter.value];
});

const desc = computed(() => {
    return eval(
        '`' +
            splitText(skill.value.desc).replace(/level(:\d+)?/g, (str, $1) => {
                if ($1) return `core.plugin.skillTree.getSkillLevel(${$1})`;
                else
                    return `core.plugin.skillTree.getSkillLevel(${skill.value.index})`;
            }) +
            '`'
    );
});

const effect = computed(() => {
    return [0, 1].map(v => {
        return eval(
            '`' +
                `${v === 0 ? '当前效果：' : '下一级效果：'}` +
                skill.value.effect
                    .join('')
                    .replace(/level(:\d+)?/g, (str, $1) => {
                        if ($1)
                            return `(core.plugin.skillTree.getSkillLevel(${$1}) + ${v})`;
                        else
                            return `(core.plugin.skillTree.getSkillLevel(${skill.value.index}) + ${v})`;
                    }) +
                '`'
        );
    }) as [string, string];
});

const dict = computed(() => {
    const dict: Record<number, number> = {};
    const all = skills.value;
    all.forEach((v, i) => {
        dict[v.index] = i;
    });
    return dict;
});

const front = computed(() => {
    return skill.value.front.map(v => {
        return `${
            core.plugin.skillTree.getSkillLevel(v[0]) >= v[1] ? 'a' : 'b'
        }${v[1]}级  ${skills.value[dict.value[v[0]]].title}`;
    });
});

const consume = computed(() => {
    update.value;
    return core.plugin.skillTree.getSkillConsume(selected.value);
});

const level = computed(() => {
    update.value;
    return core.plugin.skillTree.getSkillLevel(selected.value);
});

function exit() {
    mota.ui.main.close(props.num);
}

function resize() {
    const style = getComputedStyle(canvas);
    canvas.width = parseFloat(style.width) * devicePixelRatio;
    canvas.height = parseFloat(style.height) * devicePixelRatio;
}

function draw() {
    const d = dict.value;
    const w = canvas.width;
    const per = w / 11;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    skills.value.forEach(v => {
        const [x, y] = v.loc.map(v => v * 2 - 1);
        // 技能连线
        v.front.forEach(([skill], i) => {
            const s = skills.value[d[skill]];
            ctx.beginPath();
            ctx.moveTo(x * per + per / 2, y * per + per / 2);
            ctx.lineTo(
                ...(s.loc.map(v => (v * 2 - 1) * per + per / 2) as LocArr)
            );
            if (core.plugin.skillTree.getSkillLevel(s.index) < v.front[i][1])
                ctx.strokeStyle = '#aaa';
            else if (core.plugin.skillTree.getSkillLevel(s.index) === s.max)
                ctx.strokeStyle = '#ff0';
            else ctx.strokeStyle = '#0f8';
            ctx.lineWidth = devicePixelRatio;
            ctx.stroke();
        });
    });
    skills.value.forEach(v => {
        const [x, y] = v.loc.map(v => v * 2 - 1);
        const level = core.plugin.skillTree.getSkillLevel(v.index);
        // 技能图标
        ctx.save();
        ctx.lineWidth = per * 0.06;
        if (selected.value === v.index) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth *= 2;
        } else if (level === 0) ctx.strokeStyle = '#888';
        else if (level === v.max) ctx.strokeStyle = '#F7FF68';
        else ctx.strokeStyle = '#00FF69';
        ctx.strokeRect(x * per, y * per, per, per);
        const img =
            core.material.images.images[`skill${v.index}.png` as ImageIds];
        ctx.drawImage(img, x * per, y * per, per, per);
        if (selected.value === v.index) {
            ctx.fillStyle = '#ff04';
            ctx.fillRect(x * per, y * per, per, per);
        }
        ctx.restore();
    });
}

function click(e: MouseEvent) {
    const px = e.offsetX;
    const py = e.offsetY;
    const w = canvas.width / devicePixelRatio;
    const per = w / 11;
    const x = Math.floor(px / per);
    const y = Math.floor(py / per);
    if (x % 2 !== 1 || y % 2 !== 1) return;
    const sx = Math.floor(x / 2) + 1;
    const sy = Math.floor(y / 2) + 1;
    const skill = skills.value.find(v => v.loc[0] === sx && v.loc[1] === sy);
    if (!skill) return;
    if (selected.value !== skill.index) selected.value = skill.index;
    else {
        upgrade(skill.index);
    }
}

function upgrade(index: number) {
    const success = core.plugin.skillTree.upgradeSkill(index);
    if (!success) tip('error', '升级失败！');
    else {
        tip('success', '升级成功！');
        update.value = !update.value;
        core.status.route.push(`skill:${selected.value}`);
    }
}

gameKey.use(props.ui.symbol);
gameKey
    .realize('exit', () => {
        exit();
    })
    .realize('confirm', () => {
        upgrade(selected.value);
    })
    .realize('skillTree', () => {
        exit();
    });

onMounted(async () => {
    canvas = document.getElementById('skill-canvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    resize();
    draw();

    await sleep(50);
    // if (mota.plugin.ui.transition.value) await sleep(600);
    canvas.addEventListener('click', click);
});

onUnmounted(() => {
    gameKey.dispose(props.ui.symbol);
});

function selectChapter(delta: number) {
    const now = chapterList.indexOf(chapter.value);
    const to = now + delta;

    if (has(chapterList[to]) && flags.chapter > to) {
        selected.value = core.plugin.skills[chapterList[to]][0].index;
        chapter.value = chapterList[to];
        update.value = !update.value;
        flags.skillTree = to;
        draw();
    }
}
</script>

<style lang="less" scoped>
#skill-tree {
    width: 90vh;
    height: 90vh;
    font-family: 'normal';
    font-size: 150%;
    display: flex;
    flex-direction: column;
    user-select: none;
}

#skill-title {
    width: 100%;
    text-align: center;
    font-size: 130%;
    height: 5vh;
    line-height: 1;
}

#tools {
    height: 5vh;
    font-size: 3.2vh;
}

#skill-info {
    height: 24vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

#divider {
    width: 100%;
    margin: 1vh 0;
}

#divider-split {
    margin: 1vh 0 0 0;
}

#divider-vertical {
    height: 100%;
    margin: 0;
}

#skill-bottom {
    height: 53vh;
    width: 100%;
    display: flex;
    flex-direction: row;
}

#skill-canvas {
    height: 53vh;
    width: 53vh;
}

#skill-effect {
    display: flex;
    flex-direction: column;
}

#skill-consume {
    width: 100%;
    text-align: center;
    height: 4vh;
}

#skill-upgrade-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding-top: 1vh;
}

.upgrade-divider {
    margin: 1vh 0;
    border-color: #ddd4;
}

#front-scroll {
    width: 100%;
    height: 39vh;
}

#skill-front {
    display: flex;
    flex-direction: column;
    align-items: center;
}

@media screen and (max-width: 600px) {
    #skill-tree {
        width: 100%;
        height: 100%;
        font-size: 100%;
        padding: 5%;
    }

    #skill-title {
        width: 100%;
        font-size: 130%;
        height: 5vw;
    }

    #divider-vertical {
        height: auto;
    }

    #skill-bottom {
        height: auto;
        flex-direction: column;
        align-items: center;
    }

    #skill-canvas {
        height: 35vh;
        width: 35vh;
    }

    #front-scroll {
        height: 18vh;
    }
}
</style>
