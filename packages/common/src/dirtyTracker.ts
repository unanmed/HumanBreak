import { isNil } from 'lodash-es';
import { IDirtyMark, IDirtyTracker } from './types';

/**
 * 布尔类型的脏标记追踪器。当传入 `dirtySince` 的标记不属于当前的追踪器时，会返回 `true`
 */
export class PrivateBooleanDirtyTracker implements IDirtyTracker<boolean> {
    /** 标记映射 */
    private markMap: WeakMap<IDirtyMark, number> = new WeakMap();
    /** 脏标记 */
    private dirtyFlag: number = 0;

    mark(): IDirtyMark {
        const symbol = {};
        this.markMap.set(symbol, this.dirtyFlag);
        return symbol;
    }

    unmark(mark: IDirtyMark): void {
        this.markMap.delete(mark);
    }

    dirtySince(mark: IDirtyMark): boolean {
        const num = this.markMap.get(mark);
        if (isNil(num)) return true;
        return num < this.dirtyFlag;
    }

    hasMark(symbol: IDirtyMark): boolean {
        return this.markMap.has(symbol);
    }

    /**
     * 将数据标记为脏
     */
    protected dirty() {
        this.dirtyFlag++;
    }
}

/**
 * 列表的脏标记追踪器。当传入 `dirtySince` 的标记不属于当前的追踪器时，会返回空集合
 */
export class PrivateListDirtyTracker<T extends number>
    implements IDirtyTracker<Set<T>>
{
    /** 标记映射，键表示在索引，值表示其对应的标记数字 */
    private readonly markMap: Map<T, number> = new Map();
    /** 标记 symbol 映射，值表示这个 symbol 对应的标记数字 */
    private readonly symbolMap: WeakMap<{}, number> = new WeakMap();

    /** 脏标记数字 */
    private dirtyFlag: number = 0;

    constructor(protected length: number) {}

    mark(): IDirtyMark {
        const symbol = {};
        this.symbolMap.set(symbol, this.dirtyFlag);
        return symbol;
    }

    unmark(mark: IDirtyMark): void {
        this.symbolMap.delete(mark);
    }

    dirtySince(mark: IDirtyMark): Set<T> {
        const num = this.symbolMap.get(mark);
        const res = new Set<T>();
        if (isNil(num)) return res;
        this.markMap.forEach((v, k) => {
            if (v > num) res.add(k);
        });
        return res;
    }

    hasMark(symbol: IDirtyMark): boolean {
        return this.symbolMap.has(symbol);
    }

    protected dirty(data: T): void {
        if (data >= this.length) return;
        this.dirtyFlag++;
        this.markMap.set(data, this.dirtyFlag);
    }

    protected updateLength(length: number) {
        this.length = length;
    }
}

export class PrivateMapDirtyTracker<T extends string>
    implements IDirtyTracker<Record<T, boolean>>
{
    /** 标记映射，键表示名称，值表示其对应的标记数字 */
    private readonly markMap: Map<T, number> = new Map();
    /** 标记 symbol 映射，值表示这个 symbol 对应的标记数字 */
    private readonly symbolMap: WeakMap<{}, number> = new WeakMap();

    /** 脏标记数字 */
    private dirtyFlag: number = 0;

    constructor(protected length: number) {}

    mark(): IDirtyMark {
        const symbol = {};
        this.symbolMap.set(symbol, this.dirtyFlag);
        return symbol;
    }

    unmark(mark: IDirtyMark): void {
        this.symbolMap.delete(mark);
    }

    dirtySince(mark: IDirtyMark): Record<T, boolean> {
        const num = this.symbolMap.get(mark) ?? 0;
        const obj: Partial<Record<T, boolean>> = {};
        this.markMap.forEach((v, k) => {
            if (v > num) obj[k] = true;
            else obj[k] = false;
        });
        return obj as Record<T, boolean>;
    }

    hasMark(symbol: IDirtyMark): boolean {
        return this.symbolMap.has(symbol);
    }

    protected dirty(data: T): void {
        this.dirtyFlag++;
        this.markMap.set(data, this.dirtyFlag);
    }
}
