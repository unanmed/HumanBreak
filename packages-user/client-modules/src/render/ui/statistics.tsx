import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent } from 'vue';
import { ListPage } from '../components/list';
import { waitbox } from '../components';
import { DefaultProps } from '@motajs/render-vue';
import { ItemState } from '@user/data-state';

interface StatisticsDataOneFloor {
    enemyCount: number;
    potionCount: number;
    gemCount: number;
    potionValue: number;
    atkValue: number;
    defValue: number;
    mdefValue: number;
}

interface StatisticsData {
    total: StatisticsDataOneFloor;
    floors: Map<FloorIds, StatisticsDataOneFloor>;
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
    return () => (
        <container>
            <text text="测试"></text>
        </container>
    );
}, statisticsPanelProps);

const FloorStatistics = defineComponent<StatisticsPanelProps>(props => {
    return () => <container></container>;
}, statisticsPanelProps);

const EnemyStatistics = defineComponent<StatisticsPanelProps>(props => {
    return () => <container></container>;
}, statisticsPanelProps);

const PotionStatistics = defineComponent<StatisticsPanelProps>(props => {
    return () => <container></container>;
}, statisticsPanelProps);

function calculateStatistics(): StatisticsData {
    core.setFlag('__statistics__', true);
    const hero = core.status.hero;
    const diff: Record<string | symbol, number> = {};
    const handler: ProxyHandler<HeroStatus> = {
        set(_target, p, newValue) {
            if (typeof newValue === 'number') {
                diff[p] ??= 0;
                diff[p] += newValue;
            }
            return true;
        }
    };
    const proxy = new Proxy(hero, handler);
    core.status.hero = proxy;

    const floors = new Map<FloorIds, StatisticsDataOneFloor>();
    core.floorIds.forEach(v => {
        core.extractBlocks(v);
        const statistics: StatisticsDataOneFloor = {
            enemyCount: 0,
            potionCount: 0,
            gemCount: 0,
            potionValue: 0,
            atkValue: 0,
            defValue: 0,
            mdefValue: 0
        };
        core.status.maps[v].blocks.forEach(v => {
            if (v.event.cls === 'enemys' || v.event.cls === 'enemy48') {
                statistics.enemyCount++;
            } else if (v.event.cls === 'items') {
                const item = ItemState.items.get(
                    v.event.id as AllIdsOf<'items'>
                );
                if (!item) return;
                if (item.cls === 'items') {
                    try {
                        item.itemEffectFn?.();
                    } catch {
                        // pass
                    }
                    if (diff.hp > 0) {
                        statistics.potionCount++;
                        statistics.potionValue += diff.hp;
                    }
                    if (diff.atk > 0 || diff.def > 0 || diff.mdef > 0) {
                        statistics.gemCount++;
                    }
                    if (diff.atk > 0) {
                        statistics.atkValue += diff.atk;
                    }
                    if (diff.def > 0) {
                        statistics.defValue += diff.def;
                    }
                    if (diff.mdef > 0) {
                        statistics.mdefValue += diff.mdef;
                    }
                }
            }
            for (const key of Object.keys(diff)) {
                diff[key] = 0;
            }
        });
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

    return {
        total,
        floors
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
