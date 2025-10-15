# 选择框与确认框

2.B 提供的简单的确认框与选择框接口，允许你用几行代码就可以弹出一个确认框让用户确认，或是弹出选择框让用户选择，不再需要像 2.x 一样用非常不好用的 `myconfirm` 或 `insertAction` 事件流了。

## 确认框

假设我们需要在点击一个按钮后弹出应该确认框，让玩家确认操作，可以使用 `getConfirm` 或 `routedConfirm` 接口。假设我们在 `packages-user/client-modules/src/render/ui` 文件夹下的 UI 中实现这一需求，我们可以这么写：

```tsx
// 从 components 文件夹引入接口，注意路径关系
import { getConfirm } from '../components';

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(props => {
    /** 当鼠标点击时触发，由于 getConfirm 是异步函数，这里的 click 也需要异步 */
    const click = async () => {
        // 调用接口，并等待执行完毕，获取异步返回值
        const confirm = await getConfirm(
            props.controller, // 使用打开当前 UI 的控制器作为 UI 控制器
            '确认要 XXX 吗？', // 提示文字
            [240, 240, void 0, void 0, 0.5, 0.5], // 确认框所处的位置，这里使用居中对齐，中心点在 (240,240) 位置
            240, // 确认框的宽度
            {
                // 这一参数具体看后面的解释
                selFill: 'gold' // 选项文字使用金色
            }
        );
        if (confirm) {
            // 如果用户选择了确认，可以执行确认内容，例如显示一个提示
            core.drawTip('用户确认');
        } else {
            // 如果用户选择了取消，可以执行取消内容
            core.drawTip('用户取消');
        }
    };

    return () => (
        <container>
            <text
                text="这是一个按钮"
                // 监听 click 事件
                onClick={click}
            />
        </container>
    );
});
```

其中 `getConfirm` 的最后一个参数是一个对象，可以传入 `ConfirmBox` 组件的参数，具体可以参考[此文档](../../api/user-client-modules/组件%20ConfirmBox.md)。例如 `selFill` 是 `ConfirmBox` 控制选项填充样式的参数。

除此之外，还有一个 `routedConfirm` 接口，此接口与 `getConfirm` 引入方式相同，主要差别为 `routedConfirm` 会自动处理录像。但是这并不意味着用 `routedConfirm` 比 `getConfirm` 更好，因为我们一般会在客户端（渲染端）调用它，而客户端的内容在录像验证时是不会执行的，这就可能导致录像出错。一般情况下，我们只需要使用 `getConfirm` 接口，而需要使用 `routedConfirm` 的场景已经在样板中处理。

**总结成一句话就是**：一般情况下不要使用 `routedConfirm`，使用 `getConfirm` 即可。

## 选择框

选择框会给玩家提供一系列选项，让玩家选择某一项，并返回玩家选择的内容。使用 `getChoice` 接口，示例如下：

```tsx
// 从 components 文件夹引入接口，注意路径关系
import { getChoice } from '../components'; // [!code ++]

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(props => {
    // 选项内容，第一项是 id，第二项是该选项的显示内容
    // 第一项 id 可以填字符串或者数字
    const choices: ChoiceItem[] = [
        ['key1', '选项1'], // 第一个选项
        ['key2', '选项2'] // 第二个选项
    ];

    /** 同样，由于 getChoice 是异步函数，这里的 click 也需要异步 */
    const click = async () => {
        // 调用接口，并等待执行完毕，获取异步返回值
        const choice = await getChoice(
            props.controller, // 使用打开当前 UI 的控制器作为 UI 控制器
            choices, // 在这里传入选项内容
            [240, 240, void 0, void 0, 0.5, 0.5], // 选择框所处的位置
            240, // 选择框的宽度
            {
                // 可选参数，例如显示提示文字
                text: '请选择一项'
            }
        );
        // 使用 switch 判断
        switch (choice) {
            case 'key1':
                // 选择了第一个选项时
                core.drawTip('选择了第一项');
                break;
            // ... 其他判断
        }
    };

    return () => (
        <container>
            <text
                text="这是一个按钮"
                // 监听 click 事件
                onClick={click}
            />
        </container>
    );
});
```

同样，`getChoice` 也有一个对应的 `routedChoice`，依然建议一般情况下只使用 `getChoice`，不使用 `routedChoice`。

## 拓展-使用枚举定义选择框

