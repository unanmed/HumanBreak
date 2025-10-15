# ListPage 列表页面组件 API 文档

本文档由 `DeepSeek` 生成并微调。

## 组件描述

列表页面组件结合了列表选择和内容展示功能，左侧显示可选项列表，右侧显示选中项的详细内容。适用于说明文档、设置界面、内容导航等场景。

---

## Props 属性说明

| 属性名             | 类型             | 默认值  | 描述                                           |
| ------------------ | ---------------- | ------- | ---------------------------------------------- |
| `loc`              | `ElementLocator` | 必填    | 组件整体位置和尺寸                             |
| `basis`            | `number`         | -       | 列表区域所占比例                               |
| `right`            | `boolean`        | `false` | 列表是否排列在右侧                             |
| `close`            | `boolean`        | `false` | 是否显示关闭按钮                               |
| `closeLoc`         | `ElementLocator` | -       | 关闭按钮的位置（相对于组件定位）               |
| 继承自 `ListProps` | -                | -       | [查看完整属性](./组件%20List#Props%20属性说明) |

---

## Events 事件说明

| 事件名            | 参数类型          | 触发时机                             |
| ----------------- | ----------------- | ------------------------------------ |
| `close`           | -                 | 当用户点击关闭按钮时触发             |
| `update`          | `(key: string)`   | 继承自 List - 当用户选中某一项时触发 |
| `update:selected` | `(value: string)` | 继承自 List - v-model 双向绑定事件   |

---

## Slots 插槽说明

### `default`

接收当前选中的 key 并返回对应的内容

**参数**

- `key: string` 当前选中的项 ID

### 具名插槽

以列表项 ID 为名称的具名插槽，用于定义每个选项对应的详细内容

---

## 使用示例

### 基础用法 - 说明文档界面

```tsx
import { defineComponent, ref } from 'vue';
import { ListPage } from '@user/client-modules';

export const HelpCom = defineComponent(() => {
    const selected = ref('intro');

    const helpTopics = [
        ['intro', '功能介绍'],
        ['usage', '使用方法'],
        ['settings', '设置说明'],
        ['faq', '常见问题']
    ];

    return () => (
        <ListPage
            list={helpTopics}
            v-model:selected={selected.value}
            loc={[208, 208, 400, 300, 0.5, 0.5]}
            basis={0.3}
        >
            {{
                // 使用具名插槽定义每个选项的内容
                intro: () => (
                    <container>
                        <text text="这里是最新版本的功能介绍..." loc={[0, 0]} />
                        <text text="欢迎使用本系统" loc={[0, 40]} />
                    </container>
                ),
                usage: () => (
                    <container>
                        <text text="使用方法指南" loc={[0, 0]} />
                        <text text="1. 点击左侧菜单选择功能" loc={[0, 40]} />
                        <text text="2. 在右侧查看详细说明" loc={[0, 80]} />
                    </container>
                ),
                settings: () => <text text="设置说明内容..." loc={[0, 0]} />,
                faq: () => <text text="常见问题解答..." loc={[0, 0]} />
            }}
        </ListPage>
    );
});
```

### 使用默认插槽

```tsx
import { defineComponent, ref } from 'vue';
import { ListPage } from '@user/client-modules';

export const SimpleCom = defineComponent(() => {
    const selected = ref('item1');

    const items = [
        ['item1', '选项一'],
        ['item2', '选项二'],
        ['item3', '选项三']
    ];

    return () => (
        <ListPage
            list={items}
            v-model:selected={selected.value}
            loc={[208, 208, 350, 250, 0.5, 0.5]}
        >
            {key => (
                <container>
                    <text
                        text={`当前选中: ${items.find(item => item[0] === key)?.[1]}`}
                        loc={[0, 0]}
                    />
                    <text text={`ID: ${key}`} loc={[0, 30]} />
                </container>
            )}
        </ListPage>
    );
});
```

### 带关闭按钮的弹窗

```tsx
import { defineComponent, ref } from 'vue';
import { ListPage } from '@user/client-modules';

export const ModalCom = defineComponent(props => {
    const selected = ref('weapon');

    const gameItems = [
        ['weapon', '武器'],
        ['armor', '防具'],
        ['potion', '药水'],
        ['material', '材料']
    ];

    const handleClose = () => {
        props.controller.close(props.instance);
        console.log('关闭物品栏');
    };

    return () => (
        <ListPage
            list={gameItems}
            v-model:selected={selected.value}
            loc={[208, 208, 400, 320, 0.5, 0.5]}
            close
            // 设定关闭按钮的位置
            closeLoc={[0, 300]}
            basis={0.35}
            onClose={handleClose}
        >
            {{
                weapon: () => (
                    <container>
                        <text text="武器列表" loc={[0, 0]} />
                        <text text="• 长剑" loc={[0, 30]} />
                        <text text="• 弓箭" loc={[0, 60]} />
                        <text text="• 法杖" loc={[0, 90]} />
                    </container>
                ),
                armor: () => <text text="防具装备信息..." loc={[0, 0]} />,
                potion: () => <text text="药水效果说明..." loc={[0, 0]} />,
                material: () => <text text="合成材料列表..." loc={[0, 0]} />
            }}
        </ListPage>
    );
});
```

### 列表在右侧的布局

```tsx
import { defineComponent, ref } from 'vue';
import { ListPage } from '@user/client-modules';

export const RightListCom = defineComponent(() => {
    const selected = ref('profile');

    const menuItems = [
        ['profile', '个人资料'],
        ['security', '安全设置'],
        ['privacy', '隐私设置'],
        ['notifications', '通知设置']
    ];

    return () => (
        <ListPage
            list={menuItems}
            v-model:selected={selected.value}
            loc={[240, 240, 500, 280, 0.5, 0.5]}
            right
            basis={0.4}
        >
            {key => (
                <container>
                    <text text="显示一些内容..." loc={[0, 60]} />
                    <text text="这里是详细的设置内容..." loc={[0, 0]} />
                </container>
            )}
        </ListPage>
    );
});
```

---

## 注意事项

1. **插槽使用**: 可以使用具名插槽（以列表项 ID 为名）或默认插槽来定义内容
2. **布局控制**: 通过 `basis` 控制列表区域比例，`right` 控制列表位置
3. **关闭功能**: 设置 `close` 为 `true` 显示关闭按钮，通过 `closeLoc` 自定义位置
4. **事件处理**: `close` 事件需要手动处理界面关闭逻辑
5. **内容更新**: 切换列表选项时，右侧内容会自动更新为对应插槽的内容
