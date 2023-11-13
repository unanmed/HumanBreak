import { BgmController } from './audio/bgm';
import { SoundController } from './audio/sound';
import { EventEmitter } from './common/eventEmitter';
import { loading, readyAllResource } from './loader/load';
import { ResourceStore, ResourceType } from './loader/resource';
import { UiController } from './main/custom/ui';
import { GameEvent, hook } from './main/game';
import { fixedUi, mainUi } from './main/init/ui';
import { GameStorage } from './main/storage';
import { resolvePlugin } from './plugin';
import './main/init/';

interface AncTePlugin {
    pop: ReturnType<typeof import('../plugin/pop').default>;
    ui: ReturnType<typeof import('../plugin/uiController').default>;
    use: ReturnType<typeof import('../plugin/use').default>;
    animate: ReturnType<typeof import('../plugin/animateController').default>;
    utils: ReturnType<typeof import('../plugin/utils').default>;
    status: ReturnType<typeof import('../plugin/ui/statusBar').default>;
    mark: ReturnType<typeof import('../plugin/mark').default>;
    fly: ReturnType<typeof import('../plugin/ui/fly').default>;
    chase: ReturnType<typeof import('../plugin/chase/chase').default>;
    webglUtils: ReturnType<typeof import('../plugin/webgl/utils').default>;
    shadow: ReturnType<typeof import('../plugin/shadow/shadow').default>;
    gameShadow: ReturnType<
        typeof import('../plugin/shadow/gameShadow').default
    >;
    achievement: ReturnType<typeof import('../plugin/ui/achievement').default>;
    completion: ReturnType<typeof import('../plugin/completion').default>;
    path: ReturnType<typeof import('../plugin/fx/path').default>;
    gameCanvas: ReturnType<typeof import('../plugin/fx/gameCanvas').default>;
    noise: ReturnType<typeof import('../plugin/fx/noise').default>;
    smooth: ReturnType<typeof import('../plugin/fx/smoothView').default>;
    frag: ReturnType<typeof import('../plugin/fx/frag').default>;
}

export interface Mota {
    sound: SoundController;
    /** 游戏资源 */
    resource: ResourceStore<Exclude<ResourceType, 'zip'>>;
    zipResource: ResourceStore<'zip'>;
    bgm: BgmController;
    plugin: AncTePlugin;
    game: {
        hook: EventEmitter<GameEvent>;
        storage: typeof GameStorage;
    };
    ui: {
        main: UiController;
        fixed: UiController;
    };
}

function ready() {
    window.mota = {
        bgm: new BgmController(),
        resource: new ResourceStore(),
        zipResource: new ResourceStore(),
        sound: new SoundController(),
        // @ts-ignore
        plugin: {},
        game: {
            hook,
            storage: GameStorage
        },
        ui: {
            main: mainUi,
            fixed: fixedUi
        }
    };

    readyAllResource();
    loading.once('coreInit', resolvePlugin);
}
ready();
