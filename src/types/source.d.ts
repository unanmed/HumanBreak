/**
 * 图块类型
 */
type Cls =
    | 'autotile'
    | 'animates'
    | 'enemys'
    | 'items'
    | 'npcs'
    | 'terrains'
    | 'enemy48'
    | 'npc48'
    | 'tileset';

/**
 * 所有的可动画图块类型
 */
type AnimatableCls = Exclude<Cls, 'items' | 'terrains' | 'tileset'>;

/**
 * 道具类型
 */
type ItemCls = 'tools' | 'items' | 'equips' | 'constants';

/**
 * 所有的道具id
 */
type AllIds = keyof IdToNumber;

/**
 * 所有的道具数字
 */
type AllNumbers = keyof NumberToId | 0;

/**
 * 某种类型的图块的id
 */
type AllIdsOf<T extends Cls> = keyof {
    [P in keyof IdToCls as IdToCls[P] extends T ? P : never]: P;
};

/**
 * 某种类型的道具的id
 */
type ItemIdOf<T extends ItemCls> = keyof {
    [P in keyof ItemDeclaration as ItemDeclaration[P] extends T ? P : never]: P;
};

/**
 * 某个道具的类型
 */
type ItemClsOf<T extends AllIdsOf<'items'>> = ItemDeclaration[T];

/**
 * 获取某个图块的类型
 */
type ClsOf<T extends AllIds> = IdToCls[T];

/**
 * 某种类型的图块数字
 */
type AllNumbersOf<T extends Cls> = IdToNumber[AllIdsOf<T>];

/**
 * 选取在一段字符串中的映射名称
 */
type NameMapIn<T extends string> = keyof {
    [P in keyof NameMap as NameMap[P] extends T ? P : never]: NameMap[P];
};

/**
 * 所有的怪物id
 */
type EnemyIds = AllIdsOf<'enemys' | 'enemy48'>;

/**
 * 各种图块的动画数量
 */
interface FrameNumbers {
    autotile: 4;
    animates: 4;
    enemys: 2;
    items: 1;
    npcs: 2;
    terrains: 1;
    enemy48: 4;
    npc48: 4;
    tileset: 1;
}

/**
 * 动画帧数
 */
type FrameOf<T extends Cls> = FrameNumbers[T];

/**
 * 所有的文件名
 */
type SourceIds = ImageIds | AnimationIds | SoundIds | BgmIds | FontIds;
