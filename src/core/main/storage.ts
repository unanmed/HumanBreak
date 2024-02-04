import { has } from '@/plugin/utils';

export class GameStorage<T extends object = any> {
    static list: GameStorage<any>[] = [];

    key: string;
    data!: T;

    constructor(key: string) {
        this.key = key;
        this.read();
        GameStorage.list.push(this);
    }

    /**
     * 从本地存储读取
     */
    read(): T {
        const data = localStorage.getItem(this.key) ?? '{}';
        return (this.data = JSON.parse(data));
    }

    /**
     * 写入本地存储
     */
    write() {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    /**
     * 设置存储的值
     * @param key 存储的名称
     * @param value 存储的值
     */
    setValue<K extends keyof T>(key: K, value: T[K]): void;
    setValue(key: string, value: any): void;
    setValue<K extends keyof T>(key: K, value: T[K]) {
        this.data[key] = value;
    }

    getValue<K extends keyof T>(key: K): T[K] | null;
    getValue<K extends keyof T>(key: K, defaults: T[K]): T[K];
    getValue<T>(key: string, defaults?: T): T;
    getValue<K extends keyof T>(key: K, defaults?: T[K]) {
        if (has(this.data[key])) return this.data[key];
        else {
            if (defaults !== void 0) {
                this.data[key] = defaults;
                return defaults;
            }
            return null;
        }
    }

    toJSON() {
        return JSON.stringify(this.data);
    }

    clear() {
        // @ts-ignore
        this.data = {};
    }

    keys() {
        return Object.keys(this.data);
    }

    values() {
        return Object.values(this.data);
    }

    entries() {
        return Object.entries(this.data);
    }

    /**
     * 获取本游戏的存储键
     * @param key 存储名称
     */
    static fromGame(key: string) {
        return `HumanBreak_${key}`;
    }

    /**
     * 获取与作者相关联的存储键
     * @param _ 填充参数，无用
     * @param key 存储名称
     */
    static fromAuthor(_: any, key: string) {
        return `${data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.firstData.author}@${key}`;
    }

    /**
     * 根据存储键获取对应的存储实例
     * @param key 存储键
     * @example Storage.get(Storage.fromAuthor('AncTe', 'setting'));
     */
    static get(key: string) {
        return this.list.find(v => v.key === key);
    }
}

window.addEventListener('beforeunload', () => {
    GameStorage.list.forEach(v => v.write());
});
window.addEventListener('blur', () => {
    GameStorage.list.forEach(v => v.write());
});
