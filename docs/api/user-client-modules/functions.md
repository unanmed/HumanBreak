# 模块函数 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 钩子

### `onOrientationChange`

```typescript
function onOrientationChange(hook: OrientationHook): void;
```

监听屏幕方向变化事件。需要在组件内或 UI 内调用。  
**参数**

- `hook`: 方向变化回调函数

```typescript
type OrientationHook = (
    orientation: Orientation, // 当前方向
    width: number, // 窗口宽度
    height: number // 窗口高度
) => void;
```

**示例** - 响应式布局

```typescript
import { onOrientationChange, Orientation } from './use';

// 组件内
onOrientationChange((orient, width) => {
    if (orient === Orientation.Portrait) {
        // 竖屏模式
        adjustMobileLayout(width);
    } else {
        // 横屏模式
        resetDesktopLayout();
    }
});
```

---

### `onLoaded`

```typescript
function onLoaded(hook: () => void): void;
```

在游戏核心资源加载完成后执行回调（若已加载则立即执行）。

---

## 过渡动画控制

### 通用接口

```typescript
interface ITransitionedController<T> {
    readonly ref: Ref<T>; // 响应式引用
    readonly value: T; // 当前值
    set(value: T, time?: number): void; // 设置目标值
    mode(timing: TimingFn): void; // 设置缓动曲线
    setTime(time: number): void; // 设置默认时长
}
```

### `transitioned`

```typescript
function transitioned(
    value: number, // 初始值
    time: number, // 默认过渡时长（ms）
    curve: TimingFn // 缓动函数（如 linear()）
): ITransitionedController<number> | null;
```

创建数值渐变控制器（仅限组件内使用）。

**示例** - 旋转动画

```tsx
// Vue 组件内
const rotate = transitioned(0, 500, hyper('sin', 'out'));

// 触发动画
rotate.set(Math.PI, 800); // 800ms 内旋转到 180 度

// 模板中使用
<text rotate={rotate.ref.value} text="一些显示内容" />;
```

### `transitionedColor`

```typescript
function transitionedColor(
    color: string, // 初始颜色（目前支持 #RGB/#RGBA/rgb()/rgba()）
    time: number, // 默认过渡时长（ms）
    curve: TimingFn // 缓动函数
): ITransitionedController<string> | null;
```

创建颜色渐变控制器（仅限组件内使用）。

**示例** - 背景色过渡

```tsx
// Vue 组件内
const bgColor = transitionedColor('#fff', 300, linear());

// 触发颜色变化
bgColor.set('rgba(255, 0, 0, 0.5)'); // 渐变为半透明红色

// 模板中使用
<g-rect fillStyle={bgColor.ref.value} />;
```

---

### 注意事项

1. **组件生命周期**：过渡控制器必须在 Vue 组件内部创建，卸载时自动销毁
2. **性能优化**：避免在频繁触发的回调（如每帧渲染）中创建新控制器
3. **颜色格式**：`transitionedColor` 支持 HEX/RGB/RGBA，但不支持 HSL
4. **默认时长**：调用 `set()` 时不传时间参数则使用初始化时设置的时间

### 高级用法示例

#### 组合动画

```typescript
// 同时控制位置和透明度
const posX = transitioned(0, 500, linear());
const alpha = transitioned(1, 300, linear());

const moveAndFade = () => {
    posX.set(200);
    alpha.set(0);
};

// 组件卸载时自动清理动画资源
```

## 组件控制

### `getConfirm`

```typescript
function getConfirm(
    controller: IUIMountable, // UI 控制器
    text: string, // 确认内容
    loc: ElementLocator, // 定位配置
    width: number, // 对话框宽度（像素）
    props?: Partial<ConfirmBoxProps> // 扩展配置
): Promise<boolean>;
```

---

#### 参数说明

| 参数名       | 类型                       | 必填 | 描述                                           |
| ------------ | -------------------------- | ---- | ---------------------------------------------- |
| `controller` | `IUIMountable`             | 是   | UI 控制器实例（通常从组件 props 获取）         |
| `text`       | `string`                   | 是   | 需要用户确认的文本内容                         |
| `loc`        | `ElementLocator`           | 是   | 对话框位置配置（需包含 x,y 坐标及锚点）        |
| `width`      | `number`                   | 是   | 对话框宽度（像素），高度自动计算               |
| `props`      | `Partial<ConfirmBoxProps>` | 否   | 扩展配置项（支持所有 ConfirmBox 组件的 props） |

---

#### 返回值

返回 `Promise<boolean>`：

- `true` 表示用户点击确认
- `false` 表示用户取消或关闭

---

#### 使用示例

##### 基础用法 - 删除确认

```tsx
import { defineComponent } from 'vue';
import { DefaultProps } from '@motajs/render';
import { GameUI } from '@motajs/system-ui';

// 在业务逻辑中调用，注意，组件需要使用 UI 控制器打开，它会自动传递 controller 参数
const MyCom = defineComponent<DefaultProps>(props => {
    const handleDeleteItem = async (itemId: string) => {
        const confirmed = await getConfirm(
            props.controller, // 从组件 props 获取控制器
            `确认删除 ID 为 ${itemId} 的项目吗？`,
            [208, 208, void 0, void 0, 0.5, 0.5], // 居中显示
            208
        );

        if (confirmed) {
            api.deleteItem(itemId);
        }
    };

    return () => (
        <container>
            {/* 假设有一个按钮在点击后触发上面的删除函数 */}
            <text text="删除" onClick={() => handleDeleteItem(item.id)} />
        </container>
    );
});

export const MyUI = new GameUI('my-ui', MyCom);
```

