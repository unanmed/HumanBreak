import { backDir, has } from '@/plugin/game/utils';
import { loading } from '../game';

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

        const ctx = core.createCanvas(`@doorConvert`, 0, 0, 480, 480, 35);
        const time = core.values.animateSpeed / 3;

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

        new Promise<void>(res => {
            drawDoors(ctx, toConvert, 0);
            setTimeout(res, time);
        })
            .then(() => {
                drawDoors(ctx, toConvert, 1);
                return new Promise<void>(res => {
                    setTimeout(res, time);
                });
            })
            .then(() => {
                drawDoors(ctx, toConvert, 2);
                return new Promise<void>(res => {
                    setTimeout(res, time);
                });
            })
            .then(() => {
                drawDoors(ctx, toConvert, 3);
                return new Promise<void>(res => {
                    core.unlockControl();
                    core.deleteCanvas('@doorConvert');
                    core.doAction();
                    setTimeout(res, time);
                });
            });
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
        MT75: [
            { fx: 7, fy: 7, dir: 'left', tx: 9, ty: 9, toDir: 'down' },
            { fx: 5, fy: 11, dir: 'right', tx: 7, ty: 9, toDir: 'up' },
            { fx: 4, fy: 6, dir: 'right', tx: 9, ty: 4, toDir: 'up' },
            { fx: 5, fy: 9, dir: 'right', tx: 3, ty: 7, toDir: 'up' },
            { fx: 7, fy: 5, dir: 'right', tx: 4, ty: 9, toDir: 'up' }
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
                [0, -1]
            ],
            right: [
                [0, 0],
                [1, 0]
            ],
            up: [
                [0, 0],
                [0, 1]
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
                    x: v.tx + toTdx,
                    y: v.ty + toTdy,
                    dir: v.toDir
                };
            });
            // 逆向映射
            p.forEach(v => {
                const [[fdx, fdy], [tdx, tdy]] = delta[backDir(v.toDir)];
                const [[toFdx, toFdy], [toTdx, toTdy]] = delta[v.dir];
                const fx = v.tx + fdx;
                const fy = v.ty + fdy;
                const tx = v.tx + tdx;
                const ty = v.ty + tdy;
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
        // 主要是复写勇士绘制以及传送判定，还有自动寻路
        generatePortalMap();
        console.log(portalMap);
    }
}
