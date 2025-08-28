# UI 系统

本节将会讲解 2.B 的渲染树与 UI 系统的工作原理，以及一些常用 API。

:::info
**这部分可以选择性阅读，只有打开和关闭较为重要，其他功能一般场景下用不到。**
:::

## 打开与关闭 UI

在 UI 编写章节已经提到了打开和关闭 UI 使用 `open` 和 `close` 方法，现在我们更细致地讲解一下如何打开与关闭 UI。打开 UI 使用 `open` 方法，定义如下：

```ts
function open<T extends UIComponent>(
    ui: IGameUI<T>,
    props: UIProps<T>,
    alwaysShow?: boolean
): IUIInstance;
```

其中第一个参数表示要打开的 UI，第二个表示传给 UI 的参数，第三个表示 UI 是否永远保持显示状态（除非被关闭），不受到显示模式的影响。同种 UI 可以打开多个，也可以在不同的控制器上同时打开多个相同的 UI。例如，如果我们想在主 UI 控制器中添加一个常量的返回游戏按钮，就可以这么写：

```ts
// BackToGame 是自定义 UI，第三个参数传 true 来保证它一直显示在画面上
mainUIController.open(BackToGame, {}, true);
```

关闭 UI 使用 `close` 方法，传入 UI 实例，即 `open` 方法的返回值，没有其他参数。例如：

```ts
const MyUI = defineComponent(props => {
    // 所有通过 UI 控制器打开的，同时按照 UI 模板填写了 props 的 UI 都包含 controller 和 instance 属性
    props.controller.close(props.instance);
}, myUIProps);
```

除此之外，还提供了一个关闭所有 UI 的：

```ts
function closeAll(ui?: IGameUI): void;
```

其中参数表示要关闭的 UI 类型，不填时表示关闭所有 UI，填写时表示关闭所有指定类型的 UI。例如我想关闭所有 `EnemyInfo` UI，可以这么写：

```ts
// EnemyInfo 是自定义 UI
mainUIController.closeAll(EnemyInfo);
```

:::warning
以下内容属于进阶内容，没有高级需求不需要理解。
:::

## 创建一个自己的 UI 管理器

样板提供 `UIController` 类，允许你在自己的一个 UI 中创建自己的 UI 管理器，例如在样板中，游戏画面本身包含一个 UI 管理器，分为了封面、加载界面、游戏界面三种，其中游戏界面里面还有一个游戏 UI 管理器，我们常用的就是最后一个游戏 UI 管理器。

多数情况下，样板自带的 UI 管理器已经足够，不需要自己创建 UI 管理器。我们最常用的管理器就是 `mainUIController`，它控制了游戏界面下的 UI。

这里为了教程的完整性，简单讲述一下如何创建一个自己的 UI 管理器。

### 创建 UIController 实例

我们从 `@motajs/system-ui` 引入 `UIController` 类，然后对其实例化：

```ts
import { UIController } from '@motajs/system-ui';

// 传入一个字符串来表示这个控制器的 id
export const myController = new UIController('my-controller');
```

### 获取 UI 控制器

可以通过 id 来获取到这个控制器，或者直接引入对应文件中的控制器：

```ts
import { UIController } from '@motajs/system-ui';
import { myController } from './myController';

const myController = UIController.get('my-controller');
```

### 添加到渲染树

接下来，可以直接调用 `myController.render` 方法来添加到你自己的 UI 中：

```tsx
<container>{myController.render()}</container>
```

## UI 显示模式

### 内置显示模式

UI 管理器内置了两种显示模式，只显示最后一个以及显示所有。其中前者常用于级联式 UI，例如 `设置 -> 系统设置 -> 快捷键设置`，这时候只会显示最后一个 UI，前面的 UI 不会显示。后者常用于展示信息类的 UI，例如在地图上展示怪物信息等。我们可以通过下面这两个方法来设置 UI 显示模式，立即生效，但不推荐频繁切换，建议一个控制器只使用**一种**显示模式：

```ts
// 设置为只显示最后一个
myController.lastOnly();
// 设置为显示所有
myController.showAll();
```

