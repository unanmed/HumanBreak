import { Props } from '@motajs/render';
import {
    DefineComponent,
    DefineSetupFnComponent,
    Ref,
    ShallowRef,
    VNode
} from 'vue';

export type UIComponent = DefineSetupFnComponent<any> | DefineComponent;

export interface UIComponentProps<T extends UIComponent = UIComponent> {
    controller: IUIMountable;
    instance: IUIInstance<T>;
}

export type UIProps<C extends UIComponent = UIComponent> = Omit<
    Props<C>,
    keyof UIComponentProps<C>
>;

export interface IGameUI<C extends UIComponent = UIComponent> {
    /** 这个 UI 的名称 */
    readonly name: string;
    /** 这个 UI 的组件 */
    readonly component: C;
}

export interface IKeepController {
    /**
     * 安全关闭背景 UI，如果当前没有 UI 已开启，那么直接关闭，否则维持
     */
    safelyUnload(): void;

    /**
     * 不论当前是否有 UI 已开启，都关闭背景
     */
    unload(): void;
}

export interface IUIMountable {
    /** 当前的 UI 栈 */
    readonly stack: IUIInstance<UIComponent>[];
    /** 当前的背景 UI */
    readonly backIns: ShallowRef<IUIInstance<UIComponent> | null>;
    /** 当前是否显示背景 UI */
    readonly showBack: Ref<boolean>;

    /**
     * 隐藏一个 UI
     * @param ins 要隐藏的 UI 实例
     */
    hide(ins: IUIInstance<UIComponent>): void;

    /**
     * 显示一个 UI
     * @param ins 要显示的 UI 实例
     */
    show(ins: IUIInstance<UIComponent>): void;

    /**
     * 渲染这个 UI，可以直接嵌入渲染树中
     */
    render(): VNode;

    /**
     * 隐藏背景 UI
     */
    hideBackground(): void;

    /**
     * 显示背景 UI
     */
    showBackground(): void;

    /**
     * 打开一个 ui
     * @param ui 要打开的 ui
     * @param vBind 传递给这个 ui 的响应式数据
     * @param alwaysShow 这个 ui 是否保持开启，对于需要叠加显示的 ui 非常有用
     */
    open<T extends UIComponent>(
        ui: IGameUI<T>,
        vBind: UIProps<T>,
        alwaysShow?: boolean
    ): IUIInstance<T>;

    /**
     * 关闭一个 ui
     * @param ui 要关闭的 ui 实例
     */
    close(ui: IUIInstance<UIComponent>): void;

    /**
     * 关闭所有或指定类型的所有 UI
     */
    closeAll(ui?: IGameUI<UIComponent>): void;

    /**
     * 维持背景，直到下次所有 UI 都被关闭
     */
    keep(): IKeepController;
}

export interface IUIInstance<C extends UIComponent = UIComponent> {
    /** 这个 ui 实例的唯一 key，用于 vue */
    readonly key: number;
    /** 这个 ui 实例的 ui 信息 */
    readonly ui: IGameUI<C>;
    /** 传递给这个 ui 实例的响应式数据 */
    readonly vBind: UIProps<C>;
    /** 当前元素是否被隐藏 */
    readonly hidden: boolean;
    /** 是否永远保持开启 */
    readonly alwaysShow: boolean;

    /**
     * 设置这个 UI 实例的响应式数据的值
     * @param data 要设置的值
     * @param merge 是将传入的值与原先的值合并（true），还是将当前值覆盖掉原先的值（false），默认合并
     */
    setVBind(data: Partial<Props<C>>, merge?: boolean): void;

    /**
     * 隐藏这个 ui
     */
    hide(): void;

    /**
     * 显示这个 ui
     */
    show(): void;
}
