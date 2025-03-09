export interface IGameUi {
    id: string;
    symbol: symbol;
}

export interface IMountedVBind {
    num: number;
    ui: IGameUi;
    controller: IUiController;
    [x: string]: any;
}

interface HoldOnController {
    end(noClosePanel?: boolean): void;
}

type UiVOn = Record<string, (param?: any) => void>;
type UiVBind = Record<string, any>;

export interface IUiController {
    stack: any[];

    /**
     * 设置为仅显示最后一个ui
     */
    showEnd(): void;

    /**
     * 设置为显示所有ui
     */
    showAll(): void;

    /**
     * 根据id获取到ui
     * @param id ui的id
     */
    get(id: string): void;

    /**
     * 暂时保持下一次删除ui不会导致ui整体被关闭，引起ui背景闪烁。
     * 例如可以用于道具栏，打开道具时就应当 holdOn，然后通过道具使用钩子来判断接下来是否要隐藏 app:
     * ```txt
     * hold on -> close -> use item -> hook -> stack.length === 0 ? end(): no action
     * ```
     */
    holdOn(): HoldOnController;

    /**
     * 关闭一个ui，注意如果不是平等模式，在其之后的ui都会同时关闭掉
     * @param num 要关闭的ui的唯一标识符
     */
    close(num: number): void;

    /**
     * 根据id关闭所有同id的ui，注意非平等模式下，会将第一个ui后的所有ui都关闭掉
     * @param id 要关闭的ui的id
     */
    closeByName(id: string): void;

    /**
     * 打开一个新的ui
     * @param id 要打开的ui的id
     * @param vOn 监听的事件
     * @param vBind 绑定的数据
     * @returns ui的唯一标识符
     */
    open(id: string, vBind?: UiVBind, vOn?: UiVOn): void;

    /**
     * 注册一个ui
     * @param id ui的id
     * @param ui 对应的GameUi实例
     */
    register(...ui: IGameUi[]): void;

    /**
     * 取消注册一个ui
     * @param id 要取消注册的ui的id
     */
    unregister(...id: string[]): void;

    /**
     * 根据ui的唯一标识符进行聚焦
     * @param num 要聚焦于的ui的唯一标识符
     */
    focusByNum(num: number): void;

    /**
     * 根据唯一标识符获取对应的ui
     * @param num ui的唯一标识符
     */
    getByNum(num: number): void;

    /**
     * 根据ui的唯一标识符来判断当前是否存在某个ui
     * @param id ui的唯一标识符
     */
    hasName(id: string): void;
}
