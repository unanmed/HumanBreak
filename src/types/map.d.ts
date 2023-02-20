type NotCopyPropertyInCompressedMap =
    | 'firstArrive'
    | 'eachArrive'
    | 'blocks'
    | 'parallelDo'
    | 'map'
    | 'bgmap'
    | 'fgmap'
    | 'events'
    | 'changeFloor'
    | 'beforeBattle'
    | 'afterBattle'
    | 'afterGetItem'
    | 'afterOpenDoor'
    | 'cannotMove'
    | 'cannotMoveIn';

/**
 * 压缩后的地图
 */
type CompressedMap<T extends FloorIds = FloorIds> = Omit<
    Floor<T>,
    NotCopyPropertyInCompressedMap
>;

interface Block<N extends Exclude<AllNumbers, 0> = Exclude<AllNumbers, 0>> {
    /**
     * 横坐标
     */
    x: number;

    /**
     * 纵坐标
     */
    y: number;

    /**
     * 图块数字
     */
    id: N;

    /**
     * 事件信息
     */
    event: {
        /**
         * 图块类型
         */
        cls: ClsOf<NumberToId[N]>;

        /**
         * 图块id
         */
        id: NumberToId[N];

        /**
         * 图块动画帧数
         */
        animate: FrameOf<ClsOf<NumberToId[N]>>;

        /**
         * 图块是否不可通行
         */
        noPass: boolean;

        /**
         * 图块高度
         */
        height: 32 | 48;

        /**
         * 触发器
         */
        trigger?: MotaTrigger;

        /**
         * 是否可被破
         */
        canBreak?: boolean;

        /**
         * 门信息
         */
        doorInfo?: DoorInfo;
    };
}

interface FloorBase<T extends FloorIds = FloorIds> {
    /**
     * 楼层id
     */
    floorId: T;

    /**
     * 楼层在状态栏的名称
     */
    name: string;

    /**
     * 地图宝石倍率
     */
    ratio: number;

    /**
     * 地图的宽度
     */
    width: number;

    /**
     * 地图的高度
     */
    height: number;

    /**
     * 地板样式
     */
    defaultGround: AllIds;

    /**
     * 楼层贴图
     */
    image: FloorAnimate[];

    /**
     * 楼层名称
     */
    title: string;

    /**
     * 是否能飞出
     */
    canFlyFrom: boolean;

    /**
     * 是否能飞到
     */
    canFlyTo: boolean;

    /**
     * 是否能使用快捷商店
     */
    canUseQuickShop: boolean;

    /**
     * 是否不可浏览
     */
    cannotViewMap?: boolean;

    /**
     * 是否不能瞬移
     */
    cannotMoveDirectly?: boolean;

    /**
     * 是否是地下层
     */
    underGround?: boolean;

    /**
     * 自动事件
     */
    autoEvent: Record<LocString, AutoEvent>;

    /**
     * 天气
     */
    weather?: [type: string, level: WeatherLevel];

    /**
     * 事件层地图
     */
    map: number[][];

    /**
     * 并行脚本
     */
    parallelDo?: string;

    /**
     * 色调
     */
    color?: Color;

    /**
     * 背景音乐
     */
    bgm?: BgmIds | BgmIds[];
}

interface Floor<T extends FloorIds = FloorIds> extends FloorBase<T> {
    /**
     * 图块信息
     */
    blocks: Block[];

    /**
     * 是否被砍层
     */
    deleted?: boolean;

    /**
     * 是否被强制砍层
     */
    forceDelete?: boolean;
}

interface ResolvedFloor<T extends FloorIds = FloorIds> extends FloorBase<T> {
    /**
     * 战后事件
     */
    afterBattle: Record<LocString, MotaEvent>;

    /**
     * 获得道具后事件
     */
    afterGetItem: Record<LocString, MotaEvent>;

    /**
     * 开门后事件
     */
    afterOpenDoor: Record<LocString, MotaEvent>;

    /**
     * 战前事件
     */
    beforeBattle: Record<LocString, MotaEvent>;

    /**
     * 不可出方向
     */
    cannotMove: Record<LocString, Dir[]>;

    /**
     * 不可入方向
     */
    cannotMoveIn: Record<LocString, Dir[]>;

