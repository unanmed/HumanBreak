/**
 * 帧动画函数
 */
type FrameFunc = (time: number) => void;

/**
 * 录像操作函数，返回true表示执行成功
 */
type ReplayFunc = (action: string) => boolean;

/**
 * 游戏画面大小变化时执行的函数
 */
type ResizeFunc = (obj: DeepReadonly<ResizeObj>) => void;

/**
 * 勇士属性中的数字属性
 */
type NumbericHeroStatus = SelectType<HeroStatus, number>;

/**
 * 存读档类型
 */
type SLType =
    | 'save'
    | 'load'
    | 'reload'
    | 'replayLoad'
    | 'replayRemain'
    | 'replaySince';

/**
 * 天气等级
 */
type WeatherLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * resize函数的参数
 */
interface ResizeObj {
    /**
     * body元素的宽度
     */
    clientWidth: number;

    /**
     * body元素的高度
     */
    clientHeight: number;

    /**
     * 边框的宽度
     */
    BORDER: 3;

    /**
     * 状态栏的宽度
     */
    BAR_WIDTH: number;

    /**
     * 工具栏的高度
     */
    TOOLBAR_HEIGHT: 38;

    /**
     * 计算边框之后的游戏画面的宽度
     */
    outerWidth: number;

    /**
     * 计算边框之后的游戏画面的高度
     */
    outerHeight: number;

    /**
     * 全局属性
     */
    globalAttribute: GlobalAttribute;

    /**
     * 边框样式，css字符串
     */
    border: string;

    /**
     * 状态栏显示的状态项
     */
    statusDisplayArr: string[];

    /**
     * 状态栏显示的状态项数
     */
    count: number;

    /**
     * 状态栏显示的行数
     */
    col: number;

    /**
     * 竖屏下状态栏的高度
     */
    statusBarHeightInVertical: number;

    /**
     * 竖屏下工具栏的高度
     */
    toolbarHeightInVertical: number;

    /**
     * 是否开启底部工具栏
     */
    extendToolbar: number;

    /**
     * @deprecated
     * 是否是15x15
     */
    is15x15: false;
}

interface RenderFrame {
    /**
     * 帧动画的名称
     */
    name: string;

    /**
     * 是否需要进入游戏后才执行
     */
    needPlaying: boolean;

    /**
     * 每帧执行的函数
     */
    func: FrameFunc;
}

interface ReplayAction {
    /**
     * 录像操作的名称
     */
    name: string;

    /**
     * 录像操作执行的函数
     */
    func: ReplayFunc;
}

interface ResizeAction {
    /**
     * resize操作的名称
     */
    name: string;

    /**
     * 游戏画面变化时执行的函数
     */
    func: ResizeFunc;
}

interface WeatherAction {
    /**
     * 天气每帧执行的函数
     */
    frameFunc?: (time: number, level: WeatherLevel) => void;

    /**
     * 天气的初始化函数
     */
    initFunc: (level: WeatherLevel) => void;
}

interface FrameObj {
    angle: number;
    index: number;
    mirror: number;
    opacity: number;
    x: number;
    y: number;
    zoom: number;
}

/**
 * 主要用来进行游戏控制，比如行走控制、自动寻路、存读档等等游戏核心内容
 */
interface Control {
    /**
     * 刷新状态栏时是否不执行自动事件
     */
    readonly noAutoEvent: boolean;

    /**
     * 注册的帧动画
     */
    readonly renderFrameFunc: RenderFrame[];

    /**
     * 注册的录像操作
     */
    readonly replayActions: ReplayAction[];

    /**
     * 注册的resize操作
     */
    readonly resizes: ResizeAction[];

    /**
     * 注册的天气
     */
    readonly weathers: Record<string, WeatherAction>;

    /**
     * 脚本编辑的control函数列表
     */
    readonly controlData: ControlData;

    /**
     * 注册一个animationFrame
     * @param name 名称，可用来作为注销使用
     * @param needPlaying 是否只在游戏运行时才执行（在标题界面不执行）
     * @param func 要执行的函数，传入time（从页面加载完毕到当前所经过的时间）作为参数
     */
    registerAnimationFrame(
        name: string,
        needPlaying: boolean,
        func: FrameFunc
    ): void;

