import { HeroSkill, NightSpecial } from '../mechanism';

/**
 * 获取勇士在某一点的属性
 * @param name 要获取的勇士属性
 * @param floorId 勇士所在楼层
 */
export function getHeroStatusOn(name: 'all', floorId?: FloorIds): HeroStatus;
export function getHeroStatusOn(
    name: (keyof HeroStatus)[],
    floorId?: FloorIds
): Partial<HeroStatus>;
export function getHeroStatusOn<K extends keyof HeroStatus>(
    name: K,
    floorId?: FloorIds
): HeroStatus[K];
export function getHeroStatusOn(
    name: keyof HeroStatus | 'all' | (keyof HeroStatus)[],
    floorId?: FloorIds
) {
    // @ts-expect-error 推导错误
    return getHeroStatusOf(core.status.hero, name, floorId);
}

/**
 * 获取一定状态下的勇士在某一点的属性
 * @param status 勇士的状态
 * @param name 要获取的勇士属性
 * @param floorId 勇士所在楼层
 */
export function getHeroStatusOf(
    status: Partial<HeroStatus>,
    name: 'all',
    floorId?: FloorIds
): HeroStatus;
export function getHeroStatusOf(
    status: Partial<HeroStatus>,
    name: (keyof HeroStatus)[],
    floorId?: FloorIds
): Partial<HeroStatus>;
export function getHeroStatusOf<K extends keyof HeroStatus>(
    status: Partial<HeroStatus>,
    name: K,
    floorId?: FloorIds
): HeroStatus[K];
export function getHeroStatusOf(
    status: DeepPartial<HeroStatus>,
    name: keyof HeroStatus | 'all' | (keyof HeroStatus)[],
    floorId?: FloorIds
) {
    return getRealStatus(status, name, floorId);
}

function getRealStatus(
    status: DeepPartial<HeroStatus>,
    name: keyof HeroStatus | 'all' | (keyof HeroStatus)[],
    floorId: FloorIds = core.status.floorId
): any {
    const { getSkillLevel } = Mota.require('@user/data-state');
    if (name instanceof Array) {
        const res: any = {};
        name.forEach(v => {
            res[v] = getRealStatus(status, v, floorId);
        });
        return res;
    }

    if (name === 'all') {
        const res: any = {};
        for (const [key, value] of Object.entries(core.status.hero)) {
            if (typeof value === 'number') {
                res[key] = getRealStatus(
                    status,
                    key as keyof HeroStatus,
                    floorId
                );
            } else {
                res[key] = value;
            }
        }

        return res;
    }

    let s = (status[name] ?? core.status.hero[name]) as number;
    if (s === null || s === void 0) {
        throw new ReferenceError(
            `Wrong hero status property name is delivered: ${name}`
        );
    }

    if (typeof s !== 'number') return s;

    // 永夜、极昼
    if (name === 'atk' || name === 'def') {
        s += NightSpecial.getNight(floorId);
    }

    const enabled = HeroSkill.getEnabled();
    // 技能
    if (enabled === HeroSkill.Blade) {
        const level = getSkillLevel(2);
        if (name === 'atk') {
            s *= 1 + 0.1 * level;
        } else if (name === 'def') {
            s *= 1 - 0.1 * level;
        }
    } else if (enabled === HeroSkill.Shield) {
        const level = getSkillLevel(10);
        if (name === 'atk') {
            s *= 1 - 0.1 * level;
        } else if (name === 'def') {
            s *= 1 + 0.1 * level;
        }
    }

    // buff
    s *= core.status.hero.buff[name] ?? 1;
    s = Math.floor(s);

    return s;
}

export interface IHeroStatusDefault {
    atk: number;
    def: number;
    hp: number;
}
