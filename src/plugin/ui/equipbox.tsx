import { has } from '../utils';

/**
 * 获取所有装备
 */
export function getEquips(): [ItemIdOf<'equips'>, number][] {
    return Object.entries(core.status.hero.items.equips) as [
        ItemIdOf<'equips'>,
        number
    ][];
}

/**
 * 获取装备增加的属性
 * @param equip 装备
 */
export function getAddStatus(equip: Equip) {
    const toGet = Object.assign({}, equip.value, equip.percentage);
    const keys = Object.keys(toGet) as (keyof typeof toGet)[];

    return (
        <div class="equip-add-detail">
            {keys.map(v => {
                const value =
                    (equip.value[v] ?? 0) +
                    Math.floor(
                        (core.status.hero[v] * (equip.percentage[v] ?? 0)) / 100
                    );

                return (
                    <span style="display: flex">
                        <span style="flex-basis: 50%">
                            {core.getStatusLabel(v)}
                        </span>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <span
                            style={{
                                color: value > 0 ? 'lightgreen' : 'lightsalmon'
                            }}
                        >
                            {value > 0 ? `+${value}` : value}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

/**
 * 获取当前勇士属性，如果有选中的装备，会在后面追加显示增加量
 * @param nowEquip 当前选中的装备
 */
export function getNowStatus(nowEquip?: Equip, onCol: boolean = false) {
    const toShow = [
        'hp',
        'lv',
        'atk',
        'def',
        'mdef',
        'mana',
        'hpmax',
        'money'
    ] as (keyof SelectType<HeroStatus, number>)[];

    return (
        <div id="hero-status">
            {toShow.map(v => {
                let status: string;
                if (v === 'lv') status = core.getLvName() ?? '';
                else status = core.getRealStatus(v)?.toString();

                let add = 0;
                if (has(nowEquip)) {
                    add += nowEquip.value[v] ?? 0;
                    const per = Math.floor(
                        (nowEquip.percentage[v] * core.getStatus(v)) / 100
                    );
                    add += isNaN(per) ? 0 : per;
                }
                if (onCol) add = -add;

                return (
                    <div class="hero-status-one">
                        <span class="hero-status-label">
                            {core.getStatusLabel(v)}
                        </span>
                        <div class="hero-status-value">
                            <span style="margin-right: 20%">{status}</span>
                            {add !== 0 && (
                                <span
                                    style={{
                                        color:
                                            add > 0
                                                ? 'lightgreen'
                                                : 'lightsalmon'
                                    }}
                                >
                                    {add > 0 ? '+' + add : '-' + -add}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
