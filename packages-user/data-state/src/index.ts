import { loading } from '@user/data-base';
import { createMechanism } from './mechanism';
import { createCoreState } from './core';

export function create() {
    createMechanism();
    loading.once('loaded', () => {
        // 加载后初始化全局状态
        createCoreState();
    });
}

export * from './core';
export * from './enemy';
export * from './map';
export * from './mechanism';
export * from './state';
