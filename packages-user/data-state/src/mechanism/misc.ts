import { backDir, has } from '@/plugin/game/utils';
import { loading } from '@user/data-base';
import type { LayerDoorAnimate } from '@motajs/render';
import { getSkillLevel } from '@/plugin/game/skillTree';

/**
 * 一些零散机制的数据
 */
export namespace MiscData {
    /** 循环式地图 */
    export const loopMaps: Set<FloorIds> = new Set(['tower6']);
}

/**
 * 永夜/极昼
 */
export namespace NightSpecial {
    const nightMap = new Map<FloorIds, number>();

    export function getNight(floor: FloorIds) {
        return nightMap.get(floor) ?? 0;
    }

    export function addNight(floor: FloorIds, value: number) {
        const num = nightMap.get(floor) ?? 0;
        nightMap.set(floor, num + value);
    }

    export function clearNight(floors: Iterable<FloorIds>) {
        for (const floor of floors) {
            nightMap.delete(floor);
        }
    }

    export function saveNight() {
        return nightMap.entries();
    }

    export function loadNight(night: Iterable<[FloorIds, number]>) {
        nightMap.clear();
        for (const [floor, num] of night) {
            nightMap.set(floor, num);
        }
    }

    export function getAll() {
        return nightMap;
    }
}

export namespace HeroSkill {
    export const enum Skill {
        None,
        /** 断灭之刃 */
        Blade,
        /** 铸剑为盾 */
        Shield,
        /** 跳跃 */
        Jump
    }

    export const Blade = Skill.Blade;
    export const Shield = Skill.Shield;
    export const Jump = Skill.Jump;

    const skillNameMap = new Map<Skill, string>([
        [Skill.Blade, '断灭之刃'],
        [Skill.Shield, '铸剑为盾'],
        [Skill.Jump, '跳跃']
    ]);

    const skillDesc = new Map<Skill, (level: number) => string>([
        [
            Skill.Blade,
            level => `攻击上升 ${level * 10}%，防御下降 ${level * 10}%`
        ],
        [
            Skill.Shield,
            level => `防御上升 ${level * 10}%，攻击下降 ${level * 10}%`
        ],
        [Skill.Jump, () => `跳过前方障碍，或踢走面前的怪物`]
    ]);

    interface SkillSave {
        autoSkill: boolean;
        learned: Skill[];
    }

    const learned = new Set<Skill>();
    let autoSkill = true;
    let enabled: Skill = Skill.None;

    export function getLevel(skill: Skill = getEnabled()) {
        switch (skill) {
            case Blade:
                return getSkillLevel(2);
            case Jump:
                return learned.has(Jump) ? 1 : 0;
            case Shield:
                return getSkillLevel(10);
        }
        return 0;
    }

    export function getSkillName(skill: Skill = getEnabled()) {
        return skillNameMap.get(skill) ?? '未开启技能';
    }

    export function getSkillDesc(
        skill: Skill = getEnabled(),
        level: number = getLevel()
    ) {
        return skillDesc.get(skill)?.(level) ?? '';
    }

    export function setAutoSkill(auto: boolean) {
        autoSkill = auto;
    }

    export function getAutoSkill() {
        return autoSkill;
    }

    export function learnedSkill(skill: Skill) {
        return learned.has(skill);
    }

    export function learnSkill(skill: Skill) {
        learned.add(skill);
    }

    export function forgetSkill(skill: Skill) {
        learned.delete(skill);
    }

    export function clearSkill() {
        learned.clear();
    }

    export function saveSkill(): SkillSave {
        return { autoSkill, learned: [...learned] };
    }

    export function loadSkill(skills: SkillSave) {
        learned.clear();
        for (const skill of skills.learned) {
            learned.add(skill);
        }
        autoSkill = skills.autoSkill;
    }

    export function getAll() {
        return learned;
    }

    export function toggleSkill(skill: Skill) {
        if (!learned.has(skill)) return;
        if (enabled !== skill) enabled = skill;
        else enabled = Skill.None;
    }

    export function enableSkill(skill: Skill) {
        if (!learned.has(skill)) return;
        enabled = skill;
    }

    export function disableSkill() {
        enabled = Skill.None;
    }

