export interface IExcitable<T> {
    /**
     * 受到激励源激励
     * @param payload 由激励源传递而来的负载
     */
    excited(payload: T): void;
}

export interface IExcitableController<T> {
    /** 受激励对象 */
    readonly excitable: T;

    /**
     * 释放此受激励对象，不再受到当前激励源激励，可以换用其他激励源
     */
    revoke(): void;

    /**
     * 手动激励此受激励对象一次
     * @param payload 激励负载
     */
    excite(payload: T): void;
}

export interface IExcitation<T> {
    /**
     * 获取当前的激励负载
     */
    payload(): T;

    /**
     * 激励所有由此激励源激励的内容
     * @param payload 传递给激励内容的负载
     */
    excite(payload: T): void;

    /**
     * 添加受激励对象
     * @param object 受激励对象
     * @returns 受激励对象控制器
     */
    add(object: IExcitable<T>): IExcitableController<T>;

    /**
     * 移除一个受激励对象
     * @param object 受激励对象
     * @returns 是否成功移除，内容不存在或是其他特殊情况会返回 `false`
     */
    remove(object: IExcitable<T>): boolean;

    /**
     * 摧毁这个激励源
     */
    destroy(): void;
}
