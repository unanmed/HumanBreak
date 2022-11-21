/** @file maps.js负责一切和地图相关的处理内容 */
declare class maps {
    /**
     * 根据图块id得到数字（地图矩阵中的值）
     * @example core.getNumberById('yellowWall'); // 1
     * @param id 图块id
     * @returns 图块的数字，定义在project\maps.js（请注意和project\icons.js中的“图块索引”相区分！）
     */
    getNumberById(id: string): number;

    /**
     * 生成事件层矩阵
     * @example core.getMapArray('MT0'); // 生成主塔0层的事件层矩阵，隐藏的图块视为0
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 可选，true表示隐藏的图块也会被表示出来
     * @returns 事件层矩阵，注意对其阵元的访问是[y][x]
     */
    getMapArray(floorId?: string, noCache?: boolean): number[][];

    /** 判定图块的事件层数字；不存在为0 */
    getMapNumber(floorId?: string, noCache?: boolean): number;

    /**
     * 生成背景层矩阵
     * @example core.getBgMapArray('MT0'); // 生成主塔0层的背景层矩阵，使用缓存
     * @param floorId 地图id，不填视为当前地图
     * @param noCache 可选，true表示不使用缓存
     * @returns 背景层矩阵，注意对其阵元的访问是[y][x]
     */
    getBgMapArray(floorId?: string, noCache?: boolean): number[][];

    /**
     * 生成前景层矩阵
     * @example core.getFgMapArray('MT0'); // 生成主塔0层的前景层矩阵，使用缓存
     * @param floorId 地图id，不填视为当前地图
     * @param noCache 可选，true表示不使用缓存
     * @returns 前景层矩阵，注意对其阵元的访问是[y][x]
     */
    getFgMapArray(floorId?: string, noCache?: boolean): number[][];

    /**
     * 判定背景层的一个位置是什么
     * @example core.getBgNumber(); // 判断主角脚下的背景层图块的数字
     * @param x 横坐标，不填为当前勇士坐标
     * @param y 纵坐标，不填为当前勇士坐标
     * @param floorId 地图id，不填视为当前地图
     * @param 可选，true表示不使用缓存而强制重算
     */
    getBgNumber(
        x?: number,
        y?: number,
        floorId?: string,
        noCache?: boolean
    ): number;

    /**
     * 判定前景层的一个位置是什么
     * @example core.getFgNumber(); // 判断主角脚下的前景层图块的数字
     * @param x 横坐标，不填为当前勇士坐标
     * @param y 纵坐标，不填为当前勇士坐标
     * @param floorId 地图id，不填视为当前地图
     * @param 可选，true表示不使用缓存而强制重算
     */
    getFgNumber(
        x?: number,
        y?: number,
        floorId?: string,
        noCache?: boolean
    ): number;

    /**
     * 可通行性判定
     * @example core.generateMovableArray(); // 判断当前地图主角从各点能向何方向移动
     * @param floorId 地图id，不填视为当前地图
     * @returns 从各点可移动方向的三维数组
     */
    generateMovableArray(floorId?: string): Array<Array<Array<direction>>>;

    /**
     * 单点单朝向的可通行性判定
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
        direction?: direction,
        floorId?: string
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
     * 自动寻路
     * @example core.automaticRoute(0, 0); // 自动寻路到地图左上角
     * @param destX 目标点的横坐标
     * @param destY 目标点的纵坐标
     * @returns 每步走完后主角的loc属性组成的一维数组
     */
    automaticRoute(
        destX: number,
        destY: number
    ): Array<{ direction: direction; x: number; y: number }>;

    /**
     * 地图绘制
     * @example core.drawMap(); // 绘制当前地图
     * @param floorId 地图id，省略表示当前楼层
     * @param callback 重绘完毕后的回调函数，可选
     */
    drawMap(floorId?: string, callback?: () => void): void;

    /**
     * 重绘地图
     */
    redrawMap(): void;

    /**
     * 绘制背景层（含贴图，其与背景层矩阵的绘制顺序可通过复写此函数来改变）
     * @example core.drawBg(); // 绘制当前地图的背景层
     * @param floorId 地图id，不填视为当前地图
     * @param ctx 某画布的ctx，用于绘制缩略图，一般不需要
     */
    drawBg(floorId?: string, ctx?: CanvasRenderingContext2D): void;

    /**
     * 绘制事件层
     * @example core.drawEvents(); // 绘制当前地图的事件层
     * @param floorId 地图id，不填视为当前地图
     * @param blocks 一般不需要
     * @param ctx 某画布的ctx，用于绘制缩略图，一般不需要
     */
    drawEvents(
        floorId?: string,
        blocks?: Block[],
        ctx?: CanvasRenderingContext2D
    ): void;

