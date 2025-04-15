# TextContentParser API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 类描述

`TextContentParser` 是文字解析核心工具，用于处理文本排版、转义字符解析及动态样式管理。支持自动分词换行、图标嵌入和样式栈控制。

---

## 方法说明

### `parse`

```typescript
function parse(text: string, width: number): ITextContentRenderObject;
```

解析文本并生成渲染数据对象：

```typescript
interface ITextContentRenderObject {
    lineHeights: number[]; // 每行高度
    lineWidths: number[]; // 每行宽度
    data: ITextContentRenderable[]; // 渲染元素集合
}
```

---

## 转义字符语法说明

### 1. 颜色控制 `\r[color]`

-   **语法**：`\r[颜色值]`
-   **栈模式**：支持嵌套，用`\r`恢复上一级颜色
-   **颜色格式**：支持 CSS 颜色字符串

```typescript
// 示例：红→黄→红→默认
'\\r[red]危险！\\r[yellow]警告\\r恢复红色\\r默认';
```

### 2. 字号控制 `\c[size]`

-   **语法**：`\c[字号(px)]`
-   **栈模式**：用`\c`恢复上一级字号

```typescript
// 示例：24px→32px→24px
'普通\\c[24]标题\\c[32]超大标题\\c恢复';
```

### 3. 字体家族 `\g[family]`

-   **语法**：`\g[字体名称]`
-   **栈模式**：用`\g`恢复上一级字体

```typescript
'默认\\g[黑体]中文黑体\\g恢复默认';
```

### 4. 粗体切换 `\d`

-   **语法**：`\d`（开关模式）

```typescript
'正常\\d粗体\\d正常';
```

### 5. 斜体切换 `\e`

-   **语法**：`\e`（开关模式）

```typescript
'正常\\e斜体\\e正常';
```

### 6. 等待间隔 `\z[wait]`

-   **语法**：`\z[等待字符数]`
-   **计算规则**：`间隔时间 = 字符数 * 当前interval配置`

```typescript
'开始对话\\z[10]（暂停500ms）继续';
```

### 7. 图标嵌入 `\i[icon]`

-   **语法**：`\i[图标ID]`
-   **图标规范**：需预加载到资源管理器

```typescript
'攻击\\i[sword]造成伤害';
```

### 8. 表达式 `${}`

-   **语法**：与模板字符串语法一致，不过是在渲染的时候实时计算，而非字符串声明时计算

```typescript
'${core.status.hero.atk * 10}'; // 显示勇士攻击乘 10
'${core.status.hero.atk > 100 ? "高攻击" : "低攻击"}'; // 条件表达式
'${(() => { if (a > 10) return 100; else return 10; })()}'; // 嵌入函数
```

---

## 综合使用示例

### 战斗伤害提示

```typescript
const text =
    '\\r[#ff0000]\\c[24]\\d敌人\\i[monster]对你造成\\c[32]\\r[yellow]500\\c\\r伤害！\\z[5]\\d\\e（按空格跳过）';

const result = parser.parse(text, 400);

/* 解析结果：
[
  { type: 'text', color: '#ff0000', size:24, bold:true, text:'敌人' },
  { type: 'icon', id:'monster' },
  { type: 'text', color:'#ff0000', size:24, text:'对你造成' },
  { type: 'text', color:'yellow', size:32, text:'500' },
  { type: 'text', color:'#ff0000', size:24, text:'伤害！' },
  { type: 'wait', duration:250 }, // 假设 interval=50
  { type: 'text', bold:false, italic:true, text:'（按空格跳过）' }
]
*/
```

### 多语言混合排版

```typescript
const multiLangText =
    '\\g[Times New Roman]Hello\\g[宋体]你好\\i[globe]\\z[3]\\g切换为\\r[blue]Français';

// 效果：英文→中文+地球图标→等待→蓝色法文
```

---

## 注意事项

1. **转义字符格式**

    - 必须使用 **双反斜杠**（`\\`）表示转义
    - 错误示例：`\r[red]`（单反斜杠 `\r` 可能会被识别为换行）
    - 正确示例：`\\r[red]`

2. **栈操作规则**

    ```typescript
    // 颜色栈示例
    '默认\\r[red]红\\r[blue]蓝\\r恢复红\\r恢复默认';
    // 等效于：push(默认)→push(红)→push(蓝)→pop→pop
    ```
