import { has } from './utils';

type RangeScanFn<C extends Partial<Loc>> = (
    collection: Range<C>,
    data: any
) => C[];
type InRangeFn<C extends Partial<Loc>> = (
    collection: Range<C>,
    data: any,
    item: Partial<Loc>
) => boolean;

interface RangeType<C extends Partial<Loc>> {
    scan: RangeScanFn<C>;
    inRange: InRangeFn<C>;
}

export interface RangeCollection<I extends Partial<Loc>> {
    list: I[];
    range: Range<I>;
}

export class Range<C extends Partial<Loc>> {
    collection: RangeCollection<C>;
    cache: Record<string, any> = {};

    static rangeType: Record<string, RangeType<Partial<Loc>>> = {};

    constructor(collection: RangeCollection<C>) {
        this.collection = collection;
    }

    /**
     * 扫描 collection 中在范围内的物品
     * @param type 范围类型
     * @param data 范围数据
     * @returns 在范围内的物品列表
     */
    scan(type: string, data: any): C[] {
        const t = Range.rangeType[type];
        if (!t) {
            throw new Error(`Unknown range type: ${type}.`);
        }
        return t.scan(this, data) as C[];
    }

    inRange(type: string, data: any, item: Partial<Loc>) {
        const t = Range.rangeType[type];
        if (!t) {
            throw new Error(`Unknown range type: ${type}.`);
        }
        return t.inRange(this, data, item);
    }

    clearCache() {
        this.cache = {};
    }

    static registerRangeType(
        type: string,
        scan: RangeScanFn<Partial<Loc>>,
        inRange: InRangeFn<Partial<Loc>>
    ) {
        Range.rangeType[type] = {
            scan,
            inRange
        };
    }
}

// ----- 默认的范围类型

// 方形区域
Range.registerRangeType(
    'square',
    (col, { x, y, d }) => {
        const list = col.collection.list;
        const r = Math.floor(d / 2);

        return list.filter(v => {
            return (
                has(v.x) &&
                has(v.y) &&
                Math.abs(v.x - x) <= r &&
                Math.abs(v.y - y) <= r
            );
        });
    },
    (col, { x, y, d }, item) => {
        const r = Math.floor(d / 2);
        return (
            has(item.x) &&
            has(item.y) &&
            Math.abs(item.x - x) <= r &&
            Math.abs(item.y - y) <= r
        );
    }
);
