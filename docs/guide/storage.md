# 存储系统

新样板新增了一种新的存储系统，它允许你在不同的塔之间共用存储，常用于设置系统。但是你依然可以使用旧样板的存储方式，使用 `setLocalStorage` 等函数，这些函数目前还不会被弃用。

## GameStorage 类

新的存储系统依赖于 `GameStorage`，它通过一些简单的 api 来进行存储。在存储之前，我们需要创建一个存储实例：

```ts
interface GameStorage {
    new(key: string): GameStorage
}
```

其中的 `key` 参数表示的是这个存储的名称，我们建议使用 `GameStorage.fromGame` 或 `GameStorage.fromAuthor` 函数生成：

```js
const { GameStorage } = Mota.requireAll('class');

// fromAuthor 函数指明了同一个作者，只要是同一个作者，而且存储名称相同，那么就会在不同塔之间共通
// fromAuthor 第一个参数无用，随便填就行，第二个参数是存储名称
// 作者名称需要在全塔属性中填写
const myStorage1 = new GameStorage(GameStorage.fromAuthor('', 'myStorage'));
// fromGame 函数指明了一个游戏，表明该存储只在当前塔有效，对于其他塔是无效的，参数表示存储名称
// 游戏名称指的是全塔属性中的游戏英文名
const myStorage2 = new GameStorage(GamrStorage.fromGame('myStorage'));
```

## 存入与读取

可以使用 `setValue` 和 `getValue` 存入和读取一个存储：

```ts
function setValue(key: string, value: any): void
function getValue(key: string, defaultValue?: any): any
```

其中 `key` 参数表明的是要设置的存储的名称（注意与 `GameStorage` 的存储名称区分）

```js
myStorage1.setValue('myStore', 1); // 在 myStorage1 这个存储中，将 myStore 存储设置为1
myStorage1.setValue('myStore2', [1, 2, 3]); // 也可以设置为一个数组
const value = myStorage1.getValue('myStore2', []); // 获取存储，第二个参数表示默认值
```

对于每个存储值，必须是[可序列化对象](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#%E6%94%AF%E6%8C%81%E7%9A%84%E7%B1%BB%E5%9E%8B)

## 实际写入与读取

实际上，在执行完 `setValue` 和 `getValue` 时，存入的值并不会立刻存入本地存储，它会在内存中暂时存储。你可以调用 `write` 和 `read` 来写入本地存储或者从本地存储读取

```js
myStorage1.write(); // 实际写入本地存储
myStorage1.read(); // 从本地存储读取，会完全覆盖之前的信息
```

当然，大部分情况下你是不需要执行这些的，样板会在一些时刻自动写入所有本地存储，例如当页面被关闭或者失焦时，会立刻写入本地存储，所以一般情况下是不需要你手动写入的。当一个存储实例被创建后，它会立刻从本地存储中读取信息，因此大部分情况你也不需要手动读取本地存储。

## 遍历存储

可以通过 `keys` `values` `entries` 三个函数遍历这个存储实例的 键、值、键和值：

```js
for (const key of myStorage1.keys()) {
    console.log(key); // 输出每一个存储键
}
for (const value of myStorage1.values()) {
    console.log(value); // 输出每一个值
}
for (const [key, value] of myStorage.entries()) {
    console.log(key, value); // 输出每一个键和值
}
```

## 与设置系统共用

对于直接注册到 `mainSetting` 上的设置，会自动写入本地存储。如果由于一些原因，你不想让它写入本地存储，比如通过 `flags` 存储的设置，或者是全屏这种不能在打开页面时直接呈现的设置，可以通过给 `MotaSetting` 类上的静态变量 `noStorage` 数组添加设置名称即可：

```js
const { MotaSetting } = Mota.requireAll('class');

// 这样这两个设置就不会自动写入本地存储了
MotaSetting.noStorage.push('mySetting1', 'mySetting2.mySetting3');
```

在初始化时，我们可以直接调用存储进行初始化。样板系统设置使用 `settingStorage` 变量进行存储。

```js
const { settingStorage: storage, mainSetting } = Mota.requireAll('var');

mainSetting.reset({
    'mySetting1': !!storage.getValue('mySetting1', false), // 使用 !! 确保值是布尔值
    'mySetting2': storage.getValue('mySetting2', 100), // 存储名称与设置名称一致
    'mySetting3.mySetting4': storage.getValue('mySetting3.mySetting4') // 级联设置中也是如此
})
```
