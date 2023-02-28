interface MainData {
    /**
     * 所有的楼层id
     */
    readonly floorIds: FloorIds[];

    /**
     * 分区指定
     */
    readonly floorPartitions: [FloorIds, FloorIds?][];

    /**
     * 所有的额外素材
     */
    readonly tilesets: string[];

    /**
     * 所有的动画
     */
    readonly animates: AnimationIds[];

    /**
     * 所有的bgm
     */
    readonly bgms: BgmIds[];

    /**
     * 所有的图片
     */
    readonly images: ImageIds[];

    /**
     * 所有的音效
     */
    readonly sounds: SoundIds[];

    /**
     * 所有的字体
     */
    readonly fonts: FontIds[];

    /**
     * 文件别名
     */
    readonly nameMap: NameMap;

    /**
     * 难度选择
     */
    readonly levelChoose: LevelChooseEvent[];

    /**
     * 装备孔的名称
     */
    readonly equipName: string[];

    /**
     * 初始界面的bgm
     */
    readonly startBgm: BgmIds;

    /**
     * 主样式
     */
    readonly styles: MainStyle;

    /**
     * 图片切分信息
     */
    readonly splitImages: SplitImageData;

    readonly plugin: string[];
}

interface FirstData {
    /**
     * 游戏标题
     */
    title: string;

    /**
     * 游戏英文名，应当与mota.config.ts中的一致
     */
    name: string;

    /**
     * 游戏版本
     */
    version: string;

    /**
     * 初始地图
     */
    floorId: FloorIds;

    /**
     * 勇士的初始信息
     */
    hero: HeroStatus;

    /**
     * 标题界面事件化
     */
    startCanvas: MotaEvent;

    /**
     * 初始剧情
     */
    startText: MotaEvent;

    /**
     * 全局商店信息
     */
    shops: ShopEventOf<keyof ShopEventMap>[];

    /**
     * 升级事件
     */
    levelUp: LevelUpEvent;
}

/**
 * 全塔属性信息
 */
interface DataCore {
    /**
     * 全塔属性的main信息
     */
    readonly main: MainData;

    /**
     * 初始化信息
     */
    readonly firstData: FirstData;

    /**
     * 全局数值
     */
    readonly values: CoreValues;

    /**
     * 全局变量
     */
    readonly flags: CoreFlags;
}

declare const data: new () => Omit<DataCore, 'main'>;
