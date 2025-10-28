import { loading } from '@user/data-base';
import { fallbackLoad } from './fallback';

export function createMaterial() {
    loading.once('loaded', () => {
        fallbackLoad();
    });
}

export * from './autotile';
export * from './builder';
export * from './fallback';
export * from './ins';
export * from './manager';
export * from './types';
export * from './utils';
