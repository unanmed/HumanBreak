import { loading } from '@user/data-base';
import { initFallback } from './fallback';
import { initFiveLayer } from './fiveLayer';
import { createHook } from './hook';
import { initReplay } from './replay';
import { initUI } from './ui';
import { createEnemy } from './enemy';

export function createLegacy() {
    initFallback();
    loading.once('coreInit', () => {
        createEnemy();
        initFiveLayer();
        createHook();
        initReplay();
        initUI();
    });
}

export * from './enemy';
export * from './fallback';
export * from './fiveLayer';
export * from './removeMap';
export * from './replay';
export * from './shop';
export * from './ui';
