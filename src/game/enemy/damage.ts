import { getHeroStatusOf, getHeroStatusOn } from '@/game/hero';
import { Range, RangeCollection } from '@/plugin/game/range';
import {
    checkV2,
    ensureArray,
    formatDamage,
    has,
    manhattan
} from '@/plugin/game/utils';

interface HaloType {
    square: {
        x: number;
        y: number;
        d: number;
    };
}

interface EnemyInfo {
    atk: number;
    def: number;
    hp: number;
    special: number[];
    damageDecline: number;
    atkBuff: number;
    defBuff: number;
    hpBuff: number;
    enemy: Enemy;
    x?: number;
    y?: number;
    floorId?: FloorIds;
}

interface DamageInfo {
    damage: number;
    /** 自动切换技能时使用的技能 */
    skill?: number;
}

interface MapDamage {
    damage: number;
    type: Set<string>;
    mockery?: LocArr[];
}

interface HaloData<T extends keyof HaloType = keyof HaloType> {
    type: T;
    data: HaloType[T];
    special: number;
    from?: DamageEnemy;
}

interface DamageDelta {
    /** 跟最小伤害值的减伤 */
    delta: number;
    damage: number;
    info: DamageInfo;
}

interface CriticalDamageDelta extends Omit<DamageDelta, 'info'> {
    /** 勇士的攻击增量 */
    atkDelta: number;
}

type HaloFn = (info: EnemyInfo, enemy: Enemy) => void;

/** 光环属性 */
export const haloSpecials: number[] = [8, 21, 25, 26, 27];

export class EnemyCollection implements RangeCollection<DamageEnemy> {
    floorId: FloorIds;
    list: DamageEnemy[] = [];

    range: Range<DamageEnemy> = new Range(this);
    mapDamage: Record<string, MapDamage> = {};
    haloList: HaloData[] = [];

    constructor(floorId: FloorIds) {
        this.floorId = floorId;
        this.extract();
    }

    get(x: number, y: number) {
        return this.list.find(v => v.x === x && v.y === y);
    }

    /**
     * 解析本地图的怪物信息
     */
    extract() {
        this.list = [];
        core.extractBlocks(this.floorId);
        core.status.maps[this.floorId].blocks.forEach(v => {
            if (v.event.cls !== 'enemy48' && v.event.cls !== 'enemys') return;
            const enemy = core.material.enemys[v.event.id as EnemyIds];
            this.list.push(
                new DamageEnemy(enemy, v.x, v.y, this.floorId, this)
            );
        });
    }

    /**
     * 计算怪物真实属性
     * @param noCache 是否不使用缓存
     */
    calRealAttribute() {
        this.haloList = [];
        this.list.forEach(v => {
            v.reset();
            v.preProvideHalo();
        });
        this.list.forEach(v => {
            v.calAttribute();
            v.provideHalo();
        });
        this.list.forEach(v => {
            v.getRealInfo();
        });
    }

    /**
     * 计算怪物伤害
     * @param noCache 是否不使用缓存
     */
    calDamage(noCache: boolean = false) {
        if (noCache) this.calRealAttribute();
        this.list.forEach(v => {
            v.calDamage(void 0);
        });
    }

    /**
     * 计算地图伤害
     */
    calMapDamage() {
        this.mapDamage = {};
        const hero = getHeroStatusOn(Damage.realStatus, this.floorId);
        this.list.forEach(v => {
            v.calMapDamage(this.mapDamage, hero);
        });
    }

    /**
     * 向怪物施加光环
     * @param type 光环的范围类型
     * @param data 光环范围信息
     * @param halo 光环效果函数
     * @param recursion 是否递归施加，只有在光环预平衡阶段会使用到
     */
    applyHalo<K extends keyof HaloType>(
        type: K,
        data: HaloType[K],
        halo: HaloFn | HaloFn[],
        recursion: boolean = false
    ) {
        const arr = ensureArray(halo);
        const enemy = this.range.scan(type, data);
        if (!recursion) {
            arr.forEach(v => {
                enemy.forEach(e => {
                    e.injectHalo(v, e.enemy);
                });
            });
        } else {
            enemy.forEach(e => {
                arr.forEach(v => {
                    e.injectHalo(v, e.enemy);
                    e.preProvideHalo();
                });
            });
        }
    }

