import { fixedUi } from '@/core/main/init/ui';
import type { DamageEnemy } from './game/enemy/damage';
import { tip } from './utils';
import { ref, Ref } from 'vue';
import { hook } from '@/core/main/game';

export interface MarkInfo<T extends EnemyIds> {
    id: T;
    enemy: DamageEnemy<T>;
    /**
     * 提示模式，从低到高位数分别为：
     * 1. 踩临界时
     * 2. 能打过怪物时
     * 3. 小于勇士生命值的2/3时
     * 4. 小于勇士生命值的1/3时
     * 5. 零伤时
     * 6. 小于指定伤害时
     */
    mode: number;
    /** 当前提示状态，提示模式的 2-6 */
    status: number;
    lastAtk: number;
    lastDamage: number;
    markDamage?: number;
    /** 数据更新用，取反更新标记信息 */
    update: Ref<boolean>;
}

const uiMap = new Map<EnemyIds, number>();
const marked: MarkInfo<EnemyIds>[] = [];

/**
 * 标记一个怪物，标记后的怪物会在勇士刚好能打过怪物时、伤害刚好小于勇士生命值的2/3和1/3时、踩到临界时提示
 * @param id 标记的怪物id
 */
export function markEnemy(id: EnemyIds) {
    if (hasMarkedEnemy(id)) return;
    const { DamageEnemy } = Mota.Plugin.require('damage_g');
    const enemy = new DamageEnemy(core.material.enemys[id]);
    enemy.calAttribute();
    enemy.getRealInfo();

    const info: MarkInfo<EnemyIds> = {
        id,
        enemy,
        mode: 0b011111,
        lastAtk: Mota.Plugin.require('hero_g').getHeroStatusOn('atk', 'empty'),
        lastDamage: enemy.calDamage().damage,
        status: 0b0,
        update: ref(true)
    };
    marked.push(info);

    uiMap.set(id, fixedUi.open('markedEnemy', { enemy: info }));

    tip('success', `已标记 ${enemy.enemy.name}！`);
}

export function unmarkEnemy(id: EnemyIds) {
    fixedUi.close(uiMap.get(id) ?? -1);
    uiMap.delete(id);
    const index = marked.findIndex(v => v.id === id);
    if (index === -1) return;
    tip('success', `已取消标记 ${marked[index].enemy.enemy.name}！`);
    marked.splice(index, 1);
}

export function checkMarkedEnemy() {
    const { getHeroStatusOn } = Mota.Plugin.require('hero_g');
    marked.forEach(v => {
        const { id, enemy, mode, lastAtk, lastDamage, markDamage } = v;
        const atk = getHeroStatusOn('atk', 'empty');
        let tip = 0;
        if (mode & 0b11110) {
            const damage = enemy.calDamage().damage;
            const hp = core.status.hero.hp;
            v.lastDamage = damage;
            if (damage > lastDamage) return;
            // 重置标记状态
            if (damage > hp) {
                v.status &= 0b100001;
            }
            if (damage > (markDamage ?? Infinity)) {
                v.status &= 0b1;
            }
            // 能打过怪物提示、2/3提示、1/3提示、零伤提示、指定伤害提示
            if (mode & (1 << 1) && damage < hp && damage > (hp * 2) / 3) {
                if (!(v.status & (1 << 1))) {
                    v.status &= 0b100001;
                    v.status |= 1 << 1;
                    tip |= 1 << 1;
                }
            } else if (mode & (1 << 2) && damage > hp / 3) {
                if (!(v.status & (1 << 2))) {
                    v.status &= 0b100011;
                    v.status |= 1 << 2;
                    tip |= 1 << 2;
                }
            } else if (mode & (1 << 3) && damage > 0) {
                if (!(v.status & (1 << 3))) {
                    v.status &= 0b100111;
                    v.status |= 1 << 3;
                    tip |= 1 << 3;
                }
            } else if (mode & (1 << 4)) {
                if (!(v.status & (1 << 4))) {
                    v.status &= 0b101111;
                    v.status |= 1 << 4;
                    tip |= 1 << 4;
                }
            }
            if (mode & (1 << 5) && damage < (markDamage ?? Infinity)) {
                if (!(v.status & (1 << 5))) {
                    if (damage < (markDamage ?? Infinity)) {
                        v.status |= 1 << 5;
                    } else {
                        v.status &= 0b011111;
                    }
                }
            }
        }
        // 临界提示
        if (mode & (1 << 0)) {
            const critical = enemy.calCritical(1)[0]?.atkDelta ?? Infinity;
            v.lastAtk = atk + critical;
            if (critical + atk > lastAtk) {
                tip |= 1 << 0;
            }
        }
        makeTip(id, tip, v);
        v.update.value = !v.update.value;
    });
}

function makeTip(enemy: EnemyIds, mode: number, info: MarkInfo<EnemyIds>) {
    const name = core.material.enemys[enemy].name;
    if (mode & (1 << 0)) {
        tip('success', `已踩到 ${name} 的临界！`);
    }
    if (mode & (1 << 1)) {
        tip('success', `已能打过 ${name}！`);
    }
    if (mode & (1 << 2)) {
        tip('success', `${name} 的伤害已降至 2/3！`);
    }
    if (mode & (1 << 3)) {
        tip('success', `${name} 的伤害已降至 1/3！`);
    }
    if (mode & (1 << 4)) {
        tip('success', `${name} 已零伤！`);
    }
    if (mode & (1 << 5)) {
        const damage = core.formatBigNumber(info.markDamage ?? Infinity);
        tip('success', `${name} 的伤害已降至 ${damage}！`);
    }
}

export function hasMarkedEnemy(id: EnemyIds) {
    return marked.some(v => v.id === id);
}

hook.on('statusBarUpdate', () => {
    checkMarkedEnemy();
});
