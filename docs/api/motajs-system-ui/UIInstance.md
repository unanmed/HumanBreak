# UIInstance API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

```mermaid
graph LR
    UIInstance --> IUIInstance
```

_实现 `IUIInstance` 接口_

## 类描述

`UIInstance` 表示通过 `GameUI` 模板创建的具体 UI 实例，用于管理单个 UI 实例的状态和数据绑定。实现了 `IUIInstance` 接口。

---

## 属性说明

| 属性名       | 类型         | 描述                                                     |
| ------------ | ------------ | -------------------------------------------------------- |
| `key`        | `number`     | 只读，实例的唯一标识（用于 Vue 的 `key` 属性）           |
| `ui`         | `IGameUI<C>` | 只读，关联的 UI 配置实例（即创建该实例的 `GameUI` 模板） |
| `vBind`      | `UIProps<C>` | 只读，传递给 UI 组件的响应式 Props 对象                  |
| `hidden`     | `boolean`    | 当前实例是否处于隐藏状态                                 |
| `alwaysShow` | `boolean`    | 是否强制保持显示（不受显示模式影响）                     |

---

## 构造方法

```typescript
function constructor(
    ui: IGameUI<C>,
    vBind: UIProps<C>,
    alwaysShow: boolean = false
): UIInstance;
```

-   **参数**
    -   `ui`: 关联的 `GameUI` 配置实例
    -   `vBind`: 初始化的组件 Props 对象
    -   `alwaysShow`: 是否强制保持显示（默认 `false`）

**注意事项**：一般不需要手动创建 `UIInstance` 实例，请使用 [`UIController.open`](./UIController.md#open) 打开 UI 并创建实例。

---

## 方法说明

### `setVBind`

```typescript
function setVBind(data: Partial<Props<C>>, merge?: boolean): void;
```

更新组件的响应式 Props。

-   **参数**
    -   `data`: 需要更新的数据（部分 Props）
    -   `merge`: 是否与现有数据合并（默认 `true`），若为 `false` 则完全覆盖

**示例**

```typescript
// 合并更新音量值
instance.setVBind({ volume: 60 });

// 覆盖所有 Props
instance.setVBind({ theme: 'dark' }, false);
```

---

### `hide`

```typescript
function hide(): void;
```

控制实例的显示状态（直接操作 `hidden` 属性）。

**示例**

```typescript
instance.hide(); // 隐藏 UI
setTimeout(() => instance.show(), 1000); // 1 秒后显示
```

---

### `show`

```typescript
function show(): void;
```

控制实例的显示状态（直接操作 `hidden` 属性）。

**示例**

```typescript
instance.show(); // 隐藏 UI
setTimeout(() => instance.show(), 1000); // 1 秒后显示
```

---

## 总使用示例

```typescript
import { myController, MyUI } from './myUI';

const myIns = myController.open(MyUI, { title: '警告' });

// 动态更新 props
myIns.setVBind({ title: '错误' });

// 设置显示状态
myIns.show();
```
