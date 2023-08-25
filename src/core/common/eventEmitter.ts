import { has } from '../../plugin/utils';

export interface EmitableEvent {
    [event: string]: (...params: any) => any;
}

interface Listener<T extends (...params: any) => any> {
    fn: T;
    once?: boolean;
    immediate?: boolean;
}

interface ListenerOptions {
    once: boolean;
    immediate: boolean;
}

export class EventEmitter<T extends EmitableEvent = {}> {
    private events: {
        [P in keyof T]?: Listener<T[P]>[];
    } = {};
    private emitted: (keyof T)[] = [];

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
    ) {
        if (options?.immediate && this.emitted.includes(event)) {
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
    off<K extends keyof T>(event: K, fn: T[K]) {
        const index = this.events[event]?.findIndex(v => v.fn === fn);
        if (index === -1 || index === void 0) return;
        this.events[event]?.splice(index, 1);
    }

    /**
     * 监听事件，并只触发一次
     * @param event 要监听的事件
     * @param fn 监听函数
     */
    once<K extends keyof T>(event: K, fn: T[K]) {
        this.on(event, fn, { once: true });
    }

    /**
     * 触发某个事件
     * @param event 要触发的事件类型
     * @param params 传入的参数
     */
    emit<K extends keyof T>(event: K, ...params: Parameters<T[K]>) {
        if (!this.emitted.includes(event)) {
            this.emitted.push(event);
        }
        const events = (this.events[event] ??= []);
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            e.fn(...(params as any));
            if (e.once) {
                events.splice(i, 1);
                i--;
            }
        }
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
    removeAllListeners(event?: keyof T) {
        if (has(event)) this.events[event] = [];
        else this.events = {};
    }
}

type IndexedSymbol = number | string | symbol;

export class IndexedEventEmitter<
    T extends EmitableEvent
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