##### 自定义按钮文本

```typescript
import { mainUIController } from '@user/client-modules';
// 注意，如果在 client-modules/render/ui 下编写代码，应该引入：
import { mainUIController } from './controller.ts';

// 修改确认/取消按钮文案
const result = await getConfirm(
    // 传入主 UI 控制器也可以
    mainUIController,
    '切换场景将丢失未保存进度',
    [208, 208, void 0, void 0, 0.5, 0.5],
    320,
    {
        yesText: '继续切换',
        noText: '留在当前',
        selFill: '#e74c3c',
        border: '#c0392b'
    }
);
```

---

### `getChoice`

```typescript
function getChoice<T extends ChoiceKey = ChoiceKey>(
    controller: IUIMountable, // UI 控制器
    choices: ChoiceItem[], // 选项数组
    loc: ElementLocator, // 定位配置
    width: number, // 对话框宽度（像素）
    props?: Partial<ChoicesProps> // 扩展配置
): Promise<T>;
```

#### 参数说明

| 参数名       | 类型                    | 必填 | 描述                                        |
| ------------ | ----------------------- | ---- | ------------------------------------------- |
| `controller` | `IUIMountable`          | 是   | UI 控制器实例（通常从组件 props 获取）      |
| `choices`    | `ChoiceItem[]`          | 是   | 选项数组，格式为 `[key, text]` 的元组       |
| `loc`        | `ElementLocator`        | 是   | 对话框位置配置（需包含 x,y 坐标及锚点）     |
| `width`      | `number`                | 是   | 对话框宽度（像素），高度自动计算            |
| `props`      | `Partial<ChoicesProps>` | 否   | 扩展配置项（支持所有 Choices 组件的 props） |

#### 返回值

返回 `Promise<T>`：

- 解析为选中项的 `key` 值

#### 使用示例

##### 基础用法 - 难度选择

```typescript
import { getChoice, mainUIController } from '@user/client-modules';

// 写到异步函数里面
const selectedDifficulty = await getChoice(
    mainUIController,
    [
        ['easy', '新手模式'],
        ['normal', '普通模式'],
        ['hard', '困难模式']
    ],
    [208, 208, void 0, void 0, 0.5, 0.5], // 居中显示
    208,
    {
        title: '选择难度',
        titleFont: new Font('黑体', 24)
    }
);

// 判断选择的内容
if (selectedDifficulty === 'hard') {
    applyHardcoreRules();
}
```

##### 分页支持 - 角色选择

```typescript
import { getChoice, mainUIController } from '@user/client-modules';

// 生成 200 个角色选项
const characterOptions = Array.from(
    { length: 200 },
    (_, i) => [i, `角色 #${i + 1}`] as ChoiceItem
);

const chosenId = await getChoice(
    mainUIController,
    characterOptions,
    [208, 208, void 0, void 0, 0.5, 0.5],
    208,
    {
        maxHeight: 400, // 超过 400px 自动分页
        winskin: 'winskin.png',
        interval: 12
    }
);
```

##### 动态样式配置

```typescript
import { getChoice, mainUIController } from '@user/client-modules';

// 自定义主题风格
const choiceResult = await getChoice(
    mainUIController,
    [
        ['light', '浅色主题'],
        ['dark', '深色主题'],
        ['oled', 'OLED 深黑']
    ],
    [208, 208, void 0, void 0, 0.5, 0.5],
    300,
    {
        color: 'rgba(30,30,30,0.9)',
        border: '#4CAF50',
        selFill: '#81C784',
        titleFill: '#FFF59D'
    }
);
```

### `waitbox`

```typescript
function waitbox<T>(
    controller: IUIMountable,
    loc: ElementLocator,
    width: number,
    promise: Promise<T>,
    props?: Partial<WaitBoxProps<T>>
): Promise<T>;
```

#### 参数说明

| 参数名       | 类型                       | 必填 | 默认值 | 描述                                                 |
| ------------ | -------------------------- | ---- | ------ | ---------------------------------------------------- |
| `controller` | `IUIMountable`             | 是   | -      | UI 挂载控制器（通常传递父组件的 `props.controller`） |
| `loc`        | `ElementLocator`           | 是   | -      | 定位参数                                             |
| `width`      | `number`                   | 是   | -      | 内容区域宽度（像素）                                 |
| `promise`    | `Promise<T>`               | 是   | -      | 要监视的异步操作                                     |
| `props`      | `Partial<WaitBoxProps<T>>` | 否   | `{}`   | 扩展配置项（继承 `Background` + `TextContent` 属性） |

---

#### 返回值

| 类型         | 说明                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| `Promise<T>` | 与传入 `Promise` 联动的代理 `Promise`，在以下情况会 `reject`：原始 `Promise` 被拒绝 |

---

#### 使用示例

##### 等待网络请求

```typescript
// 获取用户数据
const userData = await waitbox(
    props.controller,
    [400, 300, void 0, void 0, 0.5, 0.5], // 居中定位
    300,
    fetch('/api/user'),
    {
        text: '加载用户信息...',
        winskin: 'ui/loading_panel'
    }
);
```

### 注意事项

1. **控制器有效性**  
   必须确保传入的 `controller` 已正确挂载且未销毁

2. **异步特性**  
   需使用 `await` 或 `.then()` 处理返回的 Promise

3. **定位系统**  
   Y 轴坐标基于 Canvas 坐标系（向下为正方向）

4. **额外参考**
    - [组件 ConfirmBox](./组件%20ConfirmBox.md)
    - [组件 Choices](./组件%20Choices.md)
    - [组件 WaitBox](./组件%20WaitBox.md)