    /**
     * 注销一个animationFrame
     * @param name 要注销的函数名称
     */
    unregisterAnimationFrame(name: string): void;

    /**
     * 进入标题画面
     * @example core.showStartAnimate(); // 重启游戏但不重置bgm
     * @param noAnimate 是否不由黑屏淡入而是立即亮屏
     * @param callback 完全亮屏后的回调函数
     */
    showStartAnimate(noAnimate?: boolean, callback?: () => void): void;

    /**
     * 淡出标题画面
     * @example core.hideStartAnimate(core.startGame); // 淡出标题画面并开始新游戏，跳过难度选择
     * @param callback 标题画面完全淡出后的回调函数
     */
    hideStartAnimate(callback?: () => void): void;

    /**
     * 判断游戏是否已经开始
     */
    isPlaying(): boolean;

    /**
     * 清除游戏状态和数据
     */
    clearStatus(): void;

    /**
     * 清除地图上绘制的自动寻路路线
     */
    clearAutomaticRouteNode(x: number, y: number): void;

    /**
     * 停止自动寻路操作
     */
    stopAutomaticRoute(): void;

    /**
     * 保存剩下的寻路，并停止
     */
    saveAndStopAutomaticRoute(): void;

    /**
     * 继续剩下的自动寻路操作
     */
    continueAutomaticRoute(): void;

    /**
     * 清空剩下的自动寻路列表
     */
    clearContinueAutomaticRoute(callback?: () => any): void;

    /**
     * 半自动寻路，用于鼠标或手指拖动
     * @param destX 鼠标或手指的起拖点横坐标
     * @param destY 鼠标或手指的起拖点纵坐标
     * @param stepPostfix 拖动轨迹的数组表示，每项为一步的方向和目标点。
     */
    setAutomaticRoute(destX: number, destY: number, stepPostfix: Loc[]): void;

    /**
     * 连续行走
     * @param steps 压缩的步伐数组，每项表示朝某方向走多少步
     */
    setAutoHeroMove(steps: CompressedStep[]): void;

    /**
     * 设置行走的效果动画
     */
    setHeroMoveInterval(callback?: () => any): void;

    /**
     * 每移动一格后执行的函数
     */
    moveOneStep(callback?: () => any): void;

    /**
     * 尝试前进一步，如果面前不可被踏入就会直接触发该点事件
     * @example core.moveAction(core.doAction); // 尝试前进一步，然后继续事件处理
     * @param callback 走一步后的回调函数
     */
    moveAction(callback?: () => void): void;

    /**
     * 连续前进，不撞南墙不回头
     * @example core.moveHero(); // 连续前进
     * @param direction 移动的方向，不设置就是勇士当前的方向
     * @param callback 回调函数，设置了就只走一步
     */
    moveHero(direction?: Dir, callback?: () => void): void;

    /**
     * 当前是否正在移动
     */
    isMoving(): boolean;

    /**
     * 停止勇士的一切行动并等待勇士停下
     * @example core.waitHeroToStop(core.vibrate); // 等待勇士停下，然后视野左右抖动1秒
     * @param callback 勇士停止后的回调函数
     */
    waitHeroToStop(callback?: () => void): void;

    /**
     * 主角转向并计入录像，不会导致跟随者聚集，会导致视野重置到以主角为中心
     * @example core.turnHero(); // 主角顺时针旋转，即单击主角或按下Z键的效果
     * @param direction 主角的新朝向，可为up, down, left, right, :left, :right, :back七种之一，不填视为:right
     */
    turnHero(direction?: TurnDir): void;

    /**
     * 瞬移到某一点
     * @param x 瞬移至的横坐标
     * @param y 瞬移至的纵坐标
     * @param ignoreSteps 忽略的步数，不填则会自动计算
     */
    moveDirectly(x: number, y: number, ignoreSteps?: number): boolean;

    /**
     * 尝试瞬移，如果该点有图块/事件/阻激夹域捕则会瞬移到它旁边再走一步（不可踏入的话当然还是触发该点事件），这一步的方向优先和瞬移前主角的朝向一致
     * @example core.tryMoveDirectly(6, 0); // 尝试瞬移到地图顶部的正中央，以样板0层为例，实际效果是瞬移到了上楼梯下面一格然后向上走一步并触发上楼事件
     * @param destX 目标点的横坐标
     * @param destY 目标点的纵坐标
     */
    tryMoveDirectly(destX: number, destY: number): boolean;

