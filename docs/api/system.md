# 系统 API

系统 API 处于对象 `Mota` 上，是使用新样板 API 的根对象

## require()

```ts
declare function require(type: InterfaceType, key: string): any
```

-   参数说明

    -   `type`: 要获取的 API 类型，目前包含 `class` `fn` `var` `module` 四种类型，分别表示类、函数、变量、模块
    -   `key`: 要获取的 API 的名称

-   方法说明

    获取一个样板接口

## requireAll()

```ts
declare function requireAll(type: InterfaceType): any
```

-   方法说明

    获取一种 API 类型的所有接口，并以对象的形式返回

## rewrite()

```ts
declare function rewrite(
    base: any,
    key: string,
    type: 'full' | 'add' | 'front',
    re: Function,
    bind?: any,
    rebind?: any
): Function
```

-   方法说明

    复写函数，参考[函数复写](../guide/system.md#函数复写)

## r()

```ts
declare function r(fn: (packages: PackageInterface) => void, thisArg?: any): void
```

-   参数说明

    -   `fn`: 要执行的函数，包含一个参数，表示系统使用的第三方库
    -   `thisArg`: 函数执行时绑定的上下文（this 指向）

-   方法说明

    在渲染进程包裹下执行一个函数

## rf()

```ts
declare function rf(fn: Function, thisArg: any): Function
```

-   参数说明

    -   `fn`: 要绑定的函数
    -   `thisArg`: 函数调用时传入的上下文（this 指向）

-   方法说明

    将一个函数包裹为渲染进程函数

## Plugin

```ts
interface Plugin {
    require(key: string): any
    requireAll(): any
    register(key: string, data: any, init?: any): void
}
```

参考[指南](../guide/system.md#motaplugin)

系统自带插件包括

-   渲染进程插件
    -   `shadow_r`
    -   `gameShadow_r`
    -   `fly_r`
    -   `pop_r`
    -   `frag_r`
    -   `use_r`
    -   `gameCanvas_r`
    -   `smooth_r`
    -   `shader_r`
-   游戏进程插件
    -   `utils_g`
    -   `shop_g`
    -   `replay_g`
    -   `removeMap_g`
    -   `heroFourFrames_g`
    -   `rewrite_g`
    -   `itemDetail_g`
    -   `remainEnemy_g`

## Package

```ts
interface Package {
    require(key: string): any
    requireAll(): any
}
```

参考[指南](../guide/system.md#motapackage)

系统暴露出的第三方库：

-   `axios`
-   `chart.js`
-   `jszip`
-   `lodash`
-   `lz-string`
-   `mutate-animate`
-   `vue`
