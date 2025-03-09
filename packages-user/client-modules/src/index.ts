import { loading } from '@user/data-base';
import { createAudio } from './audio';
import { patchAll } from './fallback';
import { createGameRenderer, createRender } from './render';

export function create() {
    createAudio();
    patchAll();
    createRender();
    loading.once('coreInit', () => {
        createGameRenderer();
    });
}

export * from './action';
export * from './weather';
export * from './audio';
export * from './loader';
export * from './fallback';
export * from './render';