    /**
     * 绘制主角和跟随者并重置视野到以主角为中心
     * @example core.drawHero(); // 原地绘制主角的静止帧
     * @param status 绘制状态
     * @param offset 相对主角逻辑位置的偏移量，不填视为无偏移
     * @param frame 绘制第几帧
     */
    drawHero(
        status?: Exclude<keyof MaterialIcon['hero']['down'], 'loc'>,
        offset?: number,
        frame?: number
    ): void;

    /**
     * 改变勇士的不透明度
     * @param opacity 要设置成的不透明度
     * @param moveMode 动画的缓动模式
     * @param time 动画时间，不填视为无动画
     * @param callback 动画执行完毕的回调函数
     */
    setHeroOpacity(
        opacity: number,
        moveMode?: EaseMode,
        time?: any,
        callback?: () => any
    ): void;

    /**
     * 设置游戏系统画布的偏移量
     * @param canvasId 字符串或数字，根据ts的说法应该只能填数字，但是浏览器会提高字符串的方式。
     * 但是还是建议填数字，排列顺序一般是纵深从低到高排列
     * @param x 偏移横坐标
     * @param y 偏移纵坐标
     */
    setGameCanvasTranslate(
        canvasId: string | number,
        x: number,
        y: number
    ): void;

    /**
     * 加减所有游戏系统画布的偏移
     * @param x 增加的横坐标
     * @param y 增加的纵坐标
     */
    addGameCanvasTranslate(x: number, y: number): void;

    /**
     * 更新大地图的可见区域
     */
    updateViewport(): void;

    /**
     * 设置视野范围
     * @param px 相对大地图左上角的偏移横坐标，单位像素
     * @param py 相对大地图左上角的偏移纵坐标，单位像素
     */
    setViewport(px?: number, py?: number): void;

    /**
     * 移动视野范围，这东西真的有人用吗...高级动画 + setViewport就完事了（
     * @param x 移动的横坐标，单位格子
     * @param y 移动的纵坐标，单位格子
     * @param moveMode 缓动方式
     * @param time 动画时间
     * @param callback 动画完毕后的回调函数
     */
    moveViewport(
        x: number,
        y: number,
        moveMode?: EaseMode,
        time?: number,
        callback?: () => void
    ): void;

    /**
     * 获取主角面前第n格的横坐标
     * @example core.closeDoor(core.nextX(), core.nextY(), 'yellowDoor', core.turnHero); // 在主角面前关上一扇黄门，然后主角顺时针旋转90°
     * @param n 目标格与主角的距离，面前为正数，背后为负数，脚下为0，不填视为1
     */
    nextX(n?: number): number;

    /**
     * 获取主角面前第n格的纵坐标
     * @example core.jumpHero(core.nextX(2), core.nextY(2)); // 主角向前跃过一格，即跳跃靴道具的使用效果
     * @param n 目标格与主角的距离，面前为正数，背后为负数，脚下为0，不填视为1
     */
    nextY(n?: number): number;

    /**
     * 判定主角是否身处某个点的锯齿领域(取曼哈顿距离)
     * @example core.nearHero(6, 6, 6); // 判定主角是否身处点（6，6）的半径为6的锯齿领域
     * @param x 领域的中心横坐标
     * @param y 领域的中心纵坐标
     * @param n 领域的半径，不填视为1
     */
    nearHero(x: number, y: number, n?: number): boolean;

    /**
     * 立刻聚集所有的跟随者
     */
    gatherFollowers(): void;

    /**
     * 更新跟随者坐标
     */
    updateFollowers(): void;

    /**
     * 更新领域、夹击、阻击的伤害地图
     * @param floorId 更新的地图id
     */
    updateCheckBlock(floorId?: FloorIds): void;

    /**
     * 检查并执行领域、夹击、阻击事件
     */
    checkBlock(): void;

    /**
     * @deprecated 使用core.updateStatusBar代替。重算并绘制地图显伤
     * @example core.updateDamage(); // 更新当前地图的显伤，绘制在显伤层（废话）
     * @param floorId 地图id，不填视为当前地图。预览地图时填写
     * @param ctx 绘制到的画布，如果填写了就会画在该画布而不是显伤层
     */
    updateDamage(floorId?: FloorIds, ctx?: CtxRefer): void;

