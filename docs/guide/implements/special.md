# 怪物特殊属性

下面以特殊属性“勇士造成的伤害减少 10%”为例，展示如何自定义一个仅修改伤害计算的特殊属性。

:::warning
伤害计算将会在 2.C 中重构，不过逻辑并不会有大幅变动。
:::

## 编写属性定义

打开 `packages-user/data-state/src/enemy/special.ts`，在最后添加一个属性定义：

```ts
export const specials: SpecialDeclaration[] = [
    // ... 原有属性定义

    // 自定义属性
    {
        code: 30, // 特殊属性代码，用于 hasSpecial 判断 // [!code ++]
        name: '自定义特殊属性', // 特殊属性名称 // [!code ++]
        desc: '勇士对该怪物造成的伤害减少 10%', // 特殊属性描述 // [!code ++]
        color: '#ffd' // 特殊属性显示的颜色 // [!code ++]
    }
];
```

## 实现特殊属性

打开 `packages-user/data-state/src/enemy/damage.ts`，在文件最后的 `calDamageWithTurn` 函数中编写：

```ts
export function calDamageWithTurn(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): DamageWithTurn {
    // ... 原有内容

    // 在需要降低勇士伤害的地方将勇士伤害乘以 0.9 即可
    // 注意需要再回合计算前乘，不然没有效果
    heroPerDamage *= 0.9; // [!code ++]

    // ... 原有内容
}
```

## 拓展-用函数声明属性

特殊属性的属性名和介绍可以使用函数来声明，这允许属性名和描述根据怪物属性变化。下面我们以特殊属性“勇士伤害减少`n%`”为例，展示如何声明这种类型的属性。

### 编辑表格

首先我们打开编辑器，选中任意一个怪物，在左侧属性栏上方找到`编辑表格`，然后点击它打开，找到`【怪物】相关的表格配置`，在 `_data` 属性下仿照攻击或其他属性新增一项，注意不要忘记了逗号：

```js {4-10}
"enemys": {
    "_data": {
        // 属性名为 myAttr
        "myAttr": {
            "_leaf": true,
            "_type": "textarea",
            // 属性说明
            "_docs": "伤害减免",
            "_data": "伤害减免"
        },
    }
}
```

### 类型声明

然后打开 `src/types/declaration/event.d.ts`，找到开头的 `type PartialNumbericEnemyProperty =`，在后面新增一行：

```ts
type PartialNumbericEnemyProperty =
    | 'value'
    // ... 其他属性声明

    // 新增自己的 myAttr 属性
    // 注意不要忘记删除前一行最后的分号
    | 'myAttr'; // [!code ++]
```

### 属性定义

最后在 `special.ts` 中新增属性定义即可：

```ts
export const specials: SpecialDeclaration[] = [
    // ... 原有属性定义

    // 自定义属性
    {
        code: 30, // 特殊属性代码，用于 hasSpecial 判断
        name: enemy => `${enemy.myAttr ?? 0}%减伤`, // 特殊属性名称 // [!code ++]
        desc: enemy => `勇士对该怪物造成的伤害减少${enemy.myAttr ?? 0}%`, // 特殊属性描述 // [!code ++]
        color: '#ffd' // 特殊属性显示的颜色
    }
];
```

此时，如果给怪物的 `myAttr` 栏填写 `10`，那么特殊属性名称就会显示 `10%减伤`，属性描述会显示 `勇士对该怪物造成的伤害减少10%`。

### 属性实现

修改 `damage.ts` `calDamageWithTurn` 中的实现：

```ts
export function calDamageWithTurn(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): DamageWithTurn {
    // ... 原有内容

    // 在乘以 1 - (myAttr / 100)，除以 100 是因为 myAttr 是百分制
    heroPerDamage *= 1 - (info.myAttr ?? 0) / 100; // [!code ++]

    // ... 原有内容
}
```

## 拓展-地图伤害

同样在 `damage.ts`，找到 `DamageEnemy.calMapDamage` 方法，直接 `ctrl+F` 搜索 `calMapDamage` 即可找到，然后在其中编写地图伤害即可。以领域为例，它是这么写的：

