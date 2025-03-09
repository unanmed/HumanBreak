import { IChaseController } from './chase';
import { initChase as init1 } from './chase1';

let nowChase: IChaseController | undefined;

const chaseIndexes: Record<number, () => IChaseController> = {
    0: init1
};

export function getNow() {
    return nowChase;
}

export function initChase(index: number) {
    nowChase?.end(false);
    const controller = chaseIndexes[index]();
    nowChase = controller;
    controller.chase.on('end', () => {
        nowChase = void 0;
    });
    return nowChase;
}

export function start(fromSave: boolean) {
    nowChase?.start(fromSave);
}

export function end(success: boolean) {
    nowChase?.end(success);
}

export function initAudio(fromSave: boolean) {
    nowChase?.initAudio(fromSave);
}
