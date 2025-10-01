import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent } from 'vue';
import { waitbox, ListPage, TextContent } from '../components';
import { DefaultProps } from '@motajs/render-vue';
import { ItemState } from '@user/data-state';

// 未完工

export interface StatisticsDataOneFloor {
    enemyCount: number;
    potionCount: number;
    gemCount: number;
    potionValue: number;
    atkValue: number;
    defValue: number;
    mdefValue: number;
    atkGemCount: number;
    defGemCount: number;
    mdefGemCount: number;
}

export interface StatisticsDataPotionGem {
    atkGemCount: number;
    defGemCount: number;
    mdefGemCount: number;
    potionCount: number;
}

export interface StatisticsData {
    total: StatisticsDataOneFloor;
    floors: Map<FloorIds, StatisticsDataOneFloor>;
    potionGem: StatisticsDataPotionGem;
}

export interface StatisticsProps extends UIComponentProps, DefaultProps {
    data: StatisticsData;
}

const statisticsProps = {
    props: ['data', 'controller', 'instance']
} satisfies SetupComponentOptions<StatisticsProps>;

export const Statistics = defineComponent<StatisticsProps>(props => {
    const list: [string, string][] = [
        ['total', '总览'],
        ['floor', '楼层'],
        ['enemy', '怪物'],
        ['potion', '血瓶宝石']
    ];

    const close = () => {
        props.controller.close(props.instance);
    };

    return () => (
        <ListPage
            list={list}
            selected="total"
            loc={[180, 0, 480, 480]}
            height={470}
            close
            onClose={close}
            lineHeight={24}
            closeLoc={[10, 470, void 0, void 0, 0, 1]}
        >
            {{
                total: () => <TotalStatistics data={props.data} />,
                floor: () => <FloorStatistics data={props.data} />,
                enemy: () => <EnemyStatistics data={props.data} />,
                potion: () => <PotionStatistics data={props.data} />
            }}
        </ListPage>
    );
}, statisticsProps);

interface StatisticsPanelProps extends DefaultProps {
    data: StatisticsData;
}

const statisticsPanelProps = {
    props: ['data']
} satisfies SetupComponentOptions<StatisticsPanelProps>;

const TotalStatistics = defineComponent<StatisticsPanelProps>(props => {
    return () => {
        const total = props.data.total;

        const text1 = `全塔地图中，共有怪物${total.enemyCount}个。`;
        const text2 = `共有宝石${total.gemCount}个，共加攻击力${total.atkValue}点、防御力${total.defValue}点，魔防${total.mdefValue}点。`;
        const text3 = `共有血瓶${total.potionCount}个，共加生命值${total.potionValue}点。`;

        return (
            <TextContent
                text={`${text1}${text2}${text3}`}
                width={330}
                loc={[0, 5, 330, 470]}
                height={470}
                lineHeight={9}
            ></TextContent>
        );
    };
}, statisticsPanelProps);

const FloorStatistics = defineComponent<StatisticsPanelProps>(props => {
    return () => <container></container>;
}, statisticsPanelProps);

const EnemyStatistics = defineComponent<StatisticsPanelProps>(props => {
    return () => <container></container>;
}, statisticsPanelProps);

const PotionStatistics = defineComponent<StatisticsPanelProps>(props => {
    return () => {
        const gemPotion = props.data.potionGem;

        const text1 = `全塔地图中，共有红宝石${gemPotion.atkGemCount}个，共有蓝宝石${gemPotion.defGemCount}个，共有缘宝石${gemPotion.mdefGemCount}个。`;
        const text2 = `共有血瓶${gemPotion.potionCount}个。`;
        return (
            <TextContent
                text={`${text1}${text2}`}
                width={330}
                loc={[0, 5, 330, 470]}
                height={470}
                lineHeight={9}
            ></TextContent>
        );
    };
}, statisticsPanelProps);

