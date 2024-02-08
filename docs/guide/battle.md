# 战斗系统

新样板对战斗系统进行了完全性重构，大大提高了代码的结构性与执行效率。对于大部分情况，你只需要注重于战斗脚本与光环处理，就能做出任何你想要的怪物特殊属性，或者更改战斗流程，同时不会引起任何副作用。

## 战斗脚本

与旧样板不同的是，新样板中的战斗函数不再接收楼层、坐标等信息，取而代之的是怪物信息。返回值也变成了一个伤害值，不再需要返回一系列属性。

```ts
function calDamageWith(info: EnemyInfo, hero: Partial<HeroStatus>): number | null
```

你可以通过`info`来获取的怪物的真实信息，`info.x`与`info.y`获取怪物坐标，`info.floorId`获取怪物所在楼层，这三者可能是`undefined`，表示怪物不在任何楼层中。除此之外它还包含所有编辑器中可以编辑的怪物属性（如果存在且不为`null`和`undefined`），以及下面几个属性：

-   `atkBuff`: buff 攻击加成
-   `defBuff`: buff 防御加成
-   `hpBuff`: buff 生命加成
-   `enemy`: 怪物原始信息，即编辑器中的怪物原始信息，不能修改，只可以读取
-   `guard`: 支援信息

对于战斗流程，新样板并没有进行过多改动，与旧样板相差不大。

战斗脚本可以在插件`battle`中修改。

## 光环处理

新样板的光环处理可以说是非常强大了，它通过`provide`和`inject`的方式进行光环处理，这使得光环处理不会产生副作用，同时提供了`preProvideHalo`函数，可以对那些能给其他怪物增加特殊属性甚至光环的光环进行处理。只要你的光环没有副作用（施加顺序不会影响结果，顺序无关性），就可以实现加光环的光环，甚至是加光环的光环的光环。同时，借助于`Range`类，你可以自定义你的光环范围。光环范围扫描只会扫描所有的怪物，因此性能相比于旧样板大有提升。

在处理光环时，会用到下列函数：

```ts
// 光环函数，第一个参数是被施加光环的怪物，第二个参数是施加光环的怪物
type HaloFn = (e: EnemyInfo, enemy: EnemyInfo) => void
// 在 DamageEnemy 类上，即每个怪物
function provideHalo(): void
function preProvideHalo(): void
function injectHalo(halo: HaloFn, enemy: Enemy): void

// 在 EnemyCollection 类上，即每一层的怪物集合
function applyHalo(
    type: string,
    data: any,
    enemy: DamageEnemy,
    halo: HaloFn | HaloFn[],
    recursion: boolean = false
): void
```

对于光环，其施加流程大致如下：

1. 定义光环范围，使用`Range.registerRangeType`函数，见[范围处理](#范围处理)
2. 在`provideHalo`或`preProvideHalo`函数中添加对应的光环处理
3. 在光环处理中编写光环函数，并使用`applyHalo`施加光环

对于光环函数，它会接收被施加的怪物和施加光环的怪物作为参数，`e`是被施加光环的怪物，`enemy`是施加光环的怪物。在处理时，不应当更改后者的信息，仅应当更改前者的信息。

示例

```js
// 在 provideHalo 中，以下内容应放在样板自带的光环处理函数的循环中
// 施加光环
col.applyHalo(
    'square', // 方形范围
    { x: this.x, y: this.y, d: 7 }, // 方形以怪物为中心，7为边长
    this, // 施加光环的怪，一般就是自己
    (e, enemy) => {
        e.hp += 100; // 光环效果是被施加的怪物增加100点生命值，注意光环也可以作用于自身，因此e和enemy有可能相等
    }
);
```

## 范围处理

范围处理是一个通用接口，在当前版本样板中主要用于光环处理。它是一个类，因此应该通过`Mota.require('class', 'Range')`获取。它的类型如下：

```ts
class Range<C extends Partial<Loc>> {
    collection: RangeCollection<C>;
    cache: Record<string, any>;
    static rangeType: Record<string, RangeType<Partial<Loc>>>;
    constructor(collection: RangeCollection<C>);
    /**
     * 扫描 collection 中在范围内的物品
     * @param type 范围类型
     * @param data 范围数据
     * @returns 在范围内的物品列表
     */
    scan(type: string, data: any): C[];
    inRange(type: string, data: any, item: Partial<Loc>): boolean;
    clearCache(): void;
    static registerRangeType(type: string, scan: RangeScanFn<Partial<Loc>>, inRange: InRangeFn<Partial<Loc>>): void;
}
```

当然，大部分情况下，你不需要理解每个 api 及其类型，在这里，我们重点关注`registerRangeType`函数。

它用于注册一个你自己的范围类型，接收三个参数，分别是：

-   `type`: 范围类型名称
-   `scan`: 范围扫描函数，用于获取`collection`中所有在范围内的元素
-   `inRange`: 范围判断函数，用于判断一个元素是否在范围内

对于范围扫描函数，它接收`collection`和范围参数作为参数，返回一个数组，表示在范围内的元素列表。

对于范围判断函数，它会比范围扫描函数多一个参数，表示要判断的元素。返回布尔值，表示是否在范围内。

这里`collection`描述的是一个列表，表示所有要判断的元素。范围参数指的是该范围类型的参数，例如上面提到过的方形范围，其范围参数就是`{ x: this.x, y: this.y, d: 7 }`。值得注意的是，每个元素不一定包含横纵坐标两个属性。

系统自带两种范围，方形范围与曼哈顿范围（横纵坐标相加小于一个值），我们来看看方形范围是如何注册的：

```js
Range.registerRangeType(
    'square',
    (col, { x, y, d }) => {
        // 获取要判断的列表
        const list = col.collection.list;
        const r = Math.floor(d / 2);

        // 获取在范围内的列表，对每个元素进行判断是否在范围内即可
        return list.filter(v => {
            return (
                has(v.x) && // 这两个用于判断是否存在横纵坐标参数
                has(v.y) &&
                Math.abs(v.x - x) <= r &&
                Math.abs(v.y - y) <= r
            );
        });
    },
    (col, { x, y, d }, item) => {
        const r = Math.floor(d / 2);
        return (
            has(item.x) &&
            has(item.y) &&
            Math.abs(item.x - x) <= r &&
            Math.abs(item.y - y) <= r
        );
    }
);
```

## 地图伤害

与旧样板相比，地图伤害的处理并没有进行过多改动，其核心大致相同。计算地图伤害的流程是：

1. 遍历每个怪物，对于单个怪物，执行下列行为
2. 判断是否存在有地图伤害的属性，有则处理
3. 将地图伤害加入列表中

在计算地图伤害过程中，会用到下列函数：

```ts
// 在 DamageEnemy 上
function calMapDamage(
    damage: Record<string, MapDamage> = {},
    hero: Partial<HeroStatus> = getHeroStatusOn(Damage.realStatus)
): void
function setMapDamage(
    damage: Record<string, MapDamage>,
    loc: string,
    dam: number,
    type?: string
): void
```

前者是计算地图伤害的函数，也就是在插件中被复写的函数，一般不需要调用。它传入`damage`和`hero`作为参数，表示地图伤害要存入的对象，以及勇士信息。

后者是设置地图伤害的函数，当我们讲该怪物在改点的伤害计算完毕后，应该调用它将这一点的伤害信息记录下来。

示例请参考插件中的地图伤害计算。
