# 类 GameStroage

该类是渲染进程类，游戏进程不能直接使用

-   实例成员
    -   [`key`](#key)
    -   [`data`](#data)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`read`](#read)
    -   [`write`](#write)
    -   [`setValue`](#setvalue)
    -   [`getValue`](#getvalue)
    -   [`toJSON`](#tojson)
    -   [`clear`](#clear)
    -   [`keys`](#keys)
    -   [`values`](#values)
    -   [`entries`](#entries)
-   静态成员
    -   [`list`](#list)
-   静态方法
    -   [`fromGame`](#fromgame)
    -   [`fromAuthor`](#fromauthor)
    -   [`get`](#get)

## key

```ts
declare var key: string
```

-   成员说明

    该成员表示了这个存储实例的名称

## data

```ts
declare var data: Record<string, any>
```

-   成员说明

    该成员存储了这个存储实例的所有内容，在写入时会将这个成员写入，读取时会覆盖这个成员

## constructor()

```ts
interface GameStorage {
    new(key: string): GameStorage
}
```

-   构造器说明

    传入存储名称，构造一个存储实例。存储名称不建议直接填入，建议使用 [`fromGame`](#fromgame) 或者 [`fromAuthor`](#fromauthor) 方法生成

## read()

```ts
declare function read(): void
```

-   方法说明

    从本地存储读取，并写入到 `data` 成员中

## write()

```ts
declare function write(): void
```

-   方法说明

    将 `data` 成员中的数据写入到本地存储中

## setValue()

```ts
declare function setValue(key: string, value: any): void
```

-   方法说明

    该方法用于更改一个该存储实例上的存储的值

-   示例

    ```js
    myStorage.setValue('key', 123); // 将存储 'key' 设为 123
    ```

## getValue()

```ts
declare function getValue(key: string, defaultValue?: any): any
```

-   参数说明

    -   `key`: 存储键名
    -   `defaultValue`: 当存储不存在时，获取的默认值

-   方法说明

    获取一个存储的值，当值不存在时返回默认值

## toJSON()

```ts
declare function toJSON(): string
```

-   方法说明

    将这个存储实例转化为序列化的 `JSON` 字符串

## clear()

```ts
declare function clear(): void
```

-   方法说明

    将这个存储的所有内容清空

## keys()

```ts
declare function keys(): string[]
```

-   方法说明

    获取到这个存储的所有键，组成一个字符串数组返回

## values()

```ts
declare function values(): any[]
```

-   方法说明

    获取这个存储的所有值，组成一个数组返回

## entries()

```ts
declare function entries(): [string, any][]
```

-   方法说明

    获取这个存储的所有键和值，组成以数组 `[键, 值]` 构成的数组返回

## list

```ts
declare var list: GameStorage[]
```

-   静态成员说明

    该静态成员描述了所有构造的存储实例

-   示例

    ```js
    GameStroage.list.forEach(v => v.clear()); // 清空所有存储实例的存储
    ```

## fromGame()

```ts
declare function fromGame(key: string): string
```

-   静态方法说明

    该静态方法用于生成一个与游戏关联的键，用于生成存储实例，由此生成的存储实例只在本游戏内有效，与其他游戏没有关联。

-   示例

    ```js
    const myStorage = new GameStorage(GameStorage.fromGame('key'));
    ```

## fromAuthor()

```ts
declare function fromAuthor(_: any, key: string): string
```

-   静态方法说明

    该静态方法用于生成一个与作者关联的键，同作者的塔中该存储会共通。第一个参数无用，随便填即可，第二个参数说明的是存储的名称。

-   示例

    ```js
    const myStorage = new GameStorage(GameStorage.fromAuthor(void 0, 'key'));
    const value = myStorage.getValue('key'); // 共通存储，可以从其他塔获取
    ```

## get()

```ts
declare function get(key: string): GameStorage
```

-   静态方法说明

    该静态方法用于获取对应名称的存储实例，等价于 `GameStorage.list.find(v => v.key === key)`
