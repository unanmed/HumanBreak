import { Component, VNodeProps } from 'vue';

export interface IUIControllerConfig<Element, UI> {
    /**
     * 将一个ui挂载至目标元素时的操作
     * @param element 要挂载至的目标元素
     * @param ui 要挂载的ui对象
     */
    insert(element: Element, ui: UI): void;

    /**
     * 将一个ui从目标元素上移除时的操作
     * @param element 被移除ui的父元素
     * @param ui 要被移除的ui元素
     */
    remove(element: Element, ui: UI): void;

    /**
     * 创建一个新UI
     * @param component UI组件
     * @param props UI传递的props
     */
    createUI(
        component: Component,
        props?: (VNodeProps & { [key: string]: any }) | null
    ): UI;
}

export const enum OpenOption {
    Push,
    Unshift
}

export const enum CloseOption {
    Splice,
    Pop,
    Shift
}

export class UIController<Element, UI> {
    constructor(config: IUIControllerConfig<Element, UI>) {}

    /**
     * 设置当ui改变时控制器的行为
     * @param open 打开时的行为
     * @param close 关闭时的行为
     */
    setChangeMode(open: OpenOption, close: CloseOption) {}

    /**
     * 将这个UI控制器挂载至容器上
     * @param container 要挂载至的容器
     */
    mount(container: Element) {}
}