    /**
     * 重绘地图显伤
     * @param ctx 绘制到的画布
     */
    drawDamage(ctx?: CtxRefer): void;

    /**
     * 选择录像文件
     */
    chooseReplayFile(): void;

    /**
     * 开始播放一个录像
     */
    startReplay(list: string[]): void;

    /**
     * 更改播放状态，暂停还是播放
     */
    triggerReplay(): void;

    /**
     * 暂停播放
     */
    pauseReplay(): void;

    /**
     * 恢复播放
     */
    resumeReplay(): void;

    /**
     * 单步播放
     */
    stepReplay(): void;

    /**
     * 加速播放
     */
    speedUpReplay(): void;

    /**
     * 减速播放
     */
    speedDownReplay(): void;

    /**
     * 设置播放速度
     */
    setReplaySpeed(speed: number): void;

    /**
     * 停止录像播放
     * @param force 是否是强制停止播放（例如点击停止播放按钮）
     */
    stopReplay(force?: boolean): void;

    /**
     * 回退录像播放
     */
    rewindReplay(): void;

    /**
     * 是否正在播放录像
     */
    isReplaying(): boolean;

    /**
     * 回放下一个操作
     */
    replay(): void;

    /**
     * 注册一个录像行为
     * @param name 自定义名称，可用于注销使用
     * @param func 具体执行录像的函数，可为一个函数或插件中的函数名；
     * 需要接受一个action参数，代表录像回放时的下一个操作
     * func返回true代表成功处理了此录像行为，false代表没有处理此录像行为。
     */
    registerReplayAction(name: string, func: ReplayFunc): void;

    /**
     * 注销一个录像行为
     * @param 要注销的录像行为
     */
    unregisterReplayAction(name: string): void;

    /**
     * 自动存档
     * @param removeLast 是否移除位于自动存档栈底部的存档
     */
    autosave(removeLast?: any): void;

    /**
     * 实际进行自动存档
     */
    checkAutosave(): void;

    /**
     * 实际进行存读档事件
     */
    doSL(id: string, type: SLType): void;

    /**
     * 同步存档到服务器
     * @param type 同步的类型，填all表示所有都同步，否则只同步当前存档
     */
    syncSave(type?: 'all'): void;

    /**
     * 从服务器加载存档
     */
    syncLoad(): void;

    /**
     * 存档到本地
     */
    saveData(): Save;

    /**
     * 从本地读档
     */
    loadData(data: Save, callback?: () => void): void;

    /**
     * 获得某个存档内容
     */
    getSave(index: number, callback?: (data?: Save) => void): void;

    /**
     * 获得某些存档内容
     */
    getSaves(ids: number, callback?: (data?: Save) => void): void;
    getSaves(
        ids: number[],
        callback?: (data?: Record<number, Save>) => void
    ): void;

    /**
     * 获得所有存档内容
     */
    getAllSaves(callback?: (data?: Save[]) => void): void;

    /**
     * 获得所有存在存档的存档位
     */
    getSaveIndexes(callback?: (data: Record<number, true>) => void): void;

    /**
     * 判断某个存档位是否存在存档
     */
    hasSave(index: number): boolean;

    /**
     * 删除某个存档
     */
    removeSave(index: number, callback?: () => void): void;

    /**
     * 设置主角的某个属性
     * @example core.setStatus('loc', {x : 0, y : 0, direction : 'up'}); // 设置主角位置为地图左上角，脸朝上
     * @param name 属性名
     * @param value 属性的新值
     */
    setStatus<K extends keyof HeroStatus>(name: K, value: HeroStatus[K]): void;

    /**
     * 增减主角的某个属性，等价于core.setStatus(name, core.getStatus(name) + value)
     * @example core.addStatus('name', '酱'); // 在主角的名字后加一个“酱”字
     * @param name 属性名
     * @param value 属性的增量，请注意旧量和增量中只要有一个是字符串就会把两者连起来成为一个更长的字符串
     */
    addStatus<K extends keyof SelectType<HeroStatus, number | string>>(
        name: K,
        value: HeroStatus[K]
    ): void;

