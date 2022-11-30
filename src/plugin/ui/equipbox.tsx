import { has } from '../utils';

/**
 * 获取所有装备
 */
export function getEquips() {
    return Object.entries(core.status.hero.items.equips);
}

/**
 * 获取装备增加的属性
 * @param equip 装备
 */
export function getAddStatus(equip: Equip) {
    const toGet = Object.assign({}, equip.value, equip.percentage);
    const keys = Object.keys(toGet);

    return (
        <div class="equip-add-detail">
            {keys.map(v => {
                const value =
                    (equip.value[v] ?? 0) +
                    core.status.hero[v] * (equip.percentage[v] ?? 0);

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
export function getNowStatus(nowEquip?: Equip) {
    const toShow = ['hp', 'lv', 'atk', 'def', 'mdef', 'mana', 'hpmax', 'money'];

    return (
        <div id="hero-status">
            {toShow.map(v => {
                let status: string;
                if (v === 'up') status = core.getNextLvUpNeed()?.toString();
                else if (v === 'lv') status = core.getLvName() ?? '';
                else status = core.getRealStatus(v)?.toString();

                let add = 0;
                if (has(nowEquip)) {
                    add += nowEquip.value[v] ?? 0;
                    const per = nowEquip.percentage[v] * core.getStatus(v);
                    add += isNaN(per) ? 0 : per;
                }

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
