# 模块 CustomComponents

渲染进程模块，游戏进程不能直接使用。

这个模块包含了一些系统使用的函数式组件。

-   函数
    -   [`createSettingComponents`](#createsettingcomponents)
    -   [`createToolbarComponents`](#createtoolbarcomponents)
    -   [`createToolbarEditorComponents`](#createtoolbareditorcomponents)

## createSettingComponents()

```ts
declare function createSettingComponents(): {
    Default: SettingComponent
    Boolean: SettingComponent
    Number: SettingComponent
    HotkeySetting: SettingComponent
    ToolbarEditor: SettingComponent
    Radio: (items: string[]) => SettingComponent
}
```

-   函数说明

    获取所有的设置的编辑组件，参考 [指南](../../guide/setting.md#注册设置)

## createToolbarComponents()

```ts
declare function createToolbarComponents(): {
    DefaultTool: CustomToolbarComponent;
    KeyTool: CustomToolbarComponent;
    ItemTool: CustomToolbarComponent;
    AssistKeyTool: CustomToolbarComponent;
}
```

-   函数说明

    获取所有的自定义工具项显示组件

## createToolbarEditorComponents()

```ts
declare function createToolbarEditorComponents(): {
    DefaultTool: CustomToolbarComponent;
    KeyTool: CustomToolbarComponent;
    ItemTool: CustomToolbarComponent;
    AssistKeyTool: CustomToolbarComponent;
}
```

-   函数说明

    获取所有自定义工具项的编辑组件，即在系统设置的自定义工具栏项内的编辑组件
