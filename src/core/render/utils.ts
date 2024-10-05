import { TimingFn } from 'mutate-animate';
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

/**
 * 将两个缓动函数做加法
 */
export function AddTiming(timing1: TimingFn, timing2: TimingFn): TimingFn {
    return (p: number) => timing1(p) + timing2(p);
}

/**
 * 将两个缓动函数做乘法
 */
export function multiplyTiming(timing1: TimingFn, timing2: TimingFn): TimingFn {
    return (p: number) => timing1(p) * timing2(p);
}
