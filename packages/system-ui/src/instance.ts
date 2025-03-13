import { Props } from '@motajs/render';
import { IGameUI, IUIInstance, UIComponent, UIProps } from './shared';
import { markRaw, mergeProps } from 'vue';

export class UIInstance<C extends UIComponent> implements IUIInstance<C> {
    private static counter: number = 0;

    readonly key: number = UIInstance.counter++;
    readonly ui: IGameUI<C>;
    hidden: boolean = false;

    constructor(
        ui: IGameUI<C>,
        public vBind: UIProps<C>,
        public readonly alwaysShow: boolean = false
    ) {
        this.ui = markRaw(ui);
    }

    /**
     * 设置这个 UI 实例的响应式数据的值
     * @param data 要设置的值
     * @param merge 是将传入的值与原先的值合并（true），还是将当前值覆盖掉原先的值（false），默认合并
     */
    setVBind(data: Partial<Props<C>>, merge: boolean = true) {
        if (merge) {
            this.vBind = mergeProps(this.vBind, data) as UIProps<C>;
        } else {
            this.vBind = data as UIProps<C>;
        }
    }

    hide(): void {
        this.hidden = true;
    }

    show(): void {
        this.hidden = false;
    }
}
