import { RenderAdapter } from './adapter';
import { FloorViewport } from './preset/viewport';

export function disableViewport() {
    const adapter = RenderAdapter.get<FloorViewport>('viewport');
    if (!adapter) return;
    adapter.sync('disable');
}

export function enableViewport() {
    const adapter = RenderAdapter.get<FloorViewport>('viewport');
    if (!adapter) return;
    adapter.sync('disable');
}
