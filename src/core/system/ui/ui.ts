import { IGameUI, UIComponent } from './shared';

export class GameUI<C extends UIComponent> implements IGameUI<C> {
    static list: Map<string, GameUI<UIComponent>> = new Map();

    constructor(
        public readonly name: string,
        public readonly component: C
    ) {}

    /**
     * 根据 ui 名称获取 ui 实例
     * @param id ui 的名称
     */
    static get<T extends UIComponent>(id: string): GameUI<T> | null {
        const ui = this.list.get(id) as GameUI<T>;
        return ui ?? null;
    }
}