    /**
     * 预平衡光环
     */
    preBalanceHalo() {
        this.list.forEach(v => {
            v.preProvideHalo();
        });
    }

    render(onMap: boolean = false, cal: boolean = false) {
        if (cal) {
            this.calMapDamage();
        }
        core.status.damage.data = [];
        core.status.damage.extraData = [];
        core.status.damage.dir = [];

        // 怪物伤害
        this.list.forEach(v => {
            if (onMap && !checkV2(v.x, v.y)) return;

            const { damage } = v.calDamage();

            // 伤害全部相等，绘制在怪物本身所在位置
            const { damage: dam, color } = formatDamage(damage);
            const critical = v.calCritical(1)[0];
            core.status.damage.data.push({
                text: dam,
                px: 32 * v.x! + 1,
                py: 32 * (v.y! + 1) - 1,
                color: color
            });
            const setting = Mota.require('var', 'mainSetting');
            const criGem = setting.getValue('screen.criticalGem', false);
            const n = critical?.atkDelta ?? Infinity;
            const ratio = core.status.maps[this.floorId].ratio;
            const cri = criGem ? Math.ceil(n / ratio) : n;

            core.status.damage.data.push({
                text: isFinite(cri) ? cri.toString() : '?',
                px: 32 * v.x! + 1,
                py: 32 * (v.y! + 1) - 11,
                color: '#fff'
            });
        });

        // 地图伤害
        const floor = core.status.maps[this.floorId];
        const width = floor.width;
        const height = floor.height;
        const objs = core.getMapBlocksObj(this.floorId);

        const startX =
            onMap && core.bigmap.v2
                ? Math.max(0, core.bigmap.posX - core.bigmap.extend)
                : 0;
        const endX =
            onMap && core.bigmap.v2
                ? Math.min(
                      width,
                      core.bigmap.posX + core._WIDTH_ + core.bigmap.extend + 1
                  )
                : width;
        const startY =
            onMap && core.bigmap.v2
                ? Math.max(0, core.bigmap.posY - core.bigmap.extend)
                : 0;
        const endY =
            onMap && core.bigmap.v2
                ? Math.min(
                      height,
                      core.bigmap.posY + core._HEIGHT_ + core.bigmap.extend + 1
                  )
                : height;

        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const id = `${x},${y}` as LocString;
                const dam = this.mapDamage[id];
                if (!dam || objs[id]?.event.noPass) continue;

                // 地图伤害
                if (dam.damage !== 0) {
                    const damage = core.formatBigNumber(dam.damage, true);
                    const color = dam.damage < 0 ? '#6eff6a' : '#fa3';
                    core.status.damage.extraData.push({
                        text: damage,
                        px: 32 * x + 16,
                        py: 32 * y + 16,
                        color,
                        alpha: 1
                    });
                }
            }
        }
    }
}

export class DamageEnemy<T extends EnemyIds = EnemyIds> {
    id: T;
    x?: number;
    y?: number;
    floorId?: FloorIds;
    enemy: Enemy<T>;
    col?: EnemyCollection;

    /**
     * 怪物属性。
     * 属性计算流程：预平衡光环(即计算加光环的光环怪的光环) -> 计算怪物在没有光环下的属性
     * -> provide inject 光环 -> 计算怪物的光环加成 -> 计算完毕
     */
    info!: EnemyInfo;

    /** 向其他怪提供过的光环 */
    providedHalo: number[] = [];

    /**
     * 伤害计算进度，0 -> 预平衡光环 -> 1 -> 计算没有光环的属性 -> 2 -> provide inject 光环
     * -> 3 -> 计算光环加成 -> 4 -> 计算完毕
     */
    private progress: number = 0;

    constructor(
        enemy: Enemy<T>,
        x?: number,
        y?: number,
        floorId?: FloorIds,
        col?: EnemyCollection
    ) {
        this.id = enemy.id;
        this.enemy = enemy;
        this.x = x;
        this.y = y;
        this.floorId = floorId;
        this.col = col;
        this.reset();
    }

    reset() {
        const enemy = this.enemy;
        this.info = {
            hp: enemy.hp,
            atk: enemy.atk,
            def: enemy.def,
            special: enemy.special.slice(),
            damageDecline: 0,
            atkBuff: 0,
            defBuff: 0,
            hpBuff: 0,
            enemy: this.enemy,
            x: this.x,
            y: this.y,
            floorId: this.floorId
        };
        this.progress = 0;
        this.providedHalo = [];
    }