### 栈模式

对于级联式 UI，我们希望在关闭一个 UI 时，在其之后的 UI 也能关闭，例如对于上面提到的 `设置 -> 系统设置 -> 快捷键设置` 级联 UI，当我们关闭设置界面时，我们会希望系统设置和快捷键设置也一并关闭，而不是需要手动关闭。这时候，栈模式就可以做到这一点，启用栈模式时，关闭一个 UI 后，在其之后的 UI 也会全部关闭。我们依然可以使用上面两个方法来设置是否启用栈模式：

```ts
// 设置为显示最后一个，启用栈模式，不过 lastOnly 默认启用栈模式，因此参数可不填
myController.lastOnly(true);
// 设置为显示最后一个，不启用栈模式
myController.lastOnly(false);
```

### 自定义显示模式

::: info
这一小节内容不重要，没有特殊需求的可以不看。
:::

样板内置的两个显示模式以及栈模式已经能够满足绝大多数情况，不过可能还会有一些非常特殊的情况满足不了，这时候我们可以使用 `showCustom` 方法来自定义一个显示模式。这个方法要求传入一个参数，参数需要是 `IUICustomConfig` 对象，对象要求实现 `open` `close` `hide` `show` `update` 五个方法，我们来介绍一下如何做出一个自定义显示模式。

方法说明如下：

- `open` 方法会在一个 UI 打开时调用，例如默认的 `lastOnly` 模式其实就是在打开 UI 时将 UI 添加至栈末尾，然后隐藏在其之前的所有 UI
- `close` 方法会在一个 UI 关闭时调用，例如默认的 `lastOnly` 模式就会在这个时候把在传入 UI 之后的所有 UI 一并关闭
- `hide` 方法会在一个 UI 隐藏时调用，默认的 `lastOnly` 模式会在这个时候把 UI 隐藏显示
- `show` 方法会在一个 UI 显示时调用，默认的 `lastOnly` 模式会在这个时候把 UI 启用显示
- `update` 方法会在切换显示模式时调用，默认的 `lastOnly` 模式会在这个时候把最后一个 UI 显示，之前的隐藏

那么，假如我们要做一个反向 `lastOnly`，即只显示第一个，添加 UI 时添加至队列开头，我们可以这么写：

```ts
import { IUICustomConfig, IUIInstance } from '@motajs/system-ui';

const myCustomMode: IUICustomConfig = {
    open(ins: IUIInstance, stack: IUIInstance[]) {
        stack.forEach(v => v.hide()); // 隐藏当前所有 UI
        stack.unshift(ins); // 将要打开的 UI 添加至队列开头
        ins.show(); // 显示要打开的 UI
    },
    close(ins: IUIInstance, stack: IUIInstance[], index: number) {
        stack.splice(0, index + 1); // 关闭传入 UI 及其之前的所有内容
        stack[0]?.show(); // 显示第一个 UI
    },
    hide(ins: IUIInstance, stack: IUIInstance[], index: number) {
        ins.hide(); // 直接隐藏
    },
    show(ins: IUIInstance, stack: IUIInstance[], index: number) {
        ins.show(); // 直接显示
    },
    update(stack: IUIInstance[]) {
        stack.forEach(v => v.hide()); // 先隐藏所有 UI
        stack[0]?.show(); // 然后显示第一个 UI
    }
};

myController.showCustom(myCustomMode); // 应用自己的显示模式
```

## 设置 UI 背景

我们可以为 UI 设置背景组件，背景组件在 UI 打开时常亮。我们推荐使用此方法来为 UI 设置背景，因为它可以搭配 `keep` 防抖动来使用，避免出现 UI 闪烁的问题。现在，我们使用样板内置的 `Background` 背景组件作为例子，来展示如何设置背景：

```ts
import { Background } from '@user/client-modules';

// 传入背景组件作为背景，然后设置参数，使用 winskin.png 作为背景
myController.setBackground(Background, { winskin: 'winskin.png' });
```

