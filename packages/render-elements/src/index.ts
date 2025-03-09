import { createCache } from './cache';
import { createFrame } from './frame';
import { createLayer } from './layer';
import { createViewport } from './viewport';

export function create() {
    createCache();
    createFrame();
    createLayer();
    createViewport();
}

export * from './animate';
export * from './block';
export * from './cache';
export * from './camera';
export * from './frame';
export * from './graphics';
export * from './hero';
export * from './layer';
export * from './misc';
export * from './types';
export * from './utils';
export * from './viewport';
