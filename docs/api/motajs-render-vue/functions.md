# use.ts API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 函数说明

### `onTick`

```typescript
function onTick(fn: (time: number) => void): void;
```

**功能**：注册每帧执行的回调（自动管理生命周期）  
**推荐使用场景**：替代 `ticker`  
**参数说明**：

-   `fn`: 接收当前时间戳的帧回调函数  
    **示例**：

```typescript
// Vue 组件中
onTick(time => {
    console.log('当前帧时间:', time);
});
```

---

### `useAnimation`

```typescript
function useAnimation(): [Animation];
```

**功能**：创建动画实例（自动销毁资源）  
**返回值**：包含动画实例的元组  
**推荐使用场景**：替代直接 `new Animation()`  
**示例**：

```typescript
const [anim] = useAnimation();
anim.time(1000).move(100, 200);
```

---

### `useTransition`

```typescript
function useTransition(): [Transition];
```

**功能**：创建渐变实例（自动销毁资源）  
**返回值**：包含渐变实例的元组  
**推荐使用场景**：替代直接 `new Transition()`  
**示例**：

```typescript
const [transition] = useTransition();
transition.value.x = 10;
transition.time(500);
transition.value.x = 100;
```

---

### `useKey`

```typescript
function useKey(noScope?: boolean): [Hotkey, symbol];
```

**功能**：管理按键作用域（自动注销绑定）  
**参数说明**：

-   `noScope`: 是否使用全局作用域（默认创建新作用域）
    **返回值**：元组 [热键实例, 作用域标识]  
    **推荐使用场景**：替代直接操作全局热键实例  
    **示例**：

```typescript
const [hotkey, scope] = useKey();
hotkey.realize('mykey_id', () => console.log('mykey_id emitted.'));
```

---

### `onEvent`

```typescript
function onEvent<
    T extends ERenderItemEvent,
    K extends EventEmitter.EventNames<T>
>(
    item: RenderItem<T>,
    key: K,
    listener: EventEmitter.EventListener<T, K>
): void;
```

**功能**：自动管理事件监听生命周期  
**推荐使用场景**：替代直接 `item.on()` + 手动注销  
**示例**：

```typescript
onEvent(sprite, 'click', event => {
    console.log('元素被点击', event);
});
```

---

## 总使用示例

```tsx
import { defineComponent } from 'vue';
import { useAnimation, onTick, useKey } from '@motajs/render-vue';

export const MyComponent = defineComponent(() => {
    // 动画控制
    const [anim] = useAnimation();
    anim.time(1000).rotate(Math.PI);

    // 帧循环
    onTick(time => {
        console.log('当前游戏运行时间:', time);
    });

    // 按键控制
    const [hotkey, scope] = useKey();
    hotkey.realize('mykey_id', () => console.log('mykey_id emitted.'));

    return () => <sprite />;
});
```

---

## 注意事项

1. **资源管理**：所有通过这些接口创建的资源（动画/渐变/事件）都会在组件卸载时自动销毁
2. **内存安全**：使用原生接口可能导致内存泄漏，这些封装接口确保：
    - 自动注销事件监听
    - 自动停止动画/渐变
    - 自动清理按键绑定
3. **类型安全**：所有接口均包含完整的类型推断（如 `onEvent` 的事件类型检查）
4. **框架适配**：专为 Vue3 组合式 API 设计，不可用于其他框架环境