```ts
class DamageEnemy {
    calMapDamage(
        damage: Record<string, MapDamage> = {},
        hero: Partial<HeroStatus> = getHeroStatusOn(realStatus)
    ) {
        // 判断是否包含领域属性
        if (this.info.special.has(15)) {
            // 计算领域范围
            const range = enemy.range ?? 1;
            const startX = Math.max(0, this.x - range);
            const startY = Math.max(0, this.y - range);
            const endX = Math.min(floor.width - 1, this.x + range);
            const endY = Math.min(floor.height - 1, this.y + range);
            // 伤害量
            const dam = enemy.value ?? 0;
            const objs = core.getMapBlocksObj(this.floorId);

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    if (
                        !enemy.zoneSquare &&
                        // 判断非九宫格领域，使用曼哈顿距离判断
                        manhattan(x, y, this.x, this.y) > range
                    ) {
                        continue;
                    }
                    const loc = `${x},${y}` as LocString;
                    if (objs[loc]?.event.noPass) continue;
                    // 存储地图伤害
                    this.setMapDamage(damage, loc, dam, '领域');
                }
            }
        }
    }
}
```

## 拓展-光环属性

光环计算目前分为两个优先级，高优先级的可以影响低优先级的，这意味着你可以做出来加光环的光环属性。不过高级光环的逻辑比较绕，而且需求不高，这里不再介绍。如果需要的话可以自行理解这部分逻辑或在造塔群里询问。这里以攻击光环为例，展示如何制作一个普通光环。

我们假设使用 `atkHalo` 作为光环增幅，`haloRange` 作为光环范围，属性代码为 `30`，九宫格光环。我们在 `damage.ts` 中找到 `DamageEnemy.provideHalo` 方法，直接 `ctrl+F` 搜索 `provideHalo` 就能找到。

### 光环逻辑

我们直接调用 `applyHalo` 即可，如下编写代码：

```ts
class DamageEnemy {
    provideHalo() {
        // ... 原有逻辑

        // 施加光环
        col.applyHalo(
            // 光环形状为正方形。目前支持 square 矩形和 rect 矩形
            'square',
            // 正方形形状参数
            {
                x: this.x, // 中心横坐标
                y: this.y, // 中心纵坐标
                d: this.info.haloRange * 2 + 1 // 边长
            },
            this, // 填 this 即可
            (e, enemy) => {
                // 这里的 e 是指被加成的怪物，enemy 是当前施加光环的怪物
                // 直接加到 atkBuff_ 属性上即可
                e.atkBuff_ += enemy.atkHalo;
            }
        );

        // 在地图上显示光环，这部分可选，如果不想显示也可以不写
        col.haloList.push({
            // 光环形状
            type: 'square',
            // 形状参数
            data: { x: this.x, y: this.y, d: this.info.haloRange * 2 + 1 },
            // 特殊属性代码
            special: 30,
            // 施加的怪物
            from: this
        });
    }
}
```

### 自定义形状

如果想要自定义光环形状，我们打开 `packages-user/data-utils/src/range.ts`，拉到最后可以看到形状定义，目前默认的包含这些：

- `square`: 中心点+边长的正方形
- `rect`: 左上角坐标+宽高的矩形
- `manhattan`: 曼哈顿距离，坐标之和小于半径

我们以曼哈顿距离为例，展示如何自定义形状。

首先在开头找到 `interface RangeTypeData`，在其中添加必要的参数类型：

```ts
interface RangeTypeData {
    // ... 原有内容

    // 自定义的曼哈顿范围参数，包含中心坐标和半径
    manhattan: { x: number; y: number; dis: number }; // [!code ++]
}
```

然后在文件最后定义形状即可：

```ts
// 这里的第一个参数就是我们的形状名称，填 manhattan 即可
// 第二个参数是一个函数，目的是判断 item 是否在范围内
Range.register('manhattan', (item, { x, y, dis }) => {
    // 如果 item 连坐标属性都不存在，那么直接判定不在范围内
    if (isNil(item.x) || isNil(item.y)) return false;
    // 计算与中心的坐标差
    const dx = Math.abs(item.x - x);
    const dy = Math.abs(item.y - y);
    // 坐标差之和小于半径则在范围内，否则在范围外
    return dx + dy < dis;
});
```

在光环中，我们就可以直接使用这种形状了：

```ts {2-9}
col.applyHalo(
    // 使用自定义形状
    'manhattan',
    // 自定义形状的参数
    {
        x: this.x, // 中心横坐标
        y: this.y, // 中心纵坐标
        dis: this.info.haloRange // 半径
    },
    this,
    (e, enemy) => {
        e.atkBuff_ += enemy.atkHalo;
    }
);
```
