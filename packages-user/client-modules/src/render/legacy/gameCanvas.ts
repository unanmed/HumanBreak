import { logger } from '@motajs/common';
import { loading } from '@user/data-base';
import {
    ILayerGroupRenderExtends,
    LayerGroup,
    LayerGroupFloorBinder
} from '../elements';

const filterMap: [FloorIds[], string][] = [];

function getCanvasFilterByFloorId(floorId: FloorIds = core.status.floorId) {
    return filterMap.find(v => v[0].includes(floorId))?.[1] ?? '';
}

export function createGameCanvas() {
    loading.once('coreInit', () => {
        filterMap.push(
            [['MT50', 'MT60', 'MT61'], 'contrast(120%)'], // 童心佬的滤镜（
            [
                core.floorIds
                    .slice(61, 70)
                    .concat(core.floorIds.slice(72, 107)),
                'contrast(120%)'
            ] // 童心佬的滤镜（
        );
    });
}

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

    onDestroy(_group: LayerGroup): void {
        this.binder?.off('floorChange', this.onFloorChange);
    }
}
