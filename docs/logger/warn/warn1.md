# 警告代码一览及其解决方案 1-50

## WARN CODE 1

```txt
Resource with type of 'none' is loaded.
```

- 警告原因：不能加载 `none` 类型的资源。
- 解决方案：加载资源时填写资源类型。

## WARN CODE 2

```txt
Repeat load of resource '$1/$2'.
```

- 警告原因：同一个资源被加载了两次。
- 解决方案：避免对同一个资源调用两次加载。

## WARN CODE 3

```txt
Unknown danmaku tag: $1
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 警告原因：出现了未知的弹幕标签（指 `[xxx:xxx]`）
- 解决方案：目前仅支持 `[i:xxx]` 标签，如果需要显示方括号，请使用 `\[\]`。

## WARN CODE 4

```txt
Ignored a mismatched ']' in danmaku.
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 警告原因：出现了不能匹配的右方括号。
- 解决方案：如果需要显示方括号，请使用 `\[\]`。

## WARN CODE 5

```txt
Repeat post danmaku.
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 警告原因：同一个弹幕被发送了两次。
- 解决方案：确保一个弹幕实例只调用了一次 `post` 方法。

## WARN CODE 6

```txt
Registered special danmaku element: $1.
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 警告原因：要注册的弹幕标签已经存在。
- 解决方案：避免使用同一个标签名，如果内容不一样请换一个标签名。

## WARN CODE 7

