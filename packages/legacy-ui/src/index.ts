import { createFx } from './fx';
import { createPreset } from './preset';

export function create() {
    createFx();
    createPreset();
}

export * as UI from './ui';
export * as Components from './components';
export * from './preset';
export * from './tools';
export * from './fx';

export * from './animateController';
export * from './controller';
export * from './danmaku';
// export * from './mark';
export * from './setting';
export * from './use';
export * from './utils';
export * from './uiUtils';
