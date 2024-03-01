# 模块 Damage

游戏进程类，渲染进程也可以使用

包含了部分伤害计算相关的函数与变量

-   变量
    -   [`haloSpecials`](#halospecials)
    -   [`changeableHaloValue`](#changeablehalovalue)
    -   [`realStatus`](#realstatus)
-   函数
    -   [`calDamageWith`](#caldamagewith)
    -   [`ensureFloorDamage`](#ensurefloordamage)
    -   [`getSingleEnemy`](#getsingleenemy)

## haloSpecials

```ts
declare var haloSpecials: Set<number>
```

-   变量说明

    保存了所有的光环类属性

## changeableHaloValue

```ts
declare var changeableHaloValue: Map<number, string[]>
```

-   变量说明

    包含了所有会被第一类光环影响的特殊属性数值

## realStatus

```ts
declare var realStatus: string[]
```

-   变量说明

    计算伤害时会用到的勇士属性，攻击防御，其余的不会有 buff 加成，直接从 core.status.hero 取

## calDamageWith()

```ts
declare function calDamageWith(info: EnemyInfo, hero: Partial<HeroStatus>): number | null
```

-   函数说明

    计算怪物伤害的函数，示例参考插件

## ensureFloorDamage()

```ts
declare function ensureFloorDamage(floor: string): void
```

## getSingleEnemy()

```ts
declare function getSingleEnemy(id: string): DamageEnemy
```

-   函数说明

    用于获取一个不在地图上的单个怪物，不会受到任何光环的影响
