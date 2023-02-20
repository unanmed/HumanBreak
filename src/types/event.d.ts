/**
 * 注册的系统事件函数
 */
type SystemEventFunc = (data: any, callback: (...params: any[]) => any) => void;

/**
 * 注册的事件函数
 */
type EventFunc = (data: any, x?: number, y?: number, prefix?: string) => void;

/**
 * 处理所有和事件相关的操作
 */
interface Events extends EventData {
    /**
     * 脚本编辑中的事件相关内容
     */
    eventdata: EventData;

    /**
     * 公共事件信息
     */
    commonEvent: Record<EventDeclaration, MotaEvent>;

    /**
     * 所有的系统事件
     */
    systemEvent: Record<string, SystemEventFunc>;

    /**
     * 注册的自定义事件
     */
    actions: Record<string, EventFunc>;

    /**
     * 开始新游戏
     * @example core.startGame('咸鱼乱撞', 0, ''); // 开始一局咸鱼乱撞难度的新游戏，随机种子为0
     * @param hard 难度名，会显示在左下角（横屏）或右下角（竖屏）
     * @param seed 随机种子，相同的种子保证了录像的可重复性
     * @param route 经由base64压缩后的录像，用于从头开始的录像回放
     * @param callback 回调函数
     */
    startGame(
        hard: string,
        seed?: number,
        route?: string,
        callback?: () => void
    ): void;

    /**
     * 游戏结束
     * @example core.gameOver(); // 游戏失败
     * @param ending 结局名，省略表示失败
     * @param fromReplay true表示在播放录像
     * @param norank true表示不计入榜单
     */
    gameOver(ending?: string, fromReplay?: boolean, norank?: boolean): void;

    /**
     * 重新开始游戏；此函数将回到标题页面
     */
    restart(): void;

    /**
     * 询问是否需要重新开始
     */
    confirmRestart(): void;

    /**
     * 注册一个系统事件
     * @param type 事件名
     * @param func 为事件的处理函数，可接受(data,callback)参数
     */
    registerSystemEvent(type: string, func: SystemEventFunc): void;

    /**
     * 注销一个系统事件
     * @param type 事件名
     */
    unregisterSystemEvent(type: string): void;

    /**
     * 执行一个系统事件
     * @param type 执行的事件名
     * @param data 数据信息
     * @param callback 传入事件处理函数的回调函数
     */
    doSystemEvent(
        type: string,
        data: any,
        callback?: (...params: any[]) => any
    ): void;

    /**
     * 触发(x,y)点的系统事件；会执行该点图块的script属性，同时支持战斗（会触发战后）、道具（会触发道具后）、楼层切换等等
     * @param x 横坐标
     * @param y 纵坐标
     * @param callback 回调函数
     */
    trigger(x: number, y: number, callback?: () => void): void;

    /**
     * 战斗，如果填写了坐标就会删除该点的敌人并触发战后事件
     * @example core.battle('greenSlime'); // 和从天而降的绿头怪战斗（如果打得过）
     * @param id 敌人id，必填
     * @param x 敌人的横坐标
     * @param y 敌人的纵坐标
     * @param force true表示强制战斗
     * @param callback 回调函数
     */
    battle(
        id: AllIdsOf<'enemys' | 'enemy48'>,
        x?: number,
        y?: number,
        force?: boolean,
        callback?: () => void
    ): void;

    /**
     * 开门（包括三种基础墙）
     * @example core.openDoor(0, 0, true, core.jumpHero); // 打开左上角的门，需要钥匙，然后主角原地跳跃半秒
     * @param x 门的横坐标
     * @param y 门的纵坐标
     * @param needKey true表示需要钥匙，会导致机关门打不开
     * @param callback 门完全打开后或打不开时的回调函数
     */
    openDoor(
        x: number,
        y: number,
        needKey?: boolean,
        callback?: () => void
    ): void;

