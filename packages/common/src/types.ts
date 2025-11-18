export interface IDirtyMarker<T> {
    /**
     * 标记为脏，即进行了一次更新
     * @param data 传递给追踪器的数据
     */
    dirty(data: T): void;
}

export interface IDirtyMark {}

export interface IDirtyTracker<T> {
    /**
     * 对状态进行标记
     */
    mark(): IDirtyMark;

    /**
     * 取消指定标记符号
     * @param mark 标记符号
     */
    unmark(mark: IDirtyMark): void;

    /**
     * 从指定标记符号开始，数据是否发生了变动
     * @param mark 标记符号
     */
    dirtySince(mark: IDirtyMark): T;

    /**
     * 当前追踪器是否包含指定标记符号
     * @param symbol 标记符号
     */
    hasMark(symbol: IDirtyMark): boolean;
}
