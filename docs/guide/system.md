---
lang: zh-CN
---

# 系统说明

相比于旧样板中`core`包揽一切，新样板使用了`Mota`作为系统主接口，通过模块化管理，让 API 结构更加清晰。

## Mota

`Mota`作为新样板的主接口，一共包含三个功能函数，三个接口函数，以及两个接口对象。对于`Mota`对象的具体内容，请参考 [API 列表](../api/index.md)。

## 获取样板接口

你可以通过以下两个函数获取样板的接口。

```ts
function require(type: 'var' | 'fn' | 'class' | 'module', key: string): any;
function requireAll(type: 'var' | 'fn' | 'class' | 'module'): any;
```

在这里，`type`描述的是要获取的接口类型，可以填写下面这四个内容：

-   `var`: 获取变量
-   `fn`: 获取函数
-   `class`: 获取类
-   `module`: 获取模块

对于`Mota.require`函数，还需要接受第二个参数，表示的是要获取的接口名称。

::: warning
对于不存在的接口，获取之后会直接报错！
:::

示例

```js
// ----- Mota.require
const getHeroStatusOn = Mota.require('fn', 'getHeroStatusOn'); // 获取勇士真实属性的接口
const KeyCode = Mota.require('var', 'KeyCode'); // 获取KeyCode接口
const DamageEnemy = Mota.require('class', 'DamageEnemy'); // 获取怪物接口
const Damage = Mota.require('module', 'Damage');
// 对于模块，每个模块都是对象，因此还可以使用对象解构语法
const { calDamageWith, getSingleEnemy } = Mota.require('module', 'Damage');

// ----- Mota.requireAll
// 它会获取到一种类型的所有接口，因此搭配对象解构语法最为合适
const { hook, KeyCode, loading, mainSetting } = Mota.requireAll('var');
// 它等价于
const hook = Mota.require('var', 'hook');
const KeyCode = Mota.require('var', 'KeyCode');
const loading = Mota.require('var', 'loading');
const mainSetting = Mota.require('vaar', 'mainSetting');
```

## 插件接口与第三方库接口

与获取样板接口类似，插件和第三方库也有对应的接口，它们分别是`Mota.Plugin`和`Mota.Package`。

### Mota.Plugin

它用于获取与注册插件。对于获取，依然是`require`与`requireAll`两个函数：

```ts
function require(plugin: string): any;
function requireAll(): any;
```

与系统接口不同的是，插件不再拥有`type`参数，直接填入插件名称或者获取全部即可。

示例

```js
// 注意，这里的 _r 后缀表示该插件定义于渲染进程，_g 后缀表示定义于游戏进程
// 对于渲染进程与游戏进程的信息请查看本页的`进程分离`栏
const shadow = Mota.Plugin.require('shadow_r'); // 获取点光源插件
const remainEnemy = Mota.Plugin.require('remainEnemy_g'); // 获取漏怪检测插件

// 同样，你也可以使用requireAll
const { shadow_r: shadow, remainEnemy_g: remainEnemy } = Mota.Plugin.requireAll();
```

::: warning
与系统接口同样，获取不存在的插件时会报错
:::

### Mota.Package

它与插件接口的用法完全相同，这里不再赘述。

## 注册插件

你可以使用`register`函数来注册一个插件

```ts
function register<K extends string, D>(plugin: K, data: D, init?: (plugin: K, data: D) => void): void
function register<K extends string>(plugin: K, init: (plugin: K) => any): void
```

这个函数共有上述两种用法，对于第一种用法，第一个参数传入插件名称，第二个参数传入插件暴露出的内容，例如可以是一系列函数、类、变量等。第三参数可选，是插件的初始化函数，初始化函数会在游戏加载中初始化完毕。初始化函数共有两个参数，接受`plugin`插件名，和`data`插件内容。

对于第二种用法，第一个参数传入插件名称，第二个参数传入插件的初始化函数，同时要求必须有返回值，返回值作为插件的内容。初始化函数接受`plugin`插件名作为参数。