    /**
     * 计算怪物在不计光环下的属性，在inject光环之前，预平衡光环之后执行
     */
    calAttribute() {
        if (this.progress !== 1 && has(this.x) && has(this.floorId)) return;
        this.progress = 2;
        const special = this.info.special;
        const info = this.info;
        const floorId = this.floorId ?? core.status.floorId;

        // 智慧之源
        if (flags.hard === 2 && special.includes(14)) {
            info.atk += flags[`inte_${floorId}`] ?? 0;
        }

        // 极昼永夜
        info.atk -= flags[`night_${floorId}`] ?? 0;
        info.def -= flags[`night_${floorId}`] ?? 0;

        // 融化，融化不属于怪物光环，因此不能用provide和inject计算，需要在这里计算
        if (has(flags[`melt_${floorId}`]) && has(this.x) && has(this.y)) {
            for (const [loc, per] of Object.entries(flags[`melt_${floorId}`])) {
                const [mx, my] = loc.split(',').map(v => parseInt(v));
                if (Math.abs(mx - this.x) <= 1 && Math.abs(my - this.y) <= 1) {
                    info.atkBuff += per as number;
                    info.defBuff += per as number;
                }
            }
        }
    }

    /**
     * 获取怪物的真实属性信息，在inject光环后执行
     */
    getRealInfo() {
        if (this.progress < 3 && has(this.x) && has(this.floorId)) {
            throw new Error(
                `Unexpected early real info calculating. Progress: ${this.progress}`
            );
        }
        if (this.progress === 4) return this.info;
        this.progress = 4;

        // 此时已经inject光环，因此直接计算真实属性
        const info = this.info;

        info.atk = Math.floor(info.atk * (info.atkBuff / 100 + 1));
        info.def = Math.floor(info.def * (info.defBuff / 100 + 1));
        info.hp = Math.floor(info.hp * (info.hpBuff / 100 + 1));

        return this.info;
    }

    getHaloSpecials(): number[] {
        if (!this.floorId) return [];
        if (!has(this.x) || !has(this.y)) return [];
        const special = this.info.special ?? this.enemy.special;
        const filter = special.filter(v => {
            return haloSpecials.includes(v) && !this.providedHalo.includes(v);
        });
        if (filter.length === 0) return [];
        const collection = this.col ?? core.status.maps[this.floorId].enemy;
        if (!collection) {
            throw new Error(
                `Unexpected undefined of enemy collection in floor ${this.floorId}.`
            );
        }
        return filter;
    }

    /**
     * 光环预提供，用于平衡所有怪的光环属性，避免出现不同情况下光环效果不一致的现象
     */
    preProvideHalo() {
        if (this.progress !== 0) return;
        this.progress = 1;
    }

    /**
     * 向其他怪提供光环
     */
    provideHalo() {
        if (this.progress !== 2) return;
        this.progress = 3;
        if (!this.floorId) return;
        if (!has(this.x) || !has(this.y)) return;
        const col = this.col ?? core.status.maps[this.floorId].enemy;
        if (!col) return;
        const special = this.getHaloSpecials();

        const square7: HaloFn[] = [];
        const square5: HaloFn[] = [];

        // e 是被加成怪的属性，enemy 是施加光环的怪

        // 抱团
        if (special.includes(8)) {
            square5.push((e, enemy) => {
                if (
                    e.special.includes(8) &&
                    (e.x !== this.x || this.y !== e.y)
                ) {
                    e.atkBuff += enemy.together ?? 0;
                    e.defBuff += enemy.together ?? 0;
                }
            });
            this.providedHalo.push(8);
        }

        // 冰封光环
        if (special.includes(21)) {
            square7.push(e => {
                e.damageDecline += this.enemy.iceHalo ?? 0;
            });
            this.providedHalo.push(21);
            col.haloList.push({
                type: 'square',
                data: { x: this.x, y: this.y, d: 7 },
                special: 21,
                from: this
            });
        }

        // 冰封之核
        if (special.includes(26)) {
            square5.push(e => {
                e.defBuff += this.enemy.iceCore ?? 0;
            });
            this.providedHalo.push(26);
            col.haloList.push({
                type: 'square',
                data: { x: this.x, y: this.y, d: 5 },
                special: 26,
                from: this
            });
        }

        // 火焰之核
        if (special.includes(27)) {
            square5.push(e => {
                e.atkBuff += this.enemy.fireCore ?? 0;
            });
            this.providedHalo.push(27);
            col.haloList.push({
                type: 'square',
                data: { x: this.x, y: this.y, d: 5 },
                special: 27,
                from: this
            });
        }

        col.applyHalo('square', { x: this.x, y: this.y, d: 7 }, square7);
        col.applyHalo('square', { x: this.x, y: this.y, d: 5 }, square5);
    }

