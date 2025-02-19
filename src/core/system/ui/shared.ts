import { Props } from '@/core/render';
import { DefineComponent, DefineSetupFnComponent, Ref, ShallowRef } from 'vue';

export type UIComponent = DefineSetupFnComponent<any> | DefineComponent;

export interface IGameUI<C extends UIComponent> {
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

export interface IUIMountable<C extends UIComponent> {
    /** 当前的 UI 栈 */
    readonly stack: IUIInstance<C>[];
    /** 当前的背景 UI */
    readonly backIns: ShallowRef<IUIInstance<C> | null>;
    /** 当前是否显示背景 UI */
    readonly showBack: Ref<boolean>;

    /**
     * 隐藏一个 UI
     * @param ins 要隐藏的 UI 实例
     */
    hide(ins: IUIInstance<C>): void;

    /**
     * 显示一个 UI
     * @param ins 要显示的 UI 实例
     */
    show(ins: IUIInstance<C>): void;

    /**
     * 维持背景，直到下次所有 UI 都被关闭
     */
    keep(): IKeepController;
}

export interface IUIInstance<C extends UIComponent> {
    /** 这个 ui 实例的唯一 key，用于 vue */
    readonly key: number;
    /** 这个 ui 实例的 ui 信息 */
    readonly ui: IGameUI<C>;
    /** 传递给这个 ui 实例的响应式数据 */
    readonly vBind: Props<C>;
    /** 当前元素是否被隐藏 */
    readonly hidden: boolean;

    /**
     * 隐藏这个 ui
     */
    hide(): void;

    /**
     * 显示这个 ui
     */
    show(): void;
}