    /**
     * 普通事件
     */
    events: Record<LocString, MotaEvent>;

    /**
     * 背景层
     */
    bgmap: number[][];

    /**
     * 前景层
     */
    fgmap: number[][];

    /**
     * 楼层切换
     */
    changeFloor: Record<LocString, ChangeFloorEvent>;

    /**
     * 首次到达事件
     */
    firstArrive?: MotaEvent;

    /**
     * 每次到达事件
     */
    eachArrive?: MotaEvent;
}

interface BlockInfo<T extends keyof NumberToId = keyof NumberToId> {
    /**
     * 图块数字
     */
    number: T;

    /**
     * 图块id
     */
    id: NumberToId[T];

    /**
     * 图块类型
     */
    cls: ClsOf<NumberToId[T]>;

    /**
     * 图块名称
     */
    name: string;

    /**
     * 图片信息
     */
    image: HTMLImageElement;

    /**
     * 图块所在图片的横坐标
     */
    posX: number;

    /**
     * 图块所在图片的纵坐标
     */
    posY: number;

    /**
     * 门信息
     */
    doorInfo: DoorInfo;

    /**
     * 图片的高度
     */
    height: 32 | 48;

    /**
     * faceId信息
     */
    faceIds: Record<Dir, AllIds>;

    /**
     * 动画帧数
     */
    animate: FrameOf<ClsOf<NumberToId[T]>>;

    /**
     * 朝向
     */
    face: Dir;

    /**
     * 大怪物信息
     */
    bigImage: HTMLImageElement;
}

interface DrawMapConfig {
    /**
     * 是否是重绘
     */
    redraw: boolean;

    /**
     * 要绘制到的画布
     */
    ctx: CtxRefer;

    /**
     * 是否是在地图画布上绘制的
     */
    onMap: boolean;
}

interface DrawThumbnailConfig {
    /**
     * 勇士的位置
     */
    heroLoc: LocArr;

    /**
     * 勇士的图标
     */
    heroIcon: ImageIds;

    /**
     * 是否绘制显伤
     */
    damage: boolean;

    /**
     * 变量信息，存读档时使用，可以无视
     */
    flags: Flags;

    /**
     * 绘制到的画布
     */
    ctx: CtxRefer;

    /**
     * 绘制位置的横坐标
     */
    x: number;

    /**
     * 绘制位置的纵坐标
     */
    y: number;

    /**
     * 绘制大小，比例数字，例如1代表与实际地图大小相同
     */
    size: number;

    /**
     * 绘制全图
     */
    all: boolean;

    /**
     * 绘制的视野中心横坐标
     */
    centerX: number;

    /**
     * 绘制的视野中心纵坐标
     */
    centerY: number;

    /**
     * 是否不是高清画布，存读档时使用，可以无视
     */
    noHD: boolean;

    /**
     * 是否使用v2优化
     */
    v2: boolean;

    /**
     * 是否在小地图中出现
     */
    inFlyMap: boolean;

    /**
     * 小地图模式下的宽度
     */
    w: number;

    /**
     * 小地图模式下的高度
     */
    h: number;
}

interface BlockFilter {
    /**
     * 高斯模糊
     */
    blur: number;

    /**
     * 色相旋转
     */
    hue: number;

    /**
     * 饱和度
     */
    grayscale: number;

    /**
     * 反色
     */
    invert: boolean;

    /**
     * 阴影
     */
    shadow: boolean;
}

interface SearchedBlock {
    /**
     * 横坐标
     */
    x: number;

    /**
     * 纵坐标
     */
    y: number;

    /**
     * 楼层id
     */
    floorId: FloorIds;

    /**
     * 图块信息
     */
    block: Block;
}

/**
 * 负责一切和地图相关的处理内容
 */
interface Maps {
    /**
     * 图块信息
     */
    blocksInfo: {
        [P in keyof NumberToId]: MapDataOf<P>;
    };

    /**
     * 加载某个楼层
     * @param floorId 楼层id
     * @param map 地图信息，不填表示直接从原地图中获取
     */
    loadFloor<T extends FloorIds>(
        floorId: T,
        map?: number[][] | { map: number[][] }
    ): ResolvedFloor<T>;

