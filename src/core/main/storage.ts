export class GameStorage<T> {
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
    setValue<K extends keyof T>(key: K, value: T[K]) {
        this.data[key] = value;
    }

    getValue<K extends keyof T>(key: K): T[K] | null;
    getValue<K extends keyof T>(key: K, defaults: T[K]): T[K];
    getValue<K extends keyof T>(key: K, defaults?: T[K]) {
        if (this.data[key]) return this.data[key];
        else {
            if (defaults !== void 0) {
                this.data[key] = defaults;
                return defaults;
            }
            return null;
        }
    }

    /**
     * 获取本游戏的存储键
     * @param key 存储名称
     */
    static fromGame(key: string) {
        return `HumanBreak_${key}`;
    }

    static fromAncTe(key: string) {
        return `AncTe@${key}`;
    }
}

window.addEventListener('unload', () => {
    GameStorage.list.forEach(v => v.write());
});