    /**
     * 读取主角的某个属性，不包括百分比修正
     * @example core.getStatus('loc'); // 读取主角的坐标和朝向
     * @param name 属性名
     * @returns 属性值
     */
    getStatus<K extends keyof HeroStatus>(name: K): HeroStatus[K];

    /**
     * 从status中获得属性，如果不存在则从勇士属性中获取
     * @param status 要从中获取的属性对象
     * @param name 属性名
     */
    getStatusOrDefault<K extends keyof HeroStatus>(
        status?: DeepPartial<HeroStatus>,
        name?: K
    ): HeroStatus[K];

    /**
     * 计算主角的某个属性，包括百分比修正
     * @example core.getRealStatus('atk'); // 计算主角的攻击力，包括百分比修正。战斗使用的就是这个值
     * @param name 属性名，注意只能用于数值类属性
     */
    getRealStatus<K extends keyof NumbericHeroStatus>(name: K): number;

    /**
     * 从status中获得增幅后的属性，如果不存在则从勇士属性中获取
     * @param status 要从中获取的属性对象
     * @param name 属性名
     */
    getRealStatusOrDefault<K extends keyof NumbericHeroStatus>(
        status?: DeepPartial<NumbericHeroStatus>,
        name?: K
    ): number;

    /**
     * 获得勇士原始属性（无装备和衰弱影响）
     * @param name 获取的属性名
     */
    getNakedStatus(name?: keyof NumbericHeroStatus): number;

    /**
     * 获得某个状态的中文名
     * @param name 要获取的属性名
     */
    getStatusLabel(name: string): string;

    /**
     * 设置主角某个属性的百分比修正倍率，初始值为1，
     * 倍率存放在flag: `__${name}_${buff}__` 中
     * @example core.setBuff('atk', 0.5); // 主角能发挥出的攻击力减半
     * @param name 属性名，注意只能用于数值类属性
     * @param value 新的百分比修正倍率，不填（效果上）视为1
     */
    setBuff<K extends keyof NumbericHeroStatus>(name: K, value?: number): void;

    /**
     * 增减主角某个属性的百分比修正倍率，加减法叠加和抵消。等价于 core.setBuff(name, core.getBuff(name) + value)
     * @example core.addBuff('atk', -0.1); // 主角获得一层“攻击力减一成”的负面效果
     * @param name 属性名，注意只能用于数值类属性
     * @param value 倍率的增量
     */
    addBuff<K extends keyof NumbericHeroStatus>(name: K, value: number): void;

    /**
     * 读取主角某个属性的百分比修正倍率，初始值为1
     * @example core.getBuff('atk'); // 主角当前能发挥出多大比例的攻击力
     * @param name 属性的英文名
     */
    getBuff(name: keyof NumbericHeroStatus): number;

    /**
     * 设置勇士位置
     * 值得注意的是，这句话虽然会使勇士改变位置，但并不会使界面重新绘制；
     * 如需立刻重新绘制地图还需调用：core.clearMap('hero'); core.drawHero(); 来对界面进行更新。
     * @example core.setHeroLoc('x', 5) // 将勇士当前位置的横坐标设置为5。
     * @param name 要设置的坐标属性
     * @param value 新值
     * @param noGather 是否聚集跟随者
     */
    setHeroLoc(name: 'x' | 'y', value: number, noGather?: boolean): void;
    setHeroLoc(name: 'direction', value: Dir, noGather?: boolean): void;

    /**
     * 获取主角的位置，朝向
     * @example core.getHeroLoc(); // 获取主角的位置和朝向
     * @param name 要读取横坐标还是纵坐标还是朝向还是都读取
     */
    getHeroLoc(): Loc;
    getHeroLoc<K extends keyof Loc>(name: K): Loc[K];

    /**
     * 根据级别的数字获取对应的名称，后者定义在全塔属性
     * @example core.getLvName(); // 获取主角当前级别的名称，如“下级佣兵”
     * @param lv 级别的数字，不填则视为主角当前的级别
     * @returns 级别的名称，如果不存在就还是返回字符串类型的数字
     */
    getLvName(lv?: number): string;

    /**
     * 获得下次升级需要的经验值。
     * 升级扣除模式下会返回经验差值；非扣除模式下会返回总共需要的经验值。
     * 如果无法进行下次升级，返回null。
     */
    getNextLvUpNeed(): number | null;