    /**
     * 解析地图信息
     * @param map 地图id或地图对象
     */
    extractBlocks(map?: FloorIds | ResolvedFloor): void;

    /**
     * 根据需求为UI解析出blocks
     * @param map 地图信息
     * @param flags 变量信息
     */
    extractBlocksForUI(map?: ResolvedFloor, flags?: Record<string, any>): void;

    /**
     * 根据图块id得到数字（地图矩阵中的值）
     * @example core.getNumberById('yellowWall'); // 1
     * @param id 图块id
     * @returns 图块的数字
     */
    getNumberById<T extends AllIds>(id: T): IdToNumber[T];

    /**
     * 根据数字获得图块
     * @param number 图块数字
     */
    getBlockByNumber<T extends keyof NumberToId>(number: T): Block<T>;

    /**
     * 根据ID获得图块
     * @param id 图块的id
     */
    getBlockById<T extends AllIds>(id: T): Block<IdToNumber[T]>;

    /**
     * 获得当前事件点的ID
     */
    getIdOfThis(id?: 'this' | AllIds): string;

    /**
     * 初始化一个图块
     * @param x 横坐标
     * @param y 纵坐标
     * @param id 图块的id
     * @param addInfo 是否添加触发器信息等
     * @param eventFloor 所在地图信息
     */
    initBlock(
        x: number,
        y: number,
        id: AllIds | AllNumbers,
        addInfo?: boolean,
        eventFloor?: ResolvedFloor
    ): Block;

    /**
     * 压缩地图
     * @param mapArr 地图数组
     * @param floorId 地图id
     */
    compressMap(mapArr?: number[][], floorId?: FloorIds): number[][];

    /**
     * 设置图块的不透明度
     * @param opacity 不透明度
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     */
    setBlockOpacity(
        opacity: number,
        x: number,
        y: number,
        floorId?: FloorIds
    ): void;

    /**
     * 设置图块的滤镜
     * @param filter 滤镜信息
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     */
    setBlockFilter(
        filter: string,
        x: number,
        y: number,
        floorId?: FloorIds
    ): void;

    /**
     * 获取某个图块是否被强制启用或禁用
     * @param floorId 楼层id
     * @param x 横坐标
     * @param y 纵坐标
     * @param flags 变量信息
     */
    isMapBlockDisabled(
        floorId: FloorIds,
        x: number,
        y: number,
        flags?: Record<string, any>
    );

    /**
     * 设置某个点的图块强制启用/禁用状态
     * @param floorId 楼层id
     * @param x 横坐标
     * @param y 纵坐标
     * @param disable 是否禁用
     */
    setMapBlockDisabled(
        floorId: FloorIds,
        x: number,
        y: number,
        disable: boolean
    );

    /**
     * 解压缩地图
     * @param mapArr 地图信息
     * @param floorId 地图id
     */
    decompressMap(mapArr?: number[][], floorId?: FloorIds): number[][];

    /**
     * 将所有地图重新变成数字，以便于存档
     */
    saveMap(): { [P in FloorIds]?: Partial<CompressedMap<P>> };
    /**
     * 将某个地图重新变成数字，以便于存档
     */
    saveMap(floorId: FloorIds): Partial<CompressedMap>;

    /**
     * 将存档中的地图信息重新读取出来
     * @param data 多个楼层的信息
     * @param floorId 在这里没有用
     * @param flags 变量信息
     */
    loadMap<T extends FloorIds>(
        data: { [P in T]: Partial<CompressedMap<P>> },
        floorId?: undefined,
        flags?: Record<string, any>
    ): { [P in T]: ResolvedFloor<T> };
    /**
     * 加载某个楼层的信息
     * @param data 多个楼层的信息
     * @param floorId 加载的楼层
     */
    loadMap<T extends FloorIds>(
        data: { [P in T]?: Partial<CompressedMap<P>> },
        floorId: T
    ): ResolvedFloor<T>;

    /**
     * 更改地图画布的尺寸
     * @param floorId 楼层id
     */
    resizeMap(floorId?: FloorIds): void;

