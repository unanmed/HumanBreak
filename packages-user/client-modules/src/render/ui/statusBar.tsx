import { GameUI, SetupComponentOptions } from '@motajs/system-ui';
import { computed, defineComponent, ref } from 'vue';
import { TextContent } from '../components';
import { DefaultProps, ElementLocator, Font } from '@motajs/render';
import {
    NumpadToolbar,
    PlayingToolbar,
    ReplayingStatus,
    ReplayingToolbar
} from './toolbar';
import { openViewMap } from './viewmap';
import { mainUIController } from './controller';
import { MAIN_HEIGHT, STATUS_BAR_WIDTH } from '../shared';

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
    replay: ReplayingStatus;
}

export interface IRightHeroStatus {
    /** 示例属性，以游戏难度作为示例 */
    exampleHard: number;
}

interface StatusBarProps<T> extends DefaultProps {
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

        const inNumpad = ref(false);

        const floorName = computed(() => core.floors[s.floor]?.title ?? '');

        const key = (num: number) => {
            return num.toString().padStart(2, '0');
        };

        const onNumpad = () => {
            inNumpad.value = !inNumpad.value;
        };

        const font1 = Font.defaults({ size: 18 });
        const font2 = Font.defaults({ size: 18, weight: 700 });

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

        const keyCount = 3;
        const keyY = 92 + 44 * 6;
        const keyLoc = (n: number): ElementLocator => {
            const width = p.loc[2] ?? 200;
            const per = width / (keyCount + 1);
            return [per * (n + 1), keyY, void 0, void 0, 0.5, 0.5];
        };

        const viewMap = () => {
            openViewMap(mainUIController, [0, 0, 840, 480]);
        };

        return () => (
            <container loc={p.loc} hidden={p.hidden}>
                <text
                    text={floorName.value}
                    loc={central(24)}
                    font={font1}
                    cursor="pointer"
                    onClick={viewMap}
                ></text>
                <text text={s.lv} loc={central(54)} font={font1}></text>
                <image image={hpIcon} loc={iconLoc(0)}></image>
                <text text={f(s.hp)} loc={textLoc(0)} font={font1}></text>
                <image image={atkIcon} loc={iconLoc(1)}></image>
                <text text={f(s.atk)} loc={textLoc(1)} font={font1}></text>
                <image image={defIcon} loc={iconLoc(2)}></image>
                <text text={f(s.def)} loc={textLoc(2)} font={font1}></text>
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
                <g-line
                    lineWidth={1}
                    strokeStyle="#888"
                    line={[
                        0,
                        MAIN_HEIGHT - 113,
                        STATUS_BAR_WIDTH,
                        MAIN_HEIGHT - 113
                    ]}
                />
                {inNumpad.value ? (
                    <NumpadToolbar
                        loc={[0, MAIN_HEIGHT - 113, STATUS_BAR_WIDTH, 113]}
                        onNumpad={onNumpad}
                    />
                ) : s.replay.replaying ? (
                    <ReplayingToolbar
                        loc={[0, MAIN_HEIGHT - 113, STATUS_BAR_WIDTH, 113]}
                        status={s.replay}
                    />
                ) : (
                    <PlayingToolbar
                        loc={[0, MAIN_HEIGHT - 113, STATUS_BAR_WIDTH, 113]}
                        onNumpad={onNumpad}
                    />
                )}
            </container>
        );
    },
    statusBarProps
);

export const RightStatusBar = defineComponent<StatusBarProps<IRightHeroStatus>>(
    p => {
        // p.status 就是你在 main.tsx 中传入的属性内容，用法与左侧状态栏完全一致

        const text = `这里是右侧状态栏，如果左侧状态栏不够用可以在 \\r[gold]statusBar.tsx\\r 中编写内容，如果不需要此状态栏，可以在 \\r[gold]shared.ts\\r 中关闭此状态栏。`;

        return () => {
            return (
                <container loc={p.loc} hidden={p.hidden}>
                    <TextContent
                        loc={[8, 8]}
                        text={text}
                        width={STATUS_BAR_WIDTH - 16}
                        autoHeight
                        lineHeight={8}
                    />
                    <text loc={[8, 270]} text="示例内容" />
                    <text
                        loc={[8, 300]}
                        text={`游戏难度：${p.status.exampleHard}`}
                    />
                </container>
            );
        };
    },
    statusBarProps
);

export const leftStatusBarUI = new GameUI('left-status-bar', LeftStatusBar);
export const rightStatusBarUI = new GameUI('right-status-bar', RightStatusBar);
