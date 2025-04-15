# HeroKeyMover API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 类描述

`HeroKeyMover` 是勇士按键移动的核心控制器，负责将热键系统与勇士移动逻辑结合，实现基于键盘输入的连续移动控制。支持多方向优先级处理和移动中断机制。

---

## 属性说明

| 属性名       | 类型        | 描述                                     |
| ------------ | ----------- | ---------------------------------------- |
| `hotkey`     | `Hotkey`    | 关联的热键控制器实例                     |
| `mover`      | `HeroMover` | 勇士移动逻辑执行器                       |
| `scope`      | `symbol`    | 当前移动触发的作用域（默认使用主作用域） |
| `hotkeyData` | `MoveKey`   | 移动方向与热键的映射配置                 |

---

## 构造方法

```typescript
function constructor(
    hotkey: Hotkey,
    mover: HeroMover,
    config?: MoveKeyConfig
): HeroKeyMover;
```

-   **参数**
    -   `hotkey`: 已配置的热键控制器实例
    -   `mover`: 勇士移动逻辑实例
    -   `config`: 自定义方向键映射配置（可选）

**默认按键映射**：

```typescript
const map = {
    left: 'moveLeft',
    right: 'moveRight',
    up: 'moveUp',
    down: 'moveDown'
};
```

---

## 方法说明

### `setScope`

```typescript
function setScope(scope: symbol): void;
```

设置当前移动控制的作用域（用于多场景隔离）。

-   **参数**
    -   `scope`: 唯一作用域标识符

---

### `press`

```typescript
function press(dir: Dir): void;
```

触发指定方向的移动按键按下状态。

-   **参数**
    -   `dir`: 移动方向（`'left' | 'right' | 'up' | 'down'`）

---

### `release`

```typescript
function release(dir: Dir): void;
```

解除指定方向的移动按键按下状态。

-   **参数**
    -   `dir`: 要释放的移动方向

---

### `tryStartMove`

```typescript
function tryStartMove(): boolean;
```

尝试启动移动逻辑（自动根据当前方向键状态判断）。

-   **返回值**  
    `true` 表示移动成功启动，`false` 表示条件不满足

---

### `endMove`

```typescript
function endMove(): void;
```

立即终止当前移动过程。

---

### `destroy`

```typescript
function destroy(): void;
```

销毁控制器实例（自动解除所有事件监听）。

---

## 总使用示例

```typescript
import { gameKey, mainScope } from '@motajs/system-action';

// 初始化移动控制器
const keyMover = new HeroKeyMover(
    gameKey,
    heroMover,
    { left: 'moveLeft', right: 'moveRight' } // 自定义部分按键映射
);

// 设置允许触发的作用域
keyMover.setScope(mainScope);

// 销毁控制器
keyMover.destroy();
```

## 移动优先级机制

1. **最后按下优先**：当同时按下多个方向键时，以后按下的方向为准
2. **队列延续**：在移动过程中持续检测按键状态，自动延续移动队列
3. **作用域隔离**：只有当前作用域匹配时才会响应按键事件
