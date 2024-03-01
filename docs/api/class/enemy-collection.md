# 类 EnemyCollection

游戏进程类，渲染进程也可以使用

-   实例成员
    -   [`floorId`](#floorid)
    -   [`list`](#list)
    -   [`range`](#range)
    -   [`mapDamage`](#mapdamage)
    -   [`haloList`](#halolist)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`get`](#get)
    -   [`extract`](#extract)
    -   [`calRealAttribute`](#calrealattribute)
    -   [`calMapDamage`](#calmapdamage)
    -   [`applyHalo`](#applyhalo)
    -   [`preBalanceHalo`](#prebalancehalo)
    -   [`render`](#render)

## floorId

```ts
declare var floorId: string
```

-   成员说明

    怪物集合所属楼层

## list

```ts
declare var list: DamageEnemy[]
```

-   成员说明

    这个怪物集合中所有的怪物

## mapDamage

```ts
declare var mapDamage: Record<LocString, MapDamage>
```

-   成员说明

    存储了当前楼层的所有地图伤害，键为位置，格式为 `x,y`，值为这一点的伤害信息

-   接口 `MapDamage`

    ```ts
    interface MapDamage {
        damage: number;
        type: Set<string>;
        repulse?: LocArr[];
        ambush?: DamageEnemy[];
    }
    ```

    -   `damage`: 这一点的伤害值
    -   `type`: 这一点的伤害类型集合，例如阻击夹击伤害等
    -   `repulse`: 阻击信息
    -   `ambush`: 捕捉信息

## haloList

```ts
declare var haloList: HaloData[]
```

## constructor()

```ts
interface EnemyCollection {
    new(floorId: string): EnemyCollection
}
```

## get()

```ts
declare function get(x: number, y: number): DamageEnemy | undefined
```

-   方法说明

    获取指定位置的怪物实例，不存在则返回 `undefined`

## extract()

```ts
declare function extract(): void
```

-   方法说明

    解析当前地图的怪物信息，将每个怪物都生成一个 [`DamageEnemy`](./damage-enemy.md) 实例，并添加到 [`list`](#list) 中

## calRealAttribute()

```ts
declare function calRealAttribute(): void
```

-   方法说明

    计算怪物的真实属性，即经过各种属性光环等加成后的属性

## calMapDamage()

```ts
declare function calMapDamage(): void
```

-   方法说明

    计算当前地图的地图伤害信息

## applyHalo()

```ts
declare function applyHalo(
    type: string,
    data: any,
    enemy: DamageEnemy,
    halo: HaloFn | HaloFn[],
    recursion: boolean = false
): void
```

-   参数说明

    -   `type`: 光环范围类型，例如方形范围等
    -   `data`: 范围参数，例如方形范围就要传入位置即边长
    -   `enemy`: 施加光环的怪物
    -   `halo`: 光环执行函数，用于给怪物增加属性，如果传入数组，那么每个都会执行
    -   `recursion`: 对于一般光环，填 `false` 即可，对于可以加光环或者特殊属性的光环，需要填 `true`

-   方法说明

    给同楼层的怪物施加光环

## preBalanceHalo()

```ts
declare function preBalanceHalo(): void
```

-   方法说明

    预平衡光环，用于处理可以加光环或者特殊属性的光环

## render()

```ts
declare function render(): void
```

-   方法说明

    渲染所有的伤害信息，包括地图伤害与临界
