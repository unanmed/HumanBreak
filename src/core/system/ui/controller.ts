import { logger } from '@/core/common/logger';
import EventEmitter from 'eventemitter3';
import {
    IGameUI,
    IKeepController,
    IUIInstance,
    IUIMountable,
    UIComponent
} from './shared';
import { Props } from '@/core/render';
import { UIInstance } from './instance';
import {
    computed,
    ComputedRef,
    h,
    reactive,
    ref,
    Ref,
    shallowRef,
    ShallowRef,
    VNode
} from 'vue';
import { UIContainer } from './container';

export const enum UIMode {
    /** 仅显示最后一个 UI，在关闭时，只会关闭指定的 UI */
    LastOnly,
    /** 显示所有非手动隐藏的 UI，在关闭时，只会关闭指定 UI */
    All,
    /** 仅显示最后一个 UI，在关闭时，在此之后的所有 UI 会全部关闭 */
    LastOnlyStack,
    /** 显示所有非手动隐藏的 UI，在关闭时，在此之后的所有 UI 会全部关闭 */
    AllStack,
    /** 自定义 UI 显示模式 */
    Custom
}

export interface IUICustomConfig<C extends UIComponent> {
    /**
     * 打开一个新的 UI
     * @param ins 要打开的 UI 实例
     * @param stack 当前的 UI 栈，还未将 UI 实例加入栈中
     */
    open(ins: IUIInstance<C>, stack: IUIInstance<C>[]): void;

    /**
     * 关闭一个 UI
     * @param ins 要关闭的 UI 实例
     * @param stack 当前的 UI 栈，还未将 UI 实例移除
     * @param index 这个 UI 实例在 UI 栈中的索引
     */
    close(ins: IUIInstance<C>, stack: IUIInstance<C>[], index: number): void;

    /**
     * 隐藏一个 UI
     * @param ins 要隐藏的 UI 实例，还未进入隐藏状态
     * @param stack 当前的 UI 栈
     * @param index 这个 UI 实例在 UI 栈中的索引
     */
    hide(ins: IUIInstance<C>, stack: IUIInstance<C>[], index: number): void;

    /**
     * 显示一个 UI
     * @param ins 要显示的 UI 实例，还未进入显示状态
     * @param stack 当前的 UI 栈
     * @param index 这个 UI 实例在 UI 栈中的索引
     */
    show(ins: IUIInstance<C>, stack: IUIInstance<C>[], index: number): void;

    /**
     * 更新所有 UI 的显示，一般会在显示模式更改时调用
     * @param stack 当前的 UI 栈
     */
    update(stack: IUIInstance<C>[]): void;
}

interface UIControllerEvent {}

