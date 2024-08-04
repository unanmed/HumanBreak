import { MonoStore } from '@/common/struct';
import { GameState } from './state';
import { Hero, HeroState } from './hero';

export function registerPresetState() {
    GameState.register<MonoStore<Hero<any>>>('hero', heroToJSON, heroFromJSON);
}

interface HeroSave {
    x: number;
    y: number;
    floorId: FloorIds;
    id: string;
    items: [AllIdsOf<'items'>, number][];
    state: {
        status: any;
        buffable: (string | number | symbol)[];
        buffMap: [string | number | symbol, number][];
    };
}

interface HeroSerializable {
    now: string | null;
    saves: HeroSave[];
}

function heroToJSON(data: MonoStore<Hero<any>>): string {
    const now = data.usingId ?? null;
    const saves: HeroSave[] = [...data.list.values()].map(v => {
        return {
            x: v.x,
            y: v.y,
            floorId: v.floorId,
            id: v.id,
            items: [...v.items],
            state: {
                status: v.state.status,
                buffable: [...v.state.buffable],
                buffMap: [...v.state.buffMap]
            }
        };
    });
    const obj: HeroSerializable = {
        now,
        saves
    };
    return JSON.stringify(obj);
}

function heroFromJSON(data: string): MonoStore<Hero<any>> {
    const obj: HeroSerializable = JSON.parse(data);
    const store = new MonoStore<Hero<any>>();
    const saves: [string, Hero<any>][] = obj.saves.map(v => {
        const state = new HeroState(v.state.status);
        v.state.buffable.forEach(v => state.buffable.add(v));
        v.state.buffMap.forEach(v => state.buffMap.set(v[0], v[1]));
        const hero = new Hero(v.id, v.x, v.y, v.floorId, state);
        v.items.forEach(v => hero.items.set(v[0], v[1]));
        return [hero.id, hero];
    });
    store.list = new Map(saves);
    if (obj.now) store.use(obj.now);
    return store;
}