    /**
     * 绘制前景层（含贴图，其与前景层矩阵的绘制顺序可通过复写此函数来改变）
     * @example core.drawFg(); // 绘制当前地图的前景层
     * @param floorId 地图id，不填视为当前地图
     * @param ctx 某画布的ctx，用于绘制缩略图，一般不需要
     */
    drawFg(floorId?: string, ctx?: CanvasRenderingContext2D): void;

    /**
     * 绘制缩略图
     * @example core.drawThumbnail(); // 绘制当前地图的缩略图
     * @param floorId 地图id，不填视为当前地图
     * @param blocks 一般不需要
     * @param options 额外的绘制项，可选。可以增绘主角位置和朝向、采用不同于游戏中的主角行走图、增绘显伤、提供flags用于存读档
     */
    drawThumbnail(
        floorId?: string,
        blocks?: Block[],
        options?: {
            heroLoc?: [number, number];
            heroIcon?: string;
            /** 是否绘制显伤 */
            damage?: boolean;
            /** 存读档时使用，可以无视 */
            flags?: { [x: string]: any };
            ctx?: CtxRefer;
            x?: number;
            y?: number;
            /** 绘制大小 */
            size?: number;
            /** 绘制全图 */
            all?: boolean;
            /** 绘制的视野中心 */
            centerX?: number;
            /** 绘制的视野中心 */
            centerY?: number;
            /** 存读档时使用，可以无视 */
            noHD: boolean;
        }
    ): void;

    /**
     * 判定某个点是否不可被踏入（不基于主角生命值和图块cannotIn属性）
     * @example core.noPass(0, 0); // 判断地图左上角能否被踏入
     * @param x 目标点的横坐标
     * @param y 目标点的纵坐标
     * @param floorId 目标点所在的地图id，不填视为当前地图
     * @returns true表示可踏入
     */
    noPass(x: number, y: number, floorId?: string): boolean;

    /**
     * 判定某个点的图块id
     * @example if(core.getBlockId(x1, y1) != 'greenSlime' && core.getBlockId(x2, y2) != 'redSlime') core.openDoor(x3, y3); // 一个简单的机关门事件，打败或炸掉这一对绿头怪和红头怪就开门
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 隐藏点是否不返回null，true表示不返回null
     * @returns 图块id，该点无图块则返回null
     */
    getBlockId(
        x: number,
        y: number,
        floorId?: string,
        showDisable?: boolean
    ): string | null;

    /** 判定某个点的图块数字；空图块为0 */
    getBlockNumber(
        x: number,
        y: number,
        floorId?: string,
        showDisable?: boolean
    ): number;

    /**
     * 判定某个点的图块类型
     * @example if(core.getBlockCls(x1, y1) != 'enemys' && core.getBlockCls(x2, y2) != 'enemy48') core.openDoor(x3, y3); // 另一个简单的机关门事件，打败或炸掉这一对不同身高的敌人就开门
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 隐藏点是否不返回null，true表示不返回null
     * @returns 图块类型，即“地形、四帧动画、矮敌人、高敌人、道具、矮npc、高npc、自动元件、额外地形”之一
     */
    getBlockCls(
        x: number,
        y: number,
        floorId?: string,
        showDisable?: boolean
    ):
        | 'terrains'
        | 'animates'
        | 'enemys'
        | 'enemy48'
        | 'items'
        | 'npcs'
        | 'npc48'
        | 'autotile'
        | 'tileset'
        | null;

    /**
     * 搜索图块, 支持通配符
     * @example core.searchBlock('*Door'); // 搜索当前地图的所有门
     * @param id 图块id，支持星号表示任意多个（0个起）字符
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 隐藏点是否计入，true表示计入
     * @returns 一个详尽的数组，一般只用到其长度
     */
    searchBlock(
        id: string,
        floorId?: string | Array<string>,
        showDisable?: boolean
    ): Array<{
        floorId: string;
        index: number;
        x: number;
        y: number;
        block: Block;
    }>;

    /**
     * 根据给定的筛选函数搜索全部满足条件的图块
     * @example core.searchBlockWithFilter(function (block) { return block.event.id.endsWith('Door'); }); // 搜索当前地图的所有门
     * @param blockFilter 筛选函数，可接受block输入，应当返回一个boolean值
     * @param floorId 地图id，不填视为当前地图
     * @param showDisable 隐藏点是否计入，true表示计入
     * @returns 一个详尽的数组
     */
    searchBlockWithFilter(
        blockFilter: (block: Block) => boolean,
        floorId?: string | Array<string>,
        showDisable?: boolean
    ): Array<{
        floorId: string;
        index: number;
        x: number;
        y: number;
        block: Block;
    }>;

