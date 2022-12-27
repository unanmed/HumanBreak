interface Item<I extends AllIdsOf<'items'>> {
    /**
     * 道具id
     */
    id: I;

    /**
     * 道具的类型
     */
    cls: ItemClsOf<I>;

    /**
     * 道具的名称
     */
    name: string;

    /**
     * 道具的描述
     */
    text?: string;

    /**
     * 是否在道具栏隐藏
     */
    hideInToolBox: boolean;

    /**
     * 装备信息
     */
    equip: ItemClsOf<I> extends 'equips' ? Equip : never;

    /**
     * 回放使用时是否不先打开道具栏再使用
     */
    hideInReplay: boolean;

    /**
     * 即捡即用效果
     */
    itemEffect?: string;

    /**
     * 即捡即用道具捡过之后的提示
     */
    itemEffectTip?: string;

    /**
     * 使用道具时执行的事件
     */
    useItemEvent?: MotaEvent;

    /**
     * 使用道具时执行的代码
     */
    useItemEffect?: string;

    /**
     * 能否使用道具
     */
    canUseItemEffect?: string | boolean;
}

interface EquipBase {
    /**
     * 装备增加的数值
     */
    value: Record<keyof SelectType<HeroStatus, number>, number>;

    /**
     * 装备增加的百分比
     */
    percentage: Record<keyof SelectType<HeroStatus, number>, number>;
}

interface Equip extends EquipBase {
    /**
     * 可以装备到的装备孔
     */
    type: number | string;

    /**
     * 动画信息
     */
    animate: AnimationIds;

    /**
     * 穿上装备时执行的事件
     */
    equipEvent?: MotaEvent;

    /**
     * 脱下装备时执行的事件
     */
    unequipEvent?: MotaEvent;
}

/**
 * 道具相关的内容
 */
interface Items {
    /**
     * 获得所有道具
     */
    getItems(): {
        [P in AllIdsOf<'items'>]: Item<P>;
    };

    /**
     * 执行即捡即用类的道具获得时的效果
     * @example core.getItemEffect('redPotion', 10) // 执行获得10瓶红血的效果
     * @param itemId 道具id
     * @param itemNum 道具数量，默认为1
     */
    getItemEffect(itemId: AllIdsOf<'items'>, itemNum?: number): void;

    /**
     * 即捡即用类的道具获得时的额外提示
     * @example core.getItemEffectTip(redPotion) // （获得 红血瓶）'，生命+100'
     * @param itemId 道具id
     * @returns 图块属性itemEffectTip的内容
     */
    getItemEffectTip(itemId: AllIdsOf<'items'>): string;

    /**
     * 使用一个道具
     * @example core.useItem('pickaxe', true) // 使用破墙镐，不计入录像，无回调
     * @param itemId 道具id
     * @param noRoute 是否不计入录像，快捷键使用的请填true，否则可省略
     * @param callback 道具使用完毕或使用失败后的回调函数，好像没什么意义吧（
     */
    useItem(
        itemId: ItemIdOf<'tools' | 'constants'>,
        noRoute?: boolean,
        callback?: () => void
    ): void;

    /**
     * 检查能否使用某种道具
     * @example core.canUseItem('pickaxe') // 能否使用破墙镐
     * @param itemId 道具id
     * @returns true表示可以使用
     */
    canUseItem(itemId: AllIdsOf<'items'>): boolean;

    /**
     * 统计某种道具的持有量
     * @example core.itemCount('yellowKey') // 持有多少把黄钥匙
     * @param itemId 道具id
     * @returns 该种道具的持有量，不包括已穿戴的装备
     */
    itemCount(itemId: AllIdsOf<'items'>): number;

    /**
     * 检查主角是否持有某种道具(不包括已穿戴的装备)
     * @example core.hasItem('yellowKey') // 主角是否持有黄钥匙
     * @param itemId 道具id
     * @returns true表示持有
     */
    hasItem(itemId: AllIdsOf<'items'>): boolean;

    /**
     * 检查主角是否穿戴着某件装备
     * @example core.hasEquip('sword5') // 主角是否装备了神圣剑
     * @param itemId 装备id
     * @returns true表示已装备
     */
    hasEquip(itemId: ItemIdOf<'equips'>): boolean;

    /**
     * 检查主角某种类型的装备目前是什么
     * @example core.getEquip(1) // 主角目前装备了什么盾牌
     * @param equipType 装备类型，自然数
     * @returns 装备id，null表示未穿戴
     */
    getEquip(equipType: number): ItemIdOf<'equips'> | null;

