# 类 Range

游戏进程类，渲染进程也可以使用

-   实例成员
    -   [`collection`](#collection)
    -   [`cache`](#cache)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`scan`](#scan)
    -   [`inRange`](#inrange)
    -   [`clearCache`](#clearcache)
-   静态成员
    -   [`rangeType`](#rangetype)
-   静态方法
    -   [`registerRangeType`](#registerrangetype)

## 部分接口说明

```ts
interface RangeCollection {
    list: Partial<Loc>[]
    range: Range
}
```

-   `list`: 所有可能被这个范围实例扫描到的内容，是一个对象，可选包含 `x` `y` 两个属性
-   `range`: 这个内容集所属的范围实例

## collection

```ts
declare var range: RangeCollection
```

-   成员说明

    存储所有可能被这个范围实例扫描到的内容

## cache

```ts
declare var cache: Record<string, any>
```

-   成员说明

    缓存，一般需要你手动操作，内容随意

## constructor()

```ts
interface Range {
    new(collection: RangeCollection): Range
}
```

## scan()

```ts
declare function scan(type: string, data: any): any[]
```

-   参数说明

    -   `type`: 范围类型，系统自带 `square` 和 `manhattan`，表示方形与曼哈顿范围
    -   `data`: 传入给扫描函数的数据，例如可以是范围的坐标与大小等

-   方法说明

    扫描 collection 中在范围内的物品

-   返回值

    所有在范围内的物品构成的数组

## inRange()

```ts
declare function inRange(type: string, data: any, item: Partial<Loc>): boolean
```

-   方法说明

    判断一个物品是否在指定范围中，用法与 [`scan`](#scan) 类似

## clearCache()

```ts
declare function clearCache(): void
```

## rangeType

```ts
declare var rangeType: Record<string, RangeType>
```

-   静态成员说明

    存储了所有注册的范围类型

-   接口 `RangeType`

    ```ts
    interface RangeType {
        scan: RangeScanFn;
        inRange: InRangeFn;
    }
    ```

## registerRangeType()

```ts
declare function registerRangeType(
    type: string,
    scan: RangeScanFn<Partial<Loc>>,
    inRange: InRangeFn<Partial<Loc>>
)
```

-   参考[范围处理](../../guide/battle.md#范围处理)
