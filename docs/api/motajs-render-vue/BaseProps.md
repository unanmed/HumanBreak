# BaseProps 接口文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 接口定义

```typescript
interface BaseProps {
    // 基础定位
    x?: number; // 横坐标（单位：像素）
    y?: number; // 纵坐标（单位：像素）
    anchorX?: number; // 横向锚点比例（0~1，默认 0）
    anchorY?: number; // 纵向锚点比例（0~1，默认 0）
    zIndex?: number; // 纵深层级（值越大越靠上）

    // 尺寸控制
    width?: number; // 元素宽度（单位：像素，默认 200）
    height?: number; // 元素高度（单位：像素，默认 200）

    // 渲染控制
    filter?: string; // CSS滤镜（如 "blur(5px)"）
    hd?: boolean; // 启用高清画布（默认 true）
    anti?: boolean; // 启用抗锯齿（默认 true）
    noanti?: boolean; // 强制禁用抗锯齿（优先级高于 anti）
    hidden?: boolean; // 隐藏元素（默认 false）

    // 变换与定位
    transform?: Transform; // 变换矩阵对象
    type?: RenderItemPosition; // 定位模式（"static" | "absolute"）
    cache?: boolean; // 启用缓存优化（根据不同元素的特性有不同的值，多数情况下使用默认配置即可达到最优性能）
    nocache?: boolean; // 强制禁用缓存（优先级高于 cache）
    fall?: boolean; // 继承父元素变换矩阵（默认 false），不建议使用此参数，可能很快就会被删除

    // 交互与样式
    id?: string; // 唯一标识符
    alpha?: number; // 不透明度（0~1，默认 1）
    composite?: GlobalCompositeOperation; // 混合模式（如 "lighter"）
    cursor?: string; // 鼠标悬停样式（如 "pointer"）
    noevent?: boolean; // 禁用交互事件（默认 false）

    // 简写属性
    loc?: ElementLocator /*
                            [x, y, width?, height?, anchorX?, anchorY?]
                            如果填写的话，两两一组要么都填要么都不填，也就是说元素数量需要是 2,4,6 个
                          */;
    anc?: ElementAnchor; // [anchorX, anchorY]，如果填写的话，两项必填
    scale?: ElementScale; // [scaleX, scaleY]，如果填写的话，两项必填
    rotate?: number; // 旋转弧度值（单位：弧度）
}
```

---

## 完整使用示例

```tsx
import { defineComponent } from 'vue';
import { Transform } from '@motajs/render-core';

// 注意，以下属性均可选，按照自己需要填写即可，不需要的可以不用填，简单需求一般只需要修改定位
// 而复杂需求可能需要填写更多的参数，但是基本不会出现所有参数都要填的场景
// 编写 UI 的流程参考深度指南中的 UI 编写
export const MyUI = defineComponent(() => {
    return () => (
        <sprite
            // 基础定位
            x={100}
            y={200}
            anchorX={0.5} // 中心锚点
            anchorY={0.5}
            zIndex={5} // 确保在最上层
            // 尺寸控制
            width={300}
            height={200}
            // 渲染控制
            filter="drop-shadow(5px 5px 5px rgba(0,0,0,0.5))"
            hd // 高清模式
            noanti // 强制关闭抗锯齿（像素风格）
            hidden={false} // 显示元素
            // 变换与定位
            transform={new Transform().translate(10, 20)}
            type="static" // 绝对定位
            nocache // 禁用缓存
            fall // 继承父变换
            // 交互与样式
            id="hero-sprite"
            alpha={0.8} // 80% 不透明
            composite="lighter" // 叠加混合模式
            cursor="move" // 拖动光标
            noevent={false} // 允许交互
            // 简写属性
            loc={[50, 60, 150, 100]} // x=50, y=60, width=150, height=100
            anc={[0.5, 1]} // 底部中心锚点
            scale={[1.2, 0.8]} // 横向拉伸 20%，纵向压缩 20%
            rotate={Math.PI / 4} // 旋转 45 度
        ></sprite>
    );
});
```

---

## 属性效果说明

| 属性组         | 关键效果                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| **基础定位**   | 元素将出现在 (100,200) 坐标，以中心点（锚点 0.5）为基准定位                |
| **尺寸控制**   | 元素尺寸固定为 300x200 像素                                                |
| **渲染控制**   | 应用阴影滤镜，高清画质，关闭抗锯齿实现像素风格                             |
| **变换与定位** | 附加额外平移变换，使用绝对定位模式，禁用缓存优化                           |
| **交互与样式** | 元素半透明，叠加混合模式，显示"move"光标，响应交互事件                     |
| **简写属性**   | 通过 loc 覆盖坐标和尺寸，anc 设置底部锚点，scale 实现拉伸/压缩，旋转 45 度 |

---

## 注意事项

1. **优先级规则**：
    - `noanti` > `anti`，`nocache` > `cache`
    - 显式属性（如 `x`）与简写属性（如 `loc` 中的 `x`）相比，谁最后被设置，就用谁的
2. **简写属性解析**：
    ```ts
    loc = [100, 200, 300, 200]; // → x=100, y=200, width=300, height=200
    anc = [0.5, 0]; // → anchorX=0.5, anchorY=0
    scale = [2]; // → scaleX=2, scaleY=2
    ```
3. **其他注意事项**
    - `transform.translate` 与 `x` `y` 和简写定位属性的 `x` `y` 完全等效，设置后者也会让 `transform` 的平移量改变
    - 如果不允许交互，那么光标也不会显示
    - 同 `zIndex` 下，后插入的元素会在上层，但是这也意味着如果是动态插入的元素（例如由于响应式更改而插入了一个新元素），会显示在后面代码的元素之上
4. **常见问题**
    - 参考 [指南](../../guide/ui-faq.md)
