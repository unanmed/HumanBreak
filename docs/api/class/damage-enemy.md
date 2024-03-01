# 类 DamageEnemy

游戏进程类，渲染进程也可以使用

-   实例成员
    -   [`id`](#id)
    -   [`x`](#x)
    -   [`y`](#y)
    -   [`floorId`](#floorid)
    -   [`enemy`](#enemy)
    -   [`col`](#col)
    -   [`info`](#info)
    -   [`providedHalo`](#providedhalo)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`reset`](#reset)
    -   [`calAttribute`](#calattribute)
    -   [`getRealInfo`](#getrealinfo)
    -   [`getHaloSpecials`](#gethalospecials)
    -   [`preProvideHalo`](#preprovidehalo)
    -   [`provideHalo`](#providehalo)
    -   [`injectHalo`](#injecthalo)
    -   [`calDamage`](#caldamage)
    -   [`calMapDamage`](#calmapdamage)
    -   [`setMapDamage`](#setmapdamage)
    -   [`calCritical`](#calcritical)
    -   [`calDefDamage`](#caldefdamage)
    -   [`getSeckillAtk`](#getseckillatk)

## id

```ts
declare var id: string
```

-   成员说明

    怪物的 id

## x

```ts
declare var x: number | undefined
```

## y

```ts
declare var y: number | undefined
```

## floorId

```ts
declare var floorId: string
```

## enemy

```ts
declare var enemy: Enemy
```

-   成员说明

    怪物的原始信息，即在造塔界面中填写的信息，不可修改

## col

```ts
declare var col: EnemyCollection | undefined
```

-   成员说明

    该怪物所属的怪物集合，也可以是 `undefined`，表示不属于任何集合

## info

```ts
declare var info: EnemyInfo
```

-   成员说明

    描述了这个怪物在计算真实属性后的属性，经过光环等加成

## providedHalo

```ts
declare var providedHalo: Set<number>
```

-   成员说明

    存储了这个怪物所有已经施加过的光环

## constructor()

```ts
interface DamageEnemy {
    new(
        enemy: Enemy,
        x?: number,
        y?: number,
        floorId?: string,
        col?: EnemyCollection
    ): DamageEnemy
}
```

## reset()

```ts
declare function reset(): void
```

-   方法说明

    重设怪物信息，恢复至原始信息，计算怪物真实属性第零步

## calAttribute()

```ts
declare function calAttribute(): void
```

-   方法说明

    计算怪物在不计光环下的属性，在 inject 光环之前，预平衡光环之后执行，计算怪物属性第二步

## getRealInfo()

```ts
declare function getRealInfo(): void
```

-   方法说明

    计算怪物的真实属性，在 inject 光环后执行，计算怪物属性的第四步，也是最后一步

## getHaloSpecials()

```ts
declare function getHaloSpecials(): number[]
```

-   方法说明

    获取到所有还未施加过的光环属性

## preProvideHalo()

```ts
declare function preProvideHalo(): void
```

-   方法说明

    光环预提供，用于平衡所有怪的光环属性，避免出现不同情况下光环效果不一致的现象，计算怪物属性的第一步

## provideHalo()

```ts
declare function provideHalo(): void
```

-   方法说明

    向其他怪物提供光环，计算怪物属性的第三步

## injectHalo()

```ts
declare function injectHalo(halo: HaloFn, enemy: EnemyInfo): void
```

-   方法说明

    接受来自其他怪物的光环，参考[光环处理](../../guide/battle.md#光环处理)

## calDamage()

```ts
declare function calDamage(hero: Partial<HeroStatus> = core.status.hero): { damage: number }
```

-   参数说明

    -   `hero`: 允许部分指定勇士信息，从而达到不修改勇士属性的情况下传入不同勇士信息的效果

-   方法说明

    计算怪物伤害

## calMapDamage()

```ts
declare function calMapDamage(
    damage: Record<string, MapDamage> = {},
    hero: Partial<HeroStatus> = getHeroStatusOn(Damage.realStatus)
): Record<string, MapDamage>
```

-   参数说明

    -   `damage`: 地图伤害存入的对象
    -   `hero`: 部分指定勇士的真实属性，即经过 buff 等加成的属性

-   方法说明

    计算地图伤害

## setMapDamage()

```ts
declare function setMapDamage(
    damage: Record<string, MapDamage>,
    loc: string,
    dam: number,
    type?: string
): void
```

## calCritical()

```ts
declare function calCritical(
    num: number = 1,
    hero: Partial<HeroStatus> = core.status.hero
): CriticalDamageDelta[]
```

-   参数说明

    -   `num`: 计算前多少个临界

-   方法说明

    计算怪物的临界，使用二分法

-   接口 `CriticalDamageDelta`

    ```ts
    interface CriticalDamageDelta {
        /** 跟最小伤害值的减伤 */
        delta: number;
        damage: number;
        info: { damage: number };
        /** 勇士的攻击增量 */
        atkDelta: number;
    }
    ```

    -   `damage`: 伤害大小

## calDefDamage()

```ts
declare function calDefDamage(
    num: number = 1,
    hero: Partial<HeroStatus> = core.status.hero
): DamageDelta
```

-   参数说明

    -   `num`: 要加多少防御

-   方法说明

    计算 n 防减伤

-   接口 `DamageDelta`

    为接口 [`CriticalDamageDelta`](#calcritical) 去掉 `atkDelta` 属性

## getSeckillAtk()

```ts
declare function getSeckillAtk(): number
```

-   方法说明

    计算在一回合内击杀怪物所需要的攻击力，用于临界计算
