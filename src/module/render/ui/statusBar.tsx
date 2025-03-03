import { GameUI, UIComponentProps } from '@/core/system';
import { computed, defineComponent, ref, watch } from 'vue';
import { SetupComponentOptions, TextContent } from '../components';
import { DefaultProps, ElementLocator, Sprite, Font } from '@/core/render';
import { transitionedColor } from '../use';
import { linear } from 'mutate-animate';
import { Scroll } from '../components/scroll';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { getArea, MinimapDrawer } from '@/plugin/ui/fly';
import {
    NumpadToolbar,
    PlayingToolbar,
    ReplayingStatus,
    ReplayingToolbar
} from './toolbar';

export interface ILeftHeroStatus {
    hp: number;
    atk: number;
    def: number;
    mdef: number;
    money: number;
    exp: number;
    yellowKey: number;
    blueKey: number;
    redKey: number;
    floor: FloorIds;
    lv: string;
    /** 生命回复 */
    regen: number;
    /** 额外攻击 */
    exAtk: number;
    /** 魔法防御 */
    magicDef: number;
}

interface StatusBarProps<T> extends DefaultProps, UIComponentProps {
    loc: ElementLocator;
    status: T;
    hidden: boolean;
}

const statusBarProps = {
    props: ['loc', 'status', 'hidden']
} satisfies SetupComponentOptions<StatusBarProps<unknown>>;

export const LeftStatusBar = defineComponent<StatusBarProps<ILeftHeroStatus>>(
    p => {
        const hpIcon = core.material.images.images['hp.png'];
        const atkIcon = core.material.images.images['atk.png'];
        const defIcon = core.material.images.images['def.png'];
        const mdefIcon = core.material.images.images['IQ.png'];
        const moneyIcon = core.material.images.images['money.png'];
        const expIcon = core.material.images.images['exp.png'];

        const s = p.status;
        const f = core.formatBigNumber;

        const floorName = computed(() => core.floors[s.floor]?.title ?? '');

        const key = (num: number) => {
            return num.toString().padStart(2, '0');
        };

        const font1 = new Font('normal', 18);
        const font2 = new Font('normal', 18, 'px', 700);
        const font3 = new Font('normal', 14, 'px', 700);

        const iconLoc = (n: number): ElementLocator => {
            return [16, 76 + 44 * n, 32, 32];
        };

        const textLoc = (n: number): ElementLocator => {
            return [60, 92 + 44 * n, void 0, void 0, 0, 0.5];
        };

        const central = (y: number): ElementLocator => {
            const width = p.loc[2] ?? 200;
            return [width / 2, y, void 0, void 0, 0.5, 0.5];
        };

        const right = (y: number): ElementLocator => {
            const width = p.loc[2] ?? 200;
            return [width - 16, y, void 0, void 0, 1, 0.5];
        };

        const keyCount = 3;
        const keyY = 92 + 44 * 6;
        const keyLoc = (n: number): ElementLocator => {
            const width = p.loc[2] ?? 200;
            const per = width / (keyCount + 1);
            return [per * (n + 1), keyY, void 0, void 0, 0.5, 0.5];
        };

        return () => {
            return (
                <container loc={p.loc} hidden={p.hidden}>
                    <text
                        text={floorName.value}
                        loc={central(24)}
                        font={font1}
                        cursor="pointer"
                    ></text>
                    <text text={s.lv} loc={central(54)} font={font1}></text>
                    <image image={hpIcon} loc={iconLoc(0)}></image>
                    <text text={f(s.hp)} loc={textLoc(0)} font={font1}></text>
                    <text
                        text={`+${f(s.regen)}/t`}
                        loc={right(110)}
                        font={font3}
                        fillStyle="#a7ffa7"
                    ></text>
                    <image image={atkIcon} loc={iconLoc(1)}></image>
                    <text text={f(s.atk)} loc={textLoc(1)} font={font1}></text>
                    <text
                        text={`+${f(s.exAtk)}`}
                        loc={right(154)}
                        font={font3}
                        fillStyle="#ffd3d3"
                    ></text>
                    <image image={defIcon} loc={iconLoc(2)}></image>
                    <text text={f(s.def)} loc={textLoc(2)} font={font1}></text>
                    {s.magicDef > 0 && (
                        <text
                            text={`+${f(s.magicDef)}`}
                            loc={right(198)}
                            font={font3}
                            fillStyle="#b0bdff"
                        ></text>
                    )}
                    <image image={mdefIcon} loc={iconLoc(3)}></image>
                    <text text={f(s.mdef)} loc={textLoc(3)} font={font1}></text>
                    <image image={moneyIcon} loc={iconLoc(4)}></image>
                    <text text={f(s.money)} loc={textLoc(4)} font={font1} />
                    <image image={expIcon} loc={iconLoc(5)}></image>
                    <text text={f(s.exp)} loc={textLoc(5)} font={font1}></text>
                    <text
                        text={key(s.yellowKey)}
                        loc={keyLoc(0)}
                        font={font2}
                        fillStyle="#fca"
                    ></text>
                    <text
                        text={key(s.blueKey)}
                        loc={keyLoc(1)}
                        font={font2}
                        fillStyle="#aad"
                    ></text>
                    <text
                        text={key(s.redKey)}
                        loc={keyLoc(2)}
                        font={font2}
                        fillStyle="#f88"
                    ></text>
                    <text
                        text="技能树"
                        loc={central(396)}
                        font={font1}
                        cursor="pointer"
                    ></text>
                    <text
                        text="查看技能"
                        loc={central(428)}
                        font={font1}
                        cursor="pointer"
                    ></text>
                </container>
            );
        };
    },
    statusBarProps
);

