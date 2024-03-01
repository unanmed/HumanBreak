# 模块 Mark

渲染进程模块，游戏进程不能直接使用

该模块包含了标记怪物相关的功能

-   函数
    -   [`markEnemy`](#markenemy)
    -   [`unmarkEnemy`](#unmarkenemy)
    -   [`checkMarkedEnemy`](#checkmarkedenemy)
    -   [`hasMarkedEnemy`](#hasmarkedenemy)

## markEnemy()

```ts
declare function markEnemy(id: string): void
```

-   函数说明

    标记一个指定 id 的怪物

## unmarkEnemy()

```ts
declare function unmarkEnemy(id: string): void
```

-   函数说明

    取消标记指定 id 的怪物

## checkMarkedEnemy()

```ts
declare function checkMarkedEnemy(): void
```

-   函数说明

    检查所有标记的怪物状态

## hasMarkedEnemy()

```ts
declare function hasMarkedEnemy(id: string): boolean
```

-   函数说明

    判断一个怪物是否被标记
