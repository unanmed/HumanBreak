import { createDanmaku } from './danmaku';
import { createFixed } from './fixed';
import { createUI } from './ui';

export function createPreset() {
    createDanmaku();
    createFixed();
    createUI();
}

export * from './ui';
export * from './settings';
export * from './danmaku';
export * from './fixed';
export * from './keyboard';
export * from './uiIns';
export * from './settingIns';