    export function getEnabled() {
        return enabled;
    }
}

export namespace BluePalace {
    type DoorConvertInfo = [id: AllIds, x: number, y: number];

    // ---------- 黄蓝门转换

    export function doorConvert(
        x?: number,
        y?: number,
        floorId: FloorIds = core.status.floorId
    ) {
        core.autosave();
        core.extractBlocks(floorId);
        const blocks = core.status.maps[floorId].blocks;

        const toConvert: DoorConvertInfo[] = [];
        blocks.forEach(v => {
            if (v.id === 492) {
                core.setBlock(494, v.x, v.y, floorId);
                toConvert.push(['A492', v.x, v.y]);
            } else if (v.id === 494) {
                core.setBlock(492, v.x, v.y, floorId);
                toConvert.push(['A494', v.x, v.y]);
            }
        });

        if (has(x) && has(y)) {
            core.removeBlock(x, y, floorId);
        }

        if (core.isReplaying() || core.status.floorId !== floorId) {
            core.doAction();
            return;
        }

        core.lockControl();
        core.playSound('door.opus');

        const Adapter = Mota.require('@motajs/render').RenderAdapter;
        const adapter = Adapter.get<LayerDoorAnimate>('door-animate');
        const texture = Mota.require('@motajs/render').texture;
        if (adapter) {
            Promise.all(
                toConvert.map(v => {
                    const block = core.initBlock(
                        v[1],
                        v[2],
                        texture.idNumberMap[v[0]]
                    );
                    return adapter.all('openDoor', block);
                })
            ).then(() => {
                core.unlockControl();
                core.doAction();
            });
        }
    }

    // ---------- 传送门部分

    export interface Portal {
        fx: number;
        fy: number;
        dir: Dir;
        tx: number;
        ty: number;
        toDir: Dir;
    }

    export interface PortalTo {
        x: number;
        y: number;
        dir: Dir;
    }

    type PortalMap = Map<FloorIds, Map<number, Partial<Record<Dir, PortalTo>>>>;

    export const portalMap: PortalMap = new Map();

    export const portals: Partial<Record<FloorIds, Portal[]>> = {
        MT76: [
            { fx: 11, fy: 7, dir: 'right', tx: 4, ty: 6, toDir: 'down' },
            { fx: 6, fy: 5, dir: 'left', tx: 8, ty: 13, toDir: 'right' }
        ],
        MT77: [
            { fx: 2, fy: 9, dir: 'up', tx: 10, ty: 13, toDir: 'right' },
            { fx: 10, fy: 8, dir: 'right', tx: 3, ty: 0, toDir: 'down' },
            { fx: 1, fy: 0, dir: 'down', tx: 8, ty: 1, toDir: 'left' }
        ],
        MT78: [
            { fx: 8, fy: 4, dir: 'right', tx: 8, ty: 6, toDir: 'left' },
            { fx: 7, fy: 7, dir: 'up', tx: 1, ty: 0, toDir: 'down' }
        ],
        MT79: [
            { fx: 5, fy: 10, dir: 'right', tx: 9, ty: 7, toDir: 'left' },
            { fx: 2, fy: 2, dir: 'up', tx: 7, ty: 5, toDir: 'down' },
            { fx: 4, fy: 11, dir: 'up', tx: 5, ty: 7, toDir: 'right' },
            { fx: 7, fy: 11, dir: 'down', tx: 7, ty: 9, toDir: 'up' }
        ],
        MT80: [
            { fx: 2, fy: 10, dir: 'right', tx: 1, ty: 2, toDir: 'down' },
            { fx: 2, fy: 10, dir: 'left', tx: 13, ty: 5, toDir: 'up' }
        ],
        MT81: [
            { fx: 4, fy: 8, dir: 'right', tx: 1, ty: 11, toDir: 'down' },
            { fx: 7, fy: 13, dir: 'right', tx: 13, ty: 5, toDir: 'up' }
        ],
        MT82: [{ fx: 9, fy: 10, dir: 'left', tx: 6, ty: 5, toDir: 'left' }],
        MT83: [
            { fx: 5, fy: 11, dir: 'left', tx: 9, ty: 11, toDir: 'right' },
            { fx: 5, fy: 3, dir: 'left', tx: 9, ty: 3, toDir: 'right' },
            { fx: 2, fy: 2, dir: 'up', tx: 2, ty: 12, toDir: 'down' },
            { fx: 12, fy: 2, dir: 'up', tx: 12, ty: 12, toDir: 'down' }
        ],
        MT84: [
            { fx: 2, fy: 3, dir: 'right', tx: 12, ty: 3, toDir: 'left' },
            { fx: 2, fy: 11, dir: 'right', tx: 12, ty: 11, toDir: 'left' }
        ],
        MT94: [{ fx: 12, fy: 11, dir: 'left', tx: 5, ty: 1, toDir: 'left' }],
        MT95: [
            { fx: 13, fy: 14, dir: 'up', tx: 7, ty: 8, toDir: 'left' },
            { fx: 0, fy: 1, dir: 'right', tx: 14, ty: 1, toDir: 'left' },
            { fx: 6, fy: 13, dir: 'right', tx: 6, ty: 0, toDir: 'down' }
        ],
        MT96: [{ fx: 6, fy: 11, dir: 'down', tx: 4, ty: 14, toDir: 'up' }],
        MT97: [{ fx: 0, fy: 1, dir: 'right', tx: 8, ty: 9, toDir: 'right' }]
    };
    loading.once('coreInit', initPortals);