    /**
     * 设置某种道具的持有量
     * @example core.setItem('yellowKey', 3) // 设置黄钥匙为3把
     * @param itemId 道具id
     * @param itemNum 新的持有量，可选，自然数，默认为0
     */
    setItem(itemId: AllIdsOf<'items'>, itemNum?: number): void;

    /**
     * 静默增减某种道具的持有量 不会更新游戏画面或是显示提示
     * @example core.addItem('yellowKey', -2) // 没收两把黄钥匙
     * @param itemId 道具id
     * @param itemNum 增加量，负数表示减少
     */
    addItem(itemId: AllIdsOf<'items'>, itemNum?: number): void;

    /**
     * @deprecated 使用addItem代替。
     * 删除某个物品一定的数量，相当于addItem(itemId, -n);
     * @param itemId 道具id
     * @param itemNum 减少量，负数表示增加
     */
    removeItem(itemId?: AllIdsOf<'items'>, itemNum?: number): void;

    /**
     * 根据类型获得一个可用的装备孔
     * @param equipId 道具名称
     */
    getEquipTypeByName(name?: ItemIdOf<'equips'>): number;

    /**
     * 判定某件装备的类型
     * @example core.getEquipTypeById('shield5') // 1（盾牌）
     * @param equipId 装备id
     * @returns 类型编号，自然数
     */
    getEquipTypeById(equipId: ItemIdOf<'equips'>): number;

    /**
     * 检查能否穿上某件装备
     * @example core.canEquip('sword5', true) // 主角可以装备神圣剑吗，如果不能会有提示
     * @param equipId 装备id
     * @param hint 无法穿上时是否提示（比如是因为未持有还是别的什么原因）
     * @returns true表示可以穿上，false表示无法穿上
     */
    canEquip(equipId: ItemIdOf<'equips'>, hint?: boolean): boolean;

    /**
     * 尝试穿上某件背包里的装备并提示
     * @example core.loadEquip('sword5') // 尝试装备上背包里的神圣剑，无回调
     * @param equipId 装备id
     * @param callback 穿戴成功或失败后的回调函数
     */
    loadEquip(equipId: ItemIdOf<'equips'>, callback?: () => void): void;

    /**
     * 脱下某个类型的装备
     * @example core.unloadEquip(1) // 卸下盾牌，无回调
     * @param equipType 装备类型编号，自然数
     * @param callback 卸下装备后的回调函数
     */
    unloadEquip(equipType: number, callback?: () => void): void;

    /**
     * 比较两件（类型可不同）装备的优劣
     * @example core.compareEquipment('sword5', 'shield5') // 比较神圣剑和神圣盾的优劣
     * @param compareEquipId 装备甲的id
     * @param beComparedEquipId 装备乙的id
     * @returns 两装备的各属性差，甲减乙，0省略
     */
    compareEquipment<F extends ItemIdOf<'equips'>>(
        compareEquipId: F,
        beComparedEquipId: Exclude<ItemIdOf<'equips'>, F>
    ): EquipBase;

    /**
     * 保存当前套装
     * @example core.quickSaveEquip(1) // 将当前套装保存为1号套装
     * @param index 套装编号，自然数
     */
    quickSaveEquip(index: number): void;

    /**
     * 快速换装
     * @example core.quickLoadEquip(1) // 快速换上1号套装
     * @param index 套装编号，自然数
     */
    quickLoadEquip(index: number): void;

    /**
     * 设置某个装备的属性并计入存档
     * @example core.setEquip('sword1', 'value', 'atk', 300, '+='); // 设置铁剑的攻击力数值再加300
     * @param equipId 装备id
     * @param valueType 增幅类型，只能是value（数值）或percentage（百分比）
     * @param name 要修改的属性名称，如atk
     * @param value 要修改到的属性数值
     * @param operator 操作符，如+=表示在原始值上增加
     * @param prefix 独立开关前缀，一般不需要
     */
    setEquip(
        equipId: ItemIdOf<'equips'>,
        valueType: 'value' | 'percentage',
        name: keyof SelectType<HeroStatus, number>,
        value: number,
        operator?: MotaOperator,
        prefix?: string
    ): void;

    /**
     * 真正的穿脱装备
     * @param type 装备孔
     * @param loadId 装上的装备
     * @param unloadId 脱下的装备
     * @param callback 回调函数
     */
    _realLoadEquip(
        type: number,
        loadId?: ItemIdOf<'equips'>,
        unloadId?: ItemIdOf<'equips'>,
        callback?: () => void
    ): void;
}

declare const items: new () => Items;
