# Patch API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 类描述

`Patch` 类用于对旧版接口的函数实现进行动态重写，支持按模块类别批量修改目标类的原型方法。需配合 `PatchClass` 枚举指定要修改的模块类型。

---

## 泛型说明

-   `T extends PatchClass`: 表示要修改的模块类别（如 `PatchClass.Actions` 对应动作模块）

---

## 属性说明

| 属性名       | 类型 | 描述                         |
| ------------ | ---- | ---------------------------- |
| `patchClass` | `T`  | 只读，当前补丁关联的模块类别 |

---

## 构造方法

```typescript
function constructor<T extends PatchClass>(patchClass: T): Patch<T>;
```

-   **参数**
    -   `patchClass`: 指定要修改的模块类别（从 `PatchClass` 枚举中选择）

**示例**

```typescript
// 创建针对控制模块的补丁
const patch = new Patch(PatchClass.Control);
```

---

## 方法说明

### `add`

```typescript
function add<K extends keyof PatchList[T]>(
    key: K,
    patch: PatchList[T][K]
): void;
```

为目标模块添加函数补丁。

-   **参数**
    -   `key`: 要修改的函数名（需为目标模块原型存在的函数）
    -   `patch`: 新的函数实现

**示例**

```typescript
// 重写控制模块的 setFlag 方法
control.add('setFlag', function (this: Control, key, value) {
    console.log('执行重写后的 setFlag 代码');
    if (typeof value === 'number') {
        // 数字额外增加 100 点
        core.status.hero.flags[key] = value + 100;
    } else {
        core.status.hero.flags[key] = value;
    }
});
```

---

### `Patch.patchAll`

```typescript
function patchAll(): void;
```

**静态方法**：应用所有未执行的补丁修改。一般不需要自己调用，游戏启动阶段已经包含了此方法的调用。

---

### `Patch.patch`

```typescript
function patch(patch: Patch<PatchClass>): void;
```

**静态方法**：立即应用指定补丁实例的修改。一般不需要自己调用，游戏启动阶段已经包含了此方法的调用。

-   **参数**
    -   `patch`: 要应用的补丁实例

---

## 总使用示例

```typescript
import { Patch, PatchClass } from '@motajs/legacy-common';

// 新建函数，这个操作是必要的，我们不能直接在顶层使用这个接口
export function patchMyFunctions() {
    // 创建 Patch 实例，参数表示这个 Patch 示例要重写哪个文件中的函数
    // 如果需要复写两个文件，那么就需要创建两个实例
    const patch = new Patch(PatchClass.Control);

    // 使用 add 函数来重写，第一个参数会有自动补全
    // 如果要重写的函数以下划线开头，可能会有报错
    // 这时候需要去 types/declaration 中对应的文件中添加声明
    patch.add('getFlag', (name, defaultValue) => {
        // 重写 getFlag，如果变量是数字，那么 +100 后返回
        const value = core.status?.hero?.flags[name] ?? defaultValue;
        return typeof value === 'number' ? value + 100 : value;
    });
}
```