    /**
     * 设置一个flag变量
     * @example core.setFlag('poison', true); // 令主角中毒
     * @param name 变量名，支持中文，这东西用中文就是不规范（
     * @param value 变量的新值，不填或填null视为删除
     */
    setFlag(name: string, value?: any): void;

    /**
     * 增减一个flag变量，等价于 core.setFlag(name, core.getFlag(name, 0) + value)
     * @example core.addFlag('hatred', 1); // 增加1点仇恨值
     * @param name 变量名，支持中文
     * @param value 变量的增量
     */
    addFlag(name: string, value: number | string): void;

    /**
     * 获取一个flag变量
     * @param name 变量名，支持中文，这东西用中文就是不规范（
     * @param defaultValue 当变量不存在时的返回值，可选（事件流中默认填0）。
     * @returns flags[name] ?? defaultValue
     */
    getFlag<T>(name: string, defaultValue?: T): T;

    /**
     * 判定一个flag变量是否不为falsy
     * @example core.hasFlag('poison'); // 判断主角当前是否中毒
     * @param name 变量名，支持中文，这东西用中文就是不规范（
     */
    hasFlag(name: string): boolean;

    /**
     * 删除某个flag
     * @param name 要删除的变量名
     */
    removeFlag(name: string): void;

    /**
     * 设置某个独立开关
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param name 独立开关的名称
     * @param value 要设置成的值
     */
    setSwitch(
        x?: number,
        y?: number,
        floorId?: FloorIds,
        name?: string,
        value?: any
    ): void;

    /**
     * 获得某个独立开关
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param name 独立开关的名称
     * @param value 默认值
     */
    getSwitch<T>(
        x?: number,
        y?: number,
        floorId?: FloorIds,
        name?: string,
        defaultValue?: T
    ): T;

    /**
     * 增加某个独立开关
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param name 独立开关的名称
     * @param value 增加的值
     */
    addSwitch(
        x?: number,
        y?: number,
        floorId?: FloorIds,
        name?: string,
        value?: number | string
    ): void;

    /**
     * 是否存在某个独立开关
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param name 独立开关的名称
     */
    hasSwitch(
        x?: number,
        y?: number,
        floorId?: FloorIds,
        name?: string
    ): boolean;

    /**
     * 删除某个独立开关
     * @param x 横坐标
     * @param y 纵坐标
     * @param floorId 楼层id
     * @param name 独立开关的名称
     */
    removeSwitch(
        x?: number,
        y?: number,
        floorId?: FloorIds,
        name?: string
    ): void;

    /**
     * 锁定用户控制，常常用于事件处理
     */
    lockControl(): void;

    /**
     * 解锁用户控制
     */
    unlockControl(): void;

    /**
     * 开启调试模式, 此模式下可以按Ctrl键进行穿墙, 并忽略一切事件。
     * 此模式下不可回放录像和上传成绩。
     */
    debug(): void;

    /**
     * 清空录像折叠信息
     */
    clearRouteFolding(): void;

    /**
     * 检查录像折叠信息
     */
    checkRouteFolding(): void;

    /**
     * 获得映射文件名
     */
    getMappedName<K extends keyof NameMap>(name: K): NameMap[K];

    /**
     * 设置天气，不计入存档。如需长期生效请使用core.events._action_setWeather()函数
     * @example core.setWeather('fog', 10); // 设置十级大雾天
     * @param type 新天气的类型，不填视为无天气
     * @param level 新天气（晴天除外）的级别，必须为不大于10的正整数，不填视为5
     */
    setWeather(type?: string, level?: WeatherLevel): void;

    /**
     * 注册一个天气
     * @param name 天气的名称
     * @param initFunc 初始化函数
     * @param frameFunc 每帧执行的函数
     */
    registerWeather(
        name: string,
        initFunc: WeatherAction['initFunc'],
        frameFunc?: WeatherAction['frameFunc']
    ): void;

    /**
     * 注销一个天气
     * @param name 要注销的天气名称
     */
    unregisterWeather(name: string): void;

