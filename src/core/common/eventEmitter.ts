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
}
