# 类 CustomToolbar

渲染进程类，游戏进程不可直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例成员
    -   [`items`](#items)
    -   [`num`](#num)
    -   [`id`](#id)
    -   [`x`](#x)
    -   [`y`](#y)
    -   [`width`](#width)
    -   [`height`](#height)
    -   [`assistKey`](#assistkey)
    -   [`showIds`](#showids)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`add`](#add)
    -   [`delete`](#delete)
    -   [`set`](#set)
    -   [`emitTool`](#emittool)
    -   [`refresh`](#refresh)
    -   [`setPos`](#setpos)
    -   [`setSize`](#setsize)
    -   [`show`](#show)
    -   [`close`](#close)
    -   [`closeAll`](#closeall)
-   静态成员
    -   [`num`](#static-num)
    -   [`list`](#list)
    -   [`info`](#info)
-   静态方法
    -   [`get`](#get)
    -   [`register`](#register)
    -   [`save`](#save)
    -   [`load`](#load)
    -   [`refreshAll`](#refreshall)
    -   [`showAll`](#showall)
    -   [`closeAll`](#static-closeall)
-   实例事件
    -   [`add`](#add-事件)
    -   [`delete`](#delete-事件)
    -   [`set`](#set-事件)
    -   [`emit`](#emit-事件)
    -   [`posChange`](#poschange-事件)

## 使用案例

-   新增一个默认的自定义工具栏

    ```ts
    const { CustomToolbar } = Mota.requireAll('class');
    const { KeyCode } = Mota.requireAll('var');

    const myBar = new CustomToolbar('myBar');
    mybar.x = 100;
    mybar.y = 100;
    mybar.width = 300;
    mybar.height = 70; // 高度，对于默认设置，自定义工具栏一行的高度为60，行高为10，因此设为70正好为一行
    // 添加你自己的自定义工具项，这里添加了一个M的快捷键
    mybar.add({ id: 'myTool', type: 'hotkey', key: KeyCode.KeyM, assist: 0 })
    ```

## 部分接口与类型说明

```ts
interface ToolbarItemBase {
    type: string
    id: string
}
```

自定义工具项的基础信息，每个自定义工具项必定包含，在此之外还可以自定义其他属性

-   `type`: 自定义工具的类型
-   `id`: 自定义工具的 id

```ts
interface CustomToolbarProps {
    item: ToolbarItemBase
    toolbar: CustomToolbar
}
```

自定义工具项的组件参数（props），对于编辑组件也是如此

-   `item`: 当前的自定义工具项
-   `toolbar`: 自定义工具项所处的自定义工具栏实例

:::info 消歧义
一般情况下，自定义工具栏指的是一整个自定义工具栏界面，自定义工具或者自定义工具项表示单个的自定义工具，例如是一个按键工具等，自定义工具栏里面包含若干个自定义工具项
:::

```ts
type ToolItemEmitFn = (
    this: CustomToolbar,
    id: string,
    item: ToolbarItemBase
) => boolean;
```

工具被触发时执行的触发函数

-   `id`: 触发的工具的 id
-   `item`: 触发的自定义工具信息

## items

```ts
declare var items: ToolbarItemBase[]
```

-   成员说明

    保存了这个自定义工具栏的所有自定义工具项

## num

```ts
declare var num: number
```

-   成员说明

    这个自定义工具栏的唯一标识符

## id

```ts
declare var id: string
```

-   成员说明

    表示这个自定义工具栏的 id

## x

```ts
declare var x: number
```

## y

```ts
declare var y: number
```

## width

```ts
declare var width: number
```

## height

```ts
declare var height: number
```

-   成员说明

    以上四个成员描述了这个自定义工具栏所处的位置（相对页面左上角），以及长和宽

## assistKey

```ts
declare var assistKey: number
```

-   成员说明

    表示了当前自定义工具栏的辅助按键信息

## showIds

```ts
declare var showIds: number[]
```

-   成员说明

    描述了所有打开的基于本自定义工具栏的界面。由于一个自定义工具栏可以打开多个界面，因此使用一个数组进行存储所有打开的界面

## constructor()

```ts
interface CustomToolbar {
    new(id: string): CustomToolbar
}
```

## add()

```ts
declare function add(item: ToolbarItemBase): this
```

-   方法说明

    添加一个自定义工具项

## delete()

```ts
declare function delete(id: string): this
```

-   方法说明

    删除一个自定义工具项

## set()

```ts
declare function set(id: string, item: Partial<SettableItemData>): this
```

-   参数说明

    -   `id`: 要设置的自定义工具项的 id
    -   `item`: 设置信息，除了 `type` 和 `id` 设置不了外，其余均可设置

-   方法说明

    设置一个自定义工具项的信息

## emitTool()

```ts
declare function emitTool(id: string): this
```

-   方法说明

    触发一个自定义工具项

## refresh()

```ts
declare function refresh(): this
```

-   方法说明

    强制刷新所有的自定义工具项的显示

## setPos()

```ts
declare function setPos(x?: number, y?: number): void
```

## setSize()

```ts
declare function setSize(width?: number, height?: number): void
```

-   方法说明

    这两个方法用于设置这个自定义工具栏的位置和长宽

## show()

```ts
declare function show(): number
```

-   方法说明

    基于这个自定义工具栏，显示出来其对应的界面，可以显示多个，内容互通

-   返回值

    显示的界面的唯一标识符

## close()

```ts
declare function close(id: number): void
```

-   参数说明

    -   `id`: 要关闭的自定义工具栏界面的标识符

-   方法说明

    关闭一个自定义工具栏界面

## closeAll()

```ts
declare function closeAll(): void
```

-   方法说明

    关闭这个自定义工具栏的所有显示

## static num

```ts
declare var num: number
```

-   静态成员说明

    当前唯一标识符增长到了多少

## list

```ts
declare var list: CustomToolbar[]
```

-   静态成员说明

    存储了当前所有的自定义工具栏实例

## info

```ts
declare var info: Record<string, RegisteredCustomToolInfo>
```

-   静态成员说明

    存储了所有类型的自定义工具类型

-   接口 `RegisteredCustomToolInfo`

    ```ts
    interface RegisteredCustomToolInfo {
        name: string;
        onEmit: ToolItemEmitFn;
        show: CustomToolbarComponent;
        editor: CustomToolbarComponent;
        onCreate: (item: any) => ToolbarItemBase;
    }
    ```

    -   `name`: 这个自定义工具类型的名称，例如快捷键、使用道具等
    -   `onEmit`: 当这个自定义工具类型被触发时，执行的函数
    -   `show`: 这个自定义工具类型显示在界面上的时候的显示组件
    -   `editor`: 这个自定义工具类型在玩家编辑时，显示的组件，例如使用道具类型就是选择要使用的道具，也就是在系统设置里面的自定义工具栏中显示的编辑界面
    -   `onCreate`: 当添加一个新的这个类型的自定义工具项时，执行的初始化函数，一般是把一些变量设为默认值，例如使用道具就是设置为使用怪物手册

-   系统自带自定义工具类型

    -   `hotkey`: 快捷键工具，默认按键为 `Unknown`，无辅助按键
    -   `item`: 使用道具，默认使用的道具为怪物手册
    -   `assistKey`: 开关辅助按键，可以开关 Ctrl 等辅助按键，然后触发快捷键工具时会附带辅助按键触发

## get()

```ts
declare function get(id: string): CustomToolbar
```

-   静态方法说明

    根据自定义工具栏的 id 获取自定义工具栏实例

## register()

```ts
declare function register(
    type: string,
    name: string,
    onEmit: ToolItemEmitFn,
    show: CustomToolbarComponent,
    editor: CustomToolbarComponent,
    onCreate: (item: any) => ToolbarItemBase
)
```

-   参数说明（参考[`info`](#info)）

    -   `type`: 要注册的自定义工具类型
    -   `name`: 该类型的中文名
    -   `onEmit`: 当触发这个自定义工具的时候执行的函数
    -   `show`: 这个自定义工具在自定义工具栏的显示组件
    -   `editor`: 这个自定义工具在编辑时编辑组件
    -   `onCreate`: 当这个自定义工具在编辑器中被添加时，执行的初始化脚本

-   静态方法说明

    注册一个自定义工具类型

-   示例

    以下是样板中注册使用道具的工具类型的代码

    ```ts
    CustomToolbar.register(
        'item',
        '使用道具',
        function (id, item) {
            // 道具
            core.tryUseItem(item.item);
            return true;
        },
        COM.ItemTool,
        EDITOR.ItemTool,
        item => {
            return {
                item: 'book',
                ...item
            };
        }
    );
    ```

## save()

```ts
declare function save(): void
```

-   静态方法说明

    将目前的自定义工具栏状态存入本地存储

## load()

```ts
declare function load(): void
```

-   静态方法说明

    从本地存储读取自定义工具栏状态

## refreshAll()

```ts
declare function refreshAll(): void
```

-   静态方法说明

    更新所有自定义工具栏

## showAll()

```ts
declare function showAll(): void
```

-   静态方法说明

    把所有自定义工具栏都打开一个新的界面（如果是一打开的，会再打开一个）

## static closeAll()

```ts
declare function closeAll(): void
```

-   静态方法说明

    关闭所有自定义工具栏的所有显示

## add 事件

```ts
interface CustomToolbarEvent {
    add: (item: ToolbarItemBase) => void
}
```

## delete 事件

```ts
interface CustomToolbarEvent {
    delete: (item: ToolbarItemBase) => void
}
```

## set 事件

```ts
interface CustomToolbarEvent {
    set: (id: string, data: Partial<SettableItemData>) => void
}
```

## emit 事件

```ts
interface CustomToolbarEvent {
    emit: (id: string, item: ValueOf<ToolbarItemMap>) => void
}
```

## posChange 事件

```ts
interface CustomToolbarEvent {
    posChange: (bar: CustomToolbar) => void
}
```