参考 [CODE 3](#warn-code-3)

## WARN CODE 8

```txt
Incomplete render data is put. None will be filled to the lacked data.
```

- 警告原因：使用 `<layer>` 标签时，向地图渲染传入了不完整的地图信息（数据长度不是指定宽度的倍数），不完整的部分将会补零。
- 解决方案：确保传入的地图信息长度是 `width` 参数的倍数。

## WARN CODE 9

```txt
Data transfered is partially (or totally) out of range. Overflowed data will be ignored.
```

- 警告原因：使用 `<layer>` 标签时，传入地图的渲染数据有一部分（或全部都）在地图之外，在地图之外的部分将会被忽略。
- 解决方案：确保传入的地图信息没有在地图之外的部分。

## WARN CODE 10

```txt
Cannot resolve big image of enemy '$1'.
```

- 警告原因：无法解析怪物 $1 的大怪物贴图（绑定贴图），可能是因为图片不存在。
- 解决方案：确保此怪物绑定的贴图已经在全塔属性注册。

## WARN CODE 11

```txt
Cannot resolve material $1. Material not exists.
```

- 警告原因：不能解析指定类型 $1 的素材，因为对应的素材文件不存在。
- 解决方案：检查 `enemys.png` `npcs.png` 等素材文件是否存在。

## WARN CODE 12

```txt
Cannot mark buffable with a non-number status. Key: '$1'.
```

- 暂时碰不到这个报错。

## WARN CODE 13

```txt
Cannot set buff of non-number status. Key: '$1'.
```

- 暂时碰不到这个报错。

## WARN CODE 14

```txt
Cannot add status of non-number status. Key: '$1'.
```

- 暂时碰不到这个报错。

## WARN CODE 15

```txt
Cannot get item of a non-item block on loc: $1,$2,$3.
```

- 警告原因：不能获取一个不存在物品的图块上的物品对象。
- 解决方案：提前判断那一格是不是物品，或确保要获取的格子包含物品。

## WARN CODE 16

```txt
Override repeated state key: '$1'.
```

- 暂时碰不到这个报错。

## WARN CODE 17

```txt
Floor-damage extension needs 'floor-binder' extension as dependency.
```

- 警告原因：楼层伤害拓展需要以楼层绑定拓展作为依赖。
- 解决方案：确保添加伤害拓展时也添加了楼层绑定拓展。

## WARN CODE 18

```txt
Uncaught error in posting like info for danmaku. Danmaku id: $1.
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 警告原因：为弹幕点赞时出现报错。
- 解决方案：可能是网络问题，检查网络。

## WARN CODE 19

```txt
Repeat light id: '$1'
```

> 应该不会遇到这个报错，因为样板并不内置点光源。

- 警告原因：重复的光源 id。
- 解决方案：避免光源 id 出现重复。

## WARN CODE 20

```txt
Cannot apply animation to camera operation that does not belong to it.
```

- 警告原因：不能向摄像机对象添加不属于它的动画操作。
- 解决方案：确保添加的动画操作是由这个摄像机对象创建的。

## WARN CODE 21

```txt
Cannot apply transition to camera operation that does not belong to it.
```

- 警告原因：不能向摄像机对象添加不属于它的渐变操作。
- 解决方案：确保添加的渐变操作是由这个摄像机对象创建的。

## WARN CODE 22

```txt
There is already an active camera for delivered render item. Consider using 'Camera.for' or disable the active camera to avoid some exceptions.
```

- 警告原因：在目标渲染元素上，现在已经有了一个已激活的摄像机对象，这可能导致两个摄像机操作冲突，产生问题。
- 解决方案：考虑使用 [`Camera.for`](../../api/motajs-render-elements/Camera.md#Camera.for) 方法，或先禁用已激活的摄像机，再使用当前摄像机

## WARN CODE 23

```txt
Render item with id of '$1' has already exists. Please avoid repeat id since it may cause issues when use 'getElementById'.
```

- 警告原因：两个渲染元素的 id 出现了重复，这会导致调用 `getElementById` 时出现问题。
- 解决方案：避免出现重复的 id。

## WARN CODE 24

```txt
Uniform block can only be used in glsl version es 300.
```

- 警告原因：UBO(Uniform Block Object) 只能在 GLSL ES 300 版本的着色器脚本中使用。
- 解决方案：如果需要使用 UBO，考虑换用 es 300 版本的着色器脚本。

## WARN CODE 25

```txt
Cannot activate weather since there's no weather with id of '$1'.
```

- 警告原因：不能启用不存在的天气类型。
- 解决方案：确保要启用的天气类型正确且存在，不存在则需要自行注册。

## WARN CODE 26

```txt
Cannot set attribute when only element number specified. Use 'pointer' or 'pointerI' instead.
```

- 警告原因：使用 `defineAttribute` 时指定了不存在的顶点属性类型。
- 解决方案：如果需要传递数组，考虑使用 `defineAttribArray` 而不是 `defineAttribute`。

## WARN CODE 27

```txt
Cannot vertex attribute integer point when specified as float. Use 'set' or 'pointer' instead.
```

- 遇不到这个报错

## WARN CODE 28

```txt
Redefinition of shader $1: '$2'
```

- 警告原因：定义了重复的着色器变量/顶点属性/UBO 等。
- 解决方案：避免对同一个变量调用多次 `defineXxxx`。

## WARN CODE 29

```txt
Cannot define new texture since texture index is larger than max texture count.
```

- 警告原因：定义的纹理数量超过了设备支持的上限。
- 解决方案：考虑将多个纹理合并为同一个纹理作为图集，然后使用顶点属性或一致变量进行裁剪。

## WARN CODE 30

```txt
Cannot use indices named $1 since no definition for it. Please define it in advance.
```

- 警告原因：要作为顶点索引的索引数组不存在，因为没有定义。
- 解决方案：提前定义索引数组。

## WARN CODE 31

```txt
Cannot use indices since the indices instance is not belong to the program.
```

- 警告原因：使用的顶点索引数组不属于当前着色器程序。
- 解决方案：确保使用的顶点索引数组是由当前着色器程序创建的。

## WARN CODE 32

```txt
Sub-image exceeds texture dimensions, auto adjusting size.
```

- 警告原因：使用 `IShaderTexture.sub` 时，传入的图像数据超出了纹理大小。
- 解决方案：确保传入的图片不会超出纹理大小。如果需要修改纹理大小，请使用 `IShaderTexture.set` 方法。

## WARN CODE 33

```txt
Cannot modify MotaOffscreenCanvas2D that is freezed.
```

- 遇不到这个报错。

## WARN CODE 34

```txt
Repeated render tag registration: '$1'.
```

- 警告原因：注册了重复的渲染标签。
- 解决方案：确保注册的渲染标签名称不重复。

## WARN CODE 35

```txt
Cannot append child on plain render item, please ensure you have overrided 'appendChild' method in your own element.
```

- 警告原因：默认的渲染元素中，只有一部分可以添加子元素，而其他的不能添加。
- 解决方案：不要在不能添加子元素的元素里面添加子元素。如果是自定义元素，请确保实现了 `appendChild` 方法。

## WARN CODE 36

```txt
Cannot remove child on plain render item, please ensure you have overrided 'removeChild' method in your own element.
```

- 警告原因：默认的渲染元素中，只有一部分可以移除子元素，而其他的不能移除。
- 解决方案：不要在不能移除子元素的元素里面移除子元素。如果是自定义元素，请确保实现了 `removeChild` 方法。

## WARN CODE 37

```txt
Cannot execute 'requestSort' on plain render item, please ensure you have overrided 'requestSort' method in your own element.
```

- 警告原因：默认的渲染元素中，只有一部分可以拥有排序功能，而其他的不能排序。
- 解决方案：不要在不能拥有子元素的元素上调用 `requestSort`。如果是自定义元素，请确保实现了 `requestSort` 方法。

## WARN CODE 38

```txt
Using plain text in jsx is strongly not recommended, since you can hardly modify its attributes. Consider using Text element instead.
```

- 警告原因：在 JSX 中直接填写文字内容是极其不推荐的，因为你几乎不能修改它的任何属性。
- 解决方案：考虑使用 `text` 标签替代。

## WARN CODE 39

```txt
Plain text is not supported outside Text element.
```

- 警告原因：不能在 `text` 元素外使用变量作为文字，例如：

```tsx
<container>{text.value}</container>
```

- 解决方案：换用 `text` 标签。

## WARN CODE 40

```txt
Cannot return canvas that is not provided by this pool.
```

- 遇不到这个报错。

## WARN CODE 41

```txt
Width of text content components must be positive. receive: $1
```

- 警告原因：`TextContent` 组件的宽度必须是正值，而你可能传入了一个负值或 0。
- 解决方案：确保宽度属性是正值。

## WARN CODE 42

```txt
Repeated Textbox id: '$1'.
```

- 警告原因：`Textbox` 组件使用了重复的 id。
- 解决方案：避免 `Textbox` 组件的 id 重复。

## WARN CODE 43

```txt
Cannot set icon of '$1', since it does not exists. Please ensure you have delivered correct icon id or number.
```

- 警告原因：向 `icon` 元素中传入了不存在的图标。
- 解决方案：确保传入的图标 id 或数字是正确的。

## WARN CODE 44

```txt
Unexpected end when loading stream audio, reason: '$1'
```

- 警告原因：加载流式音频时被意外中断。
- 解决方案：根据原因解决。

## WARN CODE 45

```txt
Audio route with id of '$1' has already existed. New route will override old route.
```

- 警告原因：id 为 $1 的音频路由已经存在，新的路由将会覆盖旧路由。
- 解决方案：确保音频路由不会重复。

## WARN CODE 46

```txt
Cannot pipe new StreamReader object when stream is loading.
```

- 警告原因：在流式加载过程中无法将流加载对象泵入其他对象。
- 解决方案：在流式加载前就执行 `pipe` 方法。

## WARN CODE 47

```txt
Audio stream decoder for audio type '$1' has already existed.
```

- 警告原因：$1 类型的音频解码器已经存在。
- 解决方案：不要为同一种类型的音频注册多种解码器。

## WARN CODE 48

```txt
Sample rate in stream audio must be constant.
```

- 警告原因：流式音频中，音频的采样率应该保持一致。
- 解决方案：确保音频的采样率不会改变，如果会的话，请换一个音频。

## WARN CODE 49

```txt
Repeated patch for '$1', key: '$2'.
```

- 警告原因：对同一个 2.x 样板接口重写了两次。
- 解决方案：将两次重写合并为一次。

## WARN CODE 50

```txt
Unknown audio extension name: '$1'
```

- 警告原因：未知的文件拓展名 $1。
- 解决方案：换一个类型的音频。