默认情况下，当我们打开 UI 时，背景组件将会自动展示，不过我们也可以手动控制背景组件是否显示，它的优先级高于系统优先级：

```ts
myController.hideBackground(); // 隐藏背景组件，即使有 UI 已经打开，也不会显示背景
myController.showBackground(); // 显示背景组件，在 UI 已经打开的情况下展示，没有 UI 打开时不显示
```

## 背景维持防抖动

有时候，我们需要关闭当前 UI 然后立刻打开下一个 UI，例如使用一个道具时可能会打开一个新的页面，这时候会先关闭道具背包界面，再打开道具的页面，这时候可能会出现短暂的“背景丢失”，这是因为 UI 的挂载需要时间，在极短的时间内如果没有挂载上，那么就会在屏幕上什么都不显示，上面设置的背景 UI 也不会显示，会引起一次闪烁，观感很差。为了解决这个问题，我们提供了背景维持防抖动的功能，使用 `keep` 方法来实现：

```ts
const keep = myController.keep();
```

调用此方法后，在下一次 UI 全部关闭时，背景会暂时维持，直到有 UI 打开，也就是说它会维持一次 UI 背景不会关闭，下一次就失效了。这样的话，如果我们去使用一个打开页面的道具，就不会出现闪烁的问题了。不过，假如我们使用了一个没有打开页面的道具，会有什么表现？答案是背景一直显示着，用户就什么也干不了了，这显然不是我们希望的，因此 `keep` 函数的返回值提供了一些能力来让你关闭背景，它们包括：

```ts
// 推荐方法，使用 safelyUnload 安全地卸载背景，这样如果有 UI 已经打开，不会将其关闭
keep.safelyUnload();
// 不推荐方法，调用后立刻关闭所有 UI，不常用
keep.unload();
```

## 渲染系统的树结构

接下来我们来讲解一下渲染系统的一些工作原理。下面的部分由 `DeepSeek R1` 模型生成并稍作修改。

### 结构原理

想象一棵倒着生长的树：

- 根节点：相当于画布本身，是所有元素的起点
- 枝干节点：类似文件夹，可以包含其他元素
- 叶子节点：实际显示的内容，如图片、文字等

### 运作特点

- 层级管理：子元素永远在父元素的"内部"显示
- 自动排序：像叠扑克牌一样，后添加的元素默认盖在之前元素上方，不过也可以通过参数来调整顺序
- 智能裁剪：父元素就像相框，超出范围的内容自动隐藏

## 渲染系统的事件系统

### 事件传递三阶段

1. 收件扫描（捕获阶段）：从根部开始层层扫描，寻找可能接收事件的元素，类似快递分拣中心扫描包裹目的地
2. 精准投递（目标阶段）：找到实际触发事件的元素进行处理，就像快递员将包裹送到收件人手中
3. 回执确认（冒泡阶段）：处理结果沿着原路返回汇报，如同收件人签收后系统更新物流状态

将事件分为三个阶段，是为了让交互更加符合直觉，你也不想点击内层按钮的时候外层按钮也被触发吧）

### 特殊处理机制

- 紧急拦截：任何环节都可以标记"无需继续传递"
- 批量处理：多个事件自动合并减少处理次数
- 智能过滤：自动忽略不可见区域的事件

## 冒泡更新

### 工作原理

当某个元素发生变化时：自动通知直系父元素，父元素检查自身是否需要调整，继续向上传递直到根部，最终统一计算所有需要改变的位置，并在下一帧执行更新。

### 设计优势

- 精准定位：只更新受影响的部分画面
- 避免重复：多个子元素变化只需一次整体计算
- 顺序保障：始终从最深层开始逐层处理

## 懒更新机制

### 工作模式

1. 收集阶段：记录所有需要改变的内容（如颜色变化、文字修改）
2. 等待时机：一般是等待到下一帧
3. 批量处理：一次性完成所有修改

### 实际效益

- 性能优化：减少像频繁开关灯的资源浪费
- 流畅保障：避免连续小改动导致的画面闪烁
- 智能调度：优先处理用户可见区域的变化
