# 新增按键

在 2.B 中新增按键很方便，且可以为你的 UI 单独配置按键信息，玩家也可以修改快捷键设置。

下面以设置一个全局的切换技能按键为例，展示如何新增一个按键。

:::warning
按键系统在未来可能会有小幅重构，但逻辑不会大幅变动。
:::

## 定义按键信息

我们打开 `packages-user/client-modules/src/action/hotkey.ts`，找到 `//#region 按键实现` 分段，在分段前可以看到一个 `// #endregion`，然后我们在上面的一系列 `register` 后面新增：

```ts {6-17}
gameKey
    .group(/* ... */)
    .register({})
    // ... 原有内容，注意原本内容最后的分号别忘了删除

    //#region 主动技能
    // 分组，这样既可以方便管理，也可以让玩家设置按键时直接根据分组设置
    .group('skill', '主动技能')
    // 注册按键信息
    .register({
        // 按键的 id
        id: '@skill_doubleAttack',
        // 按键显示的名称
        name: '二倍斩',
        // 默认按键，数字 1（非小键盘）
        defaults: KeyCode.Digit1
    });
```

此时我们打开游戏，按下 `Esc`，选择 `系统设置->操作设置->自定义按键`，就可以看到我们新增的按键信息了，不过现在按它没有任何作用，因为我们只是定义了按键，还没有编写它的触发效果。

## 实现按键效果

我们回到 `hotkey.ts`，翻到文件最后，在最后几行的上面会有一系列 `realize`，这就是实现按键操作的地方，我们在后面新增一个 `@skill_doubleAttack` 的实现：

```ts {6-10}
gameKey
    .when(/* ... */)
    .realize(/* ... */)
    // ... 原有内容

    // 实现刚刚定义的按键
    .realize('@skill_doubleAttack', () => {
        // 切换技能
        toggleSkill();
    });
```

## 拓展-添加辅助按键

如果我们需要一个按键默认情况下需要按下 `Ctrl` 时才能触发，例如 `Ctrl+A`，我们可以这么写：

```ts
gameKey.register({
    id: '@skill_doubleAttack',
    name: '二倍斩',
    defaults: KeyCode.Digit1,
    // 设置 ctrl 属性为 true 即可，包括 alt 和 shift 也是一样
    ctrl: true // [!code ++]
});
```

## 拓展-在 UI 内实现按键

有时候，我们需要在一个 UI 界面中提供按键操作支持，样板提供了专门的接口来实现这一点。

### 定义按键信息

