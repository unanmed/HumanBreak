import { has } from '@/plugin/game/utils';
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

    interface Portal {
        fx: number;
        fy: number;
        dir: Dir;
        tx: number;
        ty: number;
        toDir: Dir;
    }

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

    function initPortals() {
        // 主要是复写勇士绘制以及传送判定，还有自动寻路
    }
}