    /**
     * 接受其他怪的光环
     */
    injectHalo(halo: HaloFn, enemy: Enemy) {
        halo(this.info, enemy);
    }

    /**
     * 计算怪物伤害
     */
    calDamage(hero: Partial<HeroStatus> = core.status.hero) {
        const enemy = this.getRealInfo();
        return this.calEnemyDamageOf(hero, enemy);
    }

    /**
     * 计算地图伤害
     * @param damage 存入的对象
     */
    calMapDamage(
        damage: Record<string, MapDamage> = {},
        hero: Partial<HeroStatus> = getHeroStatusOn(Damage.realStatus)
    ) {
        if (!has(this.x) || !has(this.y) || !has(this.floorId)) return damage;
        const enemy = this.enemy;
        const floor = core.status.maps[this.floorId];
        const w = floor.width;
        const h = floor.height;

        // 突刺
        if (this.info.special.includes(15)) {
            const range = enemy.range ?? 1;
            const startX = Math.max(0, this.x - range);
            const startY = Math.max(0, this.y - range);
            const endX = Math.min(floor.width - 1, this.x + range);
            const endY = Math.min(floor.height - 1, this.y + range);
            const dam = Math.max((enemy.value ?? 0) - hero.def!, 0);

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    if (
                        !enemy.zoneSquare &&
                        manhattan(x, y, this.x, this.y) > range
                    ) {
                        continue;
                    }
                    const loc = `${x},${y}`;
                    this.setMapDamage(damage, loc, dam, '突刺');
                }
            }
        }

        // 射击
        if (this.info.special.includes(24)) {
            const dirs: Dir[] = ['left', 'down', 'up', 'right'];
            const dam = Math.max((enemy.atk ?? 0) - hero.def!, 0);
            const objs = core.getMapBlocksObj(this.floorId);

            for (const dir of dirs) {
                let x = this.x;
                let y = this.y;
                const { x: dx, y: dy } = core.utils.scan[dir];
                while (x >= 0 && y >= 0 && x < w && y < h) {
                    x += dx;
                    y += dy;
                    const loc = `${x},${y}` as LocString;
                    const block = objs[loc];
                    if (
                        block &&
                        block.event.noPass &&
                        block.event.cls !== 'enemys' &&
                        block.event.cls !== 'enemy48' &&
                        block.id !== 141 &&
                        block.id !== 151
                    ) {
                        break;
                    }
                    this.setMapDamage(damage, loc, dam, '射击');
                }
            }
        }

        return damage;
    }

    setMapDamage(
        damage: Record<string, MapDamage>,
        loc: string,
        dam: number,
        type: string
    ) {
        damage[loc] ??= { damage: 0, type: new Set() };
        damage[loc].damage += dam;
        damage[loc].type.add(type);
    }

    private calEnemyDamageOf(hero: Partial<HeroStatus>, enemy: EnemyInfo) {
        const status = getHeroStatusOf(hero, Damage.realStatus, this.floorId);
        let damage = Damage.calDamageWith(enemy, status) ?? Infinity;
        let skill = -1;

        // 自动切换技能
        if (flags.autoSkill) {
            for (let i = 0; i < skills.length; i++) {
                const [unlock, condition] = skills[i];
                if (!flags[unlock]) continue;
                flags[condition] = true;
                const status = getHeroStatusOf(hero, Damage.realStatus);

                const d = Damage.calDamageWith(enemy, status) ?? Infinity;

                if (d < damage) {
                    damage = d;
                    skill = i;
                }
                flags[condition] = false;
            }
        }

        return { damage, skill };
    }

    /**
     * 计算怪物临界，计算临界时，根据当前方向计算临界，但也会输出与当前最少伤害的伤害差值
     * @param num 要计算多少个临界
     * @param dir 从怪物位置指向勇士的方向
     * @param hero 勇士属性，最终结果将会与由此属性计算出的伤害相减计算减伤
     */
    calCritical(
        num: number = 1,
        hero: Partial<HeroStatus> = core.status.hero
    ): CriticalDamageDelta[] {
        const origin = this.calDamage(hero);
        const seckill = this.getSeckillAtk();
        return this.calCriticalWith(num, seckill, origin, hero);
    }

    /**
     * 二分计算怪物临界
     * @param num 计算的临界数量
     * @param min 当前怪物伤害最小值
     * @param seckill 秒杀怪物时的攻击
     * @param hero 勇士真实属性
     */
    private calCriticalWith(
        num: number,
        seckill: number,
        origin: DamageInfo,
        hero: Partial<HeroStatus>
    ): CriticalDamageDelta[] {
        // todo: 可以优化，根据之前的计算可以直接确定下一个临界的范围
        if (!isFinite(seckill)) return [];

        const res: CriticalDamageDelta[] = [];
        const def = hero.def!;
        const precision =
            (seckill < Number.MAX_SAFE_INTEGER ? 1 : seckill / 1e15) * 2;
        const enemy = this.getRealInfo();

        let curr = hero.atk!;
        let start = curr;
        let end = seckill;
        let ori = origin.damage;

        const calDam = () => {
            return this.calEnemyDamageOf({ atk: curr, def }, enemy).damage;
        };

        let i = 0;
        while (res.length < num) {
            if (end - start <= precision) {
                // 到达二分所需精度，计算临界准确值
                let cal = false;
                for (const v of [(start + end) / 2, end]) {
                    curr = v;
                    const dam = calDam();
                    if (dam < ori) {
                        res.push({
                            damage: dam,
                            atkDelta: Math.ceil(v - hero.atk!),
                            delta: dam - ori
                        });

                        start = v;
                        end = seckill;
                        cal = true;
                        ori = dam;
                        break;
                    }
                }
                if (!cal) break;
            }
            curr = Math.floor((start + end) / 2);

            const damage = calDam();

            if (damage < ori) {
                end = curr;
            } else {
                start = curr;
            }
            if (i++ >= 10000) {
                console.warn(
                    `Unexpected endless loop in calculating critical.` +
                        `Enemy Id: ${this.id}. Loc: ${this.x},${this.y}. Floor: ${this.floorId}`
                );
                break;
            }
        }

        if (res.length === 0) {
            curr = hero.atk!;
            const dam = calDam();
            res.push({
                damage: dam,
                atkDelta: 0,
                delta: 0
            });
        }

        return res;
    }

    /**
     * 计算n防减伤
     * @param num 要加多少防御
     * @param dir 从怪物位置指向勇士的方向
     * @param hero 勇士属性，最终结果将会与由此属性计算出的伤害相减计算减伤
     */
    calDefDamage(
        num: number = 1,
        hero: Partial<HeroStatus> = core.status.hero
    ): DamageDelta {
        const damage = this.calDamage({
            def: (hero.def ?? core.status.hero.def) + num
        });
        const origin = this.calDamage(hero);
        const finite = isFinite(damage.damage);

        return {
            damage: damage.damage,
            info: damage,
            delta: finite ? damage.damage - origin.damage : Infinity
        };
    }

    /**
     * 获取怪物秒杀时所需的攻击
     */
    getSeckillAtk(): number {
        const info = this.getRealInfo();
        const add = info.def + info.hp - core.status.hero.mana;

        // 坚固，不可能通过攻击秒杀
        if (info.special.includes(3)) {
            return Infinity;
        }

        // 列方程求解，拿笔算一下就知道了
        // 饥渴，会偷取勇士攻击
        if (info.special.includes(7)) {
            if (info.damageDecline === 0) {
                return add / (1 - this.enemy.hungry! / 100);
            } else {
                return (
                    (info.hp / (1 - info.damageDecline / 100) -
                        core.status.hero.mana +
                        info.def) /
                    (1 - this.enemy.hungry! / 100)
                );
            }
        }

        // 霜冻
        if (info.special.includes(20) && !core.hasEquip('I589')) {
            return (
                info.def +
                info.hp / (1 - this.enemy.ice! / 100) -
                core.status.hero.mana
            );
        }

        if (info.damageDecline !== 0) {
            return (
                info.def +
                info.hp / (1 - info.damageDecline / 100) -
                core.status.hero.mana
            );
        } else {
            return add;
        }
    }
}