    /**
     * 更改画面色调，不计入存档。如需长期生效请使用core.events._action_setCurtain()函数
     * @example core.setCurtain(); // 恢复画面色调，用时四分之三秒
     * @param color 颜色数组，不填视为[0, 0, 0, 0]
     * @param time 渐变时间，单位为毫秒。不填视为750ms
     * @param moveMode 缓动模式
     * @param callback 更改完毕后的回调函数
     */
    setCurtain(
        color?: RGBArray,
        time?: number,
        moveMode?: EaseMode,
        callback?: () => void
    ): void;

    /**
     * 画面闪烁
     * @example core.screenFlash([255, 0, 0, 1], 3); // 红屏一闪而过
     * @param color 颜色数组
     * @param time 单次闪烁时长，实际闪烁效果为先花其三分之一的时间渐变到目标色调，再花剩余三分之二的时间渐变回去
     * @param times 闪烁的总次数，不填或填0都视为1
     * @param moveMode 缓动模式
     * @param callback 闪烁全部完毕后的回调函数
     */
    screenFlash(
        color: RGBArray,
        time: number,
        times?: number,
        moveMode?: string,
        callback?: () => void
    ): void;

    /**
     * 播放背景音乐，中途开播但不计入存档且只会持续到下次场景切换。如需长期生效请将背景音乐的文件名赋值给flags.__bgm__
     * @example core.playBgm('bgm.mp3', 30); // 播放bgm.mp3，并跳过前半分钟
     * @param bgm 背景音乐的文件名，支持全塔属性中映射前的中文名
     * @param startTime 跳过前多少秒
     */
    playBgm(bgm: BgmIds | NameMapIn<BgmIds>, startTime?: number): void;

    /**
     * 设置背景音乐的播放速度和音调
     * @param speed 要设置到的速度，100是原速
     * @param usePitch 是否允许声调改变
     */
    setBgmSpeed(speed: number, usePitch?: boolean): void;

    /**
     * 暂停背景音乐的播放
     */
    pauseBgm(): void;

    /**
     * 恢复背景音乐的播放
     */
    resumeBgm(resumeTime?: number): void;

    /**
     * 设置音乐图标的开启关闭状态
     */
    setMusicBtn(): void;

    /**
     * 开启或关闭背景音乐的播放
     */
    triggerBgm(): void;

    /**
     * 播放一个音效
     * @param sound 音效名
     * @param pitch 音调，同时会修改播放速度，100为原速
     * @param callback 回调函数
     * @returns 音效的唯一标识符，用于停止音效等操作
     */
    playSound(
        sound: SoundIds | NameMapIn<SoundIds>,
        pitch?: number,
        callback?: () => void
    ): number;

    /**
     * 停止音频
     * @param id 停止的音频标识符，不填则停止所有
     */
    stopSound(id?: number): void;

    /**
     * 获得正在播放的所有音效的id列表
     * @param name 要获得的音效名
     */
    getPlayingSounds(name?: SoundIds | NameMapIn<SoundIds>): number[];

    /**
     * 检查bgm状态，没有播放的话就播放
     */
    checkBgm(): void;

    /**
     * 设置屏幕放缩
     * @param delta 在所有可用放缩数组中增加的下标数
     */
    setDisplayScale(delta: number): void;

    /**
     * 清空状态栏
     */
    clearStatusBar(): void;

    /**
     * 更新状态栏和地图显伤，会在下一个动画帧更新
     * @param doNotCheckAutoEvents 是否不检查自动事件
     * @param immediate 是否立刻刷新，而非延迟到下一动画帧刷新
     */
    updateStatusBar(doNotCheckAutoEvents?: boolean, immediate?: boolean): void;

    /**
     * 显示状态栏
     */
    showStatusBar(): void;

    /**
     * 隐藏状态栏
     * @param showToolbox 是否显示工具栏
     */
    hideStatusBar(showToolbox?: boolean): void;

    /**
     * 改变工具栏为按钮1-8
     * @param useButton 是否显示为按钮1-8
     */
    setToolbarButton(useButton?: boolean): void;

    /**
     * 注册一个resize函数
     * @param name 名称，可供注销使用
     * @param func 游戏画面发生变化时执行的函数
     */
    registerResize(name: string, func: ResizeFunc): void;

    /**
     * 注销一个resize函数
     */
    unregisterResize(name: string): void;

    /**
     * 屏幕分辨率改变后执行的函数
     */
    resize(): void;
}

declare const control: new () => Control;