export class UIController<C extends UIComponent = UIComponent>
    extends EventEmitter<UIControllerEvent>
    implements IUIMountable<C>
{
    static controllers: Map<string, UIController> = new Map();

    /** 当前的 ui 栈 */
    readonly stack: IUIInstance<C>[] = reactive([]);
    /** UI 显示方式 */
    mode: UIMode = UIMode.LastOnlyStack;
    /** 这个 UI 实例的背景，当这个 UI 处于显示模式时，会显示背景 */
    background?: IGameUI<C>;

    /** 背景 UI 实例 */
    readonly backIns: ShallowRef<IUIInstance<C> | null> = shallowRef(null);
    /** 当前是否显示背景 UI */
    readonly showBack: ComputedRef<boolean> = computed(
        () => this.userShowBack.value && this.sysShowBack.value
    );

    /** 当前是否显示 UI */
    get active() {
        return this.showBack.value;
    }

    /** 自定义显示模式下的配置信息 */
    private config?: IUICustomConfig<C>;
    /** 是否维持背景 UI */
    private keepBack: boolean = false;
    /** 用户是否显示背景 UI */
    private readonly userShowBack: Ref<boolean> = ref(true);
    /** 系统是否显示背景 UI */
    private readonly sysShowBack: Ref<boolean> = ref(false);

    /**
     * 创建一个 ui 控制器
     * @param id 这个控制器的唯一标识符
     */
    constructor(public readonly id: string) {
        super();
        if (UIController.controllers.has(id)) {
            logger.warn(57, id);
        } else {
            UIController.controllers.set(id, this);
        }
    }

    /**
     * 渲染这个 UI
     */
    render(): VNode {
        return h(UIContainer, { controller: this });
    }

    /**
     * 设置背景 UI
     * @param back 这个 UI 控制器的背景 UI
     */
    setBackground(back: IGameUI<C>) {
        this.background = back;
    }

    /**
     * 隐藏背景 UI
     */
    hideBackground() {
        this.userShowBack.value = false;
    }

    /**
     * 显示背景 UI
     */
    showBackground() {
        this.userShowBack.value = true;
    }

    /**
     * 维持背景 UI，一般用于防闪烁，例如使用道具时可能在关闭道具栏后打开新 UI，这时就需要防闪烁
     */
    keep(): IKeepController {
        this.keepBack = true;

        return {
            safelyUnload: () => {
                if (this.stack.length > 0) return;
                this.sysShowBack.value = false;
                this.keepBack = false;
            },
            unload: () => {
                this.sysShowBack.value = false;
                this.keepBack = false;
            }
        };
    }

    /**
     * 打开一个 ui
     * @param ui 要打开的 ui
     * @param vBind 传递给这个 ui 的响应式数据
     */
    open(ui: IGameUI<C>, vBind: Props<C>) {
        const ins = new UIInstance(ui, vBind);
        switch (this.mode) {
            case UIMode.LastOnly:
            case UIMode.LastOnlyStack:
                this.stack.forEach(v => v.hide());
                this.stack.push(ins);
                break;
            case UIMode.All:
            case UIMode.AllStack:
                this.stack.push(ins);
                break;
            case UIMode.Custom:
                this.config?.open(ins, this.stack);
                break;
        }
        this.sysShowBack.value = true;
        return ins;
    }

    /**
     * 关闭一个 ui
     * @param ui 要关闭的 ui 实例
     */
    close(ui: UIInstance<C>) {
        const index = this.stack.indexOf(ui);
        if (index === -1) return;
        switch (this.mode) {
            case UIMode.LastOnly: {
                this.stack.splice(index, 1);
                this.stack.forEach(v => v.hide());
                const last = this.stack.at(-1);
                if (!last) break;
                last.show();
                break;
            }
            case UIMode.LastOnlyStack: {
                this.stack.splice(index);
                this.stack.forEach(v => v.hide());
                const last = this.stack[index - 1];
                if (!last) break;
                last.show();
                break;
            }
            case UIMode.All: {
                this.stack.splice(index, 1);
                break;
            }
            case UIMode.AllStack: {
                this.stack.splice(index);
                break;
            }
            case UIMode.Custom: {
                this.config?.close(ui, this.stack, index);
                break;
            }
        }
        if (!this.keepBack && this.stack.length === 0) {
            this.sysShowBack.value = false;
        }
        this.keepBack = false;
    }

    hide(ins: IUIInstance<C>): void {
        const index = this.stack.indexOf(ins);
        if (index === -1) return;
        if (this.mode === UIMode.Custom) {
            this.config?.hide(ins, this.stack, index);
        } else {
            ins.hide();
        }
    }

    show(ins: IUIInstance<C>): void {
        const index = this.stack.indexOf(ins);
        if (index === -1) return;
        if (this.mode === UIMode.Custom) {
            this.config?.show(ins, this.stack, index);
        } else {
            ins.show();
        }
    }

    /**
     * 设置为仅显示最后一个 UI
     * @param stack 是否设置为栈模式，即删除一个 UI 后，其之后打开的 UI 是否也一并删除
     */
    lastOnly(stack: boolean = true) {
        if (stack) {
            this.mode = UIMode.LastOnlyStack;
        } else {
            this.mode = UIMode.LastOnly;
        }
        this.stack.forEach(v => v.hide());
        this.stack.at(-1)?.show();
    }

    /**
     * 设置为显示所有 UI
     * @param stack 是否设置为栈模式，即删除一个 UI 后，其之后打开的 UI 是否也一并删除
     */
    showAll(stack: boolean = false) {
        if (stack) {
            this.mode = UIMode.AllStack;
        } else {
            this.mode = UIMode.All;
        }
        this.stack.forEach(v => v.show());
    }

    /**
     * 使用自定义的显示模式
     * @param config 自定义显示模式的配置
     */
    showCustom(config: IUICustomConfig<C>) {
        this.mode = UIMode.Custom;
        this.config = config;
        config.update(this.stack);
    }

    /**
     * 获取一个元素上的 ui 控制器
     * @param id 要获取的 ui 控制器的唯一标识符
     */
    static getController<T extends UIComponent>(
        id: string
    ): UIController<T> | null {
        const res = this.controllers.get(id) as UIController<T>;
        return res ?? null;
    }
}
