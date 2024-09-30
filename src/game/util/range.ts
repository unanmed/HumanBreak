import { isNil } from 'lodash-es';

interface RangeTypeData {
    square: { x: number; y: number; d: number };
    rect: { x: number; y: number; w: number; h: number };
}

type InRangeFn<E extends Partial<Loc>, T> = (item: E, data: T) => boolean;

export class Range {
    static rangeType: Record<string, RangeType> = {};

    /**
     * 获取一个范围类型，并进行判断
     * @param type 范围类型
     */
    type<T extends string>(
        type: T
    ): T extends keyof RangeTypeData ? RangeType<RangeTypeData[T]> : RangeType {
        return Range.rangeType[type] as T extends keyof RangeTypeData
            ? RangeType<RangeTypeData[T]>
            : RangeType;
    }

    /**
     * 注册一个新的范围类型
     * @param type 范围类型
     * @param fn 判断是否在范围内的函数
     */
    static register<K extends keyof RangeTypeData>(
        type: K,
        fn: InRangeFn<Partial<Loc>, RangeTypeData[K]>
    ): void;
    static register(type: string, fn: InRangeFn<Partial<Loc>, any>): void;
    static register(type: string, fn: InRangeFn<Partial<Loc>, any>): void {
        const range = new RangeType(type, fn);
        this.rangeType[type] = range;
    }
}

class RangeType<Type = any> {
    readonly type: string;
    /**
     * 判断一个元素是否在指定范围内
     * @param item 要判断的元素
     * @param data 范围数据
     */
    readonly inRange: InRangeFn<Partial<Loc>, Type>;

    constructor(type: string, fn: InRangeFn<Partial<Loc>, Type>) {
        this.type = type;
        this.inRange = fn;
    }

    /**
     * 扫描一个列表中所有在范围内的元素
     * @param items 元素列表
     * @param data 范围数据
     */
    scan<T extends Partial<Loc>>(items: Iterable<T>, data: Type): T[] {
        const res: T[] = [];
        for (const ele of items) {
            if (this.inRange(ele, data)) {
                res.push(ele);
            }
        }
        return res;
    }
}

Range.register('square', (item, { x, y, d }) => {
    if (isNil(item.x) || isNil(item.y)) return false;
    const r = Math.floor(d / 2);
    return Math.abs(item.x - x) <= r && Math.abs(item.y - y) <= r;
});
Range.register('rect', (item, { x, y, w, h }) => {
    if (isNil(item.x) || isNil(item.y)) return false;
    const ex = x + w;
    const ey = y + h;
    return item.x >= x && item.y >= y && item.x < ex && item.y < ey;
});