    /**
     * 显示（隐藏或显示的）图块，此函数将被“显示事件”指令和勾选了“不消失”的“移动/跳跃事件”指令（如阻击怪）的终点调用
     * @example core.showBlock(0, 0); // 显示地图左上角的图块
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    showBlock(x: number, y: number, floorId?: string): void;

    /**
     * 隐藏一个图块，对应于「隐藏事件」且不删除
     * @example core.hideBlock(0, 0); // 隐藏地图左上角的图块
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    hideBlock(x: number, y: number, floorId?: string): void;

    /**
     * 删除一个图块，对应于「隐藏事件」并同时删除
     * @example core.removeBlock(0, 0); // 尝试删除地图左上角的图块
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    removeBlock(x: number, y: number, floorId?: string): void;

    /**
     * 转变图块
     * @example core.setBlock(1, 0, 0); // 把地图左上角变成黄墙
     * @param number 新图块的数字（也支持纯数字字符串如'1'）或id
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    setBlock(
        number: number | string,
        x: number,
        y: number,
        floorId?: string
    ): void;

    /**
     * 批量替换图块
     * @example core.replaceBlock(21, 22, core.floorIds); // 把游戏中地上当前所有的黄钥匙都变成蓝钥匙
     * @param fromNumber 旧图块的数字
     * @param toNumber 新图块的数字
     * @param floorId 地图id或其数组，不填视为当前地图
     */
    replaceBlock(
        fromNumber: number,
        toNumber: number,
        floorId?: string | Array<string>
    ): void;

    /**
     * 转变图层块
     * @example core.setBgFgBlock('bg', 167, 6, 6); // 把当前地图背景层的中心块改为滑冰
     * @param name 背景还是前景
     * @param number 新图层块的数字（也支持纯数字字符串如'1'）或id
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 地图id，不填视为当前地图
     */
    setBgFgBlock(
        name: 'bg' | 'fg',
        number: number | string,
        x: number,
        y: number,
        floorId?: string
    ): void;

