type AdapterFunction<T> = (item: T, ...params: any[]) => Promise<any>;

/**
 * 渲染适配器，用作渲染层与数据层沟通的桥梁，用于在数据层等待渲染层执行，常用与动画等。
 * 例如移动图块，移动图块操作先由数据层执行，删除原有图块，然后通知渲染层进行移动动画，
 * 而移动动画是耗时的，因此需要通过本类进行适配，实现等待移动动画执行完毕，然后进行后续操作
 */
export class RenderAdapter<T> {
    static adapters: Map<string, RenderAdapter<any>> = new Map();

    /** 所有元素的集合 */
    items: Set<T> = new Set();
    /** 适配器的id */
    id: string;

    private execute: Map<string, AdapterFunction<T>> = new Map();

    constructor(id: string) {
        this.id = id;
        RenderAdapter.adapters.set(id, this);
    }

    /**
     * 添加一个元素
     */
    add(item: T) {
        this.items.add(item);
    }

    /**
     * 移除一个元素
     */
    remove(item: T) {
        this.items.delete(item);
    }

    /**
     * 设置执行函数
     * @param fn 对于每个元素执行的函数
     */
    recieve(id: string, fn: AdapterFunction<T>): void {
        this.execute.set(id, fn);
    }

    /**
     * 对所有元素执行函数，当所有元素都运行完毕后兑现，类似于Promise.all
     * @returns 包含每个元素运行结果的数组
     */
    all<R = any>(fn: string, ...params: any[]): Promise<R[]> {
        const execute = this.execute.get(fn);
        if (!execute) {
            return Promise.reject();
        } else {
            return Promise.all(
                [...this.items].map(v => execute!(v, ...params))
            );
        }
    }

    /**
     * 对所有元素执行函数，当任意一个元素运行完毕后兑现，类似于Promise.any
     * @returns 最先运行完毕的元素的结果
     */
    any<R = any>(fn: string, ...params: any[]): Promise<R> {
        const execute = this.execute.get(fn);
        if (!execute) {
            return Promise.reject();
        } else {
            return Promise.any(
                [...this.items].map(v => execute!(v, ...params))
            );
        }
    }

    /**
     * 销毁这个adapter
     */
    destroy() {
        RenderAdapter.adapters.delete(this.id);
    }

    /**
     * 获取适配器
     */
    static get<T>(id: string): RenderAdapter<T> | undefined {
        return this.adapters.get(id);
    }
}
