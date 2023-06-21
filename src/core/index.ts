import { BgmController } from './audio/bgm';
import { SoundController } from './audio/sound';
import { readyAllResource } from './loader/load';
import { ResourceStore, ResourceType } from './loader/resource';

export {};

declare global {
    interface AncTe {
        sound: SoundController;
        /** 游戏资源 */
        resource: ResourceStore<Exclude<ResourceType, 'zip'>>;
        zipResource: ResourceStore<'zip'>;
        bgm: BgmController;
    }
    interface Window {
        ancTe: AncTe;
    }
    const ancTe: AncTe;
}

function ready() {
    window.ancTe = {
        bgm: new BgmController(),
        resource: new ResourceStore(),
        zipResource: new ResourceStore(),
        sound: new SoundController()
    };

    readyAllResource();
}
ready();
