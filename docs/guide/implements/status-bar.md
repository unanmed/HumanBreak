# 修改状态栏显示

在 `packages-user/client-modules/src/render/ui/statusBar.tsx` 中编写，内部包含两个组件 `LeftStatusBar` 和 `RightStatusBar`，分别代表左侧状态栏和右侧状态栏。

在编写完 UI 之后，还需要在 `packages-user/client-modules/src/render/ui/main.tsx` 中传入必要的参数。

下面以添加一个自定义 `flag` 的显示为例说明如何新增。

## 添加属性声明

首先在 `statusBar.tsx` 中声明：

```tsx
// 这个是文件中自带的接口声明，直接在原有声明的基础上添加即可
interface ILeftHeroStatus {
    // ... 原有声明

    /**
     * 自己添加的声明，这里使用这种 jsDoc 注释可以在自动补全中直接查看到。
     * 自定义 flag 为数字类型。
     */
    myFlag: number; // [!code ++]
}
```

## 添加显示

然后在 `LeftStatusBar` 中添加此项的显示：

```tsx {9}
export const LeftStatusBar = defineComponent<StatusBarProps<ILeftHeroStatus>>(
    p => {
        // ... 原有组件 setup 内容
        return () => (
            <container>
                {/* 原有组件内容 */}

                {/* 然后编写一个 text 标签即可显示，位置可以用 loc 参数指定，字体可以用 font 参数指定 */}
                <text text={s.myFlag.toString()} />
            </container>;
        );
    }
);
```

## 传入属性值

在 `main.tsx` 中传入自定义 `flag`。首先找到 `//#region 状态更新` 分段，在其上方有 `leftStatus` 的定义，此时它会报错，是因为你在 `ILeftHeroStatus` 中定义了 `myFlag`，而此处没有定义其初始值，为其赋初始值 0 即可：

```tsx
const leftStatus: ILeftHeroStatus = reactive({
    // ...原有定义

    // 然后添加自己的定义，注意不要忘记了在前一个属性后面加逗号
    myFlag: 0 // [!code ++]
});
```

在 `//#region` 分段下方找到 `updateStatus` 函数，它内部会有一系列 `leftStatus` 的赋值：

```tsx
leftStatus.atk = getHeroStatusOn('atk');
leftStatus.hp = getHeroStatusOn('hp');
leftStatus.def = getHeroStatusOn('def');
// ...其他赋值
```

我们在其后面添加一个 `myFlag` 的赋值即可：

```tsx
// 将 flags.myFlag 赋值到 leftStatus.myFlag
leftStatus.myFlag = flags.myFlag;
```

这样，我们就成功新增了一个新的显示项。这一系列操作虽然比 2.x 更复杂，但是其性能表现、规范程度都要更高，你需要习惯这种代码编写风格。

## 拓展-可交互按钮

相比于 2.x，2.B 在交互上会方便地多，如果要添加一个可交互的按钮，我们只需要给标签加上 `onClick` 属性，就可以在点击时执行函数了：

```tsx {7-13}
import { IActionEvent } from '@motajs/render';

export const LeftStatusBar = defineComponent<StatusBarProps<ILeftHeroStatus>>(
    p => {
        // ... 原有组件 setup 内容

        const clickText = (ev: IActionEvent) => {
            // 这里编写点击按钮后的效果，例如切换技能
            toggleSkill();
            // 参数 ev 还包含一些属性和方法，例如可以调用 stopPropagation 终止冒泡传播
            // 这个调用如果不理解不建议随便用，参考 UI 系统的教学文档来理解这句话的含义
            ev.stopPropagation();
        };

        return () => (
            <container>
                {/* 原有组件内容 */}
                <text
                    text={s.myFlag.toString()}
                    // 当用户点击时执行 clickText // [!code ++]
                    onClick={clickText} // [!code ++]
                    // 鼠标样式变成小手 // [!code ++]
                    cursor="pointer" // [!code ++]
                />
            </container>;
        );
    }
);
```

## 拓展-了解 UI 编写的基本逻辑

参考[此文档](./ui.md)，此文档将会教你如何从头开始编写一个 UI，并解释 UI 运行与渲染的基本逻辑。
