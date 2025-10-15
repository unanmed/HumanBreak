# 主动技能

在数据端新增一个文件定义技能开启与关闭的行为，然后在数据端处理录像，最后处理交互。

对于键盘，在 `packages-user/client-modules/src/action/hotkey.ts` 中自定义技能按键，并在此处实现。

对于触屏和鼠标，在 `packages-user/client-modules/src/render/ui/statusBar.tsx` 中提供技能按钮。

下面以技能“二倍斩”为例，展示如何实现主动技能。

## 技能开启关闭行为

在 `packages-user/data-state/src/mechainism` 文件夹下新增一个文件 `skill.ts`，然后打开同一文件夹下的 `index.ts`，写入 `export * from './skill.ts';`。回到 `skill.ts`，开始编写技能的开启与关闭行为。

由于二倍斩技能本质上是修改战斗函数，因此我们只需要一个变量来存储当前是否开启了技能即可。因此写出如下内容：

```ts
/** 二倍斩技能是否已经开启 */
let skill1 = false;

/** 开启二倍斩技能 */
export function enableSkill1() {
    // 将变量设为 true
    skill1 = true;
    // 更新状态栏
    core.updateStatusBar();
}

/** 关闭二倍斩技能 */
export function disableSkill1() {
    skill1 = false;
    core.updateStatusBar();
}

/** 获取二倍斩技能是否已经开启 */
export function getSkill1Enabled() {
    return skill1;
}

/** 切换二倍斩技能，如果开启则关闭，否则开启 */
export function toggleSkill1() {
    if (skill1) disableSkill1();
    else enableSkill1();
}
```

## 修改伤害计算

打开 `packages-user/data-state/src/enemy/damage.ts`，在最后找到 `calDamageWith` 函数，在里面修改勇士的 `heroPerDamage` 即可：

```ts {12-14}
// 文件开头引入刚刚编写的 skill.ts，可以使用自动补全自动引入
import { getSkill1Enabled } from '../machanism/skill'; // [!code ++]

export function calDamageWith(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): number | null {
    // ... 原有内容

    // 在特定位置将勇士伤害乘以 2
    // 注意需要再回合计算前乘，不然没有效果
    if (getSkill1Enabled()) {
        heroPerDamage *= 2;
    }

    // ... 原有内容
}
```

## 录像处理

录像处理其实很简单，我们只需要简单修改我们刚刚编写的几个函数，并注册一个新录像即可。

我们先在 `skill.ts` 中编写一个 `createSkill` 函数，注册录像行为：

```ts
export function createSkill() {
    // 样板接口，注册录像行为
    core.registerReplayAction('skill1', action => {
        // action 可能是 skill1:1 或者 skill1:0
        // 前者表示开启技能，后者表示关闭
        if (!action.startsWith('skill1:')) return;
        // 获取应该开启还是关闭
        const [, param] = action.split(':');
        const enable = parseInt(param) === 1;
        // 执行开启或关闭行为
        // 由于是在同一个文件，因此是不需要引入的
        if (enable) enableSkill1();
        else disableSkill1();

        // 这一句不能少
        core.replay();
    });
}
```

然后我们再次进入 `index.ts`，在 `createMechanism` 函数中调用 `createSkill`：

```ts
import { createSkill } from './skill'; // [!code ++]

export function createMechanism() {
    // ... 原有内容
    createSkill(); // [!code ++]
}
```

最后简单修改一下 `enableSkill1` 和 `disableSkill1` 即可：

```ts
/** 开启二倍斩技能 */
export function enableSkill1() {
    skill1 = true;
    core.updateStatusBar();
    // 将开启技能行为计入录像
    core.status.route.push('skill1:1'); // [!code ++]
}

/** 关闭二倍斩技能 */
export function disableSkill1() {
    skill1 = false;
    core.updateStatusBar();
    // 将关闭技能行为计入录像
    core.status.route.push('skill1:0'); // [!code ++]
}
```

## 按键交互与点击交互

按键交互参考[此文档](./hotkey.md)

