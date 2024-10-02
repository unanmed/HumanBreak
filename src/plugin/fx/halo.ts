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

const gameListener = Mota.require('var', 'gameListener');

export class LayerGroupHalo implements ILayerGroupRenderExtends {
    id: string = 'halo';

    group!: LayerGroup;
    binder!: LayerGroupFloorBinder;
    halo!: Halo;

    static sprites: Set<Halo> = new Set();

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
            LayerGroupHalo.sprites.add(this.halo);
        } else {
            logger.error(1401);
            group.removeExtends('halo');
        }
    }

    onDestroy(group: LayerGroup): void {
        this.halo?.destroy();
        LayerGroupHalo.sprites.delete(this.halo);
    }
}

const haloColor: Record<number, string[]> = {
    21: ['cyan'],
    25: ['purple'],
    26: ['blue'],
    27: ['red'],
    31: ['#3CFF49'],
    29: ['#51E9FF'],
    32: ['#fff966']
};

class Halo extends Sprite {
    /** 单元格大小 */
    cellSize: number = 32;
    /** 当前楼层，用于获取有哪些光环 */
    binder!: LayerGroupFloorBinder;

    constructor() {
        super('static', true);

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
                let [color, border] = haloColor[halo.special];
                let alpha = 0.1;
                let borderAlpha = 0.6;
                const { mouseX, mouseY } = gameListener;
                if (mouseX === halo.from?.x && mouseY === halo.from?.y) {
                    alpha = 0.3;
                    borderAlpha = 0.8;
                    color = '#ff0';
                    border = '#ff0';
                }
                const r = Math.floor(d / 2);
                const left = x - r;
                const top = y - r;
                ctx.fillStyle = color;
                ctx.strokeStyle = border ?? color;
                ctx.globalAlpha = alpha;
                ctx.fillRect(left * cell, top * cell, d * cell, d * cell);
                ctx.globalAlpha = borderAlpha;
                ctx.strokeRect(left * cell, top * cell, d * cell, d * cell);
            }
        }
    }
}

function updateHalo(block: Block) {
    if (block.event.cls === 'enemys' || block.event.cls === 'enemy48') {
        LayerGroupHalo.sprites.forEach(v => {
            const floor = v.binder.getFloor();
            if (floor === core.status.floorId) {
                v.update();
            }
        });
    }
}

Mota.require('var', 'hook').on('enemyExtract', col => {
    LayerGroupHalo.sprites.forEach(v => {
        const floor = v.binder.getFloor();
        if (col.floorId === floor) {
            v.update();
        }
    });
});
gameListener.on('hoverBlock', updateHalo);
gameListener.on('leaveBlock', updateHalo);
