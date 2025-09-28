import { GameUI, SetupComponentOptions } from '@motajs/system-ui';
import { computed, ComputedRef, defineComponent, shallowReactive } from 'vue';
import { TextContent } from '../components';
import {
    DefaultProps,
    ElementLocator,
    Font,
    SizedCanvasImageSource
} from '@motajs/render';
import { MixedToolbar, ReplayingStatus } from './toolbar';
import { openViewMap } from './viewmap';
import { mainUIController } from './controller';
import {
    MAIN_HEIGHT,
    MAIN_WIDTH,
    STATUS_BAR_HEIGHT,
    STATUS_BAR_WIDTH
} from '../shared';

export interface ILeftHeroStatus {
    /** 楼层 id */
    floor: FloorIds;
    /** 等级名称 */
    lv: string;
    /** 生命值 */
    hp: number;
    /** 生命上限 */
    hpmax: number;
    /** 魔力值 */
    mana: number;
    /** 魔力上限 */
    manamax: number;
    /** 攻击力 */
    atk: number;
    /** 防御力 */
    def: number;
    /** 魔防（护盾） */
    mdef: number;
    /** 金币 */
    money: number;
    /** 经验值 */
    exp: number;
    /** 距离升级剩余经验 */
    up: number;
    /** 黄钥匙数量 */
    yellowKey: number;
    /** 蓝钥匙数量 */
    blueKey: number;
    /** 红钥匙数量 */
    redKey: number;
    /** 绿钥匙数量 */
    greenKey: number;
    /** 破数量 */
    pickaxe: number;
    /** 炸数量 */
    bomb: number;
    /** 飞数量 */
    centerFly: number;
    /** 是否中毒 */
    poison: boolean;
    /** 是否中衰 */
    weak: boolean;
    /** 是否中咒 */
    curse: boolean;
    /** 录像状态 */
    replay: ReplayingStatus;
}

export interface IRightHeroStatus {
    /** 示例属性，以游戏难度作为示例 */
    exampleHard: number;
}

interface StatusInfo {
    /** 图标 */
    icon: SizedCanvasImageSource;
    /** 属性值，经过格式化 */
    value: ComputedRef<string>;
    /** 字体 */
    font: Font;
    /** 文字颜色 */
    color: CanvasStyle;
}

interface KeyLikeItem {
    /** 属性值，经过格式化 */
    value: ComputedRef<string>;
    /** 字体 */
    font: Font;
    /** 文字颜色 */
    color: CanvasStyle;
}

interface KeyLikeInfo {
    /** 这一行包含的内容 */
    items: KeyLikeItem[];
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
        //#region 参数定义

        /** 属性文字的横坐标 */
        const TEXT_X = 54;
        /** 图标的横坐标 */
        const STATUS_PAD = 8;
        /** 楼层名称的高度 */
        const TITLE_HEIGHT = 36;
        /** 状态属性的开始纵坐标 */
        const STATUS_Y = TITLE_HEIGHT + STATUS_PAD;

        // 可以换成 core.material.images.images['xxx.png'] 来使用全塔属性注册的图片
        const hpIcon = core.statusBar.icons.hp;
        const atkIcon = core.statusBar.icons.atk;
        const defIcon = core.statusBar.icons.def;
        const mdefIcon = core.statusBar.icons.mdef;
        const moneyIcon = core.statusBar.icons.money;
        const expIcon = core.statusBar.icons.exp;
        const manaIcon = core.statusBar.icons.mana;
        const lvIcon = core.statusBar.icons.lv;

        const s = p.status;

        /** 常规字体 */
        const font1 = Font.defaults({ size: 18 });
        /** 加粗字体 */
        const font2 = Font.defaults({ size: 18, weight: 700 });

        /** 楼层名 */
        const floorName = computed(() => core.floors[s.floor]?.title ?? '');

        /** 钥匙显示文字 */
        const key = (num: number) => {
            return num.toString().padStart(2, '0');
        };

        //#region 属性显示

        /** 一般属性 */
        const statusInfo: StatusInfo[] = shallowReactive([]);
        /** 钥匙属性 */
        const keyLike: KeyLikeInfo[] = shallowReactive([]);

