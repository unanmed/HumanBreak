# InputBox 输入对话框组件 API 文档

本文档由 `DeepSeek` 生成并微调。

## 组件描述

输入对话框组件是一个完整的弹出式输入界面，包含提示文本、输入框、确认和取消按钮。适用于需要用户输入文本的交互场景，提供了便捷的异步获取输入方法。

---

## Props 属性说明

| 属性名                    | 类型             | 默认值   | 描述                                                  |
| ------------------------- | ---------------- | -------- | ----------------------------------------------------- |
| `loc`                     | `ElementLocator` | 必填     | 输入框对话框的位置                                    |
| `input`                   | `InputProps`     | -        | 传递给内部 Input 组件的配置参数                       |
| `winskin`                 | `ImageIds`       | -        | 窗口皮肤图片ID，用于对话框背景绘制                    |
| `color`                   | `CanvasStyle`    | -        | 对话框背景颜色（未设置 winskin 时生效）               |
| `border`                  | `CanvasStyle`    | -        | 对话框边框颜色（未设置 winskin 时生效）               |
| `pad`                     | `number`         | -        | 对话框内部所有元素的内边距                            |
| `inputHeight`             | `number`         | -        | 内部输入框区域的高度                                  |
| `text`                    | `string`         | -        | 对话框顶部的提示文本                                  |
| `yesText`                 | `string`         | `"确认"` | 确认按钮的显示文本                                    |
| `noText`                  | `string`         | `"取消"` | 取消按钮的显示文本                                    |
| `selFont`                 | `Font`           | -        | 确认/取消按钮的字体样式                               |
| `selFill`                 | `CanvasStyle`    | -        | 确认/取消按钮的文本颜色                               |
| 继承自 `TextContentProps` | -                | -        | [查看完整属性](./组件%20TextContent#Props%20属性说明) |

---

## Events 事件说明

| 事件名         | 参数类型          | 触发时机                                   |
| -------------- | ----------------- | ------------------------------------------ |
| `confirm`      | `(value: string)` | 当确认输入框的内容时触发                   |
| `cancel`       | `(value: string)` | 当取消时触发                               |
| `change`       | `(value: string)` | 继承自 Input 组件 - 输入框值被确认时触发   |
| `input`        | `(value: string)` | 继承自 Input 组件 - 输入框值实时变化时触发 |
| `update:value` | `(value: string)` | 继承自 Input 组件 - v-model 双向绑定       |

---

## Slots 插槽说明

无插槽

---

## Exposed Methods 暴露方法

无暴露方法

---

## 工具函数

### `getInput(controller, text, loc, width, props?)`

弹出一个输入框并异步返回用户输入的结果。

**参数**

- `controller: IUIMountable` - UI 控制器
- `text: string` - 提示文本内容
- `loc: ElementLocator` - 确认框的位置
- `width: number` - 确认框的宽度
- `props?: InputBoxProps` - 额外的配置属性（可选）

**返回值**: `Promise<string>`

### `getInputNumber(controller, text, loc, width, props?)`

与 `getInput` 类似，但会将结果转换为数字。

**参数**: 同 `getInput`
**返回值**: `Promise<number>`

---

## 使用示例

### 基础用法 - 组件形式

```tsx
import { defineComponent, ref } from 'vue';
import { InputBox } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    const handleConfirm = (value: string) => {
        console.log('用户输入:', value);
        // 处理用户输入
    };

    const handleCancel = (value: string) => {
        console.log('用户取消输入，最后值为:', value);
    };

    return () => (
        <InputBox
            text="请输入您的姓名："
            loc={[240, 240, 300, 180, 0.5, 0.5]}
            input={{
                placeholder: '在此输入姓名',
                border: '#007acc',
                borderWidth: 1,
                circle: [4],
                pad: 8
            }}
            color="#ffffff"
            border="#cccccc"
            borderWidth={2}
            pad={16}
            inputHeight={40}
            yesText="确定"
            noText="取消"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );
});
```

### 使用 getInput 工具函数（推荐）

```tsx
import { defineComponent } from 'vue';
import { getInput, getInputNumber } from '@user/client-modules';

export const MyCom = defineComponent(props => {
    const handleGetName = async () => {
        // 获取文本输入
        const name = await getInput(
            props.controller,
            '请输入您的姓名：',
            [208, 208, void 0, void 0, 0.5, 0.5],
            280,
            {
                input: {
                    placeholder: '姓名'
                },
                color: '#f8f8f8'
            }
        );

        if (name) {
            console.log('用户姓名:', name);
            // 处理姓名
        } else {
            console.log('用户取消了输入');
        }
    };

    const handleGetAge = async () => {
        // 获取数字输入
        const age = await getInputNumber(
            props.controller,
            '请输入您的年龄：',
            [208, 208, void 0, void 0, 0.5, 0.5],
            280
        );

        if (!isNaN(age)) {
            console.log('用户年龄:', age);
            // 处理年龄
        }
    };

    return () => (
        <container>
            <text
                loc={[240, 180, void 0, void 0, 0.5, 0.5]}
                onClick={handleGetName}
                text="输入姓名"
            />
            <text
                loc={[240, 220, void 0, void 0, 0.5, 0.5]}
                onClick={handleGetAge}
                text="输入年龄"
            />
        </container>
    );
});
```

### 带自定义样式的输入对话框

```tsx
import { defineComponent } from 'vue';
import { getInput } from '@user/client-modules';

export const StyledInputCom = defineComponent(props => {
    const handleStyledInput = async () => {
        const value = await getInput(
            props.controller,
            '请输入任务描述：',
            [240, 240, void 0, void 0, 0.5, 0.5],
            320,
            {
                text: '任务创建',
                input: {
                    placeholder: '描述任务内容...',
                    multiline: true,
                    border: '#4CAF50',
                    borderWidth: 2,
                    circle: 8,
                    pad: 12
                },
                color: '#ffffff',
                border: '#4CAF50',
                borderWidth: 3,
                pad: 20,
                inputHeight: 80,
                yesText: '创建',
                noText: '取消',
                selFill: '#4CAF50'
            }
        );

        if (value) {
            console.log('创建任务:', value);
        }
    };

    return () => (
        <text
            loc={[240, 240, void 0, void 0, 0.5, 0.5]}
            onClick={handleStyledInput}
            text="创建新任务"
        />
    );
});
```

### 游戏中的设置界面

```tsx
import { defineComponent } from 'vue';
import { getInput } from '@user/client-modules';

export const SettingsCom = defineComponent(props => {
    const settings = ref({
        playerName: '玩家',
        serverIP: '127.0.0.1'
    });

    const changePlayerName = async () => {
        const newName = await getInput(
            props.controller,
            '修改玩家名称：',
            [240, 240, void 0, void 0, 0.5, 0.5],
            280,
            {
                input: {
                    value: settings.value.playerName,
                    placeholder: '玩家名称',
                    border: '#FF9800',
                    borderWidth: 1
                }
            }
        );

        if (newName) {
            settings.value.playerName = newName;
            console.log('玩家名称已更新:', newName);
        }
    };

    const changeServerIP = async () => {
        const newIP = await getInput(
            props.controller,
            '修改服务器IP：',
            [240, 240, void 0, void 0, 0.5, 0.5],
            280,
            {
                input: {
                    value: settings.value.serverIP,
                    placeholder: '服务器IP地址',
                    border: '#2196F3',
                    borderWidth: 1
                }
            }
        );

        if (newIP) {
            settings.value.serverIP = newIP;
            console.log('服务器IP已更新:', newIP);
        }
    };

    return () => (
        <container loc={[240, 240, 300, 200, 0.5, 0.5]}>
            <text
                loc={[0, -40, void 0, void 0, 0.5, 0.5]}
                onClick={changePlayerName}
                text={`玩家名称: ${settings.value.playerName}`}
            />
            <text
                loc={[0, 0, void 0, void 0, 0.5, 0.5]}
                onClick={changeServerIP}
                text={`服务器IP: ${settings.value.serverIP}`}
            />
        </container>
    );
});
```

---

## 注意事项

1. **推荐使用工具函数**: `getInput` 和 `getInputNumber` 提供了更简洁的异步输入获取方式
2. **宽度设置**: 在使用工具函数时，高度由组件自动计算，只需指定宽度
3. **皮肤优先级**: 如果设置了 `winskin`，则 `color` 和 `border` 设置将失效
4. **异步处理**: 工具函数返回 Promise，需要使用 `await` 或 `.then()` 处理结果
5. **空值处理**: 用户取消输入时，`getInput` 返回空字符串，`getInputNumber` 返回 `NaN`