    /**
     * 生成事件层矩阵
     * @example core.getMapArray('MT0'); // 生成主塔0层的事件层矩阵，隐藏的图块视为0
     * @param floorId 地图id，不填视为当前地图
     * @param noCache 是否清空缓存
     * @returns 事件层矩阵，注意对其阵元的访问是[y][x]
     */
    getMapArray(floorId?: FloorIds, noCache?: boolean): AllNumbers[][];

    /**
     * 获取图块的事件层数字
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param noCache 是否清空缓存
     */
    getMapNumber(
        x: number,
        y: number,
        floorId?: FloorIds,
        noCache?: boolean
    ): AllNumbers;

    /**
     * 以x,y的形式返回每个点的事件
     * @param floorId 楼层id
     * @param noCache 是否不使用缓存
     */
    getMapBlocksObj(
        floorId?: FloorIds,
        noCache?: boolean
    ): Record<LocString, Block>;

    /**
     * 获取背景层的图块矩阵
     * @param floorId 楼层id
     */
    getBgMapArray(floorId: FloorIds): AllNumbers[][];

    /**
     * 获取前景层的图块矩阵
     * @param floorId 楼层id
     */
    getFgMapArray(floorId: FloorIds): AllNumbers[][];

    /**
     * 判定背景层的一个位置是什么
     * @example core.getBgNumber(); // 判断主角脚下的背景层图块的数字
     * @param x 横坐标，不填为当前勇士坐标
     * @param y 纵坐标，不填为当前勇士坐标
     * @param floorId 地图id，不填视为当前地图
     * @param noCache 是否不使用缓存
     */
    getBgNumber(
        x?: number,
        y?: number,
        floorId?: FloorIds,
        noCache?: boolean
    ): AllNumbers;

    /**
     * 判定前景层的一个位置是什么
     * @example core.getFgNumber(); // 判断主角脚下的前景层图块的数字
     * @param x 横坐标，不填为当前勇士坐标
     * @param y 纵坐标，不填为当前勇士坐标
     * @param floorId 地图id，不填视为当前地图
     * @param noCache 是否不使用缓存
     */
    getFgNumber(
        x?: number,
        y?: number,
        floorId?: FloorIds,
        noCache?: boolean
    ): AllNumbers;

    /**
     * 可通行性判定
     * @example core.generateMovableArray(); // 判断当前地图主角从各点能向何方向移动
     * @param floorId 地图id，不填视为当前地图
     * @returns 从各点可移动方向的三维数组
     */
    generateMovableArray(floorId?: FloorIds): Dir[][][];

    /**
     * 单点单朝向的可通行性判定，不判断nopass
     * @exmaple core.canMoveHero(); // 判断主角是否可以前进一步
     * @param x 起点横坐标，不填视为主角当前的
     * @param y 起点纵坐标，不填视为主角当前的
     * @param direction 移动的方向，不填视为主角面对的方向
     * @param floorId 地图id，不填视为当前地图
     * @returns true表示可移动，false表示不可移动
     */
    canMoveHero(
        x?: number,
        y?: number,
        direction?: Dir,
        floorId?: FloorIds
    ): boolean;

    /**
     * 能否瞬移到某点，并求出节约的步数。
     * @example core.canMoveDirectly(0, 0); // 能否瞬移到地图左上角
     * @param destX 目标点的横坐标
     * @param destY 目标点的纵坐标
     * @returns 正数表示节约的步数，-1表示不可瞬移
     */
    canMoveDirectly(destX: number, destY: number): number;

    /**
     * 获得某些点可否通行的信息
     * @param locs 目标路径
     * @param canMoveArray 可通行信息
     */
    canMoveDirectlyArray(locs: LocArr[], canMoveArray?: Dir[][][]): number[];

    /**
     * 自动寻路
     * @example core.automaticRoute(0, 0); // 自动寻路到地图左上角
     * @param destX 目标点的横坐标
     * @param destY 目标点的纵坐标
     * @returns 每步走完后主角的loc属性组成的一维数组
     */
    automaticRoute(destX: number, destY: number): DiredLoc[];

    /**
     * 绘制一个图块
     * @param block 要绘制的图块
     * @param animate 绘制图块的第几帧
     * @param ctx 绘制到的画布
     */
    drawBlock(block?: Block, animate?: number, ctx?: CtxRefer): void;