如果你使用了第二种用法，同时没有返回值，那么如果通过`require`获取插件，会获取到`undefined`。

插件加载流程见[游戏加载流程](./system.md#游戏加载流程)

示例

::: code-group

```js [第一种用法]
let cnt = 0;
function init() {
    core.registerAnimationFrame('example', true, () => {
        cnt++;
    })
}

function getCnt() {
    return cnt;
}

// 注册插件，内容使用对象内容简写语法，将 init 和 getCnt 函数作为插件内容，
// init 作为初始化函数
Mota.Plugin.register('example', { init, getCnt }, init);
```

```js [第二种用法]
function init() {
    let cnt = 0;
    // 直接在这里初始化即可
    core.registerAnimationFrame('example', true, () => {
        cnt++;
    })

    function getCnt() {
        return cnt;
    }

    return { getCnt };
}

// 注册插件
Mota.Plugin.register('example', init);
```

:::

## 函数复写

新样板还提供了函数复写的接口，它是`Mota.rewrite`：

```ts
// 类型已经经过了大幅简化
function rewrite(
    base: any,
    key: string,
    type: 'full' | 'add' | 'front',
    re: Function,
    bind?: any,
    rebind?: any
): Function
```

这个函数共有六个参数，后两个参数可选。

-   `base`: 函数所在对象
-   `key`: 函数在对象中的名称
-   `type`: 复写类型，`full`表示全量复写，`add`表示在原函数之后新增内容，`front`表示在原函数之前新增内容
-   `re`: 复写函数，在`add`模式下，第一个参数会变成原函数的返回值，同时原参数会向后平移一位
-   `bind`: 原函数调用对象，即原函数的`this`指向，默认是 `base`
-   `rebind`: 复写函数的调用对象，即复写函数中的`this`指向，默认是`base`

::: warning
全量复写会覆盖之前的`add`与`front`模式复写！！！
:::

样板插件中已经自带了很多复写案例，可以查看插件来获取具体用法。

## 进程分离

新样板中对进程进行了分离，分为了渲染进程与游戏进程。

对于渲染进程，任何不会直接或间接影响到录像验证的内容都会放在渲染进程。在录像验证与编辑器中，渲染进程都不会执行，因此也无法获取渲染进程的任何插件与系统接口，同样所有的第三方库也无法获取。

对于游戏进程，不论在什么情况下都会执行，因此任何会影响录像的内容都应该放在游戏进程。对于构建版样板（即群文件版），你所编写的代码一般都是直接在游戏进程下执行的。因此，为了能够在游戏进程下能够执行渲染进程的内容，新样板提供了下面两个接口：

```ts
function r(fn: Function): void
function rf(fn: Function): Function
```

对于`r`函数，它是将传入的函数在渲染进程下执行，对于`rf`函数，它是将传入的函数包裹为渲染进程函数并输出，之后直接调用即可。

示例

```js
Mota.r(() => {
    const mainSetting = Mota.require('var', 'mainSetting');
    mainSetting.setValue('screen.fontSize', 20);
});

// 它等价于
const f = Mota.rf(() => {
    const mainSetting = Mota.require('var', 'mainSetting');
    mainSetting.setValue('screen.fontSize', 20);
});
f();
```

## 游戏加载流程

新样板对游戏加载流程进行了部分改动，现在它的加载流程如下：

1. 加载`project/data.js`
2. 加载游戏进程，同时注册游戏进程插件
3. 加载渲染进程，同时注册渲染进程插件与第三方库
4. 加载`plugins.js`，执行其包含的每一个函数
5. 初始化`core`，开始加载游戏资源
6. 初始化插件
7. 等待游戏资源加载完毕

因此，如果直接在`plugins.js`的函数中直接调用`core`会报错。同时插件在初始化之前获取也会报错，即使没有初始化函数，因此`plugins.js`顶层函数中只能获取系统接口与第三方库，不能获取插件。
