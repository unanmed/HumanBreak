import { Undoable } from '@/core/interface';
import { Hero, HeroState } from './hero';
import EventEmitter from 'eventemitter3';

export interface ISerializable {
    toJSON(): string;
}

export interface IGameState {
    hero: MonoStore<Hero<any>>;
    route: string[];
}

export class GameState implements ISerializable {
    state: IGameState;

    constructor(state: IGameState) {
        this.state = state;
    }

    toJSON() {
        return '';
    }

    static loadState(state: GameState) {}

    static fromJSON(json: string) {}

    static loadStateFromJSON(json: string) {}
}

interface MonoStoreEvent<T> {
    change: [before: T | undefined, after: T | undefined];
}

export class MonoStore<T extends ISerializable>
    extends EventEmitter<MonoStoreEvent<T>>
    implements ISerializable
{
    list: Map<string, T> = new Map();
    using?: T;

    use(id: string) {
        const before = this.using;
        this.using = this.list.get(id);
        this.emit('change', before, this.using);
    }

    toJSON() {
        return '';
    }
}

interface StateStoreEvent {
    undo: [state: GameState];
    redo: [state: GameState];
    change: [before: GameState | undefined, now: GameState];
}

class StateStore
    extends EventEmitter<StateStoreEvent>
    implements Undoable<GameState>
{
    now?: GameState;
    stack: GameState[] = [];
    redoStack: GameState[] = [];

    undo(): GameState | undefined {
        const state = this.stack.pop();
        if (!state) return void 0;
        this.redoStack.push(state);
        this.emit('undo', state);
        return state;
    }

    redo(): GameState | undefined {
        const state = this.redoStack.pop();
        if (!state) return void 0;
        this.stack.push(state);
        this.emit('redo', state);
        return state;
    }

    use(state: GameState) {
        const before = this.now;
        this.now = state;
        this.emit('change', before, state);
    }
}

export const gameStates = new StateStore();
