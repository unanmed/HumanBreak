import { logger } from '@/core/common/logger';
import { LayerGroupFloorBinder } from '@/core/render/preset/floor';
import {
    ILayerGroupRenderExtends,
    LayerGroup
} from '@/core/render/preset/layer';

const filterMap: [FloorIds[], string][] = [];

function getCanvasFilterByFloorId(floorId: FloorIds = core.status.floorId) {
    return filterMap.find(v => v[0].includes(floorId))?.[1] ?? '';
}

Mota.require('var', 'loading').once('coreInit', () => {
    filterMap.push(
        [['MT50', 'MT60', 'MT61'], 'brightness(80%)contrast(120%)'], // 童心佬的滤镜（
        [
            core.floorIds.slice(61, 70).concat(core.floorIds.slice(72)),
            'contrast(120%)'
        ] // 童心佬的滤镜（
    );
});

export class LayerGroupFilter implements ILayerGroupRenderExtends {
    id: string = 'filter';

    group!: LayerGroup;
    binder!: LayerGroupFloorBinder;

    setFilter(floorId: FloorIds) {
        const filter = getCanvasFilterByFloorId(floorId);
        this.group.setFilter(filter);
        // console.log(filter);
    }

    private onFloorChange = (floor: FloorIds) => {
        this.setFilter(floor);
    };

    private listen() {
        this.binder.on('floorChange', this.onFloorChange);
    }

    awake(group: LayerGroup): void {
        this.group = group;
        const ex = group.getExtends('floor-binder');
        if (ex instanceof LayerGroupFloorBinder) {
            this.binder = ex;
            this.listen();
        } else {
            logger.error(1201);
            group.removeExtends('floor-damage');
        }
    }

    onDestroy(group: LayerGroup): void {
        this.binder?.off('floorChange', this.onFloorChange);
    }
}
