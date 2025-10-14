# 警告代码一览及其解决方案 51-100

## WARN CODE 51

```txt
Cannot decode sound '$1', since audio file may not supported by 2.b.
```

- 警告原因：不能解码音效 $1，可能因为文件类型不支持。
- 解决方案：换一个音乐文件格式，建议使用 `opus` 格式。

## WARN CODE 52

```txt
Cannot play sound '$1', since there is no added data named it.
```

- 警告原因：播放了不存在的音效。
- 解决方案：确保要播放音效名称正确。

## WARN CODE 53

```txt
Cannot $1 audio route '$2', since there is not added route named it.
```

- 警告原因：不能对 $2 路由执行 $1（播放、暂停等）操作，因为没有名字叫这个的音频路由。
- 解决方案：确保要操作的路由存在。

## WARN CODE 54

```txt
Missing start tag for '$1', index: $2.
```

- 警告原因：在 `TextContent` 组件中，匹配不到转义字符 $1 的起始位置。
- 解决方案：确保每个转义字符包含起始标签。

## WARN CODE 55

```txt
Unchildable tag '$1' should follow with param.
```

- 警告原因：在 `TextContent` 组件中，没有子标签的转义字符（`\i`）后面必须跟着参数。
- 解决方案：确保 `\i` 后面紧跟着图标名称，例如 `\i[greenSlime]`。

## WARN CODE 56

```txt
Method '$1' has been deprecated. Consider using '$2' instead.
```

- 警告原因：接口 $1 已经弃用。
- 解决方案：考虑换为 $2。

## WARN CODE 57

```txt
Repeated UI controller id '$1'.
```

- 警告原因：重复的 UI 控制器 id。
- 解决方案：避免 UI 控制器的 id 重复。

## WARN CODE 58

```txt
Fail to set ellipse round rect, since length of 'ellipse' property should only be 2, 4, 6 or 8. delivered: $1
```

- 警告原因：椭圆模式的圆角矩形传入的参数数组需要是 2,4,6,8 长度，而传入了 $1 长度的数组。
- 解决方案：确保传入参数正确。

## WARN CODE 59

```txt
Unknown icon '$1' in parsing text content.
```

- 警告原因：在 `TextContent` 中出现了未知的图标。
- 解决方案：确保 `\i` 后的图标参数正确。

## WARN CODE 60

```txt
Repeated Tip id: '$1'.
```

- 警告原因：`Tip` 组件的 id 重复。
- 解决方案：避免 id 重复。

## WARN CODE 61

```txt
Unexpected recursive call of $1.update?$2 in render function. Please ensure you have to do this, if you do, ignore this warn.
```

- 警告原因：在渲染元素的渲染函数中出现了递归 `update` 调用，这会导致元素一直更新而且难以察觉，同时也会引起性能问题。
- 解决方案：避免在渲染函数中调用 `update` 方法。如果你必须这么做，请忽视这个警告。

## WARN CODE 62

```txt
Recursive fallback fonts in '$1'.
```

- 警告原因：字体回退出现了循环。例如 `font1` -> `font2` -> `font1`。
- 解决方案：避免出现循环字体回退。

## WARN CODE 63

```txt
Uncaught promise error in waiting box component. Error reason: $1
```

- 警告原因：在等待 box 组件（选择框、确认框等）时，出现了异步报错。
- 解决方案：根据报错内容解决问题。

## WARN CODE 64

```txt
Text node type and block type mismatch: '$1' vs '$2'
```

- 警告原因：多行文本（TextContent）解析时节点类型和分块类型不一致。
- 解决方案：理应不会遇到这个问题，如果遇到了，请到造塔群寻求帮助。

## WARN CODE 65

```txt
Cannot bind a weather controller twice.
```

- 警告原因：一个天气控制器不能绑定到两个元素上。
- 解决方案：如果两个元素需要天气，那么请创建两个天气控制器，一个天气控制器只能绑定一个，且不能解绑。