如果使用字符串定义选择框的 `id`，一来没有严格的类型标注，二来字符串的性能也较差，因此我们推荐使用枚举定义选择框的 `id`。首先我们先编写一段枚举：

```ts
// 定义选项枚举，可以写一些有意义的单词辅助记忆
const enum MyChoice {
    Choice1, // 第一个选项
    Choice2, // 第二个选项
    Choice3 // 第三个选项
}
```

然后在选择框定义中使用枚举定义：

```ts
const choices: Choices<MyChoice>[] = [
    [MyChoice.Choice1, '选项1'],
    [MyChoice.Choice2, '选项2'],
    [MyChoice.Choice3, '选项3']
];

// 这里不变
const choice = await getChoice(
    props.controller
    choices
    [240, 240, void 0, void 0, 0.5, 0.5]
    240
);

// 可以用 switch 判断
switch (choice) {
    case MyChoice.Choice1:
        // 选择选项1时
        break;
    // ... 其他内容
}
```

## 拓展-等待框

等待框也是一种类似于确认框的东西，不过它用来等待一个操作执行完毕，同时给用户显示一个界面，可以是复杂逻辑运算，也可以是网络请求等。以等待网络请求为例：

```tsx
// 从 components 文件夹引入接口，注意路径关系
import { waitbox } from '../components';

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(props => {
    const click = async () => {
        // 等待网络请求，同时展示一个等待框让玩家不孤单
        const response = await waitbox(
            props.controller, // 控制器
            [240, 240, void 0, void 0, 0.5, 0.5], // 位置
            240, // 宽度
            fetch('/api/example') // 一个 fetch 请求
        );
        // 之后就可以直接使用了
        const body = response.body;
    };

    return () => (
        <container>
            <text
                text="这是一个按钮"
                // 监听 click 事件
                onClick={click}
            />
        </container>
    );
});
```

## 拓展-输入框

与选择框、确认框类似，只不过允许玩家输入一段内容，然后返回给程序。使用 `getInput` 来让玩家输入字符串，使用 `getInputNumber` 来让玩家输入数字。

输入框包含一个确认键和取消键，玩家点击确认键时会将输入结果返回，而如果点击了取消，那么会返回空字符串或 `NaN`。

### 输入字符串

使用 `getInput` 接口：

```tsx
import { getInput } from '../components';

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(props => {
    const click = async () => {
        // 调用接口，并等待执行完毕，获取异步返回值
        const inputData = await getInput(
            props.controller, // UI 控制器
            '请输入一句话', // 显示的文字
            [240, 240, void 0, void 0, 0.5, 0.5], // 输入框位置
            240, // 输入框宽度
            // 其他参数配置，参考 API 文档
            {
                // 例如设置一个占位符
                input: {
                    placeholder: '输入一句话'
                }
            }
        );
        if (inputData.length === 0) {
            // 如果用户没有输入任何内容或点了取消
        } else {
            // 如果用户输入了内容
        }
    };

    return () => (
        <container>
            <text
                text="这是一个按钮"
                // 监听 click 事件
                onClick={click}
            />
        </container>
    );
});
```

### 输入数字

与 `getInput` 类似，不过要用 `getInputNumber` 接口：

```tsx
import { getInputNumber } from '../components';

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(props => {
    const click = async () => {
        // 调用接口，并等待执行完毕，获取异步返回值
        const num = await getInputNumber(
            props.controller, // UI 控制器
            '请输入一个数字', // 显示的文字
            [240, 240, void 0, void 0, 0.5, 0.5], // 输入框位置
            240, // 输入框宽度
            // 其他参数配置，参考 API 文档
            {
                // 例如设置一个占位符
                input: {
                    placeholder: '输入数字'
                }
            }
        );
        if (isNaN(num)) {
            // 如果用户输入的不是数字或点了取消
        } else {
            // 如果用户输入了数字
        }
    };

    return () => (
        <container>
            <text
                text="这是一个按钮"
                // 监听 click 事件
                onClick={click}
            />
        </container>
    );
});
```

## 拓展-API参考

- [ConfirmBox](../../api/user-client-modules/组件%20ConfirmBox.md)
- [Choices](../../api/user-client-modules/组件%20Choices.md)
- [WaitBox](../../api/user-client-modules/组件%20WaitBox.md)
- [getConfirm](../../api/user-client-modules/functions.md#getconfirm)
- [getChoice](../../api/user-client-modules/functions.md#getchoice)
- [waitbox 方法](../../api/user-client-modules/functions.md#waitbox)