    /**
     * 获得道具并提示，如果填写了坐标就会删除该点的该道具
     * @example core.getItem('book'); // 获得敌人手册并提示
     * @param id 道具id，必填
     * @param num 获得的数量，不填视为1，填了就别填坐标了
     * @param x 道具的横坐标
     * @param y 道具的纵坐标
     * @param callback 回调函数
     */
    getItem(
        id: AllIdsOf<'items'>,
        num?: number,
        x?: number,
        y?: number,
        callback?: () => void
    ): void;

    /**
     * 轻按获得面前的物品或周围唯一物品
     * @param noRoute 若为true则不计入录像
     */
    getNextItem(noRoute?: boolean): void;

    /**
     * 场景切换
     * @example core.changeFloor('MT0'); // 传送到主塔0层，主角坐标和朝向不变，黑屏时间取用户设置值
     * @param floorId 传送的目标地图id，可以填':before'和':after'分别表示楼下或楼上
     * @param stair 传送的位置，可以填':now'（保持不变，可省略）,':symmetry'（中心对称）,':symmetry_x'（左右对称）,':symmetry_y'（上下对称）或图块id（该图块最好在目标层唯一，一般为'downFloor'或'upFloor'）
     * @param heroLoc 传送的坐标（如果填写了，就会覆盖上述的粗略目标位置）和传送后主角的朝向（不填表示保持不变）
     * @param time 传送的黑屏时间，单位为毫秒。不填为用户设置值
     * @param callback 黑屏结束后的回调函数
     */
    changeFloor(
        floorId: FloorIds,
        stair?: FloorChangeStair | AllIds,
        heroLoc?: Partial<Loc>,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 是否到达过某个楼层
     * @param floorId 楼层id
     */
    hasVisitedFloor(floorId?: FloorIds): boolean;

    /**
     * 到达某楼层
     * @param floorId 楼层id
     */
    visitFloor(floorId?: FloorIds): void;

    /**
     * 推箱子
     * @param data 图块信息
     */
    pushBox(data?: Block): void;

    /**
     * 当前是否在冰上
     */
    onSki(number?: number): boolean;

    /**
     * 注册一个自定义事件
     * @param type 事件类型
     * @param func 事件的处理函数，可接受(data, x, y, prefix)参数
     * data为事件内容，x和y为当前点坐标（可为null），prefix为当前点前缀
     */
    registerEvent(type: string, func: EventFunc): void;

    /**
     * 注销一个自定义事件
     * @param type 事件类型
     */
    unregisterEvent(type: string): void;

    /**
     * 执行一个自定义事件
     * @param data 事件信息
     * @param x 事件横坐标
     * @param y 事件纵坐标
     * @param prefix 当前点前缀
     */
    doEvent(data: any, x?: number, y?: number, prefix?: string): void;

    /**
     * 直接设置事件列表
     * @param list 事件信息
     * @param x 横坐标
     * @param y 纵坐标
     * @param callback 事件执行完毕后的回调函数
     */
    setEvents(
        list: MotaEvent,
        x?: number,
        y?: number,
        callback?: () => void
    ): void;

    /**
     * 开始执行一系列自定义事件
     * @param list 事件信息
     * @param x 横坐标
     * @param y 纵坐标
     * @param callback 事件执行完毕后的回调函数
     */
    startEvents(
        list?: MotaEvent,
        x?: number,
        y?: number,
        callback?: () => void
    ): void;

    /**
     * 执行下一个事件指令，常作为回调
     * @example
     * // 事件中的原生脚本，配合勾选“不自动执行下一个事件”来达到此改变色调只持续到下次场景切换的效果
     * core.setCurtain([0,0,0,1], undefined, null, core.doAction);
     */
    doAction(): void;

    /**
     * 插入一段事件；此项不可插入公共事件，请用 core.insertCommonEvent
     * @example core.insertAction('一段文字'); // 插入一个显示文章
     * @param action 单个事件指令，或事件指令数组
     * @param x 新的当前点横坐标
     * @param y 新的当前点纵坐标
     * @param callback 新的回调函数
     * @param addToLast 插入的位置，true表示插入到末尾，否则插入到开头
     */
    insertAction(
        action: MotaEvent | MotaAction,
        x?: number,
        y?: number,
        callback?: () => void,
        addToLast?: boolean
    ): void;

    /**
     * 插入一个公共事件
     * @example core.insertCommonEvent('加点事件', [3]);
     * @param name 公共事件名；如果公共事件不存在则直接忽略
     * @param args 参数列表，为一个数组，将依次赋值给 flag:arg1, flag:arg2, ...
     * @param x 新的当前点横坐标
     * @param y 新的当前点纵坐标
     * @param callback 新的回调函数
     * @param addToLast 插入的位置，true表示插入到末尾，否则插入到开头
     */
    insertCommonEvent(
        name: EventDeclaration,
        args?: any[],
        x?: number,
        y?: number,
        callback?: () => void,
        addToLast?: boolean
    ): void;

    /**
     * 获得一个公共事件
     * @param name 公共事件名称
     */
    getCommonEvent(name: EventDeclaration): any;

    /**
     * 恢复一个事件
     * @param data 事件信息
     */
    recoverEvents(data?: any): boolean;

    /**
     * 检测自动事件
     */
    checkAutoEvents(): void;

    /**
     * 当前是否在执行某个自动事件
     * @param symbol 自动事件的标识符
     * @param value 不太清楚有什么用
     */
    autoEventExecuting(symbol?: string, value?: any): boolean;

    /**
     * 当前是否执行过某个自动事件
     * @param symbol 自动事件的标识符
     * @param value 不太清楚有什么用
     */
    autoEventExecuted(symbol?: string, value?: any): boolean;

    /**
     * 将当前点坐标入栈
     */
    pushEventLoc(x: number, y: number, floorId?: FloorIds): void;

    /**
     * 弹出事件坐标点
     */
    popEventLoc(): void;

    /**
     * 预编辑事件
     * @param data 事件信息
     */
    precompile(data?: any): any;

    /**
     * 点击怪物手册时的打开操作
     * @param fromUserAction 是否是用户开启的
     */
    openBook(fromUserAction?: boolean): void;

    /**
     * 点击楼层传送器时的打开操作
     * @param fromUserAction 是否是用户开启的
     */
    useFly(fromUserAction?: boolean): void;

    /** 点击装备栏时的打开操作 */
    openEquipbox(fromUserAction?: boolean): void;

    /**
     * 点击工具栏时的打开操作
     * @param fromUserAction 是否是用户开启的
     */
    openToolbox(fromUserAction?: boolean): void;

    /**
     * 点击快捷商店按钮时的打开操作
     * @param fromUserAction 是否是用户开启的
     */
    openQuickShop(fromUserAction?: boolean): void;

    /**
     * 点击虚拟键盘时的打开操作
     * @param fromUserAction 是否是用户开启的
     */
    openKeyBoard(fromUserAction?: boolean): void;

    /**
     * 点击存档按钮时的打开操作
     * @param fromUserAction 是否是用户开启的
     */
    save(fromUserAction?: boolean): void;

    /**
     * 点击读档按钮时的打开操作
     * @param fromUserAction 是否是用户开启的
     */
    load(fromUserAction?: boolean): void;

    /**
     * 点击设置按钮时的操作
     * @param fromUserAction 是否是用户开启的
     */
    openSettings(fromUserAction?: boolean): void;

    /**
     * 当前是否有未处理完毕的异步事件（不包含动画和音效）
     */
    hasAsync(): boolean;

    /**
     * 立刻停止所有异步事件
     */
    stopAsync(): void;

    /**
     * 是否有异步动画
     */
    hasAsyncAnimate(): boolean;

    /**
     * 跟随
     * @param name 要跟随的一个合法的4x4的行走图名称，需要在全塔属性注册
     */
    follow(name: ImageIds | NameMapIn<ImageIds>): void;

    /**
     * 取消跟随
     * @param name 取消跟随的行走图，不填则取消全部跟随者
     */
    unfollow(name?: ImageIds | NameMapIn<ImageIds>): void;

    /**
     * 数值操作
     * @param name 操作的数值的名称
     * @param operator 操作运算符
     * @param value 值
     * @param prefix 独立开关前缀
     */
    setValue(
        name: `${EventValuePreffix}:${string}`,
        operator: MotaOperator,
        value: number,
        prefix?: string
    ): void;

    /**
     * 设置一项敌人属性并计入存档
     * @example core.setEnemy('greenSlime', 'def', 0); // 把绿头怪的防御设为0
     * @param id 敌人id
     * @param name 属性的英文缩写
     * @param value 属性的新值
     * @param operator 操作符
     * @param prefix 独立开关前缀，一般不需要
     * @param norefresh 是否不刷新状态栏
     */
    setEnemy<K extends keyof Enemy>(
        id: AllIdsOf<'enemys' | 'enemy48'>,
        name: K,
        value: Enemy[K],
        operator?: MotaOperator,
        prefix?: string,
        norefresh?: boolean
    ): void;

    /**
     * 设置某个点的敌人属性
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param name 属性的英文缩写
     * @param value 属性的新值
     * @param operator 操作符
     * @param prefix 独立开关前缀，一般不需要
     * @param norefresh 是否不刷新状态栏
     */
    setEnemyOnPoint<K extends keyof Enemy>(
        x: number,
        y: number,
        floorId: FloorIds,
        name: K,
        value: Enemy[K],
        operator?: MotaOperator,
        prefix?: string,
        norefresh?: boolean
    ): void;

    /**
     * 重置某个点的敌人属性
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param norefresh 是否不刷新状态栏
     */
    resetEnemyOnPoint(
        x: number,
        y: number,
        floorId?: FloorIds,
        norefresh?: boolean
    ): void;

    /**
     * 将某个点已经设置的敌人属性移动到其他点
     * @param fromX 起始横坐标
     * @param fromY 起始纵坐标
     * @param toX 目标横坐标
     * @param toY 目标纵坐标
     * @param floorId 楼层id
     * @param norefresh 是否不刷新状态栏
     */
    moveEnemyOnPoint(
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        floorId?: FloorIds,
        norefresh?: boolean
    ): void;

    /**
     * 设置一项楼层属性并刷新状态栏
     * @example core.setFloorInfo('ratio', 2, 'MT0'); // 把主塔0层的血瓶和宝石变为双倍效果
     * @param name 要求改的属性名
     * @param values 属性的新值
     * @param floorId 楼层id，不填视为当前层
     * @param prefix 独立开关前缀，一般不需要，下同
     */
    setFloorInfo<K extends keyof Floor>(
        name: K,
        values?: Floor[K],
        floorId?: FloorIds,
        prefix?: string
    ): void;

    /**
     * 设置全塔属性
     * @param name 属性名
     * @param value 属性值
     */
    setGlobalAttribute<K extends keyof GlobalAttribute>(
        name: K,
        value: GlobalAttribute[K]
    ): void;

    /**
     * 设置一个系统开关
     * @example core.setGlobalFlag('steelDoorWithoutKey', true); // 使全塔的所有铁门都不再需要钥匙就能打开
     * @param name 系统开关的英文名
     * @param value 开关的新值，您可以用!core.flags[name]简单地表示将此开关反转
     */
    setGlobalFlag<K extends keyof CoreFlags>(
        name: K,
        value: CoreFlags[K]
    ): void;

    /**
     * 设置文件别名
     * @param name 别名
     * @param value 别名对应的文件名
     */
    setNameMap(name: string, value?: SourceIds): void;

    /**
     * 设置剧情文本的属性
     */
    setTextAttribute(data: Partial<TextAttribute>): void;

    /**
     * 移动对话框
     * @param code 对话框的代码
     * @param loc 目标位置
     * @param relative 是否是相对模式
     * @param moveMode 缓动模式
     * @param time 动画时间
     * @param callback 移动完毕的回调函数
     */
    moveTextBox(
        code: number,
        loc: LocArr,
        relative?: boolean,
        moveMode?: EaseMode,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 清除对话框
     * @param code 对话框的代码
     * @param callback 回调函数
     */
    clearTextBox(code: number, callback: () => void): void;

    /**
     * 关门，目标点必须为空地
     * @example core.closeDoor(0, 0, 'yellowWall', core.jumpHero); // 在左上角关掉一堵黄墙，然后主角原地跳跃半秒
     * @param x 横坐标
     * @param y 纵坐标
     * @param id 门的id，也可以用三种基础墙
     * @param callback 门完全关上后的回调函数
     */
    closeDoor(
        x: number,
        y: number,
        id: AllIdsOf<Exclude<Cls, 'enemys' | 'enemy48'>>,
        callback?: () => void
    ): void;

    /**
     * 显示一张图片
     * @example
     * // 裁剪winskin.png的最左边128×128px，放大到铺满整个视野，1秒内淡入到50%透明，编号为1
     * core.showImage(1, core.material.images.images['winskin.png'], [0,0,128,128], [0,0,416,416], 0.5, 1000);
     * @param code 图片编号，为不大于50的正整数，加上100后就是对应画布层的z值，较大的会遮罩较小的，注意色调层的z值为125，UI层为140
     * @param image 图片文件名（可以是全塔属性中映射前的中文名）或图片对象（见上面的例子）
     * @param sloc 一行且至多四列的数组，表示从原图裁剪的左上角坐标和宽高
     * @param loc 一行且至多四列的数组，表示图片在视野中的左上角坐标和宽高
     * @param opacityVal 不透明度，为小于1的正数。不填视为1
     * @param time 淡入时间，单位为毫秒。不填视为0
     * @param callback 图片完全显示出来后的回调函数
     */
    showImage(
        code: number,
        image: ImageIds | NameMapIn<ImageIds> | ImageSource,
        sloc?: [number, number, number, number],
        loc?: [number, number, number?, number?],
        opacityVal?: number,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 隐藏一张图片
     * @example core.hideImage(1, 1000, core.jumpHero); // 1秒内淡出1号图片，然后主角原地跳跃半秒
     * @param code 图片编号
     * @param time 淡出时间，单位为毫秒
     * @param callback 图片完全消失后的回调函数
     */
    hideImage(code: number, time?: number, callback?: () => void): void;

    /**
     * 移动一张图片并/或改变其透明度
     * @example core.moveImage(1, null, 0.5); // 1秒内把1号图片变为50%透明
     * @param code 图片编号
     * @param to 新的左上角坐标，省略表示原地改变透明度
     * @param opacityVal 新的透明度，省略表示不变
     * @param moveMode 移动模式
     * @param time 移动用时，单位为毫秒。不填视为1秒
     * @param callback 图片移动完毕后的回调函数
     */
    moveImage(
        code: number,
        to?: LocArr,
        opacityVal?: number,
        moveMode?: string,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 旋转一张图片
     * @param code 图片编号
     * @param center 旋转中心像素（以屏幕为基准）；不填视为图片本身中心
     * @param angle 旋转角度；正数为顺时针，负数为逆时针
     * @param moveMode 旋转模式
     * @param time 移动用时，单位为毫秒。不填视为1秒
     * @param callback 图片移动完毕后的回调函数
     */
    rotateImage(
        code: number,
        center?: LocArr,
        angle?: number,
        moveMode?: EaseMode,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 放缩一张图片
     * @param code 图片编号
     * @param center 旋转中心像素（以屏幕为基准）；不填视为图片本身中心
     * @param scale 放缩至的比例
     * @param moveMode 旋转模式
     * @param time 移动用时，单位为毫秒。不填视为1秒
     * @param callback 图片移动完毕后的回调函数
     */
    scaleImage(
        code: number,
        center?: LocArr,
        scale?: number,
        moveMode?: string,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 绘制一张动图或擦除所有动图
     * @example core.showGif(); // 擦除所有动图
     * @param name 动图文件名，可以是全塔属性中映射前的中文名
     * @param x 动图在视野中的左上角横坐标
     * @param y 动图在视野中的左上角纵坐标
     */
    showGif(
        name?:
            | Extract<ImageIds, EndsWith<'.gif'>>
            | NameMapIn<Extract<ImageIds, EndsWith<'.gif'>>>,
        x?: number,
        y?: number
    ): void;

    /**
     * 调节bgm的音量
     * @example core.setVolume(0, 100, core.jumpHero); // 0.1秒内淡出bgm，然后主角原地跳跃半秒
     * @param value 新的音量，为0或不大于1的正数。注意系统设置中是这个值的平方根的十倍
     * @param time 渐变用时，单位为毫秒。不填或小于100毫秒都视为0
     * @param callback 渐变完成后的回调函数
     */
    setVolume(value: number, time?: number, callback?: () => void): void;

    /**
     * 视野抖动
     * @example core.vibrate(); // 视野左右抖动1秒
     * @param direction 抖动方向
     * @param time 抖动时长，单位为毫秒
     * @param speed 抖动速度
     * @param power 抖动幅度
     * @param callback 抖动平息后的回调函数
     */
    vibrate(
        direction?: string,
        time?: number,
        speed?: number,
        power?: number,
        callback?: () => void
    ): void;

    /**
     * 强制移动主角（包括后退），这个函数的作者已经看不懂这个函数了
     * @example core.eventMoveHero(['forward'], 125, core.jumpHero); // 主角强制前进一步，用时1/8秒，然后主角原地跳跃半秒
     * @param steps 步伐数组，注意后退时跟随者的行为会很难看
     * @param time 每步的用时，单位为毫秒。0或不填则取主角的移速，如果后者也不存在就取0.1秒
     * @param callback 移动完毕后的回调函数
     */
    eventMoveHero(steps: Step[], time?: number, callback?: () => void): void;

    /**
     * 主角跳跃，跳跃勇士。ex和ey为目标点的坐标，可以为null表示原地跳跃。time为总跳跃时间。
     * @example core.jumpHero(); // 主角原地跳跃半秒
     * @param ex 跳跃后的横坐标
     * @param ey 跳跃后的纵坐标
     * @param time 跳跃时长，单位为毫秒。不填视为半秒
     * @param callback 跳跃完毕后的回调函数
     */
    jumpHero(
        ex?: number,
        ey?: number,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 更改主角行走图
     * @example core.setHeroIcon('npc48.png', true); // 把主角从阳光变成样板0层左下角的小姐姐，但不立即刷新
     * @param name 新的行走图文件名，可以是全塔属性中映射前的中文名。映射后会被存入core.status.hero.image
     * @param noDraw true表示不立即刷新（刷新会导致大地图下视野重置到以主角为中心）
     */
    setHeroIcon(name: string, noDraw?: boolean): void;

    /** 检查升级事件 */
    checkLvUp(): void;

    /**
     * 尝试使用一个道具
     * @example core.tryUseItem('pickaxe'); // 尝试使用破墙镐
     * @param itemId 道具id，其中敌人手册、传送器和飞行器会被特殊处理
     */
    tryUseItem(itemId: ItemIdOf<'tools' | 'constants'>): void;
}

declare const events: new () => Events;