/**
 * 主动技能列表
 */
const skills: [unlock: string, condition: string][] = [
    ['bladeOn', 'blade'],
    ['shieldOn', 'shield']
];

export namespace Damage {
    /**
     * 计算伤害时会用到的勇士属性，攻击防御，其余的不会有buff加成，直接从core.status.hero取
     */
    export let realStatus: (keyof HeroStatus)[] = ['atk', 'def'];

    /**
     * 计算怪物伤害
     * @param info 怪物信息
     * @param hero 勇士信息
     */
    export function calDamageWith(
        info: EnemyInfo,
        hero: Partial<HeroStatus>
    ): number | null {
        const { hp, hpmax, mana, mdef } = core.status.hero;
        let { atk, def } = hero as HeroStatus;
        let { hp: monHp, atk: monAtk, def: monDef, special, enemy } = info;

        let damage = 0;

        // 饥渴
        if (special.includes(7)) {
            const delta = Math.floor((atk * enemy.hungry!) / 100);
            atk -= delta;
            monAtk += delta;
        }

        let heroPerDamage: number;

        // 绝对防御
        if (special.includes(9)) {
            heroPerDamage = atk + mana - monDef;
            if (heroPerDamage <= 0) return null;
        } else if (special.includes(3)) {
            // 由于坚固的特性，只能放到这来计算了
            if (atk > enemy.def) heroPerDamage = 1 + mana;
            else return null;
        } else {
            heroPerDamage = atk - monDef;
            if (heroPerDamage > 0) heroPerDamage += mana;
            else return null;
        }

        // 霜冻
        if (special.includes(20) && !core.hasEquip('I589')) {
            heroPerDamage *= 1 - enemy.ice! / 100;
        }

        heroPerDamage *= 1 - info.damageDecline / 100;

        let enemyPerDamage: number;

        // 魔攻
        if (special.includes(2) || special.includes(13)) {
            enemyPerDamage = monAtk;
        } else {
            enemyPerDamage = monAtk - def;
            if (enemyPerDamage < 0) enemyPerDamage = 0;
        }

        // 先攻
        if (special.includes(17)) {
            damage += enemyPerDamage;
        }

        // 连击
        if (special.includes(4)) enemyPerDamage *= 2;
        if (special.includes(5)) enemyPerDamage *= 3;
        if (special.includes(6)) enemyPerDamage *= enemy.n!;

        // 苍蓝刻
        if (special.includes(28)) {
            heroPerDamage *= 1 - enemy.paleShield! / 100;
        }

        let turn = Math.ceil(monHp / heroPerDamage);

        // 致命一击
        if (special.includes(1)) {
            const times = Math.floor(turn / 5);
            damage += ((times * (enemy.crit! - 100)) / 100) * enemyPerDamage;
        }

        // 勇气之刃
        if (turn > 1 && special.includes(10)) {
            damage += (enemy.courage! / 100 - 1) * enemyPerDamage;
        }

        // 勇气冲锋
        if (special.includes(11)) {
            damage += (enemy.charge! / 100) * enemyPerDamage;
            turn += 5;
        }

        damage += (turn - 1) * enemyPerDamage;
        // 无上之盾
        if (flags.superSheild) {
            damage -= mdef / 10;
        }
        // 生命回复
        damage -= hpmax * turn;
        if (flags.hard === 1) damage *= 0.9;

        return damage;
    }

    export function ensureFloorDamage(floorId: FloorIds) {
        const floor = core.status.maps[floorId];
        floor.enemy ??= new EnemyCollection(floorId);
    }

    export function getSingleEnemy(id: EnemyIds) {
        const e = core.material.enemys[id];
        const enemy = new DamageEnemy(e);
        enemy.calAttribute();
        enemy.getRealInfo();
        enemy.calDamage(core.status.hero);
        return enemy;
    }
}

declare global {
    interface Floor {
        enemy: EnemyCollection;
    }
}