export function calculateStatisticsOne(
    floorId: FloorIds,
    diff?: Map<string, number>
) {
    core.setFlag('__statistics__', true);
    const hasDiff = !!diff;
    if (!hasDiff) {
        diff = new Map();
        const hero = core.status.hero;
        const handler: ProxyHandler<HeroStatus> = {
            set(target, p, newValue) {
                if (typeof p !== 'string') return true;
                if (typeof newValue === 'number') {
                    const value = diff!.get(p) ?? 0;
                    const delta =
                        newValue - (target[p as keyof HeroStatus] as number);
                    diff!.set(p, value + delta);
                }
                return true;
            }
        };
        const proxy = new Proxy(hero, handler);
        core.status.hero = proxy;
    }
    core.extractBlocks(floorId);
    const statistics: StatisticsDataOneFloor = {
        enemyCount: 0,
        potionCount: 0,
        gemCount: 0,
        potionValue: 0,
        atkValue: 0,
        defValue: 0,
        mdefValue: 0,
        atkGemCount: 0,
        defGemCount: 0,
        mdefGemCount: 0
    };
    if (!diff) return statistics;
    core.status.maps[floorId].blocks.forEach(v => {
        if (v.event.cls === 'enemys' || v.event.cls === 'enemy48') {
            statistics.enemyCount++;
        } else if (v.event.cls === 'items') {
            const item = ItemState.items.get(v.event.id as AllIdsOf<'items'>);
            if (!item) return;
            if (item.cls === 'items') {
                try {
                    item.itemEffectFn?.();
                } catch {
                    // pass
                }
                const hp = diff.get('hp') ?? 0;
                const atk = diff.get('atk') ?? 0;
                const def = diff.get('def') ?? 0;
                const mdef = diff.get('mdef') ?? 0;
                if (hp > 0) {
                    statistics.potionCount++;
                    statistics.potionValue += hp;
                }
                if (atk > 0 || def > 0 || mdef > 0) {
                    statistics.gemCount++;
                }
                if (atk > 0) {
                    statistics.atkValue += atk;
                    statistics.atkGemCount++;
                }
                if (def > 0) {
                    statistics.defValue += def;
                    statistics.defGemCount++;
                }
                if (mdef > 0) {
                    statistics.mdefValue += mdef;
                    statistics.mdefGemCount++;
                }
            }
        }
        diff.clear();
    });

    if (!hasDiff) {
        core.status.hero = hero;
        window.hero = hero;
        window.flags = core.status.hero.flags;
    }
    core.removeFlag('__statistics__');
    return statistics;
}

export function calculateStatistics(): StatisticsData {
    core.setFlag('__statistics__', true);
    const hero = core.status.hero;
    const diff = new Map<string, number>();
    const handler: ProxyHandler<HeroStatus> = {
        set(target, p, newValue) {
            if (typeof p !== 'string') return true;
            if (typeof newValue === 'number') {
                const value = diff!.get(p) ?? 0;
                const delta =
                    newValue - (target[p as keyof HeroStatus] as number);
                diff!.set(p, value + delta);
            }
            return true;
        }
    };
    const proxy = new Proxy(hero, handler);
    core.status.hero = proxy;

    const floors = new Map<FloorIds, StatisticsDataOneFloor>();
    core.floorIds.forEach(v => {
        const statistics = calculateStatisticsOne(v, diff);
        floors.set(v, statistics);
    });

    core.status.hero = hero;
    window.hero = hero;
    window.flags = core.status.hero.flags;
    core.removeFlag('__statistics__');

    const total = floors.values().reduce((prev, curr) => {
        prev.atkValue += curr.atkValue;
        prev.defValue += curr.defValue;
        prev.enemyCount += curr.enemyCount;
        prev.gemCount += curr.gemCount;
        prev.mdefValue += curr.mdefValue;
        prev.potionCount += curr.potionCount;
        prev.potionValue += curr.potionValue;
        return prev;
    });

    const potionGem = floors.values().reduce((prev, curr) => {
        prev.atkGemCount += curr.atkGemCount;
        prev.defGemCount += curr.defGemCount;
        prev.mdefGemCount += curr.mdefGemCount;
        prev.potionCount += curr.potionCount;
        return prev;
    });

    return {
        total,
        floors,
        potionGem
    };
}

/**
 * 打开数据统计界面
 * @param controller 要在哪个 UI 控制器上打开
 */
export async function openStatistics(controller: IUIMountable) {
    const cal = Promise.resolve().then<StatisticsData>(() => {
        return new Promise(res => {
            const data = calculateStatistics();
            res(data);
        });
    });
    const data = await waitbox(
        controller,
        [240 + 180, 240, void 0, void 0, 0.5, 0.5],
        240,
        cal,
        {
            text: '正在统计...'
        }
    );
    controller.open(StatisticsUI, { data: data });
}

export const StatisticsUI = new GameUI('statistics', Statistics);
