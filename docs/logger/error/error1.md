# 错误代码一览及其解决方案 1-50

## ERROR CODE 1

```txt
Unexpected error when posting danmaku. Error info: $1
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 报错原因：发送弹幕时发生报错。
- 解决方案：查看后面的 Error info，检查报错信息内容，按照报错信息修复问题。

## ERROR CODE 2

```txt
Unexpected loading error in loading resource '$1/$2'. Error info: $3
```

- 报错原因：加载资源时发生报错，可能是资源不存在，或者是网络问题。
- 解决方案：查看后面的 Error info，检查报错信息内容，按照报错信息修复问题。

## ERROR CODE 3

```txt
Syntax error in parsing CSS: Unexpected ':'. Col: $1. CSS string: '$2
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 报错原因：解析 CSS 时报错，一般是在发送弹幕时引起。
- 解决方案：检查弹幕 CSS 语法是否正确。

## ERROR CODE 4

```txt
Syntax error in parsing CSS: Unexpected ';'. Col: $1. CSS string: '$2'
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 报错原因：解析 CSS 时报错，一般是在发送弹幕时引起。
- 解决方案：检查弹幕 CSS 语法是否正确。

## ERROR CODE 5

```txt
Syntax error in parsing CSS: Missing property name after '-'. Col: $1. CSS string: '$2'
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 报错原因：解析 CSS 时报错，一般是在发送弹幕时引起。
- 解决方案：检查弹幕 CSS 语法是否正确。

## ERROR CODE 6

```txt
Syntax error in parsing CSS: Unexpected end of css, expecting ':'. Col: $1. CSS string: '$2'
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 报错原因：解析 CSS 时报错，一般是在发送弹幕时引起。
- 解决方案：检查弹幕 CSS 语法是否正确。

## ERROR CODE 7

```txt
Syntax error in parsing CSS: Unexpected end of css, expecting property value. Col: $1. CSS string: '$2'
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 报错原因：解析 CSS 时报错，一般是在发送弹幕时引起。
- 解决方案：检查弹幕 CSS 语法是否正确。

## ERROR CODE 8

```txt
Post danmaku with not allowed css. Info: $1
```

> 应该不会遇到这个报错，因为样板并不内置弹幕系统。

- 报错原因：弹幕 CSS 中使用了不允许的 css 属性类型。
- 解决方案：目前仅支持 `color` `background-color` `font-size: x%` 属性。

## ERROR CODE 9

```txt
Cannot initialize shader program. Error info: $1
```

- 报错原因：不能够初始化着色器脚本，可能是着色器代码中有语法错误，或者是定义了不存在的变量等。
- 解决方案：查看报错内容，根据报错内容解决。

## ERROR CODE 10

```txt
Cannot compile $1 shader. Error info: $2
```

- 报错原因：不能编译着色器脚本，可能是语法错误，设备不支持 OpenGL 等原因。
- 解决方案：查看报错内容，根据报错内容解决。

## ERROR CODE 11

```txt
Cache depth cannot larger than 31.
```

- 报错原因：`BlockCache` 最大允许 31 层深度缓存。
- 解决方案：降低缓存深度。

## ERROR CODE 12

```txt
Cannot move while status is not 'moving'. Call 'readyMove' first.
```

- 报错原因：调用移动时没有调用 `readyMove` 准备移动。
- 解决方案：在移动前先调用 `readyMove`。

## ERROR CODE 13

见 [CODE 10](#error-code-10)

## ERROR CODE 16

```txt
Cannot find log message for $1 code $2.
```

- 报错原因：不能找到错误代码 $2 的消息。
- 解决方案：避免使用 `logger` 输出不存在的错误代码。

## ERROR CODE 17

```txt
Cannot use shader program for shader element that does not belong to it.
```

- 报错原因：在一个着色器上使用了不属于这个着色器的着色器程序。
- 解决方案：确保使用的着色器程序是由着色器对象自身创建的。

## ERROR CODE 18

```txt
Cannot delete shader program for shader element that does not belong to it.
```

- 报错原因：在一个着色器上删除了不属于这个着色器的着色器程序。
- 解决方案：确保删除的着色器程序是由着色器对象自身创建的。

## ERROR CODE 19

```txt
Cannot create MotaRenderer instance for nonexistent canvas.
```

- 报错原因：在一个不存在的画布上创建了渲染器对象。
- 解决方案：确保目标画布存在。

## ERROR CODE 20

```txt
Cannot create render element for tag '$1', since there's no registration for it.
```

- 报错原因：不能创建 $1 标签，因为没有注册这个标签。
- 解决方案：确保你已经在 `tagMap` 注册了这个标签。

## ERROR CODE 21

```txt
Incorrect render prop type is delivered. key: '$1', expected type: '$2', delivered type: '$3'
```

- 报错原因：向元素中传入了错误类型的参数（props）。
- 解决方案：确保传入元素的 $1 参数的类型是 $2。

## ERROR CODE 22

```txt
Incorrect props for custom tag. Please ensure you have delivered 'item' prop and other required props.
```

- 报错原因：没有向 `cutsom` 标签传入 `item` 参数。
- 解决方案：确保传入了 `item` 参数和需要的所有参数。

## ERROR CODE 23

```txt
Cannot get reader when fetching '$1'.
```

- 报错原因：流式加载 URL $1 时不能获取 `StreamReader`。
- 解决方案：检查加载的 URL 是否合法，检查浏览器版本是否过老。

## ERROR CODE 24

```txt
Cannot decode source type of '$1', since there is no registered decoder for that type.
```

- 报错原因：音频系统中的流式音频源不能解析 $1 格式的音频，因为没有对应的解码器。
- 解决方案：如果不是 `opus` `ogg` 格式的音频，请使用 `ElementSource`。

## ERROR CODE 25

```txt
Unknown audio type. Header: '$1'
```

- 报错原因：未知的音频类型。
- 解决方案：目前仅支持 `mp3` `wav` `flac` `opus` `ogg` `aac` 格式的音频。

## ERROR CODE 26

```txt
Uncaught error when fetching stream data from '$1'. Error info: $2.
```

- 报错原因：流式加载时报错。
- 解决方案：查看报错内容，根据报错内容解决问题。
