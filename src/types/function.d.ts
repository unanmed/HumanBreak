interface ActionData {
    /**
     * 当按键弹起时
     * @param keyCode 按键的keyCode
     * @param altKey 当前是否按下了alt键
     */
    onKeyUp(keyCode: number, altKey: boolean): boolean;
}

interface ControlData {
    /**
     * 获取保存信息
     */
    saveData(): Save;

    /**
     * 读取一个存档
     * @param data 存档信息
     * @param callback 读取完毕后的回调函数
     */
    loadData(data: Save, callback?: () => void): void;

    /**
     * 立即仅更新状态栏
     */
    updateStatusBar(): void;

    /**
     * 每步移动后执行的函数
     * @param callback 回调函数（好像没什么必要吧
     */
    moveOneStep(callback?: () => void): void;

    /**
     * 瞬移到某一点
     * @param x 瞬移至的横坐标
     * @param y 瞬移至的纵坐标
     * @param ignoreSteps 忽略的步数，不填则会自动计算
     */
    moveDirectly(x: number, y: number, ignoreSteps?: number): boolean;

    /**
     * 并行脚本
     * @param time 距离游戏加载完毕经过的时间
     */
    parallelDo(time: number): void;
}

interface UiData {
    /**
     * 数据统计界面统计的道具数量
     */
    drawStatistics(): AllIdsOf<'items'>[];
}

interface EventData {
    /**
     * 重置游戏
     * @param hero 勇士信息
     * @param hard 难度信息
     * @param floorId 勇士所在楼层
     * @param maps 所有的地图信息
     * @param values 全局数值信息
     */
    resetGame(
        hero: HeroStatus,
        hard: string,
        floorId: FloorIds,
        maps: GameStatus['maps'],
        values: Partial<CoreValues>
    ): void;

    /**
     * 游戏获胜
     * @param reason 胜利原因
     * @param norank 是否不计榜
     * @param noexit 是否不退出
     */
    win(reason: string, norank?: boolean, noexit?: boolean): void;

    /**
     * 游戏失败
     * @param reason 失败原因
     */
    lose(reason?: string): void;

    /**
     * 切换楼层中，即屏幕完全变黑的那一刻
     * @param floorId 目标楼层
     * @param heroLoc 勇士到达的位置
     */
    changingFloor(floorId: FloorIds, heroLoc: Loc): void;

    /**
     * 切换楼层后
     * @param floorId 目标楼层
     */
    afterChangeFloor(floorId: FloorIds): void;

    /**
     * 飞往某个楼层
     * @param toId 目标楼层
     * @param callback 飞到后的回调函数
     */
    flyTo(toId: FloorIds, callback?: () => void): boolean;

    /**
     * 与怪物战斗后
     * @param enemyId 打败的怪物
     * @param x 怪物横坐标
     * @param y 怪物纵坐标
     */
    afterBattle(enemyId: any, x?: number, y?: number): void;

    /**
     * 开门后
     * @param doorId 门的id
     * @param x 门的横坐标
     * @param y 门的纵坐标
     */
    afterOpenDoor(
        doorId: AllIdsOf<Exclude<Cls, 'enemys' | 'enemy48'>>,
        x: number,
        y: number
    ): void;

    /**
     * 获得道具后
     * @param itemId 道具id
     * @param x 道具横坐标
     * @param y 道具纵坐标
     * @param isGentleClick 是否是轻按
     */
    afterGetItem(
        itemId: AllIdsOf<'items'>,
        x: number,
        y: number,
        isGentleClick?: boolean
    ): void;

    /**
     * 推箱子后
     */
    afterPushBox(): void;
}

interface FunctionsData {
    /**
     * 交互信息
     */
    actions: ActionData;

    /**
     * 游戏的逻辑信息
     */
    control: ControlData;

    /**
     * ui信息
     */
    ui: UiData;

    /**
     * 事件信息
     */
    events: EventData;
}
