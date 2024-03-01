# 类 MotaSetting

渲染进程类，在游戏进程不可直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例成员
    -   [`readonly list`](#readonly-list)
-   实例方法
    -   [`reset`](#reset)
    -   [`register`](#register)
    -   [`getSetting`](#getsetting)
    -   [`setValue`](#setvalue)
    -   [`addValue`](#addvalue)
    -   [`getValue`](#getvalue)
    -   [`setDisplayFunc`](#setdisplayfunc)
    -   [`setValueController`](#setvaluecontroller)
    -   [`setDescription`](#setdescription)
-   静态成员
    -   [`noStorage`](#nostorage)
-   实例事件
    -   [`valueChange`](#valuechange-事件)

## readonly list

```ts
declare const list: Record<string, MotaSettingItem>
```

-   成员说明

    该成员描述了这个设置实例在这一级设置中的所有设置。理论上其所有成员都是只读的。

-   接口 `MotaSettingItem`

    ```ts
    interface MotaSettingItem<T extends MotaSettingType = MotaSettingType> {
        name: string;                       // 设置的显示名称
        key: string;                        // 设置的名称(id)
        value: T;                           // 设置当前的值
        controller: SettingComponent;       // 设置的编辑组件
        description?: string;               // 设置的说明文字
        defaults?: boolean | number;        // 设置的默认值
        step?: [number, number, number];    // 数字型设置的步长信息
        display?: (value: T) => string;     // 设置显示函数
    }
    ```

    -   详细说明

        -   `name`: 设置的显示名称，例如 `宝石血瓶显伤`
        -   `key`: 设置的名称，也就是设置的 id，不能包含 `.`
        -   `value`: 设置当前的值，可以是数字、布尔值和设置实例，该项是设置实例时表示级联设置。通过方法 [`setValue`](#setvalue) 设置，在设置时**不可**更改数据类型
        -   `controller`: 设置的编辑组件，可以通过 [`setValueController`](#setvaluecontroller) 方法设置，一般在注册设置的时候指定
        -   `description`: 设置的说明文字，如果使用默认的设置 UI 的话，会显示在右方
        -   `defaults`: 设置的默认值，在注册后，如果没有设置，那么设置就会是这个值。当设置是一个级联设置的时候，该项为 `undefined`
        -   `step`: 当此项设置为数字型设置时，该成员表示步长信息，第一项表示最小值，第二项表示最大值，第三项表示单步步长
        -   `display`: 设置的显示函数，如果设置了，那么显示的值会是它的返回值，参考[指南](../../guide/setting.md#设置显示函数)

## reset()

```ts
declare function reset(setting: Record<string, number | boolean>): void
```

-   参数说明

    -   `setting`: 重设的设置信息，是一系列键值对，键表示设置的 id，值表示设置的值，例如`{ 'mySetting1.mySetting2': 123 }`

-   方法说明

    该方法用于重设设置，一般用于初始化设置信息

## register()

```ts
// overload 1
declare function register(
    key: string,
    name: string,
    value: number,
    com?: SettingComponent,
    step?: [number, number, number]
): this
// overload 2
declare function register(
    key: string,
    name: string,
    value: boolean | MotaSetting,
    com?: SettingComponent
): this
```

-   用法一

    -   参数说明

        -   `key`: 要注册的设置名称，也就是 id，不能包含 `.`
        -   `name`: 设置的显示名称
        -   `value`: 设置的初始值（默认值）
        -   `com`: 设置的编辑组件，也就是右侧设置说明下方的内容
        -   `step`: 步长信息，是一个数组，第一项表示最小值，第二项表示最大值，第三项表示单步步长

    -   方法说明

        该用法用于注册一个数字型设置

-   用法二

    -   参数说明

        -   `key`: 要注册的设置名称，也就是 id，不能包含 `.`
        -   `name`: 设置的显示名称
        -   `value`: 设置的初始值（默认值），或者是级联设置
        -   `com`: 设置的编辑组件，也就是右侧设置说明下方的内容

    -   方法说明

        该用法用于注册一个布尔型变量，或者是级联设置。当 `value` 传递一个设置实例的时候，会认为是级联设置

## getSetting()

```ts
declare function getSetting(key: string): Readonly<MotaSettingItem | null>
```

-   参数说明

    -   `key`: 设置的键名，对于级联设置，使用 `.` 进行连接，例如 `mySetting1.mySetting2`

-   返回值

    该函数返回获取到的设置，如果没有获取到设置，会抛出错误。获取的返回值理论上（在 ts 下）是只读的，不允许修改。

-   方法说明

    该方法用于获取到一个设置

## setValue()

```ts
declare function setValue(key: string, value: boolean | number): void
```

-   方法说明

    该方法用于设置一个设置的值，接受设置键名，以及要设置为的值为参数。

-   示例

    ```js
    mySetting.setValue('mySetting1.mySetting2', 200);
    ```

## addValue()

```ts
declare function addValue(key: string, value: number): void
```

-   方法说明

    该方法用于增减一个数字型设置的值，其中 `value` 表示增减的多少

-   示例

    ```js
    mySetting.addValue('mySetting1.mySetting2', 100); // 增加100，减少100可以填-100
    ```

## getValue()

```ts
declare function getValue(
    key: string,
    defaultValue?: boolean | number
): boolean | number
```

-   参数说明

    -   `key`: 设置的键名
    -   `defaultValue`: 当设置或设置的值不存在，或者设置是一个级联设置时，返回的默认值

-   方法说明

    用于获取一个设置的值，当设置或设置的值不存在，或者设置是一个级联设置时，会返回默认值

## setDisplayFunc()

```ts
declare function setDisplayFunc(
    key: string,
    func: (value: boolean | number) => string
): this
```

-   参数说明

    -   `key`: 设置的键名
    -   `func`: 显示函数，接受当前设置的值作为参数，返回一个字符串作为显示值

-   示例

    ```js
    mySetting.setDisplayFunc('mySetting1.mySetting2', value => value ? '宝石' : '血瓶');
    ```

## setValueController()

```ts
declare function setValueController(key: string, com: SettingComponent): this
```

-   参数说明

    -   `key`: 设置的键名
    -   `com`: 要设置成的编辑组件，以函数式组件为宜

## setDescription()

```ts
declare function setDescription(key: string, desc: string): this
```

-   参数说明

    -   `key`: 设置的键名
    -   `desc`: 要设置成的描述信息，允许 html 元素的出现

## noStorage

```ts
declare var noStorage: string[]
```

-   静态成员说明

    该成员描述了所有不计入本地存储的样板自带设置的键名

-   示例

    ```js
    MotaSetting.noStorage.push('mySetting');
    ```

## valueChange 事件

```ts
interface MotaSettingEvent {
    valueChange: <T extends boolean | number>(
        key: string,
        newValue: T,
        oldValue: T
    ) => void
}
```

-   事件说明

    当设置的值被设置时触发该事件，传入设置的键名、新值、旧值作为参数
