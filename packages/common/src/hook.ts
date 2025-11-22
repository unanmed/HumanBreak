import { logger } from './logger';
import { IHookable, IHookBase, IHookController, IHookObject } from './types';

export abstract class Hookable<
    H extends IHookBase = IHookBase,
    C extends IHookController<H> = IHookController<H>
> implements IHookable<H, C>
{
    /** 加载完成的钩子列表 */
    protected readonly loadedList: Set<IHookObject<H, C>> = new Set();

    /** 钩子列表 */
    private readonly hookList: Set<IHookObject<H, C>> = new Set();
    /** 钩子对象到钩子存储对象的映射 */
    private readonly hookMap: Map<Partial<H>, IHookObject<H, C>> = new Map();
    /** 钩子控制器到钩子存储对象的映射 */
    private readonly controllerMap: Map<C, IHookObject<H, C>> = new Map();

    /**
     * 创建钩子对象的控制器
     * @param hook 钩子对象
     */
    protected abstract createController(hook: Partial<H>): C;

    addHook(hook: Partial<H>): C {
        const controller = this.createController(hook);
        const obj: IHookObject<H, C> = { hook, controller };
        this.hookMap.set(hook, obj);
        this.controllerMap.set(controller, obj);
        this.hookList.add(obj);
        return controller;
    }

    loadHook(hook: Partial<H>): void {
        const obj = this.hookMap.get(hook);
        if (!obj) {
            logger.warn(85);
            return;
        }
        hook.awake?.(obj.controller);
        this.loadedList.add(obj);
    }

    removeHook(hook: Partial<H>): void {
        const obj = this.hookMap.get(hook);
        if (!obj) return;
        obj.hook.destroy?.(obj.controller);
        this.hookList.delete(obj);
        this.loadedList.delete(obj);
        this.hookMap.delete(hook);
        this.controllerMap.delete(obj.controller);
    }

    removeHookByController(hook: C): void {
        const obj = this.controllerMap.get(hook);
        if (!obj) return;
        obj.hook.destroy?.(obj.controller);
        this.hookList.delete(obj);
        this.loadedList.delete(obj);
        this.controllerMap.delete(hook);
        this.hookMap.delete(obj.hook);
    }

    forEachHook<T>(fn: (hook: Partial<H>, controller: C) => T): T[] {
        const arr: T[] = [];
        this.loadedList.forEach(v => {
            arr.push(fn(v.hook, v.controller));
        });
        return arr;
    }
}

export class HookController<H extends IHookBase> implements IHookController<H> {
    constructor(
        readonly hookable: IHookable<H, IHookController<H>>,
        readonly hook: Partial<H>
    ) {}

    load(): void {
        this.hookable.loadHook(this.hook);
    }

    unload(): void {
        this.hookable.removeHookByController(this);
    }
}