        // 根据全塔属性配置显示属性
        // 如果你想修改状态栏显示，不建议修改这里的内容，而建议直接新增标签
        // 这里的内容是为使用样板默认状态栏的人准备的，对于新增属性来说过于复杂，而且功能有限，对于新手来说也难以理解
        // 可以参考说明文档中的常见需求指南中的新增状态教程

        const list = core.flags.statusBarItems;

        // 等级
        if (list.includes('enableLv')) {
            statusInfo.push({
                icon: lvIcon,
                value: computed(() => s.lv),
                font: font1,
                color: '#fff'
            });
        }

        // 生命值
        if (list.includes('enableHP')) {
            if (list.includes('enableHPMax')) {
                // 如果启用血限
                statusInfo.push({
                    icon: hpIcon,
                    value: computed(() => {
                        const hp = core.formatBigNumber(s.hp);
                        const hpmax = core.formatBigNumber(s.hpmax);
                        return `${hp} / ${hpmax}`;
                    }),
                    font: font1,
                    color: '#fff'
                });
            } else {
                // 如果禁用血限
                statusInfo.push({
                    icon: hpIcon,
                    value: computed(() => core.formatBigNumber(s.hp)),
                    font: font1,
                    color: '#fff'
                });
            }
        }

        // 魔力
        if (list.includes('enableMana')) {
            statusInfo.push({
                icon: manaIcon,
                value: computed(() => {
                    const mana = core.formatBigNumber(s.mana);
                    const manamax = core.formatBigNumber(s.manamax);
                    if (s.manamax > 0) {
                        // 如果启用魔力上限
                        return `${mana} / ${manamax}`;
                    } else {
                        // 如果禁用魔力上限
                        return mana;
                    }
                }),
                font: font1,
                color: '#fff'
            });
        }

        // 攻击力
        if (list.includes('enableAtk')) {
            statusInfo.push({
                icon: atkIcon,
                value: computed(() => core.formatBigNumber(s.atk)),
                font: font1,
                color: '#fff'
            });
        }

        // 防御力
        if (list.includes('enableDef')) {
            statusInfo.push({
                icon: defIcon,
                value: computed(() => core.formatBigNumber(s.def)),
                font: font1,
                color: '#fff'
            });
        }

        // 魔防（护盾）
        if (list.includes('enableMdef')) {
            statusInfo.push({
                icon: mdefIcon,
                value: computed(() => core.formatBigNumber(s.mdef)),
                font: font1,
                color: '#fff'
            });
        }

        // 金币
        if (list.includes('enableMoney')) {
            statusInfo.push({
                icon: moneyIcon,
                value: computed(() => core.formatBigNumber(s.money)),
                font: font1,
                color: '#fff'
            });
        }

        // 经验值
        if (list.includes('enableExp')) {
            if (list.includes('enableLevelUp')) {
                // 升级模式
                statusInfo.push({
                    icon: expIcon,
                    value: computed(() => core.formatBigNumber(s.up)),
                    font: font1,
                    color: '#fff'
                });
            } else {
                // 非升级模式
                statusInfo.push({
                    icon: expIcon,
                    value: computed(() => core.formatBigNumber(s.exp)),
                    font: font1,
                    color: '#fff'
                });
            }
        }

        // 钥匙
        if (list.includes('enableKeys')) {
            const keys: KeyLikeItem[] = [];
            keyLike.push({ items: keys });
            // 黄钥匙
            keys.push({
                value: computed(() => key(s.yellowKey)),
                font: font2,
                color: '#fca'
            });
            // 蓝钥匙
            keys.push({
                value: computed(() => key(s.blueKey)),
                font: font2,
                color: '#aad'
            });
            // 红钥匙
            keys.push({
                value: computed(() => key(s.redKey)),
                font: font2,
                color: '#f88'
            });
            // 绿钥匙
            if (list.includes('enableGreenKey')) {
                keys.push({
                    value: computed(() => key(s.greenKey)),
                    font: font2,
                    color: '#8f8'
                });
            }
        }

