/** @file control.js 主要用来进行游戏控制，比如行走控制、自动寻路、存读档等等游戏核心内容。 */
declare class control {
    /**
     * 开启调试模式, 此模式下可以按Ctrl键进行穿墙, 并忽略一切事件。
     * 此模式下不可回放录像和上传成绩。
     */
    debug(): void;

    /**
     * 刷新状态栏和地图显伤
     * 2.9.1优化：非必须立刻执行的刷新（一般是伤害相关的除外）的延迟到下一动画帧执行
     * @param doNotCheckAutoEvents 是否不检查自动事件
     * @param immediate 是否立刻刷新，而非延迟到下一动画帧刷新
     */
    updateStatusBar(doNotCheckAutoEvents?: boolean, immediate?: boolean): void;

    /** 删除某个flag/变量 */
    removeFlag(name: string): void;

    /** 设置某个独立开关 */
    setSwitch(
        x: number,
        y: number,
        floorId: string,
        name: string,
        value: any
    ): void;

    /** 获得某个独立开关 */
    getSwitch(
        x: number,
        y: number,
        floorId: string,
        name: string,
        defaultValue: any
    ): any;

    /** 增加某个独立开关 */
    addSwitch(
        x: number,
        y: number,
        floorId: string,
        name: string,
        value: any
    ): void;

    /** 判定某个独立开关 */
    hasSwitch(x: number, y: number, floorId: string, name: string): boolean;

    /** 删除独立开关 */
    removeSwitch(x: number, y: number, floorId: string, name: string): boolean;

    /** 设置大地图的偏移量 */
    setGameCanvasTranslate(canvasId: string, x: number, y: number): void;

    /** 更新大地图的可见区域 */
    updateViewport(): void;

    /** 立刻聚集所有的跟随者 */
    gatherFollowers(): void;

    /** 回放下一个操作 */
    replay(): void;

    /**
     * 进入标题画面
     * @example core.showStartAnimate(); // 重启游戏但不重置bgm
     * @param noAnimate 可选，true表示不由黑屏淡入而是立即亮屏
     * @param callback 可选，完全亮屏后的回调函数
     */
    showStartAnimate(noAnimate?: boolean, callback?: () => void): void;

    /**
     * 淡出标题画面
     * @example core.hideStartAnimate(core.startGame); // 淡出标题画面并开始新游戏，跳过难度选择
     * @param callback 标题画面完全淡出后的回调函数
     */
    hideStartAnimate(callback?: () => void): void;

    /**
     * 半自动寻路，用于鼠标或手指拖动
     * @example core.setAutomaticRoute(0, 0, [{direction: "right", x: 4, y: 9}, {direction: "right", x: 5, y: 9}, {direction: "right", x: 6, y: 9}, {direction: "up", x: 6, y: 8}]);
     * @param destX 鼠标或手指的起拖点横坐标
     * @param destY 鼠标或手指的起拖点纵坐标
     * @param stepPostfix 拖动轨迹的数组表示，每项为一步的方向和目标点。
     */
    setAutomaticRoute(
        destX: number,
        destY: number,
        stepPostfix: Array<{ direction: direction; x: number; y: number }>
    ): void;

    /**
     * 连续行走
     * @example core.setAutoHeroMove([{direction: "up", step: 1}, {direction: "left", step: 3}, {direction: "right", step: 3}, {direction: "up", step: 9}]); // 上左左左右右右上9
     * @param steps 压缩的步伐数组，每项表示朝某方向走多少步
     */
    setAutoHeroMove(steps: Array<{ direction: direction; step: number }>): void;

    /**
     * 尝试前进一步，如果面前不可被踏入就会直接触发该点事件
     * @example core.moveAction(core.doAction); // 尝试前进一步，然后继续事件处理。常用于在事件流中让主角像自由行动时一样前进一步，可以照常触发moveOneStep（跑毒和计步）和面前的事件（包括但不限于阻激夹域捕）
     * @param callback 走一步后的回调函数，可选
     */
    moveAction(callback?: () => void): void;

    /**
     * 连续前进，不撞南墙不回头
     * @example core.moveHero(); // 连续前进
     * @param direction 可选，如果设置了就会先转身到该方向
     * @param callback 可选，如果设置了就只走一步
     */
    moveHero(direction?: direction, callback?: () => void): void;

