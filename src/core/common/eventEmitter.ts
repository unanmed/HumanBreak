function has<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

export type Callable = (...params: any) => any;

export interface Listener<T extends (...params: any) => any> {
    fn: T;
    once?: boolean;
    immediate?: boolean;
}

export interface ListenerOptions {
    once: boolean;
    immediate: boolean;
}

type EmitFn<F extends (...params: any) => any> = (
    events: Listener<F>[],
    ...params: Parameters<F>
) => any;

type Key = number | string | symbol;

export class EventEmitter<T extends Record<keyof T, Callable>> {
    protected events: {
        [x: Key]: Listener<Callable>[];
    } = {};
    private emitted: Set<string> = new Set();

    protected emitter: {
        [x: Key]: EmitFn<Callable> | undefined;
    } = {};

    /**
     * 监听某个事件
     * @param event 要监听的事件类型
     * @param fn 触发事件时执行的函数
     * @param options 监听选项
     */
    on<K extends keyof T>(
        event: K,
        fn: T[K],
        options?: Partial<ListenerOptions>
    ): void;
    on(event: string, fn: Callable, options?: Partial<ListenerOptions>): void;
    on(event: string, fn: Callable, options?: Partial<ListenerOptions>): void {
        if (options?.immediate && this.emitted.has(event)) {
            fn();
            if (!options.once) {
                this.events[event] ??= [];
                this.events[event]?.push({
                    fn
                });
            }
            return;
        }
        this.events[event] ??= [];
        this.events[event]?.push({
            fn,
            once: options?.once
        });
    }

    /**
     * 取消监听某个事件
     * @param event 要取消监听的事件类型
     * @param fn 要取消监听的函数
     */
    off<K extends keyof T>(event: K, fn: T[K]): void;
    off(event: string, fn: Callable): void;
    off(event: string, fn: Callable): void {
        const index = this.events[event]?.findIndex(v => v.fn === fn);
        if (index === -1 || index === void 0) return;
        this.events[event]?.splice(index, 1);
    }

    /**
     * 监听事件，并只触发一次
     * @param event 要监听的事件
     * @param fn 监听函数
     */
    once<K extends keyof T>(event: K, fn: T[K]): void;
    once(event: string, fn: Callable): void;
    once(event: string, fn: Callable): void {
        this.on(event, fn, { once: true });
    }

    /**
     * 触发某个事件
     * @param event 要触发的事件类型
     * @param params 传入的参数
     */
    emit<K extends keyof T>(
        event: K,
        ...params: Parameters<T[K]>
    ): ReturnType<T[K]>[];
    emit(event: string, ...params: any[]): any[];
    emit<K extends keyof T, R>(event: K, ...params: Parameters<T[K]>): R;
    emit<R>(event: string, ...params: any[]): R;
    emit(event: string, ...params: any[]): any[] {
        this.emitted.add(event);
        const events = (this.events[event] ??= []);
        if (!!this.emitter[event]) {
            const returns = this.emitter[event]!(events, ...params);
            this.events[event] = events.filter(v => !v.once);
            return returns;
        } else {
            const returns: ReturnType<Callable>[] = [];
            for (let i = 0; i < events.length; i++) {
                const e = events[i];
                returns.push(e.fn(...(params as any)));
            }
            this.events[event] = events.filter(v => !v.once);
            return returns;
        }
    }

    /**
     * 设置一个事件的执行器(emitter)
     * @param event 要设置的事件
     * @param fn 事件执行器，留空以清除触发器
     */
    // @ts-ignore
    setEmitter<K extends keyof T>(event: K, fn?: EmitFn<T[K]>): void;
    setEmitter(event: string, fn?: EmitFn<Callable>): void;
    setEmitter(event: string, fn?: EmitFn<Callable>): void {
        this.emitter[event] = fn;
    }

    /**
     * 取消监听所有的事件，删除所有监听函数
     */
    removeAllListeners(): void;
    /**
     * 取消监听一个事件的所有函数
     * @param event 要取消监听的事件
     */
    removeAllListeners(event: keyof T): void;
    /**
     * 取消监听一个事件的所有函数
     * @param event 要取消监听的事件
     */
    removeAllListeners(event: string): void;
    removeAllListeners(event?: string | keyof T) {
        if (has(event)) this.events[event] = [];
        else this.events = {};
    }
}

type IndexedSymbol = number | string | symbol;

export class IndexedEventEmitter<
    T extends Record<keyof T, Callable>
> extends EventEmitter<T> {
    private fnMap: {
        [P in keyof T]?: Map<IndexedSymbol, T[P]>;
    } = {};

    /**
     * 监听事件，并将函数与唯一标识符绑定
     * @param event 事件类型
     * @param symbol 监听函数的唯一标识符
     * @param fn 监听函数
     * @param options 监听配置
     */
    onIndex<K extends keyof T>(
        event: K,
        symbol: IndexedSymbol,
        fn: T[K],
        options: Partial<ListenerOptions>
    ) {
        const map = this.ensureMap(event);
        if (map.has(symbol)) {
            console.warn(
                `监听${String(event)}出错：已存在标识符为${String(
                    symbol
                )}的监听函数，已将其覆盖`
            );
            this.offIndex(event, symbol);
        }
        map.set(symbol, fn);
        this.on(event, fn, options);
    }

    /**
     * 监听事件，绑定唯一标识符，但监听函数只会执行一次
     * @param event 要监听的事件
     * @param symbol 监听函数的唯一标识符
     * @param fn 监听函数
     */
    onceIndex<K extends keyof T>(event: K, symbol: IndexedSymbol, fn: T[K]) {
        this.onIndex(event, symbol, fn, { once: true });
    }

    /**
     * 取消监听一个事件
     * @param event 要取消监听的事件
     * @param symbol 取消监听的函数的唯一标识符
     */
    offIndex<K extends keyof T>(event: K, symbol: IndexedSymbol) {
        const map = this.ensureMap(event);
        const fn = map.get(symbol);
        if (!fn) return;
        this.off(event, fn);
    }

    private ensureMap<K extends keyof T>(event: K) {
        return this.fnMap[event] ?? new Map<IndexedSymbol, T[K]>();
    }
}
