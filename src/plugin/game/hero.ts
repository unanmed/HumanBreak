/**
 * 获取勇士在某一点的属性
 * @param name 要获取的勇士属性
 * @param x 勇士所在横坐标
 * @param y 勇士所在纵坐标
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
    // @ts-ignore
    return getHeroStatusOf(core.status.hero, name, floorId);
}

/**
 * 获取一定状态下的勇士在某一点的属性
 * @param status 勇士的状态
 * @param name 要获取的勇士属性
 * @param x 勇士所在横坐标
 * @param y 勇士所在纵坐标
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
    if (name instanceof Array) {
        return Object.fromEntries(
            name.map(v => [v, getRealStatus(status, v, floorId)])
        );
    }

    if (name === 'all') {
        return Object.fromEntries(
            Object.keys(core.status.hero).map(v => [
                v,
                v !== 'all' &&
                    getRealStatus(status, v as keyof HeroStatus, floorId)
            ])
        );
    }

    let s = (status?.[name] ?? core.status.hero[name]) as number;
    if (s === null || s === void 0) {
        throw new ReferenceError(
            `Wrong hero status property name is delivered: ${name}`
        );
    }

    // 永夜、极昼
    if (name === 'atk' || name === 'def') {
        s += window.flags?.[`night_${floorId}`] ?? 0;
    }

    // 技能
    if (flags.bladeOn && flags.blade) {
        const level = core.plugin.skillTree.getSkillLevel(2);
        if (name === 'atk') {
            s *= 1 + 0.1 * level;
        }
        if (name === 'def') {
            s *= 1 - 0.1 * level;
        }
    }
    if (flags.shield && flags.shieldOn) {
        const level = core.plugin.skillTree.getSkillLevel(10);
        if (name === 'atk') {
            s *= 1 - 0.1 * level;
        }
        if (name === 'def') {
            s *= 1 + 0.1 * level;
        }
    }

    // buff
    if (typeof s === 'number')
        s *= core.getBuff(name as keyof NumbericHeroStatus);

    // 取整
    if (typeof s === 'number') s = Math.floor(s);
    return s;
}

declare global {
    interface PluginDeclaration {
        getHeroStatusOf: typeof getHeroStatusOf;
        getHeroStatusOn: typeof getHeroStatusOn;
    }
}

core.plugin.hero = {
    getHeroStatusOf,
    getHeroStatusOn
};