    /**
     * 等待主角停下
     * @example core.waitHeroToStop(core.vibrate); // 等待主角停下，然后视野左右抖动1秒
     * @param callback 主角停止后的回调函数
     */
    waitHeroToStop(callback?: () => void): void;

    /**
     * 主角转向并计入录像，不会导致跟随者聚集，会导致视野重置到以主角为中心
     * @example core.turnHero(); // 主角顺时针旋转90°，即单击主角或按下Z键的效果
     * @param direction 主角的新朝向，可为 up, down, left, right, :left, :right, :back 七种之一
     */
    turnHero(direction?: direction): void;

    /**
     * 尝试瞬移，如果该点有图块/事件/阻激夹域捕则会瞬移到它旁边再走一步（不可踏入的话当然还是触发该点事件），这一步的方向优先和瞬移前主角的朝向一致
     * @example core.tryMoveDirectly(6, 0); // 尝试瞬移到地图顶部的正中央，以样板0层为例，实际效果是瞬移到了上楼梯下面一格然后向上走一步并触发上楼事件
     * @param destX 目标点的横坐标
     * @param destY 目标点的纵坐标
     */
    tryMoveDirectly(destX: number, destY: number): void;

    /**
     * 绘制主角和跟随者并重置视野到以主角为中心
     * @example core.drawHero(); // 原地绘制主角的静止帧
     * @param status 绘制状态，一般用stop
     * @param offset 相对主角逻辑位置的偏移量，不填视为无偏移
     * @param frame 绘制第几帧
     */
    drawHero(
        status?: 'stop' | 'leftFoot' | 'rightFoot',
        offset?: number,
        frame?: number
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
     * 请不要直接使用该函数，请使用core.updateStatusBar()代替！重算并绘制地图显伤
     * @example core.updateDamage(); // 更新当前地图的显伤，绘制在显伤层（废话）
     * @param floorId 地图id，不填视为当前地图。预览地图时填写
     * @param ctx 绘制到的画布，如果填写了就会画在该画布而不是显伤层
     */
    updateDamage(floorId?: string, ctx?: CanvasRenderingContext2D): void;

    /** 仅重绘地图显伤 */
    drawDamage(ctx?: CanvasRenderingContext2D): void;

    /**
     * 设置主角的某个属性
     * @example core.setStatus('loc', {x : 0, y : 0, direction : 'up'}); // 设置主角位置为地图左上角，脸朝上
     * @param name 属性的英文名，其中'x'、'y'和'direction'会被特殊处理为 core.setHeroLoc(name, value)，其他的('exp'被视为'exp')会直接对 core.status.hero[name] 赋值
     * @param value 属性的新值
     */
    setStatus<K extends keyof HeroStatus>(name: K, value: HeroStatus[K]): void;

    /**
     * 增减主角的某个属性，等价于core.setStatus(name, core.getStatus(name) + value)
     * @example core.addStatus('name', '酱'); // 在主角的名字后加一个“酱”字
     * @param name 属性的英文名
     * @param value 属性的增量，请注意旧量和增量中只要有一个是字符串就会把两者连起来成为一个更长的字符串
     */
    addStatus<K extends keyof HeroStatus>(name: K, value: HeroStatus[K]): void;

    /**
     * 读取主角的某个属性，不包括百分比修正
     * @example core.getStatus('loc'); // 读取主角的坐标和朝向
     * @param name 属性的英文名，其中'x'、'y'和'direction'会被特殊处理为 core.getHeroLoc(name)，其他的('exp'被视为'exp')会直接读取 core.status.hero[name]
     * @returns 属性值
     */
    getStatus<K extends keyof HeroStatus>(name: K): HeroStatus[K];

    /**
     * 计算主角的某个属性，包括百分比修正
     * @example core.getRealStatus('atk'); // 计算主角的攻击力，包括百分比修正。战斗使用的就是这个值
     * @param name 属性的英文名，请注意只能用于数值类属性哦，否则乘法会得到NaN
     */
    getRealStatus<K extends keyof HeroStatus>(name: K): HeroStatus[K];

    /** 获得某个状态的名字 */
    getStatusLabel<K extends keyof HeroStatus>(name: K): string;

    /**
     * 设置主角某个属性的百分比修正倍率，初始值为1，
     * 倍率存放在flag: '__'+name+'_buff__' 中
     * @example core.setBuff('atk', 0.5); // 主角能发挥出的攻击力减半
     * @param name 属性的英文名，请注意只能用于数值类属性哦，否则随后的乘法会得到NaN
     * @param value 新的百分比修正倍率，不填（效果上）视为1
     */
    setBuff<K extends keyof HeroStatus>(name: K, value?: HeroStatus[K]): void;

    /**
     * 增减主角某个属性的百分比修正倍率，加减法叠加和抵消。等价于 core.setBuff(name, core.getBuff(name) + value)
     * @example core.addBuff('atk', -0.1); // 主角获得一层“攻击力减一成”的负面效果
     * @param name 属性的英文名，请注意只能用于数值类属性哦，否则随后的乘法会得到NaN
     * @param value 倍率的增量
     */
    addBuff<K extends keyof HeroStatus>(name: K, value: HeroStatus[K]): void;

    /**
     * 读取主角某个属性的百分比修正倍率，初始值为1
     * @example core.getBuff('atk'); // 主角当前能发挥出多大比例的攻击力
     * @param name 属性的英文名
     */
    getBuff<K extends keyof HeroStatus>(name: HeroStatus[K]): number;

    /**
     * 获得或移除毒衰咒效果
     * @param action 获得还是移除，'get'为获得，'remove'为移除
     * @param type 要获得或移除的毒衰咒效果
     */
    triggerDebuff(action: string, type: string | string[]): void;

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
    setHeroLoc(name: 'direction', value: direction, noGather?: boolean): void;

    /**
     * 读取主角的位置和/或朝向
     * @example core.getHeroLoc(); // 读取主角的位置和朝向
     * @param name 要读取横坐标还是纵坐标还是朝向还是都读取
     * @returns name ? core.status.hero.loc[name] : core.status.hero.loc
     */
    getHeroLoc(): { x: number; y: number; direction: direction };
    getHeroLoc(name: 'x' | 'y'): number;
    getHeroLoc(name: 'direction'): direction;

    /**
     * 根据级别的数字获取对应的名称，后者定义在全塔属性
     * @example core.getLvName(); // 获取主角当前级别的名称，如“下级佣兵”
     * @param lv 级别的数字，不填则视为主角当前的级别
     * @returns 级别的名称，如果不存在就还是返回数字
     */
    getLvName(lv?: number): string;

    /**
     * 获得下次升级需要的经验值。
     * 升级扣除模式下会返回经验差值；非扣除模式下会返回总共需要的经验值。
     * 如果无法进行下次升级，返回null。
     */
    getNextLvUpNeed(): number;

    /**
     * 设置一个flag变量
     * @example core.setFlag('poison', true); // 令主角中毒
     * @param name 变量名，支持中文
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
     * 读取一个flag变量
     * @param name 变量名，支持中文
     * @param defaultValue 当变量不存在时的返回值，可选（事件流中默认填0）。
     * @returns flags[name] ?? defaultValue
     */
    getFlag(name: string, defaultValue?: any): any;

    /**
     * 判定一个flag变量是否存在且不为false、0、''、null、undefined和NaN
     * @example core.hasFlag('poison'); // 判断主角当前是否中毒
     * @param name 变量名，支持中文
     * @returns !!core.getFlag(name)
     */
    hasFlag(name: string): boolean;

    /**
     * 设置天气，不计入存档。如需长期生效请使用core.events._action_setWeather()函数
     * @example core.setWeather('fog', 10); // 设置十级大雾天
     * @param type 新天气的类型，不填视为无天气
     * @param level 新天气（晴天除外）的级别，必须为不大于10的正整数，不填视为5
     */
    setWeather(
        type?: 'rain' | 'snow' | 'sun' | 'fog' | 'cloud' | string,
        level?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
    ): void;

    /** 注册一个天气 */
    registerWeather(
        name: string,
        initFunc: (level: number) => void,
        frameFunc?: (timestamp: number, level: number) => void
    ): void;

    /** 注销一个天气 */
    unregisterWeather(name: string): void;

    /**
     * 更改画面色调，不计入存档。如需长期生效请使用core.events._action_setCurtain()函数
     * @example core.setCurtain(); // 恢复画面色调，用时四分之三秒
     * @param color 一行三列（第四列视为1）或一行四列（第四列若大于1则会被视为1，第四列若为负数则会被视为0）的颜色数组，不填视为[0, 0, 0, 0]
     * @param time 渐变时间，单位为毫秒。不填视为750ms，负数视为0（无渐变，立即更改）
     * @param callback 更改完毕后的回调函数，可选。事件流中常取core.doAction
     */
    setCurtain(
        color?: [number, number, number, number?],
        time?: number,
        moveMode?: string,
        callback?: () => void
    ): void;

    /**
     * 画面闪烁
     * @example core.screenFlash([255, 0, 0, 1], 3); // 红屏一闪而过
     * @param color 一行三列（第四列视为1）或一行四列（第四列若大于1则会被视为1，第四列若填负数则会被视为0）的颜色数组，必填
     * @param time 单次闪烁时长，实际闪烁效果为先花其三分之一的时间渐变到目标色调，再花剩余三分之二的时间渐变回去
     * @param times 闪烁的总次数，不填或填0都视为1
     * @param callback 闪烁全部完毕后的回调函数，可选
     */
    screenFlash(
        color: [number, number, number, number?],
        time: number,
        times?: number,
        moveMode?: string,
        callback?: () => void
    ): void;

    /**
     * 播放背景音乐，中途开播但不计入存档且只会持续到下次场景切换。如需长期生效请将背景音乐的文件名赋值给flags.__bgm__
     * @example core.playBgm('bgm.mp3', 30); // 播放bgm.mp3，并跳过前半分钟
     * @param bgm 背景音乐的文件名，支持全塔属性中映射前的中文名
     * @param startTime 跳过前多少秒，不填则不跳过
     */
    playBgm(bgm: string, startTime?: number): void;

    /**
     * 注册一个 animationFrame
     * @param name 名称，可用来作为注销使用
     * @param needPlaying 是否只在游戏运行时才执行（在标题界面不执行）
     * @param func 要执行的函数，或插件中的函数名；可接受timestamp（从页面加载完毕到当前所经过的时间）作为参数
     */
    registerAnimationFrame(
        name: string,
        needPlaying: boolean,
        func?: (timestamp: number) => void
    ): void;

    /** 注销一个animationFrame */
    unregisterAnimationFrame(name: string): void;

    /** 游戏是否已经开始 */
    isPlaying(): boolean;

    /** 清除游戏状态和数据 */
    clearStatus(): void;

    /** 清除自动寻路路线 */
    clearAutomaticRouteNode(x?: any, y?: any): void;

    /** 停止自动寻路操作 */
    stopAutomaticRoute(): void;

    /** 保存剩下的寻路，并停止 */
    saveAndStopAutomaticRoute(): void;

    /** 继续剩下的自动寻路操作 */
    continueAutomaticRoute(): void;

    /** 清空剩下的自动寻路列表 */
    clearContinueAutomaticRoute(callback?: () => any): void;

    /** 设置行走的效果动画 */
    setHeroMoveInterval(callback?: () => any): void;

    /** 每移动一格后执行的事件 */
    moveOneStep(callback?: () => any): void;

    /** 当前是否正在移动 */
    isMoving(): boolean;

    /** 瞬间移动 */
    moveDirectly(destX?: any, destY?: any, ignoreSteps?: any): void;

    /** 改变勇士的不透明度 */
    setHeroOpacity(
        opacity?: number,
        moveMode?: string,
        time?: any,
        callback?: () => any
    ): void;

    /** 加减画布偏移 */
    addGameCanvasTranslate(x?: number, y?: number): void;

    /**
     * 设置视野范围
     * px,py: 左上角相对大地图的像素坐标，不需要为32倍数
     */
    setViewport(px?: number, py?: number): void;

    /** 移动视野范围 */
    moveViewport(
        x: number,
        y: number,
        moveMode?: string,
        time?: number,
        callback?: () => any
    ): void;

    /** 更新跟随者坐标 */
    updateFollowers(): void;

    /** 更新领域、夹击、阻击的伤害地图 */
    updateCheckBlock(floorId?: string): void;

    /** 检查并执行领域、夹击、阻击事件 */
    checkBlock(): void;

    /** 选择录像文件 */
    chooseReplayFile(): void;

    /** 开始播放 */
    startReplay(list?: any): void;

    /** 更改播放状态 */
    triggerReplay(): void;

    /** 暂停播放 */
    pauseReplay(): void;

    /** 恢复播放 */
    resumeReplay(): void;

    /** 单步播放 */
    stepReplay(): void;

    /** 加速播放 */
    speedUpReplay(): void;

    /** 减速播放 */
    speedDownReplay(): void;

    /** 设置播放速度 */
    setReplaySpeed(speed?: number): void;

    /** 停止播放 */
    stopReplay(force?: boolean): void;

    /** 回退 */
    rewindReplay(): void;

    /** 是否正在播放录像 */
    isReplaying(): boolean;

    /**
     * 注册一个录像行为
     * @param name 自定义名称，可用于注销使用
     * @param func 具体执行录像的函数，可为一个函数或插件中的函数名；
     *              需要接受一个action参数，代表录像回放时的下一个操作
     *              func返回true代表成功处理了此录像行为，false代表没有处理此录像行为。
     */
    registerReplayAction(
        name: string,
        func: (action?: string) => boolean
    ): void;

    /** 注销一个录像行为 */
    unregisterReplayAction(name: string): void;

    /** 自动存档 */
    autosave(removeLast?: any): void;

    /** 实际进行自动存档 */
    checkAutosave(): void;

    /** 实际进行存读档事件 */
    doSL(id?: string, type?: any): void;

    /** 同步存档到服务器 */
    syncSave(type?: any): void;

    /** 从服务器加载存档 */
    syncLoad(): void;

    /** 存档到本地 */
    saveData(): any;

    /** 从本地读档 */
    loadData(data?: any, callback?: () => any): any;

    /** 获得某个存档内容 */
    getSave(index?: any, callback?: () => any): any;

    /** 获得某些存档内容 */
    getSaves(ids?: any, callback?: () => any): any;

    /** 获得所有存档内容 */
    getAllSaves(callback?: () => any): any;

    /** 获得所有存在存档的存档位 */
    getSaveIndexes(callback?: () => any): any;

    /** 判断某个存档位是否存在存档 */
    hasSave(index?: number): boolean;

    /** 删除某个存档 */
    removeSave(index?: number, callback?: () => any): void;

    /** 从status中获得属性，如果不存在则从勇士属性中获取 */
    getStatusOrDefault(status?: any, name?: string): any;

    /** 从status中获得实际属性（增幅后的），如果不存在则从勇士属性中获取 */
    getRealStatusOrDefault(status?: any, name?: string): any;

    /** 获得勇士原始属性（无装备和衰弱影响） */
    getNakedStatus(name?: string): any;

    /** 锁定用户控制，常常用于事件处理 */
    lockControl(): void;

    /** 解锁用户控制 */
    unlockControl(): void;

    /** 清空录像折叠信息 */
    clearRouteFolding(): void;

    /** 检查录像折叠信息 */
    checkRouteFolding(): void;

    /** 获得映射文件名 */
    getMappedName(name?: string): string;

    /** 暂停背景音乐的播放 */
    pauseBgm(): void;

    /** 恢复背景音乐的播放 */
    resumeBgm(resumeTime?: number): void;

    /** 设置背景音乐的播放速度和音调 */
    setBgmSpeed(speed: number, usePitch?: boolean): void;

    /** 设置音乐图标的显隐状态 */
    setMusicBtn(): void;

    /** 开启或关闭背景音乐的播放 */
    triggerBgm(): void;

    /** 播放一个音效 */
    playSound(sound: string, pitch?: number, callback?: () => any): number;

    /** 停止（所有）音频 */
    stopSound(id?: number): void;

    /** 获得正在播放的所有（指定）音效的id列表 */
    getPlayingSounds(name?: string): Array<number>;

    /** 检查bgm状态 */
    checkBgm(): void;

    /** 设置屏幕放缩 */
    setDisplayScale(delta: number): void;

    /** 清空状态栏 */
    clearStatusBar(): void;

    /** 显示状态栏 */
    showStatusBar(): void;

    /** 隐藏状态栏 */
    hideStatusBar(showToolbox?: boolean): void;

    /** 更新状态栏的勇士图标 */
    updateHeroIcon(name: string): void;

    /** 改变工具栏为按钮1-8 */
    setToolbarButton(useButton?: boolean): void;

    /**
     * 注册一个resize函数
     * @param name 名称，可供注销使用
     * @param func 可以是一个函数，或者是插件中的函数名；可以接受obj参数，详见resize函数。
     */
    registerResize(name: string, func: (obj: any) => void): void;

    /** 注销一个resize函数 */
    unregisterResize(name: string): void;

    /** 屏幕分辨率改变后重新自适应 */
    resize(): void;
}