    /**
     * 生成groundPattern
     * @param floorId 楼层id
     */
    generateGroundPattern(floorId?: FloorIds): void;

    /**
     * 地图绘制
     * @example core.drawMap(); // 绘制当前地图
     * @param floorId 地图id，不填表示当前楼层
     */
    drawMap(floorId?: FloorIds): void;

    /**
     * 重绘地图
     */
    redrawMap(): void;

    /**
     * 绘制背景层（含贴图，其与背景层矩阵的绘制顺序可通过复写此函数来改变）
     * @example core.drawBg(); // 绘制当前地图的背景层
     * @param floorId 地图id，不填视为当前地图
     * @param config 配置信息
     */
    drawBg(floorId?: FloorIds, config?: Partial<DrawMapConfig>): void;

    /**
     * 绘制事件层
     * @example core.drawEvents(); // 绘制当前地图的事件层
     * @param floorId 地图id，不填视为当前地图
     * @param blocks 一般不需要
     * @param config 配置信息
     */
    drawEvents(
        floorId?: FloorIds,
        blocks?: Block[],
        config?: Partial<DrawMapConfig>
    ): void;

    /**
     * 绘制前景层（含贴图，其与前景层矩阵的绘制顺序可通过复写此函数来改变）
     * @example core.drawFg(); // 绘制当前地图的前景层
     * @param floorId 地图id，不填视为当前地图
     * @param config 配置信息
     */
    drawFg(floorId?: FloorIds, config?: Partial<DrawMapConfig>): void;

    /**
     * 绘制缩略图
     * @example core.drawThumbnail(); // 绘制当前地图的缩略图
     * @param floorId 地图id，不填视为当前地图
     * @param blocks 一般不需要
     * @param options 额外的绘制项，可以增绘主角位置和朝向、采用不同于游戏中的主角行走图、增绘显伤、提供flags用于存读档
     */
    drawThumbnail(
        floorId?: FloorIds,
        blocks?: Block[],
        options?: Partial<DrawThumbnailConfig>
    ): void;

    /**
     * 判定某个点是否不可被踏入（不基于主角生命值和图块cannotIn属性）
     * @example core.noPass(0, 0); // 判断地图左上角能否被踏入
     * @param x 目标点的横坐标
     * @param y 目标点的纵坐标
     * @param floorId 目标点所在的地图id，不填视为当前地图
     */
    noPass(x: number, y: number, floorId?: FloorIds): boolean;

    /**
     * 某个点是否存在NPC
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     */
    npcExists(x: number, y: number, floorId?: FloorIds): boolean;

    /**
     * 某个点是否存在（指定的）地形
     * @param x 横坐标
     * @param y 纵坐标
     * @param id 地形的id
     * @param floorId 楼层id
     */
    terrainExists(
        x: number,
        y: number,
        id?: AllIdsOf<'terrains'>,
        floorId?: FloorIds
    ): boolean;

    /**
     * 某个点是否存在楼梯
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     */
    stairExists(x: number, y: number, floorId?: FloorIds): boolean;

    /**
     * 当前位置是否在楼梯边；在楼传平面塔模式下对箭头也有效
     */
    nearStair(): boolean;

    /**
     * 某个点是否存在（指定的）怪物
     * @param x 横坐标
     * @param y 纵坐标
     * @param id 怪物的id
     * @param floorId 楼层id
     */
    enemyExists(
        x: number,
        y: number,
        id?: AllIdsOf<'enemys' | 'enemy48'>,
        floorId?: FloorIds
    ): boolean;

    /**
     * 获得某个点的block
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param showDisable 被禁用的图块是否也能被获取
     */
    getBlock(
        x: number,
        y: number,
        floorId?: FloorIds,
        showDisable?: boolean
    ): Block;

    /**
     * 判定某个点的图块id
     * @example
     * // 一个简单的机关门事件，打败或炸掉这一对绿头怪和红头怪就开门
     * if (
     *     core.getBlockId(x1, y1) !== 'greenSlime' &&
     *     core.getBlockId(x2, y2) !== 'redSlime'
     * )
     *     core.openDoor(x3, y3);
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 被禁用的图块是否也能被获取
     * @returns 图块id，该点无图块则返回null
     */
    getBlockId(
        x: number,
        y: number,
        floorId?: FloorIds,
        showDisable?: boolean
    ): AllIds | null;