与[这一节](#定义按键信息)相同，直接定义按键信息即可：

```ts
gameKey
    //#region 自定义UI
    .group('@ui_myUI', '自定义UI')
    .register({
        id: '@myUI_key',
        name: '自定义UI',
        // 默认使用 H 键
        defaults: KeyCode.KeyH
    });
```

### 在 UI 内实现按键操作

按键实现方式略有变动，我们需要使用 `useKey` 接口来实现按键。假设我们在 `packages-user/client-modules/src/render/ui` 文件夹下编写 UI，那么可以这么写：

```tsx {7-13}
// 引入 useKey 接口
// 文件在 packages-user/client-modules/src/render/use.ts，注意路径关系
import { useKey } from '../use'; // [!code ++]

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(props => {
    // 调用 useKey
    const [key] = useKey();
    // 直接开始实现，本例按键效果为显示一个提示
    key.realize('@myUI_key', () => {
        // 调用 drawTip 显示提示
        core.drawTip('这是一个提示');
    });

    return () => <container></container>;
});
```

### 通用按键复用

我们会有一些通用按键，例如确认、关闭，这些按键我们不希望每个 UI 或场景都定义一遍，一来写代码不方便，二来玩家如果要自定义的话需要每个界面都设置一遍，很麻烦。此时我们建议按键复用。与一般的按键一致，我们直接实现 `exit` `confirm` 等按键即可，不需额外操作：

```tsx {12-21}
import { useKey } from '../use';

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(props => {
    // 调用 useKey
    const [key] = useKey();
    // 直接开始实现，本例按键效果为显示一个提示
    key.realize('@myUI_key', () => {
        // 调用 drawTip 显示提示
        core.drawTip('这是一个提示');
    })
        // 关闭操作
        .realize('exit', () => {
            // 调用关闭函数
            props.controller.close(props.instance);
        })
        // 确认操作
        .realize('confirm', () => {
            // 弹出提示说明按下了确认键
            core.drawTip('按下了确认键！');
        });

    return () => <container></container>;
});
```

实际上，你甚至可以在一个 UI 中实现另一个 UI 定义的按键，虽然这么做非常离谱。

## 拓展-单功能多按键

在游戏中可以发现退出、确认等功能可以设定多个按键，为了实现这种按键，我们只需要在定义按键时加上 `_num` 后缀即可，例如：

```ts {4,10,16}
gameKey
    .register({
        // 添加 _1 后缀
        id: '@skill_doubleAttack_1',
        name: '二倍斩',
        defaults: KeyCode.Digit1
    })
    .register({
        // 添加 _2 后缀
        id: '@skill_doubleAttack_2',
        name: '二倍斩',
        defaults: KeyCode.Digit2
    })
    .register({
        // 添加 _3 后缀
        id: '@skill_doubleAttack_3',
        name: '二倍斩',
        defaults: KeyCode.Digit3
    });
```

这样，在自定义按键界面就会显示为可以自定义三个按键。而在实现时，我们不需要添加后缀：

```ts {2}
// 这里不需要添加后缀！
gameKey.realize('@skill_doubleAttack', () => {
    toggleSkill();
});
```

或者，添加后缀的话，会精确匹配到对应后缀的按键：

```ts {2}
// 只有按下 @skill_doubleAttack_1 对应的按键才会触发，而 @skill_doubleAttack_2 等不会触发！
gameKey.realize('@skill_doubleAttack_1', () => {
    toggleSkill();
});
```

## 拓展-按下时触发

默认情况下，我们实现的按键都是在按键抬起时触发，如果我们需要按下时触发，我们需要在调用 `realize` 函数时额外传入一个配置项：

:::code-group

```ts [down]
gameKey.realize(
    '@skill_doubleAttack',
    () => {
        toggleSkill();
    },
    // 按下时单次触发
    { type: 'down' } // [!code ++]
);
```

```ts [down-repeat]
gameKey.realize(
    '@skill_doubleAttack',
    () => {
        toggleSkill();
    },
    // 按下时持续触发
    { type: 'down-repeat' } // [!code ++]
);
```

```ts [down-throttle]
gameKey.realize(
    '@skill_doubleAttack',
    () => {
        toggleSkill();
    },
    // 按下时节流触发，节流间隔为 100ms
    { type: 'down-throttle', throttle: 100 } // [!code ++]
);
```

```ts [down-timeout]
gameKey.realize(
    '@skill_doubleAttack',
    () => {
        toggleSkill();
    },
    // 按下时延迟触发，延迟 1000ms
    { type: 'down-timeout', timeout: 1000 } // [!code ++]
);
```

:::

这里的 `type` 可以填这些值：

- `up`: 抬起时触发，默认就是它。
- `down`: 按下时触发，只触发一次。
- `down-repeat`: 按下时触发，且会重复触发。这一操作可能会与键盘或系统设置有关，一般来说首次触发后会有 `500ms` 的延时，然后每帧触发一次。
- `down-throttle`: 按下时节流触发，在 `down-repeat` 的基础上，每隔一段时间才会触发一次，例如可以设定为 `100ms` 触发一次。
- `down-timeout`: 按下后延迟触发，会在按下后延迟一段时间触发。

## 拓展-样板为什么不会在 UI 中触发全局按键？

这是按键系统最实用的功能之一，这个功能允许我们在 UI 中不会触发全局按键，例如在怪物手册中不会触发打开楼传，也不会触发打开系统菜单。你可能会好奇，我们在上面的讲述中似乎并没有哪一行执行了这一操作，那么是如何实现的呢？

实际上，按键系统内部有一个栈，而我们调用 `useKey` 时就会自动创建一个新的作用域，同时在关闭 UI 时释放作用域。这样的话，我们在打开 UI 时，按键实现就会遵循新创建的作用域，关闭时自动回到上一层，这就实现了上述功能。

## 拓展-API 参考

[Hotkey API 文档](../../api/motajs-system-action/Hotkey.md)
