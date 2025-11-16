import { CoreState } from './core';

export function createCoreState() {
    const width = core._WIDTH_;
    const height = core._HEIGHT_;
    const bg = state.layer.addLayer(width, height);
    const bg2 = state.layer.addLayer(width, height);
    const event = state.layer.addLayer(width, height);
    const fg = state.layer.addLayer(width, height);
    const fg2 = state.layer.addLayer(width, height);
    state.layer.setLayerAlias(bg, 'bg');
    state.layer.setLayerAlias(bg2, 'bg2');
    state.layer.setLayerAlias(event, 'event');
    state.layer.setLayerAlias(fg, 'fg');
    state.layer.setLayerAlias(fg2, 'fg2');
}

export const state = new CoreState();

export * from './core';
export * from './layerState';
export * from './types';
