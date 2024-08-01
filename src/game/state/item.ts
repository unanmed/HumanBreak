import EventEmitter from 'eventemitter3';
import type { Hero } from './hero';
import { GameState, gameStates, IGameState } from './state';
import { loading } from '../game';

type EffectFn = (state: IGameState, hero: Hero<any>) => void;
type CanUseEffectFn = (state: IGameState, hero: Hero<any>) => boolean;

interface ItemStateEvent {
    use: [hero: Hero<any>];
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
        this.compileEvent();
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

    private compileEvent() {
        // todo
    }

    /**
     * 使用这个物品
     * @param state 游戏状态
     * @param num 使用的数量，仅对tools和items有效
     */
    use(hero: Hero<any>): boolean {
        if (!this.canUse(hero)) return false;
        if (!gameStates.now) return false;
        const state = gameStates.now.state;
        this.useItemEffectFn?.(state, hero);
        if (this.useItemEvent) core.insertAction(this.useItemEvent);
        if (!this.noRoute) state.route.push(`item:${this.id}`);

        hero.addItem(this.id, -1);
        this.emit('use', hero);

        return true;
    }

    /**
     * 判断是否可以使用一个物品
     * @param hero 使用物品的勇士
     */
    canUse(hero: Hero<any>, num: number = 1): boolean {
        if (num <= 0) return false;
        if (hero.itemCount(this.id) < num) return false;
        if (!gameStates.now) return false;
        return !!this.canUseItemEffectFn?.(gameStates.now.state, hero);
    }

    /**
     * 标记当前物品为不进入录像，也就是录像中不会使用该道具
     */
    markNoRoute() {
        this.noRoute = true;
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
