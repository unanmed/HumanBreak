import { EventEmitter } from 'eventemitter3';

interface MonoStoreEvent<T> {
    change: [before: T | undefined, after: T | undefined];
}

/**
 * 一个可序列化存储结构，存储多个数据，但是同时只能有一个数据正在使用，适合那些需要切换的场景，
 * 例如多勇士，多摄像机等，就可以通过此结构进行存储，然后同时只能操作一个勇士、摄像机等。
 */
export class MonoStore<T> extends EventEmitter<MonoStoreEvent<T>> {
    list: Map<string, T> = new Map();
    using?: T;
    usingId?: string;

    /**
     * 使用指定id的数据
     * @param id 要使用的数据id
     */
    use(id: string) {
        const before = this.using;
        this.using = this.list.get(id);
        this.usingId = id;
        this.emit('change', before, this.using);
    }

    static toJSON(data: MonoStore<any>) {
        return JSON.stringify({
            now: data.usingId,
            data: [...data.list]
        });
    }

    static fromJSON<T>(data: string): MonoStore<T> {
        const d = JSON.parse(data);
        const arr: [string, T][] = d.data;
        const store = new MonoStore<T>();
        arr.forEach(([key, value]) => {
            store.list.set(key, value);
        });
        if (d.now) store.use(d.now);
        return store;
    }
}

export namespace SerializeUtils {
    interface StructSerializer<T> {
        toJSON(data: T): string;
        fromJSON(data: string): T;
    }

    /**
     * Map键值对序列化函数，如果使用Map作为state，那么需要使用这里面的函数作为序列化与反序列化函数
     */
    export const mapSerializer: StructSerializer<Map<any, any>> = {
        toJSON(data) {
            return JSON.stringify([...data]);
        },
        fromJSON(data) {
            return new Map(JSON.parse(data));
        }
    };

    /**
     * Set集合序列化函数，如果使用Set作为state，那么需要使用这里面的函数作为序列化与反序列化函数
     */
    export const setSerializer: StructSerializer<Set<any>> = {
        toJSON(data) {
            return JSON.stringify([...data]);
        },
        fromJSON(data) {
            return new Set(JSON.parse(data));
        }
    };
}
