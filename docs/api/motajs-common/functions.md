# @motajs/common 函数

## `sleep`

```ts
function sleep(time: number): Promise<void>;
```

#### 描述

创建一个等待指定时长的异步。

#### 参数

-   `time`: 等待时长

#### 使用示例

```ts
async function myFunc() {
    await sleep(1000);
    // 这后面的内容会在 1 秒之后执行
}
```
