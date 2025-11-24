import { loading } from '@user/data-base';
import { fallbackLoad } from './fallback';
import { createAutotile } from './autotile';

export function createMaterial() {
    createAutotile();
    loading.once('loaded', () => {
        fallbackLoad();
        loading.emit('assetBuilt');
    });
}

export * from './autotile';
export * from './builder';
export * from './fallback';
export * from './ins';
export * from './manager';
export * from './types';
export * from './utils';