点击交互参考[此文档](./status-bar.md#拓展-可交互按钮)

最终实现参考（按键和点击）：

:::code-group

```ts [按键]
// 引入刚刚编写的函数
import { toggleSkill1 } from '@user/data-state';

gameKey
    // 按键分组
    .group('skill', '主动技能')
    // 按键注册
    .register({
        id: 'skill1',
        name: '二倍斩',
        defaults: KeyCode.Digit1
    });

// 按键实现
gameKey.realize('skill1', toggleSkill1);
```

```tsx [点击]
// 引入刚刚编写的函数
import { toggleSkill1 } from '@user/data-state'; // [!code ++]

// 在状态栏新增
export const LeftStatusBar = defineComponent<StatusBarProps<ILeftHeroStatus>>(
    p => {
        return () => (
            <container>
                {/* ... 原有内容 */}

                {/* 新增一个 text 标签，点击时执行 toggleSkill1 切换技能 */}
                <text // [!code ++]
                    text="切换二倍斩" // [!code ++]
                    cursor="pointer" // [!code ++]
                    onClick={toggleSkill1} // [!code ++]
                />
            </container>
        );
    }
);
```

:::

## 拓展-多技能设计思路

很多时候我们可能会有多个技能，且多个技能间互斥，即每次只能开启一个技能，这时候如果我们给每个技能都单独编写一套 `enable` `disable` `toggle` 会显得很啰嗦，也不易维护。

### 枚举定义

此时我们可以考虑使用枚举方式来定义：

```ts
export const enum SkillType {
    None, // 未开启技能
    DoubleAttack, // 二倍斩
    TripleAttack // 三倍斩
    // ... 其他技能
}
```

### 修改开启关闭行为

然后给 `enable` 系列函数添加一个参数，来指定开启某个技能：

```ts
/** 当前开启了什么技能 */
let enabled: SkillType = SkillType.None;

export function enableSkill(skill: SkillType) {
    // 如果要开启的和当前技能一致，则不做任何事
    if (enabled === skill) return;
    // 否则切换当前技能
    enabled = skill;
    // 更新状态栏
    core.updateStatusBar();
    // 计入录像，直接计入当前开启了什么技能
    core.status.route.push(`skill:${skill}`);
}

export function disableSkill() {
    // 关闭技能相当于切换至无技能
    enableSkill(SkillType.None);
}

export function toggleSkill(skill: SkillType) {
    // 改为判断是否与当前技能一致，一致则关闭，否则切换至目标技能
    if (enabled === skill) disableSkill();
    else enableSkill(skill);
}

export function getEnabledSkill() {
    return enabled;
}
```

### 技能判断

在其他地方直接判断当前技能，可以使用 `if` 或 `switch`：

:::code-group

```ts [if判断]
import { getEnabledSkill, SkillType } from './skill';

export function calDamageWith(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): number | null {
    // ... 原有内容

    // 获取当前开启了什么技能
    const enabled = getEnabledSkill();
    // 使用 if 判断
    if (enabled === SkillType.DoubleAttack) heroPerDamage *= 2;
    else if (enabled === SkillType.TripleAttack) heroPerDamage *= 3;

    // ... 原有内容
}
```

```ts [switch判断]
import { getEnabledSkill, SkillType } from './skill';

export function calDamageWith(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): number | null {
    // ... 原有内容

    // 获取当前开启了什么技能
    const enabled = getEnabledSkill();
    // 使用 switch 判断
    switch (enabled) {
        case SkillType.DoubleAttack:
            heroPerDamage *= 2;
            break;
        case SkillType.TripleAttack:
            heroPerDamage *= 3;
            break;
    }

    // ... 原有内容
}
```

:::

### 录像处理

录像直接改为开启目标技能即可：

```ts
export function createSkill() {
    // 样板接口，注册录像行为
    core.registerReplayAction('skill', action => {
        if (!action.startsWith('skill:')) return;
        // 获取应该开启的技能
        const [, param] = action.split(':');
        const skill = parseInt(param);
        // 开启目标技能，由于关闭技能就是开启 SkillType.None，因此这里直接这么写就行
        enableSkill(skill);

        // 这一句不能少
        core.replay();
    });
}
```

## 拓展-战后自动关闭技能

可以使用战后的钩子实现，写在 `createSkill` 函数中，具体实现方式如下：

```ts {7-10}
import { hook } from '@user/data-base';

export function createSkill() {
    // ... 原有内容

    // 战后钩子，会在战后自动执行
    hook.on('afterBattle', () => {
        // 战后直接关闭技能即可
        disableSkill();
    });
}
```

## 拓展-在开启或关闭技能时执行内容

直接在 `enableSkill` 里面编写即可，如果是单技能，那么直接编写内容，否则需要判断：

```ts {5-15}
export function enableSkill(skill: SkillType) {
    // ... 原有内容

    // 使用 switch 判断
    switch (skill) {
        case SkillType.None:
            // 显示提示
            core.drawTip('已关闭技能！');
            break;
        case SkillType.DoubleAttack:
            // 显示提示
            core.drawTip('已开启二倍斩！');
            break;
        // ... 其他判断
    }
}
```