    /**
     * 移动图块
     * @example core.moveBlock(0, 0, ['down']); // 令地图左上角的图块下移一格，用时半秒，再花半秒淡出
     * @param x 起点的横坐标
     * @param y 起点的纵坐标
     * @param steps 步伐数组
     * @param time 单步和淡出用时，单位为毫秒。不填视为半秒
     * @param keep 是否不淡出，true表示不淡出
     * @param callback 移动或淡出后的回调函数，可选
     */
    moveBlock(
        x: number,
        y: number,
        steps: step[],
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
     * @param callback 落地或淡出后的回调函数，可选
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
     * 播放动画，注意即使指定了主角的坐标也不会跟随主角移动，如有需要请使用core.drawHeroAnimate(name, callback)函数
     * @example core.drawAnimate('attack', core.nextX(), core.nextY(), false, core.vibrate); // 在主角面前一格播放普攻动画，动画停止后视野左右抖动1秒
     * @param name 动画文件名，不含后缀
     * @param x 绝对横坐标
     * @param y 绝对纵坐标
     * @param alignWindow 是否是相对窗口的坐标
     * @param callback 动画停止后的回调函数，可选
     * @returns 一个数字，可作为core.stopAnimate()的参数来立即停止播放（届时还可选择是否执行此次播放的回调函数）
     */
    drawAnimate(
        name: string,
        x: number,
        y: number,
        alignWindow: boolean,
        callback?: () => void
    ): number;

    /**
     * 播放跟随勇士的动画
     * @param name 动画名
     * @param callback 动画停止后的回调函数，可选
     * @returns 一个数字，可作为core.stopAnimate()的参数来立即停止播放（届时还可选择是否执行此次播放的回调函数）
     */
    drawHeroAnimate(name: string, callback?: () => void): number;

    /**
     * 立刻停止一个动画播放
     * @param id 播放动画的编号，即drawAnimate或drawHeroAnimate返回值
     * @param doCallback 是否执行该动画的回调函数
     */
    stopAnimate(id?: number, doCallback?: boolean): void;

    /** 获得当前正在播放的所有（指定）动画的id列表 */
    getPlayingAnimates(name?: string): Array<number>;

    /** 加载某个楼层（从剧本或存档中） */
    loadFloor(floorId: string, map?: any): ResolvedMap;

    /** 根据需求解析出blocks */
    extractBlocks(map?: any): void;

    /** 根据需求为UI解析出blocks */
    extractBlocks(map?: any, flags?: any): void;

    /** 根据数字获得图块 */
    getBlockByNumber(number: number): Block;

    /** 根据ID获得图块 */
    getBlockById(id: string): Block;

    /** 获得当前事件点的ID */
    getIdOfThis(id?: string): string;

    /** 初始化一个图块 */
    initBlock(
        x?: number,
        y?: number,
        id?: string | number,
        addInfo?: boolean,
        eventFloor?: any
    ): Block;

    /** 压缩地图 */
    compressMap(mapArr?: any, floorId?: string): object;

    /** 解压缩地图 */
    decompressMap(mapArr?: any, floorId?: string): object;

    /** 将当前地图重新变成数字，以便于存档 */
    saveMap(floorId?: string): any;

    /** 将存档中的地图信息重新读取出来 */
    loadMap(data?: any, floorId?: string, flags?: any): object;

    /** 更改地图画布的尺寸 */
    resizeMap(floorId?: string): void;

    /** 以x,y的形式返回每个点的事件 */
    getMapBlocksObj(
        floorId?: string,
        noCache?: boolean
    ): Record<`${number},${number}`, Block>;

    /** 获得某些点可否通行的信息 */
    canMoveDirectlyArray(locs?: any): object;

    /** 绘制一个图块 */
    drawBlock(block?: any, animate?: any): void;

    /** 生成groundPattern */
    generateGroundPattern(floorId?: string): void;

    /** 某个点是否存在NPC */
    npcExists(x?: number, y?: number, floorId?: string): boolean;

    /** 某个点是否存在（指定的）地形 */
    terrainExists(
        x?: number,
        y?: number,
        id?: string,
        floorId?: string
    ): boolean;

    /** 某个点是否存在楼梯 */
    stairExists(x?: number, y?: number, floorId?: string): boolean;

    /** 当前位置是否在楼梯边；在楼传平面塔模式下对箭头也有效 */
    nearStair(): boolean;

    /** 某个点是否存在（指定的）怪物 */
    enemyExists(x?: number, y?: number, id?: string, floorId?: string): boolean;

    /** 获得某个点的block */
    getBlock(
        x?: number,
        y?: number,
        floorId?: string,
        showDisable?: boolean
    ): Block;

    /** 获得某个图块或素材的信息，包括ID，cls，图片，坐标，faceIds等等 */
    getBlockInfo(block?: any): any;

    /** 获得某个图块对应行走图朝向向下的那一项的id；如果不存在行走图绑定则返回自身id */
    getFaceDownId(block?: any): string;

    /** 根据图块的索引来隐藏图块 */
    hideBlockByIndex(index?: any, floorId?: string): void;

    /** 一次性隐藏多个block */
    hideBlockByIndexes(indexes?: any, floorId?: string): void;

    /** 根据block的索引（尽可能）删除该块 */
    removeBlockByIndex(index?: any, floorId?: string): void;

    /** 一次性删除多个block */
    removeBlockByIndexes(indexes?: any, floorId?: string): void;

    /** 显示前景/背景地图 */
    showBgFgMap(
        name?: string,
        loc?: any,
        floorId?: string,
        callback?: () => any
    ): void;

    /** 隐藏前景/背景地图 */
    hideBgFgMap(
        name?: string,
        loc?: any,
        floorId?: string,
        callback?: () => any
    ): void;

    /** 显示一个楼层贴图 */
    showFloorImage(loc?: any, floorId?: string, callback?: () => any): void;

    /** 隐藏一个楼层贴图 */
    hideFloorImage(loc?: any, floorId?: string, callback?: () => any): void;

    /** 动画形式转变某点图块 */
    animateSetBlock(
        number?: number | string,
        x?: number,
        y?: number,
        floorId?: string,
        time?: number,
        callback?: () => any
    ): void;

    /** 动画形式同时转变若干点图块 */
    animateSetBlocks(
        number?: number | string,
        locs?: any,
        floorId?: string,
        time?: number,
        callback?: () => any
    ): void;

    /** 事件转向 */
    turnBlock(
        direction?: string,
        x?: number,
        y?: number,
        floorId?: string
    ): void;

    /** 重置地图 */
    resetMap(floorId?: string | string[]): void;

    /** 显示/隐藏某个块时的动画效果 */
    animateBlock(loc?: any, type?: any, time?: any, callback?: () => any): void;

    /** 添加一个全局动画 */
    addGlobalAnimate(block?: any): void;

    /** 删除一个或所有全局动画 */
    removeGlobalAnimate(x?: number, y?: number, name?: string): void;

    /** 绘制UI层的box动画 */
    drawBoxAnimate(): void;
}
