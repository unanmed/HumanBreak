import { loading } from '@user/data-base';
import { fallbackLoad } from './fallback';

export function createMaterial() {
    loading.once('loaded', () => {
        fallbackLoad();
    });
}

export * from './manager';
