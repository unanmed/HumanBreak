import { backDir, has } from '@/plugin/game/utils';
import { loading } from '../game';
import type { LayerDoorAnimate } from '@/core/render/preset/floor';

export namespace BluePalace {
    type DoorConvertInfo = [id: AllIds, x: number, y: number];

    // ---------- 黄蓝门转换

    function drawDoors(
        ctx: CanvasRenderingContext2D,
        convert: DoorConvertInfo[],
        frame: number
    ) {
        ctx.clearRect(0, 0, 480, 480);
        convert.forEach(v => {
            core.drawIcon(ctx, v[0], v[1] * 32, v[2] * 32, 32, 32, frame);
        });
    }

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
        core.playSound('door.mp3');

        const Adapter = Mota.require('module', 'Render').RenderAdapter;
        const adapter = Adapter.get<LayerDoorAnimate>('door-animate');
        const texture = Mota.require('module', 'Render').texture;
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
        ]
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
        console.log(portalMap);
    }
}
