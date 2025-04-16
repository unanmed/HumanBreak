import type * as Client from '@motajs/client';
import type * as ClientBase from '@motajs/client-base';
import type * as Common from '@motajs/common';
import type * as LegacyClient from '@motajs/legacy-client';
import type * as LegacyCommon from '@motajs/legacy-common';
import type * as LegacySystem from '@motajs/legacy-system';
import type * as LegacyUI from '@motajs/legacy-ui';
import type * as Render from '@motajs/render';
import type * as RenderCore from '@motajs/render-core';
import type * as RenderElements from '@motajs/render-elements';
import type * as RenderStyle from '@motajs/render-style';
import type * as RenderVue from '@motajs/render-vue';
import type * as System from '@motajs/system';
import type * as SystemAction from '@motajs/system-action';
import type * as SystemUI from '@motajs/system-ui';
import type * as ClientModules from '@user/client-modules';
import type * as DataBase from '@user/data-base';
import type * as DataFallback from '@user/data-fallback';
import type * as DataState from '@user/data-state';
import type * as DataUtils from '@user/data-utils';
import type * as LegacyPluginClient from '@user/legacy-plugin-client';
import type * as LegacyPluginData from '@user/legacy-plugin-data';
// ---------- 必要的第三方库
import type * as MutateAnimate from 'mutate-animate';
import type * as Vue from 'vue';
import type * as Lodash from 'lodash-es';

interface ModuleInterface {
    '@motajs/client': typeof Client;
    '@motajs/client-base': typeof ClientBase;
    '@motajs/common': typeof Common;
    '@motajs/legacy-client': typeof LegacyClient;
    '@motajs/legacy-common': typeof LegacyCommon;
    '@motajs/legacy-system': typeof LegacySystem;
    '@motajs/legacy-ui': typeof LegacyUI;
    '@motajs/render': typeof Render;
    '@motajs/render-core': typeof RenderCore;
    '@motajs/render-elements': typeof RenderElements;
    '@motajs/render-style': typeof RenderStyle;
    '@motajs/render-vue': typeof RenderVue;
    '@motajs/system': typeof System;
    '@motajs/system-action': typeof SystemAction;
    '@motajs/system-ui': typeof SystemUI;
    '@user/client-modules': typeof ClientModules;
    '@user/data-base': typeof DataBase;
    '@user/data-fallback': typeof DataFallback;
    '@user/data-state': typeof DataState;
    '@user/data-utils': typeof DataUtils;
    '@user/legacy-plugin-client': typeof LegacyPluginClient;
    '@user/legacy-plugin-data': typeof LegacyPluginData;
    // ---------- 必要的第三方库
    MutateAnimate: typeof MutateAnimate;
    Vue: typeof Vue;
    Lodash: typeof Lodash;
}

export interface IMota {
    r: typeof r;
    rf: typeof rf;

    /**
     * 获取一个样板接口
     * @param key 接口名称
     */
    require<K extends keyof ModuleInterface>(key: K): ModuleInterface[K];
    /**
     * 获取一个样板接口
     * @param key 接口名称
     */
    require<T = unknown>(key: string): T;

    /**
     * 注册一个样板接口
     * @param key 接口名称
     * @param data 接口内容
     */
    register<K extends keyof ModuleInterface>(
        key: K,
        data: ModuleInterface[K]
    ): void;
    /**
     * 注册一个样板接口
     * @param key 接口名称
     * @param data 接口内容
     */
    register(key: string, data: unknown): void;
}

/**
 * 样板接口系统，通过 Mota 获取到样板的核心功能
 */
class MotaSystem implements IMota {
    private modules: Record<string, any> = {};

    r = r;
    rf = rf;

    require(key: string): any {
        const data = this.modules[key];
        if (data) return data;
        else {
            throw new Error(`Cannot resolve module '${key}'`);
        }
    }

    register(key: string, data: any) {
        if (key in this.modules) {
            console.warn(`模块注册重复: '${key}'，已将其覆盖`);
        }
        this.modules[key] = data;
    }
}

/**
 * 在渲染进程包裹下执行一段代码，该段代码不会在录像验证中执行，因此里面的内容一定不会引起录像报错
 * 一般特效，或者是ui显示、内容显示、交互监听等内容应当在渲染进程包裹下执行。
 * 无法获取到执行内容的返回值，因为渲染进程中的值不应当直接出现在游戏进程中，否则很可能导致录像出错，
 * 如果需要其返回值，应当直接在函数后面新增内容，而不是在游戏进程中使用
 * @param fn 要执行的函数，传入一个参数，表示所有的第三方库，也就是`Mota.Package.requireAll()`的内容
 * @param thisArg 函数的执行上下文，即函数中`this`指向
 */
function r<T = undefined>(fn: (this: T) => void, thisArg?: T) {
    if (!main.replayChecking && main.mode === 'play') fn.call(thisArg as T);
}

const empty = () => {};

/**
 * 将一个函数包裹成渲染进程函数，执行这个函数时将直接在渲染进程下执行。该函数与 {@link r} 函数的关系，
 * 与`call`和`bind`的关系类似。
 * ```ts
 * const fn = rf((x) => x * x);
 * console.log(fn(2)); // 在正常游玩中会输出 4，但是录像验证中会输出undefined，因为录像验证中不会执行渲染进程函数
 * ```
 * @param fn 要执行的函数
 * @param thisArg 函数执行时的上下文，即this指向
 * @returns 经过渲染进程包裹的函数，直接调用即是在渲染进程下执行的
 */
function rf<F extends (...params: any) => any, T>(
    fn: F,
    thisArg?: T
): (this: T, ...params: Parameters<F>) => ReturnType<F> | undefined {
    // @ts-expect-error 录像验证的时候不能执行任何操作，因此返回空函数
    if (main.replayChecking || main.mode === 'editor') return empty;
    else {
        return (...params) => {
            return fn.call(thisArg, ...params);
        };
    }
}

declare global {
    interface Window {
        Mota: IMota;
    }
}

export const Mota: IMota = new MotaSystem();

export function createMota() {
    window.Mota = Mota;
}