    function generatePortalMap() {
        const delta: Record<Dir, [[number, number], [number, number]]> = {
            // 方向：[正向, 逆向]<进出>
            left: [
                [0, 0],
                [-1, 0]
            ],
            down: [
                [0, 0],
                [0, 1]
            ],
            right: [
                [0, 0],
                [1, 0]
            ],
            up: [
                [0, 0],
                [0, -1]
            ]
        };
        for (const [floor, p] of Object.entries(portals)) {
            const width = core.floors[floor as FloorIds].width;
            const map = new Map<number, Partial<Record<Dir, PortalTo>>>();
            portalMap.set(floor as FloorIds, map);

            // 正向映射
            p.forEach(v => {
                const [[fdx, fdy], [tdx, tdy]] = delta[v.dir];
                const [[toFdx, toFdy], [toTdx, toTdy]] =
                    delta[backDir(v.toDir)];
                const fx = v.fx + fdx;
                const fy = v.fy + fdy;
                const tx = v.fx + tdx;
                const ty = v.fy + tdy;
                const index = fx + fy * width;
                const backIndex = tx + ty * width;
                if (index < 0 || backIndex < 0) return;
                let data = map.get(index);
                let backData = map.get(backIndex);
                if (!data) {
                    data = {};
                    map.set(index, data);
                }
                if (!backData) {
                    backData = {};
                    map.set(backIndex, backData);
                }

                data[v.dir] = {
                    x: v.tx + toFdx,
                    y: v.ty + toFdy,
                    dir: backDir(v.toDir)
                };
                backData[backDir(v.dir)] = {
                    x: v.tx - toTdx,
                    y: v.ty - toTdy,
                    dir: v.toDir
                };
            });
            // 逆向映射
            p.forEach(v => {
                const [[fdx, fdy], [tdx, tdy]] = delta[backDir(v.toDir)];
                const [[toFdx, toFdy], [toTdx, toTdy]] = delta[v.dir];
                const fx = v.tx - fdx;
                const fy = v.ty - fdy;
                const tx = v.tx - tdx;
                const ty = v.ty - tdy;
                const index = fx + fy * width;
                const backIndex = tx + ty * width;

                let data = map.get(index);
                let backData = map.get(backIndex);
                if (!data) {
                    data = {};
                    map.set(index, data);
                }
                if (!backData) {
                    backData = {};
                    map.set(backIndex, backData);
                }

                data[v.toDir] = {
                    x: v.fx + toFdx,
                    y: v.fy + toFdy,
                    dir: backDir(v.dir)
                };
                backData[backDir(v.toDir)] = {
                    x: v.fx + toTdx,
                    y: v.fy + toTdy,
                    dir: v.dir
                };
            });
        }
    }

    function initPortals() {
        generatePortalMap();
    }
}
