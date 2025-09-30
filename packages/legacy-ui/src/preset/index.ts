import { createSetting, createUI } from './ui';

export function createPreset() {
    createUI();
    createSetting();
}

export * from './ui';
export * from './settings';
export * from './keyboard';
export * from './uiIns';
export * from './settingIns';
