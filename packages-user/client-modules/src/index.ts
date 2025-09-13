import { loading } from '@user/data-base';
import { createAudio } from './audio';
import { patchAll } from './fallback';
import { createGameRenderer, createRender } from './render';

export function create() {
    patchAll();
    createAudio();
    createRender();
    loading.once('coreInit', () => {
        createGameRenderer();
    });
}

export * from './action';
export * from './audio';
export * from './fallback';
export * from './loader';
export * from './render';