interface RightStatusBarMisc {
    name: string;
    value: string;
    nameColor: string;
    valueColor: string;
}

export interface IRightHeroStatus {
    /** 自动切换技能 */
    autoSkill: boolean;
    /** 当前开启的技能 */
    skillName: string;
    /** 技能描述 */
    skillDesc: string;
    /** 跳跃剩余次数，-1 表示未开启，-2表示当前楼层不能跳 */
    jumpCount: number;
    /** 治愈之泉剩余次数，-1 表示未开启 */
    springCount: number;
    /** 当前楼层 */
    floor: FloorIds;
    /** 是否正在录像播放 */
    replaying: boolean;
    /** 录像播放状态 */
    replayStatus: ReplayingStatus;
    /** 极昼永夜 */
    night: number;
}

export const RightStatusBar = defineComponent<StatusBarProps<IRightHeroStatus>>(
    p => {
        const font1 = new Font('normal', 18);
        const font2 = new Font('normal', 16);

        const minimap = ref<Sprite>();
        const inNumpad = ref(false);

        const onNumpad = () => {
            inNumpad.value = !inNumpad.value;
        };

        const s = p.status;
        const skill = computed(() =>
            s.autoSkill ? '已开启自动切换' : s.skillName
        );
        const skillDesc = computed(() =>
            s.autoSkill ? '自动切换技能时，会自动选择最优技能' : s.skillDesc
        );

        const skillColor = transitionedColor('#284', 200, linear())!;

        watch(
            () => s.autoSkill,
            value => {
                skillColor.set(value ? '#284' : '#824');
            }
        );

        const miscData = computed<RightStatusBarMisc[]>(() => {
            const data: RightStatusBarMisc[] = [];
            if (s.jumpCount !== -1) {
                const text =
                    s.jumpCount === -2 ? '不可跳跃' : s.jumpCount.toString();
                data.push({
                    name: '跳跃剩余',
                    nameColor: '#fff',
                    value: text,
                    valueColor: '#fff'
                });
            }
            if (s.springCount >= 0) {
                data.push({
                    name: '治愈之泉',
                    nameColor: '#a7ffa7',
                    value: s.springCount.toString(),
                    valueColor: '#a7ffa7'
                });
            }
            if (s.night !== 0) {
                const text = s.night.toString();
                data.push({
                    name: '极昼永夜',
                    nameColor: '#a3f8ff',
                    value: s.night > 0 ? '+' + text : text,
                    valueColor: s.night > 0 ? '#a7ffa7' : '#ffa7a7'
                });
            }
            return data;
        });

        const central = (y: number): ElementLocator => {
            const width = p.loc[2] ?? 200;
            return [width / 2, y, void 0, void 0, 0.5, 0.5];
        };

        const middle = (x: number, y: number): ElementLocator => {
            return [x, y, void 0, void 0, 0, 0.5];
        };

        const changeAutoSkill = () => {
            const { HeroSkill } = Mota.require('module', 'Mechanism');
            const auto = !s.autoSkill;
            HeroSkill.setAutoSkill(auto);
            core.status.route.push(`set:autoSkill:${auto}`);
            core.updateStatusBar();
        };

        const area = getArea();
        const minimapDrawer = new MinimapDrawer(
            document.createElement('canvas')
        );
        minimapDrawer.noBorder = true;
        minimapDrawer.scale = 4;
        minimapDrawer.showInfo = true;
        let linked = false;
        const drawMinimap = (canvas: MotaOffscreenCanvas2D) => {
            const ctx = canvas.ctx;
            ctx.save();
            ctx.scale(
                1 / core.domStyle.scale / devicePixelRatio,
                1 / core.domStyle.scale / devicePixelRatio
            );
            if (!linked) {
                minimapDrawer.link(canvas.canvas);
                linked = true;
            }
            if (minimapDrawer.nowFloor !== s.floor) {
                minimapDrawer.drawedThumbnail = {};
            } else {
                minimapDrawer.drawToTarget();
                ctx.restore();
                return;
            }
            minimapDrawer.nowFloor = s.floor;
            minimapDrawer.nowArea =
                Object.keys(area).find(v =>
                    area[v].includes(core.status.floorId)
                ) ?? '';
            minimapDrawer.locateMap(minimapDrawer.nowFloor);
            minimapDrawer.drawMap();
            ctx.restore();
        };

        watch(
            () => s.floor,
            () => {
                minimap.value?.update();
            }
        );

        return () => {
            return (
                <container loc={p.loc} hidden={p.hidden}>
                    <g-rectr
                        loc={[10, 10, 160, 24]}
                        circle={[6]}
                        fillStyle={skillColor.ref.value}
                        onClick={changeAutoSkill}
                        cursor="pointer"
                    ></g-rectr>
                    <text
                        loc={central(22)}
                        text={skill.value}
                        font={font1}
                        onClick={changeAutoSkill}
                        cursor="pointer"
                    />
                    <TextContent
                        loc={[10, 42, 160, 60]}
                        text={skillDesc.value}
                        font={new Font('normal', 14)}
                        width={160}
                        lineHeight={4}
                    ></TextContent>
                    <g-line
                        line={[0, 107, 180, 107]}
                        strokeStyle="#888"
                        lineWidth={1}
                        zIndex={-20}
                    ></g-line>
                    <Scroll loc={[0, 107, 180, 100]}>
                        {miscData.value
                            .map((v, i) => {
                                return [
                                    <text
                                        text={v.name}
                                        loc={middle(10, 16 + i * 22)}
                                        fillStyle={v.nameColor}
                                        font={font2}
                                    ></text>,
                                    <text
                                        text={v.value}
                                        loc={middle(100, 16 + i * 22)}
                                        fillStyle={v.valueColor}
                                        font={font2}
                                    ></text>
                                ];
                            })
                            .flat()}
                    </Scroll>
                    <g-line
                        line={[0, 207, 180, 207]}
                        strokeStyle="#888"
                        lineWidth={1}
                        zIndex={-20}
                    ></g-line>
                    <sprite
                        ref={minimap}
                        loc={[10, 207, 160, 160]}
                        render={drawMinimap}
                    ></sprite>
                    <g-line
                        line={[0, 367, 180, 367]}
                        strokeStyle="#888"
                        lineWidth={1}
                        zIndex={-20}
                    ></g-line>
                    {inNumpad.value ? (
                        <NumpadToolbar
                            loc={[0, 367, 180, 113]}
                            onNumpad={onNumpad}
                        />
                    ) : s.replaying ? (
                        <ReplayingToolbar
                            loc={[0, 367, 180, 113]}
                            status={s.replayStatus}
                        />
                    ) : (
                        <PlayingToolbar
                            loc={[0, 367, 180, 113]}
                            onNumpad={onNumpad}
                        />
                    )}
                </container>
            );
        };
    },
    statusBarProps
);

export const leftStatusBarUI = new GameUI('left-status-bar', LeftStatusBar);
export const rightStatusBarUI = new GameUI('right-status-bar', RightStatusBar);