        // 破炸飞
        if (list.includes('enablePZF')) {
            const items: KeyLikeItem[] = [];
            keyLike.push({ items });
            items.push({
                value: computed(() => `破 ${s.pickaxe}`),
                font: font1,
                color: '#bc6e27'
            });
            items.push({
                value: computed(() => `炸 ${s.bomb}`),
                font: font1,
                color: '#fa14b9'
            });
            items.push({
                value: computed(() => `飞 ${s.centerFly}`),
                font: font1,
                color: '#8db600'
            });
        }

        // 毒衰咒
        if (list.includes('enableDebuff')) {
            const debuffs: KeyLikeItem[] = [];
            keyLike.push({ items: debuffs });
            debuffs.push({
                value: computed(() => (s.poison ? '毒' : '')),
                font: font1,
                color: '#affca8'
            });
            debuffs.push({
                value: computed(() => (s.weak ? '衰' : '')),
                font: font1,
                color: '#feccd0'
            });
            debuffs.push({
                value: computed(() => (s.curse ? '咒' : '')),
                font: font1,
                color: '#c2f4e7'
            });
        }

        //#region 布局控制

        /** 用于显示状态的高度，高度=状态栏高度-工具栏高度-楼层名高度-填充高度 */
        const statusHeight =
            STATUS_BAR_HEIGHT - 113 - TITLE_HEIGHT - STATUS_PAD * 2;

        /** 每一行的高度 */
        const rowHeight = computed(() => {
            const length = statusInfo.length + keyLike.length;
            return statusHeight / length;
        });
        /** 钥匙、破炸飞、毒衰咒开始显示的纵坐标 */
        const keyStart = computed(() => {
            const statusHeight = statusInfo.length * rowHeight.value;
            return STATUS_Y + statusHeight;
        });

        /**
         * 左右居中布局
         * @param y 纵坐标
         */
        const central = (y: number): ElementLocator => {
            const width = p.loc[2] ?? 200;
            return [width / 2, y, void 0, void 0, 0.5, 0.5];
        };

        /**
         * 点击楼层名打开浏览地图
         */
        const viewMap = () => {
            openViewMap(mainUIController, [0, 0, MAIN_WIDTH, MAIN_HEIGHT]);
        };

        return () => (
            <container loc={p.loc} hidden={p.hidden}>
                <text
                    text={floorName.value}
                    loc={central(18)}
                    font={font1}
                    cursor="pointer"
                    onClick={viewMap}
                ></text>
                <g-line
                    lineWidth={1}
                    strokeStyle="#888"
                    line={[0, TITLE_HEIGHT, STATUS_BAR_WIDTH, TITLE_HEIGHT]}
                />
                {statusInfo
                    .map((v, i) => {
                        const h = rowHeight.value;
                        const y = STATUS_Y + i * h;
                        const cy = y + h / 2;
                        const iconSize = Math.min(32, h * 0.8);
                        const pad = (h - iconSize) / 2;
                        return [
                            <image
                                loc={[STATUS_PAD, y + pad, iconSize, iconSize]}
                                image={v.icon}
                                noanti // 取消抗锯齿
                            />,
                            <text
                                loc={[TEXT_X, cy]}
                                anc={[0, 0.5]}
                                text={v.value.value}
                                fillStyle={v.color}
                                font={v.font}
                            />
                        ];
                    })
                    .flat()}
                {keyLike
                    .map(({ items }, i) => {
                        const h = rowHeight.value;
                        const y = keyStart.value + i * h;
                        const cy = y + h / 2;
                        const rw = STATUS_BAR_WIDTH / (items.length + 1);
                        return items.map((v, i) => {
                            const x = rw * (i + 1);
                            return (
                                <text
                                    loc={[x, cy]}
                                    anc={[0.5, 0.5]}
                                    text={v.value.value}
                                    font={v.font}
                                    fillStyle={v.color}
                                />
                            );
                        });
                    })
                    .flat()}
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
                <MixedToolbar
                    loc={[0, MAIN_HEIGHT - 113, STATUS_BAR_WIDTH, 113]}
                    status={s.replay}
                />
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
