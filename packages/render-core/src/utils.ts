import { TimingFn } from 'mutate-animate';
import { JSX } from 'vue/jsx-runtime';
import { DefineComponent, DefineSetupFnComponent } from 'vue';
import { MotaOffscreenCanvas2D } from './canvas2d';
import { Transform } from './transform';

export type Props<
    T extends
        | keyof JSX.IntrinsicElements
        | DefineSetupFnComponent<any>
        | DefineComponent
> = T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : T extends DefineSetupFnComponent<any>
    ? InstanceType<T>['$props'] & InstanceType<T>['$emits']
    : T extends DefineComponent
    ? InstanceType<T>['$props'] & InstanceType<T>['$emits']
    : unknown;

export type ElementLocator = [
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    anchorX?: number,
    anchorY?: number
];

export type ElementAnchor = [x: number, y: number];
export type ElementScale = [x: number, y: number];

const { gl, gl2 } = checkSupport();

function checkSupport() {
    const canvas = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const gl2 = canvas2.getContext('webgl2');
    return { gl: !!gl, gl2: !!gl2 };
}

export function isWebGLSupported() {
    return gl;
}

export function isWebGL2Supported() {
    return gl2;
}

/**
 * 将两个缓动函数做加法
 */
export function addTiming(timing1: TimingFn, timing2: TimingFn): TimingFn {
    return (p: number) => timing1(p) + timing2(p);
}

/**
 * 将两个缓动函数做乘法
 */
export function multiplyTiming(timing1: TimingFn, timing2: TimingFn): TimingFn {
    return (p: number) => timing1(p) * timing2(p);
}

/**
 * 判断两个集合是否相等
 */
export function isSetEqual<T>(set1: Set<T>, set2: Set<T>) {
    if (set1 === set2) return true;
    else return set1.size === set2.size && set1.isSubsetOf(set2);
}

export function transformCanvas(
    canvas: MotaOffscreenCanvas2D,
    transform: Transform
) {
    const { ctx } = canvas;
    const mat = transform.mat;
    const [a, b, , c, d, , e, f] = mat;
    ctx.transform(a, b, c, d, e, f);
}