    /**
     * 判定某个点的图块数字
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 被禁用的图块是否也能被获取
     */
    getBlockNumber(
        x: number,
        y: number,
        floorId?: FloorIds,
        showDisable?: boolean
    ): AllNumbers;

    /**
     * 判定某个点的图块类型
     * @example
     * // 另一个简单的机关门事件，打败或炸掉这一对不同身高的敌人就开门
     * if (core.getBlockCls(x1, y1) !== 'enemys' && core.getBlockCls(x2, y2) !== 'enemy48') core.openDoor(x3, y3);
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 被禁用的图块是否也能被获取
     */
    getBlockCls(
        x: number,
        y: number,
        floorId?: FloorIds,
        showDisable?: boolean
    ): Cls | null;

    /**
     * 获取图块的不透明度
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 被禁用的图块是否也能被获取
     */
    getBlockOpacity(
        x: number,
        y: number,
        floorId?: FloorIds,
        showDisable?: boolean
    ): number | null;

    /**
     * 获取图块的滤镜
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 被禁用的图块是否也能被获取
     */
    getBlockFilter(
        x: number,
        y: number,
        floorId?: FloorIds,
        showDisable?: boolean
    ): BlockFilter | null;

    /**
     * 获得某个图块或素材的信息
     * @param block 图块信息，可以填图块，数字，id
     */
    getBlockInfo<T extends keyof NumberToId>(
        block?: Block<T> | NumberToId[T] | T
    ): BlockInfo<T>;

    /**
     * 搜索图块, 支持通配符
     * @example core.searchBlock('*Door'); // 搜索当前地图的所有门
     * @param id 图块id，支持星号表示任意多个（0个起）字符
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 隐藏点是否计入，true表示计入
     */
    searchBlock(
        id: string,
        floorId?: FloorIds | FloorIds[],
        showDisable?: boolean
    ): SearchedBlock[];

    /**
     * 根据给定的筛选函数搜索全部满足条件的图块
     * @example
     * // 搜索当前地图的所有门
     * core.searchBlockWithFilter(function (block) { return block.event.id.endsWith('Door'); });
     * @param blockFilter 筛选函数，可接受block输入，应当返回一个boolean值
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 隐藏点是否计入，true表示计入
     * @returns 一个详尽的数组
     */
    searchBlockWithFilter(
        blockFilter: (block: Block) => boolean,
        floorId?: FloorIds | FloorIds[],
        showDisable?: boolean
    ): SearchedBlock[];

    /**
     * 获得某个图块对应行走图朝向向下的那一项的id，如果不存在行走图绑定则返回自身id
     * @param block 要获得的图块
     */
    getFaceDownId(block: Block | AllIds | AllNumbers): AllIds;

    /**
     * 显示（隐藏或显示的）图块，此函数将被“显示事件”指令和勾选了“不消失”的“移动/跳跃事件”指令（如阻击怪）的终点调用
     * @example core.showBlock(0, 0); // 显示地图左上角的图块
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    showBlock(x: number, y: number, floorId?: FloorIds): void;

    /**
     * 隐藏一个图块，对应于「隐藏事件」且不删除
     * @example core.hideBlock(0, 0); // 隐藏地图左上角的图块
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    hideBlock(x: number, y: number, floorId?: FloorIds): void;

    /**
     * 根据图块的索引来隐藏图块
     * @param index 要隐藏的图块的索引
     * @param floorId 地图id
     */
    hideBlockByIndex(index: number, floorId?: FloorIds): void;

    /**
     * 一次性隐藏多个block
     * @param indexes 索引列表
     * @param floorId 地图id
     */
    hideBlockByIndexes(indexes: number[], floorId?: FloorIds): void;

    /**
     * 删除一个图块，对应于「隐藏事件」并同时删除
     * @example core.removeBlock(0, 0); // 尝试删除地图左上角的图块
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @returns 有没有删除成功
     */
    removeBlock(x: number, y: number, floorId?: FloorIds): boolean;

    /**
     * 根据block的索引（尽可能）删除该块
     * @param index 要删除的图块的索引
     * @param floorId 地图id
     */
    removeBlockByIndex(index: number, floorId?: FloorIds): void;

