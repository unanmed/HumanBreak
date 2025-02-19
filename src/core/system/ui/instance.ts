import { Props } from '@/core/render';
import { IGameUI, IUIInstance, UIComponent } from './shared';
import EventEmitter from 'eventemitter3';
import { markRaw, mergeProps } from 'vue';

interface UIInstanceEvent {
    hide: [];
    show: [];
    close: [];
}

export class UIInstance<C extends UIComponent>
    extends EventEmitter<UIInstanceEvent>
    implements IUIInstance<C>
{
    private static counter: number = 0;

    readonly key: number = UIInstance.counter++;
    readonly ui: IGameUI<C>;
    hidden: boolean = false;

    constructor(
        ui: IGameUI<C>,
        public vBind: Props<C>
    ) {
        super();
        this.ui = markRaw(ui);
    }

    /**
     * 设置这个 UI 实例的响应式数据的值
     * @param data 要设置的值
     * @param merge 是将传入的值与原先的值合并（true），还是将当前值覆盖掉原先的值（false）
     */
    setVBind(data: Props<C>, merge: boolean = true) {
        if (merge) {
            this.vBind = mergeProps(this.vBind, data) as Props<C>;
        } else {
            this.vBind = data;
        }
    }

    hide(): void {
        this.hidden = true;
    }

    show(): void {
        this.hidden = false;
    }
}
