import { RenderAdapter } from '@motajs/render-core';
import { FloorViewport } from './viewport';

export function disableViewport() {
    const adapter = RenderAdapter.get<FloorViewport>('viewport');
    if (!adapter) return;
    adapter.sync('disable');
}

export function enableViewport() {
    const adapter = RenderAdapter.get<FloorViewport>('viewport');
    if (!adapter) return;
    adapter.sync('enable');
}
