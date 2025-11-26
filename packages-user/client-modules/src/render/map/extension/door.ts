import {
    IMapLayer,
    IMapLayerHookController,
    IMapLayerHooks
} from '@user/data-state';
import { IMapDoorRenderer } from './types';
import { IMapRenderer } from '../types';
import { sleep } from 'mutate-animate';
import { DOOR_ANIMATE_INTERVAL } from '../../shared';

export class MapDoorRenderer implements IMapDoorRenderer {
    /** 钩子控制器 */
    readonly controller: IMapLayerHookController;

    /** 动画间隔 */
    private interval: number = DOOR_ANIMATE_INTERVAL;

    constructor(
        readonly renderer: IMapRenderer,
        readonly layer: IMapLayer
    ) {
        this.controller = layer.addHook(new MapDoorHook(this));
        this.controller.load();
    }

    setAnimateInterval(interval: number): void {
        this.interval = interval;
    }

    async openDoor(x: number, y: number): Promise<void> {
        const status = this.renderer.getBlockStatus(this.layer, x, y);
        if (!status) return;
        const array = this.layer.getMapRef().array;
        const index = y * this.layer.width + x;
        const num = array[index];
        const data = this.renderer.manager.getIfBigImage(num);
        if (!data) return;
        const frames = data.frames;
        for (let i = 0; i < frames; i++) {
            status.useSpecifiedFrame(i);
            await sleep(this.interval);
        }
    }

    async closeDoor(num: number, x: number, y: number): Promise<void> {
        const data = this.renderer.manager.getIfBigImage(num);
        if (!data) return;
        const moving = this.renderer.addMovingBlock(this.layer, num, x, y);
        const frames = data.frames;

        for (let i = frames - 1; i >= 0; i--) {
            moving.useSpecifiedFrame(i);
            await sleep(this.interval);
        }
        moving.destroy();
    }

    destroy(): void {
        this.controller.unload();
    }
}

class MapDoorHook implements Partial<IMapLayerHooks> {
    constructor(readonly renderer: MapDoorRenderer) {}

    onOpenDoor(x: number, y: number): Promise<void> {
        return this.renderer.openDoor(x, y);
    }

    onCloseDoor(num: number, x: number, y: number): Promise<void> {
        return this.renderer.closeDoor(num, x, y);
    }
}
