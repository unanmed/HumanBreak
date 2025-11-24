import { ICoreState, IStateSaveData } from './types';
import { IHeroState, HeroState } from './hero';
import { ILayerState, LayerState } from './map';
import { IRoleFaceBinder, RoleFaceBinder } from './common';

export class CoreState implements ICoreState {
    readonly layer: ILayerState;
    readonly hero: IHeroState;
    readonly roleFace: IRoleFaceBinder;
    readonly idNumberMap: Map<string, number>;
    readonly numberIdMap: Map<number, string>;

    constructor() {
        this.layer = new LayerState();
        this.hero = new HeroState();
        this.roleFace = new RoleFaceBinder();
        this.idNumberMap = new Map();
        this.numberIdMap = new Map();
    }

    saveState(): IStateSaveData {
        return structuredClone({
            followers: this.hero.followers
        });
    }

    loadState(data: IStateSaveData): void {
        this.hero.removeAllFollowers();
        data?.followers.forEach(v => {
            this.hero.addFollower(v.num, v.identifier);
        });
    }
}
