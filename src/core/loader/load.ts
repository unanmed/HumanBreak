import resource from '../../data/resource.json';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import { Resource, getTypeByResource } from './resource';

interface GameLoadEvent extends EmitableEvent {
    coreLoaded: () => void;
    autotileLoaded: () => void;
    coreInit: () => void;
    materialLoaded: () => void;
}

const info = resource;

/**
 * 构建游戏包后的加载
 */
export function readyAllResource() {
    /* @__PURE__ */ if (main.RESOURCE_TYPE === 'dev') return readyDevResource();
    info.resource.forEach(v => {
        const type = getTypeByResource(v);
        if (type === 'zip') {
            ancTe.zipResource.set(v, new Resource(v, 'zip'));
        } else {
            ancTe.resource.set(v, new Resource(v, type));
        }
    });
}

/**
 * 开发时的加载
 */
/* @__PURE__ */ async function readyDevResource() {
    const loadData = (await import('../../data/resource-dev.json')).default;

    loadData.forEach(v => {
        const type = getTypeByResource(v);
        if (type !== 'zip') {
            ancTe.resource.set(v, new Resource(v, type));
        }
    });
    ancTe.resource.forEach(v => v.active());
    loading.once('coreInit', () => {
        const animates = new Resource('__all_animates__', 'text');
        ancTe.resource.set('__all_animates__', animates);
        animates.active();
    });
}

class GameLoading extends EventEmitter<GameLoadEvent> {
    private autotileLoaded: number = 0;
    private autotileNum?: number;
    private autotileListened: boolean = false;

    private materialsNum: number = main.materials.length;
    private materialsLoaded: number = 0;

    constructor() {
        super();
        this.on(
            'coreInit',
            () => {
                this.autotileNum = Object.keys(
                    core.material.icons.autotile
                ).length;
            },
            { immediate: true }
        );
        this.on('materialLoaded', () => {
            core.loader._loadMaterials_afterLoad();
        });
    }

    addMaterialLoaded() {
        this.once('coreInit', () => {
            this.materialsLoaded++;
            if (this.materialsLoaded === this.materialsNum) {
                this.emit('materialLoaded');
            }
        });
    }

    addAutotileLoaded() {
        this.once('coreInit', () => {
            this.autotileLoaded++;
            if (this.autotileLoaded === this.autotileNum) {
                this.emit('autotileLoaded');
            }
        });
    }

    /**
     * 当自动原件加载完毕时
     * @param autotiles 自动原件数组
     */
    onAutotileLoaded(
        autotiles: Partial<Record<AllIdsOf<'autotile'>, HTMLImageElement>>
    ) {
        if (this.autotileListened) return;
        this.autotileListened = true;
        this.on('autotileLoaded', () => {
            const keys = Object.keys(
                core.material.icons.autotile
            ) as AllIdsOf<'autotile'>[];

            keys.forEach(v => {
                core.material.images.autotile[v] = autotiles[v]!;
            });

            setTimeout(() => {
                core.maps._makeAutotileEdges();
            });
        });
    }
}

export const loading = new GameLoading();

declare global {
    interface Main {
        loading: GameLoading;
    }
}
main.loading = loading;