    /**
     * 一次性删除多个block
     * @param indexes 索引列表
     * @param floorId 地图id
     */
    removeBlockByIndexes(indexes: number[], floorId?: FloorIds): void;

    /**
     * 显示前景/背景地图
     * @param name 图层名
     * @param loc 要显示的坐标列表
     * @param floorId 楼层id
     * @param callback 显示完毕的回调函数
     */
    showBgFgMap(
        name: 'bg' | 'bg2' | 'fg' | 'fg2',
        loc: LocArr | LocArr[],
        floorId?: FloorIds,
        callback?: () => void
    ): void;

    /**
     * 隐藏前景/背景地图
     * @param name 图层名
     * @param loc 要显示的坐标列表
     * @param floorId 楼层id
     * @param callback 显示完毕的回调函数
     */
    hideBgFgMap(
        name: 'bg' | 'bg2' | 'fg' | 'fg2',
        loc: LocArr | LocArr[],
        floorId?: FloorIds,
        callback?: () => void
    ): void;

    /**
     * 显示一个楼层贴图
     * @param loc 楼层贴图的位置
     * @param floorId 楼层id
     * @param callback 显示完毕后的回调函数
     */
    showFloorImage(
        loc?: LocArr | LocArr[],
        floorId?: FloorIds,
        callback?: () => void
    ): void;

    /**
     * 隐藏一个楼层贴图
     * @param loc 楼层贴图的位置
     * @param floorId 楼层id
     * @param callback 显示完毕后的回调函数
     */
    hideFloorImage(
        loc?: LocArr | LocArr[],
        floorId?: FloorIds,
        callback?: () => void
    ): void;

    /**
     * 转变图块
     * @example core.setBlock(1, 0, 0); // 把地图左上角变成黄墙
     * @param number 新图块的数字或id
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param noredraw 是否不重绘地图
     */
    setBlock(
        number: AllIds | AllNumbers | `${AllNumbers}`,
        x: number,
        y: number,
        floorId?: FloorIds,
        noredraw?: boolean
    ): void;

