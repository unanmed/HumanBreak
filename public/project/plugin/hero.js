'use strict';

(function () {
    /**
     * 获取勇士在某一点的属性
     * @param {keyof HeroStatus | 'all'} name
     * @param {number} x
     * @param {number} y
     * @param {FloorIds} floorId
     */
    function getHeroStatusOn(name, x, y, floorId) {
        return this.getRealStatusOf(core.status.hero, name, x, y, floorId);
    }

    function getHeroStatusOf(status, name, x, y, floorId) {
        return getRealStatus(status, name, x, y, floorId);
    }

    function getRealStatus(status, name, x, y, floorId) {
        if (name instanceof Array) {
            return Object.fromEntries(
                name.map(v => [
                    v,
                    v !== 'all' && getRealStatus(status, v, x, y, floorId)
                ])
            );
        }

        if (name === 'all') {
            return Object.fromEntries(
                Object.keys(core.status.hero).map(v => [
                    v,
                    v !== 'all' && getRealStatus(status, v, x, y, floorId)
                ])
            );
        }

        let s = status?.[name] ?? core.status.hero[name];
        if (s === null || s === void 0) {
            throw new ReferenceError(
                `Wrong hero status property name is delivered: ${name}`
            );
        }

        x ??= core.status.hero.loc.x;
        y ??= core.status.hero.loc.y;
        floorId ??= core.status.floorId;

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
        if (typeof s === 'number') s *= core.getBuff(name);

        // 取整
        if (typeof s === 'number') s = Math.floor(s);
        return s;
    }

    core.plugin.hero = {
        getHeroStatusOf,
        getHeroStatusOn
    };
})();
