# TextContent 文本组件 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 核心特性

-   **自动布局**：根据宽度自动换行
-   **样式控制**：支持动态修改字体/颜色/描边
-   **打字机效果**：逐字显示支持
-   **动态高度**：自适应或固定高度模式

---

## Props 属性说明

| 属性名            | 类型          | 默认值            | 描述                           |
| ----------------- | ------------- | ----------------- | ------------------------------ |
| `text`            | `string`      | -                 | 显示文本（支持转义字符）       |
| `width`           | `number`      | 必填              | 文本区域宽度（像素）           |
| `fill`            | `boolean`     | `true`            | 是否对文字填充                 |
| `stroke`          | `boolean`     | `false`           | 是否对文字描边                 |
| `font`            | `Font`        | 系统默认字体      | 字体配置对象                   |
| `lineHeight`      | `number`      | `0`               | 行间距（像素）                 |
| `interval`        | `number`      | `50`              | 打字机字符间隔（ms）           |
| `autoHeight`      | `boolean`     | `false`           | 是否根据内容自动调整高度       |
| `fillStyle`       | `CanvasStyle` | `#fff`            | 文字填充颜色                   |
| `strokeStyle`     | `CanvasStyle` | `#000`            | 文字描边颜色                   |
| `strokeWidth`     | `number`      | `1`               | 描边宽度                       |
| `textAlign`       | `TextAlign`   | `TextAlign.Left`  | 文字对齐方式                   |
| `wordBreak`       | `WordBreak`   | `WordBreak.Space` | 文本分词原则，将会影响换行表现 |
| `breakChars`      | `string`      | -                 | 会被分词规则识别的分词字符     |
| `ignoreLineStart` | `string`      | -                 | 不允许出现在行首的字符         |
| `ignoreLineEnd`   | `string`      | -                 | 不允许出现在行尾的字符         |

---

## 事件说明

| 事件名         | 参数             | 触发时机           |
| -------------- | ---------------- | ------------------ |
| `typeStart`    | -                | 开始逐字显示时     |
| `typeEnd`      | -                | 全部文字显示完成时 |
| `updateHeight` | `height: number` | 文本高度变化时     |

---

## Exposed Methods 暴露方法

| 方法名      | 参数 | 返回值   | 描述                         |
| ----------- | ---- | -------- | ---------------------------- |
| `retype`    | -    | `void`   | 从头开始重新打字             |
| `showAll`   | -    | `void`   | 立刻结束打字机，显示所有文字 |
| `getHeight` | -    | `number` | 获得当前文本的高度           |

---

## 使用示例

### 基础用法 - 对话文本

```tsx
import { defineComponent } from 'vue';
import { TextContent } from '@user/client-modules';
import { Font } from '@motajs/render';

export const MyCom = defineComponent(() => {
    return () => (
        <TextContent
            text="这是基础文本内容，会自动换行排版"
            width={200} // 最大宽度，达到这个宽度会自动换行
            font={new Font('宋体', 18)}
            fillStyle="#333333" // 黑色字体
            onTypeEnd={() => console.log('显示完成')} // 打字机结束后执行
        />
    );
});
```

### 自定义样式 + 描边效果

```tsx
import { defineComponent } from 'vue';
import { TextContent } from '@user/client-modules';
import { Font } from '@motajs/render';

export const MyCom = defineComponent(() => {
    return () => (
        <TextContent
            text="\\r[#FFD700]金色描边文字"
            width={300}
            font={new Font('黑体', 24)}
            stroke // 设为填充+描边格式，如果仅描边需要设置 fill={false}
            strokeStyle="#8B4513" // 描边颜色
            strokeWidth={2} // 描边宽度
            lineHeight={8} // 行间距，8 像素
            interval={30} // 打字机间隔
        />
    );
});
```

### 动态内容更新

```tsx
import { defineComponent, ref } from 'vue';
import { TextContent } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    const dynamicText = ref('初始内容');

    setTimeout(() => {
        dynamicText.value = '更新后的内容\\z[5]带暂停效果';
    }, 2000);

    return () => (
        <TextContent
            text={dynamicText.value}
            width={500}
            autoHeight
            onUpdateHeight={h => console.log('当前高度:', h)} // 当高度发生变化时触发
        />
    );
});
```

### 禁用动画效果

```tsx
import { defineComponent } from 'vue';
import { TextContent } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    return () => (
        <TextContent
            text="立即显示所有内容"
            width={350}
            interval={0} // 设置为0禁用逐字效果
            showAll // 立即显示全部
            fillStyle="rgba(0,128,0,0.8)"
        />
    );
});
```

### 多语言复杂排版

```tsx
import { defineComponent } from 'vue';
import { TextContent } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    const complexText =
        '\\g[Times New Roman]Hello\\g[宋体] 你好 \\i[flag]\\n' +
        '\\r[#FF5733]Multi\\r[#3498db]-\\r[#2ECC71]Color\\r\\n' +
        '\\c[18]Small\\c[24]Size\\c[30]Changes';

    return () => (
        <TextContent
            text={complexText}
            width={600}
            interval={25}
            onTypeStart={() => console.log('开始渲染复杂文本')}
        />
    );
});
```

---

## 转义字符示例

```tsx
// 颜色/字体/图标综合使用
const styledText =
    '\\r[#FF0000]警告！\\g[方正粗宋]\\c[24]' +
    '\\i[warning_icon]发现异常\\z[10]\\n' +
    '请立即处理\\r\\g\\c';

<TextContent text={styledText} width={450} interval={40} />;
```

转义字符具体用法参考 [TextContentParser](./TextContentParser.md#转义字符语法说明)
