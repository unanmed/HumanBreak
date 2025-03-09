import { loading } from '@user/data-base';
import { initFallback } from './fallback';
import { initFiveLayer } from './fiveLayer';
import { createHook } from './hook';
import { initReplay } from './replay';
import { initUI } from './ui';

if (import.meta.env.DEV) {
    import('./dev/hotReload');
}

export function create() {
    initFallback();
    loading.once('coreInit', () => {
        initFiveLayer();
        createHook();
        initReplay();
        initUI();
    });
}

export * from './chase';
export * from './fallback';
export * from './fiveLayer';
export * from './removeMap';
export * from './replay';
export * from './shop';
export * from './skill';
export * from './ui';
