import { has } from '@/plugin/game/utils';

export namespace BluePalace {
    type DoorConvertInfo = [id: AllIds, x: number, y: number];

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
}