    /**
     * 动画形式转变某点图块
     * @param number 要转变成的图块的数字或id
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param time 转变时间
     * @param callback 转变开始或完成后的回调函数
     */
    animateSetBlock(
        number: AllIds | AllNumbers | `${AllNumbers}`,
        x: number,
        y: number,
        floorId?: FloorIds,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 动画形式转变若干点图块
     * @param number 要转变成的图块的数字或id
     * @param locs 坐标数组
     * @param floorId 楼层id
     * @param time 转变时间
     * @param callback 转变开始或完成后的回调函数
     */
    animateSetBlocks(
        number: AllIds | AllNumbers | `${AllNumbers}`,
        locs: LocArr | LocArr[],
        floorId?: FloorIds,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 某个图块转向
     * @param direction 转向的方向
     * @param x 图块所在横坐标
     * @param y 图块所在纵坐标
     * @param floorId 楼层id
     */
    turnBlock(
        direction: HeroTurnDir,
        x: number,
        y: number,
        floorId?: FloorIds
    ): void;

    /**
     * 批量替换图块
     * @example core.replaceBlock(21, 22, core.floorIds); // 把游戏中地上当前所有的黄钥匙都变成蓝钥匙
     * @param fromNumber 旧图块的数字
     * @param toNumber 新图块的数字
     * @param floorId 地图id或其数组，不填视为当前地图
     */
    replaceBlock(
        fromNumber: AllNumbers,
        toNumber: AllNumbers,
        floorId?: FloorIds | FloorIds[]
    ): void;

    /**
     * 转变图层块
     * @example core.setBgFgBlock('bg', 167, 6, 6); // 把当前地图背景层的中心块改为滑冰
     * @param name 背景还是前景
     * @param number 新图层块的数字或id
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    setBgFgBlock(
        name: 'bg' | 'fg' | 'bg2' | 'fg2',
        number: AllIds | AllNumbers | `${AllNumbers}`,
        x: number,
        y: number,
        floorId?: FloorIds
    ): void;

    /**
     * 重置地图，注意该功能原则上只用于调试，游戏中不应当出现
     * @param floorId 楼层id或数组
     */
    resetMap(floorId?: FloorIds | FloorIds[]): void;

    /**
     * 移动图块
     * @example core.moveBlock(0, 0, ['down']); // 令地图左上角的图块下移一格，用时半秒，再花半秒淡出
     * @param x 起点的横坐标
     * @param y 起点的纵坐标
     * @param steps 步伐数组
     * @param time 单步和淡出用时，单位为毫秒。不填视为半秒
     * @param keep 是否不淡出，true表示不淡出
     * @param callback 移动或淡出后的回调函数
     */
    moveBlock(
        x: number,
        y: number,
        steps: Step[],
        time?: number,
        keep?: boolean,
        callback?: () => void
    ): void;

    /**
     * 跳跃图块；从V2.7开始不再有音效
     * @example core.jumpBlock(0, 0, 0, 0); // 令地图左上角的图块原地跳跃半秒，再花半秒淡出
     * @param sx 起点的横坐标
     * @param sy 起点的纵坐标
     * @param ex 终点的横坐标
     * @param ey 终点的纵坐标
     * @param time 单步和淡出用时，单位为毫秒。不填视为半秒
     * @param keep 是否不淡出，true表示不淡出
     * @param callback 落地或淡出后的回调函数
     */
    jumpBlock(
        sx: number,
        sy: number,
        ex: number,
        ey: number,
        time?: number,
        keep?: boolean,
        callback?: () => void
    ): void;

    /**
     * 显示/隐藏某个块时的动画效果
     * @param loc 要显示或隐藏的坐标数组
     * @param type 显示还是隐藏还是移除，填数字表示设置不透明度
     * @param time 动画时间
     * @param callback 动画完毕后的回调函数
     */
    animateBlock(
        loc: LocArr | LocArr[],
        type: 'show' | 'hide' | 'remove' | number,
        time: number,
        callback?: () => void
    ): void;

    /**
     * 添加一个全局动画
     * @param block 图块信息
     */
    addGlobalAnimate(block?: Block): void;

    /**
     * 删除所有全局动画
     */
    removeGlobalAnimate(): void;
    /**
     * 删除一个全局动画
     * @param x 横坐标
     * @param y 纵坐标
     */
    removeGlobalAnimate(x?: number, y?: number): void;

    /**
     * 绘制UI层的box动画
     */
    drawBoxAnimate(): void;

    /**
     * 播放动画，注意即使指定了主角的坐标也不会跟随主角移动，如有需要请使用core.drawHeroAnimate(name, callback)函数
     * @example core.drawAnimate('attack', core.nextX(), core.nextY(), false, core.vibrate); // 在主角面前一格播放普攻动画，动画停止后视野左右抖动1秒
     * @param name 动画文件名，不含后缀
     * @param x 绝对横坐标
     * @param y 绝对纵坐标
     * @param alignWindow 是否是相对窗口的坐标
     * @param callback 动画停止后的回调函数
     * @returns 一个数字，可作为core.stopAnimate()的参数来立即停止播放（届时还可选择是否执行此次播放的回调函数）
     */
    drawAnimate(
        name: AnimationIds | NameMapIn<AnimationIds>,
        x: number,
        y: number,
        alignWindow?: boolean,
        callback?: () => void
    ): number;

    /**
     * 播放跟随勇士的动画
     * @param name 动画名
     * @param callback 动画停止后的回调函数
     * @returns 一个数字，可作为core.stopAnimate()的参数来立即停止播放（届时还可选择是否执行此次播放的回调函数）
     */
    drawHeroAnimate(
        name: AnimationIds | NameMapIn<AnimationIds>,
        callback?: () => void
    ): number;

    /**
     * 获得当前正在播放的所有（指定）动画的id列表
     * @param name 指定名称
     */
    getPlayingAnimates(name?: AnimationIds): number[];

    /**
     * 立刻停止一个动画播放
     * @param id 播放动画的编号，即drawAnimate或drawHeroAnimate返回值，不填则停止所有的
     * @param doCallback 是否执行该动画的回调函数
     */
    stopAnimate(id?: number, doCallback?: boolean): void;
}

declare const maps: new () => Maps;
