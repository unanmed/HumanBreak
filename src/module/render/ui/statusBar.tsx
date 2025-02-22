import { GameUI } from '@/core/system';
import { defineComponent } from 'vue';
import { SetupComponentOptions } from '../components';
import { ElementLocator } from '@/core/render';
import { Scroll } from '../components/scroll';
import { Page } from '../components/page';

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

export interface IRightHeroStatus {}

interface StatusBarProps<T> {
    loc: ElementLocator;
    status: T;
}

const statusBarProps = {
    props: ['loc', 'status']
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

        const floorName = core.floors[s.floor].title;

        const key = (num: number) => {
            return num.toString().padStart(2, '0');
        };

        const font1 = '18px normal';
        const font2 = 'bold 18px normal';
        const font3 = 'bold 14px normal';

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
                <container loc={p.loc}>
                    <g-rect loc={[0, 0, p.loc[2], p.loc[3]]} stroke></g-rect>
                    <text
                        text={floorName}
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

export const RightStatusBar = defineComponent<StatusBarProps<IRightHeroStatus>>(
    p => {
        return () => {
            return (
                <container loc={p.loc}>
                    <g-rect loc={[0, 0, p.loc[2], p.loc[3]]} stroke></g-rect>
                    <Scroll loc={[0, 0, 180, 100]}></Scroll>
                    <Page loc={[0, 200, 180, 100]} pages={3}>
                        {(page: number) => {
                            switch (page) {
                                case 1: {
                                    return <text text="测试"></text>;
                                }
                                case 2: {
                                    return <text text="测试2"></text>;
                                }
                                case 3: {
                                    return <text text="测试3"></text>;
                                }
                            }
                        }}
                    </Page>
                </container>
            );
        };
    },
    statusBarProps
);

export const leftStatusBarUI = new GameUI('left-status-bar', LeftStatusBar);
export const rightStatusBarUI = new GameUI('right-status-bar', RightStatusBar);
