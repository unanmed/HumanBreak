import EventEmitter from 'eventemitter3';
import { loading } from '@user/data-base';

type EffectFn = () => void;
type CanUseEffectFn = () => boolean;

interface ItemStateEvent {
    use: [];
}

export class ItemState<
    I extends AllIdsOf<'items'> = AllIdsOf<'items'>
> extends EventEmitter<ItemStateEvent> {
    static items: Map<AllIdsOf<'items'>, ItemState> = new Map();

    id: I;
    cls: ItemClsOf<I>;
    name: string;
    text?: string;
    hideInToolBox: boolean;
    hideInReplay: boolean;

    /** 即捡即用效果 */
    itemEffect?: string;
    /** 即捡即用道具捡过之后的提示 */
    itemEffectTip?: string;
    /** 使用道具时执行的事件 */
    useItemEvent?: MotaEvent;
    /** 使用道具时执行的代码 */
    useItemEffect?: string;
    /** 能否使用道具 */
    canUseItemEffect?: string | boolean;

    private noRoute: boolean = false;

    itemEffectFn?: EffectFn;
    useItemEffectFn?: EffectFn;
    canUseItemEffectFn?: CanUseEffectFn;

    constructor(id: I) {
        super();
        const items = items_296f5d02_12fd_4166_a7c1_b5e830c9ee3a;
        this.id = id;
        const item = items[id];
        this.cls = item.cls;
        this.name = item.name;
        this.text = item.text;
        this.hideInToolBox = item.hideInToolBox;
        this.hideInReplay = item.hideInReplay;
        this.itemEffect = item.itemEffect;
        this.itemEffectTip = item.itemEffectTip;
        this.useItemEvent = item.useItemEvent;
        this.useItemEffect = item.useItemEffect;
        this.canUseItemEffect = item.canUseItemEffect;

        this.compileFunction();
    }

    private compileFunction() {
        if (this.itemEffect) {
            this.itemEffectFn = new Function(
                `state`,
                this.itemEffect
            ) as EffectFn;
        }
        if (this.useItemEffect) {
            this.useItemEffectFn = new Function(
                `state`,
                this.useItemEffect
            ) as EffectFn;
        }
        if (this.canUseItemEffect) {
            if (typeof this.canUseItemEffect === 'boolean') {
                this.canUseItemEffectFn = () =>
                    this.canUseItemEffect as boolean;
            } else {
                this.useItemEffectFn = new Function(
                    `state`,
                    this.canUseItemEffect
                ) as CanUseEffectFn;
            }
        }
    }

    /**
     * 获取一个道具的信息
     * @param id 要获取的道具id
     */
    static item<I extends AllIdsOf<'items'>>(id: I): ItemState<I> | undefined {
        return this.items.get(id) as ItemState<I>;
    }
}

loading.once('coreInit', () => {
    for (const key of Object.keys(items_296f5d02_12fd_4166_a7c1_b5e830c9ee3a)) {
        ItemState.items.set(
            key as AllIdsOf<'items'>,
            new ItemState(key as AllIdsOf<'items'>)
        );
    }
});
