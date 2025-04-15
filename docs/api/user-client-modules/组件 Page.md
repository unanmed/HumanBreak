# Page 分页组件 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 组件描述

分页组件用于将大量内容分割为多个独立页面展示，支持通过编程控制或用户交互进行页面切换。适用于存档界面、多步骤表单等场景。

---

## Props 属性说明

| 属性名         | 类型             | 默认值            | 描述                             |
| -------------- | ---------------- | ----------------- | -------------------------------- |
| `pages`        | `number`         | 必填              | 总页数                           |
| `loc`          | `ElementLocator` | 必填              | 页码组件定位配置（坐标系及位置） |
| `font`         | `Font`           | `Font.defaults()` | 页码文本字体配置（可选）         |
| `hideIfSingle` | `boolean`        | `false`           | 当总页数为 1 时是否隐藏页码组件  |

---

## Events 事件说明

| 事件名       | 参数类型         | 触发时机                        |
| ------------ | ---------------- | ------------------------------- |
| `pageChange` | `(page: number)` | 当前页码变化时触发（从 0 开始） |

---

## Slots 插槽说明

### `default`

接收当前页码（从 0 开始）并返回需要渲染的内容  
**参数**

-   `page: number` 当前页码索引（0-based）

---

## Exposed Methods 暴露方法

| 方法名       | 参数            | 返回值   | 描述                                                |
| ------------ | --------------- | -------- | --------------------------------------------------- |
| `changePage` | `page: number`  | `void`   | 跳转到指定页码（0-based，自动约束在有效范围内）     |
| `movePage`   | `delta: number` | `void`   | 基于当前页码进行偏移切换（如 +1 下一页，-1 上一页） |
| `now`        | -               | `number` | 获取当前页码索引（0-based）                         |

---

## 使用示例

### 基础用法 - 多页文本展示

```tsx
import { defineComponent } from 'vue';
import { Page, PageExpose } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    return () => (
        <Page pages={3} loc={[208, 208, 208, 208, 0.5, 0.5]}>
            {page => (
                <text
                    text={`第 ${page + 1} 页内容`}
                    loc={[104, 104, void 0, void 0, 0.5, 0.5]}
                />
            )}
        </Page>
    );
});
```

### 监听页面修改

```tsx
import { defineComponent, ref } from 'vue';
import { Page, PageExpose } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    // 示例数据
    const pages = [
        { content: '第一页内容' },
        { content: '第二页内容' },
        { content: '第三页内容' }
    ];

    // 分页组件引用
    const pageRef = ref<PageExpose>();

    // 页码变化回调
    const handlePageChange = (currentPage: number) => {
        // 可以使用参数获得当前页码，加一是因为页码是从 0 开始的
        console.log(`当前页码：${currentPage + 1}`);
        // 或者也可以使用 Page 组件的接口获得当前页码
        console.log(`当前页码：${pageRef.value!.now() + 1}`);
    };

    return () => (
        <Page
            pages={pages.length}
            loc={[208, 208, 208, 208, 0.5, 0.5]} // 游戏画面居中
            onPageChange={handlePageChange}
            ref={pageRef}
        >
            {page => <text text={pages[page].content} />}
        </Page>
    );
});
```

### 动态配置示例

```tsx
import { defineComponent, ref } from 'vue';
import { Page, PageExpose } from '@user/client-modules';

// 带统计面板的复杂分页
export const MyCom = defineComponent(() => {
    const dataPages = [
        /* 复杂数据结构 */
    ];

    // 暴露方法实现翻页逻辑
    const pageRef = ref<PageExpose>();
    const jumpToAnalysis = () => pageRef.value?.changePage(3); // 1-based

    return () => (
        <container>
            {/* 分页内容 */}
            <Page
                pages={dataPages.length}
                loc={[208, 208, 208, 208, 0.5, 0.5]}
                hideIfSingle // 如果只有一个页面，那么隐藏底部的页码显示
                ref={pageRef}
            >
                {page => (
                    <container>
                        {/* 这里面可以写一些复杂的渲染内容，或者单独写成一个组件，把页码作为参数传入 */}
                        <text text="渲染内容" />
                        <g-rect loc={[50, 50, 100, 50]} stroke />
                    </container>
                )}
            </Page>

            {/* 自定义跳转按钮 */}
            <text
                loc={[108, 180, void 0, void 0, 0.5, 1]} // 左右居中，靠下对齐
                onClick={jumpToAnalysis}
                text="跳转到分析页"
            />
        </container>
    );
});
```

### 边缘检测示例

```tsx
import { defineComponent, ref } from 'vue';

// 边界处理逻辑
export const MyCom = defineComponent(() => {
    const pageRef = ref<PageExpose>();

    // 自定义边界提示
    const handleEdge = () => {
        const current = pageRef.value?.now() ?? 0;
        const total = pageRef.value?.pages ?? 0;

        // 到达边界时提示（可以换成其他提示方式）
        if (current === 0) core.drawTip('已经是第一页');
        if (current === total - 1) core.drawTip('已经是最后一页');
    };

    return () => (
        <Page
            pages={8}
            ref={pageRef}
            onPageChange={handleEdge}
            loc={[208, 208, 208, 208, 0.5, 0.5]}
        >
            {page => <text text={`第${page}页`} />}
        </Page>
    );
});
```

---

## 注意事项

1. **自动约束**：切换页码时会自动约束在 `[0, pages-1]` 范围内
