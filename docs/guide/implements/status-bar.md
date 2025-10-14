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

## 拓展-新增勇士属性

在上例中，展示了如何显示一个自定义的 `flag`，但有时候我们需要自定义一个勇士属性，例如攻速、减伤等，这些属性可能会受到全局 `buff` 的影响，这时候使用 `flag` 就不方便，我们推荐使用自定义属性的方式。

### 定义属性

我们打开编辑器的全塔属性界面，点击左侧上方的编辑表格按钮，向下滑动找到 `勇士攻击` 等勇士属性（约第 250 行）的位置，仿照这些属性增加一个新的属性，例如添加攻速，取属性名为 `atkSpeed`：

```js
{
    "mana": {
        "_leaf": true,
        "_type": "textarea",
        "_data": "初始魔力"
    },
    "atkSpeed": { // [!code ++]
        "_leaf": true, // [!code ++]
        "_type": "textarea", // [!code ++]
        "_data": "初始攻速" // [!code ++]
    }, // [!code ++]
    "atk": {
        "_leaf": true,
        "_type": "textarea",
        "_data": "初始攻击"
    },
}
```

保存后刷新页面，再次进入全塔属性界面，可以看到在勇士属性部分多了一项 `初始攻速`，我们可以输入初始值，例如设为初始值 `1`，表示攻速为 `100%`。

接下来回到 `vscode`，打开文件 `src/types/declaration/status.d.ts`，按下 `ctrl+F` 搜索 `interface HeroStatus`，在其中新增一个属性值 `atkSpeed`：

```ts
interface HeroStatus {
    // ... 原有内容

    /** 勇士攻速 */
    atkSpeed: number; // [!code ++]

    // ... 原有内容
}
```

### 容错处理

为了保证属性添加前的存档还能正常加载，我们需要容错处理，打开编辑器，进入脚本编辑界面，编辑 `重置游戏` 这一脚本编辑项。我们在函数的最后进行容错处理：

```js
function () {
    // ... 原有内容

    // 容错处理
    core.status.hero.atkSpeed ??= 1; // [!code ++]
}
```

由于样板编辑器的限制，上述代码会有语法报错，但实际上不会有任何问题，关闭语法检查再保存即可。

### 状态栏显示

与本文章最初的示例基本一致，只有传入属性值时需要略加变动，其他操作包括属性定义等不改变，将赋值行为改为 `getHeroStatusOn`：

```ts
leftStatus.atk = getHeroStatusOn('atk');
leftStatus.hp = getHeroStatusOn('hp');
leftStatus.def = getHeroStatusOn('def');
// ... 原有内容

// 改为 getHeroStatusOn
leftStatus.atkSpeed = getHeroStatusOn('atkSpeed');
```

状态栏组件中：

```tsx
// 使用模板字符串，显示百分比
<text text={`${s.atkSpeed * 100}%`} />
```

### 属性实现

为了实现勇士属性，我们需要修改伤害计算逻辑。我们打开 `packages-user/data-state/src/enemy/damage.ts`，翻到最后找到 `calDamageWith` 函数，在它上面有一个名为 `realStatus` 的数组，我们在这里新增一项 `atkSpeed`：

```ts
/**
 * 计算伤害时会用到的勇士属性，攻击防御，其余的不会有buff加成，直接从core.status.hero取
 */
const realStatus: (keyof HeroStatus)[] = [
    'atk',
    'def',
    // ... 原有内容

    // 新增 atkSpeed 属性
    'atkSpeed' // [!code ++]
];
```

然后在 `calDamageWith` 伤害计算中修改伤害计算，给勇士每回合造成的伤害乘以攻速，注意放置的位置：

```ts
export function calDamageWith(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): number {
    // ... 原有逻辑

    // 乘以攻速
    heroPerDamage *= hero.atkSpeed ?? 1;

    // ... 原有逻辑
}
```

## 拓展-了解 UI 编写的基本逻辑

参考[此文档](../ui/ui.md)，此文档将会教你如何从头开始编写一个 UI，并解释 UI 运行与渲染的基本逻辑。
