import { logger } from '@/core/common/logger';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { mainSetting } from '@/core/main/setting';
import { LayerGroupFloorBinder } from '@/core/render/preset/floor';
import {
    ILayerGroupRenderExtends,
    LayerGroup
} from '@/core/render/preset/layer';
import { Sprite } from '@/core/render/sprite';
import { Transform } from '@/core/render/transform';

export class LayerGroupHalo implements ILayerGroupRenderExtends {
    id: string = 'halo';

    group!: LayerGroup;
    binder!: LayerGroupFloorBinder;
    halo!: Halo;

    awake(group: LayerGroup): void {
        this.group = group;
        const ex = group.getExtends('floor-binder');
        if (ex instanceof LayerGroupFloorBinder) {
            this.binder = ex;
            this.halo = new Halo();
            this.halo.setHD(true);
            this.halo.size(group.width, group.height);
            this.halo.setZIndex(75);
            this.halo.binder = ex;
            group.appendChild(this.halo);
        } else {
            logger.error(
                1401,
                `Halo extends needs 'floor-binder' extends as dependency.`
            );
            group.removeExtends('halo');
        }
    }

    onDestroy(group: LayerGroup): void {
        this.halo?.destroy();
    }
}

const haloColor: Record<number, string[]> = {
    21: ['cyan'],
    25: ['purple'],
    26: ['blue'],
    27: ['red'],
    31: ['#3CFF49'],
    29: ['#51E9FF']
};

class Halo extends Sprite {
    /** 单元格大小 */
    cellSize: number = 32;
    /** 当前楼层，用于获取有哪些光环 */
    binder!: LayerGroupFloorBinder;

    constructor() {
        super('static', false);

        this.setRenderFn((canvas, transform) => {
            this.drawHalo(canvas, transform);
        });
    }

    drawHalo(canvas: MotaOffscreenCanvas2D, transform: Transform) {
        if (!mainSetting.getValue('screen.halo', true)) return;
        const floorId = this.binder.getFloor();
        if (!floorId) return;
        const col = core.status.maps[floorId].enemy;
        if (!col) return;
        const [dx, dy] = col.translation;
        const list = col.haloList.concat(
            Object.keys(flags[`melt_${floorId}`] ?? {}).map(v => {
                const [x, y] = v.split(',').map(v => parseInt(v));
                return {
                    type: 'square',
                    data: {
                        x: x + dx,
                        y: y + dy,
                        d: 3
                    },
                    special: 25
                };
            })
        );
        const { ctx } = canvas;
        const cell = this.cellSize;
        ctx.lineWidth = 1;
        for (const halo of list) {
            if (halo.type === 'square') {
                const { x, y, d } = halo.data;
                const [color, border] = haloColor[halo.special];
                const r = Math.floor(d / 2);
                const left = x - r;
                const top = y - r;
                ctx.fillStyle = color;
                ctx.strokeStyle = border ?? color;
                ctx.globalAlpha = 0.1;
                ctx.fillRect(left * cell, top * cell, d * cell, d * cell);
                ctx.globalAlpha = 0.6;
                ctx.strokeRect(left * cell, top * cell, d * cell, d * cell);
            }
        }
    }
}
